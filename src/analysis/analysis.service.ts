import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { VideosService } from '../videos/videos.service';
import { VideoAnalysisService } from '../shared/services/video-analysis.service';
import { UpdateAnalysisDto } from './dtos/update-analysis.dto';
import { PrismaService } from '../shared/services/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { VideoCreatedEvent } from '../videos/events/video-created.event';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly videosService: VideosService,
    private readonly videoAnalysisService: VideoAnalysisService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(ownerId: number, videoId: number) {
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

    const video = await this.videosService.findOneByUserId(videoId, ownerId);

    const annotationResults =
      await this.videoAnalysisService.generateAnnotations(video.path);

    const labels = JSON.stringify(annotationResults.segmentLabelAnnotations);

    const transcript = JSON.stringify(annotationResults.speechTranscriptions);

    const explicitContent = JSON.stringify(
      annotationResults.explicitAnnotation,
    );

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

    return analysis;
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

  @OnEvent('video.created', { async: true })
  async handleVideoCreatedEvent(payload: VideoCreatedEvent) {
    this.logger.log(
      `Event received to create analysis for video #${payload.videoId}`,
    );

    const existingAnalysis = await this.prismaService.videoAnalysis.findFirst({
      where: {
        video: {
          ownerId: payload.userId,
          id: payload.videoId,
        },
      },
    });

    if (existingAnalysis) {
      this.logger.error(
        `Video analysis for video #${payload.videoId} already exists`,
      );
      throw new BadRequestException('Analysis already performed');
    }

    const annotationResults =
      await this.videoAnalysisService.generateAnnotations(payload.gcsUri);

    const labels = JSON.stringify(annotationResults.segmentLabelAnnotations);

    const transcript = JSON.stringify(annotationResults.speechTranscriptions);

    const explicitContent = JSON.stringify(
      annotationResults.explicitAnnotation,
    );

    const analysis = await this.prismaService.videoAnalysis.create({
      data: {
        labels: labels,
        transcript: transcript,
        explicitContent: explicitContent,
        video: {
          connect: {
            id: payload.videoId,
          },
        },
      },
    });

    this.logger.log(
      `Created and store video analysis for video #${payload.videoId}`,
    );

    return analysis;
  }
}
