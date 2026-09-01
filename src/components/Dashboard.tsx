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
  FlaskConical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { JournalInteraction, ReflectionMode } from '../types';
import {
  saveJournalInteraction,
  fetchUserInteractions,
  deleteUserInteraction
} from '../services/journalService';
import { ThemeSelector } from './ThemeSelector';

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
  const { user, userProfile, signOut } = useAuth();
  const { appEnv, setAppEnv, isProductionLocked } = useApp();

  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

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

  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.uid || userProfile?.uid || '';

  // Rotate thinking phrases gently during thinking
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

      // Create full interaction record
      const fullInteraction: JournalInteraction = {
        id: interactionId,
        userId: currentUserId,
        title: entryTitle,
        prompt: userEntryText,
        geminiResponse: geminiResponseText,
        summary: summaryText,
        mode,
        suggestedPrompts: newSuggestedPrompts,
        trail: finalTrail,
        createdAt: isNewChat ? now : (interactions.find(i => i.id === interactionId)?.createdAt || now),
        updatedAt: now
      };

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
      setActionError(err.message || "Unable to reach reflection partner. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPromptText(prompt);
  };

  const handleSuggestedPromptClick = (suggestedText: string) => {
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
      className="min-h-screen flex flex-col font-sans selection:bg-[var(--accent-light)]"
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
            <h1 className="font-semibold text-sm tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>ReflectAI Sanctuary</span>
              {appEnv === 'production' || isProductionLocked ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                  title="Zero-Knowledge Data Privacy • 256-Bit SSL/TLS Encryption"
                >
                  <Lock className="w-2.5 h-2.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">SSL Encrypted</span>
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
                  title="Currently in Test Mode. Click to switch to Production."
                >
                  <FlaskConical className="w-2.5 h-2.5 shrink-0" />
                  <span className="hidden sm:inline">Test Mode</span>
                </button>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick theme selector and light/dark toggle */}
          <ThemeSelector />

          <button
            id="new-entry-btn-header"
            onClick={startNewEntry}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              boxShadow: '0 0 12px var(--accent-glow)'
            }}
          >
            <span>+ New Reflection</span>
          </button>

          <div
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName || "User"}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border"
                style={{ borderColor: 'var(--border-color)' }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                {userProfile?.displayName || "Reflector"}
              </p>
              <p className="text-[10px] truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>
                {userProfile?.email}
              </p>
            </div>
          </div>

          <button
            id="sign-out-btn"
            onClick={signOut}
            title="Sign out of private session"
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

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
            <div className="flex items-center gap-2">
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
              onClick={startNewEntry}
              className="text-xs font-medium text-white px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}
            >
              <span>+ New</span>
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
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <div className="overflow-hidden">
                <p className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  256-Bit SSL Protected &bull; Zero-Knowledge Vault
                </p>
                <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {interactions.length} {interactions.length === 1 ? 'reflection' : 'reflections'} preserved
                </p>
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
            className="p-3.5 border-b flex flex-wrap items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                {activeInteractionId ? "Active Reflection" : "Draft New Reflection"}
              </span>
              {activeInteractionId && (
                <button
                  id="delete-active-reflection-header-btn"
                  type="button"
                  onClick={(e) => requestDelete(activeInteractionId, e)}
                  title="Delete this reflection permanently"
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
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

            {/* Reflection Modes Selector */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-color)'
              }}
            >
              {(['reflection', 'brainstorm', 'summary', 'advice'] as ReflectionMode[]).map(m => (
                <button
                  key={m}
                  id={`mode-btn-${m}`}
                  onClick={() => setMode(m)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium capitalize transition cursor-pointer"
                  style={{
                    backgroundColor: mode === m ? 'var(--accent)' : 'transparent',
                    color: mode === m ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: mode === m ? '0 0 10px var(--accent-glow)' : 'none'
                  }}
                >
                  {getModeIcon(m)}
                  <span className="capitalize">{m}</span>
                </button>
              ))}
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
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
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
                    placeholder="Write your reflection here... Press Enter to send, Shift+Enter for a new line."
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
                    className="flex items-center justify-between pt-2 border-t mt-1"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <span className="text-[10px] hidden sm:inline font-mono" style={{ color: 'var(--text-muted)' }}>
                      Enter to send &bull; Shift+Enter for new line
                    </span>
                    <button
                      id="submit-reflection-btn"
                      type="submit"
                      disabled={isSubmitting || !prompt.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-medium text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ml-auto hover:opacity-90"
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
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
