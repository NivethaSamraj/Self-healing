import { test, Page } from '@playwright/test';
import path from 'path';

type Status =
  | 'PASS'
  | 'AMBIGUOUS'
  | 'FAIL'
  | 'REJECTED_INDEX';

type CaseResult = {
  caseName: string;
  strategy: string;
  locator: string;
  count: number;
  status: Status;
};

const results: CaseResult[] = [];

function containsIndexedXpath(
  locator: string
): boolean {

  // XPath indexes
  if (/\[\d+\]/.test(locator)) {
    return true;
  }

  // CSS nth-child
  if (/:nth-child\(\d+\)/.test(locator)) {
    return true;
  }

  // CSS nth-of-type
  if (/:nth-of-type\(\d+\)/.test(locator)) {
    return true;
  }

  return false;
}

async function runCase(
  page: Page,
  caseName: string,
  strategy: string,
  locatorExpr: string
) {

  // ==========================================
  // REJECT INDEXED XPATHS
  // ==========================================

  if (
    containsIndexedXpath(
      locatorExpr
    )
  ) {

    results.push({
      caseName,
      strategy,
      locator: locatorExpr,
      count: 0,
      status: 'REJECTED_INDEX'
    });

    console.log(
      `REJECTED_INDEX | ${caseName} | ${strategy}`
    );

    return;
  }

  const locator =
    page.locator(locatorExpr);

  const count =
    await locator.count();

  let status: Status;

  if (count === 1) {
    status = 'PASS';
  } else if (count > 1) {
    status = 'AMBIGUOUS';
  } else {
    status = 'FAIL';
  }

  results.push({
    caseName,
    strategy,
    locator: locatorExpr,
    count,
    status
  });

  console.log(
    `${status} | ${caseName} | ${strategy} | Count=${count}`
  );
}
test(
  'Healing Playground Matrix - index3.html',
  async ({ page }) => {

    test.setTimeout(120000);

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index3.html'
      );

    await page.goto(filePath);

    console.log(
      '\n========================================='
    );

    console.log(
      'HEALING PLAYGROUND STARTED'
    );

    console.log(
      '=========================================\n'
    );

    // ====================================================
    // CASE 1
    // Ancestor Recovery
    // No ID / No Class on target
    // ====================================================

await runCase(
  page,
  'Product Matrix Input',
  'Deep Ancestor Chain',
  'xpath=//span[text()="Product Matrix"]/ancestor::section//input'
);

    // ====================================================
    // CASE 2
    // Adjacent Sibling
    // ====================================================

    await runCase(
      page,
      'Employee Section Input',
      'Adjacent Sibling',
      'xpath=//label[text()="Employee Section"]/following-sibling::input'
    );

    // ====================================================
    // CASE 3
    // General Sibling
    // ====================================================

    await runCase(
      page,
      'Payroll Entry Input',
      'General Sibling',
      'xpath=//label[text()="Payroll Entry"]/following-sibling::input'
    );

    // ====================================================
    // CASE 4
    // Preceding Sibling
    // ====================================================

    await runCase(
      page,
      'Inventory Buffer Input',
      'Preceding Sibling',
      'xpath=//span[text()="Inventory Buffer"]/preceding-sibling::input'
    );

    // ====================================================
    // CASE 5
    // Table Relationship
    // ====================================================

    await runCase(
      page,
      'Salary Input',
      'Table Cell Relationship',
      'xpath=//td[text()="Salary"]/following-sibling::td//input'
    );

    // ====================================================
    // CASE 6
    // Deep Ancestor
    // ====================================================

   

    // ====================================================
    // CASE 7
    // Following Axis
    // ====================================================

 

    // ====================================================
    // CASE 8
    // Duplicate Text Challenge
    // Expected Ambiguous
    // ====================================================

    await runCase(
      page,
      'Duplicate Status Inputs',
      'Duplicate Text Structure',
      'xpath=//span[text()="Status"]/following-sibling::input'
    );

    // ====================================================
    // CASE 9
    // Dynamic DOM
    // ====================================================

    console.log(
      '\nWaiting for dynamic element...\n'
    );

    await page.waitForTimeout(3500);

    await runCase(
      page,
      'Delayed Locator Input',
      'Dynamic DOM Recovery',
      'xpath=//span[text()="Delayed Locator"]/following-sibling::input'
    );

    // ====================================================
    // REPORT
    // ====================================================

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
      
      const rejected =
  results.filter(
    r => r.status === 'REJECTED_INDEX'
  ).length;

  console.log(
  `REJECTED    : ${rejected}`
);

    console.log(
      '\n========================================='
    );

    console.log(
      'HEALING PLAYGROUND REPORT'
    );

    console.log(
      '=========================================\n'
    );

    console.table(results);

    console.log(
      '\n========================================='
    );

    console.log(
      `TOTAL CASES : ${results.length}`
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
      `SUCCESS RATE: ${(
        (pass / results.length) * 100
      ).toFixed(2)}%`
    );

    console.log(
      '=========================================\n'
    );

    // ====================================================
    // FRAMEWORK INSIGHT
    // ====================================================

    console.log(
      'Framework Recovery Analysis'
    );

    console.log(
      'PASS       = Structural locator uniquely identifies element'
    );

    console.log(
      'AMBIGUOUS  = Locator found multiple candidates'
    );

    console.log(
      'FAIL       = Structural recovery failed'
    );

    console.log(
      '\nThese are the cases where AI fallback should NOT be required.'
    );

  }
);