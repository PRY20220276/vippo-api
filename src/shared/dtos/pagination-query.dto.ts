import { Transform, TransformFnParams } from 'class-transformer';
import { IsNumber, Min, Max } from 'class-validator';

export class PaginationQueryDto {
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }: TransformFnParams) => parseInt(value, 10))
  limit: number;

  @IsNumber()
  @Min(1)
  @Transform(({ value }: TransformFnParams) => parseInt(value, 10))
  page: number;
}
