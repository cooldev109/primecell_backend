import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsUrl,
} from 'class-validator';

// Enums matching shared-schemas
export enum PrimaryGoal {
  LOSE_FAT = 'LOSE_FAT',
  LOSE_WEIGHT = 'LOSE_WEIGHT',
  GAIN_MUSCLE = 'GAIN_MUSCLE',
  HEALTH_ENERGY = 'HEALTH_ENERGY',
  PERFORMANCE = 'PERFORMANCE',
  LONGEVITY = 'LONGEVITY',
}

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum WorkType {
  SEDENTARY = 'sedentary',
  MIXED = 'mixed',
  ACTIVE = 'active',
}

export enum SleepHours {
  LESS_THAN_6 = 'less_than_6',
  SIX_TO_SEVEN = '6_7',
  SEVEN_TO_EIGHT = '7_8',
  EIGHT_PLUS = '8_plus',
}

export enum StressLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum TrainingTime {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NONE = 'none',
}

export enum TrainingFrequency {
  NONE = 'none',
  ONE_TO_TWO = '1_2',
  THREE_TO_FOUR = '3_4',
  FIVE_PLUS = '5_plus',
}

export enum TrainingType {
  WEIGHT_TRAINING = 'weight_training',
  HOME_WORKOUTS = 'home_workouts',
  HIIT = 'hiit',
  CARDIO = 'cardio',
  WALKING = 'walking',
}

export enum TrainingIntensity {
  LIGHT = 'light',
  MODERATE = 'moderate',
  INTENSE = 'intense',
}

export enum MealsPerDay {
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  VARIES = 'varies',
}

export enum CarbSource {
  RICE = 'rice',
  PASTA = 'pasta',
  POTATOES = 'potatoes',
  BREAD = 'bread',
  LEGUMES = 'legumes',
  FRUIT = 'fruit',
}

export enum ExcludedFood {
  DAIRY = 'dairy',
  GLUTEN = 'gluten',
  FISH = 'fish',
  RED_MEAT = 'red_meat',
  SWEETS = 'sweets',
}

export enum DiagnosedCondition {
  HYPERTENSION = 'hypertension',
  HIGH_CHOLESTEROL = 'high_cholesterol',
  INSULIN_RESISTANCE = 'insulin_resistance',
  HYPOTHYROIDISM = 'hypothyroidism',
}

export enum DigestionStatus {
  NORMAL = 'normal',
  CONSTIPATION = 'constipation',
  GAS_BLOATING = 'gas_bloating',
  REFLUX = 'reflux',
}

export enum MealsOutsideHome {
  NONE = 'none',
  ONE_TO_TWO = '1_2',
  THREE_TO_FOUR = '3_4',
  FIVE_PLUS = '5_plus',
}

export enum PlanStructure {
  DISCIPLINED = 'disciplined',
  BALANCED = 'balanced',
  FLEXIBLE = 'flexible',
}

export enum DietExperience {
  WORKED = 'worked',
  COULD_NOT_MAINTAIN = 'could_not_maintain',
  FIRST_TIME = 'first_time',
}

// Step 1: About You
export class OnboardingStep1Dto {
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Sex })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}

// Step 2: Goal
export class OnboardingStep2Dto {
  @ApiProperty({ enum: PrimaryGoal })
  @IsEnum(PrimaryGoal)
  primaryGoal: PrimaryGoal;

  @ApiPropertyOptional({ description: 'Goal-specific details as JSON' })
  @IsOptional()
  goalDetails?: Record<string, any>;
}

// Step 3: Lifestyle
export class OnboardingStep3Dto {
  @ApiPropertyOptional({ enum: WorkType })
  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @ApiPropertyOptional({ enum: SleepHours })
  @IsOptional()
  @IsEnum(SleepHours)
  sleepHours?: SleepHours;

  @ApiPropertyOptional({ enum: StressLevel })
  @IsOptional()
  @IsEnum(StressLevel)
  stressLevel?: StressLevel;

  @ApiPropertyOptional({ enum: TrainingTime })
  @IsOptional()
  @IsEnum(TrainingTime)
  trainingTime?: TrainingTime;
}

// Step 4: Training
export class OnboardingStep4Dto {
  @ApiPropertyOptional({ enum: TrainingFrequency })
  @IsOptional()
  @IsEnum(TrainingFrequency)
  trainingFrequency?: TrainingFrequency;

  @ApiPropertyOptional({ enum: TrainingType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TrainingType, { each: true })
  trainingTypes?: TrainingType[];

  @ApiPropertyOptional({ enum: TrainingIntensity })
  @IsOptional()
  @IsEnum(TrainingIntensity)
  trainingIntensity?: TrainingIntensity;
}

// Step 5: Food Preferences
export class OnboardingStep5Dto {
  @ApiPropertyOptional({ enum: MealsPerDay })
  @IsOptional()
  @IsEnum(MealsPerDay)
  mealsPerDay?: MealsPerDay;

