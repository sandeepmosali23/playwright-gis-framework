/**
 * Consolidated GIS Helpers - Re-exports all GIS utilities
 * This file maintains backward compatibility while using the improved architecture
 */

// Export all specialized classes
export { GISCalculations } from './gis-calculations';
export { GISValidations } from './gis-validations';
export { GISWaitStrategies } from './gis-wait-strategies';

// Export error classes
export * from './errors';

// Export logger
export { logger, LogLevel, TestLogger } from './logger';

// Re-export interfaces
export * from '../interfaces';

// Re-export constants
export * from '../config/constants';

/**
 * Legacy GISHelpers class for backward compatibility
 * Delegates to the specialized classes
 */
export class GISHelpers {
  // Calculation methods
  static calculateDistance =
    GISCalculations.calculateDistance.bind(GISCalculations);
  static calculateBearing =
    GISCalculations.calculateBearing.bind(GISCalculations);
  static formatCoordinates =
    GISCalculations.formatCoordinates.bind(GISCalculations);
  static degreesToRadians =
    GISCalculations.degreesToRadians.bind(GISCalculations);

  // Validation methods
  static validateCoordinates =
    GISValidations.validateCoordinates.bind(GISValidations);
  static isPointInBounds = GISValidations.isPointInBounds.bind(GISValidations);
  static assertMapIsVisible =
    GISValidations.assertMapIsVisible.bind(GISValidations);
  static assertZoomLevel = GISValidations.assertZoomLevel.bind(GISValidations);
  static assertMapCenter = GISValidations.assertMapCenter.bind(GISValidations);
  static assertValidMapBounds =
    GISValidations.assertValidMapBounds.bind(GISValidations);
  static assertMapControlsPresent =
    GISValidations.assertMapControlsPresent.bind(GISValidations);

  // Wait strategy methods
  static waitForTilesToLoad =
    GISWaitStrategies.waitForTilesToLoad.bind(GISWaitStrategies);
  static waitForMapAnimation =
    GISWaitStrategies.waitForMapAnimation.bind(GISWaitStrategies);
  static waitForMapReady =
    GISWaitStrategies.waitForMapReady.bind(GISWaitStrategies);
  static waitForMapOperation =
    GISWaitStrategies.waitForMapOperation.bind(GISWaitStrategies);
  static waitForElementState =
    GISWaitStrategies.waitForElementState.bind(GISWaitStrategies);
  static waitForCondition =
    GISWaitStrategies.waitForCondition.bind(GISWaitStrategies);

  // Additional utility methods that were in the original GISHelpers
  static async getMapViewport(page: any): Promise<any> {
    return await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return null;

      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();

      return {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      };
    });
  }

  static async isCoordinateInView(
    page: any,
    lat: number,
    lng: number
  ): Promise<boolean> {
    const viewport = await this.getMapViewport(page);
    if (!viewport) return false;

    return this.isPointInBounds(lat, lng, viewport.bounds);
  }

  static async logMapState(page: any): Promise<void> {
    const state = await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return null;

      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();

      return {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      };
    });

    if (state) {
      logger.info('🗺️ Current Map State:');
      logger.info(
        `   Center: ${this.formatCoordinates(state.center.lat, state.center.lng)}`
      );
      logger.info(`   Zoom: ${state.zoom}`);
      logger.info(
        `   Bounds: N:${state.bounds.north.toFixed(2)} S:${state.bounds.south.toFixed(2)} E:${state.bounds.east.toFixed(2)} W:${state.bounds.west.toFixed(2)}`
      );
    }
  }

  static async getVisibleLayerCount(page: any): Promise<number> {
    const layerCount = await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return 0;

      let count = 0;
      map.eachLayer(() => count++);
      return count;
    });

    logger.info(`📊 Visible layers: ${layerCount}`);
    return layerCount;
  }
}
