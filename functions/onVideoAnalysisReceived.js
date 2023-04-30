const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

/**
 * This function updates the metadata of a file in a specified bucket with new metadata.
 * @param bucket - The Google Cloud Storage bucket where the object is located.
 * @param fileName - The name of the file whose metadata needs to be updated.
 * @param newMetadata - The `newMetadata` parameter is an object containing the new metadata
 */
async function updateObjectMetadata(bucket, fileName, newMetadata) {
  try {
    // Get the original video file
    const objectFile = bucket.file(fileName);
    const [objectMetadata] = await objectFile.getMetadata();
    // Update the original video metadata
    const updatedMetadata = {
      ...objectMetadata.metadata,
      ...newMetadata,
    };
    // Update the metadata of the object
    await objectFile.setMetadata({ metadata: updatedMetadata });
    console.log(`Updated metadata for ${fileName}`);
  } catch (error) {
    console.error(`Error updating metadata for ${objectName}: ${error}`);
  }
}

/**
 * Triggered from a change to a Cloud Storage bucket.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.onVideoAnalysisReceived = async (event, context) => {
  const gcsEvent = event;
  const resultBucket = storage.bucket(gcsEvent.bucket);
  const mediaBucket = storage.bucket('vippo-bucket-media-dev');
  const resultFileName = gcsEvent.name;
  const fileNameComponents = resultFileName.split('-');
  const originalFileName = fileNameComponents.slice(0, -1).join('-');
  const feature =
    fileNameComponents[fileNameComponents.length - 1].split('.')[0];

  // Read the result file
  const resultFile = resultBucket.file(resultFileName);
  const [resultData] = await resultFile.download();
  const resultsJson = JSON.parse(resultData.toString());
  console.log(
    `Processing result file ${originalFileName} for feature ${feature}`,
  );
  // Process the results based on the feature
  switch (feature) {
    case 'LABEL_DETECTION':
      const labels = resultsJson.annotation_results[0].shot_label_annotations
        .map((label) => {
          const segments = label.segments.map((segment) => {
            const time = segment.segment;
            if (time.start_time_offset.seconds === undefined) {
              time.start_time_offset.seconds = 0;
            }
            if (time.start_time_offset.nanos === undefined) {
              time.start_time_offset.nanos = 0;
            }
            if (time.end_time_offset.seconds === undefined) {
              time.endTimeOffset.seconds = 0;
            }
            if (time.end_time_offset.nanos === undefined) {
              time.endTimeOffset.nanos = 0;
            }
            return {
              startTime:
                time.start_time_offset.seconds +
                (time.start_time_offset.nanos / 1e6).toFixed(0),
              endTime:
                time.end_time_offset.seconds +
                (time.end_time_offset.nanos / 1e6).toFixed(0),
            };
          });
          return {
            label: label.entity.description,
            segments: segments,
          };
        })
        .flat();
      await updateObjectMetadata(mediaBucket, originalFileName, {
        labels: JSON.stringify(labels),
      });
      break;
    case 'OBJECT_TRACKING':
      const objects = resultsJson.annotation_results[0].object_annotations;
      const groupedObjects = objects
        .reduce((acc, object) => {
          const entity = object.entity.description;
          const segment = object.segment;
          const startTimeSeconds = segment.start_time_offset.seconds || 0;
          const startTimeNanos = (segment.start_time_offset.nanos || 0) / 1e9;
          const endTimeSeconds = segment.end_time_offset.seconds || 0;
          const endTimeNanos = (segment.end_time_offset.nanos || 0) / 1e9;
          // Calculate the duration
          const startTime = startTimeSeconds + startTimeNanos;
          const endTime = endTimeSeconds + endTimeNanos;
          const duration = endTime - startTime;
          // Round the duration to 2 decimal places
          const durationRounded = parseFloat(duration.toFixed(2));
          // Add
          const timestamp = {
            startTime: startTime,
            endTime: endTime,
            duration: durationRounded,
          };
          const index = acc.findIndex(
            (groupedObject) => groupedObject.name === entity,
          );
          if (index === -1) {
            acc.push({
              name: entity,
              appearances: 1,
              appearanceFrequency: 1,
              totalDuration: durationRounded,
              timestamps: [timestamp],
            });
          } else {
            const entityAppearance = acc[index];
            entityAppearance.appearances += 1;
            entityAppearance.appearanceFrequency += 1;
            entityAppearance.totalDuration += durationRounded;
            entityAppearance.timestamps.push(timestamp);
          }
          return acc;
        }, [])
        .sort((a, b) => b.appearanceFrequency - a.appearanceFrequency);
      // Create an empty dictionary to store the timestamps for each detected object
      const hasOverlap = (startTime, endTime) =>
        summary.some(
          (clip) =>
            (startTime >= clip.startTime && startTime <= clip.endTime) ||
            (endTime >= clip.startTime && endTime <= clip.endTime),
        );
      const summary = [];
      let summaryDuration = 0;
      // Iterate through groupedObjects and select non-overlapping clips
      for (const entityAppearance of groupedObjects) {
        const appearanceDuration =
          entityAppearance.totalDuration / entityAppearance.appearances;
        if (summaryDuration + appearanceDuration <= 35) {
          for (const timestamp of entityAppearance.timestamps) {
            const startTime = timestamp.startTime;
            const endTime = timestamp.endTime;
            const limitedEndTime = Math.min(startTime + 5, endTime); // Limit the duration to a maximum of 5 seconds
            if (
              !hasOverlap(startTime, limitedEndTime) &&
              limitedEndTime - startTime >= 1
            ) {
              summary.push({
                entity: entityAppearance.name,
                startTime: startTime,
                endTime: limitedEndTime,
              });
              summaryDuration += limitedEndTime - startTime;
              break;
            }
          }
        } else {
          break;
        }
      }
      summary.sort((a, b) => a.startTime - b.startTime);
      await updateObjectMetadata(mediaBucket, originalFileName, {
        objects: JSON.stringify(objects),
        objectSummary: JSON.stringify(summary),
      });
      break;
    case 'EXPLICIT_CONTENT_DETECTION':
      const explicitContent =
        resultsJson.annotation_results[0].explicit_annotation.frames
          .map((result) => {
            if (
              result.pornography_likelihood === 'UNKNOWN' ||
              result.pornography_likelihood === 'VERY_UNLIKELY' ||
              result.pornography_likelihood === 'UNLIKELY'
            ) {
              return;
            }
            if (result.timeOffset === undefined) {
              result.timeOffset = {};
            }
            if (result.timeOffset.seconds === undefined) {
              result.timeOffset.seconds = 0;
            }
            if (result.timeOffset.nanos === undefined) {
              result.timeOffset.nanos = 0;
            }
            return {
              explicit_tag: result.pornography_likelihood,
              offsetTime:
                result.timeOffset.seconds +
                (result.timeOffset.nanos / 1e6).toFixed(0),
            };
          })
          .filter((frame) => frame !== undefined)
          .flat();
      await updateObjectMetadata(mediaBucket, originalFileName, {
        explicitContent: JSON.stringify(explicitContent),
      });
      break;
    case 'SPEECH_TRANSCRIPTION':
      const transcription =
        resultsJson.annotation_results[0].speech_transcriptions
          .map((t) => {
            const currentTranscript = t.alternatives[0];
            const words = currentTranscript.words;
            if (!words) {
              return;
            }
            const startTime = words[0].start_time;
            const endTime = words[words.length - 1].end_time;
            if (startTime.seconds === undefined) {
              startTime.seconds = 0;
            }
            if (startTime.nanos === undefined) {
              startTime.nanos = 0;
            }
            if (endTime.seconds === undefined) {
              endTime.seconds = 0;
            }
            if (endTime.nanos === undefined) {
              endTime.nanos = 0;
            }
            return {
              transcription: currentTranscript.transcript,
              startTime: startTime.seconds + (startTime.nanos / 1e6).toFixed(0),
              endTime: endTime.seconds + (endTime.nanos / 1e6).toFixed(0),
            };
          })
          .filter((alternative) => alternative !== undefined)
          .flat();
      await updateObjectMetadata(mediaBucket, originalFileName, {
        transcript: JSON.stringify(transcription),
      });
      break;
    default:
      console.error(`Unknown feature ${feature}`);
  }
  return;
};
