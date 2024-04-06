import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import recordStream from './utils/stream/recordStream';
import stopRecordingStream from './utils/stream/stopRecordingStream';
import getRtspUrl, { StreamQuality } from './utils/stream/getRtspUrl';
import path from 'path';
const Stream = require('node-rtsp-stream');
import WebSocket from 'ws';
const bodyParser = require('body-parser');

const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3000;
config({ path: '.env.local' });

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));
app.use(bodyParser.json());

const DEFAULT_DURATION: number = 5 * 60; // 5 minutes

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello');
});
let rtspStream: any = null;
app.get('/stream', (req: Request, res: Response): void => {
  const { quality } = req.query;

  if (!rtspStream) {
    console.log({quality})
    const streamConfig = {
      name: 'JpecStream',
      streamUrl: getRtspUrl(quality === 'high' ? StreamQuality.High : StreamQuality.Low),
      wsPort: 9999, // Port for WebSocket streaming
      ffmpegOptions: {
        '-stats': '', 
        '-r': 30, 
      },
    };
    rtspStream = new Stream(streamConfig);
  }

  res.sendFile(path.join(__dirname, '../public', 'stream.html'));
});


const killAll = (): void => {
  spawn('pkill', ['ffmpeg']);
};

app.get('/stream/stop', (req: Request, res: Response): void => {
  rtspStream?.stop();
  rtspStream = null;
  res.send('Stream stopped.');
});


app.get('/record/start', (req: Request, res: Response): void => {
  const duration: number = req.query.duration
    ? parseInt(req.query.duration as string, 10)
    : DEFAULT_DURATION;
  recordStream(duration, res);
});

app.get('/record/stop', (req: Request, res: Response): void => {
  stopRecordingStream(null);
  res.send('Stopped recording');
  res.end();
});

app.get('/killall', (req: Request, res: Response): void => {
  killAll();
  res.send('All streams killed');
});

const clientHeartbeats = new Map();
app.post('/heartbeat', (req, res) => {
  const { timestamp } = req.body;
  const clientId = req.ip; // Assuming IP address as the client identifier
  // Update the timestamp for the client
  clientHeartbeats.set(clientId, timestamp);
  res.sendStatus(200);
});


const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });


wss.on('connection', (ws: WebSocket) => {
  rtspStream.pipeToWebSocketServer(wss); // Assuming you have a method to pipe the stream to WebSocket
  ws.on('close', () => {
    console.log('CLOSING WEBSOCKET AND STREAM !')
    rtspStream?.stop();
    rtspStream = null;
  });
  
});

wss.on('close', () => {
  console.log('CLOSING WEBSOCKET AND STREAM')
  rtspStream?.stop();
  rtspStream = null;
});


const INTERVAL_SEC = 1
const CLIENT_TIMEOUT_SEC = 2 * INTERVAL_SEC

setInterval(() => {
  const now = Date.now();
  const timeout = CLIENT_TIMEOUT_SEC;
  
  // Iterate through client heartbeats
  clientHeartbeats.forEach((timestamp, clientId) => {
    // Check if the client's last heartbeat is older than the timeout
    if (now - timestamp > timeout) {
      // Client is considered disconnected
      console.log(`=> Client ${clientId} disconnected`);
      clientHeartbeats.delete(clientId);
    }
  });
  // if (clientHeartbeats.size === 0) {
  //   rtspStream?.stop();
  //   rtspStream = null;
  // }
}, INTERVAL_SEC * 60 * 1000);