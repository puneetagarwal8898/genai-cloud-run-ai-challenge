import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppEnvironment, DeviceViewportMode } from '../types';

interface SystemConfig {
  appEnv: string;
  isProductionLocked?: boolean;
  hasSmtpConfigured: boolean;
  hasGeminiKey: boolean;
  hasFirebaseKey: boolean;
}

interface AppContextType {
  appEnv: AppEnvironment;
  setAppEnv: (env: AppEnvironment) => void;
  isProductionLocked: boolean;
  deviceMode: DeviceViewportMode;
  setDeviceMode: (mode: DeviceViewportMode) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  systemConfig: SystemConfig | null;
  refreshConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_ENV_KEY = 'reflectai_app_env';
const LOCAL_STORAGE_DEVICE_KEY = 'reflectai_device_mode';

// Global runtime injected flags
declare global {
  interface Window {
    __APP_ENV__?: 'production' | 'test';
    __IS_PRODUCTION_LOCKED__?: boolean;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appEnv, setAppEnvState] = useState<AppEnvironment>(() => {
    // 1. Synchronously inspect server injection to avoid flashing tabs
    if (typeof window !== 'undefined') {
      if (window.__APP_ENV__ === 'production' || window.__IS_PRODUCTION_LOCKED__ === true) {
        return 'production';
      }
      if (window.__APP_ENV__ === 'test') {
        return 'test';
      }
    }
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ENV_KEY) as AppEnvironment;
      if (saved === 'production' || saved === 'test') {
        return saved;
      }
    } catch (e) {
      // Local storage access fallback
    }
    return 'test';
  });

  const [isProductionLocked, setIsProductionLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.__IS_PRODUCTION_LOCKED__ || window.__APP_ENV__ === 'production');
    }
    return false;
  });

  const [deviceMode, setDeviceModeState] = useState<DeviceViewportMode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DEVICE_KEY) as DeviceViewportMode;
      if (saved === 'desktop' || saved === 'tablet' || saved === 'mobile') {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'desktop';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
        if (data.isProductionLocked === true || data.appEnv === 'production') {
          setIsProductionLocked(true);
          setAppEnvState('production');
        }
      }
    } catch (err) {
      console.warn('Could not fetch server config:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const setAppEnv = (env: AppEnvironment) => {
    if (isProductionLocked) return;
    setAppEnvState(env);
    try {
      localStorage.setItem(LOCAL_STORAGE_ENV_KEY, env);
    } catch (e) {
      // ignore
    }
  };

  const setDeviceMode = (mode: DeviceViewportMode) => {
    setDeviceModeState(mode);
    try {
      localStorage.setItem(LOCAL_STORAGE_DEVICE_KEY, mode);
    } catch (e) {
      // ignore
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        appEnv,
        setAppEnv,
        isProductionLocked,
        deviceMode,
        setDeviceMode,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        systemConfig,
        refreshConfig: fetchConfig
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
