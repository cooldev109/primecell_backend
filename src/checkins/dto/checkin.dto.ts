import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsUrl,
} from 'class-validator';

export enum AdherenceLevel {
  FULL = '100',
  HIGH = '80_90',
  MODERATE = '60_70',
  LOW = 'below_60',
}

export enum SelfPerception {
  PROGRESSING = 'progressing',
  SAME_CONFIDENT = 'same_confident',
  FRUSTRATED = 'frustrated',
  UNSURE = 'unsure',
}

export class CreateCheckinDto {
  // Body metrics
  @ApiPropertyOptional({ example: 79.5, description: 'Current weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @ApiPropertyOptional({ example: 82, description: 'Waist measurement in cm' })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  waistCm?: number;

  @ApiPropertyOptional({ description: 'Progress photo URL' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  // Subjective signals (0-10 scale)
  @ApiPropertyOptional({ example: 7, description: 'Energy level (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  energyLevel?: number;

  @ApiPropertyOptional({ example: 5, description: 'Hunger level (0-10, 0=never hungry, 10=always hungry)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  hungerLevel?: number;

  @ApiPropertyOptional({ example: 8, description: 'Sleep quality (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  sleepQuality?: number;

  @ApiPropertyOptional({ example: 4, description: 'Stress level (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  stressLevel?: number;

  // Adherence
  @ApiProperty({ enum: AdherenceLevel, example: AdherenceLevel.HIGH })
  @IsEnum(AdherenceLevel)
  adherenceLevel: AdherenceLevel;

  // Contextual events
  @ApiPropertyOptional({ example: true, description: 'Had meals outside home this week' })
  @IsOptional()
  @IsBoolean()
  mealsOutside?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Traveled this week' })
  @IsOptional()
  @IsBoolean()
  hadTravel?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Was ill this week' })
  @IsOptional()
  @IsBoolean()
  wasIll?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Hormonal changes (menstrual, etc.)' })
  @IsOptional()
  @IsBoolean()
  hormonalChanges?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Experienced significant emotional stress' })
  @IsOptional()
  @IsBoolean()
  emotionalStress?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Had poor sleep this week' })
  @IsOptional()
  @IsBoolean()
  poorSleep?: boolean;

  @ApiPropertyOptional({ example: 'Had a birthday party on Saturday', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  // Self-perception
  @ApiProperty({ enum: SelfPerception, example: SelfPerception.PROGRESSING })
  @IsEnum(SelfPerception)
  selfPerception: SelfPerception;
}

export class CheckinResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  weekNumber: number;

  @ApiPropertyOptional()
  weightKg?: number;

  @ApiPropertyOptional()
  waistCm?: number;

  @ApiPropertyOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  energyLevel?: number;

  @ApiPropertyOptional()
  hungerLevel?: number;

  @ApiPropertyOptional()
  sleepQuality?: number;

  @ApiPropertyOptional()
  stressLevel?: number;

  @ApiProperty()
  adherenceLevel: string;

  @ApiProperty()
  mealsOutside: boolean;

  @ApiProperty()
  hadTravel: boolean;

  @ApiProperty()
  wasIll: boolean;

  @ApiProperty()
  hormonalChanges: boolean;

  @ApiProperty()
  emotionalStress: boolean;

  @ApiProperty()
  poorSleep: boolean;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  selfPerception: string;

  @ApiProperty()
  createdAt: Date;
}

export class CheckinWithPlanResponseDto {
  @ApiProperty()
  checkin: CheckinResponseDto;

  @ApiProperty()
  planUpdated: boolean;

  @ApiPropertyOptional()
  newPlanVersionId?: string;

  @ApiPropertyOptional()
  decisionRecordId?: string;

  @ApiProperty()
  message: string;
}
