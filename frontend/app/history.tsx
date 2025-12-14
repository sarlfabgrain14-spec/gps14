import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

interface RoutePoint {
  lat: number;
  lng: number;
  speed: number;
  dt_tracker: string;
}

export default function HistoryScreen() {
  const params = useLocalSearchParams<{ imei: string; name: string }>();
  const { apiKey } = useAuthStore();
  const [selectedDays, setSelectedDays] = useState(1);

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicle-route', params.imei, selectedDays],
    queryFn: async () => {
      const dateFrom = format(startOfDay(subDays(new Date(), selectedDays)), 'yyyy-MM-dd HH:mm:ss');
      const dateTo = format(endOfDay(new Date()), 'yyyy-MM-dd HH:mm:ss');
      
      const route = await trackingApi.getObjectRoute(params.imei, dateFrom, dateTo, 5);
      
      if (route && Array.isArray(route)) {
        const points: RoutePoint[] = route.map((point: any) => ({
          lat: parseFloat(point.lat),
          lng: parseFloat(point.lng),
          speed: parseFloat(point.speed || 0),
          dt_tracker: point.dt_tracker,
        }));

        const totalDistance = route.reduce((sum: number, point: any) => 
          sum + parseFloat(point.distance || 0), 0
        );

        const maxSpeed = Math.max(...points.map(p => p.speed));
        const avgSpeed = points.length > 0 
          ? points.reduce((sum, p) => sum + p.speed, 0) / points.length 
          : 0;

        return {
          points,
          totalDistance: totalDistance / 1000, // Convert to km
          maxSpeed,
          avgSpeed,
          duration: route.length > 0 ? calculateDuration(points) : 0,
        };
      }
      
      return {
        points: [],
        totalDistance: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        duration: 0,
      };
    },
    enabled: !!apiKey && !!params.imei,
  });

  const calculateDuration = (points: RoutePoint[]) => {
    if (points.length < 2) return 0;
    try {
      const start = new Date(points[0].dt_tracker);
      const end = new Date(points[points.length - 1].dt_tracker);
      return (end.getTime() - start.getTime()) / 1000 / 60; // Minutes
    } catch {
      return 0;
    }
  };

  const DaySelector = () => (
    <View style={styles.daySelector}>
      {[1, 3, 7].map((days) => (
        <TouchableOpacity
          key={days}
          style={[
            styles.dayButton,
            selectedDays === days && styles.dayButtonActive,
          ]}
          onPress={() => setSelectedDays(days)}
        >
          <Text
            style={[
              styles.dayButtonText,
              selectedDays === days && styles.dayButtonTextActive,
            ]}
          >
            {days} {days === 1 ? 'Day' : 'Days'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const StatCard = ({ icon, label, value, unit }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={32} color="#2196F3" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DaySelector />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading route history...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <DaySelector />
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>Failed to load route</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!data || data.points.length === 0) {
    return (
      <View style={styles.container}>
        <DaySelector />
        <View style={styles.centered}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No route data available</Text>
          <Text style={styles.emptySubtext}>
            No movement recorded in the last {selectedDays} {selectedDays === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>
    );
  }

  const coordinates = data.points.map((point) => ({
    latitude: point.lat,
    longitude: point.lng,
  }));

  return (
    <ScrollView style={styles.container}>
      <DaySelector />

      {/* Map with Route */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: data.points[0].lat,
            longitude: data.points[0].lng,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {/* Route polyline */}
          <Polyline
            coordinates={coordinates}
            strokeColor="#2196F3"
            strokeWidth={3}
          />
          
          {/* Start marker */}
          <Marker
            coordinate={coordinates[0]}
            title="Start"
            pinColor="#4CAF50"
          />
          
          {/* End marker */}
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            title="End"
            pinColor="#F44336"
          />
        </MapView>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="speedometer"
          label="Distance"
          value={data.totalDistance.toFixed(1)}
          unit="km"
        />
        <StatCard
          icon="time"
          label="Duration"
          value={Math.round(data.duration)}
          unit="min"
        />
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="trending-up"
          label="Max Speed"
          value={Math.round(data.maxSpeed)}
          unit="km/h"
        />
        <StatCard
          icon="analytics"
          label="Avg Speed"
          value={Math.round(data.avgSpeed)}
          unit="km/h"
        />
      </View>

      {/* Route Points */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route Points ({data.points.length})</Text>
        {data.points.slice(0, 10).map((point, index) => (
          <View key={index} style={styles.pointRow}>
            <View style={styles.pointIcon}>
              <Ionicons name="location" size={16} color="#2196F3" />
            </View>
            <View style={styles.pointInfo}>
              <Text style={styles.pointTime}>
                {format(new Date(point.dt_tracker), 'HH:mm:ss')}
              </Text>
              <Text style={styles.pointCoords}>
                {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
              </Text>
            </View>
            <Text style={styles.pointSpeed}>{Math.round(point.speed)} km/h</Text>
          </View>
        ))}
        {data.points.length > 10 && (
          <Text style={styles.morePoints}>
            + {data.points.length - 10} more points
          </Text>
        )}
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
    padding: 32,
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
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  daySelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#2196F3',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statUnit: {
    fontSize: 14,
    color: '#666',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pointTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pointCoords: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  pointSpeed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  morePoints: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },
});
