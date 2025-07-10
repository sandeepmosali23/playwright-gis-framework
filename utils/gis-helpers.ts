// Complete GIS Helpers - Save as: utils/gis-helpers.ts

import { Page, expect, Locator } from '@playwright/test';

export class GISHelpers {
  // ========================================
  // MAP LOADING & TILE VERIFICATION
  // ========================================

  /**
   * Waits for all map tiles to finish loading
   * Critical for GIS apps since tiles load asynchronously
   */
  static async waitForTilesToLoad(
    page: Page,
    timeout: number = 10000
  ): Promise<void> {
    console.log('⏳ Waiting for map tiles to load...');

    await page.waitForFunction(
      () => {
        // Check if all tile images are fully loaded
        const tiles = document.querySelectorAll('.leaflet-tile');
        if (tiles.length === 0) return false;

        return Array.from(tiles).every(tile => {
          const img = tile as HTMLImageElement;
          return img.complete && img.naturalWidth > 0;
        });
      },
      { timeout }
    );

    console.log('✅ All map tiles loaded successfully');
  }

  /**
   * Waits for the map to finish any animations (zoom, pan, etc.)
   */
  static async waitForMapAnimation(page: Page): Promise<void> {
    // Wait for CSS animations and transitions to complete
    await page.waitForFunction(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      if (!mapContainer) return false;

      // Check if any animations are running
      const computedStyle = window.getComputedStyle(mapContainer);
      return !computedStyle.transform.includes('matrix');
    });

