import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { trackPageView } from './utils/analytics';
import './styles/global.css';
// Import GitHub Pages routing helper
import './utils/githubPagesRouting';

trackPageView();

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);