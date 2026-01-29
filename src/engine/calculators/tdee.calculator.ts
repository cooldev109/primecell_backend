/**
 * TDEE (Total Daily Energy Expenditure) Calculator
 * Uses Mifflin-St Jeor equation with activity multipliers
 */

export interface TdeeInput {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  workType: string; // sedentary, mixed, active
  trainingFrequency: string; // none, 1_2, 3_4, 5_plus
  trainingIntensity: string; // light, moderate, intense
}

export interface TdeeOutput {
  bmr: number;
  activityMultiplier: number;
  tdee: number;
  neat: number; // Non-exercise activity thermogenesis estimate
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
 * Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
 */
function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: string,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Get activity multiplier based on work type and training
 */
function getActivityMultiplier(
  workType: string,
  trainingFrequency: string,
  trainingIntensity: string,
): number {
  // Base multiplier from work type
  let baseMultiplier: number;
  switch (workType) {
    case 'active':
      baseMultiplier = 1.5;
      break;
    case 'mixed':
      baseMultiplier = 1.35;
      break;
    case 'sedentary':
    default:
      baseMultiplier = 1.2;
  }

  // Training adjustment
  let trainingAdjustment = 0;

  // Frequency adjustment
  switch (trainingFrequency) {
    case '5_plus':
      trainingAdjustment += 0.2;
      break;
    case '3_4':
      trainingAdjustment += 0.15;
      break;
    case '1_2':
      trainingAdjustment += 0.08;
      break;
    case 'none':
    default:
      trainingAdjustment += 0;
  }

  // Intensity adjustment
  switch (trainingIntensity) {
    case 'intense':
      trainingAdjustment *= 1.2;
      break;
    case 'moderate':
      trainingAdjustment *= 1.0;
      break;
    case 'light':
    default:
      trainingAdjustment *= 0.8;
  }

  return baseMultiplier + trainingAdjustment;
}

/**
 * Calculate TDEE
 */
export function calculateTdee(input: TdeeInput): TdeeOutput {
  const bmr = calculateBmr(input.weightKg, input.heightCm, input.age, input.sex);

  const activityMultiplier = getActivityMultiplier(
    input.workType,
    input.trainingFrequency,
    input.trainingIntensity,
  );

  const tdee = Math.round(bmr * activityMultiplier);

  // Estimate NEAT (non-exercise activity thermogenesis)
  const neat = Math.round((activityMultiplier - 1) * bmr * 0.5);

  return {
    bmr: Math.round(bmr),
    activityMultiplier: Math.round(activityMultiplier * 100) / 100,
    tdee,
    neat,
  };
}
