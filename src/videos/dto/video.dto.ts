import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VideoDto {
  @Expose()
  bucket: string;

  @Expose()
  originalName: string;

  @Expose()
  fileName: string;

  @Expose()
  contentType: string;

  @Expose()
  size: number;

  @Expose()
  path: string;

  @Expose()
  url: string;

  @Expose()
  ownerId: number;

  static fromPlain(plain: Record<string, any>): VideoDto {
    const video = new VideoDto();
    video.bucket = plain.bucket;
    video.originalName = plain.originalName;
    video.fileName = plain.fileName;
    video.contentType = plain.contentType;
    video.size = plain.size;
    video.path = plain.path;
    video.url = plain.url;
    video.ownerId = plain.owner.id;
    return video;
  }

  toPlain(): Record<string, any> {
    return {
      bucket: this.bucket,
      originalName: this.originalName,
      fileName: this.fileName,
      contentType: this.contentType,
      size: this.size,
      path: this.path,
      url: this.url,
      owner: {
        id: this.ownerId,
      },
    };
  }
}
