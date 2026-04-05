export class ClientRateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter((ts) => now - ts < this.windowMs);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  getRetryAfterMs() {
    if (!this.requests.length) return 0;
    const now = Date.now();
    const oldest = this.requests[0];
    return Math.max(0, this.windowMs - (now - oldest));
  }
}

export const debounce = (fn, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};

export const throttle = (fn, wait = 300) => {
  let lastRun = 0;
  let queued = null;

  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - lastRun);

    if (remaining <= 0) {
      lastRun = now;
      fn(...args);
      return;
    }

    clearTimeout(queued);
    queued = setTimeout(() => {
      lastRun = Date.now();
      fn(...args);
    }, remaining);
  };
};
