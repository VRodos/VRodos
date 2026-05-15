"use strict";

const VRODOS_EDITOR_CAMERA = VRODOS.editorRender.camera;
const VRODOS_EDITOR_SCENE_DEFAULTS = VRODOS.editorRender.sceneDefaults;
const VRODOS_DIRECTOR_GROUND_GUIDE = VRODOS.editorRender.directorGroundGuide;
const vrodosDirectorSafeVector = VRODOS.editorRender.directorSafeVector;
const vrodosDirectorIsInternalHelper = VRODOS.editorRender.directorIsInternalHelper;
const vrodosDirectorGroundGuideObjectExcluded = VRODOS.editorRender.directorGroundGuideObjectExcluded;
const vrodosDirectorGroundGuideObjectVisible = VRODOS.editorRender.directorGroundGuideObjectVisible;
const vrodosGetPointerLockObject = VRODOS.editorRender.getPointerLockObject;
const vrodosEnvironmentResolveBaseUrl = VRODOS.editorRender.resolveBaseUrl;

class vrodos_3d_editor_environmentals {

    constructor(vr_editor_main_div) {

        // animation
        this.animationMixers = [];
        this.clock = new THREE.Clock();
        this.flagPlayAnimation = true;

        // scene object caches — maintained by add/remove operations to avoid per-interaction scene.traverse()
        this.selectableMeshes = new Set();   // top-level objects with isSelectableMesh = true
        this.selectableMeshesArray = [];
        this.selectableMeshesDirty = true;
        this.celOutlineMeshes = new Set();   // active __cel_outline__ back-face hull meshes
        this.positionalAudioNodes = [];      // THREE.PositionalAudio nodes (future audio support)
        this.directorGroundGuideTargets = [];
        this.directorGroundGuideTargetsDirty = true;
        this.directorGroundGuideLastUpdateAt = 0;
        this.directorGroundGuideLastTargetRefreshAt = 0;
        this.directorGroundGuideRaycaster = new THREE.Raycaster();
        this.directorGroundGuideRayOrigin = new THREE.Vector3();
        this.directorGroundGuideRayDirection = new THREE.Vector3(0, -1, 0);
        this.directorGroundGuideHitNormal = new THREE.Vector3(0, 1, 0);
        this.directorGroundGuidePlaneNormal = new THREE.Vector3(0, 0, 1);
        this.directorGroundGuideOffsetPosition = new THREE.Vector3();
        this.directorGroundGuideRotation = new THREE.Quaternion();
        this.directorGroundGuideGroup = null;
        this.directorVisualObject = null;
        this.directorHitProxy = null;
        this.directorInternalHelpers = new Set();
        this.compassDirection = new THREE.Vector3();
        this.editorPerformanceProfile = null;
        this.composer = null;
        this.renderPass = null;
        this.outlinePass = null;
        this.effectFXAA = null;

        // The editor uses lightweight cel outlines, so the composer/FXAA path stays opt-in.
        this.isComposerOn = false;
        this.is2d = false;
        this.thirdPersonView = false;
        this.isSceneLoading = false;

        this.ctx = this;

        this.vr_editor_main_div = vr_editor_main_div;

        this.updateScreenMetrics();
        this.VIEW_ANGLE = VRODOS_EDITOR_CAMERA.viewAngle;

        this.FRUSTUM_SIZE = VRODOS_EDITOR_CAMERA.frustumSize; // For orthographic camera only

        this.SCENE_DIMENSION_SURFACE = VRODOS_EDITOR_SCENE_DEFAULTS.surfaceDimension; // It is the max of x z dimensions of the scene (found when all objects are loaded)
        this.SCENE_CENTER_X = VRODOS_EDITOR_SCENE_DEFAULTS.centerX;
        this.SCENE_CENTER_Y = VRODOS_EDITOR_SCENE_DEFAULTS.centerY;
        this.SCENE_CENTER_Z = VRODOS_EDITOR_SCENE_DEFAULTS.centerZ;

        this.NEAR = VRODOS_EDITOR_CAMERA.near;
        this.FAR = VRODOS_EDITOR_CAMERA.far; // keep the camera empty until everything is loaded

        // -- Set Renderer ----
        // antialias: false — MSAA backbuffer is never used once EffectComposer is active (FXAA handles AA via composer)
        this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false, logarithmicDepthBuffer: false});
        this.configureRenderer();
        this.bindRendererContextHandlers();
        // Label renderer for CSS2D renderer
        this.labelRenderer = new THREE.CSS2DRenderer();
        this.configureLabelRenderer();
        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

         // ------ Create Scene -------
        this.scene = new THREE.Scene();
        this.scene.name = "vrodosScene";
        this.bindDirectorGroundGuideSceneMutationHooks();

        this.loadSceneEnvironmentTexture();

        // --- Add Grid to scene
        this.gridHelper = new THREE.GridHelper(
            VRODOS_EDITOR_SCENE_DEFAULTS.gridSize,
            VRODOS_EDITOR_SCENE_DEFAULTS.gridDivisions
        );
        this.gridHelper.name = "myGridHelper";
        this.scene.add(this.gridHelper);
        this.gridHelper.visible = true;

        // -- Add Axes helper
        this.axesHelper = new THREE.AxesHelper(VRODOS_EDITOR_SCENE_DEFAULTS.axesSize);
        this.axesHelper.name = "myAxisHelper";
        this.scene.add(this.axesHelper);
        this.axesHelper.visible = true;


        // add the renderers to the canvas
        this.vr_editor_main_div.appendChild(this.renderer.domElement);
        this.vr_editor_main_div.appendChild(this.labelRenderer.domElement);

        //-------------------------
        this.setOrbitCamera();
        this.setAvatarCamera();

        // Composer is kept as an opt-in path; normal editing renders directly.
        this.applyEditorPerformanceProfile(true);

        this.bindResizeHandler();
    }

    loadSceneEnvironmentTexture() {
        const imageBaseUrl = vrodosEnvironmentResolveBaseUrl(VRODOS.data.pluginPath, 'imageBaseUrl', 'assets/images/');
        const hdrLoader = new THREE.HDRLoader();

        hdrLoader.setPath(`${imageBaseUrl  }hdr/`)
            .load('Stonewall_Ref.hdr', (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.maintexture = texture;
                this.scene.environment = this.maintexture;
            });
    }

    trackDirectorInternalHelper(object, role) {
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

    forgetDirectorInternalHelper(object) {
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

    findDirectDirectorHelperByName(name) {
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

    removeDirectorInternalHelper(object) {
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

    clearDirectorInternalHelpers(options) {
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
                if (vrodosDirectorIsInternalHelper(child)) {
                    helpersToRemove.add(child);
                }
            });
        }

        if (this.scene && Array.isArray(this.scene.children)) {
            this.scene.children.forEach((child) => {
                if (child !== director && vrodosDirectorIsInternalHelper(child)) {
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

    createDirectorHitProxy() {
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

    setCamMeshToAvatarControls() {
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

    getDirectorRig() {
        return vrodosGetPointerLockObject(this.avatarControls);
    }

    syncFirstPersonRigToDirector() {
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

    setDirectorWorldPosition(x, y, z, rx, ry) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        director.position.set(x, y, z);
        director.rotation.set(rx, ry, 0);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    getDirectorObject() {
        return this.scene.getObjectByName("avatarCamera") || this.cameraAvatar || null;
    }

    getDirectorVisualObject() {
        if (this.directorVisualObject && this.directorVisualObject.parent) {
            return this.directorVisualObject;
        }

        const visual = this.findDirectDirectorHelperByName("Camera3Dmodel");
        return this.trackDirectorInternalHelper(visual, 'visual');
    }

    getDirectorHitProxy() {
        if (this.directorHitProxy && this.directorHitProxy.parent) {
            return this.directorHitProxy;
        }

        const hitProxy = this.findDirectDirectorHelperByName("DirectorHitProxy");
        return this.trackDirectorInternalHelper(hitProxy, 'hitProxy');
    }

    installDirectorHelpers(camMesh, hitProxy) {
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

    applyDirectorTransform(position, rotation) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        const safePosition = vrodosDirectorSafeVector(position, [0, 0.2, 0]);
        const safeRotation = vrodosDirectorSafeVector(rotation, [0, 0, 0]);

        director.position.set(safePosition[0], safePosition[1], safePosition[2]);
        director.rotation.set(safeRotation[0], safeRotation[1], safeRotation[2]);
        director.scale.set(1, 1, 1);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    moveDirectorToOrbitTarget() {
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

    resetDirectorTransform() {
        this.applyDirectorTransform([0, 0.2, 0], [0, 0, 0]);
    }

    isDirectorGroundGuideObject(object) {
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

    bindDirectorGroundGuideSceneMutationHooks() {
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

    markDirectorGroundGuideTargetsDirty() {
        this.directorGroundGuideTargetsDirty = true;
        this.selectableMeshesDirty = true;
    }

    ensureDirectorGroundGuide() {
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

        const shadowGeometry = new THREE.CircleGeometry(VRODOS_DIRECTOR_GROUND_GUIDE.radius, 64);
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
            VRODOS_DIRECTOR_GROUND_GUIDE.radius,
            VRODOS_DIRECTOR_GROUND_GUIDE.ringTubeRadius,
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

    getDirectorGroundGuideTargetRoots() {
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

    addDirectorGroundGuideMeshTarget(node, targets) {
        if (!node || !node.isMesh) {
            return;
        }

        if (vrodosDirectorGroundGuideObjectExcluded(node)) {
            return;
        }

        targets.push(node);
    }

    refreshDirectorGroundGuideTargets(now) {
        const targets = [];

        if (!this.scene) {
            this.directorGroundGuideTargets = targets;
            this.directorGroundGuideTargetsDirty = false;
            return;
        }

        this.getDirectorGroundGuideTargetRoots().forEach((root) => {
            if (!root) {
                return;
            }

            if (typeof root.traverse === 'function') {
                root.traverse((node) => this.addDirectorGroundGuideMeshTarget(node, targets));
                return;
            }

            this.addDirectorGroundGuideMeshTarget(root, targets);
        });

        this.directorGroundGuideTargets = targets;
        this.directorGroundGuideTargetsDirty = false;
        this.directorGroundGuideLastTargetRefreshAt = now;
    }

    hideDirectorGroundGuide() {
        if (this.directorGroundGuideGroup) {
            this.directorGroundGuideGroup.visible = false;
        }
    }

    updateDirectorGroundGuide() {
        if (!this.scene) {
            return;
        }

        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();

        if ((now - this.directorGroundGuideLastUpdateAt) < VRODOS_DIRECTOR_GROUND_GUIDE.updateIntervalMs) {
            return;
        }
        this.directorGroundGuideLastUpdateAt = now;

        const director = this.getDirectorObject();
        if (!director) {
            this.hideDirectorGroundGuide();
            return;
        }

        if (this.directorGroundGuideTargetsDirty ||
            (now - this.directorGroundGuideLastTargetRefreshAt) > VRODOS_DIRECTOR_GROUND_GUIDE.targetRefreshIntervalMs) {
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
        this.directorGroundGuideRaycaster.far = VRODOS_DIRECTOR_GROUND_GUIDE.maxDistance;
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

            if (!vrodosDirectorGroundGuideObjectVisible(hit.object) ||
                vrodosDirectorGroundGuideObjectExcluded(hit.object)) {
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
                VRODOS_DIRECTOR_GROUND_GUIDE.surfaceOffset
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

}

VRODOS.editorRender.installPerformanceProfileMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installRendererLifecycleMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installCameraMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editor.Environmentals = vrodos_3d_editor_environmentals;
