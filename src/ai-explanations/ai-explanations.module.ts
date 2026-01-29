import { Module } from '@nestjs/common';
import { AiExplanationsService } from './ai-explanations.service';
import { AiExplanationsController } from './ai-explanations.controller';
import { ContextBuilderService } from './context-builder.service';
import { OpenAiService } from './openai.service';
import { FallbackTemplateService } from './fallback-template.service';
import { JourneySummaryService } from './journey-summary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiExplanationsController],
  providers: [
    AiExplanationsService,
    ContextBuilderService,
    OpenAiService,
    FallbackTemplateService,
    JourneySummaryService,
  ],
  exports: [AiExplanationsService, JourneySummaryService],
})
export class AiExplanationsModule {}
