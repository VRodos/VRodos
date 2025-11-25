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
│   ├── aframe_libs/          # A-Frame prototypes
│   ├── vrodos_*.js           # Custom VRodos modules
│   └── ajaxes/               # AJAX endpoint handlers
├── css/                       # Stylesheets
├── assets/                    # Static assets
├── networked-aframe/         # Collaborative editing server
└── images/                    # Plugin images

```

### Manager Class Architecture

VRodos follows a clean **Manager Class Pattern** where each manager class encapsulates a specific domain of functionality. All managers are instantiated in [`VRodos.php`](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/VRodos.php), which serves as a simple bootstrap file.

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

**Scene Data Structure**: Scenes are stored as structured JSON in post meta. The [`vrodos-scene-model.php`](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/includes/vrodos-scene-model.php) provides a formal data model for scene serialization.

**Scene Persistence**: Custom serialization handled by [`vrodos_ScenePersistence.js`](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/js_libs/vrodos_ScenePersistence.js) with `VrodosSceneExporter` and `VrodosSceneImporter` classes.

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

**Three.js r147**: The plugin uses a fully consolidated version of Three.js r147, with all loaders, controls, and post-processing effects.

**A-Frame Integration**: Scenes export to A-Frame format for VR viewing. Prototypes in [`js_libs/aframe_libs/`](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/js_libs/aframe_libs/).

### Upload System

The asset upload system ([`class-vrodos-upload-manager.php`](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/includes/class-vrodos-upload-manager.php)) follows WordPress best practices:
- Uses WordPress media library APIs
- Proper MIME type validation
- Secure file handling
- Integration with custom post types

### AJAX System

All AJAX endpoints are centralized in [`class-vrodos-ajax-handler.php`](file:///d:/localhost/wp_vrodos/wp-content/plugins/VRodos/includes/ajax/class-vrodos-ajax-handler.php):
- Scene saving (`savescene_ajax`)
- Asset deletion (`deleteasset_ajax`)
- Project operations (create, delete, collaborate)
- Proper nonce verification
- Capability checks

---

## 4. Technology Stack

- **Backend**: PHP 7+, WordPress 6+
- **Database**: MySQL 5+
- **Frontend**: Vanilla JavaScript (ES5/ES6)
- **3D Rendering**: Three.js r147
- **VR Framework**: A-Frame 1.4.2
- **Collaborative Server**: Node.js with easyRTC
- **WebRTC**: Metered TURN server for peer connections
- **UI Components**: Material Design Components (MDC)

---

## 5. Refactoring History Summary

The VRodos codebase has undergone significant refactoring to address technical debt:

### Completed Major Refactoring

1. **Asset Upload System**: Migrated to WordPress APIs, eliminating manual file operations
2. **Scene Data Handling**: Replaced unstructured JSON with formal PHP data model
3. **Three.js Consolidation**: Removed legacy versions (r87, r119, r124, r125) and consolidated to r147
4. **Scene Persistence**: Created custom `VrodosSceneExporter/Importer` to replace deprecated Three.js scene serialization
5. **Manager Class Migration**: Transformed procedural hook-based code into 18 specialized manager classes
6. **AJAX Centralization**: Moved all AJAX handlers into a single, organized class

### Architectural Improvements

- **Eliminated Spaghetti Code**: Moved from scattered procedural code to organized OOP structure
- **Single Responsibility**: Each manager class has a clear, focused purpose
- **WordPress Best Practices**: Proper use of hooks, filters, and WordPress APIs
- **Cleaner Dependencies**: Removed multiple Three.js versions, reducing conflicts and complexity

---

## 6. Areas for Future Refactoring

### Code Quality & Modernization

1. **JavaScript Modernization**
   - Current state: Mix of ES5 and ES6, some legacy patterns
   - Opportunity: Refactor to modern ES6+ with modules
   - Benefits: Better maintainability, clearer dependencies, easier testing

2. **Template Separation**
   - Current state: Some HTML embedded in PHP classes
   - Opportunity: Extract all templates to `includes/templates/`
   - Benefits: Cleaner separation of concerns, easier theme customization

3. **CSS Organization**
   - Current state: 20+ CSS files in `css/` directory
   - Opportunity: Consolidate and organize using CSS modules or preprocessor
   - Benefits: Reduced file count, better maintainability

### Testing Infrastructure

1. **Unit Tests**: No automated testing currently exists
   - PHP: Implement PHPUnit tests for manager classes
   - JavaScript: Add Jest or Mocha tests for core modules

2. **Integration Tests**: Test WordPress integration points
   - CPT registration and behavior
   - AJAX endpoints
   - Upload system

3. **End-to-End Tests**: Test critical user workflows
   - Scene creation and editing
   - Asset upload and management
   - Collaborative editing

### Performance Optimization

1. **Asset Loading**: Implement lazy loading for 3D models
2. **Script Optimization**: Minify and bundle JavaScript modules
3. **Database Queries**: Review and optimize custom queries in manager classes
4. **Caching**: Implement caching for frequently accessed scene data

### Documentation

1. **Code Documentation**
   - Add PHPDoc blocks to all manager classes
   - Document JavaScript module APIs
   - Create inline comments for complex logic

2. **Developer Documentation**
   - API reference for extending VRodos
   - Theme integration guide
   - Custom post type extension guide

3. **User Documentation**
   - Scene editor tutorial
   - Asset management guide
   - Collaborative editing setup

### Security Hardening

1. **Input Validation**: Review all user input handling
2. **Capability Checks**: Ensure all actions check user capabilities
3. **Nonce Verification**: Verify all AJAX endpoints use nonces correctly
4. **SQL Injection Prevention**: Use prepared statements consistently

---

## 7. Development Workflow

### Local Development Setup

1. Install WordPress locally (XAMPP, Local, or Docker)
2. Clone VRodos to `wp-content/plugins/`
3. Run `npm install` in plugin root
4. Set up networked-aframe server (see README.md)
5. Configure permalinks and create required pages

### Making Changes

1. **PHP Changes**: Edit manager classes in `includes/`
2. **JavaScript Changes**: Edit modules in `js_libs/`
3. **Styles**: Edit CSS files in `css/`
4. **Templates**: Edit templates in `includes/templates/`

### Testing Changes

1. Test in WordPress admin and frontend
2. Test 3D editor functionality
3. Test asset upload and management
4. Test collaborative editing (if applicable)
5. Check browser console for errors

---

## 8. Key Patterns & Conventions

### Manager Class Pattern

```php
class VRodos_Example_Manager {
    public function __construct() {
        // Register hooks in constructor
        add_action('init', array($this, 'init'));
        add_filter('some_filter', array($this, 'filter_callback'));
    }
    
