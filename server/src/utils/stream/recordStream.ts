import { spawn } from 'child_process';
import { Response } from 'express';
import getTimeFilename from '../getTimeFilename';
import fs from 'fs';
import stopRecordingStream from './stopRecordingStream';
import getPidFilePath from './getPidFilePath';
import getRtspUrl from './getRtspUrl';

const recordStream = (duration: number, res: Response): void => {
  const outputFileName: string = getTimeFilename('.mp4');
  const logFileName: string = getTimeFilename('.log');
  const pidFilePath = getPidFilePath();
  const rtspUrl = getRtspUrl();

  console.log({ outputFileName });

  //ChildProcessWithoutNullStreams
  const ffmpegProcess = spawn(
    'ffmpeg',
    ['-i', rtspUrl, '-c:v', 'copy', '-an', '-f', 'mp4', outputFileName],
    {
      detached: true
      // stdio: ['ignore', 'pipe', 'pipe'] // Redirect stdio to ignore input, pipe stdout and stderr
    }
  );

  const pid = ffmpegProcess.pid;
  if (pid === undefined) {
    console.error(`An error occurred while opening ffmepg process`);
    return;
  }
  fs.writeFileSync(pidFilePath, pid.toString());

  console.log(
    `Stream started with PID: ${pid} for ${duration} seconds. Log: ${logFileName}`
  );

  const logStream: fs.WriteStream = fs.createWriteStream(logFileName);
  ffmpegProcess.stdout.pipe(logStream);
  ffmpegProcess.stderr.pipe(logStream);
  ffmpegProcess.stdout.on('data', data => {
    console.log(data.toString()); // Log ffmpeg output to console
  });
  ffmpegProcess.stderr.on('data', data => {
    console.error(data.toString()); // Log ffmpeg errors to console
  });
  //todo
  const outputRes = false;
  if (outputRes) {
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked'
    });
    ffmpegProcess.stdout.pipe(res);
  } else {
    res.send('Start recording');
  }

  //
  ffmpegProcess.unref(); // Allow the parent process to exit independently of the child process

  // Start a timeout to stop the stream after the specified duration
  setTimeout(() => {
    stopRecordingStream(logFileName);
  }, duration * 1000);
};

export default recordStream;
