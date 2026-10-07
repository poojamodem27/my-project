import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import App from './App.jsx';
import Welcome from './Welcome.jsx';
import Background3D from './Background3D.jsx';
import { useSiteEffects } from './effects.js';
import { ThemeProvider } from './ThemeContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './theme.css';
import './index.css';

function Root() {
  const [entered, setEntered] = useState(false);   // welcome page first
  useSiteEffects();
  return (
    <>
      <Background3D calm={entered} />
      {/* cursor spotlight */}
      <div aria-hidden="true" className="fixed inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(380px circle at var(--mx, 70%) var(--my, 30%), rgb(var(--c00f076) / 0.10), transparent 60%)' }} />
      <div className="relative z-10">
        {entered ? <App /> : <Welcome onEnter={() => { window.dispatchEvent(new CustomEvent('notetap-pulse', { detail: 1 })); setEntered(true); }} />}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
