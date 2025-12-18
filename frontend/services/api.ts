import axios from 'axios';

const BASE_URL = 'https://tracking.gps-14.net/api';

class TrackingAPI {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  // Login and get API key
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await axios.get(`${BASE_URL}/api.php`, {
        params: {
          api: 'user',
          username,
          password,
        },
      });

      if (response.data && typeof response.data === 'string') {
        return response.data.trim();
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      throw new Error(error.response?.data || 'Login failed');
    }
  }

  // Generic command execution
  private async executeCommand(cmd: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios.get(`${BASE_URL}/api.php`, {
        params: {
          api: 'user',
          key: this.apiKey,
          cmd,
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw new Error(error.response?.data || 'API request failed');
    }
  }

  // Get user objects (vehicles)
  async getUserObjects() {
    return this.executeCommand('USER_GET_OBJECTS');
  }

  // Get object locations (all vehicles or specific IMEIs)
  async getObjectLocations(imeis: string = '*') {
    const data = await this.executeCommand(`OBJECT_GET_LOCATIONS,${imeis}`);
    
    // Convert object to array if needed
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data).map(([imei, location]: [string, any]) => ({
        imei,
        ...location,
      }));
    }
    
    return data;
  }

  // Get object route history
  async getObjectRoute(imei: string, dateFrom: string, dateTo: string) {
    return this.executeCommand(`OBJECT_GET_ROUTE,${imei},${dateFrom},${dateTo},1`);
  }

  // Get object messages
  async getObjectMessages(imei: string, dateFrom: string, dateTo: string) {
    return this.executeCommand(`OBJECT_GET_MESSAGES,${imei},${dateFrom},${dateTo}`);
  }

  // Get object events
  async getObjectEvents(imei: string, dateFrom: string, dateTo: string) {
    return this.executeCommand(`OBJECT_GET_EVENTS,${imei},${dateFrom},${dateTo}`);
  }

  // Get last events (12 hours)
  async getLastEvents() {
    return this.executeCommand('OBJECT_GET_LAST_EVENTS');
  }

  // Get last events (30 minutes)
  async getLastEvents30M() {
    return this.executeCommand('OBJECT_GET_LAST_EVENTS_30M');
  }

  // Get last events (7 days)
  async getLastEvents7D() {
    return this.executeCommand('OBJECT_GET_LAST_EVENTS_7D');
  }

  // Get user markers
  async getUserMarkers() {
    return this.executeCommand('USER_GET_MARKERS');
  }

  // Get user routes
  async getUserRoutes() {
    return this.executeCommand('USER_GET_ROUTES');
  }

  // Get user zones (geofencing)
  async getUserZones() {
    return this.executeCommand('USER_GET_ZONES');
  }

  // Get maintenance
  async getUserMaintenance(imeis: string = '*') {
    return this.executeCommand(`USER_GET_MAINTENANCE,${imeis}`);
  }

  // Get expenses
  async getUserExpenses(imeis: string, dateFrom: string, dateTo: string) {
    return this.executeCommand(`USER_GET_EXPENSES,${imeis},${dateFrom},${dateTo}`);
  }

  // Get tasks
  async getUserTasks(imeis: string, dateFrom: string, dateTo: string) {
    return this.executeCommand(`USER_GET_TASKS,${imeis},${dateFrom},${dateTo}`);
  }

  // Get address from coordinates
  async getAddress(lat: number, lng: number) {
    return this.executeCommand(`GET_ADDRESS,${lat},${lng}`);
  }
}

export const trackingApi = new TrackingAPI();
