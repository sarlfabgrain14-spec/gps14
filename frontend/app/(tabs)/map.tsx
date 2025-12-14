import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { t } from '../../utils/translations';
import { useRouter } from 'expo-router';

// Import maps only for native
const MapView = Platform.OS !== 'web' ? require('react-native-maps').default : null;
const Marker = Platform.OS !== 'web' ? require('react-native-maps').Marker : null;
const PROVIDER_DEFAULT = Platform.OS !== 'web' ? require('react-native-maps').PROVIDER_DEFAULT : null;

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
  const { apiKey, logout } = useAuthStore();
  const { language } = useLanguageStore();
  const mapRef = useRef<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

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

  useEffect(() => {
    if (vehicles && vehicles.length > 0 && mapRef.current && Platform.OS !== 'web') {
      const coordinates = vehicles.map((v) => ({
        latitude: v.lat,
        longitude: v.lng,
      }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [vehicles]);

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

  // Web fallback - show message to use mobile
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMessage}>
          <Ionicons name="phone-portrait" size={64} color="#2196F3" />
          <Text style={styles.webMessageTitle}>
            {language === 'fr' ? 'Carte Interactive' : language === 'ar' ? 'خريطة تفاعلية' : 'Interactive Map'}
          </Text>
          <Text style={styles.webMessageText}>
            {language === 'fr' 
              ? 'La carte interactive est disponible sur l\'application mobile. Utilisez Expo Go pour voir les véhicules sur la carte en temps réel.' 
              : language === 'ar'
              ? 'الخريطة التفاعلية متاحة على تطبيق الهاتف المحمول. استخدم Expo Go لرؤية المركبات على الخريطة في الوقت الفعلي.'
              : 'Interactive map is available on the mobile app. Use Expo Go to see vehicles on the map in real-time.'}
          </Text>
          <TouchableOpacity style={styles.vehiclesButton} onPress={() => router.push('/(tabs)/vehicles')}>
            <Ionicons name="list" size={24} color="#fff" />
            <Text style={styles.vehiclesButtonText}>
              {language === 'fr' ? 'Voir la Liste' : language === 'ar' ? 'عرض القائمة' : 'View List'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Native map view
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: vehicles[0]?.lat || 35.3764,
          longitude: vehicles[0]?.lng || 1.3218,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
      >
        {vehicles?.map((vehicle) => (
          <Marker
            key={vehicle.imei}
            coordinate={{
              latitude: vehicle.lat,
              longitude: vehicle.lng,
            }}
            pinColor={getMarkerColor(vehicle)}
            title={vehicle.name}
            description={`${t('speed', language)}: ${vehicle.speed.toFixed(0)} km/h - ${getStatusText(vehicle)}`}
            onPress={() => {
              setSelectedVehicle(vehicle.imei);
              mapRef.current?.animateToRegion({
                latitude: vehicle.lat,
                longitude: vehicle.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }}
          />
        ))}
      </MapView>

      {selectedVehicle && vehicles && (
        <View style={styles.infoCard}>
          {(() => {
            const vehicle = vehicles.find(v => v.imei === selectedVehicle);
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
                    <View style={[styles.statusDot, { backgroundColor: getMarkerColor(vehicle) }]} />
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
                  <Text style={styles.detailsButtonText}>{t('vehicleDetails', language)}</Text>
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

      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          if (vehicles && vehicles.length > 0) {
            const coordinates = vehicles.map(v => ({
              latitude: v.lat,
              longitude: v.lng,
            }));
            mapRef.current?.fitToCoordinates(coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }
        }}
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
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
  webMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
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
  centerButton: {
    position: 'absolute',
    top: 180,
    right: 16,
    backgroundColor: '#2196F3',
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
});
