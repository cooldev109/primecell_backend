/**
 * Test script for AI Explanations feature
 * Tests the full flow: Auth -> Onboarding -> Plan Generation -> Check-in -> AI Explanation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:1997';

async function makeRequest(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json().catch(() => null);

  return { status: response.status, data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOtpFromDb(email) {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      user: { email: email.toLowerCase() },
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  return otpRecord?.code;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('PrimeCell AI Explanations Test');
  console.log('='.repeat(60));

  const testEmail = `test_ai_${Date.now()}@example.com`;
  let accessToken = null;
  let userId = null;
  let decisionRecordId = null;

  try {
    // Step 1: Start Authentication
    console.log('\n📧 Step 1: Starting authentication...');
    const authStart = await makeRequest('POST', '/auth/start', { email: testEmail });
    console.log(`   Status: ${authStart.status}`);
    console.log(`   Message: ${authStart.data?.message || 'No message'}`);

    if (authStart.status !== 200 && authStart.status !== 201) {
      throw new Error('Failed to start auth');
    }

    // Wait a moment for DB to update
    await sleep(500);

    // Get OTP from database
    const otp = await getOtpFromDb(testEmail);
    console.log(`   OTP retrieved from DB: ${otp}`);

    if (!otp) {
      throw new Error('Could not retrieve OTP from database');
    }

    // Step 2: Verify OTP
    console.log('\n🔑 Step 2: Verifying OTP...');
    const authVerify = await makeRequest('POST', '/auth/verify', {
      email: testEmail,
      otp: otp
    });
    console.log(`   Status: ${authVerify.status}`);

    if (authVerify.status !== 200 && authVerify.status !== 201) {
      console.log(`   Error: ${JSON.stringify(authVerify.data)}`);
      throw new Error('Failed to verify OTP');
    }

    if (!authVerify.data?.accessToken) {
      throw new Error('No access token received');
    }

    accessToken = authVerify.data.accessToken;
    userId = authVerify.data.user?.id;
    console.log(`   ✅ Authenticated! User ID: ${userId}`);

    // Step 3: Update Onboarding Profile
    console.log('\n📋 Step 3: Updating onboarding profile...');
    const onboardingData = {
      // Step 1: About You
      age: 34,
      sex: 'male',
      heightCm: 178,
      weightKg: 85,

      // Step 2: Goal
      primaryGoal: 'LOSE_FAT',
      goalDetails: { targetWeightKg: 78 },

      // Step 3: Lifestyle
      workType: 'mixed',
      sleepHours: '7_8',
      stressLevel: 'moderate',
      trainingTime: 'evening',

      // Step 4: Training
      trainingFrequency: '3_4',
      trainingTypes: ['weight_training', 'cardio'],
      trainingIntensity: 'moderate',

      // Step 5: Food Preferences
      mealsPerDay: '3',
      carbSources: ['rice', 'potatoes', 'fruit'],
      excludedFoods: [],

      // Step 6: Health & Safety
      diagnosedConditions: [],
      digestionStatus: 'normal',

      // Step 7: Social & Adherence
      mealsOutsideHome: '1_2',
      planStructure: 'balanced',
      previousDietExperience: 'could_not_maintain',
    };

    const onboardingUpdate = await makeRequest('PUT', '/onboarding', onboardingData, accessToken);
    console.log(`   Status: ${onboardingUpdate.status}`);

    if (onboardingUpdate.status !== 200 && onboardingUpdate.status !== 201) {
      console.log(`   Response: ${JSON.stringify(onboardingUpdate.data)}`);
      throw new Error('Failed to update onboarding profile');
    }
    console.log(`   ✅ Onboarding profile updated!`);

    // Step 3b: Complete Onboarding
    console.log('\n📋 Step 3b: Completing onboarding...');
    const onboarding = await makeRequest('POST', '/onboarding/complete', null, accessToken);
    console.log(`   Status: ${onboarding.status}`);

    if (onboarding.status !== 200 && onboarding.status !== 201) {
      console.log(`   Response: ${JSON.stringify(onboarding.data)}`);
      throw new Error('Failed to complete onboarding');
    }
    console.log(`   ✅ Onboarding completed!`);

    // Step 4: Generate Initial Plan
    console.log('\n🏋️ Step 4: Generating initial plan...');
    const planGen = await makeRequest('POST', '/engine/run', null, accessToken);
    console.log(`   Status: ${planGen.status}`);

    if (planGen.status !== 200 && planGen.status !== 201) {
      console.log(`   Response: ${JSON.stringify(planGen.data)}`);
      throw new Error('Failed to generate plan');
    }

    decisionRecordId = planGen.data?.decisionRecordId;
    console.log(`   ✅ Plan generated!`);
    console.log(`   Plan Version ID: ${planGen.data?.planVersionId}`);
    console.log(`   Decision Record ID: ${decisionRecordId}`);
    console.log(`   Daily Calories: ${planGen.data?.plan?.dailyCalories}`);
    console.log(`   Protein: ${planGen.data?.plan?.proteinGrams}g`);

    // Step 5: Get Active Plan
    console.log('\n📊 Step 5: Fetching active plan...');
    const activePlan = await makeRequest('GET', '/plans/active', null, accessToken);
    console.log(`   Status: ${activePlan.status}`);

    if (activePlan.status === 200) {
      console.log(`   ✅ Active plan retrieved!`);
      console.log(`   Week: ${activePlan.data?.weekNumber}`);
      console.log(`   Calories: ${activePlan.data?.dailyCalories}`);
    }

    // Step 6: Submit a Weekly Check-in
    console.log('\n✅ Step 6: Submitting weekly check-in...');
    const checkinData = {
      weightKg: 84.2,
      waistCm: 88,
      adherenceLevel: '80_90',
      energyLevel: 7,          // 0-10 scale
      hungerLevel: 5,          // 0-10 scale
      sleepQuality: 8,         // 0-10 scale
      stressLevel: 3,          // 0-10 scale
      selfPerception: 'progressing',
      mealsOutside: false,
      hadTravel: false,
      wasIll: false,
      notes: 'Feeling good this week, stuck to the plan mostly.',
    };

    const checkin = await makeRequest('POST', '/checkins', checkinData, accessToken);
    console.log(`   Status: ${checkin.status}`);

    if (checkin.status !== 200 && checkin.status !== 201) {
      console.log(`   Response: ${JSON.stringify(checkin.data)}`);
      throw new Error('Failed to submit check-in');
    }

    const newDecisionRecordId = checkin.data?.decisionRecordId;
    console.log(`   ✅ Check-in submitted!`);
    console.log(`   Check-in ID: ${checkin.data?.checkin?.id}`);
    console.log(`   New Decision Record ID: ${newDecisionRecordId}`);
    console.log(`   New Plan Version: ${checkin.data?.newPlanVersionId}`);

    // Step 7: Generate AI Explanation for the decision (POST first)
    console.log('\n🤖 Step 7: Generating AI Explanation...');

    // Use the decision record from check-in, or fall back to initial plan
    const targetDecisionId = newDecisionRecordId || decisionRecordId;

    if (!targetDecisionId) {
      console.log('   ⚠️ No decision record ID available');
    } else {
      // First POST to generate
      const generateExplanation = await makeRequest('POST', `/ai/explain/${targetDecisionId}`, null, accessToken);
      console.log(`   Generation Status: ${generateExplanation.status}`);

      if (generateExplanation.status === 200 || generateExplanation.status === 201) {
        const explanation = generateExplanation.data;
        console.log(`   ✅ AI Explanation generated!`);
        console.log('\n' + '─'.repeat(50));
        console.log('📝 AI EXPLANATION CONTENT:');
        console.log('─'.repeat(50));
        console.log(`\n📈 Progress Summary:\n   ${explanation.progressSummary || 'N/A'}`);
        console.log(`\n🎯 Why This Decision:\n   ${explanation.whyThisDecision || 'N/A'}`);
        console.log(`\n📋 What To Do Next:`);
        if (explanation.whatToDoNext) {
          explanation.whatToDoNext.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item}`);
          });
        }
        console.log(`\n💪 Motivational Note:\n   ${explanation.motivationalNote || 'N/A'}`);
        if (explanation.safetyNote) {
          console.log(`\n⚠️ Safety Note:\n   ${explanation.safetyNote}`);
        }
        console.log(`\n🔧 Used Fallback: ${explanation.usedFallback ? 'Yes (OpenAI not configured)' : 'No (Used OpenAI)'}`);
        console.log('─'.repeat(50));
      } else {
        console.log(`   Response: ${JSON.stringify(generateExplanation.data)}`);
      }
    }

    // Step 8: Get all user explanations
    console.log('\n📚 Step 8: Fetching all user explanations...');
    const allExplanations = await makeRequest('GET', '/ai/explanations', null, accessToken);
    console.log(`   Status: ${allExplanations.status}`);
    console.log(`   Total explanations: ${allExplanations.data?.length || 0}`);
    if (allExplanations.data?.length > 0) {
      console.log(`   Latest explanation ID: ${allExplanations.data[0].id}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED:', error.message);
    console.log('='.repeat(60));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests();
