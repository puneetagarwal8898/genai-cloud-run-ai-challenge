import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  userEmail?: string;
  onVerify: (code: string) => Promise<boolean> | boolean;
  onCancel: () => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  userEmail,
  onVerify,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(null);
      setIsVerifying(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\s+/g, '').trim();
    if (cleanCode.length !== 6) {
      setError('Please enter all 6 digits shown in your authenticator app.');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const success = await onVerify(cleanCode);
      if (!success) {
        setError('Invalid verification code. Please check your authenticator app and try again.');
        setIsVerifying(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  return (
    <AnimatePresence>
      <div
        id="two-factor-auth-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <motion.div
          id="two-factor-auth-modal"
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-2xl border shadow-2xl p-6 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Top Amber Brand Glow */}
          <div
            className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
            style={{ backgroundColor: 'var(--accent)' }}
          />

          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                borderColor: 'rgba(217, 119, 6, 0.3)',
                color: '#d97706'
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight font-serif">
                Two-Factor Authentication
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Shielding your private reflection journal
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, Apple Passwords, or Microsoft Authenticator) for{' '}
            <strong className="font-semibold text-slate-800 dark:text-slate-200">{userEmail || 'your account'}</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="totp-code-input"
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                6-Digit Security Code
              </label>

              <div className="relative">
                <input
                  id="totp-code-input"
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={handleInputChange}
                  disabled={isVerifying}
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-3 px-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: error ? '#ef4444' : 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Key className="absolute right-3.5 top-3.5 w-4 h-4 opacity-30 pointer-events-none" />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-2 text-xs text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              <button
                type="button"
                onClick={onCancel}
                disabled={isVerifying}
                className="order-2 sm:order-1 px-3.5 py-2 text-xs font-medium rounded-xl border transition cursor-pointer hover:opacity-85 flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>

              <button
                id="verify-totp-btn"
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className="order-1 sm:order-2 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 12px var(--accent-glow)'
                }}
              >
                {isVerifying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Unlock Sanctuary
                  </>
                )}
              </button>
            </div>
          </form>

          <div
            className="mt-5 pt-3.5 border-t text-[11px] flex items-center gap-1.5"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Time-based One-Time Password (RFC 6238 Standard)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
