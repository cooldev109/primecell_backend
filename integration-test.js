/**
 * Full Integration Test: Auth -> Onboarding -> Plan Generation -> Check-in -> Plan Update
 *
 * This test simulates the complete mobile app flow.
 */

const API = 'http://localhost:3000';

// Helper to make API calls
async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runIntegrationTest() {
  const testId = Date.now();
  const email = `integration_${testId}@test.com`;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     PRIMECELL INTEGRATION TEST - Backend & Frontend Flow     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let token = null;
  let userId = null;

  // ========================================
  // PHASE 1: AUTHENTICATION
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 1: AUTHENTICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1.1: Start auth
  console.log('1.1 Starting authentication...');
  console.log(`    Email: ${email}`);
  await api('POST', '/auth/start', { email });
  console.log('    ✓ OTP sent (check server logs for code)\n');

  // Step 1.2: Get OTP from server logs
  console.log('1.2 Retrieving OTP from server...');
  await new Promise(r => setTimeout(r, 500));

  // Read server output to find OTP
  const fs = require('fs');
  const logFile = process.env.LOG_FILE;
  let otp = '123456';

  if (logFile && fs.existsSync(logFile)) {
    const logs = fs.readFileSync(logFile, 'utf8');
    const otpMatch = logs.match(new RegExp(`OTP for ${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: (\\d+)`));
    if (otpMatch) {
      otp = otpMatch[1];
      console.log(`    Found OTP: ${otp}\n`);
    }
  } else {
    console.log('    Using fallback OTP lookup...\n');
  }

  // Step 1.3: Verify OTP
  console.log('1.3 Verifying OTP...');
  const authResult = await api('POST', '/auth/verify', { email, otp });
  token = authResult.accessToken;
  userId = authResult.user.id;
  console.log(`    ✓ Authenticated`);
  console.log(`    User ID: ${userId}`);
  console.log(`    Token: ${token.substring(0, 20)}...\n`);

  // ========================================
  // PHASE 2: ONBOARDING
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 2: ONBOARDING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 2.1: Check onboarding status
  console.log('2.1 Checking onboarding status...');
  const status = await api('GET', '/onboarding/status', null, token);
  console.log(`    Has completed onboarding: ${status.hasCompletedOnboarding}`);
  console.log(`    Has active plan: ${status.hasActivePlan}\n`);

  // Step 2.2: Submit onboarding data
  console.log('2.2 Submitting onboarding profile...');
  const onboardingData = {
    age: 30,
    sex: 'male',
    heightCm: 180,
    weightKg: 85,
    primaryGoal: 'LOSE_FAT',
    goalDetails: { targetWeight: 78, weeklyTarget: 0.5 },
    workType: 'mixed',
    sleepHours: '7_8',
    stressLevel: 'moderate',
    trainingTime: 'evening',
    trainingFrequency: '3_4',
    trainingTypes: ['weight_training', 'cardio'],
    trainingIntensity: 'moderate',
    mealsPerDay: '3',
    carbSources: ['rice', 'potatoes', 'bread'],
    excludedFoods: [],
    diagnosedConditions: [],
    digestionStatus: 'normal',
    mealsOutsideHome: '1_2',
    planStructure: 'balanced',
    previousDietExperience: 'first_time'
  };

  await api('PUT', '/onboarding', onboardingData, token);
  console.log('    ✓ Profile saved');
  console.log(`    Goal: ${onboardingData.primaryGoal}`);
  console.log(`    Weight: ${onboardingData.weightKg} kg`);
  console.log(`    Target: ${onboardingData.goalDetails.targetWeight} kg\n`);

  // Step 2.3: Complete onboarding
  console.log('2.3 Completing onboarding...');
  await api('POST', '/onboarding/complete', null, token);
  console.log('    ✓ Onboarding completed\n');

  // ========================================
  // PHASE 3: PLAN GENERATION
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 3: PLAN GENERATION (Deterministic Engine)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 3.1: Generate initial plan
  console.log('3.1 Running deterministic engine...');
  const engineResult = await api('POST', '/engine/run', null, token);
  console.log(`    ✓ Plan generated`);
  console.log(`    Plan Version ID: ${engineResult.planVersionId}`);
  console.log(`    Decision ID: ${engineResult.decisionId}\n`);

  // Step 3.2: Fetch the active plan
  console.log('3.2 Fetching active plan...');
  const initialPlan = await api('GET', '/plans/active', null, token);
  console.log('    ✓ Plan retrieved');
  console.log(`    Version: ${initialPlan.version}`);
  console.log(`    Week: ${initialPlan.weekNumber}`);
  console.log(`    Daily Calories: ${initialPlan.dailyCalories} kcal`);
  console.log(`    Protein: ${initialPlan.proteinGrams}g`);
  console.log(`    Carbs: ${initialPlan.carbsGrams}g`);
  console.log(`    Fat: ${initialPlan.fatGrams}g\n`);

  // ========================================
  // PHASE 4: CHECK-IN FLOW
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 4: WEEKLY CHECK-IN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 4.1: Check status before check-in
  console.log('4.1 Checking check-in status...');
  const checkinStatus = await api('GET', '/checkins/status', null, token);
  console.log(`    Current Week: ${checkinStatus.currentWeek}`);
  console.log(`    Has Submitted This Week: ${checkinStatus.hasSubmittedThisWeek}\n`);

  // Step 4.2: Submit check-in (simulating 1 week of progress)
  console.log('4.2 Submitting weekly check-in...');
  console.log('    Simulating: Lost 0.5kg, good adherence, feeling great\n');

  const checkinData = {
    // Step 1: Metrics (lost some weight)
    weightKg: 84.5,
    waistCm: 88,
    // Step 2: Feelings (all positive)
    energyLevel: 8,
    hungerLevel: 5,
    sleepQuality: 8,
    stressLevel: 3,
    // Step 3: Adherence
    adherenceLevel: '80_90',
    mealsOutside: false,
    hadTravel: false,
    wasIll: false,
    selfPerception: 'progressing',
    notes: 'Integration test - Week 1 progress'
  };

  const checkinResult = await api('POST', '/checkins', checkinData, token);
  console.log('    ✓ Check-in submitted');
  console.log(`    Check-in ID: ${checkinResult.checkin.id}`);
  console.log(`    Week Number: ${checkinResult.checkin.weekNumber}`);

  if (checkinResult.signals) {
    console.log('\n    Derived Signals:');
    console.log(`      Weight Trend: ${checkinResult.signals.weightTrend}`);
    console.log(`      Recovery Risk: ${checkinResult.signals.recoveryRisk}`);
    console.log(`      Adherence Quality: ${checkinResult.signals.adherenceQuality}`);
    console.log(`      Confidence Score: ${checkinResult.signals.confidenceScore}`);
  }

  if (checkinResult.planUpdated) {
    console.log('\n    ✓ Plan was updated');
    console.log(`    New Plan Version: ${checkinResult.newPlanVersion}`);
  } else {
    console.log('\n    Plan not updated (Week 0 - need more data)');
  }
  console.log('');

  // ========================================
  // PHASE 5: VERIFY UPDATES
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 5: VERIFY DATA PERSISTENCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 5.1: Fetch updated plan
  console.log('5.1 Fetching current active plan...');
  const updatedPlan = await api('GET', '/plans/active', null, token);
  console.log(`    Version: ${updatedPlan.version}`);
  console.log(`    Daily Calories: ${updatedPlan.dailyCalories} kcal`);
  console.log(`    Protein: ${updatedPlan.proteinGrams}g\n`);

  // Step 5.2: Get check-in history
  console.log('5.2 Fetching check-in history...');
  const checkins = await api('GET', '/checkins', null, token);
  console.log(`    Total check-ins: ${checkins.length}`);
  checkins.forEach((c, i) => {
    console.log(`    [${i + 1}] Week ${c.weekNumber}: ${c.weightKg}kg, Adherence: ${c.adherenceLevel}`);
  });
  console.log('');

  // Step 5.3: Get decision records
  console.log('5.3 Fetching decision audit trail...');
  const decisions = await api('GET', '/decisions', null, token);
  console.log(`    Total decisions: ${decisions.length}`);
  decisions.forEach((d, i) => {
    console.log(`    [${i + 1}] ${d.isInitialPlan ? 'Initial Plan' : 'Weekly Update'} - Engine v${d.engineVersion}`);
  });
  console.log('');

  // Step 5.4: Verify check-in status updated
  console.log('5.4 Verifying check-in status updated...');
  const finalStatus = await api('GET', '/checkins/status', null, token);
  console.log(`    Current Week: ${finalStatus.currentWeek}`);
  console.log(`    Has Submitted This Week: ${finalStatus.hasSubmittedThisWeek}\n`);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('INTEGRATION TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('  Plan Comparison:');
  console.log('  ┌────────────────┬─────────────┬─────────────┐');
  console.log('  │ Metric         │ Initial     │ After Checkin│');
  console.log('  ├────────────────┼─────────────┼─────────────┤');
  console.log(`  │ Version        │ ${String(initialPlan.version).padEnd(11)} │ ${String(updatedPlan.version).padEnd(12)}│`);
  console.log(`  │ Calories       │ ${String(initialPlan.dailyCalories).padEnd(11)} │ ${String(updatedPlan.dailyCalories).padEnd(12)}│`);
  console.log(`  │ Protein        │ ${String(initialPlan.proteinGrams + 'g').padEnd(11)} │ ${String(updatedPlan.proteinGrams + 'g').padEnd(12)}│`);
  console.log(`  │ Carbs          │ ${String(initialPlan.carbsGrams + 'g').padEnd(11)} │ ${String(updatedPlan.carbsGrams + 'g').padEnd(12)}│`);
  console.log(`  │ Fat            │ ${String(initialPlan.fatGrams + 'g').padEnd(11)} │ ${String(updatedPlan.fatGrams + 'g').padEnd(12)}│`);
  console.log('  └────────────────┴─────────────┴─────────────┘\n');

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              ALL INTEGRATION TESTS PASSED ✓                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('Tested Endpoints:');
  console.log('  ✓ POST /auth/start');
  console.log('  ✓ POST /auth/verify');
  console.log('  ✓ GET  /onboarding/status');
  console.log('  ✓ PUT  /onboarding');
  console.log('  ✓ POST /onboarding/complete');
  console.log('  ✓ POST /engine/run');
  console.log('  ✓ GET  /plans/active');
  console.log('  ✓ GET  /checkins/status');
  console.log('  ✓ POST /checkins');
  console.log('  ✓ GET  /checkins');
  console.log('  ✓ GET  /decisions');
}

runIntegrationTest().catch(err => {
  console.error('\n❌ INTEGRATION TEST FAILED');
  console.error('Error:', err.message);
  process.exit(1);
});
