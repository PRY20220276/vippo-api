import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class SearchVideoQueryDto extends PartialType(PaginationQueryDto) {
  @IsString()
  @IsOptional()
  filterBy?: string;
}
