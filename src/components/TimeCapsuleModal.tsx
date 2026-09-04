import React, { useState } from 'react';
import {
  X,
  Clock,
  Lock,
  Unlock,
  Sparkles,
  Award,
  AlertCircle,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { JournalInteraction, TimeCapsuleData } from '../types';
import { saveJournalInteraction } from '../services/journalService';

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  activeInteraction?: JournalInteraction | null;
  interactions?: JournalInteraction[];
  allInteractions?: JournalInteraction[];
  onCapsuleUpdated?: (updated: JournalInteraction) => void;
  onSealCapsule?: (interactionId: string, capsuleData: TimeCapsuleData) => Promise<void>;
  onUnsealCapsule?: (interactionId: string, growthSummary: string) => Promise<void>;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  userId,
  activeInteraction,
  interactions,
  allInteractions,
  onCapsuleUpdated,
  onSealCapsule,
  onUnsealCapsule
}) => {
  const [activeTab, setActiveTab] = useState<'seal' | 'vault'>('seal');
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [capsuleNote, setCapsuleNote] = useState('');
  const [isSealing, setIsSealing] = useState(false);
  const [sealSuccess, setSealSuccess] = useState(false);

  // Unsealing states
  const [unsealingId, setUnsealingId] = useState<string | null>(null);
  const [unsealReflectionNote, setUnsealReflectionNote] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [unsealError, setUnsealError] = useState<string | null>(null);
  const [synthesisResult, setSynthesisResult] = useState<{
    growthAnalysis: string;
    celebrationText: string;
    emergentStrengths: string[];
  } | null>(null);

  if (!isOpen) return null;

  const interactionList = interactions || allInteractions || [];

  // Filter capsules
  const sealedCapsules = interactionList.filter(
    (i) => i.timeCapsule && !i.timeCapsule.isOpened
  );
  const unsealedCapsules = interactionList.filter(
    (i) => i.timeCapsule && i.timeCapsule.isOpened
  );

  const handleSealActive = async () => {
    if (!activeInteraction?.id) return;
    setIsSealing(true);
    setSealSuccess(false);

    try {
      const sealDate = new Date().toISOString();
      const unlockDate = new Date(Date.now() + selectedDays * 86400000).toISOString();

      const capsuleData: TimeCapsuleData = {
        isSealed: true,
        sealDate,
        unlockDate,
        capsulePrompt: capsuleNote.trim() || `Mindful Reflection from ${new Date().toLocaleDateString()}`,
        isOpened: false
      };

      if (onSealCapsule) {
        await onSealCapsule(activeInteraction.id, capsuleData);
      } else if (onCapsuleUpdated) {
        const updated: JournalInteraction = {
          ...activeInteraction,
          timeCapsule: capsuleData
        };
        onCapsuleUpdated(updated);
        if (userId) {
          await saveJournalInteraction(userId, updated);
        }
      }

      setSealSuccess(true);
      setTimeout(() => {
        setSealSuccess(false);
        setActiveTab('vault');
      }, 1500);
    } catch (err) {
      console.error('Failed to seal time capsule:', err);
    } finally {
      setIsSealing(false);
    }
  };

  const handleUnseal = async (capsule: JournalInteraction) => {
    if (!capsule.id) return;
    setIsSynthesizing(true);
    setUnsealError(null);

    try {
      const res = await fetch('/api/reflect/synthesize-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: capsule.prompt,
          originalReflection: capsule.geminiResponse || '',
          sealDate: capsule.timeCapsule?.sealDate || capsule.createdAt,
          unsealDate: new Date().toISOString(),
          currentPerspectiveNote: unsealReflectionNote.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to analyze past reflection.');
      }

      const data = await res.json();
      setSynthesisResult(data);

      if (onUnsealCapsule) {
        await onUnsealCapsule(capsule.id, data.growthAnalysis);
      } else if (onCapsuleUpdated) {
        const updated: JournalInteraction = {
          ...capsule,
          timeCapsule: capsule.timeCapsule
            ? { ...capsule.timeCapsule, isOpened: true, growthSummary: data.growthAnalysis }
            : undefined
        };
        onCapsuleUpdated(updated);
        if (userId) {
          await saveJournalInteraction(userId, updated);
        }
      }

      setUnsealReflectionNote('');
    } catch (err: any) {
      setUnsealError(err.message || 'Unable to open capsule right now. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div
      id="time-capsule-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        id="time-capsule-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
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
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight font-serif">
                Time Capsule Vault
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Seal reflections across time to witness your personal growth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close time capsule"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b px-5 pt-2 shrink-0 gap-2"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <button
            onClick={() => setActiveTab('seal')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'seal' ? 'font-semibold' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'seal' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'seal' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <Lock className="w-4 h-4" />
            Seal Current Reflection
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'vault' ? 'font-semibold' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'vault' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'vault' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <Unlock className="w-4 h-4" />
            Capsule Vault ({sealedCapsules.length + unsealedCapsules.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          {activeTab === 'seal' && (
            <div className="space-y-5">
              {activeInteraction ? (
                <>
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider block mb-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      Reflection to Seal
                    </span>
                    <p className="text-xs font-serif italic line-clamp-3" style={{ color: 'var(--text-primary)' }}>
                      "{activeInteraction.prompt}"
                    </p>
                  </div>

                  {/* Future Duration Picker */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Seal Duration
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { days: 7, label: '7 Days', desc: 'Short check-in' },
                        { days: 30, label: '30 Days', desc: '1 Month' },
                        { days: 90, label: '90 Days', desc: '1 Season' },
                        { days: 365, label: '1 Year', desc: 'Full Year' }
                      ].map((preset) => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => setSelectedDays(preset.days)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                            selectedDays === preset.days ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{
                            borderColor: selectedDays === preset.days ? 'var(--accent)' : 'var(--border-color)',
                            backgroundColor: selectedDays === preset.days ? 'var(--accent-light)' : 'var(--bg-card-elevated)',
                            color: selectedDays === preset.days ? 'var(--accent)' : 'var(--text-primary)'
                          }}
                        >
                          <span className="block text-sm font-semibold">{preset.label}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note to future self */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Letter or Note to Future Self
                    </label>
                    <textarea
                      rows={3}
                      value={capsuleNote}
                      onChange={(e) => setCapsuleNote(e.target.value)}
                      placeholder="What question do you hope your future self has answered? What feeling do you wish to remember?"
                      className="w-full text-xs p-3 rounded-xl border focus:outline-none transition"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  {sealSuccess && (
                    <div
                      className="p-3 rounded-xl border flex items-center gap-2 text-xs"
                      style={{
                        backgroundColor: 'var(--accent-light)',
                        borderColor: 'var(--accent)',
                        color: 'var(--accent)'
                      }}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      Capsule sealed safely until{' '}
                      {new Date(Date.now() + selectedDays * 86400000).toLocaleDateString()}!
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      id="confirm-seal-capsule-button"
                      type="button"
                      disabled={isSealing}
                      onClick={handleSealActive}
                      className="px-5 py-2.5 rounded-xl text-xs font-medium shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: '#ffffff'
                      }}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {isSealing ? 'Sealing Capsule...' : `Seal Capsule for ${selectedDays} Days`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-2" style={{ color: 'var(--text-muted)' }}>
                  <Lock className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    No active reflection selected
                  </p>
                  <p className="text-xs">
                    Write a thought in your journal first, then seal it into a capsule.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Sealed Section */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Lock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  Sealed Capsules Awaiting Opening ({sealedCapsules.length})
                </h3>

                {sealedCapsules.length === 0 ? (
                  <p
                    className="text-xs italic p-4 rounded-xl border border-dashed text-center"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    No active sealed capsules. Seal your current reflection from the first tab!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sealedCapsules.map((capsule) => {
                      const isReady =
                        capsule.timeCapsule &&
                        new Date(capsule.timeCapsule.unlockDate) <= new Date();
                      const isSelectedToUnseal = unsealingId === capsule.id;

                      return (
                        <div
                          key={capsule.id}
                          className="p-4 rounded-xl border space-y-3"
                          style={{
                            backgroundColor: 'var(--bg-card-elevated)',
                            borderColor: 'var(--border-color)'
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {capsule.timeCapsule?.capsulePrompt || 'Time Capsule'}
                                </span>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: isReady ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-light)',
                                    color: isReady ? '#10b981' : 'var(--accent)'
                                  }}
                                >
                                  {isReady ? 'Ready to Open' : 'Sealed in Vault'}
                                </span>
                              </div>
                              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                Sealed: {new Date(capsule.timeCapsule!.sealDate).toLocaleDateString()} &bull; Opens: {new Date(capsule.timeCapsule!.unlockDate).toLocaleDateString()}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setUnsealingId(
                                  isSelectedToUnseal ? null : (capsule.id || null)
                                );
                                setSynthesisResult(null);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0"
                              style={{
                                backgroundColor: 'var(--accent)',
                                color: '#ffffff'
                              }}
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              {isSelectedToUnseal ? 'Cancel' : 'Open & Reflect'}
                            </button>
                          </div>

                          {/* Unsealing flow */}
                          {isSelectedToUnseal && (
                            <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                              <div>
                                <label className="block text-[11px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                                  How do you feel about this moment today? (Optional)
                                </label>
                                <textarea
                                  rows={2}
                                  value={unsealReflectionNote}
                                  onChange={(e) => setUnsealReflectionNote(e.target.value)}
                                  placeholder="Share how your perspective or circumstances have changed..."
                                  className="w-full text-xs p-2.5 rounded-xl border focus:outline-none transition"
                                  style={{
                                    backgroundColor: 'var(--bg-input)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-primary)'
                                  }}
                                />
                              </div>

                              <button
                                type="button"
                                disabled={isSynthesizing}
                                onClick={() => handleUnseal(capsule)}
                                className="w-full py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--accent)',
                                  color: '#ffffff'
                                }}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isSynthesizing
                                  ? 'Gathering your growth reflections...'
                                  : 'Open Capsule & Discover Growth'}
                              </button>

                              {unsealError && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>{unsealError}</span>
                                </div>
                              )}

                              {synthesisResult && (
                                <div
                                  className="p-4 rounded-xl border space-y-2.5"
                                  style={{
                                    backgroundColor: 'var(--bg-card)',
                                    borderColor: 'var(--accent)'
                                  }}
                                >
                                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                                    <Award className="w-4 h-4" />
                                    <span>Reflections on Your Growth</span>
                                  </div>
                                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    {synthesisResult.growthAnalysis}
                                  </p>
                                  <div
                                    className="p-2.5 rounded-lg text-xs italic border"
                                    style={{
                                      backgroundColor: 'var(--bg-card-elevated)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    "{synthesisResult.celebrationText}"
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {synthesisResult.emergentStrengths.map((str, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                          backgroundColor: 'var(--accent-light)',
                                          color: 'var(--accent)'
                                        }}
                                      >
                                        ✓ {str}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Unsealed Capsules */}
              {unsealedCapsules.length > 0 && (
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    Opened Capsules ({unsealedCapsules.length})
                  </h3>
                  <div className="space-y-3">
                    {unsealedCapsules.map((capsule) => (
                      <div
                        key={capsule.id}
                        className="p-4 rounded-xl border space-y-2"
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--border-color)'
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {capsule.timeCapsule?.capsulePrompt || 'Opened Capsule'}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Opened {new Date(capsule.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                          "{capsule.prompt}"
                        </p>
                        {capsule.timeCapsule?.growthSummary && (
                          <div
                            className="p-3 rounded-lg text-xs border"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <span className="font-semibold block mb-1" style={{ color: 'var(--accent)' }}>
                              Growth Discovery:
                            </span>
                            {capsule.timeCapsule.growthSummary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
