export interface ThemePalette {
  name: string;
  background: string;
  cardBackground: string;
  textPrimary: string;   // Colors for alternating syllables
  textSecondary: string; // Colors for alternating syllables
  accent: string;
  maskColor: string;     // Color overlay for immersive focus mode
  maskOpacity: number;   // Opacity level for masking
}

export type ThemeType = 'cream' | 'mint' | 'lavender' | 'dark' | 'harsh';

export const THEMES: Record<ThemeType, ThemePalette> = {
  cream: {
    name: 'Warm Cream',
    background: '#FDF5E6',     // Soothing warm cream
    cardBackground: '#F4ECE1', // Muted card background
    textPrimary: '#2B1A0A',    // Very dark warm brown
    textSecondary: '#1A5F7A',  // Deep ocean teal
    accent: '#B2533E',
    maskColor: '#1E1610',
    maskOpacity: 0.55,
  },
  mint: {
    name: 'Mint Calm',
    background: '#F0F7F4',     // Fresh mint tint
    cardBackground: '#E1EBE6', // Soft sage card background
    textPrimary: '#0C2B1D',    // Deep forest green
    textSecondary: '#7F5A23',  // Muted hazel/umber
    accent: '#3E8E7E',
    maskColor: '#071A11',
    maskOpacity: 0.55,
  },
  lavender: {
    name: 'Calm Lavender',
    background: '#F5F5FA',     // Gentle blue-purple
    cardBackground: '#E9E9F3', // Soft lavender card background
    textPrimary: '#1E1D3B',    // Dark midnight blue
    textSecondary: '#9A3B3B',  // Muted burgundy
    accent: '#615EFC',
    maskColor: '#121124',
    maskOpacity: 0.55,
  },
  dark: {
    name: 'Soothing Dark',
    background: '#181A1B',     // Soft slate-dark (no harsh black)
    cardBackground: '#24282A', // Dark charcoal card
    textPrimary: '#E2E6E8',    // Soft off-white
    textSecondary: '#F4D068',  // Low-intensity warm gold
    accent: '#7AA2F7',
    maskColor: '#000000',
    maskOpacity: 0.7,
  },
  harsh: {
    name: 'Harsh White',
    background: '#FFFFFF',     // Harsh standard white
    cardBackground: '#F8F9FA', // Grey-white
    textPrimary: '#000000',    // Pitch black
    textSecondary: '#FF0000',  // High-frequency bright red
    accent: '#0000FF',
    maskColor: '#000000',
    maskOpacity: 0.4,
  },
};
