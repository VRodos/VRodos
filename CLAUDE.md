# VRodos Plugin — AI Agent Rules

> These rules apply to ALL AI agents (Claude Code, Gemini, Copilot) working on this codebase.
> Read this BEFORE writing any code. Violations will cause broken UI.

---

## 1. CSS & Styling — THE MOST IMPORTANT RULES

### DaisyUI Component Classes DO NOT WORK

Due to a double-prefix bug (`tailwind.config.js` has both `prefix: 'tw-'` and DaisyUI `prefix: 'd-'`),
**ZERO DaisyUI component CSS is generated** in the compiled output. DaisyUI only provides:
- Theme CSS variables (`oklch(var(--p))`, `var(--b1)`, etc.) via `data-theme="emerald"`
- Keyframe animations (`button-pop`, `modal-pop`, `skeleton`, etc.)

**The following DaisyUI classes produce NO CSS and MUST NOT be used alone:**
`d-tabs`, `d-tab`, `d-tabs-box`, `d-tabs-lift`, `d-skeleton`, `d-join`, `d-join-item`,
`d-collapse`, `d-tooltip`, `d-badge`, `d-card`, `d-alert`, `d-menu`, `d-dropdown`, `d-swap`,
`d-toggle`, `d-progress`, `d-steps`, `d-stat`, `d-table`, `d-divider`, `d-hero`

**These DaisyUI classes APPEAR to work but ONLY because of hand-written CSS in `vrodos_modern.css`:**
`d-btn`, `d-checkbox`, `d-radio`, `d-modal`, `d-input`, `d-select`, `d-range`

### How to Style New Components (MANDATORY)

Use ONE of these approaches — never rely on DaisyUI component classes:

1. **Tailwind utilities** — always work (they use the `tw-` prefix):
   ```html
   <div class="tw-flex tw-items-center tw-gap-2 tw-bg-white tw-rounded-lg tw-shadow tw-p-2">
   ```

2. **Inline `<style>` block** — guaranteed to work, no framework dependency:
   ```html
   <style>
     .my-component { display: flex; background: #fff; border-radius: 8px; }
     .my-component input:checked + label { background: #10b981; color: #fff; }
   </style>
   ```

3. **Manual CSS in `vrodos_modern.css`** — for reusable components:
   - Scope under container ID: `#vrodos-scene-editor .my-class { ... }`
   - Use `!important` on every property (required to override WP theme styles)

4. **DaisyUI CSS variables** — always work for colors:
   ```css
   background-color: oklch(var(--p));  /* primary color */
   color: oklch(var(--pc));            /* primary content color */
   ```

### Toggle/Radio Button Pattern (PROVEN WORKING)

```html
<!-- Hidden radio + label + CSS sibling selector -->
<input type="radio" id="myOption" name="group" class="tw-peer tw-hidden" checked />
<label for="myOption" class="myToggleClass">Label Text</label>
```
```css
.tw-peer:checked + .myToggleClass {
    background-color: #10b981 !important;
    color: #ffffff !important;
}
```

### CSS Prefixes

| What | Prefix | Example |
|------|--------|---------|
| Tailwind utilities | `tw-` | `tw-flex`, `tw-p-2`, `tw-bg-white` |
| DaisyUI classes (with manual CSS) | `d-` | `d-btn`, `d-checkbox` |
| Custom classes | none | `affineSwitch`, `fogSwitch`, `toggle-btn` |

### DO NOT

- ❌ Use `aria-label` based DaisyUI radio tabs — they render as checkboxes
- ❌ Use `d-skeleton` — no CSS exists, nothing will animate
- ❌ Use `d-tabs`, `d-tabs-box` — unstyled, renders as plain inputs
- ❌ Use `peer-checked:tw-bg-*` Tailwind variants — specificity issues with WP
- ❌ Manually rebuild CSS — `npm run watch:css` runs automatically
- ❌ Use `d-join` expecting visual grouping — no CSS exists for it

