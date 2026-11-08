# CLAUDE.md

Guidance for Claude Code working in this repo. Auto-loaded every session — keep it tight, only the things that are not derivable from reading the code.

## Project

Browser-based 3D woodworking modeler. Single self-contained `index.html` — no build step, no framework, no local toolchain. Three.js 0.187.0 (ES module) via CDN, pinned with an import map. Open `index.html` in a browser to run.

The full app lives inside one `window.addEventListener('load', …)` closure in `index.html`, organized into comment-delimited sections. Use those comments to navigate.

CI workflows live under `.github/workflows/`. The CI tooling manifest is `.github/package.json` (CI-only — Node is not assumed locally).

Releases run through the manual `Auto Release` workflow, which also deploys `index.html` to `gh-pages`. It derives the version bump from commit subject lines since the last tag: `feat:` → minor, `type!:` or `BREAKING CHANGE` in the subject → major, anything else → patch. Only subjects are read, so a `BREAKING CHANGE` in the commit body does not count.

## Working agreements

- **No commits without explicit user approval after testing.** Don't run `git commit` / `git push` / `gh pr create` until the user has confirmed.
- **No direct pushes to `main`.** Always feature branch + PR; `main` is protected.
- **No `--amend` on commits that are already pushed**, and no force-push on a PR branch unless the user explicitly asks. Add a follow-up commit instead.
- **Run `git fetch --all --prune` before branching or merging non-trivial work** — branching from a stale `main` has silently dropped commits before.
- When adding features or changing behavior, update both `CLAUDE.md` and `README.md` to match.

## Code conventions

- All dimensions are in millimeters.
- The renderer deliberately keeps the legacy color pipeline (`ColorManagement.enabled = false`, linear output, light intensities scaled by π). Enabling color management would change the look and break the ID colors in `measureVisibility()`.
- Change `material.transparent` at runtime only through `setTransparent()`. Three.js compiles opaque materials with a shader variant that forces alpha to 1, so the toggle needs `needsUpdate`.
- `mesh.userData.type` values are fixed English identifiers (`'Board'`, `'Dowel'`, `'Wedge'`, `'L-Bracket'`, `'Tapered Leg'`, `'Frustum Board'`, `'Pyramid Frustum'`, `'Frame'`). Translations happen only at the display layer via `typeName()`.
- The `pieces[]` array is the source of truth for scene objects. Mutate state via `pushUndo()` first; rebuild geometry via `rebuildGeometry()` after dimension changes; call `updateGrid()` after position/dimension changes.
- User-facing strings must go through `t()` / `typeName()`. When adding a new string, add the key in every language in `translations` (currently `en` + `de`) — the consistency-lint CI fails otherwise.
- `renderViewToDataURL()` (workshop sheet, PNG export) renders through the live renderer, so it must restore everything it touches — renderer size, pixel ratio, clear color, scene visibility, piece materials. If you add a new kind of scene helper (sprite, indicator, line) directly under `scene`, the `clean` mode hides it automatically; anything attached as a child of a piece mesh shows up on the sheet. `measureVisibility()` swaps every piece's material for an ID color, so the same rule applies there.
- The workshop sheet's cuts page reads cut outlines from the wall triangles of the geometry (`pieceCutOutline()`), not from `csgOutlineGeometry()`: that one is good enough for drawing views but can drop edges. Pieces cut with a round tool (`SHEET_CUT_ROUND_TOOLS`) get no outline drawing, because their facets are not sawn edges.
- Full-size templates on the workshop sheet (`buildTemplateTiles()`) are SVGs with mm as both size and viewBox units, so they print 1:1. Do not put them in a container that scales them, and keep `SHEET_TEMPLATE_W` within the printable width set by `@page`.
- The stock plan (`buildStockPlan()`) drives the object list, the cost summary and the workshop sheet. It derives each part's blank from the same formulas as the geometry builders (`pieceBlanks()`): if you change a builder or add a shape type, update it too. Parts with a `sourceId` (Split Piece) are never repacked; their offcut needs `sourceLength`, which older files lack. Parts with a fixed price and no source (`isBoughtPiece()`) are bought at their own size and never packed onto a trade length. Stock settings (`stockSettings`, `stockMap`) are saved in the model file's `stock` array but deliberately kept out of `serializeScene()` and so out of undo.
- Page 1 of the workshop sheet (`.sheet-first`) has a fixed height and its views shrink to fit whatever sits above them. Keep the `object-fit: contain` on the view images: it letterboxes exactly like the SVG overlay's default `meet`, which keeps the dimension lines aligned.
- The `?__test=1` query attaches `window.__app` for Playwright tests. When adding helpers that future tests should reach, append them to that hook explicitly — do not re-export everything by default. The hook stays inert without the query.

## Hidden constraints (CI will catch these, but easier to avoid up front)

- The JS-syntax workflow extracts inline scripts via awk that matches a bare `<script>` or `<script type="module">` line opening and `</script>` line closing. **Keep those tags on their own lines in `index.html`, with the opening tag unindented** — an indented one is not extracted.
- When you bump Three.js, change the version in every import map URL and recompute both `sha384` hashes from the cdnjs files. `three.module.min.js` also imports `three.core.js`, so both need a hash. jsDelivr minifies its own copy, so its hash differs.
- When you change `woodmodel.schema.json` or `woodtemplates.schema.json`, also update or add an example in `examples/` so the schema-validation CI catches drift.
- When you add a shape type, update `ADD_TYPES` in `index.html` and all three `type` enums: the piece `type` and the CSG tool `type` in `woodmodel.schema.json`, plus the one in `woodtemplates.schema.json`. The consistency-lint CI fails if any of them differs.
- Visual-regression baselines live under `tests/visual.spec.js-snapshots/`. Regenerate them via the `Update visual baselines` workflow (`workflow_dispatch`) — never edit by hand. They're OS-tagged (`*-linux.png`); only generate from CI.
- README screenshots live under `docs/screenshots/`. Regenerate them via the `Update README screenshots` workflow (`workflow_dispatch`), which runs `tests/readme-screenshots.spec.js`. Run it after visible UI changes; it is not part of the PR checks, so nothing fails when they go stale.
- The smoke and visual Playwright workflows are split by passing the spec path explicitly (`tests/smoke.spec.js` vs `tests/visual.spec.js`). Don't try to filter by `--grep` — it matches the full test ID including path and lets visual specs slip through.
