# VRodos Lighting Compatibility & Improvements (Three.js r181)

This document summarizes the audit of the VRodos lighting system regarding its compatibility with **Three.js r181.0** and identifies areas for future enhancement.

## Current Compatibility Status

The VRodos scene editor lighting system is **fully compatible** and adheres to the standards of Three.js r181.

### Standards Audit Results

| Feature | Standard (r181) | VRodos Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Color Management** | `THREE.ColorManagement.enabled = true` | Renderer configured with `outputColorSpace = THREE.SRGBColorSpace`. | ✅ |
| **Physical Units** | Physical lights (Lux/Candela/Lumens). | `intensity` and `power` properties are correctly exposed and used. | ✅ |
| **Light Decay** | `decay = 2.0` for physical lights. | UI and loaders default to `decay = 2` for Point and Spot lights. | ✅ |
| **Color Persistence** | Linear-sRGB working space storage. | `VrodosSceneExporter` saves linear values; loaders restore them via `THREE.Color`. | ✅ |
| **Tone Mapping** | HDR standard support. | Uses `ACESFilmicToneMapping` with `toneMappingExposure = 1.0`. | ✅ |

## Key Technical Details

### 1. Color Space and Management
The transition from legacy `.encoding` to `.outputColorSpace` is complete. The renderer initialization in `vrodos_3d_editor_environmentals.js` follows the modern standard:
```javascript
this.renderer.outputColorSpace = THREE.SRGBColorSpace;
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
this.renderer.toneMappingExposure = 1.0;
```

### 2. Light Property Handling
- **Sun (DirectionalLight)**: Managed via `intensity` (Lux). Uses standard shadow camera configurations.
- **Lamp (PointLight) & Spot (SpotLight)**: Correctly support both `intensity` and `power` (Lumens) for physically accurate brightness control.
- **Decay**: Defaulted to `2` to ensure proper physical light falloff in r181.

## Proposed Improvements & Future Tasks

> [!TIP]
> To further align with professional 3D tools and improve the editor UX, we should consider the following tasks.

### [ ] Implement SpotLightHelper
Current spot lights in the editor lack a visual helper. Adding a `THREE.SpotLightHelper` would provide better visual feedback for cone angle and orientation.
- **File**: `js_libs/vrodos_addRemoveOne.js` and `js_libs/vrodos_LightsPawn_Loader.js`

### [ ] Dynamic Shadow Camera Adjustment
Improve Sun shadow quality by dynamically adjusting the shadow camera bounds based on the scene's bounding box.
- **Goal**: Minimize "shadow acne" and improve resolution for large/small scenes.

### [ ] Light Property Sync Refactor
Refactor `updateSpot()` in `includes/templates/vrodos-edit-3D-scene-Popups.php` to avoid `scene.traverse()` calls on every input change, favoring direct object references or event-based updates.

### [ ] Real-time Exposure Control
Add a GUI slider to control `renderer.toneMappingExposure` to allow users to balance lighting levels across different environments (Indoor vs. Outdoor).
