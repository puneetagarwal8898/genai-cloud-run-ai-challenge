/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CursorWaveEffect } from './components/CursorWaveEffect';
import { validateFirestoreConnection } from './firebase';

function MainApp() {
  const { user, loading } = useAuth();

  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors"
        style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            Opening private sanctuary...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <CursorWaveEffect />
      {user ? <Dashboard /> : <LandingPage />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
