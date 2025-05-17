import { config } from 'dotenv';
import { isDev } from '../__isDev__';
config({ path: '.env.local' });

export enum StreamQuality {
  Low = 'low',
  High = 'high'
}

export const getDefaultRtspUrl = (
  quality: StreamQuality = StreamQuality.High
) => {
  const ip = isDev() ? process.env.TAPO_LOCAL_IP : process.env.TAPO_REMOTE_IP;
  if (!ip) {
    throw new Error('TAPO_LOCAL_IP or TAPO_REMOTE_IP is not defined');
  }
  console.log('IP:', ip);
  return getRtspUrl(ip, quality);
};

export const getRtspUrl = (
  ip: string,
  quality: StreamQuality = StreamQuality.Low
): string => {
  const streamPath = quality === StreamQuality.High ? 'stream1' : 'stream2';
  return `rtsp://${process.env.TAPO_USERNAME}:${process.env
    .TAPO_PASSWORD}@${ip}:${process.env.TAPO_REMOTE_PORT}/${streamPath}`;
};
