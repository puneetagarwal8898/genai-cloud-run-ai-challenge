import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Heart,
  Compass,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HelpCircle,
  Feather
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the difference between a "Sanctuary" and a "Journal"?',
    answer:
      'Think of your Sanctuary as your quiet, peaceful home—the soothing colors you choose, the gentle ambient sounds, and the tranquil locations in nature where you feel grounded. Your Journal is what you write while resting in that sanctuary: your personal entries, honest thoughts, and reflections.'
  },
  {
    question: 'Are my journal entries private?',
    answer:
      'Yes, completely. Your journal entries belong solely to you. We do not sell your personal reflections, use them for public advertising, or share them with third parties. You can download a copy or delete your account and all its data at any time.'
  },
  {
    question: 'How does the Time Capsule work?',
    answer:
      'A Time Capsule allows you to seal a personal letter or reflection away for a chosen period (such as 1 week, 1 month, 3 months, or 1 year). Until the unlock date arrives, the letter stays safely sealed in your vault. When you open it, you can reflect on how far you have come and see how much your perspective has grown.'
  },
  {
    question: 'What are "Echoes" or the "Emotional Resonance Map"?',
    answer:
      'Echoes is a visual sky map of your thoughts. Each thought is placed like a gentle star based on how you felt when writing (like Calm, Gratitude, or Courage). Lines connect thoughts with similar feelings, helping you notice positive patterns and emotional clarity over time.'
  },
  {
    question: 'Can I add a peaceful place to my entries?',
    answer:
      'Yes! Under Peaceful Places, you can pin a special spot—like a favorite park, quiet cafe, or beach—where you wrote your reflection. It helps you remember the atmosphere where you found clarity.'
  },
  {
    question: 'What does the calming sound (432Hz) do?',
    answer:
      'When listening to audio narrations of your reflections, a soft, subtle background tone tuned to 432Hz gently plays. Many people find this gentle frequency helps relax the mind, slow down racing thoughts, and reduce screen fatigue.'
  },
  {
    question: 'Can I download or back up my journals?',
    answer:
      'Yes! Use the Export button at the top of your journal to download your entire reflection history as a tidy text document onto your computer or phone.'
  }
];

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacy,
  onOpenTerms
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
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
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)'
              }}
            >
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                  About ReflectAI
                </h2>
                <InfoTooltip text="Learn how ReflectAI works, explore the meaning behind each feature, and browse common questions." />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Your calm, personal sanctuary for everyday reflection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close About window"
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm leading-relaxed">
          {/* Mission & Purpose */}
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h3
              className="text-sm font-semibold flex items-center gap-2 mb-2"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              What is ReflectAI?
            </h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-xs sm:text-sm">
              ReflectAI is designed to give you a quiet, uncluttered breath in a noisy world.
              It is your private space to untangle your thoughts, celebrate small daily wins,
              and gain calm perspective without judgment or pressure.
            </p>
          </div>

          {/* Simple Explanation: Journal vs. Sanctuary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Compass className="w-3.5 h-3.5" />
                Understanding Sanctuary & Journal
              </h3>
              <InfoTooltip text="How your quiet atmosphere (Sanctuary) and your written thoughts (Journal) come together." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className="p-3.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 font-medium mb-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Your Journal
                </div>
                <p className="text-xs leading-normal" style={{ color: 'var(--text-secondary)' }}>
                  Your entries, raw thoughts, questions, and reflections. This is the personal content you write or speak each day.
                </p>
              </div>

              <div
                className="p-3.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 font-medium mb-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  <Heart className="w-4 h-4 text-emerald-500" />
                  Your Sanctuary
                </div>
                <p className="text-xs leading-normal" style={{ color: 'var(--text-secondary)' }}>
                  The peaceful environment you create—your soothing theme, daytime or evening mode, calming background hum, and favorite locations in nature.
                </p>
              </div>
            </div>
          </div>

          {/* Key Tools Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              Helpful Features At A Glance
            </h3>

            <div className="space-y-2 text-xs">
              <div
                className="p-3 rounded-lg border flex items-start gap-2.5"
                style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-color)' }}
              >
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Time Capsule: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>Seal a letter to your future self for 7, 30, 90, or 365 days. When unlocked, celebrate how much you have grown.</span>
                </div>
              </div>

              <div
                className="p-3 rounded-lg border flex items-start gap-2.5"
                style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-color)' }}
              >
                <Compass className="w-4 h-4 mt-0.5 shrink-0 text-cyan-500" />
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Echoes of Mind: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>See your thoughts arranged like gentle stars across emotional orbits (Calm, Clarity, Gratitude, Courage).</span>
                </div>
              </div>

              <div
                className="p-3 rounded-lg border flex items-start gap-2.5"
                style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-color)' }}
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Peaceful Locations: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>Tag a calming place in the world where you wrote or reflected—like a favorite forest, beach, or quiet room.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable FAQs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </h3>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Click to expand
              </span>
            </div>

            <div className="space-y-2">
              {FAQ_ITEMS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border overflow-hidden transition"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-medium transition cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 shrink-0 opacity-60" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
                      )}
                    </button>

                    {isOpen && (
                      <div
                        className="px-4 pb-3.5 pt-1 text-xs sm:text-sm border-t leading-relaxed animate-in fade-in duration-150"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-card)'
                        }}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with Privacy and Terms links */}
        <div
          className="px-5 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center gap-3">
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="underline hover:opacity-100 transition cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                Privacy Policy
              </button>
            )}
            <span style={{ color: 'var(--border-color)' }}>&bull;</span>
            {onOpenTerms && (
              <button
                type="button"
                onClick={onOpenTerms}
                className="underline hover:opacity-100 transition cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                Terms & Conditions
              </button>
            )}
          </div>

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
