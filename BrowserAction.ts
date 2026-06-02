import { Page, Locator } from '@playwright/test';

/**
 * Interface defining reusable browser actions using Playwright.
 * Locator-based design for better maintainability and auto-waiting.
 */
export interface BrowserAction {

  waitForElement(locator: Locator): Promise<void>;

  scrollIntoView(locator: Locator): Promise<void>;

  click(
    locator: Locator,
    waitForPageRefresh?: boolean
  ): Promise<void>;

  type(
    locator: Locator,
    text: string,
    waitForPageRefresh?: boolean
  ): Promise<void>;

  selectDropdownByVisibleText(
    locator: Locator,
    optionValue: string,
    waitForPageRefresh?: boolean
  ): Promise<void>;

  selectDropdownByIndex(
    locator: Locator,
    index: number,
    waitForPageRefresh?: boolean
  ): Promise<void>;

  selectDropdownByRandomIndex(
    locator: Locator,
    primaryLocator: string
  ): Promise<void>;

  selectDropdownByValue(
    locator: Locator,
    value: string,
    waitForPageRefresh?: boolean
  ): Promise<void>;

  getText(locator: Locator): Promise<string>;

  confirmAlert(page: Page): Promise<void>;

  waitForDisappearance(locator: Locator): Promise<void>;

  moveToElement(locator: Locator): Promise<void>;

  isEnabled(locator: Locator): Promise<boolean>;

  isDisabled(locator: Locator): Promise<boolean>;

  verifyElementTextIsDisplayed(
    locator: Locator,
    expectedText: string
  ): Promise<void>;

  verifyPartialText(
    locator: Locator,
    expectedText: string
  ): Promise<boolean>;

  getInputText(locator: Locator): Promise<string>;

  verifyInputText(
    locator: Locator,
    expectedText: string
  ): Promise<boolean>;

  getAttribute(
    locator: Locator,
    attribute: string
  ): Promise<string | null>;

  verifyAttribute(
    locator: Locator,
    attribute: string,
    expectedText: string
  ): Promise<boolean>;

  verifyNotDisplayed(locator: Locator): Promise<boolean>;

  isElementDisplaying(locator: Locator): Promise<boolean>;

  getListOfElements(locator: Locator): Promise<Locator[]>;

  confirmAlertWithText(
    page: Page,
    expectedAlertMessage: string
  ): Promise<void>;

  evaluate(
    page: Page,
    expression: any
  ): Promise<void>;

  scrollToTopOfThePage(page: Page): Promise<void>;

  uploadFile(
    locator: Locator,
    value: string
  ): Promise<void>;

  check(locator: Locator): Promise<boolean>;

  pause(
    page: Page,
    type: string
  ): Promise<void>;

  getListOfElementsSize(
    locator: Locator,
    timeout: number
  ): Promise<number>;

  clear(
    locator: Locator,
    elementDescription: string,
    waitForPageRefresh?: boolean
  ): Promise<void>;

  getLambdaTestLink(page: Page): Promise<string>;
}