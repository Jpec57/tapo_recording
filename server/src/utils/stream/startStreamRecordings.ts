import { Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { getRtspSourceConfigs } from '../../getRtspSourceConfigs';
import { activeRecordings } from './sharedRecordingState';

const ensureDirectoryExistence = (filePath: string): void => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

const startStreamRecordings = (
  res: Response,
  streamKeys: string[],
  maxDuration: number = 5 * 60
): void => {
  if (!streamKeys || streamKeys.length === 0) {
    res.status(400).send('No stream keys provided.');
    return;
  }
  const outputDir = path.join(__dirname, 'recordings');
  ensureDirectoryExistence(path.join(outputDir, 'file.tmp'));

  const recordingPromises: Promise<string>[] = [];
  const successfulRecordingsDb: string[] = [];
  const failedRecordingsInfo: { key: string; error: string }[] = [];
  const config = getRtspSourceConfigs();

  streamKeys.forEach(key => {
    const trimmedKey = key.trim();
    console.log(`[RECORDING][Process] key: '${trimmedKey}'`);

    if (activeRecordings.has(trimmedKey)) {
      console.log(
        `[RECORDING][DUPLICATE] key '${trimmedKey}' already active.`
      );
      failedRecordingsInfo.push({
        key: trimmedKey,
        error: 'Recording already in progress'
      });
      return;
    }

    const rtspUrl = config[trimmedKey];
    if (!rtspUrl) {
      console.error(`[RECORDING][Error] No RTSP URL for key: '${trimmedKey}'`); // LOG
      failedRecordingsInfo.push({
        key: trimmedKey,
        error: 'RTSP URL not found'
      });
      return;
    }

    const outputFileName = `${trimmedKey}_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    const promise = new Promise<string>((resolve, reject) => {
      const command = ffmpeg(rtspUrl)
        .inputOptions(['-rtsp_transport tcp'])
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-movflags +frag_keyframe+empty_moov'
        ])
        .duration(maxDuration)
        .output(outputPath);

      command
        .on('start', (commandLine: string) => {
          console.log(
            `[RECORDING][START] FFmpeg started for key: '${trimmedKey}'. Command: ${commandLine}`
          ); // LOG
          activeRecordings.set(trimmedKey, command);
        })
        .on('end', () => {
          console.log(`[RECORDING][END] key: '${trimmedKey}': ${outputPath}`);
          successfulRecordingsDb.push(outputPath);
          activeRecordings.delete(trimmedKey);
          resolve(outputPath);
        })
        .on('error', (err: Error, stdout: string, stderr: string) => {
          console.error(
            `[RECORDING][Error] key: '${trimmedKey}': ${err.message}`
          ); // LOG
          if (stderr)
            console.error(
              `[START] FFmpeg stderr for '${trimmedKey}': ${stderr}`
            );
          activeRecordings.delete(trimmedKey);

          // Avoid pushing to failedRecordingsInfo if it was a manual stop
          if (
            !stderr ||
            (!stderr.toLowerCase().includes('signal 2') &&
              !stderr.toLowerCase().includes('signal 15'))
          ) {
            // SIGINT or SIGTERM
            // Logic to decide if this error should be in failedRecordingsInfo
          }
          reject(err);
        })
        .run();
    });
    recordingPromises.push(
      promise.catch(
        err => `Error for ${trimmedKey}: ${err.message || 'Unknown error'}`
      )
    );
  });

  const initiatedKeys = streamKeys.filter(
    key => !failedRecordingsInfo.find(f => f.key === key.trim())
  );
  const response: {
    message: string;
    initiated?: string[];
    failed?: { key: string; error: string }[];
  } = {
    message: 'Recording process initiation status.'
  };
  if (initiatedKeys.length > 0) response.initiated = initiatedKeys;
  if (failedRecordingsInfo.length > 0) response.failed = failedRecordingsInfo;

  if (
    initiatedKeys.length === 0 &&
    failedRecordingsInfo.length === streamKeys.length &&
    streamKeys.length > 0
  ) {
    res.status(400).json(response);
  } else {
    res.status(202).json(response);
  }

  Promise.allSettled(recordingPromises).then(results => {
    console.log('[START] All recording attempts settled.');
  });
};

export { startStreamRecordings };
