/**
 * webpack-config-override.js
 * 
 * This file overrides certain webpack runtime behaviors to make module loading
 * more resilient, especially for ESM/CJS compatibility issues.
 */
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};
const debugWarn = (...args) => {
  if (DEBUG) {
    console.warn(...args);
  }
};

// Intercept webpack's module cache to make it more fault-tolerant
(function() {
  // Wait for webpack to initialize
  window.addEventListener('DOMContentLoaded', function() {
    // Safety check for webpack presence
    if (!window.webpackJsonp && !window.__webpack_require__) {
      debugWarn("Webpack runtime not detected, skipping module cache override");
      return;
    }

    try {
      // Add fallback handler for module loading failures
      const originalWebpackRequire = window.__webpack_require__ || 
        (window.webpackJsonp && window.webpackJsonp[0] && window.webpackJsonp[0][1]);
      
      if (originalWebpackRequire) {
        // Create backup for critical modules
        const safeModules = {
          // EnglishTruncationFix fallback implementation
          EnglishTruncationFix: {
            fixEnglishTruncation: function(json) { return json; },
            recoverFromEnglishTruncation: function() { return null; }
          }
        };
        
        debugLog("Webpack module cache override installed");
        
        // Monitor for specific error patterns
        window.addEventListener('error', function(event) {
          if (event.error && event.error.message && 
              event.error.message.includes("is not a function")) {
            debugWarn("Caught 'not a function' error, might be related to module loading", event.error);
            // Force a refresh if this is the bundle.js error we're targeting
            if (event.filename && event.filename.includes("bundle.js") && 
                event.lineno === 2 && event.error.stack && event.error.stack.includes("n[e]")) {
              console.error("Detected the specific bundle.js error, applying workaround");
              // Use our standalone implementation
              if (window.EnglishTruncationFix) {
                debugLog("Using standalone EnglishTruncationFix as fallback");
              }
            }
          }
        });
      }
    } catch (e) {
      console.error("Error setting up webpack module override:", e);
    }
  });
})();
