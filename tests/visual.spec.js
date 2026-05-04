// Visual regression tests for the 3D Wooden Modeler.
// One screenshot per default ADD_TYPES primitive plus one CSG-cut composition,
// each compared against a baseline PNG under tests/visual.spec.js-snapshots/.
//
// Baselines are stored only for the linux/chromium combo (the same shape the
// CI runs in) — Playwright filenames already include the OS suffix. The
// `update-baselines.yml` workflow regenerates them via --update-snapshots.
const { test, expect } = require('@playwright/test');

const TEST_URL = '/index.html?__test=1';

async function gotoApp(page) {
    await page.goto(TEST_URL);
    await page.waitForFunction(() => !!window.__app, null, { timeout: 10000 });
}

// Hide DOM chrome so the canvas-only screenshot stays stable when surrounding
// HTML changes (toolbar reflow, side-panel content, etc.).
async function hideChrome(page) {
    await page.addStyleTag({ content: `
        #toolbar, #side-panel, #action-bar, #ruler-hint, #mode-banner,
        .menu-dropdown, .menu-panel { visibility: hidden !important; }
        #viewport { top: 0 !important; right: 0 !important; }
    `});
}

async function addAndFrame(page, type) {
    return await page.evaluate((t) => {
        const mesh = window.__app.makeDefaultForType(t);
        window.__app.addPiece(mesh);
        window.__app.frameToObject(mesh);
        window.__app.forceRender();
        return { type: mesh.userData.type };
    }, type);
}

const PRIMITIVES = [
    'Board',
    'Frustum Board',
    'Pyramid Frustum',
    'Frame',
    'Dowel',
    'Wedge',
    'L-Bracket',
    'Tapered Leg'
];

// One spec per primitive so failures are reported per-shape, not lumped together.
for (const type of PRIMITIVES) {
    test(`visual: default ${type}`, async ({ page }) => {
        await gotoApp(page);
        await hideChrome(page);
        await addAndFrame(page, type);
        const slug = type.toLowerCase().replace(/\s+/g, '-');
        await expect(page.locator('#viewport canvas')).toHaveScreenshot(`primitive-${slug}.png`);
    });
}

test('visual: pyramid-frustum + dowel CSG cut', async ({ page }) => {
    await gotoApp(page);
    await hideChrome(page);

    await page.evaluate(() => {
        const target = window.__app.makeDefaultForType('Pyramid Frustum');
        window.__app.addPiece(target);
        target.position.set(0, 40, 0);
        target.updateMatrixWorld(true);

        const tool = window.__app.makeDefaultForType('Dowel');
        window.__app.addPiece(tool);
        tool.position.set(0, 40, 0);
        tool.rotation.set(0, 0, 0);
        tool.updateMatrixWorld(true);

        window.__app.performCut(target, tool);

        const cut = window.__app.pieces.find((p) => p.userData.csgModified);
        window.__app.frameToObject(cut);
        window.__app.forceRender();
    });

    await expect(page.locator('#viewport canvas')).toHaveScreenshot('csg-pyramid-frustum-dowel.png');
});
