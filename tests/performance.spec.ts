import { test, expect } from '@playwright/test';
import { GISMapPage } from '../pages/gis-map-page';

test.describe('GIS Performance', () => {
  test('should load GIS app within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    const gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();

    const loadTime = Date.now() - startTime;
    console.log(`GIS app load time: ${loadTime}ms`);

    // Should load within 15 seconds (GIS apps are complex)
    expect(loadTime).toBeLessThan(15000);
  });

  test('should handle zoom operations efficiently', async ({ page }) => {
    const gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();

    const startTime = Date.now();

    // Perform 10 rapid zoom operations
    for (let i = 0; i < 5; i++) {
      await gisPage.zoomIn();
      await gisPage.zoomOut();
    }

    const duration = Date.now() - startTime;
    console.log(`10 zoom operations took: ${duration}ms`);

    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000);

    // Map should still be responsive
    const finalZoom = await gisPage.getCurrentZoomLevel();
    expect(finalZoom).toBeGreaterThan(0);
  });

  test('should handle layer switching performance', async ({ page }) => {
    const gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();

    const startTime = Date.now();

    // Switch between all base layers multiple times
    for (let round = 0; round < 3; round++) {
      for (let layer = 0; layer < 3; layer++) {
        await gisPage.selectBaseLayer(layer);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Layer switching test took: ${duration}ms`);

    // Should complete within reasonable time
    expect(duration).toBeLessThan(25000);
  });
});
