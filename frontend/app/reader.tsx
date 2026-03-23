import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookStore } from '../store/bookStore';
import { ttsEngine } from '../services/KokoroTTS';
import { pdfProcessor } from '../services/PDFProcessor';
import AudioPlayer from '../components/AudioPlayer';

export default function Reader() {
  const { bookId } = useLocalSearchParams();
  const { books, updateBookProgress, setCurrentBook } = useBookStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [loading, setLoading] = useState(false);
  const [pageText, setPageText] = useState('');
  const [pageWords, setPageWords] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');

  const book = books.find((b) => b.id === bookId);

  useEffect(() => {
    if (book) {
      setCurrentBook(book);
      setCurrentPage(book.currentPage || 1);
      loadPage(book.currentPage || 1);
      loadTotalPages();
    }
    checkTTSReady();
    loadHighlightColor();
  }, [book]);

  const loadHighlightColor = async () => {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.getItem('@pdf_reader_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setHighlightColor(settings.highlightColor || '#ffeb3b');
      }
    } catch (error) {
      console.error('Error loading highlight color:', error);
    }
  };

  const checkTTSReady = async () => {
    const ready = await ttsEngine.checkModelsDownloaded();
    setTtsReady(ready);
  };

  const loadTotalPages = async () => {
    if (!book) return;
    try {
      const pages = await pdfProcessor.getTotalPages(book.filePath);
      setTotalPages(pages);
    } catch (error) {
      console.error('Error loading total pages:', error);
    }
  };

  const loadPage = async (page: number) => {
    if (!book) return;
    
    try {
      setLoading(true);
      const content = await pdfProcessor.extractTextFromPage(book.filePath, page);
      setPageText(content.text);
      setPageWords(content.words);
      setCurrentWordIndex(0);
    } catch (error) {
      console.error('Error loading page:', error);
      Alert.alert('Error', 'Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadPage(newPage);
      setAudioUri(null);
      if (book) {
        updateBookProgress(book.id, newPage, 0);
      }
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadPage(newPage);
      setAudioUri(null);
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

      if (!ttsEngine.isReady()) {
        await ttsEngine.initialize();
      }

      const uri = await ttsEngine.synthesize(pageText, {
        speed: 1.0,
        voice: 'default',
      });

      setAudioUri(uri);
      setCurrentWordIndex(0);
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

  const handleSkipWord = (direction: 'forward' | 'backward') => {
    const newIndex = direction === 'forward'
      ? Math.min(currentWordIndex + 1, pageWords.length - 1)
      : Math.max(currentWordIndex - 1, 0);
    setCurrentWordIndex(newIndex);
  };

  const handleSkipSentence = (direction: 'forward' | 'backward') => {
    // Find next/previous sentence boundary (. ! ?)
    const text = pageText;
    const sentenceEnders = /[.!?]/g;
    const matches = [...text.matchAll(sentenceEnders)];
    
    let targetIndex = currentWordIndex;
    const currentPos = pageWords.slice(0, currentWordIndex).join(' ').length;
    
    if (direction === 'forward') {
      const nextMatch = matches.find(m => m.index && m.index > currentPos);
      if (nextMatch && nextMatch.index) {
        const wordsBeforeNext = text.substring(0, nextMatch.index).split(/\s+/).length;
        targetIndex = Math.min(wordsBeforeNext, pageWords.length - 1);
      }
    } else {
      const prevMatch = [...matches].reverse().find(m => m.index && m.index < currentPos);
      if (prevMatch && prevMatch.index) {
        const wordsBeforePrev = text.substring(0, prevMatch.index).split(/\s+/).length;
        targetIndex = Math.max(wordsBeforePrev - 1, 0);
      }
    }
    
    setCurrentWordIndex(targetIndex);
  };

  const renderHighlightedText = () => {
    return (
      <Text style={styles.pageText}>
        {pageWords.map((word, index) => {
          const isHighlighted = index === currentWordIndex;
          return (
            <Text
              key={index}
              style={[
                styles.word,
                isHighlighted && {
                  backgroundColor: highlightColor,
                  color: '#000',
                  fontWeight: 'bold',
                },
              ]}
            >
              {word}{' '}
            </Text>
          );
        })}
      </Text>
    );
  };

  if (!book) {
    Alert.alert('Error', 'Book not found');
    router.back();
    return null;
  }

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
      <ScrollView style={styles.contentArea}>
        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Page {currentPage} of {totalPages}</Text>
            <Text style={styles.bookTitle}>{book.title}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a9eff" />
              <Text style={styles.loadingText}>Loading page...</Text>
            </View>
          ) : (
            <View style={styles.textBox}>
              {renderHighlightedText()}
            </View>
          )}
          
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
              (isGenerating || !pageText.trim() || loading) && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateAudio}
            disabled={isGenerating || !pageText.trim() || loading}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.generateButtonText}>Generating TTS...</Text>
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

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navButton, currentPage <= 1 && styles.navButtonDisabled]}
          onPress={goToPreviousPage}
          disabled={currentPage <= 1 || loading}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentPage <= 1 ? '#444' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentPage >= totalPages && styles.navButtonDisabled,
          ]}
          onPress={goToNextPage}
          disabled={currentPage >= totalPages || loading}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={currentPage >= totalPages ? '#444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <AudioPlayer
        audioUri={audioUri}
        words={pageWords}
        onPlaybackUpdate={(wordIndex) => setCurrentWordIndex(wordIndex)}
        onPlaybackComplete={() => {
          setCurrentWordIndex(0);
          // Auto-advance to next page if enabled
        }}
        onSkipWord={handleSkipWord}
        onSkipSentence={handleSkipSentence}
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
  header: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 14,
    color: '#888',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
  },
  textBox: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 16,
    minHeight: 300,
  },
  pageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 26,
  },
  word: {
    color: '#fff',
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
  pageInfoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
