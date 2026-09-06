import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, QrCode, Key, Check, Copy, AlertCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { generateTotpSecret, generateTotpUri, generateQrCodeDataUrl, verifyTotpToken } from '../utils/totp';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  onSuccess: (secret: string) => Promise<void> | void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  userEmail,
  onClose,
  onSuccess
}) => {
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'scan' | 'verify'>('scan');

  useEffect(() => {
    if (isOpen) {
      const newSecret = generateTotpSecret();
      setSecret(newSecret);
      setVerificationCode('');
      setError(null);
      setCopiedKey(false);
      setStep('scan');

      const uri = generateTotpUri(userEmail, newSecret);
      generateQrCodeDataUrl(uri)
        .then((url) => setQrCodeUrl(url))
        .catch((err) => {
          console.error('Failed to generate QR code:', err);
          setError('Failed to generate QR code. You can still use the manual secret key below.');
        });
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = verificationCode.replace(/\s+/g, '').trim();
    if (clean.length !== 6) {
      setError('Please enter the 6-digit code shown in your authenticator app.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const isValid = verifyTotpToken(secret, clean);
    if (!isValid) {
      setError('Invalid authenticator code. Please confirm your device clock is accurate and try again.');
      setIsVerifying(false);
      return;
    }

    try {
      // 3.5-second safety timeout so activation can never hang the UI
      const activationPromise = Promise.resolve(onSuccess(secret));
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Activation took longer than expected. Please check your network and try again.')), 3500)
      );
      await Promise.race([activationPromise, timeoutPromise]);
      setIsVerifying(false);
      onClose();
    } catch (err: any) {
      console.error('2FA activation error:', err);
      setError(err?.message || 'Failed to activate Two-Factor Authentication.');
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="two-factor-setup-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="two-factor-setup-modal"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden my-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
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
                  Set Up Two-Factor Authentication
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Recommended security to protect your sanctuary reflections
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card-elevated)', color: 'var(--text-secondary)' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper info */}
          <div className="flex items-center gap-2 mb-4 text-xs">
            <span
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                step === 'scan' ? 'text-white' : 'opacity-60'
              }`}
              style={{
                backgroundColor: step === 'scan' ? 'var(--accent)' : 'var(--bg-card-elevated)',
                color: step === 'scan' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              Step 1: Scan QR Code
            </span>
            <ArrowRight className="w-3.5 h-3.5 opacity-40" />
            <span
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                step === 'verify' ? 'text-white' : 'opacity-60'
              }`}
              style={{
                backgroundColor: step === 'verify' ? 'var(--accent)' : 'var(--bg-card-elevated)',
                color: step === 'verify' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              Step 2: Enter 6-Digit Code
            </span>
          </div>

          {/* Step 1: Scan QR Code */}
          {step === 'scan' && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Open your authenticator app (such as <strong>Google Authenticator</strong>, <strong>Apple Passwords</strong>, <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong>) and scan the QR code below:
              </p>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white shadow-inner">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Scan using your mobile phone camera or authenticator
                </p>
              </div>

              {/* Manual Key Option */}
              <div
                className="p-3 rounded-xl border text-xs space-y-1.5"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Can't scan the QR code?
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Manual Key
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs font-semibold select-all break-all px-2 py-1.5 rounded-lg border bg-stone-500/5 text-amber-600 dark:text-amber-400">
                  {secret}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent-glow)'
                  }}
                >
                  <span>Next: Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Verify Code */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Enter the 6-digit code currently shown in your authenticator app for <strong>ReflectAI ({userEmail})</strong> to confirm setup:
              </p>

              <div>
                <label
                  htmlFor="setup-totp-input"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="setup-totp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  autoFocus
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (error) setError(null);
                  }}
                  disabled={isVerifying}
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-3 px-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: error ? '#ef4444' : 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('scan')}
                  disabled={isVerifying}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border transition cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Back to QR Code
                </button>

                <button
                  id="activate-totp-btn"
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent-glow)'
                  }}
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Activate Authenticator
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
