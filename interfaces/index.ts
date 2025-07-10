/**
 * Interface definitions for GIS Playwright tests
 */

import { Page, Locator } from '@playwright/test';
import { Coordinates, MapBounds, MapViewport } from '../config/constants';

// Base interfaces
export interface IBasePage {
  readonly page: Page;
  goto(url: string): Promise<void>;
  waitForPageLoad(): Promise<void>;
  clickElement(locator: Locator): Promise<void>;
  fillInput(locator: Locator, text: string): Promise<void>;
  getElementCount(locator: Locator): Promise<number>;
  isElementVisible(locator: Locator): Promise<boolean>;
  clickElementIfEnabled(locator: Locator): Promise<boolean>;
}

// GIS Page interface
export interface IGISPage extends IBasePage {
  // Navigation
  navigateToGIS(): Promise<void>;
  waitForMapLoad(): Promise<void>;

  // Map operations
  zoomIn(times?: number): Promise<void>;
  zoomOut(times?: number): Promise<void>;
  useLocateFeature(): Promise<void>;

  // Layer management
  openLayerControl(): Promise<void>;
  selectBaseLayer(layerIndex: number): Promise<void>;
  toggleOverlayLayer(layerIndex: number): Promise<void>;

  // Project management
  createNewProject(): Promise<void>;
  deleteProject(): Promise<void>;

  // Layer creation
  createPointLayer(): Promise<void>;
  createLineLayer(): Promise<void>;
  createPolygonLayer(): Promise<void>;

  // Map interactions
  clickOnMap(x: number, y: number): Promise<void>;
  dragMap(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): Promise<void>;

  // State queries
  getCurrentZoomLevel(): Promise<number>;
  getCurrentCenter(): Promise<Coordinates>;
  getMapBounds(): Promise<MapBounds>;
  getVisibleLayers(): Promise<string[]>;
  isLocateControlVisible(): Promise<boolean>;
  isLayerControlVisible(): Promise<boolean>;
}

// Calculation interfaces
export interface IGISCalculations {
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number;
  calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number;
  degreesToRadians(degrees: number): number;
  formatCoordinates(lat: number, lng: number, precision?: number): string;
}

// Validation interfaces
export interface IGISValidations {
  validateCoordinates(lat: number, lng: number): boolean;
  isPointInBounds(
    pointLat: number,
    pointLng: number,
    bounds: MapBounds
  ): boolean;
  assertMapIsVisible(page: Page): Promise<void>;
  assertZoomLevel(
    page: Page,
    expectedZoom: number,
    tolerance?: number
  ): Promise<void>;
  assertMapCenter(
    page: Page,
    expectedLat: number,
    expectedLng: number,
    tolerance?: number
  ): Promise<void>;
  assertValidMapBounds(page: Page): Promise<void>;
}

// Wait strategy interfaces
export interface IGISWaitStrategies {
  waitForTilesToLoad(page: Page, timeout?: number): Promise<void>;
  waitForMapAnimation(page: Page): Promise<void>;
  waitForMapReady(page: Page): Promise<void>;
  waitForMapOperation(page: Page, timeout?: number): Promise<void>;
  waitForElementState(
    page: Page,
    selector: string,
    state: ElementState,
    timeout?: number
  ): Promise<void>;
  waitForCondition(
    page: Page,
    condition: () => Promise<boolean>,
    options?: WaitOptions
  ): Promise<void>;
}

// Interaction interfaces
export interface IGISInteractions {
  pixelToCoordinates(
    page: Page,
    pixelX: number,
    pixelY: number
  ): Promise<Coordinates | null>;
  generateRandomCoordinatesInBounds(bounds: MapBounds): Coordinates;
  isCoordinateInView(page: Page, lat: number, lng: number): Promise<boolean>;
  getMapViewport(page: Page): Promise<MapViewport | null>;
}

// Performance monitoring interfaces
export interface IGISPerformance {
  measureMapLoadTime(page: Page): Promise<number>;
  monitorTileRequests(page: Page): Promise<{ success: number; failed: number }>;
  getVisibleLayerCount(page: Page): Promise<number>;
}

// Visual testing interfaces
export interface IGISVisual {
  getMapScreenshot(page: Page, name: string): Promise<void>;
  getFullGISScreenshot(page: Page, name: string): Promise<void>;
  compareMapView(page: Page, baselineName: string): Promise<void>;
}

// Debug interfaces
export interface IGISDebug {
  logMapState(page: Page): Promise<void>;
  captureDebugInfo(page: Page, testName: string): Promise<void>;
  assertMapControlsPresent(page: Page): Promise<void>;
}

// Service interfaces
export interface IGISTestService {
  performCompleteMapTest(page: Page): Promise<TestResult>;
  validateMapState(page: Page): Promise<ValidationResult>;
  orchestrateLayerTest(
    page: Page,
    layerType: LayerType
  ): Promise<LayerTestResult>;
  performPerformanceTest(page: Page): Promise<PerformanceResult>;
}

// Logging interface
export interface ITestLogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  debug(message: string, context?: any): void;
}

// Error handling interfaces
export interface ITestError extends Error {
  readonly context?: any;
  readonly code?: string;
  readonly isRetryable?: boolean;
}

// Supporting types
export type ElementState = 'enabled' | 'disabled' | 'checked' | 'unchecked';

export type WaitOptions = {
  timeout?: number;
  interval?: number;
  description?: string;
};

export type TestResult = {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type LayerType = 'point' | 'line' | 'polygon';

export type LayerTestResult = {
  layerType: LayerType;
  created: boolean;
  visible: boolean;
  interactive: boolean;
  errors: string[];
};

export type PerformanceResult = {
  loadTime: number;
  operationTimes: Record<string, number>;
  thresholdsPassed: boolean;
  details: any;
};
