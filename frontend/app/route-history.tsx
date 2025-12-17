import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { t } from '../utils/translations';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface Vehicle {
  imei: string;
  name: string;
}

export default function RouteHistoryScreen() {
  const router = useRouter();
  const { apiKey } = useAuthStore();
  const { language } = useLanguageStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState(new Date());
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  useEffect(() => {
    if (apiKey) {
      trackingApi.setApiKey(apiKey);
    }
  }, [apiKey]);

  // Get list of vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-history'],
    queryFn: async () => {
      const data = await trackingApi.getUserObjects();
      if (Array.isArray(data)) {
        return data.map((v: any) => ({
          imei: v.imei,
          name: v.name || v.imei,
        }));
      }
      return [];
    },
    enabled: !!apiKey,
  });

  const handleViewRoute = () => {
    if (!selectedVehicle) {
      alert('Veuillez sélectionner un véhicule');
      return;
    }

    const vehicle = vehicles?.find((v: Vehicle) => v.imei === selectedVehicle);
    router.push({
      pathname: '/history',
      params: {
        imei: selectedVehicle,
        name: vehicle?.name || '',
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
    });
  };

  if (!vehicles) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Historique des Parcours</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="car-sport" size={18} /> Sélectionner un véhicule
        </Text>
        <View style={styles.vehicleList}>
          {vehicles.map((vehicle: Vehicle) => (
            <TouchableOpacity
              key={vehicle.imei}
              style={[
                styles.vehicleOption,
                selectedVehicle === vehicle.imei && styles.vehicleOptionSelected,
              ]}
              onPress={() => setSelectedVehicle(vehicle.imei)}
            >
              <Ionicons
                name={selectedVehicle === vehicle.imei ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={selectedVehicle === vehicle.imei ? '#2196F3' : '#999'}
              />
              <Text
                style={[
                  styles.vehicleName,
                  selectedVehicle === vehicle.imei && styles.vehicleNameSelected,
                ]}
              >
                {vehicle.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="calendar" size={18} /> Période
        </Text>

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date de début:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDateFromPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <Text style={styles.dateText}>{format(dateFrom, 'dd/MM/yyyy HH:mm')}</Text>
          </TouchableOpacity>
        </View>

        {showDateFromPicker && (
          <DateTimePicker
            value={dateFrom}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDateFromPicker(false);
              if (selectedDate) {
                setDateFrom(selectedDate);
              }
            }}
          />
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date de fin:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDateToPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <Text style={styles.dateText}>{format(dateTo, 'dd/MM/yyyy HH:mm')}</Text>
          </TouchableOpacity>
        </View>

        {showDateToPicker && (
          <DateTimePicker
            value={dateTo}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDateToPicker(false);
              if (selectedDate) {
                setDateTo(selectedDate);
              }
            }}
          />
        )}

        <View style={styles.quickButtonsContainer}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              setDateFrom(new Date(Date.now() - 24 * 60 * 60 * 1000));
              setDateTo(new Date());
            }}
          >
            <Text style={styles.quickButtonText}>24h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              setDateFrom(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
              setDateTo(new Date());
            }}
          >
            <Text style={styles.quickButtonText}>3 jours</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => {
              setDateFrom(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
              setDateTo(new Date());
            }}
          >
            <Text style={styles.quickButtonText}>7 jours</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.viewButton, !selectedVehicle && styles.viewButtonDisabled]}
        onPress={handleViewRoute}
        disabled={!selectedVehicle}
      >
        <Ionicons name="map" size={24} color="#fff" />
        <Text style={styles.viewButtonText}>Voir le Parcours</Text>
      </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  vehicleList: {
    gap: 12,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  vehicleOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  vehicleName: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  vehicleNameSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewButtonDisabled: {
    backgroundColor: '#ccc',
  },
  viewButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
});
