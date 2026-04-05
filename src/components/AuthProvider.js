import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  initializeAuth, 
  getCurrentUser, 
  onAuthStateChanged 
} from '../services/authService';
import { getUserData, startActivityTracking } from '../services/userService';
import { debugLog } from '../utils/debug';

// Create Auth Context
export const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [activityCleanup, setActivityCleanup] = useState(null);

  // Initialize Firebase auth on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth();
        setAuthInitialized(true);
        
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(async (user) => {
          setIsLoading(true);
          
          // Clean up previous activity tracking
          if (activityCleanup) {
            activityCleanup();
            setActivityCleanup(null);
          }
          
          if (user) {
            debugLog('User authenticated:', user.uid);
            setUser(user);
            setIsAuthenticated(true);
            
            // Start activity tracking for the authenticated user
            try {
              const cleanup = startActivityTracking(user.uid);
              setActivityCleanup(() => cleanup);
              debugLog('✅ Activity tracking started for user:', user.uid);
            } catch (err) {
              console.error('Error starting activity tracking:', err);
            }
            
            // Fetch additional user data from Firestore
            try {
              const firestoreData = await getUserData(user.uid);
              setUserData(firestoreData);
            } catch (err) {
              console.error('Error fetching user data:', err);
              // Create minimal user data from auth user if Firestore fails
              setUserData({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
              });
            }
          } else {
            debugLog('No user authenticated');
            setUser(null);
            setUserData(null);
            setIsAuthenticated(false);
          }
          
          setIsLoading(false);
        });
        
        // Return cleanup function
        return () => {
          unsubscribe();
          if (activityCleanup) {
            activityCleanup();
          }
        };
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setError(err.message);
        setAuthInitialized(true);
        setIsLoading(false);
        
        // In a production app, you might want to handle this differently
        // For now, we'll fall back to a non-authenticated state
        setUser(null);
        setUserData(null);
        setIsAuthenticated(false);
      }
    };
    
    initAuth();
  }, []);

  // Refresh user data when user changes
  useEffect(() => {
    const refreshUserData = async () => {
      if (user && user.uid) {
        try {
          const firestoreData = await getUserData(user.uid);
          setUserData(firestoreData);
        } catch (err) {
          console.error('Error refreshing user data:', err);
          // Fallback to basic user data if Firestore fails
          setUserData({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      }
    };
    
    refreshUserData();
  }, [user]);

  // Cleanup activity tracking on unmount
  useEffect(() => {
    return () => {
      if (activityCleanup) {
        activityCleanup();
      }
    };
  }, [activityCleanup]);

  // The value to be provided to consumers of this context
  const authValue = {
    user,
    userData,
    isAuthenticated,
    isLoading,
    authInitialized,
    error,
    refreshUserData: async () => {
      if (user && user.uid) {
        try {
          const firestoreData = await getUserData(user.uid);
          setUserData(firestoreData);
          return firestoreData;
        } catch (err) {
          console.error('Error refreshing user data:', err);
          throw err;
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
