import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Compass,
  Sparkles,
  Calendar,
  Filter,
  Eye,
  Heart,
  Brain,
  Sun,
  Shield,
  Activity,
  ChevronRight
} from 'lucide-react';
import { JournalInteraction, SanctuaryMood } from '../types';

interface ResonanceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: JournalInteraction[];
  onSelectInteraction: (interaction: JournalInteraction) => void;
}

const MOOD_CONFIG: Record<SanctuaryMood, { label: string; color: string; bgLight: string; bgDark: string; border: string; icon: any }> = {
  calm: {
    label: 'Calm & Grounded',
    color: '#0284c7', // Sky blue
    bgLight: 'bg-sky-50 text-sky-700',
    bgDark: 'dark:bg-sky-950/40 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-700',
    icon: Shield
  },
  clarity: {
    label: 'Clarity & Focus',
    color: '#0d9488', // Teal
    bgLight: 'bg-teal-50 text-teal-700',
    bgDark: 'dark:bg-teal-950/40 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
    icon: Brain
  },
  gratitude: {
    label: 'Gratitude & Warmth',
    color: '#d97706', // Amber
    bgLight: 'bg-amber-50 text-amber-700',
    bgDark: 'dark:bg-amber-950/40 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    icon: Heart
  },
  courage: {
    label: 'Courage & Strength',
    color: '#dc2626', // Coral red
    bgLight: 'bg-rose-50 text-rose-700',
    bgDark: 'dark:bg-rose-950/40 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700',
    icon: Sun
  },
  growth: {
    label: 'Growth & Evolution',
    color: '#16a34a', // Emerald
    bgLight: 'bg-emerald-50 text-emerald-700',
    bgDark: 'dark:bg-emerald-950/40 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: Sparkles
  },
  anxious: {
    label: 'Tension & Release',
    color: '#9333ea', // Purple
    bgLight: 'bg-purple-50 text-purple-700',
    bgDark: 'dark:bg-purple-950/40 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    icon: Activity
  },
  reflective: {
    label: 'Deep Contemplation',
    color: '#4f46e5', // Indigo
    bgLight: 'bg-indigo-50 text-indigo-700',
    bgDark: 'dark:bg-indigo-950/40 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
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
    return Object.entries(counts).map(([mood, count]) => ({
      mood: mood as SanctuaryMood,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }, [interactions]);

  const filteredInteractions = useMemo(() => {
    if (activeMoodFilter === 'all') return interactions;
    return interactions.filter((item) => (item.mood || 'reflective') === activeMoodFilter);
  }, [interactions, activeMoodFilter]);

  if (!isOpen) return null;

  return (
    <div id="resonance-map-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        id="resonance-map-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800 bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold font-serif tracking-tight text-white flex items-center gap-2">
                Echoes of Mind: Emotional Topology
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Resonance Map
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                A living constellation of your thoughts, emotional undertones, and mental landmarks
              </p>
            </div>
          </div>
          <button
            id="resonance-map-close-button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Distribution Summary Ribbon */}
        <div className="px-6 py-3 border-b border-stone-800 bg-stone-900/50 overflow-x-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMoodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeMoodFilter === 'all'
                ? 'bg-stone-100 text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-950/60 text-indigo-200'
                    : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <Icon className="w-3 h-3" />
                <span>{cfg.label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-60 font-mono">
                  {item.percentage}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Canvas / Grid Area */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Interactive Topology Constellation Preview (2 Cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="relative rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 p-6 min-h-[340px] flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Background ambient grid ripples */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <span className="text-xs font-mono text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Emotional Resonance Field
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  Showing {filteredInteractions.length} nodes
                </span>
              </div>

              {/* Plotted Constellation Nodes */}
              {filteredInteractions.length === 0 ? (
                <div className="text-center py-16 text-stone-500 text-sm">
                  No reflection nodes recorded in this emotional realm yet.
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 gap-3 my-4">
                  {filteredInteractions.slice(0, 16).map((interaction, idx) => {
                    const mood = (interaction.mood || 'reflective') as SanctuaryMood;
                    const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.reflective;
                    const isSelected = selectedNode?.id === interaction.id;

                    return (
                      <motion.button
                        key={interaction.id || idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedNode(interaction)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'border-indigo-400 ring-2 ring-indigo-500/30 bg-stone-800'
                            : 'border-stone-800 bg-stone-900/80 hover:border-stone-700'
                        }`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mb-2 group-hover:animate-ping"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <p className="text-xs font-medium text-stone-200 line-clamp-2 mb-1">
                          {interaction.summary || interaction.prompt.slice(0, 40)}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono">
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

              <div className="relative z-10 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-800/80">
                <span>Select any node to inspect the emotional echo</span>
                <span>432Hz Harmonic Grid</span>
              </div>
            </div>

            {/* Emotional Balance Spectrum Bar */}
            <div className="p-4 rounded-2xl border border-stone-800 bg-stone-950/60 space-y-2">
              <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
                Harmonic Mood Spectrum
              </span>
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-stone-800">
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

          {/* Node Inspector Sidebar (1 Col) */}
          <div className="border border-stone-800 rounded-2xl p-5 bg-stone-950/40 flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Node Details
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
                  <h4 className="text-xs font-semibold text-stone-400 mb-1">USER REFLECTION:</h4>
                  <p className="text-xs text-stone-200 bg-stone-900/80 p-3 rounded-xl border border-stone-800/80 italic">
                    "{selectedNode.prompt}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-stone-400 mb-1">SANCTUARY INSIGHT:</h4>
                  <p className="text-xs text-stone-300 bg-stone-900/80 p-3 rounded-xl border border-stone-800/80 line-clamp-6">
                    {selectedNode.response}
                  </p>
                </div>

                {selectedNode.location && (
                  <div className="text-[11px] text-stone-400 flex items-center gap-1.5 bg-stone-900/40 p-2 rounded-lg border border-stone-800">
                    <Compass className="w-3.5 h-3.5 text-amber-500" />
                    <span>Location: {selectedNode.location.placeName || 'Sanctuary Space'}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectInteraction(selectedNode);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Jump to this Dialogue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-stone-500 space-y-2">
                <Compass className="w-8 h-8 mx-auto text-stone-600" />
                <p className="text-xs">Click any reflection node on the map to inspect its resonance</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
