import { PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

export class SearchVideoQueryDto extends PartialType(PaginationQueryDto) {
  @IsString()
  query: string;
}
