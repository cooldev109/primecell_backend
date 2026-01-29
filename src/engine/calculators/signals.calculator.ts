/**
 * Signal Interpreter
 * Analyzes check-in data to derive actionable signals for plan adjustments
 */

export interface CheckinData {
  weekNumber: number;
  weightKg?: number;
  waistCm?: number;
  energyLevel?: number;
  hungerLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  adherenceLevel: string;
  mealsOutside: boolean;
  hadTravel: boolean;
  wasIll: boolean;
  hormonalChanges: boolean;
  emotionalStress: boolean;
  poorSleep: boolean;
  selfPerception: string;
}

export interface DerivedSignals {
  // Weight trend
  weightTrend: 'losing' | 'gaining' | 'stable' | 'unknown';
  weightTrendPercent: number; // Weekly % change
  weightTrendConfidence: number; // 0-100

  // Recovery signals
  recoveryRisk: 'low' | 'moderate' | 'high';
  recoveryFactors: string[];

  // Adherence quality
  adherenceQuality: 'excellent' | 'good' | 'moderate' | 'poor';
  adherenceScore: number; // 0-100

  // Confidence in data
  confidenceScore: number; // 0-100, how much we trust this week's data
  confidenceFactors: string[];

  // Plateau detection
  plateauDetected: boolean;
  plateauWeeks: number;

  // Recomp detection (weight stable but waist decreasing)
  recompDetected: boolean;

  // Metabolic stress indicators
  metabolicStress: 'low' | 'moderate' | 'high';

  // Contextual flags
  isDisruptedWeek: boolean;
  disruptionFactors: string[];

  // Recommendations
  shouldHoldChanges: boolean;
  holdReason?: string;
}

/**
 * Calculate weight trend from recent check-ins
 */
function calculateWeightTrend(
  checkins: CheckinData[],
): { trend: 'losing' | 'gaining' | 'stable' | 'unknown'; percent: number; confidence: number } {
  const weightsWithWeek = checkins
    .filter((c) => c.weightKg != null)
    .map((c) => ({ week: c.weekNumber, weight: c.weightKg! }))
    .sort((a, b) => a.week - b.week);

  if (weightsWithWeek.length < 2) {
    return { trend: 'unknown', percent: 0, confidence: 0 };
  }

  // Use last 3 weeks for trend (or fewer if not available)
  const recentWeights = weightsWithWeek.slice(-3);
  const first = recentWeights[0].weight;
  const last = recentWeights[recentWeights.length - 1].weight;
  const weekSpan = recentWeights[recentWeights.length - 1].week - recentWeights[0].week;

  if (weekSpan === 0) {
    return { trend: 'unknown', percent: 0, confidence: 0 };
  }

  const totalChange = last - first;
  const weeklyChange = totalChange / weekSpan;
  const percentChange = (weeklyChange / first) * 100;

  // Confidence based on data points and consistency
  const confidence = Math.min(100, recentWeights.length * 30);

  // Determine trend (using 0.2% threshold for "stable")
  let trend: 'losing' | 'gaining' | 'stable';
  if (percentChange < -0.2) {
    trend = 'losing';
  } else if (percentChange > 0.2) {
    trend = 'gaining';
  } else {
    trend = 'stable';
  }

  return {
    trend,
    percent: Math.round(percentChange * 100) / 100,
    confidence,
  };
}

/**
 * Calculate adherence score from adherence level
 */
function calculateAdherenceScore(adherenceLevel: string): { quality: 'excellent' | 'good' | 'moderate' | 'poor'; score: number } {
  switch (adherenceLevel) {
    case '100':
      return { quality: 'excellent', score: 100 };
    case '80_90':
      return { quality: 'good', score: 85 };
    case '60_70':
      return { quality: 'moderate', score: 65 };
    case 'below_60':
      return { quality: 'poor', score: 40 };
    default:
      return { quality: 'moderate', score: 70 };
  }
}

/**
 * Calculate recovery risk based on subjective signals
 */
