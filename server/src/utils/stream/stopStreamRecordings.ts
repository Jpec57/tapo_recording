import { Response } from 'express';
import { activeRecordings } from './sharedRecordingState';

const stopStreamRecordings = (
  res: Response,
  streamKeysToStop: string[]
): void => {
  if (!streamKeysToStop || streamKeysToStop.length === 0) {
    res.status(400).send('No stream keys provided to stop.');
    return;
  }

  const stoppedSuccessfully: string[] = [];
  const notFoundOrFailed: { key: string; reason: string }[] = [];

  streamKeysToStop.forEach(key => {
    const command = activeRecordings.get(key);
    if (command) {
      try {
        console.log('******************');
        console.log(`Sending SIGINT to recording for stream key: ${key}`);
        console.log('******************');

        // Sending SIGINT allows FFmpeg to close the file gracefully.
        command.kill('SIGINT');
        // The 'end' or 'error' (with SIGINT message) handler in startStreamRecordings
        // will call activeRecordings.delete(key).
        // To be absolutely sure it's seen as "stopping now", we can remove it here,
        // but it's better if the event handlers manage the state.
        // For now, let the event handlers do the cleanup. If SIGINT works, 'end' or 'error' will fire.
        stoppedSuccessfully.push(key);
        // activeRecordings.delete(key); // Optional: remove immediately
      } catch (error) {
        console.error(`Error trying to stop recording for ${key}: ${error}`);
        notFoundOrFailed.push({
          key,
          reason: `Error stopping: ${error}`
        });
        // If kill fails, ensure it's removed from active list if it's stuck
        activeRecordings.delete(key);
      }
    } else {
      console.log(
        `No active recording found for stream key: ${key} (or already stopped).`
      );
      notFoundOrFailed.push({
        key,
        reason: 'No active recording found or already stopped'
      });
    }
  });

  res.status(200).json({
    message: 'Stop recording request processed.',
    stoppedAttempted: stoppedSuccessfully, // These are keys for which a stop signal was sent
    notFoundOrFailed: notFoundOrFailed
  });
};

export { stopStreamRecordings };
