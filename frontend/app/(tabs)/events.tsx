import React, { useEffect, useState } from 'react';
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
import { trackingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { t } from '../../utils/translations';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

interface Event {
  id: string;
  imei: string;
  name: string;
  event: string;
  dt_tracker: string;
  dt_server?: string;
  message?: string;
  lat?: number;
  lng?: number;
  location?: string;
}

export default function EventsScreen() {
  const router = useRouter();
  const { apiKey } = useAuthStore();
  const { language } = useLanguageStore();
  const [timeRange, setTimeRange] = useState<'30m' | '12h' | '7d'>('12h');

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  const { data: events, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['events', timeRange],
    queryFn: async () => {
      let data;
      if (timeRange === '30m') {
        data = await trackingApi.getLastEvents30M();
      } else if (timeRange === '7d') {
        data = await trackingApi.getLastEvents7D();
      } else {
        data = await trackingApi.getLastEvents();
      }

      // Handle both array and object responses
      let eventsArray = [];
      if (Array.isArray(data)) {
        eventsArray = data;
      } else if (data && typeof data === 'object') {
        eventsArray = Object.values(data);
      }

      if (eventsArray.length > 0) {
        return eventsArray.map((event: any, index: number) => ({
          id: `${event.imei || event.id || index}-${event.dt_tracker || event.dt_server || Date.now()}-${index}`,
          imei: event.imei || event.object_id || '',
          name: event.object_name || event.name || event.vehicle_name || `Véhicule ${event.imei || 'Inconnu'}`,
          event: event.event_name || event.event || event.type || event.alert_type || 'Événement système',
          dt_tracker: event.dt_tracker || event.dt_server || event.date || event.timestamp || new Date().toISOString(),
          dt_server: event.dt_server || event.dt_tracker,
          message: event.message || event.msg || event.description || event.alert_text || '',
          lat: event.lat ? parseFloat(event.lat) : undefined,
          lng: event.lng ? parseFloat(event.lng) : undefined,
          location: event.location || event.address || '',
        }));
      }
      return [];
    },
    refetchInterval: 30000, // 30 seconds
    enabled: !!apiKey,
  });

  const getEventIcon = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('sos')) return 'alert-circle';
    if (type.includes('speed')) return 'speedometer';
    if (type.includes('zone') || type.includes('geofence')) return 'location';
    if (type.includes('engine')) return 'power';
    if (type.includes('door')) return 'exit';
    if (type.includes('battery')) return 'battery-half';
    return 'information-circle';
  };

  const getEventColor = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('sos') || type.includes('alert')) return '#F44336';
    if (type.includes('warning')) return '#FF9800';
    return '#2196F3';
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // Navigate to map if we have coordinates
        if (item.lat && item.lng && item.imei) {
          router.push({
            pathname: '/(tabs)/map',
            params: { vehicleImei: item.imei },
          });
        }
      }}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getEventColor(item.event) + '20' },
          ]}
        >
          <Ionicons
            name={getEventIcon(item.event)}
            size={24}
            color={getEventColor(item.event)}
          />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventType}>{item.event}</Text>
          <Text style={styles.vehicleName}>{item.name}</Text>
        </View>
      </View>
      
      {item.message && <Text style={styles.message}>{item.message}</Text>}
      
      <View style={styles.footer}>
        <View style={styles.eventFooterLeft}>
          <Ionicons name="time-outline" size={16} color="#999" />
          <Text style={styles.timestamp}>{formatDate(item.dt_tracker)}</Text>
        </View>
        {item.location && (
          <View style={styles.eventLocation}>
            <Ionicons name="location-outline" size={14} color="#999" />
            <Text style={styles.eventLocationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
        {item.lat && item.lng && (
          <View style={styles.eventCoordinates}>
            <Ionicons name="navigate-outline" size={14} color="#2196F3" />
            <Text style={styles.eventCoordinatesText}>
              {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const TimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <TouchableOpacity
        style={[styles.timeButton, timeRange === '30m' && styles.timeButtonActive]}
        onPress={() => setTimeRange('30m')}
      >
        <Text
          style={[
            styles.timeButtonText,
            timeRange === '30m' && styles.timeButtonTextActive,
          ]}
        >
          30 Min
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.timeButton, timeRange === '12h' && styles.timeButtonActive]}
        onPress={() => setTimeRange('12h')}
      >
        <Text
          style={[
            styles.timeButtonText,
            timeRange === '12h' && styles.timeButtonTextActive,
          ]}
        >
          12 Hours
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.timeButton, timeRange === '7d' && styles.timeButtonActive]}
        onPress={() => setTimeRange('7d')}
      >
        <Text
          style={[
            styles.timeButtonText,
            timeRange === '7d' && styles.timeButtonTextActive,
          ]}
        >
          7 Days
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TimeRangeSelector />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t('loadingEvents', language)}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TimeRangeSelector />
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>{t('failedToLoad', language)}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>{t('retry', language)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!events || events.length === 0) {
    return (
      <View style={styles.container}>
        <TimeRangeSelector />
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('noEvents', language)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TimeRangeSelector />
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
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
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#2196F3',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vehicleName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'column',
    gap: 8,
  },
  eventFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  eventCoordinates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventCoordinatesText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
