import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { VideoUploadService } from '../shared/services/video-upload.service';

@Injectable()
export class VideosService {
  constructor(
    private readonly videoUploadService: VideoUploadService,
    private readonly prismaService: PrismaService,
  ) {}
  async create(userId: number, videoFile: Express.Multer.File) {
    // Write the code here
    const videoUrl = await this.videoUploadService.uploadVideo(videoFile);
    const video = await this.prismaService.video.create({
      data: {
        bucket: 'vippo-bucket-media-dev',
        name: '',
        contentType: videoFile.mimetype,
        path: videoUrl,
        owner: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return video;
  }

  findAll(userId: number) {
    return `This action returns all videos`;
  }

  findOne(userId: number, id: number) {
    return `This action returns a #${id} video`;
  }

  remove(userId: number, id: number) {
    return `This action removes a #${id} video`;
  }
}
