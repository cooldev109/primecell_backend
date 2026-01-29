import { z } from 'zod';

// Enums for onboarding
export const PrimaryGoal = z.enum([
  'LOSE_FAT',
  'LOSE_WEIGHT',
  'GAIN_MUSCLE',
  'HEALTH_ENERGY',
  'PERFORMANCE',
  'LONGEVITY',
]);

export const Sex = z.enum(['male', 'female', 'other']);

export const WorkType = z.enum(['sedentary', 'mixed', 'active']);

export const SleepHours = z.enum(['less_than_6', '6_7', '7_8', '8_plus']);

export const StressLevel = z.enum(['low', 'moderate', 'high', 'very_high']);

export const TrainingTime = z.enum(['morning', 'afternoon', 'evening', 'none']);

export const TrainingFrequency = z.enum(['none', '1_2', '3_4', '5_plus']);

export const TrainingType = z.enum([
  'weight_training',
  'home_workouts',
  'hiit',
  'cardio',
  'walking',
]);

export const TrainingIntensity = z.enum(['light', 'moderate', 'intense']);

export const MealsPerDay = z.enum(['3', '4', '5', 'varies']);

export const CarbSource = z.enum([
  'rice',
  'pasta',
  'potatoes',
  'bread',
  'legumes',
  'fruit',
]);

export const ExcludedFood = z.enum([
  'dairy',
  'gluten',
  'fish',
  'red_meat',
  'sweets',
]);

export const DiagnosedCondition = z.enum([
  'hypertension',
  'high_cholesterol',
  'insulin_resistance',
  'hypothyroidism',
]);

export const DigestionStatus = z.enum([
  'normal',
  'constipation',
  'gas_bloating',
  'reflux',
]);

export const MealsOutsideHome = z.enum(['none', '1_2', '3_4', '5_plus']);

export const PlanStructure = z.enum(['disciplined', 'balanced', 'flexible']);

export const DietExperience = z.enum([
  'worked',
  'could_not_maintain',
  'first_time',
]);

// Goal-specific sub-questions schemas
export const loseFatGoalDetails = z.object({
  waistReduction: z.enum(['2_4_cm', '5_8_cm', '9_plus_cm', 'ai_recommend']),
});

export const loseWeightGoalDetails = z.object({
  weightLoss: z.enum([
    '2_4_kg',
    '5_8_kg',
    '9_12_kg',
    '12_plus_kg',
    'ai_recommend',
  ]),
  idealWeight: z.number().positive().optional(),
});

export const gainMuscleGoalDetails = z.object({
  muscleGain: z.enum(['1_2_kg', '3_4_kg', '5_plus_kg', 'ai_recommend']),
});

export const healthEnergyGoalDetails = z.object({
  areas: z.array(
    z.enum([
      'digestion',
      'sleep',
      'daily_energy',
      'fluid_retention',
      'blood_sugar',
      'overall_wellbeing',
    ]),
  ),
});

export const performanceGoalDetails = z.object({
  focus: z.enum(['strength', 'endurance', 'speed', 'recovery']),
});

export const longevityGoalDetails = z.object({
  focus: z.enum([
    'weight_control',
    'cardiovascular_health',
    'metabolic_health',
    'balanced_body_composition',
  ]),
});

// Full onboarding profile schema
export const onboardingProfileSchema = z.object({
  // Step 1: About You
  age: z.number().min(13).max(120).optional(),
  sex: Sex.optional(),
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  photoUrl: z.string().url().optional(),

  // Step 2: Main Goal
  primaryGoal: PrimaryGoal.optional(),
  goalDetails: z
    .union([
      loseFatGoalDetails,
      loseWeightGoalDetails,
      gainMuscleGoalDetails,
      healthEnergyGoalDetails,
      performanceGoalDetails,
      longevityGoalDetails,
    ])
    .optional(),

  // Step 3: Lifestyle & Daily Routine
  workType: WorkType.optional(),
  sleepHours: SleepHours.optional(),
  stressLevel: StressLevel.optional(),
  trainingTime: TrainingTime.optional(),

  // Step 4: Training & Energy Expenditure
  trainingFrequency: TrainingFrequency.optional(),
  trainingTypes: z.array(TrainingType).optional(),
  trainingIntensity: TrainingIntensity.optional(),

  // Step 5: Food Preferences
  mealsPerDay: MealsPerDay.optional(),
  carbSources: z.array(CarbSource).optional(),
  excludedFoods: z.array(ExcludedFood).optional(),
  digestiveIssues: z.string().optional(),

  // Step 6: Health & Metabolic Safety
  diagnosedConditions: z.array(DiagnosedCondition).optional(),
  digestionStatus: DigestionStatus.optional(),
  medications: z.string().optional(),
  healthNotes: z.string().optional(),

  // Step 7: Social Life & Plan Adherence
  mealsOutsideHome: MealsOutsideHome.optional(),
  planStructure: PlanStructure.optional(),
  previousDietExperience: DietExperience.optional(),
});

// Partial schema for step-by-step updates
export const onboardingStepSchema = onboardingProfileSchema.partial();

// Type exports
export type PrimaryGoalType = z.infer<typeof PrimaryGoal>;
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

// Computed onboarding results schema
export const onboardingResultSchema = z.object({
  quantifiedGoal: z.string(),
  recommendedPace: z.string(),
  flexibilityLevel: z.string(),
  metabolicContext: z.string(),
  expectations: z.string().optional(),
});

export type OnboardingResult = z.infer<typeof onboardingResultSchema>;
