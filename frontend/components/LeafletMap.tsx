import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface VehicleMarker {
  imei: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  status: string;
  color: string;
  angle: number;
}

interface LeafletMapProps {
  vehicles: VehicleMarker[];
  onMarkerClick?: (imei: string) => void;
  center?: [number, number];
  zoom?: number;
  focusedVehicleImei?: string | null;
  mapType?: 'leaflet' | 'arcgis' | 'mapbox';
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  vehicles,
  onMarkerClick,
  center = [35.3764, 1.3218],
  zoom = 10,
  focusedVehicleImei = null,
  mapType = 'leaflet',
}) => {
  // Generate HTML for Leaflet map
  const generateMapHTML = () => {
    const vehiclesJSON = JSON.stringify(vehicles);
    const centerJSON = JSON.stringify(vehicles && vehicles.length > 0 ? [vehicles[0].lat, vehicles[0].lng] : center);

    // Define tile layers based on map type (only leaflet and arcgis)
    let tileLayerConfig = '';
    if (mapType === 'arcgis') {
      tileLayerConfig = `
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri, Maxar, Earthstar Geographics',
          maxZoom: 19
        }).addTo(map);
      `;
    } else {
      // Default to Leaflet/OpenStreetMap
      tileLayerConfig = `
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
      `;
    }

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
    
    // Add selected tile layer
    ${tileLayerConfig}
    
    // Add markers for each vehicle with arrow icons
    vehicles.forEach(vehicle => {
      // Create arrow SVG pointing in the direction of vehicle movement
      const arrowSvg = \`
        <svg width="24" height="30" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg" 
             style="transform: rotate(\${vehicle.angle}deg); filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));">
          <path d="M12 3 L21 18 L15 18 L15 27 L9 27 L9 18 L3 18 Z" 
                fill="\${vehicle.color}" 
                stroke="white" 
                stroke-width="1.5"/>
        </svg>
      \`;
      
      // Add vehicle name below the arrow
      const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: \`
          <div style="text-align: center; width: 60px; margin-left: -18px;">
            \${arrowSvg}
            <div style="
              font-family: Arial, sans-serif;
              font-size: 9px;
              font-weight: bold;
              color: #333;
              background-color: rgba(255,255,255,0.95);
              padding: 1px 3px;
              border-radius: 3px;
              margin-top: -3px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.2);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">\${vehicle.name}</div>
          </div>
        \`,
        iconSize: [24, 45],
        iconAnchor: [12, 30]
      });
      
      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(map)
        .bindPopup(\`
          <div style="min-width: 150px; font-family: Arial, sans-serif;">
            <strong style="font-size: 16px; color: #333;">\${vehicle.name}</strong><br/>
            <span style="font-size: 14px; color: #666;">Vitesse: \${vehicle.speed.toFixed(0)} km/h</span><br/>
            <span style="font-size: 14px; color: #666;">Direction: \${vehicle.angle.toFixed(0)}°</span><br/>
            <span style="font-size: 14px; color: #666;">Statut: \${vehicle.status}</span>
          </div>
        \`);
        
      marker.on('click', () => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            imei: vehicle.imei
          }));
        }
      });
    });
    
    // Fit bounds to show all vehicles or zoom to focused vehicle
    if (vehicles.length === 1) {
      // Single vehicle (focused) - zoom closer
      map.setView([vehicles[0].lat, vehicles[0].lng], 16);
    } else if (vehicles.length > 0) {
      // Multiple vehicles - fit bounds
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
        originWhitelist={['*']}
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
