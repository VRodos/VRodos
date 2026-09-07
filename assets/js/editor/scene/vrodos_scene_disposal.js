'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosSceneDisposal() {
    function getGlbAssetCache() {
        return VRODOS.loader && VRODOS.loader.glbAssetCache
            ? VRODOS.loader.glbAssetCache
            : null;
    }

    function disposeMaterialValue(value, disposed) {
        if (!value || typeof value.dispose !== 'function') {
            return;
        }

        const cache = getGlbAssetCache();
        if (cache && typeof cache.isSharedTexture === 'function' && cache.isSharedTexture(value)) {
            return;
        }

        if (disposed.has(value)) {
            return;
        }

        disposed.add(value);
        value.dispose();
    }

    VRODOS.utils.setObjectTreeVisible = function(object, visible) {
        if (!object) {
            return null;
        }

        const nextVisible = Boolean(visible);
        if (typeof object.traverse === 'function' && object.children && object.children.length > 0) {
            object.traverse((node) => {
                node.visible = nextVisible;
            });
            return object;
        }

        object.visible = nextVisible;
        return object;
    };

    VRODOS.utils.disposeObject = function(object) {
        if (!object || typeof object.traverse !== 'function') {
            return;
        }

        const cache = getGlbAssetCache();
        const disposed = new Set();

        object.traverse((node) => {
            const geometryIsShared = Boolean(
                cache &&
                typeof cache.isSharedGeometry === 'function' &&
                cache.isSharedGeometry(node.geometry)
            );
            if (
                node.geometry &&
                typeof node.geometry.dispose === 'function' &&
                !geometryIsShared &&
                !disposed.has(node.geometry)
            ) {
                disposed.add(node.geometry);
                node.geometry.dispose();
            }

            if (!node.material) {
                return;
            }

            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => {
                if (!material) {
                    return;
                }

                for (const key in material) {
                    if (!Object.prototype.hasOwnProperty.call(material, key)) {
                        continue;
                    }
                    disposeMaterialValue(material[key], disposed);
                }

                const materialIsShared = Boolean(
                    cache &&
                    typeof cache.isSharedMaterial === 'function' &&
                    cache.isSharedMaterial(material)
                );
                if (
                    typeof material.dispose === 'function' &&
                    !materialIsShared &&
                    !disposed.has(material)
                ) {
                    disposed.add(material);
                    material.dispose();
                }
            });
        });
    };
})();
