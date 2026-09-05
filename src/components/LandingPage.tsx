import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  FlaskConical,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ThemeSelector } from './ThemeSelector';
import { OAuthGuideModal } from './OAuthGuideModal';

export const LandingPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithFacebook,
    signInWithLinkedIn,
    signUpWithEmail,
    verifyEmailCode,
    signInWithEmail,
    resendVerificationCode,
    cancelEmailVerification,
    signInAsDemoUser,
    pendingVerification,
    loading,
    error,
    clearError
  } = useAuth();

  const { appEnv, setAppEnv, isProductionLocked } = useApp();
  const isTestActive = appEnv === 'test' && !isProductionLocked;

  // Authentication UI state
  const [authMode, setAuthMode] = useState<'social' | 'email_signin' | 'email_signup'>('social');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  // OAuth helper modal state
  const [guideProvider, setGuideProvider] = useState<'google' | 'linkedin' | 'facebook' | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 6-digit verification code input state
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // When pendingVerification changes, prepopulate or focus
  useEffect(() => {
    if (pendingVerification) {
      setCodeDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [pendingVerification]);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...codeDigits];

    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedDigits[i] || '';
      }
      setCodeDigits(newDigits);
      const nextIndex = Math.min(pastedDigits.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleaned.slice(-1);
    setCodeDigits(newDigits);

    // Auto-advance
    if (cleaned && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalNotice(null);

    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      const isTestMode = appEnv === 'test';
      const res = await signUpWithEmail(email, password, displayName, isTestMode);
      if (appEnv === 'production') {
        setLocalNotice(`A 6-digit verification code was dispatched to ${email}. Please check your inbox and spam folder.`);
      } else {
        setLocalNotice(res.message || 'Verification code initialized.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to initialize email registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalNotice(null);

    if (!email.trim()) {
      setLocalError('Please enter your email.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsProcessing(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Incorrect email or password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const fullCode = codeDigits.join('');

    if (fullCode.length !== 6) {
      setLocalError('Please enter the full 6-digit verification code.');
      return;
    }

    if (!pendingVerification) {
      setLocalError('No pending verification session found.');
      return;
    }

    setIsProcessing(true);
    try {
      await verifyEmailCode(pendingVerification.email, fullCode);
    } catch (err: any) {
      setLocalError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingVerification) return;
    setLocalError(null);
    setLocalNotice(null);
    setIsProcessing(true);
    try {
      const isTestMode = appEnv === 'test';
      await resendVerificationCode(pendingVerification.email, isTestMode);
      if (appEnv === 'production') {
        setLocalNotice('A fresh 6-digit verification code has been dispatched to your inbox.');
      } else {
        setLocalNotice(`New test verification code dispatched.`);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin' | 'facebook') => {
    setLocalError(null);
    setIsProcessing(true);
    const isTestMode = appEnv === 'test';

    try {
      if (provider === 'google') await signInWithGoogle(isTestMode);
      else if (provider === 'facebook') await signInWithFacebook(isTestMode);
      else if (provider === 'linkedin') await signInWithLinkedIn(isTestMode);
    } catch (err: any) {
      console.warn(`${provider} login notice:`, err.message);
      // Open the interactive guide modal to help configure or test
      setGuideProvider(provider);
      setIsGuideOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayError = localError || error;

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Top Navigation */}
      <header
        className="w-full border-b backdrop-blur-md sticky top-0 z-40 transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title Perfectly Aligned */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                boxShadow: '0 0 15px var(--accent-glow)'
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center">
              <span className="font-semibold tracking-tight text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                ReflectAI
              </span>
              <span
                className="ml-2 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded leading-none flex items-center"
                style={{
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)'
                }}
              >
                Sanctuary
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Environment Switcher: Test vs Production (hidden completely if production is locked) */}
            {!isProductionLocked && (
              <div
                className="flex items-center p-0.5 rounded-lg border text-xs"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <button
                  id="env-toggle-test"
                  type="button"
                  onClick={() => setAppEnv('test')}
                  className="px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                  style={{
                    backgroundColor: appEnv === 'test' ? 'var(--accent)' : 'transparent',
                    color: appEnv === 'test' ? '#ffffff' : 'var(--text-muted)'
                  }}
                  title="Testing Environment with developer simulation tools"
                  aria-label="Switch to Test Mode"
                >
                  <span className="text-xs">🧪</span>
                  <span className="hidden sm:inline">Test Mode</span>
                </button>
                <button
                  id="env-toggle-prod"
                  type="button"
                  onClick={() => setAppEnv('production')}
                  className="px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                  style={{
                    backgroundColor: appEnv === 'production' ? 'var(--accent)' : 'transparent',
                    color: appEnv === 'production' ? '#ffffff' : 'var(--text-muted)'
                  }}
                  title="Production Environment strictly enforcing live authentication"
                  aria-label="Switch to Production Mode"
                >
                  <span className="text-xs">🚀</span>
                  <span className="hidden sm:inline">Production</span>
                </button>
              </div>
            )}

            <ThemeSelector />

            {/* Test Sandbox button only visible in Test Environment */}
            {isTestActive && (
              <button
                id="landing-header-demo-btn"
                onClick={signInAsDemoUser}
                disabled={loading || isProcessing}
                title="Test sandbox account (saved permanently)"
                className="hidden md:flex text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors items-center gap-1.5 cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Sandbox</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main hero & authentication portal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center relative w-full">
        {/* Subtle background ambient glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 opacity-30"
          style={{ backgroundColor: 'var(--accent)' }}
        />

        {displayError && (
          <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs sm:text-sm flex items-start justify-between backdrop-blur-xs max-w-md mx-auto w-full">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Notice</p>
                <p className="mt-0.5 text-red-200/90 leading-relaxed">{displayError}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setLocalError(null);
                clearError();
              }}
              className="text-xs font-semibold underline text-red-300 ml-3 shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {localNotice && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between max-w-md mx-auto w-full">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{localNotice}</span>
            </div>
            <button
              onClick={() => setLocalNotice(null)}
              className="text-[11px] font-semibold underline text-emerald-300 ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="text-center max-w-2xl mx-auto mb-8">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-medium mb-4 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            <Shield className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>Zero-Knowledge Data Privacy &bull; 256-Bit SSL/TLS Encryption</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans tracking-tight mb-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reflect clearly. Discover calm clarity.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed font-sans max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            A tranquil sanctuary for your daily reflections, thoughts, and brainstorming. Every entry is securely encrypted, isolated to your verified account, and enriched by mindful AI perspectives.
          </p>
        </div>

        {/* Authentication Card */}
        <div
          className="rounded-2xl border p-5 sm:p-7 shadow-2xl max-w-md mx-auto w-full relative transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)'
            }}
          />

          {/* Conditional View: 6-Digit Email Verification Mode */}
          {pendingVerification ? (
            <div className="animate-in fade-in duration-200">
              <div className="text-center mb-5">
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center border"
                  style={{
                    backgroundColor: 'var(--accent-light)',
                    borderColor: 'var(--accent)'
                  }}
                >
                  <KeyRound className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Email Verification Code
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Verification code dispatched to <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pendingVerification.email}</span>
                </p>
              </div>

              {/* In Test Mode: Show testing preview code if available */}
              {appEnv === 'test' && pendingVerification.previewCode && (
                <div
                  className="mb-4 p-2.5 rounded-lg border text-center text-xs flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span className="flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-amber-400" />
                    <span>Test Sandbox Code:</span>
                  </span>
                  <span className="font-mono font-bold tracking-widest text-sm" style={{ color: 'var(--accent)' }}>
                    {pendingVerification.previewCode}
                  </span>
                </div>
              )}

              {appEnv === 'production' && (
                <div
                  className="mb-4 p-2.5 rounded-lg border text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <p className="leading-snug">
                    Enter the 6-digit code delivered to your email inbox. Please check your spam folder if it does not arrive within 60 seconds.
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { codeInputRefs.current[idx] = el; }}
                      id={`digit-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: digit ? 'var(--accent)' : 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  id="verify-code-btn"
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 shadow-xs"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 15px var(--accent-glow)'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate &amp; Enter Journal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="hover:underline cursor-pointer"
                    style={{ color: 'var(--accent)' }}
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cancelEmailVerification();
                      setLocalError(null);
                    }}
                    className="hover:underline cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel / Back
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Authentication Portal */
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
                Access Your Private Journal
              </h2>
              <p className="text-xs text-center mb-5" style={{ color: 'var(--text-muted)' }}>
                Select your preferred authentication method to enter your reflection sanctuary.
              </p>

              {/* Auth Mode Tabs */}
              <div
                className="flex rounded-xl p-1 mb-5 border text-xs font-medium"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <button
                  type="button"
                  id="tab-social"
                  onClick={() => { setAuthMode('social'); setLocalError(null); }}
                  className="flex-1 py-1.5 rounded-lg transition text-center cursor-pointer"
                  style={{
                    backgroundColor: authMode === 'social' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'social' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: authMode === 'social' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  OAuth Sign-In
                </button>
                <button
                  type="button"
                  id="tab-email-signin"
                  onClick={() => { setAuthMode('email_signin'); setLocalError(null); }}
                  className="flex-1 py-1.5 rounded-lg transition text-center cursor-pointer"
                  style={{
                    backgroundColor: authMode === 'email_signin' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'email_signin' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: authMode === 'email_signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Email Login
                </button>
                <button
                  type="button"
                  id="tab-email-signup"
                  onClick={() => { setAuthMode('email_signup'); setLocalError(null); }}
                  className="flex-1 py-1.5 rounded-lg transition text-center cursor-pointer"
                  style={{
                    backgroundColor: authMode === 'email_signup' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'email_signup' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: authMode === 'email_signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* 1. OAuth Sign-In (Google, LinkedIn, Facebook) */}
              {authMode === 'social' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  {/* Google */}
                  <button
                    id="google-signin-btn"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={loading || isProcessing}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    id="linkedin-signin-btn"
                    onClick={() => handleOAuthSignIn('linkedin')}
                    disabled={loading || isProcessing}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="#0A66C2" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74V9.92H5.06v8.58h2.8z" />
                    </svg>
                    <span>Continue with LinkedIn</span>
                  </button>

                  {/* Facebook */}
                  <button
                    id="facebook-signin-btn"
                    onClick={() => handleOAuthSignIn('facebook')}
                    disabled={loading || isProcessing}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Continue with Facebook</span>
                  </button>
                </div>
              )}

              {/* 2. Email Sign-In */}
              {authMode === 'email_signin' && (
                <form onSubmit={handleEmailSignIn} className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="signin-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border transition focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <Mail className="w-3.5 h-3.5 absolute right-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signin-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your secure password"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border transition focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="submit-email-signin-btn"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 shadow-xs mt-2"
                    style={{
                      backgroundColor: 'var(--accent)',
                      boxShadow: '0 0 15px var(--accent-glow)'
                    }}
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Sign In to Journal</span>}
                  </button>
                </form>
              )}

              {/* 3. Email Sign-Up with Verification */}
              {authMode === 'email_signup' && (
                <form onSubmit={handleEmailSignUp} className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Full Name
                    </label>
                    <input
                      id="signup-name-input"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Taylor"
                      className="w-full text-xs px-3 py-2 rounded-xl border transition focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="signup-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full text-xs px-3 py-2 rounded-xl border transition focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <Mail className="w-3.5 h-3.5 absolute right-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password"
                        className="w-full text-xs px-3 py-2 rounded-xl border transition focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border text-[11px] flex items-center gap-2" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-color)' }}>
                    <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span style={{ color: 'var(--text-muted)' }}>
                      A secure 6-digit verification code will be dispatched to verify your email.
                    </span>
                  </div>

                  <button
                    type="submit"
                    id="submit-email-signup-btn"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 shadow-xs mt-1"
                    style={{
                      backgroundColor: 'var(--accent)',
                      boxShadow: '0 0 15px var(--accent-glow)'
                    }}
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Verify &amp; Create Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Developer Sandbox Testing Mode (Only rendered in Test Mode) */}
              {isTestActive && (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="px-2 font-mono uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                        Testing Environment Active
                      </span>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-xl border flex flex-col gap-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                        Testing Sandbox Account
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-amber-500/30 text-amber-400 bg-amber-500/10">
                        Test Mode Only
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Quick 1-click authentication for development and testing. All reflections are isolated and retained permanently.
                    </p>
                    <button
                      id="demo-signin-btn"
                      onClick={signInAsDemoUser}
                      disabled={loading || isProcessing}
                      className="w-full py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span>Enter Test Sandbox Account</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Security Certifications */}
          <div
            className="mt-5 pt-4 border-t flex items-center justify-center gap-4 text-[10px] sm:text-[11px]"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" /> 256-Bit SSL/TLS Encryption
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" /> Zero-Knowledge Privacy
            </span>
          </div>
        </div>

        {/* Feature highlight badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto w-full">
          <div
            className="p-4 sm:p-5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Conversational AI Guide
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Freely explore thoughts, receive structured summaries, brainstorm new horizons, and gain perspective.
            </p>
          </div>
          <div
            className="p-4 sm:p-5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Zero-Knowledge Vault
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Every reflection is encrypted with 256-bit SSL and strictly isolated to your authenticated account credentials.
            </p>
          </div>
          <div
            className="p-4 sm:p-5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Cognitive Follow-Ups
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Thoughtful, interactive prompts to unblock thoughts and continue conversations seamlessly.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 px-6 text-center text-xs transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)'
        }}
      >
        ReflectAI &bull; Protected by 256-Bit SSL/TLS Encryption &bull; Zero-Knowledge Journal Vault
      </footer>

      {/* OAuth Credentials Configuration & Help Modal */}
      <OAuthGuideModal
        isOpen={isGuideOpen}
        provider={guideProvider}
        onClose={() => setIsGuideOpen(false)}
        isTestMode={appEnv === 'test'}
        onContinueAsTestProfile={
          guideProvider
            ? () => {
                if (guideProvider === 'google') signInWithGoogle(true);
                else if (guideProvider === 'facebook') signInWithFacebook(true);
                else if (guideProvider === 'linkedin') signInWithLinkedIn(true);
              }
            : undefined
        }
      />
    </div>
  );
};
