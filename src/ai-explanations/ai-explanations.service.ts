import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContextBuilderService } from './context-builder.service';
import { OpenAiService } from './openai.service';
import { FallbackTemplateService } from './fallback-template.service';
import { AiExplanationResponseDto } from './dto/ai-explanation.dto';

@Injectable()
export class AiExplanationsService {
  private readonly logger = new Logger(AiExplanationsService.name);

  constructor(
    private prisma: PrismaService,
    private contextBuilder: ContextBuilderService,
    private openAiService: OpenAiService,
    private fallbackService: FallbackTemplateService,
  ) {}

  /**
   * Generate or retrieve explanation for a decision record
   */
  async getOrGenerateExplanation(
    userId: string,
    decisionRecordId: string,
    forceRegenerate = false,
  ): Promise<AiExplanationResponseDto> {
    // Check if explanation already exists
    if (!forceRegenerate) {
      const existing = await this.prisma.aiExplanation.findUnique({
        where: { decisionRecordId },
      });

      if (existing) {
        this.logger.log(`Returning cached explanation for decision ${decisionRecordId}`);
        return this.mapToResponseDto(existing);
      }
    }

    // Verify decision record exists and belongs to user
    const decisionRecord = await this.prisma.decisionRecord.findUnique({
      where: { id: decisionRecordId },
    });

    if (!decisionRecord) {
      throw new NotFoundException('Decision record not found');
    }

    if (decisionRecord.userId !== userId) {
      throw new NotFoundException('Decision record not found');
    }

    // Build context
    this.logger.log(`Building context for decision ${decisionRecordId}`);
    const context = await this.contextBuilder.buildContext(userId, decisionRecordId);

    // Try AI generation
    let explanation: AiExplanationResponseDto;
    let usedFallback = false;
    let fallbackReason: string | null = null;

    try {
      this.logger.log(`Generating AI explanation for decision ${decisionRecordId}`);
      const { response, tokensUsed, generationTimeMs } = await this.openAiService.generateExplanation(context);

      // Save to database
      const saved = await this.prisma.aiExplanation.upsert({
        where: { decisionRecordId },
        create: {
          decisionRecordId,
          userId,
          explanationText: response.explanationText,
          progressSummary: response.progressSummary,
          whyThisDecision: response.whyThisDecision,
          whatToDoNext: response.whatToDoNext,
          motivationalNote: response.motivationalNote,
          safetyNote: response.safetyNote || null,
          needsMedicalDisclaimer: response.needsMedicalDisclaimer,
          shouldHoldChanges: response.shouldHoldChanges,
          promptVersion: this.openAiService.getPromptVersion(),
          modelId: this.openAiService.getModelId(),
          tokensUsed,
          generationTimeMs,
          contextSnapshot: JSON.parse(JSON.stringify(context)),
          usedFallback: false,
        },
        update: {
          explanationText: response.explanationText,
          progressSummary: response.progressSummary,
          whyThisDecision: response.whyThisDecision,
          whatToDoNext: response.whatToDoNext,
          motivationalNote: response.motivationalNote,
          safetyNote: response.safetyNote || null,
          needsMedicalDisclaimer: response.needsMedicalDisclaimer,
          shouldHoldChanges: response.shouldHoldChanges,
          promptVersion: this.openAiService.getPromptVersion(),
          modelId: this.openAiService.getModelId(),
          tokensUsed,
          generationTimeMs,
          contextSnapshot: JSON.parse(JSON.stringify(context)),
          usedFallback: false,
          fallbackReason: null,
        },
      });

      this.logger.log(`AI explanation generated successfully (${tokensUsed} tokens, ${generationTimeMs}ms)`);
      explanation = this.mapToResponseDto(saved);

    } catch (error) {
      // Fall back to template-based explanation
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI generation failed, using fallback: ${errorMessage}`);
      usedFallback = true;
      fallbackReason = errorMessage;

      const fallbackResponse = this.fallbackService.generateFallback(context);

      const saved = await this.prisma.aiExplanation.upsert({
        where: { decisionRecordId },
        create: {
          decisionRecordId,
          userId,
          explanationText: fallbackResponse.explanationText,
          progressSummary: fallbackResponse.progressSummary,
          whyThisDecision: fallbackResponse.whyThisDecision,
          whatToDoNext: fallbackResponse.whatToDoNext,
          motivationalNote: fallbackResponse.motivationalNote,
          safetyNote: fallbackResponse.safetyNote || null,
          needsMedicalDisclaimer: fallbackResponse.needsMedicalDisclaimer,
          shouldHoldChanges: fallbackResponse.shouldHoldChanges,
          promptVersion: 'fallback-1.0.0',
          modelId: 'template',
          tokensUsed: 0,
          generationTimeMs: 0,
          contextSnapshot: JSON.parse(JSON.stringify(context)),
          usedFallback: true,
          fallbackReason,
        },
        update: {
          explanationText: fallbackResponse.explanationText,
          progressSummary: fallbackResponse.progressSummary,
          whyThisDecision: fallbackResponse.whyThisDecision,
          whatToDoNext: fallbackResponse.whatToDoNext,
          motivationalNote: fallbackResponse.motivationalNote,
          safetyNote: fallbackResponse.safetyNote || null,
          needsMedicalDisclaimer: fallbackResponse.needsMedicalDisclaimer,
          shouldHoldChanges: fallbackResponse.shouldHoldChanges,
          promptVersion: 'fallback-1.0.0',
          modelId: 'template',
          usedFallback: true,
          fallbackReason,
        },
      });

      explanation = this.mapToResponseDto(saved);
    }

    return explanation;
  }

  /**
   * Get explanation by decision record ID (read-only, no generation)
   */
  async getExplanation(
    userId: string,
    decisionRecordId: string,
  ): Promise<AiExplanationResponseDto | null> {
    const explanation = await this.prisma.aiExplanation.findUnique({
      where: { decisionRecordId },
    });

    if (!explanation) {
      return null;
    }

    if (explanation.userId !== userId) {
      return null;
    }

    return this.mapToResponseDto(explanation);
  }

  /**
   * Get all explanations for a user
   */
  async getUserExplanations(userId: string): Promise<AiExplanationResponseDto[]> {
    const explanations = await this.prisma.aiExplanation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return explanations.map((e) => this.mapToResponseDto(e));
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponseDto(entity: any): AiExplanationResponseDto {
    return {
      id: entity.id,
      decisionRecordId: entity.decisionRecordId,
      explanationText: entity.explanationText,
      progressSummary: entity.progressSummary,
      whyThisDecision: entity.whyThisDecision,
      whatToDoNext: entity.whatToDoNext as string[] | null,
      motivationalNote: entity.motivationalNote,
      safetyNote: entity.safetyNote,
      needsMedicalDisclaimer: entity.needsMedicalDisclaimer,
      shouldHoldChanges: entity.shouldHoldChanges,
      usedFallback: entity.usedFallback,
      createdAt: entity.createdAt,
    };
  }
}
