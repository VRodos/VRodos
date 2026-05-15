"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosEditorDirectorHelpers() {
    const directorGroundGuide = VRODOS.editorRender.directorGroundGuide;
    const directorSafeVector = VRODOS.editorRender.directorSafeVector;
    const directorIsInternalHelper = VRODOS.editorRender.directorIsInternalHelper;
    const directorGroundGuideObjectExcluded = VRODOS.editorRender.directorGroundGuideObjectExcluded;
    const directorGroundGuideObjectVisible = VRODOS.editorRender.directorGroundGuideObjectVisible;
    const getPointerLockObject = VRODOS.editorRender.getPointerLockObject;

    function trackDirectorInternalHelper(object, role) {
        if (!object) {
            return null;
        }

        object.vrodos_internal_helper = true;
        this.directorInternalHelpers.add(object);

        if (role === 'visual') {
            this.directorVisualObject = object;
        } else if (role === 'hitProxy') {
            this.directorHitProxy = object;
        }

        return object;
    }

    function forgetDirectorInternalHelper(object) {
        if (!object) {
            return;
        }

        this.directorInternalHelpers.delete(object);
        if (this.directorVisualObject === object) {
            this.directorVisualObject = null;
        }
        if (this.directorHitProxy === object) {
            this.directorHitProxy = null;
        }
    }

    function findDirectDirectorHelperByName(name) {
        const director = this.getDirectorObject();

        if (director && Array.isArray(director.children)) {
            const directorChild = director.children.find((child) => child && child.name === name);
            if (directorChild) {
                return directorChild;
            }
        }

        if (this.scene && Array.isArray(this.scene.children)) {
            return this.scene.children.find((child) => child && child.name === name) || null;
        }

        return null;
    }

    function removeDirectorInternalHelper(object) {
        if (!object) {
            return;
        }

        if (VRODOS.editor.sceneRegistry && typeof VRODOS.editor.sceneRegistry.remove === 'function') {
            VRODOS.editor.sceneRegistry.remove(object, { reason: 'director-helper-cleared' });
        } else if (object.parent) {
            object.parent.remove(object);
        }

        if (typeof VRODOS.utils.disposeObject === 'function') {
            VRODOS.utils.disposeObject(object);
        }

        this.forgetDirectorInternalHelper(object);
    }

    function clearDirectorInternalHelpers(options) {
        const opts = options || {};
        const preserve = new Set(Array.isArray(opts.preserve) ? opts.preserve.filter(Boolean) : []);
        const director = this.getDirectorObject();
        const helpersToRemove = new Set(this.directorInternalHelpers);

        if (this.directorVisualObject) {
            helpersToRemove.add(this.directorVisualObject);
        }
        if (this.directorHitProxy) {
            helpersToRemove.add(this.directorHitProxy);
        }

        if (director) {
            director.children.forEach((child) => {
                if (directorIsInternalHelper(child)) {
                    helpersToRemove.add(child);
                }
            });
        }

        if (this.scene && Array.isArray(this.scene.children)) {
            this.scene.children.forEach((child) => {
                if (child !== director && directorIsInternalHelper(child)) {
                    helpersToRemove.add(child);
                }
            });
        }

        helpersToRemove.forEach((child) => {
            if (!child || preserve.has(child)) {
                return;
            }
            this.removeDirectorInternalHelper(child);
        });
    }

    function createDirectorHitProxy() {
        const geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.001,
            depthWrite: false
        });

        const hitProxy = new THREE.Mesh(geometry, material);
        hitProxy.name = "DirectorHitProxy";
        hitProxy.vrodos_internal_helper = true;
        hitProxy.isSelectableMesh = true;
        hitProxy.renderOrder = -1;
        hitProxy.frustumCulled = false;
        hitProxy.visible = true;
        hitProxy.position.set(0, 0, 0);
        hitProxy.updateMatrixWorld(true);

        return this.trackDirectorInternalHelper(hitProxy, 'hitProxy');
    }

    function setCamMeshToAvatarControls() {
        const camMesh = this.getDirectorVisualObject();
        const director = this.getDirectorObject();

        if (!camMesh || !director) {
            return;
        }

        if (camMesh.parent !== director) {
            director.add(camMesh);
        }
        camMesh.updateMatrixWorld(true);
    }

    function getDirectorRig() {
        return getPointerLockObject(this.avatarControls);
    }

    function syncFirstPersonRigToDirector() {
        const director = this.getDirectorObject();
        const rig = this.getDirectorRig();

        if (!director) {
            return;
        }

        director.updateMatrixWorld(true);

        if (rig && rig !== director) {
            rig.position.copy(director.position);
            rig.quaternion.copy(director.quaternion);
            rig.scale.set(1, 1, 1);
            rig.updateMatrixWorld(true);

            if (this.cameraAvatar && this.cameraAvatar.parent === rig) {
                this.cameraAvatar.position.set(0, 0, 0);
                this.cameraAvatar.rotation.set(0, 0, 0);
                this.cameraAvatar.scale.set(1, 1, 1);
                this.cameraAvatar.updateMatrixWorld(true);
            }
            return;
        }

        if (rig) {
            rig.updateMatrixWorld(true);
        }
    }

    function setDirectorWorldPosition(x, y, z, rx, ry) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        director.position.set(x, y, z);
        director.rotation.set(rx, ry, 0);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    function getDirectorObject() {
        return this.scene.getObjectByName("avatarCamera") || this.cameraAvatar || null;
    }

    function getDirectorVisualObject() {
        if (this.directorVisualObject && this.directorVisualObject.parent) {
            return this.directorVisualObject;
        }

        const visual = this.findDirectDirectorHelperByName("Camera3Dmodel");
        return this.trackDirectorInternalHelper(visual, 'visual');
    }

    function getDirectorHitProxy() {
        if (this.directorHitProxy && this.directorHitProxy.parent) {
            return this.directorHitProxy;
        }

        const hitProxy = this.findDirectDirectorHelperByName("DirectorHitProxy");
        return this.trackDirectorInternalHelper(hitProxy, 'hitProxy');
    }

    function installDirectorHelpers(camMesh, hitProxy) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        this.clearDirectorInternalHelpers({ preserve: [camMesh, hitProxy] });

        if (camMesh) {
            this.trackDirectorInternalHelper(camMesh, 'visual');
            director.add(camMesh);
            camMesh.updateMatrixWorld(true);
        }

        if (hitProxy) {
            this.trackDirectorInternalHelper(hitProxy, 'hitProxy');
            director.add(hitProxy);
            hitProxy.updateMatrixWorld(true);
        }
    }

    function applyDirectorTransform(position, rotation) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        const safePosition = directorSafeVector(position, [0, 0.2, 0]);
        const safeRotation = directorSafeVector(rotation, [0, 0, 0]);

        director.position.set(safePosition[0], safePosition[1], safePosition[2]);
        director.rotation.set(safeRotation[0], safeRotation[1], safeRotation[2]);
        director.scale.set(1, 1, 1);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    function moveDirectorToOrbitTarget() {
        const director = this.getDirectorObject();
        if (!director || !this.orbitControls) {
            return;
        }

        const safeFloorY = 0.2;
        const targetY = Number(this.orbitControls.target.y);
        const currentY = Number(director.position.y);

        director.position.x = this.orbitControls.target.x;
        director.position.z = this.orbitControls.target.z;
        director.position.y = Math.max(
            Number.isFinite(currentY) ? currentY : safeFloorY,
            Number.isFinite(targetY) ? targetY : safeFloorY,
            safeFloorY
        );
        director.scale.set(1, 1, 1);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    function resetDirectorTransform() {
        this.applyDirectorTransform([0, 0.2, 0], [0, 0, 0]);
    }

    function isDirectorGroundGuideObject(object) {
        let current = object || null;

        while (current) {
            if (current.name === 'DirectorGroundGuide' ||
                current.name === 'DirectorGroundGuideShadow' ||
                current.name === 'DirectorGroundGuideRing') {
                return true;
            }

            current = current.parent || null;
        }

        return false;
    }

    function bindDirectorGroundGuideSceneMutationHooks() {
        if (!this.scene || this.scene.vrodosDirectorGroundGuideMutationHooksInstalled === true) {
            return;
        }

        const scene = this.scene;
        const originalAdd = scene.add.bind(scene);
        const originalRemove = scene.remove.bind(scene);
        const environment = this;

        scene.add = function(...objects) {
            const result = originalAdd(...objects);
            if (objects.some((object) => !environment.isDirectorGroundGuideObject(object))) {
                environment.markDirectorGroundGuideTargetsDirty();
            }
            return result;
        };

        scene.remove = function(...objects) {
            const result = originalRemove(...objects);
            if (objects.some((object) => !environment.isDirectorGroundGuideObject(object))) {
                environment.markDirectorGroundGuideTargetsDirty();
            }
            return result;
        };

        scene.vrodosDirectorGroundGuideMutationHooksInstalled = true;
    }

    function markDirectorGroundGuideTargetsDirty() {
        this.directorGroundGuideTargetsDirty = true;
        this.directorGroundGuideTargetCache = new WeakMap();
        this.selectableMeshesDirty = true;
    }

    function ensureDirectorGroundGuide() {
        if (this.directorGroundGuideGroup) {
            if (this.directorGroundGuideGroup.parent !== this.scene) {
                this.scene.add(this.directorGroundGuideGroup);
            }
            return this.directorGroundGuideGroup;
        }

        const group = new THREE.Group();
        group.name = 'DirectorGroundGuide';
        group.vrodos_internal_helper = true;
        group.isSelectableMesh = false;
        group.visible = false;
        group.renderOrder = 10000;
        group.frustumCulled = false;

        const shadowGeometry = new THREE.CircleGeometry(directorGroundGuide.radius, 64);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0f172a,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.name = 'DirectorGroundGuideShadow';

        const ringGeometry = new THREE.TorusGeometry(
            directorGroundGuide.radius,
            directorGroundGuide.ringTubeRadius,
            8,
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -5,
            polygonOffsetUnits: -5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.name = 'DirectorGroundGuideRing';

        group.add(shadow);
        group.add(ring);
        group.traverse((node) => {
            node.vrodos_internal_helper = true;
            node.isSelectableMesh = false;
            node.frustumCulled = false;
            node.renderOrder = 10000;
        });

        this.directorGroundGuideGroup = group;
        this.scene.add(group);

        return group;
    }

    function getDirectorGroundGuideTargetRoots() {
        const registry = VRODOS.editor && VRODOS.editor.sceneRegistry ? VRODOS.editor.sceneRegistry : null;
        if (registry && typeof registry.getSelectableRoots === 'function') {
            const roots = registry.getSelectableRoots({ rebuildIfEmpty: false });
            if (roots.length > 0) {
                return roots;
            }
        }

        if (this.selectableMeshes && this.selectableMeshes.size > 0) {
            return Array.from(this.selectableMeshes);
        }

        return this.scene && Array.isArray(this.scene.children)
            ? this.scene.children
            : [];
    }

    function addDirectorGroundGuideMeshTarget(node, targets) {
        if (!node || !node.isMesh) {
            return;
        }

        if (directorGroundGuideObjectExcluded(node)) {
            return;
        }

        targets.push(node);
    }

    function collectDirectorGroundGuideRootTargets(root) {
        const targets = [];

        if (!root) {
            return targets;
        }

        if (typeof root.traverse === 'function') {
            root.traverse((node) => this.addDirectorGroundGuideMeshTarget(node, targets));
            return targets;
        }

        this.addDirectorGroundGuideMeshTarget(root, targets);
        return targets;
    }

    function getDirectorGroundGuideRootTargets(root) {
        if (!root) {
            return [];
        }

        if (!this.directorGroundGuideTargetCache) {
            this.directorGroundGuideTargetCache = new WeakMap();
        }

        const cachedTargets = this.directorGroundGuideTargetCache.get(root);
        if (cachedTargets) {
            return cachedTargets;
        }

        const targets = this.collectDirectorGroundGuideRootTargets(root);
        this.directorGroundGuideTargetCache.set(root, targets);
        return targets;
    }

    function refreshDirectorGroundGuideTargets(now) {
        const targets = [];

        if (!this.scene) {
            this.directorGroundGuideTargets = targets;
            this.directorGroundGuideTargetsDirty = false;
            return;
        }

        this.getDirectorGroundGuideTargetRoots().forEach((root) => {
            this.getDirectorGroundGuideRootTargets(root).forEach((target) => {
                targets.push(target);
            });
        });

        this.directorGroundGuideTargets = targets;
        this.directorGroundGuideTargetsDirty = false;
        this.directorGroundGuideLastTargetRefreshAt = now;
    }

    function hideDirectorGroundGuide() {
        if (this.directorGroundGuideGroup) {
            this.directorGroundGuideGroup.visible = false;
        }
    }

    function updateDirectorGroundGuide() {
        if (!this.scene) {
            return;
        }

        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();

        if ((now - this.directorGroundGuideLastUpdateAt) < directorGroundGuide.updateIntervalMs) {
            return;
        }
        this.directorGroundGuideLastUpdateAt = now;

        const director = this.getDirectorObject();
        if (!director) {
            this.hideDirectorGroundGuide();
            return;
        }

        if (this.directorGroundGuideTargetsDirty ||
            (now - this.directorGroundGuideLastTargetRefreshAt) > directorGroundGuide.targetRefreshIntervalMs) {
            this.refreshDirectorGroundGuideTargets(now);
        }

        if (this.directorGroundGuideTargets.length === 0) {
            this.hideDirectorGroundGuide();
            return;
        }

        this.scene.updateMatrixWorld(false);
        director.getWorldPosition(this.directorGroundGuideRayOrigin);

        if (!Number.isFinite(this.directorGroundGuideRayOrigin.y)) {
            this.hideDirectorGroundGuide();
            return;
        }

        this.directorGroundGuideRaycaster.near = 0;
        this.directorGroundGuideRaycaster.far = directorGroundGuide.maxDistance;
        this.directorGroundGuideRaycaster.set(
            this.directorGroundGuideRayOrigin,
            this.directorGroundGuideRayDirection
        );

        const intersections = this.directorGroundGuideRaycaster.intersectObjects(this.directorGroundGuideTargets, false);
        for (let i = 0; i < intersections.length; i++) {
            const hit = intersections[i];
            if (!hit || !hit.object || !hit.face || !hit.point) {
                continue;
            }

            if (!directorGroundGuideObjectVisible(hit.object) ||
                directorGroundGuideObjectExcluded(hit.object)) {
                continue;
            }

            this.directorGroundGuideHitNormal.copy(hit.face.normal)
                .transformDirection(hit.object.matrixWorld)
                .normalize();

            if (this.directorGroundGuideHitNormal.lengthSq() < 0.000001) {
                continue;
            }

            const guide = this.ensureDirectorGroundGuide();
            this.directorGroundGuideOffsetPosition.copy(hit.point).addScaledVector(
                this.directorGroundGuideHitNormal,
                directorGroundGuide.surfaceOffset
            );
            this.directorGroundGuideRotation.setFromUnitVectors(
                this.directorGroundGuidePlaneNormal,
                this.directorGroundGuideHitNormal
            );

            guide.position.copy(this.directorGroundGuideOffsetPosition);
            guide.quaternion.copy(this.directorGroundGuideRotation);
            guide.visible = true;
            guide.updateMatrixWorld(true);
            return;
        }

        this.hideDirectorGroundGuide();
    }

    VRODOS.editorRender.installDirectorHelperMethods = function(prototype) {
        if (!prototype) return;

        prototype.trackDirectorInternalHelper = trackDirectorInternalHelper;
        prototype.forgetDirectorInternalHelper = forgetDirectorInternalHelper;
        prototype.findDirectDirectorHelperByName = findDirectDirectorHelperByName;
        prototype.removeDirectorInternalHelper = removeDirectorInternalHelper;
        prototype.clearDirectorInternalHelpers = clearDirectorInternalHelpers;
        prototype.createDirectorHitProxy = createDirectorHitProxy;
        prototype.setCamMeshToAvatarControls = setCamMeshToAvatarControls;
        prototype.getDirectorRig = getDirectorRig;
        prototype.syncFirstPersonRigToDirector = syncFirstPersonRigToDirector;
        prototype.setDirectorWorldPosition = setDirectorWorldPosition;
        prototype.getDirectorObject = getDirectorObject;
        prototype.getDirectorVisualObject = getDirectorVisualObject;
        prototype.getDirectorHitProxy = getDirectorHitProxy;
        prototype.installDirectorHelpers = installDirectorHelpers;
        prototype.applyDirectorTransform = applyDirectorTransform;
        prototype.moveDirectorToOrbitTarget = moveDirectorToOrbitTarget;
        prototype.resetDirectorTransform = resetDirectorTransform;
        prototype.isDirectorGroundGuideObject = isDirectorGroundGuideObject;
        prototype.bindDirectorGroundGuideSceneMutationHooks = bindDirectorGroundGuideSceneMutationHooks;
        prototype.markDirectorGroundGuideTargetsDirty = markDirectorGroundGuideTargetsDirty;
        prototype.ensureDirectorGroundGuide = ensureDirectorGroundGuide;
        prototype.getDirectorGroundGuideTargetRoots = getDirectorGroundGuideTargetRoots;
        prototype.addDirectorGroundGuideMeshTarget = addDirectorGroundGuideMeshTarget;
        prototype.collectDirectorGroundGuideRootTargets = collectDirectorGroundGuideRootTargets;
        prototype.getDirectorGroundGuideRootTargets = getDirectorGroundGuideRootTargets;
        prototype.refreshDirectorGroundGuideTargets = refreshDirectorGroundGuideTargets;
        prototype.hideDirectorGroundGuide = hideDirectorGroundGuide;
        prototype.updateDirectorGroundGuide = updateDirectorGroundGuide;
    };
})();
