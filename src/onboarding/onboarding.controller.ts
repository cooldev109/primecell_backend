import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import {
  UpdateOnboardingDto,
  OnboardingProfileResponseDto,
  OnboardingResultDto,
} from './dto/onboarding.dto';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current onboarding profile' })
  @ApiResponse({
    status: 200,
    description: 'Current onboarding profile',
    type: OnboardingProfileResponseDto,
  })
  async getProfile(@Request() req) {
    return this.onboardingService.getProfile(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update onboarding profile (partial update)' })
  @ApiResponse({
    status: 200,
    description: 'Updated onboarding profile',
    type: OnboardingProfileResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateOnboardingDto,
  ) {
    return this.onboardingService.updateProfile(req.user.id, updateDto);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete onboarding and generate results' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding results',
    type: OnboardingResultDto,
  })
  async completeOnboarding(@Request() req): Promise<OnboardingResultDto> {
    return this.onboardingService.completeOnboarding(req.user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Check if onboarding is complete' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completion status',
  })
  async getStatus(@Request() req): Promise<{ isComplete: boolean }> {
    const isComplete = await this.onboardingService.isComplete(req.user.id);
    return { isComplete };
  }
}
