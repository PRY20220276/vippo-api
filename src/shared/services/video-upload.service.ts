import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoUploadService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = 'vippo-bucket-media-dev'; // Replace with your bucket name
  }

  async uploadVideo(
    file: Express.Multer.File,
    userId: number,
  ): Promise<string> {
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}_${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(fileName);

    await blob.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          userId: userId,
        },
      },
    });

    return `gs://${this.bucketName}/${fileName}`;
  }
}
