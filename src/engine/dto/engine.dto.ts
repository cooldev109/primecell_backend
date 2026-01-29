import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Input Types
// ============================================

export interface OnboardingInput {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  primaryGoal: string;
  goalDetails?: Record<string, unknown>;
  workType: string;
  sleepHours: string;
  stressLevel: string;
  trainingFrequency: string;
  trainingTypes: string[];
  trainingIntensity: string;
  mealsPerDay: string;
  carbSources: string[];
  excludedFoods: string[];
  diagnosedConditions: string[];
  digestionStatus: string;
  mealsOutsideHome: string;
  planStructure: string;
  previousDietExperience: string;
}

export interface CheckinInput {
  weightKg?: number;
  waistCm?: number;
  energyLevel?: number;
  hungerLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  adherenceLevel?: string;
  mealsOutside?: boolean;
  hadTravel?: boolean;
  wasIll?: boolean;
  hormonalChanges?: boolean;
  emotionalStress?: boolean;
  poorSleep?: boolean;
  notes?: string;
  selfPerception?: string;
}

// ============================================
// Derived Signals
// ============================================

export interface DerivedSignals {
  // Trend analysis
  weightTrend: 'decreasing' | 'stable' | 'increasing';
  weightTrendPercent: number;
  waistTrend?: 'decreasing' | 'stable' | 'increasing';

  // Confidence scoring
  confidenceScore: number; // 0-100
  adherenceQuality: 'excellent' | 'good' | 'moderate' | 'poor';

  // Recovery risk
  recoveryRisk: 'low' | 'moderate' | 'high';
  recoveryFactors: string[];

  // Detection flags
  plateauDetected: boolean;
  plateauWeeks?: number;
  recompDetected: boolean;

  // Metabolic state
  metabolicStress: 'low' | 'moderate' | 'high';
}

// ============================================
// Nutrition Plan Types
// ============================================

export interface MealOption {
  name: string;
  description?: string;
  ingredients: { name: string; amount: string; unit: string }[];
  macros: { calories: number; protein: number; carbs: number; fat: number };
  tags: string[];
}

export interface MealSlot {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timing?: string;
  options: MealOption[];
  portionGuidance: string;
}

export interface NutritionPlan {
  // Guidelines (real-food philosophy)
  guidelines: string[];

  // Meal structure
  mealsPerDay: number;
  mealSlots: MealSlot[];

  // Quantities guidance
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };

  // Flexibility rules
  flexibilityLevel: 'strict' | 'balanced' | 'flexible';
  flexibilityRules: string[];
}

// ============================================
// Training Plan Types
// ============================================

export interface TrainingPlan {
  programId?: string;
  programName: string;
  progressionWeek: number;
  totalWeeks: number;

  // Adjustments
  volumeAdjustment: number; // -2 to +2
  intensityAdjustment: number; // -2 to +2

  // Status
  deloadStatus: 'none' | 'recommended' | 'mandatory';
  deloadReason?: string;

  // Weekly schedule
  daysPerWeek: number;
  schedule: {
    day: number;
    focus: string;
    exercises: string[];
  }[];
}

// ============================================
// Supplement Plan Types
// ============================================

export interface SupplementPlan {
  supplements: {
    name: string;
    dosage: string;
    timing: string;
    reason: string;
  }[];
}

// ============================================
// Rule Firing Types
// ============================================

export interface RuleFired {
  ruleId: string;
  ruleName: string;
  reasonCode: string;
  impact: string;
  priority: number;
}

export interface GuardrailApplied {
  guardrailId: string;
  name: string;
  action: 'clamped' | 'blocked' | 'warned';
  originalValue?: number;
  clampedValue?: number;
  reason: string;
}

// ============================================
// Engine Output Types
// ============================================

export interface EngineOutput {
  nutritionPlan: NutritionPlan;
  trainingPlan: TrainingPlan;
  supplementPlan?: SupplementPlan;

  // Targets
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;

  // Metadata
  engineVersion: string;
  rulePackVersion: string;
}

export interface DecisionRecordData {
  inputSnapshot: Record<string, unknown>;
  derivedSignals: DerivedSignals;
  rulesFired: RuleFired[];
  guardrailsApplied: GuardrailApplied[];
  engineVersion: string;
  rulePackVersion: string;
}

// ============================================
// API Response DTOs
// ============================================

export class GenerateInitialPlanResponseDto {
  @ApiProperty()
  planVersionId: string;

  @ApiProperty()
  decisionRecordId: string;

  @ApiProperty()
  dailyCalories: number;

  @ApiProperty()
  proteinGrams: number;

  @ApiProperty()
  carbsGrams: number;

  @ApiProperty()
  fatGrams: number;

  @ApiProperty()
  nutritionPlan: NutritionPlan;

  @ApiProperty()
  trainingPlan: TrainingPlan;

  @ApiPropertyOptional()
  supplementPlan?: SupplementPlan;
}

export class ActivePlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: number;

  @ApiProperty()
  weekNumber: number;

  @ApiProperty()
  dailyCalories: number;

  @ApiProperty()
  proteinGrams: number;

  @ApiProperty()
  carbsGrams: number;

  @ApiProperty()
  fatGrams: number;

  @ApiProperty()
  nutritionPlan: NutritionPlan;

  @ApiProperty()
  trainingPlan: TrainingPlan;

  @ApiPropertyOptional()
  supplementPlan?: SupplementPlan;

  @ApiProperty()
  createdAt: Date;
}
