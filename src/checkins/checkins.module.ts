import { Module } from '@nestjs/common';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';
import { PrismaModule } from '../prisma';
import { EngineModule } from '../engine/engine.module';
import { AiExplanationsModule } from '../ai-explanations/ai-explanations.module';

@Module({
  imports: [PrismaModule, EngineModule, AiExplanationsModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
