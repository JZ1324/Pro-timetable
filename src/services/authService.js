/**
 * Firebase Authentication Service
 * Uses the compat SDK loaded in index.html so startup does not depend on
 * split firebase/auth chunks.
 */

import firebaseConfigDefault from '../firebase-config';
import { debugLog } from '../utils/debug';

const getConfigFromWindow = () => {
  if (
    typeof window !== 'undefined' &&
    window.firebaseConfig &&
    window.firebaseConfig.apiKey &&
    window.firebaseConfig.apiKey !== '%REACT_APP_FIREBASE_API_KEY%'
  ) {
    return window.firebaseConfig;
  }

  return firebaseConfigDefault;
};

const firebaseConfig = getConfigFromWindow();

export const getFirebaseConfig = () => {
  return { ...firebaseConfig };
};

const getCompatFirebase = () => {
  if (typeof window === 'undefined' || !window.firebase) {
    throw new Error('Firebase SDK is not available on window.');
  }

  return window.firebase;
};

let app;
let auth;
let initialized = false;

export const initializeAuth = async () => {
  if (initialized) return auth;

  try {
    const firebase = getCompatFirebase();

    debugLog('🔥 Using Firebase SDK from HTML script tags');
    app = firebase.apps && firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();

    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    initialized = true;
    debugLog('🔥 Firebase Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  if (!initialized) {
    await initializeAuth();
  }

  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  await ensureUserDocumentExists(userCredential.user);
  return userCredential;
};

export const createUser = async (email, password) => {
  if (!initialized) {
    await initializeAuth();
  }

  return auth.createUserWithEmailAndPassword(email, password);
};

export const registerUser = async (username, email, password) => {
  debugLog('🔥 Starting registration process for:', username, email);

  if (!initialized) {
    debugLog('🔥 Initializing Firebase Auth...');
    await initializeAuth();
  }

  const { isDisposableEmail, isUsernameAvailable, createUserDocument } = await import('./userService');

  if (isDisposableEmail(email)) {
    throw new Error('Temporary emails are not allowed.');
  }

  if (!(await isUsernameAvailable(username))) {
    throw new Error('Username already taken');
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await createUserDocument(user.uid, {
      username,
      email
    });

    return userCredential;
  } catch (error) {
    console.error('🔥 Firebase Auth error:', error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. If this is your first time using the app, the account might be incomplete. Please try signing in first, or contact support if you need help completing your registration.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    throw new Error(`Registration failed: ${error.message}`);
  }
};

export const resetPassword = async (email) => {
  if (!initialized) {
    await initializeAuth();
  }

  return auth.sendPasswordResetEmail(email);
};

export const sendEmailVerification = async () => {
  if (!initialized || !auth.currentUser) {
    throw new Error('User not authenticated');
  }

  return auth.currentUser.sendEmailVerification();
};

export const isEmailVerified = () => {
  if (!initialized || !auth.currentUser) return false;
  return auth.currentUser.emailVerified;
};

export const isAdminCredentials = (email) => {
  return email === 'Monkeopolis';
};

export const signOut = async () => {
  if (!initialized) {
    throw new Error('Firebase auth not initialized');
  }

  return auth.signOut();
};

export const getCurrentUser = () => {
  if (!initialized || !auth) return null;
  return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
  if (!initialized || !auth) return () => {};
  return auth.onAuthStateChanged(callback);
};

export const updateProfile = async (profileData) => {
  if (!initialized || !auth || !auth.currentUser) {
    throw new Error('User not authenticated');
  }

  return auth.currentUser.updateProfile(profileData);
};

export const changePassword = async (currentPassword, newPassword) => {
  if (!initialized || !auth || !auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const firebase = getCompatFirebase();
  const credential = firebase.auth.EmailAuthProvider.credential(
    auth.currentUser.email,
    currentPassword
  );

  await auth.currentUser.reauthenticateWithCredential(credential);
  return auth.currentUser.updatePassword(newPassword);
};

export const ensureUserDocumentExists = async (user, additionalData = {}) => {
  if (!user) return;

  debugLog('🔥 Ensuring user document exists for:', user.uid);

  const { getUserData, createUserDocument } = await import('./userService');

  try {
    const userData = await getUserData(user.uid);

    if (!userData) {
      const email = user.email || '';
      const username = additionalData.username || email.split('@')[0] || 'user';

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
