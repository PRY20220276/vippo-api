import { BadRequestException, Injectable } from '@nestjs/common';
import { Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dtos/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dtos/pagination-response.dto';
import { PrismaService } from '../shared/services/prisma.service';
import { VideoUploadService } from '../shared/services/video-upload.service';

@Injectable()
export class VideosService {
  constructor(
    private readonly videoUploadService: VideoUploadService,
    private readonly prismaService: PrismaService,
  ) {}
  async create(userId: number, videoFile: Express.Multer.File) {
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
        name: videoFile.originalname,
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
    return new PaginationResponseDto(items, total, page, limit);
  }

  findOne(userId: number, id: number) {
    return `This action returns a #${id} video`;
  }

  remove(userId: number, id: number) {
    return `This action removes a #${id} video`;
  }
}
