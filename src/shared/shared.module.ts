import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { VideoAnalysisService } from './services/video-analysis.service';
import { VideoUploadService } from './services/video-upload.service';

@Global()
@Module({
  exports: [PrismaService, VideoUploadService, VideoAnalysisService],
  providers: [PrismaService, VideoUploadService, VideoAnalysisService],
})
export class SharedModule {}
