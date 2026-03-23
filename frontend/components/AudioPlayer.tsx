import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioPlayerProps {
  audioUri: string | null;
  words: string[];
  onPlaybackComplete?: () => void;
  onPlaybackUpdate?: (currentWordIndex: number) => void;
  onSkipWord?: (direction: 'forward' | 'backward') => void;
  onSkipSentence?: (direction: 'forward' | 'backward') => void;
}

const SETTINGS_KEY = '@pdf_reader_settings';

export default function AudioPlayer({
  audioUri,
  words,
  onPlaybackComplete,
  onPlaybackUpdate,
  onSkipWord,
  onSkipSentence,
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  useEffect(() => {
    loadSettings();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (audioUri) {
      loadAudio();
    }
  }, [audioUri]);

  useEffect(() => {
    // Calculate current word based on playback position
    if (duration > 0 && words.length > 0) {
      const progress = position / duration;
      const wordIndex = Math.floor(progress * words.length);
      setCurrentWordIndex(Math.min(wordIndex, words.length - 1));
      onPlaybackUpdate?.(wordIndex);
    }
  }, [position, duration, words]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setPlaybackSpeed(settings.playbackSpeed || 1.0);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadAudio = async () => {
    if (!audioUri) return;

    try {
      setIsLoading(true);

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, rate: playbackSpeed },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setCurrentWordIndex(0);
        onPlaybackComplete?.();
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing:', error);
    }
  };

  const handlePressIn = (direction: 'forward' | 'backward', buttonType: 'skip') => {
    setIsLongPress(false);
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      // Long press - skip sentence
      onSkipSentence?.(direction);
      handleSkipTime(direction, 15000); // Also skip 15s in audio
    }, 500); // 500ms for long press
  };

  const handlePressOut = (direction: 'forward' | 'backward') => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    if (!isLongPress) {
      // Short press - skip word
      onSkipWord?.(direction);
      const wordDuration = duration / words.length;
      const skipAmount = direction === 'forward' ? wordDuration : -wordDuration;
      handleSkipTime(direction, Math.abs(skipAmount));
    }
    
    setIsLongPress(false);
  };

  const handleSkipTime = async (direction: 'forward' | 'backward', amount: number) => {
    if (!sound || !duration) return;

    try {
      const newPosition = direction === 'forward'
        ? Math.min(duration, position + amount)
        : Math.max(0, position - amount);
      
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error skipping:', error);
    }
  };

  const handleSpeedChange = async () => {
    if (!sound) return;

    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

    try {
      await sound.setRateAsync(nextSpeed, true);
      setPlaybackSpeed(nextSpeed);
      
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : {};
      settings.playbackSpeed = nextSpeed;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error changing speed:', error);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  if (!audioUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.noAudioText}>Generate audio to start playback</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.wordIndicator}>
            Word {currentWordIndex + 1} of {words.length}
          </Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={() => handlePressIn('backward', 'skip')}
          onPressOut={() => handlePressOut('backward')}
          disabled={!sound || isLoading}
        >
          <Ionicons name="play-skip-back" size={28} color="#fff" />
          <Text style={styles.skipText}>word/sent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          disabled={!sound || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={() => handlePressIn('forward', 'skip')}
          onPressOut={() => handlePressOut('forward')}
          disabled={!sound || isLoading}
        >
          <Ionicons name="play-skip-forward" size={28} color="#fff" />
          <Text style={styles.skipText}>word/sent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.speedButton}
          onPress={handleSpeedChange}
          disabled={!sound}
        >
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instructionText}>
        Tap to skip word • Hold to skip sentence
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  noAudioText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a9eff',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#888',
    fontSize: 12,
  },
  wordIndicator: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  skipText: {
    color: '#888',
    fontSize: 9,
    marginTop: 2,
  },
  instructionText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
