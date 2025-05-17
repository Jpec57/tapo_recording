const getTimeFilename = (extension: string) => {
  const now = new Date();
  return `recordings/${now.getFullYear()}_${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}_${now
    .getDate()
    .toString()
    .padStart(2, '0')}_${now
    .getHours()
    .toString()
    .padStart(2, '0')}_${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}_${now
    .getSeconds()
    .toString()
    .padStart(2, '0')}${extension}`;
};

export default getTimeFilename;
