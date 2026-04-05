const suspiciousPatterns = [
  /<script/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /document\.cookie/i,
];

export const sanitizeText = (value = '') => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const safeTrim = (value = '') => (typeof value === 'string' ? value.trim() : '');

export const hasSuspiciousInput = (value = '') => {
  if (typeof value !== 'string') return false;
  return suspiciousPatterns.some((pattern) => pattern.test(value));
};

export const ensureSafeInput = (value = '') => {
  if (hasSuspiciousInput(value)) {
    throw new Error('Input contains unsafe content');
  }
  return safeTrim(value);
};
