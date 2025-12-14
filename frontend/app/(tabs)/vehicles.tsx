import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

interface Vehicle {
  imei: string;
  name: string;
  lat?: number;
  lng?: number;
  speed?: number;
  dt_tracker?: string;
  engine_status?: string;
}

export default function VehiclesScreen() {
  const router = useRouter();
  const { apiKey } = useAuthStore();

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  const { data: vehicles, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const [objects, locations] = await Promise.all([
        trackingApi.getUserObjects(),
        trackingApi.getObjectLocations('*'),
      ]);

      const locationMap = new Map();
      if (Array.isArray(locations)) {
        locations.forEach((loc: any) => {
          locationMap.set(loc.imei, loc);
        });
      }

      if (Array.isArray(objects)) {
        return objects.map((obj: any) => {
          const location = locationMap.get(obj.imei) || {};
          return {
            imei: obj.imei,
            name: obj.name || obj.imei,
            lat: parseFloat(location.lat || 0),
            lng: parseFloat(location.lng || 0),
            speed: parseFloat(location.speed || 0),
            dt_tracker: location.dt_tracker,
            engine_status: location.engine_status,
          };
        });
      }
      return [];
    },
    refetchInterval: 10000,
    enabled: !!apiKey,
  });

  const getStatusIcon = (vehicle: Vehicle) => {
    if (!vehicle.speed) return 'pause-circle';
    if (vehicle.speed > 0) return 'play-circle';
    return 'stop-circle';
  };

  const getStatusColor = (vehicle: Vehicle) => {
    if (!vehicle.speed) return '#9E9E9E';
    if (vehicle.speed > 0) return '#4CAF50';
    return '#F44336';
  };

  const getStatusText = (vehicle: Vehicle) => {
    if (!vehicle.speed) return 'No Data';
    if (vehicle.speed > 0) return 'Moving';
    return 'Stopped';
  };

  const formatLastUpdate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM dd, HH:mm');
    } catch {
      return dateStr;
    }
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: '/vehicle-detail',
          params: { imei: item.imei, name: item.name },
        });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Ionicons name="car-sport" size={24} color="#2196F3" />
          <View style={styles.vehicleText}>
            <Text style={styles.vehicleName}>{item.name}</Text>
            <Text style={styles.vehicleImei}>{item.imei}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons
              name={getStatusIcon(item)}
              size={20}
              color={getStatusColor(item)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
              {getStatusText(item)}
            </Text>
          </View>

          {item.speed !== undefined && (
            <View style={styles.statusItem}>
              <Ionicons name="speedometer" size={20} color="#666" />
              <Text style={styles.statusValue}>{item.speed.toFixed(0)} km/h</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons name="time-outline" size={16} color="#999" />
          <Text style={styles.lastUpdate}>
            Last update: {formatLastUpdate(item.dt_tracker)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
  vehicleText: {
    marginLeft: 12,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
