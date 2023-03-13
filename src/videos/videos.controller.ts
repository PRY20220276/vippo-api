import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { User, Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dtos/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dtos/pagination-response.dto';

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  create(
    @CurrentUser() user: User,
    @UploadedFile() videoFile: Express.Multer.File,
  ) {
    return this.videosService.create(user.id, videoFile);
  }

  @Get()
  findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginationResponseDto<Video>> {
    return this.videosService.findAll(paginationQueryDto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.videosService.findOne(user.id, +id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.videosService.remove(user.id, +id);
  }
}
