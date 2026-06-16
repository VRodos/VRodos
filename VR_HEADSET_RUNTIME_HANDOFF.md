# VR Headset Runtime Handoff

Date: 2026-06-16

This is the short continuation note for the VR Headset runtime parity effort. The detailed plan is in `COMPILED_SCENE_PLATFORM_AUDIT_AND_VR_PARITY_PLAN.md`; the renderer details are in `RENDERING_PIPELINE.md`.

## Goal

Keep the Desktop compiled-scene pipeline intact while enabling as much Desktop functionality as possible in the VR headset runtime, one validated step at a time.

## Current Accepted State

- Compile UI exposes `Runtime Target`: `Desktop` or `VR Headset`.
- `Desktop` maps to internal `desktop` and keeps authored Desktop settings active.
- `VR Headset` maps to internal `baseline`.
- `baseline` is accepted on Quest 2.
- Accepted VR Headset features: A-Frame scene host, A-Frame horizon/environment, authored GLB/media rendering, controller input, thumbstick navigation, walkable navigation, static collision/BVH, static shadows, native renderer antialiasing, and readable midday lighting.
- Minor far-edge shimmer is acceptable and should be treated as solved unless it regresses.
- VR Headset baseline compiles without PMNDRS/Takram chunks even if the Desktop-authored scene uses PMNDRS/Takram.

## Known Blocked Paths

- PMNDRS composer/cloud ownership caused tiled stereo/compositor instability on Quest 2.
- Legacy post-FX/FXAA caused black-screen/tiled-framebuffer artifacts in immersive XR.
- Do not promote legacy FXAA, TAA, SAO/SSAO, SSR, bloom, lens flare, Takram clouds, or PMNDRS composer effects into VR Headset without a new XR-safe implementation and headset validation.

## Current Safe Test URL Pattern

Use ADB reverse and load through Quest Browser:

```powershell
$adb = 'C:\Program Files\Meta Quest Developer Hub\resources\bin\adb.exe'
$url = 'http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html?vrodos_debug_runtime_features=1'
& $adb reverse tcp:5832 tcp:5832
& $adb shell "am start -a android.intent.action.VIEW -d '$url' -p com.oculus.browser"
```

Do not test headset WebXR through `wp.local`; use `localhost:5832` through ADB reverse.

When testing through USB, `adb reverse tcp:5832 tcp:5832` only forwards the Quest's `localhost:5832` to the PC's `localhost:5832`; it does not start a server. If Quest Browser shows `empty response`, first verify that the PC is actually serving the WordPress public root on port `5832`. A reliable fallback is:

```powershell
$php = 'C:\Users\tasos\AppData\Roaming\Local\lightning-services\php-8.3.29+1\bin\win64\php.exe'
$root = 'D:\Development\WordPress\app\public'
Start-Process -FilePath $php -ArgumentList @('-S', '127.0.0.1:5832', '-t', $root) -WorkingDirectory $root -WindowStyle Hidden
Invoke-WebRequest -Uri 'http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html' -UseBasicParsing
```

Then run the ADB reverse/open command. The Quest URL should stay `http://localhost:5832/wp-content/plugins/VRodos/runtime/build/...`, not `wp.local`.

Before sending a new headset test URL, close existing Quest Browser scene tabs when possible. Stale scene tabs can ignore a fresh Android VIEW intent and keep an older `vrodos_cache_bust` URL active; if that happens, use the Quest Browser DevTools target to navigate the existing `Scene 1` page directly or close the page target before launching the next URL.

## VR Headset Parity Checklist

Track every stage here before promoting it. Keep `Status` as `Pending`, `In Progress`, `Blocked`, or `Accepted`.

