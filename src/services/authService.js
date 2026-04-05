/**
 * Firebase Authentication Service
 * Provides methods for user authentication and management
 */

// Import Firebase configuration directly
import firebaseConfigDefault from '../firebase-config';
import { debugLog } from '../utils/debug';

// Access the Firebase config from window object (set by index.html) or use the imported config
const getConfigFromWindow = () => {
  // Check if we're in a browser environment and the config exists
  if (typeof window !== 'undefined' && window.firebaseConfig && window.firebaseConfig.apiKey && window.firebaseConfig.apiKey !== "%REACT_APP_FIREBASE_API_KEY%") {
    return window.firebaseConfig;
  }
  
  // Use imported config as a reliable fallback
  return firebaseConfigDefault;
};

// Use the config from the window object, which is populated in index.html
const firebaseConfig = getConfigFromWindow();

/**
 * Get Firebase configuration for use in other services
 */
export const getFirebaseConfig = () => {
  return { ...firebaseConfig };
};

let app;
let auth;
let initialized = false;

/**
 * Initialize Firebase Authentication
 */
export const initializeAuth = async () => {
  if (initialized) return auth;
  
  try {
    // Use Firebase SDK from HTML script tags (v8 compat)
    if (typeof window !== 'undefined' && window.firebase) {
      debugLog('🔥 Using Firebase SDK from HTML script tags');
      app = window.firebase.app();
      auth = window.firebase.auth();
      
      // Set persistence to LOCAL to keep users logged in
      await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
      
      initialized = true;
      debugLog('🔥 Firebase Auth initialized successfully');
      return auth;
    }
    
    // Fallback: If not available globally, use dynamic imports (v9 modular)
    const { initializeApp } = await import('firebase/app');
    const { getAuth, setPersistence, browserLocalPersistence } = await import('firebase/auth');
    
    const config = getConfigFromWindow();
    
    // Validate Firebase config before initialization
    if (!config.apiKey) {
      throw new Error('Firebase API Key is missing. Please check your environment variables.');
    }
    
    // Initialize Firebase
    app = initializeApp(config);
    auth = getAuth(app);
    
    // Set persistence to LOCAL for better user experience
    // This keeps the user logged in even after browser restarts
    await setPersistence(auth, browserLocalPersistence);
    
    initialized = true;
    
    return auth;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

/**
 * Sign in user with email and password
 */
export const signIn = async (email, password) => {
  if (!initialized) {
    await initializeAuth();
  }
  
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Ensure user document exists in Firestore
  await ensureUserDocumentExists(userCredential.user);
  
  return userCredential;
};

/**
 * Create a new user with email and password
 */
export const createUser = async (email, password) => {
  if (!initialized) {
    await initializeAuth();
  }
  
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Register new user with username, email, and password
 * Includes validation and Firestore integration
 */
export const registerUser = async (username, email, password) => {
  debugLog('🔥 Starting registration process for:', username, email);
  
  if (!initialized) {
    debugLog('🔥 Initializing Firebase Auth...');
    await initializeAuth();
  }
  
  // Import necessary services
  const { isDisposableEmail, isUsernameAvailable, createUserDocument } = await import('./userService');
  
  debugLog('🔥 Checking disposable email...');
  // Check if email is from a disposable provider
  if (isDisposableEmail(email)) {
    throw new Error('Temporary emails are not allowed.');
  }
  
  debugLog('🔥 Checking username availability...');
  // Check if username is available
  if (!(await isUsernameAvailable(username))) {
    throw new Error('Username already taken');
  }
  
  debugLog('🔥 Creating Firebase Auth user...');
  debugLog('🔥 Email:', email);
  debugLog('🔥 Password length:', password ? password.length : 'undefined');
  debugLog('🔥 Auth object:', !!auth);
  
  // Create user with Firebase Authentication
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    debugLog('🔥 Firebase Auth user created successfully! UID:', user.uid);
    debugLog('🔥 Now creating Firestore user document...');
    
    // Store user data in Firestore
    await createUserDocument(user.uid, {
      username,
      email
    });
    
    debugLog('🔥 Registration completed successfully!');
    return userCredential;
  } catch (error) {
    console.error('🔥 Firebase Auth error:', error);
    console.error('🔥 Error code:', error.code);
    console.error('🔥 Error message:', error.message);
    
    // Handle specific error cases
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. If this is your first time using the app, the account might be incomplete. Please try signing in first, or contact support if you need help completing your registration.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      console.error('🔥 Full error object:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
};

/**
 * Reset password for a user
 */
export const resetPassword = async (email) => {
  if (!initialized) {
    await initializeAuth();
  }
  
  const { sendPasswordResetEmail } = await import('firebase/auth');
  return sendPasswordResetEmail(auth, email);
};

/**
 * Send email verification
 */
export const sendEmailVerification = async () => {
  if (!initialized || !auth.currentUser) {
    throw new Error('User not authenticated');
  }
  
  const { sendEmailVerification: firebaseSendEmailVerification } = await import('firebase/auth');
  return firebaseSendEmailVerification(auth.currentUser);
};

/**
 * Check if email is verified
 */
export const isEmailVerified = () => {
  if (!initialized || !auth.currentUser) return false;
  return auth.currentUser.emailVerified;
};

/**
 * Check if provided credentials are for admin user
 */
export const isAdminCredentials = (email) => {
  // Special admin access via "Monkeopolis" credential
  return email === 'Monkeopolis';
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  if (!initialized) {
    throw new Error('Firebase auth not initialized');
  }
  
  const { signOut: firebaseSignOut } = await import('firebase/auth');
  return firebaseSignOut(auth);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  if (!initialized || !auth) return null;
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (callback) => {
  if (!initialized || !auth) return () => {};
  
  const importAndListen = async () => {
    const { onAuthStateChanged: firebaseAuthStateChanged } = await import('firebase/auth');
    return firebaseAuthStateChanged(auth, callback);
  };
  
  return importAndListen();
};

/**
 * Update user profile (displayName, photoURL)
 */
export const updateProfile = async (profileData) => {
  if (!initialized || !auth || !auth.currentUser) {
    throw new Error('User not authenticated');
  }
  
  const { updateProfile: firebaseUpdateProfile } = await import('firebase/auth');
  return firebaseUpdateProfile(auth.currentUser, profileData);
};

/**
 * Change user password
 */
export const changePassword = async (currentPassword, newPassword) => {
  if (!initialized || !auth || !auth.currentUser) {
    throw new Error('User not authenticated');
  }
  
  const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
  
  // Create credential with current password
  const credential = EmailAuthProvider.credential(
    auth.currentUser.email,
    currentPassword
  );
  
  // Reauthenticate
  await reauthenticateWithCredential(auth.currentUser, credential);
  
  // Update password
  return updatePassword(auth.currentUser, newPassword);
};

/**
 * Ensure user document exists in Firestore after sign in
 * This handles cases where Firebase Auth account exists but Firestore document is missing
 */
export const ensureUserDocumentExists = async (user, additionalData = {}) => {
  if (!user) return;
  
  debugLog('🔥 Ensuring user document exists for:', user.uid);
  
  const { getUserData, createUserDocument } = await import('./userService');
  
  try {
    // Check if user document exists
    const userData = await getUserData(user.uid);
    
    if (!userData) {
      debugLog('🔥 User document not found, creating it...');
      
      // Extract username from email or use default
      const email = user.email || '';
      const username = additionalData.username || email.split('@')[0] || 'user';
      
      // Create the missing user document
      await createUserDocument(user.uid, {
        username,
        email,
        ...additionalData
      });
      
      debugLog('🔥 User document created successfully');
    } else {
      debugLog('🔥 User document already exists');
    }
  } catch (error) {
    console.error('🔥 Error ensuring user document exists:', error);
    throw error;
  }
};

export default {
  initializeAuth,
  signIn,
  signOut,
  createUser,
  registerUser,
  resetPassword,
  getCurrentUser,
  onAuthStateChanged,
  updateProfile,
  changePassword,
  sendEmailVerification,
  isEmailVerified,
  isAdminCredentials,
  ensureUserDocumentExists
};
