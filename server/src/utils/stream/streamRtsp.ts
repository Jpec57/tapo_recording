import getRtspUrl from './getRtspUrl';
import { spawn } from 'child_process';
import { Request, Response } from 'express';

const streamRtsp = (req: Request, res: Response): void => {
  const rtspUrl = getRtspUrl();

  const params = [
    '-rtsp_transport',
    'tcp',
    '-i',
    rtspUrl,
    '-c:v',
    'mpeg1video',
    '-f',
    'mpegts',
    'pipe:1' // Output to stdout
  ];

  const ffmpegProcess = spawn('ffmpeg', params);

  console.log('=> Running ffmpeg ' + params.join(' '));

  // Pipe FFmpeg output to response
  ffmpegProcess.stdout.pipe(res);

  // Handle process exit
  ffmpegProcess.on('exit', () => {
    console.log('FFmpeg process exited');
  });

  // Handle request close
  req.on('close', () => {
    console.log('Request closed, killing FFmpeg process');
    ffmpegProcess.kill('SIGKILL');
  });
};

export default streamRtsp;
