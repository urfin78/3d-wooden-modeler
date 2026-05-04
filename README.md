# 3D Wooden Modeler

[![Schema validation](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/schema.yml/badge.svg?branch=main)](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/schema.yml) [![JS syntax](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/js-syntax.yml/badge.svg?branch=main)](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/js-syntax.yml) [![Playwright smoke](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/playwright.yml) [![Consistency lint](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/consistency-lint.yml/badge.svg?branch=main)](https://github.com/urfin78/3d-wooden-modeler/actions/workflows/consistency-lint.yml)

> This project was fully created using [Claude Code](https://claude.ai/claude-code) by Anthropic.

**[Try it live](https://urfin78.github.io/3d-wooden-modeler/)** — no installation required, runs entirely in the browser.

A browser-based 3D woodworking modeller for planning and visualizing wooden constructions. Built as a single self-contained HTML file with no build tools, no frameworks, and no dependencies.

## Features

- **8 shape types**: Board, Frustum Board (trapezoidal), Pyramid Frustum (4-sided), Frame (parametric outer frame with grid bars — for window frames, shoji, lattice), Dowel, Wedge, L-Bracket, and Tapered Leg
- **Interactive 3D viewport** with orbit controls (pan, rotate, zoom); double-click a piece to set the orbit pivot, double-click empty space to recenter on the whole model, or press `F` to focus the current selection
- **Real-time editing** of dimensions, position, and rotation via the side panel; Boards additionally support optional **miter angles** on each end face (e.g. for picture frames or rafter tops)
- **Drag-to-move** pieces directly in the viewport (Shift+drag for vertical movement)
- **Duplicate** selected piece via the floating action bar or Ctrl+D
- **Split** a board or dowel — either by number of parts (equal-length) or by target part length (max pieces that fit, with optional leftover kept as extra piece) — with configurable saw kerf (blade thickness) so material lost to each cut is accounted for; split parts are visually grouped in the object list and cost summary (one board purchase = one cost entry)
- **CSG boolean subtraction** (Cut Joint) to carve joints and holes between pieces
- **Snap mode** with face-to-face contact, coplanar edge alignment, and dowel center-axis snapping; falls back to a 10mm grid
- **X-Ray mode** to see through pieces and locate objects inside others (e.g. dowels)
- **Grouping** — Ctrl+click to multi-select, then Group from the floating action bar (Ungroup from the side panel); groups move and snap as a unit and persist in save files
- **Labels** displayed as 3D sprites above each piece
- **Overlap detection** to highlight intersecting pieces
- **Ruler** — two-click measurement on piece surfaces, with a persistent line and label showing total distance and per-axis components (|dx|, |dy|, |dz|); ESC cancels, "Clear Rulers" removes all measurements, and clicking a ruler's label outside ruler mode deletes that single ruler (with confirmation, undoable)
- **Undo/Redo** support (Ctrl+Z / Ctrl+Shift+Z)
- **Auto-resizing grid** that adapts to the size of your model
- **Template library** with built-in metric woodworking parts and custom templates (stored in localStorage), integrated into the toolbar's `+ Add` mega-dropdown; custom templates can be exported/imported as JSON
- **Assembly templates** — parameterised compositions (e.g. a complete Japanese lantern) that spawn multiple pieces as a pre-grouped Group. A modal prompts for parameters before inserting
- **Save/Load** models as `.woodmodel.json` files for persistent projects
- **Cost calculator** with per-piece pricing (fixed or per-mm), currency selector, and live cost summary
- **CSV export** of a cut list with dimensions, types, notch counts, and costs
- **Multi-language UI** — English and German, switchable from the Settings (gear) menu in the toolbar; language is auto-detected from the browser and persisted

## Usage

1. Open `index.html` in any modern browser
2. Use the toolbar's `+ Add` menu to add pieces — choose from defaults or library templates, grouped by piece type
3. Toggle modes (Snap, Labels, X-Ray, Ruler) via the icon buttons in the toolbar
4. Less frequent actions (Cut Joint, Split, Show Overlaps, Clear Rulers, Clear All) live in the **Tools** menu; file actions (Save/Load, Export CSV, Import/Export Templates) live in the **File** menu
5. Click a piece to select it and edit its dimensions, position, rotation, and label in the side panel; per-selection actions (Duplicate, Group, Delete) appear in a floating action bar
6. Drag pieces to reposition them (Shift+drag for vertical movement)
7. Use **Cut Joint** (Tools menu) to carve one piece into another (e.g., drill a dowel hole into a board)
8. Use **Show Overlaps** (Tools menu) to check for unintended intersections
9. Set prices per piece and check the **Cost Summary** in the side panel
10. **Save** your model and **Load** it later (File menu) to continue working
11. Export your cut list as CSV when done (File menu)

### Example model

Load [`examples/stool.woodmodel.json`](examples/stool.woodmodel.json) via **Load** to see a small four-legged stool with a realistic joint layout: four tapered legs, four aprons running between the legs at the top to stiffen the frame, eight horizontal dowels joining each apron end to its leg, and four vertical dowels fixing the seat to the leg tops. Exercises Boards, Tapered Legs, Dowels, grouping (one leg + its seat dowel share `g1`), a source group (the four aprons share one stock board), mixed per-mm and fixed pricing, labels, and a ruler measuring the seat height. Use **X-Ray** to see the dowels embedded inside the legs and aprons.

## Tech Stack

- [Three.js](https://threejs.org/) r128 (loaded via CDN)
- Inline CSG (Constructive Solid Geometry) implementation based on the Evan Wallace csg.js algorithm
- Everything in a single `index.html` file -- HTML, CSS, and JavaScript

## CI

Four GitHub Actions workflows run on every push to `main` and on pull requests:

- **Schema validation** — example files in `examples/` are validated against `woodmodel.schema.json` and `woodtemplates.schema.json` (`ajv-cli`).
- **JS syntax** — the inline `<script>` block in `index.html` is extracted and parsed with `node --check` so unbalanced brackets, stray commas, or broken string literals fail before they ever reach a browser.
- **Playwright smoke** — headless Chromium drives the app through a small set of smoke tests (every primitive can be added; CSG cut survives save/reload; language switch updates UI strings). The tests under `tests/` reach into the app via `window.__app`, a hook attached only when the page is loaded with `?__test=1`.
- **Consistency lint** — `.github/scripts/consistency-lint.mjs` parses `index.html` and `woodmodel.schema.json` and verifies that translation keys are symmetric across all `SUPPORTED_LANGS`, that every `ADD_TYPES` entry has a matching `type.<Name>` translation, that every `nameKey` referenced in built-in templates and assemblies resolves in every language, that every static `data-i18n*` attribute resolves, and that the JSON-schema `type` discriminator equals `ADD_TYPES` as a set.

The CI tooling lives under [`.github/package.json`](.github/package.json) — kept inside `.github/` so it stays out of the application code. The app itself has no build dependencies.

## License

This project is licensed under the [MIT License](LICENSE).
