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
import { format } from 'date-fns';

interface Event {
  id: string;
  imei: string;
  name: string;
  event: string;
  dt_tracker: string;
  message?: string;
}

export default function EventsScreen() {
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

      if (Array.isArray(data) && data.length > 0) {
        return data.map((event: any, index: number) => ({
          id: `${event.imei}-${event.dt_tracker}-${index}`,
          imei: event.imei,
          name: event.name || event.imei || 'Unknown Vehicle',
          event: event.event || event.type || 'System Event',
          dt_tracker: event.dt_tracker || event.dt_server || new Date().toISOString(),
          message: event.message || event.msg || '',
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
    <View style={styles.card}>
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
        <Ionicons name="time-outline" size={16} color="#999" />
        <Text style={styles.timestamp}>{formatDate(item.dt_tracker)}</Text>
      </View>
    </View>
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
          <Text style={styles.loadingText}>Loading events...</Text>
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
          <Text style={styles.errorText}>Failed to load events</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
          <Text style={styles.emptyText}>No events found</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
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
