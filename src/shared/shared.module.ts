import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { VideoAnalysisService } from './video-analysis.service';
import { VideoUploadService } from './video-upload.service';
@Global()
@Module({
  exports: [PrismaService, VideoUploadService, VideoAnalysisService],
  providers: [PrismaService, VideoUploadService, VideoAnalysisService],
})
export class SharedModule {}
