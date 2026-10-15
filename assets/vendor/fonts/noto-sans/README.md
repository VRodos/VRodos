# Noto Sans compiled text atlas

`NotoSans-Regular-msdf.json` and `NotoSans-Regular-msdf.png` are static BMFont/MSDF assets for compiled 3D-text panels. The font source is the adjacent `NotoSans-Regular.ttf`; its license is in `LICENSE`.

Generated using the installed `@zappar/msdf-generator` 1.2.4 public `MSDF.generate()` API, with:

- Font size: 48 px; one 2048 x 2048 texture.
- Distance field range: 4 px; padding: 4 px; overlap fixing enabled.
- Character ranges (inclusive): U+0020–U+007E, U+00A0–U+017F, U+0370–U+03FF, U+1F00–U+1FFF, U+2000–U+206F, plus U+20AC (€).
- Export the returned font's inline PNG to `NotoSans-Regular-msdf.png` and set its JSON `pages` array to that filename.

The atlas covers Spanish, Catalan, Greek, accented Greek, and common punctuation. The generated distance field is positive inside glyphs, so A-Frame text must use `shader="msdf"` and `negate="false"`. Keep font and image URLs local through `VRodos_Path_Manager`.

Generation is a development step only. Deploy both generated files with the compiler change and rebuild published scenes. Runtime scenes do not run the font generator.
