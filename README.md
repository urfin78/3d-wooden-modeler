# 3D Wooden Modeler

> This project was fully created using [Claude Code](https://claude.ai/claude-code) by Anthropic.

A browser-based 3D woodworking modeller for planning and visualizing wooden constructions. Built as a single self-contained HTML file with no build tools, no frameworks, and no installation required -- just open `index.html` in your browser.

## Features

- **5 shape types**: Board, Dowel, Wedge, L-Bracket, and Tapered Leg
- **Interactive 3D viewport** with orbit controls (pan, rotate, zoom)
- **Real-time editing** of dimensions, position, and rotation via the side panel
- **CSG boolean subtraction** (Cut Joint) to carve joints and holes between pieces
- **Snap mode** for aligning pieces to a 10mm grid
- **Labels** displayed as 3D sprites above each piece
- **Overlap detection** to highlight intersecting pieces
- **Undo/Redo** support (including Ctrl+Z / Ctrl+Shift+Z)
- **CSV export** of a cut list with dimensions, types, and notch counts

## Usage

1. Open `index.html` in any modern browser
2. Use the toolbar to add pieces (boards, dowels, wedges, etc.)
3. Click a piece to select it and edit its dimensions, position, rotation, and label in the side panel
4. Use **Cut Joint** to carve one piece into another (e.g., drill a dowel hole into a board)
5. Use **Show Overlaps** to check for unintended intersections
6. Export your cut list as CSV when done

## Tech Stack

- [Three.js](https://threejs.org/) r128 (loaded via CDN)
- Inline CSG (Constructive Solid Geometry) implementation based on the Evan Wallace csg.js algorithm
- Everything in a single `index.html` file -- HTML, CSS, and JavaScript

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

