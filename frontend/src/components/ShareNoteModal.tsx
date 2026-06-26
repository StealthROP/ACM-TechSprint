import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from './A11yText';
import QRCode from 'react-native-qrcode-svg';
import LZString from 'lz-string';

interface ShareNoteModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  payload?: any;
}

export const ShareNoteModal: React.FC<ShareNoteModalProps> = ({ visible, onClose, title, subtitle, payload }) => {
  if (!title) return null;

  let qrData = 'error';
  try {
    const dataToCompress = payload ? payload : { title, subtitle, mock: true };
    const jsonStr = JSON.stringify(dataToCompress);
    qrData = LZString.compressToEncodedURIComponent(jsonStr);
  } catch (e) {
    console.warn('Failed to compress payload', e);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { fontWeight: 'bold' }]}>Share Notes Offline</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 24, color: '#1E293B' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleTitle, { fontWeight: 'bold' }]}>{title}</Text>
              <Text style={styles.moduleSubtitle}>{subtitle}</Text>
            </View>

            <Text style={styles.instruction}>
              Ask your peer to scan this QR Code using the "Import QR" feature in their library.
            </Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrData || "error"}
                  size={200}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.hotspotInstructions}>
              <View style={styles.hotspotHeader}>
                <Text style={{ fontSize: 24 }}>📡</Text>
                <Text style={[styles.hotspotTitle, { fontWeight: 'bold' }]}>No signal? No problem.</Text>
              </View>
              <Text style={styles.hotspotBody}>
                1. Turn on your mobile hotspot.{'\n'}
                2. Have your peer connect to your Wi-Fi.{'\n'}
                3. They can scan the QR code to fetch the notes directly from your phone!
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 22,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 24,
  },
  moduleInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  moduleTitle: {
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  instruction: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hotspotInstructions: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  hotspotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotspotTitle: {
    fontSize: 16,
    color: '#0284C7',
    marginLeft: 8,
  },
  hotspotBody: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 22,
  },
});
