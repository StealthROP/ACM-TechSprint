import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '../theme/themes';

export interface LayoutDetails {
  y: number;
  height: number;
}

export type ScreenType = 'home' | 'library' | 'import' | 'reader' | 'camera';
export type HighlightColorType = 'theme' | 'orange' | 'teal' | 'purple' | 'green';

interface A11yState {
  // Navigation Router
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;

  // Active reading material ID
  selectedMaterialId: string;
  setSelectedMaterialId: (id: string) => void;

  // Theme settings
  themeType: ThemeType;
  setThemeType: (theme: ThemeType) => void;

  // Typography adjustments
  fontSize: number;
  setFontSize: (size: number) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
  letterSpacing: number;
  setLetterSpacing: (spacing: number) => void;

  // Immersive Focus Mode Settings
  focusModeEnabled: boolean;
  setFocusModeEnabled: (enabled: boolean) => void;
  activeLineIndex: number;
  setActiveLineIndex: (index: number) => void;

  // Text-To-Speech (TTS) Settings
  ttsSpeed: number; // 0.5 to 2.0
  setTtsSpeed: (speed: number) => void;
  ttsPitch: number; // 0.5 to 2.0
  setTtsPitch: (pitch: number) => void;
  highlightColor: HighlightColorType;
  setHighlightColor: (color: HighlightColorType) => void;

  // Global Settings & Tutor Modal Visibility
  isSettingsModalVisible: boolean;
  setSettingsModalVisible: (visible: boolean) => void;
  isTutorChatVisible: boolean;
  setTutorChatVisible: (visible: boolean) => void;

  // Layout tracking coordinates (temporary layout details, not persisted)
  itemLayouts: Record<number, LayoutDetails>;
  setItemLayout: (index: number, layout: LayoutDetails) => void;
  contentHeight: number;
  setContentHeight: (height: number) => void;
  scrollViewHeight: number;
  setScrollViewHeight: (height: number) => void;
  scrollOffset: number;
  setScrollOffset: (offset: number) => void;
}

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      // Defaults optimized for readability
      activeScreen: 'home',
      selectedMaterialId: 'photo',
      themeType: 'cream',
      fontSize: 18,
      lineSpacing: 1.6,
      letterSpacing: 2,
      focusModeEnabled: true,
      activeLineIndex: 0,
      
      // TTS Defaults
      ttsSpeed: 1.0,
      ttsPitch: 1.0,
      highlightColor: 'theme',
      
      // Modal visibilities
      isSettingsModalVisible: false,
      isTutorChatVisible: false,

      // Run-time Layout Details
      itemLayouts: {},
      contentHeight: 0,
      scrollViewHeight: 0,
      scrollOffset: 0,

      setActiveScreen: (activeScreen) => set({ activeScreen }),
      setSelectedMaterialId: (selectedMaterialId) => set({ selectedMaterialId }),
      setThemeType: (themeType) => set({ themeType }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
      setFocusModeEnabled: (focusModeEnabled) => set({ focusModeEnabled }),
      setActiveLineIndex: (activeLineIndex) => set({ activeLineIndex }),
      
      // TTS Actions
      setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
      setTtsPitch: (ttsPitch) => set({ ttsPitch }),
      setHighlightColor: (highlightColor) => set({ highlightColor }),
      
      // Modal Actions
      setSettingsModalVisible: (isSettingsModalVisible) => set({ isSettingsModalVisible }),
      setTutorChatVisible: (isTutorChatVisible) => set({ isTutorChatVisible }),

      setItemLayout: (index, layout) =>
        set((state) => ({
          itemLayouts: { ...state.itemLayouts, [index]: layout },
        })),
      setContentHeight: (contentHeight) => set({ contentHeight }),
      setScrollViewHeight: (scrollViewHeight) => set({ scrollViewHeight }),
      setScrollOffset: (scrollOffset) => set({ scrollOffset }),
    }),
    {
      name: 'a11y-user-profile-v5', // updated version key
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedMaterialId: state.selectedMaterialId,
        themeType: state.themeType,
        fontSize: state.fontSize,
        lineSpacing: state.lineSpacing,
        letterSpacing: state.letterSpacing,
        focusModeEnabled: state.focusModeEnabled,
        activeLineIndex: state.activeLineIndex,
        ttsSpeed: state.ttsSpeed,
        ttsPitch: state.ttsPitch,
        highlightColor: state.highlightColor,
      }),
    }
  )
);
