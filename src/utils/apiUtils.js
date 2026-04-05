const DEFAULT_TIMEOUT_MS = 10000;

export const withTimeout = async (promise, timeoutMs = DEFAULT_TIMEOUT_MS, timeoutMessage = 'Request timed out') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const retryAsync = async (
  operation,
  {
    retries = 2,
    delayMs = 500,
    factor = 2,
    shouldRetry = () => true,
  } = {}
) => {
  let attempt = 0;
  let waitTime = delayMs;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries || !shouldRetry(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      waitTime *= factor;
      attempt += 1;
    }
  }

  throw new Error('Retry failed unexpectedly');
};

export const runWithRetryAndTimeout = async (
  operation,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 2,
    delayMs = 500,
    factor = 2,
    shouldRetry,
  } = {}
) => {
  return retryAsync(
    () => withTimeout(operation(), timeoutMs),
    { retries, delayMs, factor, shouldRetry }
  );
};

export const mapApiError = (error) => {
  const message = error?.message || '';
  if (/timed out/i.test(message)) return 'The request took too long. Please try again.';
  if (/network|fetch/i.test(message)) return 'Network issue detected. Check your connection and retry.';
  return 'Something went wrong. Please try again.';
};
