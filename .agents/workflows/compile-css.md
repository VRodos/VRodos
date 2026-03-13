---
description: How to modify and compile styles for the VRodos modern design system
---

# Stylesheet Modification & Compilation Workflow

Whenever you modify the modern design system in VRodos, follow these steps to ensure consistency between source and production styles.

## 1. Modify Source CSS
All modern transformations and design system extensions should be made in:
[vrodos_modern.css](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/css/vrodos_modern.css)

## 2. Content Path Verification
If you add new PHP templates or move logic to different files, ensure they are covered in the `content` array of:
[tailwind.config.js](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/tailwind.config.js)

## 3. Compile Styles
// turbo
After ANY change to the CSS or templates, run the following command to update the compiled DaisyUI and Tailwind styles:

```powershell
npm run build:css
```

This command updates:
[vrodos_modern_compiled.css](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/css/vrodos_modern_compiled.css)

## 4. Verification
Always verify that:
- Modals are centered and compact (robust grid centering).
- Buttons and inputs follow the Emerald design system.
- Background colors and typography are consistent across managers.