function calculateRecoveryRisk(
  checkin: CheckinData,
): { risk: 'low' | 'moderate' | 'high'; factors: string[] } {
  const factors: string[] = [];
  let riskScore = 0;

  // Energy level (0-10, lower is worse)
  if (checkin.energyLevel != null) {
    if (checkin.energyLevel <= 3) {
      riskScore += 3;
      factors.push('Very low energy');
    } else if (checkin.energyLevel <= 5) {
      riskScore += 1;
      factors.push('Low energy');
    }
  }

  // Hunger level (0-10, higher is worse for cutting, very low is also bad)
  if (checkin.hungerLevel != null) {
    if (checkin.hungerLevel >= 8) {
      riskScore += 2;
      factors.push('Excessive hunger');
    } else if (checkin.hungerLevel <= 2) {
      riskScore += 1;
      factors.push('Suppressed appetite');
    }
  }

  // Sleep quality (0-10, lower is worse)
  if (checkin.sleepQuality != null) {
    if (checkin.sleepQuality <= 3) {
      riskScore += 2;
      factors.push('Poor sleep quality');
    } else if (checkin.sleepQuality <= 5) {
      riskScore += 1;
      factors.push('Suboptimal sleep');
    }
  }

  // Stress level (0-10, higher is worse)
  if (checkin.stressLevel != null) {
    if (checkin.stressLevel >= 8) {
      riskScore += 2;
      factors.push('High stress');
    } else if (checkin.stressLevel >= 6) {
      riskScore += 1;
      factors.push('Moderate stress');
    }
  }

  // Contextual factors
  if (checkin.wasIll) {
    riskScore += 3;
    factors.push('Illness');
  }
  if (checkin.emotionalStress) {
    riskScore += 1;
    factors.push('Emotional stress');
  }
  if (checkin.poorSleep) {
    riskScore += 1;
    factors.push('Poor sleep week');
  }

  let risk: 'low' | 'moderate' | 'high';
  if (riskScore >= 5) {
    risk = 'high';
  } else if (riskScore >= 2) {
    risk = 'moderate';
  } else {
    risk = 'low';
  }

  return { risk, factors };
}

/**
 * Calculate confidence in the week's data
 */
function calculateConfidence(
  checkin: CheckinData,
  adherenceScore: number,
): { score: number; factors: string[] } {
  let score = 100;
  const factors: string[] = [];

  // Low adherence = low confidence in weight data
  if (adherenceScore < 70) {
    score -= 30;
    factors.push('Low adherence makes weight data less reliable');
  } else if (adherenceScore < 85) {
    score -= 15;
    factors.push('Moderate adherence affects data reliability');
  }

  // Disruption factors reduce confidence
  if (checkin.hadTravel) {
    score -= 15;
    factors.push('Travel affects routine');
  }
  if (checkin.wasIll) {
    score -= 25;
    factors.push('Illness affects weight and recovery');
  }
  if (checkin.hormonalChanges) {
    score -= 10;
    factors.push('Hormonal changes affect weight');
  }
  if (checkin.mealsOutside) {
    score -= 5;
    factors.push('More meals outside home');
  }

  return { score: Math.max(0, score), factors };
}

/**
 * Detect plateau (weight stable for 3+ weeks despite deficit/surplus)
 */
function detectPlateau(checkins: CheckinData[]): { detected: boolean; weeks: number } {
  if (checkins.length < 3) {
    return { detected: false, weeks: 0 };
  }

  const weights = checkins
    .filter((c) => c.weightKg != null)
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .slice(0, 4);

  if (weights.length < 3) {
    return { detected: false, weeks: 0 };
  }

  const maxWeight = Math.max(...weights.map((w) => w.weightKg!));
  const minWeight = Math.min(...weights.map((w) => w.weightKg!));
  const range = maxWeight - minWeight;
  const avgWeight = weights.reduce((sum, w) => sum + w.weightKg!, 0) / weights.length;
  const rangePercent = (range / avgWeight) * 100;

  // Less than 0.5% variation over 3+ weeks = plateau
  if (rangePercent < 0.5) {
    return { detected: true, weeks: weights.length };
  }

  return { detected: false, weeks: 0 };
}

