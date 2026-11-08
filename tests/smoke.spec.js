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
        // A miter ties the board to its axis, so it stays separate from the plain board.
        // The same miter on the other end is the same part, turned by 180°.
        add('Board', 'Rafter', { w: 240, h: 60, d: 18, angleStart: 45 });
        add('Board', 'Rafter B', { w: 240, h: 60, d: 18, angleEnd: 45 });
        const rows = app.buildWorkshopSheet().querySelectorAll('tbody tr');
        return Array.from(rows).map((r) => [r.children[0].textContent, r.children[2].textContent, r.children[3].textContent]);
    });

    expect(cells).toEqual([
        ['1', '3×', 'Pin'],
        ['2', '2×', 'Apron'],
        ['3', '2×', 'Rafter']
    ]);
});

test('offscreen sheet render leaves renderer, scene and selection untouched', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        const THREE = app.THREE;
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

test('x-ray mode makes unselected pieces see-through and restores them', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        const target = app.makeDefaultForType('Board');
        app.addPiece(target);
        // The selected piece stays opaque, so select another one far out of view.
        const other = app.makeDefaultForType('Board');
        other.position.x += 3000;
        app.addPiece(other);
        app.frameToObject(target);
        const centerPixel = () => {
            app.forceRender();
            const gl = app.renderer.getContext();
            const px = new Uint8Array(4);
            gl.readPixels(gl.drawingBufferWidth >> 1, gl.drawingBufferHeight >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
            return Array.from(px).slice(0, 3);
        };
        const button = document.getElementById('btn-xray');
        const off = centerPixel();
        button.click();
        const on = centerPixel();
        button.click();
        return { off, on, restored: centerPixel() };
    });

    // The light background shows through, which raises the wood's low blue channel.
    expect(result.on[2]).toBeGreaterThan(result.off[2] + 20);
    expect(result.restored).toEqual(result.off);
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

test('workshop sheet draws miters and angled cuts, but no page without any', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        app.setLanguage('en');
        const base = { notches: 0, csgModified: false, rx: 0, ry: 0, rz: 0, px: 0, py: 0, pz: 0 };
        const cut = (id, label, py, tool) => ({
            ...base, type: 'Board', id, label, py, w: 300, h: 100, d: 18, notches: 1, csgModified: true,
            csgOps: [{ op: 'subtract', tool: { local: true, pz: 0, rx: 0, ry: 0, ...tool } }]
        });
        app.restoreScene(JSON.stringify({
            pieces: [
                { ...base, type: 'Board', id: 1, label: 'Rafter', w: 240, h: 60, d: 18, angleStart: 45 },
                cut(2, 'Corner', 200, { type: 'Board', px: 150, py: 50, rz: Math.PI / 4, w: 100, h: 100, d: 30 }),
                cut(3, 'Notch', 400, { type: 'Board', px: 0, py: 50, rz: 0, w: 50, h: 40, d: 30 }),
                cut(4, 'Hole', 600, { type: 'Dowel', px: 0, py: 0, rx: Math.PI / 2, rz: 0, r: 30, h: 40 })
            ],
            groups: []
        }));
        const sheet = app.buildWorkshopSheet();
        const figures = Array.from(sheet.querySelectorAll('.sheet-cuts .sheet-cut'));
        const withCuts = {
            captions: figures.map((f) => f.querySelector('figcaption').textContent),
            miterText: Array.from(figures[0].querySelectorAll('svg text')).map((el) => el.textContent),
            cutRows: Array.from(figures[1].querySelectorAll('tbody tr')).map((r) => Array.from(r.children).map((c) => c.textContent))
        };
        app.restoreScene(JSON.stringify({
            pieces: [{ ...base, type: 'Board', id: 1, label: 'Plain', w: 240, h: 60, d: 18 }],
            groups: []
        }));
        return { withCuts, plainPages: app.buildWorkshopSheet().querySelectorAll('.sheet-cuts').length };
    });

    // The square notch and the round hole need no angle, so they get no drawing.
    expect(result.withCuts.captions).toHaveLength(2);
    expect(result.withCuts.captions[0]).toContain('Rafter');
    expect(result.withCuts.captions[1]).toContain('Corner');
    expect(result.withCuts.miterText).toEqual(expect.arrayContaining([
        '45°', '90°', 'Top 180 mm', 'Bottom 240 mm', '60 mm', 'Start 45° · saw 45°', 'End 90°'
    ]));
    expect(result.withCuts.cutRows).toEqual([['A', '45°', '100 mm', '229.3 / 100', '300 / 29.3']]);
    expect(result.plainPages).toBe(0);
});

