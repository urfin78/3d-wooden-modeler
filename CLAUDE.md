# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based 3D woodworking modeler — a single self-contained `index.html` file (~1600 lines) with no build tools, no frameworks, and no dependencies beyond Three.js r128 loaded via CDN.

## Development

No build step, no package manager, no tests. Open `index.html` directly in a browser to run. All HTML, CSS, and JavaScript live in a single file.

## Architecture

Everything runs inside a `window.addEventListener('load', ...)` closure in `index.html`. The code is organized into clearly delimited sections:

1. **CSG BSP-Tree** (~lines 193-411) — Constructive Solid Geometry implementation (Evan Wallace algorithm) for boolean subtraction between meshes. Key functions: `csgFromMesh`, `csgSubtract`.

2. **Three.js Scene Setup** (~lines 413-567) — Renderer, camera, inline minimal OrbitControls, lighting, ground plane.

3. **Application State** (~lines 569-594) — Global mutable state: `pieces[]` array, selection state, mode flags (snap, cut, overlap), undo/redo stacks.

4. **Shape Factory** (~lines 596-715) — `makeBoard`, `makeDowel`, `makeWedge`, `makeLBracket`, `makeTaperedLeg`. Each returns a Three.js Mesh with a `userData` object storing type and dimensions. `addPiece()` registers meshes into the scene and `pieces[]`.

5. **Label System** (~lines 720-778) — 3D sprite labels positioned above pieces using canvas-rendered textures.

6. **Selection & UI Binding** (~lines 780-917) — `selectPiece()` updates the side panel form fields from `mesh.userData`. Input change handlers write back to `userData` and call `rebuildGeometry()`.

7. **Geometry Rebuild** (~lines 946-987) — `rebuildGeometry(mesh)` recreates the mesh geometry from `userData` dimensions, preserving position/rotation. Critical path when dimensions change.

8. **Serialization & Undo** (~lines 1086-1183) — `serializeScene()`/`restoreScene()` convert full scene state to/from JSON. Undo/redo pushes serialized snapshots.

9. **Cut Joint Mode** (~lines 1190-1227) — Two-click workflow: select target, then tool piece. Calls `csgSubtract` and records notch info in `userData.notches`.

10. **Overlap Detection** (~lines 1235-1280) — Bounding-box intersection checks between all piece pairs.

11. **Mouse/Keyboard Interaction** (~lines 1342-1520) — Raycasting for piece selection, drag-move (with snap support), keyboard shortcuts.

## Key Conventions

- Piece metadata lives in `mesh.userData` (type, dimensions, label, notches array).
- All dimensions are in millimeters.
- State mutations should be preceded by `pushUndo()` for undo support.
- The `pieces[]` array is the source of truth for all scene objects.
- When changing piece dimensions, always call `rebuildGeometry()` to recreate the mesh geometry.
