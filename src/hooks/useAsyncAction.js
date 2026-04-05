import { useCallback, useState } from 'react';

export const useAsyncAction = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);

  const run = useCallback(async (action) => {
    setIsLoading(true);
    try {
      return await action();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, run, setIsLoading };
};
