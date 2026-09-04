import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Shield, Lock, Key, AlertCircle, CheckCircle2, X, FileText, Eye, EyeOff } from 'lucide-react';
import { JournalInteraction, UserProfile } from '../types';
import { exportReflectionsToPdf } from '../utils/pdfExport';
import { verifyTotpToken } from '../utils/totp';
import { recordExportDownload } from '../services/exportLogService';
import { ExportDownloadHistory } from './ExportDownloadHistory';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: JournalInteraction[];
  userProfile: UserProfile | null;
  onOpenTwoFactorSetup?: () => void;
  onExportSuccess?: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  interactions,
  userProfile,
  onOpenTwoFactorSetup,
  onExportSuccess
}) => {
  const [accountPassword, setAccountPassword] = useState('');
  const [filePassword, setFilePassword] = useState('');
  const [showFilePassword, setShowFilePassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const has2FA = Boolean(userProfile?.twoFactorEnabled && userProfile?.twoFactorSecret);
  const isEmailAuth = userProfile?.authProvider === 'email';

  useEffect(() => {
    if (isOpen) {
      setAccountPassword('');
      setFilePassword('');
      setShowFilePassword(false);
      setTotpCode('');
      setError(null);
      setSuccess(false);
      setIsExporting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. PDF File Password validation
    const cleanFilePassword = filePassword.trim();
    if (!cleanFilePassword) {
      setError('Please set a password to encrypt and secure your exported PDF document.');
      return;
    }
    if (cleanFilePassword.length < 3) {
      setError('PDF document password should be at least 3 characters long.');
      return;
    }

    // 2. Account Password verification for email accounts
    if (isEmailAuth && !accountPassword.trim()) {
      setError('Please enter your account password to authorize the export.');
      return;
    }

    // Check stored password in local accounts if available
    if (isEmailAuth && accountPassword.trim()) {
      const accountsRaw = localStorage.getItem('reflectai_registered_accounts');
      if (accountsRaw) {
        try {
          const accounts = JSON.parse(accountsRaw);
          const email = (userProfile?.email || '').toLowerCase();
          const acc = accounts[email];
          if (acc?.passwordHash) {
            let hash = 0;
            for (let i = 0; i < accountPassword.length; i++) {
              const char = accountPassword.charCodeAt(i);
              hash = (hash << 5) - hash + char;
              hash |= 0;
            }
            const enteredHash = 'phash_' + Math.abs(hash).toString(36) + '_' + accountPassword.length;
            if (acc.passwordHash !== enteredHash) {
              setError('Incorrect account password. Please check your credentials.');
              return;
            }
          }
        } catch (e) {}
      }
    }

    // 3. 2FA verification if active
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
      if (!accountPassword.trim()) {
        setError('Please enter your authorization password to confirm identity.');
        return;
      }
    }

    setIsExporting(true);

    // Yield control briefly to ensure the DOM paints the loading state and spinner
    setTimeout(async () => {
      try {
        // Generate and download password-encrypted PDF
        const result = exportReflectionsToPdf(interactions, userProfile, cleanFilePassword);

        // Record download history (fast local save + non-blocking cloud write)
        if (userProfile?.uid) {
          await recordExportDownload(userProfile.uid, {
            fileName: result.fileName,
            filePassword: cleanFilePassword,
            downloadedAt: result.downloadedAt,
            entriesCount: result.entriesCount,
            fileSizeFormatted: result.fileSizeFormatted,
            securityMethod: result.securityMethod
          });
        }

        setRefreshHistory((prev) => prev + 1);
        setSuccess(true);
        setIsExporting(false);

        // Brief delay for visual confirmation before seamlessly returning to Settings
        setTimeout(() => {
          onExportSuccess?.();
          onClose();
          setFilePassword('');
          setAccountPassword('');
          setTotpCode('');
          setSuccess(false);
        }, 350);
      } catch (err: any) {
        console.error('PDF export error:', err);
        setError('Failed to generate encrypted PDF. Please try again.');
        setIsExporting(false);
      }
    }, 60);
  };

  return (
    <AnimatePresence>
      <div
        id="export-pdf-backdrop"
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
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
          className="w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b mb-3 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
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
                  Export Reflections (Password-Secured PDF)
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Download and encrypt your private reflections locally
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

          <div className="overflow-y-auto flex-1 pr-1 space-y-4">
            <div
              className="p-3 rounded-xl border text-xs flex items-center gap-2.5"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              <FileText className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Exporting <strong>{interactions.length} {interactions.length === 1 ? 'reflection' : 'reflections'}</strong> into an encrypted PDF file.
              </span>
            </div>

            <form onSubmit={handleExport} className="space-y-4">
              {/* PDF Document Password (File Encryption) */}
              <div
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.05)',
                  borderColor: 'rgba(217, 119, 6, 0.25)'
                }}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="export-file-password-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400"
                  >
                    1. Set PDF Document Password
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Required for File Encryption
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Choose a password to secure your exported PDF. Any PDF reader (Acrobat, Apple Preview, Chrome, mobile) will require this password to unlock and read your file.
                </p>
                <div className="relative">
                  <input
                    id="export-file-password-input"
                    type={showFilePassword ? 'text' : 'password'}
                    placeholder="Set document unlock password"
                    value={filePassword}
                    onChange={(e) => {
                      setFilePassword(e.target.value);
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
                  <button
                    type="button"
                    onClick={() => setShowFilePassword(!showFilePassword)}
                    className="absolute right-3 top-2.5 p-1 rounded hover:opacity-80 transition cursor-pointer"
                    title={showFilePassword ? 'Mask password' : 'Show password'}
                    aria-label={showFilePassword ? 'Mask password' : 'Show password'}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showFilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Account Password verification */}
              <div>
                <label
                  htmlFor="export-account-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  2. Account Verification Password
                </label>
                <div className="relative">
                  <input
                    id="export-account-password-input"
                    type="password"
                    placeholder="Enter your account login password"
                    value={accountPassword}
                    onChange={(e) => {
                      setAccountPassword(e.target.value);
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
                      3. 6-Digit Authenticator 2FA Code
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
                    2FA is not yet active on your account. For maximum security, you can enable 2FA in Settings.
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
                  <span>Credentials verified & PDF encrypted! Downloading file...</span>
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
                  disabled={isExporting || !filePassword.trim() || (has2FA && totpCode.length !== 6)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent-glow)'
                  }}
                >
                  {isExporting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Encrypting & Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Verify, Encrypt & Download PDF
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Expandable record of file downloads */}
            <ExportDownloadHistory userId={userProfile?.uid} refreshTrigger={refreshHistory} defaultExpanded={false} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
