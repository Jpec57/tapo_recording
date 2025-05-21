import { FfmpegCommand } from 'fluent-ffmpeg';
import { Response } from 'express';

export const activeRecordings: Map<string, FfmpegCommand> = new Map();
