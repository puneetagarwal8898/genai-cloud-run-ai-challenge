import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  LogOut,
  Send,
  BookOpen,
  Trash2,
  Calendar,
  Layers,
  MessageSquare,
  Compass,
  Lightbulb,
  FileText,
  AlertCircle,
  RefreshCw,
  Clock,
  Shield,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Lock,
  FlaskConical,
  Mail,
  Sliders,
  MapPin,
  HelpCircle,
  Wand2,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { JournalInteraction, ReflectionMode, SanctuaryLocation, SanctuaryMood } from '../types';
import {
  saveJournalInteraction,
  fetchUserInteractions,
  deleteUserInteraction
} from '../services/journalService';
import { ThemeSelector } from './ThemeSelector';
import { SettingsModal } from './SettingsModal';
import { ResonanceMapModal } from './ResonanceMapModal';
import { TimeCapsuleModal } from './TimeCapsuleModal';
import { LocationSanctuaryModal } from './LocationSanctuaryModal';
import { AboutModal } from './AboutModal';
import { LegalModal } from './LegalModal';
import { AudioNarrationPlayer } from './AudioNarrationPlayer';
import { SanctuaryVoiceInput } from './SanctuaryVoiceInput';
import { InfoTooltip } from './InfoTooltip';
import { ResponsiveIconButton } from './ResponsiveIconButton';

// Thoughtful, joyful reflections while the AI is reflecting
const THINKING_PHRASES = [
  "Weaving clarity and quiet wisdom into your words...",
  "Connecting the dots in your reflection...",
  "Synthesizing mindful perspectives for you...",
  "Uncovering the deeper essence of your thought...",
  "Brewing fresh ideas and constructive angles...",
  "Gathering gentle questions and insights..."
];

