# Self-Healing Flow → HTML Report

A standalone HTML report that records the **entire flow of events** for each element
in the three-tier self-healing chain (DB primary → smart locators → AI healing).

- **ts-morph**: read-only — extracts declared locators from source to show drift.
- **Runtime data**: captured by a custom Playwright reporter.
- **Output**: one self-contained `.html` file that opens directly from disk (no server).

---

## Step 1 — Install dependencies

```bash
npm i -D ts-morph
```

Playwright is already in the project; ts-morph is the only new dependency.

---

## Step 2 — Define the flow event model

Each element produces an ordered list of **steps**, not just a final result.

`src/reporting/types.ts`

```ts
export type Tier = "db" | "smart" | "ai";
export type StepStatus = "success" | "failed" | "skipped";

export interface FlowStep {
  order: number;
  tier: Tier;
  action: string;          // "DB primary locator", "Smart: scoped CSS", "AI heal vs live DOM"
  locator?: string;
  status: StepStatus;
  reason?: string;         // why it failed: "0 matches", "not unique (3 matches)", timeout
  durationMs?: number;
  aiVerification?: {       // AI-tier only
    existsInCurrentDom: boolean;
    isUnique: boolean;
    usesDynamicAttrs: boolean;
  };
  screenshotPath?: string;
}

export interface HealFlow {
  elementKey: string;
  testTitle: string;
  startedAt: string;
  steps: FlowStep[];        // the entire ordered flow
  finalTier: Tier | null;
  finalLocator: string | null;
  healed: boolean;
  writtenBack: boolean;
}
```

---

## Step 3 — Record each step as the chain executes

`src/reporting/sink.ts`

```ts
import fs from "fs";
import path from "path";
import { HealFlow, FlowStep } from "./types";

const flows: HealFlow[] = [];
let current: HealFlow | null = null;

export function beginFlow(elementKey: string, testTitle: string): void {
  current = {
    elementKey, testTitle,
    startedAt: new Date().toISOString(),
    steps: [], finalTier: null, finalLocator: null,
    healed: false, writtenBack: false,
  };
}

export function logStep(step: Omit<FlowStep, "order">): void {
  if (!current) return;
  current.steps.push({ order: current.steps.length + 1, ...step });
}

export function endFlow(opts: {
  finalTier: HealFlow["finalTier"];
  finalLocator: string | null;
  healed: boolean;
  writtenBack: boolean;
}): void {
  if (!current) return;
  Object.assign(current, opts);
  flows.push(current);
  current = null;
}

export function flushFlows(outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "heal-flows.json"),
    JSON.stringify(flows, null, 2),
    "utf-8"
  );
}
```

---

## Step 4 — Wire into your three-tier resolver

The single integration point. Bracket your existing chain with `beginFlow` / `endFlow`
and drop a `logStep` after every attempt.

```ts
beginFlow(elementKey, test.info().title);

// Tier 1: DB primary
const t0 = Date.now();
let handle = await tryLocator(dbLocator);
logStep({
  tier: "db", action: "DB primary locator", locator: dbLocator,
  status: handle ? "success" : "failed",
  reason: handle ? undefined : "0 matches",
  durationMs: Date.now() - t0,
});

// Tier 2: smart locators
if (!handle) {
  for (const cand of smartCandidates) {
    const t = Date.now();
    const r = await tryLocator(cand.selector);
    logStep({
      tier: "smart", action: `Smart: ${cand.strategy}`, locator: cand.selector,
      status: r ? "success" : "failed",
      reason: r ? undefined : cand.failReason, // "not unique (3 matches)" etc.
      durationMs: Date.now() - t,
    });
    if (r) { handle = r; break; }
  }
}

// Tier 3: AI heal
if (!handle) {
  const t = Date.now();
  const ai = await aiHeal(elementKey, liveDom, screenshot);
  logStep({
    tier: "ai", action: "AI heal vs live DOM", locator: ai.locator,
    status: ai.locator ? "success" : "failed",
    reason: ai.locator ? undefined : "AI returned no usable locator",
    durationMs: Date.now() - t,
    aiVerification: {
      existsInCurrentDom: ai.existsInCurrentDom,
      isUnique: ai.isUnique,
      usesDynamicAttrs: ai.usesDynamicAttrs,
    },
    screenshotPath: ai.screenshotPath,
  });
  handle = ai.handle;
}

const finalTier = handle ? lastSuccessfulTier : null;
endFlow({ finalTier, finalLocator, healed: finalTier === "ai", writtenBack });
```

> Confirm against your real code: the smart-candidate field names (`strategy`,
> `failReason`) and what `aiHeal()` returns — mapped here to your existing
> `existsInCurrentDom` / `isUnique` / `usesDynamicAttrs` self-verification fields.

---

## Step 5 — Extract declared locators with ts-morph (read-only)

`src/reporting/extractElements.ts`. Adjust source path + object shape to match
your actual elements file/seed.

