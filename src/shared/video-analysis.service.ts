import { BadRequestException, Injectable } from '@nestjs/common';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';

enum Feature {
  FEATURE_UNSPECIFIED = 0,
  LABEL_DETECTION = 1,
  SHOT_CHANGE_DETECTION = 2,
  EXPLICIT_CONTENT_DETECTION = 3,
  FACE_DETECTION = 4,
  SPEECH_TRANSCRIPTION = 6,
  TEXT_DETECTION = 7,
  OBJECT_TRACKING = 9,
  LOGO_RECOGNITION = 12,
  PERSON_DETECTION = 14,
}
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

  async generateAnnotationsAndSummary(gcsUri: string) {
    const videoContext = {
      speechTranscriptionConfig: {
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    };
    const [operation] = await this.client.annotateVideo({
      inputUri: gcsUri,
      features: [
        Feature.LABEL_DETECTION,
        Feature.SHOT_CHANGE_DETECTION,
        Feature.EXPLICIT_CONTENT_DETECTION,
        Feature.SPEECH_TRANSCRIPTION,
        Feature.TEXT_DETECTION,
        Feature.OBJECT_TRACKING,
      ],
      videoContext: videoContext,
    });
    // Annotate video using Google Cloud Video Intelligence API
    const [operationResult] = await operation.promise();
    // Gets annotations for video
    const annotationResults = operationResult.annotationResults[0];
    // Group object tracks by object entity ID
    const objectTracks = annotationResults.objectAnnotations;
    const objectGroups = {};
    objectTracks.forEach((track) => {
      const { entity } = track;
      const entityId = entity.entityId;
      if (!objectGroups[entityId]) {
        objectGroups[entityId] = [];
      }
      objectGroups[entityId].push(track);
    });
    // Select the most representative object track for each object entity
    const objectSummaries = [];
    Object.keys(objectGroups).forEach((entityId) => {
      const tracks = objectGroups[entityId];
      const representativeTrack = this.selectRepresentativeTrack(tracks);
      objectSummaries.push({
        entity: representativeTrack.entity.description,
        startTimeOffset: representativeTrack.startTimeOffset.seconds,
        endTimeOffset: representativeTrack.endTimeOffset.seconds,
        confidence: representativeTrack.confidence,
      });
    });
    // Sort object summaries by confidence score in descending order
    objectSummaries.sort((a, b) => b.confidence - a.confidence);
    // Select top 3 object summaries
    const topObjectSummaries = objectSummaries.slice(0, 3);
    // Add object summarization to results
    const results = {
      objectSummaries: topObjectSummaries,
    };
    return results;
  }

  selectRepresentativeTrack(tracks) {
    // Select the object track with the highest confidence score
    let representativeTrack = tracks[0];
    for (let i = 1; i < tracks.length; i++) {
      if (tracks[i].confidence > representativeTrack.confidence) {
        representativeTrack = tracks[i];
      }
    }
    return representativeTrack;
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
