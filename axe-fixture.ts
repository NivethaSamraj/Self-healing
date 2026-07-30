import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

/**
 * Third-party widgets we don't own and can't fix.
 * Comment out any line if the vendor is in audit scope.
 */
const EXCLUDED_REGIONS = [
  '#onetrust-consent-sdk',
  '#onetrust-banner-sdk',
  '[id^="attentive_"]',
  'iframe[title*="chat" i]',
];

/**
 * ExtJS 3 grid focus anchors (<a href="#" class="x-grid3-focus">) accounted for
 * ~150 of the 184 "serious" findings in the Jul 30 staging run. They are framework
 * plumbing, not real links.
 *
 * Confirm whether they exist in production before deciding. Run with
 * A11Y_IGNORE_EXTJS=1 to produce the "real defects" view; run without it for the
 * raw view. Do both and compare before circulating either.
 */
const EXTJS_NOISE = ['a.x-grid3-focus', '.x-grid3-focus'];

type AxeFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    const builder = () => {
      let b = new AxeBuilder({ page }).withTags(WCAG_TAGS);
      for (const sel of EXCLUDED_REGIONS) b = b.exclude(sel);
      if (process.env.A11Y_IGNORE_EXTJS === '1') {
        for (const sel of EXTJS_NOISE) b = b.exclude(sel);
      }
      return b;
    };
    await use(builder);
  },
});

export { expect } from '@playwright/test';
