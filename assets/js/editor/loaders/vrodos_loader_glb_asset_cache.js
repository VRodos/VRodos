'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.loader = VRODOS.loader || {};

(function initVrodosGlbAssetCache() {
    const entries = new Map();
    let instanceRoots = new WeakSet();
    let sharedGeometries = new WeakSet();
    let sharedMaterials = new WeakSet();
    let sharedTextures = new WeakSet();
    const totals = {
        hits: 0,
        misses: 0,
        coalesced: 0
    };

    function normalizeKey(url) {
        const value = String(url || '').trim();
        if (!value) {
            return '';
        }

        const baseUrl = typeof document !== 'undefined' && document.baseURI
            ? document.baseURI
            : (typeof window !== 'undefined' && window.location ? window.location.href : '');

        if (typeof URL !== 'function' || !baseUrl) {
            return value;
        }

        try {
            const resolved = new URL(value, baseUrl);
            resolved.hash = '';
            return resolved.href;
        } catch (_error) {
            return value;
        }
    }

    function forEachMaterial(materialOrMaterials, callback) {
        const materials = Array.isArray(materialOrMaterials) ? materialOrMaterials : [materialOrMaterials];
        materials.forEach((material) => {
            if (material) callback(material);
        });
    }

    function forEachMaterialTexture(material, callback) {
        if (!material) return;

        for (const key in material) {
            if (!Object.prototype.hasOwnProperty.call(material, key)) continue;
            const value = material[key];
            if (value && value.isTexture) {
                callback(value);
            }
        }
    }

    function registerTemplateResources(template) {
        template.scene.traverse((node) => {
            if (node.geometry) {
                sharedGeometries.add(node.geometry);
            }

            forEachMaterial(node.material, (material) => {
                sharedMaterials.add(material);
                forEachMaterialTexture(material, (texture) => {
                    sharedTextures.add(texture);
                });
            });
        });
    }

    function hasSkinnedMesh(object) {
        let result = false;
        object.traverse((node) => {
            if (node.isSkinnedMesh) {
                result = true;
            }
        });
        return result;
    }

    function cloneSceneGraph(scene) {
        if (
            hasSkinnedMesh(scene) &&
            THREE.SkeletonUtils &&
            typeof THREE.SkeletonUtils.clone === 'function'
        ) {
            return THREE.SkeletonUtils.clone(scene);
        }

        return scene.clone(true);
    }

    function cloneInstanceMaterials(object) {
        object.traverse((node) => {
            if (!node.material) return;

            if (Array.isArray(node.material)) {
                node.material = node.material.map((material) => (
                    material && typeof material.clone === 'function' ? material.clone() : material
                ));
                return;
            }

            if (typeof node.material.clone === 'function') {
                node.material = node.material.clone();
            }
        });
    }

    function recordDiagnostic(result) {
        const diagnostics = VRODOS.editor && VRODOS.editor.diagnostics;
        if (diagnostics && typeof diagnostics.recordParsedGlbCache === 'function') {
            diagnostics.recordParsedGlbCache(result);
        }
    }

    function disposeTemplate(template, disposed) {
        if (!template || !template.scene || typeof template.scene.traverse !== 'function') return;

        template.scene.traverse((node) => {
            if (node.geometry && typeof node.geometry.dispose === 'function' && !disposed.has(node.geometry)) {
                disposed.add(node.geometry);
                node.geometry.dispose();
            }

            forEachMaterial(node.material, (material) => {
                forEachMaterialTexture(material, (texture) => {
                    if (typeof texture.dispose === 'function' && !disposed.has(texture)) {
                        disposed.add(texture);
                        texture.dispose();
                    }
                });

                if (typeof material.dispose === 'function' && !disposed.has(material)) {
                    disposed.add(material);
                    material.dispose();
                }
            });
        });
    }

    const cache = {
        getKey(url) {
            return normalizeKey(url);
        },

        load(url, loadFactory) {
            const key = normalizeKey(url);
            if (!key) {
                return Promise.reject(new Error('Cannot cache a GLB without a load URL.'));
            }

            const existing = entries.get(key);
            if (existing) {
                if (existing.status === 'pending') {
                    totals.coalesced++;
                    recordDiagnostic('coalesced');
                } else {
                    totals.hits++;
                    recordDiagnostic('hit');
                }
                return existing.promise;
            }

            totals.misses++;
            recordDiagnostic('miss');

            const entry = {
                key,
                status: 'pending',
                template: null,
                promise: null
            };

            entry.promise = Promise.resolve()
                .then(() => loadFactory())
                .then((gltf) => {
                    if (!gltf || !gltf.scene || typeof gltf.scene.traverse !== 'function') {
                        throw new Error(`GLB loader returned no scene for ${key}`);
                    }

                    entry.template = {
                        scene: gltf.scene,
                        animations: Array.isArray(gltf.animations) ? gltf.animations : []
                    };
                    entry.status = 'ready';
                    registerTemplateResources(entry.template);
                    return entry.template;
                })
                .catch((error) => {
                    entries.delete(key);
                    throw error;
                });

            entries.set(key, entry);
            return entry.promise;
        },

        instantiate(url) {
            const key = normalizeKey(url);
            const entry = entries.get(key);
            if (!entry || entry.status !== 'ready' || !entry.template) {
                throw new Error(`GLB cache entry is not ready for ${key}`);
            }

            const scene = cloneSceneGraph(entry.template.scene);
            cloneInstanceMaterials(scene);
            scene.userData = Object.assign({}, scene.userData || {}, {
                vrodosGlbCacheInstance: true,
                vrodosGlbCacheKey: key
            });
            instanceRoots.add(scene);

            return {
                scene,
                animations: entry.template.animations.slice(),
                cacheKey: key
            };
        },

        isInstance(object) {
            return Boolean(
                object &&
                (instanceRoots.has(object) || (object.userData && object.userData.vrodosGlbCacheInstance === true))
            );
        },

        isSharedGeometry(geometry) {
            return Boolean(geometry && sharedGeometries.has(geometry));
        },

        isSharedMaterial(material) {
            return Boolean(material && sharedMaterials.has(material));
        },

        isSharedTexture(texture) {
            return Boolean(texture && sharedTextures.has(texture));
        },

        snapshot() {
            let pending = 0;
            let ready = 0;
            entries.forEach((entry) => {
                if (entry.status === 'pending') pending++;
                if (entry.status === 'ready') ready++;
            });

            return {
                entries: entries.size,
                pending,
                ready,
                hits: totals.hits,
                misses: totals.misses,
                coalesced: totals.coalesced
            };
        },

        clear(options) {
            const opts = Object.assign({ dispose: true }, options || {});
            if (opts.dispose) {
                const disposed = new Set();
                entries.forEach((entry) => {
                    if (entry.template) {
                        disposeTemplate(entry.template, disposed);
                    }
                });
            }

            entries.clear();
            instanceRoots = new WeakSet();
            sharedGeometries = new WeakSet();
            sharedMaterials = new WeakSet();
            sharedTextures = new WeakSet();
        }
    };

    VRODOS.loader.glbAssetCache = cache;
})();
