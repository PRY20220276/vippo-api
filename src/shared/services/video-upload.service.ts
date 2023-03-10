import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class VideoUploadService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = 'vippo-bucket-media-dev'; // Replace with your bucket name
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    const fileName = file.originalname;

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(fileName);

    await blob.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    return `gs://${this.bucketName}/${fileName}`;
  }
}
