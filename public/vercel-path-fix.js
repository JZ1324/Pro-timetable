/**
 * Vercel-specific path fixing script to address the "Unexpected token '<'" error
 * This script is specifically designed for Vercel environments
 */

(function() {
  // Debug helper with additional metadata
  const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const log = function() {
    if (DEBUG && window.console) {
      const time = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = `[Vercel-PathFix ${time}]`;
      console.log.apply(console, [prefix].concat(Array.from(arguments)));
    }
  };
  
  try {
    log('Initializing Vercel path fix script...');
    
    // Flag this script is present
    window.__VERCEL_PATH_FIX_LOADED = true;
    
    // Environment detection
    const hostname = window.location.hostname;
    window.__VERCEL_DEPLOYMENT = hostname.includes('vercel.app') || hostname.includes('now.sh');
    window.__NETLIFY_DEPLOYMENT = hostname.includes('netlify.app');
    window.__GITHUB_PAGES = hostname.includes('github.io');
    window.__LOCAL_DEV = hostname === 'localhost' || hostname === '127.0.0.1';
    window.__PRODUCTION = !window.__LOCAL_DEV;
    
    // Log environment info
    log('Deployment environment:', {
      url: window.location.href,
      hostname: hostname,
      isVercel: window.__VERCEL_DEPLOYMENT,
      isNetlify: window.__NETLIFY_DEPLOYMENT, 
      isGitHubPages: window.__GITHUB_PAGES,
      isProduction: window.__PRODUCTION
    });
    
    // Fix common Vercel deployment issues
    if (window.__VERCEL_DEPLOYMENT || window.__PRODUCTION) {
      log('Applying Vercel-specific fixes...');
      
      // ===== PART 1: Bundle.js Path Fixing =====
      
      // Fix 1: Preemptively set variables for webpack publicPath
      window.__webpack_public_path__ = '/';
      
      // Fix 2: Override document.currentScript for dynamic imports
      const originalCurrentScript = Object.getOwnPropertyDescriptor(Document.prototype, 'currentScript');
      if (originalCurrentScript && originalCurrentScript.get) {
        Object.defineProperty(Document.prototype, 'currentScript', {
          get: function() {
            const script = originalCurrentScript.get.call(this);
            if (script && script.src && script.src.includes('bundle.js')) {
              const fixedScript = script.cloneNode(true);
              if (fixedScript.src.includes('./bundle.js')) {
                const newSrc = fixedScript.src.replace('./bundle.js', '/bundle.js');
                log('Fixed currentScript from', script.src, 'to', newSrc);
                fixedScript.src = newSrc;
                return fixedScript;
              }
            }
            return script;
          },
          configurable: true
        });
      }
      
      // Fix 3: Patch any dynamically created script elements
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'script') {
          const originalSetAttribute = element.setAttribute;
          element.setAttribute = function(name, value) {
            if (name === 'src' && typeof value === 'string' && value.includes('bundle.js')) {
              if (value.includes('./bundle.js')) {
                const newValue = value.replace('./bundle.js', '/bundle.js');
                log('Fixed dynamically created script src from', value, 'to', newValue);
                return originalSetAttribute.call(this, name, newValue);
              }
            }
            return originalSetAttribute.call(this, name, value);
          };
        }
        return element;
      };
      
      // Fix 4: Fix URLs in the DOM on load
      document.addEventListener('DOMContentLoaded', function() {
        log('DOM loaded, checking for bundle.js scripts...');
        
        // Fix script tags
        document.querySelectorAll('script[src*="bundle.js"]').forEach(script => {
          const src = script.getAttribute('src');
          if (src && src.includes('./bundle.js')) {
            const newSrc = src.replace('./bundle.js', '/bundle.js');
            log('Fixed script src from', src, 'to', newSrc);
            script.setAttribute('src', newSrc);
          }
        });
        
        log('Bundle.js path check complete');
      });
      
      // ===== PART 2: Firebase Configuration Fixing =====
      
      // Fix Firebase storage bucket references
      const checkFirebaseConfig = function() {
        if (window.firebaseConfig) {
          if (window.firebaseConfig.storageBucket && 
              window.firebaseConfig.storageBucket.includes('firebasestorage.app')) {
            const oldBucket = window.firebaseConfig.storageBucket;
            window.firebaseConfig.storageBucket = oldBucket.replace(
              'firebasestorage.app', 'appspot.com'
            );
            log('Fixed Firebase storage bucket from', oldBucket, 'to', window.firebaseConfig.storageBucket);
          } else {
            log('Firebase config present but no storage bucket fixes needed');
          }
        }
      };
      
      // Check immediately and after a short delay to catch late initialization
      checkFirebaseConfig();
      setTimeout(checkFirebaseConfig, 500);
      setTimeout(checkFirebaseConfig, 2000);
      
      // Monitor for Firebase config changes
      if (window.MutationObserver) {
        const observer = new MutationObserver(function() {
          checkFirebaseConfig();
        });
        
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true
        });
      }
      
      log('All Vercel path fixes applied');
    } else {
      log('Not a Vercel environment, skipping fixes');
    }
  } catch (error) {
    console.error('[Vercel-PathFix] Error:', error);
  }
})();