```ts
import { Project, SyntaxKind } from "ts-morph";

export interface DeclaredElement {
  elementKey: string;
  declaredLocator: string;
}

export function extractDeclaredElements(
  elementsFile: string,
  tsConfig = "tsconfig.json"
): DeclaredElement[] {
  const project = new Project({ tsConfigFilePath: tsConfig });
  const sf = project.getSourceFileOrThrow(elementsFile);
  const out: DeclaredElement[] = [];

  sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression).forEach((obj) => {
    const keyProp = obj.getProperty("key") ?? obj.getProperty("elementKey");
    const locProp =
      obj.getProperty("locator") ??
      obj.getProperty("selector") ??
      obj.getProperty("primary");
    if (!keyProp || !locProp) return;

    const read = (p: typeof keyProp) =>
      p?.getFirstDescendantByKind(SyntaxKind.StringLiteral)?.getLiteralText();

    const elementKey = read(keyProp);
    const declaredLocator = read(locProp);
    if (elementKey && declaredLocator) out.push({ elementKey, declaredLocator });
  });

  return out;
}
```

ts-morph only reads source — it never touches the DB. If elements live in the DB
at runtime but are mirrored in a `.ts` seed/constants file, point this at that file.

---

## Step 6 — Render the timeline HTML

`src/reporting/renderHtml.ts`. Data is inlined; the file opens directly from disk.
Includes the optional ts-morph **declared-vs-final drift** indicator.

```ts
import fs from "fs";
import path from "path";
import { HealFlow } from "./types";
import { DeclaredElement } from "./extractElements";

const tierColor = { db: "#16a34a", smart: "#d97706", ai: "#dc2626" } as const;
const statusIcon = { success: "\u2713", failed: "\u2717", skipped: "\u2013" } as const;

const esc = (s?: string | null) =>
  (s ?? "\u2014").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderHtml(
  flows: HealFlow[],
  declared: DeclaredElement[],
  outDir: string
): string {
  const declMap = new Map(declared.map((d) => [d.elementKey, d.declaredLocator]));

  const cards = flows.map((f) => {
    const headColor = f.finalTier ? tierColor[f.finalTier] : "#64748b";
    const declaredLoc = declMap.get(f.elementKey) ?? null;
    const drifted = declaredLoc != null && f.finalLocator != null
      && declaredLoc !== f.finalLocator;

    const steps = f.steps.map((s) => `
      <li class="step ${s.status}">
        <span class="ord">${s.order}</span>
        <span class="dot" style="background:${tierColor[s.tier]}"></span>
        <div class="stepbody">
          <div class="stephead">
            <b>${esc(s.action)}</b>
            <span class="st ${s.status}">${statusIcon[s.status]} ${s.status}</span>
            ${s.durationMs != null ? `<span class="ms">${s.durationMs}ms</span>` : ""}
          </div>
          ${s.locator ? `<code>${esc(s.locator)}</code>` : ""}
          ${s.reason ? `<div class="reason">${esc(s.reason)}</div>` : ""}
          ${s.aiVerification ? `<div class="verify">
            existsInCurrentDom=${s.aiVerification.existsInCurrentDom} \u00b7
            isUnique=${s.aiVerification.isUnique} \u00b7
            usesDynamicAttrs=${s.aiVerification.usesDynamicAttrs}</div>` : ""}
          ${s.screenshotPath ? `<a href="${esc(s.screenshotPath)}" target="_blank">screenshot</a>` : ""}
        </div>
      </li>`).join("");

    return `
    <details class="card">
      <summary>
        <span class="cbar" style="background:${headColor}"></span>
        <span class="ckey">${esc(f.elementKey)}</span>
        <span class="cbadge" style="background:${headColor}">
          ${f.finalTier ? f.finalTier.toUpperCase() : "UNRESOLVED"}</span>
        ${f.healed ? '<span class="tag heal">AI HEALED</span>' : ""}
        ${f.writtenBack ? '<span class="tag wb">WRITE-BACK</span>' : ""}
        ${drifted ? '<span class="tag drift">DRIFTED</span>' : ""}
        <span class="cnt">${f.steps.length} steps</span>
      </summary>
      <div class="ctest">${esc(f.testTitle)}</div>
      ${drifted ? `<div class="driftrow">
        <span>declared</span><code>${esc(declaredLoc)}</code>
        <span>final</span><code>${esc(f.finalLocator)}</code></div>` : ""}
      <ol class="flow">${steps}</ol>
    </details>`;
  }).join("");

  const c = (t: string) => flows.filter((f) => f.finalTier === t).length;
  const unresolved = flows.filter((f) => !f.finalTier).length;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Self-Healing Flow Report</title>
<style>
  body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px}
  h1{font-size:20px;margin:0 0 4px} .sub{color:#94a3b8;font-size:13px;margin-bottom:20px}
  .summary{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .stat{background:#1e293b;border-radius:10px;padding:12px 16px}
  .stat b{display:block;font-size:22px} .stat span{font-size:12px;color:#94a3b8}
  .card{background:#1e293b;border-radius:10px;margin-bottom:10px;overflow:hidden}
  summary{display:flex;align-items:center;gap:8px;padding:12px 16px;cursor:pointer;list-style:none}
  summary::-webkit-details-marker{display:none}
  .cbar{width:8px;height:8px;border-radius:999px;flex:none}
  .ckey{font-weight:600} .cnt{margin-left:auto;font-size:12px;color:#64748b}
  .cbadge{font-size:11px;padding:2px 8px;border-radius:999px;color:#fff;font-weight:600}
  .tag{font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600}
  .heal{background:#7f1d1d}.wb{background:#1e3a8a}.drift{background:#78350f}
  .ctest{padding:0 16px 8px;font-size:12px;color:#64748b}
  .driftrow{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:0 16px 10px;font-size:12px}
  .driftrow span{color:#94a3b8;text-transform:uppercase;font-size:10px;align-self:center}
  .flow{list-style:none;margin:0;padding:0 16px 16px}
  .step{display:flex;gap:10px;padding:8px 0;border-top:1px solid #334155;align-items:flex-start}
  .ord{color:#64748b;font-size:12px;width:18px;text-align:right;padding-top:2px}
  .dot{width:8px;height:8px;border-radius:999px;margin-top:6px;flex:none}
  .stepbody{flex:1} .stephead{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .st{font-size:11px;padding:1px 6px;border-radius:4px}
  .st.success{background:#14532d;color:#bbf7d0}
  .st.failed{background:#7f1d1d;color:#fecaca}
  .st.skipped{background:#334155;color:#cbd5e1}
  .ms{font-size:11px;color:#64748b}
  code{display:block;font-size:12px;color:#cbd5e1;word-break:break-all;margin-top:4px}
  .reason{font-size:12px;color:#fca5a5;margin-top:4px}
  .verify{font-size:11px;color:#93c5fd;margin-top:4px}
  a{color:#60a5fa;font-size:12px}
</style></head><body>
<h1>Self-Healing Flow Report</h1>
<div class="sub">Generated ${new Date().toLocaleString()} \u00b7 ${flows.length} elements</div>
<div class="summary">
  <div class="stat"><b style="color:#16a34a">${c("db")}</b><span>DB primary</span></div>
  <div class="stat"><b style="color:#d97706">${c("smart")}</b><span>Smart</span></div>
  <div class="stat"><b style="color:#dc2626">${c("ai")}</b><span>AI healed</span></div>
  <div class="stat"><b style="color:#64748b">${unresolved}</b><span>Unresolved</span></div>
</div>
${cards}
</body></html>`;

  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "self-healing-report.html");
  fs.writeFileSync(out, html, "utf-8");
  return out;
}
```

---

## Step 7 — Custom Playwright reporter

`src/reporting/SelfHealingReporter.ts`

```ts
import type { Reporter } from "@playwright/test/reporter";
import fs from "fs";
import path from "path";
import { flushFlows } from "./sink";
import { renderHtml } from "./renderHtml";
import { extractDeclaredElements } from "./extractElements";
import { HealFlow } from "./types";

