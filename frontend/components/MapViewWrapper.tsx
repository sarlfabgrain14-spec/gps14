import { Platform } from 'react-native';

// This file is only used on native platforms
// On web, it should never be imported

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
}

export { MapView, Marker, PROVIDER_DEFAULT };
