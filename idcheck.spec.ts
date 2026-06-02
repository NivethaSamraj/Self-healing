import { test, Locator, Page } from '@playwright/test';
import path from 'path';

async function validateLocator(
  page: Page,
  name: string,
  locatorExpression: string,
  locator: Locator
) {

  const count = await locator.count();

  let status = 'FAIL';

  if (count === 1) {
    status = 'PASS';
  }
  else if (count > 1) {
    status = 'AMBIGUOUS';
  }

  console.log(
    `${status} | ${name} | Count=${count}`
  );

  if (count > 0) {

    const html =
      await locator
        .first()
        .evaluate(el => el.outerHTML);

    console.log(
      `Locator: ${locatorExpression}`
    );

    console.log(
      `Matched Element:`
    );

    console.log(html);
  }

  return {
    name,
    locatorExpression,
    count,
    status
  };
}

test(
  'ID Recovery Test - index4.html',
  async ({ page }) => {

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index4.html'
      );

    await page.goto(filePath);

    const results = [];

    // ==========================
    // CSS VALIDATIONS
    // ==========================

    results.push(
      await validateLocator(
        page,
        'CSS ID',
        '#a6455b11dbd0bb82df4f204540',
        page.locator(
          '#a6455b11dbd0bb82df4f204540'
        )
      )
    );

    results.push(
      await validateLocator(
        page,
        'CSS Attribute',
        'input[id="a6455b11dbd0bb82df4f204540"]',
        page.locator(
          'input[id="a6455b11dbd0bb82df4f204540"]'
        )
      )
    );

    results.push(
      await validateLocator(
        page,
        'CSS Partial ID',
        'input[id*="f204540"]',
        page.locator(
          'input[id*="f204540"]'
        )
      )
    );

    // ==========================
    // XPATH VALIDATIONS
    // ==========================

    results.push(
      await validateLocator(
        page,
        'XPath Exact ID',
        '//*[@id="a6455b11dbd0bb82df4f204540"]',
        page.locator(
          'xpath=//*[@id="a6455b11dbd0bb82df4f204540"]'
        )
      )
    );

    results.push(
      await validateLocator(
        page,
        'XPath Input ID',
        '//input[@id="a6455b11dbd0bb82df4f204540"]',
        page.locator(
          'xpath=//input[@id="a6455b11dbd0bb82df4f204540"]'
        )
      )
    );

    results.push(
      await validateLocator(
        page,
        'XPath Contains ID',
        '//*[contains(@id,"f204540")]',
        page.locator(
          'xpath=//*[contains(@id,"f204540")]'
        )
      )
    );

    // ==========================
    // SUMMARY
    // ==========================

    const pass =
      results.filter(
        r => r.status === 'PASS'
      ).length;

    const ambiguous =
      results.filter(
        r => r.status === 'AMBIGUOUS'
      ).length;

    const fail =
      results.filter(
        r => r.status === 'FAIL'
      ).length;

    console.log(
      '\n================================='
    );

    console.log(
      'LOCATOR VALIDATION REPORT'
    );

    console.log(
      '================================='
    );

    console.table(results);

    console.log(
      `TOTAL      : ${results.length}`
    );

    console.log(
      `PASS       : ${pass}`
    );

    console.log(
      `AMBIGUOUS  : ${ambiguous}`
    );

    console.log(
      `FAIL       : ${fail}`
    );

    console.log(
      `UNIQUE RATE: ${(
        (pass / results.length) * 100
      ).toFixed(2)}%`
    );
  }
);