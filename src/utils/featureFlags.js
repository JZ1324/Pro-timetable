const FLAG_STORAGE_KEY = 'pt-feature-flags';

const defaults = {
  enhancedAuthUx: true,
  analyticsEnabled: true,
  enableAdvancedParser: false,
  enableTimetableAutosave: true,
};

const readOverrides = () => {
  try {
    const raw = localStorage.getItem(FLAG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Failed to parse feature flags:', error);
    return {};
  }
};

const writeOverrides = (flags) => {
  localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(flags));
};

export const getFeatureFlags = () => ({ ...defaults, ...readOverrides() });

export const isFeatureEnabled = (flagName) => {
  const flags = getFeatureFlags();
  return Boolean(flags[flagName]);
};

export const setFeatureFlag = (flagName, value) => {
  const current = readOverrides();
  const next = { ...current, [flagName]: Boolean(value) };
  writeOverrides(next);
  return next;
};

export const resetFeatureFlags = () => {
  localStorage.removeItem(FLAG_STORAGE_KEY);
};
