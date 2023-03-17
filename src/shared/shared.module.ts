import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { SecretService } from './services/secret.service';
import { VideoAnalysisService } from './services/video-analysis.service';
import { VideoUploadService } from './services/video-upload.service';

@Global()
@Module({
  exports: [
    PrismaService,
    VideoUploadService,
    VideoAnalysisService,
    SecretService,
  ],
  providers: [
    PrismaService,
    VideoUploadService,
    VideoAnalysisService,
    SecretService,
  ],
})
export class SharedModule {}
