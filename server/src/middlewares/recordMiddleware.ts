import express, { Request, Response } from 'express';
import { startStreamRecordings } from '../utils/stream/startStreamRecordings';
import { stopStreamRecordings } from '../utils/stream/stopStreamRecordings';
import { getStreamRecordingStatus } from '../utils/stream/getStreamRecordingStatus';
import { handleSseUpdates } from '../utils/stream/handleSseUpdates';

const RECORD_API_KEY = 'your-super-secret-key';
const recordRouter = express.Router();

recordRouter.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (
    req.path.startsWith('/record/') &&
    apiKey !== RECORD_API_KEY &&
    !req.path.startsWith('/record/status') &&
    !req.path.startsWith('/record/updates')
  ) {
    return res.status(401).send('Unauthorized');
  }
  next();
});

recordRouter.get('/record/start', (req: Request, res: Response): void => {
  let streamKeys: string[] = [];
  if (typeof req.query.streamKeys === 'string') {
    streamKeys = [req.query.streamKeys];
  } else if (Array.isArray(req.query.streamKeys)) {
    streamKeys = req.query.streamKeys as string[];
  }
  const maxDuration = req.query.duration
    ? parseInt(req.query.duration as string, 10)
    : undefined;
  startStreamRecordings(res, streamKeys, maxDuration);
});

recordRouter.get('/record/stop', (req: Request, res: Response): void => {
  let streamKeys: string[] = [];
  if (typeof req.query.streamKeys === 'string') {
    streamKeys = [req.query.streamKeys];
  } else if (Array.isArray(req.query.streamKeys)) {
    streamKeys = (req.query.streamKeys as any[]).filter(
      key => typeof key === 'string'
    );
  }

  // The stopStreamRecordings function now handles sending the response
  stopStreamRecordings(res, streamKeys);
});

recordRouter.get('/record/status', (req: Request, res: Response): void => {
  getStreamRecordingStatus(res);
});

recordRouter.get('/record/updates', handleSseUpdates);

export default recordRouter;
