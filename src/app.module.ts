import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { AnalysisModule } from './analysis/analysis.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    SharedModule,
    AuthModule,
    UsersModule,
    VideosModule,
    AnalysisModule,
    PlansModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
