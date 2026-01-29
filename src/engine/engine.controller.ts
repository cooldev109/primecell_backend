import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EngineService } from './engine.service';

@ApiTags('engine')
@Controller('engine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EngineController {
  constructor(private readonly engineService: EngineService) {}

  @Post('run')
  @ApiOperation({ summary: 'Generate initial plan from onboarding data' })
  @ApiResponse({
    status: 200,
    description: 'Plan generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Onboarding not completed or missing required data',
  })
  async generateInitialPlan(@Request() req) {
    const result = await this.engineService.generateInitialPlanFromOnboarding(
      req.user.id,
    );
    return {
      success: true,
      planVersionId: result.planVersion.id,
      decisionRecordId: result.decisionRecord.id,
      plan: result.planVersion,
    };
  }
}

@ApiTags('plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly engineService: EngineService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get current active plan' })
  @ApiResponse({
    status: 200,
    description: 'Active plan returned',
  })
  @ApiResponse({
    status: 404,
    description: 'No active plan found',
  })
  async getActivePlan(@Request() req) {
    const plan = await this.engineService.getActivePlan(req.user.id);
    if (!plan) {
      throw new NotFoundException('No active plan found. Complete onboarding and generate your first plan.');
    }
    return plan;
  }

  @Get('history')
  @ApiOperation({ summary: 'Get plan version history' })
  @ApiResponse({
    status: 200,
    description: 'Plan history returned',
  })
  async getPlanHistory(@Request() req) {
    return this.engineService.getPlanHistory(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan returned',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getPlanById(@Request() req, @Param('id') planId: string) {
    const plan = await this.engineService.getPlanById(req.user.id, planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }
}

@ApiTags('decisions')
@Controller('decisions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DecisionsController {
  constructor(private readonly engineService: EngineService) {}

  @Get()
  @ApiOperation({ summary: 'Get decision record history' })
  @ApiResponse({
    status: 200,
    description: 'Decision history returned',
  })
  async getDecisionHistory(@Request() req) {
    return this.engineService.getDecisionHistory(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific decision record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Decision record returned',
  })
  @ApiResponse({
    status: 404,
    description: 'Decision record not found',
  })
  async getDecisionById(@Request() req, @Param('id') decisionId: string) {
    const record = await this.engineService.getDecisionRecord(
      req.user.id,
      decisionId,
    );
    if (!record) {
      throw new NotFoundException('Decision record not found');
    }
    return record;
  }
}
