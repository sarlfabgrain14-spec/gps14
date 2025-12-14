import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
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
  const mapRef = useRef<MapView>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Set API key
  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    })();
  }, []);

  // Fetch vehicles with auto-refresh every 10 seconds
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
    refetchInterval: 10000, // 10 seconds
    enabled: !!apiKey,
  });

  // Fit map to show all vehicles
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
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
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
    if (vehicle.speed > 0) return '#4CAF50'; // Green - moving
    return '#F44336'; // Red - stopped
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
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
            title={vehicle.name}
            description={`Speed: ${vehicle.speed.toFixed(0)} km/h`}
            pinColor={getMarkerColor(vehicle)}
            onCalloutPress={() => {
              router.push({
                pathname: '/vehicle-detail',
                params: { imei: vehicle.imei, name: vehicle.name },
              });
            }}
          />
        ))}
      </MapView>

      {/* Vehicle count badge */}
      <View style={styles.badge}>
        <Ionicons name="car-sport" size={20} color="#fff" />
        <Text style={styles.badgeText}>{vehicles?.length || 0}</Text>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
        <Ionicons name="refresh" size={24} color="#fff" />
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
  badge: {
    position: 'absolute',
    top: 16,
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
    top: 16,
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
    bottom: 80,
    right: 16,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
