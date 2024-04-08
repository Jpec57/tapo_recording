import express, { Request, Response } from 'express';
import { spawn, exec } from 'child_process';
import { config } from 'dotenv';
import recordStream from './utils/stream/recordStream';
import stopRecordingStream from './utils/stream/stopRecordingStream';
import getRtspUrl, { StreamQuality } from './utils/stream/getRtspUrl';
import path from 'path';
const Stream = require('node-rtsp-stream');
import WebSocket, { WebSocketServer } from 'ws';
import streamRtsp from './utils/stream/streamRtsp';
const bodyParser = require('body-parser');

    
const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3057;
config({ path: '.env.local' });

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));
app.use(bodyParser.json());

const DEFAULT_DURATION: number = 5 * 60; // 5 minutes

app.get('/', (req: Request, res: Response): void => {
  res.send('Hello');
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


let rtspStream: any = null;
app.get('/stream2', (req: Request, res: Response): void => {
  const { quality } = req.query;
  console.log({quality})
  rtspStream = new Stream({
    name: 'JpecStream',
    streamUrl: getRtspUrl(),
    wsPort: 9999,
    ffmpegOptions: { // options ffmpeg flags
      '-stats': '', // an option with no neccessary value uses a blank string
      '-r': 30, // options with required values specify the value after the key
      '-rtsp_transport': 'tcp',
      '-probesize': '10M',
    }
  })
  res.sendFile(path.join(__dirname, '../public', 'stream.html'));
});


app.get('/stream', (req: Request, res: Response): void => {
  const { quality } = req.query;
  console.log({quality})
  res.sendFile(path.join(__dirname, '../public', 'stream.html'));
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const wss = new WebSocketServer({ port: 9999 });
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // //
  // const streamHeader = Buffer.alloc(8); // Allocate buffer for the stream header
  // const magicBytes = Buffer.from('jsmp'); // Magic bytes (can be any 4 characters)
  // const width = 640; // Example width (replace with actual width)
  // const height = 480; // Example height (replace with actual height)

  // // Write magic bytes and video size to the stream header
  // magicBytes.copy(streamHeader, 0);
  // streamHeader.writeUInt16BE(width, 4);
  // streamHeader.writeUInt16BE(height, 6);

  // // Send the stream header to the WebSocket client
  // ws.send(streamHeader, { binary: true });
  // //


  const ffmpegParams = [
    '-rtsp_transport', 'tcp',
    '-probesize', '10M',
    '-i', getRtspUrl(),
    '-f',
    'mpegts',
    '-codec:v',
    'mpeg1video',
    //
    '-s',
    '960x540',
    //
    '-r', 
    '30',
    //
    '-codec:a',
    'mp2',
    //
    // '-b:a',
    // '128k',
    //
    'pipe:1'
  ];
  // Spawn FFmpeg process to stream video
  const ffmpegProcess = spawn('ffmpeg', ffmpegParams, {
    // detached: true
  });

  console.log('=> Running ffmpeg ' + ffmpegParams.join(' '));

  // Pipe FFmpeg output to WebSocket
  ffmpegProcess.stdout.on('data', (data) => {
    ws.send(data); // Send video data to WebSocket clients
  });

  ffmpegProcess.stderr.on('data', data => {
    console.error(data.toString()); // Log ffmpeg errors to console
  });

  // Handle process exit
  ffmpegProcess.on('exit', () => {
    console.log('FFmpeg process exited');
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    ffmpegProcess.kill(); // Kill FFmpeg process when WebSocket connection is closed
  });
});