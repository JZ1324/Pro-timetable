export const isDevelopment = process.env.NODE_ENV !== 'production';

export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};
