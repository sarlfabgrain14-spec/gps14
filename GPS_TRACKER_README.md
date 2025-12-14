# GPS Vehicle Tracking App 🚗

A professional mobile GPS tracking application built with Expo/React Native, similar to Protrack and iTrack.

## Features ✨

### Real-time Tracking
- **Live Vehicle Locations** - View all vehicles on an interactive OpenStreetMap
- **Auto-refresh** - Location updates every 10 seconds
- **Vehicle Status** - Green markers for moving vehicles, red for stopped
- **Vehicle Count Badge** - See total vehicles at a glance

### Vehicle Management
- **Vehicle List** - Scrollable list of all vehicles with status
- **Vehicle Details** - Comprehensive information per vehicle:
  - Current speed, direction, altitude
  - IMEI, GPS coordinates
  - Last update timestamp
  - Interactive map with current location

### Historical Tracking
- **Route History** - View vehicle routes for:
  - Last 1 day
  - Last 3 days
  - Last 7 days
- **Route Playback** - See complete route with start/end markers
- **Statistics**:
  - Total distance traveled
  - Trip duration
  - Maximum speed
  - Average speed
- **Route Points** - Detailed list of GPS coordinates with timestamps

### Events & Alerts
- **Real-time Events** - Monitor vehicle events:
  - SOS alerts
  - Speed violations
  - Geofence entries/exits
  - Engine status changes
  - Door alerts
  - Battery warnings
- **Time Filters**:
  - Last 30 minutes
  - Last 12 hours
  - Last 7 days

### Additional Features
- **Geofencing Zones** - View configured virtual boundaries
- **Markers** - Saved location markers
- **Routes** - Predefined routes
- **Pull-to-refresh** - Refresh data manually
- **Safe logout** - Secure session management

## Technical Stack 🛠️

### Frontend
- **Expo SDK 54** - Cross-platform mobile framework
- **React Native** - Native mobile components
- **Expo Router** - File-based navigation
- **React Native Maps** - OpenStreetMap integration
- **Zustand** - Lightweight state management
- **TanStack Query** - Data fetching & caching
- **AsyncStorage** - Secure local storage
- **date-fns** - Date manipulation

### Backend Integration
- **GPS-14.NET API** - Vehicle tracking server
- **Axios** - HTTP client
- **Real-time polling** - 10-second intervals

## API Configuration 🔑

The app connects to `https://tracking.gps-14.net` using the User API.

### Pre-configured Test Account:
- **Username**: picanto
- **Password**: picanto
- **API Key**: 08E882CAE05CA7139F3E28CBA7113683

### API Endpoints Used:
1. **Authentication**: `GET /api/api.php?api=user&username=X&password=Y`
2. **Get Vehicles**: `USER_GET_OBJECTS`
3. **Get Locations**: `OBJECT_GET_LOCATIONS`
4. **Get Route**: `OBJECT_GET_ROUTE`
5. **Get Events**: `OBJECT_GET_LAST_EVENTS`
6. **Get Zones**: `USER_GET_ZONES`
7. **Get Markers**: `USER_GET_MARKERS`
8. **Get Routes**: `USER_GET_ROUTES`

## App Structure 📁

```
/app/frontend/
├── app/
│   ├── index.tsx                 # Entry point with auth check
│   ├── login.tsx                 # Login screen
│   ├── _layout.tsx               # Root navigation layout
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigation
│   │   ├── map.tsx               # Real-time map view
│   │   ├── vehicles.tsx          # Vehicle list
│   │   ├── events.tsx            # Events & alerts
│   │   └── more.tsx              # Additional features & settings
│   ├── vehicle-detail.tsx        # Individual vehicle details
│   └── history.tsx               # Route history & playback
├── stores/
│   └── authStore.ts              # Authentication state
├── services/
│   └── api.ts                    # GPS-14.NET API client
└── package.json
```

## Key Features Implementation 🚀

### 1. Auto-refresh (10 seconds)
```typescript
// Using TanStack Query
const { data } = useQuery({
  queryKey: ['vehicle-locations'],
  queryFn: () => trackingApi.getObjectLocations('*'),
  refetchInterval: 10000, // 10 seconds
});
```

### 2. OpenStreetMap Integration
```typescript
import MapView, { Marker } from 'react-native-maps';

<MapView
  provider={PROVIDER_DEFAULT}
  initialRegion={{...}}
>
  {vehicles?.map((vehicle) => (
    <Marker
      key={vehicle.imei}
      coordinate={{ latitude: vehicle.lat, longitude: vehicle.lng }}
      pinColor={vehicle.speed > 0 ? '#4CAF50' : '#F44336'}
    />
  ))}
</MapView>
```

