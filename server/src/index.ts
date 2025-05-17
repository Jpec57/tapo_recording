import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import recordStream from './utils/stream/recordStream';
import stopRecordingStream from './utils/stream/stopRecordingStream';
import getRtspUrl, { StreamQuality } from './utils/stream/getRtspUrl';
import path from 'path';
import { WebSocketServer } from 'ws';
import { isDev } from './utils/__isDev__';
const bodyParser = require('body-parser');

const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3057;
config({ path: '.env.local' });
const env = process.env.NODE_ENV;
console.log('Environment:', env);
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));
app.use(bodyParser.json());

const DEFAULT_DURATION: number = 5 * 60; // 5 minutes

app.get('/', (req: Request, res: Response): void => {
  res.send('<a href="/stream">Go to Stream</a>');
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
  spawn('pkill', ['ffmpeg']);
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

app.get('/stream', (req: Request, res: Response): void => {
  if (isDev()) {
    console.log('Development mode');
    res.sendFile(path.join(__dirname, '../public', 'dev_stream.html'));
    return;
  }
  res.sendFile(path.join(__dirname, '../public', 'stream.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ port: 9999 });
// wss.on('connection', ws => {
//   console.log('WebSocket connection established');

//   const ffmpegParams = [
//     '-rtsp_transport',
//     'tcp',
//     '-probesize',
//     '10M',
//     '-i', // specifies the input source from the RTSP stream.
//     getRtspUrl(StreamQuality.Low),
//     '-f',
//     'mpegts',
//     // codec video
//     '-codec:v',
//     'mpeg1video',
//     //
//     '-s',
//     '1280x720',
//     //
//     //
//     // '-c:v',
//     // 'copy', //tells FFmpeg to copy the video stream without re-encoding, preserving its original format and quality.
//     //
//     '-r', // Rate
//     '30',
//     '-codec:a', //suitable audio codec
//     'pcm_alaw',
//     'pipe:1'
//   ];
//   // Spawn FFmpeg process to stream video
//   const ffmpegProcess = spawn('ffmpeg', ffmpegParams);

//   console.log('=> Running ffmpeg ' + ffmpegParams.join(' '));

//   // Pipe FFmpeg output to WebSocket
//   ffmpegProcess.stdout.on('data', data => {
//     ws.send(data); // Send video data to WebSocket clients
//   });

//   ffmpegProcess.stderr.on('data', data => {
//     console.error(data.toString()); // Log ffmpeg errors to console
//   });

//   // Handle process exit
//   ffmpegProcess.on('exit', () => {
//     console.log('FFmpeg process exited');
//   });

//   // Handle WebSocket close
//   ws.on('close', () => {
//     console.log('WebSocket connection closed');
//     ffmpegProcess.kill(); // Kill FFmpeg process when WebSocket connection is closed
//   });
// });

const activeStreams: Map<
  string,
  { process: any; clients: Set<any> }
> = new Map();

wss.on('connection', ws => {
  const streamUrl = getRtspUrl(StreamQuality.Low);
  console.log(`WebSocket connection established for stream: ${streamUrl}`);

  if (!activeStreams.has(streamUrl)) {
    console.log(`No active FFmpeg for ${streamUrl}. Starting new process.`);
    const ffmpegParams = [
      '-rtsp_transport',
      'tcp',
      '-probesize',
      '10M',
      '-i',
      streamUrl,
      '-f',
      'mpegts',
      '-codec:v',
      'mpeg1video',
      '-s',
      '1280x720',
      '-r',
      '30',
      '-codec:a',
      'pcm_alaw',
      'pipe:1'
    ];
    const ffmpegProcess = spawn('ffmpeg', ffmpegParams);
    console.log(
      `=> Spawning FFmpeg for ${streamUrl}: ${ffmpegParams.join(' ')}`
    );

    const newStreamData = { process: ffmpegProcess, clients: new Set<any>() };
    activeStreams.set(streamUrl, newStreamData);
    newStreamData.clients.add(ws); // Add the first client

    console.log(
      `Client added to new stream ${streamUrl}. Total clients: ${newStreamData
        .clients.size}`
    );

    ffmpegProcess.stdout.on('data', data => {
      newStreamData.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          // WebSocket from 'ws'
          client.send(data, { binary: true }); // Good practice to specify binary for perf
        }
      });
    });

    ffmpegProcess.stderr.on('data', data => {
      console.error(`FFmpeg stderr for ${streamUrl}: ${data.toString()}`);
    });

    ffmpegProcess.on('exit', (code, signal) => {
      console.log(
        `FFmpeg process for ${streamUrl} exited with code ${code} and signal ${signal}`
      );
      newStreamData.clients.forEach(client => client.close());
      activeStreams.delete(streamUrl);
    });

    ffmpegProcess.on('error', err => {
      console.error(`Failed to start FFmpeg for ${streamUrl}:`, err);
      newStreamData.clients.forEach(client => client.close());
      activeStreams.delete(streamUrl);
    });
  } else {
    const existingStreamData = activeStreams.get(streamUrl)!;
    existingStreamData.clients.add(ws);
    console.log(
      `Client added to existing stream ${streamUrl}. Total clients: ${existingStreamData
        .clients.size}`
    );
  }
});
