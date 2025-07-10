/**
 * Service layer for complex GIS test orchestration
 */

import { Page } from '@playwright/test';
import {
  IGISTestService,
  TestResult,
  ValidationResult,
  LayerTestResult,
  PerformanceResult,
  LayerType,
} from '../interfaces';
import { GIS_CONFIG } from '../config/constants';
import { GISValidations } from '../utils/gis-validations';
import { GISWaitStrategies } from '../utils/gis-wait-strategies';
import { GISCalculations } from '../utils/gis-calculations';
import { logger } from '../utils/logger';
import { TestError } from '../utils/errors';

export class GISTestService implements IGISTestService {
  constructor(private page: Page) {}

  /**
   * Performs a complete map functionality test
   */
  async performCompleteMapTest(page: Page): Promise<TestResult> {
    const startTime = Date.now();
    logger.logTestStart('Complete Map Test');

    try {
      // 1. Verify map loads properly
      await GISWaitStrategies.waitForMapReady(page);
      await GISValidations.assertMapIsVisible(page);

      // 2. Test basic map controls
      await GISValidations.assertMapControlsPresent(page);

      // 3. Test zoom functionality
      const initialZoom = await this.getCurrentZoom(page);
      await this.testZoomOperations(page, initialZoom);

      // 4. Test map center validation
      const center = await this.getCurrentCenter(page);
      GISValidations.assertValidCoordinates(center.lat, center.lng);

      // 5. Test map bounds
      await GISValidations.assertValidMapBounds(page);

      const duration = Date.now() - startTime;
      logger.logTestEnd('Complete Map Test', duration);

      return {
        success: true,
        message: 'Complete map test passed',
        duration,
        details: {
          initialZoom,
          center,
          testsPerformed: ['load', 'controls', 'zoom', 'center', 'bounds'],
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logTestFailure('Complete Map Test', error as Error);

      return {
        success: false,
        message: `Complete map test failed: ${(error as Error).message}`,
        duration,
        details: { error: error },
      };
    }
  }

  /**
   * Validates the current map state
   */
  async validateMapState(page: Page): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if map is loaded
      const mapExists = await page.evaluate(() => {
        return !!(window as any).map;
      });

      if (!mapExists) {
        errors.push('Map instance not found');
        return { isValid: false, errors, warnings };
      }

      // Validate zoom level
      const zoom = await this.getCurrentZoom(page);
      if (!GISValidations.validateZoomLevel(zoom)) {
        errors.push(`Invalid zoom level: ${zoom}`);
      }

      // Validate center coordinates
      const center = await this.getCurrentCenter(page);
      if (!GISValidations.validateCoordinates(center.lat, center.lng)) {
        errors.push(`Invalid center coordinates: ${center.lat}, ${center.lng}`);
      }

      // Validate bounds
      const bounds = await this.getCurrentBounds(page);
      if (!GISValidations.validateBounds(bounds)) {
        errors.push('Invalid map bounds');
      }

      // Check for tiles
      const tileCount = await page.locator(GIS_CONFIG.SELECTORS.TILES).count();
      if (tileCount === 0) {
        warnings.push('No tiles found - map may not be fully loaded');
      }

      // Check for animations
      const isAnimating = await page.evaluate(() => {
        const map = (window as any).map;
        return map && (map._animatingZoom || map._animatingPan);
      });

      if (isAnimating) {
        warnings.push('Map is currently animating');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Orchestrates layer testing workflow
   */
  async orchestrateLayerTest(
    page: Page,
    layerType: LayerType
  ): Promise<LayerTestResult> {
    logger.logLayerOperation('Starting layer test', layerType);

    const result: LayerTestResult = {
      layerType,
      created: false,
      visible: false,
      interactive: false,
      errors: [],
    };

    try {
      // 1. Ensure project exists (required for layer creation)
      await this.ensureProjectExists(page);

      // 2. Attempt to create layer
      const buttonSelector = this.getLayerButtonSelector(layerType);
      const button = page.locator(buttonSelector);

      const isEnabled = await button.isEnabled();
      if (!isEnabled) {
        result.errors.push(`${layerType} layer button is disabled`);
        return result;
      }

      await button.click();
      await GISWaitStrategies.waitForMapOperation(page);
      result.created = true;

      // 3. Check if layer is visible in layer control
      const layerControlVisible = await page
        .locator(GIS_CONFIG.SELECTORS.LAYER_CONTROL)
        .isVisible();
      result.visible = layerControlVisible;

      // 4. Test layer interactivity (if applicable)
      if (result.created) {
        result.interactive = await this.testLayerInteractivity(page, layerType);
      }

      logger.logLayerOperation('Layer test completed', layerType, result);
      return result;
    } catch (error) {
      result.errors.push(`Layer test error: ${(error as Error).message}`);
      logger.error(`Layer test failed for ${layerType}`, error as Error);
      return result;
    }
  }

  /**
   * Performs performance testing
   */
  async performPerformanceTest(page: Page): Promise<PerformanceResult> {
    logger.logPerformance('Starting performance test', 0);

    const operationTimes: Record<string, number> = {};
    let loadTime = 0;

    try {
      // 1. Measure initial load time
      const loadStartTime = Date.now();
      await GISWaitStrategies.waitForMapReady(page);
      loadTime = Date.now() - loadStartTime;
      operationTimes.mapLoad = loadTime;

      // 2. Measure zoom operations
      const zoomStartTime = Date.now();
      await this.performZoomSequence(page, 5);
      operationTimes.zoomOperations = Date.now() - zoomStartTime;

      // 3. Measure layer switching (if layer control exists)
      const layerControlExists = await page
        .locator(GIS_CONFIG.SELECTORS.LAYER_CONTROL)
        .isVisible();
      if (layerControlExists) {
        const layerStartTime = Date.now();
        await this.performLayerSwitchSequence(page);
        operationTimes.layerSwitching = Date.now() - layerStartTime;
      }

      // 4. Measure pan operations
      const panStartTime = Date.now();
      await this.performPanSequence(page);
      operationTimes.panOperations = Date.now() - panStartTime;

      // 5. Check against thresholds
      const thresholdsPassed = this.checkPerformanceThresholds(operationTimes);

      logger.logPerformance('Performance test completed', Date.now());

      return {
        loadTime,
        operationTimes,
        thresholdsPassed,
        details: {
          thresholds: GIS_CONFIG.PERFORMANCE_THRESHOLDS,
          results: operationTimes,
        },
      };
    } catch (error) {
      logger.error('Performance test failed', error as Error);
      throw new TestError('Performance test failed', { operationTimes, error });
    }
  }

  // Private helper methods
  private async getCurrentZoom(page: Page): Promise<number> {
    return await page.evaluate(() => {
      return (window as any).map?.getZoom() || 0;
    });
  }

  private async getCurrentCenter(
    page: Page
  ): Promise<{ lat: number; lng: number }> {
    return await page.evaluate(() => {
      const center = (window as any).map?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : { lat: 0, lng: 0 };
    });
  }

  private async getCurrentBounds(page: Page): Promise<{
    north: number;
    south: number;
    east: number;
    west: number;
  }> {
    return await page.evaluate(() => {
      const bounds = (window as any).map?.getBounds();
      if (bounds) {
        return {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };
      }
      return { north: 0, south: 0, east: 0, west: 0 };
    });
  }

  private async testZoomOperations(
    page: Page,
    initialZoom: number
  ): Promise<void> {
    // Test zoom in
    await page.click(GIS_CONFIG.SELECTORS.ZOOM_IN);
    await GISWaitStrategies.waitForZoomChange(page, initialZoom + 1);

    // Test zoom out
    await page.click(GIS_CONFIG.SELECTORS.ZOOM_OUT);
    await GISWaitStrategies.waitForZoomChange(page, initialZoom);
  }

  private async ensureProjectExists(page: Page): Promise<void> {
    const projectButton = page.locator(GIS_CONFIG.SELECTORS.NEW_PROJECT_BUTTON);
    await projectButton.click();
    await GISWaitStrategies.waitForProjectOperation(page, 'create');
  }

  private getLayerButtonSelector(layerType: LayerType): string {
    switch (layerType) {
      case 'point':
        return GIS_CONFIG.SELECTORS.NEW_POINT_LAYER_BUTTON;
      case 'line':
        return GIS_CONFIG.SELECTORS.NEW_LINE_LAYER_BUTTON;
      case 'polygon':
        return GIS_CONFIG.SELECTORS.NEW_POLYGON_LAYER_BUTTON;
      default:
        throw new TestError(`Unknown layer type: ${layerType}`);
    }
  }

  private async testLayerInteractivity(
    page: Page,
    layerType: LayerType
  ): Promise<boolean> {
    try {
      // Basic interactivity test - check if map is still responsive
      const initialCenter = await this.getCurrentCenter(page);
      await page.click(GIS_CONFIG.SELECTORS.ZOOM_IN);
      const newZoom = await this.getCurrentZoom(page);

      return newZoom > 0; // If zoom worked, layer didn't break map functionality
    } catch (error) {
      return false;
    }
  }

  private async performZoomSequence(
    page: Page,
    operations: number
  ): Promise<void> {
    for (let i = 0; i < operations; i++) {
      await page.click(GIS_CONFIG.SELECTORS.ZOOM_IN);
      await GISWaitStrategies.waitForMapOperation(page);
    }

    for (let i = 0; i < operations; i++) {
      await page.click(GIS_CONFIG.SELECTORS.ZOOM_OUT);
      await GISWaitStrategies.waitForMapOperation(page);
    }
  }

  private async performLayerSwitchSequence(page: Page): Promise<void> {
    // Open layer control
    await page.hover(GIS_CONFIG.SELECTORS.LAYER_CONTROL);
    await GISWaitStrategies.waitForLayerControlState(page, true);

    // Switch between base layers
    const baseLayerRadios = page.locator(
      GIS_CONFIG.SELECTORS.BASE_LAYER_RADIOS
    );
    const layerCount = await baseLayerRadios.count();

    for (let i = 0; i < Math.min(layerCount, 3); i++) {
      await baseLayerRadios.nth(i).click();
      await GISWaitStrategies.waitForLayerChange(page);
    }
  }

  private async performPanSequence(page: Page): Promise<void> {
    const mapContainer = page.locator(GIS_CONFIG.SELECTORS.MAP_CONTAINER);
    const mapBox = await mapContainer.boundingBox();

    if (mapBox) {
      const centerX = mapBox.x + mapBox.width / 2;
      const centerY = mapBox.y + mapBox.height / 2;

      // Perform pan operations
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 100, centerY + 100);
      await page.mouse.up();

      await GISWaitStrategies.waitForMapOperation(page);
    }
  }

  private checkPerformanceThresholds(
    operationTimes: Record<string, number>
  ): boolean {
    const thresholds = GIS_CONFIG.PERFORMANCE_THRESHOLDS;

    if (
      operationTimes.mapLoad &&
      operationTimes.mapLoad > thresholds.MAP_LOAD_MAX_MS
    ) {
      return false;
    }

    if (
      operationTimes.zoomOperations &&
      operationTimes.zoomOperations > thresholds.ZOOM_OPERATIONS_MAX_MS
    ) {
      return false;
    }

    if (
      operationTimes.layerSwitching &&
      operationTimes.layerSwitching > thresholds.LAYER_SWITCH_MAX_MS
    ) {
      return false;
    }

    return true;
  }
}