const OUT = "self-healing-output";
const ELEMENTS_FILE = "src/elements/elements.ts"; // adjust to your seed/constants file

export default class SelfHealingReporter implements Reporter {
  onEnd() {
    flushFlows(OUT);
    const flows: HealFlow[] = JSON.parse(
      fs.readFileSync(path.join(OUT, "heal-flows.json"), "utf-8")
    );
    const declared = extractDeclaredElements(ELEMENTS_FILE);
    const out = renderHtml(flows, declared, OUT);
    console.log(`Self-healing report: ${out}`);
  }
}
```

Register in `playwright.config.ts`:

```ts
reporter: [
  ["list"],
  ["./src/reporting/SelfHealingReporter.ts"],
],
```

---

## Step 8 — Run

```bash
npx playwright test
# open self-healing-output/self-healing-report.html
```

Each element renders as a collapsible card. Expanding shows the full ordered flow:
every locator tried, why it failed, AI self-verification fields, timing, the winning
tier, and (when ts-morph detects a mismatch) a declared-vs-final drift row.

---

## File map

```
src/reporting/
├── types.ts                 # Step 2 — flow event model
├── sink.ts                  # Step 3 — begin/log/end/flush
├── extractElements.ts       # Step 5 — ts-morph read-only extraction
├── renderHtml.ts            # Step 6 — timeline HTML + drift
└── SelfHealingReporter.ts   # Step 7 — Playwright reporter
playwright.config.ts         # register reporter
self-healing-output/
├── heal-flows.json          # runtime data (generated)
└── self-healing-report.html # final report (generated)
```

## Integration checklist

- [ ] `beginFlow` / `logStep` / `endFlow` wired into the real resolver (Step 4)
- [ ] smart-candidate field names match (`strategy`, `failReason`)
- [ ] `aiHeal()` return shape mapped to `aiVerification`
- [ ] `ELEMENTS_FILE` points to the file holding declared locators
- [ ] object-literal property names in `extractElements` match your elements shape
