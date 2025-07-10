# Contributing to Playwright GIS Framework

Thank you for your interest in contributing to the Playwright GIS Framework! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new features or improvements
- **📝 Documentation**: Improve existing docs or add new ones
- **🔧 Code Contributions**: Bug fixes, new features, or optimizations
- **🧪 Test Cases**: Add more test scenarios or improve existing ones
- **📊 Performance Improvements**: Optimize test execution or framework performance

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/playwright-gis-framework.git
cd playwright-gis-framework

# Add upstream remote
git remote add upstream https://github.com/original-repo/playwright-gis-framework.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install
npx playwright install

# Copy environment config
cp .env.example .env

# Run tests to verify setup
npm test -- --grep "should display layer control interface"
```

### 3. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 📝 Development Guidelines

### Code Style

#### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper interfaces and types
- Use `readonly` for immutable properties
- Prefer `const` assertions for constant objects

```typescript
// Good
export const GIS_CONFIG = {
  TIMEOUTS: {
    MAP_LOAD: 30000,
    ZOOM_OPERATION: 5000,
  },
} as const;

interface IMapState {
  readonly zoom: number;
  readonly center: Coordinates;
}

// Avoid
var config = {
  timeout: 30000,
};
```

#### Naming Conventions

- **Classes**: PascalCase (`GISMapPage`, `ErrorHandler`)
- **Methods**: camelCase (`navigateToGIS`, `getCurrentCenter`)
- **Constants**: SCREAMING_SNAKE_CASE (`GIS_CONFIG`, `MAX_RETRIES`)
- **Interfaces**: PascalCase with 'I' prefix (`IGISPage`, `ITestLogger`)
- **Files**: kebab-case (`gis-map-page.ts`, `error-handler.ts`)

#### Error Handling

- Always use proper error types
- Include meaningful context in errors
- Use `ErrorHandler.withErrorHandling()` for consistent error management

```typescript
// Good
async createLayer(): Promise<void> {
  return ErrorHandler.withErrorHandling(
    async () => {
      await this.clickElement(this.layerButton);
      await GISWaitStrategies.waitForLayerCreation(this.page);
      logger.logLayerOperation('Layer created', 'point');
    },
    'Create point layer operation'
  );
}

// Avoid
async createLayer(): Promise<void> {
  try {
    await this.layerButton.click();
    await this.page.waitForTimeout(1000);
  } catch (e) {
    console.log('Error:', e);
  }
}
```

#### Wait Strategies

- Never use `page.waitForTimeout()` except as a last resort
- Use appropriate wait strategies from `GISWaitStrategies`
- Create new wait strategies for new scenarios

```typescript
// Good
await GISWaitStrategies.waitForZoomChange(page, expectedZoom);
await GISWaitStrategies.waitForMapOperation(page);

// Avoid
await page.waitForTimeout(2000);
await page.waitForTimeout(5000);
```

### Testing Guidelines

#### Test Organization

```typescript
test.describe('Feature Group', () => {
  let gisPage: GISMapPage;

  test.beforeEach(async ({ page }) => {
    gisPage = new GISMapPage(page);
    await gisPage.navigateToGIS();
  });

  test.describe('Specific Feature', () => {
    test('should perform specific action', async () => {
      // Test implementation
    });
  });
});
```

#### Test Naming

- Use descriptive names that explain the behavior being tested
- Start with `should` for behavior assertions
- Include context when necessary

```typescript
// Good
test('should create point layer after project creation', async () => {});
test('should validate coordinates within geographic bounds', async () => {});

// Avoid
test('test layer creation', async () => {});
test('coordinates', async () => {});
```

#### Assertions

- Use specific assertions with meaningful messages
- Include context in assertion failures
- Test both positive and negative cases

```typescript
// Good
expect(coordinates.lat).toBeGreaterThan(-90);
expect(coordinates.lat).toBeLessThan(90);
expect(GISValidations.validateCoordinates(lat, lng)).toBe(true);

// Avoid
expect(result).toBeTruthy();
expect(coordinates).toBeDefined();
```

### Documentation Guidelines

#### Code Documentation

- Add JSDoc comments for all public methods
- Include parameter descriptions and return types
- Provide usage examples for complex methods

````typescript
/**
 * Calculates the distance between two geographic points using the Haversine formula
 *
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lng1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lng2 - Longitude of the second point in decimal degrees
 * @returns Distance between points in kilometers
 *
 * @example
 * ```typescript
 * const distance = GISCalculations.calculateDistance(
 *   37.7749, -122.4194,  // San Francisco
 *   40.7128, -74.0060    // New York
 * );
 * console.log(`Distance: ${distance.toFixed(2)} km`);
 * ```
 */
static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Implementation
}
````

#### README Updates

- Update README.md for new features
- Add examples for new functionality
- Update API reference section

## 🔧 Architecture Guidelines

### Adding New Utilities

When adding new utility functions:

1. **Determine the correct module** (`calculations`, `validations`, `wait-strategies`)
2. **Create proper interface** in `interfaces/index.ts`
3. **Implement with error handling** and logging
4. **Add comprehensive tests**
5. **Update consolidated helpers** for backward compatibility

```typescript
// 1. Add to interface
export interface IGISCalculations {
  calculatePolygonArea(coordinates: Coordinates[]): number;
}

