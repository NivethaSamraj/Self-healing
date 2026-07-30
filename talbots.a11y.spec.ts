import { test, expect } from './axe-fixture';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type PageDef = {
  name: string;
  path: string;
  /** Must be attached before we scan — guards against scanning a skeleton or an error page. */
  readyWhen: string;
  /** Scroll to trigger lazy-loaded tiles / carousels before scanning. */
  lazyLoad?: boolean;
};

const pagesToScan: PageDef[] = [
  {
    name: 'Homepage',
    path: '/',
    readyWhen: 'main, #main, .homepage',
    lazyLoad: true,
  },
  {
    name: 'Category - The Work Life Edit',
    path: '/clothing/collections/the-work-life-edit?intcmp=20260727_homepage_merch_img_theworklifeedit_bf_07',
    readyWhen: '.product-tile, .search-result-content, #search-result-items',
    lazyLoad: true,
  },
  {
    name: 'Product Detail - Non-Iron Popover',
    path: '/non-iron-popover---breezy-stripe/P263075436.html'
      + '?cgid=apparel-work-shop'
      + '&dwvar_P263075436_color=VISTA%20BLUE%2FWHITE'
      + '&dwvar_P263075436_sizeType=MS',
    readyWhen: '.pdp-main, .product-detail, .product-name',
    lazyLoad: true,
  },
];

const RESULTS_DIR = path.join(process.cwd(), 'a11y-results');

/** Set A11Y_SOFT=1 to scan every page in one run instead of stopping at the first failure. */
const SOFT_MODE = process.env.A11Y_SOFT === '1';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function dismissOverlays(page: Page) {
  const closers = [
    '#onetrust-accept-btn-handler',
    'button:has-text("Accept All")',
    '[id^="attentive_"] button[aria-label*="close" i]',
    '.modal.show button[aria-label*="close" i]',
  ];
  for (const sel of closers) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
      await el.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Fail loudly if staging redirected us to /404 or served an error.
 * Without this, a dead path is scanned as the 404 page and quietly reported
 * as if it were the real PLP/PDP.
 */
function assertLanded(def: PageDef, status: number | null, finalUrl: string) {
  expect(status, `${def.name}: expected HTTP 200, got ${status} for ${def.path}`).toBe(200);
  expect(
    finalUrl,
    `${def.name}: redirected to an error page (${finalUrl}). The path in pagesToScan is dead on this environment.`
  ).not.toMatch(/\/404|\/error|page-not-found/i);
}

async function settle(page: Page, def: PageDef) {
  await page.waitForSelector(def.readyWhen, { state: 'attached', timeout: 25000 });

  if (def.lazyLoad) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 900) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await page.waitForTimeout(400);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }

  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
}

test.describe('Accessibility — WCAG 2.2 AA', () => {
  pagesToScan.forEach((def, index) => {
    const { name, path: pagePath } = def;

    test(`${name}`, async ({ page, makeAxeBuilder }, testInfo) => {
      const response = await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      assertLanded(def, response?.status() ?? null, page.url());

      await dismissOverlays(page);
      await settle(page, def);

      const results = await makeAxeBuilder().analyze();

      const summary = results.violations
        .map(v => ({ rule: v.id, impact: v.impact, elements: v.nodes.length }))
        .sort((a, b) => b.elements - a.elements);
      const totalElements = summary.reduce((s, r) => s + r.elements, 0);
      console.log(`\n=== ${name}: ${results.violations.length} rules failed, ${totalElements} elements affected ===`);
      console.log(`    ${page.url()}`);
      console.table(summary);

      fs.mkdirSync(RESULTS_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(RESULTS_DIR, `${slug(name)}.json`),
        JSON.stringify(
          {
            page: name,
            order: index,
            url: page.url(),
            timestamp: new Date().toISOString(),
            violations: results.violations,
          },
          null,
          2
        )
      );

      await testInfo.attach(`axe-${slug(name)}.json`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });

      const message = `${results.violations.length} accessibility rule(s) failed — see the table above`;
      if (SOFT_MODE) {
        expect.soft(results.violations, message).toEqual([]);
      } else {
        expect(results.violations, message).toEqual([]);
      }
    });
  });
});
