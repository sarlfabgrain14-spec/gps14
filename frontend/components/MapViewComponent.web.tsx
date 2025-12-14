import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '../stores/languageStore';
import { useRouter } from 'expo-router';

// Web fallback - display a message
export const NativeMapView = React.forwardRef<any, any>((props, ref) => {
  const { language } = useLanguageStore();
  const router = useRouter();

  return (
    <View style={[styles.webContainer, props.style]}>
      <View style={styles.webMessage}>
        <Ionicons name="phone-portrait" size={64} color="#2196F3" />
        <Text style={styles.webMessageTitle}>
          {language === 'fr' ? 'Carte Interactive' : language === 'ar' ? 'خريطة تفاعلية' : 'Interactive Map'}
        </Text>
        <Text style={styles.webMessageText}>
          {language === 'fr'
            ? "La carte interactive est disponible sur l'application mobile. Utilisez Expo Go pour voir les véhicules sur la carte en temps réel."
            : language === 'ar'
            ? 'الخريطة التفاعلية متاحة على تطبيق الهاتف المحمول. استخدم Expo Go لرؤية المركبات على الخريطة في الوقت الفعلي.'
            : 'Interactive map is available on the mobile app. Use Expo Go to see vehicles on the map in real-time.'}
        </Text>
        <TouchableOpacity
          style={styles.vehiclesButton}
          onPress={() => router.push('/(tabs)/vehicles')}
        >
          <Ionicons name="list" size={24} color="#fff" />
          <Text style={styles.vehiclesButtonText}>
            {language === 'fr' ? 'Voir la Liste' : language === 'ar' ? 'عرض القائمة' : 'View List'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Dummy components for web
export const NativeMarker: React.FC<any> = () => null;
export const NativePolyline: React.FC<any> = () => null;
export const PROVIDER_DEFAULT = null;

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  webMessageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  vehiclesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  vehiclesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
