/** Accelerate precise model selection independently of navigation colliders. */
AFRAME.registerSystem('vrodos-selection-bvh', {
    init: function () {
        this.geometries = new Map();
        this.meshes = new Map();
        this.onModelLoaded = (event) => this.prepareEntity(event.target);
        this.onSceneLoaded = () => this.prepareScene();
        this.el.addEventListener('model-loaded', this.onModelLoaded, true);
        this.el.addEventListener('loaded', this.onSceneLoaded);
        if (this.el.hasLoaded) this.prepareScene();
    },

    prepareScene: function () {
        this.el.querySelectorAll('[gltf-model]').forEach((entity) => this.prepareEntity(entity));
    },

    prepareEntity: function (entity) {
        if (!entity.closest || !entity.closest('.raycastable, [data-immerse-raycastable-original="true"]')) return;
        const root = entity.getObject3D('mesh');
        if (root) root.traverse((mesh) => this.prepareMesh(mesh));
    },

    prepareMesh: function (mesh) {
        const geometry = mesh.geometry;
        // A static BVH is invalid for geometry deformed by skinning or morphs.
        if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh || !geometry ||
            Object.keys(geometry.morphAttributes || {}).length) return;
        const triangleCount = (geometry.index ? geometry.index.count : geometry.attributes.position?.count || 0) / 3;
        if (triangleCount < 2000 || this.meshes.has(mesh)) return;

        const bvh = window.VRODOS_COLLISION_BVH;
        if (!bvh) {
            if (!this.warnedMissingVendor) {
                console.warn('[VRodos] Selection BVH vendor missing; recompile this scene.');
                this.warnedMissingVendor = true;
            }
            return;
        }
        if (!geometry.boundsTree) {
            // Preserve index order, material groups, and faceIndex selection results.
            bvh.computeBoundsTree.call(geometry, { indirect: true });
            this.geometries.set(geometry, geometry.boundsTree);
        }
        this.meshes.set(mesh, {
            raycast: mesh.raycast,
            ownRaycast: Object.prototype.hasOwnProperty.call(mesh, 'raycast'),
            acceleratedRaycast: bvh.acceleratedRaycast
        });
        mesh.raycast = bvh.acceleratedRaycast;
    },

    remove: function () {
        this.el.removeEventListener('model-loaded', this.onModelLoaded, true);
        this.el.removeEventListener('loaded', this.onSceneLoaded);
        this.meshes.forEach((record, mesh) => {
            if (mesh.raycast !== record.acceleratedRaycast) return;
            if (record.ownRaycast) mesh.raycast = record.raycast;
            else delete mesh.raycast;
        });
        this.geometries.forEach((tree, geometry) => {
            if (geometry.boundsTree === tree) geometry.boundsTree = null;
        });
        this.meshes.clear();
        this.geometries.clear();
    }
});
