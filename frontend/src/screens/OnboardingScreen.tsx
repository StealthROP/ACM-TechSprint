import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../components/A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

interface QuestionOption {
  id: string;
  emoji: string;
  title: string;
  description: string;
  action: () => void;
  appliedLabel: string;
}

interface OnboardingQuestion {
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

export const OnboardingScreen: React.FC = () => {
  const {
    themeType,
    setThemeType,
    setFontSize,
    setLineSpacing,
    setLetterSpacing,
    setFontFamily,
    setFocusModeEnabled,
    setTtsSpeed,
    setActiveLanguage,
    setActiveRecallEnabled,
    setActiveScreen,
    setOnboardingCompleted,
  } = useA11yStore();

  const theme = THEMES[themeType];
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth > 600 ? '48%' : '100%';

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizingStep, setCustomizingStep] = useState(0);

  const questions: OnboardingQuestion[] = [
    {
      title: "Reading Comfort",
      subtitle: "How does reading text on a screen feel for you?",
      options: [
        {
          id: "letters_dance",
          emoji: "📱",
          title: "Letters dance or crowd together",
          description: "We'll enable Dyslexia-friendly typography and wider spacing.",
          appliedLabel: "Dyslexia-friendly font & spacing activated",
          action: () => {
            setFontFamily('OpenDyslexic');
            setLetterSpacing(3);
            setLineSpacing(1.8);
            setFontSize(18);
          },
        },
        {
          id: "adhd_focus",
          emoji: "🔍",
          title: "Large paragraphs feel overwhelming",
          description: "We'll turn on the Immersive Focus Ruler to help you read line-by-line.",
          appliedLabel: "Immersive Focus Ruler enabled",
          action: () => {
            setFocusModeEnabled(true);
            setFontFamily('System');
            setLetterSpacing(2);
            setLineSpacing(1.6);
            setFontSize(18);
          },
        },
        {
          id: "low_vision",
          emoji: "👁️",
          title: "Text feels too small or blurry",
          description: "We'll set the font size to Extra Large for easier reading.",
          appliedLabel: "Extra large text size configured",
          action: () => {
            setFontSize(26);
            setFontFamily('System');
            setLetterSpacing(2);
            setLineSpacing(1.6);
          },
        },
        {
          id: "standard",
          emoji: "✏️",
          title: "Standard reading feels comfortable",
          description: "We'll keep the standard layout settings active.",
          appliedLabel: "Standard reader settings active",
          action: () => {
            setFontFamily('System');
            setLetterSpacing(2);
            setLineSpacing(1.6);
            setFontSize(18);
            setFocusModeEnabled(false);
          },
        },
      ],
    },
    {
      title: "Visual Color Palette",
      subtitle: "Which color scheme is easiest on your eyes?",
      options: [
        {
          id: "cream",
          emoji: "🍦",
          title: "Warm Cream",
          description: "Soft, warm tones to reduce eye strain.",
          appliedLabel: "Warm Cream theme set",
          action: () => setThemeType('cream'),
        },
        {
          id: "mint",
          emoji: "🌿",
          title: "Mint Calm",
          description: "Cooling sage colors for a relaxing study mood.",
          appliedLabel: "Mint Calm theme set",
          action: () => setThemeType('mint'),
        },
        {
          id: "lavender",
          emoji: "🪻",
          title: "Calm Lavender",
          description: "Peaceful blue-purple shades for focus.",
          appliedLabel: "Calm Lavender theme set",
          action: () => setThemeType('lavender'),
        },
        {
          id: "dark",
          emoji: "🌙",
          title: "Soothing Dark",
          description: "Low-intensity charcoal theme for dark rooms.",
          appliedLabel: "Soothing Dark theme set",
          action: () => setThemeType('dark'),
        },
        {
          id: "harsh",
          emoji: "⚖️",
          title: "High Contrast",
          description: "Stark black and white for maximum text outline.",
          appliedLabel: "High Contrast theme set",
          action: () => setThemeType('harsh'),
        },
      ],
    },
    {
      title: "Learning Modality",
      subtitle: "How do you prefer to absorb learning materials?",
      options: [
        {
          id: "read",
          emoji: "📖",
          title: "Read silently by myself",
          description: "Study at your own pace with clean visual guides.",
          appliedLabel: "Silent reading mode configured",
          action: () => setTtsSpeed(1.0),
        },
        {
          id: "listen",
          emoji: "🔊",
          title: "Listen to text read aloud",
          description: "We'll configure Text-to-Speech with comfortable audio pacing.",
          appliedLabel: "Text-to-Speech audio configured",
          action: () => setTtsSpeed(0.85),
        },
      ],
    },
    {
      title: "Study Language",
      subtitle: "Which language do you prefer to study in?",
      options: [
        {
          id: "en",
          emoji: "🇺🇸",
          title: "English",
          description: "Use English for raw texts, summaries, and flashcards.",
          appliedLabel: "Primary study language: English",
          action: () => setActiveLanguage('en'),
        },
        {
          id: "fil",
          emoji: "🇵🇭",
          title: "Filipino (Tagalog)",
          description: "Gumamit ng Filipino para sa mas madaling pag-unawa.",
          appliedLabel: "Primary study language: Filipino",
          action: () => setActiveLanguage('fil'),
        },
      ],
    },
    {
      title: "Memory Testing",
      subtitle: "How do you prefer to answer active recall quiz questions?",
      options: [
        {
          id: "speak",
          emoji: "🎙️",
          title: "Speak my answers out loud",
          description: "Use your microphone to state answers (great for voice learners).",
          appliedLabel: "Voice quiz answers enabled",
          action: () => setActiveRecallEnabled(true),
        },
        {
          id: "type",
          emoji: "⌨️",
          title: "Type my answers on the keyboard",
          description: "Use your keyboard to type answers (great for quiet study).",
          appliedLabel: "Keyboard quiz answers enabled",
          action: () => setActiveRecallEnabled(false),
        },
      ],
    },
  ];

