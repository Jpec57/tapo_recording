import { config } from 'dotenv';
config({ path: '.env.local' });

export enum StreamQuality {
  Low = 'low',
  High = 'high'
}

const getRtspUrl = (quality: StreamQuality = StreamQuality.High) => {
  const streamQuality = quality === StreamQuality.High ? 'stream1' : 'stream2';
  return `rtsp://${process.env.TAPO_USERNAME}:${process.env
    .TAPO_PASSWORD}@${process.env.TAPO_REMOTE_IP}:${process.env
    .TAPO_REMOTE_PORT}/${streamQuality}`;
};
export default getRtspUrl;
