import { config } from 'dotenv';
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
  return getRtspUrl({ ip, port, quality });
};

export type RTSPConfig = {
  ip: string;
  port: number;
  quality: StreamQuality;
};
export const getRtspUrl = (
  rtspConfig: RTSPConfig
  // ip: string,
  // port: number = 554,
  // quality: StreamQuality = StreamQuality.Low
): string => {
  const { ip, port, quality } = rtspConfig;
  const streamPath = quality === StreamQuality.High ? 'stream1' : 'stream2';
  return `rtsp://${process.env.TAPO_USERNAME}:${process.env
    .TAPO_PASSWORD}@${ip}:${port}/${streamPath}`;
};