export const Dashboard: React.FC = () => {
  const {
    user,
    userProfile,
    signOut,
    resendFirebaseVerificationEmail,
    reloadUserVerificationStatus
  } = useAuth();
  const { appEnv, setAppEnv, isProductionLocked } = useApp();

  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Email verification banner state
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false);

  // Input states
  const [title, setTitle] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Suggested follow-up prompts
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Rotating thought phrase index
  const [thinkingIndex, setThinkingIndex] = useState<number>(0);

  // Multi-turn conversation trail for active reflection
  const [conversationTrail, setConversationTrail] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);

  // Standout Feature Modals & Staging
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showResonanceMap, setShowResonanceMap] = useState<boolean>(false);
  const [showTimeCapsule, setShowTimeCapsule] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy');
  const [navigatedFromSettings, setNavigatedFromSettings] = useState<boolean>(false);
  const [stagedLocation, setStagedLocation] = useState<SanctuaryLocation | null>(null);
  const [showMobileEnhancements, setShowMobileEnhancements] = useState<boolean>(false);
  const mobileEnhancementsRef = useRef<HTMLDivElement | null>(null);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState<boolean>(false);
  const mobileProfileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close mobile profile dropdown menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        mobileProfileMenuRef.current &&
        !mobileProfileMenuRef.current.contains(e.target as Node)
      ) {
        setShowMobileProfileMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileProfileMenu) {
        setShowMobileProfileMenu(false);
      }
    };
    if (showMobileProfileMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMobileProfileMenu]);

  // Close mobile enhancements menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        mobileEnhancementsRef.current &&
        !mobileEnhancementsRef.current.contains(e.target as Node)
      ) {
        setShowMobileEnhancements(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileEnhancements) {
        setShowMobileEnhancements(false);
      }
    };
    if (showMobileEnhancements) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMobileEnhancements]);

  // Email verification gate: email auth accounts require emailVerified: true to converse
  const isEmailUnverified = userProfile?.authProvider === 'email' && !userProfile?.emailVerified;

  // Responsive UI state: Hide button labels synchronously across the cluster if space is constrained or text doesn't fit
  const [showModeLabels, setShowModeLabels] = useState<boolean>(true);
  const [showHeaderNavLabels, setShowHeaderNavLabels] = useState<boolean>(true);
  const [showComposerActionLabels, setShowComposerActionLabels] = useState<boolean>(true);
  const modeBarContainerRef = useRef<HTMLDivElement | null>(null);
  const headerNavContainerRef = useRef<HTMLDivElement | null>(null);
  const composerActionsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-adjust layout & responsiveness: monitor container widths and font-scaling
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    // Observe Reflection Modes Bar container
    const modeObserver = new ResizeObserver(() => {
      if (modeBarContainerRef.current) {
        // Measure whether the container is cramped or if font size is enlarged.
        // 4 mode buttons with full text take ~420px to render comfortably without any clipping.
        // If parent container width is under 440px, gracefully collapse ALL mode buttons to icons only.
        const containerWidth = modeBarContainerRef.current.clientWidth;
        setShowModeLabels(containerWidth >= 440);
      }
    });

    if (modeBarContainerRef.current) {
      modeObserver.observe(modeBarContainerRef.current);
    }

    // Observe Desktop Header Nav container
    const headerObserver = new ResizeObserver(() => {
      if (headerNavContainerRef.current) {
        const containerWidth = headerNavContainerRef.current.clientWidth;
        // 4 nav buttons with text + tooltips take ~500px at default font size
        setShowHeaderNavLabels(containerWidth >= 500);
      }
    });

    if (headerNavContainerRef.current) {
      headerObserver.observe(headerNavContainerRef.current);
    }

    // Observe Composer Actions container (Mic, Tag Place, Time Capsule)
    const composerActionsObserver = new ResizeObserver(() => {
      if (composerActionsContainerRef.current) {
        const containerWidth = composerActionsContainerRef.current.clientWidth;
        // When space is constrained (under 280px), synchronize collapsing both buttons to icons only
        setShowComposerActionLabels(containerWidth >= 280);
      }
    });

    if (composerActionsContainerRef.current) {
      composerActionsObserver.observe(composerActionsContainerRef.current);
    }

    return () => {
      modeObserver.disconnect();
      headerObserver.disconnect();
      composerActionsObserver.disconnect();
    };
  }, []);

  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.uid || userProfile?.uid || '';

  // Handle Escape key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVerifyModal) setShowVerifyModal(false);
        if (showLocationModal) setShowLocationModal(false);
        if (showTimeCapsule) setShowTimeCapsule(false);
        if (showResonanceMap) setShowResonanceMap(false);
        if (showSettingsModal) setShowSettingsModal(false);
        if (showAboutModal) setShowAboutModal(false);
        if (showLegalModal) setShowLegalModal(false);
        if (showMobileProfileMenu) setShowMobileProfileMenu(false);
        if (deletingEntryId) setDeletingEntryId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVerifyModal, showLocationModal, showTimeCapsule, showResonanceMap, showSettingsModal, showAboutModal, showLegalModal, showMobileProfileMenu, deletingEntryId]);
  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setThinkingIndex(prev => (prev + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Scroll to bottom when trail updates or during thinking
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationTrail, isSubmitting, suggestedPrompts]);

  // Load user's isolated interactions on mount
  useEffect(() => {
    if (!currentUserId) return;
    loadHistory();
  }, [currentUserId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await fetchUserInteractions(currentUserId);
      setInteractions(list);
      if (list.length > 0 && !activeInteractionId) {
        selectInteraction(list[0]);
      }
    } catch (err: any) {
      console.error("Failed to load interactions:", err);
      setActionError("Failed to fetch journal history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectInteraction = (item: JournalInteraction) => {
    setActiveInteractionId(item.id);
    setTitle(item.title);
    setMode(item.mode);
    setSuggestedPrompts(item.suggestedPrompts || getDefaultSuggestions(item.mode));
    if (item.trail && Array.isArray(item.trail) && item.trail.length > 0) {
      setConversationTrail(item.trail);
    } else {
      setConversationTrail([
        { role: 'user', text: item.prompt },
        { role: 'model', text: item.geminiResponse }
      ]);
    }
    setActionError(null);
  };

  const startNewEntry = () => {
    setActiveInteractionId(null);
    setTitle('');
    setPrompt('');
    setMode('reflection');
    setConversationTrail([]);
    setSuggestedPrompts([]);
    setActionError(null);
    setStatusMessage(null);
  };

  const getDefaultSuggestions = (m: ReflectionMode): string[] => {
    switch (m) {
      case 'brainstorm':
        return [
          "Which of these ideas has the lowest friction to start?",
          "How can we turn this into a 3-step action plan?",
          "What is an unconventional alternative to explore?"
        ];
      case 'summary':
        return [
          "What is the single most important takeaway here?",
          "How does this align with my deeper priorities?",
          "What mindset shift will help anchor this?"
        ];
      case 'advice':
        return [
          "Can you break down step one in more detail?",
          "What potential obstacles should I prepare for?",
          "How can I maintain calm consistency with this?"
        ];
      default:
        return [
          "What underlying feeling is driving this thought?",
          "How might I view this situation with more self-compassion?",
          "What would clarity look like one week from today?"
        ];
    }
  };

  const sendPromptText = async (textToSend: string) => {
    const userEntryText = textToSend.trim();
    if (!userEntryText || isSubmitting) return;

    if (isEmailUnverified) {
      setShowVerifyModal(true);
      return;
    }

    // Erase the prompt from textbox immediately
    setPrompt('');
    // Clear existing suggested prompts immediately so they disappear
    setSuggestedPrompts([]);
    setIsSubmitting(true);
    setActionError(null);

    const entryTitle = title.trim() || (userEntryText.slice(0, 36) + (userEntryText.length > 36 ? '...' : ''));
    if (!title.trim()) {
      setTitle(entryTitle);
    }

    const interactionId = activeInteractionId || ('entry_' + Date.now());
    const isNewChat = !activeInteractionId;
    const now = new Date().toISOString();

    // If starting a brand-new chat, immediately animate and show on the left panel
    if (isNewChat) {
      setActiveInteractionId(interactionId);
      const placeholderInteraction: JournalInteraction = {
        id: interactionId,
        userId: currentUserId,
        title: entryTitle,
        prompt: userEntryText,
        geminiResponse: '',
        summary: userEntryText.slice(0, 70),
        mode,
        createdAt: now,
        updatedAt: now
      };
      setInteractions(prev => [placeholderInteraction, ...prev]);
    }

    // Append user's turn to conversation trail immediately
    const updatedTrailWithUser = [
      ...conversationTrail,
      { role: 'user' as const, text: userEntryText }
    ];
    setConversationTrail(updatedTrailWithUser);

    try {
      // Call server-side API proxy (keeps GEMINI_API_KEY secure)
      const res = await fetch('/api/gemini/converse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userEntryText,
          mode,
          title: entryTitle,
          history: conversationTrail
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const geminiResponseText = data.response;
      const summaryText = data.summary;
      const newSuggestedPrompts = Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0
        ? data.suggestedPrompts
        : getDefaultSuggestions(mode);

      const finalTrail = [
        ...updatedTrailWithUser,
        { role: 'model' as const, text: geminiResponseText }
      ];

      // 1. Immediately update conversation trail with the new response
      setConversationTrail(finalTrail);
      // 2. Immediately present the fresh set of suggested follow-up prompts
      setSuggestedPrompts(newSuggestedPrompts);
      // 3. Immediately clear isSubmitting so the thinking spinner disappears the very instant response arrives!
      setIsSubmitting(false);

      // Create full interaction record with standout feature attributes
      const detectedMood = (data.mood as SanctuaryMood) || 'reflective';
      const existingItem = interactions.find(i => i.id === interactionId);
      const interactionLocation = stagedLocation || existingItem?.location;
      const existingTimeCapsule = existingItem?.timeCapsule;

      const fullInteraction: JournalInteraction = {
        id: interactionId,
        userId: currentUserId,
        title: entryTitle,
        prompt: userEntryText,
        geminiResponse: geminiResponseText,
        summary: summaryText,
        mode,
        mood: detectedMood,
        location: interactionLocation,
        timeCapsule: existingTimeCapsule,
        suggestedPrompts: newSuggestedPrompts,
        trail: finalTrail,
        createdAt: isNewChat ? now : (existingItem?.createdAt || now),
        updatedAt: now
      };

      // Reset staged location once reflection is preserved
      setStagedLocation(null);

      // Update state list
      setInteractions(prev => {
        const existingIdx = prev.findIndex(i => i.id === interactionId);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = fullInteraction;
          return copy;
        } else {
          return [fullInteraction, ...prev];
        }
      });

      // Persist to user-isolated storage without blocking UI
      saveJournalInteraction(currentUserId, fullInteraction).catch(err => {
        console.warn("Storage persistence note:", err);
      });

      // Friendly subtle status
      setStatusMessage("Saved to your private journal");
      setTimeout(() => setStatusMessage(null), 3500);

    } catch (err: any) {
      console.error("Journal reflection error:", err);
      let errMsg = err.message || "Unable to reach reflection partner. Please try again.";
      // Clean up raw Google API JSON if bubbled up
      if (typeof errMsg === 'string' && errMsg.includes('"message":')) {
        try {
          const parsed = JSON.parse(errMsg);
          if (parsed?.error?.message) {
            errMsg = parsed.error.message;
          }
        } catch (e) {
          // ignore
        }
      }
      if (errMsg.includes("Method doesn't allow unregistered callers") || errMsg.includes("GEMINI_API_KEY")) {
        errMsg = "Gemini API key is not configured on your Cloud Run service. Please set GEMINI_API_KEY in Cloud Run environment variables.";
      }
      setActionError(errMsg);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmailUnverified) {
      setShowVerifyModal(true);
      return;
    }
    sendPromptText(prompt);
  };

  const handleSuggestedPromptClick = (suggestedText: string) => {
    if (isEmailUnverified) {
      setShowVerifyModal(true);
      return;
    }
    // Clear suggested prompts immediately so other suggestions vanish
    setSuggestedPrompts([]);
    sendPromptText(suggestedText);
  };

  const getDynamicSidebarTitle = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Day";
    if (hour >= 5 && hour < 12) timeGreeting = "Morning";
    else if (hour >= 12 && hour < 17) timeGreeting = "Afternoon";
    else if (hour >= 17 && hour < 22) timeGreeting = "Evening";
    else timeGreeting = "Night";

    const count = interactions.length;
    if (count === 0) return `${timeGreeting} Sanctuary`;
    if (count === 1) return `${timeGreeting} Reflection`;
    return `${timeGreeting} Reflections`;
  };

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingEntryId(id);
  };

  const confirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteUserInteraction(currentUserId, id);
      setInteractions(prev => prev.filter(i => i.id !== id));
      if (activeInteractionId === id) {
        startNewEntry();
      }
      setDeletingEntryId(null);
      setStatusMessage("Reflection deleted");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error("Delete reflection failed:", err);
      setActionError("Failed to delete entry from private notebook.");
      setDeletingEntryId(null);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingEntryId(null);
  };

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    setVerificationNotice(null);
    try {
      await resendFirebaseVerificationEmail();
      setVerificationNotice('A fresh verification link was sent from Google Firebase to your inbox.');
      setTimeout(() => setVerificationNotice(null), 6000);
    } catch (err: any) {
      setVerificationNotice(err.message || 'Failed to dispatch verification email.');
      setTimeout(() => setVerificationNotice(null), 6000);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingEmail(true);
    setVerificationNotice(null);
    try {
      const isVerified = await reloadUserVerificationStatus();
      if (isVerified) {
        setVerificationNotice('Email verified successfully! Your account is now fully verified.');
        setTimeout(() => setVerificationNotice(null), 5000);
      } else {
        setVerificationNotice('Email is not verified yet. Please click the link in your email, then click this button again.');
        setTimeout(() => setVerificationNotice(null), 7000);
      }
    } catch (err: any) {
      setVerificationNotice('Could not check status. Please try again.');
      setTimeout(() => setVerificationNotice(null), 5000);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const getModeIcon = (m: ReflectionMode) => {
    switch (m) {
      case 'reflection': return <Compass className="w-3.5 h-3.5" />;
      case 'brainstorm': return <Lightbulb className="w-3.5 h-3.5" />;
      case 'summary': return <FileText className="w-3.5 h-3.5" />;
      case 'advice': return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col font-sans selection:bg-[var(--accent-light)]"
      style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)' }}
    >
      {/* Top Application Bar */}
      <header
        className="backdrop-blur-md border-b px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between sticky top-0 z-20 transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              boxShadow: '0 0 15px var(--accent-glow)'
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight flex items-center gap-1.5 sm:gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>ReflectAI</span>
              {appEnv === 'production' || isProductionLocked ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                  title="Private Account • Safe & Protected"
                >
                  <Lock className="w-2.5 h-2.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Private & Safe</span>
                  <InfoTooltip
                    asSpan
                    size="xs"
                    text="Your private session is isolated. Reflections are encrypted and never shared with unauthorized parties."
                  />
                </span>
              ) : (
                <button
                  id="dash-toggle-env-btn"
                  type="button"
                  onClick={() => setAppEnv('production')}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-85 transition"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.3)'
                  }}
                  title="Currently in Preview Mode. Click to switch to Production."
                >
                  <FlaskConical className="w-2.5 h-2.5 shrink-0" />
                  <span className="hidden sm:inline">Preview Mode</span>
                  <InfoTooltip
                    asSpan
                    size="xs"
                    text="Currently in Preview Mode for testing. Click to switch to live Production mode."
                  />
                </button>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4">
          {/* Quick theme selector and light/dark toggle (visible on all screens) */}
          <ThemeSelector />

          {/* Desktop Standout Features Nav Cluster (hidden on mobile / small screens) */}
          <div
            ref={headerNavContainerRef}
            className="hidden lg:flex items-center gap-2 pl-1.5 border-l"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <ResponsiveIconButton
              id="open-resonance-map-btn"
              icon={<Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              label="Thought Map"
              description="See a sky map of your thoughts mapped by reflection moods"
              showText={showHeaderNavLabels}
              onClick={() => setShowResonanceMap(true)}
              ariaLabel="Thought Map - Echoes of Mind"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-90"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              badge={
                showHeaderNavLabels ? (
                  <InfoTooltip
                    asSpan
                    size="sm"
                    text="See a sky map of your thoughts mapped by how you felt when writing (Calm, Gratitude, Clarity, etc.)."
                  />
                ) : undefined
              }
            />

            <ResponsiveIconButton
              id="open-time-capsule-btn"
              icon={<Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              label="Time Capsule"
              description="Lock letters to your future self and re-open later"
              showText={showHeaderNavLabels}
              onClick={() => setShowTimeCapsule(true)}
              ariaLabel="Time Capsule - Letters to your future self"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-90"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              badge={
                showHeaderNavLabels ? (
                  <InfoTooltip
                    asSpan
                    size="sm"
                    text="Lock away a journal entry to open in 7, 30, 90, or 365 days, and discover how you've grown."
                  />
                ) : undefined
              }
            />

            <ResponsiveIconButton
              id="open-location-sanctuary-btn"
              icon={<MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              label="Peaceful Places"
              description="Attach real-world tranquil spots to reflections"
              showText={showHeaderNavLabels}
              onClick={() => setShowLocationModal(true)}
              ariaLabel="Peaceful Places - Tag a location"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-90"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              badge={
                showHeaderNavLabels ? (
                  <InfoTooltip
                    asSpan
                    size="sm"
                    text="Attach a real-world tranquil spot where you wrote your reflection, like a quiet park, favorite cafe, or porch."
                  />
                ) : undefined
              }
            />

            <ResponsiveIconButton
              id="open-about-modal-header-btn"
              icon={<HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              label="About"
              description="Learn more about Sanctuary, security, and FAQ"
              showText={showHeaderNavLabels}
              onClick={() => {
                setNavigatedFromSettings(false);
                setShowAboutModal(true);
              }}
              ariaLabel="About Sanctuary & FAQ"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-90"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              badge={
                showHeaderNavLabels ? (
                  <InfoTooltip
                    asSpan
                    size="sm"
                    text="Learn more about Sanctuary, security safeguards, zero-knowledge architecture, and frequently asked questions."
                  />
                ) : undefined
              }
            />
          </div>

          {/* Mobile Enhancements Dropdown Menu (Bit 1 for Mobile: 1 icon opening menu with all features) */}
          <div className="relative lg:hidden" ref={mobileEnhancementsRef}>
            <button
              id="mobile-enhancements-btn"
              type="button"
              aria-label="Sanctuary Enhancements & Tools"
              aria-expanded={showMobileEnhancements}
              aria-haspopup="menu"
              title="Enhancements & Tools"
              onClick={() => setShowMobileEnhancements(!showMobileEnhancements)}
              className="p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: showMobileEnhancements ? 'var(--accent-light)' : 'var(--bg-input)',
                borderColor: showMobileEnhancements ? 'var(--accent)' : 'var(--border-color)',
                color: showMobileEnhancements ? 'var(--accent)' : 'var(--text-primary)'
              }}
            >
              <Wand2 className="w-4 h-4 text-amber-500" />
            </button>

            {showMobileEnhancements && (
              <div
                role="menu"
                aria-label="Sanctuary Features"
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
                }}
              >
                <div className="px-2 py-1.5 mb-1 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider font-mono text-amber-500">
                    Enhancements & Tools
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                    Sanctuary
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileEnhancements(false);
                      setShowResonanceMap(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Thought Map</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Sky map of your reflection moods
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileEnhancements(false);
                      setShowTimeCapsule(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Time Capsule</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Lock letters to your future self
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileEnhancements(false);
                      setShowLocationModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Peaceful Places</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Attach real tranquil locations
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileEnhancements(false);
                      setNavigatedFromSettings(false);
                      setShowAboutModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">About & FAQ</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Safeguards & zero-knowledge
                      </p>
                    </div>
                  </button>

                  <div className="pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowMobileEnhancements(false);
                        startNewEntry();
                      }}
                      className="w-full text-center py-2 px-3 rounded-xl text-xs font-medium text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ New Reflection</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User profile identifier (Mobile: clickable icon button showing avatar only; Desktop: full profile info + direct buttons) */}
          <div className="relative shrink-0" ref={mobileProfileMenuRef}>
            <button
              id="mobile-profile-menu-btn"
              type="button"
              aria-label={`Profile menu: ${userProfile?.displayName || "Reflector"}`}
              aria-haspopup="menu"
              aria-expanded={showMobileProfileMenu}
              onClick={() => setShowMobileProfileMenu(!showMobileProfileMenu)}
              className="flex md:hidden items-center justify-center p-1 rounded-xl border transition cursor-pointer hover:opacity-90 active:scale-95"
              style={{
                borderColor: showMobileProfileMenu ? 'var(--accent)' : 'var(--border-color)',
                backgroundColor: showMobileProfileMenu ? 'var(--accent-light)' : 'transparent'
              }}
              title={`${userProfile?.displayName || "Reflector"} - Account options`}
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || "User"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border shrink-0"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* Mobile Profile Dropdown Menu - clamped safely with fixed/absolute right-0 to prevent any clipping */}
            {showMobileProfileMenu && (
              <div
                role="menu"
                aria-label="Profile and Session Menu"
                className="md:hidden absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] rounded-2xl border shadow-2xl p-2.5 z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
                }}
              >
                {/* Person's name and email clearly displayed inside the menu */}
                <div className="px-3 py-2.5 mb-1.5 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-color)' }}>
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName || "User"}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border shrink-0"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 font-medium"
                      style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {userProfile?.displayName || "Reflector"}
                    </p>
                    <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {userProfile?.email || "Private Session"}
                    </p>
                    {userProfile?.emailVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium mt-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> Verified Account
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    id="mobile-dropdown-settings-btn"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileProfileMenu(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-500/15 flex items-center justify-center shrink-0">
                      <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Settings & Preferences</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Account, theme, and data
                      </p>
                    </div>
                  </button>

                  <button
                    id="mobile-dropdown-about-btn"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileProfileMenu(false);
                      setShowAboutModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-500/15 flex items-center justify-center shrink-0">
                      <Compass className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">About & FAQ</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Sanctuary philosophy & guidance
                      </p>
                    </div>
                  </button>

                  <button
                    id="mobile-dropdown-legal-btn"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLegalModalTab('privacy');
                      setShowMobileProfileMenu(false);
                      setShowLegalModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-stone-500/10"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-500/15 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Privacy & Terms</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        Your data security & rights
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />

                  <button
                    id="mobile-dropdown-signout-btn"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowMobileProfileMenu(false);
                      signOut();
                    }}
                    className="w-full text-left p-2 rounded-xl transition flex items-center gap-2.5 cursor-pointer hover:bg-red-500/10 text-red-400"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-red-400">Log Out</p>
                      <p className="text-[10px] text-red-400/80 truncate">
                        Sign out of private session
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop User Profile Display (md and above) */}
            <div
              className="hidden md:flex items-center gap-2.5 pl-2.5 border-l shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || "User"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border shrink-0"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-left max-w-[120px] lg:w-[130px] shrink-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    {userProfile?.displayName || "Reflector"}
                  </p>
                  {userProfile?.emailVerified && (
                    <span title="Verified Account" className="text-emerald-500 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Only: Settings Modal Trigger */}
          <button
            id="open-settings-modal-btn"
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Account Settings & Preferences"
            className="hidden md:inline-flex p-1.5 rounded-lg border transition cursor-pointer hover:opacity-85 shrink-0"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Desktop Only: Logout Button */}
          <button
            id="sign-out-btn"
            onClick={signOut}
            title="Sign out of private session"
            className="hidden md:inline-flex p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80 shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Email Verification Banner for unverified email users */}
      {userProfile?.authProvider === 'email' && !userProfile?.emailVerified && (
        <div
          id="email-verification-banner"
          className="border-b px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2.5 transition-colors"
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            borderColor: 'rgba(234, 179, 8, 0.25)',
            color: 'var(--text-primary)'
          }}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              Please verify your email (<strong>{userProfile.email}</strong>). We sent a confirmation link from Google Firebase to your inbox.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {verificationNotice && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hidden sm:inline">
                {verificationNotice}
              </span>
            )}
            <button
              id="resend-verification-email-btn"
              disabled={isResendingEmail}
              onClick={handleResendVerification}
              className="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              {isResendingEmail ? 'Sending...' : 'Resend Link'}
            </button>
            <button
              id="check-verification-status-btn"
              disabled={isCheckingEmail}
              onClick={handleCheckVerification}
              className="px-2.5 py-1 rounded-lg text-white text-[11px] font-medium transition cursor-pointer hover:opacity-90 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent)'
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingEmail ? 'animate-spin' : ''}`} />
              <span>{isCheckingEmail ? 'Checking...' : "I've Verified My Email"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row overflow-hidden p-3 sm:p-5 gap-3 sm:gap-5">
        {/* Left Sidebar: Entries & History with smooth Motion animation */}
        <aside
          className="w-full md:w-80 flex flex-col rounded-2xl border shadow-xl overflow-hidden shrink-0 h-[340px] md:h-auto transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div
            className="p-3.5 border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold tracking-tight capitalize" style={{ color: 'var(--text-primary)' }}>
                {getDynamicSidebarTitle()}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {interactions.length}
              </span>
            </div>

            <button
              id="new-entry-btn"
              type="button"
              onClick={startNewEntry}
              className="text-xs font-semibold text-white px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 active:scale-95 shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}
              title="Start a new reflection"
              aria-label="Start a new reflection"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Reflection</span>
            </button>
          </div>

          {/* Animated items list */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center h-36 gap-2" style={{ color: 'var(--text-muted)' }}>
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-xs">Loading your journal...</span>
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-10 px-4" style={{ color: 'var(--text-muted)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No reflections yet</p>
                <p className="text-[11px] leading-relaxed">
                  Write your first reflection below to explore your thoughts and gain clarity.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {interactions.map((item) => {
                  const isSelected = item.id === activeInteractionId;
                  const isDeleting = item.id === deletingEntryId;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -16, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -16, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {isDeleting ? (
                        <div
                          className="p-3 rounded-xl border flex flex-col gap-2 animate-in fade-in"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            borderColor: 'rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <span className="text-xs font-medium text-red-400">
                            Delete this reflection permanently?
                          </span>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              id={`cancel-delete-${item.id}`}
                              onClick={cancelDelete}
                              className="px-2 py-1 text-[11px] rounded-md border cursor-pointer hover:opacity-80 transition"
                              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                            >
                              Cancel
                            </button>
                            <button
                              id={`confirm-delete-${item.id}`}
                              onClick={(e) => confirmDelete(item.id, e)}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-red-600 text-white cursor-pointer hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          id={`entry-item-${item.id}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => selectInteraction(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              selectInteraction(item);
                            }
                          }}
                          className="group w-full text-left p-3 rounded-xl transition cursor-pointer flex flex-col gap-1 border select-none"
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                            borderColor: isSelected ? 'var(--accent)' : 'transparent'
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className="text-xs font-semibold truncate flex-1"
                              style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}
                            >
                              {item.title || "Untitled Reflection"}
                            </h3>
                            <button
                              id={`delete-entry-${item.id}`}
                              type="button"
                              onClick={(e) => requestDelete(item.id, e)}
                              title="Delete reflection permanently"
                              className="opacity-70 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition p-1 cursor-pointer rounded shrink-0"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] line-clamp-2 leading-tight" style={{ color: 'var(--text-muted)' }}>
                            {item.summary || item.prompt}
                          </p>

                          <div
                            className="flex items-center justify-between mt-1 text-[10px] pt-1.5 border-t"
                            style={{
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span
                              className="capitalize px-1.5 py-0.5 rounded text-[9px] font-mono"
                              style={{
                                backgroundColor: 'var(--bg-canvas)',
                                color: 'var(--accent)',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              {item.mode}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* User footer badge with meaningful stats */}
          <div
            className="p-3 border-t mt-auto"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="space-y-2">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <div className="overflow-hidden flex-1">
                  <p className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
                    Private & Personal Space
                  </p>
                  <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {interactions.length} {interactions.length === 1 ? 'reflection' : 'reflections'} saved
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="hover:underline opacity-80 hover:opacity-100 cursor-pointer"
                >
                  About & FAQ
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  className="hover:underline opacity-80 hover:opacity-100 cursor-pointer"
                >
                  Privacy & Terms
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Section: Journal Composer & Interactive Dialogue */}
        <main
          className="flex-1 flex flex-col rounded-2xl border shadow-xl overflow-hidden transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Top Active Bar */}
          <div
            className="p-3 sm:p-3.5 border-b flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                {activeInteractionId ? "Active Reflection" : "New Reflection"}
              </span>

              {/* Active Reflection contextual badges (Location & Time Capsule) */}
              {activeInteractionId && (() => {
                const activeItem = interactions.find(i => i.id === activeInteractionId);
                if (!activeItem) return null;
                return (
                  <div className="hidden sm:flex items-center gap-1.5">
                    {activeItem.location && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium"
                        style={{
                          backgroundColor: 'rgba(217, 119, 6, 0.08)',
                          borderColor: 'rgba(217, 119, 6, 0.3)',
                          color: '#d97706'
                        }}
                        title={`Written at ${activeItem.location.placeName}`}
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[120px]">{activeItem.location.placeName}</span>
                      </span>
                    )}
                    {activeItem.timeCapsule && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium"
                        style={{
                          backgroundColor: 'rgba(217, 119, 6, 0.08)',
                          borderColor: 'rgba(217, 119, 6, 0.3)',
                          color: '#d97706'
                        }}
                        title={`Time Capsule: ${activeItem.timeCapsule.isSealed ? 'Sealed until ' + new Date(activeItem.timeCapsule.unlocksAt).toLocaleDateString() : 'Unsealed'}`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{activeItem.timeCapsule.isSealed ? 'Capsule Sealed' : 'Capsule Unsealed'}</span>
                      </span>
                    )}
                  </div>
                );
              })()}

              {activeInteractionId && (
                <ResponsiveIconButton
                  id="delete-active-reflection-header-btn"
                  icon={<Trash2 className="w-3 h-3 text-red-400" />}
                  label="Delete"
                  description="Delete this reflection permanently"
                  showText={showModeLabels}
                  onClick={(e) => requestDelete(activeInteractionId, e)}
                  ariaLabel="Delete this reflection permanently"
                  className="px-2 py-0.5 rounded-lg border text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
                />
              )}
              {statusMessage && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded font-mono transition-opacity"
                  style={{
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)'
                  }}
                >
                  {statusMessage}
                </span>
              )}
            </div>

            {/* Reflection Modes Selector with dynamic auto-adjusting responsive labels */}
            <div
              ref={modeBarContainerRef}
              className="flex items-center gap-1 p-1 rounded-xl border shrink-0"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-color)'
              }}
            >
              {(['reflection', 'brainstorm', 'summary', 'advice'] as ReflectionMode[]).map(m => {
                const labelMap: Record<ReflectionMode, { label: string; desc: string }> = {
                  reflection: { label: 'Reflection', desc: 'Contemplative inquiry and mindful exploration' },
                  brainstorm: { label: 'Brainstorm', desc: 'Creative ideas and possibilities' },
                  summary: { label: 'Summary', desc: 'Distill core essence and main takeaways' },
                  advice: { label: 'Advice', desc: 'Actionable guidance and next steps' }
                };
                const info = labelMap[m];
                const isSelected = mode === m;

                return (
                  <ResponsiveIconButton
                    key={m}
                    id={`mode-btn-${m}`}
                    icon={getModeIcon(m)}
                    label={info.label}
                    description={info.desc}
                    showText={showModeLabels}
                    active={isSelected}
                    onClick={() => setMode(m)}
                    ariaLabel={`${info.label} Mode — ${info.desc}`}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    activeStyle={{
                      backgroundColor: 'var(--accent)',
                      color: '#ffffff',
                      boxShadow: '0 0 10px var(--accent-glow)'
                    }}
                    inactiveStyle={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Conversation & Reflection Trail */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {conversationTrail.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12" style={{ color: 'var(--text-muted)' }}>
                <div
                  className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sm"
                  style={{
                    backgroundColor: 'var(--accent-light)',
                    borderColor: 'var(--accent)',
                    boxShadow: '0 0 20px var(--accent-glow)'
                  }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  What's on your mind today?
                </h2>
                <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                  Write freely about an experience, a challenge, or a new idea. Receive thoughtful perspectives, ideas, or summaries, strictly isolated to your private account.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      setTitle("Reflecting on today's breakthrough");
                      setPrompt("I felt overwhelmed this morning by conflicting priorities, but stepping back and listing them by impact brought clarity. How can I sustain this mindset?");
                    }}
                    className="px-3 py-1.5 rounded-lg border text-[11px] transition cursor-pointer hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    &ldquo;Reflecting on today's breakthrough&rdquo;
                  </button>
                  <button
                    onClick={() => {
                      setMode('brainstorm');
                      setTitle("Ideas for a weekend reset");
                      setPrompt("I want to disconnect from screens this weekend and recharge. Give me 5 restorative, low-stress activity ideas.");
                    }}
                    className="px-3 py-1.5 rounded-lg border text-[11px] transition cursor-pointer hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    &ldquo;Ideas for a weekend reset&rdquo;
                  </button>
                </div>
              </div>
            ) : (
              conversationTrail
                .filter(msg => msg.text && msg.text.trim().length > 0)
                .map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center justify-between w-full max-w-2xl mb-1.5 gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      {msg.role === 'user' ? (
                        <>
                          <span>You</span>
                          <UserIcon className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                          <span style={{ color: 'var(--accent)' }}>ReflectAI &bull; Gentle Guide</span>
                        </>
                      )}
                    </div>

                    {msg.role === 'model' && (
                      <AudioNarrationPlayer
                        textToRead={msg.text}
                        voiceRate={userProfile?.preferences?.voiceRate || 0.95}
                        voicePitch={userProfile?.preferences?.voicePitch || 1.0}
                        ambientSoundEnabled={userProfile?.preferences?.ambientSound ?? true}
                      />
                    )}
                  </div>
                  <div
                    className={`max-w-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'p-4 sm:p-5 rounded-2xl rounded-tr-none border shadow-sm'
                        : 'p-5 sm:p-6 rounded-2xl rounded-tl-none border shadow-sm relative overflow-hidden'
                    }`}
                    style={
                      msg.role === 'user'
                        ? {
                            backgroundColor: 'var(--bg-card-elevated)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }
                        : {
                            backgroundColor: 'var(--accent-light)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }
                    }
                  >
                    {msg.role === 'model' && (
                      <div
                        className="absolute top-0 left-0 w-1 h-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {/* Exciting, joyful thinking state - completely disappears when response settles */}
            {isSubmitting && (
              <div className="flex flex-col items-start space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Reflecting with deep care...</span>
                </div>
                <div
                  className="p-4 sm:p-5 rounded-2xl rounded-tl-none border shadow-sm flex items-center gap-3.5 max-w-lg"
                  style={{
                    backgroundColor: 'var(--accent-light)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 animate-spin"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--accent)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide transition-all duration-300">
                      {THINKING_PHRASES[thinkingIndex]}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Distilling insights just for you...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Clickable suggested future prompts after AI finishes responding */}
            {!isSubmitting && suggestedPrompts.length > 0 && conversationTrail.length > 0 && (
              <div className="pt-2 animate-fadeIn space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                  <span>Explore deeper with a follow-up:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      id={`suggested-prompt-${sIdx}`}
                      onClick={() => handleSuggestedPromptClick(suggestion)}
                      className="group text-left px-3.5 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 cursor-pointer hover:shadow-md"
                      style={{
                        backgroundColor: 'var(--bg-card-elevated)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span className="text-[11px] flex-1 leading-snug">
                        {suggestion}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--accent)' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{actionError}</span>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>

          {/* Form Composer with immediate erase on send & Enter to submit */}
          <div
            className="border-t p-3 sm:p-4 transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          >
            {isEmailUnverified && (
              <div
                id="email-unverified-composer-notice"
                onClick={() => setShowVerifyModal(true)}
                className="mb-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition cursor-pointer hover:opacity-95"
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.09)',
                  borderColor: 'rgba(234, 179, 8, 0.28)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] sm:text-xs">
                    Conversing with ReflectAI requires email verification.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVerifyModal(true);
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold transition shrink-0 underline cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  Verify Now
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="relative group">
                <div
                  className="relative rounded-2xl p-3 border shadow-sm transition-all focus-within:border-[var(--accent)]"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <textarea
                    id="reflection-prompt-input"
                    rows={3}
                    placeholder={
                      isEmailUnverified
                        ? "Please verify your email to converse with ReflectAI... (Click to view verification details)"
                        : "Write your reflection here... Press Enter to send, Shift+Enter for a new line."
                    }
                    value={prompt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrompt(val);
                      // When the user starts typing their own message, hide suggested prompts immediately
                      if (val.trim().length > 0) {
                        setSuggestedPrompts([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    className="w-full text-sm bg-transparent border-0 focus:outline-none focus:ring-0 resize-none placeholder:opacity-50"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <div
                    className="flex flex-wrap items-center justify-between pt-2 border-t mt-1 gap-2"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div ref={composerActionsContainerRef} className="flex items-center gap-1.5 flex-wrap">
                      {/* Sanctuary Voice Input with live transcription */}
                      <SanctuaryVoiceInput
                        currentValue={prompt}
                        onTranscriptChange={(transcript) => setPrompt(transcript)}
                        disabled={isSubmitting || isEmailUnverified}
                      />

                      {/* Location-Aware Sanctuary Journey Tagger */}
                      <div className="inline-flex items-center">
                        <ResponsiveIconButton
                          id="tag-location-btn"
                          icon={<MapPin className="w-3.5 h-3.5 text-amber-500" />}
                          label={stagedLocation ? stagedLocation.placeName : 'Tag Place'}
                          description={stagedLocation ? `Location: ${stagedLocation.placeName}` : 'Tag a tranquil place where you wrote this reflection'}
                          showText={showComposerActionLabels}
                          active={!!stagedLocation}
                          onClick={() => setShowLocationModal(true)}
                          ariaLabel="Tag a tranquil place where you wrote this reflection"
                          className={`px-2.5 py-1.5 border text-xs font-medium ${stagedLocation ? 'rounded-l-xl rounded-r-none border-r-0' : 'rounded-xl'}`}
                          activeStyle={{
                            backgroundColor: 'rgba(217, 119, 6, 0.12)',
                            borderColor: '#d97706',
                            color: '#d97706'
                          }}
                          inactiveStyle={{
                            backgroundColor: 'var(--bg-card-elevated)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-muted)'
                          }}
                        />
                        {stagedLocation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStagedLocation(null);
                            }}
                            title="Remove tagged place"
                            aria-label="Remove tagged place"
                            className="px-1.5 py-1.5 rounded-r-xl border border-l-0 text-xs font-medium cursor-pointer transition hover:opacity-80"
                            style={{
                              backgroundColor: 'rgba(217, 119, 6, 0.12)',
                              borderColor: '#d97706',
                              color: '#d97706'
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Serenity Time Capsule Seal shortcut */}
                      <ResponsiveIconButton
                        id="capsule-active-btn"
                        icon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
                        label="Time Capsule"
                        description="Seal this entry in a Time Capsule to re-read in the future"
                        showText={showComposerActionLabels}
                        onClick={() => setShowTimeCapsule(true)}
                        ariaLabel="Seal this entry in a Time Capsule to re-read in the future"
                        className="px-2.5 py-1.5 rounded-xl border text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-muted)'
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[10px] hidden md:inline font-mono" style={{ color: 'var(--text-muted)' }}>
                        Enter to send &bull; Shift+Enter for new line
                      </span>
                      <button
                        id="submit-reflection-btn"
                        type="submit"
                        disabled={isSubmitting || !prompt.trim()}
                        className="px-4 py-1.5 rounded-xl text-xs font-medium text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
                        style={{
                          backgroundColor: 'var(--accent)',
                          boxShadow: '0 0 12px var(--accent-glow)'
                        }}
                      >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Polite Email Verification Gate Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowVerifyModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    color: '#eab308'
                  }}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Email Verification Required
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Please confirm your address to converse with ReflectAI
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                To safeguard your reflections and maintain account integrity, please verify your email address (<strong>{userProfile?.email}</strong>).
                Google Firebase has dispatched a confirmation link to your inbox.
              </p>

              {verificationNotice && (
                <div className="mb-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{verificationNotice}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  id="modal-resend-verification-btn"
                  disabled={isResendingEmail}
                  onClick={handleResendVerification}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border text-xs font-medium transition cursor-pointer hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--bg-card-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isResendingEmail ? 'Sending...' : 'Resend Link'}</span>
                </button>

                <button
                  type="button"
                  id="modal-check-verification-btn"
                  disabled={isCheckingEmail}
                  onClick={async () => {
                    await handleCheckVerification();
                    if (userProfile?.emailVerified) {
                      setShowVerifyModal(false);
                    }
                  }}
                  className="w-full sm:flex-1 px-4 py-2 rounded-xl text-white text-xs font-medium transition cursor-pointer hover:opacity-90 shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 12px var(--accent-glow)'
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingEmail ? 'animate-spin' : ''}`} />
                  <span>{isCheckingEmail ? 'Checking...' : "I've Verified My Email"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full sm:w-auto px-3 py-2 text-xs font-medium transition cursor-pointer hover:opacity-75"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standout Feature 1: Account Settings & Preferences Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenAbout={() => {
          setNavigatedFromSettings(true);
          setShowSettingsModal(false);
          setShowAboutModal(true);
        }}
        onOpenLegal={() => {
          setLegalModalTab('privacy');
          setNavigatedFromSettings(true);
          setShowSettingsModal(false);
          setShowLegalModal(true);
        }}
      />

      {/* Standout Feature 2: Echoes of Mind - Emotional Resonance Map Modal */}
      <ResonanceMapModal
        isOpen={showResonanceMap}
        onClose={() => setShowResonanceMap(false)}
        interactions={interactions}
        onSelectInteraction={(item) => selectInteraction(item)}
      />

      {/* Standout Feature 3: Serenity Time Capsule - Sealed Mindful Letters Modal */}
      <TimeCapsuleModal
        isOpen={showTimeCapsule}
        onClose={() => setShowTimeCapsule(false)}
        userId={currentUserId}
        interactions={interactions}
        activeInteraction={interactions.find(i => i.id === activeInteractionId) || null}
        onCapsuleUpdated={(updated) => {
          setInteractions(prev => prev.map(i => i.id === updated.id ? updated : i));
        }}
      />

      {/* Standout Feature 4: Location-Aware Sanctuary Journey Modal */}
      <LocationSanctuaryModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        activeInteraction={interactions.find(i => i.id === activeInteractionId) || null}
        interactionsWithLocation={interactions.filter(i => !!i.location)}
        onLocationTagged={(loc) => setStagedLocation(loc)}
      />

      {/* About & FAQ Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => {
          setShowAboutModal(false);
          setNavigatedFromSettings(false);
        }}
        onOpenPrivacy={() => {
          setLegalModalTab('privacy');
          setShowAboutModal(false);
          setShowLegalModal(true);
        }}
        onOpenTerms={() => {
          setLegalModalTab('terms');
          setShowAboutModal(false);
          setShowLegalModal(true);
        }}
        onBack={navigatedFromSettings ? () => {
          setShowAboutModal(false);
          setNavigatedFromSettings(false);
          setShowSettingsModal(true);
        } : undefined}
      />

      {/* Privacy Policy & Terms of Service Modal */}
      <LegalModal
        isOpen={showLegalModal}
        initialTab={legalModalTab}
        onClose={() => {
          setShowLegalModal(false);
          setNavigatedFromSettings(false);
        }}
        onBack={navigatedFromSettings ? () => {
          setShowLegalModal(false);
          setNavigatedFromSettings(false);
          setShowSettingsModal(true);
        } : undefined}
      />
    </div>
  );
};
