export const GISTestData = {
  // Sample coordinates for testing
  coordinates: {
    sanFrancisco: { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
    newYork: { lat: 40.7128, lng: -74.006, name: 'New York' },
    london: { lat: 51.5074, lng: -0.1278, name: 'London' },
    sydney: { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
  },

  // Zoom levels for different views
  zoomLevels: {
    world: 2,
    country: 6,
    city: 10,
    street: 15,
    building: 18,
  },

  // Layer types found in your app (3 radio + 1 checkbox)
  layerTypes: {
    baseLayers: ['Base Layer 1', 'Base Layer 2', 'Base Layer 3'],
    overlayLayers: ['Overlay Layer 1'],
  },

  // Project names for testing
  projectNames: [
    'Test Project Alpha',
    'Demo Project Beta',
    'Sample Project Gamma',
  ],

  // Geometry types available in your app
  geometryTypes: ['point', 'line', 'polygon'],

  generateRandomCoordinate(): { lat: number; lng: number } {
    return {
      lat: (Math.random() - 0.5) * 180, // -90 to 90
      lng: (Math.random() - 0.5) * 360, // -180 to 180
    };
  },

  generateProjectName(): string {
    return `Test Project ${Date.now()}`;
  },
};
