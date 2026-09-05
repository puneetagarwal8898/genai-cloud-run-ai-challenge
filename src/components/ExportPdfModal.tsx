import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Shield, Lock, Key, AlertCircle, CheckCircle2, X, FileText } from 'lucide-react';
import { JournalInteraction, UserProfile } from '../types';
import { exportReflectionsToPdf } from '../utils/pdfExport';
import { verifyTotpToken } from '../utils/totp';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: JournalInteraction[];
  userProfile: UserProfile | null;
  onOpenTwoFactorSetup?: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  interactions,
  userProfile,
  onOpenTwoFactorSetup
}) => {
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const has2FA = Boolean(userProfile?.twoFactorEnabled && userProfile?.twoFactorSecret);
  const isEmailAuth = userProfile?.authProvider === 'email';

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setTotpCode('');
      setError(null);
      setSuccess(false);
      setIsExporting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Password verification for email accounts or safety password
    if (isEmailAuth && !password.trim()) {
      setError('Please enter your account password to authorize the export.');
      return;
    }

    // Check stored password in local accounts if available
    if (isEmailAuth && password.trim()) {
      const accountsRaw = localStorage.getItem('reflectai_registered_accounts');
      if (accountsRaw) {
        try {
          const accounts = JSON.parse(accountsRaw);
          const email = (userProfile?.email || '').toLowerCase();
          const acc = accounts[email];
          if (acc?.passwordHash) {
            // Check hash
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
              const char = password.charCodeAt(i);
              hash = (hash << 5) - hash + char;
              hash |= 0;
            }
            const enteredHash = 'phash_' + Math.abs(hash).toString(36) + '_' + password.length;
            if (acc.passwordHash !== enteredHash) {
              setError('Incorrect account password. Please check your credentials.');
              return;
            }
          }
        } catch (e) {}
      }
    }

    // 2. 2FA verification
    if (has2FA) {
      const cleanCode = totpCode.replace(/\s+/g, '').trim();
      if (cleanCode.length !== 6) {
        setError('Please enter the 6-digit code from your authenticator app.');
        return;
      }

      const isValidTotp = verifyTotpToken(userProfile!.twoFactorSecret!, cleanCode);
      if (!isValidTotp) {
        setError('Invalid 2FA authenticator code. Please check your authenticator app and try again.');
        return;
      }
    } else {
      // If user has not enabled 2FA, require password verification confirmation
      if (!password.trim()) {
        setError('Please enter your authorization password to confirm identity.');
        return;
      }
    }

    setIsExporting(true);

    try {
      // Generate and download PDF
      exportReflectionsToPdf(interactions, userProfile);
      setSuccess(true);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setError('Failed to generate PDF. Please try again.');
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="export-pdf-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isExporting) onClose();
        }}
      >
        <motion.div
          id="export-pdf-modal"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden my-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b mb-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  borderColor: 'rgba(217, 119, 6, 0.3)',
                  color: '#d97706'
                }}
              >
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight font-serif">
                  Export Reflections (PDF)
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Download your private reflections locally
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card-elevated)', color: 'var(--text-secondary)' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="p-3 rounded-xl border mb-4 text-xs flex items-center gap-2.5"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Exporting <strong>{interactions.length} {interactions.length === 1 ? 'reflection' : 'reflections'}</strong> in high-resolution PDF format.
            </span>
          </div>

          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            To ensure zero unauthorized downloads of your private sanctuary reflections, please authenticate below with your credentials:
          </p>

          <form onSubmit={handleExport} className="space-y-4">
            {/* Password input */}
            <div>
              <label
                htmlFor="export-password-input"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Account Password
              </label>
              <div className="relative">
                <input
                  id="export-password-input"
                  type="password"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isExporting}
                  className="w-full text-xs py-2.5 px-3.5 pr-10 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Lock className="absolute right-3.5 top-3 w-4 h-4 opacity-40 pointer-events-none" />
              </div>
            </div>

            {/* 2FA input */}
            {has2FA ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="export-totp-input"
                    className="block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    6-Digit Authenticator 2FA Code
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Required
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="export-totp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => {
                      setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (error) setError(null);
                    }}
                    disabled={isExporting}
                    className="w-full text-center text-xl font-mono font-bold tracking-[0.3em] py-2.5 px-3.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Key className="absolute right-3.5 top-3 w-4 h-4 opacity-40 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div
                className="p-3 rounded-xl border text-xs space-y-1.5"
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.08)',
                  borderColor: 'rgba(217, 119, 6, 0.25)',
                  color: 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Two-Factor Authentication Recommended</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  2FA is not yet active on your account. For maximum protection against unauthorized exports, we recommend setting up 2FA in Settings.
                </p>
                {onOpenTwoFactorSetup && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTwoFactorSetup();
                    }}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer pt-0.5 inline-block"
                  >
                    + Set Up 2FA Now
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Credentials verified! Downloading PDF...</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-medium rounded-xl border transition cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>

              <button
                id="confirm-export-pdf-btn"
                type="submit"
                disabled={isExporting || (has2FA && totpCode.length !== 6)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 10px var(--accent-glow)'
                }}
              >
                {isExporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Verify & Download PDF
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
