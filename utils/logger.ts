/**
 * Logging service for GIS Playwright tests
 */

import { ITestLogger } from '../interfaces';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class TestLogger implements ITestLogger {
  private static instance: TestLogger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableConsoleOutput: boolean = true;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setConsoleOutput(enabled: boolean): void {
    this.enableConsoleOutput = enabled;
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: any): void {
    const errorContext = error
      ? { ...context, error: { message: error.message, stack: error.stack } }
      : context;
    this.log(LogLevel.ERROR, message, errorContext);
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
    };

    this.logs.push(logEntry);

    if (this.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context } = entry;
    const timeStr = timestamp.split('T')[1].split('.')[0];
    const levelStr = LogLevel[level];
    const prefix = `[${timeStr}] [${levelStr}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} 🔍 ${message}`, context || '');
        break;
      case LogLevel.INFO:
        console.log(`${prefix} ℹ️  ${message}`, context || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ⚠️  ${message}`, context || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ❌ ${message}`, context || '');
        break;
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Utility methods for common logging patterns
  logTestStart(testName: string): void {
    this.info(`🚀 Starting test: ${testName}`);
  }

  logTestEnd(testName: string, duration: number): void {
    this.info(`✅ Test completed: ${testName} (${duration}ms)`);
  }

  logTestFailure(testName: string, error: Error): void {
    this.error(`❌ Test failed: ${testName}`, error);
  }

  logMapOperation(operation: string, details?: any): void {
    this.info(`🗺️  Map operation: ${operation}`, details);
  }

  logLayerOperation(
    operation: string,
    layerType?: string,
    details?: any
  ): void {
    this.info(
      `🎯 Layer operation: ${operation}${layerType ? ` (${layerType})` : ''}`,
      details
    );
  }

  logProjectOperation(operation: string, details?: any): void {
    this.info(`📁 Project operation: ${operation}`, details);
  }

  logPerformance(
    operation: string,
    duration: number,
    threshold?: number
  ): void {
    const status = threshold && duration > threshold ? '⚠️' : '✅';
    this.info(`⏱️  ${status} Performance: ${operation} (${duration}ms)`, {
      threshold,
    });
  }

  logValidation(validation: string, result: boolean, details?: any): void {
    const status = result ? '✅' : '❌';
    this.info(`🔍 ${status} Validation: ${validation}`, details);
  }

  logWaitOperation(operation: string, timeout: number, result: boolean): void {
    const status = result ? '✅' : '⏱️';
    this.debug(`${status} Wait: ${operation} (timeout: ${timeout}ms)`);
  }
}

// Singleton instance
export const logger = TestLogger.getInstance();

// Convenience functions
export const logTestStart = (testName: string) => logger.logTestStart(testName);
export const logTestEnd = (testName: string, duration: number) =>
  logger.logTestEnd(testName, duration);
export const logTestFailure = (testName: string, error: Error) =>
  logger.logTestFailure(testName, error);
export const logMapOperation = (operation: string, details?: any) =>
  logger.logMapOperation(operation, details);
export const logLayerOperation = (
  operation: string,
  layerType?: string,
  details?: any
) => logger.logLayerOperation(operation, layerType, details);
export const logProjectOperation = (operation: string, details?: any) =>
  logger.logProjectOperation(operation, details);
export const logPerformance = (
  operation: string,
  duration: number,
  threshold?: number
) => logger.logPerformance(operation, duration, threshold);
export const logValidation = (
  validation: string,
  result: boolean,
  details?: any
) => logger.logValidation(validation, result, details);

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
}

// Helper decorator for logging method calls
export function LogMethodCall(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      logger.debug(`🔄 Starting: ${operation}`, { method: propertyKey, args });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        logger.debug(`✅ Completed: ${operation} (${duration}ms)`, {
          method: propertyKey,
        });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(
          `❌ Failed: ${operation} (${duration}ms)`,
          error as Error,
          { method: propertyKey }
        );
        throw error;
      }
    };

    return descriptor;
  };
}
