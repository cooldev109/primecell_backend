/**
 * Initial Plan Rules
 * Deterministic rules for generating the first plan from onboarding data
 */

import {
  OnboardingInput,
  NutritionPlan,
  TrainingPlan,
  SupplementPlan,
  MealSlot,
  MealOption,
  DerivedSignals,
  RuleFired,
  GuardrailApplied,
} from '../dto/engine.dto';

// ============================================
// Constants
// ============================================

const ENGINE_VERSION = '1.0.0';
const RULE_PACK_VERSION = '1.0.0';

// ============================================
// Meal Building Helpers
// ============================================

function buildBreakfastOptions(
  excludedFoods: string[],
  carbSources: string[],
): MealOption[] {
  const options: MealOption[] = [];

  // Option 1: Eggs-based breakfast
  if (!excludedFoods.includes('eggs')) {
    options.push({
      name: 'Protein Scramble',
      description: 'Scrambled eggs with vegetables',
      ingredients: [
        { name: 'Eggs', amount: '3', unit: 'whole' },
        { name: 'Spinach', amount: '1', unit: 'cup' },
        { name: 'Cherry tomatoes', amount: '0.5', unit: 'cup' },
        { name: 'Olive oil', amount: '1', unit: 'tsp' },
      ],
      macros: { calories: 320, protein: 21, carbs: 8, fat: 24 },
      tags: ['high_protein', 'low_carb', 'quick'],
    });
  }

  // Option 2: Oatmeal-based
  if (!excludedFoods.includes('gluten') && carbSources.includes('oats')) {
    options.push({
      name: 'Protein Oatmeal',
      description: 'Oats with protein and fruit',
      ingredients: [
        { name: 'Oats', amount: '0.5', unit: 'cup' },
        { name: 'Protein powder', amount: '1', unit: 'scoop' },
        { name: 'Banana', amount: '0.5', unit: 'medium' },
        { name: 'Almond butter', amount: '1', unit: 'tbsp' },
      ],
      macros: { calories: 380, protein: 28, carbs: 45, fat: 12 },
      tags: ['high_protein', 'balanced'],
    });
  }

  // Option 3: Greek yogurt bowl (if not dairy-free)
  if (!excludedFoods.includes('dairy')) {
    options.push({
      name: 'Greek Yogurt Bowl',
      description: 'High-protein yogurt with toppings',
      ingredients: [
        { name: 'Greek yogurt', amount: '200', unit: 'g' },
        { name: 'Mixed berries', amount: '0.5', unit: 'cup' },
        { name: 'Honey', amount: '1', unit: 'tsp' },
        { name: 'Almonds', amount: '10', unit: 'pieces' },
      ],
      macros: { calories: 290, protein: 22, carbs: 28, fat: 10 },
      tags: ['high_protein', 'quick', 'no_cooking'],
    });
  }

  // Fallback option
  if (options.length < 2) {
    options.push({
      name: 'Smoothie Bowl',
      description: 'Blended protein smoothie',
      ingredients: [
        { name: 'Protein powder', amount: '1', unit: 'scoop' },
        { name: 'Frozen berries', amount: '1', unit: 'cup' },
        { name: 'Spinach', amount: '1', unit: 'cup' },
        { name: 'Almond milk', amount: '1', unit: 'cup' },
      ],
      macros: { calories: 250, protein: 25, carbs: 25, fat: 5 },
      tags: ['high_protein', 'quick', 'dairy_free'],
    });
  }

  return options.slice(0, 3);
}

