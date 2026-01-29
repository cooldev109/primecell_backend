import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { AiExplanationsService } from './ai-explanations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiExplanationResponseDto } from './dto/ai-explanation.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiExplanationsController {
  constructor(private readonly aiExplanationsService: AiExplanationsService) {}

  /**
   * Generate or retrieve AI explanation for a decision record
   * POST /ai/explain/:decisionId
   */
  @Post('explain/:decisionId')
  async generateExplanation(
    @Request() req,
    @Param('decisionId') decisionId: string,
    @Query('force') force?: string,
  ): Promise<AiExplanationResponseDto> {
    const userId = req.user.id;
    const forceRegenerate = force === 'true';

    return this.aiExplanationsService.getOrGenerateExplanation(
      userId,
      decisionId,
      forceRegenerate,
    );
  }

  /**
   * Get cached AI explanation for a decision record (no generation)
   * GET /ai/explain/:decisionId
   */
  @Get('explain/:decisionId')
  async getExplanation(
    @Request() req,
    @Param('decisionId') decisionId: string,
  ): Promise<AiExplanationResponseDto> {
    const userId = req.user.id;

    const explanation = await this.aiExplanationsService.getExplanation(
      userId,
      decisionId,
    );

    if (!explanation) {
      throw new NotFoundException('Explanation not found. Use POST to generate one.');
    }

    return explanation;
  }

  /**
   * Get all AI explanations for the current user
   * GET /ai/explanations
   */
  @Get('explanations')
  async getUserExplanations(@Request() req): Promise<AiExplanationResponseDto[]> {
    const userId = req.user.id;
    return this.aiExplanationsService.getUserExplanations(userId);
  }
}
