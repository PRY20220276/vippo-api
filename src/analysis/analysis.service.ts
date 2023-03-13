import { Injectable } from '@nestjs/common';
import { VideosService } from '../videos/videos.service';
import { VideoAnalysisService } from '../shared/services/video-analysis.service';
import { CreateAnalysisDto } from './dtos/create-analysis.dto';
import { UpdateAnalysisDto } from './dtos/update-analysis.dto';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly videosService: VideosService,
    private readonly videoAnalysisService: VideoAnalysisService,
  ) {}
  async create(ownerId: number, videoId: number) {
    const video = await this.videosService.findOneByUserId(videoId, ownerId);
    const summary = await this.videoAnalysisService.generateSummary(video.path);
    return summary;
  }

  findAll() {
    return `This action returns all analysis`;
  }

  findOne(id: number) {
    return `This action returns a #${id} analysis`;
  }

  update(id: number, updateAnalysisDto: UpdateAnalysisDto) {
    return `This action updates a #${id} analysis`;
  }

  remove(id: number) {
    return `This action removes a #${id} analysis`;
  }
}