| Stage | Status | Test URL | Expected Diagnostics | Headset Result | Next Action |
| --- | --- | --- | --- | --- | --- |
| Accepted baseline freeze | Accepted | `http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html?vrodos_debug_runtime_features=1` | `vrProfile.profile=baseline`, `takram.horizonOwner=aframe-environment`, `postProcessing.owner=vr-baseline-disabled`, `reflections.effectiveSource=none`, navigation/collision active | Quest 2 accepted; minor far-edge shimmer is not a blocker | Retest only after runtime changes touching renderer, navigation, collision, controller input, scene loading, or ray interaction |
| Fixture inventory | In Progress | See current test pages below | Only intentionally built pages are tracked | `Master_Client_8606.html` is the only known current page | Add more rows only after intentionally compiling representative scenes |
| Scene-owned lighting/material parity | Accepted | `Master_Client_8606.html?vrodos_vr_profile=safe&vrodos_debug_runtime_features=1` | `vrProfile.profile=safe`, no composer, no Takram visible sky, no clouds, no scene probe, no reflections, stable shadows/materials | User validated in Quest Browser: perfect | Move to hidden Takram-derived lighting-only stage |
| Takram-derived lighting only | Accepted | `Master_Client_8606.html?vrodos_vr_profile=takram-lights&vrodos_debug_runtime_features=1` on a Desktop/Takram-enabled rebuild | A-Frame horizon remains visible; no composer/clouds/reflections; `takram.lightsOnlyActive=true`, `takram.lightOwner=takram-light-source`, native renderer antialiasing enabled | Quest 2 accepted after cleanup: A-Frame blue/cream sky visible, AA clean, `takramSkyVisible=0`, `legacySuppressed=0`, no runtime errors | Proceed only to an isolated Takram visible-sky stage; keep clouds, composer, reflections, scene probes, and WebXR layers disabled |
| Takram visible sky without clouds | Accepted | `Master_Client_8606.html?vrodos_vr_profile=takram-sky&vrodos_debug_runtime_features=1` on a Desktop/Takram-enabled rebuild | Takram sky visible; `vrProfile.takramVisibleSky=true`; `takram.visibleSkyActive=true`; `takram.visibleSkyDirectCalibrated=true`; `takram.visibleSkyDirectExposure=24`; `takram.atmosphereProfile=vr-takram-sky:half:basic:combined`; PMNDRS composer/effects, clouds, reflections, scene probes, and WebXR layers remain disabled | Quest 2 accepted: sky/horizon are fine, AA remains clean, no reported browser instability after calibration | Proceed to HDR/env-map reflection validation only; keep scene probes, composer effects, clouds, and WebXR layers disabled |
| Reflections | Pending | Future HDR/env-map fixture URL | HDR/env-map first; scene probe remains disabled unless separately flagged | Not yet validated on headset | Start with HDR/env-map only; defer scene probes to separate flagged experiment |
| Composer/effects/clouds/WebXR layers/AR/MR | Pending | Lab-only future URLs | Explicit lab flags only | Not yet validated on headset | Defer until every lower stage is accepted |

## Current Test Pages

Do not treat arbitrary files already present in `runtime/build/` as validation fixtures. Add rows here only for pages intentionally built for this VR parity pass.

| Page | Role | Current Notes |
| --- | --- | --- |
| `Master_Client_8606.html` | Current built test page and accepted VR Headset baseline | Test through `http://localhost:5832/wp-content/plugins/VRodos/runtime/build/Master_Client_8606.html` on Quest via ADB reverse, or through the matching IP URL when needed. If the page was compiled as `VR Headset`, it intentionally omits PMNDRS/Takram chunks and can only validate that hidden Takram profiles fail closed. If the same scene was rebuilt through the public `Desktop` compile target with Takram atmosphere enabled, use hidden query profiles: `vrodos_vr_profile=takram-lights` for Takram light sources with the A-Frame horizon, or `vrodos_vr_profile=takram-sky` for Takram visible sky with composer/cloud/reflection/probe paths disabled. |

## Local Automated Smoke Results

