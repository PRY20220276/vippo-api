import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dto/pagination-response.dto';
import { PrismaService } from '../shared/prisma.service';
import { VideoStorageService } from '../shared/video-storage.service';
import { SearchVideoQueryDto } from './dto/search-video-query.dto';
import { VideoDto } from './dto/video.dto';
import { VideoCreatedEvent } from './events/video-created.event';
import { CreateVideoDto } from './dto/create-video.dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  constructor(
    private readonly videoUploadService: VideoStorageService,
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSignedUrl(userId: number, createVideoDto: CreateVideoDto) {
    if (!/^video\/(mp4|webm|quicktime)$/.test(createVideoDto.contentType)) {
      throw new BadRequestException(
        'Invalid content type. Only video files are allowed.',
      );
    }
    // const extension = createVideoDto.contentType.split('/')[1];
    const fileName = this.generateFriendlyFileName(createVideoDto.fileName);
    const signedUrl = await this.videoUploadService.getSignedUrl(
      userId,
      fileName,
      createVideoDto.contentType,
    );
    return {
      signedUrl,
      fileName,
    };
  }

  generateFriendlyFileName(originalFilename: string): string {
    const currentDate = new Date();
    const formattedDate = currentDate
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      .replace(/\//g, '')
      .replace(/:/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '');

    const fileExtension = originalFilename.split('.').pop();
    const fileBaseName = originalFilename
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '_');

    const friendlyFilename = `${fileBaseName}-${formattedDate}.${fileExtension}`;
    return friendlyFilename;
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

    this.logger.log(`Video created successfully for user ${userId}`);

    return VideoDto.fromPlain(video);
  }

  async findAll(
    paginationQueryDto: SearchVideoQueryDto,
    userId: number,
  ): Promise<object> {
    const limit = paginationQueryDto.limit || 10;
    const page = paginationQueryDto.page || 1;
    const filterBy = paginationQueryDto.filterBy;
    const { items, totalItems } = await this.videoUploadService.findAllByUserId(
      userId,
      limit,
      page,
    );

    let userVideos = items.map((videoFile) => this.parseFileObject(videoFile));

    if (filterBy && filterBy === 'processing') {
      userVideos = userVideos.filter((video) => video.meta.processed === false);
    } else {
      userVideos = userVideos.filter((video) => video.meta.processed === true);
    }

    this.logger.log(
      `Retrieved ${userVideos.length} videos for user #${userId}`,
    );

    return new PaginationResponseDto(
      userVideos,
      userVideos.length,
      page,
      limit,
    );
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
    const { items, totalItems } = await this.videoUploadService.findAllByUserId(
      userId,
      1000,
      1,
    );

    const userVideos = items.map((videoFile) =>
      this.parseFileObject(videoFile),
    );

    const totalStorageUsed = userVideos.reduce((accumulator, currentVideo) => {
      return accumulator + currentVideo.size;
    }, 0);

    const usedSize = totalStorageUsed;
    const maxSize = 1000000000;
    const usedGB = (usedSize / 1000000000).toFixed(2) + 'GB';
    const maxGB = (maxSize / 1000000000).toFixed(2) + 'GB';
    const usedPercentage = ((usedSize / maxSize) * 100).toFixed(2) + '%';
    const freePercentage =
      (((maxSize - usedSize) / maxSize) * 100).toFixed(2) + '%';

    const freeSpaceGb = ((maxSize - usedSize) / maxSize).toFixed(2) + 'GB';

    this.logger.log(`Retrieved stats videos for user #${userId}`);

    return {
      countStorageItems: totalItems,
      totalStorageUsed: usedSize,
      maxStorageSize: maxSize,
      percentageStorageUsed: usedPercentage,
      percentageStorageFree: freePercentage,
      usedGB: usedGB,
      freeGB: freeSpaceGb,
      maxGB: maxGB,
    };
  }

  async findOneByUserId(fileName: string, userId: number) {
    const videoFile = await this.videoUploadService.findOneByUserId(
      userId,
      fileName,
    );

    this.logger.log(`Retrieved video #${fileName} with owner #${userId}`);

    return this.parseFileObject(videoFile);
  }

  async remove(fileName: string, userId: number) {
    const video = await this.findOneByUserId(fileName, userId);

    await this.videoUploadService.deleteVideo(fileName);

    return video;
  }

  parseFileObject(file) {
    return {
      name: file.metadata.name.split('/')[1],
      thumbnail: `https://ik.imagekit.io/4jp52ung9/${file.metadata.name}/ik-thumbnail.jpg`,
      src: `https://ik.imagekit.io/4jp52ung9/${file.metadata.name}`,
      downloadPath: file.metadata.mediaLink,
      size: +file.metadata.size,
      link: file.metadata.selfLink,
      contentType: file.metadata.contentType,
      createdAt: file.metadata.timeCreated,
      meta: {
        processed:
          file.metadata.metadata &&
          file.metadata.metadata.labels &&
          file.metadata.metadata.explicitContent &&
          file.metadata.metadata.objects &&
          file.metadata.metadata.transcript &&
          file.metadata.metadata.objectSummary
            ? true
            : false,
        // status: file.metadata.status,
        labels:
          file.metadata.metadata && file.metadata.metadata.labels
            ? JSON.parse(file.metadata.metadata.labels)
            : [],
        explicitContent:
          file.metadata.metadata && file.metadata.metadata.explicitContent
            ? JSON.parse(file.metadata.metadata.explicitContent)
            : [],
        objects:
          file.metadata.metadata && file.metadata.metadata.objects
            ? JSON.parse(file.metadata.metadata.objects)
            : [],
        transcript:
          file.metadata.metadata && file.metadata.metadata.transcript
            ? JSON.parse(file.metadata.metadata.transcript)
            : [],
        objectSummary:
          file.metadata.metadata && file.metadata.metadata.objectSummary
            ? JSON.parse(file.metadata.metadata.objectSummary)
            : [],
        textSummary:
          file.metadata.metadata && file.metadata.metadata.textSummary
            ? JSON.parse(file.metadata.metadata.textSummary)
            : [],
      },
    };
  }
}
