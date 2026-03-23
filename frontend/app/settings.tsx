import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { ttsEngine } from '../services/KokoroTTS';

const SETTINGS_KEY = '@pdf_reader_settings';

interface Settings {
  playbackSpeed: number;
  autoPlay: boolean;
  highlightColor: string;
  fontSize: number;
}

const defaultSettings: Settings = {
  playbackSpeed: 1.0,
  autoPlay: false,
  highlightColor: '#ffeb3b',
  fontSize: 16,
};

export default function Settings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [modelsDownloaded, setModelsDownloaded] = useState(false);

  useEffect(() => {
    loadSettings();
    checkModels();
  }, []);

  const checkModels = async () => {
    const downloaded = await ttsEngine.checkModelsDownloaded();
    setModelsDownloaded(downloaded);
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSpeed = (speed: number) => {
    saveSettings({ ...settings, playbackSpeed: speed });
  };

  const toggleAutoPlay = (value: boolean) => {
    saveSettings({ ...settings, autoPlay: value });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Playback Speed</Text>
            <Text style={styles.settingValue}>{settings.playbackSpeed.toFixed(1)}x</Text>
          </View>
        </View>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>0.5x</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={settings.playbackSpeed}
            onValueChange={updateSpeed}
            minimumTrackTintColor="#4a9eff"
            maximumTrackTintColor="#2a2a2a"
            thumbTintColor="#4a9eff"
          />
          <Text style={styles.sliderLabel}>2.0x</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-play on open</Text>
            <Text style={styles.settingDescription}>
              Automatically start reading when opening a book
            </Text>
          </View>
          <Switch
            value={settings.autoPlay}
            onValueChange={toggleAutoPlay}
            trackColor={{ false: '#2a2a2a', true: '#4a9eff' }}
            thumbColor={settings.autoPlay ? '#fff' : '#999'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Highlight Color</Text>
          </View>
          <View style={styles.colorOptions}>
            {['#ffeb3b', '#4caf50', '#2196f3', '#ff5722'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  settings.highlightColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => saveSettings({ ...settings, highlightColor: color })}
              >
                {settings.highlightColor === color && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>PDF Reader with TTS</Text>
          <Text style={styles.infoSubtext}>Version 1.0.0</Text>
          <Text style={styles.infoDescription}>
            A standalone offline PDF reader with text-to-speech powered by Kokoro TTS.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TTS Model Status</Text>
        <TouchableOpacity 
          style={styles.infoCard}
          onPress={() => router.push('/model-setup')}
          activeOpacity={0.7}
        >
          <View style={styles.statusRow}>
            <Ionicons 
              name={modelsDownloaded ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={modelsDownloaded ? "#4caf50" : "#ff9800"} 
            />
            <Text style={[
              styles.statusText,
              modelsDownloaded && { color: '#4caf50' }
            ]}>
              {modelsDownloaded ? "Models installed" : "Models not downloaded"}
            </Text>
          </View>
          <Text style={styles.infoDescription}>
            {modelsDownloaded 
              ? "Kokoro TTS is ready to use. Tap to manage models."
              : "Download Kokoro TTS models to enable speech generation. Tap to download."
            }
          </Text>
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>
              {modelsDownloaded ? "Manage" : "Download now"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#4a9eff" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#4a9eff',
    marginTop: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    color: '#888',
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#4a9eff',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#ff9800',
    fontWeight: '500',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  actionHintText: {
    fontSize: 14,
    color: '#4a9eff',
    fontWeight: '600',
  },
});
