/**
 * DTOs for AI Explanation Layer
 */

// Weekly trend data point
export interface WeeklyTrendPoint {
  week: number;
  weight: number | null;
  waist: number | null;
  adherence: string;
  adherenceScore: number;
  calories: number;
  rulesFired: string[];
  wasDisrupted: boolean;
  disruptionReasons: string[];
}

// Notable event in user's journey
export interface NotableEvent {
  week: number;
  event: 'plateau_start' | 'plateau_break' | 'milestone' | 'disruption' | 'streak' | 'best_week';
  details: string;
}

// Onboarding profile summary for AI context
export interface OnboardingContextSummary {
  goal: string;
  goalDescription: string;
  startingWeight: number;
  targetWeight?: number;
  targetWaist?: number;
  flexibility: string;
  startDate: Date;
  sex: string;
  age: number;
}

// Full journey summary for AI context
export interface JourneySummary {
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
  weeklyTrends: WeeklyTrendPoint[];
  notableEvents: NotableEvent[];
}

// Current decision context
export interface CurrentDecisionContext {
  weekNumber: number;
  isInitialPlan: boolean;

  // Check-in data (if not initial plan)
  checkin?: {
    weightKg: number | null;
    waistCm: number | null;
    energyLevel: number | null;
    hungerLevel: number | null;
    sleepQuality: number | null;
    stressLevel: number | null;
    adherenceLevel: string;
    selfPerception: string;
    contextualEvents: string[];
    notes: string | null;
  };

  // Derived signals from engine
  derivedSignals: {
    weightTrend: string;
    weightTrendPercent: number;
    confidenceScore: number;
    adherenceQuality: string;
    recoveryRisk: string;
    recoveryFactors: string[];
    plateauDetected: boolean;
    recompDetected: boolean;
    metabolicStress: string;
    shouldHoldChanges: boolean;
    holdReason?: string;
  };

  // Rules fired
  rulesFired: Array<{
    ruleId: string;
    ruleName: string;
    reasonCode: string;
    impact: string;
  }>;

  // Guardrails applied
  guardrailsApplied: Array<{
    guardrailId: string;
    name: string;
    action: string;
    originalValue: number;
    clampedValue: number;
    reason: string;
  }>;

  // Plan changes
  planChanges: {
    previousCalories: number | null;
    newCalories: number;
    caloriesDelta: number;
    previousProtein: number | null;
    newProtein: number;
    previousCarbs: number | null;
    newCarbs: number;
    previousFat: number | null;
    newFat: number;
    trainingAdjustment: string;
    deloadRecommended: boolean;
  };
}

// Full context payload sent to AI
export interface AIContextPayload {
  onboardingProfile: OnboardingContextSummary;
  journeySummary: JourneySummary;
  currentDecision: CurrentDecisionContext;

  // UI context
  locale?: string;
  maxLength?: number;
}

// AI response structure
export interface AIExplanationResponse {
  explanationText: string;
  progressSummary: string;
  whyThisDecision: string;
  whatToDoNext: string[];
  motivationalNote: string;
  safetyNote?: string;
  needsMedicalDisclaimer: boolean;
  shouldHoldChanges: boolean;
}

// API response DTO
export interface AiExplanationResponseDto {
  id: string;
  decisionRecordId: string;
  explanationText: string;
  progressSummary: string | null;
  whyThisDecision: string | null;
  whatToDoNext: string[] | null;
  motivationalNote: string | null;
  safetyNote: string | null;
  needsMedicalDisclaimer: boolean;
  shouldHoldChanges: boolean;
  usedFallback: boolean;
  createdAt: Date;
}

// Request DTO for generating explanation
export interface GenerateExplanationDto {
  decisionRecordId: string;
  forceRegenerate?: boolean;
}