// 2. Implement in class
export class GISCalculations implements IGISCalculations {
  static calculatePolygonArea(coordinates: Coordinates[]): number {
    // Implementation with error handling
  }
}

// 3. Add to consolidated helpers
export class GISHelpers {
  static calculatePolygonArea =
    GISCalculations.calculatePolygonArea.bind(GISCalculations);
}
```

### Adding New Page Objects

For new page objects:

1. **Extend BasePage** for common functionality
2. **Implement appropriate interface**
3. **Use constants** for selectors
4. **Add proper error handling**
5. **Include logging** for operations

```typescript
export class NewPage extends BasePage implements INewPage {
  constructor(page: Page) {
    super(page);
    // Initialize locators using constants
  }

  async performAction(): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      // Implementation
      logger.logOperation('Action performed');
    }, 'Perform action operation');
  }
}
```

## 🧪 Testing Your Changes

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/your-new-test.spec.ts

# Run with debug output
DEBUG=true npm test

# Run in headed mode for debugging
npm run test:headed
```

### Test Checklist

Before submitting your changes:

- [ ] All existing tests pass
- [ ] New functionality has comprehensive tests
- [ ] Tests follow naming conventions
- [ ] Error scenarios are tested
- [ ] Performance implications are considered
- [ ] Documentation is updated

### Code Quality Checks

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Run linting (if configured)
npm run lint
```

## 📬 Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**

   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run full test suite**

   ```bash
   npm test
   npm run format:check
   ```

3. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add polygon area calculation utility

   - Add calculatePolygonArea method to GISCalculations
   - Include comprehensive tests for various polygon shapes
   - Update documentation with usage examples
   - Add method to consolidated helpers for backward compatibility"
   ```

4. **Push to your fork**

   ```bash
   git push origin your-feature-branch
   ```

5. **Create Pull Request**
   - Use the GitHub web interface
   - Fill out the PR template completely
   - Link any related issues

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(calculations): add polygon area calculation

fix(wait-strategies): resolve timeout issue in map loading

docs(readme): add troubleshooting section

test(validations): add edge cases for coordinate validation
```

### Pull Request Template

When creating a PR, include:

**Description:**

- What changes were made
- Why the changes were necessary
- Any breaking changes

**Testing:**

- How the changes were tested
- Any new test cases added
- Performance impact assessment

**Documentation:**

- Documentation updates included
- Examples provided for new features

**Checklist:**

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Breaking changes documented

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Environment Information**
   - Operating system
   - Node.js version
   - Playwright version
   - Browser versions

2. **Steps to Reproduce**
   - Exact steps to trigger the bug
   - Expected behavior
   - Actual behavior

3. **Code Examples**
   - Minimal reproducible example
   - Configuration used
   - Test output/logs

4. **Screenshots/Videos**
   - Visual evidence when applicable

### Issue Template

````markdown
## Bug Description

Brief description of the issue

## Environment

- OS: macOS 12.6
- Node.js: 18.17.0
- Playwright: 1.40.0
- Browser: Chrome 119

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Code Example

```typescript
// Minimal code to reproduce the issue
```
````

## Additional Context

Any other relevant information

```

### Feature Requests

For feature requests, include:

1. **Use Case**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other ways to solve the problem
4. **Impact**: Who would benefit from this feature?

## 📋 Review Process

### What We Look For

Reviewers will assess:

- **Code Quality**: Clean, readable, maintainable code
- **Test Coverage**: Comprehensive tests for new functionality
- **Documentation**: Clear documentation and examples
- **Performance**: No significant performance regressions
- **Compatibility**: Maintains backward compatibility where possible

### Review Timeline

- Initial review: Within 3-5 business days
- Follow-up reviews: Within 1-2 business days
- Merge: After approval and CI passes

### Addressing Feedback

- Respond to review comments promptly
- Make requested changes in new commits (don't force-push)
- Mark conversations as resolved when addressed
- Ask for clarification if feedback is unclear

## 🏆 Recognition

Contributors will be:

- Listed in the project's contributor list
- Credited in release notes for significant contributions
- Invited to become maintainers for sustained, high-quality contributions

## 📞 Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Create issues for bugs or feature requests
- **Documentation**: Check the User Guide first
- **Examples**: Review existing test files for patterns

Thank you for contributing to the Playwright GIS Framework! 🎉
```
