# Playwright GIS Framework

A comprehensive, enterprise-grade Playwright test automation framework specifically designed for testing GIS (Geographic Information System) web applications built with Leaflet.

## 🌟 Features

- **🗺️ GIS-Specific Testing**: Specialized utilities for map interactions, coordinate validation, and geospatial calculations
- **⚡ Modern Architecture**: Implements SOLID principles with proper separation of concerns
- **🔧 Robust Error Handling**: Custom error classes with retry mechanisms and meaningful context
- **📊 Comprehensive Logging**: Structured logging with different levels and operation tracking
- **🎯 Performance Testing**: Built-in performance monitoring and threshold validation
- **🔄 Reliable Wait Strategies**: Condition-based waits instead of hard timeouts
- **🛡️ Type Safety**: Full TypeScript support with comprehensive interfaces
- **📱 Cross-Browser**: Supports Chrome, Firefox, and other Playwright browsers

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- A GIS web application (Leaflet-based)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd playwright-gis-framework

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Configuration

1. **Copy environment configuration:**

   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your settings:**
   ```env
   BASE_URL=http://localhost:3000
   RETRIES=2
   WORKERS=2
   SCREENSHOT_ON_FAILURE=true
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "Layer Management"

# Run tests in headed mode
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Run tests in debug mode
npm run test:debug
```

## 📁 Project Structure

```
playwright-gis-framework/
├── config/
│   └── constants.ts           # Configuration constants and types
├── interfaces/
│   └── index.ts              # TypeScript interfaces and types
├── pages/
│   ├── base-page.ts          # Base page object with common functionality
│   └── gis-map-page.ts       # GIS-specific page object
├── services/
│   └── gis-test-service.ts   # High-level test orchestration service
├── tests/
│   ├── gis-comprehensive.spec.ts  # Comprehensive GIS functionality tests
│   ├── layer-management.spec.ts   # Layer creation and management tests
│   ├── map-interactions.spec.ts   # Map interaction and navigation tests
│   └── performance.spec.ts        # Performance and load testing
├── utils/
│   ├── errors.ts             # Custom error classes and error handling
│   ├── gis-calculations.ts   # Geographic calculations and utilities
│   ├── gis-validations.ts    # Coordinate and map state validation
│   ├── gis-wait-strategies.ts # Specialized wait conditions for GIS
│   ├── gis-helpers-consolidated.ts # Backward compatibility helpers
│   └── logger.ts             # Structured logging service
├── .env.example              # Environment configuration template
├── playwright.config.ts      # Playwright configuration
└── package.json             # Dependencies and scripts
```

## 🧪 Test Suites

### 1. **GIS Comprehensive Tests** (`gis-comprehensive.spec.ts`)

Complete end-to-end testing of GIS functionality:

- ✅ Application loading and initialization
- ✅ Zoom operations with validation
- ✅ Coordinate validation and map state
- ✅ Project and layer management workflow
- ✅ Map interactions with fallback verification
- ✅ Mathematical precision testing
- ✅ Comprehensive GIS capabilities demonstration

### 2. **Layer Management Tests** (`layer-management.spec.ts`)

Testing layer control functionality:

- Layer control interface visibility
- Base layer switching
- Overlay layer toggling
- Layer creation workflow

### 3. **Map Interaction Tests** (`map-interactions.spec.ts`)

Testing map navigation and interaction:

- Pan operations via dragging
- Map click handling
- Bounds validation
- Rapid interaction stability

### 4. **Performance Tests** (`performance.spec.ts`)

Performance monitoring and validation:

- Application load time measurement
- Zoom operation efficiency
- Layer switching performance

## 🛠️ Architecture Overview

### Design Principles

The framework follows enterprise software engineering principles:

- **Single Responsibility**: Each class has a focused purpose
- **Dependency Injection**: Services are injected rather than instantiated
- **Interface Segregation**: Comprehensive interfaces define contracts
- **Error Handling**: Consistent error handling with retry mechanisms
- **Logging**: Structured logging for debugging and monitoring

### Key Components

#### **Page Objects**

- `BasePage`: Common functionality (clicks, waits, navigation)
- `GISMapPage`: GIS-specific operations (zoom, pan, layer management)

#### **Utilities**

- `GISCalculations`: Distance, bearing, coordinate calculations
- `GISValidations`: Coordinate validation, map state assertions
- `GISWaitStrategies`: Condition-based waits for map operations

#### **Services**

- `GISTestService`: High-level test orchestration and complex workflows

#### **Error Handling**