  // Set default selection when step loads
  useEffect(() => {
    if (selectedOptions[currentStep] === undefined) {
      // Default to the first option of the question
      const defaultOptionId = questions[currentStep].options[0].id;
      setSelectedOptions((prev) => ({ ...prev, [currentStep]: defaultOptionId }));
      questions[currentStep].options[0].action();
    }
  }, [currentStep]);

  const handleSelect = (option: QuestionOption) => {
    setSelectedOptions((prev) => ({ ...prev, [currentStep]: option.id }));
    option.action();
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsCustomizing(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Run the customization checklist animation
  useEffect(() => {
    if (!isCustomizing) return;

    const timer = setInterval(() => {
      setCustomizingStep((prev) => {
        if (prev < questions.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          // Complete onboarding
          setTimeout(() => {
            setOnboardingCompleted(true);
            setActiveScreen('home');
          }, 600);
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(timer);
  }, [isCustomizing]);

  const activeQuestion = questions[currentStep];

  if (isCustomizing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={themeType === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} style={styles.spinner} />
          <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>
            Customizing BelongED...
          </Text>
          <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
            Configuring accessibility components based on your answers
          </Text>

          <View style={styles.checklist}>
            {questions.map((q, idx) => {
              const selectedId = selectedOptions[idx];
              const selectedOpt = q.options.find((o) => o.id === selectedId);
              const label = selectedOpt ? selectedOpt.appliedLabel : "Setting active configuration";
              const isApplied = customizingStep >= idx;

              return (
                <View key={idx} style={styles.checkItem}>
                  <Text style={[styles.checkIcon, { color: isApplied ? '#435B4E' : 'rgba(0,0,0,0.15)' }]}>
                    {isApplied ? "✔" : "○"}
                  </Text>
                  <Text style={[
                    styles.checkText,
                    { color: isApplied ? theme.textPrimary : theme.textSecondary },
                    isApplied ? styles.checkTextApplied : null
                  ]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeType === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {/* Header Progress */}
        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.accent }]}>BelongED</Text>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            Step {currentStep + 1} of {questions.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarBg, { backgroundColor: themeType === 'dark' ? '#333' : '#E6E2D8' }]}>
          <View style={[
            styles.progressBarFill,
            {
              backgroundColor: theme.accent,
              width: `${((currentStep + 1) / questions.length) * 100}%`
            }
          ]} />
        </View>

        {/* Question Details */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {activeQuestion.title.toUpperCase()}
          </Text>
          <Text style={[styles.questionText, { color: theme.textPrimary }]}>
            {activeQuestion.subtitle}
          </Text>

          {/* Options Grid */}
          <View style={styles.grid}>
            {activeQuestion.options.map((option) => {
              const isSelected = selectedOptions[currentStep] === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: isSelected ? theme.accent : 'transparent',
                      width: cardWidth,
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(option)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>{option.emoji}</Text>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: theme.accent }]}>
                        <Text style={styles.checkMark}>✔</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Navigation */}
        <View style={[styles.footer, { borderColor: themeType === 'dark' ? '#333' : '#E6E2D8' }]}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              styles.backBtn,
              {
                borderColor: theme.accent,
                opacity: currentStep === 0 ? 0.3 : 1
              }
            ]}
            disabled={currentStep === 0}
            onPress={handleBack}
          >
            <Text style={[styles.backBtnText, { color: theme.accent }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, styles.nextBtn, { backgroundColor: theme.accent }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === questions.length - 1 ? "Customize & Start" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardEmoji: {
    fontSize: 32,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 16,
    gap: 12,
  },
  navBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    flex: 1,
    borderWidth: 1.5,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  nextBtn: {
    flex: 2,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  // Loading customization style
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  checklist: {
    width: '100%',
    paddingHorizontal: 12,
    gap: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '800',
    width: 22,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  checkTextApplied: {
    fontWeight: '700',
  },
});
