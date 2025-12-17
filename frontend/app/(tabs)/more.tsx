import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'expo-router';

export default function MoreScreen() {
  const router = useRouter();
  const { apiKey, username, logout } = useAuthStore();

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  // Fetch zones count
  const { data: zones } = useQuery({
    queryKey: ['zones'],
    queryFn: () => trackingApi.getUserZones(),
    enabled: !!apiKey,
  });

  // Fetch markers count
  const { data: markers } = useQuery({
    queryKey: ['markers'],
    queryFn: () => trackingApi.getUserMarkers(),
    enabled: !!apiKey,
  });

  // Fetch routes count
  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => trackingApi.getUserRoutes(),
    enabled: !!apiKey,
  });

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    badge,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    badge?: number;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={24} color="#2196F3" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {onPress && <Ionicons name="chevron-forward" size={24} color="#ccc" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.username}>{username || 'User'}</Text>
        <Text style={styles.userEmail}>GPS Tracking System</Text>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.card}>
          <MenuItem
            icon="location"
            title="Geofencing Zones"
            subtitle="Manage virtual boundaries"
            badge={Array.isArray(zones) ? zones.length : 0}
            onPress={() => Alert.alert('Coming Soon', 'Zone management feature')}
          />
          <MenuItem
            icon="pin"
            title="Markers"
            subtitle="Saved locations"
            badge={Array.isArray(markers) ? markers.length : 0}
            onPress={() => Alert.alert('Coming Soon', 'Markers feature')}
          />
          <MenuItem
            icon="trail-sign"
            title="Routes"
            subtitle="Predefined routes"
            badge={Array.isArray(routes) ? routes.length : 0}
            onPress={() => Alert.alert('Coming Soon', 'Routes feature')}
          />
        </View>
      </View>

      {/* Tracking Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking</Text>
        <View style={styles.card}>
          <MenuItem
            icon="map"
            title="Historique des Parcours"
            subtitle="Voir les trajets par véhicule et période"
            onPress={() => router.push('/route-history')}
          />
          <MenuItem
            icon="construct"
            title="Maintenance"
            subtitle="Vehicle maintenance logs"
            onPress={() => Alert.alert('Coming Soon', 'Maintenance tracking')}
          />
          <MenuItem
            icon="cash"
            title="Expenses"
            subtitle="Track vehicle expenses"
            onPress={() => Alert.alert('Coming Soon', 'Expense tracking')}
          />
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <MenuItem
            icon="settings"
            title="Préférences"
            subtitle="Notifications et paramètres"
            onPress={() => router.push('/preferences')}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <View style={styles.card}>
          <MenuItem icon="information-circle" title="About" subtitle="App version 2.0.1" />
          <MenuItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get assistance"
            onPress={() => Alert.alert('Support', 'Contact: support@gps-14.net')}
          />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by GPS-14.NET</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userSection: {
    backgroundColor: '#2196F3',
    padding: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});
