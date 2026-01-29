import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed Meal Templates
  await seedMealTemplates();

  // Seed Training Programs
  await seedTrainingPrograms();

  console.log('\n✅ Database seed completed!');
}

async function seedMealTemplates() {
  console.log('📦 Seeding meal templates...');

  const mealTemplates = [
    // ============================================
    // BREAKFAST OPTIONS
    // ============================================
    {
      name: 'Protein Scramble',
      description: 'Fluffy scrambled eggs with spinach and cherry tomatoes',
      mealType: 'breakfast',
      calories: 320,
      proteinG: 21,
      carbsG: 8,
      fatG: 24,
      tags: ['high_protein', 'low_carb', 'quick', 'keto_friendly'],
      excludedFor: ['eggs'],
      ingredients: [
        { name: 'Eggs', amount: '3', unit: 'whole' },
        { name: 'Spinach', amount: '1', unit: 'cup' },
        { name: 'Cherry tomatoes', amount: '0.5', unit: 'cup' },
        { name: 'Olive oil', amount: '1', unit: 'tsp' },
        { name: 'Salt and pepper', amount: 'to taste', unit: '' },
      ],
      instructions: '1. Heat olive oil in a pan over medium heat. 2. Whisk eggs and pour into pan. 3. Add spinach and tomatoes. 4. Scramble until eggs are cooked through. 5. Season and serve.',
      prepTimeMin: 5,
      cookTimeMin: 8,
      servingSize: '1 plate',
      servingsCount: 1,
    },
    {
      name: 'Protein Oatmeal Bowl',
      description: 'Creamy oats with protein powder, banana, and almond butter',
      mealType: 'breakfast',
      calories: 420,
      proteinG: 32,
      carbsG: 48,
      fatG: 14,
      tags: ['high_protein', 'balanced', 'meal_prep_friendly'],
      excludedFor: ['gluten', 'nuts'],
      ingredients: [
        { name: 'Rolled oats', amount: '0.5', unit: 'cup' },
        { name: 'Protein powder', amount: '1', unit: 'scoop' },
        { name: 'Banana', amount: '0.5', unit: 'medium' },
        { name: 'Almond butter', amount: '1', unit: 'tbsp' },
        { name: 'Water or milk', amount: '1', unit: 'cup' },
      ],
      instructions: '1. Cook oats with water/milk. 2. Let cool slightly, then stir in protein powder. 3. Top with sliced banana and almond butter.',
      prepTimeMin: 2,
      cookTimeMin: 5,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Greek Yogurt Parfait',
      description: 'High-protein Greek yogurt layered with berries and granola',
      mealType: 'breakfast',
      calories: 340,
      proteinG: 28,
      carbsG: 35,
      fatG: 10,
      tags: ['high_protein', 'quick', 'no_cooking'],
      excludedFor: ['dairy', 'gluten'],
      ingredients: [
        { name: 'Greek yogurt (0% fat)', amount: '200', unit: 'g' },
        { name: 'Mixed berries', amount: '0.5', unit: 'cup' },
        { name: 'Low-sugar granola', amount: '0.25', unit: 'cup' },
        { name: 'Honey', amount: '1', unit: 'tsp' },
      ],
      instructions: '1. Layer yogurt in a glass or bowl. 2. Add berries. 3. Top with granola and drizzle honey.',
      prepTimeMin: 3,
      cookTimeMin: 0,
      servingSize: '1 parfait',
      servingsCount: 1,
    },
    {
      name: 'Avocado Toast with Eggs',
      description: 'Whole grain toast topped with smashed avocado and poached eggs',
      mealType: 'breakfast',
      calories: 380,
      proteinG: 18,
      carbsG: 28,
      fatG: 24,
      tags: ['balanced', 'whole_food'],
      excludedFor: ['eggs', 'gluten'],
      ingredients: [
        { name: 'Whole grain bread', amount: '2', unit: 'slices' },
        { name: 'Avocado', amount: '0.5', unit: 'medium' },
        { name: 'Eggs', amount: '2', unit: 'whole' },
        { name: 'Red pepper flakes', amount: 'pinch', unit: '' },
        { name: 'Lemon juice', amount: '1', unit: 'tsp' },
      ],
      instructions: '1. Toast bread. 2. Mash avocado with lemon juice and seasoning. 3. Poach or fry eggs. 4. Spread avocado on toast, top with eggs.',
      prepTimeMin: 5,
      cookTimeMin: 8,
      servingSize: '2 slices',
      servingsCount: 1,
    },
    {
      name: 'Smoothie Bowl',
      description: 'Thick protein smoothie topped with fresh fruits and seeds',
      mealType: 'breakfast',
      calories: 350,
      proteinG: 28,
      carbsG: 40,
      fatG: 8,
      tags: ['high_protein', 'dairy_free', 'refreshing'],
      excludedFor: [],
      ingredients: [
        { name: 'Protein powder', amount: '1', unit: 'scoop' },
        { name: 'Frozen mixed berries', amount: '1', unit: 'cup' },
        { name: 'Banana (frozen)', amount: '0.5', unit: 'medium' },
        { name: 'Almond milk', amount: '0.5', unit: 'cup' },
        { name: 'Chia seeds', amount: '1', unit: 'tbsp' },
      ],
      instructions: '1. Blend protein, berries, banana, and milk until thick. 2. Pour into bowl. 3. Top with fresh fruit and chia seeds.',
      prepTimeMin: 5,
      cookTimeMin: 0,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Cottage Cheese Pancakes',
      description: 'High-protein pancakes made with cottage cheese and oats',
      mealType: 'breakfast',
      calories: 380,
      proteinG: 32,
      carbsG: 35,
      fatG: 12,
      tags: ['high_protein', 'meal_prep_friendly'],
      excludedFor: ['dairy', 'gluten', 'eggs'],
      ingredients: [
        { name: 'Cottage cheese', amount: '150', unit: 'g' },
        { name: 'Oats', amount: '0.5', unit: 'cup' },
        { name: 'Eggs', amount: '2', unit: 'whole' },
        { name: 'Vanilla extract', amount: '0.5', unit: 'tsp' },
        { name: 'Maple syrup', amount: '1', unit: 'tbsp' },
      ],
      instructions: '1. Blend cottage cheese, oats, eggs, and vanilla. 2. Cook pancakes on medium heat. 3. Serve with maple syrup.',
      prepTimeMin: 5,
      cookTimeMin: 10,
      servingSize: '3 pancakes',
      servingsCount: 1,
    },

    // ============================================
    // LUNCH OPTIONS
    // ============================================
    {
      name: 'Grilled Chicken & Brown Rice',
      description: 'Classic lean protein with brown rice and steamed broccoli',
      mealType: 'lunch',
      calories: 480,
      proteinG: 42,
      carbsG: 45,
      fatG: 14,
      tags: ['high_protein', 'meal_prep_friendly', 'whole_food'],
      excludedFor: ['poultry'],
      ingredients: [
        { name: 'Chicken breast', amount: '150', unit: 'g' },
        { name: 'Brown rice (cooked)', amount: '1', unit: 'cup' },
        { name: 'Broccoli', amount: '1', unit: 'cup' },
        { name: 'Olive oil', amount: '1', unit: 'tbsp' },
        { name: 'Garlic powder', amount: '0.5', unit: 'tsp' },
      ],
      instructions: '1. Season chicken with garlic powder, salt, pepper. 2. Grill or pan-fry until cooked through. 3. Steam broccoli. 4. Serve with rice.',
      prepTimeMin: 10,
      cookTimeMin: 20,
      servingSize: '1 plate',
      servingsCount: 1,
    },
    {
      name: 'Salmon & Sweet Potato',
      description: 'Omega-3 rich salmon with roasted sweet potato and asparagus',
      mealType: 'lunch',
      calories: 520,
      proteinG: 38,
      carbsG: 40,
      fatG: 22,
      tags: ['high_protein', 'omega_3', 'whole_food'],
      excludedFor: ['fish'],
      ingredients: [
        { name: 'Salmon fillet', amount: '150', unit: 'g' },
        { name: 'Sweet potato', amount: '150', unit: 'g' },
        { name: 'Asparagus', amount: '6', unit: 'spears' },
        { name: 'Olive oil', amount: '1', unit: 'tbsp' },
        { name: 'Lemon', amount: '0.5', unit: 'whole' },
      ],
      instructions: '1. Cube sweet potato and roast at 200°C for 25 min. 2. Pan-sear salmon 4 min each side. 3. Grill asparagus. 4. Serve with lemon.',
      prepTimeMin: 10,
      cookTimeMin: 30,
      servingSize: '1 plate',
      servingsCount: 1,
    },
    {
      name: 'Turkey & Quinoa Bowl',
      description: 'Lean ground turkey with quinoa, black beans, and veggies',
      mealType: 'lunch',
      calories: 490,
      proteinG: 40,
      carbsG: 48,
      fatG: 14,
      tags: ['high_protein', 'high_fiber', 'meal_prep_friendly'],
      excludedFor: ['poultry'],
      ingredients: [
        { name: 'Ground turkey (lean)', amount: '150', unit: 'g' },
        { name: 'Quinoa (cooked)', amount: '0.75', unit: 'cup' },
        { name: 'Black beans', amount: '0.5', unit: 'cup' },
        { name: 'Bell peppers', amount: '0.5', unit: 'cup' },
        { name: 'Cumin and paprika', amount: '1', unit: 'tsp each' },
      ],
      instructions: '1. Cook turkey with spices until browned. 2. Add beans and peppers, cook 5 min. 3. Serve over quinoa.',
      prepTimeMin: 10,
      cookTimeMin: 15,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Chickpea Buddha Bowl',
      description: 'Plant-based protein bowl with roasted chickpeas and tahini',
      mealType: 'lunch',
      calories: 450,
      proteinG: 18,
      carbsG: 55,
      fatG: 18,
      tags: ['vegetarian', 'vegan', 'high_fiber'],
      excludedFor: [],
      ingredients: [
        { name: 'Chickpeas (canned)', amount: '1', unit: 'cup' },
        { name: 'Quinoa (cooked)', amount: '0.5', unit: 'cup' },
        { name: 'Mixed greens', amount: '2', unit: 'cups' },
        { name: 'Cucumber', amount: '0.5', unit: 'cup' },
        { name: 'Tahini dressing', amount: '2', unit: 'tbsp' },
      ],
      instructions: '1. Roast chickpeas with spices at 200°C for 20 min. 2. Arrange greens, quinoa, cucumber in bowl. 3. Top with chickpeas and tahini.',
      prepTimeMin: 10,
      cookTimeMin: 20,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Lean Beef Stir-Fry',
      description: 'Quick beef strips with colorful vegetables and rice noodles',
      mealType: 'lunch',
      calories: 480,
      proteinG: 38,
      carbsG: 42,
      fatG: 18,
      tags: ['high_protein', 'quick'],
      excludedFor: ['red_meat', 'gluten'],
      ingredients: [
        { name: 'Lean beef strips', amount: '150', unit: 'g' },
        { name: 'Mixed bell peppers', amount: '1', unit: 'cup' },
        { name: 'Rice noodles', amount: '100', unit: 'g' },
        { name: 'Soy sauce (low sodium)', amount: '2', unit: 'tbsp' },
        { name: 'Ginger (fresh)', amount: '1', unit: 'tsp' },
      ],
      instructions: '1. Cook rice noodles per package. 2. Stir-fry beef with ginger 3 min. 3. Add peppers, cook 3 min. 4. Add soy sauce and noodles, toss.',
      prepTimeMin: 10,
      cookTimeMin: 12,
      servingSize: '1 plate',
      servingsCount: 1,
    },
    {
      name: 'Tuna Salad Wrap',
      description: 'Light tuna salad in a whole wheat wrap with fresh veggies',
      mealType: 'lunch',
      calories: 380,
      proteinG: 32,
      carbsG: 35,
      fatG: 12,
      tags: ['high_protein', 'quick', 'portable'],
      excludedFor: ['fish', 'gluten'],
      ingredients: [
        { name: 'Canned tuna (in water)', amount: '1', unit: 'can (140g)' },
        { name: 'Whole wheat wrap', amount: '1', unit: 'large' },
        { name: 'Greek yogurt', amount: '2', unit: 'tbsp' },
        { name: 'Lettuce', amount: '1', unit: 'cup' },
        { name: 'Tomato', amount: '0.5', unit: 'medium' },
      ],
      instructions: '1. Mix tuna with Greek yogurt (instead of mayo). 2. Spread on wrap. 3. Add lettuce, tomato. 4. Roll and serve.',
      prepTimeMin: 8,
      cookTimeMin: 0,
      servingSize: '1 wrap',
      servingsCount: 1,
    },

    // ============================================
    // DINNER OPTIONS
    // ============================================
    {
      name: 'Herb-Roasted Chicken Thighs',
      description: 'Juicy chicken thighs with roasted Mediterranean vegetables',
      mealType: 'dinner',
      calories: 450,
      proteinG: 38,
      carbsG: 22,
      fatG: 24,
      tags: ['high_protein', 'whole_food', 'family_friendly'],
      excludedFor: ['poultry'],
      ingredients: [
        { name: 'Chicken thighs (bone-in)', amount: '180', unit: 'g' },
        { name: 'Zucchini', amount: '1', unit: 'medium' },
        { name: 'Bell peppers', amount: '1', unit: 'medium' },
        { name: 'Olive oil', amount: '1', unit: 'tbsp' },
        { name: 'Fresh rosemary and thyme', amount: '2', unit: 'tbsp' },
      ],
      instructions: '1. Season chicken with herbs, salt, pepper. 2. Chop veggies, toss with oil. 3. Roast together at 200°C for 35 min.',
      prepTimeMin: 15,
      cookTimeMin: 35,
      servingSize: '1 portion',
      servingsCount: 1,
    },
    {
      name: 'Baked Cod with Potatoes',
      description: 'Flaky white fish with crispy baby potatoes and green beans',
      mealType: 'dinner',
      calories: 420,
      proteinG: 35,
      carbsG: 38,
      fatG: 14,
      tags: ['high_protein', 'light', 'whole_food'],
      excludedFor: ['fish'],
      ingredients: [
        { name: 'Cod fillet', amount: '180', unit: 'g' },
        { name: 'Baby potatoes', amount: '150', unit: 'g' },
        { name: 'Green beans', amount: '1', unit: 'cup' },
        { name: 'Butter', amount: '1', unit: 'tbsp' },
        { name: 'Lemon and dill', amount: 'to taste', unit: '' },
      ],
      instructions: '1. Halve potatoes, roast at 200°C for 20 min. 2. Season cod, bake 12-15 min. 3. Steam green beans. 4. Serve with lemon butter.',
      prepTimeMin: 10,
      cookTimeMin: 25,
      servingSize: '1 plate',
      servingsCount: 1,
    },
    {
      name: 'Tofu & Vegetable Curry',
      description: 'Creamy coconut curry with crispy tofu and mixed vegetables',
      mealType: 'dinner',
      calories: 440,
      proteinG: 22,
      carbsG: 38,
      fatG: 24,
      tags: ['vegetarian', 'vegan', 'dairy_free'],
      excludedFor: [],
      ingredients: [
        { name: 'Firm tofu', amount: '200', unit: 'g' },
        { name: 'Coconut curry paste', amount: '2', unit: 'tbsp' },
        { name: 'Coconut milk (light)', amount: '0.5', unit: 'cup' },
        { name: 'Mixed vegetables', amount: '2', unit: 'cups' },
        { name: 'Basmati rice', amount: '0.5', unit: 'cup (cooked)' },
      ],
      instructions: '1. Press and cube tofu, pan-fry until golden. 2. Sauté vegetables with curry paste. 3. Add coconut milk, simmer 10 min. 4. Add tofu, serve over rice.',
      prepTimeMin: 15,
      cookTimeMin: 20,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Lean Beef Meatballs',
      description: 'Homemade meatballs with marinara sauce over zucchini noodles',
      mealType: 'dinner',
      calories: 420,
      proteinG: 36,
      carbsG: 18,
      fatG: 24,
      tags: ['high_protein', 'low_carb', 'family_friendly'],
      excludedFor: ['red_meat', 'eggs'],
      ingredients: [
        { name: 'Lean ground beef', amount: '150', unit: 'g' },
        { name: 'Egg', amount: '1', unit: 'whole' },
        { name: 'Zucchini (spiralized)', amount: '2', unit: 'medium' },
        { name: 'Marinara sauce', amount: '0.5', unit: 'cup' },
        { name: 'Italian herbs', amount: '1', unit: 'tsp' },
      ],
      instructions: '1. Mix beef, egg, herbs. Form meatballs. 2. Bake at 200°C for 20 min. 3. Spiralize zucchini, sauté briefly. 4. Top with meatballs and marinara.',
      prepTimeMin: 15,
      cookTimeMin: 20,
      servingSize: '1 plate',
      servingsCount: 1,
    },
    {
      name: 'Shrimp & Vegetable Skewers',
      description: 'Grilled shrimp skewers with colorful vegetables and quinoa',
      mealType: 'dinner',
      calories: 380,
      proteinG: 32,
      carbsG: 35,
      fatG: 12,
      tags: ['high_protein', 'light', 'quick'],
      excludedFor: ['shellfish'],
      ingredients: [
        { name: 'Large shrimp', amount: '150', unit: 'g' },
        { name: 'Bell peppers', amount: '1', unit: 'cup' },
        { name: 'Red onion', amount: '0.5', unit: 'medium' },
        { name: 'Quinoa (cooked)', amount: '0.75', unit: 'cup' },
        { name: 'Lemon garlic marinade', amount: '2', unit: 'tbsp' },
      ],
      instructions: '1. Marinate shrimp 15 min. 2. Thread shrimp and veggies on skewers. 3. Grill 3 min per side. 4. Serve over quinoa.',
      prepTimeMin: 20,
      cookTimeMin: 8,
      servingSize: '2 skewers + quinoa',
      servingsCount: 1,
    },
    {
      name: 'Stuffed Bell Peppers',
      description: 'Bell peppers filled with lean turkey, rice, and cheese',
      mealType: 'dinner',
      calories: 450,
      proteinG: 35,
      carbsG: 38,
      fatG: 18,
      tags: ['high_protein', 'meal_prep_friendly', 'family_friendly'],
      excludedFor: ['poultry', 'dairy'],
      ingredients: [
        { name: 'Bell peppers', amount: '2', unit: 'large' },
        { name: 'Ground turkey', amount: '150', unit: 'g' },
        { name: 'Brown rice (cooked)', amount: '0.5', unit: 'cup' },
        { name: 'Diced tomatoes', amount: '0.5', unit: 'cup' },
        { name: 'Shredded cheese', amount: '0.25', unit: 'cup' },
      ],
      instructions: '1. Cut tops off peppers, remove seeds. 2. Cook turkey with tomatoes and spices. 3. Mix in rice, stuff peppers. 4. Top with cheese, bake 25 min at 180°C.',
      prepTimeMin: 15,
      cookTimeMin: 30,
      servingSize: '2 peppers',
      servingsCount: 1,
    },

    // ============================================
    // SNACK OPTIONS
    // ============================================
    {
      name: 'Protein Shake',
      description: 'Quick and easy protein shake with water or almond milk',
      mealType: 'snack',
      calories: 130,
      proteinG: 25,
      carbsG: 4,
      fatG: 2,
      tags: ['high_protein', 'quick', 'portable', 'post_workout'],
      excludedFor: [],
      ingredients: [
        { name: 'Protein powder', amount: '1', unit: 'scoop' },
        { name: 'Water or almond milk', amount: '300', unit: 'ml' },
      ],
      instructions: 'Shake or blend protein powder with liquid until smooth.',
      prepTimeMin: 1,
      cookTimeMin: 0,
      servingSize: '1 shake',
      servingsCount: 1,
    },
    {
      name: 'Cottage Cheese & Fruit',
      description: 'Creamy cottage cheese with fresh pineapple chunks',
      mealType: 'snack',
      calories: 180,
      proteinG: 20,
      carbsG: 18,
      fatG: 4,
      tags: ['high_protein', 'quick', 'no_cooking'],
      excludedFor: ['dairy'],
      ingredients: [
        { name: 'Low-fat cottage cheese', amount: '150', unit: 'g' },
        { name: 'Pineapple chunks', amount: '0.5', unit: 'cup' },
      ],
      instructions: 'Mix cottage cheese with pineapple and enjoy.',
      prepTimeMin: 2,
      cookTimeMin: 0,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Mixed Nuts & Seeds',
      description: 'Heart-healthy mix of almonds, walnuts, and pumpkin seeds',
      mealType: 'snack',
      calories: 200,
      proteinG: 7,
      carbsG: 8,
      fatG: 18,
      tags: ['healthy_fats', 'portable', 'no_cooking'],
      excludedFor: ['nuts'],
      ingredients: [
        { name: 'Almonds', amount: '10', unit: 'pieces' },
        { name: 'Walnuts', amount: '5', unit: 'halves' },
        { name: 'Pumpkin seeds', amount: '1', unit: 'tbsp' },
      ],
      instructions: 'Portion out nuts and seeds. Enjoy as is or lightly toast.',
      prepTimeMin: 1,
      cookTimeMin: 0,
      servingSize: '1 handful',
      servingsCount: 1,
    },
    {
      name: 'Greek Yogurt & Berries',
      description: 'Thick Greek yogurt topped with fresh mixed berries',
      mealType: 'snack',
      calories: 160,
      proteinG: 18,
      carbsG: 15,
      fatG: 3,
      tags: ['high_protein', 'quick', 'no_cooking'],
      excludedFor: ['dairy'],
      ingredients: [
        { name: 'Greek yogurt (0% fat)', amount: '150', unit: 'g' },
        { name: 'Mixed berries', amount: '0.5', unit: 'cup' },
      ],
      instructions: 'Top yogurt with berries. Add a drizzle of honey if desired.',
      prepTimeMin: 2,
      cookTimeMin: 0,
      servingSize: '1 bowl',
      servingsCount: 1,
    },
    {
      name: 'Hummus & Veggie Sticks',
      description: 'Creamy hummus with crunchy carrot and cucumber sticks',
      mealType: 'snack',
      calories: 150,
      proteinG: 6,
      carbsG: 18,
      fatG: 7,
      tags: ['vegetarian', 'vegan', 'high_fiber'],
      excludedFor: [],
      ingredients: [
        { name: 'Hummus', amount: '3', unit: 'tbsp' },
        { name: 'Carrots', amount: '1', unit: 'medium' },
        { name: 'Cucumber', amount: '0.5', unit: 'medium' },
      ],
      instructions: 'Cut vegetables into sticks. Serve with hummus for dipping.',
      prepTimeMin: 5,
      cookTimeMin: 0,
      servingSize: '1 portion',
      servingsCount: 1,
    },
    {
      name: 'Hard-Boiled Eggs',
      description: 'Simple and portable high-protein snack',
      mealType: 'snack',
      calories: 140,
      proteinG: 12,
      carbsG: 1,
      fatG: 10,
      tags: ['high_protein', 'portable', 'meal_prep_friendly', 'keto_friendly'],
      excludedFor: ['eggs'],
      ingredients: [
        { name: 'Eggs', amount: '2', unit: 'large' },
        { name: 'Salt and pepper', amount: 'to taste', unit: '' },
      ],
      instructions: '1. Boil eggs for 10-12 minutes. 2. Cool in ice water. 3. Peel and season.',
      prepTimeMin: 2,
      cookTimeMin: 12,
      servingSize: '2 eggs',
      servingsCount: 1,
    },
    {
      name: 'Rice Cakes with Nut Butter',
      description: 'Light rice cakes topped with almond butter and banana',
      mealType: 'snack',
      calories: 180,
      proteinG: 5,
      carbsG: 25,
      fatG: 8,
      tags: ['quick', 'portable'],
      excludedFor: ['nuts'],
      ingredients: [
        { name: 'Rice cakes', amount: '2', unit: 'pieces' },
        { name: 'Almond butter', amount: '1', unit: 'tbsp' },
        { name: 'Banana slices', amount: '0.5', unit: 'medium' },
      ],
      instructions: 'Spread almond butter on rice cakes. Top with banana slices.',
      prepTimeMin: 2,
      cookTimeMin: 0,
      servingSize: '2 rice cakes',
      servingsCount: 1,
    },
    {
      name: 'Beef Jerky',
      description: 'Lean, high-protein portable snack',
      mealType: 'snack',
      calories: 120,
      proteinG: 20,
      carbsG: 4,
      fatG: 2,
      tags: ['high_protein', 'portable', 'no_cooking'],
      excludedFor: ['red_meat'],
      ingredients: [
        { name: 'Beef jerky (low sodium)', amount: '40', unit: 'g' },
      ],
      instructions: 'Enjoy as is. Look for brands with minimal added sugar.',
      prepTimeMin: 0,
      cookTimeMin: 0,
      servingSize: '1 portion',
      servingsCount: 1,
    },
  ];

  for (const template of mealTemplates) {
    await prisma.mealTemplate.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template,
      },
      update: template,
    });
  }

  console.log(`  ✅ Seeded ${mealTemplates.length} meal templates`);
}

