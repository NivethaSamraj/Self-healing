import { test, expect, Page, Locator } from '@playwright/test';
import { saveElement } from '../core/db/elementRepo';

import {

  containsPositionalXPath
} from '../utils/selfHealing';

import {
  buildSmartLocatorBundle,
  captureElementScreenshot,
  captureFullPageScreenshot,
  getElementOuterHTML,
  getElementContextDOM
} from '../utils/selfHealing';

type Result = {
  element: string;
  locatorType: string;
  locator: string;
  count: number;
  status:
  | 'PASS'
  | 'AMBIGUOUS'
  | 'FAIL'
  | 'REJECTED_INDEX';
};

const results: Result[] = [];

async function validateLocator(
  page: Page,
  element: string,
  type: string,
  locatorString?: string
) {

  if (!locatorString) {
    return;
  }

  if (
    type === 'xpath' &&
    containsPositionalXPath(locatorString)
  ) {

    results.push({
      element,
      locatorType: type,
      locator: locatorString,
      count: 0,
      status: 'REJECTED_INDEX'
    });

    return;
  }

  try {

    let count = 0;

    if (type === 'css') {

      count =
        await page
          .locator(locatorString)
          .count();
    }

    else if (type === 'xpath') {

      count =
        await page
          .locator(`xpath=${locatorString}`)
          .count();
    }

    else {

      // generated Playwright locator strings
      const locator =
        eval(
          `page.${locatorString}`
        ) as Locator;

      count =
        await locator.count();
    }

    results.push({
      element,
      locatorType: type,
      locator: locatorString,
      count,
      status:
        count === 1
          ? 'PASS'
          : count > 1
            ? 'AMBIGUOUS'
            : 'FAIL'
    });

  } catch {

    results.push({
      element,
      locatorType: type,
      locator: locatorString,
      count: 0,
      status: 'FAIL'
    });
  }
}

test(
  'Talbots Smart Locator Validation',
  async ({ page }) => {

    test.setTimeout(180000);

    await page.goto(
      'https://www.talbots.com/homepage',
      {
        waitUntil: 'domcontentloaded'
      }
    );

    await page.waitForTimeout(5000);

    const candidates = [

      page.locator('input').first(),

      page.locator('button').first(),

      page.locator('a').nth(5),

      page.locator('img').first(),

      page.locator('input').nth(1),

      page.locator('button').nth(1)
    ];

    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {

      const locator =
        candidates[i];

      if (
        await locator.count() === 0
      ) {
        continue;
      }

      const bundle =
        await buildSmartLocatorBundle(
          locator,
          `Element-${i + 1}`
        );

      await saveElement({
        elementName: bundle.elementName,
        pageUrl: page.url(),

        primaryLocator:
          locator.toString(),

        smartLocators:
          bundle.smartLocators,

        meta:
          bundle.meta,

        outerHTML:
          await getElementOuterHTML(
            locator
          ),

        context_dom:
          await getElementContextDOM(
            locator
          ),

        elementScreenshot:
          await captureElementScreenshot(
            locator
          ),

        fullPageScreenshot:
          await captureFullPageScreenshot(
            page
          )
      });

      const smart =
        bundle.smartLocators;

      await validateLocator(
        page,
        bundle.elementName,
        'role',
        smart.role
      );

      await validateLocator(
        page,
        bundle.elementName,
        'testId',
        smart.testId
      );

      await validateLocator(
        page,
        bundle.elementName,
        'label',
        smart.label
      );

      await validateLocator(
        page,
        bundle.elementName,
        'placeholder',
        smart.placeholder
      );

      await validateLocator(
        page,
        bundle.elementName,
        'text',
        smart.text
      );

      await validateLocator(
        page,
        bundle.elementName,
        'alt',
        smart.alt
      );

      await validateLocator(
        page,
        bundle.elementName,
        'title',
        smart.title
      );

      await validateLocator(
        page,
        bundle.elementName,
        'css',
        smart.css
      );

      await validateLocator(
        page,
        bundle.elementName,
        'xpath',
        smart.xpath
      );
    }

    console.table(results);

    const pass =
      results.filter(
        r => r.status === 'PASS'
      ).length;

    const fail =
      results.filter(
        r => r.status === 'FAIL'
      ).length;

    const ambiguous =
      results.filter(
        r => r.status === 'AMBIGUOUS'
      ).length;

    const rejected =
      results.filter(
        r =>
          r.status ===
          'REJECTED_INDEX'
      ).length;

    console.log('\n');

    console.log(
      '================================'
    );

    console.log(
      `TOTAL       : ${results.length}`
    );

    console.log(
      `PASS        : ${pass}`
    );

    console.log(
      `AMBIGUOUS   : ${ambiguous}`
    );

    console.log(
      `FAIL        : ${fail}`
    );

    console.log(
      `REJECTED    : ${rejected}`
    );

    console.log(
      '================================'
    );

    expect(fail).toBe(0);
  }
);