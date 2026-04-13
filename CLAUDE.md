# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based 3D woodworking modeler — a single self-contained `index.html` file with no build tools, no frameworks, and no dependencies beyond Three.js r128 loaded via CDN.

## Development

No build step, no package manager, no tests. Open `index.html` directly in a browser to run. All HTML, CSS, and JavaScript live in a single file.

## Architecture

Everything runs inside a `window.addEventListener('load', ...)` closure in `index.html`. The code is organized into clearly delimited sections:

1. **CSG BSP-Tree** — Constructive Solid Geometry implementation (Evan Wallace algorithm) for boolean subtraction between meshes. Key functions: `csgFromMesh`, `csgSubtract`.

2. **Three.js Scene Setup** — Renderer, camera, inline minimal OrbitControls, lighting, ground plane, auto-resizing grid (`updateGrid()`).

3. **Application State** — Global mutable state: `pieces[]` array, selection state, mode flags (snap, cut, overlap), undo/redo stacks.

4. **Shape Factory** — `makeBoard`, `makeDowel`, `makeWedge`, `makeLBracket`, `makeTaperedLeg`. Each returns a Three.js Mesh with a `userData` object storing type and dimensions. `addPiece()` registers meshes into the scene and `pieces[]`.

5. **Label System** — 3D sprite labels positioned above pieces using canvas-rendered textures.

6. **Selection & UI Binding** — `selectPiece()` updates the side panel form fields from `mesh.userData`. Input change handlers write back to `userData` and call `rebuildGeometry()`.

7. **Geometry Rebuild** — `rebuildGeometry(mesh)` recreates the mesh geometry from `userData` dimensions, preserving position/rotation. Critical path when dimensions change.

8. **Serialization & Undo** — `serializeScene()`/`restoreScene()` convert full scene state to/from JSON. Undo/redo pushes serialized snapshots.

9. **Save & Load** — `saveModel()` wraps serialized scene with metadata and triggers `.woodmodel.json` download. `loadModel()` reads the file and calls `restoreScene()`.

10. **Template Library** — Built-in metric templates + custom templates stored in `localStorage`. Integrated into toolbar add-piece dropdowns grouped by type.

11. **Cut Joint Mode** — Two-click workflow: select target, then tool piece. Calls `csgSubtract` and records notch info in `userData.notches`.

12. **Overlap Detection** — Bounding-box intersection checks between all piece pairs.

13. **Cost Calculator** — Per-piece `userData.price` and `userData.priceMode` (fixed/per_mm). `updateCostSummary()` renders live totals in sidebar. Currency persisted in `localStorage`. CSV export includes cost columns.

14. **Mouse/Keyboard Interaction** — Raycasting for piece selection, drag-move (with snap support), keyboard shortcuts. Delete key is suppressed when an input is focused.

## Key Conventions

- Piece metadata lives in `mesh.userData` (type, dimensions, label, notches, price, priceMode).
- All dimensions are in millimeters.
- State mutations should be preceded by `pushUndo()` for undo support.
- The `pieces[]` array is the source of truth for all scene objects.
- When changing piece dimensions, always call `rebuildGeometry()` to recreate the mesh geometry.
- Call `updateGrid()` after any operation that changes piece positions or dimensions.

## Git Repo Conventions
- add a commit including message for changes
- work on feature branches, not directly on main
- merge to main via pull requests only (main branch is protected)
- when adding features or making changes, update both CLAUDE.md and README.md to reflect the current state
