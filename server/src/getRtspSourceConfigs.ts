import { isDev } from "./utils/__isDev__";
import { getRtspUrl, StreamQuality, getRemoteRtspUrl } from "./utils/stream/getRtspUrl";

export const getRtspSourceConfigs = (): Record<string, string> => {
  return isDev()
    ? {
        home_gym: getRtspUrl({
          ip: process.env.TAPO_LOCAL_IP!.toString(),
          port: 554,
          quality: StreamQuality.Low
        }),
        home_gym_high: getRtspUrl({
          ip: process.env.TAPO_LOCAL_IP!.toString(),
          port: 554,
          quality: StreamQuality.High
        }),
        home_gym_2: getRtspUrl({
          ip: process.env.TAPO_LOCAL_IP_2!.toString(),
          port: 554,
          quality: StreamQuality.Low
        }),
        home_gym_2_high: getRtspUrl({
          ip: process.env.TAPO_LOCAL_IP_2!.toString(),
          port: 554,
          quality: StreamQuality.High
        }),
        rabbit_live: getRtspUrl({
          ip: '192.168.86.44',
          port: 554,
          quality: StreamQuality.High
        })
      }
    : {
        home_gym: getRemoteRtspUrl(5541),
        home_gym_high: getRemoteRtspUrl(5541, StreamQuality.High),
        home_gym_2: getRemoteRtspUrl(5542, StreamQuality.Low),
        home_gym_2_high: getRemoteRtspUrl(5542, StreamQuality.High)
      };
};
