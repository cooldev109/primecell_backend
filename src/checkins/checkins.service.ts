import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckinDto, CheckinResponseDto } from './dto/checkin.dto';
import { JourneySummaryService } from '../ai-explanations/journey-summary.service';

@Injectable()
export class CheckinsService {
  private readonly logger = new Logger(CheckinsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly journeySummaryService: JourneySummaryService,
  ) {}

  /**
   * Get the current week number for a user
   * Week 1 starts when they complete onboarding
   */
  async getCurrentWeekNumber(userId: string): Promise<number> {
    // Get the user's onboarding completion date
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
      select: { completedAt: true },
    });

    this.logger.log(`User ${userId} onboarding profile: ${JSON.stringify(profile)}`);

    if (!profile?.completedAt) {
      this.logger.warn(`User ${userId} has not completed onboarding`);
      throw new BadRequestException({
        statusCode: 400,
        error: 'ONBOARDING_INCOMPLETE',
        message: 'Please complete your onboarding before submitting check-ins',
      });
    }

    // Calculate weeks since onboarding
    const startDate = new Date(profile.completedAt);
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return Math.max(1, weekNumber);
  }

  /**
   * Check if user has already submitted a check-in for this week
   */
  async hasCheckinForWeek(userId: string, weekNumber: number): Promise<boolean> {
    const existing = await this.prisma.weeklyCheckin.findFirst({
      where: { userId, weekNumber },
    });
    return !!existing;
  }

  /**
   * Create a new weekly check-in
   */
  async createCheckin(
    userId: string,
    dto: CreateCheckinDto,
  ): Promise<{ checkin: CheckinResponseDto; weekNumber: number }> {
    // Get current week number
    const weekNumber = await this.getCurrentWeekNumber(userId);

    // Check if already submitted for this week
    const hasExisting = await this.hasCheckinForWeek(userId, weekNumber);
    if (hasExisting) {
      throw new BadRequestException(
        `You have already submitted a check-in for week ${weekNumber}. Check-ins are immutable.`,
      );
    }

    // Create the check-in
    const checkin = await this.prisma.weeklyCheckin.create({
      data: {
        userId,
        weekNumber,
        weightKg: dto.weightKg,
        waistCm: dto.waistCm,
        photoUrl: dto.photoUrl,
        energyLevel: dto.energyLevel,
        hungerLevel: dto.hungerLevel,
        sleepQuality: dto.sleepQuality,
        stressLevel: dto.stressLevel,
        adherenceLevel: dto.adherenceLevel,
        mealsOutside: dto.mealsOutside ?? false,
        hadTravel: dto.hadTravel ?? false,
        wasIll: dto.wasIll ?? false,
        hormonalChanges: dto.hormonalChanges ?? false,
        emotionalStress: dto.emotionalStress ?? false,
        poorSleep: dto.poorSleep ?? false,
        notes: dto.notes,
        selfPerception: dto.selfPerception,
      },
    });

    // Update journey summary (async, non-blocking)
    this.journeySummaryService
      .updateAfterCheckin(userId, checkin.id)
      .catch((err) => {
        this.logger.error(`Failed to update journey summary: ${err.message}`);
      });

    return {
      checkin: this.mapToResponse(checkin),
      weekNumber,
    };
  }

  /**
   * Get all check-ins for a user
   */
  async getCheckins(userId: string): Promise<CheckinResponseDto[]> {
    const checkins = await this.prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekNumber: 'desc' },
    });

    return checkins.map((c) => this.mapToResponse(c));
  }

  /**
   * Get a specific check-in by ID
   */
  async getCheckinById(userId: string, checkinId: string): Promise<CheckinResponseDto> {
    const checkin = await this.prisma.weeklyCheckin.findFirst({
      where: { id: checkinId, userId },
    });

    if (!checkin) {
      throw new NotFoundException('Check-in not found');
    }

    return this.mapToResponse(checkin);
  }

  /**
   * Get check-in for a specific week
   */
  async getCheckinByWeek(userId: string, weekNumber: number): Promise<CheckinResponseDto | null> {
    const checkin = await this.prisma.weeklyCheckin.findFirst({
      where: { userId, weekNumber },
    });

    return checkin ? this.mapToResponse(checkin) : null;
  }

  /**
   * Get check-in status for current week
   */
  async getCheckinStatus(userId: string): Promise<{
    currentWeek: number;
    hasCheckedIn: boolean;
    lastCheckin: CheckinResponseDto | null;
    totalCheckins: number;
    onboardingComplete: boolean;
  }> {
    // Check onboarding status first
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
      select: { completedAt: true },
    });

    const onboardingComplete = !!profile?.completedAt;

    // If onboarding not complete, return minimal status
    if (!onboardingComplete) {
      return {
        currentWeek: 0,
        hasCheckedIn: false,
        lastCheckin: null,
        totalCheckins: 0,
        onboardingComplete: false,
      };
    }

    const currentWeek = await this.getCurrentWeekNumber(userId);
    const hasCheckedIn = await this.hasCheckinForWeek(userId, currentWeek);

    const lastCheckin = await this.prisma.weeklyCheckin.findFirst({
      where: { userId },
      orderBy: { weekNumber: 'desc' },
    });

    const totalCheckins = await this.prisma.weeklyCheckin.count({
      where: { userId },
    });

    return {
      currentWeek,
      hasCheckedIn,
      lastCheckin: lastCheckin ? this.mapToResponse(lastCheckin) : null,
      totalCheckins,
      onboardingComplete: true,
    };
  }

  /**
   * Get recent check-ins for trend analysis (last N weeks)
   */
  async getRecentCheckins(userId: string, weeks: number = 4): Promise<CheckinResponseDto[]> {
    const checkins = await this.prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekNumber: 'desc' },
      take: weeks,
    });

    return checkins.map((c) => this.mapToResponse(c));
  }

  /**
   * Delete check-in for current week (DEV ONLY)
   */
  async deleteCurrentWeekCheckin(userId: string): Promise<{ message: string }> {
    const weekNumber = await this.getCurrentWeekNumber(userId);

    const deleted = await this.prisma.weeklyCheckin.deleteMany({
      where: { userId, weekNumber },
    });

    if (deleted.count === 0) {
      throw new NotFoundException(`No check-in found for week ${weekNumber}`);
    }

    return { message: `Deleted check-in for week ${weekNumber}` };
  }

  private mapToResponse(checkin: any): CheckinResponseDto {
    return {
      id: checkin.id,
      userId: checkin.userId,
      weekNumber: checkin.weekNumber,
      weightKg: checkin.weightKg,
      waistCm: checkin.waistCm,
      photoUrl: checkin.photoUrl,
      energyLevel: checkin.energyLevel,
      hungerLevel: checkin.hungerLevel,
      sleepQuality: checkin.sleepQuality,
      stressLevel: checkin.stressLevel,
      adherenceLevel: checkin.adherenceLevel,
      mealsOutside: checkin.mealsOutside,
      hadTravel: checkin.hadTravel,
      wasIll: checkin.wasIll,
      hormonalChanges: checkin.hormonalChanges,
      emotionalStress: checkin.emotionalStress,
      poorSleep: checkin.poorSleep,
      notes: checkin.notes,
      selfPerception: checkin.selfPerception,
      createdAt: checkin.createdAt,
    };
  }
}
