/**
 * User Service
 * Handles Firestore operations for user management
 */
import { debugLog } from '../utils/debug';

let db;

/**
 * Initialize Firestore
 */
export const initializeFirestore = () => {
  try {
    // Use Firebase v8 compat SDK that's loaded via HTML script tags
    if (typeof window !== 'undefined' && window.firebase) {
      db = window.firebase.firestore();
      debugLog('🔥 Firestore initialized using v8 compat SDK');
      return db;
    } else {
      throw new Error('Firebase not available. Please check HTML script tags.');
    }
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
  }
};

/**
 * List of disposable email domains to block
 */
const disposableEmailDomains = [
  'mailinator.com', 
  'tempmail.com', 
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'throwawaymail.com',
  'getairmail.com',
  'mailnesia.com',
  'maildrop.cc'
];

/**
 * Check if email is from a disposable provider
 */
export const isDisposableEmail = (email) => {
  const domain = email.split('@')[1];
  return disposableEmailDomains.includes(domain);
};

/**
 * Check if username already exists in Firestore
 */
export const isUsernameAvailable = async (username) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    debugLog('🔍 Checking username availability for:', username);
    debugLog('🔍 Firebase project ID:', window.firebase?.app()?.options?.projectId);
    
    // Special handling for the "JZ" username
    if (username === "JZ") {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('username', '==', username).get();
      debugLog('🔍 Querying for JZ username...');
      const isAvailable = querySnapshot.empty;
      debugLog('🔍 JZ username available:', isAvailable);
      return isAvailable;
    }
    
    // Use v8 compat syntax for Firestore query
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('username', '==', username).get();
    debugLog('🔍 Querying for username:', username);
    
    const isAvailable = querySnapshot.empty;
    debugLog('🔍 Username available:', isAvailable);
    return isAvailable;
  } catch (error) {
    console.error('❌ Error checking username availability:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    // If we can't check username availability due to permissions,
    // we'll assume it's available and let the registration proceed
    // The worst case is a duplicate username error later
    if (error.code === 'permission-denied') {
      console.warn('⚠️ Permission denied for username check, proceeding anyway');
      return true; // Assume available
    }
    
    throw error;
  }
};

/**
 * Create user document in Firestore
 */
export const createUserDocument = async (uid, userData) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    debugLog('Creating user document for UID:', uid);
    debugLog('User data:', userData);
    debugLog('Firestore instance:', db);
    debugLog('Firebase project ID:', window.firebase?.app()?.options?.projectId);
    debugLog('Expected project ID: timetable-28639');
    
    const userDoc = {
      ...userData,
      createdAt: new Date().toISOString()
    };
    
    debugLog('Final document data:', userDoc);
    debugLog('Document path will be: users/' + uid);
    
    // Use v8 compat syntax for Firestore
    await db.collection('users').doc(uid).set(userDoc);
    debugLog('User document created successfully');
  } catch (error) {
    console.error('Error creating user document:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    // Use v8 compat syntax for Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

/**
 * Update user document in Firestore
 */
export const updateUserDocument = async (uid, userData) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    const userDocRef = db.collection('users').doc(uid);
    
    // Check if document exists first
    const docSnap = await userDocRef.get();
    
    if (docSnap.exists) {
      // Update existing document
      await userDocRef.update({
        ...userData,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new document if it doesn't exist
      await userDocRef.set({
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

/**
 * Set user as admin
 */
export const setUserAsAdmin = async (uid) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    const userDocRef = db.collection('users').doc(uid);
    
    // Check if document exists first
    const docSnap = await userDocRef.get();
    
    if (docSnap.exists) {
      // Update user role to admin
      await userDocRef.update({
        role: 'admin',
        updatedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting user as admin:', error);
    throw error;
  }
};

/**
 * Check if a user has admin privileges
 */
export const isAdmin = async (uid) => {
  if (!uid) return false;
  
  try {
    const userData = await getUserData(uid);
    
    // Check if user has admin role or isAdmin field set in Firebase
    return userData && (
      userData.role === 'admin' || 
      userData.isAdmin === true
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Update user's last activity timestamp
 */
export const updateUserActivity = async (uid) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    const now = new Date();
    await db.collection('users').doc(uid).update({
      lastActive: now.toISOString(),
      lastActiveTimestamp: now.getTime()
    });
    debugLog('✅ User activity updated for:', uid);
  } catch (error) {
    console.error('❌ Error updating user activity:', error);
    // Don't throw error to avoid breaking the app
  }
};

/**
 * Get users active within the last X minutes
 */
export const getActiveUsers = async (minutesThreshold = 15) => {
  if (!db) {
    initializeFirestore();
  }
  
  try {
    const cutoffTime = new Date(Date.now() - (minutesThreshold * 60 * 1000));
    const cutoffTimestamp = cutoffTime.getTime();
    
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef
      .where('lastActiveTimestamp', '>', cutoffTimestamp)
      .get();
    
    const activeUsers = [];
    querySnapshot.forEach(doc => {
      const userData = doc.data();
      const lastActive = new Date(userData.lastActiveTimestamp);
      const minutesAgo = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60));
      
      activeUsers.push({
        uid: doc.id,
        email: userData.email,
        username: userData.username,
        lastActive: userData.lastActive,
        minutesAgo: minutesAgo
      });
    });
    
    // Sort by most recently active
    activeUsers.sort((a, b) => a.minutesAgo - b.minutesAgo);
    
    debugLog(`📊 Found ${activeUsers.length} users active in last ${minutesThreshold} minutes`);
    return activeUsers;
  } catch (error) {
    console.error('❌ Error getting active users:', error);
    return [];
  }
};

/**
 * Initialize activity tracking for a user session
 */
export const startActivityTracking = (uid) => {
  // Update activity immediately
  updateUserActivity(uid);
  
  // Update activity every 5 minutes while user is active
  const activityInterval = setInterval(() => {
    updateUserActivity(uid);
  }, 5 * 60 * 1000); // 5 minutes
  
  // Update activity on user interactions
  const events = ['click', 'keypress', 'scroll', 'mousemove'];
  let lastActivityUpdate = Date.now();
  
  const handleUserActivity = () => {
    const now = Date.now();
    // Only update if it's been more than 2 minutes since last update
    if (now - lastActivityUpdate > 2 * 60 * 1000) {
      updateUserActivity(uid);
      lastActivityUpdate = now;
    }
  };
  
  events.forEach(event => {
    document.addEventListener(event, handleUserActivity, { passive: true });
  });
  
  // Cleanup function
  return () => {
    clearInterval(activityInterval);
    events.forEach(event => {
      document.removeEventListener(event, handleUserActivity);
    });
  };
};

export default {
  initializeFirestore,
  isDisposableEmail,
  isUsernameAvailable,
  createUserDocument,
  getUserData,
  updateUserDocument,
  setUserAsAdmin,
  isAdmin,
  updateUserActivity,
  getActiveUsers,
  startActivityTracking
};
