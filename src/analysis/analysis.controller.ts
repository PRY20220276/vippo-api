import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dtos/create-analysis.dto';

@ApiTags('Video Analysis Module')
@Controller()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('videos/:videoId/analysis')
  create(@Body() createAnalysisDto: CreateAnalysisDto) {
    return this.analysisService.create(createAnalysisDto);
  }

  @Get('videos/:videoId/analysis')
  findAll() {
    return this.analysisService.findAll();
  }

  @Get('videos/:videoId/analysis/:id')
  findOne(@Param('id') id: string) {
    return this.analysisService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analysisService.remove(+id);
  }
}
