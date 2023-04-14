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
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @Get('signed-url')
  @ApiOperation({
    summary: 'Get signed url for bucket uploading',
  })
  signedUrl(
    @Query('contentType') contentType: string,
    @CurrentUser() user: User,
  ) {
    return this.videosService.createSignedUrl(user.id, contentType);
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
