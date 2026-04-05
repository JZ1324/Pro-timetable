import React, { useState, useEffect } from 'react';
import Header from './Header';
import Timetable from './Timetable';
import Settings from './Settings';
import ThemeSwitcher from './ThemeSwitcher';
import AcademicPlanner from './AcademicPlanner';
import SmartStudySearch from './SmartStudySearch';
import Login from './Login';
import ThemeInitializer from './ThemeInitializer';
import { applyThemeToDocument } from '../services/themeService';
import { useAuth } from './AuthProvider';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { debugLog } from '../utils/debug';
import '../styles/components/SmartStudySearchContainer.css';

const LOCKED_OVERFLOW_VALUES = new Set(['hidden', 'clip']);
const STALE_SCROLL_LOCK_CLASSES = ['modal-open', 'focus-mode-active', 'smart-search-active'];
const BLOCKING_OVERLAY_SELECTORS = [
  '.colors-popup-overlay',
  '.notification-popup-modal',
  '.confirm-dialog-modal',
  '.template-name-modal',
  '.logout-confirm-modal',
  '.import-timetable-modal',
  '.import-tutorial-overlay',
  '.tutorial-selection-overlay',
  '.tutorial-overlay',
  '.practice-reminder-overlay',
  '.modal-overlay',
  '.user-profile-modal',
  '.user-info-modal',
  '.change-password-modal',
  '.help-page-fullscreen',
  '.focus-mode-overlay',
  '.task-form-overlay',
  '.advanced-search-overlay',
  '.templates-overlay',
  '.analytics-overlay'
];

