import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const fontDir = new URL('../assets/vendor/fonts/noto-sans/', import.meta.url);
const atlas = JSON.parse(readFileSync(new URL('NotoSans-Regular-msdf.json', fontDir), 'utf8'));
const png = readFileSync(new URL('NotoSans-Regular-msdf.png', fontDir));
const image = await sharp(png).metadata();
const { data: pixels, info: raster } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
assert.deepEqual(atlas.pages, ['NotoSans-Regular-msdf.png']);
assert.equal(atlas.common.pages, 1, 'the font uses one static atlas');
assert.equal(atlas.distanceField.fieldType, 'msdf');
assert.equal(image.width, atlas.common.scaleW);
assert.equal(image.height, atlas.common.scaleH);
const glyphs = new Map(atlas.chars.map((glyph) => [glyph.id, glyph]));
assert.equal(glyphs.size, atlas.chars.length, 'glyph IDs must be unique');
const required = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
    'áéíóúüñÁÉÍÓÚÜÑ¿¡àèòçïÀÈÒÇÏ·' +
    'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω' +
    'άέήίόύώΆΈΉΊΌΎΏϊϋΐΰς' + '.,;:!?()[]«»“”‘’–—…€';
for (const character of new Set(required)) {
    const glyph = glyphs.get(character.codePointAt(0));
    assert.ok(glyph, `missing glyph ${character}`);
    assert.ok(glyph.width > 4 && glyph.height > 4, `empty glyph ${character}`);
    let minimum = 255;
    let maximum = 0;
    for (let y = glyph.y; y < glyph.y + glyph.height; y++) {
        for (let x = glyph.x; x < glyph.x + glyph.width; x++) {
            const offset = (y * raster.width + x) * raster.channels;
            const median = [pixels[offset], pixels[offset + 1], pixels[offset + 2]].sort((left, right) => left - right)[1];
            minimum = Math.min(minimum, median);
            maximum = Math.max(maximum, median);
        }
    }
    assert.ok(minimum < 100 && maximum > 150, `glyph ${character} has no visible distance field`);
}
for (const glyph of glyphs.values()) {
    assert.equal(glyph.page, 0);
    assert.ok(glyph.x >= 0 && glyph.y >= 0 && glyph.x + glyph.width <= image.width && glyph.y + glyph.height <= image.height, `glyph ${glyph.char} exceeds its atlas`);
    assert.ok([glyph.xadvance, glyph.xoffset, glyph.yoffset].every(Number.isFinite));
}
console.log('Compiled text font coverage tests passed.');
