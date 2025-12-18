import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useMapStore } from '../../stores/mapStore';
import { t } from '../../utils/translations';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LeafletMap from '../../components/LeafletMap';

interface VehicleLocation {
  imei: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  angle: number;
  dt_tracker: string;
}

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleImei?: string }>();
  const { apiKey, logout } = useAuthStore();
  const { language } = useLanguageStore();
  const { mapType, setMapType } = useMapStore();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [focusedVehicleImei, setFocusedVehicleImei] = useState<string | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  // Set focused vehicle from params
  useEffect(() => {
    if (params.vehicleImei) {
      setFocusedVehicleImei(params.vehicleImei);
      setSelectedVehicle(params.vehicleImei);
    }
  }, [params.vehicleImei]);

  const { data: vehicles, isLoading, error, refetch } = useQuery({
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

  const getMarkerColor = (vehicle: VehicleLocation) => {
    if (vehicle.speed > 0) return '#4CAF50';
    return '#F44336';
  };

  const getStatusText = (vehicle: VehicleLocation) => {
    if (vehicle.speed > 0) return t('moving', language);
    return t('stopped', language);
  };

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
      <View style={styles.centered}>
        <Ionicons name="car-sport-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>{t('noVehicles', language)}</Text>
      </View>
    );
  }

  // Prepare vehicles data for map
  let mapVehicles = vehicles.map((vehicle) => ({
    imei: vehicle.imei,
    name: vehicle.name,
    lat: vehicle.lat,
    lng: vehicle.lng,
    speed: vehicle.speed,
    angle: vehicle.angle,
    status: getStatusText(vehicle),
    color: getMarkerColor(vehicle),
  }));

  // Filter to show only focused vehicle if specified
  if (focusedVehicleImei) {
    mapVehicles = mapVehicles.filter(v => v.imei === focusedVehicleImei);
  }

  return (
    <View style={styles.container}>
      <LeafletMap
        vehicles={mapVehicles}
        onMarkerClick={(imei) => setSelectedVehicle(imei)}
        focusedVehicleImei={focusedVehicleImei}
      />

      {selectedVehicle && vehicles && (
        <View style={styles.infoCard}>
          {(() => {
            const vehicle = vehicles.find((v) => v.imei === selectedVehicle);
            if (!vehicle) return null;

            return (
              <>
                <View style={styles.infoHeader}>
                  <View style={styles.infoTitleContainer}>
                    <Ionicons name="car-sport" size={24} color="#2196F3" />
                    <View style={styles.infoTitleText}>
                      <Text style={styles.infoTitle}>{vehicle.name}</Text>
                      <Text style={styles.infoSubtitle}>{vehicle.imei}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.infoStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{vehicle.speed.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>km/h</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{vehicle.angle.toFixed(0)}°</Text>
                    <Text style={styles.statLabel}>{t('direction', language)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getMarkerColor(vehicle) },
                      ]}
                    />
                    <Text style={styles.statLabel}>{getStatusText(vehicle)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => {
                    router.push({
                      pathname: '/vehicle-detail',
                      params: { imei: vehicle.imei, name: vehicle.name },
                    });
                  }}
                >
                  <Text style={styles.detailsButtonText}>
                    {t('vehicleDetails', language)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#2196F3" />
                </TouchableOpacity>
              </>
            );
          })()}
        </View>
      )}

      <View style={styles.badge}>
        <Ionicons name="car-sport" size={20} color="#fff" />
        <Text style={styles.badgeText}>{vehicles?.length || 0}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>

      {focusedVehicleImei && (
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => {
            setFocusedVehicleImei(null);
            setSelectedVehicle(null);
          }}
        >
          <Ionicons name="apps" size={24} color="#fff" />
          <Text style={styles.showAllText}>{t('vehicles', language)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#F44336',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshButton: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  showAllButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  showAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
