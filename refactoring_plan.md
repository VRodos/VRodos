# Implementation Plan - Scene Building & Loading Refactoring

This plan aims to modularize the VRodos architecture, reducing the size of monolithic files and centralizing scene settings logic to make the platform easier to maintain and extend.

## Phase 1: JS Centralization & Schema-Driven Processing [COMPLETED]

Currently, scene settings (like Takram Atmosphere) are hardcoded in multiple JS files. This phase centralizes them into a single schema.

### [DONE] [vrodos_scene_settings_schema.js](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/js_libs/vrodos_scene_settings_schema.js)
- Define a master configuration object containing all scene metadata keys, their types, and default values.

### [DONE] [vrodos_ScenePersistence.js](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/js_libs/vrodos_ScenePersistence.js)
- Refactor `VrodosSceneExporter` and `VrodosSceneImporter` to loop through the schema instead of using hardcoded whitelists.

### [DONE] [vrodos_LoaderMulti.js](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/js_libs/vrodos_LoaderMulti.js)
- Refactor the metadata application logic (lines 95-300+) to use the schema for setting `envir.scene` values.

---

## Phase 2: Editor Initialization Cleanup [COMPLETED]

Streamline how the editor starts up and maps PHP data to JS state.

### [DONE] [vrodos_EditorInitializer.js](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/js_libs/vrodos_EditorInitializer.js)
- Extract the initialization logic from the PHP template into a clean JS module.

### [DONE] [vrodos-edit-3D-scene-template.php](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/includes/templates/vrodos-edit-3D-scene-template.php)
- Replace massive inline JS blocks with a single call to the new initializer.

---

## Phase 3: Backend Compiler Refactoring

Modularize the A-Frame generation logic in the PHP compiler.

### [MODIFY] [class-vrodos-compiler-manager.php](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/includes/class-vrodos-compiler-manager.php)
- Implement a "Renderer Registry".
- Extract entity generation (Lights, Assets, Pawns) into dedicated private methods or helper classes.
- Move DOM attribute setting for different categories into specialized handlers.

---

## Phase 4: UI Componentization (JS)

Break down the massive UI dialogue scripts.

### [MODIFY] [vrodos_compile_dialogue.js](file:///d:/Development/WordPress/app/public/wp-content/plugins/VRodos/js_libs/vrodos_compile_dialogue.js)
- Extract panels (Atmosphere, Post-FX, General Rendering) into separate logical components.
- Use a common event-driven system for UI-to-Scene updates.

---

## Verification Plan

### Automated Tests
- Since this is a refactoring, the existing scene loading/saving functionality must remain identical.
- Check browser console for missing keys or initialization errors after each phase.

### Manual Verification
1. **Phase 1**: Save/Load scenes with various settings (Atmosphere ON/OFF, legacy vs pmndrs engine) and ensure data is preserved correctly.
2. **Phase 2**: Verify editor loads without errors and UI reflects the correct database state.
3. **Phase 3**: Compile a scene and verify the `MasterClient` HTML correctly represents all objects.
4. **Phase 4**: Interact with the Compile Dialogue and ensure real-time updates to the scene environment still work.
