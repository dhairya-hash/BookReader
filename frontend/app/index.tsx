import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useBookStore } from '../store/bookStore';

export default function Index() {
  const { books, addBook, loadBooks } = useBookStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Create permanent storage directory
        const booksDir = `${FileSystem.documentDirectory}books/`;
        const dirInfo = await FileSystem.getInfoAsync(booksDir);
        
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });
        }

        // Copy file to permanent location
        const fileName = file.name;
        const newPath = `${booksDir}${Date.now()}_${fileName}`;
        await FileSystem.copyAsync({
          from: file.uri,
          to: newPath,
        });

        // Add to book library
        await addBook({
          id: Date.now().toString(),
          title: fileName.replace('.pdf', ''),
          filePath: newPath,
          totalPages: 0, // Will be calculated when opening
          currentPage: 0,
          currentWord: 0,
          dateAdded: new Date().toISOString(),
        });

        Alert.alert('Success', `${fileName} added to library!`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to import PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openBook = (bookId: string) => {
    router.push({
      pathname: '/reader',
      params: { bookId },
    });
  };

  const renderBook = ({ item }: any) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => openBook(item.id)}
    >
      <View style={styles.bookIcon}>
        <Ionicons name="book" size={40} color="#4a9eff" />
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookMeta}>
          {item.currentPage > 0 ? `Page ${item.currentPage}` : 'Not started'}
        </Text>
        <Text style={styles.bookDate}>
          Added: {new Date(item.dateAdded).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4a9eff" />
        </View>
      )}

      {books.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={80} color="#444" />
          <Text style={styles.emptyTitle}>No Books Yet</Text>
          <Text style={styles.emptyText}>
            Import your first PDF to start reading
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={pickDocument}
        disabled={loading}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
      >
        <Ionicons name="settings-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bookIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0a2540',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  bookMeta: {
    fontSize: 14,
    color: '#4a9eff',
    marginBottom: 2,
  },
  bookDate: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  settingsButton: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
