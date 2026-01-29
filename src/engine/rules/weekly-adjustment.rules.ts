/**
 * Weekly Adjustment Rules
 * Deterministic rules for adjusting plans based on weekly check-in data
 */

import { DerivedSignals } from '../calculators/signals.calculator';

export interface AdjustmentInput {
  primaryGoal: string;
  currentCalories: number;
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  weightKg: number;
  signals: DerivedSignals;
  weekNumber: number;
}

export interface CalorieAdjustment {
  newCalories: number;
  delta: number;
  reason: string;
  ruleId: string;
}

export interface MacroAdjustment {
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
}

export interface TrainingAdjustment {
  volumeChange: number; // -1, 0, +1
  intensityChange: number; // -1, 0, +1
  deloadRecommended: boolean;
  reason: string;
}

export interface AdjustmentResult {
  calorieAdjustment: CalorieAdjustment;
  macroAdjustment: MacroAdjustment;
  trainingAdjustment: TrainingAdjustment;
  rulesFired: Array<{
    ruleId: string;
    ruleName: string;
    reasonCode: string;
    impact: string;
    priority: number;
  }>;
  guardrailsApplied: Array<{
    guardrailId: string;
    name: string;
    action: string;
    originalValue: number;
    clampedValue: number;
    reason: string;
  }>;
}

// Calorie adjustment constraints
const MIN_CALORIES = 1200;
const MAX_DEFICIT_PERCENT = 25; // Max 25% below TDEE
const MAX_SURPLUS_PERCENT = 20; // Max 20% above TDEE
const MAX_WEEKLY_CHANGE = 150; // Max ±150 kcal per week

/**
 * Determine calorie adjustment based on signals and goal
 */
function calculateCalorieAdjustment(input: AdjustmentInput): CalorieAdjustment {
  const { primaryGoal, currentCalories, signals } = input;

  // If we should hold changes, no adjustment
  if (signals.shouldHoldChanges) {
    return {
      newCalories: currentCalories,
      delta: 0,
      reason: signals.holdReason || 'Holding changes',
      ruleId: 'HOLD_001',
    };
  }

  let delta = 0;
  let reason = '';
  let ruleId = '';

  // Goal-specific logic
  if (primaryGoal === 'LOSE_FAT' || primaryGoal === 'LOSE_WEIGHT') {
    // Fat loss logic
    if (signals.weightTrend === 'losing' && signals.weightTrendPercent < -1) {
      // Losing too fast (>1% per week) - increase calories
      delta = 100;
      reason = 'Weight loss too rapid (>1%/week). Increasing calories for sustainability.';
      ruleId = 'CUT_SLOW_001';
    } else if (signals.weightTrend === 'losing' && signals.weightTrendPercent >= -0.5 && signals.weightTrendPercent < -0.2) {
      // Losing at good pace - maintain
      delta = 0;
      reason = 'Weight loss on track (0.2-0.5%/week). Maintaining current plan.';
      ruleId = 'CUT_MAINTAIN_001';
    } else if (signals.weightTrend === 'stable' && !signals.recompDetected) {
      // Stalled - consider small decrease
      if (signals.plateauDetected && signals.plateauWeeks >= 3) {
        delta = -75;
        reason = 'Plateau detected (3+ weeks). Small calorie reduction.';
        ruleId = 'CUT_PLATEAU_001';
      } else {
        delta = -50;
        reason = 'Weight stable. Minor calorie reduction.';
        ruleId = 'CUT_STALL_001';
      }
    } else if (signals.weightTrend === 'gaining') {
      // Gaining weight while trying to lose - decrease calories
      delta = -100;
      reason = 'Weight increasing. Reducing calories.';
      ruleId = 'CUT_REVERSE_001';
    } else if (signals.recompDetected) {
      // Recomp happening - maintain
      delta = 0;
      reason = 'Body recomposition detected (stable weight, decreasing waist). Maintaining.';
      ruleId = 'RECOMP_001';
    }

    // Recovery risk override for cutting
    if (signals.recoveryRisk === 'high' && delta < 0) {
      delta = Math.max(delta, 0); // Don't decrease if high recovery risk
      reason = 'High recovery risk. Holding deficit to prevent overtraining.';
      ruleId = 'RECOVERY_HOLD_001';
    }

  } else if (primaryGoal === 'GAIN_MUSCLE') {
    // Muscle gain logic
    if (signals.weightTrend === 'gaining' && signals.weightTrendPercent > 0.5) {
      // Gaining too fast - might be too much fat
      delta = -50;
      reason = 'Weight gain rapid (>0.5%/week). Slight reduction to limit fat gain.';
      ruleId = 'GAIN_SLOW_001';
    } else if (signals.weightTrend === 'stable' || signals.weightTrend === 'losing') {
      // Not gaining - increase
      delta = 100;
      reason = 'Weight not increasing. Adding calories for muscle growth.';
      ruleId = 'GAIN_STALL_001';
    } else if (signals.weightTrend === 'gaining' && signals.weightTrendPercent <= 0.5) {
      // Good pace - maintain
      delta = 0;
      reason = 'Weight gain on track. Maintaining current surplus.';
      ruleId = 'GAIN_MAINTAIN_001';
    }

  } else {
    // Maintenance / Health / Performance / Longevity
    if (signals.weightTrend === 'losing' && signals.weightTrendPercent < -0.3) {
      delta = 75;
      reason = 'Unintended weight loss. Increasing calories.';
      ruleId = 'MAINT_UP_001';
    } else if (signals.weightTrend === 'gaining' && signals.weightTrendPercent > 0.3) {
      delta = -75;
      reason = 'Unintended weight gain. Decreasing calories.';
      ruleId = 'MAINT_DOWN_001';
    } else {
      delta = 0;
      reason = 'Weight stable. Maintaining current plan.';
      ruleId = 'MAINT_HOLD_001';
    }
  }

  // Clamp delta to max weekly change
  const clampedDelta = Math.max(-MAX_WEEKLY_CHANGE, Math.min(MAX_WEEKLY_CHANGE, delta));
  const newCalories = Math.max(MIN_CALORIES, currentCalories + clampedDelta);

  return {
    newCalories,
    delta: clampedDelta,
    reason,
    ruleId,
  };
}

