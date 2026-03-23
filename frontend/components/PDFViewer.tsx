import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Web fallback component
export default function PDFViewerWeb() {
  return (
    <View style={styles.container}>
      <View style={styles.webMessage}>
        <Ionicons name="phone-portrait" size={64} color="#4a9eff" />
        <Text style={styles.webTitle}>Android/iOS Only</Text>
        <Text style={styles.webText}>
          PDF reading is only available on Android and iOS devices.
          Please open this app on your mobile device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  webMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  webText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
});
