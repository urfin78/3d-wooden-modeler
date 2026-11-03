// Generates the README screenshots under docs/screenshots/.
// Not a regression test: nothing is compared, the PNGs are simply overwritten.
// Run through the `update-screenshots.yml` workflow, which opens a PR with the result.
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_URL = '/index.html?__test=1';
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'screenshots');

const CANVAS = '#viewport canvas';
const FULL_APP_SIZE = { width: 1440, height: 1040 };
// The side panel takes 300px and the toolbar 48px, which leaves a 1000x752 canvas
const CANVAS_ONLY_SIZE = { width: 1300, height: 800 };
const SHEET_SIZE = { width: 900, height: 1300 };

const STOOL_VIEW = { x: 520, y: 430, z: 640 };
const STOOL_CENTER = { x: 0, y: 230, z: 0 };

// Software WebGL on the CI runner is slow, and the sheet renders many offscreen views
test.setTimeout(120 * 1000);

function outPath(name) {
    return path.join(OUT_DIR, name);
}

async function gotoApp(page, size) {
    await page.setViewportSize(size);
    await page.goto(TEST_URL);
    await page.waitForFunction(() => !!window.__app, null, { timeout: 10000 });
    await page.evaluate(() => window.__app.setLanguage('en'));
}

// The ruler label covers most of the model at this zoom level, so the stool is shown without it
async function loadStool(page) {
    const file = path.join(REPO_ROOT, 'examples', 'stool.woodmodel.json');
    const model = JSON.parse(fs.readFileSync(file, 'utf8'));
    await page.evaluate((json) => window.__app.restoreScene(json), JSON.stringify({
        pieces: model.pieces,
        groups: model.groups || [],
        rulers: []
    }));
}

async function setView(page, position, target) {
    await page.evaluate(({ position, target }) => {
        window.__app.setCameraView(position, target);
        window.__app.forceRender();
    }, { position, target });
}

// Clicking empty space removes the selection highlight and the floating action bar
async function deselect(page) {
    await page.locator(CANVAS).click({ position: { x: 5, y: 5 } });
}

// Wait until the page has painted the latest camera and DOM changes
async function settle(page) {
    await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
}

test('screenshot: main window', async ({ page }) => {
    await gotoApp(page, FULL_APP_SIZE);
    await loadStool(page);
    await setView(page, STOOL_VIEW, STOOL_CENTER);
    await page.locator('.obj-list-item').nth(1).click();
    await settle(page);
    await page.screenshot({ path: outPath('main-window.png') });
});

test('screenshot: X-Ray', async ({ page }) => {
    await gotoApp(page, CANVAS_ONLY_SIZE);
    await loadStool(page);
    await page.locator('#btn-xray').click();
    await setView(page, { x: 480, y: 410, z: 590 }, STOOL_CENTER);
    await settle(page);
    await page.locator(CANVAS).screenshot({ path: outPath('xray.png') });
});

test('screenshot: assembly template', async ({ page }) => {
    await gotoApp(page, CANVAS_ONLY_SIZE);
    await page.locator('#add-dropdown > button').click();
    await page.locator('.add-mega-section').getByText('Japanese Lantern', { exact: true }).click();
    await page.locator('#asm-modal button').last().click();
    await setView(page, { x: 520, y: 480, z: 640 }, { x: 0, y: 240, z: 0 });
    await deselect(page);
    await settle(page);
    await page.locator(CANVAS).screenshot({ path: outPath('assembly-template.png') });
});

test('screenshot: cross-lap joint', async ({ page }) => {
    await gotoApp(page, CANVAS_ONLY_SIZE);
    await page.evaluate(() => {
        const app = window.__app;
        const board = (id, label, w, d, py) => ({
            type: 'Board', id, label, notches: 0, csgModified: false,
            price: 0, priceMode: 'fixed', sourceId: null, sourcePrice: 0,
            sourcePriceMode: null, sourceLabel: null, groupId: null,
            px: 0, py, pz: 0, rx: 0, ry: 0, rz: 0, w, h: 40, d
        });
        app.restoreScene(JSON.stringify({
            pieces: [board(1, 'Lower', 400, 80, 20), board(2, 'Upper', 80, 400, 40)],
            groups: [],
            rulers: []
        }));
        // restoreScene replaces the pieces array, so app.pieces is stale here
        const byLabel = (label) => app.scene.children.find((o) => o.userData.label === label);
        const lower = byLabel('Lower');
        const upper = byLabel('Upper');
        lower.updateMatrixWorld(true);
        upper.updateMatrixWorld(true);
        // Each board loses half its thickness at the crossing
        app.performCut(upper, lower);
        upper.position.y = 20;
        upper.updateMatrixWorld(true);
        app.performCut(lower, upper);
        // Lift the upper board to show both notches
        upper.position.y = 170;
        upper.updateMatrixWorld(true);
    });
    await setView(page, { x: 360, y: 340, z: 460 }, { x: 0, y: 80, z: 0 });
    await deselect(page);
    await settle(page);
    await page.locator(CANVAS).screenshot({ path: outPath('cross-lap-joint.png') });
});

test('screenshot: workshop sheet', async ({ page }) => {
    await gotoApp(page, SHEET_SIZE);
    await loadStool(page);
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
        const sheet = window.__app.buildWorkshopSheet();
        document.body.classList.add('print-sheet-active');
        await Promise.all(Array.from(sheet.querySelectorAll('img')).map((img) => img.decode()));
    });
    await page.locator('#print-sheet .sheet-page').first().screenshot({ path: outPath('workshop-views.png') });
    await page.locator('#print-sheet .sheet-parts').screenshot({ path: outPath('workshop-parts.png') });
});