/**
 * Adjust macros based on new calorie target
 */
function calculateMacroAdjustment(
  input: AdjustmentInput,
  newCalories: number,
): MacroAdjustment {
  const { primaryGoal, weightKg } = input;

  // Protein stays relatively constant based on body weight
  let proteinPerKg = 2.0;
  if (primaryGoal === 'LOSE_FAT' || primaryGoal === 'LOSE_WEIGHT') {
    proteinPerKg = 2.2; // Higher protein when cutting
  } else if (primaryGoal === 'GAIN_MUSCLE') {
    proteinPerKg = 2.0;
  } else {
    proteinPerKg = 1.6;
  }

  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCals = protein * 4;

  // Fat minimum
  const fatMin = Math.round(weightKg * 0.8);
  const fat = Math.round(fatMin * 1.1);
  const fatCals = fat * 9;

  // Carbs fill the rest
  const remainingCals = newCalories - proteinCals - fatCals;
  const carbs = Math.max(50, Math.round(remainingCals / 4));

  return {
    protein,
    carbs,
    fat,
    reason: `Macros recalculated for ${newCalories} kcal target`,
  };
}

/**
 * Determine training adjustments
 */
function calculateTrainingAdjustment(input: AdjustmentInput): TrainingAdjustment {
  const { signals, weekNumber } = input;

  let volumeChange = 0;
  let intensityChange = 0;
  let deloadRecommended = false;
  let reason = '';

  // Deload every 4-6 weeks or when recovery is high risk
  if (weekNumber > 0 && weekNumber % 5 === 0) {
    deloadRecommended = true;
    volumeChange = -1;
    intensityChange = -1;
    reason = 'Scheduled deload week for recovery.';
  } else if (signals.recoveryRisk === 'high') {
    deloadRecommended = true;
    volumeChange = -1;
    intensityChange = 0;
    reason = 'High recovery risk. Reducing volume.';
  } else if (signals.recoveryRisk === 'moderate' && signals.adherenceQuality === 'poor') {
    volumeChange = -1;
    reason = 'Moderate recovery risk with poor adherence. Reducing volume.';
  } else if (signals.disruptionFactors.includes('Illness')) {
    deloadRecommended = true;
    volumeChange = -1;
    intensityChange = -1;
    reason = 'Post-illness. Light week recommended.';
  } else if (signals.adherenceQuality === 'excellent' && signals.recoveryRisk === 'low') {
    // Good conditions - can progress
    volumeChange = 1;
    reason = 'Good recovery and adherence. Progressing volume.';
  } else {
    reason = 'Maintaining current training load.';
  }

  return {
    volumeChange,
    intensityChange,
    deloadRecommended,
    reason,
  };
}

/**
 * Main adjustment function
 */
export function calculateWeeklyAdjustments(input: AdjustmentInput): AdjustmentResult {
  const rulesFired: AdjustmentResult['rulesFired'] = [];
  const guardrailsApplied: AdjustmentResult['guardrailsApplied'] = [];

  // Calculate calorie adjustment
  const calorieAdj = calculateCalorieAdjustment(input);

  rulesFired.push({
    ruleId: calorieAdj.ruleId,
    ruleName: 'Calorie Adjustment',
    reasonCode: calorieAdj.ruleId,
    impact: calorieAdj.reason,
    priority: 1,
  });

  // Apply guardrails
  let finalCalories = calorieAdj.newCalories;

  // Min calorie floor
  if (finalCalories < MIN_CALORIES) {
    guardrailsApplied.push({
      guardrailId: 'GUARD_MIN_CAL',
      name: 'Minimum Calorie Floor',
      action: 'clamped',
      originalValue: finalCalories,
      clampedValue: MIN_CALORIES,
      reason: `Calories cannot go below ${MIN_CALORIES}`,
    });
    finalCalories = MIN_CALORIES;
  }

  // Calculate new macros
  const macroAdj = calculateMacroAdjustment(input, finalCalories);

  rulesFired.push({
    ruleId: 'MACRO_RECALC_001',
    ruleName: 'Macro Recalculation',
    reasonCode: 'CALORIES_CHANGED',
    impact: macroAdj.reason,
    priority: 2,
  });

  // Calculate training adjustment
  const trainingAdj = calculateTrainingAdjustment(input);

  rulesFired.push({
    ruleId: 'TRAINING_ADJ_001',
    ruleName: 'Training Adjustment',
    reasonCode: trainingAdj.deloadRecommended ? 'DELOAD' : 'PROGRESS',
    impact: trainingAdj.reason,
    priority: 3,
  });

  return {
    calorieAdjustment: {
      ...calorieAdj,
      newCalories: finalCalories,
    },
    macroAdjustment: macroAdj,
    trainingAdjustment: trainingAdj,
    rulesFired,
    guardrailsApplied,
  };
}
