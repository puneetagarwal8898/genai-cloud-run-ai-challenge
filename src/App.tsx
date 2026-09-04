/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CursorWaveEffect } from './components/CursorWaveEffect';
import { validateFirestoreConnection } from './firebase';

function MainApp() {
  const { user, loading, isDeletingAccount } = useAuth();

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
    <div className="w-full max-w-full overflow-x-hidden min-h-screen relative flex flex-col">
      <CursorWaveEffect />
      {user ? <Dashboard /> : <LandingPage />}
      {isDeletingAccount && (
        <div
          id="account-deletion-blocker"
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 select-none cursor-wait"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'all'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Loader2 className="w-7 h-7 animate-spin text-rose-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-rose-100">Permanently Deleting Account</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Securely wiping all reflections, encryption keys, and active user session. Please wait...
              </p>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-rose-500 h-1.5 rounded-full animate-pulse w-full" />
            </div>
            <p className="text-[11px] text-stone-500 font-mono tracking-wide">
              UI locked &bull; Terminating session...
            </p>
          </div>
        </div>
      )}
    </div>
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
