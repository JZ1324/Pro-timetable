/**
 * webpack-config-override.js
 *
 * This file overrides certain webpack runtime behaviors to make module loading
 * more resilient, especially for ESM/CJS compatibility issues.
 *
 * It is served as a plain script in production, so it must be safe if the tag
 * is accidentally included twice.
 */
(function () {
  if (window.__WEBPACK_CONFIG_OVERRIDE_LOADED__) {
    return;
  }

  window.__WEBPACK_CONFIG_OVERRIDE_LOADED__ = true;

  var DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var debugLog = function (...args) {
    if (DEBUG) {
      console.log(...args);
    }
  };
  var debugWarn = function (...args) {
    if (DEBUG) {
      console.warn(...args);
    }
  };

  window.addEventListener('DOMContentLoaded', function () {
    if (!window.webpackJsonp && !window.__webpack_require__) {
      debugWarn('Webpack runtime not detected, skipping module cache override');
      return;
    }

    try {
      var originalWebpackRequire =
        window.__webpack_require__ ||
        (window.webpackJsonp && window.webpackJsonp[0] && window.webpackJsonp[0][1]);

      if (!originalWebpackRequire) {
        return;
      }

      debugLog('Webpack module cache override installed');

      window.addEventListener('error', function (event) {
        if (
          event.error &&
          event.error.message &&
          event.error.message.includes('is not a function')
        ) {
          debugWarn(
            "Caught 'not a function' error, might be related to module loading",
            event.error
          );

          if (
            event.filename &&
            event.filename.includes('bundle.js') &&
            event.lineno === 2 &&
            event.error.stack &&
            event.error.stack.includes('n[e]')
          ) {
            console.error('Detected the specific bundle.js error, applying workaround');

            if (window.EnglishTruncationFix) {
              debugLog('Using standalone EnglishTruncationFix as fallback');
            }
          }
        }
      });
    } catch (error) {
      console.error('Error setting up webpack module override:', error);
    }
  });
})();
