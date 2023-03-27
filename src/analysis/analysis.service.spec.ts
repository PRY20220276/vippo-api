import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../shared/services/prisma.service';
import { VideoAnalysisService } from '../shared/services/video-analysis.service';
import { VideoUploadService } from '../shared/services/video-upload.service';
import { VideosService } from '../videos/videos.service';
import { AnalysisService } from './analysis.service';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let videoAnalysisService: VideoAnalysisService;
  let videoUploadService: VideoUploadService;
  let videosService: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        PrismaService,
        VideoAnalysisService,
        VideoUploadService,
        VideosService,
        EventEmitter2,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
