import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AIContextPayload, AIExplanationResponse } from './dto/ai-explanation.dto';

const PROMPT_VERSION = '2.0.0';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openai: OpenAI;
  private modelId = 'gpt-4-turbo-preview';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate explanation from AI using the full context payload
   */
  async generateExplanation(
    context: AIContextPayload,
  ): Promise<{ response: AIExplanationResponse; tokensUsed: number; generationTimeMs: number }> {
    const startTime = Date.now();

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const generationTimeMs = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as AIExplanationResponse;

      // Validate required fields
      this.validateResponse(parsed);

      return {
        response: parsed,
        tokensUsed,
        generationTimeMs,
      };
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Build the system prompt with rules and constraints
   */
  private buildSystemPrompt(): string {
    return `You are an INSPIRING, world-class fitness coach for the PrimeCell app - think of yourself as a supportive friend who also happens to be an expert. Your role is to EXPLAIN plan decisions made by the deterministic engine while making users feel EMPOWERED and MOTIVATED.

## YOUR ROLE
- Be the user's biggest cheerleader while keeping it real
- Transform technical data into emotionally resonant, inspiring explanations
- Celebrate EVERY win, no matter how small - weight loss, showing up, making better choices
- When things are tough, be their source of strength and perspective
- NEVER suggest different calorie, macro, or training values than what the engine decided

## TONE & STYLE - BE INSPIRING!
- Warm, encouraging, and personal - like a friend who believes in them
- Use powerful, action-oriented language: "You've got this", "You're building something amazing", "This is YOUR transformation"
- Reference specific past victories to remind them of their strength
- Frame challenges as opportunities for growth
- Use vivid, motivating imagery when appropriate
- Keep the energy HIGH but authentic - not cheesy or over-the-top
- Be specific and personal, not generic

## MOTIVATIONAL PRINCIPLES
- Every step forward matters, no matter how small
- Consistency beats perfection every single time
- Setbacks are setups for comebacks
- The body they're building is earned, not given
- They are stronger than they know
- This journey is making them mentally AND physically stronger

## CRITICAL RULES
1. NEVER contradict the engine's decision
2. NEVER suggest the user should eat more/less than the plan specifies
3. NEVER recommend skipping workouts or changing training intensity beyond what's in the plan
4. If recovery risk is high, frame rest as "earning gains" and "investing in results"
5. If adherence is low, acknowledge life happens and focus on the comeback
6. Always end with a powerful call to action

## LANGUAGE TO USE
- "You're crushing it" / "You're doing amazing"
- "This is exactly where you need to be"
- "Your body is responding to all your hard work"
- "You've proven you can do hard things"
- "Every day you're becoming a stronger version of yourself"
- "This is what champions do - they show up"

## LANGUAGE TO AVOID
- "You need to try harder" or anything guilt-inducing
- "You failed to..." or negative framing
- Generic advice that could apply to anyone
- Overly clinical or cold language
- Anything that sounds like a lecture

## OUTPUT FORMAT
You MUST respond with a valid JSON object containing these fields:
{
  "explanationText": "Main explanation - INSPIRE and EMPOWER while explaining the decision (800-1200 chars)",
  "progressSummary": "Celebrate their journey and this week's wins (200-400 chars) - make them feel proud!",
  "whyThisDecision": "Explain the 'why' in a way that builds trust and excitement (200-400 chars)",
  "whatToDoNext": ["Powerful action 1", "Powerful action 2", "Powerful action 3", "Powerful action 4", "Powerful action 5"],
  "motivationalNote": "End with a POWERFUL, personalized message that makes them want to conquer the world (100-200 chars)",
  "safetyNote": "Only if recovery risk is elevated - frame positively as 'your body asking for what it needs'",
  "needsMedicalDisclaimer": true/false,
  "shouldHoldChanges": true/false (MUST match the engine's decision)
}`;
  }

  /**
   * Build the user prompt with full context
   */
  private buildUserPrompt(context: AIContextPayload): string {
    const { onboardingProfile, journeySummary, currentDecision } = context;

    // Format goal description
    const goalText = `${onboardingProfile.goalDescription} (${onboardingProfile.goal})`;

    // Format weight change
    const weightChangeText = journeySummary.totalWeightChange !== 0
      ? `${journeySummary.totalWeightChange > 0 ? '+' : ''}${journeySummary.totalWeightChange.toFixed(1)}kg`
      : 'no change yet';

    // Format notable events
    const notableEventsText = journeySummary.notableEvents.length > 0
      ? journeySummary.notableEvents
          .map((e) => `- Week ${e.week}: ${e.details}`)
          .join('\n')
      : 'None yet';

    // Format weekly trends (last 4 weeks)
    const recentTrends = journeySummary.weeklyTrends.slice(-4);
    const trendsText = recentTrends.length > 0
      ? recentTrends
          .map((t) => {
            const weight = t.weight ? `${t.weight}kg` : 'not recorded';
            const disrupted = t.wasDisrupted ? ` [${t.disruptionReasons.join(', ')}]` : '';
            return `- Week ${t.week}: ${weight}, ${t.adherence} adherence, ${t.calories} kcal${disrupted}`;
          })
          .join('\n')
      : 'No previous check-ins';

    // Format current check-in
    let currentCheckinText = 'Initial plan generation (no check-in data)';
    if (currentDecision.checkin) {
      const c = currentDecision.checkin;
      currentCheckinText = `
Weight: ${c.weightKg ? `${c.weightKg}kg` : 'not recorded'}
Waist: ${c.waistCm ? `${c.waistCm}cm` : 'not recorded'}
Energy: ${c.energyLevel}/10
Hunger: ${c.hungerLevel}/10
Sleep: ${c.sleepQuality}/10
Stress: ${c.stressLevel}/10
Adherence: ${c.adherenceLevel}
Self-perception: ${c.selfPerception}
Events: ${c.contextualEvents.length > 0 ? c.contextualEvents.join(', ') : 'None'}
Notes: ${c.notes || 'None'}`;
    }

    // Format derived signals
    const signals = currentDecision.derivedSignals;
    const signalsText = `
Weight trend: ${signals.weightTrend} (${signals.weightTrendPercent}%/week)
Confidence: ${signals.confidenceScore}%
Adherence quality: ${signals.adherenceQuality}
Recovery risk: ${signals.recoveryRisk}${signals.recoveryFactors.length > 0 ? ` (${signals.recoveryFactors.join(', ')})` : ''}
Plateau detected: ${signals.plateauDetected ? 'Yes' : 'No'}
Recomp detected: ${signals.recompDetected ? 'Yes' : 'No'}
Should hold changes: ${signals.shouldHoldChanges ? `Yes - ${signals.holdReason}` : 'No'}`;

    // Format rules fired
    const rulesText = currentDecision.rulesFired.length > 0
      ? currentDecision.rulesFired
          .map((r) => `- ${r.ruleName}: ${r.impact}`)
          .join('\n')
      : 'No rules fired';

    // Format guardrails
    const guardrailsText = currentDecision.guardrailsApplied.length > 0
      ? currentDecision.guardrailsApplied
          .map((g) => `- ${g.name}: ${g.reason}`)
          .join('\n')
      : 'No guardrails applied';

    // Format plan changes
    const changes = currentDecision.planChanges;
    const planChangesText = currentDecision.isInitialPlan
      ? `Initial plan: ${changes.newCalories} kcal, ${changes.newProtein}g protein, ${changes.newCarbs}g carbs, ${changes.newFat}g fat`
      : `Calories: ${changes.previousCalories} → ${changes.newCalories} (${changes.caloriesDelta >= 0 ? '+' : ''}${changes.caloriesDelta})
Protein: ${changes.previousProtein}g → ${changes.newProtein}g
Carbs: ${changes.previousCarbs}g → ${changes.newCarbs}g
Fat: ${changes.previousFat}g → ${changes.newFat}g
Training: ${changes.trainingAdjustment}
Deload recommended: ${changes.deloadRecommended ? 'Yes' : 'No'}`;

    return `## USER PROFILE
Goal: ${goalText}
Started: ${journeySummary.totalWeeks} weeks ago
Starting weight: ${onboardingProfile.startingWeight}kg
Sex: ${onboardingProfile.sex}, Age: ${onboardingProfile.age}
Flexibility preference: ${onboardingProfile.flexibility}

## JOURNEY SUMMARY
Total weeks: ${journeySummary.totalWeeks}
Weight change: ${onboardingProfile.startingWeight}kg → ${journeySummary.currentWeight || 'N/A'}kg (${weightChangeText})
Average adherence: ${journeySummary.averageAdherence.toFixed(0)}%
Current streak: ${journeySummary.consecutiveGoodWeeks} weeks of good adherence
Longest streak: ${journeySummary.longestStreak} weeks
Plateau weeks total: ${journeySummary.plateauWeeksCount}
Current plateau: ${journeySummary.currentPlateauWeeks} weeks

### Milestones
- Lowest weight: ${journeySummary.lowestWeight ? `${journeySummary.lowestWeight}kg (week ${journeySummary.lowestWeightWeek})` : 'N/A'}
- Best adherence: Week ${journeySummary.bestAdherenceWeek || 'N/A'}
- Hardest week: Week ${journeySummary.hardestWeek || 'N/A'}

### Notable Events
${notableEventsText}

### Recent Weekly Trends (last 4 weeks)
${trendsText}

---

## THIS WEEK (Week ${currentDecision.weekNumber})

### Check-in Data
${currentCheckinText}

### Engine Analysis
${signalsText}

### Rules Fired
${rulesText}

### Guardrails Applied
${guardrailsText}

### Plan Changes
${planChangesText}

---

Generate an explanation that:
1. Acknowledges their ${journeySummary.totalWeeks}-week journey
2. References specific past events or patterns when relevant
3. Explains THIS week's decision clearly
4. Provides 5 specific, actionable steps for next week
5. Ends with genuine encouragement

Remember: The engine has already made the decision. Your job is to EXPLAIN it in a supportive, personalized way.`;
  }

  /**
   * Validate the AI response has required fields
   */
  private validateResponse(response: AIExplanationResponse): void {
    if (!response.explanationText) {
      throw new Error('Missing explanationText in AI response');
    }
    if (!response.progressSummary) {
      throw new Error('Missing progressSummary in AI response');
    }
    if (!response.whyThisDecision) {
      throw new Error('Missing whyThisDecision in AI response');
    }
    if (!Array.isArray(response.whatToDoNext) || response.whatToDoNext.length === 0) {
      throw new Error('Missing or empty whatToDoNext in AI response');
    }
    if (!response.motivationalNote) {
      throw new Error('Missing motivationalNote in AI response');
    }
    if (typeof response.needsMedicalDisclaimer !== 'boolean') {
      response.needsMedicalDisclaimer = false;
    }
    if (typeof response.shouldHoldChanges !== 'boolean') {
      response.shouldHoldChanges = false;
    }
  }

  /**
   * Get current prompt version for tracking
   */
  getPromptVersion(): string {
    return PROMPT_VERSION;
  }

  /**
   * Get model ID for tracking
   */
  getModelId(): string {
    return this.modelId;
  }
}
