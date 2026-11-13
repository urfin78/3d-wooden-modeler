<h1><img src="docs/logo/mokuplan-logo.png" alt="Mokuplan" width="360"></h1>

Plan your next woodworking project in 3D, then take the dimensions, parts list and costs into the workshop. Free and open source, and it runs in your browser with nothing to install.

**[▶ Try it live](https://urfin78.github.io/mokuplan/)**

![The modeler showing a stool in the 3D view, with the object list, editable dimensions and cost summary in the side panel](docs/screenshots/main-window.png)

## What you can do

### See inside your construction

X-Ray mode makes every piece transparent, so you can check where dowels sit inside legs and aprons. Show Overlaps highlights pieces that intersect by accident.

![X-Ray view of a stool showing the dowels inside the legs and aprons](docs/screenshots/xray.png)

### Cut joints

Subtract one piece from another to carve notches and dowel holes. Here, two boards were cut into each other to make a cross-lap joint, and the upper board is lifted to show both notches.

![Two boards with matching notches for a cross-lap joint](docs/screenshots/cross-lap-joint.png)

### Take a plan into the workshop

File → Print Workshop Sheet creates a printable A4 sheet, or a PDF through your browser's print dialog. It has front, side, top and isometric views with overall dimensions, detail views of hidden parts (including dowels whose ends sit flush in a through hole), and a numbered parts list. Parts that need angled saw cuts also get a drawing: mitered boards as a profile with end angles, saw settings and top and bottom lengths, cut boards with a few angled cuts as an outline with a table of those cuts. Shapes with many angled edges, the kind you saw with a jigsaw, get a full-size template to print, spread over several sheets if needed. Holes drilled into such a part are marked in its drawing and template with their diameter and position, and with their depth and side where they do not go all the way through, such as half a hole in each of two glued-up layers.

The side panel groups the model by stock: every piece of stock gets a letter, such as "A · Strip 12×44×2000 mm", and opens to show the number of parts, the offcut and the parts cut from it, so a model with dozens of parts stays readable. Parts you split in the model stay on the piece of stock they were split from, with the offcut worked out from its length and the saw kerf. A part marked as bought ready-made, such as a dowel pin, is a piece of stock of its own size. All other parts are packed onto the lengths the stock is sold in, per cross-section. Strips of the same thickness are cut from one strip in the widest size.

You don't have to plan the shopping list while you model. Enter what you can buy in File → Stock Catalog: per cross-section the lengths and their prices, for example `12x50: 1000 = 2.10; 2000 = 3.90`. The catalog is kept in your browser for all projects and can be exported and imported. The plan then picks the cheapest mix of lengths. Without prices it buys the least wood. Where it cannot prove a plan optimal, the stock dialog says so. Without a catalog, stock is 2000 mm long (dowel rod 1000 mm).

File → Stock Material shows the shopping list: the total to buy with price and offcut at the top, then one line per kind of stock, such as "Strip 10 × 40 mm: 2 × 2000 mm, €6.40, offcut 1856 mm". Open a line to see its cutting plan to scale, the parts sawn from it with a "Sawn from" choice for each part size (automatic, its own size, or any stock it fits in), and how it is sold: name, lengths with prices, and kerf. Lengths from the catalog or the default show greyed out until you change them for this project; Reset goes back to them, and Save to catalog keeps them for all projects. One kerf field sets the kerf for all stock at once. **Find a cheaper plan** shows a better plan and what it changes before you apply it. It tries the catalog's cross-sections for parts that can be ripped from them, the catalog's lengths and prices for stock that has lengths of its own in the project (such as a file saved before the catalog had prices), and packing split parts freely instead of keeping them on the piece they were split from. Saving a project writes the catalog lengths it uses into the file, so it plans the same on another computer. Stock with a price counts that price in the cost summary.

The workshop sheet lists the stock to buy on page 1 with the same letters and prices, adds a "From stock" column to the parts list, and adds a cutting plan that shows every piece of stock to scale with its parts and the offcut. Parts bought ready-made have nothing to cut, so the cutting plan only lists them in one line at the end.

| Views with dimensions | Parts list |
| --- | --- |
| ![Workshop sheet with four dimensioned views of a stool](docs/screenshots/workshop-views.png) | ![Parts list with pictures, quantities and dimensions](docs/screenshots/workshop-parts.png) |

### Start from a template

The `+ Add` menu has metric stock parts such as battens, planks and dowel pins, and you can save your own. Assembly templates build a whole construction from a few parameters, like this Japanese lantern.

![Japanese lantern created from an assembly template](docs/screenshots/assembly-template.png)

### Plan your material and costs

- **Split with saw kerf:** divide a board or dowel into parts, with the material lost to each cut accounted for.
- **Know the price:** set a fixed or per-mm price for each piece and watch the total update.
- **Export a cut list:** download dimensions, notch counts and costs as CSV.

## Get started

1. Open the [live app](https://urfin78.github.io/mokuplan/), or download `index.html` and open it in a modern browser. It needs an internet connection to load Three.js.
2. Add pieces with `+ Add`.
3. Click a piece to edit its dimensions, position and rotation in the side panel, or drag it in the 3D view.
4. Save your project from the **File** menu. Less frequent actions such as Cut Joint and Split are in the **Tools** menu.

To explore a finished model, download [`examples/stool.woodmodel.json`](examples/stool.woodmodel.json) and open it with **Load** in the **File** menu. It is a four-legged stool with tapered legs, aprons and dowels. Turn on X-Ray to see the dowels inside.

## All features

<details>
<summary><strong>Shapes and editing</strong></summary>

- 8 shape types: Board, Frustum Board (trapezoidal), Pyramid Frustum (4-sided), Frame (outer frame with grid bars, for window frames, shoji or lattice), Dowel, Wedge, L-Bracket and Tapered Leg
- Edit dimensions, position, rotation and label in the side panel
- Optional miter angles on each board end face, for picture frames or rafter tops
- Snap mode with face contact, edge alignment and dowel axis snapping; falls back to a 10 mm grid
- Duplicate pieces
- Group several pieces so they move and snap as a unit; groups persist in save files
- Split a board or dowel by number of parts or by target length, with configurable saw kerf; split parts stay together as one piece of stock in the object list, the costs and the cutting plan
- Cut joints with CSG boolean subtraction
- Undo and redo

</details>

<details>
<summary><strong>View and measure</strong></summary>

- 3D view with orbit, pan and zoom
- X-Ray mode, 3D labels and overlap detection
- Two-click ruler with total distance and per-axis components; rulers can be deleted one at a time or all at once
- Auto-resizing grid that adapts to your model

</details>

<details>
<summary><strong>Templates</strong></summary>

- Built-in metric woodworking parts
- Custom templates stored in your browser, with JSON export and import
- Assembly templates that create a pre-grouped construction from a few parameters

</details>

<details>
<summary><strong>Costs and output</strong></summary>

- Fixed or per-mm prices, currency selector and live cost summary
- Save and load projects as `.woodmodel.json`
- Workshop sheet for printing or PDF; identical parts, including boards with swapped miter angles, are merged into one numbered row of the parts list, with drawings of miters and angled cuts and full-size templates for shapes
- Object list and cost summary grouped by piece of stock (A, B, …), collapsible; stock list, "From stock" column and to-scale cutting plan on the workshop sheet; split parts keep their source length and kerf for the offcut
- Stock catalog with lengths and prices per cross-section, kept in the browser, with JSON export and import (`.woodstock.json`); cutting plan with the cheapest mix of lengths, exact where it can be proven; stock dialog as a shopping list with per-stock cutting plan, "Sawn from" choice and length/price fields; Find a cheaper plan proposes catalog cross-sections, catalog lengths and prices instead of the project's, and repacking split parts
- Parts can be marked as bought ready-made, so they are not sawn from stock
- CSV cut list with dimensions, types, notch counts and costs
- PNG export of the current view

</details>

The UI is available in English and German. The language is detected from your browser and can be changed in the Settings menu. All dimensions are in millimeters.

## Controls

| Action | Input |
| --- | --- |
| Move a piece | Drag |
| Move a piece vertically | Shift+drag |
| Select several pieces | Ctrl+click |
| Duplicate | Ctrl+D |
| Undo / redo | Ctrl+Z / Ctrl+Shift+Z |
| Set the orbit pivot | Double-click a piece |
| Recenter on the model | Double-click empty space |
| Focus the selection | F |
| Cancel a ruler measurement | Esc |

## Your data

Projects are saved as files on your computer, and custom templates stay in your browser's local storage.

## Development

[![Schema validation](https://github.com/urfin78/mokuplan/actions/workflows/schema.yml/badge.svg?branch=main)](https://github.com/urfin78/mokuplan/actions/workflows/schema.yml) [![JS syntax](https://github.com/urfin78/mokuplan/actions/workflows/js-syntax.yml/badge.svg?branch=main)](https://github.com/urfin78/mokuplan/actions/workflows/js-syntax.yml) [![Playwright smoke](https://github.com/urfin78/mokuplan/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/urfin78/mokuplan/actions/workflows/playwright.yml) [![Consistency lint](https://github.com/urfin78/mokuplan/actions/workflows/consistency-lint.yml/badge.svg?branch=main)](https://github.com/urfin78/mokuplan/actions/workflows/consistency-lint.yml) [![Visual regression](https://github.com/urfin78/mokuplan/actions/workflows/visual-regression.yml/badge.svg?branch=main)](https://github.com/urfin78/mokuplan/actions/workflows/visual-regression.yml)

This project was fully created using [Claude Code](https://claude.ai/claude-code) by Anthropic.

The app is a single `index.html` with no build step, no framework and no local toolchain.

- [Three.js](https://threejs.org/) 0.187.0, loaded as an ES module via CDN and pinned with SRI hashes
- Inline CSG (Constructive Solid Geometry) implementation based on the Evan Wallace csg.js algorithm

### CI

Five GitHub Actions workflows run on every push to `main` and on pull requests:

- **Schema validation** — example files in `examples/` are validated against `woodmodel.schema.json` and `woodtemplates.schema.json` (`ajv-cli`).
- **JS syntax** — the inline module script in `index.html` is extracted and parsed with `node --check` so unbalanced brackets, stray commas, or broken string literals fail before they ever reach a browser.
- **Playwright smoke** — headless Chromium drives the app through a small set of smoke tests (every primitive can be added; CSG cut survives save/reload; language switch updates UI strings). The tests under `tests/` reach into the app via `window.__app`, a hook attached only when the page is loaded with `?__test=1`.
- **Consistency lint** — `.github/scripts/consistency-lint.mjs` parses `index.html`, `woodmodel.schema.json`, and `woodtemplates.schema.json` and verifies that translation keys are symmetric across all `SUPPORTED_LANGS`, that every `ADD_TYPES` entry has a matching `type.<Name>` translation, that every `nameKey` referenced in built-in templates and assemblies resolves in every language, that every static `data-i18n*` attribute resolves, and that every JSON-schema `type` enum (piece and CSG tool in `woodmodel.schema.json`, plus `woodtemplates.schema.json`) equals `ADD_TYPES` as a set.
- **Visual regression** — Playwright takes a canvas screenshot per default `ADD_TYPES` primitive plus one CSG-cut composition (`tests/visual.spec.js`) and compares against PNG baselines under `tests/visual.spec.js-snapshots/`. Baselines are regenerated via the manual **Update visual baselines** workflow (`workflow_dispatch`), which runs `playwright test --update-snapshots` and opens a PR with the new PNGs for review.

The README screenshots under `docs/screenshots/` are regenerated via the manual **Update README screenshots** workflow (`workflow_dispatch`), which runs `tests/readme-screenshots.spec.js` and opens a PR with the new PNGs.

Releases are cut by the manual **Auto Release** workflow (`workflow_dispatch`). It derives the version bump from commit subject lines since the last tag (`feat:` for minor, `type!:` or `BREAKING CHANGE` in the subject for major, anything else for patch), creates a GitHub Release, and deploys `index.html` to the `gh-pages` branch.

The CI tooling lives under [`.github/package.json`](.github/package.json) — kept inside `.github/` so it stays out of the application code. The app itself has no build dependencies.

## License

This project is licensed under the [MIT License](LICENSE).

The "Mokuplan" name and logo are not covered by the MIT license and may not be used to identify other products. The logo was created with Google Gemini (gemini-3-pro-image) and edited by hand.
