# Networked-Aframe Patch Queue

VRodos ships a patched Networked-Aframe browser bundle from `assets/vendor/networked-aframe/dist/`.

Do not edit the generated dist files by hand. To update Networked-Aframe:

1. Edit `config.json` with the upstream package version.
2. Update or add the matching patch file.
3. Run `npm run build:naf -- --patch-only` to check that the patch applies.
4. Run `npm run build:naf`.
5. Test networked compiled scenes before committing the regenerated dist files.

The VRodos network server is first-party code under `services/vrodos-network-runtime/`; server behavior does not belong in this patch queue.

New VRodos multiplayer features should live outside patched NAF by default. Use `window.NAF`, custom data channels, first-party A-Frame components, or `NAF.adapters.register()` for transport-level extensions before adding another source patch.
