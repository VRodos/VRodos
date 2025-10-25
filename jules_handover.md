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

The first phase of the refactoring focused on the asset upload and media handling system, which was identified as a key area of "spaghetti code." The result is a much cleaner, more secure, and more maintainable asset upload system that aligns with WordPress best practices.

---

## 3. Completed Work: Task 2 - Refactor Scene Data Handling

With the upload system stabilized, the second phase of the refactoring focused on the handling of the scene data itself, replacing the unstructured JSON blob for scene data with a formal PHP data model. The result is a more robust and maintainable scene data system.

---

## 4. Completed Work: Task 3 - Modernize Three.js (Phase 1: Remove r87)

This was the first and most critical phase of the Three.js consolidation effort, focused on removing the ancient `threejs87` library.

### Summary of Changes:

1.  **Replaced Deprecated Scene Exporter/Importer:**
    - **Problem:** The `threejs87` library provided the core `THREE.SceneExporter`, which was used for saving scene data. This class was removed in modern Three.js versions, and a simple replacement with `scene.toJSON()` was not possible because the application relied on custom logic within the old exporter for data formatting.
    - **Solution:** A new, self-contained module, `js_libs/vrodos_ScenePersistence.js`, was created. This file contains two new classes:
        - `VrodosSceneExporter`: A modern implementation that replicates the custom serialization logic of the old exporter, ensuring the output JSON format is compatible with the application's backend.
        - `VrodosSceneImporter`: A corresponding importer to correctly parse the scene JSON on load.
    - This new module uses robust, modern methods (`JSON.stringify`) and is the new standard for scene persistence in the application.

2.  **Fixed Multiple Critical Bugs:**
    - **Problem:** The new exporter initially caused several bugs, including `Unexpected end of JSON input` errors.
    - **Solution:** A series of fixes were implemented:
        - **Object Creation:** The `addAssetToCanvas` function was updated to ensure that newly added 3D objects are created with all the necessary properties (e.g., `fnPath`, `category_name`) that the new exporter expects.
        - **Metadata Serialization:** The exporter was made more robust to handle `undefined` or `false` values for scene-level settings (like `enableGeneralChat`), preventing the creation of malformed JSON.
        - **Data Type Mismatches:** The entire data flow for scene settings was corrected. The PHP parser (`vrodos-edit-3D-scene-ParseJSON.php`) was updated to use `json_encode` to preserve data types, and incorrect `JSON.parse()` calls were removed from all JavaScript loaders (`vrodos_LoaderMulti.js`, `vrodos-edit-3D-scene-template.php`).
        - **Property Name Inconsistencies:** A bug where the "background style" was not saving was traced to inconsistent property names (`backgroundStyleOption` vs. `bcg_selection`). This was resolved by standardizing the property names across the entire data flow (UI, exporter, and loaders).

3.  **Migrated Controls and Removed Obsolete Library:**
    - The editor controls (`OrbitControls`, `TransformControls`) were successfully migrated from the r87 version to the r141 version.
    - All `wp_register_script` and `wp_enqueue_script` calls for the old `threejs87` library were removed.
    - The entire `js_libs/threejs87` directory was deleted, completely removing the old library from the codebase.

This phase was a major success. It not only removed a significant piece of technical debt but also fixed a cascade of related bugs, resulting in a much more stable and reliable scene persistence system.

---

## 5. Proposed Next Steps: Task 4 - Consolidate Three.js (Phase 2: Remove r119)

With the `threejs87` library removed, the next logical step is to target the `threejs119` library.

- **Problem:** `threejs119` is another outdated version that is still being loaded, contributing to the project's complexity and large footprint.
- **Proposed Plan:**
    1.  **Inventory & Audit:** The first step is to perform a `grep` for `vrodos_load119` to identify all the files that still depend on this version.
    2.  **Identify Key Dependencies:** The audit will likely reveal that `threejs119` is primarily used for specific loaders (e.g., `FBXLoader`, `GLTFLoader`) and rendering components (`EffectComposer`, `OutlinePass`).
    3.  **Migrate to r141:** The goal is to migrate these dependencies to their `r141` equivalents, which are already available in the project. This will involve:
        - Updating the `wp_enqueue_script` calls in the relevant PHP files to point to the `r141` versions of the scripts.
        - Carefully testing the functionality (e.g., loading an FBX model, using the outline pass) to ensure the migration was successful and to fix any API incompatibilities.
    4.  **Remove Old Library:** Once all dependencies have been migrated and tested, the `js_libs/threejs119` directory can be safely deleted, and the corresponding `wp_register_script` calls in `VRodos.php` can be removed.

This phased approach will continue the process of modernizing the codebase in a controlled and testable manner, bringing us one step closer to a single, modern version of Three.js.
