import { Injectable } from '@nestjs/common';
import { AIContextPayload, AIExplanationResponse } from './dto/ai-explanation.dto';

/**
 * Fallback templates when AI fails
 * Maps rule IDs to human-readable explanations
 */
@Injectable()
export class FallbackTemplateService {
  /**
   * Generate fallback explanation from templates
   */
  generateFallback(context: AIContextPayload): AIExplanationResponse {
    const { journeySummary, currentDecision } = context;
    const { rulesFired, planChanges, derivedSignals } = currentDecision;

    // Get primary rule that fired
    const primaryRule = rulesFired[0];
    const ruleId = primaryRule?.ruleId || 'UNKNOWN';

    // Build explanation based on rule
    const ruleExplanation = this.getRuleExplanation(ruleId, context);

    // Build progress summary
    const progressSummary = this.buildProgressSummary(context);

    // Build what to do next
    const whatToDoNext = this.buildWhatToDoNext(context);

    // Build motivational note
    const motivationalNote = this.buildMotivationalNote(context);

    // Build safety note if needed
    const safetyNote = this.buildSafetyNote(context);

    return {
      explanationText: ruleExplanation,
      progressSummary,
      whyThisDecision: primaryRule?.impact || 'Your plan has been adjusted based on your progress.',
      whatToDoNext,
      motivationalNote,
      safetyNote: safetyNote || undefined,
      needsMedicalDisclaimer: derivedSignals.recoveryRisk === 'high',
      shouldHoldChanges: derivedSignals.shouldHoldChanges,
    };
  }

  /**
   * Get rule-specific explanation
   */
  private getRuleExplanation(ruleId: string, context: AIContextPayload): string {
    const { journeySummary, currentDecision } = context;
    const weekNum = currentDecision.weekNumber;
    const changes = currentDecision.planChanges;

    const templates: Record<string, string> = {
      // Initial plan
      INIT_001: `Welcome to week ${weekNum} of YOUR transformation! This is the beginning of something amazing. Based on everything you've shared, we've crafted a personalized plan just for you: ${changes.newCalories} calories daily with ${changes.newProtein}g protein, ${changes.newCarbs}g carbs, and ${changes.newFat}g fat. This isn't just a diet - it's your roadmap to becoming the strongest version of yourself. Let's make it happen!`,

      // Fat loss rules
      CUT_SLOW_001: `WOW - you're making incredible progress! Your body is responding so well that you're actually losing a bit faster than planned. That's your hard work paying off! We're bumping up your calories by ${Math.abs(changes.caloriesDelta)} to ${changes.newCalories} - not to slow you down, but to protect all that hard-earned muscle. This is the smart way to transform your body. You're doing amazing!`,

      CUT_MAINTAIN_001: `You're absolutely CRUSHING IT! Your weight loss is in the perfect zone (0.2-0.5% per week) - this is textbook-perfect progress. You're losing fat while keeping your muscle, which is exactly what champions do. We're keeping everything at ${changes.newCalories} calories because why change what's working? Keep bringing this same energy!`,

      CUT_PLATEAU_001: `Here's the thing about plateaus - they happen to EVERYONE, including elite athletes. Your body is simply adapting to all the amazing changes you've made! We're making a strategic adjustment of ${Math.abs(changes.caloriesDelta)} calories to ${changes.newCalories} to kickstart your next phase. Fun fact: some of the biggest transformations happen right AFTER a plateau. Your breakthrough is coming!`,

      CUT_STALL_001: `Your weight held steady this week - totally normal and nothing to stress about! Bodies don't change in perfect straight lines. We're making a small tweak of ${Math.abs(changes.caloriesDelta)} calories to ${changes.newCalories} to keep the momentum going. Remember: consistency beats perfection every time. You've got this!`,

      CUT_REVERSE_001: `Scale went up a bit? No sweat - literally, it could be water retention, stress, or just your body doing its thing. This happens to EVERYONE, even fitness pros. We're adjusting to ${changes.newCalories} calories and staying the course. Your consistency will always win in the end. Trust the process - you're doing better than you think!`,

      RECOMP_001: `Something AMAZING is happening here! Your weight is stable but your waist is shrinking - that's body recomposition in action! You're essentially swapping fat for muscle, which is the holy grail of fitness. We're keeping you at ${changes.newCalories} calories because your body is doing exactly what we want. This is next-level progress!`,

      RECOVERY_HOLD_001: `Your body is asking for some extra TLC this week, and we're listening! We're keeping your plan at ${changes.newCalories} calories instead of pushing further. Here's the secret the pros know: rest is when the real magic happens. Your muscles grow when you recover, not just when you work out. Taking care of yourself IS making progress!`,

      // Muscle gain rules
      GAIN_SLOW_001: `Your gains are coming in hot! 🔥 A bit faster than our target though, so let's dial it in for lean muscle growth. We're adjusting down ${Math.abs(changes.caloriesDelta)} calories to ${changes.newCalories} to make sure every pound you gain is quality muscle. You're building something impressive here!`,

      GAIN_STALL_001: `Time to fuel those gains! Your body needs more energy to build the muscle you're working so hard for. We're adding ${changes.caloriesDelta} calories to bring you to ${changes.newCalories}. Think of these extra calories as building materials for your new muscle. Let's grow!`,

      GAIN_MAINTAIN_001: `You're in the SWEET SPOT for building lean muscle! Weight gain is right on target, which means you're maximizing muscle while minimizing fat gain. We're keeping you at ${changes.newCalories} calories. Keep attacking those workouts - you're getting stronger every day!`,

      // Maintenance rules
      MAINT_UP_001: `We noticed you've been dropping weight when you want to maintain. No worries - we're adding ${changes.caloriesDelta} calories to ${changes.newCalories} to keep you fueled and feeling strong. Your body deserves the energy it needs!`,

      MAINT_DOWN_001: `Quick adjustment to keep you right where you want to be! We're tweaking down to ${changes.newCalories} calories. Maintaining your progress is a skill, and you're learning it. Great job staying aware of your body!`,

      MAINT_HOLD_001: `You've nailed it! Your weight is stable and you're exactly where you want to be. We're keeping everything at ${changes.newCalories} calories. This is what success looks like - maintaining all the hard work you put in!`,

      // Hold rules
      HOLD_001: `We're keeping your plan steady this week. ${currentDecision.derivedSignals.holdReason || 'Your body is adapting to recent changes, and sometimes the best action is patient consistency. You\'re doing everything right!'}`,
    };

    // Return template or generic fallback
    return templates[ruleId] || this.getGenericExplanation(context);
  }

