import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, Lock, Eye, EyeOff, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import { ExportDownloadRecord } from '../types';
import { fetchExportHistory, getCachedExportHistory } from '../services/exportLogService';

interface ExportDownloadHistoryProps {
  userId?: string;
  refreshTrigger?: number;
  defaultExpanded?: boolean;
}

export const ExportDownloadHistory: React.FC<ExportDownloadHistoryProps> = ({
  userId,
  refreshTrigger,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [records, setRecords] = useState<ExportDownloadRecord[]>([]);
  const [unmaskedPasswords, setUnmaskedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setRecords([]);
      return;
    }

    // Load instantly from cache first
    const cached = getCachedExportHistory(userId);
    if (cached.length > 0) {
      setRecords(cached);
    }

    // Then sync with Firestore
    setIsLoading(true);
    fetchExportHistory(userId)
      .then((data) => {
        setRecords(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId, refreshTrigger]);

  const togglePasswordVisibility = (id: string) => {
    setUnmaskedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyPassword = (id: string, pwd?: string) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!userId) return null;

  return (
    <div
      id="export-download-history-container"
      className="mt-4 rounded-xl border transition-all overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card-elevated)',
        borderColor: 'var(--border-color)'
      }}
    >
      {/* Accordion Header / Toggle */}
      <button
        id="toggle-export-history-btn"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold cursor-pointer hover:opacity-90 transition select-none"
        style={{ color: 'var(--text-primary)' }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Past PDF Downloads</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)'
            }}
          >
            {records.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="text-[11px] font-normal">{isExpanded ? 'Hide history' : 'View history'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded List */}
      {isExpanded && (
        <div
          className="border-t p-3 space-y-2.5 max-h-72 overflow-y-auto"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {records.length === 0 ? (
            <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No PDF exports recorded yet. When you export reflections, records with passwords will appear here.
            </div>
          ) : (
            records.map((rec) => {
              const isPasswordVisible = Boolean(unmaskedPasswords[rec.id]);
              const formattedDate = new Date(rec.downloadedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={rec.id}
                  className="p-2.5 rounded-lg border text-xs space-y-2 transition"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <div
                          className="font-mono text-xs font-semibold truncate"
                          title={rec.fileName}
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {rec.fileName}
                        </div>
                        <div className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span>{rec.entriesCount} reflections</span>
                          {rec.fileSizeFormatted && (
                            <>
                              <span>•</span>
                              <span>{rec.fileSizeFormatted}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      Password Protected
                    </span>
                  </div>

                  {/* Password & Mask Button Section */}
                  {rec.filePassword ? (
                    <div
                      className="flex items-center justify-between px-2 py-1.5 rounded-md border text-xs"
                      style={{
                        backgroundColor: 'var(--bg-card-elevated)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          File Password:
                        </span>
                        <span
                          className={`font-mono font-medium select-all ${
                            isPasswordVisible ? 'text-amber-500' : 'tracking-widest opacity-80'
                          }`}
                        >
                          {isPasswordVisible ? rec.filePassword : '••••••••••••'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(rec.id)}
                          className="p-1 rounded hover:opacity-80 transition cursor-pointer"
                          title={isPasswordVisible ? 'Mask password' : 'Show password'}
                          aria-label={isPasswordVisible ? 'Mask password' : 'Show password'}
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyPassword(rec.id, rec.filePassword)}
                          className="p-1 rounded hover:opacity-80 transition cursor-pointer"
                          title="Copy file password to clipboard"
                          aria-label="Copy file password"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {copiedId === rec.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
                      No password protection set for this export.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
