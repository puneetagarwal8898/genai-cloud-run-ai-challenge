import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ColorTheme } from '../types';

export const AVAILABLE_THEMES: ColorTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Obsidian',
    type: 'dark',
    tagline: 'Deep space cosmic indigo',
    dotColor: '#6366f1',
    accentHex: '#6366f1'
  },
  {
    id: 'candlelight',
    name: 'Night Amber',
    type: 'dark',
    tagline: 'Zero blue-light for late-night reflection',
    dotColor: '#f59e0b',
    accentHex: '#f59e0b'
  },
  {
    id: 'sage',
    name: 'Forest Sage',
    type: 'dark',
    tagline: 'Calming earthy tones to ease eye fatigue',
    dotColor: '#10b981',
    accentHex: '#10b981'
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    type: 'dark',
    tagline: 'Cool glacier cyan & deep midnight steel',
    dotColor: '#06b6d4',
    accentHex: '#06b6d4'
  },
  {
    id: 'warm-paper',
    name: 'Warm Parchment',
    type: 'light',
    tagline: 'Soft sepia daylight, zero screen glare',
    dotColor: '#b45309',
    accentHex: '#b45309'
  },
  {
    id: 'solar',
    name: 'Solar Minimal',
    type: 'light',
    tagline: 'Crisp, high-clarity daytime minimalism',
    dotColor: '#4f46e5',
    accentHex: '#4f46e5'
  },
  {
    id: 'daylight-sage',
    name: 'Morning Sage',
    type: 'light',
    tagline: 'Refreshing herbal daylight, soft natural green',
    dotColor: '#059669',
    accentHex: '#059669'
  }
];

interface ThemeContextType {
  themeId: ThemeId;
  theme: ColorTheme;
  setThemeId: (id: ThemeId) => void;
  toggleDarkMode: () => void;
  setModeType: (type: 'dark' | 'light') => void;
  availableThemes: ColorTheme[];
  activeThemesForCurrentMode: ColorTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('reflectai_theme') as ThemeId;
      if (saved && AVAILABLE_THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch (e) {
      // LocalStorage access fallback
    }
    return 'midnight';
  });

  const currentTheme = AVAILABLE_THEMES.find(t => t.id === themeId) || AVAILABLE_THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem('reflectai_theme', themeId);
    } catch (e) {
      // ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    if (currentTheme.type === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [themeId, currentTheme.type]);

  const setThemeId = (id: ThemeId) => {
    if (AVAILABLE_THEMES.some(t => t.id === id)) {
      setThemeIdState(id);
    }
  };

  const toggleDarkMode = () => {
    if (currentTheme.type === 'dark') {
      setThemeIdState('warm-paper');
    } else {
      setThemeIdState('midnight');
    }
  };

  const setModeType = (type: 'dark' | 'light') => {
    if (type === currentTheme.type) return;
    if (type === 'dark') {
      setThemeIdState('midnight');
    } else {
      setThemeIdState('warm-paper');
    }
  };

  const activeThemesForCurrentMode = AVAILABLE_THEMES.filter(
    t => t.type === currentTheme.type
  );

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: currentTheme,
        setThemeId,
        toggleDarkMode,
        setModeType,
        availableThemes: AVAILABLE_THEMES,
        activeThemesForCurrentMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
