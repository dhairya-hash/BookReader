import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Book {
  id: string;
  title: string;
  filePath: string;
  totalPages: number;
  currentPage: number;
  currentWord: number;
  dateAdded: string;
}

interface BookStore {
  books: Book[];
  currentBook: Book | null;
  addBook: (book: Book) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  updateBookProgress: (bookId: string, page: number, word: number) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;
  loadBooks: () => Promise<void>;
}

const BOOKS_STORAGE_KEY = '@pdf_reader_books';

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  currentBook: null,

  addBook: async (book: Book) => {
    const books = [...get().books, book];
    set({ books });
    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  },

  removeBook: async (bookId: string) => {
    const books = get().books.filter((b) => b.id !== bookId);
    set({ books });
    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  },

  updateBookProgress: async (bookId: string, page: number, word: number) => {
    const books = get().books.map((b) =>
      b.id === bookId ? { ...b, currentPage: page, currentWord: word } : b
    );
    set({ books });
    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  },

  setCurrentBook: (book: Book | null) => {
    set({ currentBook: book });
  },

  loadBooks: async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
      if (stored) {
        const books = JSON.parse(stored);
        set({ books });
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  },
}));
