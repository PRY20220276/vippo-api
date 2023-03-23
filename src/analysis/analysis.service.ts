import { BadRequestException, Injectable } from '@nestjs/common';
import { VideosService } from '../videos/videos.service';
import { VideoAnalysisService } from '../shared/services/video-analysis.service';
import { UpdateAnalysisDto } from './dtos/update-analysis.dto';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly videosService: VideosService,
    private readonly videoAnalysisService: VideoAnalysisService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(ownerId: number, videoId: number) {
    /*
    const existingAnalysis = await this.prismaService.videoAnalysis.findFirst({
      where: {
        video: {
          ownerId: ownerId,
          id: videoId,
        },
      },
    });

    if (existingAnalysis) {
      throw new BadRequestException('Analysis already performed');
    }
    const analysis = await this.prismaService.videoAnalysis.create({
      data: {
        labels: labels,
        transcript: transcript,
        explicitContent: explicitContent,
        video: {
          connect: {
            id: video.id,
          },
        },
      },
    });
    */

    const video = await this.videosService.findOneByUserId(videoId, ownerId);

    const annotationResults =
      await this.videoAnalysisService.generateAnnotations(video.path);

    const labels = JSON.stringify(annotationResults.segmentLabelAnnotations);

    const transcript = JSON.stringify(annotationResults.speechTranscriptions);

    const explicitContent = JSON.stringify(
      annotationResults.explicitAnnotation,
    );

    return {
      labels,
      transcript,
      explicitContent,
    };
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
