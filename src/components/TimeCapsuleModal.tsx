import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  Lock,
  Unlock,
  Sparkles,
  Calendar,
  Check,
  AlertCircle,
  Award,
  ArrowRight,
  Send
} from 'lucide-react';
import { JournalInteraction } from '../types';
import { saveJournalInteraction } from '../services/journalService';

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  interactions: JournalInteraction[];
  activeInteraction: JournalInteraction | null;
  onCapsuleUpdated: (updated: JournalInteraction) => void;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  userId,
  interactions,
  activeInteraction,
  onCapsuleUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'seal' | 'vault'>('seal');
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [capsuleNote, setCapsuleNote] = useState('');
  const [isSealing, setIsSealing] = useState(false);
  const [sealSuccess, setSealSuccess] = useState(false);

  // Unsealing state
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

  // Filter existing capsules
  const sealedCapsules = interactions.filter(
    (item) => item.timeCapsule && item.timeCapsule.isSealed
  );
  const unsealedCapsules = interactions.filter(
    (item) => item.timeCapsule && !item.timeCapsule.isSealed
  );

  const handleSealActive = async () => {
    if (!activeInteraction) return;
    setIsSealing(true);
    setSealSuccess(false);

    try {
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + selectedDays);

      const updatedCapsule = {
        isSealed: true,
        sealDate: new Date().toISOString(),
        unlockDate: unlockDate.toISOString(),
        capsulePrompt: capsuleNote.trim() || 'A letter to my future self'
      };

      const updatedInteraction: JournalInteraction = {
        ...activeInteraction,
        timeCapsule: updatedCapsule
      };

      await saveJournalInteraction(userId, updatedInteraction);
      onCapsuleUpdated(updatedInteraction);
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
    if (!capsule.timeCapsule) return;
    setIsSynthesizing(true);
    setSynthesisResult(null);
    setUnsealError(null);

    try {
      const response = await fetch('/api/gemini/synthesize-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastPrompt: capsule.prompt,
          pastResponse: capsule.geminiResponse || capsule.summary || '',
          sealedDate: new Date(capsule.timeCapsule.sealDate).toLocaleDateString(),
          currentContext: unsealReflectionNote.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Growth synthesis failed');
      }

      const data = await response.json();
      setSynthesisResult(data);

      const updatedInteraction: JournalInteraction = {
        ...capsule,
        timeCapsule: {
          ...capsule.timeCapsule,
          isSealed: false,
          growthSummary: data.growthAnalysis
        }
      };

      await saveJournalInteraction(userId, updatedInteraction);
      onCapsuleUpdated(updatedInteraction);
    } catch (err: any) {
      console.error('Unsealing error:', err);
      setUnsealError(err.message || 'Unable to synthesize growth. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div id="time-capsule-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        id="time-capsule-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 font-serif">
                Serenity Time Capsule
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Seal your reflections across time and witness your mindful evolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('seal')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'seal'
                ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Seal Current Thought
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Unlock className="w-4 h-4" />
            Capsule Vault ({sealedCapsules.length + unsealedCapsules.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {activeTab === 'seal' && (
            <div className="space-y-5">
              {activeInteraction ? (
                <>
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                      Active Reflection to Seal
                    </span>
                    <p className="text-xs text-stone-800 dark:text-stone-200 font-serif italic line-clamp-3">
                      "{activeInteraction.prompt}"
                    </p>
                  </div>

                  {/* Future Duration Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                      Duration to Seal Into the Future
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { days: 7, label: '7 Days', desc: 'Brief pause' },
                        { days: 30, label: '30 Days', desc: '1 Moon cycle' },
                        { days: 90, label: '90 Days', desc: '1 Season' },
                        { days: 365, label: '1 Year', desc: 'Solar return' }
                      ].map((preset) => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => setSelectedDays(preset.days)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            selectedDays === preset.days
                              ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                              : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{preset.label}</span>
                          <span className="text-[10px] text-stone-400">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note to future self */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Personal Note or Intention to Future Self
                    </label>
                    <textarea
                      rows={3}
                      value={capsuleNote}
                      onChange={(e) => setCapsuleNote(e.target.value)}
                      placeholder="What question do you hope your future self has answered? What courage do you wish to remember?"
                      className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  {sealSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Reflective capsule sealed until{' '}
                      {new Date(Date.now() + selectedDays * 86400000).toLocaleDateString()}!
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      id="confirm-seal-capsule-button"
                      type="button"
                      disabled={isSealing}
                      onClick={handleSealActive}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {isSealing ? 'Sealing Capsule...' : `Seal Capsule for ${selectedDays} Days`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-stone-500 space-y-2">
                  <Lock className="w-8 h-8 mx-auto text-stone-400" />
                  <p className="text-sm font-medium">No active reflection selected</p>
                  <p className="text-xs">Write a thought in the sanctuary first, then seal it into a capsule.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Sealed Section */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Sealed Capsules Awaiting Opening ({sealedCapsules.length})
                </h3>

                {sealedCapsules.length === 0 ? (
                  <p className="text-xs text-stone-400 italic p-4 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center">
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
                          className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                                  {capsule.timeCapsule?.capsulePrompt || 'Time Capsule'}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                    isReady
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {isReady ? 'Ready to Unseal' : 'Sealed in Time'}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 font-mono">
                                Sealed:{' '}
                                {new Date(capsule.timeCapsule!.sealDate).toLocaleDateString()} • Unlock Date:{' '}
                                {new Date(capsule.timeCapsule!.unlockDate).toLocaleDateString()}
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
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              {isSelectedToUnseal ? 'Cancel' : 'Unseal & Reflect'}
                            </button>
                          </div>

                          {/* Unsealing flow */}
                          {isSelectedToUnseal && (
                            <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 uppercase mb-1">
                                  How do you feel about this moment today? (Optional)
                                </label>
                                <textarea
                                  rows={2}
                                  value={unsealReflectionNote}
                                  onChange={(e) => setUnsealReflectionNote(e.target.value)}
                                  placeholder="Provide any context or how your circumstances have changed..."
                                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={isSynthesizing}
                                onClick={() => handleUnseal(capsule)}
                                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isSynthesizing
                                  ? 'Synthesizing Temporal Growth with Gemini...'
                                  : 'Synthesize Growth & Reveal Past Wisdom'}
                              </button>

                              {unsealError && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>{unsealError}</span>
                                </div>
                              )}

                              {synthesisResult && (
                                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                    <Award className="w-4 h-4" />
                                    <span>AI Temporal Growth Synthesis</span>
                                  </div>
                                  <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                                    {synthesisResult.growthAnalysis}
                                  </p>
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 text-xs italic text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900">
                                    "{synthesisResult.celebrationText}"
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {synthesisResult.emergentStrengths.map((str, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 font-medium"
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

              {/* Unsealed & Historical Capsules */}
              {unsealedCapsules.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Unsealed Growth Chronicles ({unsealedCapsules.length})
                  </h3>
                  <div className="space-y-3">
                    {unsealedCapsules.map((capsule) => (
                      <div
                        key={capsule.id}
                        className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/40 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-900 dark:text-stone-100">
                            {capsule.timeCapsule?.capsulePrompt || 'Unsealed Capsule'}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            Opened {new Date(capsule.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 italic">
                          "{capsule.prompt}"
                        </p>
                        {capsule.timeCapsule?.growthSummary && (
                          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl text-xs text-stone-700 dark:text-stone-300 border border-stone-100 dark:border-stone-800">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                              Synthesized Growth:
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
