import { Injectable } from '@nestjs/common';
import ImageKit from 'imagekit';

@Injectable()
export class ImagekitService {
  private readonly imagekit: ImageKit;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: 'your_public_api_key',
      privateKey: 'your_private_api_key',
      urlEndpoint: 'https://ik.imagekit.io/your_imagekit_id/',
    });
  }
}
