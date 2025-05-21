import { activeRecordings } from './sharedRecordingState';
import { Response } from 'express';

export const getStreamRecordingStatus = (res: Response) => {
  console.log('[MANAGER] Called getRecordingStatus.');

  // Get the keys (streamKeys) of all currently active recordings
  const ongoingStreamKeys = Array.from(activeRecordings.keys());

  console.log(
    `[STATUS] Currently active recordings keys: ${ongoingStreamKeys.join(
      ', '
    ) || 'None'}`
  );

  res.status(200).json({
    message: 'Current recording status',
    activeRecordings: ongoingStreamKeys,
    count: ongoingStreamKeys.length
  });
};
