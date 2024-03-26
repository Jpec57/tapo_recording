import getPidFilePath from './getPidFilePath';
import fs from 'fs';

const stopStream = (logFileName: string | null): void => {
  const pidFilePath = getPidFilePath();
  const pid: string = fs.readFileSync(pidFilePath, 'utf8');

  if (pid) {
    process.kill(Number(pid));
    console.log(`Stream stopped (PID ${pid})`);
    if (logFileName !== null) {
      fs.appendFileSync(logFileName, `Stream stopped (PID ${pid})\n`);
    }
    fs.unlinkSync(pidFilePath);
  } else {
    console.log('Stream is not running');
  }
};

export default stopStream;
