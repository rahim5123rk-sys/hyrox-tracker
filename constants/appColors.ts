const tintColorLight = '#FFD700';
const tintColorDark = '#FFD700';

const common = {
  primary: '#FFD700',   // Gold
  success: '#32D74B',   // Green
  danger: '#FF453A',    // Red
  warning: '#FF9F0A',   // Orange
  white: '#FFFFFF',
  black: '#000000',
};

export const AppColors = {
  light: {
    ...common,
    text: '#11181C',
    subtext: '#687076',
    background: '#F2F2F7', // iOS Light Gray Background
    card: '#FFFFFF',
    border: '#D1D1D6',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    tint: tintColorLight,
    modalOverlay: 'rgba(0,0,0,0.5)',
    inputBackground: '#F9F9F9',
  },
  dark: {
    ...common,
    text: '#ECEDEE',
    subtext: '#9BA1A6',
    background: '#000000',
    card: '#1C1C1E',       // iOS Dark Gray Card
    border: '#333333',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    tint: tintColorDark,
    modalOverlay: 'rgba(0,0,0,0.7)',
    inputBackground: '#111111',
  },
};

export type AppColorsType = typeof AppColors.light;

export const getAppColors = (isDark: boolean): AppColorsType => {
  return isDark ? AppColors.dark : AppColors.light;
};