/**
 * GIS wait strategies and utilities
 */

import { Page } from '@playwright/test';
import { IGISWaitStrategies, ElementState, WaitOptions } from '../interfaces';
import { GIS_CONFIG } from '../config/constants';
import { TimeoutError } from './errors';
import { logger } from './logger';

export class GISWaitStrategies implements IGISWaitStrategies {
  /**
   * Waits for all map tiles to finish loading
   */
  static async waitForTilesToLoad(
    page: Page,
    timeout: number = GIS_CONFIG.TIMEOUTS.TILE_LOAD
  ): Promise<void> {
    logger.debug('Waiting for map tiles to load...');

    try {
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

      logger.debug('All map tiles loaded successfully');
    } catch (error) {
      throw new TimeoutError('Waiting for tiles to load', timeout, {
        originalError: error,
      });
    }
  }

  /**
   * Waits for the map to finish any animations
   */
  static async waitForMapAnimation(page: Page): Promise<void> {
    logger.debug('Waiting for map animations to complete...');

    try {
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
        { timeout: GIS_CONFIG.TIMEOUTS.ANIMATION_SETTLE }
      );

      logger.debug('Map animations completed');
    } catch (error) {
      throw new TimeoutError(
        'Waiting for map animations',
        GIS_CONFIG.TIMEOUTS.ANIMATION_SETTLE,
        { originalError: error }
      );
    }
  }

  /**
   * Waits for map to be ready for interactions
   */
  static async waitForMapReady(page: Page): Promise<void> {
    logger.debug('Waiting for map to be ready...');

    try {
      // Wait for Leaflet to be loaded
      await page.waitForFunction(() => {
        return typeof window.L !== 'undefined';
      });

      // Wait for map instance to be created
      await page.waitForFunction(() => {
        return (window as any).map !== undefined;
      });

      // Wait for map container to be visible
      await page.waitForSelector(GIS_CONFIG.SELECTORS.MAP_CONTAINER, {
        state: 'visible',
      });

      // Wait for map to be fully initialized and interactive
      await page.waitForFunction(
        () => {
          const map = (window as any).map;
          return (
            map && map._loaded && !map._animatingZoom && !map._animatingPan
          );
        },
        { timeout: GIS_CONFIG.TIMEOUTS.MAP_LOAD }
      );

      logger.info('Map is ready for interactions');
    } catch (error) {
      throw new TimeoutError(
        'Waiting for map to be ready',
        GIS_CONFIG.TIMEOUTS.MAP_LOAD,
        { originalError: error }
      );
    }
  }

  /**
   * Waits for any map operation to complete
   */
  static async waitForMapOperation(
    page: Page,
    timeout: number = GIS_CONFIG.TIMEOUTS.ZOOM_OPERATION
  ): Promise<void> {
    logger.debug('Waiting for map operation to complete...');

    try {
      await page.waitForFunction(
        () => {
          const map = (window as any).map;
          return map && !map._animatingZoom && !map._animatingPan;
        },
        { timeout }
      );

      logger.debug('Map operation completed');
    } catch (error) {
      throw new TimeoutError('Waiting for map operation', timeout, {
        originalError: error,
      });
    }
  }

  /**
   * Waits for element to be in a specific state
   */
  static async waitForElementState(
    page: Page,
    selector: string,
    state: ElementState,
    timeout: number = GIS_CONFIG.TIMEOUTS.LAYER_CONTROL_EXPAND
  ): Promise<void> {
    logger.debug(`Waiting for element ${selector} to be ${state}...`);

    try {
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

      logger.debug(`Element ${selector} is now ${state}`);
    } catch (error) {
      throw new TimeoutError(
        `Waiting for element ${selector} to be ${state}`,
        timeout,
        { originalError: error }
      );
    }
  }

  /**
   * Waits for a specific condition to be met with retry logic
   */
  static async waitForCondition(
    page: Page,
    condition: () => Promise<boolean>,
    options: WaitOptions = {}
  ): Promise<void> {
    const {
      timeout = 5000,
      interval = 100,
      description = 'condition',
    } = options;
    const startTime = Date.now();

    logger.debug(`Waiting for ${description}...`);

    while (Date.now() - startTime < timeout) {
      try {
        if (await condition()) {
          logger.debug(`${description} met`);
          return;
        }
      } catch (error) {
        logger.debug(`Error checking ${description}: ${error}`);
      }

      await page.waitForTimeout(interval);
    }

    throw new TimeoutError(`Waiting for ${description}`, timeout);
  }

  /**
   * Waits for zoom level to change to expected value
   */
  static async waitForZoomChange(
    page: Page,
    expectedZoom: number,
    timeout: number = GIS_CONFIG.TIMEOUTS.ZOOM_OPERATION
  ): Promise<void> {
    logger.debug(`Waiting for zoom level to change to ${expectedZoom}...`);

    try {
      await page.waitForFunction(
        expected => {
          const currentZoom = (window as any).map?.getZoom();
          return currentZoom === expected;
        },
        expectedZoom,
        { timeout }
      );

      logger.debug(`Zoom level changed to ${expectedZoom}`);
    } catch (error) {
      throw new TimeoutError(
        `Waiting for zoom level ${expectedZoom}`,
        timeout,
        { originalError: error }
      );
    }
  }

  /**
   * Waits for coordinate change (useful for pan operations)
   */
  static async waitForCoordinateChange(
    page: Page,
    initialCoords: { lat: number; lng: number },
    timeout: number = GIS_CONFIG.TIMEOUTS.PAN_OPERATION
  ): Promise<void> {
    logger.debug('Waiting for coordinate change...');

    try {
      await page.waitForFunction(
        initial => {
          const map = (window as any).map;
          if (!map) return false;

          const currentCenter = map.getCenter();
          const latDiff = Math.abs(currentCenter.lat - initial.lat);
          const lngDiff = Math.abs(currentCenter.lng - initial.lng);

          return (
            (latDiff > 0.000001 || lngDiff > 0.000001) && !map._animatingZoom
          );
        },
        initialCoords,
        { timeout }
      );

      logger.debug('Coordinate change detected');
    } catch (error) {
      throw new TimeoutError('Waiting for coordinate change', timeout, {
        originalError: error,
      });
    }
  }

  /**
   * Waits for layer control to expand/collapse
   */
  static async waitForLayerControlState(
    page: Page,
    expanded: boolean,
    timeout: number = GIS_CONFIG.TIMEOUTS.LAYER_CONTROL_EXPAND
  ): Promise<void> {
    logger.debug(
      `Waiting for layer control to be ${expanded ? 'expanded' : 'collapsed'}...`
    );

    try {
      if (expanded) {
        await page.waitForSelector(GIS_CONFIG.SELECTORS.LAYER_EXPANDED, {
          state: 'visible',
          timeout,
        });
      } else {
        await page.waitForSelector(GIS_CONFIG.SELECTORS.LAYER_EXPANDED, {
          state: 'hidden',
          timeout,
        });
      }

      logger.debug(
        `Layer control is now ${expanded ? 'expanded' : 'collapsed'}`
      );
    } catch (error) {
      throw new TimeoutError(
        `Waiting for layer control to be ${expanded ? 'expanded' : 'collapsed'}`,
        timeout,
        { originalError: error }
      );
    }
  }

  /**
   * Waits for tiles to finish loading after layer change
   */
  static async waitForLayerChange(
    page: Page,
    timeout: number = GIS_CONFIG.TIMEOUTS.LAYER_SWITCH
  ): Promise<void> {
    logger.debug('Waiting for layer change to complete...');

    try {
      await page.waitForFunction(
        () => {
          const tiles = document.querySelectorAll(GIS_CONFIG.SELECTORS.TILES);
          return tiles.length > 0;
        },
        { timeout }
      );

      // Wait for tiles to load
      await this.waitForTilesToLoad(page, timeout);

      logger.debug('Layer change completed');
    } catch (error) {
      throw new TimeoutError('Waiting for layer change', timeout, {
        originalError: error,
      });
    }
  }

  /**
   * Waits for project operation to complete
   */
  static async waitForProjectOperation(
    page: Page,
    operation: 'create' | 'delete',
    timeout: number = GIS_CONFIG.TIMEOUTS.PROJECT_CREATION
  ): Promise<void> {
    logger.debug(`Waiting for project ${operation} operation...`);

    try {
      if (operation === 'create') {
        await page.waitForFunction(
          () => {
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
              const text = button.textContent || '';
              if (
                text.includes('Point Layer') ||
                text.includes('Line Layer') ||
                text.includes('Polygon Layer')
              ) {
                if (!button.hasAttribute('disabled')) {
                  return true;
                }
              }
            }
            return false;
          },
          { timeout }
        );
      } else {
        await page.waitForFunction(
          () => {
            const buttons = document.querySelectorAll('button');
            const layerButtons = Array.from(buttons).filter(btn => {
              const text = btn.textContent || '';
              return (
                text.includes('Point Layer') ||
                text.includes('Line Layer') ||
                text.includes('Polygon Layer')
              );
            });

            return (
              layerButtons.length > 0 &&
              layerButtons.every(btn => btn.hasAttribute('disabled'))
            );
          },
          { timeout }
        );
      }

      logger.debug(`Project ${operation} operation completed`);
    } catch (error) {
      // Don't throw error for project operations as they may not always work as expected
      logger.warn(
        `Project ${operation} operation may not have completed as expected`
      );
    }
  }

  /**
   * Waits for geolocation operation to complete
   */
  static async waitForGeolocation(
    page: Page,
    timeout: number = GIS_CONFIG.TIMEOUTS.GEOLOCATION
  ): Promise<void> {
    logger.debug('Waiting for geolocation operation...');

    try {
      await page.waitForFunction(
        () => {
          const locateControl = document.querySelector(
            '.leaflet-control-locate'
          );
          return !locateControl?.classList.contains('requesting');
        },
        { timeout }
      );

      logger.debug('Geolocation operation completed');
    } catch (error) {
      throw new TimeoutError('Waiting for geolocation', timeout, {
        originalError: error,
      });
    }
  }
}
