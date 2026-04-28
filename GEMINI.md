# VRodos: AI Agent Instructions (Gemini CLI)

> **Canonical Source of Truth:** This file provides foundational mandates for AI agents. It incorporates rules from `CLAUDE.md` and project documentation.

## Project Overview
VRodos is a WordPress plugin that transforms a standard website into a **3D/VR content management and creation platform**. It features a WebGL-based editor (Three.js r181 vendor stack), asset management (GLB, OBJ, FBX), and A-Frame export for VR.

- **Backend:** PHP 8.3+ (modernized), WordPress 6.8+
- **Frontend:** Vanilla JS, generated Three.js vendor bundle (currently r181), A-Frame runtime metadata from root `package.json`
- **Styling:** Tailwind CSS + DaisyUI (namespaced with `tw-` prefix)
- **Collaborative Server:** Node.js + easyRTC (located in `services/networked-aframe/`)

## Technical Architecture

### Manager Class Pattern
The plugin is organized into ~18 specialized **Manager Classes** in `includes/`.
- **VRodos_Asset_Manager:** Handles ALL script/style registration and enqueuing.
- **VRodos_AJAX_Handler:** Centralized handler for all AJAX endpoints.
- **VRodos_Post_Type_Manager:** Registers custom post types (`vrodos_game`, `vrodos_scene`, `vrodos_asset3d`).
- **VRodos_Upload_Manager:** Manages 3D asset uploads and metadata.

### Data Model
- Scenes are stored as structured JSON in `post_content` or post meta.
- Custom persistence logic resides in `assets/js/editor/vrodos_ScenePersistence.js`.

## Critical Development Rules

### 1. Styling & CSS
- **Prefix:** ALL Tailwind and DaisyUI classes MUST use the `tw-` prefix (e.g., `tw-btn`, `tw-flex`, `tw-modal`).
- **Specificity:** The project uses `important: '.vrodos-manager-wrapper'` in `tailwind.config.js`. The `<body>` tag must have this class.
- **Enqueuing:** NEVER use `wp_enqueue_style` or `wp_enqueue_script` inside template files. Add them to the appropriate function in `includes/class-vrodos-asset-manager.php`.
- **Themes:** `data-theme="emerald"` MUST be on the `<html>` tag only.
- **Manual Builds:** Do NOT manually run CSS builds. `npm run watch:css` should be used for development.

### 2. Three.js Scene Editor
- **Selection:** Use `mouseup` (not `mousedown`) with a 5px drag threshold to distinguish clicks from camera movement.
- **Camera:** `envir.camera` is NOT used. Use `envir.orbitControls.object` for the active camera.
- **Highlighting:** Use the cel-shaded outline technique (`addCelOutline()`) instead of Three.js `OutlinePass`.
- **GUI:** Use `lil-gui` (NOT `dat.gui`).

### 3. UI Components & Icons
- **Icons:** Use Lucide icons (`<i data-lucide="name">`). Call `lucide.createIcons()` after dynamic DOM updates.
- **Category Icons:** The single source of truth is `assets/js/editor/vrodos_icons.js` (JS) and `vrodos_get_asset_category_icon()` in `vrodos-assets-list-template.php` (PHP).

### 4. Template Structure
Canonical page templates live in `templates/pages/`, while page-template meta aliases preserve compatibility for older assignments during migration.
Every page template must output a full HTML document (`<!DOCTYPE html>`, `<html>`, `<body>`).
- Use `wp_head()` in `<head>` and `wp_footer()` before `</body>`.
- Ensure `<body>` has `vrodos-manager-wrapper` and `tw-overflow-hidden`.

## Prerequisites
- **PHP:** 8.3+ (modernized with Rector)
- **WordPress:** 6.0+ (Tested up to 6.8)
- **Node.js:** 16+ (for collaborative editing server)
- **Database:** MySQL 5+ or MariaDB 10+
- **Permalinks:** Must be set to a structure other than "Plain" (e.g., "Post name") for REST API and AJAX functionality.

## Collaborative Server Setup (networked-aframe)
The server enables real-time collaborative editing.
1. **Dependencies:** `cd services/networked-aframe/ && npm install`
2. **TURN Server:** Create `services/networked-aframe/server/keys.json` for WebRTC connections.
    ```json
    {
      "iceServers": [
        { "urls": "stun:stun.relay.metered.ca:80" },
        {
          "urls": "turn:a.relay.metered.ca:80",
          "username": "YOUR_USERNAME",
          "credential": "YOUR_CREDENTIAL"
        }
      ]
    }
    ```
3. **Start:** `node services/networked-aframe/server/easyrtc-server.js` (Default port: `5832`)

## Building and Running

### PHP (Backend)
- Composer/PHPUnit tooling has been removed from this plugin. Use targeted PHP syntax checks with the local PHP runtime when editing PHP files.

### JavaScript/CSS (Frontend)
- **Full Build:** `npm run build` (runtime vendor bundles, runtime manifest, and Tailwind CSS)
- **Runtime Vendor Build:** `npm run build:three` (Three, PMNDRS, N8AO, Takram, and `assets/runtime-version-manifest.json`)
- **CSS Build:** `npm run build:css` (Tailwind)
- **CSS Watch:** `npm run watch:css`
- **Linting:** `npm run lint` (ESLint)
- **Formatting:** `npm run format` (Prettier)

Runtime versions are controlled by root `package.json` and `package-lock.json`. Update package declarations or `vrodos.runtime.aframe`, run `npm install`, then run `npm run build`; do not manually copy standalone PMNDRS bundles.

## Troubleshooting
- **REST API/AJAX Issues:** Ensure WordPress Permalinks are NOT set to "Plain".
- **Upload Limits:** For large 3D models, increase PHP limits (e.g., via `.htaccess`):
  ```apache
  php_value upload_max_filesize 512M
  php_value post_max_size 512M
  php_value memory_limit 1024M
  ```
- **Connection Issues:** Verify the Node.js server is running and port `5832` is open.

## Security & Standards
- Sanitize all inputs using WordPress functions (`absint()`, `sanitize_text_field()`, etc.).
- Follow PSR-12 and WordPress PHP Coding Standards.
- Protect `.env` and `keys.json` files. Do NOT log or print secrets.
