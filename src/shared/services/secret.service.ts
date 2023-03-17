import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SecretService {
  private client: SecretManagerServiceClient;

  constructor() {
    this.client = new SecretManagerServiceClient();
  }

  async getSecret(secretName: string): Promise<string> {
    if (process.env.NODE_ENV === 'production') {
      const [version] = await this.client.accessSecretVersion({
        name: `projects/vippo-project/secrets/${secretName}/versions/latest`,
      });
      return version.payload.data.toString();
    } else {
      return process.env[secretName];
    }
  }
}
