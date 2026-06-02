import { test, Page, Locator } from '@playwright/test';
import path from 'path';

import {
  buildSmartLocatorBundle,
  captureElementScreenshot,
  captureFullPageScreenshot,
  getElementOuterHTML,
  getElementContextDOM
} from '../utils/selfHealing';

import { saveElement } from '../core/db/elementRepo';

import { pool } from '../core/db/db';


type StrategyResult = {
  strategy: string;
  locator: string;
  status: 'PASS' | 'FAIL';
};

async function highlight(locator: Locator) {
  await locator.evaluate((el: any) => {
    el.style.border = '3px solid red';
    el.style.backgroundColor = '#fff3cd';
  });
}

async function tryLocator(
  page: Page,
  name: string,
  locator: Locator
): Promise<boolean> {

  console.log(`\nChecking: ${name}`);

  try {

    await page.waitForTimeout(800);

    await locator.waitFor({
      state: 'visible',
      timeout: 3000
    });

    const count = await locator.count();

    console.log(`Element Found`);
    console.log(`Match Count: ${count}`);

    const first = locator.first();

    await highlight(first);
    const smartBundle =
      await buildSmartLocatorBundle(
        first,
        name
      );

    const elementScreenshot =
      await captureElementScreenshot(first);

    const fullPageScreenshot =
      await captureFullPageScreenshot(page);

    const outerHTML =
      await getElementOuterHTML(first);

    const contextDOM =
      await getElementContextDOM(first);

    await saveElement({

      elementName: name,

      pageUrl: page.url(),

      primaryLocator:
        locator.toString(),

      smartLocators:
        smartBundle.smartLocators,

      meta:
        smartBundle.meta,

      outerHTML,

      context_dom: contextDOM,

      elementScreenshot,

      fullPageScreenshot
    });

    console.log(`Element saved to DB`);

    await page.waitForTimeout(1000);

    return true;

  } catch (error: any) {

    console.log(`Element NOT Found`);

    console.log(error?.message);

    return false;
  }
}

function printReport(title: string, results: StrategyResult[]) {

  console.log(`\n\n================ ${title} ================`);

  for (const r of results) {

    console.log(
      `${r.status === 'PASS' ? '✅' : '❌'} ${r.strategy}\n   → ${r.locator}\n`
    );
  }
}

async function testCssStrategies(
  page: Page
): Promise<StrategyResult[]> {

  const results: StrategyResult[] = [];

  const tests = [
    {
      name: 'ID Selector',
      locator: page.locator('#unique-css-field-v2'),
      expr: '#unique-css-field-v2'
    },
    {
      name: 'Attribute Selector',
      locator: page.locator(
        'input[id="unique-css-field-v2"]'
      ),
      expr: 'input[id="unique-css-field-v2"]'
    },
    {
      name: 'Type + ID',
      locator: page.locator(
        'input[type="text"]#unique-css-field-v2'
      ),
      expr: 'input[type="text"]#unique-css-field-v2'
    },
    {
      name: 'Partial Attribute',
      locator: page.locator(
        'input[id*="css-field"]'
      ),
      expr: 'input[id*="css-field"]'
    },
    {
      name: 'Broken Selector',
      locator: page.locator(
        '.missing-class input'
      ),
      expr: '.missing-class input'
    }
  ];

  for (const t of tests) {

    const ok =
      await tryLocator(
        page,
        t.name,
        t.locator
      );

    results.push({
      strategy: `CSS → ${t.name}`,
      locator: t.expr,
      status: ok ? 'PASS' : 'FAIL'
    });
  }

  return results;
}

async function testXpathStrategies(
  page: Page
): Promise<StrategyResult[]> {

  const results: StrategyResult[] = [];

  const tests = [
    {
      name: 'Exact Attribute',
      locator: page.locator(
        'xpath=//*[@data-test="xpath-only"]'
      ),
      expr: '//*[@data-test="xpath-only"]'
    },
    {
      name: 'Input Attribute',
      locator: page.locator(
        'xpath=//input[@data-test="xpath-only"]'
      ),
      expr: '//input[@data-test="xpath-only"]'
    },
    {
      name: 'Contains Attribute',
      locator: page.locator(
        'xpath=//*[contains(@data-test,"xpath")]'
      ),
      expr: '//*[contains(@data-test,"xpath")]'
    },
    {
      name: 'Deep Path',
      locator: page.locator(
        'xpath=//div[@class="wrapper"]//input'
      ),
      expr: '//div[@class="wrapper"]//input'
    },
    {
      name: 'Text Match',
      locator: page.locator(
        'xpath=//*[contains(@placeholder,"Search Employee")]'
      ),
      expr: '//*[contains(@placeholder,"Search Employee")]'
    }
  ];

  for (const t of tests) {

    const ok =
      await tryLocator(
        page,
        t.name,
        t.locator
      );

    results.push({
      strategy: `XPATH → ${t.name}`,
      locator: t.expr,
      status: ok ? 'PASS' : 'FAIL'
    });
  }

  return results;
}

async function testHybridStrategies(
  page: Page
): Promise<StrategyResult[]> {

  const results: StrategyResult[] = [];

  const tests = [
    {
      name: 'CSS Chain',
      locator: page.locator(
        'input#unique-css-field-v2[type="text"]'
      ),
      expr: 'input#unique-css-field-v2[type="text"]'
    },
    {
      name: 'XPath ID',
      locator: page.locator(
        'xpath=//input[@id="unique-css-field-v2"]'
      ),
      expr: '//input[@id="unique-css-field-v2"]'
    },
    {
      name: 'Overqualified',
      locator: page.locator(
        'div.wrapper input'
      ),
      expr: 'div.wrapper input'
    },
    {
      name: 'Broken Chain',
      locator: page.locator(
        'div.x >> .missing >> input'
      ),
      expr: 'div.x >> .missing >> input'
    }
  ];

  for (const t of tests) {

    const ok =
      await tryLocator(
        page,
        t.name,
        t.locator
      );

    results.push({
      strategy: `HYBRID → ${t.name}`,
      locator: t.expr,
      status: ok ? 'PASS' : 'FAIL'
    });
  }

  return results;
}

test(
  'CSS + XPath Locator Stress Matrix (LOCAL FILE MODE)',
  async ({ page }) => {

    test.setTimeout(120000);

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index.html'
      );

    await page.goto(filePath);

    console.log(
      'Local HTML File Loaded'
    );

    await page.waitForTimeout(2000);

    const cssResults =
      await testCssStrategies(page);

    const xpathResults =
      await testXpathStrategies(page);

    const hybridResults =
      await testHybridStrategies(page);

    printReport(
      'CSS STRATEGIES',
      cssResults
    );

    printReport(
      'XPATH STRATEGIES',
      xpathResults
    );

    printReport(
      'HYBRID STRATEGIES',
      hybridResults
    );

    const all = [
      ...cssResults,
      ...xpathResults,
      ...hybridResults
    ];

    const pass =
      all.filter(
        r => r.status === 'PASS'
      ).length;

    const fail =
      all.filter(
        r => r.status === 'FAIL'
      ).length;

    console.log(
      '\n=========== FINAL SUMMARY ==========='
    );

    console.log(`TOTAL : ${all.length}`);
    console.log(`PASS  : ${pass}`);
    console.log(`FAIL  : ${fail}`);

    console.log(
      `SUCCESS RATE: ${(
        (pass / all.length) * 100
      ).toFixed(2)}%`
    );

    await page.waitForTimeout(4000);
  }
);

test.afterAll(async () => {

  console.log(
    'Closing PostgreSQL pool...'
  );

  await pool.end();
});