import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyTrendPoint, NotableEvent } from './dto/ai-explanation.dto';

/**
 * Service to manage and update UserJourneySummary
 * Called after each check-in to keep pre-computed summary up to date
 */
@Injectable()
export class JourneySummaryService {
  private readonly logger = new Logger(JourneySummaryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize journey summary when user completes onboarding
   */
  async initializeJourneySummary(userId: string): Promise<void> {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      this.logger.warn(`Cannot initialize journey summary: no profile for user ${userId}`);
      return;
    }

    await this.prisma.userJourneySummary.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        startingWeight: profile.weightKg,
        currentWeight: profile.weightKg,
        firstWeekDate: new Date(),
        weeklyTrends: [],
        notableEvents: [],
      },
      update: {
        startingWeight: profile.weightKg,
        currentWeight: profile.weightKg,
        firstWeekDate: new Date(),
      },
    });

    this.logger.log(`Initialized journey summary for user ${userId}`);
  }

  /**
   * Update journey summary after a new check-in
   */
  async updateAfterCheckin(
    userId: string,
    checkinId: string,
    decisionRecordId?: string,
  ): Promise<void> {
    // Fetch all required data
    const [checkins, planVersions, existingSummary, profile] = await Promise.all([
      this.prisma.weeklyCheckin.findMany({
        where: { userId },
        orderBy: { weekNumber: 'asc' },
      }),
      this.prisma.planVersion.findMany({
        where: { userId },
        orderBy: { version: 'asc' },
      }),
      this.prisma.userJourneySummary.findUnique({ where: { userId } }),
      this.prisma.onboardingProfile.findUnique({ where: { userId } }),
    ]);

    if (checkins.length === 0) {
      this.logger.warn(`No check-ins found for user ${userId}`);
      return;
    }

    // Calculate all metrics
    const summary = this.calculateSummary(checkins, planVersions, profile);

    // Upsert the summary - serialize arrays for JSON fields
    const { weeklyTrends, notableEvents, ...restSummary } = summary;
    await this.prisma.userJourneySummary.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        ...restSummary,
        weeklyTrends: JSON.parse(JSON.stringify(weeklyTrends)),
        notableEvents: JSON.parse(JSON.stringify(notableEvents)),
      },
      update: {
        ...restSummary,
        weeklyTrends: JSON.parse(JSON.stringify(weeklyTrends)),
        notableEvents: JSON.parse(JSON.stringify(notableEvents)),
      },
    });

    this.logger.log(`Updated journey summary for user ${userId} (week ${checkins.length})`);
  }

  /**
   * Calculate full summary from check-in history
   */
  private calculateSummary(
    checkins: any[],
    planVersions: any[],
    profile: any,
  ): {
    totalWeeks: number;
    startingWeight: number | null;
    currentWeight: number | null;
    totalWeightChange: number;
    totalWaistChange: number;
    averageAdherence: number;
    consecutiveGoodWeeks: number;
    longestStreak: number;
    plateauWeeksCount: number;
    currentPlateauWeeks: number;
    lowestWeight: number | null;
    lowestWeightWeek: number | null;
    lowestWaist: number | null;
    lowestWaistWeek: number | null;
    bestAdherenceWeek: number | null;
    hardestWeek: number | null;
    firstWeekDate: Date | null;
    lastCheckinDate: Date | null;
    weeklyTrends: WeeklyTrendPoint[];
    notableEvents: NotableEvent[];
  } {
    const weeklyTrends: WeeklyTrendPoint[] = [];
    const notableEvents: NotableEvent[] = [];

    // Adherence score mapping
    const adherenceScoreMap: Record<string, number> = {
      '100': 100,
      '80_90': 85,
      '60_70': 65,
      'below_60': 40,
    };

    // Initialize tracking variables
    let totalAdherence = 0;
    let adherenceCount = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let lowestWeight: number | null = null;
    let lowestWeightWeek: number | null = null;
    let lowestWaist: number | null = null;
    let lowestWaistWeek: number | null = null;
    let bestAdherenceWeek: number | null = null;
    let bestAdherenceScore = 0;
    let hardestWeek: number | null = null;
    let lowestAdherenceScore = 100;
    let plateauWeeksTotal = 0;
    let currentPlateauWeeks = 0;
    let lastWeight: number | null = null;
    let firstWaist: number | null = null;

    // Process each check-in
    checkins.forEach((checkin, index) => {
      const plan = planVersions.find((p) => p.weekNumber === checkin.weekNumber);
      const adherenceScore = adherenceScoreMap[checkin.adherenceLevel] || 70;

      // Track adherence
      totalAdherence += adherenceScore;
      adherenceCount++;

      // Track streaks
      if (adherenceScore >= 80) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }

      // Track best/worst weeks
      if (adherenceScore > bestAdherenceScore) {
        bestAdherenceScore = adherenceScore;
        bestAdherenceWeek = checkin.weekNumber;
      }
      if (adherenceScore < lowestAdherenceScore) {
        lowestAdherenceScore = adherenceScore;
        hardestWeek = checkin.weekNumber;
      }

      // Track weight milestones
      if (checkin.weightKg !== null) {
        if (lowestWeight === null || checkin.weightKg < lowestWeight) {
          lowestWeight = checkin.weightKg;
          lowestWeightWeek = checkin.weekNumber;
        }

        // Plateau detection (weight change < 0.3kg)
        if (lastWeight !== null) {
          const change = Math.abs(checkin.weightKg - lastWeight);
          if (change < 0.3) {
            currentPlateauWeeks++;
            if (currentPlateauWeeks === 3) {
              notableEvents.push({
                week: checkin.weekNumber,
                event: 'plateau_start',
                details: 'Weight plateau detected (3+ weeks stable)',
              });
            }
          } else {
            if (currentPlateauWeeks >= 3) {
              notableEvents.push({
                week: checkin.weekNumber,
                event: 'plateau_break',
                details: 'Plateau broken - weight moving again',
              });
              plateauWeeksTotal += currentPlateauWeeks;
            }
            currentPlateauWeeks = 0;
          }
        }
        lastWeight = checkin.weightKg;
      }

      // Track waist milestones
      if (checkin.waistCm !== null) {
        if (firstWaist === null) {
          firstWaist = checkin.waistCm;
        }
        if (lowestWaist === null || checkin.waistCm < lowestWaist) {
          lowestWaist = checkin.waistCm;
          lowestWaistWeek = checkin.weekNumber;
        }
      }

      // Build disruption reasons
      const disruptionReasons: string[] = [];
      if (checkin.hadTravel) disruptionReasons.push('Travel');
      if (checkin.wasIll) disruptionReasons.push('Illness');
      if (checkin.emotionalStress) disruptionReasons.push('Emotional stress');
      if (checkin.hormonalChanges) disruptionReasons.push('Hormonal changes');
      if (checkin.poorSleep) disruptionReasons.push('Poor sleep');

      // Build weekly trend entry
      weeklyTrends.push({
        week: checkin.weekNumber,
        weight: checkin.weightKg,
        waist: checkin.waistCm,
        adherence: checkin.adherenceLevel || 'unknown',
        adherenceScore,
        calories: plan?.dailyCalories || 0,
        rulesFired: [], // Would need decision records
        wasDisrupted: disruptionReasons.length > 0,
        disruptionReasons,
      });

      // Add notable events for significant disruptions
      if (checkin.wasIll) {
        notableEvents.push({
          week: checkin.weekNumber,
          event: 'disruption',
          details: 'Dealt with illness',
        });
      }

      // Milestone events
      if (checkin.weekNumber === 4 && currentStreak >= 4) {
        notableEvents.push({
          week: checkin.weekNumber,
          event: 'streak',
          details: 'Completed first 4-week streak!',
        });
      }
      if (checkin.weekNumber === 8 && adherenceCount >= 8) {
        notableEvents.push({
          week: checkin.weekNumber,
          event: 'milestone',
          details: 'Completed 8 weeks of tracking!',
        });
      }
      if (checkin.weekNumber === 12 && adherenceCount >= 12) {
        notableEvents.push({
          week: checkin.weekNumber,
          event: 'milestone',
          details: 'Completed 12 weeks - a full quarter!',
        });
      }
    });

    // Calculate final values
    const startingWeight = profile?.weightKg || null;
    const currentWeight = checkins.length > 0
      ? checkins[checkins.length - 1].weightKg
      : null;
    const lastWaist = checkins.length > 0
      ? checkins[checkins.length - 1].waistCm
      : null;

    return {
      totalWeeks: checkins.length,
      startingWeight,
      currentWeight,
      totalWeightChange: startingWeight && currentWeight
        ? Number((currentWeight - startingWeight).toFixed(1))
        : 0,
      totalWaistChange: firstWaist && lastWaist
        ? Number((lastWaist - firstWaist).toFixed(1))
        : 0,
      averageAdherence: adherenceCount > 0
        ? Number((totalAdherence / adherenceCount).toFixed(1))
        : 0,
      consecutiveGoodWeeks: currentStreak,
      longestStreak,
      plateauWeeksCount: plateauWeeksTotal,
      currentPlateauWeeks,
      lowestWeight,
      lowestWeightWeek,
      lowestWaist,
      lowestWaistWeek,
      bestAdherenceWeek,
      hardestWeek,
      firstWeekDate: checkins.length > 0 ? checkins[0].createdAt : null,
      lastCheckinDate: checkins.length > 0 ? checkins[checkins.length - 1].createdAt : null,
      weeklyTrends,
      notableEvents,
    };
  }

  /**
   * Get journey summary for a user
   */
  async getJourneySummary(userId: string) {
    return this.prisma.userJourneySummary.findUnique({
      where: { userId },
    });
  }
}
