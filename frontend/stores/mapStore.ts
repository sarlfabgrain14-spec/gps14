import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MapType = 'leaflet' | 'arcgis' | 'mapbox';

interface MapState {
  mapType: MapType;
  setMapType: (type: MapType) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      mapType: 'leaflet',
      setMapType: (type) => set({ mapType: type }),
    }),
    {
      name: 'gps14-map-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
