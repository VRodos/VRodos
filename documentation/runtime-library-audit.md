# Runtime library audit

Validated against `package-lock.json`, `services/vrodos-network-runtime/package-lock.json`, and generated runtime manifests on 2026-08-26. Package peer metadata and the linked official documentation were last audited on 2026-08-26. Lockfiles are the exact-version authority; generated manifests must agree with them.

## Browser and compiled-runtime libraries

| Library | Locked version / source | Relevant peer range | Public API used | Owner and loading policy | Local artifact | Official documentation |
|---|---|---|---|---|---|---|
| A-Frame | 1.8.0 master artifact at `e145c1a`; root `vrodos.runtime` | Bundles its compatible Three runtime | scene/components, `gltf-model`, WebXR renderer | `build-runtime-vendors.mjs`; baseline | `assets/vendor/aframe/aframe-master.min.js` | [A-Frame 1.8.0](https://aframe.io/docs/1.8.0/introduction/) |
| Three (`super-three` alias) | 0.185.0; root lock | n/a | core classes and documented addons/loaders | `build-runtime-vendors.mjs`; baseline | `assets/vendor/three-r185/` | [Three.js r185 docs](https://threejs.org/docs/) |
| postprocessing | 6.39.4; root lock | Three `>=0.168 <0.186` | composer/effects public exports | `build-runtime-vendors.mjs`; lazy PMNDRS | `vrodos-postprocessing.bundle.js` | [postprocessing docs](https://pmndrs.github.io/postprocessing/public/docs/) |
| three-mesh-bvh | 0.9.14; root lock | Three `>=0.159` | `acceleratedRaycast`, `computeBoundsTree`, `disposeBoundsTree` | `build-runtime-vendors.mjs`; lazy collision | `vrodos-collision-bvh.bundle.js` | [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) |
| @takram/three-atmosphere | 0.19.1; root lock | Three `>=0.170`, postprocessing `>=6.36.7`; React peers optional for vanilla exports | package-root atmosphere/celestial exports | `build-runtime-vendors.mjs`; lazy atmosphere | `vrodos-takram-atmosphere.bundle.js` | [three-atmosphere](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/three-atmosphere) |
| @takram/three-clouds | 0.7.6; root lock | Three `>=0.170`, postprocessing `>=6.36.7`; React peers optional | package-root cloud exports | `build-runtime-vendors.mjs`; lazy clouds; gated UV patch | `vrodos-takram-clouds.bundle.js` | [three-clouds](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/three-clouds) |
| @takram/three-geospatial | 0.9.1; direct root lock | Three `>=0.170`; React peer optional | package-root shader/geodetic utilities | Takram vendor build; lazy clouds | folded into Takram bundles | [three-geospatial](https://github.com/takram-design-engineering/three-geospatial) |
| @takram/three-geospatial-effects | 0.6.4; root lock | Three `>=0.170`, postprocessing `>=6.36.4`; React peers optional | package-root effects | `build-runtime-vendors.mjs`; lazy atmosphere | folded into Takram bundle | [three-geospatial effects](https://github.com/takram-design-engineering/three-geospatial) |
| @pmndrs/uikit | 1.0.75; root lock | Three `>=0.162` | vanilla `Root`, containers/text/input lifecycle | `build-runtime-master-bundles.mjs`; lazy spatial UI | `vrodos-runtime-spatial-ui.bundle.js` | [UIKit vanilla guide](https://pmndrs.github.io/uikit/docs/getting-started/vanilla) |
| @pmndrs/uikit-horizon | 1.0.75; root lock | UIKit/Three through package graph | Horizon components | spatial UI bundle; lazy | spatial UI bundle | [UIKit Horizon](https://pmndrs.github.io/uikit/docs/) |
| @pmndrs/uikit-lucide | 1.0.75; root lock | UIKit/Three through package graph | icon components | spatial UI bundle; lazy | spatial UI bundle | [UIKit icons](https://pmndrs.github.io/uikit/docs/) |
| @pmndrs/pointer-events | 6.6.30; root lock | package graph | pointer registration/update/teardown | spatial UI bundle; lazy | spatial UI bundle | [pointer-events](https://github.com/pmndrs/xr/tree/main/packages/pointer-events) |
| @pmndrs/msdfonts | 1.0.75; direct root lock | package graph | font/MSDF support imported by UIKit | spatial UI bundle; lazy | spatial UI/font assets | [UIKit text](https://pmndrs.github.io/uikit/docs/) |
| @zappar/msdf-generator | 1.2.4; root lock | none declared | documented worker/WASM runtime files | runtime build; lazy spatial UI | `assets/vendor/zappar-msdf-generator/` | [Zappar MSDF generator](https://github.com/zappar-xr/msdf-generator) |
| aframe-extras | 7.7.0; direct root lock | A-Frame runtime | distributed A-Frame components | browser vendor copy; omitted only for lean headset | `assets/vendor/aframe-extras/` | [A-Frame Extras](https://github.com/c-frame/aframe-extras) |
| aframe-environment-component | 1.5.0; direct root lock | A-Frame runtime | `environment` component | browser vendor copy; legacy-background capability | `assets/vendor/aframe-environment/` | [Environment component](https://github.com/supermedium/aframe-environment-component) |
| stats-gl | 4.2.3; direct root lock | none declared | default `Stats` package export | generated single-file ESM bundle; lazy FPS capability | `assets/vendor/stats-gl/main.js` | [stats-gl](https://github.com/RenanMConcepts/stats-gl) |
| lil-gui | 0.21.0; direct root lock | none declared | `lil.GUI` UMD API and CSS | browser vendor copy; editor/Simple UI | `assets/vendor/lil-gui/` | [lil-gui](https://lil-gui.georgealways.com/) |
| Lucide | 1.34.0; direct root lock | none declared | `lucide.createIcons()` UMD API | browser vendor copy; UI | `assets/vendor/lucide/` | [Lucide guide](https://lucide.dev/guide/) |
| NoSleep.js | 0.12.0; vendored file banner | none declared | `new NoSleep()`, `enable()` | manually vendored legacy actor-client wake lock; Simple only | `assets/js/runtime/NoSleep.min.js` | [NoSleep.js](https://github.com/richtr/NoSleep.js) |
| SpectorJS | 0.9.30; pinned jsDelivr URL | none declared | `SPECTOR.Spector` capture API | diagnostics-only dynamic loader; absent unless explicitly requested | no local artifact | [SpectorJS](https://github.com/BabylonJS/Spector.js) |
| Networked-AFrame | 0.14.3; `patches/networked-aframe/config.json` | A-Frame/adapter runtime | `NAF.entities`, schemas, connection/data-channel APIs | `build-networked-aframe-vendor.mjs`; networked only | `assets/vendor/networked-aframe/dist/` | [Networked-AFrame](https://github.com/networked-aframe/networked-aframe) |

## Build and service dependencies

| Library | Locked version / source | Relevant peer range | Use / build owner | Lazy/local result | Official documentation |
|---|---|---|---|---|---|
| @gltf-transform/cli | 4.4.2; root lock | none declared | explicit GLB audit/derivative tooling | CLI only | [glTF Transform](https://gltf-transform.dev/) |
| esbuild | 0.28.2; root lock | none declared | all generated browser bundles | build only | [esbuild](https://esbuild.github.io/) |
| meshoptimizer | 1.2.0; root lock | none declared | decoder copy/asset tooling | `assets/vendor/three-r185/meshopt/` | [meshoptimizer](https://github.com/zeux/meshoptimizer) |
| Tailwind CSS | 3.4.19; root lock | PostCSS toolchain | prefixed source CSS build | generated CSS | [Tailwind v3](https://v3.tailwindcss.com/docs/installation) |
| DaisyUI | 4.12.24; root lock | Tailwind plugin | prefixed component styles | generated CSS | [DaisyUI v4](https://v4.daisyui.com/docs/install/) |
| PostCSS | 8.5.26; root lock | none declared | CSS pipeline | build only | [PostCSS](https://postcss.org/) |
| Autoprefixer | 10.5.4; root lock | PostCSS `^8.1` | CSS prefixing | build only | [Autoprefixer](https://github.com/postcss/autoprefixer) |
| ESLint | 10.9.1; root lock | optional `jiti` | JS static checks | build only | [ESLint](https://eslint.org/docs/latest/) |
| Prettier | 3.9.6; root lock | none declared | formatting | build only | [Prettier](https://prettier.io/docs/) |
| Express | 4.22.2; service lock | none declared | HTTP/static/health routes | network service only | [Express 4](https://expressjs.com/en/4x/api.html) |
| Socket.IO | 4.8.3; service lock | matching server-served browser client | signaling transport and `/socket.io/socket.io.js` | networked only | [Socket.IO client installation](https://socket.io/docs/v4/client-installation/) |
| open-easyrtc | 2.1.8; service lock | Socket.IO/Express service graph | EasyRTC adapter server | networked only | [Open-EasyRTC](https://github.com/open-easyrtc/open-easyrtc) |

The service lock also records the patched Socket.IO transport tree (`engine.io` 6.6.9, `engine.io-client` 6.6.6, `socket.io-adapter` 2.5.8, and `ws` 8.21.1). `npm audit --omit=dev` reported zero vulnerabilities after this patch-only lock refresh on 2026-07-15.

The compiled CSS also imports the Outfit family from the versionless Google Fonts CSS endpoint. It is an external font asset, not an executable runtime library; the Greek spatial-UI fonts remain vendored Noto Sans assets.

EasyRTC uses peer-to-peer mesh topology for media/data channels. Its practical room-size and bandwidth constraints therefore follow the Networked-AFrame [adapter comparison guidance](https://github.com/networked-aframe/networked-aframe/wiki/NAF-adapters-comparison); it is not a selective-forwarding architecture.

## Provenance rules

- `assets/runtime-version-manifest.json` schema v2 records runtime and browser-library versions and must match the root lockfile.
- `assets/runtime-build-manifest.json` schema v2 owns chunk order, dependencies, capabilities, source files, and local artifacts.
- Compiled output must use local A-Frame/browser artifacts and the Socket.IO client served by the active service. There is no compile-time CDN fallback.
- Takram imports use package-root public exports. The local weather-UV shader deviation remains deterministic, policy-gated, and tested in the vendor build.
