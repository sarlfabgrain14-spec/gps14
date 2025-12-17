import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useLanguageStore } from '../stores/languageStore';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export default function PreferencesScreen() {
  const router = useRouter();
  const { notificationsEnabled, setNotificationsEnabled } = usePreferencesStore();
  const { language } = useLanguageStore();
  const [isEnabling, setIsEnabling] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      setIsEnabling(true);
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setNotificationsEnabled(true);
          Alert.alert(
            'Notifications Activées',
            'Vous recevrez maintenant des notifications pour les nouveaux événements, même lorsque l\'application est verrouillée.'
          );
        } else {
          Alert.alert(
            'Erreur',
            'Impossible d\'activer les notifications. Veuillez vérifier les autorisations dans les paramètres de votre téléphone.'
          );
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'activation des notifications.');
      } finally {
        setIsEnabling(false);
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications Désactivées',
        'Vous ne recevrez plus de notifications push.'
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Préférences</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="notifications" size={18} /> Notifications
        </Text>
        <View style={styles.card}>
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="phone-portrait" size={24} color="#2196F3" />
              </View>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Notifications Push</Text>
                <Text style={styles.preferenceDescription}>
                  Recevoir les notifications des événements sur votre mobile, même lorsque l'appareil est verrouillé
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isEnabling}
              trackColor={{ false: '#ccc', true: '#81C784' }}
              thumbColor={notificationsEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {notificationsEnabled && (
            <View style={styles.notificationInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.notificationInfoText}>
                Les notifications sont actives. Vous serez alerté pour tous les nouveaux événements.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="information-circle" size={18} /> Informations
        </Text>
        <View style={styles.card}>
          <View style={styles.infoItem}>
            <Ionicons name="phone-portrait" size={20} color="#999" />
            <Text style={styles.infoText}>
              Les notifications fonctionnent en arrière-plan et vous alerteront instantanément
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="lock-closed" size={20} color="#999" />
            <Text style={styles.infoText}>
              Fonctionne même lorsque l'écran est verrouillé
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="battery-charging" size={20} color="#999" />
            <Text style={styles.infoText}>
              Optimisé pour ne pas drainer la batterie
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceInfo: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 16,
  },
  preferenceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  notificationInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#4CAF50',
    marginLeft: 8,
    lineHeight: 18,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
});
