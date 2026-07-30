import * as fs from 'fs';
import * as path from 'path';

type Node = { html: string; target: string[]; failureSummary?: string };
type Violation = {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Node[];
};
type PageResult = { page: string; order?: number; url: string; timestamp: string; violations: Violation[] };

const RESULTS_DIR = path.join(process.cwd(), 'a11y-results');
const OUTPUT = path.join(RESULTS_DIR, 'accessibility-report.html');
const BRAND = process.env.A11Y_BRAND ?? 'Talbots';
const MAX_NODES = 5;

const IMPACT_COLOR: Record<string, string> = {
  critical: '#b91c1c',
  serious: '#c2410c',
  moderate: '#a16207',
  minor: '#4d7c0f',
};

/** Human-readable remediation copy. Falls back to axe's own help text. */
const FIX_HINTS: Record<string, string> = {
  'link-name':
    'Give each link discernible text — visible text inside the link, or a descriptive aria-label (e.g. aria-label="Shop new arrivals"). Empty overlay links that cover an image are the usual cause.',
  'meta-viewport':
    'Remove user-scalable=no and maximum-scale=1 from the viewport meta tag so low-vision users can pinch-to-zoom. Use content="width=device-width, initial-scale=1".',
  'image-alt':
    'Add an alt attribute to every img. Use descriptive text for meaningful imagery and alt="" for purely decorative product/banner art.',
  'button-name':
    'Give each button an accessible name — visible text, aria-label, or aria-labelledby. Icon-only buttons (search, close, quick-view) are the usual cause.',
  'color-contrast':
    'Raise the contrast ratio to at least 4.5:1 for body text and 3:1 for large text. Sale/price text over imagery is the common offender.',
  'aria-required-children':
    'Make sure each ARIA role contains the children its role requires (e.g. a role="list" must contain role="listitem").',
  'aria-allowed-attr':
    'Remove ARIA attributes that are not permitted on the element\'s role, or change the role so the attribute is valid.',
  'nested-interactive':
    'Do not nest focusable controls — an anchor or button inside another anchor or button confuses screen readers. Flatten the markup.',
  'heading-order':
    'Keep heading levels sequential (h1 → h2 → h3). Do not skip levels for visual sizing; use CSS instead.',
  'landmark-one-main':
    'Include exactly one <main> landmark on the page so screen-reader users can jump straight to the primary content.',
  'region':
    'Wrap all page content in landmarks (header, nav, main, footer) so nothing sits outside a named region.',
  'html-has-lang': 'Add a lang attribute to the <html> element, e.g. <html lang="en">.',
  'duplicate-id-aria': 'Make every id referenced by ARIA unique on the page.',
  'label': 'Associate each form control with a <label for="…"> or an aria-label.',
  'select-name': 'Give each <select> an accessible name via a <label> or aria-label (size, colour, quantity pickers).',
  'frame-title': 'Add a descriptive title attribute to each iframe.',
  'target-size':
    'Increase the interactive target to at least 24x24 CSS pixels, or add spacing around it (WCAG 2.2 — Target Size Minimum).',
};

