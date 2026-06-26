export interface ThemePalette {
  name: string;
  background: string;
  cardBackground: string;
  textPrimary: string;   // Colors for alternating syllables
  textSecondary: string; // Colors for alternating syllables
  accent: string;
  maskColor: string;     // Color overlay for immersive focus mode
  maskOpacity: number;   // Opacity level for masking
  
  // Custom figma-matching style tokens for layout sections
  headerBg?: string;         // Header block background color
  moduleCardBg?: string;     // Library/dashboard module card background
  moduleCardText?: string;   // Module card text color
  moduleCardSub?: string;    // Module card subtext/accent color
  progressBarColor?: string; // Module progress bar fill color
  tabActiveBg?: string;      // Tab bar active item background badge
  tabActiveIcon?: string;    // Tab bar active item icon/text color
  tabBarBg?: string;         // Tab bar background
  heroCardBg?: string;       // Dashboard/Import bottom hero card background
  heroBtnBg?: string;        // Dashboard/Import bottom hero button background
  topHeroCardBg?: string;    // Dashboard welcome review banner background
  topHeroBtnBg?: string;     // Dashboard welcome review banner button background
  topHeroBtnText?: string;   // Dashboard welcome review banner button text color
}

export type ThemeType = 'cream' | 'mint' | 'lavender' | 'dark' | 'harsh' | 'normal' | 'dyslexic' | 'autistic';

export const THEMES: Record<ThemeType, ThemePalette> = {
  normal: {
    name: 'Normal Theme',
    background: '#FAF6EE',       // Screen background
    cardBackground: '#FAF6EE',
    textPrimary: '#3E2723',      // Dark brown/black
    textSecondary: '#6D5550',    // Muted brown
    accent: '#4C342F',           // Dark brown
    maskColor: '#1E1610',
    maskOpacity: 0.55,
    headerBg: '#4C342F',         // Dark brown header
    moduleCardBg: '#556B54',     // Sage green card
    moduleCardText: '#FFFFFF',
    moduleCardSub: '#D4E5D2',    // Light sage subtext
    progressBarColor: '#FCE762', // Yellow progress bar
    tabActiveBg: '#CBE3FC',      // Light blue badge
    tabActiveIcon: '#2A4B7C',    // Dark blue active icon
    tabBarBg: '#FAF6EE',
    heroCardBg: '#8FA48E',       // Sage green hero card
    heroBtnBg: '#4A5E4E',        // Dark green hero button
    topHeroCardBg: '#4C342F',    // Dark brown top banner
    topHeroBtnBg: '#FFFFFF',     // White top banner button
    topHeroBtnText: '#4C342F',
  },
  dyslexic: {
    name: 'Dyslexic Theme',
    background: '#F5EFE2',       // Warm cream background
    cardBackground: '#EFE5D3',
    textPrimary: '#3A2A2A',      // Dark slate brown
    textSecondary: '#6D5550',    // Muted terracotta
    accent: '#B38073',           // Terracotta accent
    maskColor: '#1E1610',
    maskOpacity: 0.55,
    headerBg: '#B38073',         // Terracotta header
    moduleCardBg: '#5C7D82',     // Steel blue/dusty blue card
    moduleCardText: '#FFFFFF',
    moduleCardSub: '#D5E5E8',    // Light blue subtext
    progressBarColor: '#FCE762', // Yellow progress bar
    tabActiveBg: '#CBE3FC',
    tabActiveIcon: '#2A4B7C',
    tabBarBg: '#EFE5D3',
    heroCardBg: '#8CA5A5',       // Dusty blue-gray hero card
    heroBtnBg: '#4B5F61',        // Dark blue-gray hero button
    topHeroCardBg: '#B38073',    // Terracotta top banner
    topHeroBtnBg: '#FFFFFF',
    topHeroBtnText: '#B38073',
  },
  autistic: {
    name: 'Autistic Theme',
    background: '#E5ECF0',       // Soft blue-gray background
    cardBackground: '#DFE6EB',
    textPrimary: '#1A2530',      // Dark navy slate
    textSecondary: '#4A5A6A',    // Muted slate blue
    accent: '#203346',           // Dark navy accent
    maskColor: '#071A11',
    maskOpacity: 0.55,
    headerBg: '#203346',         // Dark navy header
    moduleCardBg: '#415B52',     // Slate green/teal card
    moduleCardText: '#FFFFFF',
    moduleCardSub: '#D6E8E2',    // Light teal subtext
    progressBarColor: '#FCE762', // Yellow progress bar
    tabActiveBg: '#CBE3FC',
    tabActiveIcon: '#2A4B7C',
    tabBarBg: '#DFE6EB',
    heroCardBg: '#6C857B',       // Slate green hero card
    heroBtnBg: '#344D45',        // Dark slate green button
    topHeroCardBg: '#203346',    // Dark navy top banner
    topHeroBtnBg: '#FFFFFF',
    topHeroBtnText: '#203346',
  },
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
