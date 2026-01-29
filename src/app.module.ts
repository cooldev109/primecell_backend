import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { EmailModule } from './email';
import { AuthModule } from './auth';
import { UsersModule } from './users';
import { OnboardingModule } from './onboarding/onboarding.module';
import { EngineModule } from './engine/engine.module';
import { CheckinsModule } from './checkins/checkins.module';
import { AiExplanationsModule } from './ai-explanations/ai-explanations.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    OnboardingModule,
    EngineModule,
    CheckinsModule,
    AiExplanationsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