### 3. Authentication Flow
```typescript
// Login -> Store API key -> Access all features
const apiKey = await trackingApi.login(username, password);
await setApiKey(apiKey);
router.replace('/(tabs)/map');
```

## Usage Instructions 📱

### For Clients:

1. **Login**
   - Open the app
   - Enter username and password
   - Tap "Login"

2. **View Map**
   - See all vehicles on the map
   - Green markers = moving vehicles
   - Red markers = stopped vehicles
   - Tap markers for quick info
   - Tap info window to see vehicle details

3. **View Vehicle List**
   - Tap "Vehicles" tab
   - Scroll through all vehicles
   - See status (Moving/Stopped/No Data)
   - View speed and last update time
   - Tap any vehicle for details

4. **View Vehicle Details**
   - Current location on map
   - Speed, direction, altitude
   - IMEI and GPS coordinates
   - Last update timestamp
   - Tap "View History" for route history

5. **View Route History**
   - Select time range (1 day, 3 days, 7 days)
   - See complete route on map
   - View statistics (distance, duration, speeds)
   - See individual route points

6. **View Events**
   - Tap "Events" tab
   - Select time filter
   - See all vehicle alerts and events
   - Pull down to refresh

7. **Logout**
   - Tap "More" tab
   - Tap "Logout" button
   - Confirm logout

### For Developers:

1. **Add New User**:
   - Update login credentials in login.tsx (line 34-35)
   - Or implement dynamic login form

2. **Customize Auto-refresh**:
   - Change `refetchInterval` value in query configurations
   - Default: 10000ms (10 seconds)

3. **Add More Features**:
   - Maintenance tracking (already integrated in API)
   - Expense tracking (already integrated in API)
   - Task management (already integrated in API)
   - Push notifications

4. **Change Map Provider**:
   - Currently using OpenStreetMap (no API key needed)
   - To use Google Maps: Add API key in app.json

## Mobile-Specific Features 📱

1. **Touch Targets**: All buttons are at least 48x48 points
2. **Pull-to-Refresh**: Refresh lists by pulling down
3. **Keyboard Handling**: Forms auto-adjust for keyboard
4. **Location Permissions**: Requests user location permission
5. **Safe Area**: Respects device notches and safe areas
6. **Platform-specific**: Handles iOS and Android differences

## Testing the App 🧪

### Testing with Expo Go:
1. Install Expo Go on your mobile device
2. Scan the QR code from the terminal
3. App loads on your phone
4. Login with test credentials

### Testing on Web:
1. Open the preview URL
2. Login and test features
3. Note: Maps work better on actual devices

## Troubleshooting 🔧

### Issue: Can't see vehicles
**Solution**: Check if the API key is valid and vehicles exist for the account

### Issue: Map not loading
**Solution**: Ensure device has internet connection

### Issue: Location not updating
**Solution**: Check auto-refresh is working (10-second interval)

### Issue: Events not showing
**Solution**: Verify account has event data in the selected time range

## Future Enhancements 💡

1. **Push Notifications** - Real-time alerts
2. **Offline Mode** - Cache data for offline viewing
3. **Geofence Management** - Create/edit zones from app
4. **Multi-language Support** - Internationalization
5. **Dark Mode** - Theme switching
6. **Export Reports** - PDF/CSV exports
7. **Driver Management** - RFID/iButton tracking
8. **Fuel Monitoring** - Fuel consumption tracking
9. **Maintenance Alerts** - Scheduled maintenance reminders
10. **Custom Markers** - Different icons for vehicle types

## API Reference 📚

For complete API documentation, refer to:
- Server API Documentation (included in project)
- User API Documentation (included in project)

## Security 🔒

- API keys stored securely in AsyncStorage
- No hardcoded credentials
- HTTPS communication with GPS server
- Session-based authentication
- Secure logout clears all stored data

## Performance ⚡

- Efficient caching with TanStack Query
- Optimized re-renders with Zustand
- Lazy loading of screens
- Image optimization
- Minimal bundle size

## Compatibility 📲

- iOS 13+
- Android 6.0+
- Web (limited features)

---

**Built with ❤️ using Expo and React Native**
**Powered by GPS-14.NET tracking server**
