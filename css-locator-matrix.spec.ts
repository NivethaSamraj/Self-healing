import { test, Locator } from '@playwright/test';
import path from 'path';

type ResultStatus =
  | 'PASS'
  | 'AMBIGUOUS'
  | 'FAIL';

type LocatorResult = {
  name: string;
  status: ResultStatus;
  count: number;
};

const results: LocatorResult[] = [];

async function validate(
  name: string,
  locator: Locator
) {
  const count = await locator.count();

  let status: ResultStatus;

  if (count === 1) {
    status = 'PASS';
  } else if (count > 1) {
    status = 'AMBIGUOUS';
  } else {
    status = 'FAIL';
  }

  results.push({
    name,
    status,
    count
  });

  console.log(
    `${status} | ${name} | Count=${count}`
  );
}

test(
  'CSS Locator Matrix',
  async ({ page }) => {

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index.html'
      );

    await page.goto(filePath);

    //
    // UNIQUE CSS LOCATORS
    //

    await validate(
      'ID Selector',
      page.locator(
        '#unique-css-field-v2'
      )
    );

    await validate(
      'Customer Name ID',
      page.locator(
        '#customerName'
      )
    );

    await validate(
      'CSS Target Class',
      page.locator(
        'input.css-target'
      )
    );

    await validate(
      'Exact Attribute',
      page.locator(
        'input[data-test="xpath-only"]'
      )
    );

    await validate(
      'Attribute Contains',
      page.locator(
        'input[id*="css-field"]'
      )
    );

    await validate(
      'Attribute Prefix',
      page.locator(
        'input[id^="unique"]'
      )
    );

    await validate(
      'Attribute Suffix',
      page.locator(
        'input[id$="v2"]'
      )
    );

    await validate(
      'Multiple Attributes',
      page.locator(
        'input[type="text"][data-test="xpath-only"]'
      )
    );

    //
    // UNIQUE DESCENDANT CHAIN
    //

    await validate(
      'Wrapper Input Chain',
      page.locator(
        'div.wrapper article input.css-target'
      )
    );

    //
    // ADJACENT SIBLING
    //

    await validate(
      'Customer Label Adjacent Input',
      page.locator(
        'label[for="customerName"] + input'
      )
    );

    await validate(
      'Coupon Label Adjacent Input',
      page.locator(
        'label[for="couponCode"] + input'
      )
    );

    //
    // TABLE
    //

    await validate(
      'Orders Table',
      page.locator(
        '#ordersTable'
      )
    );

    //
    // PRODUCT CARD
    //

    await validate(
      'Product Card',
      page.locator(
        '.product-card'
      )
    );

    await validate(
      'Place Order Button',
      page.locator(
        '#placeOrderBtn'
      )
    );

    await validate(
      'Cancel Order Button',
      page.locator(
        '#cancelOrderBtn'
      )
    );

    await validate(
      'Hidden Field',
      page.locator(
        '#hiddenRetailField'
      )
    );
    await validate(
      'All Badges',
      page.locator('.badge')
    );

    await validate(
      'All Inputs',
      page.locator('input')
    );

    await validate(
      'All Buttons',
      page.locator('button')
    );
    console.log(
      '\n========================'
    );

    console.log(
      'CSS LOCATOR REPORT'
    );

    console.log(
      '========================\n'
    );

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

    for (const r of results) {

      console.log(
        `${r.status.padEnd(10)} | ${r.name.padEnd(35)} | Count=${r.count}`
      );

    }

    console.log(
      '\n========================'
    );

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
        (pass / results.length) *
        100
      ).toFixed(2)}%`
    );

    console.log(
      '========================\n'
    );
  }
);