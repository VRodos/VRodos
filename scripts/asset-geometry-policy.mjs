import { readFileSync } from 'node:fs';
import { simplifyPrimitive, unweldPrimitive, weldPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { BufferAttribute, BufferGeometry } from 'three';

export const geometryPolicy = JSON.parse(readFileSync(new URL('../assets/asset-geometry-policy.json', import.meta.url), 'utf8'));

const triangles = (primitive) => primitive.getMode() === 4
    ? (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION')?.getCount() ?? 0) / 3 : 0;

// Faceted OBJ exports duplicate vertices for each face normal. Those normals can
// be rebuilt with flat shading after decimation, instead of locking every edge.
function hasGeometricFlatNormals(primitive) {
    const positions = primitive.getAttribute('POSITION')?.getArray();
    const normals = primitive.getAttribute('NORMAL')?.getArray();
    if (!(positions instanceof Float32Array) || !(normals instanceof Float32Array) || primitive.getAttribute('TANGENT')) return false;
    const indices = primitive.getIndices()?.getArray();
    const count = indices?.length ?? positions.length / 3;
    for (let i = 0; i < count; i += 3) {
        const a = (indices ? indices[i] : i) * 3;
        const b = (indices ? indices[i + 1] : i + 1) * 3;
        const c = (indices ? indices[i + 2] : i + 2) * 3;
        for (let axis = 0; axis < 3; axis++) {
            if (normals[a + axis] !== normals[b + axis] || normals[a + axis] !== normals[c + axis]) return false;
        }
        const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
        const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        // Allow export rounding on tiny scan triangles, but retain custom normals.
        if (nx * normals[a] + ny * normals[a + 1] + nz * normals[a + 2] < 0.99 * Math.hypot(nx, ny, nz)) return false;
    }
    return true;
}

function rebuildFlatNormals(document, primitive, buffer) {
    unweldPrimitive(primitive);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(primitive.getAttribute('POSITION').getArray(), 3));
    geometry.computeVertexNormals();
    primitive.setAttribute('NORMAL', document.createAccessor().setType('VEC3').setBuffer(buffer).setArray(geometry.getAttribute('normal').array));
    geometry.dispose();
    weldPrimitive(primitive);
}

/** Policy only: meshoptimizer owns all edge collapse and error estimation. */
export async function simplifyAssetGeometry(document, profile, protectGeometry = false) {
    const policy = geometryPolicy.profiles[profile];
    if (!policy) throw new Error(`Unknown geometry profile: ${profile}`);
    const primitives = [...new Set(document.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives()))];
    const before = primitives.reduce((total, primitive) => total + triangles(primitive), 0);
    const placements = new Map(primitives.map((primitive) => [primitive, 0]));
    for (const node of document.getRoot().listNodes()) {
        const instances = node.getExtension('EXT_mesh_gpu_instancing')?.listAttributes()[0]?.getCount() ?? 1;
        for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
            placements.set(primitive, placements.get(primitive) + instances);
        }
    }
    const placedTriangles = (parts) => parts.reduce((total, primitive) => total + triangles(primitive) * placements.get(primitive), 0);
    const placedBefore = placedTriangles(primitives);
    const protectedContent = document.getRoot().listSkins().length > 0 || primitives.some((primitive) => primitive.listTargets().length > 0);
    const target = Math.floor(Math.min(policy.targetTriangles, placedBefore * policy.ratio));
    const report = { before, after: before, placedBefore, placedAfter: placedBefore, target, error: policy.error, simplifiedPrimitives: 0, rebuiltFlatNormalPrimitives: 0 };
    if (protectGeometry || protectedContent || placedBefore < geometryPolicy.minimumAssetTriangles || target >= placedBefore) {
        return { ...report, skipped: protectGeometry || protectedContent ? 'protected' : 'below-budget' };
    }
    await MeshoptSimplifier.ready;
    const eligible = primitives.filter((primitive) => triangles(primitive) > geometryPolicy.minimumPrimitiveTriangles);
    if (!eligible.length) return { ...report, skipped: 'small-parts' };
    const eligibleTriangles = placedTriangles(eligible);
    if (!eligibleTriangles) return { ...report, skipped: 'unplaced' };
    const reserved = placedBefore - eligibleTriangles;
    const ratio = Math.max(0, target - reserved) / eligibleTriangles;
    for (const primitive of eligible) {
        const count = triangles(primitive);
        const primitiveTarget = Math.max(geometryPolicy.minimumPrimitiveTriangles, Math.floor(count * ratio));
        if (primitiveTarget >= count) continue;
        const flatNormals = hasGeometricFlatNormals(primitive) ? primitive.getAttribute('NORMAL') : null;
        const normalBuffer = flatNormals?.getBuffer();
        if (flatNormals) {
            primitive.setAttribute('NORMAL', null);
            if (flatNormals.listParents().length === 1) flatNormals.dispose();
        }
        weldPrimitive(primitive);
        simplifyPrimitive(primitive, {
            simplifier: MeshoptSimplifier,
            ratio: primitiveTarget / count,
            error: policy.error,
            lockBorder: true
        });
        if (flatNormals) {
            rebuildFlatNormals(document, primitive, normalBuffer);
            report.rebuiltFlatNormalPrimitives++;
        }
        report.simplifiedPrimitives++;
    }
    report.after = primitives.reduce((total, primitive) => total + triangles(primitive), 0);
    report.placedAfter = placedTriangles(primitives);
    report.targetReached = report.placedAfter <= target;
    return report;
}
