import { Page, Locator } from '@playwright/test';
import BrowserActions from '../utils/BrowserActionsImp';

export class DemoPage extends BrowserActions {
  readonly page: Page;
  // Locators
  readonly userCurrentAddress: Locator;

  constructor(page: Page) {
    super();
    this.page = page;

    this.userCurrentAddress = page.getByPlaceholder('Current Address');

     this.registerPageLocators(this);
  }
  /**
 * Enters the user's current address into the Current Address field.
 *
 * @param address - The address string to be entered in the input field.
 */
  async enterUserCurrentAddress(address: string) {
    await this.type(this.userCurrentAddress, address);
  }
}