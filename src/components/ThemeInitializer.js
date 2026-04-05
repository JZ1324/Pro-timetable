import React, { useEffect } from 'react';
import { applyThemeToDocument, getAccentHue, setAccentHue } from '../services/themeService';
import { debugLog } from '../utils/debug';

const ThemeInitializer = ({ theme }) => {
  useEffect(() => {
    const storedHue = getAccentHue();
    setAccentHue(storedHue, false);

    // This component's only job is to apply the theme to the document root element
    if (theme) {
      const root = document.documentElement;
      debugLog('%c ThemeInitializer: ', 'background: #6e3cbf; color: white; padding: 4px; border-radius: 4px', `Applying theme: ${theme}`);
      
      // Save scroll position and header state before theme change
      const scrollPosition = window.scrollY;
      const header = document.querySelector('.header');
      const wasHeaderScrolled = header ? header.classList.contains('scrolled') : false;
      
      // Add transition class just before applying theme
      root.classList.add('theme-transition');
      requestAnimationFrame(() => {
        // Apply theme classes without wiping unrelated global state such as modal locks
        applyThemeToDocument(theme, { rootExtraClasses: ['theme-transition'] });
        
        // Update document title to reflect theme (for debugging purposes)
        document.title = `Timetable App - ${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme`;
        
        // Remove transition class after animation duration (~400ms)
        setTimeout(() => { root.classList.remove('theme-transition'); }, 450);
      });
      
      debugLog('Applied classes:', {
        'document.documentElement.className': document.documentElement.className,
        'document.body.className': document.body.className,
        'document.documentElement.getAttribute("data-theme")': document.documentElement.getAttribute('data-theme'),
        'document.body.getAttribute("data-theme")': document.body.getAttribute('data-theme')
      });
    }
  }, [theme]);

  // This component doesn't render anything
  return null;
};

export default ThemeInitializer;
