/**
 * GIS validation utilities
 */

import { Page, expect } from '@playwright/test';
import { IGISValidations } from '../interfaces';
import { GIS_CONFIG, MapBounds } from '../config/constants';
import { InvalidCoordinatesError, ValidationError } from './errors';
import { logger } from './logger';

export class GISValidations implements IGISValidations {
  /**
   * Validates if coordinates are within valid geographic ranges
   */
  static validateCoordinates(lat: number, lng: number): boolean {
    const isValidLat =
      lat >= GIS_CONFIG.COORDINATE_LIMITS.MIN_LATITUDE &&
      lat <= GIS_CONFIG.COORDINATE_LIMITS.MAX_LATITUDE;
    const isValidLng =
      lng >= GIS_CONFIG.COORDINATE_LIMITS.MIN_LONGITUDE &&
      lng <= GIS_CONFIG.COORDINATE_LIMITS.MAX_LONGITUDE;

    if (!isValidLat) {
      logger.warn(
        `Invalid latitude: ${lat} (must be ${GIS_CONFIG.COORDINATE_LIMITS.MIN_LATITUDE} to ${GIS_CONFIG.COORDINATE_LIMITS.MAX_LATITUDE})`
      );
    }
    if (!isValidLng) {
      logger.warn(
        `Invalid longitude: ${lng} (must be ${GIS_CONFIG.COORDINATE_LIMITS.MIN_LONGITUDE} to ${GIS_CONFIG.COORDINATE_LIMITS.MAX_LONGITUDE})`
      );
    }

    return isValidLat && isValidLng;
  }

  /**
   * Validates coordinates and throws error if invalid
   */
  static assertValidCoordinates(lat: number, lng: number): void {
    if (!this.validateCoordinates(lat, lng)) {
      throw new InvalidCoordinatesError(lat, lng);
    }
  }

  /**
   * Checks if a point is within a bounding box
   */
  static isPointInBounds(
    pointLat: number,
    pointLng: number,
    bounds: MapBounds
  ): boolean {
    return (
      pointLat <= bounds.north &&
      pointLat >= bounds.south &&
      pointLng <= bounds.east &&
      pointLng >= bounds.west
    );
  }

  /**
   * Validates that a bounding box is logically correct
   */
  static validateBounds(bounds: MapBounds): boolean {
    const isValidStructure =
      bounds.north > bounds.south && bounds.east > bounds.west;
    const isValidCoordinates =
      this.validateCoordinates(bounds.north, bounds.east) &&
      this.validateCoordinates(bounds.south, bounds.west);

    return isValidStructure && isValidCoordinates;
  }

  /**
   * Asserts that the map is visible and functional
   */
  static async assertMapIsVisible(page: Page): Promise<void> {
    logger.info('Verifying map visibility...');

    // Check map container exists and is visible
    const mapContainer = page
      .locator(GIS_CONFIG.SELECTORS.MAP_CONTAINER)
      .first();
    await expect(mapContainer).toBeVisible();

    // Check that tiles have loaded
    await page.waitForSelector(GIS_CONFIG.SELECTORS.TILE_LOADED, {
      timeout: GIS_CONFIG.TIMEOUTS.TILE_LOAD,
    });

    // Verify map has reasonable dimensions
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox || mapBox.width <= 100 || mapBox.height <= 100) {
      throw new ValidationError(
        'Map dimensions too small',
        'width > 100 && height > 100',
        mapBox,
        { mapBox }
      );
    }

