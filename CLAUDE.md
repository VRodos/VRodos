# VRodos Plugin — AI Agent Rules

> These rules apply to ALL AI agents (Claude Code, Gemini, Copilot) working on this codebase.
> Read this BEFORE writing any code. Violations will cause broken UI.

---

## 1. CSS & Styling — THE MOST IMPORTANT RULES

### DaisyUI + Tailwind Architecture (FIXED)

The double-prefix bug has been fixed. DaisyUI prefix is now `""` (empty) in `tailwind.config.js`,
so Tailwind's `prefix: 'tw-'` is the **only** prefix. This means:

- **ALL classes** (both Tailwind utilities and DaisyUI components) use the `tw-` prefix
- DaisyUI component CSS **is now generated** automatically by the Tailwind compiler
- The `important: '.vrodos-manager-wrapper'` setting wraps all generated CSS for WP specificity
- Theme colors come from `data-theme="emerald"` on the `<html>` tag

### CSS Prefixes

| What | Prefix | Example |
|------|--------|---------|
| Tailwind utilities | `tw-` | `tw-flex`, `tw-p-2`, `tw-bg-white` |
| DaisyUI components | `tw-` | `tw-btn`, `tw-modal`, `tw-checkbox` |
| Custom classes | none | `affineSwitch`, `fogSwitch`, `toggle-btn` |

### How to Use DaisyUI Components

DaisyUI components now work directly. Just use `tw-` prefix:
```html
<button class="tw-btn tw-btn-primary">Click me</button>
<dialog class="tw-modal">
  <div class="tw-modal-box">...</div>
</dialog>
<input type="checkbox" class="tw-checkbox tw-checkbox-primary" />
```

### How to Style New Components

1. **DaisyUI components** — use them directly with `tw-` prefix (they work now!)
2. **Tailwind utilities** — for layout and custom styling:
   ```html
   <div class="tw-flex tw-items-center tw-gap-2 tw-bg-white tw-rounded-lg tw-shadow tw-p-2">
   ```
3. **Inline `<style>` block** — for complex one-off components:
   ```html
   <style>
     .my-component { display: flex; background: #fff; border-radius: 8px; }
   </style>
   ```
4. **Manual CSS in `vrodos_modern.css`** — for reusable custom components only
5. **DaisyUI CSS variables** — for theme-aware colors:
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

### DO NOT

- ❌ Use the old `d-` prefix — it no longer exists; use `tw-` for everything
- ❌ Use `peer-checked:tw-bg-*` Tailwind variants — specificity issues with WP
- ❌ Manually rebuild CSS — `npm run watch:css` runs automatically
- ❌ Add hand-written component CSS to `vrodos_modern.css` for standard DaisyUI components
- ❌ Use `!important` unless overriding a specific WP theme conflict (the `important` config handles it)

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

ALL category-to-icon mappings live in `assets/js/editor/vrodos_icons.js`:
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
| `templates/pages/vrodos-edit-3D-scene-template.php` | Main scene editor template |
| `templates/pages/vrodos-edit-3D-scene-HierarchyViewer.php` | Right panel (hierarchy + options) |
| `templates/pages/vrodos-edit-3D-scene-Popups.php` | Property popups (lights, door, POI) |
| `assets/js/editor/vrodos_auxControlers.js` | lil-gui, cel outline, floating panel helpers |
| `assets/js/editor/vrodos_rayCasters.js` | Mouse interaction, selection, click/drag detection |
| `assets/js/editor/vrodos_HierarchyViewer.js` | Hierarchy list rendering |
| `assets/js/editor/vrodos_icons.js` | Category icon map (single source of truth) |
| `assets/js/editor/vrodos_addRemoveOne.js` | Add/remove/lock objects in scene |
| `assets/js/editor/vrodos_3d_editor_buttons_drags.js` | UI controls, drag-to-canvas, event binding |
| `assets/css/vrodos_modern.css` | Source CSS (hand-written DaisyUI overrides) |
| `assets/css/vrodos_modern_compiled.css` | Compiled output (auto-generated, DO NOT edit) |
| `assets/css/editor/vrodos_3D_editor.css` | Scene editor specific styles |
| `assets/runtime-version-manifest.json` | Generated runtime package/version manifest from `npm run build:three` |

### Naming
- Tailwind prefix: `tw-`
- DaisyUI prefix: `tw-`
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
