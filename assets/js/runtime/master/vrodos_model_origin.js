'use strict';

(function initVrodosModelOrigin(global) {
    const MODE_BOUNDS_CENTER = 'bounds-center';

    function getThree() {
        return global.THREE || (global.AFRAME && global.AFRAME.THREE) || null;
    }

    function normalizeMode(mode) {
        return String(mode || '').trim() === MODE_BOUNDS_CENTER ? MODE_BOUNDS_CENTER : '';
    }

    function finiteCenter(center) {
        return Boolean(center) &&
            Number.isFinite(center.x) &&
            Number.isFinite(center.y) &&
            Number.isFinite(center.z);
    }

    function storedCenter(three, root) {
        const value = root && root.userData ? root.userData.vrodosModelOriginCenter : null;
        return Array.isArray(value) && value.length >= 3
            ? new three.Vector3(Number(value[0]), Number(value[1]), Number(value[2]))
            : null;
    }

    function createOffsetRoot(contentRoot, requestedMode, sourceCenter) {
        const three = getThree();
        const mode = normalizeMode(requestedMode);

        if (!contentRoot || !mode) {
            return { root: contentRoot || null, applied: false, mode: '', reason: 'disabled' };
        }
        if (!three || !three.Group || !three.Box3 || !three.Vector3) {
            return { root: contentRoot, applied: false, mode, reason: 'three-unavailable' };
        }
        if (
            contentRoot.userData &&
            contentRoot.userData.vrodosModelOriginWrapper === true &&
            contentRoot.userData.vrodosModelOriginMode === mode
        ) {
            return {
                root: contentRoot,
                applied: true,
                alreadyApplied: true,
                mode,
                center: storedCenter(three, contentRoot)
            };
        }

        const originalParent = contentRoot.parent || null;
        const offsetRoot = new three.Group();
        offsetRoot.name = 'vrodosModelOriginOffset';
        offsetRoot.add(contentRoot);
        offsetRoot.updateMatrixWorld(true);

        const bounds = new three.Box3().setFromObject(contentRoot, true);
        if (typeof bounds.isEmpty === 'function' && bounds.isEmpty()) {
            offsetRoot.remove(contentRoot);
            if (originalParent) originalParent.add(contentRoot);
            return { root: contentRoot, applied: false, mode, reason: 'empty-bounds' };
        }

        const center = Array.isArray(sourceCenter) && sourceCenter.length === 3
            ? new three.Vector3(...sourceCenter)
            : bounds.getCenter(new three.Vector3());
        if (!finiteCenter(center)) {
            offsetRoot.remove(contentRoot);
            if (originalParent) originalParent.add(contentRoot);
            return { root: contentRoot, applied: false, mode, reason: 'invalid-bounds' };
        }

        offsetRoot.position.set(-center.x, -center.y, -center.z);
        offsetRoot.userData = Object.assign({}, offsetRoot.userData || {}, {
            vrodosModelOriginWrapper: true,
            vrodosModelOriginMode: mode,
            vrodosModelOriginCenter: [center.x, center.y, center.z]
        });
        offsetRoot.updateMatrixWorld(true);

        return { root: offsetRoot, applied: true, alreadyApplied: false, mode, center };
    }

    global.VRODOSModelOrigin = Object.assign(global.VRODOSModelOrigin || {}, {
        MODE_BOUNDS_CENTER,
        normalizeMode,
        createOffsetRoot
    });
}(window));