---

## 2. Scene Editor (Three.js) Rules

### Object Selection
- Selection fires on `mouseup` (not `mousedown`) to avoid triggering during drag
- `_CLICK_THRESHOLD = 5px` distinguishes click vs drag
- Track mouse position in `_onCanvasMouseDown`, fire selection in `_onCanvasMouseUp`
- No object auto-selected on scene load

### Floating Object Controls Panel
- `position: fixed`, `z-index: 9999` — must be above everything
- Positioned 100px to the right of cursor on selection
- Use `_lastClickX` / `_lastClickY` for positioning (set in mousedown handler)
- Drag uses delta-based approach: store `startLeft`/`startTop` on pointerdown, apply delta on pointermove

### Cel-Shaded Outline (Object Highlight)
- Back-face hull technique (NOT OutlinePass — that only shows edges at depth intersections)
- `addCelOutline(object)` / `removeCelOutline(object)` / `removeAllCelOutlines()`
- Uses `THREE.BackSide`, scale 1.04x, orange `MeshBasicMaterial`

### Camera
- `envir.camera` does NOT exist — use `envir.orbitControls.object` for the camera
- Scene starts in 3D mode (`envir.is2d = false`)

### lil-gui (NOT dat.gui)
- dat.gui is deprecated — we use lil-gui v0.19.2
- `new lil.GUI({ autoPlace: false })`
- `.controllers` (public) replaces `.__controllers` (private)
- `controller.$name.innerHTML = label` for HTML labels (`.name()` escapes HTML)

---

## 3. Category Icons — Single Source of Truth

ALL category-to-icon mappings live in `js_libs/vrodos_icons.js`:
- `VRODOS_CATEGORY_ICONS` — the canonical map
- `vrodos_getCategoryIcon(key)` — the lookup function
- PHP mirror: `vrodos_get_asset_category_icon()` in `vrodos-assets-list-template.php`

**DO NOT create new icon mappings elsewhere.** Add to `vrodos_icons.js` and the PHP function.

---

## 4. Hierarchy Viewer

- Friendly names for lights: "Sun 1", "Lamp 2", "Sun 1 — Target"
- `_hierarchyDisplayName(obj)` generates display names
- `_hierarchyIconForObject(obj)` uses the shared icon map
- Skeleton placeholder (`#hierarchy-skeleton`) shows during asset loading
- `removeHierarchySkeleton()` called in `manager.onLoad` when ALL assets finish
- `setHierarchyViewer()` preserves skeleton (only removes `.hierarchyItem` elements)
- Items inserted before skeleton via `jQuery(html).insertBefore(skeleton)`
- Lock icon update: find by `a[aria-label="Lock asset"]`, swap inner `<i data-lucide="...">`, call `lucide.createIcons()`

---

## 5. Template & CSS Loading Architecture

### Normalized Template Structure (ALL 4 templates follow this)

Every template outputs a full HTML page. The structure MUST be:

```php
<?php
// PHP data preparation (NO wp_enqueue_style/script calls here!)
$data = SomeClass::prepare_data();
extract($data);
?>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title | VRodos</title>
    <?php wp_head(); ?>
    <!-- Template-specific inline <script> OK here, AFTER wp_head() -->
</head>
<body <?php body_class('vrodos-manager-wrapper tw-overflow-hidden'); ?>>
    ...
    <?php wp_footer(); ?>
</body>
</html>
```

### Rules

- `data-theme="emerald"` goes on `<html>` ONLY — never on inner elements
- `vrodos-manager-wrapper` on `<body>` is REQUIRED (Tailwind `important` selector needs it)
- `tw-overflow-hidden` on `<body>` on ALL templates
- **NO** `wp_enqueue_style()` or `wp_enqueue_script()` at template PHP top — all enqueuing in `class-vrodos-asset-manager.php`
- **NO** inline `<script src="...">` for libraries — use `wp_enqueue_script()` via the asset manager
- **NO** `<script>` blocks before `<!DOCTYPE html>` — they go inside `<head>` after `wp_head()`
- Shoelace is NOT used — removed. Do not re-add.

