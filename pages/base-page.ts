import { Page, Locator } from '@playwright/test';
import { IBasePage } from '../interfaces';
import { ElementNotEnabledError, ErrorHandler } from '../utils/errors';
import { logger } from '../utils/logger';

export class BasePage implements IBasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async clickElement(locator: Locator): Promise<void> {
    return ErrorHandler.withErrorHandling(async () => {
      await locator.waitFor({ state: 'visible' });
      await locator.waitFor({ state: 'attached' });

      // Check if element is enabled before clicking
      const isEnabled = await locator.isEnabled();
      if (!isEnabled) {
        const elementText = (await locator.textContent()) || 'unknown element';
        throw new ElementNotEnabledError(elementText);
      }

      await locator.click();
      logger.debug('Element clicked successfully', {
        selector: locator.toString(),
      });
    }, 'Click element operation');
  }

  async fillInput(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(text);
  }

  async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
  async clickElementIfEnabled(locator: Locator): Promise<boolean> {
    return ErrorHandler.withErrorHandling(async () => {
      await locator.waitFor({ state: 'visible' });
      const isEnabled = await locator.isEnabled();

      if (isEnabled) {
        await locator.click();
        logger.debug('Element clicked (conditional)', {
          selector: locator.toString(),
        });
        return true;
      } else {
        const elementText = (await locator.textContent()) || 'unknown element';
        logger.warn('Element disabled - skipping click', {
          element: elementText,
        });
        return false;
      }
    }, 'Conditional click element operation');
  }
}
