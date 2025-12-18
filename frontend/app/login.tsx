import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  I18nManager,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { trackingApi } from '../services/api';
import { t } from '../utils/translations';

export default function LoginScreen() {
  const router = useRouter();
  const { setApiKey, setUsername } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const [username, setUsernameInput] = useState('picanto');
  const [password, setPasswordInput] = useState('picanto');
  const [loading, setLoading] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  // Load language on mount
  useEffect(() => {
    useLanguageStore.getState().loadLanguage();
  }, []);

  // Handle RTL for Arabic
  useEffect(() => {
    if (Platform.OS !== 'web') {
      I18nManager.forceRTL(language === 'ar');
    }
  }, [language]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('loginFailed', language), t('enterCredentials', language));
      return;
    }

    setLoading(true);
    try {
      const apiKey = await trackingApi.login(username, password);
      setApiKey(apiKey);
      setUsername(username);
      router.replace('/(tabs)/map');
    } catch (error: any) {
      Alert.alert(t('loginFailed', language), error.message || t('invalidCredentials', language));
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'ar' as const, name: 'العربية', flag: '🇩🇿' },
  ];

  const selectedLang = languages.find(l => l.code === language) || languages[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguages(!showLanguages)}
          >
            <Text style={styles.languageFlag}>{selectedLang.flag}</Text>
            <Text style={styles.languageName}>{selectedLang.name}</Text>
            <Ionicons 
              name={showLanguages ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>

          {showLanguages && (
            <View style={styles.languageDropdown}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguages(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageOptionText}>{lang.name}</Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.header}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('appName', language)}</Text>
          <Text style={styles.subtitle}>{t('appSubtitle', language)}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('username', language)}
              value={username}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('password', language)}
              value={password}
              onChangeText={setPasswordInput}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login', language)}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>{t('poweredBy', language)}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  languageContainer: {
    position: 'absolute',
    top: 50,
    right: 24,
    left: 24,
    zIndex: 1000,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageDropdown: {
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionActive: {
    backgroundColor: '#E3F2FD',
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 32,
  },
});
