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
  ParseFilePipeBuilder,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { User, Video } from '@prisma/client';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { PaginationResponseDto } from '../shared/dto/pagination-response.dto';
import { SearchVideoQueryDto } from './dto/search-video-query.dto';
import { CreateVideoDto } from './dto/create-video.dto';

@ApiBearerAuth()
@ApiTags('Videos')
@Controller('me/videos')
@UseInterceptors(ClassSerializerInterceptor)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('signed-url')
  @ApiOperation({
    summary: 'Generate signed url for bucket uploading',
  })
  signedUrl(@Body() createVideDto: CreateVideoDto, @CurrentUser() user: User) {
    return this.videosService.createSignedUrl(user.id, createVideDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all of your videos in your personal drive',
  })
  findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @CurrentUser() user: User,
  ) {
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

  @Get(':fileName')
  @ApiOperation({
    summary: 'Retrieve an especific video from your personal drive',
  })
  findOne(@Param('fileName') fileName: string, @CurrentUser() user: User) {
    return this.videosService.findOneByUserId(fileName, user.id);
  }

  @Delete(':fileName')
  @ApiOperation({
    summary: 'Delete a specific video from your personal drive',
  })
  remove(@Param('fileName') fileName: string, @CurrentUser() user: User) {
    return this.videosService.remove(fileName, user.id);
  }
}
