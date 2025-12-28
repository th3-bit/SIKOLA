import { Platform } from 'react-native';

const common = {
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  borderRadius: {
    s: 8,
    m: 16,
    l: 30,
    xl: 50,
  },
  typography: {
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      web: 'Times New Roman, serif'
    })
  }
};

export const theme = {
  dark: {
    ...common,
    colors: {
      primary: '#0A0A0A',
      secondary: '#F0EC1D',
      surface: '#121212',
      textPrimary: '#ffffff',
      textSecondary: '#a0a0b0',
      textContrast: '#000000',
      inputBg: 'rgba(255, 255, 255, 0.03)',
      inputBorder: 'rgba(255, 255, 255, 0.08)',
      gradientStart: '#000000',
      gradientEnd: '#0A0A0A',
      shadow: '#F0EC1D',
      white: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
    }
  },
  light: {
    ...common,
    colors: {
      primary: '#F0F4F8',
      secondary: '#2563EB', // A crisp blue for light mode accents
      surface: '#ffffff',
      textPrimary: '#1E293B',
      textSecondary: '#64748B',
      textContrast: '#ffffff',
      inputBg: 'rgba(0, 0, 0, 0.03)',
      inputBorder: 'rgba(0, 0, 0, 0.08)',
      gradientStart: '#E2E8F0',
      gradientEnd: '#F8FAFC',
      shadow: '#2563EB',
      white: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(0, 0, 0, 0.05)',
    }
  }
};

