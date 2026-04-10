# Plan: Mouse Drag to Move Objects

## Context
Currently objects can only be repositioned via the side panel number inputs. The user wants to drag objects directly in the 3D viewport with the mouse for a more intuitive workflow.

## File
- `index.html`

## Interaction Design

- **Left-click + drag on a piece** = move it along the ground plane (XZ). OrbitControls is disabled during the drag.
- **Left-click + drag on empty space** = orbit camera (current behavior, unchanged)
- **Left-click without drag** = select piece (current behavior, unchanged)
- **Shift + left-click + drag on a piece** = move it vertically (Y axis only)
- Snap mode applies during drag if enabled
- Undo snapshot pushed on drag start (once), not per frame

## Implementation (~60 lines of new/modified JS)

### 1. New state variables
```
var dragMode = false;       // currently dragging an object
var dragPiece = null;       // the mesh being dragged
var dragPlane = new THREE.Plane();  // invisible plane for raycasting mouse position
var dragOffset = new THREE.Vector3(); // offset from piece origin to click point
var dragStarted = false;    // has the drag actually moved (vs just a click)
```

### 2. Modify `mousedown` handler (line ~1349)
After detecting left-click, raycast against pieces. If a piece is hit:
- Set `dragPiece = hit`, `dragMode = true`, `dragStarted = false`
- Compute a drag plane: for XZ movement, use `Plane(Vector3(0,1,0), -hit.position.y)`; for Shift+drag (Y movement), use a plane facing the camera
- Compute `dragOffset` = intersection point on plane minus piece position
- Disable OrbitControls (`controls._enabled = false`)
- Push undo snapshot

If no piece is hit, let OrbitControls handle it (current behavior).

### 3. Modify `mousemove` handler (line ~1355)
If `dragMode && dragPiece`:
- Set `dragStarted = true` (so mouseup knows it was a drag, not a click)
- Raycast mouse against `dragPlane`
- New position = intersection point minus `dragOffset`
- If shift held: only update Y; otherwise only update X and Z
- If snap enabled: round to nearest 10mm, flash indicator if value changed
- Update `dragPiece.position`, update side panel inputs if this piece is selected, update label position
- Prevent the existing `isDragging = true` logic from interfering

### 4. Modify `mouseup` handler (line ~1361)
If `dragMode`:
- Re-enable OrbitControls (`controls._enabled = true`)
- Reset `dragMode = false`, `dragPiece = null`
- If `dragStarted`: update side panel position inputs, skip the click-to-select logic
- If not `dragStarted`: fall through to existing click-to-select behavior

### 5. Add "Move" toolbar button (optional visual indicator)
Add a toolbar button or cursor change to indicate drag mode is available. Actually — since drag is always available (no mode toggle needed), just change the cursor to `grab`/`grabbing` when hovering/dragging a piece.

### 6. CSS cursor changes
- On `mousemove` without button: raycast to check hover over pieces, set `cursor: grab` if hovering
- During drag: set `cursor: grabbing`
- Otherwise: default cursor

## Key integration points
- OrbitControls has `_enabled` property (line 450) — set to false during drag
- `isDragging` flag (line 1346) — reuse to distinguish drag from click
- `selectPiece()` — call it at drag start so the panel shows the dragged piece
- `updateLabelPosition()` — call during drag if labels visible
- `pushUndo()` — call once at drag start, not per mousemove
- Snap: reuse existing `snapValue()` and `flashSnap()` functions

## Verification
1. Click a piece and drag — it slides on the XZ ground plane
2. Shift+drag — it moves vertically (Y only)
3. Release — position inputs in side panel reflect final position
4. Click without dragging — still selects the piece as before
5. Drag on empty space — orbits camera as before
6. Toggle snap ON, drag a piece — snaps to 10mm grid, indicator flashes
7. Ctrl+Z after drag — reverts to pre-drag position
