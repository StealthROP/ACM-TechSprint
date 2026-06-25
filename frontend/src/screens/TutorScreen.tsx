import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';

export const TutorScreen: React.FC = () => {
  const { themeType } = useA11yStore();
  const theme = THEMES[themeType];
  const [inputText, setInputText] = useState('');

  const chatMessages = [
    {
      id: 1,
      sender: 'ai',
      text: 'Hi Alex! Ready to review your biology cards? Ask me to explain any concept, quiz you, or clarify cell cycles.',
    },
    {
      id: 2,
      sender: 'user',
      text: 'Can you explain the light-dependent reactions of photosynthesis simply?',
    },
    {
      id: 3,
      sender: 'ai',
      text: 'Think of chloroplasts like solar-powered battery chargers! They absorb sunlight (using solar panels) to charge up energy carriers (batteries), which are then sent to make sugar in the Calvin cycle.',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>AI STUDY COMPANION</Text>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tutor Mode</Text>
          </View>

          {/* Conversation Bubble List */}
          <View style={styles.chatContainer}>
            {chatMessages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isAi
                      ? [styles.aiBubble, { backgroundColor: theme.cardBackground }]
                      : [styles.userBubble, { backgroundColor: '#435B4E' }], // Match dark green button
                  ]}
                >
                  <Text
                    style={[
                      styles.senderLabel,
                      { color: isAi ? theme.accent : '#D4ECE0' },
                    ]}
                  >
                    {isAi ? '🤖 AI Tutor' : '👦 Alex'}
                  </Text>
                  <Text
                    style={[
                      styles.messageText,
                      { color: isAi ? theme.textPrimary : '#ffffff' },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Mock Input Form */}
          <View style={[styles.inputRow, { backgroundColor: theme.cardBackground }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              placeholder="Ask the AI Tutor a question..."
              placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]}>
              <Text style={styles.sendBtnText}>➔</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Tab Bar */}
        <TabBar />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  chatContainer: {
    flex: 1,
    gap: 14,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  messageBubble: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 8,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