    logger.info('Map is visible and properly sized');
  }

  /**
   * Asserts the current zoom level matches expected value
   */
  static async assertZoomLevel(
    page: Page,
    expectedZoom: number,
    tolerance: number = GIS_CONFIG.VALIDATION_THRESHOLDS.ZOOM_TOLERANCE
  ): Promise<void> {
    const currentZoom = await page.evaluate(() => {
      return (window as any).map?.getZoom();
    });

    if (currentZoom === undefined || currentZoom === null) {
      throw new ValidationError(
        'Zoom level not available',
        expectedZoom,
        currentZoom
      );
    }

    if (tolerance === 0) {
      if (currentZoom !== expectedZoom) {
        throw new ValidationError(
          'Zoom level mismatch',
          expectedZoom,
          currentZoom
        );
      }
    } else {
      const difference = Math.abs(currentZoom - expectedZoom);
      if (difference > tolerance) {
        throw new ValidationError(
          'Zoom level outside tolerance',
          `${expectedZoom} ± ${tolerance}`,
          currentZoom,
          { difference, tolerance }
        );
      }
    }

    logger.info(
      `Zoom level verified: ${currentZoom} (expected: ${expectedZoom})`
    );
  }

  /**
   * Asserts the map center is at expected coordinates
   */
  static async assertMapCenter(
    page: Page,
    expectedLat: number,
    expectedLng: number,
    tolerance: number = GIS_CONFIG.VALIDATION_THRESHOLDS.COORDINATE_TOLERANCE
  ): Promise<void> {
    const center = await page.evaluate(() => {
      const center = (window as any).map?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : null;
    });

    if (!center) {
      throw new ValidationError(
        'Map center not available',
        { expectedLat, expectedLng },
        center
      );
    }

    const latDiff = Math.abs(center.lat - expectedLat);
    const lngDiff = Math.abs(center.lng - expectedLng);

    if (latDiff > tolerance || lngDiff > tolerance) {
      throw new ValidationError(
        'Map center outside tolerance',
        { lat: expectedLat, lng: expectedLng, tolerance },
        center,
        { latDiff, lngDiff }
      );
    }

    logger.info(
      `Map center verified: (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`
    );
  }

  /**
   * Asserts that map bounds are geographically valid
   */
  static async assertValidMapBounds(page: Page): Promise<void> {
    const bounds = await page.evaluate(() => {
      const bounds = (window as any).map?.getBounds();
      if (bounds) {
        return {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };
      }
      return null;
    });

    if (!bounds) {
      throw new ValidationError(
        'Map bounds not available',
        'valid bounds object',
        bounds
      );
    }

    // Verify bounds are logically correct
    if (bounds.north <= bounds.south) {
      throw new ValidationError(
        'Invalid bounds: north <= south',
        'north > south',
        bounds,
        { north: bounds.north, south: bounds.south }
      );
    }

    if (bounds.east <= bounds.west) {
      throw new ValidationError(
        'Invalid bounds: east <= west',
        'east > west',
        bounds,
        { east: bounds.east, west: bounds.west }
      );
    }

    // Verify bounds are within valid coordinate ranges
    if (!this.validateBounds(bounds)) {
      throw new ValidationError(
        'Map bounds contain invalid coordinates',
        'valid coordinates',
        bounds
      );
    }

    logger.info(
      `Map bounds are valid: N:${bounds.north.toFixed(2)} S:${bounds.south.toFixed(2)} E:${bounds.east.toFixed(2)} W:${bounds.west.toFixed(2)}`
    );
  }

  /**
   * Validates that essential map controls are present
   */
  static async assertMapControlsPresent(page: Page): Promise<void> {
    logger.info('Verifying map controls...');

    // Check zoom controls
    const zoomIn = page.locator(GIS_CONFIG.SELECTORS.ZOOM_IN);
    const zoomOut = page.locator(GIS_CONFIG.SELECTORS.ZOOM_OUT);

    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();

    // Check if attribution is present (good practice)
    const attribution = page.locator('.leaflet-control-attribution');
    const attributionCount = await attribution.count();
    if (attributionCount > 0) {
      await expect(attribution).toBeVisible();
    }

    logger.info('Essential map controls are present');
  }

  /**
   * Validates zoom level is within acceptable range
   */
  static validateZoomLevel(
    zoom: number,
    minZoom: number = 0,
    maxZoom: number = 20
  ): boolean {
    return zoom >= minZoom && zoom <= maxZoom;
  }

  /**
   * Validates that a coordinate difference meets minimum threshold
   */
  static validateCoordinateChange(
    oldCoord: { lat: number; lng: number },
    newCoord: { lat: number; lng: number },
    minThreshold: number = GIS_CONFIG.VALIDATION_THRESHOLDS
      .COORDINATE_CHANGE_MIN
  ): boolean {
    const latDiff = Math.abs(newCoord.lat - oldCoord.lat);
    const lngDiff = Math.abs(newCoord.lng - oldCoord.lng);

    return latDiff > minThreshold || lngDiff > minThreshold;
  }

  /**
   * Validates that a distance value is reasonable
   */
  static validateDistance(
    distance: number,
    minDistance: number = 0,
    maxDistance: number = 20037
  ): boolean {
    return distance >= minDistance && distance <= maxDistance; // Max distance is half Earth's circumference
  }

  /**
   * Validates that a bearing is within 0-360 degrees
   */
  static validateBearing(bearing: number): boolean {
    return bearing >= 0 && bearing < 360;
  }

  /**
   * Validates array of coordinates
   */
  static validateCoordinateArray(
    coordinates: { lat: number; lng: number }[]
  ): boolean {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return false;
    }

    return coordinates.every(
      coord =>
        typeof coord.lat === 'number' &&
        typeof coord.lng === 'number' &&
        this.validateCoordinates(coord.lat, coord.lng)
    );
  }

  /**
   * Validates that all required properties exist in an object
   */
  static validateRequiredProperties<T>(
    obj: any,
    requiredProps: (keyof T)[]
  ): obj is T {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    return requiredProps.every(prop => obj.hasOwnProperty(prop));
  }
}
