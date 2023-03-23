import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/services/prisma.service';
import { VideoUploadService } from 'src/shared/services/video-upload.service';
import { VideosService } from './videos.service';

describe('VideosService', () => {
  let service: VideosService;
  let prismaService: PrismaService;
  let videoUploadService: VideoUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideosService],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
