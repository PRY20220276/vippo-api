import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = 'vippo-bucket-media-dev';
    this.storage.bucket(this.bucketName).setCorsConfiguration([
      {
        origin: ['http://localhost:3000', 'https://app.vippo.space'],
        responseHeader: ['Content-Type'],
        method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
      },
    ]);
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

  async findOneByUserId(userId: number, fileName: string) {
    const bucket = this.storage.bucket(this.bucketName);
    const name = userId + '/' + fileName;
    const file = bucket.file(name);

    try {
      const [metadata] = await file.getMetadata();
      return { metadata };
    } catch (error) {
      throw new NotFoundException(`Video ${fileName} not found`);
    }
  }

  async getObjectsByUserId(userId: number, limit: number, page: number) {
    const bucket = this.storage.bucket(this.bucketName);
    const prefix = userId + '/';
    const startOffset = (page - 1) * limit;

    const [files] = await bucket.getFiles({
      prefix: prefix,
      maxResults: limit,
    });

    const [allUserFiles] = await bucket.getFiles({
      prefix: prefix,
    });

    const totalItems = allUserFiles.length;

    return {
      items: files,
      totalItems,
    };
  }

  async getSignedUrl(contentType: string, userId: number): Promise<object> {
    // Get the extension based on the content type
    const extension = contentType.split('/')[1];
    const fileName = `${uuidv4()}.${extension}`;
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(`${userId}/${fileName}`)
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
