import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchedulerService.name);
  private isEnabled = true;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Notification scheduler initialized');
  }

  /**
   * Run every hour to check for scheduled check-in reminders
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processCheckinReminders() {
    if (!this.isEnabled) return;

    this.logger.log('Processing check-in reminders...');

    try {
      // Get all users with active plans who haven't checked in this week
      const users = await this.getUsersNeedingCheckinReminder();

      for (const user of users) {
        const prefs = await this.notificationsService.getPreferences(user.id);

        // Check if it's the right day and time for this user
        if (this.shouldSendReminderNow(prefs)) {
          const weekNumber = await this.calculateCurrentWeek(user.id);
          await this.notificationsService.sendCheckinReminder(user.id, weekNumber);
          this.logger.log(`Sent check-in reminder to user ${user.id} for week ${weekNumber}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing check-in reminders', error);
    }
  }

  /**
   * Run daily to check for missed check-ins
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async processMissedCheckins() {
    if (!this.isEnabled) return;

    this.logger.log('Processing missed check-in alerts...');

    try {
      const users = await this.getUsersWithMissedCheckins();

      for (const user of users) {
        const weekNumber = await this.calculateCurrentWeek(user.id);
        const daysMissed = this.calculateDaysSinceWeekStart(user.id);

        // Only send if at least 2 days have passed
        if (daysMissed >= 2) {
          await this.notificationsService.sendMissedCheckinAlert(
            user.id,
            weekNumber,
            daysMissed,
          );
          this.logger.log(`Sent missed check-in alert to user ${user.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing missed check-ins', error);
    }
  }

  /**
   * Send motivational messages at 9 AM
   */
  @Cron('0 9 * * *')
  async sendDailyMotivation() {
    if (!this.isEnabled) return;

    this.logger.log('Sending daily motivational messages...');

    try {
      // Get users with motivational messages enabled
      const prefs = await this.prisma.notificationPreferences.findMany({
        where: {
          pushEnabled: true,
          motivationalMessages: true,
        },
        include: { user: true },
      });

      const motivationalMessages = [
        'Every rep counts. Every meal matters. You\'re building something amazing!',
        'Consistency beats perfection. Keep showing up!',
        'Small daily improvements lead to stunning results over time.',
        'Your body can do it. It\'s your mind you have to convince.',
        'The only bad workout is the one that didn\'t happen.',
        'Progress is progress, no matter how small.',
        'You didn\'t come this far to only come this far.',
        'Trust the process. Results are coming.',
        'One day or day one. You decide.',
        'Be patient with yourself. Transformation takes time.',
      ];

      // Only send to a percentage of users each day (avoid spam)
      const dailyPercentage = 0.3; // 30% of users per day
      const selectedUsers = prefs
        .filter(() => Math.random() < dailyPercentage)
        .slice(0, 100); // Cap at 100 users per run

      for (const pref of selectedUsers) {
        const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        await this.notificationsService.sendMotivationalMessage(pref.userId, message);
      }

      this.logger.log(`Sent motivational messages to ${selectedUsers.length} users`);
    } catch (error) {
      this.logger.error('Error sending motivational messages', error);
    }
  }

  /**
   * Get users who need a check-in reminder
   */
  private async getUsersNeedingCheckinReminder() {
    // Get users with completed onboarding who haven't checked in this week
    const users = await this.prisma.user.findMany({
      where: {
        onboardingProfile: {
          completedAt: { not: null },
        },
        notificationPreferences: {
          pushEnabled: true,
          checkinReminders: true,
        },
        deviceTokens: {
          some: { isActive: true },
        },
      },
      include: {
        onboardingProfile: true,
        weeklyCheckins: {
          orderBy: { weekNumber: 'desc' },
          take: 1,
        },
        notificationPreferences: true,
      },
    });

    // Filter to users who haven't checked in this week
    return users.filter((user) => {
      if (!user.onboardingProfile?.completedAt) return false;

      const currentWeek = this.calculateWeekNumber(
        new Date(user.onboardingProfile.completedAt),
      );
      const lastCheckinWeek = user.weeklyCheckins[0]?.weekNumber || 0;

      return lastCheckinWeek < currentWeek;
    });
  }

  /**
   * Get users with missed check-ins (didn't check in after 2+ days into the week)
   */
  private async getUsersWithMissedCheckins() {
    const users = await this.prisma.user.findMany({
      where: {
        onboardingProfile: {
          completedAt: { not: null },
        },
        notificationPreferences: {
          pushEnabled: true,
          missedCheckinAlerts: true,
        },
        deviceTokens: {
          some: { isActive: true },
        },
      },
      include: {
        onboardingProfile: true,
        weeklyCheckins: {
          orderBy: { weekNumber: 'desc' },
          take: 1,
        },
      },
    });

    return users.filter((user) => {
      if (!user.onboardingProfile?.completedAt) return false;

      const currentWeek = this.calculateWeekNumber(
        new Date(user.onboardingProfile.completedAt),
      );
      const lastCheckinWeek = user.weeklyCheckins[0]?.weekNumber || 0;

      return lastCheckinWeek < currentWeek;
    });
  }

  /**
   * Calculate current week number since onboarding
   */
  private async calculateCurrentWeek(userId: string): Promise<number> {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
      select: { completedAt: true },
    });

    if (!profile?.completedAt) return 1;

    return this.calculateWeekNumber(new Date(profile.completedAt));
  }

  /**
   * Calculate week number from a start date
   */
  private calculateWeekNumber(startDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  }

  /**
   * Calculate days since the start of the current week
   */
  private calculateDaysSinceWeekStart(userId: string): number {
    // Simplified: just return days since Sunday
    const now = new Date();
    return now.getDay(); // 0 = Sunday, 6 = Saturday
  }

  /**
   * Check if reminder should be sent now based on user preferences
   */
  private shouldSendReminderNow(prefs: any): boolean {
    if (!prefs.checkinReminderDay || !prefs.checkinReminderTime) {
      return false;
    }

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentHour = now.getHours();

    // Check day matches
    if (prefs.checkinReminderDay !== currentDay) {
      return false;
    }

    // Check hour matches (within the same hour)
    const reminderHour = parseInt(prefs.checkinReminderTime.split(':')[0], 10);
    return currentHour === reminderHour;
  }

  /**
   * Enable/disable the scheduler (useful for testing)
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.logger.log(`Notification scheduler ${enabled ? 'enabled' : 'disabled'}`);
  }
}