const isElementVisible = (element) => {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    parseFloat(style.opacity || '1') === 0
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const hasVisibleBlockingOverlay = () => {
  return BLOCKING_OVERLAY_SELECTORS.some((selector) =>
    Array.from(document.querySelectorAll(selector)).some(isElementVisible)
  );
};

const hasActiveScrollLock = () => {
  const body = document.body;
  const root = document.documentElement;

  const classesPresent = STALE_SCROLL_LOCK_CLASSES.some((className) => body.classList.contains(className));
  const bodyComputed = window.getComputedStyle(body);
  const rootComputed = window.getComputedStyle(root);
  const bodyLocked = LOCKED_OVERFLOW_VALUES.has(body.style.overflow) || LOCKED_OVERFLOW_VALUES.has(body.style.overflowY);
  const rootLocked = LOCKED_OVERFLOW_VALUES.has(root.style.overflow) || LOCKED_OVERFLOW_VALUES.has(root.style.overflowY);
  const bodyComputedLocked = LOCKED_OVERFLOW_VALUES.has(bodyComputed.overflow) || LOCKED_OVERFLOW_VALUES.has(bodyComputed.overflowY);
  const rootComputedLocked = LOCKED_OVERFLOW_VALUES.has(rootComputed.overflow) || LOCKED_OVERFLOW_VALUES.has(rootComputed.overflowY);

  return classesPresent || bodyLocked || rootLocked || bodyComputedLocked || rootComputedLocked;
};

const clearStaleScrollLock = () => {
  const body = document.body;
  const root = document.documentElement;

  // Use an explicit reset instead of an empty string so we override stale
  // modal/focus CSS that can otherwise keep the main timetable unscrollable.
  body.style.overflow = 'unset';
  body.style.overflowY = 'unset';
  body.style.height = 'unset';
  body.style.minHeight = 'unset';
  body.style.position = 'unset';
  body.style.pointerEvents = 'unset';
  root.style.overflow = 'unset';
  root.style.overflowY = 'unset';
  root.style.height = 'unset';
  root.style.minHeight = 'unset';
  STALE_SCROLL_LOCK_CLASSES.forEach((className) => body.classList.remove(className));
};

const AppContent = () => {
  // Get saved theme or default to light
  const getSavedTheme = () => {
    try {
      const savedTheme = localStorage.getItem('preferred-theme');
      return savedTheme || 'light';
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return 'light';
    }
  };

  const [currentTheme, setCurrentTheme] = useState(getSavedTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAcademicPlanner, setShowAcademicPlanner] = useState(false);
  const [showSmartStudySearch, setShowSmartStudySearch] = useState(false);
  
  // Get authentication state from context
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Get sync status for Firestore
  const { isFirestoreReady } = useSyncStatus();

  const handleThemeChange = (theme) => {
    debugLog("%c THEME CHANGE: ", "background: #6e3cbf; color: white; padding: 4px; border-radius: 4px", theme);
    
    // Update state
    setCurrentTheme(theme);
    
    // Save to localStorage
    try {
      localStorage.setItem('preferred-theme', theme);
      debugLog("Saved theme to localStorage:", theme);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    // Apply theme classes directly without clobbering modal/scroll-lock classes
    applyThemeToDocument(theme);
    
    debugLog(`Applied theme classes. document.body.className: ${document.body.className}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleAcademicPlanner = () => {
    setShowAcademicPlanner(!showAcademicPlanner);
    // Close Smart Study Search if open
    if (showSmartStudySearch) {
      setShowSmartStudySearch(false);
    }
  };

  const toggleSmartStudySearch = () => {
    setShowSmartStudySearch(!showSmartStudySearch);
    // Close Academic Planner if open
    if (showAcademicPlanner) {
      setShowAcademicPlanner(false);
    }
  };

  // Double-check theme is applied after component is mounted
  useEffect(() => {
    // Extra safety mechanism to ensure theme is properly applied
    const forceApplyTheme = () => {
      debugLog("Force applying theme to ensure it's active:", currentTheme);
      applyThemeToDocument(currentTheme);
      
      // Force re-render by touching the state
      setCurrentTheme(prev => prev);
    };
    
    // Apply immediately and after a delay to handle any race conditions
    forceApplyTheme();
    const timerId = setTimeout(forceApplyTheme, 500);
    
    return () => clearTimeout(timerId);
  }, [currentTheme]);

  // Set initial theme on mount
  useEffect(() => {
    const initialTheme = getSavedTheme();
    debugLog("%c INITIAL THEME: ", "background: #6e3cbf; color: white; padding: 4px; border-radius: 4px", initialTheme);
    
    // Apply theme classes directly without replacing unrelated body/html classes
    applyThemeToDocument(initialTheme);
    
    // Force update the current theme state
    setCurrentTheme(initialTheme);
    
    // Load sidebar state from localStorage if available
    try {
      const savedSidebarState = localStorage.getItem('sidebar-open');
      if (savedSidebarState !== null) {
        setSidebarOpen(savedSidebarState === 'true');
      }
    } catch (error) {
      console.error('Error reading sidebar state from localStorage:', error);
    }
  }, []);
  
  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-open', sidebarOpen.toString());
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error);
    }
  }, [sidebarOpen]);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    debugLog('Login successful, user:', user.uid);
    // The Auth Provider will handle the authentication state now
  };

  useEffect(() => {
    if (!isAuthenticated || showAcademicPlanner || showSmartStudySearch) {
      return undefined;
    }

    const recoverScrollableShell = () => {
      if (hasVisibleBlockingOverlay()) {
        return;
      }

      // Even when the computed lock is subtle, force the shell back to a
      // scrollable baseline on the main timetable screen.
      if (!hasActiveScrollLock()) {
        document.body.style.overflow = 'unset';
        document.body.style.overflowY = 'unset';
        document.documentElement.style.overflow = 'unset';
        document.documentElement.style.overflowY = 'unset';
        return;
      }

      clearStaleScrollLock();
    };

    const scheduleRecovery = () => {
      window.setTimeout(recoverScrollableShell, 0);
    };

    const rafId = window.requestAnimationFrame(recoverScrollableShell);
    const shortTimerId = window.setTimeout(recoverScrollableShell, 150);
    const longTimerId = window.setTimeout(recoverScrollableShell, 600);
    const intervalId = window.setInterval(recoverScrollableShell, 1500);
    const mutationObserver = new MutationObserver(() => {
      window.setTimeout(recoverScrollableShell, 0);
    });

    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    window.addEventListener('focus', recoverScrollableShell);
    document.addEventListener('visibilitychange', recoverScrollableShell);
    document.addEventListener('click', scheduleRecovery, true);
    document.addEventListener('keydown', scheduleRecovery, true);
    document.addEventListener('touchend', scheduleRecovery, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(shortTimerId);
      window.clearTimeout(longTimerId);
      window.clearInterval(intervalId);
      mutationObserver.disconnect();
      window.removeEventListener('focus', recoverScrollableShell);
      document.removeEventListener('visibilitychange', recoverScrollableShell);
      document.removeEventListener('click', scheduleRecovery, true);
      document.removeEventListener('keydown', scheduleRecovery, true);
      document.removeEventListener('touchend', scheduleRecovery, true);
    };
  }, [isAuthenticated, showAcademicPlanner, showSmartStudySearch]);

  // Conditionally render Login or main app
  return (
    <div className={`app theme-${currentTheme}`} data-theme={currentTheme}>
      <ThemeInitializer theme={currentTheme} />
      
      {isLoading ? (
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      ) : (
        isAuthenticated ? (
          // Main app when authenticated
          <>
            {!showSmartStudySearch && (
              <Header 
                toggleSidebar={toggleSidebar} 
                sidebarOpen={sidebarOpen} 
                toggleAcademicPlanner={toggleAcademicPlanner}
                academicPlannerActive={showAcademicPlanner}
                toggleSmartStudySearch={toggleSmartStudySearch}
                smartStudySearchActive={showSmartStudySearch}
                user={user}
              />
            )}
            <main className="main-content">
              {showAcademicPlanner ? (
                <div className="planner-full-width">
                  <div className="animated-container fade-in-up">
                    <AcademicPlanner />
                  </div>
                </div>
              ) : showSmartStudySearch ? (
                <div className="smart-study-search-full-width">
                  <SmartStudySearch onClose={toggleSmartStudySearch} />
                </div>
              ) : (
                <div className={`main-container ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                  <div className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
                    <ThemeSwitcher 
                      onThemeChange={handleThemeChange} 
                      currentTheme={currentTheme} 
                    />
                    <Settings sidebarOpen={sidebarOpen} />
                  </div>
                  <div className="timetable-section">
                    <div className="animated-container fade-in-up">
                      <div className="dashboard-overview-grid" aria-label="Schedule dashboard overview">
                        <div className="overview-card">
                          <span className="overview-label">Today</span>
                          <strong className="overview-value">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
                          </strong>
                          <span className="overview-subtext">
                            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="overview-card">
                          <span className="overview-label">Mode</span>
                          <strong className="overview-value">Weekly View</strong>
                          <span className="overview-subtext">Focused on timetable execution</span>
                        </div>
                        <div className="overview-card overview-status-card" title={isFirestoreReady ? "Synced to cloud" : "Local storage only"}>
                          <span className="overview-label">Sync</span>
                          <strong className="overview-value">
                            {isFirestoreReady ? 'Cloud Connected' : 'Local Only'}
                          </strong>
                          <span className={`sync-status-chip ${isFirestoreReady ? 'is-cloud' : 'is-local'}`}>
                            {isFirestoreReady ? '☁ Cloud' : '💾 Local'}
                          </span>
                        </div>
                      </div>
                      <div className="dashboard-title-row">
                        <h2 className="section-title">Weekly Schedule</h2>
                      </div>
                      <Timetable />
                    </div>
                  </div>
                </div>
              )}
            </main>
            <footer className="footer">
              <p>© {new Date().getFullYear()} School Timetable App</p>
            </footer>
          </>
        ) : (
          // Login screen when not authenticated
          <Login onLoginSuccess={handleLoginSuccess} />
        )
      )}
    </div>
  );
};

export default AppContent;
