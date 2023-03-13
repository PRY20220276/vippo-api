import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';

@Module({
  exports: [VideosService],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
