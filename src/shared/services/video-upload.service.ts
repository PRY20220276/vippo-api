import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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

  async uploadVideo(file: Express.Multer.File, userId: number) {
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}_${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(fileName);
    try {
      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            userId: userId,
          },
        },
      });
      // Make the uploaded file publicly accessible
      // await blob.makePublic();

      return {
        path: `gs://${this.bucketName}/${fileName}`,
        url: blob.publicUrl(),
      };
    } catch (err) {
      console.log(err);
      throw new ServiceUnavailableException(
        'Something went wrong with the upload, try again later',
      );
    }
  }
}
