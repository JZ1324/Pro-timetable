import React, { useState, useEffect } from 'react';
import {
  initializeAuth,
  signIn,
  resetPassword,
  isAdminCredentials
} from '../services/authService';
import { updateUserDocument } from '../services/userService';
import Signup from './Signup';
import '../styles/components/Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'reset', or 'signup'
  const [showAdminTerminal, setShowAdminTerminal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [terminalPosition, setTerminalPosition] = useState({ x: 300, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Create a variable to track if the component is mounted during this async operation
    let isMounted = true;
    // Create a cleanup function that will be called when the component unmounts
    const cleanup = () => {
      isMounted = false;
    };
    
    console.log("Login attempt with:", email, password);
    
    // Special case for admin terminal
    if (email === 'Monkeopolis') {
      console.log("Admin terminal condition met");
      setError(''); // Clear any previous errors
      setShowAdminTerminal(true);
      
      // If user is already logged in, update their role to admin
      try {
        const user = await signIn('admin@timetable.com', 'admin123');
        if (user && user.user) {
          // Update user role to admin in Firestore
          await updateUserDocument(user.user.uid, { role: 'admin' });
          onLoginSuccess(user.user);
        }
      } catch (error) {
        console.error('Error setting admin privileges:', error);
      }
      
      return;
    }
    
    if (!email || !password) {
      setError('Please enter both email and password');
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
      const userCredential = await signIn(email, password);
      const user = userCredential.user;
      
      console.log('Login successful:', user.uid);
      
      // Only update state if component is still mounted
      if (isMounted) {
        // Call the onLoginSuccess callback to notify parent component
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Only update state if component is still mounted
      if (isMounted) {
        // Handle specific Firebase auth errors
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setError('Invalid email or password');
        } else if (error.code === 'auth/too-many-requests') {
          setError('Too many failed login attempts. Please try again later.');
        } else {
          setError('Login failed. Please try again.');
        }
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // Create a variable to track if the component is mounted during this async operation
    let isMounted = true;
    // Create a cleanup function that will be called when the component unmounts
    const cleanup = () => {
      isMounted = false;
    };
    
    if (!email) {
      setError('Please enter your email address');
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
      await resetPassword(email);
      
      // Only update state if component is still mounted
      if (isMounted) {
        setSuccessMessage('Password reset link has been sent to your email.');
        setEmail('');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Only update state if component is still mounted
      if (isMounted) {
        if (error.code === 'auth/user-not-found') {
          setError('No account found with this email');
        } else if (error.code === 'auth/invalid-email') {
          setError('Invalid email address');
        } else {
          setError('Failed to send password reset email. Please try again.');
        }
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  // Add these handlers for terminal drag functionality
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('terminal_toolbar')) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTerminalPosition({
        x: terminalPosition.x + e.movementX,
        y: terminalPosition.y + e.movementY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (showAdminTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showAdminTerminal, isDragging, terminalPosition]);

  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="text"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="Enter your email"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <div className="password-input-group">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Enter your password"
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
      </div>
      
      <button 
        type="submit" 
        className="primary-button"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
      
      <div className="actions">
        <button 
          type="button" 
          className="text-button" 
          onClick={() => setActiveTab('reset')}
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>
      
      <div className="register-notice">
        <p>Need an account? <button 
          type="button" 
          className="text-button" 
          onClick={() => setActiveTab('signup')}
          disabled={isLoading}
        >
          Sign Up
        </button></p>
      </div>
    </form>
  );

  const renderPasswordResetForm = () => (
    <form onSubmit={handlePasswordReset}>
      <div className="form-group">
        <label htmlFor="reset-email">Email</label>
        <input
          type="email"
          id="reset-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="Enter your email"
        />
      </div>
      
      <button 
        type="submit" 
        className="primary-button"
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Reset Password'}
      </button>
      
      <div className="actions">
        <button 
          type="button" 
          className="text-button" 
          onClick={() => setActiveTab('login')}
          disabled={isLoading}
        >
          Back to login
        </button>
      </div>
    </form>
  );

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Timetable App</h1>
        {showAdminTerminal && (
          <div style={{color: 'red', textAlign: 'center', marginBottom: '10px'}}>
            Admin Terminal Activated
          </div>
        )}
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            disabled={isLoading}
          >
            Login
          </button>
          <button 
            className={`tab ${activeTab === 'reset' ? 'active' : ''}`}
            onClick={() => setActiveTab('reset')}
            disabled={isLoading}
          >
            Reset Password
          </button>
          <button 
            className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
            disabled={isLoading}
          >
            Sign Up
          </button>
        </div>
        
        <h2>
          {activeTab === 'login' && 'Sign in to your account'}
          {activeTab === 'reset' && 'Reset your password'}
          {activeTab === 'signup' && 'Create a new account'}
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        {activeTab === 'login' && renderLoginForm()}
        {activeTab === 'reset' && renderPasswordResetForm()}
        {activeTab === 'signup' && <Signup 
          onSignupSuccess={(user) => {
            setActiveTab('login');
            setSuccessMessage('Account created successfully! You can now sign in.');
          }}
          onSwitchToLogin={() => setActiveTab('login')}
        />}
      </div>
      
      {showAdminTerminal && (
        <div 
          className="admin-terminal-container"
          style={{ 
            position: 'fixed',
            top: `calc(50% + ${terminalPosition.y}px)`, 
            left: `calc(50% + ${terminalPosition.x}px)`,
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'auto',
            zIndex: 1000
          }}
        >
          <div 
            className="terminal_toolbar"
            onMouseDown={handleMouseDown}
            style={{ cursor: 'grab' }}
          >
            <div className="butt">
                <button 
                  className="btn btn-color" 
                  onClick={() => setShowAdminTerminal(false)}
                ></button>
                <button className="btn"></button>
                <button className="btn"></button>
            </div>
            <p className="user">Premium Time Table: ~</p>
            <div className="add_tab">
                +
            </div>
          </div>
          <div className="terminal_body">
            <div className="terminal_promt">
                <span className="terminal_user">Admin:</span>
                <span className="terminal_location">~</span>
                <span className="terminal_bling">$</span>
                <span className="terminal_cursor"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;