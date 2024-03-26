import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import startStream from './utils/stream/startStream';
import stopStream from './utils/stream/stopStream';

const app: express.Application = express();
const PORT: number | string = process.env.PORT || 3000;
config({ path: '.env.local' });

const DEFAULT_DURATION: number = 5 * 60; // 5 minutes

const killAll = (): void => {
  spawn('pkill', ['ffmpeg']);
};

app.get('/start', (req: Request, res: Response): void => {
  const duration: number = req.query.duration
    ? parseInt(req.query.duration as string, 10)
    : DEFAULT_DURATION;
  startStream(duration);
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
