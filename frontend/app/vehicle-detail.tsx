import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imei: string; name: string }>();
  const { apiKey } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  const { data: location, isLoading, refetch } = useQuery({
    queryKey: ['vehicle-location', params.imei],
    queryFn: async () => {
      const locations = await trackingApi.getObjectLocations(params.imei);
      if (Array.isArray(locations) && locations.length > 0) {
        const loc = locations[0];
        return {
          imei: loc.imei,
          name: loc.name || params.name,
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lng),
          speed: parseFloat(loc.speed || 0),
          angle: parseFloat(loc.angle || 0),
          altitude: parseFloat(loc.altitude || 0),
          dt_tracker: loc.dt_tracker,
          dt_server: loc.dt_server,
          engine_status: loc.engine_status,
          params: loc.params,
          address: loc.address,
        };
      }
      return null;
    },
    refetchInterval: 10000,
    enabled: !!apiKey && !!params.imei,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const openInMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
      Linking.openURL(url);
    }
  };

  const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Ionicons name={icon} size={20} color="#666" />
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>Vehicle not found</Text>
      </View>
    );
  }

  const getStatusColor = () => {
    if (location.speed > 0) return '#4CAF50';
    return '#F44336';
  };

  const getStatusText = () => {
    if (location.speed > 0) return 'Moving';
    return 'Stopped';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Map Placeholder */}
      <TouchableOpacity style={styles.mapPlaceholder} onPress={openInMaps}>
        <Ionicons name="map" size={48} color="#2196F3" />
        <Text style={styles.mapPlaceholderText}>Tap to open in Maps</Text>
        <Text style={styles.coordsText}>
          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </Text>
      </TouchableOpacity>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Text style={styles.vehicleName}>{location.name}</Text>
        </View>

        <View style={styles.speedContainer}>
          <Text style={styles.speedValue}>{location.speed.toFixed(0)}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>
        <InfoRow icon="finger-print" label="IMEI" value={location.imei} />
        <InfoRow
          icon="navigate"
          label="Direction"
          value={`${location.angle.toFixed(0)}\u00b0`}
        />
        <InfoRow
          icon="trending-up"
          label="Altitude"
          value={`${location.altitude.toFixed(0)} m`}
        />
        <InfoRow
          icon="time"
          label="Last Update"
          value={location.dt_tracker ? format(new Date(location.dt_tracker), 'PPpp') : 'N/A'}
        />
      </View>

      {/* Location Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <InfoRow icon="location" label="Latitude" value={location.lat.toFixed(6)} />
        <InfoRow icon="location" label="Longitude" value={location.lng.toFixed(6)} />
        {location.address && (
          <View style={styles.addressContainer}>
            <Ionicons name="map" size={20} color="#666" />
            <Text style={styles.addressText}>{location.address}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            router.push({
              pathname: '/history',
              params: { imei: params.imei, name: location.name },
            });
          }}
        >
          <Ionicons name="time" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>View History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  mapPlaceholder: {
    height: 250,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#2196F3',
    marginTop: 12,
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  speedValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  speedUnit: {
    fontSize: 24,
    color: '#666',
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressContainer: {
    flexDirection: 'row',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actionsContainer: {
    padding: 16,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
