import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import startStream from './utils/stream/startStream';
import stopStream from './utils/stream/stopStream';
import ffmpeg from 'fluent-ffmpeg';
import getRtspUrl, { StreamQuality } from './utils/stream/getRtspUrl';
import getTimeFilename from './utils/getTimeFilename';
import path from 'path';
const Stream = require('node-rtsp-stream');
import WebSocket, { WebSocketServer } from 'ws';

const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3000;
config({ path: '.env.local' });

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

const DEFAULT_DURATION: number = 5 * 60; // 5 minutes


// const wsServer = new WebSocketServer({
//   port: 9999,
// });

// wsServer.on('connection', (ws) => {

//   ws.on('open', function open() {
//     if (!rtspStream) {
//       // Start streaming if it's not already started
//       const streamConfig = {
//         name: 'JpecStream',
//         streamUrl: getRtspUrl(),
//         wsPort: 9999,
//         ffmpegOptions: {
//           '-stats': '',
//           '-r': 30
//         }
//       };
//       rtspStream = new Stream(streamConfig);
//     }
//   });
  

// // ws.on('message', function message(data) {
// //   console.log('received: %s', data);
// // });

//   ws.on('error', console.error);


//   ws.on('close', () => {
//     // Stop streaming when WebSocket connection closes
//     if (rtspStream) {
//       rtspStream.stop();
//       rtspStream = null;
//     }
//   });
// });





let rtspStream: any = null;
app.get('/stream', (req: Request, res: Response): void => {

  // wsServer.emit('connection');

  const streamConfig = {
    name: 'JpecStream',
    streamUrl: getRtspUrl(),
    wsPort: 9999, // Port for WebSocket streaming
    ffmpegOptions: {
      // options ffmpeg flags
      '-stats': '', // an option with no neccessary value uses a blank string
      '-r': 30 // options with required values specify the value after the key
    }
  };
  rtspStream = new Stream(streamConfig);
  res.sendFile(path.join(__dirname, '../public', 'stream.html'));
});

const killAll = (): void => {
  spawn('pkill', ['ffmpeg']);
};

app.get('/stopStream', (req: Request, res: Response): void => {
  rtspStream?.stop();
});
app.get('/', (req: Request, res: Response): void => {
  res.send('Hello');
});

app.get('/start', (req: Request, res: Response): void => {
  const duration: number = req.query.duration
    ? parseInt(req.query.duration as string, 10)
    : DEFAULT_DURATION;
  startStream(duration, res);
});

app.get('/stop', (req: Request, res: Response): void => {
  stopStream(null);
  res.send('Stream stopped');
  res.end();
});

app.get('/killall', (req: Request, res: Response): void => {
  killAll();
  res.send('All streams killed');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
