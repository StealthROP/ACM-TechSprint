import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Text } from './A11yText';
import { CameraView, useCameraPermissions } from 'expo-camera';
import LZString from 'lz-string';

interface ImportQrModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (payload: any) => void;
}

export const ImportQrModal: React.FC<ImportQrModalProps> = ({ visible, onClose, onScanSuccess }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);

  // Reset scanned state and request permissions when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setScanned(false);
      if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
      }
    }
  }, [visible, permission]);
  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (decompressed) {
        const payload = JSON.parse(decompressed);
        Alert.alert(
          "Success",
          "Notes successfully received!",
          [{ text: "Open", onPress: () => {
            onScanSuccess(payload);
            onClose();
          }}]
        );
      } else {
        throw new Error("Invalid payload format");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to decode the QR code. It may not be a valid note.", [
        { text: "Try Again", onPress: () => setScanned(false) }
      ]);
    }
  };


  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ fontSize: 24, color: '#FFFFFF' }}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontWeight: 'bold' }]}>Scan Peer Note</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.cameraViewfinder}>
          {permission?.granted ? (
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 12 }}>Camera access is required</Text>
              <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: '#38BDF8', padding: 8, borderRadius: 8 }}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mock Viewfinder UI */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          <View style={styles.scanLine} />
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Point your camera at the QR code displayed on your peer's screen. Make sure you are connected to their mobile hotspot if offline.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44, // Match closeBtn width for centering
  },
  cameraViewfinder: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#38BDF8',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#38BDF8',
    opacity: 0.5,
  },
  instructionsContainer: {
    backgroundColor: '#1E293B',
    padding: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
  },
  instructions: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },

});