  /**
   * Generic fallback when no specific template matches
   */
  private getGenericExplanation(context: AIContextPayload): string {
    const { currentDecision, journeySummary } = context;
    const changes = currentDecision.planChanges;

    if (currentDecision.isInitialPlan) {
      return `Welcome to YOUR personalized fitness journey! This plan was built specifically for you: ${changes.newCalories} calories with ${changes.newProtein}g protein daily. Every number here is calculated to help you succeed. This is your moment - let's make something amazing happen!`;
    }

    if (changes.caloriesDelta === 0) {
      return `Week ${currentDecision.weekNumber} in the books! 💪 We're keeping your plan steady at ${changes.newCalories} calories because you've found your groove. When something's working, we don't mess with it. You're doing everything right - keep that consistency going!`;
    }

    const direction = changes.caloriesDelta > 0 ? 'bumped up' : 'fine-tuned down';
    return `Week ${currentDecision.weekNumber} check-in analyzed! Based on your progress, we've ${direction} your calories by ${Math.abs(changes.caloriesDelta)} to ${changes.newCalories}. This strategic adjustment is designed to accelerate your results. Your body is responding to all your hard work - let's keep building on this momentum!`;
  }

  /**
   * Build progress summary
   */
  private buildProgressSummary(context: AIContextPayload): string {
    const { journeySummary, currentDecision } = context;

    if (currentDecision.isInitialPlan) {
      return `This is day ONE of your transformation! Your personalized plan is locked and loaded. You've already done the hardest part - you showed up and committed. Now let's build something amazing together!`;
    }

    const weekNum = currentDecision.weekNumber;
    const weightChange = journeySummary.totalWeightChange;
    const adherence = journeySummary.averageAdherence;

    let summary = `${weekNum} weeks in and you're still here - that's what separates dreamers from achievers! `;

    if (weightChange !== 0) {
      const direction = weightChange < 0 ? 'dropped' : 'added';
      const absChange = Math.abs(weightChange).toFixed(1);
      if (weightChange < -2) {
        summary += `You've ${direction} ${absChange}kg - your body is TRANSFORMING! `;
      } else if (weightChange < 0) {
        summary += `${absChange}kg down and counting - every gram is a victory! `;
      } else {
        summary += `${absChange}kg of gains building up - you're getting stronger! `;
      }
    }

    if (adherence > 80) {
      summary += `${adherence.toFixed(0)}% adherence is ELITE level consistency. You're crushing it!`;
    } else if (adherence > 60) {
      summary += `${adherence.toFixed(0)}% adherence shows real commitment. Keep building that momentum!`;
    } else {
      summary += `Every day is a fresh start. Your next best week starts NOW!`;
    }

    return summary;
  }

