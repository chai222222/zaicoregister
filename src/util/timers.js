
export const sleep = (waitMills) => {
  return new Promise(resolve => {
    setTimeout(() => { resolve() }, waitMills);
  });
};
