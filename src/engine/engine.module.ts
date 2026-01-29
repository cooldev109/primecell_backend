import { Module } from '@nestjs/common';
import { EngineService } from './engine.service';
import {
  EngineController,
  PlansController,
  DecisionsController,
} from './engine.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EngineController, PlansController, DecisionsController],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
