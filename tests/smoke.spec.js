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

test('workshop sheet has four views and one parts row per piece, in EN and DE', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        app.setLanguage('en');
        const board = app.makeDefaultForType('Board');
        // Labels come from user input and loaded files; they must never be parsed as HTML.
        board.userData.label = '<b>Top</b>';
        app.addPiece(board);
        app.addPiece(app.makeDefaultForType('Dowel'));
        const sheet = app.buildWorkshopSheet();
        const en = {
            views: sheet.querySelectorAll('.sheet-view').length,
            images: Array.from(sheet.querySelectorAll('.sheet-view img')).map((img) => img.src.slice(0, 22)),
            rows: sheet.querySelectorAll('tbody tr').length,
            thumbs: sheet.querySelectorAll('tbody img').length,
            firstLabel: sheet.querySelector('tbody tr td:nth-child(4)').textContent,
            injected: sheet.querySelectorAll('tbody b').length,
            heading: sheet.querySelector('h2').textContent,
            expected: app.t('sheet.partsList')
        };
        app.setLanguage('de');
        const de = { heading: app.buildWorkshopSheet().querySelector('h2').textContent, expected: app.t('sheet.partsList') };
        return { en, de };
    });

    expect(result.en.views).toBe(4);
    expect(result.en.images).toEqual(Array(4).fill('data:image/png;base64,'));
    expect(result.en.rows).toBe(2);
    expect(result.en.thumbs).toBe(2);
    expect(result.en.firstLabel).toBe('<b>Top</b>');
    expect(result.en.injected).toBe(0);
    expect(result.en.heading).toBe(result.en.expected);
    expect(result.de.heading).toBe(result.de.expected);
    expect(result.de.heading).not.toBe(result.en.heading);
});

test('workshop sheet merges identical parts into one row', async ({ page }) => {
    await gotoApp(page);

    const cells = await page.evaluate(() => {
        const app = window.__app;
        const add = (type, label, dims) => {
            const mesh = app.makeDefaultForType(type);
            mesh.userData.label = label;
            Object.assign(mesh.userData, dims);
            app.addPiece(mesh);
        };
        add('Dowel', 'Pin A');
        // Same board, lying differently in the model.
        add('Board', 'Apron Front', { w: 240, h: 60, d: 18 });
        add('Dowel', 'Pin B');
        add('Dowel', 'Pin C');
        add('Board', 'Apron Left', { w: 18, h: 60, d: 240 });
        // A miter ties the board to its axis, so it stays separate.
        add('Board', 'Rafter', { w: 240, h: 60, d: 18, angleStart: 45 });
        const rows = app.buildWorkshopSheet().querySelectorAll('tbody tr');
        return Array.from(rows).map((r) => [r.children[0].textContent, r.children[2].textContent, r.children[3].textContent]);
    });

    expect(cells).toEqual([
        ['1', '3×', 'Pin'],
        ['2', '2×', 'Apron'],
        ['3', '1×', 'Rafter']
    ]);
});

test('offscreen sheet render leaves renderer, scene and selection untouched', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        app.addPiece(app.makeDefaultForType('Dowel'));
        // addPiece selects the piece, so its material carries the selection color.
        const piece = app.makeDefaultForType('Board');
        app.addPiece(piece);
        const snapshot = () => ({
            size: app.renderer.getSize(new THREE.Vector2()).toArray(),
            ratio: app.renderer.getPixelRatio(),
            clear: app.renderer.getClearColor(new THREE.Color()).getHex(),
            visible: app.scene.children.map((c) => c.visible),
            childCount: app.scene.children.length,
            pieceChildren: piece.children.length,
            color: piece.material.color.getHex()
        });
        const before = snapshot();
        const cam = new THREE.OrthographicCamera(-200, 200, 150, -150, 0.1, 5000);
        cam.position.set(0, 0, 1000);
        cam.lookAt(0, 0, 0);
        cam.updateMatrixWorld();
        const url = app.renderViewToDataURL(cam, 300, 200, { clean: true });
        app.renderViewToDataURL(cam, 300, 200, { clean: true, only: piece });
        return { before, after: snapshot(), prefix: url.slice(0, 22), length: url.length };
    });

    expect(result.after).toEqual(result.before);
    expect(result.prefix).toBe('data:image/png;base64,');
    expect(result.length).toBeGreaterThan(1000);
});

test('workshop sheet gives enclosed parts a detail view and restores materials', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        const base = { notches: 0, csgModified: false, rx: 0, ry: 0, rz: 0 };
        app.restoreScene(JSON.stringify({
            pieces: [
                { ...base, type: 'Board', id: 1, label: 'Block', px: 0, py: 100, pz: 0, w: 200, h: 200, d: 200 },
                { ...base, type: 'Dowel', id: 2, label: 'Hidden Pin', px: 0, py: 100, pz: 0, r: 5, h: 30 },
                { ...base, type: 'Board', id: 3, label: 'Far Block', px: 800, py: 100, pz: 0, w: 200, h: 200, d: 200 }
            ],
            groups: []
        }));
        // restoreScene replaces the pieces array, so __app.pieces is stale here: walk the scene.
        const materialState = () => {
            const state = [];
            app.scene.traverse((o) => {
                if (o.isMesh && o.userData.type) {
                    state.push([o.material.uuid, o.material.color.getHex(), o.material.opacity, o.castShadow, o.children.length]);
                }
            });
            return state;
        };
        const before = materialState();
        const sheet = app.buildWorkshopSheet();
        return {
            details: Array.from(sheet.querySelectorAll('.sheet-detail figcaption')).map((c) => c.textContent),
            others: sheet.querySelectorAll('.sheet-other').length,
            before,
            after: materialState()
        };
    });

    expect(result.details).toHaveLength(1);
    expect(result.details[0]).toContain('Pos. 2 ');
    expect(result.others).toBe(0);
    expect(result.before).toHaveLength(3);
    expect(result.after).toEqual(result.before);
});

test('tall add menu stays inside the window and scrolls to its last item', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await gotoApp(page);
    await page.locator('#add-dropdown > button').click();

    const menuFits = () => page.locator('#add-dropdown .add-menu').evaluate((menu) => ({
        bottom: menu.getBoundingClientRect().bottom,
        windowHeight: window.innerHeight,
        scrolls: menu.scrollHeight > menu.clientHeight
    }));
    const small = await menuFits();
    expect(small.scrolls).toBe(true);
    expect(small.bottom).toBeLessThanOrEqual(small.windowHeight);

    // The limit follows the window while the menu is open
    await page.setViewportSize({ width: 1280, height: 400 });
    const smaller = await menuFits();
    expect(smaller.bottom).toBeLessThanOrEqual(smaller.windowHeight);

    const lastItem = page.locator('#add-dropdown .add-menu-item').last();
    await lastItem.scrollIntoViewIfNeeded();
    const box = await lastItem.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(smaller.windowHeight);
});
