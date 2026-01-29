import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOnboardingDto, OnboardingResultDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's onboarding profile
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create empty profile if doesn't exist
      return this.prisma.onboardingProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  /**
   * Update onboarding profile (partial update)
   */
  async updateProfile(userId: string, data: UpdateOnboardingDto) {
    // Upsert - create if doesn't exist, update if does
    return this.prisma.onboardingProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...this.mapDtoToProfile(data),
      },
      update: this.mapDtoToProfile(data),
    });
  }

  /**
   * Complete onboarding and generate results
   */
  async completeOnboarding(userId: string): Promise<OnboardingResultDto> {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Onboarding profile not found');
    }

    // Validate required fields are present
    this.validateProfileComplete(profile);

    // Calculate onboarding results based on profile data
    const results = this.calculateOnboardingResults(profile);

    // Update profile with results and mark as completed
    await this.prisma.onboardingProfile.update({
      where: { userId },
      data: {
        ...results,
        completedAt: new Date(),
      },
    });

    // Update user's hasCompletedOnboarding flag
    // Note: This would be on the User model if we add that field

    return results;
  }

  /**
   * Check if onboarding is complete
   */
  async isComplete(userId: string): Promise<boolean> {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { userId },
      select: { completedAt: true },
    });

    return profile?.completedAt !== null && profile?.completedAt !== undefined;
  }

  /**
   * Map DTO to profile data format
   */
  private mapDtoToProfile(dto: UpdateOnboardingDto) {
    // Filter out undefined values
    const data: Record<string, any> = {};

    if (dto.age !== undefined) data.age = dto.age;
    if (dto.sex !== undefined) data.sex = dto.sex;
    if (dto.heightCm !== undefined) data.heightCm = dto.heightCm;
    if (dto.weightKg !== undefined) data.weightKg = dto.weightKg;
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl;
    if (dto.primaryGoal !== undefined) data.primaryGoal = dto.primaryGoal;
    if (dto.goalDetails !== undefined) data.goalDetails = dto.goalDetails;
    if (dto.workType !== undefined) data.workType = dto.workType;
    if (dto.sleepHours !== undefined) data.sleepHours = dto.sleepHours;
    if (dto.stressLevel !== undefined) data.stressLevel = dto.stressLevel;
    if (dto.trainingTime !== undefined) data.trainingTime = dto.trainingTime;
    if (dto.trainingFrequency !== undefined)
      data.trainingFrequency = dto.trainingFrequency;
    if (dto.trainingTypes !== undefined)
      data.trainingTypes = dto.trainingTypes;
    if (dto.trainingIntensity !== undefined)
      data.trainingIntensity = dto.trainingIntensity;
    if (dto.mealsPerDay !== undefined) data.mealsPerDay = dto.mealsPerDay;
    if (dto.carbSources !== undefined) data.carbSources = dto.carbSources;
    if (dto.excludedFoods !== undefined)
      data.excludedFoods = dto.excludedFoods;
    if (dto.digestiveIssues !== undefined)
      data.digestiveIssues = dto.digestiveIssues;
    if (dto.diagnosedConditions !== undefined)
      data.diagnosedConditions = dto.diagnosedConditions;
    if (dto.digestionStatus !== undefined)
      data.digestionStatus = dto.digestionStatus;
    if (dto.medications !== undefined) data.medications = dto.medications;
    if (dto.healthNotes !== undefined) data.healthNotes = dto.healthNotes;
    if (dto.mealsOutsideHome !== undefined)
      data.mealsOutsideHome = dto.mealsOutsideHome;
    if (dto.planStructure !== undefined)
      data.planStructure = dto.planStructure;
    if (dto.previousDietExperience !== undefined)
      data.previousDietExperience = dto.previousDietExperience;

    return data;
  }

  /**
   * Validate that required fields are present for completion
   */
  private validateProfileComplete(profile: any) {
    const requiredFields = [
      'age',
      'sex',
      'heightCm',
      'weightKg',
      'primaryGoal',
    ];

    const missing = requiredFields.filter((field) => !profile[field]);

    if (missing.length > 0) {
      throw new NotFoundException(
        `Missing required fields: ${missing.join(', ')}`,
      );
    }
  }

  /**
   * Calculate onboarding results based on profile data
   * This is a deterministic calculation, not AI-based
   */
  private calculateOnboardingResults(profile: any): OnboardingResultDto {
    const { primaryGoal, age, sex, weightKg, heightCm, planStructure } =
      profile;

    // Calculate BMI for context
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    // Determine quantified goal based on primary goal
    let quantifiedGoal = '';
    let recommendedPace = '';

    switch (primaryGoal) {
      case 'LOSE_FAT':
        quantifiedGoal = this.calculateFatLossGoal(profile);
        recommendedPace = 'Gradual fat loss: 0.3-0.5% body weight per week';
        break;
      case 'LOSE_WEIGHT':
        quantifiedGoal = this.calculateWeightLossGoal(profile);
        recommendedPace = 'Sustainable weight loss: 0.5-1kg per week';
        break;
      case 'GAIN_MUSCLE':
        quantifiedGoal = this.calculateMuscleGainGoal(profile);
        recommendedPace =
          sex === 'male'
            ? 'Lean gains: 0.5-1kg per month'
            : 'Lean gains: 0.25-0.5kg per month';
        break;
      case 'HEALTH_ENERGY':
        quantifiedGoal = 'Optimize energy levels and overall health markers';
        recommendedPace = 'Progressive improvements over 4-8 weeks';
        break;
      case 'PERFORMANCE':
        quantifiedGoal = 'Enhance athletic performance and recovery';
        recommendedPace = 'Periodized progression based on training cycle';
        break;
      case 'LONGEVITY':
        quantifiedGoal = 'Optimize metabolic health and body composition';
        recommendedPace = 'Long-term sustainable approach, monthly assessments';
        break;
      default:
        quantifiedGoal = 'Personalized health and fitness goals';
        recommendedPace = 'Gradual, sustainable progress';
    }

    // Determine flexibility level
    let flexibilityLevel = 'Balanced';
    if (planStructure === 'disciplined') {
      flexibilityLevel = 'Structured - Precise tracking and adherence';
    } else if (planStructure === 'flexible') {
      flexibilityLevel = 'Flexible - Guidelines-based approach';
    } else {
      flexibilityLevel = 'Balanced - Mix of structure and flexibility';
    }

    // Determine metabolic context based on age, BMI, conditions
    let metabolicContext = this.determineMetabolicContext(profile, bmi);

    return {
      quantifiedGoal,
      recommendedPace,
      flexibilityLevel,
      metabolicContext,
      expectations: this.generateExpectations(profile, bmi),
    };
  }

  private calculateFatLossGoal(profile: any): string {
    const goalDetails = profile.goalDetails as any;
    if (!goalDetails?.waistReduction) {
      return 'Reduce waist circumference and improve body composition';
    }

    switch (goalDetails.waistReduction) {
      case '2_4_cm':
        return 'Target: Reduce waist by 2-4cm (4-8 weeks)';
      case '5_8_cm':
        return 'Target: Reduce waist by 5-8cm (8-12 weeks)';
      case '9_plus_cm':
        return 'Target: Reduce waist by 9+cm (12-16+ weeks)';
      default:
        return 'AI-optimized fat loss based on your metrics';
    }
  }

  private calculateWeightLossGoal(profile: any): string {
    const goalDetails = profile.goalDetails as any;
    if (!goalDetails?.weightLoss) {
      return 'Sustainable weight reduction to healthy range';
    }

    switch (goalDetails.weightLoss) {
      case '2_4_kg':
        return 'Target: Lose 2-4kg (4-8 weeks)';
      case '5_8_kg':
        return 'Target: Lose 5-8kg (8-12 weeks)';
      case '9_12_kg':
        return 'Target: Lose 9-12kg (12-16 weeks)';
      case '12_plus_kg':
        return 'Target: Lose 12+kg (16+ weeks, phased approach)';
      default:
        return 'AI-optimized weight loss based on your metrics';
    }
  }

  private calculateMuscleGainGoal(profile: any): string {
    const goalDetails = profile.goalDetails as any;
    if (!goalDetails?.muscleGain) {
      return 'Build lean muscle while minimizing fat gain';
    }

    switch (goalDetails.muscleGain) {
      case '1_2_kg':
        return 'Target: Gain 1-2kg lean mass (8-12 weeks)';
      case '3_4_kg':
        return 'Target: Gain 3-4kg lean mass (16-24 weeks)';
      case '5_plus_kg':
        return 'Target: Gain 5+kg lean mass (6+ months)';
      default:
        return 'AI-optimized muscle building based on your metrics';
    }
  }

  private determineMetabolicContext(profile: any, bmi: number): string {
    const contexts: string[] = [];

    // Age-based context
    if (profile.age >= 50) {
      contexts.push('Age-optimized approach for metabolic efficiency');
    }

    // BMI-based context
    if (bmi < 18.5) {
      contexts.push('Focus on healthy weight gain');
    } else if (bmi >= 30) {
      contexts.push('Prioritize metabolic health improvements');
    }

    // Health conditions
    const conditions = profile.diagnosedConditions || [];
    if (conditions.includes('insulin_resistance')) {
      contexts.push('Blood sugar management priority');
    }
    if (conditions.includes('hypothyroidism')) {
      contexts.push('Thyroid-aware pacing');
    }

    // Sleep/stress
    if (
      profile.sleepHours === 'less_than_6' ||
      profile.stressLevel === 'very_high'
    ) {
      contexts.push('Recovery-focused approach');
    }

    return contexts.length > 0
      ? contexts.join('. ')
      : 'Standard metabolic optimization';
  }

  private generateExpectations(profile: any, bmi: number): string {
    const expectations: string[] = [];

    // Training frequency expectations
    if (
      profile.trainingFrequency === 'none' ||
      profile.trainingFrequency === '1_2'
    ) {
      expectations.push(
        'Gradual increase in activity levels recommended for best results',
      );
    }

    // Adherence expectations
    if (profile.mealsOutsideHome === '5_plus') {
      expectations.push(
        'Flexible meal options provided for dining out frequently',
      );
    }

    // Previous experience
    if (profile.previousDietExperience === 'could_not_maintain') {
      expectations.push('Sustainable approach designed for long-term success');
    }

    return expectations.length > 0
      ? expectations.join('. ')
      : 'Consistent adherence to your personalized plan will yield the best results';
  }
}
