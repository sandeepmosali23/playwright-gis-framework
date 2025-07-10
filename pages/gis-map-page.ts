import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { IGISPage } from '../interfaces';
import { GIS_CONFIG } from '../config/constants';
import { GISWaitStrategies } from '../utils/gis-wait-strategies';
import {
  MapLoadError,
  ProjectOperationError,
  LayerOperationError,
  MapInteractionError,
  ErrorHandler,
} from '../utils/errors';
import { logger } from '../utils/logger';

export class GISMapPage extends BasePage implements IGISPage {
  // Map container
  readonly mapContainer: Locator;

  // Navigation controls
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly locateButton: Locator;

  // Layer controls
  readonly layerControl: Locator;
  readonly layerToggleButton: Locator;
  readonly baseLayerRadios: Locator;
  readonly overlayCheckboxes: Locator;

  // Project management
  readonly newProjectButton: Locator;
  readonly deleteProjectButton: Locator;

  // Layer creation tools
  readonly newPointLayerButton: Locator;
  readonly newLineLayerButton: Locator;
  readonly newPolygonLayerButton: Locator;

  constructor(page: Page) {
    super(page);

    // Map container
    this.mapContainer = page.locator(GIS_CONFIG.SELECTORS.MAP_CONTAINER);

    // Navigation controls
    this.zoomInButton = page.locator(GIS_CONFIG.SELECTORS.ZOOM_IN);
    this.zoomOutButton = page.locator(GIS_CONFIG.SELECTORS.ZOOM_OUT);
    this.locateButton = page.locator(GIS_CONFIG.SELECTORS.LOCATE_BUTTON);

    // Layer controls
    this.layerControl = page.locator(GIS_CONFIG.SELECTORS.LAYER_CONTROL);
    this.layerToggleButton = page.locator(GIS_CONFIG.SELECTORS.LAYER_TOGGLE);
    this.baseLayerRadios = page.locator(GIS_CONFIG.SELECTORS.BASE_LAYER_RADIOS);
    this.overlayCheckboxes = page.locator(
      GIS_CONFIG.SELECTORS.OVERLAY_CHECKBOXES
    );

    // Project management
    this.newProjectButton = page.locator(
      GIS_CONFIG.SELECTORS.NEW_PROJECT_BUTTON
    );
    this.deleteProjectButton = page.locator(
      GIS_CONFIG.SELECTORS.DELETE_PROJECT_BUTTON
    );

    // Layer creation tools
    this.newPointLayerButton = page.locator(
      GIS_CONFIG.SELECTORS.NEW_POINT_LAYER_BUTTON
    );
    this.newLineLayerButton = page.locator(
      GIS_CONFIG.SELECTORS.NEW_LINE_LAYER_BUTTON
    );
    this.newPolygonLayerButton = page.locator(
      GIS_CONFIG.SELECTORS.NEW_POLYGON_LAYER_BUTTON
    );
  }

