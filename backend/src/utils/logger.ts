export const logInfo = (msg: string): void => {
  console.log(msg);
};

export const logError = (msg: string, err?: any): void => {
  console.error(msg, err);
};
