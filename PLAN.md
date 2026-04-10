# 3D Woodworking Modeller — Implementation Plan

## Context
Build a single self-contained HTML file (`index.html`) that provides a 3D woodworking modeller using Three.js r128. The user needs to create, position, rotate, and boolean-subtract wooden pieces, then export a cut list. No existing codebase — greenfield project.

## File
- `index.html` — single file, everything inline

## Architecture (inside one `<script>` block)

All code lives inside `window.addEventListener('load', function() { ... })`. Uses `var` throughout. No ES modules, no `onclick` attributes.

### 1. HTML/CSS Structure (~150 lines)
- **Toolbar** (top bar): buttons for Add Board/Dowel/Wedge/L-bracket/Tapered Leg, Snap toggle, Labels toggle, Cut Joint, Show Overlaps, Undo, Redo, Delete, Clear All, Export CSV
- **Side panel** (right, ~280px): dimension inputs (contextual per shape type), position XYZ, rotation XYZ, label text field, size summary div
- **Viewport** (remaining space): Three.js canvas via renderer
- CSS: flexbox layout, dark toolbar, light panel, wood-themed accents

### 2. Three.js Scene Setup (~50 lines)
- WebGLRenderer with shadows enabled
- PerspectiveCamera, OrbitControls (from Three.js examples CDN)
- GridHelper on floor (1000mm, 10mm divisions)
- DirectionalLight with shadow map + AmbientLight
- Raycaster for click-to-select

### 3. Shape Factory Functions (~120 lines)
Each returns a THREE.Mesh with custom `userData` storing type, dimensions, label, notchCount:
- **Board**: `BoxGeometry(w, h, d)`
- **Dowel**: `CylinderGeometry(r, r, h, 32)`
- **Wedge**: `ExtrudeGeometry` from triangular `Shape`
- **L-bracket**: `ExtrudeGeometry` from L-shaped `Shape`
- **Tapered leg**: `CylinderGeometry(rTop, rBottom, h, 32)`

All use `MeshStandardMaterial({ color: 0xc8934a })`.

### 4. Selection & Side Panel Binding (~100 lines)
- Click raycasts to select; selected piece gets color `#e8a030`
- Side panel populates from `mesh.userData`; inputs update mesh in real-time
- Dimension changes rebuild geometry (dispose old, create new)
- Position/rotation inputs update `mesh.position` / `mesh.rotation` (degrees→radians)
- Size summary: shows dimensions in mm + notch count

### 5. Snap Mode (~30 lines)
- Global toggle. When ON, position input values snap to nearest 10mm on change
- Flash a brief CSS indicator only when the snapped value differs from typed value

### 6. Labels (~40 lines)
- Per-piece `THREE.Sprite` with `CanvasTexture` showing label text
- Positioned above each mesh's bounding box
- Global toggle shows/hides all label sprites
- Update sprite when label text changes

### 7. CSG Boolean Subtraction — Inline BSP (~350 lines)
Implement the Evan Wallace csg.js algorithm directly:
- **CSG.Vertex**: position (Vector3) + normal (Vector3)
- **CSG.Polygon**: array of vertices + plane + shared material data
- **CSG.Plane**: normal + w, `splitPolygon()` classifies/splits vertices (COPLANAR/FRONT/BACK/SPANNING)
- **CSG.Node**: BSP tree node with `build()`, `clipPolygons()`, `clipTo()`, `allPolygons()`, `invert()`
- **CSG.fromMesh(mesh)**: extract world-space triangles from BufferGeometry (handles indexed and non-indexed), create Polygons
- **CSG.subtract(meshA, meshB)**: `a.clipTo(b); b.clipTo(a); b.invert(); b.clipTo(a); b.invert(); a.build(b.allPolygons()); return a.allPolygons()`
- **CSG.toMesh(polygons, matrix, material)**: convert polygons back to BufferGeometry, apply inverse of target's world matrix to get local coords

Key detail: cylindrical geometry has 32 segments, producing enough triangles for the BSP to carve round holes.

### 8. Cut Joint Mode (~60 lines)
- Toggle button enters 2-click mode
- Click 1: select piece to cut INTO → highlight blue (`#4488ff`)
- Click 2: select intersecting piece (the cutter) → highlight green (`#44ff88`)
- Run CSG subtract, replace target mesh geometry with result
- Increment notch count on the cut piece
- Push undo snapshot, exit cut mode

### 9. Overlap Detection (~50 lines)
- For each pair of meshes, check bounding box intersection (`Box3.intersectsBox`)
- Highlight overlapping pieces red (`#ff4444`)
- List overlapping pairs in the side panel
- Clear highlights when toggled off or selection changes

### 10. Undo/Redo (~80 lines)
- Snapshot stack (max 10): serialize entire scene state (all pieces' type, dimensions, positions, rotations, labels, notch counts, and geometry vertices for CSG-modified pieces)
- Push snapshot before every mutating action (add/delete/move/rotate/cut/resize)
- Undo pops and restores; redo re-applies
- Keyboard: Ctrl+Z (undo), Ctrl+Shift+Z (redo)

### 11. Delete & Clear (~20 lines)
- Delete: remove selected mesh + its label sprite from scene
- Clear All: remove all pieces after confirmation

### 12. CSV Export (~40 lines)
- Columns: Part, Type, Label, W, H, D, Dia, Notches
- Part = sequential number
- Dia filled for Dowel/Tapered Leg, W/H/D for others
- Trigger browser download of `.csv` file

## Estimated Total: ~1100 lines of JS + ~150 lines HTML/CSS

## External Dependencies (CDN)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```
OrbitControls will be inlined or loaded from the Three.js examples CDN path for r128.

## Verification
1. Open `index.html` in a browser
2. Add one of each shape type — verify they appear on the grid with correct geometry
3. Select a piece — verify side panel shows correct inputs, editing updates the 3D view
4. Toggle snap — type 13 in position X, verify it snaps to 10
5. Toggle labels — verify text appears above pieces
6. Place a dowel intersecting a board → Cut Joint → verify round hole appears in the board
7. Show Overlaps with two intersecting pieces → verify red highlight + panel list
8. Undo/Redo through several operations, verify Ctrl+Z/Ctrl+Shift+Z
9. Export CSV → open file, verify columns and data
