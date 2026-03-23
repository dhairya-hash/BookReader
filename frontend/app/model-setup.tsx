import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ttsEngine } from '../services/KokoroTTS';
import * as FileSystem from 'expo-file-system';

export default function ModelSetup() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [modelsDownloaded, setModelsDownloaded] = useState(false);
  const [modelSize, setModelSize] = useState('~100MB');

  useEffect(() => {
    checkModels();
  }, []);

  const checkModels = async () => {
    const downloaded = await ttsEngine.checkModelsDownloaded();
    setModelsDownloaded(downloaded);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await ttsEngine.downloadModels((progress, fileName) => {
        setDownloadProgress(progress);
        setCurrentFile(fileName);
      });

      setModelsDownloaded(true);
      Alert.alert(
        'Success!',
        'Models downloaded successfully. You can now use TTS features.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Download Failed', 'Failed to download models. Please try again.');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteModels = () => {
    Alert.alert(
      'Delete Models',
      'Are you sure you want to delete the downloaded models? You will need to download them again to use TTS features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const modelDir = `${FileSystem.documentDirectory}models/`;
              await FileSystem.deleteAsync(modelDir, { idempotent: true });
              setModelsDownloaded(false);
              Alert.alert('Success', 'Models deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete models');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={modelsDownloaded ? 'checkmark-circle' : 'download-outline'}
            size={80}
            color={modelsDownloaded ? '#4caf50' : '#4a9eff'}
          />
        </View>

        <Text style={styles.title}>
          {modelsDownloaded ? 'Models Ready!' : 'Download TTS Models'}
        </Text>

        <Text style={styles.description}>
          {modelsDownloaded
            ? 'Kokoro TTS models are installed and ready to use. You can now generate speech from PDF text.'
            : 'To use text-to-speech features, you need to download the Kokoro TTS models. This is a one-time download.'}
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={24} color="#4a9eff" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Model Size</Text>
              <Text style={styles.infoValue}>{modelSize}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="flash-outline" size={24} color="#4a9eff" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Performance</Text>
              <Text style={styles.infoValue}>Optimized for mobile</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cloud-offline-outline" size={24} color="#4a9eff" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Works Offline</Text>
              <Text style={styles.infoValue}>100% on-device</Text>
            </View>
          </View>
        </View>

        {isDownloading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Downloading {currentFile}...</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${downloadProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
        )}

        {!modelsDownloaded ? (
          <TouchableOpacity
            style={[
              styles.button,
              styles.downloadButton,
              isDownloading && styles.buttonDisabled,
            ]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download" size={24} color="#fff" />
                <Text style={styles.buttonText}>Download Models</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDeleteModels}
            >
              <Ionicons name="trash-outline" size={20} color="#ff5252" />
              <Text style={[styles.buttonText, styles.deleteButtonText]}>
                Delete Models
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.back()}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a9eff',
  },
  progressPercentage: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#4a9eff',
  },
  continueButton: {
    backgroundColor: '#4caf50',
  },
  deleteButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ff5252',
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
});