    public function init() {
        // Implementation
    }
    
    public function filter_callback($value) {
        // Implementation
        return $value;
    }
}
```

### JavaScript Module Pattern

Most JavaScript modules follow a revealing module pattern or simple object-literal pattern. Consider migrating to ES6 modules for better organization.

### Scene Data Flow

1. **User edits scene** → UI updates Three.js scene
2. **Save triggered** → `VrodosSceneExporter` serializes scene to JSON
3. **AJAX call** → JSON sent to `savescene_ajax` endpoint
4. **Server saves** → JSON stored in post meta
5. **Load scene** → JSON retrieved, `VrodosSceneImporter` reconstructs Three.js scene

---

## 9. Common Issues & Solutions

### Editor Not Loading

- Check that all scripts are enqueued correctly in `VRodos_Asset_Manager`
- Verify Three.js r147 files exist in `js_libs/threejs147/`
- Check browser console for JavaScript errors

### Assets Not Uploading

- Verify upload directory permissions
- Check PHP upload limits in `.htaccess`
- Review `VRodos_Upload_Manager` for errors

### Collaborative Editing Not Working

- Ensure networked-aframe server is running
- Verify `keys.json` is configured correctly
- Check CORS headers in `.htaccess`

### Scene Not Saving

- Check AJAX endpoint in browser network tab
- Verify user has correct capabilities
- Review `VRodos_AJAX_Handler::savescene_ajax()` for errors

---

## 10. Resources

- **Main Demo**: https://vrodos.iti.gr
- **Three.js Documentation**: https://threejs.org/docs/
- **A-Frame Documentation**: https://aframe.io/docs/
- **WordPress Plugin Handbook**: https://developer.wordpress.org/plugins/

---

## Summary

VRodos has been successfully refactored from a challenging "spaghetti code" codebase into a well-organized, maintainable plugin following WordPress and OOP best practices. The manager class architecture provides a solid foundation for future development. Focus areas for continued improvement include JavaScript modernization, testing infrastructure, and comprehensive documentation.

The codebase is now in a much healthier state and ready for the next phase of development and feature enhancement.