function buildLunchOptions(
  excludedFoods: string[],
  carbSources: string[],
): MealOption[] {
  const options: MealOption[] = [];

  // Option 1: Chicken & Rice
  if (!excludedFoods.includes('poultry') && carbSources.includes('rice')) {
    options.push({
      name: 'Grilled Chicken & Rice',
      description: 'Classic lean protein with complex carbs',
      ingredients: [
        { name: 'Chicken breast', amount: '150', unit: 'g' },
        { name: 'Brown rice', amount: '1', unit: 'cup cooked' },
        { name: 'Broccoli', amount: '1', unit: 'cup' },
        { name: 'Olive oil', amount: '1', unit: 'tbsp' },
      ],
      macros: { calories: 480, protein: 42, carbs: 45, fat: 14 },
      tags: ['high_protein', 'meal_prep_friendly'],
    });
  }

  // Option 2: Fish option
  if (!excludedFoods.includes('fish')) {
    options.push({
      name: 'Salmon & Vegetables',
      description: 'Omega-3 rich protein with veggies',
      ingredients: [
        { name: 'Salmon fillet', amount: '150', unit: 'g' },
        { name: 'Sweet potato', amount: '150', unit: 'g' },
        { name: 'Asparagus', amount: '6', unit: 'spears' },
        { name: 'Lemon', amount: '0.5', unit: 'whole' },
      ],
      macros: { calories: 450, protein: 38, carbs: 35, fat: 18 },
      tags: ['high_protein', 'omega_3', 'whole_food'],
    });
  }

  // Option 3: Legume-based
  if (carbSources.includes('legumes')) {
    options.push({
      name: 'Chickpea Buddha Bowl',
      description: 'Plant-based protein bowl',
      ingredients: [
        { name: 'Chickpeas', amount: '1', unit: 'cup' },
        { name: 'Quinoa', amount: '0.5', unit: 'cup cooked' },
        { name: 'Mixed greens', amount: '2', unit: 'cups' },
        { name: 'Tahini dressing', amount: '2', unit: 'tbsp' },
      ],
      macros: { calories: 420, protein: 18, carbs: 52, fat: 16 },
      tags: ['vegetarian', 'high_fiber'],
    });
  }

  // Option 4: Red meat (if not excluded)
  if (!excludedFoods.includes('red_meat')) {
    options.push({
      name: 'Lean Beef Stir-Fry',
      description: 'Quick beef with vegetables',
      ingredients: [
        { name: 'Lean beef strips', amount: '150', unit: 'g' },
        { name: 'Mixed peppers', amount: '1', unit: 'cup' },
        { name: 'Rice noodles', amount: '100', unit: 'g' },
        { name: 'Soy sauce', amount: '1', unit: 'tbsp' },
      ],
      macros: { calories: 460, protein: 40, carbs: 40, fat: 15 },
      tags: ['high_protein', 'quick'],
    });
  }

  return options.slice(0, 3);
}

function buildDinnerOptions(
  excludedFoods: string[],
  carbSources: string[],
): MealOption[] {
  const options: MealOption[] = [];

  // Option 1: Turkey/Chicken
  if (!excludedFoods.includes('poultry')) {
    options.push({
      name: 'Herb-Roasted Chicken',
      description: 'Simple roasted chicken with vegetables',
      ingredients: [
        { name: 'Chicken thigh', amount: '180', unit: 'g' },
        { name: 'Roasted vegetables', amount: '2', unit: 'cups' },
        { name: 'Olive oil', amount: '1', unit: 'tbsp' },
        { name: 'Fresh herbs', amount: '2', unit: 'tbsp' },
      ],
      macros: { calories: 420, protein: 38, carbs: 20, fat: 22 },
      tags: ['high_protein', 'whole_food'],
    });
  }

  // Option 2: Fish
  if (!excludedFoods.includes('fish')) {
    options.push({
      name: 'Baked Cod with Potatoes',
      description: 'Light fish with starchy sides',
      ingredients: [
        { name: 'Cod fillet', amount: '180', unit: 'g' },
        { name: 'Baby potatoes', amount: '150', unit: 'g' },
        { name: 'Green beans', amount: '1', unit: 'cup' },
        { name: 'Butter', amount: '1', unit: 'tbsp' },
      ],
      macros: { calories: 380, protein: 35, carbs: 32, fat: 12 },
      tags: ['high_protein', 'light'],
    });
  }

  // Option 3: Vegetarian
  options.push({
    name: 'Tofu & Vegetable Curry',
    description: 'Flavorful plant-based dinner',
    ingredients: [
      { name: 'Firm tofu', amount: '200', unit: 'g' },
      { name: 'Coconut curry sauce', amount: '0.5', unit: 'cup' },
      { name: 'Mixed vegetables', amount: '2', unit: 'cups' },
      { name: 'Basmati rice', amount: '0.5', unit: 'cup cooked' },
    ],
    macros: { calories: 440, protein: 24, carbs: 38, fat: 22 },
    tags: ['vegetarian', 'dairy_free'],
  });

  return options.slice(0, 3);
}

