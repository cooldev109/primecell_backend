import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Type for JSON values in Prisma
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
import { calculateTdee } from './calculators/tdee.calculator';
import { calculateMacros, calculateTargetCalories } from './calculators/macros.calculator';
import { interpretSignals, CheckinData } from './calculators/signals.calculator';
import {
  generateInitialPlan,
  ENGINE_VERSION,
  RULE_PACK_VERSION,
} from './rules/initial-plan.rules';
import { calculateWeeklyAdjustments } from './rules/weekly-adjustment.rules';
import {
  OnboardingInput,
  EngineOutput,
  DecisionRecordData,
  NutritionPlan,
  TrainingPlan,
  SupplementPlan,
} from './dto/engine.dto';

@Injectable()
export class EngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate initial plan from onboarding data
   */
  async generateInitialPlanFromOnboarding(userId: string): Promise<{
    planVersion: {
      id: string;
      version: number;
      weekNumber: number;
      dailyCalories: number;
      proteinGrams: number;
      carbsGrams: number;
      fatGrams: number;
      nutritionPlan: NutritionPlan;
      trainingPlan: TrainingPlan;
      supplementPlan: SupplementPlan;
    };
    decisionRecord: {
      id: string;
    };
  }> {
    // Get onboarding profile
    const onboardingProfile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!onboardingProfile) {
      throw new BadRequestException('Onboarding profile not found');
    }

    if (!onboardingProfile.completedAt) {
      throw new BadRequestException('Onboarding not completed');
    }

    // Validate required fields
    const requiredFields = [
      'age',
      'sex',
      'heightCm',
      'weightKg',
      'primaryGoal',
      'workType',
      'trainingFrequency',
    ];
    for (const field of requiredFields) {
      if (onboardingProfile[field] === null || onboardingProfile[field] === undefined) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    // Build input from onboarding profile
    const input: OnboardingInput = {
      age: onboardingProfile.age!,
      sex: onboardingProfile.sex!,
      heightCm: onboardingProfile.heightCm!,
      weightKg: onboardingProfile.weightKg!,
      primaryGoal: onboardingProfile.primaryGoal!,
      goalDetails: onboardingProfile.goalDetails as Record<string, unknown> | undefined,
      workType: onboardingProfile.workType!,
      sleepHours: onboardingProfile.sleepHours || '7_8',
      stressLevel: onboardingProfile.stressLevel || 'moderate',
      trainingFrequency: onboardingProfile.trainingFrequency!,
      trainingTypes: onboardingProfile.trainingTypes || [],
      trainingIntensity: onboardingProfile.trainingIntensity || 'moderate',
      mealsPerDay: onboardingProfile.mealsPerDay || '3',
      carbSources: onboardingProfile.carbSources || ['rice', 'potatoes'],
      excludedFoods: onboardingProfile.excludedFoods || [],
      diagnosedConditions: onboardingProfile.diagnosedConditions || [],
      digestionStatus: onboardingProfile.digestionStatus || 'normal',
      mealsOutsideHome: onboardingProfile.mealsOutsideHome || '1_2',
      planStructure: onboardingProfile.planStructure || 'balanced',
      previousDietExperience: onboardingProfile.previousDietExperience || 'first_time',
    };

    // Calculate TDEE
    const tdeeResult = calculateTdee({
      age: input.age,
      sex: input.sex,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      workType: input.workType,
      trainingFrequency: input.trainingFrequency,
      trainingIntensity: input.trainingIntensity,
    });

    // Calculate target calories
    const calorieResult = calculateTargetCalories(
      tdeeResult.tdee,
      input.primaryGoal,
      input.goalDetails,
    );

    // Calculate macros
    const macroResult = calculateMacros({
      weightKg: input.weightKg,
      targetCalories: calorieResult.targetCalories,
      primaryGoal: input.primaryGoal,
      trainingFrequency: input.trainingFrequency,
      trainingTypes: input.trainingTypes,
      trainingIntensity: input.trainingIntensity,
    });

    // Generate initial plan
    const planResult = generateInitialPlan(
      input,
      calorieResult.targetCalories,
      macroResult.protein,
      macroResult.carbs,
      macroResult.fat,
    );

    // Get next version number
    const lastPlan = await this.prisma.planVersion.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastPlan?.version || 0) + 1;

    // Create plan version and decision record in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create plan version
      const planVersion = await tx.planVersion.create({
        data: {
          userId,
          version: nextVersion,
          weekNumber: 1,
          nutritionPlan: JSON.parse(JSON.stringify(planResult.nutritionPlan)) as JsonValue,
          trainingPlan: JSON.parse(JSON.stringify(planResult.trainingPlan)) as JsonValue,
          supplementPlan: JSON.parse(JSON.stringify(planResult.supplementPlan)) as JsonValue,
          dailyCalories: calorieResult.targetCalories,
          proteinGrams: macroResult.protein,
          carbsGrams: macroResult.carbs,
          fatGrams: macroResult.fat,
          engineVersion: ENGINE_VERSION,
          rulePackVersion: RULE_PACK_VERSION,
        },
      });

      // Create decision record
      const inputSnapshot = JSON.parse(JSON.stringify({
        onboardingProfile: input,
        tdee: tdeeResult,
        calorieCalculation: calorieResult,
        macroCalculation: macroResult,
      }));

      const decisionRecord = await tx.decisionRecord.create({
        data: {
          userId,
          isInitialPlan: true,
          inputSnapshot: inputSnapshot as JsonValue,
          derivedSignals: JSON.parse(JSON.stringify(planResult.derivedSignals)) as JsonValue,
          rulesFired: JSON.parse(JSON.stringify(planResult.rulesFired)) as JsonValue,
          guardrailsApplied: JSON.parse(JSON.stringify(planResult.guardrailsApplied)) as JsonValue,
          planVersionId: planVersion.id,
          engineVersion: ENGINE_VERSION,
          rulePackVersion: RULE_PACK_VERSION,
        },
      });

      // Set as active plan
      await tx.activePlanPointer.upsert({
        where: { userId },
        create: {
          userId,
          planVersionId: planVersion.id,
        },
        update: {
          planVersionId: planVersion.id,
          activatedAt: new Date(),
        },
      });

      return { planVersion, decisionRecord };
    });

    return {
      planVersion: {
        id: result.planVersion.id,
        version: result.planVersion.version,
        weekNumber: result.planVersion.weekNumber,
        dailyCalories: result.planVersion.dailyCalories!,
        proteinGrams: result.planVersion.proteinGrams!,
        carbsGrams: result.planVersion.carbsGrams!,
        fatGrams: result.planVersion.fatGrams!,
        nutritionPlan: result.planVersion.nutritionPlan as unknown as NutritionPlan,
        trainingPlan: result.planVersion.trainingPlan as unknown as TrainingPlan,
        supplementPlan: result.planVersion.supplementPlan as unknown as SupplementPlan,
      },
      decisionRecord: {
        id: result.decisionRecord.id,
      },
    };
  }

  /**
   * Get active plan for user
   */
  async getActivePlan(userId: string) {
    const activePlanPointer = await this.prisma.activePlanPointer.findUnique({
      where: { userId },
      include: {
        planVersion: true,
      },
    });

    if (!activePlanPointer) {
      return null;
    }

    const plan = activePlanPointer.planVersion;

    return {
      id: plan.id,
      version: plan.version,
      weekNumber: plan.weekNumber,
      dailyCalories: plan.dailyCalories,
      proteinGrams: plan.proteinGrams,
      carbsGrams: plan.carbsGrams,
      fatGrams: plan.fatGrams,
      nutritionPlan: plan.nutritionPlan as unknown as NutritionPlan,
      trainingPlan: plan.trainingPlan as unknown as TrainingPlan,
      supplementPlan: plan.supplementPlan as unknown as SupplementPlan,
      createdAt: plan.createdAt,
    };
  }

  /**
   * Get plan by ID
   */
  async getPlanById(userId: string, planId: string) {
    const plan = await this.prisma.planVersion.findFirst({
      where: {
        id: planId,
        userId,
      },
    });

    if (!plan) {
      return null;
    }

    return {
      id: plan.id,
      version: plan.version,
      weekNumber: plan.weekNumber,
      dailyCalories: plan.dailyCalories,
      proteinGrams: plan.proteinGrams,
      carbsGrams: plan.carbsGrams,
      fatGrams: plan.fatGrams,
      nutritionPlan: plan.nutritionPlan as unknown as NutritionPlan,
      trainingPlan: plan.trainingPlan as unknown as TrainingPlan,
      supplementPlan: plan.supplementPlan as unknown as SupplementPlan,
      createdAt: plan.createdAt,
    };
  }

  /**
   * Get all plan versions for user (history)
   */
  async getPlanHistory(userId: string) {
    const plans = await this.prisma.planVersion.findMany({
      where: { userId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        weekNumber: true,
        dailyCalories: true,
        proteinGrams: true,
        carbsGrams: true,
        fatGrams: true,
        createdAt: true,
      },
    });

    return plans;
  }

  /**
   * Get decision record by ID
   */
  async getDecisionRecord(userId: string, decisionId: string) {
    const record = await this.prisma.decisionRecord.findFirst({
      where: {
        id: decisionId,
        userId,
      },
      include: {
        planVersion: {
          select: {
            id: true,
            version: true,
            weekNumber: true,
          },
        },
        weeklyCheckin: true,
      },
    });

    return record;
  }

  /**
   * Get all decision records for user
   */
  async getDecisionHistory(userId: string) {
    const records = await this.prisma.decisionRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        isInitialPlan: true,
        createdAt: true,
        engineVersion: true,
        rulePackVersion: true,
        planVersion: {
          select: {
            id: true,
            version: true,
            weekNumber: true,
          },
        },
      },
    });

    return records;
  }

  /**
   * Generate updated plan from weekly check-in
   */
  async generatePlanFromCheckin(userId: string, checkinId: string): Promise<{
    planVersion: {
      id: string;
      version: number;
      weekNumber: number;
      dailyCalories: number;
      proteinGrams: number;
      carbsGrams: number;
      fatGrams: number;
      nutritionPlan: NutritionPlan;
      trainingPlan: TrainingPlan;
      supplementPlan: SupplementPlan;
    };
    decisionRecord: {
      id: string;
    };
  }> {
    // Get the check-in
    const checkin = await this.prisma.weeklyCheckin.findUnique({
      where: { id: checkinId },
    });

    if (!checkin || checkin.userId !== userId) {
      throw new BadRequestException('Check-in not found');
    }

    // Get onboarding profile for base parameters
    const onboardingProfile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!onboardingProfile) {
      throw new BadRequestException('Onboarding profile not found');
    }

    // Get current active plan
    const currentPlan = await this.getActivePlan(userId);
    if (!currentPlan) {
      throw new BadRequestException('No active plan found. Generate initial plan first.');
    }

    // Get recent check-ins for trend analysis (last 4 weeks)
    const recentCheckins = await this.prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekNumber: 'desc' },
      take: 4,
    });

    // Map check-ins to signal calculator format
    const checkinData: CheckinData[] = recentCheckins.map((c) => ({
      weekNumber: c.weekNumber,
      weightKg: c.weightKg ?? undefined,
      waistCm: c.waistCm ?? undefined,
      energyLevel: c.energyLevel ?? undefined,
      hungerLevel: c.hungerLevel ?? undefined,
      sleepQuality: c.sleepQuality ?? undefined,
      stressLevel: c.stressLevel ?? undefined,
      adherenceLevel: c.adherenceLevel || '80_90',
      mealsOutside: c.mealsOutside,
      hadTravel: c.hadTravel,
      wasIll: c.wasIll,
      hormonalChanges: c.hormonalChanges,
      emotionalStress: c.emotionalStress,
      poorSleep: c.poorSleep,
      selfPerception: c.selfPerception || 'unsure',
    }));

    const currentCheckinData = checkinData.find((c) => c.weekNumber === checkin.weekNumber)!;

    // Interpret signals
    const signals = interpretSignals(currentCheckinData, checkinData);

    // Get current weight (from check-in or onboarding)
    const currentWeight = checkin.weightKg || onboardingProfile.weightKg || 75;

    // Calculate adjustments
    const adjustments = calculateWeeklyAdjustments({
      primaryGoal: onboardingProfile.primaryGoal || 'HEALTH_ENERGY',
      currentCalories: currentPlan.dailyCalories || 2000,
      currentProtein: currentPlan.proteinGrams || 150,
      currentCarbs: currentPlan.carbsGrams || 200,
      currentFat: currentPlan.fatGrams || 70,
      weightKg: currentWeight,
      signals,
      weekNumber: checkin.weekNumber,
    });

    // Build updated nutrition plan
    const updatedNutritionPlan: NutritionPlan = {
      ...(currentPlan.nutritionPlan as NutritionPlan),
      dailyTargets: {
        calories: adjustments.calorieAdjustment.newCalories,
        protein: adjustments.macroAdjustment.protein,
        carbs: adjustments.macroAdjustment.carbs,
        fat: adjustments.macroAdjustment.fat,
      },
    };

    // Build updated training plan
    const currentTraining = currentPlan.trainingPlan as TrainingPlan;
    const updatedTrainingPlan: TrainingPlan = {
      ...currentTraining,
      volumeAdjustment: (currentTraining.volumeAdjustment || 0) + adjustments.trainingAdjustment.volumeChange,
      intensityAdjustment: (currentTraining.intensityAdjustment || 0) + adjustments.trainingAdjustment.intensityChange,
      deloadStatus: adjustments.trainingAdjustment.deloadRecommended ? 'recommended' : 'none',
      progressionWeek: (currentTraining.progressionWeek || 1) + 1,
    };

    // Get next version number
    const lastPlan = await this.prisma.planVersion.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastPlan?.version || 0) + 1;

    // Create plan version and decision record in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create plan version
      const planVersion = await tx.planVersion.create({
        data: {
          userId,
          version: nextVersion,
          weekNumber: checkin.weekNumber + 1, // Plan is for next week
          nutritionPlan: JSON.parse(JSON.stringify(updatedNutritionPlan)) as JsonValue,
          trainingPlan: JSON.parse(JSON.stringify(updatedTrainingPlan)) as JsonValue,
          supplementPlan: JSON.parse(JSON.stringify(currentPlan.supplementPlan)) as JsonValue,
          dailyCalories: adjustments.calorieAdjustment.newCalories,
          proteinGrams: adjustments.macroAdjustment.protein,
          carbsGrams: adjustments.macroAdjustment.carbs,
          fatGrams: adjustments.macroAdjustment.fat,
          engineVersion: ENGINE_VERSION,
          rulePackVersion: RULE_PACK_VERSION,
        },
      });

      // Create decision record
      const inputSnapshot = JSON.parse(JSON.stringify({
        checkin: currentCheckinData,
        recentCheckins: checkinData,
        previousPlan: {
          calories: currentPlan.dailyCalories,
          protein: currentPlan.proteinGrams,
          carbs: currentPlan.carbsGrams,
          fat: currentPlan.fatGrams,
        },
      }));

      const decisionRecord = await tx.decisionRecord.create({
        data: {
          userId,
          weeklyCheckinId: checkinId,
          isInitialPlan: false,
          inputSnapshot: inputSnapshot as JsonValue,
          derivedSignals: JSON.parse(JSON.stringify(signals)) as JsonValue,
          rulesFired: JSON.parse(JSON.stringify(adjustments.rulesFired)) as JsonValue,
          guardrailsApplied: JSON.parse(JSON.stringify(adjustments.guardrailsApplied)) as JsonValue,
          planVersionId: planVersion.id,
          engineVersion: ENGINE_VERSION,
          rulePackVersion: RULE_PACK_VERSION,
        },
      });

      // Update active plan pointer
      await tx.activePlanPointer.upsert({
        where: { userId },
        create: {
          userId,
          planVersionId: planVersion.id,
        },
        update: {
          planVersionId: planVersion.id,
          activatedAt: new Date(),
        },
      });

      return { planVersion, decisionRecord };
    });

    return {
      planVersion: {
        id: result.planVersion.id,
        version: result.planVersion.version,
        weekNumber: result.planVersion.weekNumber,
        dailyCalories: result.planVersion.dailyCalories!,
        proteinGrams: result.planVersion.proteinGrams!,
        carbsGrams: result.planVersion.carbsGrams!,
        fatGrams: result.planVersion.fatGrams!,
        nutritionPlan: result.planVersion.nutritionPlan as unknown as NutritionPlan,
        trainingPlan: result.planVersion.trainingPlan as unknown as TrainingPlan,
        supplementPlan: result.planVersion.supplementPlan as unknown as SupplementPlan,
      },
      decisionRecord: {
        id: result.decisionRecord.id,
      },
    };
  }
}
