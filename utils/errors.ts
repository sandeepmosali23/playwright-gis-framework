/**
 * Custom error classes for GIS Playwright tests
 */

import { ITestError } from '../interfaces';

export class TestError extends Error implements ITestError {
  constructor(
    message: string,
    public readonly context?: any,
    public readonly code?: string,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'TestError';
    Object.setPrototypeOf(this, TestError.prototype);
  }
}

export class MapLoadError extends TestError {
  constructor(message: string, context?: any) {
    super(message, context, 'MAP_LOAD_ERROR', false);
    this.name = 'MapLoadError';
  }
}

export class ElementNotFoundError extends TestError {
  constructor(selector: string, context?: any) {
    super(`Element not found: ${selector}`, context, 'ELEMENT_NOT_FOUND', true);
    this.name = 'ElementNotFoundError';
  }
}

export class ElementNotEnabledError extends TestError {
  constructor(elementText: string, context?: any) {
    super(
      `Element is not enabled: ${elementText}`,
      context,
      'ELEMENT_NOT_ENABLED',
      false
    );
    this.name = 'ElementNotEnabledError';
  }
}

export class InvalidCoordinatesError extends TestError {
  constructor(lat: number, lng: number, context?: any) {
    super(
      `Invalid coordinates: lat=${lat}, lng=${lng}`,
      context,
      'INVALID_COORDINATES',
      false
    );
    this.name = 'InvalidCoordinatesError';
  }
}

export class LayerOperationError extends TestError {
  constructor(operation: string, layerType?: string, context?: any) {
    super(
      `Layer operation failed: ${operation}${layerType ? ` for ${layerType}` : ''}`,
      context,
      'LAYER_OPERATION_ERROR',
      true
    );
    this.name = 'LayerOperationError';
  }
}

export class ProjectOperationError extends TestError {
  constructor(operation: string, context?: any) {
    super(
      `Project operation failed: ${operation}`,
      context,
      'PROJECT_OPERATION_ERROR',
      true
    );
    this.name = 'ProjectOperationError';
  }
}

export class MapInteractionError extends TestError {
  constructor(interaction: string, context?: any) {
    super(
      `Map interaction failed: ${interaction}`,
      context,
      'MAP_INTERACTION_ERROR',
      true
    );
    this.name = 'MapInteractionError';
  }
}

export class ValidationError extends TestError {
  constructor(validation: string, expected: any, actual: any, context?: any) {
    super(
      `Validation failed: ${validation}. Expected: ${expected}, Actual: ${actual}`,
      { ...context, expected, actual },
      'VALIDATION_ERROR',
      false
    );
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends TestError {
  constructor(operation: string, timeout: number, context?: any) {
    super(
      `Operation timed out: ${operation} (timeout: ${timeout}ms)`,
      context,
      'TIMEOUT_ERROR',
      true
    );
    this.name = 'TimeoutError';
  }
}

export class ConfigurationError extends TestError {
  constructor(config: string, context?: any) {
    super(
      `Configuration error: ${config}`,
      context,
      'CONFIGURATION_ERROR',
      false
    );
    this.name = 'ConfigurationError';
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Wraps a function with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorContext: string,
    context?: any
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof TestError) {
        throw error;
      }

      throw new TestError(
        `${errorContext}: ${error instanceof Error ? error.message : String(error)}`,
        { ...context, originalError: error },
        'WRAPPED_ERROR',
        false
      );
    }
  }

  /**
   * Retries an operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    backoffFactor: number = 2
  ): Promise<T> {
    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's not a retryable error
        if (error instanceof TestError && !error.isRetryable) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor;
      }
    }

    throw new TestError(
      `Operation failed after ${maxRetries + 1} attempts`,
      { lastError, maxRetries },
      'MAX_RETRIES_EXCEEDED',
      false
    );
  }

  /**
   * Checks if an error is retryable
   */
  static isRetryable(error: Error): boolean {
    return error instanceof TestError && error.isRetryable === true;
  }

  /**
   * Extracts meaningful error information
   */
  static extractErrorInfo(error: Error): {
    message: string;
    code?: string;
    context?: any;
    isRetryable?: boolean;
  } {
    if (error instanceof TestError) {
      return {
        message: error.message,
        code: error.code,
        context: error.context,
        isRetryable: error.isRetryable,
      };
    }

    return {
      message: error.message,
      code: error.name,
      context: { stack: error.stack },
      isRetryable: false,
    };
  }
}

/**
 * Assertion utilities with better error messages
 */
export class AssertionHelper {
  static assertWithContext<T>(
    condition: boolean,
    message: string,
    expected?: T,
    actual?: T,
    context?: any
  ): void {
    if (!condition) {
      throw new ValidationError(message, expected, actual, context);
    }
  }

  static assertCoordinates(lat: number, lng: number, context?: any): void {
    if (lat < -90 || lat > 90) {
      throw new InvalidCoordinatesError(lat, lng, {
        ...context,
        reason: 'Latitude must be between -90 and 90',
      });
    }

    if (lng < -180 || lng > 180) {
      throw new InvalidCoordinatesError(lat, lng, {
        ...context,
        reason: 'Longitude must be between -180 and 180',
      });
    }
  }

  static assertElementEnabled(
    elementText: string,
    isEnabled: boolean,
    context?: any
  ): void {
    if (!isEnabled) {
      throw new ElementNotEnabledError(elementText, context);
    }
  }
}