const esc = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function loadResults(): PageResult[] {
  if (!fs.existsSync(RESULTS_DIR)) {
    throw new Error(`No results directory at ${RESULTS_DIR}. Run the a11y tests first.`);
  }
  const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
  if (!files.length) throw new Error('No result JSON files found. Run the a11y tests first.');

  return files
    .map(f => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')) as PageResult)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.page.localeCompare(b.page));
}

function renderNodes(nodes: Node[]) {
  const shown = nodes.slice(0, MAX_NODES);
  const rest = nodes.length - shown.length;
  const items = shown
    .map(
      n => `
              <div class="node">
                <pre>${esc(n.html)}</pre>
                <div class="selector">${esc(n.target.join(', '))}</div>
              </div>`
    )
    .join('');
  const more = rest > 0 ? `<div class="more">…and ${rest} more element(s)</div>` : '';
  return `<div class="nodes">${items}${more}</div>`;
}

function renderViolation(v: Violation) {
  const impact = v.impact ?? 'minor';
  const color = IMPACT_COLOR[impact] ?? '#6b7480';
  const fix = FIX_HINTS[v.id] ?? v.help;
  const count = `${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'}`;
  return `
          <div class="issue">
            <div class="issue-head">
              <span class="badge" style="background:${color}">${esc(impact)}</span>
              <span class="rule">${esc(v.id)}</span>
              <span class="count">${count}</span>
            </div>
            <div class="desc">${esc(v.description)}</div>
            <div class="fix"><strong>How to fix:</strong> ${esc(fix)}</div>
            <a class="help" href="${esc(v.helpUrl)}" target="_blank" rel="noopener">Deque reference &rarr;</a>
            ${renderNodes(v.nodes)}
          </div>`;
}

function renderPage(p: PageResult) {
  const failed = p.violations.length;
  const status = failed
    ? `<span class="status fail">${failed} issue${failed === 1 ? '' : 's'}</span>`
    : `<span class="status pass">No violations</span>`;
  const body = failed
    ? p.violations
        .slice()
        .sort((a, b) => b.nodes.length - a.nodes.length)
        .map(renderViolation)
        .join('')
    : `<div class="empty">No automated WCAG 2.2 AA violations detected on this page.</div>`;
  return `
      <section class="page">
        <div class="page-head">
          <h2>${esc(p.page)}</h2>
          ${status}
        </div>
        <div class="page-url">${esc(p.url)}</div>
        ${body}
      </section>`;
}

function build(results: PageResult[]) {
  const all = results.flatMap(r => r.violations);
  const rulesFailed = all.length;
  const elements = all.reduce((s, v) => s + v.nodes.length, 0);
  const byImpact = (impact: string) =>
    all.filter(v => (v.impact ?? 'minor') === impact).reduce((s, v) => s + v.nodes.length, 0);

  const generated = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const card = (value: number | string, label: string, color: string) => `
      <div class="card">
        <div class="card-value" style="color:${color}">${value}</div>
        <div class="card-label">${label}</div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility Report — ${esc(BRAND)} — WCAG 2.2 AA</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; background: #f4f6f9; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 32px 24px 64px; }
  header { border-bottom: 3px solid #1f3a5f; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 26px; color: #1f3a5f; letter-spacing: .3px; }
  .meta { color: #5a6672; font-size: 13px; }
  .cards { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin: 24px 0 8px; }
  .card { background: #fff; border: 1px solid #dfe5ec; border-radius: 8px; padding: 14px 8px; text-align: center; }
  .card-value { font-size: 26px; font-weight: 700; line-height: 1; }
  .card-label { font-size: 11px; color: #6b7480; margin-top: 6px; text-transform: uppercase; letter-spacing: .4px; }
  .note { font-size: 12px; color: #6b7480; margin: 10px 0 28px; }
  section.page { background: #fff; border: 1px solid #dfe5ec; border-radius: 10px; padding: 20px 22px; margin-bottom: 20px; }
  .page-head { display: flex; align-items: center; justify-content: space-between; }
  .page-head h2 { margin: 0; font-size: 18px; color: #1f3a5f; }
  .page-url { color: #7a8592; font-size: 12px; margin: 2px 0 16px; word-break: break-all; }
  .status { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .status.fail { background: #fdecea; color: #b91c1c; }
  .status.pass { background: #e7f5ea; color: #1b7a3d; }
  .empty { color: #1b7a3d; font-size: 14px; padding: 8px 0; }
  .issue { border: 1px solid #eceff3; border-left: 4px solid #c2410c; border-radius: 6px; padding: 14px 16px; margin-bottom: 14px; background: #fcfcfd; }
  .issue-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .badge { color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 9px; border-radius: 4px; letter-spacing: .3px; }
  .rule { font-weight: 700; font-size: 15px; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .count { margin-left: auto; color: #6b7480; font-size: 12px; }
  .desc { font-size: 14px; color: #333; margin-bottom: 8px; }
  .fix { font-size: 13px; background: #f0f7f2; border-radius: 5px; padding: 8px 10px; margin-bottom: 8px; color: #1f5130; }
  .help { font-size: 12px; color: #2e6da4; text-decoration: none; }
  .help:hover { text-decoration: underline; }
  .nodes { margin-top: 10px; }
  .node { margin-bottom: 8px; }
  pre { background: #1e2430; color: #e6edf3; font-size: 11.5px; padding: 8px 10px; border-radius: 5px; overflow-x: auto; margin: 0; white-space: pre-wrap; word-break: break-all; }
  .selector { font-family: ui-monospace, monospace; font-size: 11px; color: #7a8592; margin-top: 3px; }
  .more { font-size: 12px; color: #6b7480; font-style: italic; margin-top: 4px; }
  footer { text-align: center; color: #97a0ac; font-size: 12px; margin-top: 32px; }
  @media (max-width: 720px) { .cards { grid-template-columns: repeat(2, 1fr); } }
  @media print { body { background: #fff; } section.page, .card { break-inside: avoid; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Accessibility Report — ${esc(BRAND)}</h1>
      <div class="meta">Standard: WCAG 2.2 AA &nbsp;•&nbsp; Engine: axe-core via Playwright &nbsp;•&nbsp; Generated: ${esc(generated)}</div>
    </header>

    <div class="cards">${card(results.length, 'Pages scanned', '#1f3a5f')}${card(rulesFailed, 'Rules failed', '#1f3a5f')}${card(elements, 'Elements affected', '#1f3a5f')}${card(byImpact('critical'), 'Critical', '#b91c1c')}${card(byImpact('serious'), 'Serious', '#c2410c')}${card(byImpact('moderate'), 'Moderate', '#a16207')}${card(byImpact('minor'), 'Minor', '#4d7c0f')}
    </div>
    <div class="note">Automated scanning detects roughly 30–40% of WCAG criteria. Pair these results with manual keyboard and screen-reader testing for full WCAG 2.2 AA coverage.</div>
${results.map(renderPage).join('\n')}
    <footer>Generated by axe-core + Playwright · internal QA accessibility harness</footer>
  </div>
</body>
</html>
`;
}

const results = loadResults();
fs.writeFileSync(OUTPUT, build(results));
console.log(`Accessibility report written to ${OUTPUT} (${results.length} page(s))`);
