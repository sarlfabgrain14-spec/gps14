import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type Language = 'en' | 'fr' | 'ar';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  
  setLanguage: async (lang: Language) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem('language', lang);
      } else if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
      }
      set({ language: lang });
    } catch (error) {
      console.error('Error setting language:', error);
      set({ language: lang });
    }
  },
  
  loadLanguage: async () => {
    try {
      let lang: Language = 'en';
      
      if (Platform.OS !== 'web') {
        const stored = await AsyncStorage.getItem('language');
        if (stored) lang = stored as Language;
      } else if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('language');
        if (stored) lang = stored as Language;
      }
      
      set({ language: lang });
    } catch (error) {
      console.error('Error loading language:', error);
    }
  },
}));

// Load language on app start
if (typeof window !== 'undefined') {
  useLanguageStore.getState().loadLanguage();
}
