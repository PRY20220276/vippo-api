import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { VideosService } from '../videos/videos.service';
import { VideoAnalysisService } from '../shared/video-analysis.service';
import { UpdateAnalysisDto } from './dtos/update-analysis.dto';
import { PrismaService } from '../shared/prisma.service';
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
    try {
      const annotationResults =
        await this.videoAnalysisService.generateAnnotations(video.path);

      const labelsParsed = annotationResults.segmentLabelAnnotations.map(
        (label) => {
          return label.entity.description;
        },
      );

      const labels = JSON.stringify(annotationResults.segmentLabelAnnotations);

      const transcript = JSON.stringify(annotationResults.speechTranscriptions);

      const explicitContent = JSON.stringify(
        annotationResults.explicitAnnotation,
      );

      const analysis = await this.prismaService.videoAnalysis.create({
        data: {
          labelsParsed: labelsParsed,
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
    } catch (err) {
      console.error(err);
      throw new ServiceUnavailableException(
        'Something went wrong with the analysis, try again later',
      );
    }
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

    const analysis = await this.create(payload.userId, payload.videoId);

    return analysis;
  }
}
