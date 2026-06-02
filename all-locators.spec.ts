import { test } from '@playwright/test';
import path from 'path';
import {
  buildSmartLocatorBundle,
  getElementOuterHTML,
  getElementContextDOM,
  captureElementScreenshot,
  captureFullPageScreenshot
} from '../utils/selfHealing';

import { saveElement } from '../core/db/elementRepo';

test(
  'Generate ALL Smart Locators And Save To DB',
  async ({ page }) => {

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index-all-locators.html'
      );

    await page.goto(filePath);

    const locator =
      page.locator('#employeeSearch');

    const bundle =
      await buildSmartLocatorBundle(
        locator,
        'Employee Search'
      );

    const outerHTML =
      await getElementOuterHTML(
        locator
      );

    const contextDOM =
      await getElementContextDOM(
        locator
      );

    const elementScreenshot =
      await captureElementScreenshot(
        locator
      );

    const fullPageScreenshot =
      await captureFullPageScreenshot(
        page
      );

    await saveElement({
      elementName:
        bundle.elementName,

      pageUrl:
        page.url(),

      primaryLocator:
        '#employeeSearch',

      smartLocators:
        bundle.smartLocators,

      meta:
        bundle.meta,

      outerHTML,

      context_dom:
        contextDOM,

      elementScreenshot,

      fullPageScreenshot
    });

    console.log(
      '\n================================='
    );

    console.log(
      'SMART LOCATORS SAVED'
    );

    console.log(
      '================================='
    );

    console.log(
      JSON.stringify(
        bundle.smartLocators,
        null,
        2
      )
    );
  }
);