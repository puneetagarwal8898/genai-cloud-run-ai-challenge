import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  Lock,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  Volume2,
  Sliders,
  Sparkles,
  Calendar,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MINDFUL_AVATARS = [
  {
    id: 'lotus',
    name: 'Zen Lotus',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'mountain',
    name: 'Mountain Dawn',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'ocean',
    name: 'Calm Ocean',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'forest',
    name: 'Forest Sanctuary',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'night',
    name: 'Crescent Moon',
    url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'starlight',
    name: 'Starlight Glow',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=150&q=80'
  }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfileData, deleteUserAccount, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || MINDFUL_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preference states
  const [voicePitch, setVoicePitch] = useState(userProfile?.preferences?.voicePitch ?? 1.0);
  const [voiceRate, setVoiceRate] = useState(userProfile?.preferences?.voiceRate ?? 0.95);
  const [ambientSound, setAmbientSound] = useState(userProfile?.preferences?.ambientSound ?? true);
  const [autoReadAloud, setAutoReadAloud] = useState(userProfile?.preferences?.autoReadAloud ?? false);

  // Password reset state
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const finalAvatar = customAvatarUrl.trim() || selectedAvatar;
      const updatedPrefs: UserPreferences = {
        voicePitch,
        voiceRate,
        ambientSound,
        autoReadAloud
      };

      await updateUserProfileData({
        displayName: displayName.trim(),
        photoURL: finalAvatar,
        preferences: updatedPrefs
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update sanctuary profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!userProfile?.email) return;
    setResetLoading(true);
    setResetMessage(null);
    try {
      await resetPassword(userProfile.email);
      setResetSent(true);
      setResetMessage(`Password reset link successfully dispatched to ${userProfile.email}`);
    } catch (err: any) {
      setResetMessage(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm data wipe and account closure.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteUserAccount();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to complete account deletion and data wipe.');
      setIsDeleting(false);
    }
  };

  return (
    <div id="settings-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        id="settings-modal-content"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 font-serif">
                Sanctuary Settings & Identity
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Manage your reflection profile, mindfulness voice, and privacy
              </p>
            </div>
          </div>
          <button
            id="settings-modal-close-button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/30 px-6 pt-2">
          <button
            id="settings-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <User className="w-4 h-4" />
            Sanctuary Profile
          </button>
          <button
            id="settings-tab-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'preferences'
                ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Voice & Audio Mode
          </button>
          <button
            id="settings-tab-security"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Privacy & Data Wipe
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <Check className="w-4 h-4 text-emerald-600" />
              Sanctuary profile updated successfully.
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {saveError}
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  Sanctuary Avatar
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <img
                    src={selectedAvatar}
                    alt="Active Avatar"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-500/40 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                      Select a calming theme preset or provide your image URL
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Reflects your mindful presence across all journal sessions
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
                      className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        selectedAvatar === avatar.url
                          ? 'border-amber-500 ring-2 ring-amber-500/20 scale-105'
                          : 'border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100'
                      }`}
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
                    placeholder="Or paste custom image URL (https://...)"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      if (e.target.value.trim()) setSelectedAvatar(e.target.value.trim());
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Display Name Field */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  id="settings-display-name-input"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your preferred sanctuary name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  required
                />
              </div>

              {/* Email Field (Locked by Design) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-stone-400" />
                    Locked for Security
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    value={userProfile?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/70 dark:bg-stone-800/30 text-stone-500 dark:text-stone-400 text-sm cursor-not-allowed select-none font-mono"
                  />
                  <Lock className="absolute right-3.5 top-3 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                  Your email is the cryptographic primary identifier partition in Cloud Firestore. Locking it preserves access control and session token integrity.
                </p>
              </div>

              {/* Account Metadata Badges */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Authentication Provider
                  </span>
                  <span className="font-medium text-stone-900 dark:text-stone-100 capitalize">
                    {userProfile?.authProvider || 'Google Auth'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Sanctuary Established
                  </span>
                  <span className="font-mono text-stone-700 dark:text-stone-300">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Active Session'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="settings-save-button"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50"
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
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                  Sanctuary Audio & Narration Preferences
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Configure how ReflectAI speaks back to you during mindfulness sessions
                </p>
              </div>

              {/* Ambient Sound Drone Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      432Hz Ambient Soundscape
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Subtle harmonic theta-wave drone generator during voice reflections
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAmbientSound(!ambientSound)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    ambientSound ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
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
                <div className="flex justify-between text-xs font-medium text-stone-700 dark:text-stone-300">
                  <span>Voice Pacing: {voiceRate.toFixed(2)}x</span>
                  <span className="text-stone-400">
                    {voiceRate < 0.9 ? 'Gentle & Unhurried' : voiceRate > 1.05 ? 'Swift' : 'Calm & Measured'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Voice Pitch Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-stone-700 dark:text-stone-300">
                  <span>Voice Pitch: {voicePitch.toFixed(2)}</span>
                  <span className="text-stone-400">
                    {voicePitch < 0.9 ? 'Deep & Grounded' : voicePitch > 1.1 ? 'Airy' : 'Natural Resonance'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium shadow-sm transition-all"
                >
                  Apply Voice Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & DATA WIPE */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Reset Section (For email users) */}
              {userProfile?.authProvider === 'email' && (
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-medium text-sm">
                    <Key className="w-4 h-4 text-amber-500" />
                    Password Credentials
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Need to update your password? We will dispatch a secure Firebase reset link to your registered email address.
                  </p>
                  {resetMessage && (
                    <p className={`text-xs ${resetSent ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                      {resetMessage}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                  >
                    {resetLoading ? 'Sending...' : 'Send Password Reset Email'}
                  </button>
                </div>
              )}

              {/* What is a Firestore Data Wipe? */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  What is a Firestore Data Wipe?
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  In accordance with privacy mandates (GDPR/CCPA) and Cloud Firestore security architecture, when you request account deletion, ReflectAI executes an <strong>atomic data wipe</strong>:
                </p>
                <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1 list-disc list-inside">
                  <li>Systematically deletes all journal documents from <code className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded font-mono text-[11px]">/users/{'{userId}'}/interactions/*</code></li>
                  <li>Wipes your user profile metadata and preferences</li>
                  <li>Purges all cached reflection trails from local browser storage</li>
                  <li>Revokes and removes the Firebase Auth identity account</li>
                </ul>
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone: Permanent Account Deletion
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                  Once deleted, your reflections, time capsules, and conversational insights cannot be recovered. This action is permanent and irreversible.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    id="trigger-delete-account-button"
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account & Wipe Reflections
                  </button>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-rose-200 dark:border-rose-900/50">
                    <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                      To confirm permanent deletion, please type <span className="font-mono bg-rose-100 dark:bg-rose-900 px-1.5 py-0.5 rounded">DELETE</span> below:
                    </p>
                    <input
                      id="confirm-delete-input"
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                        className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        id="final-delete-account-button"
                        type="button"
                        disabled={isDeleting || deleteInput.trim().toUpperCase() !== 'DELETE'}
                        onClick={handleDeleteAccount}
                        className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium disabled:opacity-40 transition-all shadow-sm"
                      >
                        {isDeleting ? 'Wiping Firestore & Account...' : 'Permanently Wipe My Account'}
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
