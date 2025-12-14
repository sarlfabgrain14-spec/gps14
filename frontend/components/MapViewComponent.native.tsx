import React, { forwardRef } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import type { MapViewProps, MarkerProps, PolylineProps } from 'react-native-maps';

// Native implementation with react-native-maps
export const NativeMapView = forwardRef<any, MapViewProps>((props, ref) => {
  return <MapView ref={ref} provider={PROVIDER_DEFAULT} {...props} />;
});

export const NativeMarker: React.FC<MarkerProps> = (props) => {
  return <Marker {...props} />;
};

export const NativePolyline: React.FC<PolylineProps> = (props) => {
  return <Polyline {...props} />;
};

export { PROVIDER_DEFAULT };
