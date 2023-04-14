import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dto/pagination-response.dto';
import { PrismaService } from '../shared/prisma.service';
import { VideoStorageService } from '../shared/video-storage.service';
import { SearchVideoQueryDto } from './dto/search-video-query.dto';
import { VideoDto } from './dto/video.dto';
import { VideoCreatedEvent } from './events/video-created.event';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  constructor(
    private readonly videoUploadService: VideoStorageService,
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSignedUrl(userId: number, contentType: string) {
    if (!/^video\/(mp4|webm|quicktime)$/.test(contentType)) {
      throw new BadRequestException(
        'Invalid content type. Only video files are allowed.',
      );
    }
    const bucketResponse = await this.videoUploadService.getSignedUrl(
      contentType,
      userId,
    );
    return bucketResponse;
  }

  async create(userId: number, videoFile: Express.Multer.File) {
    this.logger.log(`Creating video for user ${userId}`);

    const totalSize = await this.prismaService.video.aggregate({
      _sum: { size: true },
      where: { ownerId: userId },
    });

    if (totalSize._sum.size + videoFile.size >= 1000000000) {
      throw new BadRequestException('User storage limit exceeded');
    }

    const uploadedVideo = await this.videoUploadService.uploadVideo(
      videoFile,
      userId,
    );

    const video = await this.prismaService.video.create({
      data: {
        bucket: 'vippo-bucket-media-dev',
        originalName: videoFile.originalname,
        fileName: uploadedVideo.fileName,
        contentType: videoFile.mimetype,
        size: videoFile.size,
        path: uploadedVideo.path,
        url: uploadedVideo.url,
        owner: {
          connect: {
            id: userId,
          },
        },
      },
    });

    const videoCreatedEvent = new VideoCreatedEvent();
    videoCreatedEvent.gcsUri = video.path;
    videoCreatedEvent.userId = userId;
    videoCreatedEvent.videoId = video.id;
    this.eventEmitter.emit('video.created', videoCreatedEvent);

    this.logger.log(`Video created successfully for user ${userId}`);

    return VideoDto.fromPlain(video);
  }

  async findAll(
    paginationQueryDto: PaginationQueryDto,
    userId: number,
  ): Promise<object> {
    const limit = paginationQueryDto.limit || 10;
    const page = paginationQueryDto.page || 1;
    /*
    const items = await this.prismaService.video.findMany({
      where: {
        ownerId: userId,
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        owner: true,
        videoAnalysis: true,
      },
    });
    const total = await this.prismaService.video.count({
      where: {
        ownerId: userId,
      },
    });
    */
    const { items, totalItems } =
      await this.videoUploadService.getObjectsByUserId(userId, limit, page);
    const userVideos = items.map((file) => {
      return {
        name: file.metadata.name.split('/')[1],
        thumbnail: `https://ik.imagekit.io/4jp52ung9/${file.metadata.name}/ik-thumbnail.jpg`,
        src: `https://ik.imagekit.io/4jp52ung9/${file.metadata.name}`,
        downloadPath: file.metadata.mediaLink,
        size: +file.metadata.size,
        link: file.metadata.selfLink,
        contentType: file.metadata.contentType,
        createdAt: file.metadata.timeCreated,
      };
    });

    this.logger.log(`Retrieved ${items.length} videos for user #${userId}`);

    return new PaginationResponseDto(userVideos, totalItems, page, limit);
  }

  async search(
    searchVideoQueryDto: SearchVideoQueryDto,
    userId: number,
  ): Promise<PaginationResponseDto<Video>> {
    const limit = searchVideoQueryDto.limit || 10;
    const page = searchVideoQueryDto.page || 1;
    const items = await this.prismaService.video.findMany({
      where: {
        ownerId: userId,
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        owner: true,
        videoAnalysis: true,
      },
    });
    const total = await this.prismaService.video.count({
      where: {
        ownerId: userId,
      },
    });

    this.logger.log(`Retrieved ${items.length} videos for user #${userId}`);

    return new PaginationResponseDto(items, total, page, limit);
  }

  async stats(userId: number) {
    const total = await this.prismaService.video.count({
      where: {
        ownerId: userId,
      },
    });

    const totalSize = await this.prismaService.video.aggregate({
      _sum: { size: true },
      where: { ownerId: userId },
    });

    const usedSize = totalSize._sum.size;
    const maxSize = 1000000000;
    const usedGB = (usedSize / 1000000000).toFixed(2) + 'GB';
    const maxGB = (maxSize / 1000000000).toFixed(2) + 'GB';
    const usedPercentage = ((usedSize / maxSize) * 100).toFixed(2) + '%';
    const freePercentage =
      (((maxSize - usedSize) / maxSize) * 100).toFixed(2) + '%';

    const freeSpaceGb = ((maxSize - usedSize) / maxSize).toFixed(2) + 'GB';

    this.logger.log(`Retrieved stats videos for user #${userId}`);

    return {
      countStorageItems: total,
      totalStorageUsed: usedSize,
      maxStorageSize: maxSize,
      percentageStorageUsed: usedPercentage,
      percentageStorageFree: freePercentage,
      usedGB: usedGB,
      freeGB: freeSpaceGb,
      maxGB: maxGB,
    };
  }

  async findOne(id: number) {
    const video = await this.prismaService.video.findUnique({
      where: {
        id: id,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video #${id} not found`);
    }
    this.logger.log(`Retrieved video #${id}`);
    return video;
  }

  async findOneByUserId(fileName: string, userId: number) {
    const video = await this.videoUploadService.findOneByUserId(
      userId,
      fileName,
    );

    this.logger.log(`Retrieved video #${fileName} with owner #${userId}`);

    return {
      name: video.metadata.name.split('/')[1],
      thumbnail: `https://ik.imagekit.io/4jp52ung9/${video.metadata.name}/ik-thumbnail.jpg`,
      src: `https://ik.imagekit.io/4jp52ung9/${video.metadata.name}`,
      downloadPath: video.metadata.mediaLink,
      size: +video.metadata.size,
      link: video.metadata.selfLink,
      contentType: video.metadata.contentType,
      createdAt: video.metadata.timeCreated,
    };
  }

  async remove(fileName: string, userId: number) {
    const video = await this.findOneByUserId(fileName, userId);

    await this.videoUploadService.deleteVideo(fileName);

    return video;
  }
}
