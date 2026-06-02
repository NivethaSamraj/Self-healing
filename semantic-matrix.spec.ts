import { test, expect } from '@playwright/test';
import path from 'path';

async function validate(name: string, locator: any) {

  const count = await locator.count();

  console.log(
    `${count > 0 ? 'PASS' : 'FAIL'} | ${name} | Count=${count}`
  );

  expect(count).toBeGreaterThan(0);
}

test('Playwright Semantic Locator Matrix', async ({ page }) => {

  await page.goto(
    'file://' +
    path.resolve(__dirname, '../index.html')
  );

  await validate(
    'Label Customer Name',
    page.getByLabel('Customer Name')
  );

  await validate(
    'Label Email',
    page.getByLabel('Email Address')
  );

  await validate(
    'Placeholder Search',
    page.getByPlaceholder(
      'Search products'
    )
  );

  await validate(
    'Placeholder Coupon',
    page.getByPlaceholder(
      'Enter coupon code'
    )
  );

  await validate(
    'Role Textbox',
    page.getByRole('textbox')
  );

  await validate(
    'Role Button Place Order',
    page.getByRole(
      'button',
      { name: 'Place Order' }
    )
  );

  await validate(
    'Role Button Cancel',
    page.getByRole(
      'button',
      { name: 'Cancel Order' }
    )
  );

  await validate(
    'Role Combobox',
    page.getByRole('combobox')
  );

  await validate(
    'Role Table',
    page.getByRole('table')
  );

  await validate(
    'Role Row',
    page.getByRole('row')
  );

  await validate(
    'Text Locator',
    page.getByText(
      'XPath Target Retail Element'
    )
  );

  await page.waitForTimeout(3500);

  await validate(
    'Delayed Button',
    page.getByRole(
      'button',
      { name: 'Load More Products' }
    )
  );
});