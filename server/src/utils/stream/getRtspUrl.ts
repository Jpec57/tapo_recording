import { config } from 'dotenv';
import { isDev } from '../__isDev__';
config({ path: '.env.local' });

export enum StreamQuality {
  Low = 'low',
  High = 'high'
}

export const getRemoteRtspUrl = (
  port: number,
  quality: StreamQuality = StreamQuality.Low,
  ip: string = process.env.TAPO_REMOTE_IP!
) => {
  if (!ip) {
    throw new Error('TAPO_LOCAL_IP or TAPO_REMOTE_IP is not defined');
  }
  return getRtspUrl(ip, port, quality);
};

export const getRtspUrl = (
  ip: string,
  port: number = 554,
  quality: StreamQuality = StreamQuality.Low
): string => {
  const streamPath = quality === StreamQuality.High ? 'stream1' : 'stream2';
  return `rtsp://${process.env.TAPO_USERNAME}:${process.env
    .TAPO_PASSWORD}@${ip}:${port}/${streamPath}`;
};
