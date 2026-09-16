import { prune } from '@gltf-transform/functions';

const ANISOTROPY = 'KHR_materials_anisotropy';

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
            const hasTangentFrame = primitive.getAttribute('NORMAL') &&
                (primitive.getAttribute('TANGENT') || primitive.getAttribute(`TEXCOORD_${uvChannel}`));
            if (hasTangentFrame) {
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