### CSS Load Order (Controlled by Asset Manager)

Every VRodos page loads this common base (in order):
1. `vrodos_frontend_stylesheet` — base VRodos styles
2. `vrodos_modern_compiled` — Tailwind utilities + DaisyUI manual overrides
3. Lucide icons JS (via `wp_enqueue_script`)

Scene editor additionally loads: MDC CSS, Material Icons, lil-gui, `vrodos_3D_editor.css`, `vrodos_3D_editor_browser.css`
Asset editor additionally loads: `vrodos_asseteditor.css`

### Where Enqueuing Happens

| Page | Enqueue function |
|------|-----------------|
| Project Manager | `VRodos_Asset_Manager::enqueue_project_manager_scripts()` |
| Assets List | `VRodos_Asset_Manager::enqueue_assets_list_scripts()` |
| Asset Editor | `VRodos_Asset_Manager::enqueue_asset_editor_scripts()` |
| Scene Editor | `VRodos_Asset_Manager::enqueue_scene_editor_scripts()` |

**DO NOT** add `wp_enqueue_style/script` calls inside templates. Always add to the appropriate function above.

---

## 6. File Structure & Conventions

### Key Files
| File | Purpose |
|------|---------|
| `includes/class-vrodos-asset-manager.php` | ALL script/style registration & enqueuing |
| `includes/templates/vrodos-edit-3D-scene-template.php` | Main scene editor template |
| `includes/templates/vrodos-edit-3D-scene-HierarchyViewer.php` | Right panel (hierarchy + options) |
| `includes/templates/vrodos-edit-3D-scene-Popups.php` | Property popups (lights, door, POI) |
| `js_libs/vrodos_auxControlers.js` | lil-gui, cel outline, floating panel helpers |
| `js_libs/vrodos_rayCasters.js` | Mouse interaction, selection, click/drag detection |
| `js_libs/vrodos_HierarchyViewer.js` | Hierarchy list rendering |
| `js_libs/vrodos_icons.js` | Category icon map (single source of truth) |
| `js_libs/vrodos_addRemoveOne.js` | Add/remove/lock objects in scene |
| `js_libs/vrodos_3d_editor_buttons_drags.js` | UI controls, drag-to-canvas, event binding |
| `css/vrodos_modern.css` | Source CSS (hand-written DaisyUI overrides) |
| `css/vrodos_modern_compiled.css` | Compiled output (auto-generated, DO NOT edit) |
| `css/vrodos_3D_editor.css` | Scene editor specific styles |

### Naming
- Tailwind prefix: `tw-`
- DaisyUI prefix: `d-` (but remember: only hand-styled components work)
- Lucide icons: `<i data-lucide="icon-name">` + call `lucide.createIcons()` after dynamic DOM insertion
- Custom toggle classes: `toggle-btn`, `toggle-active`, `affineSwitch`, `fogSwitch`

---

## 7. General Rules

- **DO NOT** commit code — provide commit text to the user
- **DO NOT** manually run CSS builds — `npm run watch:css` is automatic
- **DO NOT** use Material Design Icons — migrating to Lucide (except scene-editor MDC still loaded)
- **DO NOT** add `wp_enqueue_style/script` in template files — use the asset manager
- **DO NOT** add inline `<script src="CDN">` tags — register and enqueue via WP
- **DO** add null guards when accessing `transform_controls.object` — it can be undefined
- **DO** call `lucide.createIcons()` after any dynamic DOM insertion containing `data-lucide` attributes
- **DO** use `absint()` for WordPress ID sanitization, `sanitize_text_field()` for strings
- Templates output full HTML pages (DOCTYPE/html/body), NOT WP shortcodes
