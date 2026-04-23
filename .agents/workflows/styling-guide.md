---
description: Styling conventions for VRodos manager pages (Tailwind + DaisyUI Emerald theme)
---

# VRodos Styling Guide

All modern VRodos manager pages (Project Manager, Assets List, Asset Editor, etc.) use a shared design system built on **Tailwind CSS v3 + DaisyUI v4** with the **Emerald** theme.

## CSS Architecture

| Layer | File | Purpose |
|---|---|---|
| **Source** | `assets/css/vrodos_modern.css` | Custom overrides, animations, DaisyUI surgical fixes |
| **Compiled** | `assets/css/vrodos_modern_compiled.css` | Auto-generated — **never edit directly** |
| **Config** | `tailwind.config.js` | Tailwind + DaisyUI config |

## Prefixes

- **Tailwind utilities** use the `tw-` prefix, e.g. `tw-flex`, `tw-bg-white`, `tw-text-slate-400`
- **DaisyUI components** use the `d-` prefix, e.g. `d-btn`, `d-btn-primary`, `d-modal`, `d-input`

## Scoping

Styles are scoped via `important: '.vrodos-manager-wrapper'` in `tailwind.config.js`.  
DaisyUI button/input overrides in `vrodos_modern.css` are **manually scoped** to container IDs:

```css
#vrodos-project-manager .d-btn,
#vrodos-assets-manager .d-btn,
#vrodos-asset-editor .d-btn { ... }
```

> [!CAUTION]
> **When adding a new manager page**, you MUST add its container ID to ALL the CSS selectors in `vrodos_modern.css` (search for `#vrodos-project-manager` and add your new ID alongside it), then recompile.

## Template Structure

Every manager page follows this pattern:

```html
<html data-theme="emerald">
<head>
    <script src="https://unpkg.com/lucide@latest"></script>
    <?php wp_head(); ?>
</head>
<body class="vrodos-manager-wrapper tw-bg-slate-50 tw-text-slate-900 tw-antialiased">

<div id="vrodos-{page-name}" class="tw-min-h-screen tw-flex tw-flex-col tw-bg-slate-50">
    <!-- Unified Light Header -->
    <header class="tw-flex-none tw-bg-white tw-border-b tw-border-slate-200 tw-px-8 tw-py-4 ...">
        <span class="tw-text-xl tw-font-black tw-tracking-tight tw-text-primary">VRODOS</span>
        <!-- page title, nav links -->
    </header>

    <main> ... </main>
</div>
```

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| Primary (Emerald) | `#66cc8a` | Buttons, active states, accents |
| Slate-50 | `#f8fafc` | Page background |
| White | `#ffffff` | Card/panel backgrounds |
| Slate-400 | `#94a3b8` | Secondary text, labels |
| Slate-900 | `#0f172a` | Primary text |

## Button Patterns

```html
<!-- Primary action -->
<button class="d-btn d-btn-primary tw-text-white tw-font-black tw-px-10 tw-rounded-xl">
    Save
</button>

<!-- Ghost/subtle -->
<button class="d-btn d-btn-ghost tw-text-slate-400">
    Cancel
</button>

<!-- Outline -->
<button class="d-btn d-btn-outline tw-rounded-xl">
    Secondary
</button>
```

## Icons

Use **Lucide** icons via the CDN. Initialize with `lucide.createIcons()` after DOM ready.

```html
<i data-lucide="save" class="tw-w-4 tw-h-4"></i>
```

## Compiling

After ANY change to `vrodos_modern.css` or templates:

```powershell
npm run build:css
```

Or use the `/compile-css` workflow.