  async navigateToGIS(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.goto('index.html');
      await this.waitForMapLoad();
    }, 'Navigate to GIS application');
  }

  async waitForMapLoad(): Promise<void> {
    try {
      await GISWaitStrategies.waitForMapReady(this.page);
      await GISWaitStrategies.waitForTilesToLoad(this.page);
    } catch (error) {
      throw new MapLoadError('Failed to load GIS map', {
        originalError: error,
      });
    }
  }

  // Navigation methods
  async zoomIn(times: number = 1): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      for (let i = 0; i < times; i++) {
        const initialZoom = await this.getCurrentZoomLevel();
        await this.clickElement(this.zoomInButton);
        await GISWaitStrategies.waitForZoomChange(this.page, initialZoom + 1);
      }
      logger.logMapOperation('Zoom in', { times, direction: 'in' });
    }, 'Zoom in operation');
  }

  async zoomOut(times: number = 1): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      for (let i = 0; i < times; i++) {
        const initialZoom = await this.getCurrentZoomLevel();
        await this.clickElement(this.zoomOutButton);
        await GISWaitStrategies.waitForZoomChange(this.page, initialZoom - 1);
      }
      logger.logMapOperation('Zoom out', { times, direction: 'out' });
    }, 'Zoom out operation');
  }

  async useLocateFeature(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.clickElement(this.locateButton);
      await GISWaitStrategies.waitForGeolocation(this.page);
      logger.logMapOperation('Locate feature used');
    }, 'Use locate feature');
  }

  // Layer management methods
  async openLayerControl(): Promise<void> {
    // Check if already expanded
    const isExpanded = await this.page
      .locator('.leaflet-control-layers-expanded')
      .isVisible();

    if (!isExpanded) {
      await this.layerToggleButton.click({ force: true });

      // Wait for layer control to expand
      await this.page.waitForSelector('.leaflet-control-layers-expanded', {
        state: 'visible',
        timeout: 3000,
      });
    }
  }
  async selectBaseLayer(layerIndex: number): Promise<void> {
    // Ensure layer control is visible and interactable
    await this.layerControl.hover();

    // Wait for layer control to be expanded
    await this.page.waitForSelector('.leaflet-control-layers-expanded', {
      state: 'visible',
      timeout: 3000,
    });

    // Click the specific radio button
    await this.baseLayerRadios.nth(layerIndex).click();

    // Wait for layer to be applied by checking for tile loading
    await this.page.waitForFunction(
      () => {
        const tiles = document.querySelectorAll('.leaflet-tile');
        return tiles.length > 0;
      },
      { timeout: 5000 }
    );
  }

  async toggleOverlayLayer(layerIndex: number): Promise<void> {
    await this.openLayerControl();

    const checkbox = this.overlayCheckboxes.nth(layerIndex);
    const wasChecked = await checkbox.isChecked();

    await this.clickElement(checkbox);

    // Wait for checkbox state to change
    await this.page.waitForFunction(
      args => {
        const checkbox = document.querySelectorAll(
          '.leaflet-control-layers-selector[type="checkbox"]'
        )[args.layerIndex] as HTMLInputElement;
        return checkbox && checkbox.checked === args.expectedChecked;
      },
      { layerIndex, expectedChecked: !wasChecked },
      { timeout: 3000 }
    );
  }

  // Project management methods
  async createNewProject(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.clickElement(this.newProjectButton);
      await GISWaitStrategies.waitForProjectOperation(this.page, 'create');
      logger.logProjectOperation('Project created');
    }, 'Create new project');
  }

  async deleteProject(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.clickElement(this.deleteProjectButton);
      await GISWaitStrategies.waitForProjectOperation(this.page, 'delete');
      logger.logProjectOperation('Project deleted');
    }, 'Delete project');
  }

  // Layer creation methods
  async createPointLayer(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.clickElement(this.newPointLayerButton);
      await GISWaitStrategies.waitForMapOperation(
        this.page,
        GIS_CONFIG.TIMEOUTS.LAYER_CREATION
      );
      logger.logLayerOperation('Layer created', 'point');
    }, 'Create point layer');
  }

  async createLineLayer(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.clickElement(this.newLineLayerButton);
      await GISWaitStrategies.waitForMapOperation(
        this.page,
        GIS_CONFIG.TIMEOUTS.LAYER_CREATION
      );
      logger.logLayerOperation('Layer created', 'line');
    }, 'Create line layer');
  }

  async createPolygonLayer(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await this.clickElement(this.newPolygonLayerButton);
      await GISWaitStrategies.waitForMapOperation(
        this.page,
        GIS_CONFIG.TIMEOUTS.LAYER_CREATION
      );
      logger.logLayerOperation('Layer created', 'polygon');
    }, 'Create polygon layer');
  }

  // Map interaction methods
  async clickOnMap(x: number, y: number): Promise<void> {
    await this.mapContainer.click({ position: { x, y } });

    // Wait for any click handlers to complete
    await this.page.waitForFunction(
      () => {
        const map = (window as any).map;
        return map && !map._animatingZoom;
      },
      { timeout: 2000 }
    );
  }

  async dragMap(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): Promise<void> {
    const initialCenter = await this.getCurrentCenter();

    await this.page.mouse.move(fromX, fromY);
    await this.page.mouse.down();
    await this.page.mouse.move(toX, toY);
    await this.page.mouse.up();

    // Wait for pan operation to complete
    await this.page.waitForFunction(
      args => {
        const map = (window as any).map;
        if (!map) return false;

        const currentCenter = map.getCenter();
        const latDiff = Math.abs(currentCenter.lat - args.startCenter.lat);
        const lngDiff = Math.abs(currentCenter.lng - args.startCenter.lng);

        // Either coordinates changed or animation is complete
        return (
          (latDiff > 0.000001 || lngDiff > 0.000001) && !map._animatingZoom
        );
      },
      { startCenter: initialCenter },
      { timeout: 3000 }
    );
  }

  // State query methods
  async getCurrentZoomLevel(): Promise<number> {
    return await this.page.evaluate(() => {
      return (window as any).map?.getZoom() || 0;
    });
  }

  async getCurrentCenter(): Promise<{ lat: number; lng: number }> {
    return await this.page.evaluate(() => {
      const center = (window as any).map?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : { lat: 0, lng: 0 };
    });
  }

  async getMapBounds(): Promise<{
    north: number;
    south: number;
    east: number;
    west: number;
  }> {
    return await this.page.evaluate(() => {
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

  async getVisibleLayers(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const layers: string[] = [];
      // Get checked layer controls
      document
        .querySelectorAll('.leaflet-control-layers-selector:checked')
        .forEach((input, index) => {
          layers.push(`Layer ${index + 1}`);
        });
      return layers;
    });
  }

  async isLocateControlVisible(): Promise<boolean> {
    return await this.isElementVisible(this.locateButton);
  }

  async isLayerControlVisible(): Promise<boolean> {
    return await this.isElementVisible(this.layerControl);
  }
}
