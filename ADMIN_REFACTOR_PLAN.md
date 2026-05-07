# VRodos Admin Refactor Plan

## Summary

This document tracks the completed admin-side refactor and the optional follow-up cleanup work. The goal was to reduce oversized admin manager files while preserving current WordPress hooks, AJAX/admin-post action names, URLs, metadata keys, upload behavior, and compile-substitution semantics.

## Completed Phases

### Asset Optimization Extraction

Status: complete.

- `includes/class-vrodos-asset-optimization-manager.php` is now a thin hook coordinator and compatibility facade.
- Implementation moved to `includes/asset-optimization/`.
- Compatibility wrappers remain on `VRodos_Asset_Optimization_Manager`:
  - `resolve_compiled_glb_asset()`
  - `dashboard_actionable_assets()`
  - `render_dashboard_actionable_assets_table()`
- Preserved contracts:
  - existing `admin_post_vrodos_*` actions
  - existing `wp_ajax_vrodos_*` actions
  - settings tab hook `vrodos_render_settings_tab_vrodos_asset_optimization_settings`
  - `_vrodos_asset3d_glb_analysis`
  - `_vrodos_asset3d_glb_derivatives`
  - `vrodos_asset3d_glb`
  - `wp-content/uploads/vrodos-optimized-assets/asset-{asset_id}/`
  - opt-in-only compile derivative substitution

### Dashboard Page Extraction

Status: complete.

- `VRodos_Core_Manager::vrodos_plugin_main_page()` remains the stable menu callback wrapper.
- Dashboard rendering moved to `includes/admin/class-vrodos-admin-dashboard-page.php`.
- The dashboard page class owns:
  - dashboard CSS
  - dashboard notices
  - stats cards
  - Active Projects tab
  - Actionable Assets tab composition
- Actionable Assets rows still delegate to `VRodos_Asset_Optimization_Manager::render_dashboard_actionable_assets_table( 10 )`.

### Asset CPT Extraction

Status: complete.

- `includes/class-vrodos-asset-cpt-manager.php` is now a thin hook registrar and compatibility facade.
- Implementation moved to `includes/asset-cpt/`.
- Extracted areas:
  - asset metabox/admin fields
  - taxonomy metabox rendering and saving
  - frontend asset submission
  - frontend asset editor template data
  - shared media, upload-limit, redirect, notice, and audio defaults helpers
- Compatibility wrappers remain on `VRodos_Asset_CPT_Manager`:
  - `prepare_asset_editor_template_data()`
  - `create_asset_frontend()`
  - `update_asset_frontend()`
  - `update_asset_meta()`
- Asset metabox/taxonomy nonce actions are pinned to the old manager basename so save semantics stay unchanged.

## Current Admin Structure

```text
includes/
  admin/
    class-vrodos-admin-dashboard-page.php
  asset-cpt/
    class-vrodos-asset-cpt-admin-controller.php
    trait-vrodos-asset-cpt-metabox-admin.php
    trait-vrodos-asset-cpt-shared.php
    trait-vrodos-asset-cpt-submission.php
    trait-vrodos-asset-cpt-taxonomy-admin.php
  asset-optimization/
    class-vrodos-asset-optimization-admin-controller.php
    trait-vrodos-asset-optimization-admin-actions.php
    trait-vrodos-asset-optimization-analysis.php
    trait-vrodos-asset-optimization-dashboard.php
    trait-vrodos-asset-optimization-derivatives.php
    trait-vrodos-asset-optimization-scanner.php
    trait-vrodos-asset-optimization-settings.php
```

## Verification Already Run

- PHP lint for refactored manager files and extracted admin files.
- PHP reflection smoke checks for expected facade/controller methods.
- `node --check assets/js/editor/vrodos_dashboard_assets.js`
- `git diff --check`

## Manual UI Verification Still Recommended

- Load top-level VRodos dashboard:
  - Active Projects tab renders.
  - Actionable Assets tab renders.
  - AJAX refresh analysis updates a row and shows a notice.
  - AJAX Compile Use toggle updates a row and shows a notice.
  - Safe Draco generation still redirects back to the Actionable Assets tab.
- Load Settings > Assets:
  - diagnostics/reporting still shows only GLB-referenced assets.
  - non-GLB media does not appear as optimization work.
- Edit a `vrodos_asset3d` GLB:
  - Asset Data metabox renders.
  - GLB Optimization metabox renders.
  - taxonomy boxes save correctly.
  - compile-use settings save correctly.
- Use the frontend asset editor:
  - creating an asset works.
  - editing an asset works.
  - upload-limit and GLB-upload notices render correctly.
- Delete a GLB asset:
  - derivative cache directory is removed.
  - derivative and analysis metadata are removed.

## Optional Follow-Up Cleanup

These are not required to consider the refactor complete.

- Convert extracted traits into concrete service classes after manual WordPress UI verification.
- Move dashboard-specific enqueue logic out of `VRodos_Asset_Manager` only if admin asset ownership grows further.
- Add small integration tests or smoke scripts for admin facade class loading if the repo gets a PHP test harness.
- Consider moving dashboard notice rendering into a reusable admin notice helper if more dashboard/admin surfaces need the same behavior.

## Commit Message

```text
Refactor VRodos admin managers
```
