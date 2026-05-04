# CLAUDE.md

Guidance for Claude Code working in this repo. Auto-loaded every session — keep it tight, only the things that are not derivable from reading the code.

## Project

Browser-based 3D woodworking modeler. Single self-contained `index.html` — no build step, no framework, no local toolchain. Three.js r128 via CDN. Open `index.html` in a browser to run.

The full app lives inside one `window.addEventListener('load', …)` closure in `index.html`, organized into numbered, comment-delimited sections. Use those comments to navigate.

CI workflows live under `.github/workflows/`. The CI tooling manifest is `.github/package.json` (CI-only — Node is not assumed locally).

## Working agreements

- **No commits without explicit user approval after testing.** Don't run `git commit` / `git push` / `gh pr create` until the user has confirmed.
- **No direct pushes to `main`.** Always feature branch + PR; `main` is protected.
- **No `--amend` on commits that are already pushed**, and no force-push on a PR branch unless the user explicitly asks. Add a follow-up commit instead.
- **Run `git fetch --all --prune` before branching or merging non-trivial work** — branching from a stale `main` has silently dropped commits before.
- When adding features or changing behavior, update both `CLAUDE.md` and `README.md` to match.

## Code conventions

- All dimensions are in millimeters.
- `mesh.userData.type` values are fixed English identifiers (`'Board'`, `'Dowel'`, `'Wedge'`, `'L-Bracket'`, `'Tapered Leg'`, `'Frustum Board'`, `'Pyramid Frustum'`, `'Frame'`). Translations happen only at the display layer via `typeName()`.
- The `pieces[]` array is the source of truth for scene objects. Mutate state via `pushUndo()` first; rebuild geometry via `rebuildGeometry()` after dimension changes; call `updateGrid()` after position/dimension changes.
- User-facing strings must go through `t()` / `typeName()`. When adding a new string, add the key in every language in `translations` (currently `en` + `de`) — the consistency-lint CI fails otherwise.
- The `?__test=1` query attaches `window.__app` for Playwright tests. When adding helpers that future tests should reach, append them to that hook explicitly — do not re-export everything by default. The hook stays inert without the query.

## Hidden constraints (CI will catch these, but easier to avoid up front)

- The JS-syntax workflow extracts inline scripts via awk that matches a bare `<script>` line opening and `</script>` line closing. **Keep those tags on their own lines in `index.html`.**
- When you change `woodmodel.schema.json` or `woodtemplates.schema.json`, also update or add an example in `examples/` so the schema-validation CI catches drift.
- Visual-regression baselines live under `tests/visual.spec.js-snapshots/`. Regenerate them via the `Update visual baselines` workflow (`workflow_dispatch`) — never edit by hand. They're OS-tagged (`*-linux.png`); only generate from CI.
- The smoke and visual Playwright workflows are split by passing the spec path explicitly (`tests/smoke.spec.js` vs `tests/visual.spec.js`). Don't try to filter by `--grep` — it matches the full test ID including path and lets visual specs slip through.
