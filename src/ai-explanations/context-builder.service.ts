import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AIContextPayload,
  OnboardingContextSummary,
  JourneySummary,
  CurrentDecisionContext,
  WeeklyTrendPoint,
  NotableEvent,
} from './dto/ai-explanation.dto';

@Injectable()
export class ContextBuilderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Build the full AI context payload for a decision record
   */
  async buildContext(
    userId: string,
    decisionRecordId: string,
  ): Promise<AIContextPayload> {
    // Fetch all required data in parallel
    const [
      onboardingProfile,
      journeySummary,
      decisionRecord,
      allCheckins,
      allPlanVersions,
    ] = await Promise.all([
      this.prisma.onboardingProfile.findUnique({ where: { userId } }),
      this.prisma.userJourneySummary.findUnique({ where: { userId } }),
      this.prisma.decisionRecord.findUnique({
        where: { id: decisionRecordId },
        include: {
          weeklyCheckin: true,
          planVersion: true,
        },
      }),
      this.prisma.weeklyCheckin.findMany({
        where: { userId },
        orderBy: { weekNumber: 'asc' },
      }),
      this.prisma.planVersion.findMany({
        where: { userId },
        orderBy: { version: 'asc' },
      }),
    ]);

    if (!onboardingProfile) {
      throw new Error('Onboarding profile not found');
    }

    if (!decisionRecord) {
      throw new Error('Decision record not found');
    }

    // Build onboarding context
    const onboardingContext = this.buildOnboardingContext(onboardingProfile);

    // Build journey summary (from pre-computed or calculate)
    const journey = journeySummary
      ? this.mapJourneySummary(journeySummary)
      : this.calculateJourneySummary(allCheckins, allPlanVersions, onboardingProfile);

    // Build current decision context
    const currentDecision = this.buildCurrentDecisionContext(
      decisionRecord,
      allPlanVersions,
    );

    return {
      onboardingProfile: onboardingContext,
      journeySummary: journey,
      currentDecision,
    };
  }

  /**
   * Build onboarding context summary
   */
  private buildOnboardingContext(profile: any): OnboardingContextSummary {
    const goalDescriptions: Record<string, string> = {
      LOSE_FAT: 'Lose body fat while preserving muscle',
      LOSE_WEIGHT: 'Lose weight on the scale',
      GAIN_MUSCLE: 'Build muscle mass',
      HEALTH_ENERGY: 'Improve overall health and energy',
      PERFORMANCE: 'Enhance physical performance',
      LONGEVITY: 'Focus on longevity and prevention',
    };

    return {
      goal: profile.primaryGoal || 'HEALTH_ENERGY',
      goalDescription: goalDescriptions[profile.primaryGoal] || 'General fitness',
      startingWeight: profile.weightKg || 0,
      targetWeight: profile.goalDetails?.targetWeight,
      targetWaist: profile.goalDetails?.targetWaist,
      flexibility: profile.planStructure || 'balanced',
      startDate: profile.completedAt || profile.createdAt,
      sex: profile.sex || 'unknown',
      age: profile.age || 0,
    };
  }

  /**
   * Map pre-computed journey summary from database
   */
  private mapJourneySummary(summary: any): JourneySummary {
    return {
      totalWeeks: summary.totalWeeks,
      startingWeight: summary.startingWeight,
      currentWeight: summary.currentWeight,
      totalWeightChange: summary.totalWeightChange,
      totalWaistChange: summary.totalWaistChange,
      averageAdherence: summary.averageAdherence,
      consecutiveGoodWeeks: summary.consecutiveGoodWeeks,
      longestStreak: summary.longestStreak,
      plateauWeeksCount: summary.plateauWeeksCount,
      currentPlateauWeeks: summary.currentPlateauWeeks,
      lowestWeight: summary.lowestWeight,
      lowestWeightWeek: summary.lowestWeightWeek,
      lowestWaist: summary.lowestWaist,
      lowestWaistWeek: summary.lowestWaistWeek,
      bestAdherenceWeek: summary.bestAdherenceWeek,
      hardestWeek: summary.hardestWeek,
      weeklyTrends: summary.weeklyTrends as WeeklyTrendPoint[],
      notableEvents: summary.notableEvents as NotableEvent[],
    };
  }

  /**
   * Calculate journey summary from raw data (fallback if pre-computed doesn't exist)
   */
  private calculateJourneySummary(
    checkins: any[],
    planVersions: any[],
    profile: any,
  ): JourneySummary {
    const weeklyTrends: WeeklyTrendPoint[] = [];
    const notableEvents: NotableEvent[] = [];

    let totalAdherence = 0;
    let adherenceCount = 0;
    let consecutiveGoodWeeks = 0;
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
    let plateauWeeks = 0;
    let currentPlateauWeeks = 0;
    let lastWeight: number | null = null;

    const adherenceScoreMap: Record<string, number> = {
      '100': 100,
      '80_90': 85,
      '60_70': 65,
      'below_60': 40,
    };

    checkins.forEach((checkin, index) => {
      const plan = planVersions.find((p) => p.weekNumber === checkin.weekNumber);
      const adherenceScore = adherenceScoreMap[checkin.adherenceLevel] || 70;

      // Track adherence
      totalAdherence += adherenceScore;
      adherenceCount++;

      // Track streaks
      if (adherenceScore >= 80) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
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
      if (checkin.weightKg) {
        if (lowestWeight === null || checkin.weightKg < lowestWeight) {
          lowestWeight = checkin.weightKg;
          lowestWeightWeek = checkin.weekNumber;
        }

        // Plateau detection
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
              plateauWeeks += currentPlateauWeeks;
            }
            currentPlateauWeeks = 0;
          }
        }
        lastWeight = checkin.weightKg;
      }

      // Track waist milestones
      if (checkin.waistCm) {
        if (lowestWaist === null || checkin.waistCm < lowestWaist) {
          lowestWaist = checkin.waistCm;
          lowestWaistWeek = checkin.weekNumber;
        }
      }

      // Build weekly trend
      const disruptionReasons: string[] = [];
      if (checkin.hadTravel) disruptionReasons.push('Travel');
      if (checkin.wasIll) disruptionReasons.push('Illness');
      if (checkin.emotionalStress) disruptionReasons.push('Emotional stress');
      if (checkin.hormonalChanges) disruptionReasons.push('Hormonal changes');

      weeklyTrends.push({
        week: checkin.weekNumber,
        weight: checkin.weightKg,
        waist: checkin.waistCm,
        adherence: checkin.adherenceLevel,
        adherenceScore,
        calories: plan?.dailyCalories || 0,
        rulesFired: [], // Would need decision records to populate
        wasDisrupted: disruptionReasons.length > 0,
        disruptionReasons,
      });

      // Add notable events for disruptions
      if (checkin.wasIll) {
        notableEvents.push({
          week: checkin.weekNumber,
          event: 'disruption',
          details: 'Dealt with illness this week',
        });
      }
    });

    // Add streak milestone if applicable
    if (longestStreak >= 4) {
      notableEvents.push({
        week: checkins[checkins.length - 1]?.weekNumber || 0,
        event: 'streak',
        details: `Achieved ${longestStreak}-week consistency streak`,
      });
    }

    const startingWeight = profile.weightKg || null;
    const currentWeight = checkins.length > 0 ? checkins[checkins.length - 1].weightKg : null;

    return {
      totalWeeks: checkins.length,
      startingWeight,
      currentWeight,
      totalWeightChange: startingWeight && currentWeight ? currentWeight - startingWeight : 0,
      totalWaistChange: 0, // Would need first waist measurement
      averageAdherence: adherenceCount > 0 ? totalAdherence / adherenceCount : 0,
      consecutiveGoodWeeks: currentStreak,
      longestStreak,
      plateauWeeksCount: plateauWeeks,
      currentPlateauWeeks,
      lowestWeight,
      lowestWeightWeek,
      lowestWaist,
      lowestWaistWeek,
      bestAdherenceWeek,
      hardestWeek,
      weeklyTrends,
      notableEvents,
    };
  }

  /**
   * Build current decision context
   */
  private buildCurrentDecisionContext(
    decisionRecord: any,
    allPlanVersions: any[],
  ): CurrentDecisionContext {
    const derivedSignals = decisionRecord.derivedSignals as any;
    const rulesFired = decisionRecord.rulesFired as any[];
    const guardrailsApplied = decisionRecord.guardrailsApplied as any[];
    const planVersion = decisionRecord.planVersion;
    const checkin = decisionRecord.weeklyCheckin;

    // Find previous plan version
    const previousPlan = allPlanVersions.find(
      (p) => p.version === planVersion.version - 1,
    );

    // Build contextual events list
    const contextualEvents: string[] = [];
    if (checkin) {
      if (checkin.hadTravel) contextualEvents.push('Had travel');
      if (checkin.wasIll) contextualEvents.push('Was ill');
      if (checkin.emotionalStress) contextualEvents.push('Emotional stress');
      if (checkin.hormonalChanges) contextualEvents.push('Hormonal changes');
      if (checkin.poorSleep) contextualEvents.push('Poor sleep');
      if (checkin.mealsOutside) contextualEvents.push('More meals outside home');
    }

    return {
      weekNumber: planVersion.weekNumber,
      isInitialPlan: decisionRecord.isInitialPlan,

      checkin: checkin
        ? {
            weightKg: checkin.weightKg,
            waistCm: checkin.waistCm,
            energyLevel: checkin.energyLevel,
            hungerLevel: checkin.hungerLevel,
            sleepQuality: checkin.sleepQuality,
            stressLevel: checkin.stressLevel,
            adherenceLevel: checkin.adherenceLevel,
            selfPerception: checkin.selfPerception,
            contextualEvents,
            notes: checkin.notes,
          }
        : undefined,

      derivedSignals: {
        weightTrend: derivedSignals?.weightTrend || 'unknown',
        weightTrendPercent: derivedSignals?.weightTrendPercent || 0,
        confidenceScore: derivedSignals?.confidenceScore || 100,
        adherenceQuality: derivedSignals?.adherenceQuality || 'unknown',
        recoveryRisk: derivedSignals?.recoveryRisk || 'low',
        recoveryFactors: derivedSignals?.recoveryFactors || [],
        plateauDetected: derivedSignals?.plateauDetected || false,
        recompDetected: derivedSignals?.recompDetected || false,
        metabolicStress: derivedSignals?.metabolicStress || 'low',
        shouldHoldChanges: derivedSignals?.shouldHoldChanges || false,
        holdReason: derivedSignals?.holdReason,
      },

      rulesFired: rulesFired || [],
      guardrailsApplied: guardrailsApplied || [],

      planChanges: {
        previousCalories: previousPlan?.dailyCalories || null,
        newCalories: planVersion.dailyCalories,
        caloriesDelta: previousPlan
          ? planVersion.dailyCalories - previousPlan.dailyCalories
          : 0,
        previousProtein: previousPlan?.proteinGrams || null,
        newProtein: planVersion.proteinGrams,
        previousCarbs: previousPlan?.carbsGrams || null,
        newCarbs: planVersion.carbsGrams,
        previousFat: previousPlan?.fatGrams || null,
        newFat: planVersion.fatGrams,
        trainingAdjustment: (planVersion.trainingPlan as any)?.volumeAdjustment
          ? 'Volume adjusted'
          : 'No change',
        deloadRecommended:
          (planVersion.trainingPlan as any)?.deloadStatus === 'active',
      },
    };
  }
}
