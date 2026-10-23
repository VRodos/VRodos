# Prepared headset lighting and server baking plan

## Current workflow

Each GLB asset can have one optional **Baked version for VR headset**, added on its frontend asset editor or WordPress asset edit screen. The original GLB remains the desktop/editor/PCVR source. A separate per-asset enable checkbox is deliberately omitted: an uploaded, valid bake is available for selection.

The build menu's **Use prepared baked models for VR headset** toggle selects available bakes only for the standalone headset variant. It is off by default and applies project-wide during compilation. Models without a prepared bake retain the normal derivative policy. Automatic builds can therefore publish original desktop/PCVR media and baked headset media in the same transaction.

Prepared bakes must:

- Be self-contained GLB 2 files, at most 100 MiB, with no embedded runtime lights.
- Keep the source's origin, scale, placement and walking/collision geometry. The current attachment validation does not automatically prove geometric equivalence; the preparation workflow must validate it.
- Contain embedded PNG/JPEG/KTX2 images within the selected headset texture cap (1024/2048/4096 px). Prepared files are published directly, so compress and validate them before uploading. A high-resolution bake is not silently substituted into a Low headset build.

Attachments are copied to asset-owned private `assets/{asset_id}/headset-baked/` storage and participate in asset-owned cleanup. Source SHA-256 provenance is recorded when a new bake is attached. Replacing the original invalidates the bake: affected builds stop with a rebake/reattach message. Saving unrelated asset fields does not certify the old bake again. Removing/replacing a bake releases its owned attachment when no longer referenced.

Bake attachment failures retain the previous prepared version. Other asset edits may already have saved; a failed bake attachment is not a transaction rollback of the entire asset form. For frontend uploads, save/import the original before attaching a bake.

After deployment, attach the prepared Music Store file to its original asset, save, enable the headset build toggle and recompile. No runtime JavaScript chooses between full and baked models after loading; the compiler publishes the selected media into each concrete client.

## Music Store preparation

The local prototype uses a copy of `Store_Quest2_Optimized.blend`, retaining geometry and the authored 17-light arrangement during the offline bake. Opaque surfaces receive non-overlapping bake UVs and 512/1024 px lighting textures. Glass retains its separate material and the existing standalone headset glass approximation.

The exported baked GLB removes the 17 lights. Combined static illumination is stored in emissive materials, with black diffuse response, zero material specular weight and per-texture HDR emissive strength. Bake files are decoded according to their saved color-space metadata, normalized, encoded to sRGB PNG and compressed with the Web Low texture recipe. Do not force saved sRGB bake buffers to linear: that lifts dark colors and produces a washed-out result. Runtime quality refreshes preserve the prepared model's authored emissive intensity.

The final Music Store package reuses the compressed textures with the original baked geometry and direct Meshopt encoding, without quantization, welding or simplification. This preserves all 525,848 triangles, 150 meshes and exact exported bounds; the intermediate Draco output removed thin triangles and is not the delivered file. `MusicStore_Headset_Baked_Ready.glb` is 22,742,332 bytes, contains zero embedded lights and 145 images with a maximum dimension of 1024 px. The PHP prepared-file validator accepts it at Low headset quality. Three reference viewpoints were rendered for comparison; fine lettering is softer at the current bake resolution.

This avoids clipping bright bake values and avoids lighting the baked colors again through the removed lights. It does not eliminate all rendering cost or all runtime/global lighting calculations. Structural checks and desktop renders do not establish headset performance or prove that the earlier headset crashes are fixed.

A desktop Chrome load of the final package with the current runtime confirmed the headset material profile, an empty transmission queue, no shader failures, no network failures and no JavaScript exceptions. It did not enter immersive XR or modify the deployed files.

This is fixed lighting. A texture bake cannot preserve arbitrary moving highlights, dynamic shadows, moved objects or changed lighting. Compare the resulting appearance rather than promising pixel-identical lighting at every viewpoint. Keep the original model for desktop and PCVR.

Local working artifacts and render comparisons are under `C:/Users/tasos/.codex/visualizations/2026/10/23/01a167b1-4bbb-7b72-a0d1-005ceff3b71a/MusicStore_Baked/`. They are not bundled with the WordPress plugin or automatically deployed.

## Planned server-side Blender worker

This section is a proposal, not an installed server worker. The first release intentionally consumes prepared files.

### 1. Eligibility and job request

