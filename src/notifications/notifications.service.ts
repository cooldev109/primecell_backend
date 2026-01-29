import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoPushService, PushNotificationPayload } from './expo-push.service';
import {
  RegisterDeviceDto,
  UpdateNotificationPreferencesDto,
  NotificationType,
  NotificationStatus,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPush: ExpoPushService,
  ) {}

  /**
   * Register a device for push notifications
   */
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    // Validate token format
    if (!this.expoPush.isValidToken(dto.token)) {
      throw new BadRequestException('Invalid Expo push token format');
    }

    // Upsert the device token
    const device = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        deviceName: dto.deviceName,
        isActive: true,
      },
    });

    // Ensure notification preferences exist
    await this.ensurePreferencesExist(userId);

    this.logger.log(`Device registered for user ${userId}: ${dto.platform}`);
    return device;
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(userId: string, token: string) {
    const device = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.deviceToken.update({
      where: { id: device.id },
      data: { isActive: false },
    });

    return { success: true };
  }

  /**
   * Get all device tokens for a user
   */
  async getUserDevices(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get or create notification preferences for a user
   */
  async getPreferences(userId: string) {
    return this.ensurePreferencesExist(userId);
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    await this.ensurePreferencesExist(userId);

    return this.prisma.notificationPreferences.update({
      where: { userId },
      data: dto,
    });
  }

  /**
   * Ensure preferences exist for a user
   */
  private async ensurePreferencesExist(userId: string) {
    let prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return prefs;
  }

  /**
   * Send a notification to a user
   */
  async sendNotificationToUser(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    // Get user preferences
    const prefs = await this.getPreferences(userId);

    // Check if push is enabled
    if (!prefs.pushEnabled) {
      this.logger.log(`Push disabled for user ${userId}, skipping`);
      return null;
    }

    // Check notification type preference
    if (!this.isNotificationTypeEnabled(prefs, type)) {
      this.logger.log(`Notification type ${type} disabled for user ${userId}`);
      return null;
    }

    // Check quiet hours
    if (this.isInQuietHours(prefs)) {
      this.logger.log(`User ${userId} is in quiet hours, scheduling for later`);
      // TODO: Schedule for after quiet hours
      return null;
    }

    // Get active device tokens
    const devices = await this.getUserDevices(userId);

    if (devices.length === 0) {
      this.logger.log(`No active devices for user ${userId}`);
      return null;
    }

    // Create notification log
    const log = await this.prisma.notificationLog.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
        status: NotificationStatus.PENDING,
      },
    });

    // Send to all devices
    const tokens = devices.map((d) => d.token);
    const payload: PushNotificationPayload = {
      to: tokens,
      title,
      body,
      data: { ...data, notificationId: log.id },
      sound: 'default',
      priority: 'high',
    };

    const results = await this.expoPush.sendPushNotifications([payload]);

    // Update log with results
    const successCount = results.filter((r) => r.success).length;
    const status = successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED;
    const errorMessage = results
      .filter((r) => !r.success)
      .map((r) => r.error)
      .join('; ');

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status,
        sentAt: new Date(),
        errorMessage: errorMessage || null,
        expoReceiptId: results.find((r) => r.ticketId)?.ticketId,
      },
    });

    // Handle invalid tokens
    for (const result of results) {
      if (!result.success && result.error?.includes('DeviceNotRegistered')) {
        await this.prisma.deviceToken.updateMany({
          where: { token: result.token },
          data: { isActive: false },
        });
      }
    }

    return { logId: log.id, results };
  }

  /**
   * Send check-in reminder to a user
   */
  async sendCheckinReminder(userId: string, weekNumber: number) {
    return this.sendNotificationToUser(
      userId,
      NotificationType.CHECKIN_REMINDER,
      'Time for your weekly check-in!',
      `Week ${weekNumber} is ready. Share your progress and keep your momentum going.`,
      { screen: 'CheckinMetrics', weekNumber },
    );
  }

  /**
   * Send missed check-in alert
   */
  async sendMissedCheckinAlert(userId: string, weekNumber: number, daysMissed: number) {
    const urgency = daysMissed > 3 ? 'We miss you!' : "Don't forget!";
    return this.sendNotificationToUser(
      userId,
      NotificationType.MISSED_CHECKIN,
      urgency,
      `Your week ${weekNumber} check-in is waiting. Quick check-ins help us optimize your plan.`,
      { screen: 'CheckinMetrics', weekNumber },
    );
  }

  /**
   * Send motivational message
   */
  async sendMotivationalMessage(userId: string, message: string) {
    const titles = [
      'Keep Going!',
      'You Got This!',
      'Stay Strong!',
      'Reminder',
      'Daily Motivation',
    ];
    const title = titles[Math.floor(Math.random() * titles.length)];

    return this.sendNotificationToUser(
      userId,
      NotificationType.MOTIVATION,
      title,
      message,
      { screen: 'Home' },
    );
  }

  /**
   * Send plan update notification
   */
  async sendPlanUpdateNotification(userId: string, planVersion: number) {
    return this.sendNotificationToUser(
      userId,
      NotificationType.PLAN_UPDATE,
      'Your plan has been updated!',
      'Check out your new personalized recommendations based on your progress.',
      { screen: 'PlanOverview', planVersion },
    );
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(userId: string, limit: number = 50) {
    return this.prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const log = await this.prisma.notificationLog.findFirst({
      where: { id: notificationId, userId },
    });

    if (!log) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notificationLog.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId: string, title?: string, body?: string) {
    return this.sendNotificationToUser(
      userId,
      NotificationType.MOTIVATION,
      title || 'Test Notification',
      body || 'This is a test notification from PrimeCell!',
      { screen: 'Home', test: true },
    );
  }

  /**
   * Check if a notification type is enabled in preferences
   */
  private isNotificationTypeEnabled(
    prefs: any,
    type: NotificationType,
  ): boolean {
    switch (type) {
      case NotificationType.CHECKIN_REMINDER:
        return prefs.checkinReminders;
      case NotificationType.MISSED_CHECKIN:
        return prefs.missedCheckinAlerts;
      case NotificationType.WEEKLY_SUMMARY:
        return prefs.weeklyDigest;
      case NotificationType.MOTIVATION:
        return prefs.motivationalMessages;
      case NotificationType.PLAN_UPDATE:
        return prefs.planUpdates;
      default:
        return true;
    }
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(prefs: any): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const start = prefs.quietHoursStart;
    const end = prefs.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }

    return currentTime >= start && currentTime <= end;
  }
}
