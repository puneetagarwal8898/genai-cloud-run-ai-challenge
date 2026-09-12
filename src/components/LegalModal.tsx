import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
  onBack?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  // Sync activeTab whenever initialTab changes or modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      id="legal-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        id="legal-modal-content"
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg p-0.5 border" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'privacy' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: activeTab === 'privacy' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'privacy' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'terms' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: activeTab === 'terms' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'terms' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBack ? (
              <button
                id="legal-modal-back-btn"
                type="button"
                onClick={onBack}
                aria-label="Back to Settings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                aria-label="Close legal window"
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)'
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs sm:text-sm leading-relaxed">
          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    Your Words Are Yours Alone
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-xs">
                    We believe personal journals are sacred. ReflectAI is built with a zero-compromise privacy approach.
                    We never sell, rent, or trade your journal entries, mood records, or reflection history to advertisers or third parties.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  1. Information We Store
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  When you use ReflectAI, we securely save:
                </p>
                <ul className="list-disc pl-5 space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <li>Your journal entries, prompts, and reflections.</li>
                  <li>Your chosen display name, avatar icon, and visual preferences (theme colors and audio playback speeds).</li>
                  <li>Optional tags you choose to add, such as peaceful sanctuary locations or time capsule unlock dates.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  2. How Your Entries Are Protected
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Your reflections are saved to your personal account with protected access controls.
                  Only you can read your thoughts when signed into your account.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  3. Your Right to Export and Delete
                </h4>
                <div
                  className="p-3.5 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Permanent Data Deletion Guarantee
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    You have the right to permanently wipe your account and all associated journals at any time from your Account Settings.
                    When requested, your entries and profile are immediately and irreversibly removed from all storage.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    Terms of Meaningful Use
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-xs">
                    ReflectAI is designed to be a gentle companion for mindfulness, self-expression, and personal clarity.
                    By using this service, you agree to these fair and simple terms.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  1. Wellness & Mindfulness Disclaimer
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  ReflectAI offers supportive guided prompts and conversational reflections for general personal mindfulness and self-growth.
                  It is not a clinical medical or psychological diagnosis service and does not replace professional therapy, medical counsel, or crisis support.
                  If you are experiencing a mental health emergency, please seek assistance from qualified healthcare professionals or emergency services.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  2. Account Responsibility
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  You are responsible for safeguarding your login credentials. If you suspect any unauthorized access,
                  please update your credentials or notify support.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  3. Service Availability
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  We strive to ensure continuous, reliable availability. Because we also store your journal entries on your local browser,
                  you can always review your recent thoughts even during brief connection drops.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3.5 border-t flex items-center justify-between shrink-0 text-xs"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            Last updated: September 2026 &bull; Clear, Honest Privacy
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
