import { get, IncomingMessage } from 'http';
import express, { Request, Response } from 'express';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { config } from 'dotenv';
import {startStreamRecordings} from './utils/stream/startStreamRecordings';
import {stopStreamRecordings} from './utils/stream/stopStreamRecordings';
import path from 'path';
import { WebSocketServer,WebSocket } from 'ws';
import { getRtspSourceConfigs } from './getRtspSourceConfigs';
import { FfmpegCommand } from 'fluent-ffmpeg';
import { getStreamRecordingStatus } from './utils/stream/getStreamRecordingStatus';
import { handleSseUpdates } from './utils/stream/handleSseUpdates';
const bodyParser = require('body-parser');

// Define an interface for your stream data to include the WebSocket type and heartbeatInterval
interface StreamData {
  process: ChildProcessWithoutNullStreams;
  clients: Set<ClientWebSocket>; // Use the extended WebSocket type
  heartbeatIntervalId?: NodeJS.Timeout; // Optional: To store the interval ID
}

// Extend WebSocket type to include isAlive property
interface ClientWebSocket extends WebSocket {
  isAlive?: boolean;
    streamKey?: string; // Optional: Store the streamKey on the client for easier logging/debugging
}

const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3057;
config({ path: '.env.local' });
const env = process.env.NODE_ENV;
console.log('Environment:', env);
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));
app.use(bodyParser.json());

// const DEFAULT_DURATION: number = 5 * 60; // 5 minutes
// app.get('/', (req: Request, res: Response): void => {
//   res.send('<a href="/stream">Go to Stream</a>');
// });

app.get('/', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'status.html'));
});

app.get('/record/start', (req: Request, res: Response): void => {
  let streamKeys: string[] = [];
  if (typeof req.query.streamKeys === 'string') {
    streamKeys = [req.query.streamKeys];
  } else if (Array.isArray(req.query.streamKeys)) {
    streamKeys = req.query.streamKeys as string[];
  } 
  const maxDuration = req.query.duration ? parseInt(req.query.duration as string, 10) : undefined;
  startStreamRecordings(res, streamKeys, maxDuration);
});

app.get('/record/stop', (req: Request, res: Response): void => {
  let streamKeys: string[] = [];
  if (typeof req.query.streamKeys === 'string') {
    streamKeys = [req.query.streamKeys];
  } else if (Array.isArray(req.query.streamKeys)) {
    streamKeys = (req.query.streamKeys as any[]).filter(key => typeof key === 'string');
  }

  // The stopStreamRecordings function now handles sending the response
  stopStreamRecordings(res, streamKeys);
});


const clientHeartbeats = new Map();
app.post('/heartbeat', (req, res) => {
  const { timestamp } = req.body;
  const clientId = req.ip; // Assuming IP address as the client identifier
  clientHeartbeats.set(clientId, timestamp);
  res.sendStatus(200);
});

app.get('/stream', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'multi_stream.html'));
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/record/status', (req: Request, res: Response): void => {
  getStreamRecordingStatus(res);
});

app.get('/record/updates', handleSseUpdates);

const rtspSourceConfigs = getRtspSourceConfigs();
// --- WebSocket Server Logic ---
const wss = new WebSocketServer({ port: 9999 });
const activeStreams: Map<string, StreamData> = new Map();
const INACTIVITY_TIMEOUT_MS = 5000; // 5 seconds

function noop() {} // Helper for ping

