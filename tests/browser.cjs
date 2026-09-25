// Run with an existing Playwright installation:
// PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test node tests/browser.cjs
// Optional: GAME_URL=http://127.0.0.1:8765 (default is direct file launch).
// Outputs are written under os.tmpdir(), never into another project's files.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const h = require('./browser-test-helpers.cjs');
const journeys = [require('./browser-journey-runs-notes-saves.cjs'), require('./browser-journey-residents-endings.cjs')];

(async () => {
  h.browser = await chromium.launch({ headless: true });
  for (const journey of journeys) await journey(h);
  h.assert.deepEqual(h.errors, []);
  console.log(`PASS: no browser errors or external runtime requests; artifacts: ${h.output}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (h.browser) await h.browser.close(); });
