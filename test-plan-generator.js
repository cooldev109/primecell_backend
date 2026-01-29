const fs = require('fs');
const API = 'http://localhost:3000';
const LOG_FILE = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\claude\\e--Workspace-Fitness\\tasks\\bb2fe5a.output';

async function test() {
  const email = 'plantest_' + Date.now() + '@example.com';

  console.log('=== Testing Plan Generator (Full Flow) ===\n');

  // 1. Start auth
  console.log('1. Starting auth for:', email);
  let res = await fetch(API + '/auth/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) { console.log('   X Auth start failed'); return; }
  console.log('   OK OTP requested\n');

  // Wait a bit for the OTP to be stored
  await new Promise(r => setTimeout(r, 1000));

  // 2. Get OTP from log file
  console.log('2. Getting OTP from server logs...');
  const logs = fs.readFileSync(LOG_FILE, 'utf8');
  const regex = new RegExp('OTP for ' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': (\\d+)');
  const match = logs.match(regex);
  if (!match) { console.log('   X Could not find OTP in logs'); return; }
  const otp = match[1];
  console.log('   OK Found OTP:', otp, '\n');

  // 3. Verify OTP
  console.log('3. Verifying OTP...');
  res = await fetch(API + '/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  let data = await res.json();
  if (!res.ok) { console.log('   X Verify failed:', data); return; }
  const token = data.accessToken;
  console.log('   OK Got access token\n');

  // 4. Complete onboarding
  console.log('4. Completing onboarding...');
  const onboardingData = {
    age: 30,
    sex: 'male',
    heightCm: 180,
    weightKg: 80,
    primaryGoal: 'GAIN_MUSCLE',
    goalDetails: { targetWeight: 85 },
    workType: 'mixed',
    sleepHours: '7_8',
    stressLevel: 'moderate',
    trainingTime: 'morning',
    trainingFrequency: '3_4',
    trainingTypes: ['weight_training'],
    trainingIntensity: 'moderate',
    mealsPerDay: '4',
    carbSources: ['rice', 'potatoes'],
    excludedFoods: ['gluten'],
    diagnosedConditions: [],
    digestionStatus: 'normal',
    mealsOutsideHome: '1_2',
    planStructure: 'balanced',
    previousDietExperience: 'first_time'
  };

  res = await fetch(API + '/onboarding', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(onboardingData)
  });
  data = await res.json();
  if (!res.ok) { console.log('   X Onboarding failed:', data); return; }
  console.log('   OK Onboarding complete\n');

  // 5. Mark onboarding complete
  console.log('5. Marking onboarding as complete...');
  res = await fetch(API + '/onboarding/complete', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await res.json();
  if (!res.ok) { console.log('   X Complete failed:', data); return; }
  console.log('   OK Onboarding marked complete\n');

  // 6. Generate plan
  console.log('6. Generating plan (running engine)...');
  res = await fetch(API + '/engine/run', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await res.json();
  if (!res.ok) { console.log('   X Engine failed:', data); return; }
  console.log('   OK Plan generated');
  console.log('   Plan Version ID:', data.planVersionId);
  console.log('   Decision Record ID:', data.decisionRecordId, '\n');

  // 7. Get active plan
  console.log('7. Fetching active plan...');
  res = await fetch(API + '/plans/active', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await res.json();
  if (!res.ok) { console.log('   X Get plan failed:', data); return; }

  console.log('   OK Got active plan\n');
  console.log('   =============================================');
  console.log('   |           GENERATED PLAN                  |');
  console.log('   =============================================');
  console.log('   | Daily Calories: ' + data.dailyCalories + ' kcal');
  console.log('   |---------------------------------------------|');
  console.log('   | MACROS:');
  console.log('   |   Protein: ' + data.proteinGrams + 'g');
  console.log('   |   Carbs:   ' + data.carbsGrams + 'g');
  console.log('   |   Fat:     ' + data.fatGrams + 'g');
  console.log('   |---------------------------------------------|');
  console.log('   | NUTRITION PLAN:');
  const nutrition = data.nutritionPlan;
  console.log('   |   Meals per day: ' + nutrition.mealsPerDay);
  console.log('   |   Flexibility: ' + nutrition.flexibilityLevel);
  console.log('   |   Meal Slots:');
  nutrition.mealSlots.forEach((slot) => {
    console.log('   |     - ' + slot.mealType.toUpperCase() + ' (' + slot.timing + ')');
    console.log('   |       ' + slot.options.length + ' meal options');
  });
  console.log('   |---------------------------------------------|');
  console.log('   | TRAINING PLAN:');
  const training = data.trainingPlan;
  console.log('   |   Program: ' + training.programName);
  console.log('   |   Days/week: ' + training.daysPerWeek);
  console.log('   |   Schedule:');
  if (training.schedule) {
    training.schedule.forEach((s) => {
      console.log('   |     Day ' + s.day + ': ' + s.focus);
    });
  }
  console.log('   |---------------------------------------------|');
  console.log('   | SUPPLEMENTS:');
  const supplements = data.supplementPlan;
  if (supplements.supplements) {
    supplements.supplements.forEach((s) => {
      console.log('   |   - ' + s.name);
      console.log('   |     ' + s.dosage + ', ' + s.timing);
    });
  }
  console.log('   =============================================');

  // 8. Get decision record
  console.log('\n8. Fetching decision record (audit trail)...');
  res = await fetch(API + '/decisions', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await res.json();
  if (!res.ok) { console.log('   X Get decisions failed:', data); return; }

  const decision = data[0];
  console.log('   OK Decision Record:');
  console.log('   Engine Version:', decision.engineVersion);
  console.log('   Rule Pack Version:', decision.rulePackVersion);

  // Get full decision details
  res = await fetch(API + '/decisions/' + decision.id, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const fullDecision = await res.json();
  console.log('   Rules Fired:');
  if (fullDecision.rulesFired) {
    fullDecision.rulesFired.forEach(r => {
      if (typeof r === 'object') {
        console.log('     - ' + r.ruleName + ' (' + r.ruleId + ')');
      } else {
        console.log('     - ' + r);
      }
    });
  }

  console.log('\n=============================================');
  console.log('   ALL TESTS PASSED!');
  console.log('=============================================');
}

test().catch(e => console.error('Error:', e.message, e.stack));
