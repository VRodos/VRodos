# VRodos Plugin Refactoring: Handover Document

This document provides a comprehensive summary of the refactoring work performed on the VRodos WordPress plugin and outlines the recommended next steps for continuing the project.

## 1. Project Overview

**VRodos** is a powerful WordPress plugin that transforms a standard website into a 3D/VR content creation platform. It provides a 3D editor, built with **Three.js** and **A-Frame**, allowing users to create and manage 3D scenes and assets directly within the WordPress environment.

### Core Functionality:
- **3D Editor:** A WebGL-based editor for creating and manipulating 3D scenes.
- **Asset Management:** Users can upload, view, and manage 3D assets (GLB, OBJ, etc.) and other media (images, videos, audio).
- **Scene Creation:** Users can arrange assets within a scene, configure lighting and environments, and save the scene state.
- **WordPress Integration:** The plugin is deeply integrated with WordPress, using custom post types for "Games" (projects), "Scenes," and "Assets." It also leverages WordPress for user authentication, data storage (including AJAX-based scene saving), and media management.
- **A-Frame Export:** The ultimate goal is to export these scenes into a format that can be viewed in VR using the A-Frame framework.

### Initial Codebase Challenges:
The project was identified as having a significant amount of technical debt, including:
- **Spaghetti Code:** Highly intertwined and difficult-to-follow logic, especially in the integration between the frontend JavaScript and the backend PHP.
- **Inconsistent Practices:** Use of outdated methods and manual file operations where standard, more robust WordPress APIs would be appropriate.
- **Multiple Library Versions:** The project loads several different versions of the Three.js library (r87, r119, r124, r125, r141), which is a major source of complexity and potential conflicts.

The primary goal of this refactoring effort is to address these issues in a careful, step-by-step manner to improve code quality, maintainability, and performance without breaking critical functionality.

---

## 2. Completed Work: Task 1 - Refactor Asset Upload System

The first phase of the refactoring focused on the asset upload and media handling system, which was identified as a key area of "spaghetti code."

### Summary of Changes:
The core of this work involved refactoring the functions within `includes/vrodos-core-upload-functions.php`.

1.  **Replaced Manual File Operations with WordPress APIs:**
    - **Previous State:** The code used fragile PHP functions like `file_put_contents`, `mkdir`, and `unlink` for handling uploads.
    - **New State:** The code now exclusively uses the standard, secure, and robust WordPress APIs:
        - `wp_handle_upload` for processing file uploads from `$_FILES`.
        - `wp_upload_bits` for handling base64-encoded image strings.
        - `wp_delete_attachment` for safely removing files and their associated database entries.

2.  **Centralized Dependency Loading for AJAX/Frontend Calls:**
    - **Problem:** A fatal error (`Call to undefined function wp_generate_attachment_metadata`) was occurring when uploads were initiated from the frontend asset editor. This was because the necessary WordPress admin files were not loaded in that context.
    - **Solution:** A private helper function, `_vrodos_load_wp_admin_files`, was created in `vrodos-core-upload-functions.php`. This function loads all required media files (`file.php`, `media.php`, `image.php`). It is now called at the beginning of every public upload function, ensuring that dependencies are always available, regardless of the execution context.

3.  **Fixed Unwanted Image Generation:**
    - **Problem:** WordPress was automatically generating extra image sizes (e.g., 150x150 thumbnails) and a `-scaled.jpg` version for large images, which was not desired for this project.
    - **Solution:** Two WordPress filters are now used during the image upload process:
        - `add_filter('intermediate_image_sizes_advanced', '__return_empty_array');` (via the `vrodos_remove_allthumbs_sizes` function) to disable thumbnail generation.
        - `add_filter('big_image_size_threshold', '__return_false');` to disable the "big image" scaler.
    - These filters are added just before the upload and removed immediately after, preventing side effects elsewhere in the application.

4.  **Preserved Custom File Structure:**
    - A critical project requirement was to maintain the existing file directory structure: `/wp-content/uploads/<game-slug>/models/`.
    - This was successfully preserved by continuing to use the `vrodos_upload_dir_forScenesOrAssets` filter during the `wp_handle_upload` and `wp_upload_bits` operations.

The `refactor-upload-functions` branch contains all of these changes. The result is a much cleaner, more secure, and more maintainable asset upload system that aligns with WordPress best practices.

---

## 3. Proposed Next Steps: Task 2 - Refactor Scene Data Handling

With the upload system stabilized, the next logical area to refactor is the handling of the scene data itself.

### Current State:
- Scene data is saved as a large, unstructured JSON blob directly into the `post_content` field of the `vrodos_scene` custom post type.
- This approach is difficult to debug, query, and extend. Any change to the scene structure requires complex string manipulation in both PHP and JavaScript.

