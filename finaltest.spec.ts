import { test, Page } from '@playwright/test';
import path from 'path';



type Status =
  | 'PASS'
  | 'FAIL'
  | 'AMBIGUOUS'
  | 'REJECTED_INDEX';

type CaseResult = {
  caseName: string;
  strategy: string;
  locator: string;
  count: number;
  status: Status;
  executionTime: number;
};

const results: CaseResult[] = [];

function containsIndexedXpath(
  locator: string
): boolean {

  if (/\[\d+\]/.test(locator))
    return true;

  if (
    /:nth-child\(\d+\)/.test(locator)
  )
    return true;

  if (
    /:nth-of-type\(\d+\)/.test(locator)
  )
    return true;

  return false;
}

async function runCase(
  page: Page,
  caseName: string,
  strategy: string,
  locatorExpr: string
) {

  if (
    containsIndexedXpath(
      locatorExpr
    )
  ) {

    const rejected = {
      caseName,
      strategy,
      locator: locatorExpr,
      count: 0,
      status: 'REJECTED_INDEX' as Status,
      executionTime: 0
    };

    results.push(rejected);

 

    return;
  }

  const start =
    Date.now();

  const locator =
    page.locator(locatorExpr);

  const count =
    await locator.count();

  const executionTime =
    Date.now() - start;

  let status: Status;

  if (count === 1) {
    status = 'PASS';
  }
  else if (count > 1) {
    status = 'AMBIGUOUS';
  }
  else {
    status = 'FAIL';
  }

  const result = {
    caseName,
    strategy,
    locator: locatorExpr,
    count,
    status,
    executionTime
  };

  results.push(result);

  console.log(
    `${status} | ${caseName} | ${strategy} | Count=${count}`
  );
}

test(
  'Healing Playground Matrix',
  async ({ page }) => {

    test.setTimeout(
      120000
    );

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index5.html'
      );

    await page.goto(
      filePath
    );

    console.log(
      '\n========================================'
    );

    console.log(
      'HEALING PLAYGROUND STARTED'
    );

    console.log(
      '========================================\n'
    );

    // ==========================================
    // CASE 1
    // Ancestor -> Descendant
    // ==========================================

    await runCase(
      page,
      'Product Matrix Input',
      'Ancestor Descendant',
      'xpath=//span[text()="Product Matrix"]/ancestor::section//input'
    );

    // ==========================================
    // CASE 2
    // Adjacent Sibling
    // ==========================================

    await runCase(
      page,
      'Employee Section Input',
      'Adjacent Sibling',
      'xpath=//label[text()="Employee Section"]/following-sibling::input'
    );

    // ==========================================
    // CASE 3
    // General Sibling
    // ==========================================

    await runCase(
      page,
      'Payroll Entry Input',
      'General Sibling',
      'xpath=//label[text()="Payroll Entry"]/following-sibling::input'
    );

    // ==========================================
    // CASE 4
    // Preceding Sibling
    // ==========================================

    await runCase(
      page,
      'Inventory Buffer Input',
      'Preceding Sibling',
      'xpath=//span[text()="Inventory Buffer"]/preceding-sibling::input'
    );

    // ==========================================
    // CASE 5
    // Table Relationship
    // ==========================================

    await runCase(
      page,
      'Salary Input',
      'Table Cell',
      'xpath=//td[text()="Salary"]/following-sibling::td//input'
    );

    // ==========================================
    // CASE 6
    // Descendant
    // ==========================================

    await runCase(
      page,
      'Shipment Tracker Input',
      'Descendant',
      'xpath=//section[.//span[text()="Shipment Tracker"]]//input'
    );

    // ==========================================
    // CASE 7
    // Following
    // ==========================================

    await runCase(
      page,
      'Customer Ledger Input',
      'Following Structure',
      'xpath=//div[span[text()="Customer Ledger"]]//input'
    );

    // ==========================================
    // CASE 8
    // Ambiguous
    // ==========================================

    await runCase(
      page,
      'Duplicate Status Inputs',
      'Duplicate Structure',
      'xpath=//span[text()="Status"]/following-sibling::input'
    );

    // ==========================================
    // CASE 9
    // Dynamic DOM
    // ==========================================

    console.log(
      '\nWaiting for delayed element...\n'
    );

    await page.waitForTimeout(
      3500
    );

    await runCase(
      page,
      'Delayed Locator Input',
      'Dynamic Recovery',
      'xpath=//span[text()="Delayed Locator"]/following-sibling::input'
    );

    // ==========================================
    // REPORT
    // ==========================================

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
        r =>
          r.status ===
          'AMBIGUOUS'
      ).length;

    const rejected =
      results.filter(
        r =>
          r.status ===
          'REJECTED_INDEX'
      ).length;

    console.log(
      '\n========================================'
    );

    console.log(
      'HEALING PLAYGROUND REPORT'
    );

    console.log(
      '========================================\n'
    );

    console.table(
      results
    );

    console.log(
      `TOTAL       : ${results.length}`
    );

    console.log(
      `PASS        : ${pass}`
    );

    console.log(
      `FAIL        : ${fail}`
    );

    console.log(
      `AMBIGUOUS   : ${ambiguous}`
    );

    console.log(
      `REJECTED    : ${rejected}`
    );

    console.log(
      `SUCCESS RATE: ${(
        (pass /
          results.length) *
        100
      ).toFixed(2)}%`
    );

    console.log(
      '\n========================================\n'
    );

  }
);