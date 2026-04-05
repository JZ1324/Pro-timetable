import React from 'react';
import AuthProvider from './components/AuthProvider';
import Router from './components/Router';
import { ToastProvider } from './components/ToastProvider';
import './styles/global.css';

// Import theme CSS files
import './assets/themes/light.css';
import './assets/themes/dark.css';
import './assets/themes/colorful.css';
import './assets/themes/minimal.css';
import './assets/themes/pastel.css';

const App = () => {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router />
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;