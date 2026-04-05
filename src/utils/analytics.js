const EVENT_PREFIX = 'pt:';

const emitToDataLayer = (payload) => {
  if (window?.dataLayer && Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }
};

export const trackEvent = (name, params = {}) => {
  const payload = {
    event: `${EVENT_PREFIX}${name}`,
    ...params,
    ts: Date.now(),
  };

  emitToDataLayer(payload);
  console.info('[analytics]', payload);
};

export const trackPageView = (pageName) => {
  trackEvent('page_view', { page: pageName || window.location.pathname });
};

export const trackError = (error, context = {}) => {
  trackEvent('error', {
    message: error?.message || 'unknown_error',
    stack: error?.stack || '',
    ...context,
  });
};
