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
  'Playwright Semantic Matrix',
  async ({ page }) => {

    const filePath =
      'file://' +
      path.resolve(
        __dirname,
        '../index.html'
      );

    await page.goto(filePath);


    await validate(
      'Customer Name Label',
      page.getByLabel(
        'Customer Name'
      )
    );

    await validate(
      'Email Label',
      page.getByLabel(
        'Email Address'
      )
    );

    await validate(
      'Phone Label',
      page.getByLabel(
        'Phone Number'
      )
    );


    await validate(
      'Search Products Placeholder',
      page.getByPlaceholder(
        'Search products'
      )
    );

    await validate(
      'Coupon Placeholder',
      page.getByPlaceholder(
        'Enter coupon code'
      )
    );

    await validate(
      'Password Placeholder',
      page.getByPlaceholder(
        'Create password'
      )
    );

    await validate(
      'Place Order Button',
      page.getByRole(
        'button',
        {
          name: 'Place Order'
        }
      )
    );

    await validate(
      'Cancel Order Button',
      page.getByRole(
        'button',
        {
          name: 'Cancel Order'
        }
      )
    );

    await validate(
      'Search Orders Button',
      page.getByRole(
        'button',
        {
          name: 'Search Orders'
        }
      )
    );

    await validate(
      'Category Dropdown',
      page.getByRole(
        'combobox'
      )
    );

    await validate(
      'Orders Table',
      page.getByRole(
        'table'
      )
    );

    await validate(
      'XPath Target Text',
      page.getByText(
        'XPath Target Retail Element'
      )
    );

    await page.waitForTimeout(3500);

    await validate(
      'Delayed Button',
      page.getByRole(
        'button',
        {
          name: 'Load More Products'
        }
      )
    );

    const pass =
      results.filter(r => r.status === 'PASS').length;

    const ambiguous =
      results.filter(r => r.status === 'AMBIGUOUS').length;

    const fail =
      results.filter(r => r.status === 'FAIL').length;

    console.log(
      '\n====== SEMANTIC REPORT ======'
    );

    console.log(`TOTAL      : ${results.length}`);
    console.log(`PASS       : ${pass}`);
    console.log(`AMBIGUOUS  : ${ambiguous}`);
    console.log(`FAIL       : ${fail}`);

    console.log(
      `UNIQUE RATE: ${(
        (pass / results.length) * 100
      ).toFixed(2)}%`
    );
  }
);