test('workshop sheet prints a shape with many angled edges as a full-size template', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        app.setLanguage('en');
        // Seven diamond notches along the top edge make 14 angled edges.
        const csgOps = [-120, -80, -40, 0, 40, 80, 120].map((px) => ({
            op: 'subtract',
            tool: { type: 'Board', local: true, px, py: 50, pz: 0, rx: 0, ry: 0, rz: Math.PI / 4, w: 30, h: 30, d: 30 }
        }));
        app.restoreScene(JSON.stringify({
            pieces: [{
                type: 'Board', id: 1, label: 'Crest', px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0,
                w: 300, h: 100, d: 18, notches: csgOps.length, csgModified: true, csgOps
            }],
            groups: []
        }));
        const sheet = app.buildWorkshopSheet();
        const tiles = Array.from(sheet.querySelectorAll('.sheet-templates .sheet-template-tile'));
        return {
            contours: sheet.querySelectorAll('.sheet-cuts .sheet-contour').length,
            cutTables: sheet.querySelectorAll('.sheet-cuts table').length,
            heads: tiles.map((tile) => tile.querySelector('.sheet-template-head span').textContent),
            sizes: tiles.map((tile) => {
                const svg = tile.querySelector(':scope > svg');
                return [svg.getAttribute('width'), svg.getAttribute('height'), svg.getAttribute('viewBox')];
            }),
            lines: tiles.map((tile) => tile.querySelectorAll(':scope > svg > line').length > 0)
        };
    });

    expect(result.contours).toBe(1);
    expect(result.cutTables).toBe(0);
    expect(result.heads).toEqual(['Pos. 1 · Crest · sheet 1 of 2', 'Pos. 1 · Crest · sheet 2 of 2']);
    // Real millimeters on both sides, so the print comes out at 1:1. Sheet 2 starts one sheet
    // minus the overlap further along.
    expect(result.sizes).toEqual([
        ['186mm', '116mm', '-8 0 186 116'],
        ['186mm', '116mm', '162 0 186 116']
    ]);
    expect(result.lines).toEqual([true, true]);
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

