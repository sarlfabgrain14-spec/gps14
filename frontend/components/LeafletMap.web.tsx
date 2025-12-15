import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface VehicleMarker {
  imei: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  status: string;
  color: string;
}

interface LeafletMapProps {
  vehicles: VehicleMarker[];
  onMarkerClick?: (imei: string) => void;
  center?: [number, number];
  zoom?: number;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  vehicles,
  onMarkerClick,
  center = [35.3764, 1.3218],
  zoom = 13,
}) => {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Import Leaflet components only on client side
    if (typeof window !== 'undefined') {
      import('react-leaflet')
        .then((module) => {
          const LeafletMapComponent = () => {
            const { MapContainer, TileLayer, Marker, Popup, useMap } = module;
            const L = require('leaflet');

            // Fix for default markers
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            function FitBounds({ vehicles }: { vehicles: VehicleMarker[] }) {
              const map = useMap();

              useEffect(() => {
                if (vehicles && vehicles.length > 0) {
                  const bounds = L.latLngBounds(
                    vehicles.map((v: VehicleMarker) => [v.lat, v.lng] as [number, number])
                  );
                  map.fitBounds(bounds, { padding: [50, 50] });
                }
              }, [vehicles, map]);

              return null;
            }

            const createCustomIcon = (color: string) => {
              return L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    background-color: ${color};
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  "></div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              });
            };

            const mapCenter: [number, number] = vehicles && vehicles.length > 0
              ? [vehicles[0].lat, vehicles[0].lng]
              : center;

            return (
              <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds vehicles={vehicles} />
                {vehicles.map((vehicle) => (
                  <Marker
                    key={vehicle.imei}
                    position={[vehicle.lat, vehicle.lng]}
                    icon={createCustomIcon(vehicle.color)}
                    eventHandlers={{
                      click: () => onMarkerClick?.(vehicle.imei),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <strong>{vehicle.name}</strong>
                        <br />
                        <span>Vitesse: {vehicle.speed.toFixed(0)} km/h</span>
                        <br />
                        <span>Statut: {vehicle.status}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            );
          };

          setMapComponent(() => LeafletMapComponent);
          setIsLoading(false);

          // Load Leaflet CSS
          if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
          }
        })
        .catch((error) => {
          console.error('Error loading Leaflet:', error);
          setIsLoading(false);
        });
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!MapComponent) {
    return null;
  }

  return <MapComponent />;
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LeafletMap;
