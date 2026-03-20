# VRodos Plugin — AI Agent Rules (Gemini)

> This file mirrors the rules in `CLAUDE.md` at the project root.
> **Read `CLAUDE.md` first** — it is the canonical source of truth for all AI agents.

The rules below are a summary. If anything conflicts, `CLAUDE.md` wins.

---

## Critical: CSS & Styling

### DaisyUI Component Classes DO NOT WORK

`tailwind.config.js` has a double-prefix bug (`prefix: 'tw-'` + DaisyUI `prefix: 'd-'`).
**ZERO DaisyUI component CSS is generated.** Only theme CSS variables and keyframe animations exist.

**Broken classes (no CSS at all):**
`d-tabs`, `d-tab`, `d-tabs-box`, `d-skeleton`, `d-join`, `d-collapse`, `d-tooltip`,
`d-badge`, `d-card`, `d-alert`, `d-menu`, `d-dropdown`, `d-swap`, `d-toggle`,
`d-progress`, `d-steps`, `d-stat`, `d-table`, `d-divider`, `d-hero`

**"Working" classes (only via hand-written CSS in `vrodos_modern.css`):**
`d-btn`, `d-checkbox`, `d-radio`, `d-modal`, `d-input`, `d-select`, `d-range`

### How to Style

1. **Tailwind utilities** (`tw-` prefix) — always work
2. **Inline `<style>` blocks** — guaranteed, no framework dependency
3. **Manual CSS in `vrodos_modern.css`** — scoped, with `!important`
4. **DaisyUI CSS variables** — `oklch(var(--p))`, `oklch(var(--pc))`, etc.

### DO NOT

- Use `aria-label` based DaisyUI radio tabs
- Use `d-skeleton`, `d-tabs`, `d-tabs-box`, `d-join`
- Use `peer-checked:tw-bg-*` variants (specificity issues with WP)
- Manually rebuild CSS (`npm run watch:css` is automatic)
- Use Material Design Icons (migrating to Lucide)

### Toggle Pattern (proven working)

```html
<input type="radio" id="opt" name="group" class="tw-hidden" checked />
<label for="opt">Text</label>
```
```css
input:checked + label { background: #10b981; color: #fff; }
```

---

## Scene Editor (Three.js)

- Selection on `mouseup` (not `mousedown`), 5px drag threshold
- `envir.camera` does NOT exist — use `envir.orbitControls.object`
- Always null-guard `transform_controls.object`
- Scene starts in 3D mode (`envir.is2d = false`)
- Floating panel: `position: fixed`, `z-index: 9999`, 100px right of cursor
- Cel outline: `addCelOutline()` / `removeCelOutline()` / `removeAllCelOutlines()`
- lil-gui (NOT dat.gui)

---

## Category Icons

Single source of truth: `js_libs/vrodos_icons.js`
- `VRODOS_CATEGORY_ICONS` map + `vrodos_getCategoryIcon(key)` function
- PHP mirror in `vrodos-assets-list-template.php`
- **DO NOT** create new icon mappings elsewhere

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full AI agent rules (canonical) |
| `js_libs/vrodos_icons.js` | Category icon map |
| `css/vrodos_modern.css` | Source CSS (hand-written overrides) |
| `css/vrodos_modern_compiled.css` | Auto-generated — DO NOT edit |
| `css/vrodos_3D_editor.css` | Scene editor styles |

---

## General

- DO NOT commit code — provide commit text to the user
- DO NOT manually run CSS builds
- DO call `lucide.createIcons()` after dynamic DOM insertion with `data-lucide`
- DO use `absint()` for WP ID sanitization
- Templates output full HTML pages, NOT WP shortcodes