  /**
   * Build what to do next actions
   */
  private buildWhatToDoNext(context: AIContextPayload): string[] {
    const { currentDecision, onboardingProfile } = context;
    const signals = currentDecision.derivedSignals;
    const changes = currentDecision.planChanges;

    const actions: string[] = [];

    // Always include calorie target - make it empowering
    actions.push(`Nail your ${changes.newCalories} calorie target - every day is a chance to win`);

    // Protein priority - emphasize importance
    actions.push(`Crush your ${changes.newProtein}g protein goal - this is your muscle-building fuel`);

    // Recovery-based actions - frame positively
    if (signals.recoveryRisk === 'high') {
      actions.push('Prioritize 7-8 hours of quality sleep - this is when your body builds muscle');
      actions.push('Take an active recovery day - you earn your gains through smart rest');
    } else if (signals.recoveryRisk === 'moderate') {
      actions.push('Listen to your body and adjust workout intensity as needed - that\'s wisdom, not weakness');
    }

    // Adherence-based actions - supportive tone
    if (signals.adherenceQuality === 'poor' || signals.adherenceQuality === 'moderate') {
      actions.push('Set yourself up for success: prep a few meals this weekend');
    }

    // Training actions - energizing
    if (changes.deloadRecommended) {
      actions.push('This is a strategic deload week - lighter weights, same dedication. Your body will thank you!');
    } else {
      actions.push('Attack your training sessions with everything you\'ve got - this is where champions are made');
    }

    // Hydration - tie to performance
    actions.push('Hydrate like an athlete - 2-3 liters of water fuels peak performance');

    // Return first 5 actions
    return actions.slice(0, 5);
  }

  /**
   * Build motivational note
   */
  private buildMotivationalNote(context: AIContextPayload): string {
    const { journeySummary, currentDecision } = context;
    const signals = currentDecision.derivedSignals;

    // Streak celebration - big energy!
    if (journeySummary.consecutiveGoodWeeks >= 4) {
      return `${journeySummary.consecutiveGoodWeeks} WEEKS of showing up! You're not just building a body - you're building an unstoppable mindset. This is who you are now. Keep being extraordinary!`;
    }

    // Recovery support - empowering rest
    if (signals.recoveryRisk === 'high') {
      return `Champions know when to push AND when to recover. Taking care of yourself today is how you dominate tomorrow. This IS progress!`;
    }

    // Plateau encouragement - breakthrough mindset
    if (signals.plateauDetected) {
      return `Plateaus don't stop champions - they CREATE them. Your breakthrough is loading. Stay patient, stay hungry, stay UNSTOPPABLE!`;
    }

    // Weight loss milestone - celebrate big
    if (journeySummary.totalWeightChange < -3) {
      return `Look at how far you've come! ${Math.abs(journeySummary.totalWeightChange).toFixed(1)}kg down through YOUR hard work. You're not the same person who started - you're STRONGER!`;
    }

    // High-energy generic encouragement
    const motivations = [
      `Every day you're becoming the person you dreamed of being. Don't stop - your future self is cheering you on!`,
      `You're doing what 90% of people only TALK about doing. That makes you extraordinary. Keep proving them wrong!`,
      `The body you want is being built right now, one choice at a time. You're creating something amazing!`,
      `Your consistency is your superpower. While others quit, you keep showing up. THAT'S what winners do!`,
      `This journey is making you mentally AND physically stronger. You're becoming UNSTOPPABLE!`,
    ];

    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  /**
   * Build safety note if needed
   */
  private buildSafetyNote(context: AIContextPayload): string | null {
    const { currentDecision } = context;
    const signals = currentDecision.derivedSignals;

    if (signals.recoveryRisk === 'high') {
      const factors = signals.recoveryFactors.join(', ').toLowerCase();
      return `Your body is showing signs of stress (${factors}). Please prioritize rest and self-care this week. If symptoms persist, consider consulting a healthcare professional.`;
    }

    if (signals.shouldHoldChanges && signals.holdReason) {
      return signals.holdReason;
    }

    return null;
  }
}
