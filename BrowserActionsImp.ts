import { Page, Locator, expect } from '@playwright/test';
import { BrowserAction } from './BrowserAction';
import { buildSmartLocatorBundle, captureFullPageScreenshot, getElementContextDOM, getElementOuterHTML, getMinimalFullDOM } from '../utils/selfHealing';
import { captureElementScreenshot } from '../utils/selfHealing';
import { getElement, saveElement } from '../core/db/elementRepo';
import { findWithFallback } from '../core/healing/fallbackEngine';

export default class BrowserActionImpl implements BrowserAction {


  private locatorMap = new WeakMap<Locator, string>();

  protected registerPageLocators(pageObject: any) {

    const pageName = pageObject.constructor.name;

    for (const key of Object.keys(pageObject)) {

      const value = pageObject[key];

      if (
        value &&
        typeof value === 'object' &&
        typeof value.fill === 'function'
      ) {

        this.locatorMap.set(
          value,
          `${pageName}_${key}`
        );
      }
    }
  }

  protected getElementName(locator: Locator): string {

    return (
      this.locatorMap.get(locator) ??
      'Unknown_Element'
    );
  }

  async click(
    locator: Locator,
    waitForPageRefresh: boolean = false
  ): Promise<void> {

    const page = locator.page();

    const elementName =
      this.getElementName(locator);

    let finalLocator = locator;
    let usedFallback = false;

    try {

      await locator.waitFor({
        state: 'visible',
        timeout: 5000
      });

      await locator.click();

    } catch {

      const result = await findWithFallback(
        page,
        elementName,
        locator
      );

      finalLocator = result.locator;
      usedFallback = true;

      await finalLocator.click();
    }

   if (!usedFallback) {

  const exists =
    await this.elementExistsInDB(
      elementName
    );

  if (!exists) {

    await this.captureAndStore(
      finalLocator,
      elementName,
      finalLocator.toString()
    );
  }
}

    if (waitForPageRefresh) {

      await this.waitForPageRefresh(
        page,
        elementName
      );

      await page.waitForLoadState(
        'networkidle'
      );
    }
  }

  async selectDropdownByVisibleText(
    locator: Locator,
    optionValue: string,
    waitForPageRefresh: boolean = false
  ): Promise<void> {

    const page = locator.page();

    const elementName =
      this.getElementName(locator);

    let finalLocator = locator;
    let usedFallback = false;

    try {

      await locator.waitFor({
        state: 'visible',
        timeout: 5000
      });

      await locator.selectOption({
        label: optionValue
      });

      await locator.press('Tab');

    } catch {

      const result = await findWithFallback(
        page,
        elementName,
        locator
      );

      finalLocator = result.locator;
      usedFallback = true;

      await finalLocator.selectOption({
        label: optionValue
      });

      await finalLocator.press('Tab');
    }

   if (!usedFallback) {

  const exists =
    await this.elementExistsInDB(
      elementName
    );

  if (!exists) {

    await this.captureAndStore(
      finalLocator,
      elementName,
      finalLocator.toString()
    );
  }
}

    if (waitForPageRefresh) {

      await this.waitForPageRefresh(
        page,
        elementName
      );

      await page.waitForLoadState(
        'networkidle'
      );
    }
  }

  async selectDropdownByIndex(
    locator: Locator,
    index: number,
    waitForPageRefresh: boolean = false
  ): Promise<void> {

    const page = locator.page();

    const elementName =
      this.getElementName(locator);

    let finalLocator = locator;
    let usedFallback = false;

    try {

      await locator.waitFor({
        state: 'visible',
        timeout: 5000
      });

      await locator.selectOption({
        index
      });

    } catch {

      const result = await findWithFallback(
        page,
        elementName,
        locator
      );

      finalLocator = result.locator;
      usedFallback = true;

      await finalLocator.waitFor({
        state: 'visible'
      });

      await finalLocator.selectOption({
        index
      });
    }

   if (!usedFallback) {

  const exists =
    await this.elementExistsInDB(
      elementName
    );

  if (!exists) {

    await this.captureAndStore(
      finalLocator,
      elementName,
      finalLocator.toString()
    );
  }
}

    if (waitForPageRefresh) {

      await this.waitForPageRefresh(
        page,
        elementName
      );

      await page.waitForLoadState(
        'networkidle'
      );
    }
  }

