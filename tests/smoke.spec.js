// Smoke tests for the 3D Wooden Modeler.
// Drives the app through the test hook attached when ?__test=1 is set.
// Each test loads a fresh page so global state stays isolated.
const { test, expect } = require('@playwright/test');

const TEST_URL = '/index.html?__test=1';

async function gotoApp(page) {
    await page.goto(TEST_URL);
    // The hook fires app-ready *after* applyTranslations + animate are wired up.
    await page.waitForFunction(() => !!window.__app, null, { timeout: 10000 });
}

test('every default ADD_TYPES primitive can be added', async ({ page }) => {
    await gotoApp(page);

    const types = await page.evaluate(() => window.__app.ADD_TYPES.slice());
    expect(types.length).toBeGreaterThan(0);

    // Add one of each via the same code path the toolbar uses.
    await page.evaluate((types) => {
        types.forEach((t) => {
            const mesh = window.__app.makeDefaultForType(t);
            window.__app.addPiece(mesh);
        });
    }, types);

    const result = await page.evaluate(() => ({
        count: window.__app.pieces.length,
        types: window.__app.pieces.map((p) => p.userData.type)
    }));

    expect(result.count).toBe(types.length);
    expect(result.types).toEqual(types);
});

test('Cut Joint Pyramid Frustum + Dowel survives save/reload via csgOps', async ({ page }) => {
    await gotoApp(page);

    // Set up: a Pyramid Frustum at origin, a Dowel running through it.
    const before = await page.evaluate(() => {
        const target = window.__app.makeDefaultForType('Pyramid Frustum');
        window.__app.addPiece(target);
        target.position.set(0, 40, 0);
        target.updateMatrixWorld(true);

        const tool = window.__app.makeDefaultForType('Dowel');
        window.__app.addPiece(tool);
        // Place dowel so its long axis pierces the frustum vertically.
        tool.position.set(0, 40, 0);
        tool.rotation.set(0, 0, 0);
        tool.updateMatrixWorld(true);

        window.__app.performCut(target, tool);

        const cut = window.__app.pieces.find((p) => p.userData.csgModified);
        return {
            notches: cut ? cut.userData.notches : null,
            csgOpsLen: cut && cut.userData.csgOps ? cut.userData.csgOps.length : 0,
            csgOpHasLocal: cut && cut.userData.csgOps ? !!cut.userData.csgOps[0].tool.local : false
        };
    });

    expect(before.notches).toBe(1);
    expect(before.csgOpsLen).toBe(1);
    expect(before.csgOpHasLocal).toBe(true);

    // Save → restore from the serialized JSON (round-trip in-memory).
    const after = await page.evaluate(() => {
        const json = window.__app.serializeScene();
        window.__app.restoreScene(json);
        const cut = window.__app.pieces.find((p) => p.userData.csgModified);
        return {
            notches: cut ? cut.userData.notches : null,
            csgOpsLen: cut && cut.userData.csgOps ? cut.userData.csgOps.length : 0,
            type: cut ? cut.userData.type : null
        };
    });

    expect(after.type).toBe('Pyramid Frustum');
    expect(after.notches).toBe(1);
    expect(after.csgOpsLen).toBe(1);
});

test('switching language to DE updates a visible toolbar string', async ({ page }) => {
    await gotoApp(page);

    const enText = await page.evaluate(() => {
        window.__app.setLanguage('en');
        const el = document.querySelector('[data-i18n="toolbar.add"]');
        return el ? el.textContent.trim() : null;
    });
    expect(enText).not.toBeNull();

    const deText = await page.evaluate(() => {
        window.__app.setLanguage('de');
        const el = document.querySelector('[data-i18n="toolbar.add"]');
        return el ? el.textContent.trim() : null;
    });
    expect(deText).not.toBeNull();
    expect(deText).not.toBe(enText);
    // Sanity: confirm the dictionary actually returned the German string.
    const deDirect = await page.evaluate(() => window.__app.t('toolbar.add'));
    expect(deText).toBe(deDirect);
});
