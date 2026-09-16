import { readFileSync } from 'node:fs';
import { simplifyPrimitive, weldPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

export const geometryPolicy = JSON.parse(readFileSync(new URL('../assets/asset-geometry-policy.json', import.meta.url), 'utf8'));

const triangles = (primitive) => primitive.getMode() === 4
    ? (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION')?.getCount() ?? 0) / 3 : 0;

/** Policy only: meshoptimizer owns all edge collapse and error estimation. */
export async function simplifyAssetGeometry(document, profile, protectGeometry = false) {
    const policy = geometryPolicy.profiles[profile];
    if (!policy) throw new Error(`Unknown geometry profile: ${profile}`);
    const primitives = document.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
    const before = primitives.reduce((total, primitive) => total + triangles(primitive), 0);
    const protectedContent = document.getRoot().listSkins().length > 0 || primitives.some((primitive) => primitive.listTargets().length > 0);
    const target = Math.floor(Math.min(policy.targetTriangles, before * policy.ratio));
    const report = { before, after: before, target, error: policy.error, simplifiedPrimitives: 0 };
    if (protectGeometry || protectedContent || before < geometryPolicy.minimumAssetTriangles || target >= before) {
        return { ...report, skipped: protectGeometry || protectedContent ? 'protected' : 'below-budget' };
    }
    await MeshoptSimplifier.ready;
    const eligible = primitives.filter((primitive) => triangles(primitive) > geometryPolicy.minimumPrimitiveTriangles);
    if (!eligible.length) return { ...report, skipped: 'small-parts' };
    const eligibleTriangles = eligible.reduce((total, primitive) => total + triangles(primitive), 0);
    const reserved = before - eligibleTriangles;
    const ratio = Math.max(0, target - reserved) / eligibleTriangles;
    for (const primitive of eligible) {
        const count = triangles(primitive);
        const primitiveTarget = Math.max(geometryPolicy.minimumPrimitiveTriangles, Math.floor(count * ratio));
        if (primitiveTarget >= count) continue;
        weldPrimitive(primitive);
        simplifyPrimitive(primitive, {
            simplifier: MeshoptSimplifier,
            ratio: primitiveTarget / count,
            error: policy.error,
            lockBorder: true
        });
        report.simplifiedPrimitives++;
    }
    report.after = primitives.reduce((total, primitive) => total + triangles(primitive), 0);
    report.targetReached = report.after <= target;
    return report;
}
