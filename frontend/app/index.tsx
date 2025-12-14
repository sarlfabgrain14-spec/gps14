import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const { apiKey, isLoaded, loadAuth } = useAuthStore();

  // Load auth on mount
  useEffect(() => {
    if (!isLoaded) {
      loadAuth();
    }
  }, [isLoaded, loadAuth]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (apiKey && !inAuthGroup) {
      // User is authenticated but not in tabs, redirect to map
      router.replace('/(tabs)/map');
    } else if (!apiKey && inAuthGroup) {
      // User is not authenticated but in tabs, redirect to login
      router.replace('/login');
    } else if (!apiKey && segments.length === 0) {
      // User is not authenticated and on index, redirect to login
      router.replace('/login');
    }
  }, [apiKey, isLoaded, segments, router]);

  // Show loading while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
