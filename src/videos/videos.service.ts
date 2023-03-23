import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dto/pagination-response.dto';
import { PrismaService } from '../shared/services/prisma.service';
import { VideoUploadService } from '../shared/services/video-upload.service';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  constructor(
    private readonly videoUploadService: VideoUploadService,
    private readonly prismaService: PrismaService,
  ) {}
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

    this.logger.log(`Video created successfully for user ${userId}`);

    return video;
  }

  async findAll(
    paginationQueryDto: PaginationQueryDto,
    userId: number,
  ): Promise<PaginationResponseDto<Video>> {
    const limit = paginationQueryDto.limit || 10;
    const page = paginationQueryDto.page || 1;
    const items = await this.prismaService.video.findMany({
      where: {
        ownerId: userId,
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        owner: true,
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

  async findOneByUserId(id: number, userId: number) {
    const video = await this.prismaService.video.findFirst({
      where: {
        id: id,
        ownerId: userId,
      },
      include: {
        owner: true,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video #${id} not found`);
    }

    this.logger.log(`Retrieved video #${id} with owner #${userId}`);

    return video;
  }

  async remove(id: number, userId: number) {
    const video = await this.findOneByUserId(id, userId);
    await this.videoUploadService.deleteVideo(video.fileName);
    const deletedVideo = await this.prismaService.video.delete({
      where: {
        id: id,
      },
    });
    return deletedVideo;
  }
}