async function seedTrainingPrograms() {
  console.log('💪 Seeding training programs...');

  const trainingPrograms = [
    // ============================================
    // BEGINNER PROGRAMS
    // ============================================
    {
      name: 'Full Body Basics',
      description: 'Perfect for beginners. 3 days per week full body workouts focusing on fundamental movements.',
      daysPerWeek: 3,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 8,
      suitableFor: ['weight_training', 'home_workouts'],
      equipmentNeeded: ['dumbbells', 'bodyweight'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'Full Body A',
            exercises: [
              { name: 'Goblet Squat', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Dumbbell Row', sets: 3, reps: '10-12 each', rest: '90s' },
              { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '60s' },
              { name: 'Plank', sets: 3, reps: '30-45s', rest: '60s' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Rest or Light Cardio',
            exercises: [
              { name: 'Walking', sets: 1, reps: '20-30 min', rest: '' },
              { name: 'Stretching', sets: 1, reps: '10 min', rest: '' },
            ],
          },
          {
            dayNumber: 3,
            focus: 'Full Body B',
            exercises: [
              { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Push-ups', sets: 3, reps: '8-12', rest: '60s' },
              { name: 'Lat Pulldown or Pull-up', sets: 3, reps: '8-12', rest: '90s' },
              { name: 'Lunges', sets: 3, reps: '10 each leg', rest: '60s' },
              { name: 'Dead Bug', sets: 3, reps: '10 each side', rest: '60s' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Add 1 rep per set when you hit the top of rep range',
        intensityIncrement: 'Increase weight by 2.5-5kg when you can complete all sets at top of rep range',
        deloadFrequency: 'Every 4 weeks, reduce weight by 20% for recovery',
      },
    },
    {
      name: 'Home Bodyweight Program',
      description: 'No equipment needed. Build strength and fitness using just your bodyweight.',
      daysPerWeek: 4,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 8,
      suitableFor: ['home_workouts', 'bodyweight'],
      equipmentNeeded: ['bodyweight'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'Push',
            exercises: [
              { name: 'Push-ups', sets: 4, reps: '8-15', rest: '60s' },
              { name: 'Pike Push-ups', sets: 3, reps: '8-12', rest: '60s' },
              { name: 'Diamond Push-ups', sets: 3, reps: '6-10', rest: '60s' },
              { name: 'Tricep Dips (chair)', sets: 3, reps: '10-15', rest: '60s' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Pull & Core',
            exercises: [
              { name: 'Inverted Rows (table)', sets: 4, reps: '8-12', rest: '60s' },
              { name: 'Superman Hold', sets: 3, reps: '15-20', rest: '45s' },
              { name: 'Plank', sets: 3, reps: '30-60s', rest: '60s' },
              { name: 'Mountain Climbers', sets: 3, reps: '20 each', rest: '45s' },
            ],
          },
          {
            dayNumber: 3,
            focus: 'Rest',
            exercises: [
              { name: 'Light stretching', sets: 1, reps: '10-15 min', rest: '' },
            ],
          },
          {
            dayNumber: 4,
            focus: 'Legs',
            exercises: [
              { name: 'Bodyweight Squats', sets: 4, reps: '15-20', rest: '60s' },
              { name: 'Lunges', sets: 3, reps: '12 each leg', rest: '60s' },
              { name: 'Glute Bridges', sets: 3, reps: '15-20', rest: '45s' },
              { name: 'Calf Raises', sets: 3, reps: '20-25', rest: '45s' },
              { name: 'Wall Sit', sets: 3, reps: '30-45s', rest: '60s' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Add 2 reps when you can complete all sets at top of range',
        intensityIncrement: 'Progress to harder variations (e.g., elevated push-ups)',
        deloadFrequency: 'Every 4 weeks, reduce volume by 40%',
      },
    },

    // ============================================
    // INTERMEDIATE PROGRAMS
    // ============================================
    {
      name: 'Upper/Lower Split',
      description: 'Classic 4-day split. Upper body and lower body on alternating days for balanced development.',
      daysPerWeek: 4,
      programType: 'hypertrophy',
      difficultyLevel: 'intermediate',
      durationWeeks: 10,
      suitableFor: ['weight_training'],
      equipmentNeeded: ['barbell', 'dumbbells', 'machines'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'Upper Body (Strength)',
            exercises: [
              { name: 'Barbell Bench Press', sets: 4, reps: '5-6', rest: '3min' },
              { name: 'Barbell Row', sets: 4, reps: '5-6', rest: '3min' },
              { name: 'Overhead Press', sets: 3, reps: '6-8', rest: '2min' },
              { name: 'Pull-ups', sets: 3, reps: '6-10', rest: '2min' },
              { name: 'Face Pulls', sets: 3, reps: '12-15', rest: '60s' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Lower Body (Strength)',
            exercises: [
              { name: 'Barbell Squat', sets: 4, reps: '5-6', rest: '3min' },
              { name: 'Romanian Deadlift', sets: 4, reps: '6-8', rest: '3min' },
              { name: 'Leg Press', sets: 3, reps: '8-10', rest: '2min' },
              { name: 'Leg Curl', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Calf Raises', sets: 4, reps: '12-15', rest: '60s' },
            ],
          },
          {
            dayNumber: 3,
            focus: 'Rest or Active Recovery',
            exercises: [
              { name: 'Light cardio', sets: 1, reps: '20-30 min', rest: '' },
              { name: 'Mobility work', sets: 1, reps: '10 min', rest: '' },
            ],
          },
          {
            dayNumber: 4,
            focus: 'Upper Body (Hypertrophy)',
            exercises: [
              { name: 'Incline Dumbbell Press', sets: 4, reps: '8-12', rest: '90s' },
              { name: 'Cable Row', sets: 4, reps: '10-12', rest: '90s' },
              { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Bicep Curls', sets: 3, reps: '10-12', rest: '60s' },
              { name: 'Tricep Pushdowns', sets: 3, reps: '10-12', rest: '60s' },
            ],
          },
          {
            dayNumber: 5,
            focus: 'Lower Body (Hypertrophy)',
            exercises: [
              { name: 'Front Squat or Hack Squat', sets: 4, reps: '8-10', rest: '2min' },
              { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: '90s' },
              { name: 'Leg Extension', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Glute Ham Raise', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Standing Calf Raise', sets: 4, reps: '15-20', rest: '60s' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Add 1 set to main lifts every 2 weeks (up to 5 sets)',
        intensityIncrement: 'Increase weight by 2.5kg on upper lifts, 5kg on lower lifts when hitting top of rep range',
        deloadFrequency: 'Every 5 weeks, reduce volume by 40% and intensity by 10%',
      },
    },
    {
      name: 'Push/Pull/Legs',
      description: 'Popular 6-day split for maximum training frequency. Great for muscle building.',
      daysPerWeek: 6,
      programType: 'hypertrophy',
      difficultyLevel: 'intermediate',
      durationWeeks: 12,
      suitableFor: ['weight_training'],
      equipmentNeeded: ['barbell', 'dumbbells', 'machines', 'cables'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'Push (Chest, Shoulders, Triceps)',
            exercises: [
              { name: 'Bench Press', sets: 4, reps: '6-8', rest: '3min' },
              { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rest: '2min' },
              { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '2min' },
              { name: 'Lateral Raise', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Tricep Dips', sets: 3, reps: '8-12', rest: '90s' },
              { name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', rest: '60s' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Pull (Back, Biceps, Rear Delts)',
            exercises: [
              { name: 'Deadlift', sets: 4, reps: '5-6', rest: '3min' },
              { name: 'Pull-ups or Lat Pulldown', sets: 4, reps: '6-10', rest: '2min' },
              { name: 'Barbell Row', sets: 3, reps: '8-10', rest: '2min' },
              { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '60s' },
              { name: 'Barbell Curl', sets: 3, reps: '8-10', rest: '60s' },
              { name: 'Hammer Curls', sets: 3, reps: '10-12', rest: '60s' },
            ],
          },
          {
            dayNumber: 3,
            focus: 'Legs (Quads, Hamstrings, Glutes, Calves)',
            exercises: [
              { name: 'Barbell Squat', sets: 4, reps: '6-8', rest: '3min' },
              { name: 'Romanian Deadlift', sets: 3, reps: '8-10', rest: '2min' },
              { name: 'Leg Press', sets: 3, reps: '10-12', rest: '2min' },
              { name: 'Walking Lunges', sets: 3, reps: '10 each', rest: '90s' },
              { name: 'Leg Curl', sets: 3, reps: '10-12', rest: '60s' },
              { name: 'Standing Calf Raise', sets: 4, reps: '12-15', rest: '60s' },
            ],
          },
          {
            dayNumber: 4,
            focus: 'Push (Volume)',
            exercises: [
              { name: 'Dumbbell Bench Press', sets: 4, reps: '8-12', rest: '90s' },
              { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Arnold Press', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Cable Lateral Raise', sets: 3, reps: '15-20', rest: '45s' },
              { name: 'Close Grip Bench Press', sets: 3, reps: '8-10', rest: '90s' },
            ],
          },
          {
            dayNumber: 5,
            focus: 'Pull (Volume)',
            exercises: [
              { name: 'Chest Supported Row', sets: 4, reps: '10-12', rest: '90s' },
              { name: 'Lat Pulldown (close grip)', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Cable Row', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Rear Delt Flyes', sets: 3, reps: '15-20', rest: '45s' },
              { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', rest: '60s' },
            ],
          },
          {
            dayNumber: 6,
            focus: 'Legs (Volume)',
            exercises: [
              { name: 'Front Squat', sets: 4, reps: '8-10', rest: '2min' },
              { name: 'Bulgarian Split Squat', sets: 3, reps: '10 each', rest: '90s' },
              { name: 'Leg Extension', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Lying Leg Curl', sets: 3, reps: '12-15', rest: '60s' },
              { name: 'Hip Thrust', sets: 3, reps: '10-12', rest: '90s' },
              { name: 'Seated Calf Raise', sets: 4, reps: '15-20', rest: '45s' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Add 1 rep per week until you hit top of range, then add weight',
        intensityIncrement: 'Increase weight by smallest increment when all reps achieved for 2 sessions',
        deloadFrequency: 'Every 6 weeks, reduce volume by 50%',
      },
    },

    // ============================================
    // ADVANCED PROGRAMS
    // ============================================
    {
      name: 'Strength Focus 5x5',
      description: 'Classic strength program focusing on heavy compound lifts. 3 days per week.',
      daysPerWeek: 3,
      programType: 'strength',
      difficultyLevel: 'advanced',
      durationWeeks: 12,
      suitableFor: ['weight_training'],
      equipmentNeeded: ['barbell', 'power_rack', 'bench'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'Workout A',
            exercises: [
              { name: 'Barbell Squat', sets: 5, reps: '5', rest: '3-5min' },
              { name: 'Bench Press', sets: 5, reps: '5', rest: '3-5min' },
              { name: 'Barbell Row', sets: 5, reps: '5', rest: '3-5min' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Rest',
            exercises: [],
          },
          {
            dayNumber: 3,
            focus: 'Workout B',
            exercises: [
              { name: 'Barbell Squat', sets: 5, reps: '5', rest: '3-5min' },
              { name: 'Overhead Press', sets: 5, reps: '5', rest: '3-5min' },
              { name: 'Deadlift', sets: 1, reps: '5', rest: '5min' },
            ],
          },
          {
            dayNumber: 4,
            focus: 'Rest',
            exercises: [],
          },
          {
            dayNumber: 5,
            focus: 'Workout A',
            exercises: [
              { name: 'Barbell Squat', sets: 5, reps: '5', rest: '3-5min' },
              { name: 'Bench Press', sets: 5, reps: '5', rest: '3-5min' },
              { name: 'Barbell Row', sets: 5, reps: '5', rest: '3-5min' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Keep sets/reps constant',
        intensityIncrement: 'Add 2.5kg to upper body lifts, 5kg to lower body lifts every session',
        deloadFrequency: 'When you fail a weight 3 times, deload 10% and work back up',
      },
    },

    // ============================================
    // CARDIO & CONDITIONING
    // ============================================
    {
      name: 'HIIT Conditioning',
      description: 'High-intensity interval training for fat loss and cardiovascular fitness.',
      daysPerWeek: 3,
      programType: 'endurance',
      difficultyLevel: 'intermediate',
      durationWeeks: 8,
      suitableFor: ['hiit', 'cardio', 'home_workouts'],
      equipmentNeeded: ['bodyweight'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'HIIT Circuit A',
            exercises: [
              { name: 'Burpees', sets: 4, reps: '30s work / 30s rest', rest: '' },
              { name: 'Mountain Climbers', sets: 4, reps: '30s work / 30s rest', rest: '' },
              { name: 'Jump Squats', sets: 4, reps: '30s work / 30s rest', rest: '' },
              { name: 'High Knees', sets: 4, reps: '30s work / 30s rest', rest: '' },
              { name: 'Plank Jacks', sets: 4, reps: '30s work / 30s rest', rest: '' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Active Recovery',
            exercises: [
              { name: 'Light walking', sets: 1, reps: '30 min', rest: '' },
              { name: 'Stretching', sets: 1, reps: '15 min', rest: '' },
            ],
          },
          {
            dayNumber: 3,
            focus: 'HIIT Circuit B',
            exercises: [
              { name: 'Box Jumps (or step-ups)', sets: 5, reps: '20s work / 40s rest', rest: '' },
              { name: 'Push-ups', sets: 5, reps: '20s work / 40s rest', rest: '' },
              { name: 'Jumping Lunges', sets: 5, reps: '20s work / 40s rest', rest: '' },
              { name: 'Bicycle Crunches', sets: 5, reps: '20s work / 40s rest', rest: '' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Add 1 round every 2 weeks',
        intensityIncrement: 'Increase work:rest ratio (e.g., 35s:25s, then 40s:20s)',
        deloadFrequency: 'Every 4 weeks, reduce to 2 sessions with lower intensity',
      },
    },
    {
      name: 'Walking for Fat Loss',
      description: 'Simple walking program for beginners. Low impact, sustainable fat loss.',
      daysPerWeek: 5,
      programType: 'endurance',
      difficultyLevel: 'beginner',
      durationWeeks: 8,
      suitableFor: ['walking', 'cardio'],
      equipmentNeeded: ['none'],
      weeklySchedule: {
        days: [
          {
            dayNumber: 1,
            focus: 'Moderate Walk',
            exercises: [
              { name: 'Brisk Walking', sets: 1, reps: '30-40 min', rest: '' },
            ],
          },
          {
            dayNumber: 2,
            focus: 'Interval Walk',
            exercises: [
              { name: 'Walk (alternate 2 min fast / 2 min slow)', sets: 1, reps: '25-35 min', rest: '' },
            ],
          },
          {
            dayNumber: 3,
            focus: 'Rest or Light Stretching',
            exercises: [],
          },
          {
            dayNumber: 4,
            focus: 'Long Walk',
            exercises: [
              { name: 'Steady Walking', sets: 1, reps: '45-60 min', rest: '' },
            ],
          },
          {
            dayNumber: 5,
            focus: 'Moderate Walk',
            exercises: [
              { name: 'Brisk Walking', sets: 1, reps: '30-40 min', rest: '' },
            ],
          },
        ],
      },
      progressionRules: {
        volumeIncrement: 'Add 5 minutes per session every week',
        intensityIncrement: 'Increase pace or add incline when comfortable',
        deloadFrequency: 'Every 4 weeks, reduce duration by 20%',
      },
    },
  ];

  for (const program of trainingPrograms) {
    await prisma.trainingProgram.upsert({
      where: { id: program.name.toLowerCase().replace(/\s+/g, '-') },
      create: {
        id: program.name.toLowerCase().replace(/\s+/g, '-'),
        ...program,
      },
      update: program,
    });
  }

  console.log(`  ✅ Seeded ${trainingPrograms.length} training programs`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
