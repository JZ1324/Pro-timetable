/**
 * This script fixes the paths for bundle.js in Vercel deployment
 * It addresses the "Uncaught SyntaxError: Unexpected token '<'" error
 * by ensuring proper script loading
 */

// Run immediately to fix any script tags before they're executed
(function() {
  // Debug helper for logging
  const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const log = function() {
    if (DEBUG && window.console) {
      console.log.apply(console, ['[PathFix]'].concat(Array.from(arguments)));
    }
  };
  
  try {
    log('Path fix script initializing...');
    
    // Set a flag to identify Vercel deployment
    window.__VERCEL_DEPLOYMENT = 
      window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('now.sh');
    
    // Flag to indicate we're in production mode
    window.__PRODUCTION = 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1';
    
    log('Environment:', {
      hostname: window.location.hostname,
      isVercel: window.__VERCEL_DEPLOYMENT,
      isProduction: window.__PRODUCTION
    });
    
    // Fix for relative vs absolute paths in scripts - prevent bundle.js from loading with wrong path
    if (window.__VERCEL_DEPLOYMENT || window.__PRODUCTION) {
      log('Running in production environment');
      
      // Method 1: Fix bundle script tags when DOM is ready
      document.addEventListener('DOMContentLoaded', function() {
        log('DOM ready, fixing script paths...');
        
        // Fix script tags with bundle.js
        const bundleScripts = document.querySelectorAll('script[src*="bundle.js"]');
        bundleScripts.forEach(script => {
          const originalSrc = script.getAttribute('src');
          log('Found bundle script:', originalSrc);
          
          // Convert relative paths to absolute
          if (originalSrc.includes('./bundle.js')) {
            const newSrc = originalSrc.replace('./bundle.js', '/bundle.js');
            log('Fixing path:', originalSrc, '->', newSrc);
            script.setAttribute('src', newSrc);
          }
        });
      });
      
      // Method 2: Intercept document.write calls that might add bundle.js
      const originalDocWrite = document.write;
      document.write = function(markup) {
        if (markup && typeof markup === 'string') {
          // Fix any bundle.js paths in dynamically written content
          if (markup.includes('bundle.js')) {
            markup = markup.replace(/src="\.\/bundle\.js"/g, 'src="/bundle.js"');
            log('Fixed dynamically written bundle.js path');
          }
        }
        return originalDocWrite.call(document, markup);
      };
      
      // Method 3: Monitor for script insertions via MutationObserver
      if (window.MutationObserver) {
        log('Setting up MutationObserver for script tags');
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'SCRIPT' && node.src && node.src.includes('bundle.js')) {
                  const originalSrc = node.src;
                  if (originalSrc.includes('./bundle.js')) {
                    node.src = originalSrc.replace('./bundle.js', '/bundle.js');
                    log('Fixed dynamically added script:', originalSrc, '->', node.src);
                  }
                }
              });
            }
          });
        });
        
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      }
    }
    
    // Fix Firebase storage bucket if needed
    if (window.firebaseConfig) {
      log('Checking Firebase configuration');
      if (window.firebaseConfig.storageBucket && window.firebaseConfig.storageBucket.includes('firebasestorage.app')) {
        log('Fixing Firebase storage bucket');
        window.firebaseConfig.storageBucket = 
          window.firebaseConfig.storageBucket.replace(
            'firebasestorage.app', 
            'appspot.com'
          );
      }
    }
    
    log('Path fix script initialization complete');
  } catch (error) {
    console.error('[PathFix] Error:', error);
  }
})();
