import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  apiKey: string | null;
  username: string | null;
  setApiKey: (key: string) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  apiKey: null,
  username: null,
  
  setApiKey: async (key: string) => {
    await AsyncStorage.setItem('apiKey', key);
    set({ apiKey: key });
  },
  
  setUsername: async (username: string) => {
    await AsyncStorage.setItem('username', username);
    set({ username });
  },
  
  logout: async () => {
    await AsyncStorage.multiRemove(['apiKey', 'username']);
    set({ apiKey: null, username: null });
  },
  
  loadAuth: async () => {
    const apiKey = await AsyncStorage.getItem('apiKey');
    const username = await AsyncStorage.getItem('username');
    set({ apiKey, username });
  },
}));

// Load auth on app start
useAuthStore.getState().loadAuth();
