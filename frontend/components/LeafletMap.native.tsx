import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

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
  // Generate HTML for Leaflet map
  const generateMapHTML = () => {
    const vehiclesJSON = JSON.stringify(vehicles);
    const centerJSON = JSON.stringify(center);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; }
    #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const vehicles = ${vehiclesJSON};
    const center = ${centerJSON};
    
    // Initialize map
    const map = L.map('map').setView(center, ${zoom});
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add markers for each vehicle
    vehicles.forEach(vehicle => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: \`<div style="
          background-color: \${vehicle.color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>\`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(map)
        .bindPopup(\`
          <strong>\${vehicle.name}</strong><br/>
          Vitesse: \${vehicle.speed.toFixed(0)} km/h<br/>
          Statut: \${vehicle.status}
        \`);
        
      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          imei: vehicle.imei
        }));
      });
    });
    
    // Fit bounds to show all vehicles
    if (vehicles.length > 0) {
      const bounds = vehicles.map(v => [v.lat, v.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  </script>
</body>
</html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick' && onMarkerClick) {
        onMarkerClick(data.imei);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default LeafletMap;
