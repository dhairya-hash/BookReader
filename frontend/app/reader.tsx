import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookStore } from '../store/bookStore';
import { ttsEngine } from '../services/KokoroTTS';
import AudioPlayer from '../components/AudioPlayer';

const { width, height } = Dimensions.get('window');

export default function Reader() {
  const { bookId } = useLocalSearchParams();
  const { books, updateBookProgress, setCurrentBook } = useBookStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5); // Mock for now
  const [loading, setLoading] = useState(false);
  const [pageText, setPageText] = useState('Welcome to your PDF reader! This is a sample page.');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);

  const book = books.find((b) => b.id === bookId);

  useEffect(() => {
    if (book) {
      setCurrentBook(book);
      setCurrentPage(book.currentPage || 1);
      loadPageText(book.currentPage || 1);
    }
    checkTTSReady();
  }, [book]);

  const checkTTSReady = async () => {
    const ready = await ttsEngine.checkModelsDownloaded();
    setTtsReady(ready);
  };

  const loadPageText = (page: number) => {
    // Mock text for demonstration
    // In a real implementation, this would extract text from the PDF
    const mockTexts = [
      'Chapter One: The Beginning. It was a bright cold day in April, and the clocks were striking thirteen.',
      'Chapter Two: The Journey. The road stretched endlessly before them, winding through mountains and valleys.',
      'Chapter Three: Discovery. Hidden within the ancient tome were secrets that had been lost for centuries.',
      'Chapter Four: Revelation. The truth was more extraordinary than anyone could have imagined.',
      'Chapter Five: Conclusion. As the sun set on that final day, everything had changed forever.',
    ];
    setPageText(mockTexts[(page - 1) % mockTexts.length]);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadPageText(newPage);
      setAudioUri(null); // Clear audio when changing pages
      if (book) {
        updateBookProgress(book.id, newPage, 0);
      }
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadPageText(newPage);
      setAudioUri(null); // Clear audio when changing pages
      if (book) {
        updateBookProgress(book.id, newPage, 0);
      }
    }
  };

  const handleGenerateAudio = async () => {
    if (!ttsReady) {
      Alert.alert(
        'TTS Not Ready',
        'Please download TTS models first from Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }

    if (!pageText || pageText.trim().length === 0) {
      Alert.alert('No Text', 'There is no text on this page to read.');
      return;
    }

    try {
      setIsGenerating(true);

      // Initialize TTS if not already initialized
      if (!ttsEngine.isReady()) {
        await ttsEngine.initialize();
      }

      // Generate audio
      const uri = await ttsEngine.synthesize(pageText, {
        speed: 1.0,
        voice: 'default',
      });

      setAudioUri(uri);
      Alert.alert('Success', 'Audio generated! Press play to listen.');
    } catch (error: any) {
      console.error('TTS generation error:', error);
      Alert.alert(
        'Generation Failed',
        error.message || 'Failed to generate audio. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!book) {
    Alert.alert('Error', 'Book not found');
    router.back();
    return null;
  }

  // Web platform message
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMessage}>
          <Ionicons name="phone-portrait" size={64} color="#4a9eff" />
          <Text style={styles.webTitle}>Android/iOS Only</Text>
          <Text style={styles.webText}>
            PDF reading is only available on Android and iOS devices.{' \n'}
            Please scan the QR code with your mobile device.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Page Content */}
      <ScrollView style={styles.contentArea}>
        <View style={styles.textContainer}>
          <Text style={styles.pageTitle}>Page {currentPage}</Text>
          <TextInput
            style={styles.pageText}
            multiline
            value={pageText}
            onChangeText={setPageText}
            placeholder="Enter or edit page text here..."
            placeholderTextColor="#666"
          />
          
          {!ttsReady && (
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={24} color="#ff9800" />
              <Text style={styles.warningText}>
                TTS models not installed. Visit Settings to download.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.generateButton,
              (isGenerating || !pageText.trim()) && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateAudio}
            disabled={isGenerating || !pageText.trim()}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="volume-high" size={24} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Audio</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Page Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navButton, currentPage <= 1 && styles.navButtonDisabled]}
          onPress={goToPreviousPage}
          disabled={currentPage <= 1}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentPage <= 1 ? '#444' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageText}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentPage >= totalPages && styles.navButtonDisabled,
          ]}
          onPress={goToNextPage}
          disabled={currentPage >= totalPages}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={currentPage >= totalPages ? '#444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Audio Player */}
      <AudioPlayer
        audioUri={audioUri}
        onPlaybackComplete={() => {
          // Auto-advance to next page if desired
          console.log('Playback completed');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  contentArea: {
    flex: 1,
  },
  textContainer: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: 16,
  },
  pageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 26,
    minHeight: 200,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1a0a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#ff9800',
    fontSize: 14,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
  pageInfo: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
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
