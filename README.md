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
- **CSG boolean subtraction** (Cut Joint) to carve joints and holes between pieces
- **Snap mode** for aligning pieces to a 10mm grid
- **Labels** displayed as 3D sprites above each piece
- **Overlap detection** to highlight intersecting pieces
- **Undo/Redo** support (Ctrl+Z / Ctrl+Shift+Z)
- **Auto-resizing grid** that adapts to the size of your model
- **Template library** with built-in metric woodworking parts and custom templates (stored in localStorage), integrated into toolbar dropdowns
- **Save/Load** models as `.woodmodel.json` files for persistent projects
- **Cost calculator** with per-piece pricing (fixed or per-mm), currency selector, and live cost summary
- **CSV export** of a cut list with dimensions, types, notch counts, and costs

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
