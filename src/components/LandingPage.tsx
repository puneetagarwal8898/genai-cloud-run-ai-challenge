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
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ThemeSelector } from './ThemeSelector';
import { OAuthGuideModal } from './OAuthGuideModal';
import { InfoTooltip } from './InfoTooltip';

export const LandingPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithTwitter,
    signInWithLinkedIn,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signInAsDemoUser,
    loading,
    error,
    clearError,
    lastUsedProvider
  } = useAuth();

  const { appEnv, setAppEnv, isProductionLocked } = useApp();
  const isTestActive = appEnv === 'test' && !isProductionLocked;

  // Authentication UI state - automatically prioritize last used provider tab
  const [authMode, setAuthMode] = useState<'social' | 'email_signin' | 'email_signup'>(() => {
    if (lastUsedProvider === 'email') return 'email_signin';
    return 'social';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  // OAuth helper modal state
  const [guideProvider, setGuideProvider] = useState<'google' | 'linkedin' | 'twitter' | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleSwitchAuthMode = (newMode: 'social' | 'email_signin' | 'email_signup') => {
    setAuthMode(newMode);
    setPassword('');
    setLocalError(null);
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
      if (res.directSignIn) {
        setLocalNotice(res.message || 'Account created successfully! Please check your email to verify your address.');
      } else {
        setLocalNotice('Account created successfully! We sent a confirmation link from Google Firebase to your inbox.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to initialize email registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async () => {
    setLocalError(null);
    setLocalNotice(null);
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter your email address in the field above, then click Forgot Password.');
      return;
    }
    setIsProcessing(true);
    try {
      await resetPassword(email);
      setLocalNotice(`Password reset instructions dispatched to ${email}. Please check your inbox.`);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send password reset email.');
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

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin' | 'twitter') => {
    setLocalError(null);
    setIsProcessing(true);
    const isTestMode = appEnv === 'test';

    try {
      if (provider === 'google') await signInWithGoogle(isTestMode);
      else if (provider === 'twitter') await signInWithTwitter(isTestMode);
      else if (provider === 'linkedin') await signInWithLinkedIn(isTestMode);
    } catch (err: any) {
      console.warn(`${provider} login notice:`, err.message);
      // In test mode, allow developer to view setup guide; in production, show standard notice
      if (
        isTestMode &&
        (err.message && (err.message.includes('requires an OAuth 2.0') || err.message.includes('Firebase credentials missing') || err.message.includes('provider is not enabled') || err.message.includes('operation-not-allowed') || err.message.includes('not enabled yet')))
      ) {
        setGuideProvider(provider);
        setIsGuideOpen(true);
      } else {
        setLocalError(err.message || `Failed to sign in with ${provider}.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const displayError = localError || error;

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col font-sans transition-colors duration-300"
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
          <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-start justify-between backdrop-blur-xs max-w-md mx-auto w-full gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Notice</p>
                <p className="mt-0.5 text-red-200/90 leading-relaxed text-xs">{displayError}</p>

                {/* Account doesn't exist prompt with quick create account button */}
                {(displayError.toLowerCase().includes("doesn't exist") ||
                  displayError.toLowerCase().includes("create an account") ||
                  displayError.toLowerCase().includes("no account found")) && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      id="error-create-account-btn"
                      onClick={() => handleSwitchAuthMode('email_signup')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition shadow-sm cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--accent)',
                        boxShadow: '0 0 10px var(--accent-glow)'
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create an Account</span>
                    </button>
                  </div>
                )}
                {/* Action chips only shown in test mode */}
                {appEnv === 'test' && (displayError.includes('LinkedIn') || displayError.includes('Twitter') || displayError.includes('X ')) && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      id="error-continue-google-btn"
                      onClick={() => handleOAuthSignIn('google')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white transition cursor-pointer"
                    >
                      Sign In with Google Instead
                    </button>
                    {displayError.includes('LinkedIn') && (
                      <>
                        <button
                          type="button"
                          id="error-linkedin-demo-btn"
                          onClick={() => signInWithLinkedIn(true)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-[11px] font-medium text-blue-200 transition cursor-pointer"
                        >
                          Test with LinkedIn Profile
                        </button>
                        <button
                          type="button"
                          id="error-linkedin-guide-btn"
                          onClick={() => {
                            setGuideProvider('linkedin');
                            setIsGuideOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-[11px] font-medium text-indigo-200 transition cursor-pointer"
                        >
                          View Fix &amp; Guide
                        </button>
                      </>
                    )}
                    {(displayError.includes('Twitter') || displayError.includes('X ')) && (
                      <>
                        <button
                          type="button"
                          id="error-twitter-demo-btn"
                          onClick={() => signInWithTwitter(true)}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-[11px] font-medium text-sky-200 transition cursor-pointer"
                        >
                          Test with Twitter Profile
                        </button>
                        <button
                          type="button"
                          id="error-twitter-guide-btn"
                          onClick={() => {
                            setGuideProvider('twitter');
                            setIsGuideOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-[11px] font-medium text-indigo-200 transition cursor-pointer"
                        >
                          View Twitter Guide
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setLocalError(null);
                clearError();
              }}
              className="text-xs font-semibold underline text-red-300 ml-auto sm:ml-3 shrink-0 cursor-pointer"
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
            <InfoTooltip
              asSpan
              size="xs"
              text="Your journals and reflections are guarded under zero-knowledge encryption, isolated strictly to your account, and never shared or used to train public AI models."
            />
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

          {/* Standard Authentication Portal */}
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
                  onClick={() => handleSwitchAuthMode('social')}
                  className="flex-1 py-1.5 rounded-lg transition text-center cursor-pointer relative"
                  style={{
                    backgroundColor: authMode === 'social' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'social' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: authMode === 'social' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <span>OAuth Sign-In</span>
                  {authMode !== 'social' && (lastUsedProvider === 'google' || lastUsedProvider === 'linkedin' || lastUsedProvider === 'twitter') && (
                    <span
                      id="tab-social-last-used"
                      className="absolute -top-2 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-semibold tracking-wide uppercase border pointer-events-none shadow-xs"
                      style={{
                        backgroundColor: 'var(--bg-card-elevated)',
                        borderColor: 'var(--accent)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                      <span>Last used</span>
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  id="tab-email-signin"
                  onClick={() => handleSwitchAuthMode('email_signin')}
                  className="flex-1 py-1.5 rounded-lg transition text-center cursor-pointer relative"
                  style={{
                    backgroundColor: authMode === 'email_signin' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'email_signin' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: authMode === 'email_signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <span>Email Login</span>
                  {authMode !== 'email_signin' && lastUsedProvider === 'email' && (
                    <span
                      id="tab-email-last-used"
                      className="absolute -top-2 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-semibold tracking-wide uppercase border pointer-events-none shadow-xs"
                      style={{
                        backgroundColor: 'var(--bg-card-elevated)',
                        borderColor: 'var(--accent)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                      <span>Last used</span>
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  id="tab-email-signup"
                  onClick={() => handleSwitchAuthMode('email_signup')}
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

              {/* 1. OAuth Sign-In (Google, LinkedIn, Twitter) */}
              {authMode === 'social' && (
                <div className="pt-2 space-y-3 animate-in fade-in duration-150">
                  {/* Google */}
                  <div className="relative">
                    <button
                      id="google-signin-btn"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={loading || isProcessing}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: lastUsedProvider === 'google' ? 'var(--accent)' : 'var(--border-color)',
                        color: 'var(--text-primary)',
                        boxShadow: lastUsedProvider === 'google' ? '0 0 0 1px var(--accent)' : 'none'
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
                    {lastUsedProvider === 'google' && (
                      <span
                        id="last-used-chip-google"
                        className="absolute -top-2.5 right-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase border shadow-sm pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                          boxShadow: '0 2px 8px var(--accent-glow)'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                        <span>Last used</span>
                      </span>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="relative">
                    <button
                      id="linkedin-signin-btn"
                      onClick={() => handleOAuthSignIn('linkedin')}
                      disabled={loading || isProcessing}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: lastUsedProvider === 'linkedin' ? 'var(--accent)' : 'var(--border-color)',
                        color: 'var(--text-primary)',
                        boxShadow: lastUsedProvider === 'linkedin' ? '0 0 0 1px var(--accent)' : 'none'
                      }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="#0A66C2" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74V9.92H5.06v8.58h2.8z" />
                      </svg>
                      <span>Continue with LinkedIn</span>
                    </button>
                    {lastUsedProvider === 'linkedin' && (
                      <span
                        id="last-used-chip-linkedin"
                        className="absolute -top-2.5 right-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase border shadow-sm pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                          boxShadow: '0 2px 8px var(--accent-glow)'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                        <span>Last used</span>
                      </span>
                    )}
                  </div>

                  {/* Twitter / X */}
                  <div className="relative">
                    <button
                      id="twitter-signin-btn"
                      onClick={() => handleOAuthSignIn('twitter')}
                      disabled={loading || isProcessing}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: lastUsedProvider === 'twitter' ? 'var(--accent)' : 'var(--border-color)',
                        color: 'var(--text-primary)',
                        boxShadow: lastUsedProvider === 'twitter' ? '0 0 0 1px var(--accent)' : 'none'
                      }}
                    >
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Continue with X (Twitter)</span>
                    </button>
                    {lastUsedProvider === 'twitter' && (
                      <span
                        id="last-used-chip-twitter"
                        className="absolute -top-2.5 right-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase border shadow-sm pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                          boxShadow: '0 2px 8px var(--accent-glow)'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                        <span>Last used</span>
                      </span>
                    )}
                  </div>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        id="forgot-password-link"
                        onClick={handleForgotPassword}
                        className="text-[11px] hover:underline cursor-pointer transition"
                        style={{ color: 'var(--accent)' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="signin-password-input"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
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

                  <div className="relative pt-1">
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
                    {lastUsedProvider === 'email' && (
                      <span
                        id="last-used-chip-email"
                        className="absolute -top-1.5 right-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase border shadow-sm pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                          boxShadow: '0 2px 8px var(--accent-glow)'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                        <span>Last used</span>
                      </span>
                    )}
                  </div>
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
                        autoComplete="new-password"
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
                      End-to-end encrypted session. Instant account setup with email verification.
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
                        <span>Create Sanctuary Account</span>
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
                else if (guideProvider === 'twitter') signInWithTwitter(true);
                else if (guideProvider === 'linkedin') signInWithLinkedIn(true);
              }
            : undefined
        }
      />
    </div>
  );
};
