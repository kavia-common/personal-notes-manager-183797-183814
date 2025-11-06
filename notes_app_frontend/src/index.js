import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AuthGate from './components/AuthGate';

// PUBLIC_INTERFACE
function Root() {
  /** React root mounting point (App wrapped with AuthGate) */
  return (
    <AuthGate optional={false}>
      <App />
    </AuthGate>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
