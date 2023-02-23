import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UsersModule,
    VideosModule,
    AnalysisModule,
  ],
})
export class AppModule {}
