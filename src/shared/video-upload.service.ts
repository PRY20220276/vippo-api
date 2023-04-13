import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoUploadService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = 'vippo-bucket-media-dev';
  }

  async uploadVideo(file: Express.Multer.File, userId: number) {
    const extension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
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

      return {
        path: `gs://${this.bucketName}/${fileName}`,
        url: blob.publicUrl(),
        fileName: fileName,
      };
    } catch (err) {
      console.log(err);
      throw new ServiceUnavailableException(
        'Something went wrong with the upload, try again later',
      );
    }
  }

  async getSignedUrl(contentType: string): Promise<object> {
    const fileName = uuidv4();
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(fileName)
      .getSignedUrl({
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        version: 'v4',
        contentType: contentType,
      });

    return {
      signedUrl: url,
      fileName: fileName,
    };
  }

  async deleteVideo(fileName: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(fileName);
    try {
      await blob.delete();
    } catch (err) {
      console.log(err);
      throw new ServiceUnavailableException(
        'Something went wrong with the delete operation, try again later',
      );
    }
  }
}
