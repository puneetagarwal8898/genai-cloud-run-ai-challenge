import React, { useState } from 'react';
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
  Key
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
  onOpenLegal?: () => void;
}

const MINDFUL_AVATARS = [
  { id: 'lotus', name: 'Lotus Awakening', url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=150&auto=format&fit=crop&q=80' },
  { id: 'bamboo', name: 'Bamboo Serenity', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=80' },
  { id: 'mist', name: 'Morning Mist', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=150&auto=format&fit=crop&q=80' },
  { id: 'pebble', name: 'Zen Pebble', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=150&auto=format&fit=crop&q=80' },
  { id: 'forest', name: 'Earthy Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=150&auto=format&fit=crop&q=80' },
  { id: 'water', name: 'Flowing Stream', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=150&auto=format&fit=crop&q=80' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAbout, onOpenLegal }) => {
  const { user, userProfile, updateUserProfileData, deleteUserAccount, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');

  // Profile fields
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || userProfile?.avatarUrl || user?.photoURL || MINDFUL_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Preference fields
  const [ambientSound, setAmbientSound] = useState(userProfile?.preferences?.ambientSound ?? userProfile?.preferences?.ambientSoundEnabled ?? true);
  const [voiceRate, setVoiceRate] = useState(userProfile?.preferences?.voiceRate ?? userProfile?.preferences?.voiceSpeed ?? 0.95);
  const [voicePitch, setVoicePitch] = useState(userProfile?.preferences?.voicePitch || 1.0);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete flow
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset password state
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Reset state whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('profile');
      setDisplayName(userProfile?.displayName || user?.displayName || '');
      setSelectedAvatar(userProfile?.photoURL || userProfile?.avatarUrl || user?.photoURL || MINDFUL_AVATARS[0].url);
      setCustomAvatarUrl('');
      setSaveSuccess(false);
      setSaveError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await updateUserProfileData({
        displayName: displayName.trim() || 'Mindful Soul',
        photoURL: customAvatarUrl.trim() || selectedAvatar,
        preferences: {
          ambientSound,
          ambientSoundEnabled: ambientSound,
          voiceRate,
          voiceSpeed: voiceRate,
          voicePitch: voicePitch,
        }
      });
      setIsSaving(false);
      // Close the modal cleanly upon saving changes without jerky background shifts
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
      await updateUserProfileData({
        preferences: {
          ambientSound,
          ambientSoundEnabled: ambientSound,
          voiceRate,
          voiceSpeed: voiceRate,
          voicePitch: voicePitch,
        }
      });
      setIsSaving(false);
      // Close the modal cleanly upon saving preferences
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update voice preferences.');
      setIsSaving(false);
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
    if (deleteInput.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteUserAccount();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to complete account deletion.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
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
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
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
            onClick={() => setActiveTab('profile')}
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
            onClick={() => setActiveTab('preferences')}
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
            onClick={() => setActiveTab('security')}
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
                  Customize the pacing and soothing sound while listening to your reflections
                </p>
              </div>

              {/* Ambient Sound Drone Toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Calming 432Hz Ambient Sound
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Plays a soft, restful background tone while listening to entries
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAmbientSound(!ambientSound)}
                  className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
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

              {/* Voice Speed Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  <span>Reading Speed: {voiceRate.toFixed(2)}x</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {voiceRate < 0.9 ? 'Slow & Gentle' : voiceRate > 1.05 ? 'Brisk' : 'Natural Pacing'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{ accentColor: 'var(--accent)' }}
                />
              </div>

              {/* Voice Pitch Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  <span>Voice Tone (Pitch): {voicePitch.toFixed(2)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {voicePitch < 0.9 ? 'Warm & Deep' : voicePitch > 1.1 ? 'Light' : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{ accentColor: 'var(--accent)' }}
                />
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
                      To confirm permanent deletion, please type <span className="font-mono px-1.5 py-0.5 rounded bg-rose-500/20">DELETE</span> below:
                    </p>
                    <input
                      id="confirm-delete-input"
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-rose-500/40 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    {deleteError && (
                      <p className="text-xs text-rose-600">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInput('');
                          setDeleteError(null);
                        }}
                        className="px-3 py-1.5 text-xs opacity-70 hover:opacity-100 cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Cancel
                      </button>
                      <button
                        id="final-delete-account-button"
                        type="button"
                        disabled={isDeleting || deleteInput.trim().toUpperCase() !== 'DELETE'}
                        onClick={handleDeleteAccount}
                        className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium disabled:opacity-40 transition cursor-pointer shadow-sm"
                      >
                        {isDeleting ? 'Deleting all journals & account...' : 'Permanently Delete My Account'}
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