Add **Create headset lighting bake** next to the asset's prepared-GLB upload once the deployment health check confirms a Blender worker is configured. Keep the existing upload option for artist-authored bakes.

Start with static GLB assets containing embedded punctual lights. Do not automatically bake every upload or every compile. Reject unsupported/skinned/morphed/animated light arrangements initially, with a concrete explanation. Bakes of asset-local lights are reusable across scenes; scene/world lighting and shadows from other placements require a separate scene-specific bake contract and must not be captured accidentally.

The user chooses the intended headset texture quality before queueing. Display estimated texture allocation and limitations, and keep the prior valid bake available while a replacement is prepared.

### 2. Worker deployment

Run a pinned Blender LTS image as a dedicated process/container on a host with adequate CPU/RAM and preferably a supported GPU. Do not run Blender synchronously in PHP-FPM or rely on a browser keeping a request open. A CPU-only deployment remains possible but needs measured execution and memory limits.

Use a real host scheduler/queue consumer. WordPress submits immutable jobs and reads status. The worker receives only an asset-owned source snapshot and a generated recipe; it must not execute Python or enable auto-run scripts supplied by uploaded `.blend` files. Import validated GLB for the initial server feature. Authored `.blend` support needs a separate trust and dependency policy.

Define resource limits, isolated writable scratch space, no unnecessary network access, process-tree cancellation and cleanup on timeout/failure. Keep the Blender worker separate from the existing KTX worker lease so a long bake does not block ordinary derivatives.

### 3. Deterministic recipe and caching

Key jobs by source SHA-256, bake recipe version, pinned Blender version, target texture cap, UV/atlas policy, sample/bounce settings and included light/material inputs. An unchanged bake is reused. Relevant input changes invalidate it. Preserve provenance in the prepared attachment record so both uploaded and generated bakes use the same compiler selection contract.

Process stages: eligibility inspection → original reference renders → UV/atlas preparation → lighting bake → color/HDR encoding → KTX2/geometry compression → structural/visual validation → reference previews → atomic publication.

Use a real heartbeat and stage timestamps while Blender is busy, not merely a one-time lease. Expose elapsed time and current stage in Background Jobs. Retain actionable stderr on failure without reporting an unchanging compression/bake percentage as meaningful progress.

### 4. Appearance and geometry gates

Atlas packing must maintain useful texel density for large surfaces and small text. Generate margins appropriate for mipmaps. Bound the total decoded texture allocation, not just each image's dimensions.

Preserve original geometry, transforms, origin and source bounds for the first automatic lighting recipe. Do not combine a lighting bake with geometry reduction. Compare walking support/collision probes and exported bounds before accepting a result.

Preserve the relevant base textures, transparency and readable emissive elements. Handle glass separately. Prefer a hybrid diffuse/lightmap approach for reflective hero objects if full combined baking loses their appearance. Calibrate color-space and HDR handling with numeric fixtures and controlled renders; avoid double tone mapping or double lighting.

Reject missing/black/nonfinite images, external dependencies, remaining embedded lights, shader failures, texture-cap violations and excessive decoded memory. Compare several fixed camera views and retain both reference and baked previews. Numeric image similarity is a diagnostic, not sufficient visual approval for all materials.

### 5. Publication and UI states

Only after validation, atomically store the candidate as an asset-owned prepared attachment and update its source provenance. If the source changed during processing, discard the stale candidate. A failure/cancellation never overwrites the prior valid bake.

Asset states should read **Not added**, **Queued**, **Baking**, **Validating**, **Ready**, **Needs rebaking** or **Failed**, with Add/replace, Preview, Rebuild and Remove actions as applicable. There is still one build toggle controlling headset selection; neither asset preparation nor that toggle changes desktop source quality.

Report how many prepared models a build used. Make missing-bake behavior explicit: ordinary assets can remain on their regular headset derivative, while an attached stale/invalid bake must stop the build rather than silently selecting it.

### 6. Acceptance before enabling server generation

- Music Store preserves the approved bright appearance with zero embedded point lights.
- Desktop and PCVR retain the original GLB selection and rendering policy.
- Headset object quality limits and decoded texture budgets remain enforced.
- Geometry, transforms and walking/collision acceptance probes remain unchanged.
- Source changes, interrupted workers and failed validation cannot activate stale output.
- Repeated identical requests deduplicate and reuse a completed bake.
- Performance measurements include inline Quest first; immersive testing requires a separately agreed supervised test. Do not infer a crash fix from asset size or desktop renders.
