import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { t } from '../../utils/translations';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

interface VehicleLocation {
  imei: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  angle: number;
  dt_tracker: string;
  engine_status?: string;
  address?: string;
}

export default function MapScreen() {
  const router = useRouter();
  const { apiKey, logout } = useAuthStore();
  const { language } = useLanguageStore();

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  const { data: vehicles, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['vehicle-locations'],
    queryFn: async () => {
      const locations = await trackingApi.getObjectLocations('*');
      if (Array.isArray(locations)) {
        return locations.map((loc: any) => ({
          imei: loc.imei,
          name: loc.name || loc.imei,
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lng),
          speed: parseFloat(loc.speed || 0),
          angle: parseFloat(loc.angle || 0),
          dt_tracker: loc.dt_tracker,
          engine_status: loc.engine_status,
          address: loc.address,
        }));
      }
      return [];
    },
    refetchInterval: 10000,
    enabled: !!apiKey,
  });

  const handleLogout = () => {
    Alert.alert(t('logout', language), t('logoutConfirm', language), [
      { text: t('cancel', language), style: 'cancel' },
      {
        text: t('logout', language),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const getStatusColor = (vehicle: VehicleLocation) => {
    if (vehicle.speed > 0) return '#4CAF50';
    return '#F44336';
  };

  const getStatusText = (vehicle: VehicleLocation) => {
    if (vehicle.speed > 0) return t('moving', language);
    return t('stopped', language);
  };

  const formatLastUpdate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM dd, HH:mm');
    } catch {
      return dateStr;
    }
  };

  const renderVehicle = ({ item }: { item: VehicleLocation }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => {
          router.push({
            pathname: '/vehicle-detail',
            params: { imei: item.imei, name: item.name },
          });
        }}
      >
        <View style={styles.vehicleInfo}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item) }]} />
          <View style={styles.vehicleText}>
            <Text style={styles.vehicleName}>{item.name}</Text>
            <Text style={styles.vehicleImei}>{item.imei}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="speedometer" size={20} color="#666" />
            <Text style={styles.infoLabel}>{t('speed', language)}</Text>
            <Text style={styles.infoValue}>{item.speed.toFixed(0)} km/h</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="navigate" size={20} color="#666" />
            <Text style={styles.infoLabel}>{t('direction', language)}</Text>
            <Text style={styles.infoValue}>{item.angle.toFixed(0)}°</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons 
              name={item.speed > 0 ? 'play-circle' : 'stop-circle'} 
              size={20} 
              color={getStatusColor(item)} 
            />
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(item) }]}>
              {getStatusText(item)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => openInMaps(item.lat, item.lng, item.name)}
        >
          <Ionicons name="map" size={20} color="#2196F3" />
          <Text style={styles.mapButtonText}>
            {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
          </Text>
          <Ionicons name="open-outline" size={16} color="#2196F3" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons name="time-outline" size={16} color="#999" />
          <Text style={styles.lastUpdate}>
            {t('lastUpdate', language)}: {formatLastUpdate(item.dt_tracker)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('loadingVehicles', language)}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{t('failedToLoad', language)}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>{t('retry', language)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('liveTracking', language)}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => refetch()}>
              <Ionicons name="refresh" size={24} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centered}>
          <Ionicons name="car-sport-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('noVehicles', language)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('liveTracking', language)}</Text>
          <Text style={styles.headerSubtitle}>
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : t('vehicles', language)} • {t('autoRefresh', language)} 10s
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => refetch()}>
            <Ionicons name="refresh" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.imei}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#2196F3']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  vehicleText: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  vehicleImei: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  mapButtonText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
    marginHorizontal: 8,
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#999',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
