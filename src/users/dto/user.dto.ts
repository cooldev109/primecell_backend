import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: false })
  hasCompletedOnboarding: boolean;
}

export class UserWithOnboardingDto extends UserResponseDto {
  @ApiProperty({
    example: {
      primaryGoal: 'LOSE_FAT',
      completedAt: '2024-01-01T00:00:00.000Z',
    },
    nullable: true,
  })
  onboardingProfile: {
    primaryGoal: string | null;
    completedAt: Date | null;
  } | null;
}
