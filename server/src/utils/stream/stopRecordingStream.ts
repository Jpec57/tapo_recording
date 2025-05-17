import getPidFilePath from './getPidFilePath';
import fs from 'fs';

const stopRecordingStream = (logFileName: string | null): void => {
  const pidFilePath = getPidFilePath();

  if (!fs.existsSync(pidFilePath)) {
    console.log('No pid file found');
  }

  const pid: string = fs.readFileSync(pidFilePath, 'utf8');

  if (!pid) {
    console.log('Stream is not running');
    return;
  }

  process.kill(Number(pid));
  console.log(`Stream stopped (PID ${pid})`);
  if (logFileName !== null) {
    fs.appendFileSync(logFileName, `Stream stopped (PID ${pid})\n`);
  }
  fs.unlinkSync(pidFilePath);
};

export default stopRecordingStream;