- Custom error classes with context and retry capabilities
- `ErrorHandler` utility for consistent error management

## 📊 Configuration Options

### Environment Variables

| Variable                | Description                 | Default                 | Example                   |
| ----------------------- | --------------------------- | ----------------------- | ------------------------- |
| `BASE_URL`              | Application base URL        | `http://localhost:3000` | `https://gis.example.com` |
| `RETRIES`               | Number of test retries      | `0` (local), `2` (CI)   | `3`                       |
| `WORKERS`               | Parallel test workers       | `1`                     | `4`                       |
| `TRACE_ON_FAILURE`      | Enable tracing on failure   | `false`                 | `true`                    |
| `SCREENSHOT_ON_FAILURE` | Take screenshots on failure | `true`                  | `false`                   |
| `VIDEO_ON_FAILURE`      | Record video on failure     | `false`                 | `true`                    |
| `ACTION_TIMEOUT`        | Default action timeout (ms) | `15000`                 | `30000`                   |
| `NAVIGATION_TIMEOUT`    | Navigation timeout (ms)     | `30000`                 | `60000`                   |

### Test Configuration

Key configuration options in `config/constants.ts`:

```typescript
export const GIS_CONFIG = {
  TIMEOUTS: {
    MAP_LOAD: 30000,
    ZOOM_OPERATION: 5000,
    TILE_LOAD: 15000,
    // ... more timeouts
  },
  SELECTORS: {
    MAP_CONTAINER: '#map',
    ZOOM_IN: '.leaflet-control-zoom-in',
    // ... more selectors
  },
  PERFORMANCE_THRESHOLDS: {
    MAP_LOAD_MAX_MS: 15000,
    ZOOM_OPERATIONS_MAX_MS: 30000,
    // ... more thresholds
  },
};
```

## 🔧 Usage Examples

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test';
import { GISMapPage } from '../pages/gis-map-page';
import { GISValidations } from '../utils/gis-validations';

test('should validate map coordinates', async ({ page }) => {
  const gisPage = new GISMapPage(page);
  await gisPage.navigateToGIS();

  const center = await gisPage.getCurrentCenter();
  expect(GISValidations.validateCoordinates(center.lat, center.lng)).toBe(true);
});
```

### Using Service Layer

```typescript
import { GISTestService } from '../services/gis-test-service';

test('comprehensive map test', async ({ page }) => {
  const service = new GISTestService(page);
  const result = await service.performCompleteMapTest(page);

  expect(result.success).toBe(true);
  expect(result.duration).toBeLessThan(30000);
});
```

### Performance Testing

```typescript
test('performance validation', async ({ page }) => {
  const service = new GISTestService(page);
  const result = await service.performPerformanceTest(page);

  expect(result.thresholdsPassed).toBe(true);
  expect(result.loadTime).toBeLessThan(15000);
});
```

## 🐛 Debugging

### Enable Debug Logging

```bash
# Enable debug level logging
DEBUG=true npm test

# Or set in .env file
echo "DEBUG=true" >> .env
```

### Enable Tracing

```bash
# Enable trace on failure
TRACE_ON_FAILURE=true npm test

# View traces
npx playwright show-trace trace.zip
```

### Common Issues

#### **Map Not Loading**

- Check `BASE_URL` in `.env` file
- Verify application is running
- Check browser console for errors

#### **Tests Timing Out**

- Increase timeouts in `config/constants.ts`
- Check network connectivity
- Verify selectors are correct

#### **Flaky Tests**

- Review wait strategies in `gis-wait-strategies.ts`
- Enable retry mechanisms
- Check for race conditions

## 📈 Performance Monitoring

The framework includes built-in performance monitoring:

### Automatic Metrics

- Map load time
- Zoom operation duration
- Layer switching performance
- Pan operation timing

### Thresholds

Default performance thresholds are configurable:

- Map load: < 15 seconds
- Zoom operations: < 30 seconds
- Layer switching: < 25 seconds

### Custom Performance Tests

```typescript
test('custom performance test', async ({ page }) => {
  const startTime = Date.now();

  // Your operations here

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(10000);
});
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Follow** the existing code style and patterns
4. **Add** tests for new functionality
5. **Update** documentation as needed
6. **Submit** a pull request

### Code Style Guidelines

- Use TypeScript for type safety
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Implement proper error handling
- Write comprehensive tests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the [User Guide](USER_GUIDE.md) for detailed usage
- **Examples**: See the `tests/` directory for comprehensive examples

---

**Built with ❤️ for the GIS testing community**
