import { test, Page } from '@playwright/test';

const priority = [
  'role',
  'label',
  'placeholder',
  'text',
  'alt',
  'title',
  'css',
  'xpath'
];

async function heal(page: Page, config: any) {
  console.log('\n====================================');

  for (const strategy of priority) {

    const item = config[strategy];

    if (!item) continue;

    try {

      let locator;

      console.log(`TRYING => ${strategy}`);
        
      switch (strategy) {

        case 'role':

  console.log(
    `LOCATOR => getByRole('${item.role}', { name: '${item.name}' })`
  );
          locator = page.getByRole(
            item.role,
            { name: item.name }
          );
          break;

        case 'label':
              console.log(
    `LOCATOR => getByLabel('${item.value}')`
  );

          locator = page.getByLabel(item.value);
          break;

        case 'placeholder':
             console.log(
    `LOCATOR => getByPlaceholder('${item.value}')`
  );
          locator = page.getByPlaceholder(item.value);
          break;

        case 'text':
             console.log(
    `LOCATOR => getByText('${item.value}')`
  );

          locator = page.getByText(item.value);
          break;

        case 'alt':
             console.log(
    `LOCATOR => getByAltText('${item.value}')`
  );
          locator = page.getByAltText(item.value);
          break;

        case 'title':
             console.log(
    `LOCATOR => getByTitle('${item.value}')`
  );

          locator = page.getByTitle(item.value);
          break;

        case 'css':
            console.log(
    `LOCATOR => locator('${item.value}')`
  );
          locator = page.locator(item.value);
          break;

        case 'xpath':
              console.log(
    `LOCATOR => xpath=${item.value}`
  );

          locator = page.locator(item.value);
          break;
      }

      await locator.waitFor({
        timeout: 1000
      });

      console.log(`SUCCESS => ${strategy}`);
      await locator.waitFor({
  timeout: 1000
});

console.log(`SUCCESS => ${strategy}`);

console.log(`
Locator Type  : ${strategy}
Locator Value : ${
  strategy === 'role'
    ? `getByRole('${item.role}', { name: '${item.name}' })`
    : strategy === 'label'
    ? `getByLabel('${item.value}')`
    : strategy === 'placeholder'
    ? `getByPlaceholder('${item.value}')`
    : strategy === 'text'
    ? `getByText('${item.value}')`
    : strategy === 'alt'
    ? `getByAltText('${item.value}')`
    : strategy === 'title'
    ? `getByTitle('${item.value}')`
    : strategy === 'css'
    ? `locator('${item.value}')`
    : `xpath=${item.value}`
}
Correct       : YES ✅
`);

return locator;

    } catch {

      console.log(`FAILED => ${strategy}`);
    }
  }

  throw new Error('All strategies failed');
}

test('Validate healing priority order', async ({ page }) => {

  await page.goto('http://localhost:3000');
  await heal(page, {
    role: {
      role: 'button',
      name: 'Submit Form'
    }
  });

  await heal(page, {
    role: {
      role: 'textbox',
      name: 'Wrong'
    },

    label: {
      value: 'Employee Name'
    }
  });

  await heal(page, {

    role: {
      role: 'textbox',
      name: 'Wrong'
    },

    label: {
      value: 'Wrong Label'
    },

    placeholder: {
      value: 'Type Username'
    }
  });

  await heal(page, {

    role: {
      role: 'button',
      name: 'Wrong'
    },

    label: {
      value: 'Wrong'
    },

    placeholder: {
      value: 'Wrong'
    },

    text: {
      value: 'Search Employee'
    }
  });


  await heal(page, {

    text: {
      value: 'Wrong'
    },

    alt: {
      value: 'Employee Profile Image'
    }
  });

  await heal(page, {

    alt: {
      value: 'Wrong'
    },

    title: {
      value: 'Employee Code Input'
    }
  });

  /**
   * CSS
   */
  await heal(page, {

    title: {
      value: 'Wrong'
    },

    css: {
      value: '#unique-css-field-v2'
    }
  });
  await heal(page, {

    css: {
      value: '#wrong-css'
    },

    xpath: {
      value: '//*[@data-test="xpath-only"]'
    }
  });

});