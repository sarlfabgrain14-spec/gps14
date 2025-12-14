import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { apiKey } = useAuthStore();

  // Redirect based on authentication status
  if (apiKey) {
    return <Redirect href="/(tabs)/map" />;
  }

  return <Redirect href="/login" />;
}
