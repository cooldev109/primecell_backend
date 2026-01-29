import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  Matches,
  IsArray,
} from 'class-validator';

export enum NotificationType {
  CHECKIN_REMINDER = 'checkin_reminder',
  MISSED_CHECKIN = 'missed_checkin',
  WEEKLY_SUMMARY = 'weekly_summary',
  MOTIVATION = 'motivation',
  PLAN_UPDATE = 'plan_update',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Expo push token' })
  @IsString()
  token: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsEnum(['ios', 'android', 'web'])
  platform: string;

  @ApiPropertyOptional({ description: 'Device name for identification' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format' })
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format' })
  quietHoursEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checkinReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  missedCheckinAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  motivationalMessages?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  planUpdates?: boolean;

  @ApiPropertyOptional({ enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] })
  @IsOptional()
  @IsString()
  checkinReminderDay?: string;

  @ApiPropertyOptional({ description: 'Check-in reminder time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format' })
  checkinReminderTime?: string;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiPropertyOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional()
  quietHoursEnd?: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  checkinReminders: boolean;

  @ApiProperty()
  missedCheckinAlerts: boolean;

  @ApiProperty()
  weeklyDigest: boolean;

  @ApiProperty()
  motivationalMessages: boolean;

  @ApiProperty()
  planUpdates: boolean;

  @ApiProperty()
  checkinReminderDay: string;

  @ApiProperty()
  checkinReminderTime: string;
}

export class NotificationLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: NotificationStatus })
  status: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class SendTestNotificationDto {
  @ApiPropertyOptional({ description: 'Custom title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Custom body' })
  @IsOptional()
  @IsString()
  body?: string;
}

export class DeviceTokenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  platform: string;

  @ApiPropertyOptional()
  deviceName?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
