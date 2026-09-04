import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Volume2,
  Shield,
  Trash2,
  AlertTriangle,
  Lock,
  Check,
  Sparkles,
  Sliders,
  Calendar,
  Key,
  Loader2,
  QrCode,
  Download,
  FileText,
  CheckCircle2,
  Play,
  Square,
  Radio
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  CURATED_VOICES,
  resolveSpeechVoice,
  previewVoice,
  stopVoicePreview,
  play432HzPreview,
  stop432HzPreview,
  is432HzPreviewPlaying,
  VoiceProfile
} from '../utils/voiceUtils';
import { verifyTotpToken } from '../utils/totp';
import { ExportDownloadHistory } from './ExportDownloadHistory';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'preferences' | 'security';
  onTabChange?: (tab: 'profile' | 'preferences' | 'security') => void;
  onOpenAbout?: () => void;
  onOpenLegal?: () => void;
  onOpenTwoFactorSetup?: () => void;
  onOpenExportPdf?: () => void;
}

const MINDFUL_AVATARS = [
  { id: 'lotus', name: 'Lotus Awakening', url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=150&auto=format&fit=crop&q=80' },
  { id: 'bamboo', name: 'Bamboo Serenity', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=80' },
  { id: 'mist', name: 'Morning Mist', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=150&auto=format&fit=crop&q=80' },
  { id: 'pebble', name: 'Zen Pebble', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=150&auto=format&fit=crop&q=80' },
  { id: 'forest', name: 'Earthy Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=150&auto=format&fit=crop&q=80' },
  { id: 'water', name: 'Flowing Stream', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=150&auto=format&fit=crop&q=80' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
  onTabChange,
  onOpenAbout,
  onOpenLegal,
  onOpenTwoFactorSetup,
  onOpenExportPdf
}) => {
  const {
    user,
    userProfile,
    updateUserProfileData,
    deleteUserAccount,
    resetPassword,
    disableTwoFactorAuth
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>(defaultTab);

  const switchTab = (tab: 'profile' | 'preferences' | 'security') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Profile fields
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || userProfile?.avatarUrl || user?.photoURL || MINDFUL_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Preference fields
  const [ambientSound, setAmbientSound] = useState(userProfile?.preferences?.ambientSound ?? userProfile?.preferences?.ambientSoundEnabled ?? true);
  const [isPlaying432Hz, setIsPlaying432Hz] = useState(false);
  const [voiceRate, setVoiceRate] = useState(userProfile?.preferences?.voiceRate ?? userProfile?.preferences?.voiceSpeed ?? 0.88);
  const [voicePitch, setVoicePitch] = useState(userProfile?.preferences?.voicePitch || 1.0);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    const rawId = userProfile?.preferences?.selectedVoiceId || localStorage.getItem('reflectai_selected_voice_id');
    if (rawId === 'female-aria' || rawId === 'aria') return 'female-celeste';
    return rawId || CURATED_VOICES[0].id;
  });
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const debounceSliderTimerRef = useRef<any>(null);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 2FA state
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [twoFactorNotice, setTwoFactorNotice] = useState<string | null>(null);
  const [twoFactorChallengeAction, setTwoFactorChallengeAction] = useState<'reconfigure' | 'disable' | null>(null);
  const [challengeTotpCode, setChallengeTotpCode] = useState('');
  const [challengeError, setChallengeError] = useState<string | null>(null);

  // Delete flow
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset password state
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Reset state whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setDisplayName(userProfile?.displayName || user?.displayName || '');
      setSelectedAvatar(userProfile?.photoURL || userProfile?.avatarUrl || user?.photoURL || MINDFUL_AVATARS[0].url);
      setCustomAvatarUrl('');
      const rawVoice = userProfile?.preferences?.selectedVoiceId || localStorage.getItem('reflectai_selected_voice_id');
      setSelectedVoiceId(rawVoice === 'female-aria' || rawVoice === 'aria' ? 'female-celeste' : (rawVoice || CURATED_VOICES[0].id));
      setPreviewingVoiceId(null);
      setIsPlaying432Hz(false);
      setTwoFactorNotice(null);
      setSaveSuccess(false);
      setSaveError(null);
      setShowDeleteConfirm(false);
      setDeleteInput('');
      setDeletePassword('');
      setDeleteError(null);
    }
  }, [isOpen, defaultTab, userProfile, user]);

  // Handle Escape key & cleanup
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        stopVoicePreview();
        stop432HzPreview();
        setPreviewingVoiceId(null);
        setIsPlaying432Hz(false);
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopVoicePreview();
      stop432HzPreview();
    };
  }, [isOpen, onClose, isDeleting]);

  // Stop sound previews when switching tabs
  React.useEffect(() => {
    stopVoicePreview();
    stop432HzPreview();
    setPreviewingVoiceId(null);
    setIsPlaying432Hz(false);
  }, [activeTab]);

  if (!isOpen) return null;

  const handleToggle432HzPreview = () => {
    if (isPlaying432Hz) {
      stop432HzPreview();
      setIsPlaying432Hz(false);
    } else {
      stopVoicePreview();
      setPreviewingVoiceId(null);
      setIsPlaying432Hz(true);
      play432HzPreview(() => {
        setIsPlaying432Hz(false);
      });
    }
  };

  const handlePreviewVoice = (voiceProfile: VoiceProfile, overrideRate?: number, overridePitch?: number) => {
    if (isPlaying432Hz) {
      stop432HzPreview();
      setIsPlaying432Hz(false);
    }

    if (previewingVoiceId === voiceProfile.id) {
      stopVoicePreview();
      setPreviewingVoiceId(null);
      return;
    }
    stopVoicePreview();
    setPreviewingVoiceId(voiceProfile.id);
    const resolved = resolveSpeechVoice(voiceProfile.id, voiceProfile.gender);
    previewVoice(
      resolved,
      overrideRate !== undefined ? overrideRate : (voiceRate || voiceProfile.defaultRate),
      overridePitch !== undefined ? overridePitch : (voicePitch || voiceProfile.defaultPitch),
      () => {
        setPreviewingVoiceId(voiceProfile.id);
      },
      () => {
        setPreviewingVoiceId(null);
      },
      voiceProfile.sampleText
    );
  };

  // Live audition when adjusting sliders
  const handleRateChange = (newRate: number) => {
    setVoiceRate(newRate);
    if (previewingVoiceId) {
      if (debounceSliderTimerRef.current) clearTimeout(debounceSliderTimerRef.current);
      debounceSliderTimerRef.current = setTimeout(() => {
        const activeVoice = CURATED_VOICES.find(v => v.id === previewingVoiceId) || CURATED_VOICES.find(v => v.id === selectedVoiceId) || CURATED_VOICES[0];
        handlePreviewVoice(activeVoice, newRate, voicePitch);
      }, 160);
    }
  };

  const handlePitchChange = (newPitch: number) => {
    setVoicePitch(newPitch);
    if (previewingVoiceId) {
      if (debounceSliderTimerRef.current) clearTimeout(debounceSliderTimerRef.current);
      debounceSliderTimerRef.current = setTimeout(() => {
        const activeVoice = CURATED_VOICES.find(v => v.id === previewingVoiceId) || CURATED_VOICES.find(v => v.id === selectedVoiceId) || CURATED_VOICES[0];
        handlePreviewVoice(activeVoice, voiceRate, newPitch);
      }, 160);
    }
  };

  const handleAuditionSelectedVoice = () => {
    const selectedProfile = CURATED_VOICES.find(v => v.id === selectedVoiceId) || CURATED_VOICES[0];
    handlePreviewVoice(selectedProfile, voiceRate, voicePitch);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const matchedVoice = CURATED_VOICES.find(v => v.id === selectedVoiceId) || CURATED_VOICES[0];
      await updateUserProfileData({
        displayName: displayName.trim() || 'Mindful Soul',
        photoURL: customAvatarUrl.trim() || selectedAvatar,
        preferences: {
          ambientSound,
          ambientSoundEnabled: ambientSound,
          voiceRate,
          voiceSpeed: voiceRate,
          voicePitch: voicePitch,
          selectedVoiceId,
          selectedVoiceURI: matchedVoice.keywords[0],
          selectedVoiceGender: matchedVoice.gender
        }
      });
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update preferences. Please try again.');
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const matchedVoice = CURATED_VOICES.find(v => v.id === selectedVoiceId) || CURATED_VOICES[0];
      await updateUserProfileData({
        preferences: {
          ambientSound,
          ambientSoundEnabled: ambientSound,
          voiceRate,
          voiceSpeed: voiceRate,
          voicePitch: voicePitch,
          selectedVoiceId,
          selectedVoiceURI: matchedVoice.keywords[0],
          selectedVoiceGender: matchedVoice.gender
        }
      });
      localStorage.setItem('reflectai_selected_voice_id', selectedVoiceId);
      localStorage.setItem('reflectai_selected_voice_uri', matchedVoice.keywords[0]);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update voice preferences.');
      setIsSaving(false);
    }
  };

  const handleInitiate2FAAction = (action: 'reconfigure' | 'disable') => {
    if (userProfile?.twoFactorEnabled && userProfile?.twoFactorSecret) {
      setTwoFactorChallengeAction(action);
      setChallengeTotpCode('');
      setChallengeError(null);
    } else {
      if (action === 'reconfigure') {
        onClose();
        onOpenTwoFactorSetup?.();
      }
    }
  };

  const handleConfirm2FAChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setChallengeError(null);
    const cleanCode = challengeTotpCode.replace(/\s+/g, '').trim();
    if (cleanCode.length !== 6) {
      setChallengeError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    if (!userProfile?.twoFactorSecret) {
      setChallengeError('No 2FA secret found on this account.');
      return;
    }
    const isValid = verifyTotpToken(userProfile.twoFactorSecret, cleanCode);
    if (!isValid) {
      setChallengeError('Invalid 2FA authenticator code. Please check your authenticator app and try again.');
      return;
    }

    const action = twoFactorChallengeAction;
    setTwoFactorChallengeAction(null);
    setChallengeTotpCode('');

    if (action === 'reconfigure') {
      onClose();
      onOpenTwoFactorSetup?.();
    } else if (action === 'disable') {
      setIsDisabling2FA(true);
      setTwoFactorNotice(null);
      try {
        await disableTwoFactorAuth();
        setTwoFactorNotice('Two-factor authentication has been verified and disabled successfully.');
      } catch (err: any) {
        setTwoFactorNotice(err?.message || 'Failed to disable two-factor authentication.');
      } finally {
        setIsDisabling2FA(false);
      }
    }
  };

  const handleSendPasswordReset = async () => {
    if (!userProfile?.email) return;
    setResetLoading(true);
    try {
      await resetPassword(userProfile.email);
      setResetSent(true);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to send password reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    const trimmedConfirm = deleteInput.trim();
    if (trimmedConfirm !== 'DELETE') {
      setDeleteError("Please type DELETE (in capital letters) in the confirmation box.");
      return;
    }

    if (userProfile?.authProvider === 'email' && !deletePassword.trim()) {
      setDeleteError("Please enter your account password to confirm account deletion.");
      return;
    }

    setIsDeleting(true);

    try {
      await deleteUserAccount(deletePassword.trim() || undefined);
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to complete account deletion.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        id="settings-modal-content"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)'
              }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight font-serif">
                Settings & Preferences
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Customize your peaceful journaling experience
              </p>
            </div>
          </div>
          <button
            id="settings-modal-close-button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          className="flex border-b px-5 pt-2 shrink-0 gap-2"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <button
            id="settings-tab-profile"
            onClick={() => switchTab('profile')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile' ? 'font-semibold' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'profile' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <User className="w-4 h-4" />
            Profile & Name
          </button>

          <button
            id="settings-tab-preferences"
            onClick={() => switchTab('preferences')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'preferences' ? 'font-semibold' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'preferences' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'preferences' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <Volume2 className="w-4 h-4" />
            Voice & Audio
          </button>

          <button
            id="settings-tab-security"
            onClick={() => switchTab('security')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'security' ? 'font-semibold' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'security' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'security' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <Shield className="w-4 h-4" />
            Privacy & Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          {saveSuccess && (
            <div
              className="p-3 rounded-xl border flex items-center gap-2 text-xs"
              style={{
                backgroundColor: 'var(--accent-light)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)'
              }}
            >
              <Check className="w-4 h-4 shrink-0" />
              Settings saved successfully.
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Your Avatar
                </label>

                <div className="flex items-center gap-4 mb-3">
                  <img
                    src={selectedAvatar}
                    alt="Active Avatar"
                    className="w-14 h-14 rounded-full object-cover shadow-sm border-2"
                    style={{ borderColor: 'var(--accent)' }}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      Choose an avatar or paste your own image link
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Shows next to your thoughts and in your sanctuary header
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {MINDFUL_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(avatar.url);
                        setCustomAvatarUrl('');
                      }}
                      className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        selectedAvatar === avatar.url ? 'scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: selectedAvatar === avatar.url ? 'var(--accent)' : 'var(--border-color)'
                      }}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white py-0.5 text-center truncate px-1">
                        {avatar.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <input
                    type="url"
                    placeholder="Or paste an image link (https://...)"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value.trim()) setSelectedAvatar(e.target.value.trim());
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Display Name Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Your Name
                </label>
                <input
                  id="settings-display-name-input"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your preferred name"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>

              {/* Email Field (Locked by Design) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <span
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <Lock className="w-3 h-3" />
                    Locked for Security
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    value={userProfile?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm cursor-not-allowed select-none opacity-80"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  />
                  <Lock className="absolute right-3.5 top-3 w-4 h-4 opacity-50 pointer-events-none" />
                </div>
                <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Your email address is your primary account ID. It is locked to keep your account and private journals secure.
                </p>
              </div>

              {/* Account Details */}
              <div
                className="p-3.5 rounded-xl border text-xs space-y-1.5"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    Sign-In Method
                  </span>
                  <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                    {userProfile?.authProvider || 'Email / Account'}
                  </span>
                </div>
                <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    Account Created
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Active Member'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg opacity-80 hover:opacity-100 transition cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  id="settings-save-button"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Voice & Audio Reading Preferences
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Fine-tune your reading cadence, vocal pitch, and soothing soundscape
                </p>
              </div>

              {/* Ambient Sound Drone Toggle with Preview */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Calming 432Hz Ambient Sound
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Plays a soft, restful background tone while listening to reflections
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAmbientSound(!ambientSound)}
                    className="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                    style={{
                      backgroundColor: ambientSound ? 'var(--accent)' : 'var(--border-color)'
                    }}
                    aria-label="Toggle 432Hz ambient sound"
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        ambientSound ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 432Hz Sound Preview Control */}
                <div
                  className="pt-2 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    Audition the tranquil 432Hz tuning tone:
                  </span>
                  <button
                    type="button"
                    id="preview-432hz-ambient-btn"
                    onClick={handleToggle432HzPreview}
                    className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition cursor-pointer hover:opacity-85 shrink-0"
                    style={{
                      backgroundColor: isPlaying432Hz ? 'var(--accent-light)' : 'var(--bg-card)',
                      borderColor: isPlaying432Hz ? 'var(--accent)' : 'var(--border-color)',
                      color: isPlaying432Hz ? 'var(--accent)' : 'var(--text-primary)'
                    }}
                  >
                    {isPlaying432Hz ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span className="text-xs font-semibold">Stop 432Hz Drone</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span className="text-xs font-medium">Listen to 432Hz Preview</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SLIDERS SECTION (Placed ABOVE Voice Samples) */}
              <div
                className="p-4 rounded-xl border space-y-4"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Reading Speed & Voice Tone
                    </span>
                  </div>
                  <button
                    type="button"
                    id="audition-current-voice-settings-btn"
                    onClick={handleAuditionSelectedVoice}
                    className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition cursor-pointer hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    title="Audition chosen voice with current speed and pitch"
                  >
                    {previewingVoiceId === selectedVoiceId ? (
                      <>
                        <Square className="w-3 h-3 fill-current" style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Stop Sample</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" style={{ color: 'var(--accent)' }} />
                        <span className="text-xs font-medium">Test Voice Settings</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Voice Speed Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    <span>Reading Speed: <strong className="font-mono">{voiceRate.toFixed(2)}x</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {voiceRate < 0.85 ? 'Meditative & Slow' : voiceRate > 1.05 ? 'Brisk' : 'Gentle & Natural'}
                    </span>
                  </div>
                  <input
                    type="range"
                    id="voice-speed-slider"
                    min="0.75"
                    max="1.25"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>0.75x (Gentle)</span>
                    <span>1.0x (Standard)</span>
                    <span>1.25x (Brisk)</span>
                  </div>
                </div>

                {/* Voice Pitch Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    <span>Voice Tone (Pitch): <strong className="font-mono">{voicePitch.toFixed(2)}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {voicePitch < 0.9 ? 'Warm & Deep' : voicePitch > 1.1 ? 'Airy & Light' : 'Balanced & Soothing'}
                    </span>
                  </div>
                  <input
                    type="range"
                    id="voice-pitch-slider"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>0.8 (Warm/Deeper)</span>
                    <span>1.0 (Neutral)</span>
                    <span>1.2 (Airy/Higher)</span>
                  </div>
                </div>
              </div>

              {/* Narration Voice Selection (Cards now below sliders) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Mindful Voice Guide
                  </label>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Choose your companion voice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CURATED_VOICES.map((voice) => {
                    const isSelected = selectedVoiceId === voice.id;
                    const isPlaying = previewingVoiceId === voice.id;

                    return (
                      <div
                        key={voice.id}
                        id={`voice-option-${voice.id}`}
                        onClick={() => {
                          setSelectedVoiceId(voice.id);
                          setVoiceRate(voice.defaultRate);
                          setVoicePitch(voice.defaultPitch);
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected ? 'ring-2' : 'hover:opacity-90'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-card-elevated)',
                          borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                          boxShadow: isSelected ? '0 0 10px var(--accent-glow)' : 'none'
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {voice.name}
                              </p>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize"
                                style={{
                                  backgroundColor: 'var(--bg-card)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                {voice.gender}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: 'var(--accent-light)',
                                  color: 'var(--accent)',
                                  border: '1px solid var(--accent)'
                                }}
                              >
                                {voice.accent}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                              {voice.tone}
                            </p>
                          </div>

                          <button
                            type="button"
                            id={`preview-voice-${voice.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewVoice(voice);
                            }}
                            className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition cursor-pointer hover:opacity-80 shrink-0"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-color)',
                              color: isPlaying ? 'var(--accent)' : 'var(--text-primary)'
                            }}
                            title={isPlaying ? 'Stop voice sample' : 'Listen to calming voice sample'}
                          >
                            {isPlaying ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-medium">Stop</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-medium">Sample</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {voice.description}
                        </p>

                        <p className="text-[11px] leading-relaxed italic border-l-2 pl-2" style={{ borderColor: 'var(--accent)', color: 'var(--text-muted)' }}>
                          "{voice.sampleText}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Voice Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PRIVACY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Account Privacy & Deletion
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  You retain complete ownership over all your journal entries and personal data
                </p>
              </div>

              {/* Two-Factor Authentication (2FA) Recommendation & Status */}
              <div
                id="two-factor-auth-settings-card"
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: userProfile?.twoFactorEnabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${userProfile?.twoFactorEnabled ? 'text-emerald-500' : ''}`} style={!userProfile?.twoFactorEnabled ? { color: 'var(--accent)' } : undefined} />
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Two-Factor Authentication (2FA)
                    </span>
                  </div>
                  {userProfile?.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {userProfile?.twoFactorEnabled
                    ? 'Your private reflections are protected with Time-Based One-Time Passwords (TOTP). Signing in and exporting reflections requires entering the 6-digit code from your authenticator app.'
                    : 'Prevent unauthorized access to your private reflections. Set up an authenticator app (Google Authenticator, Authy, Apple Passwords, 1Password) to scan a QR code and require a 6-digit code each time you sign in.'}
                </p>

                {twoFactorNotice && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {twoFactorNotice}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {userProfile?.twoFactorEnabled ? (
                    <>
                      <button
                        type="button"
                        id="reconfigure-2fa-btn"
                        onClick={() => handleInitiate2FAAction('reconfigure')}
                        className="px-3.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer hover:opacity-85 flex items-center gap-1.5"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Reconfigure QR Code</span>
                      </button>

                      <button
                        type="button"
                        id="disable-2fa-btn"
                        disabled={isDisabling2FA}
                        onClick={() => handleInitiate2FAAction('disable')}
                        className="px-3 py-1.5 rounded-lg border text-xs font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        {isDisabling2FA ? 'Disabling...' : 'Disable 2FA'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      id="setup-2fa-btn"
                      onClick={() => {
                        onClose();
                        onOpenTwoFactorSetup?.();
                      }}
                      className="px-4 py-2 rounded-xl text-white text-xs font-medium transition cursor-pointer hover:opacity-90 shadow-xs flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'var(--accent)',
                        boxShadow: '0 0 10px var(--accent-glow)'
                      }}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Set Up Authenticator (QR Code)</span>
                    </button>
                  )}
                </div>

                {/* 2FA Reconfigure / Disable Step-Up Challenge Dialog */}
                {twoFactorChallengeAction && (
                  <div
                    id="challenge-2fa-dialog"
                    className="p-3.5 rounded-xl border space-y-2.5 mt-3 animate-in fade-in"
                    style={{
                      backgroundColor: 'rgba(217, 119, 6, 0.08)',
                      borderColor: 'rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Key className="w-4 h-4" />
                      <span>
                        Security Verification Required to {twoFactorChallengeAction === 'reconfigure' ? 'Reconfigure' : 'Disable'} 2FA
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      To confirm your identity, please enter the current 6-digit code from your authenticator app before {twoFactorChallengeAction === 'reconfigure' ? 'reconfiguring your QR code' : 'removing 2FA protection'}:
                    </p>
                    <form onSubmit={handleConfirm2FAChallenge} className="space-y-2.5">
                      <input
                        id="challenge-totp-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        autoFocus
                        value={challengeTotpCode}
                        onChange={(e) => {
                          setChallengeTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          if (challengeError) setChallengeError(null);
                        }}
                        className="w-full text-center text-lg font-mono font-bold tracking-[0.25em] py-2 px-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      {challengeError && (
                        <p className="text-xs text-red-500 font-medium">{challengeError}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTwoFactorChallengeAction(null);
                            setChallengeTotpCode('');
                            setChallengeError(null);
                          }}
                          className="px-3 py-1 text-xs rounded-lg border cursor-pointer hover:opacity-85"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={challengeTotpCode.length !== 6 || isDisabling2FA}
                          className="px-3.5 py-1 text-xs font-semibold rounded-lg text-white cursor-pointer disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--accent)',
                            boxShadow: '0 0 10px var(--accent-glow)'
                          }}
                        >
                          {isDisabling2FA ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* PDF Reflection Export Section */}
              <div
                id="export-pdf-settings-card"
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                    <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    Export Reflections as PDF
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    Local PDF Only
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Download an archival copy of all your personal reflections locally to your computer in PDF format. For privacy, downloading requires entering your account password and your 6-digit authenticator code.
                </p>

                <button
                  type="button"
                  id="open-export-pdf-modal-btn"
                  onClick={() => {
                    onOpenExportPdf?.();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer border flex items-center gap-1.5 hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Download className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Download PDF Archive</span>
                </button>

                {/* Expandable list of file downloads with eye mask button for passwords */}
                <ExportDownloadHistory userId={userProfile?.uid} defaultExpanded={false} />
              </div>

              {/* Password Reset Section */}
              {userProfile?.email && (
                <div
                  className="p-4 rounded-xl border space-y-2.5"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="flex items-center gap-2 font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                    <Key className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    Reset Account Password
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Send a secure link to {userProfile.email} to choose a new password.
                  </p>
                  {resetSent && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Password reset email sent! Check your inbox or spam folder.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer border"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {resetLoading ? 'Sending...' : 'Send Password Reset Email'}
                  </button>
                </div>
              )}

              {/* Permanent Deletion Explanation */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  <Shield className="w-4 h-4" />
                  What happens when you delete your account?
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  When you request account deletion, ReflectAI completely and permanently deletes all your personal journals, reflections, preferences, and saved entries from both this device and our secure cloud storage. This cannot be undone.
                </p>
                <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: 'var(--text-secondary)' }}>
                  <li>All your private journal entries and conversations are erased</li>
                  <li>Your user profile, name, and visual preferences are removed</li>
                  <li>All saved reflections on this browser are cleared</li>
                  <li>Your sign-in account is permanently closed</li>
                </ul>
              </div>

              {/* Help & Legal Information Links */}
              <div
                className="p-4 rounded-xl border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Learn More & Legal Documents
                  </h4>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Read our simple FAQ, understand Sanctuary vs Journal, and review our privacy guidelines.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onOpenAbout && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAbout();
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer hover:opacity-85"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      About & FAQ
                    </button>
                  )}
                  {onOpenLegal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLegal();
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer hover:opacity-85"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Privacy & Terms
                    </button>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone: Permanent Account Deletion
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                  Under GDPR Article 17 (Right to Erasure), completing this action will permanently purge all your active journals, reflections, and account data from operational systems and record a compliance archive. You will be logged out and returned to the sign-in screen.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    id="trigger-delete-account-button"
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account & All My Journals
                  </button>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-rose-500/20">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      To confirm permanent deletion, please type <span className="font-mono px-1.5 py-0.5 rounded bg-rose-500/20 font-bold">DELETE</span> below:
                    </p>
                    <input
                      id="confirm-delete-input"
                      type="text"
                      disabled={isDeleting}
                      value={deleteInput}
                      onChange={(e) => {
                        setDeleteInput(e.target.value);
                        if (deleteError) setDeleteError(null);
                      }}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-rose-500/40 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {userProfile?.authProvider === 'email' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                          Account password (required to verify identity):
                        </label>
                        <input
                          id="confirm-delete-password-input"
                          type="password"
                          disabled={isDeleting}
                          autoComplete="current-password"
                          value={deletePassword}
                          onChange={(e) => {
                            setDeletePassword(e.target.value);
                            if (deleteError) setDeleteError(null);
                          }}
                          placeholder="Enter your account password"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-rose-500/40 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                    {deleteError && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[11px]">Action Required</p>
                          <p className="text-[11px] leading-relaxed">{deleteError}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInput('');
                          setDeletePassword('');
                          setDeleteError(null);
                        }}
                        className="px-3 py-1.5 text-xs opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Cancel
                      </button>
                      <button
                        id="final-delete-account-button"
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer shadow-sm flex items-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting account...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Permanently Delete My Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