- 2026-06-15 local Chrome/CDP baseline smoke passed for `Master_Client_8606.html?vrodos_debug_runtime_features=1`: effective profile `baseline`, scene-owned profile active, post-processing owner `direct`, A-Frame environment horizon, reflections `none`, high/static shadows, no network failures, no exceptions.
- 2026-06-15 local Chrome/CDP `safe` smoke passed for `Master_Client_8606.html?vrodos_vr_profile=safe&vrodos_debug_runtime_features=1`: effective profile `safe`, scene-owned profile active, post-processing owner `direct`, A-Frame environment horizon, reflections `none`, high/static shadows, no network failures, no exceptions.
- These local smoke results are not headset acceptance. User accepted the `safe` headset result in Quest Browser after the URL was launched through ADB reverse.
- 2026-06-15 implementation note: hidden `takram-lights` profile is wired into the runtime contract, runtime parsing, PHP normalization, generated bundles, and diagnostics. It keeps the A-Frame horizon visible and blocks composer/clouds/reflections/scene probes. On `Master_Client_8606.html`, expected behavior is fail-closed with `takram.lightsOnlyUnavailableReason=pmndrs-atmosphere-not-compiled` because the page was compiled as baseline without Takram chunks.
- 2026-06-15 local Chrome/CDP `takram-lights` fail-closed smoke passed for `Master_Client_8606.html?vrodos_vr_profile=takram-lights&vrodos_debug_runtime_features=1`: effective profile `takram-lights`, `vrProfile.takramLightsOnly=true`, `takram.horizonOwner=aframe-environment`, `takram.lightsOnlyRequested=true`, `takram.lightsOnlyActive=false`, `takram.lightsOnlyUnavailableReason=pmndrs-atmosphere-not-compiled`, reflections `none`, no network failures, no exceptions.
- 2026-06-16 headset note: on a Desktop/Takram-enabled rebuild of `Master_Client_8606.html`, Quest Browser diagnostics showed `takram.lightsOnlyActive=true`, `takram.lightOwner=takram-light-source`, `postProcessing.owner=vr-takram-lights-disabled`, reflections `none`, and renderer antialiasing forced to `true`. Visual result: jaggies fixed, but the horizon was black because a visible `vrodosPmndrsAtmosphereSky` mesh survived while A-Frame environment nodes were still tagged `vrodosPmndrsLegacySuppressed`.
- 2026-06-16 implementation note: hidden `takram-lights` now removes orphan PMNDRS/Takram atmosphere sky/star/moon visuals, restores A-Frame environment visuals that were suppressed by PMNDRS cleanup, and blocks `updatePmndrsHorizonSun()` / async Takram light refresh from recreating the visible Takram sky. Desktop and normal `VR Headset` behavior should remain unchanged because the cleanup is gated to `vrodos_vr_profile=takram-lights`.
- 2026-06-16 Quest Browser CDP accepted `takram-lights` on `Master_Client_8606.html?vrodos_vr_profile=takram-lights&vrodos_debug_runtime_features=1&vrodos_cache_bust=1781613988`: `presentation.mode=immersive-xr`, `rendererAntialias=true`, `glAntialias=true`, environment `skyType=atmosphere`, `takram.horizonOwner=aframe-environment`, `takram.lightOwner=takram-light-source`, `takram.lightsOnlyActive=true`, `takram.lightsOnlySourceCount=5`, `postProcessing.pmndrsActive=false`, `reflections.effectiveSource=none`, object stats `takramSkyVisible=0`, `legacySuppressed=0`, no stored runtime errors.
- 2026-06-16 implementation note: hidden `takram-sky` is wired as the visible-sky validation profile. It permits the Takram horizon sky path, preserves native renderer antialiasing, and keeps PMNDRS composer/effects, clouds, reflections, scene probes, Takram sky PMREM capture, and WebXR layers disabled unless a later isolated stage explicitly changes those gates.
- 2026-06-16 headset result: first `takram-sky` pass loaded in immersive Quest Browser with `takram.visibleSkyActive=true`, but the sky rendered nearly black and Quest UI became briefly less responsive during page initialization. The direct Takram `SkyMaterial` path was active without the PMNDRS composer tone step.
- 2026-06-16 implementation note: hidden `takram-sky` now forces a cheaper Takram atmosphere resource profile (`vr-takram-sky:half:basic:combined`), keeps the Takram ground-albedo branch enabled for the horizon, and applies a direct-sky exposure/gamma calibration shader hook only for that hidden profile. Default direct-sky exposure is `24`, with test override `vrodos_vr_takram_sky_exposure=...`. New diagnostics: `takram.atmosphereProfile`, `takram.atmospherePrecision`, `takram.atmosphereHigherOrderScattering`, `takram.visibleSkyDirectCalibrated`, and `takram.visibleSkyDirectExposure`.
- 2026-06-16 diagnostic note: this dark-sky failure was not primarily an AgX renderer setting issue. Takram `SkyMaterial` is a direct `RawShaderMaterial` with `toneMapped=false`, so the renderer's AgX tone mapping does not process the sky shader. The issue was the hidden direct-XR path bypassing the PMNDRS composer/final tonemapping step.
- 2026-06-16 Quest Browser CDP retest loaded `Master_Client_8606.html?vrodos_vr_profile=takram-sky&vrodos_debug_runtime_features=1&vrodos_cache_bust=1781621457`: tab-mode diagnostics showed `takram.visibleSkyActive=true`, `takram.visibleSkyDirectCalibrated=true`, `takram.visibleSkyDirectExposure=24`, `takram.atmosphereProfile=vr-takram-sky:half:basic:combined`, `groundAlbedo=#1a1a1a`, `postProcessing.owner=vr-takram-sky-disabled`, `reflections.effectiveSource=none`, `glAntialias=true`, and no stored runtime errors. Immersive VR visual acceptance is still pending.
- 2026-06-16 Quest 2 user acceptance: final `takram-sky` build is visually fine in headset after direct-sky calibration. Treat Takram visible sky without clouds as accepted. Next stage is HDR/env-map reflection validation only.

## Verification Checklist

- Rebuild runtime bundles after runtime JS changes: `node scripts\build-runtime-master-bundles.mjs`.
- Recompile generated scenes before headset testing.
- Run `node --check` for edited JS.
- Run PHP syntax checks for edited PHP.
- Run `git diff --check`.
- Validate in Quest Browser tab mode and immersive VR.
