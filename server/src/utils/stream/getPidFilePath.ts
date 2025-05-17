import path from 'path';

const getPidFilePath = () => {
    return path.join(__dirname, 'pid.txt');
}
export default getPidFilePath;