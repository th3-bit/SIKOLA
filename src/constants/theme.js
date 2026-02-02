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
      ios: 'System',
      android: 'sans-serif',
      web: 'Inter, sans-serif'
    })
  }
};

export const theme = {
  dark: {
    ...common,
    colors: {
      primary: '#000000', // Deepest black
      secondary: '#FACC15', // Vibrant Gold (Tailwind Amber 400)
      surface: '#0A0A0A',
      textPrimary: '#FFFFFF',
      textSecondary: '#94A3B8',
      textContrast: '#000000',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      inputBorder: 'rgba(250, 204, 21, 0.2)', // Gold tint
      gradientStart: '#000000',
      gradientEnd: '#1A1A1A', // Slightly lighter end for better depth
      shadow: '#FACC15',
      white: '#ffffff',
      glass: 'rgba(25, 25, 25, 0.85)',
      glassBorder: 'rgba(255, 255, 255, 0.12)',
    }
  },
  light: {
    ...common,
    colors: {
      primary: '#FAF9F6', // Warm white (CSS --background)
      secondary: '#0D9488', // Sharp Teal
      surface: '#FFFFFF',
      textPrimary: '#0F172A', // Deeper text
      textSecondary: '#64748B', 
      textContrast: '#ffffff',
      inputBg: '#F1F5F9', 
      inputBorder: '#E2E8F0',
      gradientStart: '#FAF9F6',
      gradientEnd: '#F1F5F9',
      shadow: '#0D9488',
      white: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(13, 148, 136, 0.1)',
    }
  }
};