test('cutting plan assigns every part to a lettered piece of stock', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        app.setLanguage('en');
        const add = (type, label, dims) => {
            const mesh = app.makeDefaultForType(type);
            mesh.userData.label = label;
            Object.assign(mesh.userData, dims);
            app.addPiece(mesh);
        };
        for (let i = 0; i < 8; i++) add('Board', 'Rail', { w: 340, h: 47, d: 13.5 });
        // Shorter than the strip is wide: still sawn from the 13.5 × 47 strip
        add('Board', 'Block', { w: 47, h: 30, d: 13.5 });
        add('Board', 'Long rail', { w: 1200, h: 47, d: 13.5 });
        add('Dowel', 'Pin', { r: 3, h: 60 });
        add('Dowel', 'Pin', { r: 3, h: 60 });
        // Ripped to an odd width, sawn from 12 × 50 stock
        add('Board', 'Batten', { w: 265, h: 12, d: 37.2 });
        add('Board', 'Batten', { w: 265, h: 12, d: 37.2 });
        app.setStockSettings([
            { profile: '13.5x47', length: 1000, kerf: 3 },
            { profile: '12x50', name: 'Batten stock', length: 600, kerf: 4, parts: ['12x37.2'] }
        ]);
        const plan = app.buildStockPlan().map((entry) => ({
            key: entry.profile.key,
            bars: entry.bars.map((bar) => ({
                index: bar.index,
                length: bar.length,
                parts: bar.parts.map((p) => p.length),
                rest: bar.rest,
                oversize: bar.oversize
            }))
        }));
        const sheet = app.buildWorkshopSheet();
        return {
            plan,
            summary: Array.from(sheet.querySelectorAll('.sheet-first .sheet-stock-summary li')).map((li) => Array.from(li.children).map((c) => c.textContent)),
            barDrawings: sheet.querySelectorAll('.sheet-stock .sheet-stock-bar').length,
            fromStock: Array.from(sheet.querySelectorAll('.sheet-parts tbody tr')).map((r) => r.lastElementChild.textContent),
            saved: app.serializeStock()
        };
    });

    const regular = (index) => ({ index, length: 1000, parts: [340, 340], rest: 314, oversize: false });
    expect(result.plan).toEqual([
        { key: '12x50', bars: [{ index: 0, length: 600, parts: [265, 265], rest: 62, oversize: false }] },
        { key: '13.5x47', bars: [
            { index: 1, length: 1000, parts: [340, 340, 30], rest: 281, oversize: false },
            regular(2), regular(3), regular(4),
            { index: 5, length: 1200, parts: [1200], rest: 0, oversize: true }
        ] },
        { key: 'R6', bars: [{ index: 6, length: 1000, parts: [60, 60], rest: 874, oversize: false }] }
    ]);
    expect(result.summary).toEqual([
        ['A', '1× Batten stock 12×50×600 mm'],
        ['B–E', '4× Strip 13.5×47×1000 mm'],
        ['F', '1× Strip 13.5×47×1200 mm'],
        ['G', '1× Dowel rod Ø6×1000 mm']
    ]);
    // Bars C–E of the 13.5 × 47 strip are identical and share one drawing
    expect(result.barDrawings).toBe(5);
    // Rail, Block, Long rail, Pin, Batten
    expect(result.fromStock).toEqual(['B–E', 'B', 'F', 'G', 'A']);
    expect(result.saved).toEqual([
        { profile: '12x50', name: 'Batten stock', length: 600, kerf: 4, parts: ['12x37.2'] },
        { profile: '13.5x47', length: 1000, kerf: 3 }
    ]);
});

test('parts split from one piece of stock stay on it, with the offcut from the saved length', async ({ page }) => {
    await gotoApp(page);

    const result = await page.evaluate(() => {
        const app = window.__app;
        app.setLanguage('en');
        const source = { sourceId: 'plank-1', sourceLabel: 'Plank 2000', sourceLength: 1000, sourceKerf: 3, sourcePrice: 0, sourcePriceMode: 'fixed' };
        [['Shelf', 400], ['Side', 300]].forEach(([label, w]) => {
            const mesh = app.makeDefaultForType('Board');
            Object.assign(mesh.userData, source, { label, w, h: 20, d: 100 });
            app.addPiece(mesh);
        });
        // Same cross-section without a source: planned onto its own piece of stock
        const loose = app.makeDefaultForType('Board');
        Object.assign(loose.userData, { label: 'Loose', w: 500, h: 20, d: 100 });
        app.addPiece(loose);
        // A fixed price and no source: bought at its own size, not packed onto a trade length
        const bought = app.makeDefaultForType('Board');
        Object.assign(bought.userData, { label: 'Lid', w: 340, h: 20, d: 100, price: 3.5, priceMode: 'fixed' });
        app.addPiece(bought);
        // The source fields survive a save/load round trip
        app.restoreScene(app.serializeScene());
        const plan = app.buildStockPlan();
        return {
            bars: plan[0].bars.map((bar) => ({ length: bar.length, parts: bar.parts.map((p) => p.length), rest: bar.rest })),
            panel: Array.from(document.querySelectorAll('#object-list-items .stock-group')).map((h) => [h.textContent, h.title])
        };
    });

    expect(result.bars).toEqual([
        { length: 1000, parts: [400, 300], rest: 294 },
        { length: 340, parts: [340], rest: 0 },
        { length: 2000, parts: [500], rest: 1497 }
    ]);
    expect(result.panel).toEqual([
        ['▸ A · Plank 2000', 'A · Plank 2000\n2 parts · offcut 294'],
        ['▸ B · Board 20×100×340 mm', 'B · Board 20×100×340 mm\n1 part'],
        ['▸ C · Board 20×100×2000 mm', 'C · Board 20×100×2000 mm\n1 part · offcut 1497']
    ]);
});
