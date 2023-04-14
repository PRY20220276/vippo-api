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

  async create(ownerId: number, videoId: number, gcsUri: string) {
    const existingAnalysis = await this.prismaService.videoAnalysis.findFirst({
      where: {
        video: {
          ownerId: ownerId,
          id: videoId,
        },
      },
    });

    if (existingAnalysis) {
      await this.videoAnalysisService.generateAnnotationsAndSummary(gcsUri);
      throw new BadRequestException('Analysis already performed');
    }

    try {
      const annotationResults =
        await this.videoAnalysisService.generateAnnotationsAndSummary(gcsUri);

      const labels = JSON.stringify(annotationResults.labels);

      const transcript = JSON.stringify(annotationResults.transcript);

      const explicitContent = JSON.stringify(annotationResults.explicitContent);

      const analysis = await this.prismaService.videoAnalysis.create({
        data: {
          labelsParsed: annotationResults.labelsParsed,
          labels: labels,
          transcript: transcript,
          explicitContent: explicitContent,
          video: {
            connect: {
              id: videoId,
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

    const analysis = await this.create(
      payload.userId,
      payload.videoId,
      payload.gcsUri,
    );

    return analysis;
  }
}