function buildSnackOptions(excludedFoods: string[]): MealOption[] {
  const options: MealOption[] = [];

  // High protein snacks
  if (!excludedFoods.includes('dairy')) {
    options.push({
      name: 'Cottage Cheese & Fruit',
      description: 'Quick protein snack',
      ingredients: [
        { name: 'Cottage cheese', amount: '150', unit: 'g' },
        { name: 'Pineapple', amount: '0.5', unit: 'cup' },
      ],
      macros: { calories: 180, protein: 18, carbs: 15, fat: 5 },
      tags: ['high_protein', 'quick', 'no_cooking'],
    });
  }

  options.push({
    name: 'Protein Shake',
    description: 'Quick protein boost',
    ingredients: [
      { name: 'Protein powder', amount: '1', unit: 'scoop' },
      { name: 'Water or almond milk', amount: '300', unit: 'ml' },
    ],
    macros: { calories: 120, protein: 24, carbs: 3, fat: 1 },
    tags: ['high_protein', 'quick', 'portable'],
  });

  options.push({
    name: 'Mixed Nuts & Seeds',
    description: 'Healthy fats and protein',
    ingredients: [
      { name: 'Almonds', amount: '15', unit: 'pieces' },
      { name: 'Walnuts', amount: '5', unit: 'pieces' },
      { name: 'Pumpkin seeds', amount: '1', unit: 'tbsp' },
    ],
    macros: { calories: 200, protein: 7, carbs: 6, fat: 18 },
    tags: ['healthy_fats', 'portable', 'no_cooking'],
  });

  return options.slice(0, 3);
}

// ============================================
// Guidelines Generation
// ============================================

function generateGuidelines(input: OnboardingInput): string[] {
  const guidelines: string[] = [
    'Focus on whole, minimally processed foods',
    'Prioritize protein at every meal for satiety and muscle preservation',
    'Eat plenty of vegetables for fiber, vitamins, and volume',
    'Stay hydrated - aim for 2-3 liters of water daily',
  ];

  // Goal-specific guidelines
  switch (input.primaryGoal) {
    case 'LOSE_FAT':
    case 'LOSE_WEIGHT':
      guidelines.push('Eat slowly and mindfully to recognize fullness cues');
      guidelines.push('Front-load calories earlier in the day when possible');
      break;
    case 'GAIN_MUSCLE':
      guidelines.push('Distribute protein evenly across meals (30-40g per meal)');
      guidelines.push('Don\'t skip post-workout nutrition');
      break;
    case 'PERFORMANCE':
      guidelines.push('Time carbohydrates around training sessions');
      guidelines.push('Prioritize recovery nutrition post-workout');
      break;
    case 'HEALTH_ENERGY':
    case 'LONGEVITY':
      guidelines.push('Include a variety of colorful vegetables daily');
      guidelines.push('Consider time-restricted eating if it suits your schedule');
      break;
  }

  // Health condition specific
  if (input.diagnosedConditions.includes('insulin_resistance')) {
    guidelines.push('Pair carbohydrates with protein and fat to stabilize blood sugar');
  }

  if (input.digestionStatus === 'gas_bloating') {
    guidelines.push('Eat slowly and chew thoroughly to aid digestion');
  }

  return guidelines;
}

