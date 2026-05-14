'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosSceneDisposal() {
    function disposeMaterialValue(value) {
        if (!value || typeof value.dispose !== 'function') {
            return;
        }

        value.dispose();
    }

    VRODOS.utils.disposeObject = function(object) {
        if (!object || typeof object.traverse !== 'function') {
            return;
        }

        object.traverse((node) => {
            if (node.geometry && typeof node.geometry.dispose === 'function') {
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
                    disposeMaterialValue(material[key]);
                }

                if (typeof material.dispose === 'function') {
                    material.dispose();
                }
            });
        });
    };
})();

