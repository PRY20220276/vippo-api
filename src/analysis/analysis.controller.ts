import { Controller, Get, Post, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { AnalysisService } from './analysis.service';

@ApiBearerAuth()
@ApiTags('Video Analysis Module')
@Controller()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('videos/:videoId/analysis')
  create(@Param('videoId') videoId: string, @CurrentUser() user: User) {
    return this.analysisService.create(user.id, +videoId);
  }

  @Get('videos/:videoId/analysis')
  findAll() {
    return this.analysisService.findAll();
  }

  @Get('/analysis/:id')
  findOne(@Param('id') id: string) {
    return this.analysisService.findOne(+id);
  }

  @Delete('/analysis/:id')
  remove(@Param('id') id: string) {
    return this.analysisService.remove(+id);
  }
}
