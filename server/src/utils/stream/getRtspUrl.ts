import { config } from 'dotenv';
import { isDev } from '../__isDev__';
config({ path: '.env.local' });

export enum StreamQuality {
  Low = 'low',
  High = 'high'
}

const getRtspUrl = (quality: StreamQuality = StreamQuality.High) => {
  const streamQuality = quality === StreamQuality.High ? 'stream1' : 'stream2';
  const ip = isDev() ? process.env.TAPO_LOCAL_IP : process.env.TAPO_REMOTE_IP;

  console.log('IP:', ip);
  return `rtsp://${process.env.TAPO_USERNAME}:${process.env
    .TAPO_PASSWORD}@${ip}:${process.env.TAPO_REMOTE_PORT}/${streamQuality}`;
};
export default getRtspUrl;