    // Wait for any remaining animations to complete
    await page.waitForFunction(
      () => {
        const map = (window as any).map;
        return map && !map._animatingZoom && !map._animatingPan;
      },
      { timeout: 2000 }
    );
  }

  // ========================================
  // COORDINATE VALIDATION & CALCULATIONS
  // ========================================

  /**
   * Validates if coordinates are within valid geographic ranges
   * Latitude: -90 to 90, Longitude: -180 to 180
   */
  static validateCoordinates(lat: number, lng: number): boolean {
    const isValidLat = lat >= -90 && lat <= 90;
    const isValidLng = lng >= -180 && lng <= 180;

    if (!isValidLat) {
      console.warn(`❌ Invalid latitude: ${lat} (must be -90 to 90)`);
    }
    if (!isValidLng) {
      console.warn(`❌ Invalid longitude: ${lng} (must be -180 to 180)`);
    }

    return isValidLat && isValidLng;
  }

  /**
   * Calculates distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers

    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    console.log(`📏 Distance calculated: ${distance.toFixed(2)} km`);
    return distance;
  }

  /**
   * Converts degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Checks if a point is within a bounding box
   */
  static isPointInBounds(
    pointLat: number,
    pointLng: number,
    bounds: { north: number; south: number; east: number; west: number }
  ): boolean {
    return (
      pointLat <= bounds.north &&
      pointLat >= bounds.south &&
      pointLng <= bounds.east &&
      pointLng >= bounds.west
    );
  }

  // ========================================
  // MAP STATE ASSERTIONS
  // ========================================

  /**
   * Asserts that the map is visible and functional
   */
  static async assertMapIsVisible(page: Page): Promise<void> {
    console.log('🔍 Verifying map visibility...');

    // Check map container exists and is visible
    const mapContainer = page.locator('#map, .leaflet-container').first();
    await expect(mapContainer).toBeVisible();

    // Check that tiles have loaded
    await page.waitForSelector('.leaflet-tile', { timeout: 10000 });

    // Verify map has reasonable dimensions
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox?.width).toBeGreaterThan(100);
    expect(mapBox?.height).toBeGreaterThan(100);

    console.log('✅ Map is visible and properly sized');
  }

  /**
   * Asserts the current zoom level matches expected value
   */
  static async assertZoomLevel(
    page: Page,
    expectedZoom: number,
    tolerance: number = 0
  ): Promise<void> {
    const currentZoom = await page.evaluate(() => {
      return (window as any).map?.getZoom();
    });

    if (tolerance === 0) {
      expect(currentZoom).toBe(expectedZoom);
    } else {
      expect(Math.abs(currentZoom - expectedZoom)).toBeLessThanOrEqual(
        tolerance
      );
    }

    console.log(
      `✅ Zoom level verified: ${currentZoom} (expected: ${expectedZoom})`
    );
  }

  /**
   * Asserts the map center is at expected coordinates
   */
  static async assertMapCenter(
    page: Page,
    expectedLat: number,
    expectedLng: number,
    tolerance: number = 0.01
  ): Promise<void> {
    const center = await page.evaluate(() => {
      const center = (window as any).map?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : null;
    });

    expect(center).not.toBeNull();

    const latDiff = Math.abs(center!.lat - expectedLat);
    const lngDiff = Math.abs(center!.lng - expectedLng);

    expect(latDiff).toBeLessThan(tolerance);
    expect(lngDiff).toBeLessThan(tolerance);

    console.log(
      `✅ Map center verified: (${center!.lat.toFixed(4)}, ${center!.lng.toFixed(4)})`
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

    expect(bounds).not.toBeNull();

    // Verify bounds are logically correct
    expect(bounds!.north).toBeGreaterThan(bounds!.south);
    expect(bounds!.east).toBeGreaterThan(bounds!.west);

    // Verify bounds are within valid coordinate ranges
    expect(bounds!.north).toBeLessThanOrEqual(90);
    expect(bounds!.south).toBeGreaterThanOrEqual(-90);
    expect(bounds!.east).toBeLessThanOrEqual(180);
    expect(bounds!.west).toBeGreaterThanOrEqual(-180);

    console.log(
      `✅ Map bounds are valid: N:${bounds!.north.toFixed(2)} S:${bounds!.south.toFixed(2)} E:${bounds!.east.toFixed(2)} W:${bounds!.west.toFixed(2)}`
    );
  }

  // ========================================
  // SCREENSHOT & VISUAL TESTING
  // ========================================

  /**
   * Takes a screenshot of just the map area (not the whole page)
   */
  static async getMapScreenshot(page: Page, name: string): Promise<void> {
    const mapElement = page.locator('#map, .leaflet-container').first();
    await mapElement.screenshot({
      path: `screenshots/${name}-map-${Date.now()}.png`,
      animations: 'disabled', // Prevent animation artifacts
    });
    console.log(`📸 Map screenshot saved: ${name}-map.png`);
  }

  /**
   * Takes a full page screenshot with map context
   */
  static async getFullGISScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({
      path: `screenshots/${name}-full-${Date.now()}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    console.log(`📸 Full GIS screenshot saved: ${name}-full.png`);
  }

  /**
   * Compares current map view with a baseline image
   */
  static async compareMapView(page: Page, baselineName: string): Promise<void> {
    const mapElement = page.locator('#map, .leaflet-container').first();
    await expect(mapElement).toHaveScreenshot(`${baselineName}.png`);
    console.log(`✅ Map view matches baseline: ${baselineName}`);
  }

  // ========================================
  // LAYER & CONTROL VERIFICATION
  // ========================================

  /**
   * Verifies that essential map controls are present
   */
  static async assertMapControlsPresent(page: Page): Promise<void> {
    console.log('🔍 Verifying map controls...');

    // Check zoom controls
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();

    // Check if attribution is present (good practice)
    const attribution = page.locator('.leaflet-control-attribution');
    if ((await attribution.count()) > 0) {
      await expect(attribution).toBeVisible();
    }

    console.log('✅ Essential map controls are present');
  }

  /**
   * Counts the number of visible map layers
   */
  static async getVisibleLayerCount(page: Page): Promise<number> {
    const layerCount = await page.evaluate(() => {
      const map = (window as any).map;
      if (!map) return 0;

      let count = 0;
      map.eachLayer(() => count++);
      return count;
    });

    console.log(`📊 Visible layers: ${layerCount}`);
    return layerCount;
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  /**
   * Measures map loading performance
   */
  static async measureMapLoadTime(page: Page): Promise<number> {
    const startTime = Date.now();

    // Wait for map to be ready
    await page.waitForFunction(() => {
      return window.L && (window as any).map;
    });

    // Wait for tiles to load
    await this.waitForTilesToLoad(page);

    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Map load time: ${loadTime}ms`);

    return loadTime;
  }

  /**
   * Monitors network requests for tile loading
   */
  static async monitorTileRequests(
    page: Page
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    page.on('response', response => {
      const url = response.url();

      // Check if it's a tile request (common tile URL patterns)
      if (
        url.includes('.png') ||
        url.includes('.jpg') ||
        url.includes('/tiles/')
      ) {
        if (response.status() === 200) {
          successCount++;
        } else {
          failedCount++;
          console.warn(`❌ Tile failed to load: ${url} (${response.status()})`);
        }
      }
    });

    return { success: successCount, failed: failedCount };
  }

  // ========================================
  // GEOSPATIAL UTILITIES
  // ========================================

  /**
   * Generates random coordinates within a bounding box
   */
  static generateRandomCoordinatesInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): { lat: number; lng: number } {
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);

    return { lat, lng };
  }

  /**
   * Converts pixel coordinates to geographic coordinates
   */
  static async pixelToCoordinates(
    page: Page,
    pixelX: number,
    pixelY: number
  ): Promise<{ lat: number; lng: number } | null> {
    return await page.evaluate(
      ({ x, y }) => {
        const map = (window as any).map;
        if (!map) return null;

        const latlng = map.containerPointToLatLng([x, y]);
        return { lat: latlng.lat, lng: latlng.lng };
      },
      { x: pixelX, y: pixelY }
    );
  }

  /**
   * Formats coordinates for display
   */
  static formatCoordinates(
    lat: number,
    lng: number,
    precision: number = 4
  ): string {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  }

  // ========================================
  // DEBUG UTILITIES
  // ========================================

  /**
   * Logs current map state for debugging
   */
  static async logMapState(page: Page): Promise<void> {
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
      console.log('🗺️ Current Map State:');
      console.log(
        `   Center: ${this.formatCoordinates(state.center.lat, state.center.lng)}`
      );
      console.log(`   Zoom: ${state.zoom}`);
      console.log(
        `   Bounds: N:${state.bounds.north.toFixed(2)} S:${state.bounds.south.toFixed(2)} E:${state.bounds.east.toFixed(2)} W:${state.bounds.west.toFixed(2)}`
      );
    }
  }

  /**
   * Captures comprehensive debug information
   */
  static async captureDebugInfo(page: Page, testName: string): Promise<void> {
    console.log(`🔧 Capturing debug info for: ${testName}`);

    // Log map state
    await this.logMapState(page);

    // Take screenshot
    await this.getMapScreenshot(page, `debug-${testName}`);

    // Check for JavaScript errors
    const errors = await page.evaluate(() => {
      return (window as any).__testErrors || [];
    });

    if (errors.length > 0) {
      console.warn('⚠️ JavaScript errors detected:', errors);
    }

    console.log('✅ Debug info captured');
  }

  // ========================================
  // ADDITIONAL UTILITIES
  // ========================================

  /**
   * Waits for map to be ready for interactions
   */
  static async waitForMapReady(page: Page): Promise<void> {
    // Wait for Leaflet to be loaded
    await page.waitForFunction(() => {
      return typeof window.L !== 'undefined';
    });

    // Wait for map instance to be created
    await page.waitForFunction(() => {
      return (window as any).map !== undefined;
    });

    // Wait for map container to be visible
    await page.waitForSelector('#map', { state: 'visible' });

    // Wait for map to be fully initialized and interactive
    await page.waitForFunction(
      () => {
        const map = (window as any).map;
        return map && map._loaded && !map._animatingZoom && !map._animatingPan;
      },
      { timeout: 10000 }
    );

    console.log('✅ Map is ready for interactions');
  }

  /**
   * Waits for any map operation to complete
   */
  static async waitForMapOperation(
    page: Page,
    timeout: number = 5000
  ): Promise<void> {
    await page.waitForFunction(
      () => {
        const map = (window as any).map;
        return map && !map._animatingZoom && !map._animatingPan;
      },
      { timeout }
    );
  }

  /**
   * Waits for element to be in a specific state
   */
  static async waitForElementState(
    page: Page,
    selector: string,
    state: 'enabled' | 'disabled' | 'checked' | 'unchecked',
    timeout: number = 5000
  ): Promise<void> {
    await page.waitForFunction(
      (sel, expectedState) => {
        const element = document.querySelector(sel) as HTMLInputElement;
        if (!element) return false;

        switch (expectedState) {
          case 'enabled':
            return !element.disabled;
          case 'disabled':
            return element.disabled;
          case 'checked':
            return element.checked;
          case 'unchecked':
            return !element.checked;
          default:
            return false;
        }
      },
      selector,
      state,
      { timeout }
    );
  }

  /**
   * Gets the current map viewport as coordinates
   */
  static async getMapViewport(page: Page): Promise<{
    center: { lat: number; lng: number };
    zoom: number;
    bounds: { north: number; south: number; east: number; west: number };
  } | null> {
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

  /**
   * Validates that a coordinate is within the current map view
   */
  static async isCoordinateInView(
    page: Page,
    lat: number,
    lng: number
  ): Promise<boolean> {
    const viewport = await this.getMapViewport(page);
    if (!viewport) return false;

    return this.isPointInBounds(lat, lng, viewport.bounds);
  }

  /**
   * Calculates the bearing (direction) between two points
   */
  static calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const dLng = this.degreesToRadians(lng2 - lng1);
    const lat1Rad = this.degreesToRadians(lat1);
    const lat2Rad = this.degreesToRadians(lat2);

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    const bearing = Math.atan2(y, x);
    return ((bearing * 180) / Math.PI + 360) % 360; // Convert to degrees and normalize
  }

  /**
   * Waits for a specific condition to be met with retry logic
   */
  static async waitForCondition(
    page: Page,
    condition: () => Promise<boolean>,
    options: { timeout?: number; interval?: number; description?: string } = {}
  ): Promise<void> {
    const {
      timeout = 5000,
      interval = 100,
      description = 'condition',
    } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        console.log(`✅ ${description} met`);
        return;
      }
      await page.waitForTimeout(interval);
    }

    throw new Error(`Timeout waiting for ${description} after ${timeout}ms`);
  }
}
