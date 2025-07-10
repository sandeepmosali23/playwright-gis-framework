/**
 * Configuration constants for GIS Playwright tests
 */

export const GIS_CONFIG = {
  TIMEOUTS: {
    MAP_LOAD: 30000,
    ZOOM_OPERATION: 5000,
    TILE_LOAD: 15000,
    LAYER_SWITCH: 5000,
    PROJECT_CREATION: 5000,
    GEOLOCATION: 10000,
    LAYER_CONTROL_EXPAND: 3000,
    CLICK_HANDLER: 2000,
    PAN_OPERATION: 3000,
    ANIMATION_SETTLE: 2000,
    LAYER_CREATION: 3000,
  },
  SELECTORS: {
    MAP_CONTAINER: '#map',
    ZOOM_IN: '.leaflet-control-zoom-in',
    ZOOM_OUT: '.leaflet-control-zoom-out',
    LOCATE_BUTTON: '.leaflet-control-locate',
    LAYER_CONTROL: '.leaflet-control-layers',
    LAYER_TOGGLE: '.leaflet-control-layers-toggle',
    LAYER_EXPANDED: '.leaflet-control-layers-expanded',
    BASE_LAYER_RADIOS: '.leaflet-control-layers-selector[type="radio"]',
    OVERLAY_CHECKBOXES: '.leaflet-control-layers-selector[type="checkbox"]',
    TILE_LOADED: '.leaflet-tile-loaded',
    TILES: '.leaflet-tile',
    NEW_PROJECT_BUTTON: 'button:has-text("New Project")',
    DELETE_PROJECT_BUTTON: 'button:has-text("Delete Project")',
    NEW_POINT_LAYER_BUTTON: 'button:has-text("New Point Layer")',
    NEW_LINE_LAYER_BUTTON: 'button:has-text("New Line Layer")',
    NEW_POLYGON_LAYER_BUTTON: 'button:has-text("New Polygon Layer")',
  },
  COORDINATE_LIMITS: {
    MIN_LATITUDE: -90,
    MAX_LATITUDE: 90,
    MIN_LONGITUDE: -180,
    MAX_LONGITUDE: 180,
  },
  EARTH_RADIUS_KM: 6371,
  COORDINATE_PRECISION: {
    DEFAULT: 4,
    HIGH: 6,
    ULTRA_HIGH: 8,
  },
  PERFORMANCE_THRESHOLDS: {
    MAP_LOAD_MAX_MS: 15000,
    ZOOM_OPERATIONS_MAX_MS: 30000,
    LAYER_SWITCH_MAX_MS: 25000,
  },
  TEST_DATA: {
    COORDINATES: {
      SAN_FRANCISCO: { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
      NEW_YORK: { lat: 40.7128, lng: -74.006, name: 'New York' },
      LONDON: { lat: 51.5074, lng: -0.1278, name: 'London' },
      PARIS: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
      ORIGIN: { lat: 0, lng: 0, name: 'Equator/Prime Meridian' },
      NORTH_POLE: { lat: 90, lng: 0, name: 'North Pole' },
      SOUTH_POLE: { lat: -90, lng: 0, name: 'South Pole' },
    },
    DISTANCE_EXPECTATIONS: {
      SF_TO_NY: {
        min: 4100,
        max: 4200,
        description: 'Transcontinental distance',
      },
      LONDON_TO_PARIS: {
        min: 340,
        max: 350,
        description: 'European city pair',
      },
      ONE_DEGREE_LAT: { min: 110, max: 112, description: '1 degree latitude' },
    },
  },
  VALIDATION_THRESHOLDS: {
    COORDINATE_CHANGE_MIN: 0.000001,
    COORDINATE_TOLERANCE: 0.01,
    ZOOM_TOLERANCE: 0,
  },
} as const;

export const ENV_VARS = {
  BASE_URL: 'BASE_URL',
  RETRIES: 'RETRIES',
  WORKERS: 'WORKERS',
  TRACE_ON_FAILURE: 'TRACE_ON_FAILURE',
  SCREENSHOT_ON_FAILURE: 'SCREENSHOT_ON_FAILURE',
  VIDEO_ON_FAILURE: 'VIDEO_ON_FAILURE',
  ACTION_TIMEOUT: 'ACTION_TIMEOUT',
  NAVIGATION_TIMEOUT: 'NAVIGATION_TIMEOUT',
  CI: 'CI',
} as const;

export const DEFAULT_VALUES = {
  BASE_URL: 'http://localhost:3000',
  RETRIES: { CI: '2', LOCAL: '0' },
  WORKERS: { CI: '1', LOCAL: '1' },
  ACTION_TIMEOUT: '15000',
  NAVIGATION_TIMEOUT: '30000',
} as const;

export const MESSAGES = {
  ERRORS: {
    ELEMENT_NOT_ENABLED: 'Element is not enabled',
    MAP_NOT_LOADED: 'Map failed to load within timeout',
    INVALID_COORDINATES: 'Invalid coordinates provided',
    LAYER_CREATION_FAILED: 'Layer creation failed',
    PROJECT_CREATION_FAILED: 'Project creation failed',
    TIMEOUT_EXCEEDED: 'Operation timed out',
  },
  INFO: {
    MAP_READY: 'Map is ready for interactions',
    LAYER_BUTTONS_DISABLED:
      'Layer buttons may not be enabled after project creation',
    LAYER_BUTTONS_ENABLED:
      'Layer buttons may not be disabled after project deletion',
    MAP_PANNING_DETECTED: 'Map panning detected - coordinates changed',
    MAP_CONSTRAINTS: 'Map may have pan constraints - verifying responsiveness',
    MAP_INTERACTION_CONFIRMED: 'Map interaction confirmed via zoom',
  },
} as const;

export type Coordinates = {
  lat: number;
  lng: number;
  name?: string;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapViewport = {
  center: Coordinates;
  zoom: number;
  bounds: MapBounds;
};