// ============================================
// Flexibility Rules Generation
// ============================================

function generateFlexibilityRules(input: OnboardingInput): string[] {
  const rules: string[] = [];
  const flexibility = input.planStructure;

  switch (flexibility) {
    case 'disciplined':
      rules.push('Follow meal options closely for best results');
      rules.push('Weigh portions for the first 2 weeks to calibrate');
      rules.push('Save flexible meals for planned social occasions');
      break;

    case 'balanced':
      rules.push('Swap within meal categories freely (protein for protein)');
      rules.push('One flexible meal per week within calorie targets');
      rules.push('Portions can be estimated by hand after initial calibration');
      break;

    case 'flexible':
      rules.push('Use meals as inspiration - hit protein and calorie targets');
      rules.push('2-3 flexible meals per week are fine if overall adherence is good');
      rules.push('Focus on the weekly average, not daily perfection');
      break;

    default:
      rules.push('Balance consistency with flexibility that fits your lifestyle');
  }

  // Social eating rules
  if (input.mealsOutsideHome === '3_4' || input.mealsOutsideHome === '5_plus') {
    rules.push('For restaurant meals: prioritize protein, request sauces on side');
    rules.push('Scout menus beforehand when possible');
  }

  return rules;
}

// ============================================
// Training Plan Generation
// ============================================

