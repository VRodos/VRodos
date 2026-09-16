# Automatic geometry optimization

VRodos uses the installed glTF Transform and meshoptimizer libraries in its existing background derivative pipeline. There is no custom decimation algorithm or Blender dependency. Source uploads remain unchanged.

The shared policy is `assets/asset-geometry-policy.json`. Each Web derivative starts from the source or the unsimplified prepared baseline, never from a lower-quality derivative.

| Asset recipe | Desired triangle count | Meshoptimizer relative error limit |
| --- | --- | --- |
| Web High | Up to 250,000; smaller models keep their triangles | 0.001 |
| Web Medium | Lower of 100,000 or 80% of source triangles | 0.005 |
| Web Low | Lower of 50,000 or 50% of source triangles | 0.01 |

These are soft triangle targets. The simplifier may stop early to respect topology and its error limit. Error is the library's geometric estimate relative to primitive extent, not a guarantee of perceptual equivalence or a bound on subsequent compression quantization.

Safeguards:

- Assets below 10,000 triangles bypass simplification.
- Triangle primitives with 1,000 or fewer triangles are untouched by simplification; larger primitives retain a minimum target of 1,000.
- Meshoptimizer locks open borders and uses its normal topology-preserving mode. No sloppy or permissive simplification is enabled.
- Explicit geometry protection, walkable/collision mesh policy, skins, and morph targets bypass simplification at every quality level.
- Materials, node hierarchy, placement transforms, source-owned origins, and decoration collision boxes retain their existing ownership. Decoration boxes continue to use source bounds.
- Non-triangle primitives bypass this policy.

Upload activation queues the existing High → editor preview → Medium → Low family when a source reaches 50,000 triangles, the existing 20 MiB source threshold, or the existing 8 MiB uncompressed-image threshold. Build joins the required immutable job. Pipeline version 7 invalidates older recipe results, and protected/unprotected variants have distinct identities at every level. Existing assets are reconsidered when their build requests preparation; this change does not bulk regenerate all historical uploads immediately.

The optimizer manifest and stored derivative metadata record original/result triangle counts, requested target, error limit, skip reason, and whether the target was reached.

## Validation

- Preservation tests cover small parts, planar geometry, attributes/materials, transforms, explicit protection, skins, morph targets, and GLB reloading.
- Queue tests cover dense small files, repeated requests, ordered family preparation, profile selection, and protected variant separation.
- The complete High optimizer on the Acropolis columns produced 309,109 triangles from 1,241,316 (75.1% fewer), stopping above its 250,000 target. The compressed GLB shrank from 2,279,136 to 1,033,444 bytes and passed the optimizer's runtime-substitution checks.
- This result is offline validation. Published scenes need regeneration/recompilation and headset visual/FPS measurement before claiming a live performance gain.
