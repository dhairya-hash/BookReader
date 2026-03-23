import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookStore } from '../store/bookStore';

const { width, height } = Dimensions.get('window');

export default function Reader() {
  const { bookId } = useLocalSearchParams();
  const { books, updateBookProgress, setCurrentBook } = useBookStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const book = books.find((b) => b.id === bookId);

  useEffect(() => {
    if (book) {
      setCurrentBook(book);
      setCurrentPage(book.currentPage || 1);
    }
  }, [book]);

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
            PDF reading is only available on Android and iOS devices.{'\n'}
            Please scan the QR code with your mobile device.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pdfPlaceholder}>
        <Ionicons name="document-text" size={80} color="#444" />
        <Text style={styles.placeholderTitle}>PDF Viewer</Text>
        <Text style={styles.placeholderText}>
          PDF display will be enabled when react-native-pdf is properly configured for your device.
        </Text>
        <Text style={styles.bookInfo}>Book: {book.title}</Text>
      </View>

      {/* Page Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.navButton, currentPage <= 1 && styles.navButtonDisabled]}
          onPress={() => {
            if (currentPage > 1) {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
              updateBookProgress(book.id, newPage, 0);
            }
          }}
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
            {currentPage} / {totalPages || '?'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentPage >= totalPages && styles.navButtonDisabled,
          ]}
          onPress={() => {
            if (totalPages === 0 || currentPage < totalPages) {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              updateBookProgress(book.id, newPage, 0);
            }
          }}
          disabled={currentPage >= totalPages && totalPages > 0}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={currentPage >= totalPages && totalPages > 0 ? '#444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Audio Player Placeholder - Will be implemented in Phase 3 */}
      <View style={styles.playerPlaceholder}>
        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.playerButton}>
            <Ionicons name="play-skip-back" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playerButtonMain}>
            <Ionicons name="play" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playerButton}>
            <Ionicons name="play-skip-forward" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        <Text style={styles.comingSoon}>TTS Audio player - Phase 2 & 3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  bookInfo: {
    fontSize: 14,
    color: '#4a9eff',
    marginTop: 8,
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
  pageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerPlaceholder: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    alignItems: 'center',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  playerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerButtonMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
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
