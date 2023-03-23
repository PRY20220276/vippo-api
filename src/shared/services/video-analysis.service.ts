import { BadRequestException, Injectable } from '@nestjs/common';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';

@Injectable()
export class VideoAnalysisService {
  private readonly client: VideoIntelligenceServiceClient;

  constructor() {
    this.client = new VideoIntelligenceServiceClient();
  }

  /**
   * It takes a GCS URI, sends it to the Cloud Video Intelligence API, and returns a summary of the
   * video based on the labels
   * @param {string} gcsUri - The URI of the video stored in Google Cloud Storage.
   * @returns A string containing a summary of the video based on the labels
   */
  async generateAnnotations(gcsUri: string) {
    const videoContext = {
      speechTranscriptionConfig: {
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    };

    const [operation] = await this.client.annotateVideo({
      inputUri: gcsUri,
      features: [1, 6, 3],
      videoContext: videoContext,
    });

    const [operationResult] = await operation.promise();

    // Gets annotations for video
    const annotationResults = operationResult.annotationResults[0];

    return annotationResults;
  }

  /**
   * It takes a GCS URI, sends it to the Cloud Video Intelligence API, and returns a summary of the
   * video based on the labels
   * @param {string} gcsUri - The URI of the video stored in Google Cloud Storage.
   * @returns A string containing a summary of the video based on the labels
   */
  async generateSummary(gcsUri: string): Promise<string> {
    const [operation] = await this.client.annotateVideo({
      inputUri: gcsUri,
      features: [1],
    });

    const [result] = await operation.promise();

    if (result.annotationResults.length === 0) {
      throw new BadRequestException('No analysis results found.');
    }

    const labels = result.annotationResults[0].segmentLabelAnnotations;

    // Return a summary of the video based on the labels
    const summary = labels.map((label) => label.entity.description).join(', ');

    return summary;
  }

  /**
   * We're using the Google Cloud Video Intelligence API to analyze the video and return a transcript
   * @param {string} gcsUri - The URI of the video file in Google Cloud Storage.
   * @returns The transcript of the video
   */
  async generateTranscript(gcsUri: string): Promise<object> {
    const videoContext = {
      speechTranscriptionConfig: {
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    };
    const [operation] = await this.client.annotateVideo({
      inputUri: gcsUri,
      features: [6],
      videoContext: videoContext,
    });

    const [operationResult] = await operation.promise();

    const annotationResults = operationResult.annotationResults[0];

    if (annotationResults.speechTranscriptions.length === 0) {
      throw new BadRequestException('No analysis results found.');
    }

    return annotationResults.speechTranscriptions;
  }

  async detectUnsafeContent(gcsUri: string): Promise<object> {
    const likelihoods = [
      'UNKNOWN',
      'VERY_UNLIKELY',
      'UNLIKELY',
      'POSSIBLE',
      'LIKELY',
      'VERY_LIKELY',
    ];

    const [operation] = await this.client.annotateVideo({
      inputUri: gcsUri,
      features: [3],
    });

    const [operationResult] = await operation.promise();

    const annotationResults = operationResult.annotationResults[0];

    if (annotationResults.speechTranscriptions.length === 0) {
      throw new BadRequestException('No analysis results found.');
    }

    return annotationResults.speechTranscriptions;
  }
}
