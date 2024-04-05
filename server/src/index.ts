import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import startStream from './utils/stream/startStream';
import stopStream from './utils/stream/stopStream';
import ffmpeg from 'fluent-ffmpeg';
import getRtspUrl, { StreamQuality } from './utils/stream/getRtspUrl';
import { WritableStreamBuffer } from 'stream-buffers';
import getTimeFilename from './utils/getTimeFilename';

const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3000;
config({ path: '.env.local' });

const DEFAULT_DURATION: number = 5 * 60; // 5 minutes

const killAll = (): void => {
  spawn('pkill', ['ffmpeg']);
};

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello');
});

app.get('/start', (req: Request, res: Response): void => {
  const duration: number = req.query.duration
    ? parseInt(req.query.duration as string, 10)
    : DEFAULT_DURATION;
  startStream(duration, res);
  // res.send('Stream started...');
});

app.get('/stream', (req: Request, res: Response): void => {
  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked'
  });

  const rtspStream = ffmpeg(getRtspUrl(StreamQuality.High))
    // .output('outputfile.mp4') // Output to file
    // .output('pipe:1') // Output to stream
    .format('mpegts') // Specify output format
    .outputOptions(['-movflags isml+frag_keyframe'])
    .on('error', (err, stdout, stderr) => {
      console.error('FFmpeg error:', err);
      console.error('FFmpeg stdout:', stdout);
      console.error('FFmpeg stderr:', stderr);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      } else {
        console.error(
          'Response headers already sent, cannot send error response.'
        );
      }
      // Kill the FFmpeg process if an error occurs
      rtspStream.kill('SIGKILL');
    })
    .on('end', () => {
      console.log('Finished processing');
    });
  rtspStream.pipe(res);
});

app.get('/start2', (req: Request, res: Response): void => {
  const rtspStream = ffmpeg(getRtspUrl(StreamQuality.High))
    .output(getTimeFilename('.mp4')) // Output to file
    .format('mp4') // Specify output format
    .on('error', (err, stdout, stderr) => {
      console.error('FFmpeg error:', err);
      console.error('FFmpeg stdout:', stdout);
      console.error('FFmpeg stderr:', stderr);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      } else {
        console.error(
          'Response headers already sent, cannot send error response.'
        );
      }
      // Kill the FFmpeg process if an error occurs
      rtspStream.kill('SIGKILL');
    })
    .on('end', () => {
      console.log('Finished processing');
    });
  // Run FFmpeg process
  rtspStream.run();
  res.send('Stream started');
});

app.get('/stop', (req: Request, res: Response): void => {
  stopStream(null);
  res.send('Stream stopped');
});

app.get('/killall', (req: Request, res: Response): void => {
  killAll();
  res.send('All streams killed');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
