import React, { useState, useMemo } from 'react';
import {
  X,
  Compass,
  Sparkles,
  ChevronRight,
  Heart,
  Sun,
  Activity,
  Smile,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { JournalInteraction, SanctuaryMood } from '../types';

interface ResonanceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: JournalInteraction[];
  onSelectInteraction: (interaction: JournalInteraction) => void;
}

interface MoodConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MOOD_CONFIG: Record<SanctuaryMood, MoodConfig> = {
  calm: {
    label: 'Calm & Peace',
    color: '#0ea5e9',
    icon: Sparkles
  },
  clarity: {
    label: 'Mental Clarity',
    color: '#06b6d4',
    icon: Zap
  },
  gratitude: {
    label: 'Gratitude & Joy',
    color: '#f59e0b',
    icon: Heart
  },
  courage: {
    label: 'Courage & Strength',
    color: '#ef4444',
    icon: Sun
  },
  growth: {
    label: 'Growth & Progress',
    color: '#10b981',
    icon: Smile
  },
  anxious: {
    label: 'Unburdening',
    color: '#a855f7',
    icon: Activity
  },
  reflective: {
    label: 'Contemplation',
    color: '#6366f1',
    icon: Compass
  }
};

export const ResonanceMapModal: React.FC<ResonanceMapModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onSelectInteraction
}) => {
  const [activeMoodFilter, setActiveMoodFilter] = useState<SanctuaryMood | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<JournalInteraction | null>(null);

  // Compute mood distributions
  const moodDistribution = useMemo(() => {
    const counts: Record<SanctuaryMood, number> = {
      calm: 0,
      clarity: 0,
      gratitude: 0,
      courage: 0,
      growth: 0,
      anxious: 0,
      reflective: 0
    };

    interactions.forEach((item) => {
      const mood = (item.mood || 'reflective') as SanctuaryMood;
      if (counts[mood] !== undefined) {
        counts[mood]++;
      } else {
        counts.reflective++;
      }
    });

    const total = interactions.length || 1;
    return (Object.keys(counts) as SanctuaryMood[]).map((mood) => ({
      mood,
      count: counts[mood],
      percentage: Math.round((counts[mood] / total) * 100)
    }));
  }, [interactions]);

  const filteredInteractions = useMemo(() => {
    if (activeMoodFilter === 'all') return interactions;
    return interactions.filter(
      (item) => (item.mood || 'reflective') === activeMoodFilter
    );
  }, [interactions, activeMoodFilter]);

  if (!isOpen) return null;

  return (
    <div
      id="resonance-map-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        id="resonance-map-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
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
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight font-serif">
                Echoes of Mind &bull; Thought Constellation
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                A visual constellation of your reflections and feelings over time
              </p>
            </div>
          </div>
          <button
            id="resonance-map-close-button"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close thought map"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Ribbon */}
        <div
          className="px-5 py-2.5 border-b overflow-x-auto flex items-center gap-2 shrink-0 custom-scrollbar"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMoodFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
              activeMoodFilter === 'all' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeMoodFilter === 'all' ? 'var(--accent)' : 'transparent',
              borderColor: activeMoodFilter === 'all' ? 'var(--accent)' : 'var(--border-color)',
              color: activeMoodFilter === 'all' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            All Reflections ({interactions.length})
          </button>
          {moodDistribution.map((item) => {
            const cfg = MOOD_CONFIG[item.mood];
            const Icon = cfg.icon;
            const isSelected = activeMoodFilter === item.mood;
            return (
              <button
                key={item.mood}
                type="button"
                onClick={() => setActiveMoodFilter(item.mood)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)'
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <Icon className="w-3 h-3 shrink-0" />
                <span>{cfg.label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-70">
                  {item.percentage}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Area */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 custom-scrollbar">
          {/* Constellation Preview */}
          <div className="md:col-span-2 space-y-4">
            <div
              className="relative rounded-2xl border p-5 min-h-[320px] flex flex-col justify-between overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  Thought Stars
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Showing {filteredInteractions.length} reflections
                </span>
              </div>

              {/* Nodes Grid */}
              {filteredInteractions.length === 0 ? (
                <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No reflections recorded in this feeling category yet.
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
                  {filteredInteractions.slice(0, 16).map((interaction, idx) => {
                    const mood = (interaction.mood || 'reflective') as SanctuaryMood;
                    const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.reflective;
                    const isSelected = selectedNode?.id === interaction.id;

                    return (
                      <motion.button
                        key={interaction.id || idx}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedNode(interaction)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                          isSelected ? 'shadow-md ring-2 ring-offset-1' : 'opacity-85 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mb-2"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <p className="text-xs font-medium line-clamp-2 mb-1">
                          {interaction.summary || interaction.prompt.slice(0, 35)}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(interaction.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              <div
                className="relative z-10 flex items-center justify-between text-[11px] pt-2 border-t"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)'
                }}
              >
                <span>Select any thought to inspect its words</span>
                <span>Calming Balance</span>
              </div>
            </div>

            {/* Balance Bar */}
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Feeling Balance Breakdown
                </span>
              </div>
              <div
                className="h-2.5 w-full rounded-full overflow-hidden flex"
                style={{ backgroundColor: 'var(--bg-canvas)' }}
              >
                {moodDistribution.map((item) => (
                  <div
                    key={item.mood}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: MOOD_CONFIG[item.mood].color
                    }}
                    title={`${MOOD_CONFIG[item.mood].label}: ${item.percentage}%`}
                    className="h-full transition-all"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Node Inspector Sidebar */}
          <div
            className="border rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Thought Details
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{
                      borderColor: MOOD_CONFIG[(selectedNode.mood || 'reflective') as SanctuaryMood].color,
                      color: MOOD_CONFIG[(selectedNode.mood || 'reflective') as SanctuaryMood].color
                    }}
                  >
                    {MOOD_CONFIG[(selectedNode.mood || 'reflective') as SanctuaryMood].label}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    YOUR THOUGHT:
                  </h4>
                  <p
                    className="text-xs p-3 rounded-xl border italic leading-relaxed"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    "{selectedNode.prompt}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    REFLECTIVE RESPONSE:
                  </h4>
                  <p
                    className="text-xs p-3 rounded-xl border line-clamp-6 leading-relaxed"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {selectedNode.response}
                  </p>
                </div>

                {selectedNode.location && (
                  <div
                    className="text-[11px] flex items-center gap-1.5 p-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Compass className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <span>Location: {selectedNode.location.placeName || 'Peaceful Spot'}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectInteraction(selectedNode);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: '#ffffff'
                    }}
                  >
                    <span>View this Journal Entry</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-2" style={{ color: 'var(--text-muted)' }}>
                <Compass className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">
                  Click any thought star on the map to review the entry
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
