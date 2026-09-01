import React, { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeId } from '../types';

export const ThemeSelector: React.FC = () => {
  const { themeId, theme, setThemeId, toggleDarkMode, setModeType, activeThemesForCurrentMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isDarkMode = theme.type === 'dark';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center gap-1.5">
        {/* Quick Dark/Light Toggle */}
        <button
          id="theme-quick-toggle-btn"
          type="button"
          onClick={toggleDarkMode}
          aria-label={`Toggle mode. Currently ${isDarkMode ? 'Dark mode' : 'Light mode'}`}
          title={`Switch to ${isDarkMode ? 'Daylight Light Mode' : 'Night Dark Mode'}`}
          className="p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)'
          }}
        >
          {isDarkMode ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          )}
        </button>

        {/* Full Palette Picker */}
        <button
          id="theme-palette-btn"
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Theme: ${theme.name}. Select aesthetic palette.`}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: isOpen ? 'var(--accent)' : 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
            style={{ backgroundColor: theme.dotColor }}
            aria-hidden="true"
          />
          <span className="hidden sm:inline text-[11px] font-medium">{theme.name}</span>
          <Palette className="w-3 h-3 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-label="Color Themes"
          className="absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2.5 z-50 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
          }}
        >
          {/* Mode Selector Segmented Control */}
          <div className="mb-2 p-1 rounded-xl border flex gap-1 text-xs" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setModeType('dark')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isDarkMode ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isDarkMode ? 'var(--bg-card)' : 'transparent',
                color: isDarkMode ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Dark Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setModeType('light')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                !isDarkMode ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: !isDarkMode ? 'var(--bg-card)' : 'transparent',
                color: !isDarkMode ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Light Mode</span>
            </button>
          </div>

          <div className="px-2 py-1 mb-1 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
              {isDarkMode ? 'Dark Mode Palettes' : 'Light Mode Palettes'}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              {activeThemesForCurrentMode.length} options
            </span>
          </div>

          {/* Strictly shows ONLY themes for the current mode! */}
          <div className="space-y-1">
            {activeThemesForCurrentMode.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  id={`theme-option-${t.id}`}
                  role="menuitem"
                  onClick={() => {
                    setThemeId(t.id as ThemeId);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isSelected ? 'shadow-xs font-medium' : 'hover:opacity-85'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid transparent'
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/10"
                      style={{ backgroundColor: t.dotColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs flex items-center gap-1.5">
                        <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {t.name}
                        </span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {t.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
