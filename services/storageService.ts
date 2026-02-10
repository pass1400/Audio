import { User, Story } from '../types';

const USERS_KEY = 'storyteller_users';
const SESSION_KEY = 'storyteller_session';

// IndexedDB Constants
const DB_NAME = 'StoryWeaverDB';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

// IndexedDB Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const storageService = {
  // User Management (Keep in LocalStorage for simplicity)
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User): void => {
    const users = storageService.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  findUser: (username: string): User | undefined => {
    const users = storageService.getUsers();
    return users.find(u => u.username === username);
  },

  // Session Management
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  loginUser: (user: User): void => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  logoutUser: (): void => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Story Management (Moved to IndexedDB)
  getStories: async (userId: string): Promise<Story[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const allStories = request.result as Story[];
          const userStories = allStories
            .filter(s => s.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
          resolve(userStories);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      return [];
    }
  },

  saveStory: async (story: Story): Promise<void> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(story);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error saving story:', error);
      throw error;
    }
  },

  deleteStory: async (storyId: string): Promise<void> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(storyId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  }
};