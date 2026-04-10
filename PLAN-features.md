# Feature Plan: Save/Load, Templates Library, Cost Calculator

## Context
Three new features to turn the modeller from a single-session tool into a reusable workshop planner: persistent models, a reusable parts library, and cost estimation.

## File
- `index.html`

---

## Feature 1: Save & Load Models

### What
Save the entire scene to a JSON file and reload it later. All piece data, positions, rotations, labels, notch counts, and CSG-modified geometry are preserved.

### Implementation

**Toolbar additions:**
- "Save" button — serializes scene and triggers `.json` file download
- "Load" button — hidden `<input type="file">` that reads a `.json` file and restores the scene

**Save format** (`.woodmodel.json`):
```json
{
    "version": 1,
    "name": "My Project",
    "created": "2026-04-10T...",
    "pieces": [
        {
            "type": "Board",
            "id": 1,
            "label": "Shelf",
            "w": 400, "h": 20, "d": 200,
            "px": 0, "py": 10, "pz": 0,
            "rx": 0, "ry": 0, "rz": 0,
            "notches": 2,
            "csgModified": true,
            "geoPositions": [...],
            "geoNormals": [...]
        }
    ]
}
```

**Reuse:** The existing `serializeScene()` / `restoreScene()` functions (used by undo/redo) already do 90% of this work. Save wraps `serializeScene()` output with metadata and triggers download. Load reads the file, parses JSON, and calls `restoreScene()`.

**Additional UI:**
- Project name input in a small modal/prompt on save
- On load, show confirmation if scene is not empty ("Replace current model?")

**Estimate:** ~40 lines new JS, 2 new toolbar buttons

---

## Feature 2: Template Library

### What
A library panel with predefined part templates — common woodworking pieces with standard dimensions. Users can click to add a template to the scene, then customize dimensions as needed. Users can also save their own objects as custom templates.

### Implementation

**Built-in templates** (stored as a JS array):
```js
var templates = [
    { name: "2x4 Stud", type: "Board", w: 89, h: 38, d: 2438 },
    { name: "2x6 Plank", type: "Board", w: 140, h: 38, d: 2438 },
    { name: "1x4 Board", type: "Board", w: 89, h: 19, d: 2438 },
    { name: "Shelf Board", type: "Board", w: 300, h: 18, d: 600 },
    { name: "6mm Dowel Pin", type: "Dowel", r: 3, h: 30 },
    { name: "8mm Dowel Pin", type: "Dowel", r: 4, h: 35 },
    { name: "10mm Dowel Rod", type: "Dowel", r: 5, h: 300 },
    { name: "Corner Brace", type: "L-Bracket", w: 50, h: 50, d: 20 },
    { name: "Table Leg", type: "Tapered Leg", rTop: 20, rBottom: 30, h: 720 },
    { name: "Door Wedge", type: "Wedge", w: 80, h: 30, d: 40 }
];
```

**Custom templates:**
- "Save as Template" button in side panel (when a piece is selected)
- Saves current piece's type + dimensions + label to `localStorage` under key `woodmodeler_templates`
- Custom templates appear in library below built-ins, with a delete button

**UI — Library panel:**
- New collapsible section at bottom of side panel: "Parts Library"
- List of template names grouped by category (Built-in / Custom)
- Click a template → adds it to scene at origin with those dimensions
- Search/filter input at top of library list

**Estimate:** ~100 lines new JS, ~30 lines HTML/CSS

---

## Feature 3: Cost Calculator

### What
Assign a price per unit to objects or templates, then see a running total cost for the entire model. Useful for budgeting a project.

### Implementation

**Price field on each piece:**
- New `userData.price` field (default: 0)
- New input in side panel: "Unit Price" (number input, appears below label field)
- For templates, price is stored as part of the template definition

**Price modes** (per piece `userData.priceMode`):
- `"fixed"` — flat price per piece (default)
- `"per_mm"` — price per mm of height/length (useful for lumber sold by length)
- Dropdown selector next to price input

**Computed cost per piece:**
- Fixed: `price`
- Per mm: `price * h` (height dimension)

**Cost summary panel:**
- New section at bottom of side panel: "Cost Summary"
- Always visible (not dependent on selection)
- Shows:
  - Per-piece cost breakdown (scrollable list): `label — computed cost`
  - Total: sum of all piece costs
  - Currency symbol selector (stored in localStorage): $, EUR, GBP, or custom

**Template prices:**
- Built-in templates get default prices (e.g., "2x4 Stud" = $3.50)
- Custom templates inherit the price from the piece when saved
- Price is just a default — user can override per-piece after adding

**CSV export update:**
- Add two new columns: `UnitPrice`, `Cost`
- Add a total row at the bottom

**Estimate:** ~80 lines new JS, ~20 lines HTML/CSS

---

## Implementation Order

1. **Save/Load** first — foundational, low risk, reuses existing serialization
2. **Templates** second — depends on shape factories, benefits from save/load pattern
3. **Cost Calculator** third — builds on templates (default prices), extends existing UI patterns

## Verification

### Save/Load
1. Create a model with mixed shapes, some CSG-cut
2. Save → verify `.woodmodel.json` downloads
3. Clear all → Load the file → verify exact same model restores
4. Load into a fresh browser tab → verify it works without prior state

### Templates
1. Open library → click "2x4 Stud" → verify board with 89x38x2438 dimensions appears
2. Select a piece → "Save as Template" → verify it appears in Custom section
3. Reload page → verify custom templates persist (localStorage)
4. Delete a custom template → verify it's removed

### Cost Calculator
1. Add pieces, set prices → verify per-piece costs compute correctly
2. Switch price mode to "per_mm" → verify cost updates based on height
3. Check cost summary shows correct total
4. Export CSV → verify UnitPrice and Cost columns, total row
