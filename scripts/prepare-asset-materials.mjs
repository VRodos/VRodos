import { prune } from '@gltf-transform/functions';

const ANISOTROPY = 'KHR_materials_anisotropy';

function hasUsableTangentFrame(primitive, uvChannel) {
    const normals = primitive.getAttribute('NORMAL');
    const tangents = primitive.getAttribute('TANGENT');
    if (!normals) return false;
    const n = [], t = [];
    if (tangents && tangents.getCount() !== normals.getCount()) return false;
    for (let i = 0; i < normals.getCount(); i++) {
        normals.getElement(i, n);
        if (!n.every(Number.isFinite) || Math.hypot(...n) === 0) return false;
        if (!tangents) continue;
        tangents.getElement(i, t);
        if (!t.every(Number.isFinite) || Math.abs(t[3]) !== 1) return false;
        const crossLength = Math.hypot(n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]);
        if (!(crossLength > 1e-8 * Math.hypot(...n) * Math.hypot(t[0], t[1], t[2]))) return false;
    }
    if (tangents) return true;

    const uv = primitive.getAttribute(`TEXCOORD_${uvChannel}`);
    if (!uv || uv.getCount() !== normals.getCount()) return false;
    const indices = primitive.getIndices()?.getArray();
    const count = indices ? indices.length : uv.getCount();
    const mode = primitive.getMode();
    if (![4, 5, 6].includes(mode) || count < 3) return false;
    const a = [], b = [], c = [];
    const vertex = (i) => indices ? indices[i] : i;
    for (let i = 0; i + 2 < count; i += mode === 4 ? 3 : 1) {
        uv.getElement(vertex(mode === 6 ? 0 : i), a);
        uv.getElement(vertex(i + 1), b);
        uv.getElement(vertex(i + 2), c);
        const ux = b[0] - a[0], uy = b[1] - a[1];
        const vx = c[0] - a[0], vy = c[1] - a[1];
        const determinant = ux * vy - uy * vx;
        // Attribute presence is insufficient: collapsed UV triangles yield a zero
        // tangent frame and NaN specular pixels, even with finite material scalars.
        const scale = Math.hypot(ux, uy) * Math.hypot(vx, vy);
        if (!Number.isFinite(determinant) || !(Math.abs(determinant) > 1e-8 * scale)) return false;
    }
    return true;
}

/** Preserve anisotropy's geometry inputs and remove it only where no tangent frame is possible. */
export async function prepareAssetMaterials(document) {
    const repairedMaterials = new Map();
    const disabledAnisotropy = [];
    let keepAttributes = false;

    for (const mesh of document.getRoot().listMeshes()) {
        for (const [index, primitive] of mesh.listPrimitives().entries()) {
            const material = primitive.getMaterial();
            if (!material?.getExtension(ANISOTROPY)) continue;

            // Three derives a tangent frame from the normal map's UVs, or TEXCOORD_0,
            // when authored tangents are absent. Scalar anisotropy still needs this data.
            const uvChannel = material.getNormalTexture()
                ? material.getNormalTextureInfo().getTexCoord() : 0;
            if (hasUsableTangentFrame(primitive, uvChannel)) {
                keepAttributes = true;
                continue;
            }

            // A material can be shared by valid and invalid primitives. Do not change
            // the valid primitive's authored directional highlights.
            if (!repairedMaterials.has(material)) {
                repairedMaterials.set(material, material.clone().setExtension(ANISOTROPY, null));
            }
            primitive.setMaterial(repairedMaterials.get(material));
            disabledAnisotropy.push({ mesh: mesh.getName(), primitive: index, material: material.getName() });
        }
    }

    // glTF Transform's prune currently treats untextured anisotropy tangents/UVs
    // as unused (upstream prune.ts TODO #748). Preserve attributes for these assets.
    await document.transform(prune({ keepLeaves: true, keepSolidTextures: true, keepAttributes }));
    return disabledAnisotropy;
}
