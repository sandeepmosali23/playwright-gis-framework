# Playwright GIS Framework - User Guide

This comprehensive user guide will help you get started with the Playwright GIS Framework and make the most of its powerful features.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Writing Your First Test](#writing-your-first-test)
4. [Page Objects in Detail](#page-objects-in-detail)
5. [Utilities and Helpers](#utilities-and-helpers)
6. [Error Handling](#error-handling)
7. [Logging and Debugging](#logging-and-debugging)
8. [Performance Testing](#performance-testing)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Usage](#advanced-usage)
12. [API Reference](#api-reference)

## 🚀 Getting Started

### Initial Setup

1. **Install Dependencies**

   ```bash
   npm install
   npx playwright install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your specific settings
   ```

3. **Verify Setup**
   ```bash
   npm test -- --grep "should display layer control interface"
   ```

### Basic Configuration

Update your `.env` file with your GIS application details:

```env
# Your GIS application URL
BASE_URL=http://localhost:3000

# Test execution settings
RETRIES=2
WORKERS=2

# Debug options (enable for troubleshooting)
TRACE_ON_FAILURE=false
SCREENSHOT_ON_FAILURE=true
VIDEO_ON_FAILURE=false

# Timeout settings (adjust based on your app performance)
ACTION_TIMEOUT=15000
NAVIGATION_TIMEOUT=30000
```

## 🏗️ Understanding the Architecture

### Core Components

#### **1. Page Objects**

- `BasePage`: Common functionality across all pages
- `GISMapPage`: GIS-specific operations and interactions

#### **2. Utilities**

- `GISCalculations`: Mathematical and geographic calculations
- `GISValidations`: Coordinate and map state validation
- `GISWaitStrategies`: Intelligent wait conditions
- `ErrorHandler`: Consistent error management

#### **3. Services**

- `GISTestService`: High-level test orchestration

#### **4. Configuration**

- `constants.ts`: Centralized configuration
- `interfaces/`: TypeScript contracts

### Design Patterns

The framework implements several design patterns:

- **Page Object Model**: Encapsulates page interactions
- **Factory Pattern**: Creates specialized error types
- **Strategy Pattern**: Different wait strategies for different scenarios
- **Singleton Pattern**: Logging service instance
- **Service Layer**: Business logic separation

## ✍️ Writing Your First Test

### Simple Map Test

```typescript
import { test, expect } from '@playwright/test';
import { GISMapPage } from '../pages/gis-map-page';

test.describe('My GIS Tests', () => {
  let gisPage: GISMapPage;

  test.beforeEach(async ({ page }) => {
    gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();
  });

  test('should load map successfully', async () => {
    // Verify map container is visible
    await expect(gisPage.mapContainer).toBeVisible();

    // Check initial zoom level
    const zoom = await gisPage.getCurrentZoomLevel();
    expect(zoom).toBeGreaterThan(0);

    // Validate coordinates
    const center = await gisPage.getCurrentCenter();
    expect(center.lat).toBeGreaterThan(-90);
    expect(center.lat).toBeLessThan(90);
  });
});
```

### Layer Management Test

```typescript
test('should manage layers', async ({ page }) => {
  // Create a project first (required for layer operations)
  await gisPage.createNewProject();

  // Check if layer buttons are enabled
  const pointEnabled = await gisPage.newPointLayerButton.isEnabled();
  const lineEnabled = await gisPage.newLineLayerButton.isEnabled();

  // Create layers if enabled
  if (pointEnabled) {
    await gisPage.createPointLayer();
    console.log('✅ Point layer created');
  }

  if (lineEnabled) {
    await gisPage.createLineLayer();
    console.log('✅ Line layer created');
  }
});
```

## 🎯 Page Objects in Detail

### GISMapPage Methods

#### **Navigation & Interaction**

```typescript
// Navigate to the GIS application
await gisPage.navigateToGIS();

// Zoom operations
await gisPage.zoomIn(3); // Zoom in 3 levels
await gisPage.zoomOut(1); // Zoom out 1 level

// Use locate feature (if available)
await gisPage.useLocateFeature();

// Click on map at specific coordinates
await gisPage.clickOnMap(100, 200);

// Drag map from one point to another
await gisPage.dragMap(100, 100, 200, 200);
```

#### **Layer Management**

```typescript
// Open layer control panel
await gisPage.openLayerControl();

// Switch between base layers
await gisPage.selectBaseLayer(0); // Select first base layer
await gisPage.selectBaseLayer(1); // Select second base layer

// Toggle overlay layers
await gisPage.toggleOverlayLayer(0); // Toggle first overlay
```

#### **Project Management**

```typescript
// Create new project
await gisPage.createNewProject();

// Delete current project
await gisPage.deleteProject();

// Create different layer types
await gisPage.createPointLayer();
await gisPage.createLineLayer();
await gisPage.createPolygonLayer();
```

#### **State Queries**

```typescript
// Get current map state
const zoom = await gisPage.getCurrentZoomLevel();
const center = await gisPage.getCurrentCenter();
const bounds = await gisPage.getMapBounds();
const layers = await gisPage.getVisibleLayers();

// Check control visibility
const locateVisible = await gisPage.isLocateControlVisible();
const layerControlVisible = await gisPage.isLayerControlVisible();
```

## 🔧 Utilities and Helpers

### GISCalculations

```typescript
import { GISCalculations } from '../utils/gis-calculations';

// Calculate distance between two points (returns km)
const distance = GISCalculations.calculateDistance(
  37.7749,
  -122.4194, // San Francisco
  40.7128,
  -74.006 // New York
);
console.log(`Distance: ${distance.toFixed(2)} km`);

// Calculate bearing (direction) between points
const bearing = GISCalculations.calculateBearing(
  37.7749,
  -122.4194,
  40.7128,
  -74.006
);
console.log(`Bearing: ${bearing.toFixed(1)}°`);

// Format coordinates for display
const formatted = GISCalculations.formatCoordinates(37.7749, -122.4194, 6);
console.log(`Coordinates: ${formatted}`);

// Calculate midpoint between two coordinates
const midpoint = GISCalculations.calculateMidpoint(
  37.7749,
  -122.4194,
  40.7128,
  -74.006
);

// Convert decimal degrees to DMS format
const dms = GISCalculations.toDMS(37.7749, false); // "37°46'29.64"N"
```

### GISValidations

```typescript
import { GISValidations } from '../utils/gis-validations';

// Validate coordinate ranges
const isValid = GISValidations.validateCoordinates(37.7749, -122.4194);

// Check if point is within bounds
const inBounds = GISValidations.isPointInBounds(37.7749, -122.4194, {
  north: 40,
  south: 35,
  east: -120,
  west: -125,
});

// Assert map is visible and functional
await GISValidations.assertMapIsVisible(page);

// Assert specific zoom level
await GISValidations.assertZoomLevel(page, 10, 0.5); // tolerance of 0.5

// Assert map center coordinates
await GISValidations.assertMapCenter(page, 37.7749, -122.4194, 0.01);

// Assert map bounds are valid
await GISValidations.assertValidMapBounds(page);

// Assert essential controls are present
await GISValidations.assertMapControlsPresent(page);
```

### GISWaitStrategies

```typescript
import { GISWaitStrategies } from '../utils/gis-wait-strategies';

// Wait for map to be ready for interactions
await GISWaitStrategies.waitForMapReady(page);

// Wait for tiles to finish loading
await GISWaitStrategies.waitForTilesToLoad(page);

// Wait for map animations to complete
await GISWaitStrategies.waitForMapAnimation(page);

// Wait for specific zoom level
await GISWaitStrategies.waitForZoomChange(page, 15);

// Wait for coordinate change (useful after pan operations)
const initialCenter = await gisPage.getCurrentCenter();
await gisPage.dragMap(100, 100, 200, 200);
await GISWaitStrategies.waitForCoordinateChange(page, initialCenter);

// Wait for layer control to expand
await GISWaitStrategies.waitForLayerControlState(page, true);

// Wait for custom condition
await GISWaitStrategies.waitForCondition(
  page,
  async () => {
    const zoom = await gisPage.getCurrentZoomLevel();
    return zoom > 10;
  },
  { timeout: 5000, description: 'zoom level > 10' }
);
```

## ⚠️ Error Handling

### Understanding Error Types

The framework provides specific error types for different scenarios:

```typescript
import {
  MapLoadError,
  ElementNotEnabledError,
  InvalidCoordinatesError,
  LayerOperationError,
  ValidationError,
  TimeoutError,
} from '../utils/errors';

// Errors are automatically thrown with context
try {
  await gisPage.createPointLayer();
} catch (error) {
  if (error instanceof LayerOperationError) {
    console.log('Layer operation failed:', error.message);
    console.log('Context:', error.context);
    console.log('Is retryable:', error.isRetryable);
  }
}
```

### Using ErrorHandler

```typescript
import { ErrorHandler } from '../utils/errors';

// Wrap operations with error handling
const result = await ErrorHandler.withErrorHandling(async () => {
  // Your risky operation here
  await someRiskyOperation();
}, 'Operation description for context');

// Retry operations with backoff
const result = await ErrorHandler.withRetry(
  async () => {
    // Operation that might fail temporarily
    await intermittentOperation();
  },
  3, // max retries
  1000, // initial delay
  2 // backoff factor
);
```

### Custom Error Handling

```typescript
test('with custom error handling', async ({ page }) => {
  try {
    await gisPage.navigateToGIS();
    await gisPage.zoomIn(5);
  } catch (error) {
    // Log error details
    console.error('Test failed:', ErrorHandler.extractErrorInfo(error));

    // Take screenshot for debugging
    await page.screenshot({
      path: `error-${Date.now()}.png`,
      fullPage: true,
    });

    // Re-throw to fail the test
    throw error;
  }
});
```

## 📊 Logging and Debugging

### Using the Logger

```typescript
import { logger } from '../utils/logger';

// Different log levels
logger.info('Test started', { testName: 'map-test' });
logger.warn('Element might be disabled', { element: 'point-layer-btn' });
logger.error('Operation failed', new Error('Connection timeout'));
logger.debug('Detailed debug info', { coordinates: { lat: 37, lng: -122 } });

// Specialized logging methods
logger.logMapOperation('Zoom in completed', { levels: 3 });
logger.logLayerOperation('Layer created', 'point', { layerId: 'layer-1' });
logger.logProjectOperation('Project deleted', { projectId: 'proj-123' });
logger.logPerformance('Map load', 2500, 3000); // duration, threshold
logger.logValidation('Coordinates valid', true, { lat: 37, lng: -122 });
```

### Debug Configuration

```typescript
// Enable debug logging
logger.setLogLevel(LogLevel.DEBUG);

// Disable console output (logs still stored)
logger.setConsoleOutput(false);

// Get all logs for analysis
const allLogs = logger.getLogs();
const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
```

### Debug Test Example

```typescript
test('debug test with detailed logging', async ({ page }) => {
  // Log test start
  logger.logTestStart('debug-test');
  const startTime = Date.now();

  try {
    await gisPage.navigateToGIS();
    logger.logMapOperation('Navigation completed');

    const center = await gisPage.getCurrentCenter();
    logger.info('Current center', center);

    await gisPage.zoomIn(3);
    logger.logMapOperation('Zoom completed', { levels: 3 });

    // Log successful completion
    const duration = Date.now() - startTime;
    logger.logTestEnd('debug-test', duration);
  } catch (error) {
    logger.logTestFailure('debug-test', error as Error);
    throw error;
  }
});
```

## 🚀 Performance Testing

### Using GISTestService

```typescript
import { GISTestService } from '../services/gis-test-service';

test('performance testing', async ({ page }) => {
  const service = new GISTestService(page);

  // Comprehensive performance test
  const result = await service.performPerformanceTest(page);

  // Validate results
  expect(result.thresholdsPassed).toBe(true);
  expect(result.loadTime).toBeLessThan(15000);

  console.log('Performance Results:');
  console.log(`Load time: ${result.loadTime}ms`);
  console.log(`Zoom operations: ${result.operationTimes.zoomOperations}ms`);
  console.log(`Layer switching: ${result.operationTimes.layerSwitching}ms`);
});
```

### Custom Performance Tests

```typescript
test('custom performance measurement', async ({ page }) => {
  // Measure specific operation
  const startTime = performance.now();

  await gisPage.navigateToGIS();
  await gisPage.createNewProject();

  // Create multiple layers
  for (let i = 0; i < 5; i++) {
    await gisPage.createPointLayer();
  }

  const duration = performance.now() - startTime;

  // Log performance
  logger.logPerformance('5 layer creation', duration, 10000);

  // Assert performance threshold
  expect(duration).toBeLessThan(10000); // 10 seconds max
});
```

### Performance Monitoring

```typescript
// Monitor tile loading performance
const tileMonitor = await GISHelpers.monitorTileRequests(page);
await gisPage.selectBaseLayer(1);
await GISWaitStrategies.waitForLayerChange(page);

console.log(`Tiles loaded: ${tileMonitor.success}`);
console.log(`Tiles failed: ${tileMonitor.failed}`);

// Measure map load time
const loadTime = await GISHelpers.measureMapLoadTime(page);
expect(loadTime).toBeLessThan(
  GIS_CONFIG.PERFORMANCE_THRESHOLDS.MAP_LOAD_MAX_MS
);
```

## 💡 Best Practices

### Test Organization

```typescript
test.describe('GIS Feature Tests', () => {
  let gisPage: GISMapPage;

  test.beforeEach(async ({ page }) => {
    gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();
  });

  test.describe('Layer Management', () => {
    test.beforeEach(async () => {
      // Ensure project exists for layer tests
      await gisPage.createNewProject();
    });

    test('should create point layer', async () => {
      // Test implementation
    });
  });
});
```

### Data-Driven Tests

```typescript
const testCoordinates = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
];

testCoordinates.forEach(coord => {
  test(`should validate ${coord.name} coordinates`, async () => {
    const isValid = GISValidations.validateCoordinates(coord.lat, coord.lng);
    expect(isValid).toBe(true);
  });
});
```

### Conditional Testing

```typescript
test('conditional layer testing', async ({ page }) => {
  await gisPage.createNewProject();

  // Check button states and test accordingly
  const buttonStates = {
    point: await gisPage.newPointLayerButton.isEnabled(),
    line: await gisPage.newLineLayerButton.isEnabled(),
    polygon: await gisPage.newPolygonLayerButton.isEnabled(),
  };

  if (buttonStates.point) {
    await gisPage.createPointLayer();
    console.log('✅ Point layer created');
  } else {
    console.log('ℹ️ Point layer button disabled - skipping');
  }
});
```

### Robust Assertions

```typescript
test('robust coordinate validation', async () => {
  const center = await gisPage.getCurrentCenter();

  // Multiple validation approaches
  expect(GISValidations.validateCoordinates(center.lat, center.lng)).toBe(true);
  expect(center.lat).toBeGreaterThan(-90);
  expect(center.lat).toBeLessThan(90);
  expect(center.lng).toBeGreaterThan(-180);
  expect(center.lng).toBeLessThan(180);

  // Context-aware assertions
  if (Math.abs(center.lat) < 0.1 && Math.abs(center.lng) < 0.1) {
    console.log('Map centered near origin (0,0)');
  }
});
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### **1. Map Not Loading**

**Symptoms**: Tests timeout waiting for map
**Solutions**:

```typescript
// Check if BASE_URL is correct
console.log('Testing URL:', process.env.BASE_URL);

// Increase map load timeout
await GISWaitStrategies.waitForMapReady(page, 60000); // 60 seconds

// Debug map loading
await page.waitForFunction(
  () => {
    console.log('Leaflet loaded:', typeof window.L !== 'undefined');
    console.log('Map instance:', !!(window as any).map);
    return false; // Keep waiting to see logs
  },
  { timeout: 1000 }
);
```

#### **2. Element Not Found**

**Symptoms**: Locators fail to find elements
**Solutions**:

```typescript
// Debug element existence
await page.locator('#map').waitFor({ state: 'visible', timeout: 30000 });

// Check multiple selectors
const selectors = ['#map', '.leaflet-container', '[data-testid="map"]'];
for (const selector of selectors) {
  const exists = (await page.locator(selector).count()) > 0;
  console.log(`Selector ${selector}: ${exists ? 'found' : 'not found'}`);
}

// Take screenshot for debugging
await page.screenshot({ path: 'debug-elements.png', fullPage: true });
```

#### **3. Flaky Tests**

**Symptoms**: Tests pass/fail inconsistently
**Solutions**:

```typescript
// Use proper wait strategies
await GISWaitStrategies.waitForMapReady(page);
await GISWaitStrategies.waitForTilesToLoad(page);

// Add retry mechanisms
await ErrorHandler.withRetry(async () => {
  await gisPage.createPointLayer();
}, 3);

// Increase timeouts for slower environments
const timeout = process.env.CI ? 60000 : 30000;
await page.waitForSelector('.leaflet-tile-loaded', { timeout });
```

#### **4. Performance Issues**

**Symptoms**: Tests run slowly
**Solutions**:

```typescript
// Monitor performance
const result = await service.performPerformanceTest(page);
console.log('Performance bottlenecks:', result.details);

// Optimize wait strategies
// Instead of: await page.waitForTimeout(5000);
// Use: await GISWaitStrategies.waitForMapOperation(page);

// Parallel test execution
// Configure in playwright.config.ts
workers: process.env.CI ? 1 : 4;
```

### Debug Checklist

When tests fail, check these items:

1. **Environment Setup**
   - [ ] `.env` file configured correctly
   - [ ] Application is running and accessible
   - [ ] Browser has necessary permissions

2. **Application State**
   - [ ] Map loads completely
   - [ ] All required tiles are loaded
   - [ ] No JavaScript errors in console

3. **Test Configuration**
   - [ ] Selectors match current application
   - [ ] Timeouts are appropriate for environment
   - [ ] Test data is valid

4. **Network Issues**
   - [ ] Tile servers are accessible
   - [ ] No proxy blocking requests
   - [ ] Sufficient bandwidth for tile loading

## 🔬 Advanced Usage

### Custom Wait Strategies

```typescript
// Create custom wait condition
async function waitForSpecificZoomLevel(page: Page, targetZoom: number) {
  await GISWaitStrategies.waitForCondition(
    page,
    async () => {
      const currentZoom = await page.evaluate(() => {
        return (window as any).map?.getZoom();
      });
      return currentZoom === targetZoom;
    },
    {
      timeout: 10000,
      interval: 200,
      description: `zoom level ${targetZoom}`,
    }
  );
}
```

### Custom Assertions

```typescript
// Create reusable assertion
async function assertMapWithinBounds(
  page: Page,
  expectedBounds: { north: number; south: number; east: number; west: number }
) {
  const actualBounds = await page.evaluate(() => {
    const bounds = (window as any).map?.getBounds();
    return bounds
      ? {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        }
      : null;
  });

  expect(actualBounds).not.toBeNull();
  expect(actualBounds!.north).toBeLessThanOrEqual(expectedBounds.north);
  expect(actualBounds!.south).toBeGreaterThanOrEqual(expectedBounds.south);
  expect(actualBounds!.east).toBeLessThanOrEqual(expectedBounds.east);
  expect(actualBounds!.west).toBeGreaterThanOrEqual(expectedBounds.west);
}
```

### Visual Testing

```typescript
import { GISHelpers } from '../utils/gis-helpers-consolidated';

test('visual regression testing', async ({ page }) => {
  await gisPage.navigateToGIS();

  // Set consistent map state
  await gisPage.zoomIn(5);
  await page.waitForTimeout(2000); // Let map settle

  // Take map screenshot
  await GISHelpers.getMapScreenshot(page, 'baseline-map');

  // Compare with baseline (requires baseline image)
  await GISHelpers.compareMapView(page, 'baseline-map');
});
```

### Parallel Test Execution

```typescript
// Configure in playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});

// Use test.describe.parallel for concurrent execution
test.describe.parallel('Map Operations', () => {
  test('zoom operations', async ({ page }) => {
    // This can run in parallel with other tests
  });

  test('pan operations', async ({ page }) => {
    // This can run in parallel with other tests
  });
});
```

## 📋 API Reference

### GISMapPage

| Method                  | Description                | Parameters          | Returns                               |
| ----------------------- | -------------------------- | ------------------- | ------------------------------------- |
| `navigateToGIS()`       | Navigate to GIS app        | None                | `Promise<void>`                       |
| `zoomIn(times?)`        | Zoom in specified times    | `times: number = 1` | `Promise<void>`                       |
| `zoomOut(times?)`       | Zoom out specified times   | `times: number = 1` | `Promise<void>`                       |
| `getCurrentZoomLevel()` | Get current zoom level     | None                | `Promise<number>`                     |
| `getCurrentCenter()`    | Get map center coordinates | None                | `Promise<{lat: number, lng: number}>` |
| `createNewProject()`    | Create new project         | None                | `Promise<void>`                       |
| `createPointLayer()`    | Create point layer         | None                | `Promise<void>`                       |

### GISCalculations

| Method                  | Description                       | Parameters                             | Returns            |
| ----------------------- | --------------------------------- | -------------------------------------- | ------------------ |
| `calculateDistance()`   | Calculate distance between points | `lat1, lng1, lat2, lng2: number`       | `number` (km)      |
| `calculateBearing()`    | Calculate bearing between points  | `lat1, lng1, lat2, lng2: number`       | `number` (degrees) |
| `formatCoordinates()`   | Format coordinates for display    | `lat, lng: number, precision?: number` | `string`           |
| `validateCoordinates()` | Validate coordinate ranges        | `lat, lng: number`                     | `boolean`          |

### GISValidations

| Method                   | Description                | Parameters                                     | Returns         |
| ------------------------ | -------------------------- | ---------------------------------------------- | --------------- |
| `validateCoordinates()`  | Check coordinate validity  | `lat, lng: number`                             | `boolean`       |
| `assertMapIsVisible()`   | Assert map is visible      | `page: Page`                                   | `Promise<void>` |
| `assertZoomLevel()`      | Assert specific zoom level | `page: Page, zoom: number, tolerance?: number` | `Promise<void>` |
| `assertValidMapBounds()` | Assert bounds are valid    | `page: Page`                                   | `Promise<void>` |

### GISWaitStrategies

| Method                  | Description                       | Parameters                         | Returns         |
| ----------------------- | --------------------------------- | ---------------------------------- | --------------- |
| `waitForMapReady()`     | Wait for map initialization       | `page: Page`                       | `Promise<void>` |
| `waitForTilesToLoad()`  | Wait for tile loading             | `page: Page, timeout?: number`     | `Promise<void>` |
| `waitForZoomChange()`   | Wait for zoom to change           | `page: Page, expectedZoom: number` | `Promise<void>` |
| `waitForMapOperation()` | Wait for map operation completion | `page: Page, timeout?: number`     | `Promise<void>` |

---

**Need more help?** Check the code examples in the `tests/` directory or create an issue on GitHub.
