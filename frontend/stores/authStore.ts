import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AuthState {
  apiKey: string | null;
  username: string | null;
  isLoaded: boolean;
  setApiKey: (key: string) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  apiKey: null,
  username: null,
  isLoaded: false,
  
  setApiKey: async (key: string) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem('apiKey', key);
      } else {
        localStorage.setItem('apiKey', key);
      }
      set({ apiKey: key });
    } catch (error) {
      console.error('Error setting API key:', error);
      set({ apiKey: key }); // Still set in memory
    }
  },
  
  setUsername: async (username: string) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem('username', username);
      } else {
        localStorage.setItem('username', username);
      }
      set({ username });
    } catch (error) {
      console.error('Error setting username:', error);
      set({ username }); // Still set in memory
    }
  },
  
  logout: async () => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.multiRemove(['apiKey', 'username']);
      } else {
        localStorage.removeItem('apiKey');
        localStorage.removeItem('username');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
    set({ apiKey: null, username: null });
  },
  
  loadAuth: async () => {
    try {
      let apiKey: string | null = null;
      let username: string | null = null;
      
      if (Platform.OS !== 'web') {
        apiKey = await AsyncStorage.getItem('apiKey');
        username = await AsyncStorage.getItem('username');
      } else if (typeof window !== 'undefined') {
        apiKey = localStorage.getItem('apiKey');
        username = localStorage.getItem('username');
      }
      
      set({ apiKey, username, isLoaded: true });
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ isLoaded: true });
    }
  },
}));

// Load auth only on client side
if (typeof window !== 'undefined') {
  useAuthStore.getState().loadAuth();
}
