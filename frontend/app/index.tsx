import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { apiKey, isLoaded, loadAuth } = useAuthStore();

  // Load auth on mount
  useEffect(() => {
    if (!isLoaded) {
      loadAuth();
    }
  }, [isLoaded, loadAuth]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (apiKey) {
    return <Redirect href="/(tabs)/map" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
