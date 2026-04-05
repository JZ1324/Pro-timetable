import React, { useState, useEffect } from 'react';
import Header from './Header';
import Timetable from './Timetable';
import Settings from './Settings';
import ThemeSwitcher from './ThemeSwitcher';
import AcademicPlanner from './AcademicPlanner';
import SmartStudySearch from './SmartStudySearch';
import Login from './Login';
import ThemeInitializer from './ThemeInitializer';
import { useAuth } from './AuthProvider';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { debugLog } from '../utils/debug';
import '../styles/components/SmartStudySearchContainer.css';

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
    
    // Apply theme classes directly
    document.documentElement.className = `theme-${theme}`;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `theme-${theme}`;
    document.body.setAttribute('data-theme', theme);
    
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
      document.documentElement.className = `theme-${currentTheme}`;
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.body.className = `theme-${currentTheme}`;
      document.body.setAttribute('data-theme', currentTheme);
      
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
    
    // Apply theme classes directly
    document.documentElement.className = `theme-${initialTheme}`;
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.body.className = `theme-${initialTheme}`;
    document.body.setAttribute('data-theme', initialTheme);
    
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
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
                        <h2 className="section-title" style={{margin: 0}}>Weekly Schedule</h2>
                        {/* Sync Status Indicator */}
                        <div className="sync-status" title={isFirestoreReady ? "Synced to cloud" : "Local storage only"}>
                          {isFirestoreReady ? (
                            <span style={{color: '#4CAF50', fontSize: '12px', fontWeight: 'bold'}}>☁️ Cloud</span>
                          ) : (
                            <span style={{color: '#FF9800', fontSize: '12px', fontWeight: 'bold'}}>💾 Local</span>
                          )}
                        </div>
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
