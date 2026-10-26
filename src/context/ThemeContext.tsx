import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeDesignId = 'original' | 'old-money';
export type ThemeMode = 'dark' | 'light';

export interface ThemeContextType {
  themeId: ThemeDesignId;
  activeThemeId: ThemeDesignId;
  mode: ThemeMode;
  theme: ThemeMode; // Backward compatibility with components expecting { theme }
  previewThemeId: ThemeDesignId | null;
  isOldMoney: boolean;
  isOriginal: boolean;
  isDark: boolean;
  isPreviewing: boolean;
  setTheme: (id: ThemeDesignId | ThemeMode) => void;
  toggleTheme: () => void; // Backward compatibility with Navbar & CommandPalette
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  startPreview: (id: ThemeDesignId) => void;
  applyPreview: () => void;
  cancelPreview: () => void;
  restoreOriginalTheme: () => void;
  resetToDefault: () => void;
  isThemeManagerOpen: boolean;
  setIsThemeManagerOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_ID_STORAGE_KEY = 'finops_visual_theme_v3';
const THEME_MODE_STORAGE_KEY = 'finops_theme_mode_v3';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any stale theme preferences from legacy tests
  useEffect(() => {
    try {
      const legacyTheme = localStorage.getItem('finops_visual_theme_v2');
      if (legacyTheme === 'old-money') {
        localStorage.removeItem('finops_visual_theme_v2');
      }
    } catch {
      // ignore
    }
  }, []);

  // Theme Design Identity: Defaults to "Original FinOps Blue", with "Old Money, New AI" preserved
  const [themeId, setThemeIdState] = useState<ThemeDesignId>(() => {
    try {
      const saved = localStorage.getItem(THEME_ID_STORAGE_KEY);
      if (saved === 'original' || saved === 'old-money') return saved;
    } catch {
      // ignore
    }
    // Default to Original FinOps Blue
    return 'original';
  });

  const [previewThemeId, setPreviewThemeId] = useState<ThemeDesignId | null>(null);

  // Appearance Mode (dark is the signature midnight enterprise style)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);

  const activeThemeId = previewThemeId || themeId;

  // Synchronize CSS classes on document body
  useEffect(() => {
    const body = document.body;
    body.classList.remove('theme-old-money', 'theme-original', 'theme-dark', 'theme-light');

    if (activeThemeId === 'old-money') {
      body.classList.add('theme-old-money');
      if (mode === 'dark') {
        body.classList.add('theme-dark');
      } else {
        body.classList.add('theme-light');
      }
    } else {
      body.classList.add('theme-original');
      if (mode === 'light') {
        body.classList.add('theme-light');
      } else {
        body.classList.add('theme-dark');
      }
    }
  }, [activeThemeId, mode]);

  const setTheme = (val: ThemeDesignId | ThemeMode) => {
    if (val === 'light' || val === 'dark') {
      setModeState(val);
      try {
        localStorage.setItem(THEME_MODE_STORAGE_KEY, val);
      } catch {
        // ignore
      }
      return;
    }

    setThemeIdState(val);
    setPreviewThemeId(null);
    try {
      localStorage.setItem(THEME_ID_STORAGE_KEY, val);
    } catch {
      // ignore
    }
  };

  const startPreview = (id: ThemeDesignId) => {
    setPreviewThemeId(id);
  };

  const applyPreview = () => {
    if (previewThemeId) {
      setTheme(previewThemeId);
    }
  };

  const cancelPreview = () => {
    setPreviewThemeId(null);
  };

  const restoreOriginalTheme = () => {
    setThemeIdState('original');
    setPreviewThemeId(null);
    setModeState('dark');
    try {
      localStorage.setItem(THEME_ID_STORAGE_KEY, 'original');
      localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark');
      localStorage.removeItem('finops_visual_theme_v2');
    } catch {
      // ignore
    }
  };

  const resetToDefault = () => {
    restoreOriginalTheme();
  };

  const toggleMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setModeState(nextMode);
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
    } catch {
      // ignore
    }
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        activeThemeId,
        mode,
        theme: mode, // Backward compatibility
        previewThemeId,
        isOldMoney: activeThemeId === 'old-money',
        isOriginal: activeThemeId === 'original',
        isDark: mode === 'dark',
        isPreviewing: previewThemeId !== null,
        setTheme,
        toggleTheme: toggleMode, // Backward compatibility
        toggleMode,
        setMode,
        startPreview,
        applyPreview,
        cancelPreview,
        restoreOriginalTheme,
        resetToDefault,
        isThemeManagerOpen,
        setIsThemeManagerOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
