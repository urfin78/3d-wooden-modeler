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

12. **Split Piece** — `splitSelected()` divides a Board or Dowel into parts along a chosen axis, subtracting kerf (saw blade thickness in mm). Two modes: "by number of parts" (equal-length pieces, kerf taken from each) or "by part length" (fixed target length, max pieces that fit). In length mode, an optional "Keep leftover as extra piece" checkbox preserves the remainder as a separate piece (costs one additional kerf for the separating cut). Kerf default is 3 mm; mode, kerf, and leftover preference persist in `localStorage` (`woodmodeler.splitKerf`, `woodmodeler.splitMode`, `woodmodeler.splitKeepLeftover`). For fixed-price pieces, all split parts form a **source group**: each part gets `userData.sourceId` (shared UUID), `userData.sourcePrice` (original board price), `userData.sourcePriceMode`, and `userData.sourceLabel`; `userData.price` is set to 0. The group cost is counted once in the cost summary and CSV, not per piece. Per-mm prices are preserved per piece (cost is length-proportional). Pieces are laid out starting from the original's left edge (cut axis), keeping the original position/rotation. Not available for CSG-modified pieces.

13. **Overlap Detection** — Bounding-box intersection checks between all piece pairs.

14. **Ruler** — Two-click distance measurement on piece surfaces. `enterRulerMode()`/`exitRulerMode()` toggle the mode; clicks raycast against `pieces[]` and use the hit point. `addRuler(p1, p2)` creates a `THREE.Line` plus a sprite label showing total distance and per-axis components (|dx|, |dy|, |dz|). Snaps to corners and edges of all visible pieces (continuous edge projection via `closestPointsTwoLines` between camera ray and edge segment, clamped); Shift enables angle snap to 3 axes and 6 in-plane 45° diagonals (`ANGLE_SNAP_DIRS`, `snapAngle`). Snap indicator (yellow corner / cyan edge) and dashed preview line are lazy-created. Measurements are persistent (stored in `rulers[]`), serialized in save/load and undo/redo, and cleared via "Clear Rulers" or `clearAll()`. ESC cancels an in-progress measurement or exits the mode. Hint banner (`#ruler-hint`) shows current step. Individual rulers can be deleted by clicking their label outside ruler mode: `pickRulerSpriteAt(e)` raycasts against ruler sprites in the mouseup handler; on hit, `confirm(t('ruler.deleteConfirm'))` prompts the user, then `pushUndo()` + `removeRulerAt(index)` removes the single ruler.

15. **X-Ray Mode** — `xrayMode` toggle makes all non-selected pieces translucent (`opacity = XRAY_OPACITY`, `depthWrite = false`) so pieces hidden inside others (e.g. dowels in boards) become visible. The currently selected piece stays fully opaque. `applyXray(mesh)` is called whenever a mesh enters the scene (addPiece, restoreScene, split) or when selection changes.

16. **Grouping** — `THREE.Group` is used as the container (no reimplementation). Toolbar Group/Ungroup buttons. Multi-select via Ctrl+click (builds `multiSelected` Set); `createGroup()` centers a new Group, reparents the selected pieces as children, and assigns `userData.groupId` to each. `ungroup()` reparents children back to the scene preserving world transforms. Clicking any piece in a group selects the whole group; dragging moves the group as a unit. Snap (`faceSnapXZ`/`faceSnapY`) excludes the dragged group's own children and force-updates descendant matrices so Box3 checks are correct. Snap indicator only flashes on the no-snap → snap transition. `splitSelected` and `duplicateSelected` use world transforms so operations on grouped pieces keep positions correct; split parts re-attach to the same group. `serializeScene`/`restoreScene` persist `groups[]` (gId + transform) alongside `groupId` on each piece; `restoreMesh` always sets `userData.type` so CSG-modified pieces survive load/save cycles.

17. **Template Export/Import** — Custom templates (in `localStorage`) can be exported to a `.woodtemplates.json` file and imported back; used for sharing template libraries between installations.

18. **Cost Calculator** — Per-piece `userData.price` and `userData.priceMode` (fixed/per_mm). `updateCostSummary()` renders live totals in sidebar; grouped (split) pieces show their source board cost once under a group header. `exportCSV()` includes a `sourceGroup` column. Currency persisted in `localStorage`.

19. **Mouse/Keyboard Interaction** — Raycasting for piece selection, drag-move (with snap support), keyboard shortcuts. Delete key is suppressed when an input is focused.

20. **i18n / Translations** — Dict-based localization (no framework). `translations` holds per-language key→string maps (currently `en` and `de`); `t(key, params)` looks up strings with `{var}` interpolation and falls back to English if a key is missing. `typeName(type)` resolves piece-type keys (`type.Board`, `type.Dowel`, etc.). Static HTML uses `data-i18n`, `data-i18n-placeholder`, `data-i18n-title` attributes; `applyTranslations()` walks the DOM and populates them. Dynamic DOM (object list, size summary, cost total, split modal previews, toolbar toggles) calls `t()` directly. `refreshDynamicUI()` re-renders state-dependent text on language change. Language persists in `localStorage` under `woodmodeler.lang`; initial language comes from storage or `navigator.language`. Adding a language: add an entry to `translations` with the same key set, append the code to `SUPPORTED_LANGS`, add an `<option>` to `#lang-select`.

## Key Conventions

- Piece metadata lives in `mesh.userData` (type, dimensions, label, notches, price, priceMode). `userData.type` values are fixed English identifiers (`'Board'`, `'Dowel'`, `'Wedge'`, `'L-Bracket'`, `'Tapered Leg'`) — translations are applied only at the display layer via `typeName()`.
- All dimensions are in millimeters.
- State mutations should be preceded by `pushUndo()` for undo support.
- The `pieces[]` array is the source of truth for all scene objects.
- When changing piece dimensions, always call `rebuildGeometry()` to recreate the mesh geometry.
- Call `updateGrid()` after any operation that changes piece positions or dimensions.
- User-facing strings must go through `t()` / `typeName()`, never hardcoded. When adding a new string, add the key to every language in `translations`.

## Git Repo Conventions
- add a commit including message for changes
- work on feature branches, not directly on main
- merge to main via pull requests only (main branch is protected)
- when adding features or making changes, update both CLAUDE.md and README.md to reflect the current state