/**
 * Detect recomposition (weight stable but waist decreasing)
 */
function detectRecomp(checkins: CheckinData[]): boolean {
  if (checkins.length < 3) {
    return false;
  }

  const dataWithBoth = checkins
    .filter((c) => c.weightKg != null && c.waistCm != null)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  if (dataWithBoth.length < 3) {
    return false;
  }

  const recent = dataWithBoth.slice(-3);
  const firstWeight = recent[0].weightKg!;
  const lastWeight = recent[recent.length - 1].weightKg!;
  const firstWaist = recent[0].waistCm!;
  const lastWaist = recent[recent.length - 1].waistCm!;

  const weightChange = ((lastWeight - firstWeight) / firstWeight) * 100;
  const waistChange = lastWaist - firstWaist;

  // Weight stable (within 1%) but waist decreasing (>1cm)
  if (Math.abs(weightChange) < 1 && waistChange < -1) {
    return true;
  }

  return false;
}

/**
 * Main signal interpreter function
 */
export function interpretSignals(
  currentCheckin: CheckinData,
  recentCheckins: CheckinData[], // Including current, sorted by week desc
): DerivedSignals {
  // Weight trend
  const weightTrendResult = calculateWeightTrend(recentCheckins);

  // Adherence
  const adherenceResult = calculateAdherenceScore(currentCheckin.adherenceLevel);

  // Recovery risk
  const recoveryResult = calculateRecoveryRisk(currentCheckin);

  // Confidence
  const confidenceResult = calculateConfidence(currentCheckin, adherenceResult.score);

  // Plateau detection
  const plateauResult = detectPlateau(recentCheckins);

  // Recomp detection
  const recompDetected = detectRecomp(recentCheckins);

  // Metabolic stress (combination of recovery risk and adherence)
  let metabolicStress: 'low' | 'moderate' | 'high' = 'low';
  if (recoveryResult.risk === 'high' || adherenceResult.quality === 'poor') {
    metabolicStress = 'high';
  } else if (recoveryResult.risk === 'moderate' || adherenceResult.quality === 'moderate') {
    metabolicStress = 'moderate';
  }

  // Disruption detection
  const disruptionFactors: string[] = [];
  if (currentCheckin.hadTravel) disruptionFactors.push('Travel');
  if (currentCheckin.wasIll) disruptionFactors.push('Illness');
  if (currentCheckin.hormonalChanges) disruptionFactors.push('Hormonal changes');
  if (currentCheckin.emotionalStress) disruptionFactors.push('Emotional stress');
  const isDisruptedWeek = disruptionFactors.length > 0;

  // Should hold changes?
  let shouldHoldChanges = false;
  let holdReason: string | undefined;

  if (currentCheckin.wasIll) {
    shouldHoldChanges = true;
    holdReason = 'Illness detected - holding changes for recovery';
  } else if (recoveryResult.risk === 'high') {
    shouldHoldChanges = true;
    holdReason = 'High recovery risk - holding changes to allow adaptation';
  } else if (confidenceResult.score < 50) {
    shouldHoldChanges = true;
    holdReason = 'Low data confidence - waiting for cleaner week';
  }

  return {
    weightTrend: weightTrendResult.trend,
    weightTrendPercent: weightTrendResult.percent,
    weightTrendConfidence: weightTrendResult.confidence,
    recoveryRisk: recoveryResult.risk,
    recoveryFactors: recoveryResult.factors,
    adherenceQuality: adherenceResult.quality,
    adherenceScore: adherenceResult.score,
    confidenceScore: confidenceResult.score,
    confidenceFactors: confidenceResult.factors,
    plateauDetected: plateauResult.detected,
    plateauWeeks: plateauResult.weeks,
    recompDetected,
    metabolicStress,
    isDisruptedWeek,
    disruptionFactors,
    shouldHoldChanges,
    holdReason,
  };
}
