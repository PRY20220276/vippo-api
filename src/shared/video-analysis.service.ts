import { Injectable } from '@nestjs/common';
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

interface EntityTimestamp {
  startOffset: number;
  endOffset: number;
  startTimeSeconds: any;
  startTimeNanos: any;
  endTimeSeconds: any;
  endTimeNanos: any;
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
      features: [Feature.LABEL_DETECTION, 6, 3],
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
        Feature.EXPLICIT_CONTENT_DETECTION,
        Feature.SPEECH_TRANSCRIPTION,
        Feature.OBJECT_TRACKING,
      ],
      videoContext: videoContext,
    });
    // Annotate video using Google Cloud Video Intelligence API
    const [operationResult] = await operation.promise();
    // Gets annotations for video
    const annotationResults = operationResult.annotationResults[0];
    // Other analysis
    const labels = JSON.stringify(annotationResults.segmentLabelAnnotations);
    const labelsParsed = annotationResults.segmentLabelAnnotations.map(
      (label) => {
        return label.entity.description;
      },
    );
    const transcript = JSON.stringify(annotationResults.speechTranscriptions);
    const explicitContent = JSON.stringify(
      annotationResults.explicitAnnotation,
    );
    // VIDEO SUMMARIZATION ALGORITHM
    const objects = annotationResults.objectAnnotations;
    // group entity appearances in the video
    const groupedObjects = objects
      .reduce((acc, object) => {
        const entity = object.entity.description;
        const timestamp: EntityTimestamp = {
          startTimeSeconds: object.segment.startTimeOffset.seconds || 0,
          startTimeNanos: (object.segment.startTimeOffset.nanos / 1e6).toFixed(
            0,
          ),
          endTimeSeconds: object.segment.endTimeOffset.seconds || 0,
          endTimeNanos: (object.segment.endTimeOffset.nanos / 1e6).toFixed(0),
          startOffset: parseFloat(
            (object.segment.startTimeOffset.seconds || 0).toString() +
              '.' +
              (object.segment.startTimeOffset.nanos / 1e6).toFixed(0),
          ),
          endOffset: parseFloat(
            (object.segment.endTimeOffset.seconds || 0).toString() +
              '.' +
              (object.segment.endTimeOffset.nanos / 1e6).toFixed(0),
          ),
        };
        const startTime =
          parseFloat(object.segment.startTimeOffset.seconds.toString()) +
          object.segment.startTimeOffset.nanos / 1e9;
        const endTime =
          parseFloat(object.segment.endTimeOffset.seconds.toString()) +
          object.segment.endTimeOffset.nanos / 1e9;
        const totalDuration = parseFloat((endTime - startTime).toFixed(2));
        const index = acc.findIndex(
          (groupedObject) => groupedObject.name === entity,
        );
        if (index === -1) {
          acc.push({
            name: entity,
            appearances: 1,
            appearanceFrequency: 1,
            totalDuration,
            timestamps: [timestamp],
          });
        } else {
          const entityAppearance = acc[index];
          entityAppearance.appearances += 1;
          entityAppearance.appearanceFrequency += 1;
          entityAppearance.totalDuration += totalDuration;
          entityAppearance.timestamps.push(timestamp);
        }
        return acc;
      }, [])
      .sort((a, b) => b.appearanceFrequency - a.appearanceFrequency);
    // Create an empty dictionary to store the timestamps for each detected object
    console.log(JSON.stringify(groupedObjects));
    // select the highlights of the video
    const summary = [];
    let summaryDuration = 0;
    for (let i = 0; i < groupedObjects.length; i++) {
      const entityAppearance = groupedObjects[i];
      const appearanceDuration =
        entityAppearance.totalDuration / entityAppearance.appearances;
      if (
        summaryDuration + appearanceDuration <=
        this.calculateSummaryDuration(12)
      ) {
        summary.push({
          entity: entityAppearance.name,
          startTimeSeconds: entityAppearance.timestamps[0].startTimeSeconds,
          startTimeNanos: entityAppearance.timestamps[0].startTimeNanos,
          endTimeSeconds: entityAppearance.timestamps[0].endTimeSeconds,
          endTimeNanos: entityAppearance.timestamps[0].endTimeNanos,
        });
        summaryDuration += appearanceDuration;
      } else {
        break;
      }
    }
    console.log(summary);
    // Add object summarization to results
    const results = {
      objectSummaries: summary,
      explicitContent: explicitContent,
      labels: labels,
      labelsParsed: labelsParsed,
      transcript: transcript,
    };
    return results;
  }

  calculateSummaryDuration(videoLengthSeconds: number): number {
    if (videoLengthSeconds < 300) {
      return Math.floor(videoLengthSeconds / 3);
    } else if (videoLengthSeconds < 600) {
      return 200;
    } else if (videoLengthSeconds < 1800) {
      return 300;
    } else {
      return 600;
    }
  }
}
