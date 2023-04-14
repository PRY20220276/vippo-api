import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { VideoAnalysisService } from './video-analysis.service';
import { VideoStorageService } from './video-storage.service';
@Global()
@Module({
  exports: [PrismaService, VideoStorageService, VideoAnalysisService],
  providers: [PrismaService, VideoStorageService, VideoAnalysisService],
})
export class SharedModule {}
