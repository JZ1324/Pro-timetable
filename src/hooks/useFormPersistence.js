import { useEffect } from 'react';

export const useFormPersistence = (storageKey, values, setters, options = {}) => {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      Object.entries(setters).forEach(([field, setter]) => {
        if (Object.prototype.hasOwnProperty.call(parsed, field)) {
          setter(parsed[field]);
        }
      });
    } catch (error) {
      console.warn(`Failed to restore form data for ${storageKey}:`, error);
    }
    // Intentionally run once on mount for each storageKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  useEffect(() => {
    if (!enabled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch (error) {
      console.warn(`Failed to persist form data for ${storageKey}:`, error);
    }
  }, [storageKey, values, enabled]);
};

export const clearPersistedForm = (storageKey) => {
  localStorage.removeItem(storageKey);
};
