import { trackError } from './analytics';

export const logInfo = (message, context = {}) => {
  console.info('[info]', message, context);
};

export const logWarn = (message, context = {}) => {
  console.warn('[warn]', message, context);
};

export const logError = (error, context = {}) => {
  console.error('[error]', error, context);
  trackError(error, context);
};