### Proposed Plan:
1.  **Analyze the JavaScript:**
    - **Objective:** Fully understand the structure of the scene JSON.
    - **Action:** Investigate the 3D editor's JavaScript files (likely located in the `/js_libs/` directory, with AJAX handlers in `/js_libs/ajaxes/`). The key is to identify the code that serializes the Three.js scene graph into a JSON object before it is sent to the server via the `vrodos_save_scene_async_action` AJAX call.

2.  **Define a Formal Data Model:**
    - **Objective:** Create a predictable and maintainable structure for scene data.
    - **Action:** Based on the analysis, define a formal PHP class (e.g., `Vrodos_Scene_Model`) that represents the structure of a scene. This class would have properties for scene settings, environmental controls, and an array of objects representing the assets within the scene. This provides a single source of truth for the data structure.

3.  **Refactor Save/Load Logic:**
    - **Objective:** Implement the new data model.
    - **Action (Backend):** Modify the PHP AJAX handler (`vrodos_save_scene_async_action_callback` in `VRodos.php`) to use the new `Vrodos_Scene_Model`. Instead of saving the raw JSON blob, the handler should sanitize the incoming data, map it to the properties of the new data model, and then serialize the model object for storage. This is a good opportunity to move the save logic out of the main plugin file and into a dedicated file in the `includes` directory.
    - **Action (Frontend):** Modify the JavaScript code that loads a scene to correctly parse the new, structured data from the server and reconstruct the Three.js scene.

### Expected Benefits:
- **Maintainability:** A clear data model makes the code much easier to understand and modify.
- **Debugging:** It will be simpler to validate and debug scene data.
- **Extensibility:** Adding new features to scenes will be a matter of adding properties to the model, not complex JSON manipulation.
- **Performance:** A structured data model is the first step toward future performance optimizations, such as selectively loading parts of a scene.

This next phase will be a significant step toward making the entire VRodos codebase cleaner, more robust, and ready for future development.

---

## 4. Long-Term Refactoring Roadmap

Beyond the immediate next step of refactoring scene data, here is a proposed high-level roadmap to address the other core challenges in the codebase.

### Phase 2: Consolidate Three.js Versions
This is the most significant technical challenge and will provide a massive improvement in stability and performance.

- **Problem:** The plugin loads at least five different versions of Three.js (r87, r119, r124, r125, r141) to support various components. This creates a large footprint, potential for conflicts, and a maintenance nightmare.
- **Proposed Plan:**
    1.  **Inventory & Audit:** Systematically go through the JavaScript files to identify which components are tied to which Three.js version and why. Document the dependencies.
    2.  **Select a Target Version:** Choose a single, modern, and stable version of Three.js as the target for the entire application. This decision should consider compatibility with the existing A-Frame version.
    3.  **Migrate Components:** Carefully migrate the components, one by one, to the new target version. This will be a delicate process, as the Three.js API has changed significantly over the years. Each migrated component will need to be thoroughly tested.
    4.  **Remove Old Libraries:** Once all components are migrated, remove the old, unused Three.js library files from the `js_libs` directory and the `wp_register_script` calls from `VRodos.php`.

### Phase 3: Modernize the Frontend Build Process
- **Problem:** JavaScript files are loaded individually via PHP (`wp_register_script` and `wp_enqueue_script`). There is no modern build system, which prevents the use of modern JavaScript features, modules, and performance optimizations.
- **Proposed Plan:**
    1.  **Introduce a Build Tool:** Integrate a modern JavaScript bundler like **Webpack** or **Vite** into the project.
    2.  **Refactor to Modules:** Convert the existing JavaScript files to use ES6 modules (`import`/`export`). This will make dependencies explicit and the code easier to reason about.
    3.  **Configure Bundling:** Create a build process that transpiles, bundles, and minifies the JavaScript code into a single (or a few) optimized files.
    4.  **Update Enqueueing:** Modify `VRodos.php` to enqueue the final bundled JavaScript file(s) instead of the dozens of individual scripts.

### Phase 4: Dedicated Performance Optimization
- **Problem:** The application has known performance issues, likely due to the large number of libraries, unoptimized code, and inefficient data handling.
- **Proposed Plan:** With a cleaner codebase, a dedicated performance review can be undertaken.
    1.  **Backend Performance:** Analyze and optimize database queries. Introduce caching strategies (e.g., WordPress Transients API) for frequently accessed data.
    2.  **Frontend Performance:** Profile the 3D editor to identify bottlenecks. Optimize the Three.js render loop, reduce the number of draw calls, and implement techniques like lazy loading for assets and components.