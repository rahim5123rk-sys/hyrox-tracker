import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { AppColors, AppColorsType } from '../constants/appColors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: AppColorsType; // <--- This was missing/named 'theme' before
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

// Default/Fallback State
const ThemeContext = createContext<ThemeContextType>({
  colors: AppColors.dark, 
  mode: 'system',
  isDark: true,
  setMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('app_theme');
      if (savedMode) setModeState(savedMode as ThemeMode);
    } catch (e) {
      console.error('Failed to load theme preference');
    } finally {
      setIsReady(true);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('app_theme', newMode);
  };

  // Calculate "Active" Mode
  const isSystemDark = systemScheme === 'dark';
  const isDark = mode === 'system' ? isSystemDark : mode === 'dark';
  
  // Select the correct color palette
  const colors = isDark ? AppColors.dark : AppColors.light;

  // Prevent flashing wrong theme on load
  if (!isReady) return null; 

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);