import { Page, Locator } from '@playwright/test';
import BrowserActions from '../utils/BrowserActionsImp';

export class LoginPage extends BrowserActions {
  readonly page: Page;

  // Locators
  readonly userName: Locator;
  readonly userEmail: Locator;
   
  constructor(page: Page) {
    super();
    this.page = page;

    this.userName = page.locator('#userName');
    this.userEmail = page.locator('#userEmail');

     this.registerPageLocators(this);

  }

  /**
 * Enters the user's name into the Username field.
 *
 * @param name - The name to be entered in the username input field.
 */

  async enterUserName(name: string) {
    await this.type(this.userName, name);
  }

  /**
 * Enters the user's email into the User Email field.
 *
 * @param email - The email address to be entered in the email input field.
 */
  async enterUserEmail(email: string) {
    await this.type(this.userEmail, email);
  }

  /**
 * Fills user details in the login page.
 * 
 * This method acts as a wrapper to enter multiple user-related fields
 * such as username and email in a single reusable function.
 * 
 * @param data - Object containing user details (e.g., username, email)
 */
  async fillUserDetails(data: any) {
    await this.enterUserName(data.userName);
    await this.enterUserEmail(data.userEmail);
  }


  

}