function generateTrainingPlan(input: OnboardingInput): TrainingPlan {
  const { trainingFrequency, trainingTypes, trainingIntensity, primaryGoal } = input;

  // Determine days per week
  let daysPerWeek: number;
  switch (trainingFrequency) {
    case '5_plus':
      daysPerWeek = 5;
      break;
    case '3_4':
      daysPerWeek = 4;
      break;
    case '1_2':
      daysPerWeek = 2;
      break;
    default:
      daysPerWeek = 3;
  }

  // Build schedule based on training types
  const schedule: { day: number; focus: string; exercises: string[] }[] = [];

  if (trainingTypes.includes('weight_training')) {
    if (daysPerWeek >= 4) {
      // Upper/Lower split
      schedule.push({ day: 1, focus: 'Upper Body', exercises: ['Bench Press', 'Rows', 'Shoulder Press', 'Bicep Curls', 'Tricep Extensions'] });
      schedule.push({ day: 2, focus: 'Lower Body', exercises: ['Squats', 'Romanian Deadlifts', 'Leg Press', 'Leg Curls', 'Calf Raises'] });
      schedule.push({ day: 3, focus: 'Rest or Cardio', exercises: ['Light cardio', 'Stretching'] });
      schedule.push({ day: 4, focus: 'Upper Body', exercises: ['Pull-ups', 'Incline Press', 'Face Pulls', 'Lateral Raises', 'Core'] });
      if (daysPerWeek >= 5) {
        schedule.push({ day: 5, focus: 'Lower Body + Core', exercises: ['Deadlifts', 'Lunges', 'Leg Extensions', 'Core Circuit'] });
      }
    } else {
      // Full body
      schedule.push({ day: 1, focus: 'Full Body A', exercises: ['Squats', 'Bench Press', 'Rows', 'Core'] });
      schedule.push({ day: 2, focus: 'Rest', exercises: ['Active recovery'] });
      schedule.push({ day: 3, focus: 'Full Body B', exercises: ['Deadlifts', 'Shoulder Press', 'Pull-ups', 'Core'] });
    }
  } else if (trainingTypes.includes('home_workouts')) {
    schedule.push({ day: 1, focus: 'Push', exercises: ['Push-ups', 'Pike Push-ups', 'Dips', 'Diamond Push-ups'] });
    schedule.push({ day: 2, focus: 'Pull + Legs', exercises: ['Bodyweight Rows', 'Squats', 'Lunges', 'Glute Bridges'] });
    schedule.push({ day: 3, focus: 'Full Body HIIT', exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Plank'] });
  } else if (trainingTypes.includes('cardio') || trainingTypes.includes('walking')) {
    schedule.push({ day: 1, focus: 'Cardio', exercises: ['30-45 min steady state cardio'] });
    schedule.push({ day: 2, focus: 'Rest', exercises: ['Light walking'] });
    schedule.push({ day: 3, focus: 'Cardio', exercises: ['Interval training or steady cardio'] });
  } else {
    // Default walking plan
    schedule.push({ day: 1, focus: 'Walking', exercises: ['30 min brisk walk'] });
    schedule.push({ day: 2, focus: 'Walking', exercises: ['30 min brisk walk'] });
    schedule.push({ day: 3, focus: 'Walking', exercises: ['45 min walk'] });
  }

  // Determine program name based on types
  let programName = 'General Fitness';
  if (trainingTypes.includes('weight_training')) {
    programName = daysPerWeek >= 4 ? 'Upper/Lower Split' : 'Full Body Strength';
  } else if (trainingTypes.includes('home_workouts')) {
    programName = 'Home Bodyweight Program';
  } else if (trainingTypes.includes('hiit')) {
    programName = 'HIIT Conditioning';
  } else if (trainingTypes.includes('cardio')) {
    programName = 'Cardio Focus';
  }

  return {
    programName,
    progressionWeek: 1,
    totalWeeks: 12,
    volumeAdjustment: 0,
    intensityAdjustment: 0,
    deloadStatus: 'none',
    daysPerWeek,
    schedule,
  };
}

// ============================================
// Supplement Plan Generation
// ============================================

function generateSupplementPlan(input: OnboardingInput): SupplementPlan {
  const supplements: SupplementPlan['supplements'] = [];

  // Protein for all users
  supplements.push({
    name: 'Shape Protein',
    dosage: '1 scoop (25g protein)',
    timing: 'Post-workout or with meals to hit protein targets',
    reason: 'Convenient protein source to meet daily requirements',
  });

  // Goal-specific supplements
  if (input.primaryGoal === 'LOSE_FAT' || input.primaryGoal === 'LOSE_WEIGHT') {
    supplements.push({
      name: 'KyoSlim',
      dosage: 'As directed',
      timing: 'With main meals',
      reason: 'Supports metabolic health during fat loss phase',
    });
  }

  if (input.primaryGoal === 'GAIN_MUSCLE' || input.primaryGoal === 'PERFORMANCE') {
    supplements.push({
      name: 'CreaPrime Creatine',
      dosage: '5g daily',
      timing: 'Any time, with water',
      reason: 'Supports strength, power output, and muscle recovery',
    });
  }

  return { supplements };
}

// ============================================
// Main Plan Generation Function
// ============================================

export function generateInitialPlan(
  input: OnboardingInput,
  dailyCalories: number,
  protein: number,
  carbs: number,
  fat: number,
): {
  nutritionPlan: NutritionPlan;
  trainingPlan: TrainingPlan;
  supplementPlan: SupplementPlan;
  derivedSignals: DerivedSignals;
  rulesFired: RuleFired[];
  guardrailsApplied: GuardrailApplied[];
} {
  const rulesFired: RuleFired[] = [];
  const guardrailsApplied: GuardrailApplied[] = [];

  // Track rules fired
  rulesFired.push({
    ruleId: 'INIT_001',
    ruleName: 'Initial Plan Generation',
    reasonCode: 'ONBOARDING_COMPLETE',
    impact: 'Generated first nutrition and training plan',
    priority: 1,
  });

  // Determine meals per day
  let mealsPerDay: number;
  switch (input.mealsPerDay) {
    case '5':
      mealsPerDay = 5;
      break;
    case '4':
      mealsPerDay = 4;
      break;
    case '3':
    default:
      mealsPerDay = 3;
  }

  // Build meal slots
  const mealSlots: MealSlot[] = [];

  mealSlots.push({
    mealType: 'breakfast',
    timing: '7:00 - 9:00 AM',
    options: buildBreakfastOptions(input.excludedFoods, input.carbSources),
    portionGuidance: `Aim for ~${Math.round(dailyCalories / mealsPerDay)} kcal`,
  });

  mealSlots.push({
    mealType: 'lunch',
    timing: '12:00 - 2:00 PM',
    options: buildLunchOptions(input.excludedFoods, input.carbSources),
    portionGuidance: `Aim for ~${Math.round(dailyCalories / mealsPerDay)} kcal`,
  });

  mealSlots.push({
    mealType: 'dinner',
    timing: '6:00 - 8:00 PM',
    options: buildDinnerOptions(input.excludedFoods, input.carbSources),
    portionGuidance: `Aim for ~${Math.round(dailyCalories / mealsPerDay)} kcal`,
  });

  // Add snacks if needed
  if (mealsPerDay >= 4) {
    mealSlots.push({
      mealType: 'snack',
      timing: '3:00 - 4:00 PM',
      options: buildSnackOptions(input.excludedFoods),
      portionGuidance: '150-200 kcal',
    });
  }

  if (mealsPerDay >= 5) {
    mealSlots.push({
      mealType: 'snack',
      timing: '9:00 - 10:00 PM (optional)',
      options: buildSnackOptions(input.excludedFoods),
      portionGuidance: '100-150 kcal',
    });
  }

  // Determine flexibility level
  let flexibilityLevel: 'strict' | 'balanced' | 'flexible';
  switch (input.planStructure) {
    case 'disciplined':
      flexibilityLevel = 'strict';
      break;
    case 'flexible':
      flexibilityLevel = 'flexible';
      break;
    default:
      flexibilityLevel = 'balanced';
  }

  // Build nutrition plan
  const nutritionPlan: NutritionPlan = {
    guidelines: generateGuidelines(input),
    mealsPerDay,
    mealSlots,
    dailyTargets: {
      calories: dailyCalories,
      protein,
      carbs,
      fat,
    },
    flexibilityLevel,
    flexibilityRules: generateFlexibilityRules(input),
  };

  // Build training plan
  const trainingPlan = generateTrainingPlan(input);

  // Build supplement plan
  const supplementPlan = generateSupplementPlan(input);

  // Initial derived signals (baseline)
  const derivedSignals: DerivedSignals = {
    weightTrend: 'stable',
    weightTrendPercent: 0,
    confidenceScore: 100, // Full confidence at start
    adherenceQuality: 'excellent',
    recoveryRisk: 'low',
    recoveryFactors: [],
    plateauDetected: false,
    recompDetected: false,
    metabolicStress: 'low',
  };

  // Apply guardrails
  // Minimum calorie floor
  if (dailyCalories < 1200) {
    guardrailsApplied.push({
      guardrailId: 'GUARD_001',
      name: 'Minimum Calorie Floor',
      action: 'clamped',
      originalValue: dailyCalories,
      clampedValue: 1200,
      reason: 'Calories cannot go below 1200 for safety',
    });
  }

  // Maximum protein cap
  const maxProtein = input.weightKg * 2.5;
  if (protein > maxProtein) {
    guardrailsApplied.push({
      guardrailId: 'GUARD_002',
      name: 'Maximum Protein Cap',
      action: 'clamped',
      originalValue: protein,
      clampedValue: Math.round(maxProtein),
      reason: 'Protein capped at 2.5g/kg bodyweight',
    });
  }

  return {
    nutritionPlan,
    trainingPlan,
    supplementPlan,
    derivedSignals,
    rulesFired,
    guardrailsApplied,
  };
}

export { ENGINE_VERSION, RULE_PACK_VERSION };
