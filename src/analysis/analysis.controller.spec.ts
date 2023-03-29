import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma.service';
import { VideoAnalysisService } from '../shared/video-analysis.service';
import { VideoUploadService } from '../shared/video-upload.service';
import { VideosService } from '../videos/videos.service';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

describe('AnalysisController', () => {
  let controller: AnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        AnalysisService,
        VideosService,
        VideoAnalysisService,
        VideoUploadService,
        PrismaService,
        EventEmitter2,
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
