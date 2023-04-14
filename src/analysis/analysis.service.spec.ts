import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../shared/prisma.service';
import { VideoAnalysisService } from '../shared/video-analysis.service';
import { VideoStorageService } from '../shared/video-storage.service';
import { VideosService } from '../videos/videos.service';
import { AnalysisService } from './analysis.service';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let videoAnalysisService: VideoAnalysisService;
  let videoUploadService: VideoStorageService;
  let videosService: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        PrismaService,
        VideoAnalysisService,
        VideoStorageService,
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
