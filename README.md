# 3D Wooden Modeler

> This project was fully created using [Claude Code](https://claude.ai/claude-code) by Anthropic.

**[Try it live](https://urfin78.github.io/3d-wooden-modeler/)** — no installation required, runs entirely in the browser.

A browser-based 3D woodworking modeller for planning and visualizing wooden constructions. Built as a single self-contained HTML file with no build tools, no frameworks, and no dependencies.

## Features

- **5 shape types**: Board, Dowel, Wedge, L-Bracket, and Tapered Leg
- **Interactive 3D viewport** with orbit controls (pan, rotate, zoom)
- **Real-time editing** of dimensions, position, and rotation via the side panel
- **Drag-to-move** pieces directly in the viewport (Shift+drag for vertical movement)
- **Duplicate** selected piece via toolbar button or Ctrl+D
- **Split** a board or dowel — either by number of parts (equal-length) or by target part length (max pieces that fit, with optional leftover kept as extra piece) — with configurable saw kerf (blade thickness) so material lost to each cut is accounted for; split parts are visually grouped in the object list and cost summary (one board purchase = one cost entry)
- **CSG boolean subtraction** (Cut Joint) to carve joints and holes between pieces
- **Snap mode** with face-to-face contact, coplanar edge alignment, and dowel center-axis snapping; falls back to a 10mm grid
- **X-Ray mode** to see through pieces and locate objects inside others (e.g. dowels)
- **Grouping** — Ctrl+click to multi-select, then Group/Ungroup from the toolbar; groups move and snap as a unit and persist in save files
- **Labels** displayed as 3D sprites above each piece
- **Overlap detection** to highlight intersecting pieces
- **Ruler** — two-click measurement on piece surfaces, with a persistent line and label showing total distance and per-axis components (|dx|, |dy|, |dz|); ESC cancels, "Clear Rulers" removes all measurements, and clicking a ruler's label outside ruler mode deletes that single ruler (with confirmation, undoable)
- **Undo/Redo** support (Ctrl+Z / Ctrl+Shift+Z)
- **Auto-resizing grid** that adapts to the size of your model
- **Template library** with built-in metric woodworking parts and custom templates (stored in localStorage), integrated into toolbar dropdowns; custom templates can be exported/imported as JSON
- **Save/Load** models as `.woodmodel.json` files for persistent projects
- **Cost calculator** with per-piece pricing (fixed or per-mm), currency selector, and live cost summary
- **CSV export** of a cut list with dimensions, types, notch counts, and costs
- **Multi-language UI** — English and German, switchable from the toolbar; language is auto-detected from the browser and persisted

## Usage

1. Open `index.html` in any modern browser
2. Use the toolbar dropdowns to add pieces — choose from defaults or library templates
3. Click a piece to select it and edit its dimensions, position, rotation, and label in the side panel
4. Drag pieces to reposition them (Shift+drag for vertical movement)
5. Use **Cut Joint** to carve one piece into another (e.g., drill a dowel hole into a board)
6. Use **Show Overlaps** to check for unintended intersections
7. Set prices per piece and check the **Cost Summary** for budgeting
8. **Save** your model and **Load** it later to continue working
9. Export your cut list as CSV when done

## Tech Stack

- [Three.js](https://threejs.org/) r128 (loaded via CDN)
- Inline CSG (Constructive Solid Geometry) implementation based on the Evan Wallace csg.js algorithm
- Everything in a single `index.html` file -- HTML, CSS, and JavaScript

## License

This project is licensed under the [MIT License](LICENSE).
