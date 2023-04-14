import { IsString } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  contentType: string;

  @IsString()
  fileName: string;
}
