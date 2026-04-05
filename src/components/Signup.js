import React, { useState, useEffect } from 'react';
import { initializeAuth, registerUser } from '../services/authService';
import { useToast } from './ToastProvider';
import { validateUsername, validateEmail, validatePassword } from '../utils/validation';
import { ensureSafeInput } from '../utils/security';
import { runWithRetryAndTimeout, mapApiError } from '../utils/apiUtils';
import { ClientRateLimiter } from '../utils/rateLimitUtils';
import { trackEvent } from '../utils/analytics';
import { useFormPersistence, clearPersistedForm } from '../hooks/useFormPersistence';
import { isFeatureEnabled } from '../utils/featureFlags';
import '../styles/components/Signup.css';

const signupRateLimiter = new ClientRateLimiter(3, 15 * 60 * 1000);

const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const toast = useToast();
  const persistForms = isFeatureEnabled('enableTimetableAutosave');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const [showSuccess, setShowSuccess] = useState(false);

  useFormPersistence(
    'pt-signup-form',
    { username, email },
    { username: setUsername, email: setEmail },
    { enabled: persistForms }
  );

  useEffect(() => {
    // Track if component is mounted
    let isMounted = true;
    
    // Initialize Firebase when component mounts
    const init = async () => {
      try {
        await initializeAuth();
        // Only update state if component is still mounted
        if (isMounted) {
          setFirebaseInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        // Only update state if component is still mounted
        if (isMounted) {
          setError('Failed to initialize authentication service.');
        }
      }
    };

    init();

    // Cleanup function to run when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 'weak';
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[@$!%*#?&]/.test(pwd);
    const isLong = pwd.length >= 12;
    
    const strength = [hasUppercase, hasNumber, hasSpecial, isLong].filter(Boolean).length;
    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'medium';
    return 'strong';
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const validateForm = () => {
    setError(''); // Clear previous errors

    let safeUsername = username;
    let safeEmail = email;
    try {
      safeUsername = ensureSafeInput(username);
      safeEmail = ensureSafeInput(email);
    } catch (securityError) {
      setError('Input contains unsafe content');
      return false;
    }
    
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    const usernameResult = validateUsername(safeUsername);
    if (!usernameResult.valid) {
      setError(usernameResult.error);
      return false;
    }

    const emailResult = validateEmail(safeEmail);
    if (!emailResult.valid) {
      setError(emailResult.error);
      return false;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      setError(passwordResult.error);
      return false;
    }
    
    // Username validation - letters, numbers, and underscores only
    // Special exception for "JZ" username
    if (username === "JZ") {
      // Allow "JZ" as a special case
    } else {
      const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
      if (!usernameRegex.test(username)) {
        setError('Username must be 3-16 characters and can only contain letters, numbers, and underscores');
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Password validation - at least 8 characters, one letter, one number
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least one letter and one number');
      return false;
    }
    
    // Confirm password
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Create a variable to track if the component is mounted during this async operation
    let isMounted = true;
    
    if (!validateForm()) {
      return;
    }

    if (!signupRateLimiter.isAllowed()) {
      const seconds = Math.ceil(signupRateLimiter.getRetryAfterMs() / 1000);
      setError(`Too many signup attempts. Try again in about ${seconds} seconds.`);
      toast.error('Too many signup attempts. Please wait and retry.');
      return;
    }

    if (!firebaseInitialized) {
      setError('Authentication service not ready yet. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Attempting to register user:', username, email);
      const userCredential = await runWithRetryAndTimeout(
        () => registerUser(username, email, password),
        {
          timeoutMs: 12000,
          retries: 1,
          shouldRetry: (err) => /network|timed out/i.test(err?.message || ''),
        }
      );
      const user = userCredential.user;
      
      console.log('Registration successful:', user.uid);
      
      // Only update state if component is still mounted
      if (isMounted) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        
        // Clear form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Notify parent component or redirect after a short delay
        setTimeout(() => {
          if (isMounted) {
            if (onSignupSuccess) {
              onSignupSuccess(user);
            } else if (onSwitchToLogin) {
              onSwitchToLogin();
            }
          }
        }, 2000);
        setShowSuccess(true);
        setPasswordStrength('weak');
        
        // Hide success animation after 2 seconds
        setTimeout(() => {
          if (isMounted) {
            setShowSuccess(false);
          }
        }, 2000);
        clearPersistedForm('pt-signup-form');
        trackEvent('signup_success', { uid: user.uid });
        toast.success('Account created successfully.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Only update state if component is still mounted
      if (isMounted) {
        if (error.code === 'auth/email-already-in-use') {
          setError('This email is already in use');
        } else if (error.message === 'Username already taken') {
          setError('This username is already taken');
        } else if (error.message === 'Temporary emails are not allowed.') {
          setError('Disposable email providers are not allowed');
        } else {
          setError(mapApiError(error));
        }
        trackEvent('signup_failed', { code: error.code || 'unknown' });
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="signup-form">
      <h2>Create a new account</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder="Choose a username"
          />
          <p className="input-hint">3-16 characters, letters, numbers, and underscores only</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            type="email"
            id="signup-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="signup-password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              placeholder="Create a password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
          {password && (
            <div className={`password-strength strength-${passwordStrength}`}>
              <div className="strength-label">Strength: {passwordStrength}</div>
              <div className="strength-bar"></div>
            </div>
          )}
          <p className="input-hint">At least 8 characters with letters and numbers</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="password-input-group">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        </div>
        
        <div className="form-submit-container" style={{marginTop: '20px', marginBottom: '15px', position: 'relative', zIndex: 100}}>
          <button 
            type="submit" 
            className="signup-button"
            disabled={isLoading}
            style={{display: 'block !important', width: '100%', visibility: 'visible !important'}}
          >
            {isLoading && <span className="spinner"></span>}
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          {showSuccess && (
            <div className="success-animation">
              <span className="success-checkmark">✓</span>
            </div>
          )}
        </div>
        
        <div className="switch-form">
          <p>Already have an account? <button 
            type="button" 
            className="switch-button" 
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Sign In
          </button></p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
