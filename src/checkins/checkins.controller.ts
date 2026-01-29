import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckinsService } from './checkins.service';
import { EngineService } from '../engine/engine.service';
import {
  CreateCheckinDto,
  CheckinResponseDto,
  CheckinWithPlanResponseDto,
} from './dto/checkin.dto';

@ApiTags('checkins')
@Controller('checkins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckinsController {
  constructor(
    private readonly checkinsService: CheckinsService,
    private readonly engineService: EngineService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Submit weekly check-in',
    description: 'Submit a new weekly check-in and trigger plan update',
  })
  @ApiResponse({
    status: 201,
    description: 'Check-in submitted and plan updated',
    type: CheckinWithPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Already submitted check-in for this week or validation error',
  })
  async createCheckin(
    @Request() req,
    @Body() dto: CreateCheckinDto,
  ): Promise<CheckinWithPlanResponseDto> {
    const userId = req.user.id;

    // Create the check-in
    const { checkin, weekNumber } = await this.checkinsService.createCheckin(
      userId,
      dto,
    );

    // Run the engine to generate updated plan based on check-in
    try {
      const engineResult = await this.engineService.generatePlanFromCheckin(
        userId,
        checkin.id,
      );

      return {
        checkin,
        planUpdated: true,
        newPlanVersionId: engineResult.planVersion.id,
        decisionRecordId: engineResult.decisionRecord.id,
        message: `Week ${weekNumber} check-in submitted. Your plan has been updated based on your progress.`,
      };
    } catch (error) {
      // If engine fails, still return the check-in but note plan wasn't updated
      console.error('Engine failed after check-in:', error);
      return {
        checkin,
        planUpdated: false,
        message: `Week ${weekNumber} check-in submitted. Plan update pending.`,
      };
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all check-ins',
    description: 'Get all weekly check-ins for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of check-ins',
    type: [CheckinResponseDto],
  })
  async getCheckins(@Request() req): Promise<CheckinResponseDto[]> {
    return this.checkinsService.getCheckins(req.user.id);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get check-in status',
    description: 'Get current week number and whether check-in has been submitted',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in status',
  })
  async getCheckinStatus(@Request() req): Promise<{
    currentWeek: number;
    hasCheckedIn: boolean;
    lastCheckin: CheckinResponseDto | null;
    totalCheckins: number;
    onboardingComplete: boolean;
  }> {
    return this.checkinsService.getCheckinStatus(req.user.id);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent check-ins',
    description: 'Get check-ins from the last N weeks for trend analysis',
  })
  @ApiQuery({ name: 'weeks', required: false, type: Number, example: 4 })
  @ApiResponse({
    status: 200,
    description: 'Recent check-ins',
    type: [CheckinResponseDto],
  })
  async getRecentCheckins(
    @Request() req,
    @Query('weeks') weeks?: number,
  ): Promise<CheckinResponseDto[]> {
    return this.checkinsService.getRecentCheckins(req.user.id, weeks || 4);
  }

  @Get('week/:weekNumber')
  @ApiOperation({
    summary: 'Get check-in by week number',
    description: 'Get a specific check-in by week number',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in for the specified week',
    type: CheckinResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No check-in found for this week',
  })
  async getCheckinByWeek(
    @Request() req,
    @Param('weekNumber') weekNumber: string,
  ): Promise<CheckinResponseDto | null> {
    return this.checkinsService.getCheckinByWeek(req.user.id, parseInt(weekNumber, 10));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get check-in by ID',
    description: 'Get a specific check-in by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in details',
    type: CheckinResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Check-in not found',
  })
  async getCheckinById(
    @Request() req,
    @Param('id') id: string,
  ): Promise<CheckinResponseDto> {
    return this.checkinsService.getCheckinById(req.user.id, id);
  }

  @Delete('current-week')
  @ApiOperation({
    summary: 'Delete current week check-in (DEV ONLY)',
    description: 'Delete the check-in for the current week to allow re-submission. Only available in development.',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'No check-in found for current week',
  })
  async deleteCurrentWeekCheckin(@Request() req): Promise<{ message: string }> {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This endpoint is only available in development');
    }
    return this.checkinsService.deleteCurrentWeekCheckin(req.user.id);
  }
}
