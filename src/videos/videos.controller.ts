import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { User, Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dto/pagination-response.dto';
import { SearchVideoQueryDto } from './dto/search-video-query.dto';

@ApiBearerAuth()
@ApiTags('Videos')
@Controller('me/videos')
@UseInterceptors(ClassSerializerInterceptor)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({
    summary: 'Upload a video to your personal drive',
  })
  create(
    @CurrentUser() user: User,
    @UploadedFile() videoFile: Express.Multer.File,
  ) {
    return this.videosService.create(user.id, videoFile);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all of your videos in your personal drive',
  })
  findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginationResponseDto<Video>> {
    return this.videosService.findAll(paginationQueryDto, user.id);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search for different videos in your personal drive',
  })
  search(
    @Query() searchVideoQueryDto: SearchVideoQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginationResponseDto<Video>> {
    return this.videosService.search(searchVideoQueryDto, user.id);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get stats for your personal drive',
  })
  stats(@CurrentUser() user: User) {
    return this.videosService.stats(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an especific video from your personal drive',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.videosService.findOneByUserId(+id, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a specific video from your personal drive',
  })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.videosService.remove(+id, user.id);
  }
}