wss.on('connection', (ws: ClientWebSocket, req: IncomingMessage) => { // Use the extended ClientWebSocket type
  console.log('New WebSocket connection');
  const reqUrl = req.url || '';
    // Extract the stream key AFTER "/websocket/"
  const match = reqUrl.match(/^\/websocket\/([a-zA-Z0-9._-]+)/);
  const streamKey = match ? match[1] : null;
if (!streamKey) {
    console.error('Stream key missing in WebSocket URL. Path should be /<stream_key>. Closing connection.');
    ws.close(1008, 'Stream key missing in WebSocket URL. Connect to ws://<host>/<stream_key>');
    return;
}
  
  ws.streamKey = streamKey; // Store for logging in close/error events

  const actualRtspUrl = rtspSourceConfigs[streamKey];

  if (!actualRtspUrl) {
    console.error(`Invalid stream key: ${streamKey}. No RTSP source configured. URL: ${reqUrl}. Closing connection.`);
    ws.close(1008, `Invalid stream key: ${streamKey}.`);
    return;
  }

  // Initialize client as alive
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true; // Client is responsive
  });
 console.log(`WebSocket connection established for stream key: "${streamKey}" (RTSP: ${actualRtspUrl})`);

  if (!activeStreams.has(streamKey)) {
    console.log(`No active FFmpeg for "${streamKey}". Starting new process.`);
    const ffmpegParams = [
      '-rtsp_transport', 'tcp',
      '-probesize', '10M',
      '-i', actualRtspUrl, // Use the dynamically looked-up RTSP URL
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-s', '1280x720',
      '-r', '30',
      '-codec:a', 'pcm_alaw',
      'pipe:1'
    ];
    const ffmpegProcess = spawn('ffmpeg', ffmpegParams);
    console.log(`=> Spawning FFmpeg for "${streamKey}": ${ffmpegParams.join(' ')}`);

    const newStreamData: StreamData = {
      process: ffmpegProcess,
      clients: new Set<ClientWebSocket>(),
      heartbeatIntervalId: setInterval(() => {
        const currentStreamData = activeStreams.get(streamKey);
        if (!currentStreamData) {
          clearInterval(newStreamData.heartbeatIntervalId!);
          return;
        }
        currentStreamData.clients.forEach(clientWs => {
          if (!clientWs.isAlive) {
            console.log(`Client for stream "${clientWs.streamKey || 'unknown'}" unresponsive. Terminating.`);
            clientWs.terminate();
            return;
          }
          clientWs.isAlive = false;
          clientWs.ping(noop);
        });
      }, INACTIVITY_TIMEOUT_MS)
    };
    activeStreams.set(streamKey, newStreamData);
    newStreamData.clients.add(ws);
    console.log(`Client added to new stream "${streamKey}". Total clients: ${newStreamData.clients.size}`);

    ffmpegProcess.stdout.on('data', data => {
      newStreamData.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: true });
        }
      });
    });

    ffmpegProcess.stderr.on('data', data => {
      console.error(`FFmpeg stderr for "${streamKey}": ${data.toString()}`);
    });

    const onFFmpegEnd = (type: 'exit' | 'error', codeOrErr?: any) => {
      const message = type === 'exit' ? `exited with code ${codeOrErr?.code} and signal ${codeOrErr?.signal}` : `failed/errored: ${codeOrErr}`;
      console.log(`FFmpeg process for "${streamKey}" ${message}`);

      const streamDataToEnd = activeStreams.get(streamKey);
      if (streamDataToEnd) {
        if (streamDataToEnd.heartbeatIntervalId) {
          clearInterval(streamDataToEnd.heartbeatIntervalId);
          console.log(`Cleared heartbeat interval for stream "${streamKey}" on FFmpeg ${type}.`);
        }
        streamDataToEnd.clients.forEach(client => client.terminate());
        activeStreams.delete(streamKey);
        console.log(`Stream "${streamKey}" removed from activeStreams.`);
      }
    };
    ffmpegProcess.on('exit', (code, signal) => onFFmpegEnd('exit', { code, signal }));
    ffmpegProcess.on('error', (err) => onFFmpegEnd('error', err));

  } else {
    const existingStreamData = activeStreams.get(streamKey)!;
    existingStreamData.clients.add(ws);
    console.log(`Client added to existing stream "${streamKey}". Total clients: ${existingStreamData.clients.size}`);
  }

  ws.on('error', (err) => {
    console.error(`WebSocket error for client on stream "${ws.streamKey || 'unknown'}":`, err);
  });

  ws.on('close', (code, reason) => {
    const reasonMsg = reason.length > 0 ? reason.toString() : 'No reason given';
    console.log(`WebSocket connection closed for client on stream "${ws.streamKey || 'unknown'}" (Code: ${code}, Reason: ${reasonMsg})`);
    const streamData = activeStreams.get(ws.streamKey || ''); // Use stored streamKey
    if (streamData) {
      streamData.clients.delete(ws);
      console.log(`Client removed from stream "${ws.streamKey}". Remaining clients: ${streamData.clients.size}`);
      if (streamData.clients.size === 0) {
        if (streamData.process && streamData.process.exitCode === null && streamData.process.signalCode === null) {
          console.log(`No more clients for "${ws.streamKey}", signaling FFmpeg to stop.`);
          streamData.process.kill('SIGINT');
        } else {
          console.log(`No more clients for "${ws.streamKey}", FFmpeg process likely already ended.`);
        }
      }
    }
  });
});
