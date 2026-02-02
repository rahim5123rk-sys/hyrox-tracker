import { getAppColors, type AppColorsType } from '@/constants/appColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = 'app_theme_preference';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: AppColorsType;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setPreferenceState(saved);
        }
      } catch (_) {}
    })();
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, p);
    } catch (_) {}
  }, []);

  const isDark = preference === 'system' ? (systemScheme === 'dark') : preference === 'dark';
  const colors = useMemo(() => getAppColors(isDark), [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, preference, setPreference }),
    [colors, isDark, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
