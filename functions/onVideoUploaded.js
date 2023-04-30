const { Storage } = require('@google-cloud/storage');
const { VideoIntelligenceServiceClient } =
  require('@google-cloud/video-intelligence').v1;

const storage = new Storage();
const videoIntelligenceClient = new VideoIntelligenceServiceClient();

/**
 * Triggered from a change to a Cloud Storage bucket.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.onVideoUploaded = async (event, context) => {
  const gcsEvent = event;
  console.log(`Processing file: ${gcsEvent.name}`);
  const file = storage.bucket(event.bucket).file(event.name);
  const [fileMetadata] = await file.getMetadata();
  const contentType = fileMetadata.contentType;
  // skip if it's not a video
  const videoContentTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
  ];
  if (!videoContentTypes.includes(contentType)) {
    console.log(`Skipping non-video file: ${file.name}`);
    return;
  }
  // Analyze the video using Video Intelligence API
  const gcsUri = `gs://${event.bucket}/${event.name}`;
  const outputBucket = 'vippo-bucket-results-dev';
  const videoContext = {
    speechTranscriptionConfig: {
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    },
  };
  try {
    videoIntelligenceClient.annotateVideo({
      inputUri: gcsUri,
      outputUri: `gs://${outputBucket}/${event.name}-LABEL_DETECTION.json`,
      features: ['LABEL_DETECTION'],
    });
    videoIntelligenceClient.annotateVideo({
      inputUri: gcsUri,
      outputUri: `gs://${outputBucket}/${event.name}-OBJECT_TRACKING.json`,
      features: ['OBJECT_TRACKING'],
    });
    videoIntelligenceClient.annotateVideo({
      inputUri: gcsUri,
      outputUri: `gs://${outputBucket}/${event.name}-EXPLICIT_CONTENT_DETECTION.json`,
      features: ['EXPLICIT_CONTENT_DETECTION'],
    });
    videoIntelligenceClient.annotateVideo({
      inputUri: gcsUri,
      outputUri: `gs://${outputBucket}/${event.name}-SPEECH_TRANSCRIPTION.json`,
      features: ['SPEECH_TRANSCRIPTION'],
      videoContext: videoContext,
    });
    console.log(`Requests sent to Video Intelligence API`);
  } catch (error) {
    console.error(`Error analyzing video ${gcsUri}:`, error);
    throw error;
  }
};