  async selectDropdownByRandomIndex(
    locator: Locator
  ): Promise<void> {

    await this.selectDropdownByIndex(
      locator,
      -1
    );
  }

  async selectDropdownByValue(
    locator: Locator,
    value: string,
    waitForPageRefresh: boolean = false
  ): Promise<void> {

    const page = locator.page();

    const elementName =
      this.getElementName(locator);

    let finalLocator = locator;
    let usedFallback = false;

    try {

      await locator.waitFor({
        state: 'visible',
        timeout: 5000
      });

      await locator.selectOption(
        value
      );

    } catch {

      const result = await findWithFallback(
        page,
        elementName,
        locator
      );

      finalLocator = result.locator;
      usedFallback = true;

      await finalLocator.selectOption(
        value
      );
    }

if (!usedFallback) {

  const exists =
    await this.elementExistsInDB(
      elementName
    );

  if (!exists) {

    await this.captureAndStore(
      finalLocator,
      elementName,
      finalLocator.toString()
    );
  }
}

    if (waitForPageRefresh) {

      await this.waitForPageRefresh(
        page,
        elementName
      );

      await page.waitForLoadState(
        'networkidle'
      );
    }
  }



  async waitForElement(locator: Locator): Promise<void> {
    await expect(locator.first()).toBeVisible();
  }

  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.first().scrollIntoViewIfNeeded();
  }
  async type(
    locator: Locator,
    text: string,
    waitForPageRefresh: boolean = false
  ): Promise<void> {

    const page = locator.page();

    const elementName =
      this.getElementName(locator);

    let finalLocator = locator;
    let usedFallback = false;

    try {

      await locator.fill('');
      await locator.fill(text);

    } catch (error) {

      const result = await findWithFallback(
        page,
        elementName,
        locator
      );

      finalLocator = result.locator;

      usedFallback =
        result.usedStrategy !== 'primary';

      await finalLocator.fill('');
      await finalLocator.fill(text);
    }

   if (!usedFallback) {

  const exists =
    await this.elementExistsInDB(
      elementName
    );

  if (!exists) {

    await this.captureAndStore(
      finalLocator,
      elementName,
      finalLocator.toString()
    );
  }
}

    if (waitForPageRefresh) {

      await finalLocator.press('Tab');

      await this.waitForPageRefresh(
        page,
        elementName
      );

      await page.waitForLoadState(
        'networkidle'
      );
    }
  }

  async getText(locator: Locator): Promise<string> {
    return await locator.first().innerText();
  }

  async confirmAlert(page: Page): Promise<void> {
    page.once('dialog', async (dialog) => await dialog.accept());
  }

  async waitForDisappearance(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async waitForPageRefresh(page: Page, elementDescription: string): Promise<void> {
    await this.waitForDisappearance(page.locator("div[class*='disable-click']"));
  }
  async moveToElement(locator: Locator): Promise<void> {
    await locator.hover();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return (await locator.isVisible()) && (await locator.isEnabled());
  }

  async isDisabled(locator: Locator): Promise<boolean> {
    return await locator.isDisabled();
  }

  async verifyElementTextIsDisplayed(
    locator: Locator,
    expectedText: string
  ): Promise<void> {

    const actual = await locator.first().innerText();

    if (actual !== expectedText) {
      throw new Error(`Expected: ${expectedText}, Actual: ${actual}`);
    }
  }

  async verifyPartialText(
    locator: Locator,
    expectedText: string
  ): Promise<boolean> {
    const actual = await locator.textContent();
    return actual?.includes(expectedText) ?? false;
  }

  async getInputText(locator: Locator): Promise<string> {
    return await locator.inputValue();
  }

  async verifyInputText(
    locator: Locator,
    expectedText: string
  ): Promise<boolean> {
    const actual = await locator.inputValue();
    return actual.includes(expectedText);
  }

  async getAttribute(
    locator: Locator,
    attribute: string
  ): Promise<string | null> {
    return await locator.getAttribute(attribute);
  }

  async verifyAttribute(
    locator: Locator,
    attribute: string,
    expectedText: string
  ): Promise<boolean> {

    const actual = await locator.getAttribute(attribute);

    if (actual?.includes(expectedText)) return true;

    throw new Error(`Expected attribute ${expectedText} not matching`);
  }

  async verifyNotDisplayed(locator: Locator): Promise<boolean> {
    return !(await locator.isVisible());
  }

  async isElementDisplaying(locator: Locator): Promise<boolean> {
    await locator.first().waitFor({ state: 'visible' });
    return true;
  }

  async getListOfElements(locator: Locator): Promise<Locator[]> {
    await locator.first().waitFor({ state: 'visible' });
    return locator.all();
  }

  async confirmAlertWithText(
    page: Page,
    expectedAlertMessage: string
  ): Promise<void> {

    page.once('dialog', async (dialog) => {
      if (dialog.message() === expectedAlertMessage) {
        await dialog.accept();
      } else {
        throw new Error("Alert message mismatch");
      }
    });
  }

  async evaluate(page: Page, expression: any): Promise<void> {
    await page.evaluate(expression);
  }

  async scrollToTopOfThePage(page: Page): Promise<void> {
    await this.evaluate(page, () => window.scrollTo(0, 0));
  }

  async uploadFile(locator: Locator, value: string): Promise<void> {
    await locator.setInputFiles(value);
  }

  async check(locator: Locator): Promise<boolean> {
    await locator.check();
    return true;
  }

  async pause(page: Page, type: string): Promise<void> {
    const map: Record<string, number> = {
      deepinferior: 500,
      low: 1000,
      medium: 2000,
      high: 3000
    };
    await page.waitForTimeout(map[type.toLowerCase()] || 500);
  }

  async getListOfElementsSize(
    locator: Locator,
    timeout: number
  ): Promise<number> {
    try {
      await locator.first().waitFor({ state: 'visible', timeout });
      return await locator.count();
    } catch {
      return 0;
    }
  }

  async clear(
    locator: Locator,
    elementDescription: string,
    waitForPageRefresh: boolean = false
  ): Promise<void> {

    await locator.fill("");

    if (waitForPageRefresh) {
      await locator.press("Tab");
      await this.waitForPageRefresh(locator.page(), elementDescription);
      await locator.page().waitForLoadState('networkidle');
    }
  }

  async getLambdaTestLink(page: Page): Promise<string> {

    if (process.env.RUN_ON_LAMBDA !== 'true') return '';

    try {
      const response = await page.evaluate(() =>
        (globalThis as any).lt?.getTestDetails?.() ?? null
      );

      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      return parsed?.data?.public_url || '';

    } catch {
      return '';
    }
  }

  private async captureAndStore(
    locator: Locator,
    elementName: string,
    primaryLocator: string
  ) {
    const page = locator.page();

    const bundle = await buildSmartLocatorBundle(locator, elementName);

    const [elementScreenshot, fullPageScreenshot] = await Promise.all([
      captureElementScreenshot(locator),
      captureFullPageScreenshot(page)
    ]);

    const outerHTML = await getElementOuterHTML(locator);
    const context_dom = await getElementContextDOM(locator);

    await saveElement({
      elementName: bundle.elementName,
      pageUrl: page.url(),
      primaryLocator,
      smartLocators: bundle.smartLocators,
      meta: bundle.meta,
      elementScreenshot,
      fullPageScreenshot,
      outerHTML,
      context_dom,
    });
  }

  private async elementExistsInDB(
  elementName: string
): Promise<boolean> {

  const existing =
    await getElement(
      elementName
    );

  return existing !== null;
}
}