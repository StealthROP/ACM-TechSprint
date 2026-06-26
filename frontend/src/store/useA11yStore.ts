import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ThemeType } from '../theme/themes';
import { LessonMaterial, MOCK_LESSONS_BY_ID } from '../services/mockApi';

export const getDefaultApiUrl = () => {
  return 'https://belonged.onrender.com';
};

// Returns today's date string in YYYY-MM-DD format (local)
export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Returns index 0=Sun..6=Sat of today
export const getTodayDOW = () => new Date().getDay();


export interface LayoutDetails {
  y: number;
  height: number;
}

export type ScreenType = 'login' | 'signup' | 'home' | 'library' | 'import' | 'reader' | 'camera' | 'onboarding';
export type HighlightColorType = 'theme' | 'orange' | 'teal' | 'purple' | 'green';
export type ReaderTabType = 'import' | 'review' | 'flashcard';
export type LanguageType = 'en' | 'fil';

export interface ModuleProgress {
  currentCardIndex: number;
  progressPct: number;
}

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
  fontFamily: string;
  setFontFamily: (fontFamily: string) => void;

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

  // Reader Three-Phase Settings
  activeReaderTab: ReaderTabType;
  setActiveReaderTab: (tab: ReaderTabType) => void;
  activeLanguage: LanguageType;
  setActiveLanguage: (lang: LanguageType) => void;
  activeRecallEnabled: boolean;
  setActiveRecallEnabled: (enabled: boolean) => void;
  moduleProgress: Record<string, ModuleProgress>;
  setModuleProgress: (moduleId: string, progress: ModuleProgress) => void;
  
  // Real dynamically fetched lessons
  dynamicLessons: Record<string, LessonMaterial>;
  addDynamicLesson: (id: string, lesson: LessonMaterial) => void;

  // Adaptive Learning (Leitner Box System)
  cardDifficulty: Record<string, 'easy' | 'medium' | 'hard' | 'mastered'>;
  updateCardDifficulty: (key: string, isCorrect: boolean) => void;
  resetCardDifficulty: (materialId: string, lang: string) => void;

  // Configurable Backend API URL
  apiUrl: string;
  setApiUrl: (url: string) => void;

  // ── User Profile ──────────────────────────────────────────────────
  profileName: string;
  profilePhotoUri: string | null;
  setProfileName: (name: string) => void;
  setProfilePhotoUri: (uri: string | null) => void;
  isOnboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => void;

  // ── Analytics & Streak ─────────────────────────────────────────
  streak: number;                    // consecutive days studied
  lastActiveDate: string;            // YYYY-MM-DD of last study day
  weeklyMinutes: number[];           // index 0=Sun..6=Sat, minutes per day
  totalCardsRead: number;            // lifetime cards viewed
  totalCorrect: number;              // lifetime correct answers
  totalAttempts: number;             // lifetime quiz attempts
  sessionStartTime: number | null;   // epoch ms of current session start

  // Actions
  recordAnswer: (isCorrect: boolean) => void;
  recordCardRead: () => void;
  startSession: () => void;
  endSession: () => void;
  touchStreak: () => void;           // call once per day to bump streak
  getAvailableMaterialsBrief: () => Array<{ id: string; title: string; summary_snippet: string }>;
}

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      // Defaults optimized for readability
      activeScreen: 'login',
      selectedMaterialId: 'photo',
      themeType: 'cream',
      fontSize: 18,
      lineSpacing: 1.6,
      letterSpacing: 2,
      fontFamily: 'System',
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

      // Reader Phase Defaults
      activeReaderTab: 'import',
      activeLanguage: 'en',
      activeRecallEnabled: true,
      moduleProgress: {},
      dynamicLessons: {},
      cardDifficulty: {},
      apiUrl: getDefaultApiUrl(),

      // Analytics Defaults
      streak: 0,
      lastActiveDate: '',
      weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
      totalCardsRead: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      sessionStartTime: null,

      // Profile Defaults
      profileName: 'Alex',
      profilePhotoUri: null,
      isOnboardingCompleted: false,

      setActiveScreen: (activeScreen) => set({ activeScreen }),
      setSelectedMaterialId: (selectedMaterialId) => set({ selectedMaterialId }),
      setThemeType: (themeType) => set({ themeType }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
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

      setActiveReaderTab: (activeReaderTab) => set({ activeReaderTab }),
      setActiveLanguage: (activeLanguage) => set({ activeLanguage }),
      setActiveRecallEnabled: (activeRecallEnabled) => set({ activeRecallEnabled }),
      setModuleProgress: (moduleId, progress) =>
        set((state) => ({
          moduleProgress: { ...state.moduleProgress, [moduleId]: progress },
        })),
      addDynamicLesson: (id, lesson) =>
        set((state) => ({
          dynamicLessons: { ...state.dynamicLessons, [id]: lesson },
        })),
      updateCardDifficulty: (key, isCorrect) =>
        set((state) => {
          const current = state.cardDifficulty[key] || 'easy';
          let nextState: 'easy' | 'medium' | 'hard' | 'mastered' = current;
          if (isCorrect) {
            if (current === 'easy') nextState = 'medium';
            else if (current === 'medium') nextState = 'hard';
            else if (current === 'hard') nextState = 'mastered';
          } else {
            if (current === 'hard') nextState = 'medium';
            else if (current === 'medium') nextState = 'easy';
          }
          return { cardDifficulty: { ...state.cardDifficulty, [key]: nextState } };
        }),
      resetCardDifficulty: (materialId, lang) =>
        set((state) => {
          const newDiff = { ...state.cardDifficulty };
          Object.keys(newDiff).forEach(k => {
            if (k.startsWith(`${materialId}_${lang}_`)) {
              newDiff[k] = 'easy';
            }
          });
          return { cardDifficulty: newDiff };
        }),
      setApiUrl: (apiUrl) => set({ apiUrl }),
      setProfileName: (profileName) => set({ profileName }),
      setProfilePhotoUri: (profilePhotoUri) => set({ profilePhotoUri }),
      setOnboardingCompleted: (isOnboardingCompleted) => set({ isOnboardingCompleted }),

      // ── Analytics Actions ──────────────────────────────────────
      recordAnswer: (isCorrect) =>
        set((state) => ({
          totalAttempts: state.totalAttempts + 1,
          totalCorrect: isCorrect ? state.totalCorrect + 1 : state.totalCorrect,
        })),

      recordCardRead: () =>
        set((state) => ({ totalCardsRead: state.totalCardsRead + 1 })),

      startSession: () =>
        set((state) => {
          // Only start if not already in a session
          if (state.sessionStartTime !== null) return {};
          return { sessionStartTime: Date.now() };
        }),

      endSession: () =>
        set((state) => {
          if (state.sessionStartTime === null) return {};
          const elapsedMs = Date.now() - state.sessionStartTime;
          const elapsedMins = Math.round(elapsedMs / 60000);
          const dow = getTodayDOW();
          const newWeekly = [...state.weeklyMinutes];
          newWeekly[dow] = (newWeekly[dow] || 0) + elapsedMins;
          return { sessionStartTime: null, weeklyMinutes: newWeekly };
        }),

      touchStreak: () =>
        set((state) => {
          const today = getTodayStr();
          if (state.lastActiveDate === today) return {};      // already touched today
          const yesterday = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })();
          const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
          return { streak: newStreak, lastActiveDate: today };
        }),
      getAvailableMaterialsBrief: () => {
        const state = useA11yStore.getState();
        const custom = state.dynamicLessons || {};
        const list: Array<{ id: string; title: string; summary_snippet: string }> = [];

        // Preloaded template lessons
        Object.keys(MOCK_LESSONS_BY_ID).forEach((id) => {
          const lesson = MOCK_LESSONS_BY_ID[id];
          const firstPoint = lesson.review_points?.[0]?.full_sentence || "";
          const secondPoint = lesson.review_points?.[1]?.full_sentence || "";
          const summary = [firstPoint, secondPoint].filter(Boolean).join(" ");
          list.push({
            id,
            title: lesson.document_title,
            summary_snippet: summary || "Template study guide.",
          });
        });

        // User custom imported lessons
        Object.keys(custom).forEach((id) => {
          const lesson = custom[id];
          const firstPoint = lesson.review_points?.[0]?.full_sentence || "";
          const secondPoint = lesson.review_points?.[1]?.full_sentence || "";
          const summary = [firstPoint, secondPoint].filter(Boolean).join(" ");
          list.push({
            id,
            title: lesson.document_title,
            summary_snippet: summary || "Custom study guide.",
          });
        });

        return list;
      },
    }),
    {
      name: 'a11y-user-profile-v7', // bumped for profile fields
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          state.apiUrl &&
          (state.apiUrl.includes('10.0.2.2') ||
            state.apiUrl.includes('localhost') ||
            state.apiUrl.includes('loca.lt') ||
            state.apiUrl === 'https://belong-backend-api.loca.lt' ||
            state.apiUrl === 'https://belonged-backend-api.loca.lt')
        ) {
          state.apiUrl = getDefaultApiUrl();
        }
      },
      partialize: (state) => ({
        selectedMaterialId: state.selectedMaterialId,
        themeType: state.themeType,
        fontSize: state.fontSize,
        lineSpacing: state.lineSpacing,
        letterSpacing: state.letterSpacing,
        fontFamily: state.fontFamily,
        focusModeEnabled: state.focusModeEnabled,
        activeLineIndex: state.activeLineIndex,
        ttsSpeed: state.ttsSpeed,
        ttsPitch: state.ttsPitch,
        highlightColor: state.highlightColor,
        activeReaderTab: state.activeReaderTab,
        activeLanguage: state.activeLanguage,
        activeRecallEnabled: state.activeRecallEnabled,
        moduleProgress: state.moduleProgress,
        dynamicLessons: state.dynamicLessons,
        cardDifficulty: state.cardDifficulty,
        apiUrl: state.apiUrl,
        // Analytics (persisted)
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        weeklyMinutes: state.weeklyMinutes,
        totalCardsRead: state.totalCardsRead,
        totalCorrect: state.totalCorrect,
        totalAttempts: state.totalAttempts,
        // Profile (persisted)
        profileName: state.profileName,
        profilePhotoUri: state.profilePhotoUri,
        isOnboardingCompleted: state.isOnboardingCompleted,
      }),
    }
  )
);
