import { Injectable } from '@nestjs/common';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';

@Injectable()
export class VideoAnalysisService {
  private client: VideoIntelligenceServiceClient;

  constructor() {
    this.client = new VideoIntelligenceServiceClient();
  }

  async generateSummary(gcsUri: string): Promise<string> {
    const [operation] = await this.client.annotateVideo({
      inputUri: gcsUri,
      features: [1],
    });

    const [result] = await operation.promise();

    if (result.annotationResults.length === 0) {
      throw new Error('No analysis results found.');
    }

    const labels = result.annotationResults[0].segmentLabelAnnotations;

    // Return a summary of the video based on the labels
    const summary = labels.map((label) => label.entity.description).join(', ');

    return summary;
  }
}
