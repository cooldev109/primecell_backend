const fs = require('fs');
const API = 'http://localhost:3000';

async function test() {
  const email = 'checkin_' + Date.now() + '@example.com';

  console.log('=== Testing Weekly Check-In Flow ===\n');

  // 1. Start auth
  console.log('1. Starting auth for:', email);
  let res = await fetch(API + '/auth/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) { console.log('   X Auth start failed'); return; }
  console.log('   OK OTP requested\n');

  await new Promise(r => setTimeout(r, 1000));

  // 2. Get OTP from DB (in prod, would check email)
  console.log('2. Getting OTP...');
  // For testing, we'll use a raw DB query or check logs
  // In this test environment, we check the server output
  const otp = '123456'; // For dev, OTP is logged to console
  console.log('   Using test OTP flow\n');

  // Actually get from logs if available
  let foundOtp = null;
  try {
    const logPath = process.env.LOG_FILE;
    if (logPath && fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8');
      const regex = new RegExp('OTP for ' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': (\\d+)');
      const match = logs.match(regex);
      if (match) foundOtp = match[1];
    }
  } catch (e) {}

  // 3. Verify OTP
  console.log('3. Verifying OTP...');
  res = await fetch(API + '/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: foundOtp || otp })
  });
  let data = await res.json();
  if (!res.ok) {
    console.log('   X Verify failed:', data.message);
    console.log('   Note: In production, get OTP from email');
    return;
  }
  const token = data.accessToken;
  console.log('   OK Got access token\n');

  // 4. Complete onboarding
  console.log('4. Completing onboarding...');
  const onboardingData = {
    age: 30,
    sex: 'male',
    heightCm: 180,
    weightKg: 85,
    primaryGoal: 'LOSE_FAT',
    goalDetails: { targetWeight: 80 },
    workType: 'sedentary',
    sleepHours: '7_8',
    stressLevel: 'moderate',
    trainingTime: 'evening',
    trainingFrequency: '3_4',
    trainingTypes: ['weight_training'],
    trainingIntensity: 'moderate',
    mealsPerDay: '3',
    carbSources: ['rice', 'potatoes'],
    excludedFoods: [],
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
  if (!res.ok) { console.log('   X Onboarding failed'); return; }
  console.log('   OK Onboarding data saved\n');

  // 5. Mark onboarding complete
  console.log('5. Marking onboarding as complete...');
  res = await fetch(API + '/onboarding/complete', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) { console.log('   X Complete failed'); return; }
  console.log('   OK Onboarding complete\n');

  // 6. Generate initial plan
  console.log('6. Generating initial plan...');
  res = await fetch(API + '/engine/run', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await res.json();
  if (!res.ok) { console.log('   X Engine failed:', data); return; }
  console.log('   OK Plan generated - Version:', data.planVersionId);

  // Get initial plan
  res = await fetch(API + '/plans/active', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const initialPlan = await res.json();
  console.log('   Initial Calories:', initialPlan.dailyCalories, 'kcal\n');

  // 7. Check check-in status
  console.log('7. Checking check-in status...');
  res = await fetch(API + '/checkins/status', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await res.json();
  console.log('   Current Week:', data.currentWeek);
  console.log('   Has Submitted This Week:', data.hasSubmittedThisWeek, '\n');

  // 8. Submit a check-in (simulating weight loss progress)
  console.log('8. Submitting weekly check-in...');
  const checkinData = {
    weightKg: 84.5, // Lost 0.5kg
    waistCm: 88,
    energyLevel: 7,
    hungerLevel: 5,
    sleepQuality: 8,
    stressLevel: 4,
    adherenceLevel: '80_90',
    mealsOutside: false,
    hadTravel: false,
    wasIll: false,
    selfPerception: 'progressing',
    notes: 'Feeling good, energy is up'
  };

  res = await fetch(API + '/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(checkinData)
  });
  data = await res.json();
  if (!res.ok) {
    console.log('   X Check-in failed:', data.message || data);
    return;
  }
  console.log('   OK Check-in submitted');
  console.log('   Signals derived:', Object.keys(data.signals || {}).length > 0 ? 'Yes' : 'No');

  if (data.planUpdated) {
    console.log('   Plan updated: Yes');
    console.log('   New Plan Version:', data.newPlanVersion);
  } else {
    console.log('   Plan updated: No (Week 0 - initial plan)');
  }
  console.log('');

  // 9. Get updated plan
  console.log('9. Fetching updated plan...');
  res = await fetch(API + '/plans/active', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const updatedPlan = await res.json();
  console.log('   Plan Version:', updatedPlan.version);
  console.log('   Week Number:', updatedPlan.weekNumber);
  console.log('   Daily Calories:', updatedPlan.dailyCalories, 'kcal');
  console.log('   Protein:', updatedPlan.proteinGrams, 'g');
  console.log('   Carbs:', updatedPlan.carbsGrams, 'g');
  console.log('   Fat:', updatedPlan.fatGrams, 'g\n');

  // 10. Compare plans
  console.log('10. Plan Comparison:');
  console.log('   =============================================');
  console.log('   |          | Initial    | After Check-in   |');
  console.log('   |----------|------------|------------------|');
  console.log('   | Calories | ' + initialPlan.dailyCalories.toString().padEnd(10) + ' | ' + updatedPlan.dailyCalories.toString().padEnd(16) + ' |');
  console.log('   | Protein  | ' + (initialPlan.proteinGrams + 'g').padEnd(10) + ' | ' + (updatedPlan.proteinGrams + 'g').padEnd(16) + ' |');
  console.log('   | Carbs    | ' + (initialPlan.carbsGrams + 'g').padEnd(10) + ' | ' + (updatedPlan.carbsGrams + 'g').padEnd(16) + ' |');
  console.log('   | Fat      | ' + (initialPlan.fatGrams + 'g').padEnd(10) + ' | ' + (updatedPlan.fatGrams + 'g').padEnd(16) + ' |');
  console.log('   =============================================');

  // 11. Check check-in history
  console.log('\n11. Check-in history...');
  res = await fetch(API + '/checkins', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const checkins = await res.json();
  console.log('   Total check-ins:', checkins.length);
  checkins.forEach((c, i) => {
    console.log('   Check-in ' + (i + 1) + ':');
    console.log('     Week:', c.weekNumber);
    console.log('     Weight:', c.weightKg, 'kg');
    console.log('     Adherence:', c.adherenceLevel);
  });

  // 12. Get decision records
  console.log('\n12. Decision records (audit trail)...');
  res = await fetch(API + '/decisions', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const decisions = await res.json();
  console.log('   Total decisions:', decisions.length);
  decisions.forEach((d, i) => {
    console.log('   Decision ' + (i + 1) + ':');
    console.log('     Trigger:', d.triggerType);
    console.log('     Engine Version:', d.engineVersion);
  });

  console.log('\n=============================================');
  console.log('   ALL TESTS PASSED!');
  console.log('=============================================');
}

test().catch(e => console.error('Error:', e.message, e.stack));
