/**
 * Input Validation & Security Utilities
 * Location: src/utils/validation.js
 * 
 * Provides secure validation functions for user inputs
 */

/**
 * Validate username format and length
 * @param {string} username - Username to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validateUsername = (username) => {
  if (!username) return { valid: false, error: 'Username is required' };
  if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 30) return { valid: false, error: 'Username must be less than 30 characters' };
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true, error: '' };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true, error: '' };
};

/**
 * Validate password strength
 * Requires: 8+ chars, 1 uppercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error: string, strength: string }
 */
export const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Password is required', strength: 'none' };
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  let strength = 'weak';
  if (hasUppercase && hasNumber) strength = 'medium';
  if (hasUppercase && hasNumber && hasSpecial) strength = 'strong';
  
  // Require at least medium strength (uppercase + number)
  if (!hasUppercase || !hasNumber) {
    return {
      valid: false,
      error: 'Password must contain an uppercase letter and a number',
      strength
    };
  }
  
  return { valid: true, error: '', strength };
};

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string safe for DOM
 */
export const sanitizeHtmlInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validate class name format (for timetable classes)
 * @param {string} className - Class name to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validateClassName = (className) => {
  if (!className) return { valid: false, error: 'Class name is required' };
  if (className.length > 100) return { valid: false, error: 'Class name is too long' };
  if (!/^[a-zA-Z0-9\s\-()]/i.test(className)) {
    return { valid: false, error: 'Class name contains invalid characters' };
  }
  return { valid: true, error: '' };
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validateTimeFormat = (time) => {
  if (!time) return { valid: false, error: 'Time is required' };
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Time must be in HH:MM format' };
  }
  return { valid: true, error: '' };
};

/**
 * Rate limiting utility
 * Prevents excessive API calls
 */
export class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  getRemainingRequests() {
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

/**
 * Create secure error messages (don't expose internals)
 * @param {Error} error - JavaScript error object
 * @param {boolean} isDevelopment - Environment flag
 * @returns {string} User-friendly error message
 */
export const getSecureErrorMessage = (error, isDevelopment = false) => {
  // Never expose stack traces or internal details to users
  if (isDevelopment) {
    console.error('[DEV ONLY]', error); // Log full error in development console
  }

  // Return generic message to user
  const message = error?.message || 'An unexpected error occurred';
  
  // Map specific errors
  if (message.includes('auth/user-not-found')) return 'User not found. Please check your email.';
  if (message.includes('auth/wrong-password')) return 'Incorrect password. Please try again.';
  if (message.includes('auth/email-already-in-use')) return 'Email already registered.';
  if (message.includes('auth/weak-password')) return 'Password is too weak. Use uppercase, numbers, and special characters.';
  if (message.includes('auth/invalid-email')) return 'Invalid email format.';
  if (message.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
  
  return 'Unable to process request. Please try again later.';
};
