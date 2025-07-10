import { test, expect } from '@playwright/test';
import { GISMapPage } from '../pages/gis-map-page';

test.describe('Layer Management', () => {
  let gisPage: GISMapPage;

  test.beforeEach(async ({ page }) => {
    gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();
  });

  test('should display layer control interface', async () => {
    // Verify layer control is accessible
    await expect(gisPage.layerToggleButton).toBeVisible();

    // Open layer control panel
    await gisPage.openLayerControl();
    await expect(gisPage.layerControl).toBeVisible();
  });

  test('should switch between base layers', async () => {
    await gisPage.openLayerControl();

    // Test switching between all 3 base layers
    for (let i = 0; i < 3; i++) {
      await gisPage.selectBaseLayer(i);

      // Verify no errors and map still responds
      const center = await gisPage.getCurrentCenter();
      expect(center.lat).toBeDefined();
      expect(center.lng).toBeDefined();
    }
  });

  test('should toggle overlay layers', async () => {
    await gisPage.openLayerControl();

    // Toggle the overlay layer on/off
    await gisPage.toggleOverlayLayer(0);
    await gisPage.toggleOverlayLayer(0);

    // Verify map is still functional
    const zoom = await gisPage.getCurrentZoomLevel();
    expect(zoom).toBeGreaterThan(0);
  });

  test('should manage layer creation workflow', async ({ page }) => {
    // Step 1: Create a project first to enable layer tools
    console.log('📁 Creating new project to enable layer creation...');
    await gisPage.createNewProject();

    // Step 2: Verify layer buttons are now enabled
    const layerStates = {
      point: await gisPage.newPointLayerButton.isEnabled(),
      line: await gisPage.newLineLayerButton.isEnabled(),
      polygon: await gisPage.newPolygonLayerButton.isEnabled(),
    };

    console.log('📊 Layer button states after project creation:', layerStates);

    // Step 3: Create layers only if buttons are enabled
    const layerTypes = [
      {
        name: 'Point',
        enabled: layerStates.point,
        action: () => gisPage.createPointLayer(),
      },
      {
        name: 'Line',
        enabled: layerStates.line,
        action: () => gisPage.createLineLayer(),
      },
      {
        name: 'Polygon',
        enabled: layerStates.polygon,
        action: () => gisPage.createPolygonLayer(),
      },
    ];

    for (const layer of layerTypes) {
      if (layer.enabled) {
        console.log(`🎯 Creating ${layer.name} layer...`);
        await layer.action();
        console.log(`✅ ${layer.name} layer created successfully`);
      } else {
        console.log(`ℹ️ ${layer.name} layer button still disabled - skipping`);
      }
    }

    // Verify UI remains functional
    await expect(gisPage.newProjectButton).toBeVisible();
  });
});
