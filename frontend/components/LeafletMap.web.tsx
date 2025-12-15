import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

// Component to fit bounds when vehicles change
function FitBounds({ vehicles }: { vehicles: VehicleMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      const bounds = L.latLngBounds(
        vehicles.map(v => [v.lat, v.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles, map]);

  return null;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  vehicles,
  onMarkerClick,
  center = [35.3764, 1.3218],
  zoom = 13,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      setMapCenter([vehicles[0].lat, vehicles[0].lng]);
    }
  }, [vehicles]);

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

export default LeafletMap;
