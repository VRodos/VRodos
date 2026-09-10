# VRodos Storage and Publication

VRodos separates private authoring files from public compiled experiences. Mutable paths are owned by `VRodos_Storage_Manager`; callers provide an entity ID and a fixed storage role. Project slugs and request globals never participate in path construction.

## Layout

The default private base is `vrodos-private` beside the WordPress public directory. `VRODOS_PRIVATE_STORAGE_DIR` may override that absolute base. Every site is isolated below `site-{blog_id}`:

```text
site-{blog_id}/
  assets/{asset_id}/source/
  assets/{asset_id}/previews/
  assets/{asset_id}/derivatives/{profile}/
  scenes/{scene_id}/previews/
  scenes/{scene_id}/backgrounds/
  tmp/{operation}/{random-token}/
```

VRodos refuses to operate when the private base is relative, inside `ABSPATH` or uploads, unavailable, or unwritable. Administrators receive a fail-closed diagnostic.

Published experiences are intentionally public:

```text
wp-content/uploads/vrodos/published/projects/{project_id}/
  clients/
  media/
```

Compilation resolves current attachment IDs, automatically selects the validated derivative required by the runtime profile, hashes each required media file with SHA-256, and publishes that immutable copy before atomically replacing the client set. The project post stores `_vrodos_published_inventory`; stale media is removed only after successful client publication. The network runtime serves the publication root at `/vrodos-published/` and accepts `VRODOS_PUBLISHED_ROOT` as an override.

## Published HTTP cache policy

Every build refreshes a marked `VRodos Published Cache` block in `uploads/vrodos/published/.htaccess`. It gives SHA-256-named files under `projects/{id}/media/` the header `Cache-Control: public, max-age=31536000, immutable`, while generated HTML under `projects/{id}/clients/` receives `Cache-Control: no-store, no-cache, must-revalidate`. A cache-policy write failure does not invalidate an otherwise atomic build: it is returned as a compile warning and remains visible to administrators until the policy can be installed.

Hosts that disable Apache per-directory overrides must configure the same rules at virtual-host level. An equivalent Apache 2.4 configuration is:

```apache
<LocationMatch "/vrodos/published/projects/[0-9]+/media/[a-f0-9]{64}\.[A-Za-z0-9]+$">
    Header always set Cache-Control "public, max-age=31536000, immutable"
</LocationMatch>
<LocationMatch "/vrodos/published/projects/[0-9]+/clients/[^/]+\.html$">
    Header always set Cache-Control "no-store, no-cache, must-revalidate"
</LocationMatch>
```

Equivalent Nginx locations are:

```nginx
location ~ ^/wp-content/uploads/vrodos/published/projects/[0-9]+/media/[a-f0-9]{64}\.[A-Za-z0-9]+$ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}
location ~ ^/wp-content/uploads/vrodos/published/projects/[0-9]+/clients/[^/]+\.html$ {
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
}
```

The Node network runtime applies the same headers to both of its publication mounts. Private authoring attachments deliberately remain `private, max-age=0, must-revalidate`: browsers may reuse the body after authenticated validation, but a reopened editor must reconstruct parsed Three.js objects and GPU resources. Clearing site data, private browsing, eviction, or another device causes an expected redownload.

## Public showcase integration

WordPress themes and other same-installation consumers must use the URL returned by the compiler (`MasterClient` or `CurrentSceneMasterClient`). When a URL must be resolved later, first resolve the scene's project through its `vrodos_scene_pgame` taxonomy term, then call `VRodos_Storage_Manager::published_project_url( $project_id, 'clients', $filename )`. Filesystem existence checks use the matching `published_project_directory()` method. Do not build links beneath `wp-content/plugins/VRodos/runtime/build/`; that tree is legacy migration input and is not the publication destination for new builds.

A compiled client copied into another theme or application is a vendored snapshot, not a live view of the installed plugin. Deploying a newer VRodos plugin does not rewrite that copy. Snapshot owners must deliberately regenerate or replace the client, its selected media, and every required runtime/vendor artifact, preserve the generated cache-version query strings, and repeat browser smoke tests. If a host marks theme assets as immutable, any mutable direct script, stylesheet, font, model, or decoder URL in the snapshot must also be content-addressed or receive a changed versioned URL.

## Authoring access

Private attachments retain normal WordPress attachment records, but their paths are absolute private paths and their authoring URLs use:

```text
admin-ajax.php?action=vrodos_private_media&id={attachment_id}
```

GET and HEAD are supported, including single byte ranges. Access requires permission to edit the owning asset or scene. Shared assets additionally allow logged-in editors. Scene documents store stable `asset_id` references and artistic state; the editor and compiler hydrate mutable media from attachment metadata.

## Rollout

Run migration during a maintenance window after filesystem and database backups:

```text
wp vrodos storage audit --format=json
wp vrodos storage migrate --resume
wp vrodos storage verify
wp vrodos storage cleanup --yes
```

Migration is locked, resumable, and records every copied file, source hash, and cleanup target. Cleanup is unavailable until verification passes; it rejects symlinks, changed hashes, and out-of-root targets. Unknown directories are reported and preserved. External URLs remain external.

Canonical shared repositories are enabled only after storage schema verification. Fresh installs set the schema immediately; upgraded installations keep repository creation disabled until `verify` succeeds, preventing new and legacy repository slugs from colliding during rollout.

Uninstall preserves authored and published data. Intentional destructive cleanup requires `wp vrodos storage purge --yes`, which deletes only attachments carrying VRodos ownership metadata and project publication trees.

## Immerse connector contract

`vrodos-immerse-connector` requires this storage schema to be verified before it initializes. Remote imports are staged below private `tmp/immerse-*` roles, then copied into the owning asset's `source/` directory through `VRodos_Storage_Manager`. Re-import switches all attachment references before the prior owned attachment is deleted. Connector scene injection persists IDs only; editor hydration and compilation resolve current media metadata.

GLB thumbnail capture reads the private attachment from a temporary local browser document and selects Three.js and decoder artifacts from `VRodos_Render_Runtime_Manager`. It does not add a logged-out source-file route. Connector cleanup delegates asset, scene, and publication deletion to the same ownership-checked storage service.
