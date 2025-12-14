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
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

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
  const mapRef = useRef<MapView>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    })();
  }, []);

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
          engine_status: loc.engine_status,
          address: loc.address,
        }));
      }
      return [];
    },
    refetchInterval: 10000,
    enabled: !!apiKey,
  });

  useEffect(() => {
    if (vehicles && vehicles.length > 0 && mapRef.current) {
      const coordinates = vehicles
        .filter((v) => v.lat && v.lng)
        .map((v) => ({
          latitude: v.lat,
          longitude: v.lng,
        }));

      if (coordinates.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [vehicles]);

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

  const getMarkerColor = (vehicle: VehicleLocation) => {
    if (vehicle.speed > 0) return '#4CAF50';
    return '#F44336';
  };

  const getStatusText = (vehicle: VehicleLocation) => {
    if (vehicle.speed > 0) return 'Moving';
    return 'Stopped';
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>Failed to load vehicles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="car-sport-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No vehicles found</Text>
      </View>
    );
  }

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
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
        showsCompass
        showsScale
        loadingEnabled
      >
        {vehicles?.map((vehicle) => (
          <Marker
            key={vehicle.imei}
            coordinate={{
              latitude: vehicle.lat,
              longitude: vehicle.lng,
            }}
            rotation={vehicle.angle}
            anchor={{ x: 0.5, y: 0.5 }}
            pinColor={getMarkerColor(vehicle)}
            title={vehicle.name}
            description={`Speed: ${vehicle.speed.toFixed(0)} km/h - ${getStatusText(vehicle)}`}
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
                    <Text style={styles.statLabel}>Direction</Text>
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
                  <Text style={styles.detailsButtonText}>View Details</Text>
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
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
