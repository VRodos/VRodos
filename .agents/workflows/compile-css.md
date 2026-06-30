---
description: How to modify and compile styles for the VRodos modern design system
---

# Stylesheet Modification & Compilation Workflow

Whenever you modify the modern design system in VRodos, follow these steps to ensure consistency between source and production styles.

## 1. Modify Source CSS
All modern transformations and design system extensions should be made in:
`assets/css/vrodos_modern.css`

## 2. Content Path Verification
If you add new PHP templates or move logic to different files, ensure they are covered in the `content` array of:
`tailwind.config.js`

## 3. Compile Styles
Only run a CSS build when the task explicitly changes CSS/templates or asks for generated CSS. Development normally relies on the watch task.

Run:

```powershell
npm run build:css
```

This command updates:
`assets/css/vrodos_modern_compiled.css`

## 4. Verification
Always verify that:
- Modals are centered and compact (robust grid centering).
- Buttons and inputs follow the Emerald design system.
- Background colors and typography are consistent across managers.
