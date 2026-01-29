/**
 * Macro Calculator
 * Calculates protein, carbs, fat based on goal and body composition
 */

export interface MacroInput {
  weightKg: number;
  targetCalories: number;
  primaryGoal: string;
  trainingFrequency: string;
  trainingTypes: string[];
  trainingIntensity: string;
}

export interface MacroOutput {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

/**
 * Get protein multiplier (g per kg bodyweight)
 */
function getProteinMultiplier(
  primaryGoal: string,
  trainingFrequency: string,
  trainingIntensity: string,
  trainingTypes: string[],
): number {
  // Base protein needs
  let baseProtein = 1.6; // g/kg - general active person

  // Adjust for goal
  switch (primaryGoal) {
    case 'GAIN_MUSCLE':
      baseProtein = 2.0;
      break;
    case 'LOSE_FAT':
    case 'LOSE_WEIGHT':
      baseProtein = 2.2; // Higher protein when cutting to preserve muscle
      break;
    case 'PERFORMANCE':
      baseProtein = 1.8;
      break;
    case 'HEALTH_ENERGY':
    case 'LONGEVITY':
      baseProtein = 1.4;
      break;
  }

  // Adjust for training frequency
  if (trainingFrequency === '5_plus') {
    baseProtein += 0.2;
  } else if (trainingFrequency === 'none' || trainingFrequency === '1_2') {
    baseProtein -= 0.2;
  }

  // Adjust for training type (resistance training needs more protein)
  if (trainingTypes.includes('weight_training')) {
    baseProtein += 0.1;
  }

  // Clamp to reasonable range
  return Math.max(1.2, Math.min(2.5, baseProtein));
}

/**
 * Get fat minimum (g per kg bodyweight)
 * Essential for hormone production
 */
function getFatMinimum(sex: string = 'male'): number {
  // Women need slightly more fat for hormonal health
  return sex === 'female' ? 0.9 : 0.8;
}

/**
 * Calculate macros
 */
export function calculateMacros(input: MacroInput): MacroOutput {
  const { weightKg, targetCalories, primaryGoal, trainingFrequency, trainingTypes, trainingIntensity } = input;

  // Step 1: Calculate protein (priority)
  const proteinMultiplier = getProteinMultiplier(
    primaryGoal,
    trainingFrequency,
    trainingIntensity,
    trainingTypes,
  );
  const protein = Math.round(weightKg * proteinMultiplier);
  const proteinCalories = protein * 4;

  // Step 2: Calculate fat (minimum floor)
  const fatMinMultiplier = getFatMinimum();
  let fat = Math.round(weightKg * fatMinMultiplier);

  // Adjust fat based on goal
  if (primaryGoal === 'GAIN_MUSCLE' || primaryGoal === 'PERFORMANCE') {
    // Slightly higher fat for hormones during building phases
    fat = Math.round(fat * 1.2);
  } else if (primaryGoal === 'HEALTH_ENERGY' || primaryGoal === 'LONGEVITY') {
    // Balanced fat for health
    fat = Math.round(fat * 1.3);
  }

  const fatCalories = fat * 9;

  // Step 3: Fill remaining calories with carbs
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  let carbs = Math.round(remainingCalories / 4);

  // Ensure carbs don't go negative (adjust fat if needed)
  if (carbs < 50) {
    // Minimum carbs for brain function and training
    carbs = 50;
    const carbCalories = carbs * 4;
    const adjustedFatCalories = targetCalories - proteinCalories - carbCalories;
    fat = Math.max(Math.round(weightKg * 0.6), Math.round(adjustedFatCalories / 9));
  }

  // Calculate percentages
  const totalCalories = protein * 4 + carbs * 4 + fat * 9;
  const proteinPercent = Math.round((protein * 4 / totalCalories) * 100);
  const carbsPercent = Math.round((carbs * 4 / totalCalories) * 100);
  const fatPercent = Math.round((fat * 9 / totalCalories) * 100);

  return {
    protein,
    carbs,
    fat,
    proteinPercent,
    carbsPercent,
    fatPercent,
  };
}

/**
 * Calculate target calories based on goal
 */
export function calculateTargetCalories(
  tdee: number,
  primaryGoal: string,
  goalDetails?: Record<string, unknown>,
): { targetCalories: number; deficit: number; surplus: number } {
  let deficit = 0;
  let surplus = 0;

  switch (primaryGoal) {
    case 'LOSE_FAT':
    case 'LOSE_WEIGHT':
      // Moderate deficit: 15-25% based on aggressiveness
      deficit = Math.round(tdee * 0.20); // 20% deficit default
      break;

    case 'GAIN_MUSCLE':
      // Small surplus: 10-15%
      surplus = Math.round(tdee * 0.12); // 12% surplus default
      break;

    case 'PERFORMANCE':
      // Slight surplus for fuel
      surplus = Math.round(tdee * 0.05);
      break;

    case 'HEALTH_ENERGY':
    case 'LONGEVITY':
      // Maintenance or slight deficit
      deficit = Math.round(tdee * 0.05);
      break;

    default:
      // Maintenance
      break;
  }

  const targetCalories = tdee - deficit + surplus;

  return {
    targetCalories: Math.round(targetCalories),
    deficit,
    surplus,
  };
}