  @ApiPropertyOptional({ enum: CarbSource, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CarbSource, { each: true })
  carbSources?: CarbSource[];

  @ApiPropertyOptional({ enum: ExcludedFood, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ExcludedFood, { each: true })
  excludedFoods?: ExcludedFood[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digestiveIssues?: string;
}

// Step 6: Health & Safety
export class OnboardingStep6Dto {
  @ApiPropertyOptional({ enum: DiagnosedCondition, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DiagnosedCondition, { each: true })
  diagnosedConditions?: DiagnosedCondition[];

  @ApiPropertyOptional({ enum: DigestionStatus })
  @IsOptional()
  @IsEnum(DigestionStatus)
  digestionStatus?: DigestionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthNotes?: string;
}

// Step 7: Social & Adherence
export class OnboardingStep7Dto {
  @ApiPropertyOptional({ enum: MealsOutsideHome })
  @IsOptional()
  @IsEnum(MealsOutsideHome)
  mealsOutsideHome?: MealsOutsideHome;

  @ApiPropertyOptional({ enum: PlanStructure })
  @IsOptional()
  @IsEnum(PlanStructure)
  planStructure?: PlanStructure;

  @ApiPropertyOptional({ enum: DietExperience })
  @IsOptional()
  @IsEnum(DietExperience)
  previousDietExperience?: DietExperience;
}

// Combined update DTO for partial updates
export class UpdateOnboardingDto {
  // Step 1
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Sex })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  // Step 2
  @ApiPropertyOptional({ enum: PrimaryGoal })
  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @ApiPropertyOptional()
  @IsOptional()
  goalDetails?: Record<string, any>;

  // Step 3
  @ApiPropertyOptional({ enum: WorkType })
  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @ApiPropertyOptional({ enum: SleepHours })
  @IsOptional()
  @IsEnum(SleepHours)
  sleepHours?: SleepHours;

  @ApiPropertyOptional({ enum: StressLevel })
  @IsOptional()
  @IsEnum(StressLevel)
  stressLevel?: StressLevel;

  @ApiPropertyOptional({ enum: TrainingTime })
  @IsOptional()
  @IsEnum(TrainingTime)
  trainingTime?: TrainingTime;

  // Step 4
  @ApiPropertyOptional({ enum: TrainingFrequency })
  @IsOptional()
  @IsEnum(TrainingFrequency)
  trainingFrequency?: TrainingFrequency;

  @ApiPropertyOptional({ enum: TrainingType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TrainingType, { each: true })
  trainingTypes?: TrainingType[];

  @ApiPropertyOptional({ enum: TrainingIntensity })
  @IsOptional()
  @IsEnum(TrainingIntensity)
  trainingIntensity?: TrainingIntensity;

  // Step 5
  @ApiPropertyOptional({ enum: MealsPerDay })
  @IsOptional()
  @IsEnum(MealsPerDay)
  mealsPerDay?: MealsPerDay;

  @ApiPropertyOptional({ enum: CarbSource, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CarbSource, { each: true })
  carbSources?: CarbSource[];

  @ApiPropertyOptional({ enum: ExcludedFood, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ExcludedFood, { each: true })
  excludedFoods?: ExcludedFood[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digestiveIssues?: string;

  // Step 6
  @ApiPropertyOptional({ enum: DiagnosedCondition, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DiagnosedCondition, { each: true })
  diagnosedConditions?: DiagnosedCondition[];

  @ApiPropertyOptional({ enum: DigestionStatus })
  @IsOptional()
  @IsEnum(DigestionStatus)
  digestionStatus?: DigestionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthNotes?: string;

  // Step 7
  @ApiPropertyOptional({ enum: MealsOutsideHome })
  @IsOptional()
  @IsEnum(MealsOutsideHome)
  mealsOutsideHome?: MealsOutsideHome;

  @ApiPropertyOptional({ enum: PlanStructure })
  @IsOptional()
  @IsEnum(PlanStructure)
  planStructure?: PlanStructure;

  @ApiPropertyOptional({ enum: DietExperience })
  @IsOptional()
  @IsEnum(DietExperience)
  previousDietExperience?: DietExperience;
}

// Response DTOs
export class OnboardingProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  sex?: string;

  @ApiPropertyOptional()
  heightCm?: number;

  @ApiPropertyOptional()
  weightKg?: number;

  @ApiPropertyOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  primaryGoal?: string;

  @ApiPropertyOptional()
  goalDetails?: Record<string, any>;

  @ApiPropertyOptional()
  workType?: string;

  @ApiPropertyOptional()
  sleepHours?: string;

  @ApiPropertyOptional()
  stressLevel?: string;

  @ApiPropertyOptional()
  trainingTime?: string;

  @ApiPropertyOptional()
  trainingFrequency?: string;

  @ApiPropertyOptional()
  trainingTypes?: string[];

  @ApiPropertyOptional()
  trainingIntensity?: string;

  @ApiPropertyOptional()
  mealsPerDay?: string;

  @ApiPropertyOptional()
  carbSources?: string[];

  @ApiPropertyOptional()
  excludedFoods?: string[];

  @ApiPropertyOptional()
  digestiveIssues?: string;

  @ApiPropertyOptional()
  diagnosedConditions?: string[];

  @ApiPropertyOptional()
  digestionStatus?: string;

  @ApiPropertyOptional()
  medications?: string;

  @ApiPropertyOptional()
  healthNotes?: string;

  @ApiPropertyOptional()
  mealsOutsideHome?: string;

  @ApiPropertyOptional()
  planStructure?: string;

  @ApiPropertyOptional()
  previousDietExperience?: string;

  @ApiPropertyOptional()
  quantifiedGoal?: string;

  @ApiPropertyOptional()
  recommendedPace?: string;

  @ApiPropertyOptional()
  flexibilityLevel?: string;

  @ApiPropertyOptional()
  metabolicContext?: string;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OnboardingResultDto {
  @ApiProperty()
  quantifiedGoal: string;

  @ApiProperty()
  recommendedPace: string;

  @ApiProperty()
  flexibilityLevel: string;

  @ApiProperty()
  metabolicContext: string;

  @ApiPropertyOptional()
  expectations?: string;
}
