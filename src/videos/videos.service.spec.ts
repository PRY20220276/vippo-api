import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { VideosService } from './videos.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../shared/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VideoUploadService } from '../shared/video-upload.service';

describe('VideosService', () => {
  let service: VideosService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let videoUploadService: VideoUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        PrismaService,
        VideoUploadService,
        EventEmitter2,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<VideosService>(VideosService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
