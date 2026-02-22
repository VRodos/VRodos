# VRodos Plugin: Technical Architecture & Refactoring Guide

This document provides a comprehensive overview of the VRodos WordPress plugin's current architecture and serves as a guide for future refactoring and development efforts.

---

## 1. Project Overview

**VRodos** is a WordPress plugin that transforms a standard website into a 3D/VR content creation platform. It provides a WebGL-based 3D editor, built with **Three.js r147** and **A-Frame**, allowing users to create and manage 3D scenes and assets directly within WordPress.

### Core Functionality

- **3D Scene Editor**: WebGL-based editor for creating and manipulating 3D scenes with real-time preview
- **Asset Management**: Upload, view, and manage 3D models (GLB, OBJ, FBX), images, videos, and audio
- **Scene Composition**: Arrange assets within scenes, configure lighting, environments, and save scene state
- **WordPress Integration**: Custom post types (Games/Projects, Scenes, Assets), AJAX-based persistence, and media management
- **A-Frame Export**: Export scenes to VR-ready A-Frame format
- **Collaborative Editing**: Real-time multi-user editing via networked-aframe and WebRTC

---

## 2. Current Architecture

### Plugin Structure

```
VRodos/
├── VRodos.php                 # Main plugin file - clean manager instantiation
├── includes/                  # Manager classes (business logic)
│   ├── class-vrodos-*.php    # 18 manager classes
│   ├── ajax/                  # AJAX handler
│   └── templates/             # PHP templates for editor UI
├── js_libs/                   # JavaScript libraries and custom modules
│   ├── threejs147/           # Three.js r147 (consolidated)
│   └── vrodos_*.js           # Custom VRodos modules
├── css/                       # Stylesheets
├── assets/                    # Static assets
├── runtime/                   # Runtime components (e.g., servers)
│   └── networked-aframe/     # Collaborative editing server
└── images/                    # Plugin images
```

### Manager Class Architecture

VRodos follows a clean **Manager Class Pattern** where each manager class encapsulates a specific domain of functionality. All managers are instantiated in `VRodos.php`, which serves as a simple bootstrap file.

#### Core Manager Classes

| Manager Class | Responsibility |
|--------------|----------------|
| **VRodos_Asset_Manager** | Script and style registration/enqueuing for all pages |
| **VRodos_Post_Type_Manager** | Registration of custom post types (Game, Scene, Asset) and taxonomies |
| **VRodos_Game_CPT_Manager** | Meta boxes, save hooks, and admin columns for Game CPT |
| **VRodos_Scene_CPT_Manager** | Meta boxes, save hooks, and admin columns for Scene CPT |
| **VRodos_Asset_CPT_Manager** | Meta boxes, save hooks, and admin columns for Asset CPT |
| **VRodos_AJAX_Handler** | All AJAX endpoints (scene save, asset operations, etc.) |
| **VRodos_Upload_Manager** | Asset upload handling following WordPress best practices |
| **VRodos_Roles_Manager** | User roles, capabilities, and custom profile fields |
| **VRodos_Menu_Manager** | Admin menu structure and custom menu item fields |
| **VRodos_Install_Manager** | Plugin activation/deactivation and database setup |
| **VRodos_Pages_Manager** | Creation of required WordPress pages (editor, asset list, etc.) |
| **VRodos_Core_Manager** | Core utilities and helper functions |
| **VRodos_Settings_Manager** | Plugin settings and configuration |
| **VRodos_Shortcode_Manager** | WordPress shortcode handlers |
| **VRodos_Widget_Manager** | WordPress widgets |
| **VRodos_Default_Scene_Manager** | Default scene templates |
| **VRodos_Default_Data_Manager** | Default data initialization |
| **VRodos_Compiler_Manager** | Scene compilation and A-Frame export |

---

## 3. Key Components

### Data Model

**Custom Post Types**:
- `vrodos_game` (Projects)
- `vrodos_scene` (3D Scenes)
- `vrodos_asset3d` (3D Assets)

**Scene Data Structure**: Scenes are stored as structured JSON in post meta.

**Scene Persistence**: Custom serialization handled by `vrodos_ScenePersistence.js` with `VrodosSceneExporter` and `VrodosSceneImporter` classes.

### 3D Editor Architecture

**Core JavaScript Modules**:
- **vrodos_LoaderMulti.js**: Asset loading system with support for GLB, OBJ, FBX
- **vrodos_ScenePersistence.js**: Scene save/load serialization
- **vrodos_AssetViewer_3D_kernel.js**: 3D viewer initialization and rendering
- **vrodos_3d_editor_buttons_drags.js**: UI controls and drag-and-drop
- **vrodos_rayCasters.js**: Mouse/pointer interactions with 3D objects
- **vrodos_LightsPawn_Loader.js**: Lighting and camera management
- **vrodos_addRemoveOne.js**: Adding/removing objects from scene
- **vrodos_3d_editor_environmentals.js**: Environment settings (skybox, fog, etc.)

**Three.js r147**: The plugin uses a fully consolidated version of Three.js r147.

**A-Frame Integration**: Scenes export to A-Frame format for VR viewing.

---

## 4. Technology Stack

- **Backend**: PHP 8.1+, WordPress 6.8+
- **Database**: MySQL 8.0+ or MariaDB 10.6+
- **Frontend**: Vanilla JavaScript (ES5/ES6)
- **3D Rendering**: Three.js r147
- **VR Framework**: A-Frame 1.4.2
- **Collaborative Server**: Node.js with easyRTC
- **WebRTC**: Metered TURN server for peer connections
- **UI Components**: Material Design Components (MDC)

---

## 5. Development Workflow

### Local Development Setup

1.  **Install WordPress:** Set up a local WordPress environment (e.g., XAMPP, Local, Docker).
2.  **Clone Plugin:** Clone the VRodos repository into your `wp-content/plugins/` directory.
3.  **Install & Run Server:** The Node.js server is required for development.
    - Navigate to `runtime/networked-aframe/` and run `npm install`.
    - Configure `server/keys.json` for WebRTC (see `README.md`).
    - Navigate to `runtime/networked-aframe/server/` and start the server with `node easyrtc-server.js`.
4.  **Activate Plugin:** Activate VRodos in the WordPress admin dashboard.
5.  **Configure WordPress:** Set permalinks and create the necessary pages as prompted.

---

## 6. Common Issues & Solutions

### Editor Not Loading

- Check that all scripts are enqueued correctly in `VRodos_Asset_Manager`.
- Verify Three.js r147 files exist in `js_libs/threejs147/`.
- Check browser console for JavaScript errors.

### Assets Not Uploading

- Verify upload directory permissions.
- Check PHP upload limits in your server configuration.
- Review `VRodos_Upload_Manager` for errors.

### Collaborative Editing Not Working

- Ensure the Node.js server is running from the `runtime/networked-aframe/` directory.
- Verify that `server/keys.json` is correctly configured.
- Check for firewall or CORS issues that may be blocking the connection.

---

## 7. Resources

- **Main Demo**: https://vrodos.iti.gr
- **Three.js Documentation**: https://threejs.org/docs/
- **A-Frame Documentation**: https://aframe.io/docs/
- **WordPress Plugin Handbook**: https://developer.wordpress.org/plugins/

---

## Summary

VRodos has been successfully refactored into a well-organized, maintainable plugin following WordPress and OOP best practices. The manager class architecture provides a solid foundation for future development.
