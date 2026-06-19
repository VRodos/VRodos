/**
 * VRodos Master Navigation Components
 */

var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});
var VRODOSNavmeshDefaults = VRODOSMaster.NAVMESH_DEFAULTS || window.VRODOS_NAVMESH_DEFAULTS || {
    maxStepHeight: 0.6,
    maxDropHeight: 1.0,
    maxSlope: 45
};

function vrodosNavPerfDebugEnabled() {
    if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.navPerfOverlay === true) {
        return true;
    }

    if (typeof window.location === 'undefined' || !window.location.search) {
        return false;
    }

    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('vrodos_debug_nav_perf') === '1';
    } catch (err) {
        return false;
    }
}

AFRAME.registerComponent('vrodos-navmesh-helper', {
    init: function () {
        this.applyHiddenNavmeshState = this.applyHiddenNavmeshState.bind(this);
        this.createHiddenNavmeshMaterial = VRODOSMaster.createHiddenNavmeshMaterial || window.vrodosCreateHiddenNavmeshMaterial || function (material) { return material; };
        this.el.addEventListener('model-loaded', this.applyHiddenNavmeshState);

        if (this.el.getObject3D('mesh')) {
            this.applyHiddenNavmeshState();
        }
    },
    applyHiddenNavmeshState: function () {
        const meshRoot = this.el.getObject3D('mesh');
        if (!meshRoot) {
            return;
        }

        meshRoot.visible = false;
        meshRoot.traverse((node) => {
            if (!node.isMesh) {
                return;
            }

            node.frustumCulled = false;
            node.castShadow = false;
            node.receiveShadow = false;

            if (Array.isArray(node.material)) {
                node.material = node.material.map((material) => this.createHiddenNavmeshMaterial(material));
            } else if (node.material) {
                node.material = this.createHiddenNavmeshMaterial(node.material);
            }
        });
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.applyHiddenNavmeshState);
    }
});

AFRAME.registerComponent('vrodos-collider-helper', {
    init: function () {
        this.applyHiddenColliderState = this.applyHiddenColliderState.bind(this);
        this.createHiddenColliderMaterial = VRODOSMaster.createHiddenNavmeshMaterial || window.vrodosCreateHiddenNavmeshMaterial || function (material) { return material; };
        this.el.addEventListener('model-loaded', this.applyHiddenColliderState);

        if (this.el.getObject3D('mesh')) {
            this.applyHiddenColliderState();
        }
    },
    applyHiddenColliderState: function () {
        const meshRoot = this.el.getObject3D('mesh') || this.el.object3D;
        if (!meshRoot) {
            return;
        }

        meshRoot.visible = false;
        meshRoot.traverse((node) => {
            if (!node.isMesh) {
                return;
            }

            node.frustumCulled = false;
            node.castShadow = false;
            node.receiveShadow = false;

            if (Array.isArray(node.material)) {
                node.material = node.material.map((material) => this.createHiddenColliderMaterial(material));
            } else if (node.material) {
                node.material = this.createHiddenColliderMaterial(node.material);
            }
        });
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.applyHiddenColliderState);
    }
});


AFRAME.registerComponent('custom-movement', {
    schema: {
        movementSpeed: { type: 'number', default: 3.2 },
        flyMovementSpeed: { type: 'number', default: 16 },
        flyPitchVerticalMultiplier: { type: 'number', default: 1.75 },
        flyVerticalSpeedMultiplier: { type: 'number', default: 1.5 },
        thumbstickDeadzone: { type: 'number', default: 0.08 },
        turnSpeed: { type: 'number', default: 90 },
        maxStepHeight: { type: 'number', default: VRODOSNavmeshDefaults.maxStepHeight },
        maxDropHeight: { type: 'number', default: VRODOSNavmeshDefaults.maxDropHeight },
        maxSlope: { type: 'number', default: VRODOSNavmeshDefaults.maxSlope }
    },
    init: function () {
        this.cameraRig = this.el;
        this.sceneEl = this.el.sceneEl;
        this.cameraEl = document.querySelector('#cameraA') || document.querySelector('a-camera');
        this.navMeshEntitySelector = '.vrodos-navmesh';
        this.colliderEntitySelector = '.vrodos-collider';
        this.leftThumbInput = { x: 0, y: 0 };
        this.rightThumbInput = { x: 0, y: 0 };
        this.keyboardInput = { x: 0, y: 0, vertical: 0 };
        this.navMeshRoots = [];
        this.navMeshCollisionTargets = [];
        this.navMeshDirty = true;
        this.collisionWorldDirty = true;
        this.colliderRoots = [];
        this.blockerCollisionTargets = [];
        this.bvhTargets = new Set();
        this.bvhInstalled = false;
        this.navMeshBounds = new THREE.Box3();
        this.navMeshRootBounds = new THREE.Box3();
        this.collisionWorldBounds = new THREE.Box3();
        this.collisionRootBounds = new THREE.Box3();
        this.heightOffset = null;
        this.lastResolvedPosition = new THREE.Vector3();
        this.lastGroundHit = this.createGroundHit();
        this.hasLastGroundHit = false;
        this.upVector = new THREE.Vector3(0, 1, 0);
        this.forwardVector = new THREE.Vector3();
        this.rightVector = new THREE.Vector3();
        this.centerRaycaster = new THREE.Raycaster();
        this.cameraWorldPosition = new THREE.Vector3();
        this.screenCenterWorldPoint = new THREE.Vector3();
        this.currentWorldPosition = new THREE.Vector3();
        this.targetWorldPosition = new THREE.Vector3();
        this.movementOffset = new THREE.Vector3();
        this.tickWorldPosition = new THREE.Vector3();
        this.constrainedCurrentPosition = new THREE.Vector3();
        this.stepPosition = new THREE.Vector3();
        this.stepDelta = new THREE.Vector3();
        this.boundsSize = new THREE.Vector3();
        this.boundsClosestPoint = new THREE.Vector3();
        this.raycastOrigin = new THREE.Vector3();
        this.raycastDirection = new THREE.Vector3(0, -1, 0);
        this.tempWorldNormal = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.blockerRaycaster = new THREE.Raycaster();
        this.blockerRayOrigin = new THREE.Vector3();
        this.blockerRayDirection = new THREE.Vector3();
        this.blockerSideOffset = new THREE.Vector3();
        this.blockerHitNormal = new THREE.Vector3();
        this.blockerSlideStepX = {
            position: new THREE.Vector3(),
            ground: this.createGroundHit()
        };
        this.blockerSlideStepZ = {
            position: new THREE.Vector3(),
            ground: this.createGroundHit()
        };
        this.blockerCapsuleRadius = 0.32;
        this.blockerCapsuleHeight = 1.65;
        this.blockerSkin = 0.05;
        this.blockerSweepHeights = [0.25, 0.9, 1.55];
        this.blockerSweepOffsets = [0, 1, -1];
        this.groundProbeOffsets = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0.18, 0),
            new THREE.Vector2(-0.18, 0),
            new THREE.Vector2(0, 0.18),
            new THREE.Vector2(0, -0.18)
        ];
        this.groundProbePosition = new THREE.Vector3();
        this.groundProbeReferenceTolerance = 0.45;
        this.groundProbeStepTolerance = 0.05;
        this.autoGroundBridgeOffsets = [
            new THREE.Vector2(0.32, 0),
            new THREE.Vector2(-0.32, 0),
            new THREE.Vector2(0, 0.32),
            new THREE.Vector2(0, -0.32),
            new THREE.Vector2(0.42, 0.42),
            new THREE.Vector2(-0.42, 0.42),
            new THREE.Vector2(0.42, -0.42),
            new THREE.Vector2(-0.42, -0.42),
            new THREE.Vector2(0.58, 0),
            new THREE.Vector2(-0.58, 0),
            new THREE.Vector2(0, 0.58),
            new THREE.Vector2(0, -0.58)
        ];
        this.autoRecoveryOffsets = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(0.45, 0),
            new THREE.Vector2(-0.45, 0),
            new THREE.Vector2(0, 0.45),
            new THREE.Vector2(0, -0.45),
            new THREE.Vector2(0.75, 0.75),
            new THREE.Vector2(-0.75, 0.75),
            new THREE.Vector2(0.75, -0.75),
            new THREE.Vector2(-0.75, -0.75)
        ];
        this.autoRecoverySearchRadii = [0.35, 0.7, 1.1, 1.5, 2.0, 2.6, 3.4, 4.5];
        this.autoRecoverySearchAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        this.autoGroundBridgeMinSupport = 2;
        this.autoGroundPitDropThreshold = 0.12;
        this.autoGroundSupportHeightTolerance = 0.2;
        this.autoGroundStepAssistMaxHeight = 0.95;
        this.autoNavmeshRiserBypassHeight = 0.45;
        this.autoRecoveryNavmeshBypassHeight = 0.95;
        this.autoRecoveryMaxLift = 3.2;
        this.autoRecoveryCooldownMs = 700;
        this.autoStableGroundMaxAgeMs = 10000;
        this.autoStableGroundMaxDistance = 4.5;
        this.wasdControlsSuppressed = null;
        this.lastRecoveryAttemptAt = 0;
        this.lastManualRecoveryAttemptAt = 0;
        this.lastAutoRecoveryStatus = 'none';
        this.lastAutoRecoveryAt = 0;
        this.positionPrimed = false;
        this.sampledGroundHit = this.createGroundHit();
        this.candidateGroundHit = this.createGroundHit();
        this.bestGroundHit = this.createGroundHit();
        this.recoveryGroundHit = this.createGroundHit();
        this.offsetGroundHit = this.createGroundHit();
        this.autoSupportProbeGroundHit = this.createGroundHit();
        this.autoSupportBestGroundHit = this.createGroundHit();
        this.autoSupportResolvedGroundHit = this.createGroundHit();
        this.autoRecoveryProbeGroundHit = this.createGroundHit();
        this.autoRecoveryBestGroundHit = this.createGroundHit();
        this.autoGroundSampleHit = this.createGroundHit();
        this.autoGroundSamplePosition = new THREE.Vector3();
        this.autoSupportProbePosition = new THREE.Vector3();
        this.autoRecoveryProbePosition = new THREE.Vector3();
        this.autoRecoveryCandidatePosition = new THREE.Vector3();
        this.autoRecoveryTargetPosition = new THREE.Vector3();
        this.immersiveWorldDelta = new THREE.Vector3();
        this.immersivePhysicalAnchorPosition = new THREE.Vector3();
        this.immersiveVirtualNavPosition = new THREE.Vector3();
        this.immersiveRenderOffset = new THREE.Vector3();
        this.immersiveRenderedPoint = new THREE.Vector3();
        this.immersiveAuthoredPoint = new THREE.Vector3();
        this.immersiveRenderedDirection = new THREE.Vector3();
        this.immersiveAuthoredDirection = new THREE.Vector3();
        this.immersiveRenderedRayOrigin = new THREE.Vector3();
        this.immersiveRenderedRayDirection = new THREE.Vector3();
        this.immersiveAuthoredHitPoint = new THREE.Vector3();
        this.immersiveRenderQuaternion = new THREE.Quaternion();
        this.immersiveRenderYaw = 0;
        this.immersiveWorldBaseTransforms = new Map();
        this.immersiveTargetRayLines = [];
        this.immersiveTargetRayMaterial = null;
        this.immersiveTargetRayGeometry = null;
        this.immersiveShadowSuppressedAt = 0;
        this.immersiveWasPresenting = false;
        this.immersiveWorldRootDiagnostics = {
            count: 0,
            samples: [],
            videoDisplayRootCount: 0,
            assessmentRootCount: 0,
            assessmentWrapperRootCount: 0,
            cefrRootCount: 0,
            includesVideoDisplays: false,
            includesAssessmentWrappers: false
        };
        this.immersiveWorldRootDiagnosticsSignature = '';
        this.lastNonImmersiveNavigationPosition = new THREE.Vector3();
        this.hasLastNonImmersiveNavigationPosition = false;
        this.lastNonImmersiveGroundY = 0;
        this.lastNonImmersiveHeightOffset = 1.6;
        this.hasLastNonImmersiveGround = false;
        this.lastNonImmersiveGroundRememberedAt = 0;
        this.immersiveLastStepDeltaY = 0;
        this.immersiveLastRenderAppliedAt = 0;
        this.immersiveMinEyeToGroundOffset = 1.2;
        this.immersiveDefaultEyeToGroundOffset = 1.6;
        this.immersiveMaxEyeToGroundOffset = 2.2;
        this.immersiveRawHeightOffset = null;
        this.immersiveHeightCalibrationApplied = false;
        this.autoStableGroundHistorySize = 8;
        this.autoStableGroundHistoryIndex = 0;
        this.autoStableGroundHistory = [];
        for (let stableIndex = 0; stableIndex < this.autoStableGroundHistorySize; stableIndex++) {
            this.autoStableGroundHistory.push({
                valid: false,
                time: 0,
                position: new THREE.Vector3(),
                ground: this.createGroundHit()
            });
        }
        this.autoGroundSampleMinIntervalMs = 90;
        this.autoGroundSampleMinDistance = 0.35;
        this.autoGroundHeightDeadband = 0.06;
        this.autoGroundOverlayTolerance = 0.08;
        this.autoGroundMissAllowance = 2;
        this.autoGroundMissDistance = 0.28;
        this.lastAutoGroundSampleAt = 0;
        this.hasLastAutoGroundSample = false;
        this.resolvedMovementStep = {
            position: new THREE.Vector3(),
            ground: this.createGroundHit()
        };
        this.searchRadii = [0.5, 1, 2, 4, 6];
        this.searchAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        this.navPerfDebug = this.createNavPerfDebugState();

        this.handleThumbstickMove = this.handleThumbstickMove.bind(this);
        this.handleThumbstickEnd = this.handleThumbstickEnd.bind(this);
        this.handleNavmeshModelLoad = this.handleNavmeshModelLoad.bind(this);
        this.handleSceneLoaded = this.handleSceneLoaded.bind(this);
        this.handleSceneChildAttached = this.handleSceneChildAttached.bind(this);
        this.handleSceneChildDetached = this.handleSceneChildDetached.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleRecoveryButtonDown = this.handleRecoveryButtonDown.bind(this);
        this.handleEnterVr = this.handleEnterVr.bind(this);
        this.handleExitVr = this.handleExitVr.bind(this);

        this.thumbL = document.querySelector('#oculusLeft') || document.querySelector('#leftHand');
        this.thumbR = document.querySelector('#oculusRight') || document.querySelector('#rightHand');
        this.recoveryButtonEvents = ['abuttondown', 'xbuttondown'];
        this.recoveryButtonEls = [];

        if (this.thumbL) {
            this.thumbL.addEventListener('thumbstickmoved', this.handleThumbstickMove);
            this.thumbL.addEventListener('thumbsticktouchend', this.handleThumbstickEnd);
            this.thumbL.addEventListener('thumbstickup', this.handleThumbstickEnd);
        }

        if (this.thumbR) {
            this.thumbR.addEventListener('thumbstickmoved', this.handleThumbstickMove);
            this.thumbR.addEventListener('thumbsticktouchend', this.handleThumbstickEnd);
            this.thumbR.addEventListener('thumbstickup', this.handleThumbstickEnd);
        }

        ['#oculusLeft', '#oculusRight', '#leftHand', '#rightHand'].forEach((selector) => {
            const buttonEl = document.querySelector(selector);
            if (!buttonEl || this.recoveryButtonEls.indexOf(buttonEl) !== -1) {
                return;
            }

            this.recoveryButtonEvents.forEach((eventName) => {
                buttonEl.addEventListener(eventName, this.handleRecoveryButtonDown);
            });
            this.recoveryButtonEls.push(buttonEl);
        });

        this.sceneEl.addEventListener('model-loaded', this.handleNavmeshModelLoad);
        this.sceneEl.addEventListener('loaded', this.handleSceneLoaded);
        this.sceneEl.addEventListener('child-attached', this.handleSceneChildAttached);
        this.sceneEl.addEventListener('child-detached', this.handleSceneChildDetached);
        this.sceneEl.addEventListener('enter-vr', this.handleEnterVr);
        this.sceneEl.addEventListener('exit-vr', this.handleExitVr);

        window.addEventListener('keydown', this.handleKeyDown, true);
        window.addEventListener('keyup', this.handleKeyUp, true);
    },
    createGroundHit: function () {
        return {
            point: new THREE.Vector3(),
            rawPoint: new THREE.Vector3(),
            normal: new THREE.Vector3(0, 1, 0),
            slope: 0,
            behavior: 'precise'
        };
    },
    copyGroundHit: function (source, target) {
        if (!source || !target) {
            return null;
        }

        target.point.copy(source.point);
        if (source.rawPoint) {
            target.rawPoint.copy(source.rawPoint);
        } else {
            target.rawPoint.copy(source.point);
        }
        if (source.normal) {
            target.normal.copy(source.normal);
        } else {
            target.normal.set(0, 1, 0);
        }
        target.slope = source.slope;
        target.behavior = source.behavior || 'precise';
        return target;
    },
    setResolvedGroundHit: function (sourceGround, resolvedPosition, targetGround) {
        targetGround = targetGround || this.lastGroundHit;
        this.copyGroundHit(sourceGround, targetGround);

        if (resolvedPosition) {
            targetGround.point.x = resolvedPosition.x;
            targetGround.point.z = resolvedPosition.z;
        }

        return targetGround;
    },
    markNavMeshDirty: function () {
        this.navMeshDirty = true;
        this.collisionWorldDirty = true;
        this.hasLastGroundHit = false;
        this.hasLastAutoGroundSample = false;
    },
    markCollisionWorldDirty: function () {
        this.collisionWorldDirty = true;
    },
    handleSceneLoaded: function () {
        this.markNavMeshDirty();
        this.markCollisionWorldDirty();
        this.positionPrimed = false;
    },
    handleSceneChildAttached: function (event) {
        const classList = event && event.detail && event.detail.el && event.detail.el.classList ? event.detail.el.classList : null;
        if (classList && classList.contains('vrodos-navmesh')) {
            this.markNavMeshDirty();
        }
        if (classList && classList.contains('vrodos-collider')) {
            this.markCollisionWorldDirty();
        }
    },
    handleSceneChildDetached: function (event) {
        const classList = event && event.detail && event.detail.el && event.detail.el.classList ? event.detail.el.classList : null;
        if (classList && classList.contains('vrodos-navmesh')) {
            this.markNavMeshDirty();
        }
        if (classList && classList.contains('vrodos-collider')) {
            this.markCollisionWorldDirty();
        }
    },
    handleEnterVr: function () {
        this.rememberNonImmersiveNavigationPosition(true);
        window.setTimeout(() => {
            if (this.isImmersiveXrPresenting()) {
                this.resetImmersiveWorldLocomotion();
                this.ensureImmersiveRuntimeHelpers();
            }
        }, 100);
    },
    handleExitVr: function () {
        const finalImmersiveNavigationPosition = this.immersiveVirtualNavPosition.clone();
        this.restoreImmersiveWorldBaseTransforms();
        this.immersiveWasPresenting = false;
        this.heightOffset = null;
        this.hasLastGroundHit = false;
        this.positionPrimed = false;
        this.disposeImmersiveTargetRayLines();

        if (!this.isImmersiveXrPresenting()) {
            this.setNavigationWorldPosition(finalImmersiveNavigationPosition);
        }
    },
    handleThumbstickMove: function (event) {
        if (!event || !event.detail) {
            return;
        }

        const source = event.currentTarget || event.target;
        const sourceId = source && source.id ? source.id : '';
        const targetInput = (source === this.thumbR || sourceId === 'rightHand' || sourceId === 'oculusRight')
            ? this.rightThumbInput
            : this.leftThumbInput;
        targetInput.x = event.detail.x || 0;
        const rawY = event.detail.y || 0;
        // Meta/A-Frame reports the movement stick Y axis opposite to VRodos movement math; this normalization is intentional.
        targetInput.y = targetInput === this.leftThumbInput ? -rawY : rawY;
    },
    handleThumbstickEnd: function (event) {
        const source = event ? (event.currentTarget || event.target) : null;
        if (!source || source === this.thumbL) {
            this.leftThumbInput.x = 0;
            this.leftThumbInput.y = 0;
        }
        if (!source || source === this.thumbR) {
            this.rightThumbInput.x = 0;
            this.rightThumbInput.y = 0;
        }
    },
    handleRecoveryButtonDown: function (event) {
        if (this.requestAutoTerrainRecovery('controller') && event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
    },
    handleNavmeshModelLoad: function (event) {
        if (!event || !event.target || !event.target.classList) {
            return;
        }

        if (event.target.classList.contains('vrodos-navmesh')) {
            const hadResolvedGround = this.hasLastGroundHit;
            this.markNavMeshDirty();
            if (this.positionPrimed && hadResolvedGround) {
                this.syncHeightOffset();
            } else {
                this.syncInitialHeightOffset();
            }
        }

        if (event.target.classList.contains('vrodos-collider')) {
            this.markCollisionWorldDirty();
        }
    },
    shouldIgnoreKeyboardEvent: function (event) {
        const target = event ? event.target : null;
        if (!target) {
            return false;
        }

        const tagName = target.tagName ? target.tagName.toLowerCase() : '';
        return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
    },
    updateKeyboardAxis: function (code, isPressed) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keyboardInput.y = isPressed ? -1 : (this.keyboardInput.y === -1 ? 0 : this.keyboardInput.y);
                return true;
            case 'KeyS':
            case 'ArrowDown':
                this.keyboardInput.y = isPressed ? 1 : (this.keyboardInput.y === 1 ? 0 : this.keyboardInput.y);
                return true;
            case 'KeyA':
            case 'ArrowLeft':
                this.keyboardInput.x = isPressed ? -1 : (this.keyboardInput.x === -1 ? 0 : this.keyboardInput.x);
                return true;
            case 'KeyD':
            case 'ArrowRight':
                this.keyboardInput.x = isPressed ? 1 : (this.keyboardInput.x === 1 ? 0 : this.keyboardInput.x);
                return true;
            case 'KeyQ':
                if (this.getNavigationMode() !== 'fly') {
                    if (!isPressed && this.keyboardInput.vertical === -1) {
                        this.keyboardInput.vertical = 0;
                    }
                    return false;
                }
                this.keyboardInput.vertical = isPressed ? -1 : (this.keyboardInput.vertical === -1 ? 0 : this.keyboardInput.vertical);
                return true;
            case 'KeyE':
                if (this.getNavigationMode() !== 'fly') {
                    if (!isPressed && this.keyboardInput.vertical === 1) {
                        this.keyboardInput.vertical = 0;
                    }
                    return false;
                }
                this.keyboardInput.vertical = isPressed ? 1 : (this.keyboardInput.vertical === 1 ? 0 : this.keyboardInput.vertical);
                return true;
            default:
                break;
        }

        return false;
    },
    handleKeyDown: function (event) {
        if (!event || this.shouldIgnoreKeyboardEvent(event)) {
            return;
        }

        if (this.isRecoveryKeyEvent(event)) {
            const recovered = this.requestAutoTerrainRecovery('keyboard');
            if (recovered || this.getNavigationMode() === 'walkable') {
                event.preventDefault();
            }
            return;
        }

        if (this.updateKeyboardAxis(event.code, true)) {
            event.preventDefault();
        }
    },
    handleKeyUp: function (event) {
        if (!event) {
            return;
        }

        if (this.updateKeyboardAxis(event.code, false)) {
            event.preventDefault();
        }
    },
    isRecoveryKeyEvent: function (event) {
        return Boolean(event && (
            event.code === 'Space' ||
            event.key === ' ' ||
            event.key === 'Spacebar' ||
            event.keyCode === 32
        ));
    },
    remove: function () {
        if (this.thumbL) {
            this.thumbL.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
            this.thumbL.removeEventListener('thumbsticktouchend', this.handleThumbstickEnd);
            this.thumbL.removeEventListener('thumbstickup', this.handleThumbstickEnd);
        }
        if (this.thumbR) {
            this.thumbR.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
            this.thumbR.removeEventListener('thumbsticktouchend', this.handleThumbstickEnd);
            this.thumbR.removeEventListener('thumbstickup', this.handleThumbstickEnd);
        }
        if (this.recoveryButtonEls && this.recoveryButtonEvents) {
            this.recoveryButtonEls.forEach((buttonEl) => {
                this.recoveryButtonEvents.forEach((eventName) => {
                    buttonEl.removeEventListener(eventName, this.handleRecoveryButtonDown);
                });
            });
            this.recoveryButtonEls = [];
        }
        this.sceneEl.removeEventListener('model-loaded', this.handleNavmeshModelLoad);
        this.sceneEl.removeEventListener('loaded', this.handleSceneLoaded);
        this.sceneEl.removeEventListener('child-attached', this.handleSceneChildAttached);
        this.sceneEl.removeEventListener('child-detached', this.handleSceneChildDetached);
        this.sceneEl.removeEventListener('enter-vr', this.handleEnterVr);
        this.sceneEl.removeEventListener('exit-vr', this.handleExitVr);
        window.removeEventListener('keydown', this.handleKeyDown, true);
        window.removeEventListener('keyup', this.handleKeyUp, true);
        this.disposeImmersiveTargetRayLines();
        if (this.navPerfDebug && this.navPerfDebug.overlay && this.navPerfDebug.overlay.parentNode) {
            this.navPerfDebug.overlay.parentNode.removeChild(this.navPerfDebug.overlay);
            this.navPerfDebug.overlay = null;
        }
    },
    createNavPerfDebugState: function () {
        if (!vrodosNavPerfDebugEnabled()) {
            return null;
        }

        return {
            overlay: null,
            lastOverlayAt: 0,
            frames: 0,
            movingFrames: 0,
            collisionFrames: 0,
            totalTickMs: 0,
            totalConstrainedMs: 0,
            totalSampleMs: 0,
            totalRaycastMs: 0,
            totalRaycasts: 0,
            totalIntersections: 0,
            avgTickMs: 0,
            avgConstrainedMs: 0,
            avgSampleMs: 0,
            avgRaycastMs: 0,
            avgRaycasts: 0,
            avgIntersections: 0,
            frame: null
        };
    },
    ensureNavPerfDebugOverlay: function () {
        if (!this.navPerfDebug || typeof document === 'undefined' || !document.body) {
            return null;
        }

        if (!this.navPerfDebug.overlay) {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.left = '12px';
            overlay.style.top = '12px';
            overlay.style.zIndex = '99998';
            overlay.style.padding = '8px 10px';
            overlay.style.borderRadius = '8px';
            overlay.style.background = 'rgba(10, 16, 28, 0.88)';
            overlay.style.color = '#9ef7b3';
            overlay.style.font = '12px/1.35 Consolas, Monaco, monospace';
            overlay.style.whiteSpace = 'pre';
            overlay.style.pointerEvents = 'none';
            overlay.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.28)';
            overlay.textContent = 'NAV PERF DEBUG\nwaiting for movement...';
            document.body.appendChild(overlay);
            this.navPerfDebug.overlay = overlay;
        }

        return this.navPerfDebug.overlay;
    },
    beginNavPerfDebugFrame: function () {
        if (!this.navPerfDebug) {
            return;
        }

        this.navPerfDebug.frame = {
            tickStart: performance.now(),
            tickMs: 0,
            constrainedMs: 0,
            sampleMs: 0,
            raycastMs: 0,
            raycasts: 0,
            intersections: 0,
            collisionsEnabled: false,
            immersiveCollisionsEnabled: false,
            moving: false
        };
    },
    finishNavPerfDebugFrame: function () {
        if (!this.navPerfDebug || !this.navPerfDebug.frame) {
            return;
        }

        const now = performance.now();
        const frame = this.navPerfDebug.frame;
        const alpha = 0.2;
        frame.tickMs = now - frame.tickStart;

        this.navPerfDebug.frames += 1;
        this.navPerfDebug.totalTickMs += frame.tickMs;
        this.navPerfDebug.totalConstrainedMs += frame.constrainedMs;
        this.navPerfDebug.totalSampleMs += frame.sampleMs;
        this.navPerfDebug.totalRaycastMs += frame.raycastMs;
        this.navPerfDebug.totalRaycasts += frame.raycasts;
        this.navPerfDebug.totalIntersections += frame.intersections;
        if (frame.moving) {
            this.navPerfDebug.movingFrames += 1;
        }
        if (frame.collisionsEnabled) {
            this.navPerfDebug.collisionFrames += 1;
        }

        this.navPerfDebug.avgTickMs = this.navPerfDebug.avgTickMs === 0 ? frame.tickMs : (this.navPerfDebug.avgTickMs * (1 - alpha)) + (frame.tickMs * alpha);
        this.navPerfDebug.avgConstrainedMs = this.navPerfDebug.avgConstrainedMs === 0 ? frame.constrainedMs : (this.navPerfDebug.avgConstrainedMs * (1 - alpha)) + (frame.constrainedMs * alpha);
        this.navPerfDebug.avgSampleMs = this.navPerfDebug.avgSampleMs === 0 ? frame.sampleMs : (this.navPerfDebug.avgSampleMs * (1 - alpha)) + (frame.sampleMs * alpha);
        this.navPerfDebug.avgRaycastMs = this.navPerfDebug.avgRaycastMs === 0 ? frame.raycastMs : (this.navPerfDebug.avgRaycastMs * (1 - alpha)) + (frame.raycastMs * alpha);
        this.navPerfDebug.avgRaycasts = this.navPerfDebug.avgRaycasts === 0 ? frame.raycasts : (this.navPerfDebug.avgRaycasts * (1 - alpha)) + (frame.raycasts * alpha);
        this.navPerfDebug.avgIntersections = this.navPerfDebug.avgIntersections === 0 ? frame.intersections : (this.navPerfDebug.avgIntersections * (1 - alpha)) + (frame.intersections * alpha);

        if ((now - this.navPerfDebug.lastOverlayAt) >= 150) {
            this.updateNavPerfDebugOverlay();
            this.navPerfDebug.lastOverlayAt = now;
        }
    },
    updateNavPerfDebugOverlay: function () {
        if (!this.navPerfDebug || !this.navPerfDebug.frame) {
            return;
        }

        const overlay = this.ensureNavPerfDebugOverlay();
        if (!overlay) {
            return;
        }

        const frame = this.navPerfDebug.frame;
        overlay.textContent = [
            'NAV PERF DEBUG',
            `moving: ${  frame.moving ? 'yes' : 'no'}`,
            `collisions: ${  frame.collisionsEnabled ? 'on' : 'off'}`,
            `immersive collisions: ${  frame.immersiveCollisionsEnabled ? 'on' : 'off'}`,
            `targets: nav ${  this.navMeshCollisionTargets.length  } block ${  this.blockerCollisionTargets.length}`,
            `tick ms: ${  frame.tickMs.toFixed(2)  } avg ${  this.navPerfDebug.avgTickMs.toFixed(2)}`,
            `constrained ms: ${  frame.constrainedMs.toFixed(2)  } avg ${  this.navPerfDebug.avgConstrainedMs.toFixed(2)}`,
            `sample ms: ${  frame.sampleMs.toFixed(2)  } avg ${  this.navPerfDebug.avgSampleMs.toFixed(2)}`,
            `raycast ms: ${  frame.raycastMs.toFixed(2)  } avg ${  this.navPerfDebug.avgRaycastMs.toFixed(2)}`,
            `raycasts: ${  frame.raycasts  } avg ${  this.navPerfDebug.avgRaycasts.toFixed(1)}`,
            `intersections: ${  frame.intersections  } avg ${  this.navPerfDebug.avgIntersections.toFixed(1)}`,
            `auto recovery: ${  this.lastAutoRecoveryStatus}`
        ].join('\n');
    },
    getNavPerfDebugSnapshot: function () {
        const currentPosition = this.getNavigationWorldPosition();
        this.refreshNavMeshRoots();

        if (!this.navPerfDebug) {
            return {
                enabled: false,
                collisionTargets: this.navMeshCollisionTargets.length,
                navMeshRoots: this.navMeshRoots.length,
                position: {
                    x: currentPosition.x,
                    y: currentPosition.y,
                    z: currentPosition.z
                }
            };
        }

        const frames = Math.max(1, this.navPerfDebug.frames);
        const frame = this.navPerfDebug.frame || {};
        return {
            enabled: true,
            frames: this.navPerfDebug.frames,
            movingFrames: this.navPerfDebug.movingFrames,
            collisionFrames: this.navPerfDebug.collisionFrames,
            collisionTargets: this.navMeshCollisionTargets.length,
            blockerTargets: this.blockerCollisionTargets.length,
            navMeshRoots: this.navMeshRoots.length,
            colliderRoots: this.colliderRoots.length,
            averages: {
                tickMs: this.navPerfDebug.totalTickMs / frames,
                constrainedMs: this.navPerfDebug.totalConstrainedMs / frames,
                sampleMs: this.navPerfDebug.totalSampleMs / frames,
                raycastMs: this.navPerfDebug.totalRaycastMs / frames,
                raycasts: this.navPerfDebug.totalRaycasts / frames,
                intersections: this.navPerfDebug.totalIntersections / frames,
                emaTickMs: this.navPerfDebug.avgTickMs,
                emaConstrainedMs: this.navPerfDebug.avgConstrainedMs,
                emaSampleMs: this.navPerfDebug.avgSampleMs,
                emaRaycastMs: this.navPerfDebug.avgRaycastMs,
                emaRaycasts: this.navPerfDebug.avgRaycasts,
                emaIntersections: this.navPerfDebug.avgIntersections
            },
            totals: {
                tickMs: this.navPerfDebug.totalTickMs,
                constrainedMs: this.navPerfDebug.totalConstrainedMs,
                sampleMs: this.navPerfDebug.totalSampleMs,
                raycastMs: this.navPerfDebug.totalRaycastMs,
                raycasts: this.navPerfDebug.totalRaycasts,
                intersections: this.navPerfDebug.totalIntersections
            },
            autoRecovery: {
                status: this.lastAutoRecoveryStatus,
                lastAt: this.lastAutoRecoveryAt,
                recentStableCount: this.autoStableGroundHistory.filter((entry) => entry.valid).length
            },
            lastFrame: {
                moving: Boolean(frame.moving),
                collisionsEnabled: Boolean(frame.collisionsEnabled),
                immersiveCollisionsEnabled: Boolean(frame.immersiveCollisionsEnabled),
                tickMs: frame.tickMs || 0,
                constrainedMs: frame.constrainedMs || 0,
                sampleMs: frame.sampleMs || 0,
                raycastMs: frame.raycastMs || 0,
                raycasts: frame.raycasts || 0,
                intersections: frame.intersections || 0
            },
            position: {
                x: currentPosition.x,
                y: currentPosition.y,
                z: currentPosition.z
            }
        };
    },
    getSceneSettings: function () {
        return this.sceneEl ? this.sceneEl.getAttribute('scene-settings') : null;
    },
    getSceneSettingsDomAttribute: function () {
        if (!this.sceneEl) {
            return '';
        }

        if (typeof this.sceneEl.getDOMAttribute === 'function') {
            const domAttribute = this.sceneEl.getDOMAttribute('scene-settings');
            if (typeof domAttribute === 'string') {
                return domAttribute;
            }
        }

        const attributeNode = this.sceneEl.attributes ? this.sceneEl.attributes.getNamedItem('scene-settings') : null;
        return attributeNode ? attributeNode.value : '';
    },
    hasAuthoredNavigationMode: function () {
        return /(?:^|;)\s*navigationMode\s*:/.test(this.getSceneSettingsDomAttribute());
    },
    getNavigationMode: function (settings) {
        settings = settings || this.getSceneSettings();
        const mode = settings ? settings.navigationMode : '';
        if (this.hasAuthoredNavigationMode() && (mode === 'walk' || mode === 'walkable' || mode === 'fly')) {
            return mode;
        }

        return settings && settings.collisionMode === 'off' ? 'walk' : 'walkable';
    },
    getNavigationAnchorObject: function () {
        if (this.cameraEl && this.cameraEl.object3D) {
            return this.cameraEl.object3D;
        }

        return this.cameraRig ? this.cameraRig.object3D : null;
    },
    getImmersivePhysicalAnchorPosition: function (target) {
        const output = target || this.immersivePhysicalAnchorPosition;
        const xr = this.sceneEl && this.sceneEl.renderer ? this.sceneEl.renderer.xr : null;
        const baseCamera = this.sceneEl && this.sceneEl.camera
            ? this.sceneEl.camera
            : (this.cameraEl && this.cameraEl.object3D && this.cameraEl.object3D.children ? this.cameraEl.object3D.children[0] : null);

        try {
            if (xr && xr.isPresenting && typeof xr.getCamera === 'function') {
                const xrCamera = xr.getCamera(baseCamera);
                if (xrCamera) {
                    xrCamera.updateMatrixWorld(true);
                    return xrCamera.getWorldPosition(output);
                }
            }
        } catch (err) {
            // Fall back to the A-Frame camera path below.
        }

        const anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject) {
            return output.set(0, 0, 0);
        }

        anchorObject.updateMatrixWorld(true);
        return anchorObject.getWorldPosition(output);
    },
    rememberNonImmersiveNavigationPosition: function (forceGroundSample) {
        if (this.isImmersiveXrPresenting()) {
            return;
        }

        const anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject || typeof anchorObject.getWorldPosition !== 'function') {
            return;
        }

        if (typeof anchorObject.updateMatrixWorld === 'function') {
            anchorObject.updateMatrixWorld(true);
        }
        anchorObject.getWorldPosition(this.lastNonImmersiveNavigationPosition);
        this.hasLastNonImmersiveNavigationPosition = true;

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (!forceGroundSample && this.hasLastNonImmersiveGround && (now - this.lastNonImmersiveGroundRememberedAt) < 500) {
            return;
        }

        if (!this.areCollisionsEnabled()) {
            return;
        }

        const groundHit = this.sampleGroundAt(
            this.lastNonImmersiveNavigationPosition,
            this.hasLastGroundHit ? this.lastGroundHit.point.y : undefined,
            this.sampledGroundHit
        );
        if (!groundHit) {
            return;
        }

        this.lastNonImmersiveGroundY = groundHit.point.y;
        this.lastNonImmersiveHeightOffset = VRODOSMaster.clamp(
            this.lastNonImmersiveNavigationPosition.y - groundHit.point.y,
            0.2,
            2.5
        );
        this.hasLastNonImmersiveGround = true;
        this.lastNonImmersiveGroundRememberedAt = now;
    },
    getDesiredImmersiveEyeToGroundOffset: function () {
        if (this.hasLastNonImmersiveGround && typeof this.lastNonImmersiveHeightOffset === 'number') {
            return this.resolveImmersiveEyeToGroundOffset(this.lastNonImmersiveHeightOffset);
        }

        if (this.immersivePhysicalAnchorPosition && typeof this.immersivePhysicalAnchorPosition.y === 'number') {
            return this.resolveImmersiveEyeToGroundOffset(this.immersivePhysicalAnchorPosition.y);
        }

        return this.immersiveDefaultEyeToGroundOffset;
    },
    getImmersiveEyeToGroundFallback: function () {
        const physicalHeight = this.immersivePhysicalAnchorPosition && typeof this.immersivePhysicalAnchorPosition.y === 'number'
            ? this.immersivePhysicalAnchorPosition.y
            : null;
        if (
            Number.isFinite(physicalHeight) &&
            physicalHeight >= this.immersiveMinEyeToGroundOffset &&
            physicalHeight <= this.immersiveMaxEyeToGroundOffset
        ) {
            return physicalHeight;
        }

        return this.immersiveDefaultEyeToGroundOffset;
    },
    resolveImmersiveEyeToGroundOffset: function (rawHeightOffset) {
        const numericHeightOffset = Number(rawHeightOffset);
        this.immersiveRawHeightOffset = Number.isFinite(numericHeightOffset) ? numericHeightOffset : null;

        if (
            Number.isFinite(numericHeightOffset) &&
            numericHeightOffset >= this.immersiveMinEyeToGroundOffset &&
            numericHeightOffset <= this.immersiveMaxEyeToGroundOffset
        ) {
            this.immersiveHeightCalibrationApplied = false;
            return numericHeightOffset;
        }

        this.immersiveHeightCalibrationApplied = true;
        return this.getImmersiveEyeToGroundFallback();
    },
    resolveNavigationHeightOffset: function (rawHeightOffset) {
        if (this.isImmersiveXrPresenting()) {
            return this.resolveImmersiveEyeToGroundOffset(rawHeightOffset);
        }

        return VRODOSMaster.clamp(rawHeightOffset, 0.2, 2.5);
    },
    clearImmersiveGroundCaches: function () {
        this.hasLastGroundHit = false;
        this.hasLastAutoGroundSample = false;
        this.lastAutoGroundSampleAt = 0;
        for (let i = 0; i < this.autoStableGroundHistory.length; i++) {
            this.autoStableGroundHistory[i].valid = false;
        }
    },
    getImmersiveAuthoredStartPosition: function (target) {
        target = target || this.immersiveVirtualNavPosition;
        if (this.hasLastNonImmersiveNavigationPosition) {
            return target.copy(this.lastNonImmersiveNavigationPosition);
        }

        if (this.cameraEl && this.cameraEl.object3D && typeof this.cameraEl.object3D.getWorldPosition === 'function') {
            this.cameraEl.object3D.updateMatrixWorld(true);
            return this.cameraEl.object3D.getWorldPosition(target);
        }

        return target.copy(this.immersivePhysicalAnchorPosition);
    },
    clearImmersiveWorldBaseTransforms: function () {
        this.immersiveWorldBaseTransforms.clear();
    },
    captureImmersiveWorldBaseTransforms: function (roots) {
        roots = roots || this.getImmersiveWorldRoots();
        for (let i = 0; i < roots.length; i++) {
            const el = roots[i];
            const object = el && el.object3D ? el.object3D : null;
            if (!object || this.immersiveWorldBaseTransforms.has(el)) {
                continue;
            }

            this.immersiveWorldBaseTransforms.set(el, {
                position: object.position.clone(),
                quaternion: object.quaternion.clone(),
                scale: object.scale.clone()
            });
        }
    },
    restoreImmersiveWorldBaseTransforms: function () {
        this.immersiveWorldBaseTransforms.forEach((base, el) => {
            const object = el && el.object3D ? el.object3D : null;
            if (!object) {
                return;
            }

            object.position.copy(base.position);
            object.quaternion.copy(base.quaternion);
            object.scale.copy(base.scale);
            object.updateMatrixWorld(true);
        });
        this.clearImmersiveWorldBaseTransforms();
    },
    updateImmersiveRenderTransformState: function () {
        this.immersiveRenderQuaternion.setFromAxisAngle(this.upVector, this.immersiveRenderYaw);
        this.immersiveRenderOffset.copy(this.immersiveVirtualNavPosition).applyQuaternion(this.immersiveRenderQuaternion);
        this.immersiveRenderOffset.subVectors(this.immersivePhysicalAnchorPosition, this.immersiveRenderOffset);
    },
    authoredToRenderedPosition: function (source, target) {
        target = target || this.immersiveRenderedPoint;
        if (!this.isImmersiveXrPresenting()) {
            return target.copy(source);
        }

        return target.copy(source).applyQuaternion(this.immersiveRenderQuaternion).add(this.immersiveRenderOffset);
    },
    renderedToAuthoredPosition: function (source, target) {
        target = target || this.immersiveAuthoredPoint;
        if (!this.isImmersiveXrPresenting()) {
            return target.copy(source);
        }

        return target.copy(source)
            .sub(this.immersiveRenderOffset)
            .applyAxisAngle(this.upVector, -this.immersiveRenderYaw);
    },
    authoredToRenderedDirection: function (source, target) {
        target = target || this.immersiveRenderedDirection;
        if (!this.isImmersiveXrPresenting()) {
            return target.copy(source);
        }

        return target.copy(source).applyQuaternion(this.immersiveRenderQuaternion).normalize();
    },
    renderedToAuthoredDirection: function (source, target) {
        target = target || this.immersiveAuthoredDirection;
        if (!this.isImmersiveXrPresenting()) {
            return target.copy(source);
        }

        return target.copy(source).applyAxisAngle(this.upVector, -this.immersiveRenderYaw).normalize();
    },
    applyImmersiveRenderTransform: function () {
        if (!this.isImmersiveXrPresenting()) {
            return false;
        }

        this.getImmersivePhysicalAnchorPosition(this.immersivePhysicalAnchorPosition);
        const roots = this.getImmersiveWorldRoots();
        this.captureImmersiveWorldBaseTransforms(roots);
        this.updateImmersiveRenderTransformState();

        for (let i = 0; i < roots.length; i++) {
            const el = roots[i];
            const object = el && el.object3D ? el.object3D : null;
            const base = this.immersiveWorldBaseTransforms.get(el);
            if (!object || !base) {
                continue;
            }

            this.authoredToRenderedPosition(base.position, object.position);
            object.quaternion.copy(this.immersiveRenderQuaternion).multiply(base.quaternion);
            object.scale.copy(base.scale);
            object.updateMatrixWorld(true);
        }

        this.immersiveLastRenderAppliedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        this.requestShadowMapRefresh();
        return roots.length > 0;
    },
    initializeImmersiveCollisionState: function () {
        this.clearImmersiveWorldBaseTransforms();
        this.getImmersivePhysicalAnchorPosition(this.immersivePhysicalAnchorPosition);
        this.getImmersiveAuthoredStartPosition(this.immersiveVirtualNavPosition);
        this.immersiveRenderYaw = 0;
        this.heightOffset = null;
        this.immersiveLastStepDeltaY = 0;
        this.clearImmersiveGroundCaches();
        this.positionPrimed = true;
        this.immersiveWasPresenting = true;
        this.applyImmersiveRenderTransform();

        if (this.areCollisionsEnabled()) {
            this.syncInitialHeightOffset();
        } else {
            this.heightOffset = this.getDesiredImmersiveEyeToGroundOffset();
        }

        this.lastResolvedPosition.copy(this.immersiveVirtualNavPosition);

        const overlayApi = window.VRODOSRuntimeOverlay || null;
        if (overlayApi && typeof overlayApi.recordDiagnostic === 'function') {
            overlayApi.recordDiagnostic('debug', 'navigation: initialized immersive collision transform', {
                authoredNavPosition: {
                    x: Number(this.immersiveVirtualNavPosition.x.toFixed(3)),
                    y: Number(this.immersiveVirtualNavPosition.y.toFixed(3)),
                    z: Number(this.immersiveVirtualNavPosition.z.toFixed(3))
                },
                physicalAnchorPosition: {
                    x: Number(this.immersivePhysicalAnchorPosition.x.toFixed(3)),
                    y: Number(this.immersivePhysicalAnchorPosition.y.toFixed(3)),
                    z: Number(this.immersivePhysicalAnchorPosition.z.toFixed(3))
                },
                renderOffset: {
                    x: Number(this.immersiveRenderOffset.x.toFixed(3)),
                    y: Number(this.immersiveRenderOffset.y.toFixed(3)),
                    z: Number(this.immersiveRenderOffset.z.toFixed(3))
                },
                heightOffset: typeof this.heightOffset === 'number' ? Number(this.heightOffset.toFixed(3)) : null,
                rawHeightOffset: typeof this.immersiveRawHeightOffset === 'number' ? Number(this.immersiveRawHeightOffset.toFixed(3)) : null,
                heightCalibrationApplied: Boolean(this.immersiveHeightCalibrationApplied),
                rootCount: this.immersiveWorldRootDiagnostics && this.immersiveWorldRootDiagnostics.count || 0
            });
        }
    },
    getElementClassSummary: function (el) {
        if (!el || !el.classList || typeof Array.from !== 'function') {
            return '';
        }

        return Array.from(el.classList).slice(0, 8).join(' ');
    },
    elementHasClass: function (el, className) {
        return Boolean(el && el.classList && el.classList.contains(className));
    },
    hasElementAttribute: function (el, attributeName) {
        return Boolean(el && typeof el.hasAttribute === 'function' && el.hasAttribute(attributeName));
    },
    hasImmersiveWorldDescendantMarker: function (el) {
        if (!el || typeof el.querySelector !== 'function') {
            return false;
        }

        return Boolean(el.querySelector([
            '[video-controls]',
            '[data-vrodos-video-src]',
            '[immerse-cefr-asset]',
            '[data-immerse-cefr-levels]',
            '[immerse-assessment-launcher]',
            '[data-assessment-content]'
        ].join(',')));
    },
    hasImmersiveWorldRootMarker: function (el) {
        if (!el || typeof el.hasAttribute !== 'function') {
            return false;
        }

        const id = el.id || '';
        return (
            id.indexOf('vrodos-reveal-') === 0 ||
            id.indexOf('video-display_') === 0 ||
            id.indexOf('image-display_') === 0 ||
            id.indexOf('button_poi_') === 0 ||
            this.hasElementAttribute(el, 'data-vrodos-load-phase') ||
            this.hasElementAttribute(el, 'data-vrodos-delayed-reveal') ||
            this.hasElementAttribute(el, 'data-vrodos-collider') ||
            this.hasElementAttribute(el, 'data-vrodos-navmesh') ||
            this.hasElementAttribute(el, 'data-vrodos-world-lighting') ||
            this.hasElementAttribute(el, 'data-vrodos-overlay-ui') ||
            this.hasElementAttribute(el, 'data-vrodos-lazy-gltf-src') ||
            this.hasElementAttribute(el, 'gltf-model') ||
            this.hasElementAttribute(el, 'video-controls') ||
            this.hasElementAttribute(el, 'data-vrodos-video-src') ||
            this.hasElementAttribute(el, 'immerse-cefr-asset') ||
            this.hasElementAttribute(el, 'data-immerse-cefr-levels') ||
            this.hasElementAttribute(el, 'immerse-assessment-launcher') ||
            this.hasElementAttribute(el, 'data-assessment-content') ||
            this.elementHasClass(el, 'vrodos-collider') ||
            this.elementHasClass(el, 'vrodos-navmesh') ||
            this.elementHasClass(el, 'raycastable') ||
            this.hasImmersiveWorldDescendantMarker(el)
        );
    },
    isImmersiveSystemRoot: function (el) {
        if (!el || !el.object3D) {
            return true;
        }

        const tagName = el.tagName || '';
        const id = el.id || '';
        const objectName = el.object3D.name || '';
        return (
            tagName === 'A-ASSETS' ||
            tagName === 'SCRIPT' ||
            el === this.el ||
            el === this.cameraEl ||
            id === 'actor' ||
            id === 'scene-assets' ||
            id === 'player' ||
            id === 'cameraA' ||
            id === 'cursor' ||
            id === 'oculusLeft' ||
            id === 'oculusRight' ||
            id === 'leftHand' ||
            id === 'rightHand' ||
            id === 'vrodos-pmndrs-sun' ||
            id === 'vrodos-pmndrs-sun-haze' ||
            id.indexOf('VRODOSSpatialUI') === 0 ||
            objectName.indexOf('VRODOSSpatialUI') === 0
        );
    },
    getImmersiveWorldRootSample: function (el) {
        return {
            id: el && el.id ? el.id : '',
            tag: el && el.tagName ? el.tagName.toLowerCase() : '',
            classes: this.getElementClassSummary(el),
            video: Boolean(el && (
                this.hasElementAttribute(el, 'video-controls') ||
                this.hasElementAttribute(el, 'data-vrodos-video-src') ||
                (el.id || '').indexOf('video-display_') === 0 ||
                (typeof el.querySelector === 'function' && el.querySelector('[video-controls], [data-vrodos-video-src]'))
            )),
            assessment: Boolean(el && (
                this.hasElementAttribute(el, 'immerse-assessment-launcher') ||
                this.hasElementAttribute(el, 'data-assessment-content') ||
                (typeof el.querySelector === 'function' && el.querySelector('[immerse-assessment-launcher], [data-assessment-content]'))
            )),
            cefr: Boolean(el && (
                this.hasElementAttribute(el, 'immerse-cefr-asset') ||
                this.hasElementAttribute(el, 'data-immerse-cefr-levels') ||
                (typeof el.querySelector === 'function' && el.querySelector('[immerse-cefr-asset], [data-immerse-cefr-levels]'))
            ))
        };
    },
    getTopLevelSceneChild: function (el) {
        if (!el || !this.sceneEl) {
            return null;
        }

        let current = el;
        while (current && current.parentElement && current.parentElement !== this.sceneEl) {
            current = current.parentElement;
        }

        return current && current.parentElement === this.sceneEl ? current : null;
    },
    getImmersiveCollisionRootCoverage: function (roots) {
        const rootSet = new Set(roots || []);
        const collisionEls = this.sceneEl && typeof this.sceneEl.querySelectorAll === 'function'
            ? this.sceneEl.querySelectorAll('.vrodos-navmesh, .vrodos-collider, [data-vrodos-navmesh], [data-vrodos-collider]')
            : [];
        let navmeshElementCount = 0;
        let colliderElementCount = 0;
        let missingCollisionRootCount = 0;
        const missingCollisionRootSamples = [];

        for (let i = 0; i < collisionEls.length; i++) {
            const el = collisionEls[i];
            if (this.elementHasClass(el, 'vrodos-navmesh') || this.hasElementAttribute(el, 'data-vrodos-navmesh')) {
                navmeshElementCount += 1;
            }
            if (this.elementHasClass(el, 'vrodos-collider') || this.hasElementAttribute(el, 'data-vrodos-collider')) {
                colliderElementCount += 1;
            }

            const topLevelRoot = this.getTopLevelSceneChild(el);
            if (!topLevelRoot || this.isImmersiveSystemRoot(topLevelRoot) || rootSet.has(topLevelRoot)) {
                continue;
            }

            missingCollisionRootCount += 1;
            if (missingCollisionRootSamples.length < 8) {
                missingCollisionRootSamples.push(this.getImmersiveWorldRootSample(topLevelRoot));
            }
        }

        return {
            navmeshElementCount,
            colliderElementCount,
            missingCollisionRootCount,
            missingCollisionRootSamples,
            collisionRootsCovered: missingCollisionRootCount === 0
        };
    },
    updateImmersiveWorldRootDiagnostics: function (roots) {
        const samples = [];
        let videoDisplayRootCount = 0;
        let assessmentRootCount = 0;
        let assessmentWrapperRootCount = 0;
        let cefrRootCount = 0;

        for (let i = 0; i < roots.length; i++) {
            const root = roots[i];
            const sample = this.getImmersiveWorldRootSample(root);
            if (sample.video) {
                videoDisplayRootCount += 1;
            }
            if (sample.assessment) {
                assessmentRootCount += 1;
                if (
                    !this.hasElementAttribute(root, 'immerse-assessment-launcher') &&
                    typeof root.querySelector === 'function' &&
                    root.querySelector('[immerse-assessment-launcher], [data-assessment-content]')
                ) {
                    assessmentWrapperRootCount += 1;
                }
            }
            if (sample.cefr) {
                cefrRootCount += 1;
            }
            if (samples.length < 16) {
                samples.push(sample);
            }
        }
        const collisionCoverage = this.getImmersiveCollisionRootCoverage(roots);

        this.immersiveWorldRootDiagnostics = {
            count: roots.length,
            samples,
            videoDisplayRootCount,
            assessmentRootCount,
            assessmentWrapperRootCount,
            cefrRootCount,
            includesVideoDisplays: videoDisplayRootCount > 0,
            includesAssessmentWrappers: assessmentWrapperRootCount > 0,
            navmeshElementCount: collisionCoverage.navmeshElementCount,
            colliderElementCount: collisionCoverage.colliderElementCount,
            missingCollisionRootCount: collisionCoverage.missingCollisionRootCount,
            missingCollisionRootSamples: collisionCoverage.missingCollisionRootSamples,
            collisionRootsCovered: collisionCoverage.collisionRootsCovered
        };

        const signature = [
            roots.length,
            videoDisplayRootCount,
            assessmentRootCount,
            assessmentWrapperRootCount,
            cefrRootCount,
            collisionCoverage.missingCollisionRootCount,
            samples.map((entry) => `${entry.tag}:${entry.id}`).join('|')
        ].join(':');

        if (signature !== this.immersiveWorldRootDiagnosticsSignature) {
            this.immersiveWorldRootDiagnosticsSignature = signature;
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            if (overlayApi && typeof overlayApi.recordDiagnostic === 'function') {
                overlayApi.recordDiagnostic('debug', 'navigation: selected immersive world roots', this.immersiveWorldRootDiagnostics);
            } else if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.navigation && typeof console !== 'undefined' && typeof console.debug === 'function') {
                console.debug('[VRodos navigation] selected immersive world roots', this.immersiveWorldRootDiagnostics);
            }
        }
    },
    getImmersiveWorldRootDiagnostics: function () {
        if (!this.immersiveWorldRootDiagnostics || !this.immersiveWorldRootDiagnostics.count) {
            this.getImmersiveWorldRoots();
        }

        return this.immersiveWorldRootDiagnostics || {
            count: 0,
            samples: [],
            videoDisplayRootCount: 0,
            assessmentRootCount: 0,
            assessmentWrapperRootCount: 0,
            cefrRootCount: 0,
            includesVideoDisplays: false,
            includesAssessmentWrappers: false,
            navmeshElementCount: 0,
            colliderElementCount: 0,
            missingCollisionRootCount: 0,
            missingCollisionRootSamples: [],
            collisionRootsCovered: true
        };
    },
    getImmersiveWorldRoots: function () {
        if (!this.sceneEl || !this.sceneEl.children) {
            this.updateImmersiveWorldRootDiagnostics([]);
            return [];
        }

        // Quest Browser/A-Frame updates the rendered HMD camera from WebXR poses even when
        // the parent rig moves, while controllers still inherit the rig transform. In
        // immersive XR, keep #player as an identity tracking rig and move authored top-level
        // world roots around a virtual navigation position instead.
        const roots = [];
        const children = this.sceneEl.children;
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (!el || !el.object3D || this.isImmersiveSystemRoot(el)) {
                continue;
            }

            const tagName = el.tagName || '';
            if (tagName.indexOf('A-') !== 0) {
                continue;
            }

            if (this.hasImmersiveWorldRootMarker(el)) {
                roots.push(el);
            }
        }

        this.updateImmersiveWorldRootDiagnostics(roots);
        return roots;
    },
    resetImmersiveRigTransform: function () {
        if (!this.el || !this.el.object3D) {
            return;
        }

        this.el.object3D.position.set(0, 0, 0);
        this.el.object3D.rotation.set(0, 0, 0);
        this.el.object3D.scale.set(1, 1, 1);
        this.el.object3D.updateMatrixWorld(true);
    },
    resetImmersiveWorldLocomotion: function () {
        this.resetImmersiveRigTransform();
        this.initializeImmersiveCollisionState();
    },
    requestShadowMapRefresh: function () {
        const renderer = this.sceneEl && this.sceneEl.renderer ? this.sceneEl.renderer : null;
        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.needsUpdate = true;
        }
    },
    suppressImmersiveControllerShadows: function () {
        const controllerEls = [this.thumbL, this.thumbR];
        for (let i = 0; i < controllerEls.length; i++) {
            const controllerEl = controllerEls[i];
            if (!controllerEl || !controllerEl.object3D) {
                continue;
            }

            controllerEl.object3D.traverse((object) => {
                if ('castShadow' in object) {
                    object.castShadow = false;
                }
                if ('receiveShadow' in object) {
                    object.receiveShadow = false;
                }
            });
        }
    },
    ensureAFrameControllerRayVisuals: function () {
        const controllerEls = [this.thumbL, this.thumbR];
        for (let i = 0; i < controllerEls.length; i++) {
            const controllerEl = controllerEls[i];
            if (!controllerEl) {
                continue;
            }

            const currentRaycaster = controllerEl.getAttribute ? (controllerEl.getAttribute('raycaster') || {}) : {};
            const objects = currentRaycaster.objects || '.raycastable';
            const far = currentRaycaster.far || 100;
            if (controllerEl.setAttribute) {
                controllerEl.setAttribute('raycaster', `objects: ${objects}; showLine: true; far: ${far}; lineColor: white; lineOpacity: 1`);
            }

            const raycaster = controllerEl.components ? controllerEl.components.raycaster : null;
            if (raycaster && raycaster.data) {
                const oldData = Object.assign({}, raycaster.data);
                raycaster.data.showLine = true;
                raycaster.data.lineColor = 'white';
                raycaster.data.lineOpacity = 1;
                if (typeof raycaster.update === 'function') {
                    raycaster.update(oldData);
                }
            }

            const lineObject = controllerEl.getObject3D ? controllerEl.getObject3D('line') : null;
            if (lineObject) {
                lineObject.visible = true;
            }

            const lineComponent = controllerEl.components ? controllerEl.components.line : null;
            if (lineComponent && lineComponent.line) {
                lineComponent.line.visible = true;
            }
        }
    },
    suppressImmersiveOverlayShadows: function () {
        if (!this.sceneEl || !this.sceneEl.querySelectorAll) {
            return;
        }

        const shadowEls = this.sceneEl.querySelectorAll(
            '.menu-button, [data-vrodos-overlay-ui], [data-vrodos-collision-category="poi-imagetext"]'
        );
        for (let i = 0; i < shadowEls.length; i++) {
            const el = shadowEls[i];
            if (!el || !el.object3D) {
                continue;
            }

            el.object3D.traverse((object) => {
                if ('castShadow' in object) {
                    object.castShadow = false;
                }
                if ('receiveShadow' in object && el.hasAttribute('data-vrodos-overlay-ui')) {
                    object.receiveShadow = false;
                }
            });
            el.setAttribute('shadow', 'cast: false; receive: false');
        }
    },
    disposeImmersiveTargetRayLines: function () {
        if (this.immersiveTargetRayLines) {
            for (let i = 0; i < this.immersiveTargetRayLines.length; i++) {
                const rayLine = this.immersiveTargetRayLines[i];
                if (rayLine && rayLine.parent) {
                    rayLine.parent.remove(rayLine);
                }
            }
            this.immersiveTargetRayLines = [];
        }

        if (this.immersiveTargetRayGeometry && typeof this.immersiveTargetRayGeometry.dispose === 'function') {
            this.immersiveTargetRayGeometry.dispose();
        }
        if (this.immersiveTargetRayMaterial && typeof this.immersiveTargetRayMaterial.dispose === 'function') {
            this.immersiveTargetRayMaterial.dispose();
        }

        this.immersiveTargetRayGeometry = null;
        this.immersiveTargetRayMaterial = null;
    },
    ensureImmersiveRuntimeHelpers: function () {
        if (!this.isImmersiveXrPresenting()) {
            return;
        }

        this.resetImmersiveRigTransform();
        this.disposeImmersiveTargetRayLines();
        // The visible controller ray must be the same A-Frame raycaster line that
        // performs selection; separate display-only WebXR target rays drift from hits.
        this.ensureAFrameControllerRayVisuals();
        this.suppressImmersiveControllerShadows();

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (now - this.immersiveShadowSuppressedAt > 500) {
            this.suppressImmersiveOverlayShadows();
            this.requestShadowMapRefresh();
            this.immersiveShadowSuppressedAt = now;
        }
    },
    getNavigationWorldPosition: function () {
        if (this.isImmersiveXrPresenting()) {
            if (!this.immersiveWasPresenting) {
                this.resetImmersiveWorldLocomotion();
            }

            return this.currentWorldPosition.copy(this.immersiveVirtualNavPosition);
        }

        const anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject) {
            return this.currentWorldPosition.set(0, 0, 0);
        }

        return anchorObject.getWorldPosition(this.currentWorldPosition);
    },
    setNavigationWorldPosition: function (targetWorldPosition) {
        if (this.isImmersiveXrPresenting()) {
            if (!targetWorldPosition) {
                return false;
            }

            if (!this.immersiveWasPresenting) {
                this.resetImmersiveWorldLocomotion();
            }

            this.immersiveWorldDelta.copy(targetWorldPosition).sub(this.immersiveVirtualNavPosition);
            if (this.immersiveWorldDelta.lengthSq() < 0.0000000001) {
                return true;
            }

            this.immersiveVirtualNavPosition.copy(targetWorldPosition);
            this.applyImmersiveRenderTransform();
            return true;
        }

        const anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject || !this.cameraRig || !this.cameraRig.object3D) {
            return false;
        }

        const currentWorldPosition = this.getNavigationWorldPosition();
        this.movementOffset.copy(targetWorldPosition).sub(currentWorldPosition);
        this.cameraRig.object3D.position.add(this.movementOffset);
        return true;
    },
    horizontalDistanceSquared: function (pointA, pointB) {
        if (!pointA || !pointB) {
            return Infinity;
        }

        const deltaX = pointA.x - pointB.x;
        const deltaZ = pointA.z - pointB.z;
        return deltaX * deltaX + deltaZ * deltaZ;
    },
    ensureNavigationStatePrimed: function () {
        if (this.positionPrimed) {
            return;
        }

        this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        this.hasLastGroundHit = false;

        if (this.areCollisionsEnabled()) {
            this.syncInitialHeightOffset();
            this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        }

        this.positionPrimed = true;
    },
    refreshNavMeshRoots: function () {
        if (!this.navMeshDirty) {
            return;
        }

        this.navMeshRoots = [];
        this.navMeshCollisionTargets = [];
        this.navMeshBounds.makeEmpty();

        const navMeshEntities = this.sceneEl.querySelectorAll(this.navMeshEntitySelector);
        for (let i = 0; i < navMeshEntities.length; i++) {
            const meshRoot = navMeshEntities[i].getObject3D('mesh');
            if (meshRoot) {
                this.applyWalkBehaviorToNavMeshRoot(meshRoot, this.normalizeWalkBehavior(navMeshEntities[i].getAttribute('data-vrodos-walk-behavior')));
                this.navMeshRoots.push(meshRoot);
                meshRoot.traverse((node) => {
                    if (node && node.isMesh) {
                        this.navMeshCollisionTargets.push(node);
                    }
                });
                this.navMeshRootBounds.setFromObject(meshRoot);
                if (!this.navMeshRootBounds.isEmpty()) {
                    this.navMeshBounds.union(this.navMeshRootBounds);
                }
            }
        }

        this.navMeshDirty = false;
    },
    installCollisionBvhSupport: function () {
        if (this.bvhInstalled) {
            return Boolean(window.VRODOS_COLLISION_BVH);
        }

        const bvh = window.VRODOS_COLLISION_BVH;
        if (!bvh || typeof THREE === 'undefined' || !THREE.BufferGeometry || !THREE.Mesh) {
            return false;
        }

        if (typeof bvh.computeBoundsTree === 'function') {
            THREE.BufferGeometry.prototype.computeBoundsTree = bvh.computeBoundsTree;
        }
        if (typeof bvh.disposeBoundsTree === 'function') {
            THREE.BufferGeometry.prototype.disposeBoundsTree = bvh.disposeBoundsTree;
        }
        if (typeof bvh.acceleratedRaycast === 'function') {
            THREE.Mesh.prototype.raycast = bvh.acceleratedRaycast;
        }

        this.bvhInstalled = true;
        return true;
    },
    prepareCollisionMesh: function (node, role) {
        if (!node || !node.isMesh || !node.geometry) {
            return false;
        }

        node.userData = node.userData || {};
        node.userData.vrodosCollisionRole = role || 'solid';
        node.updateMatrixWorld(true);

        if (
            this.installCollisionBvhSupport() &&
            typeof node.geometry.computeBoundsTree === 'function' &&
            !node.geometry.boundsTree &&
            !this.bvhTargets.has(node.uuid)
        ) {
            try {
                node.geometry.computeBoundsTree();
            } catch (err) {
                if (!this.loggedBvhBuildWarning) {
                    console.warn('VRodos: failed to build one or more static collision BVHs; falling back to standard raycasts.', err);
                    this.loggedBvhBuildWarning = true;
                }
            }
            this.bvhTargets.add(node.uuid);
        }

        return true;
    },
    getColliderRootObject: function (entity) {
        if (!entity) {
            return null;
        }

        return entity.getObject3D('mesh') || entity.object3D || null;
    },
    refreshCollisionWorld: function () {
        if (!this.collisionWorldDirty) {
            return;
        }

        this.colliderRoots = [];
        this.blockerCollisionTargets = [];
        this.collisionWorldBounds.makeEmpty();

        const colliderEntities = this.sceneEl.querySelectorAll(this.colliderEntitySelector);
        for (let i = 0; i < colliderEntities.length; i++) {
            const entity = colliderEntities[i];
            const root = this.getColliderRootObject(entity);
            if (!root) {
                continue;
            }

            const role = String(entity.getAttribute('data-vrodos-collision-role') || (entity.classList.contains('vrodos-navmesh') ? 'navmesh' : 'solid')).toLowerCase();
            this.colliderRoots.push(root);
            root.traverse((node) => {
                if (this.prepareCollisionMesh(node, role)) {
                    this.blockerCollisionTargets.push(node);
                }
            });

            this.collisionRootBounds.setFromObject(root);
            if (!this.collisionRootBounds.isEmpty()) {
                this.collisionWorldBounds.union(this.collisionRootBounds);
            }
        }

        this.collisionWorldDirty = false;
    },
    normalizeWalkBehavior: function (value) {
        return String(value || '').toLowerCase() === 'auto' ? 'auto' : 'precise';
    },
    applyWalkBehaviorToNavMeshRoot: function (meshRoot, behavior) {
        const normalizedBehavior = this.normalizeWalkBehavior(behavior);
        meshRoot.traverse((node) => {
            if (!node.isMesh) {
                return;
            }

            node.userData = node.userData || {};
            node.userData.vrodosWalkBehavior = normalizedBehavior;
        });
    },
    getWalkBehaviorFromIntersection: function (hit) {
        let object3D = hit && hit.object ? hit.object : null;
        while (object3D) {
            if (object3D.userData && object3D.userData.vrodosWalkBehavior) {
                return this.normalizeWalkBehavior(object3D.userData.vrodosWalkBehavior);
            }
            object3D = object3D.parent || null;
        }

        return 'precise';
    },
    getAutoStepAssistHeight: function () {
        return Math.max(this.data.maxStepHeight, this.autoGroundStepAssistMaxHeight);
    },
    getMaxStepHeightForGround: function (groundHit) {
        return this.isAutoGroundHit(groundHit) ? this.getAutoStepAssistHeight() : this.data.maxStepHeight;
    },
    shouldReuseAutoGroundSample: function (position, referenceGroundY) {
        if (!this.hasLastAutoGroundSample) {
            return false;
        }

        if (performance.now() - this.lastAutoGroundSampleAt > this.autoGroundSampleMinIntervalMs) {
            return false;
        }

        if (this.horizontalDistanceSquared(this.autoGroundSamplePosition, position) >
            (this.autoGroundSampleMinDistance * this.autoGroundSampleMinDistance)) {
            return false;
        }

        if (typeof referenceGroundY === 'number' && isFinite(referenceGroundY)) {
            if (Math.abs(this.autoGroundSampleHit.point.y - referenceGroundY) >
                (this.data.maxStepHeight + this.groundProbeStepTolerance)) {
                return false;
            }
        }

        return this.autoGroundSampleHit.behavior === 'auto';
    },
    reuseAutoGroundSample: function (position, outputGround) {
        outputGround = outputGround || this.createGroundHit();
        this.copyGroundHit(this.autoGroundSampleHit, outputGround);
        outputGround.point.x = position.x;
        outputGround.point.z = position.z;
        return outputGround;
    },
    storeAutoGroundSample: function (position, groundHit) {
        if (!groundHit || groundHit.behavior !== 'auto') {
            return;
        }

        this.autoGroundSamplePosition.copy(position);
        this.copyGroundHit(groundHit, this.autoGroundSampleHit);
        this.lastAutoGroundSampleAt = performance.now();
        this.hasLastAutoGroundSample = true;
    },
    isAutoGroundHit: function (groundHit) {
        return Boolean(groundHit && groundHit.behavior === 'auto');
    },
    findAutoSupportGroundAt: function (position, referenceGroundY, outputGround, options) {
        const hasReferenceGround = typeof referenceGroundY === 'number' && isFinite(referenceGroundY);
        if (!hasReferenceGround) {
            return null;
        }

        options = options || {};
        const offsets = options.offsets || this.autoGroundBridgeOffsets;
        const minSupport = typeof options.minSupport === 'number' ? options.minSupport : this.autoGroundBridgeMinSupport;
        const limits = options.limits || null;
        const maxStepHeight = limits && typeof limits.maxStepHeight === 'number'
            ? limits.maxStepHeight
            : this.data.maxStepHeight;
        const maxDropHeight = limits && typeof limits.maxDropHeight === 'number'
            ? limits.maxDropHeight
            : this.data.maxDropHeight;
        const heightTolerance = typeof options.heightTolerance === 'number'
            ? options.heightTolerance
            : this.autoGroundSupportHeightTolerance;
        let supportCount = 0;
        let bestScore = Infinity;
        let foundBest = false;

        for (let i = 0; i < offsets.length; i++) {
            const offset = offsets[i];
            this.autoSupportProbePosition.set(
                position.x + offset.x,
                position.y,
                position.z + offset.y
            );

            const candidateGround = this.sampleGroundAtSingle(
                this.autoSupportProbePosition,
                referenceGroundY,
                this.autoSupportProbeGroundHit,
                limits
            );
            if (!this.isAutoGroundHit(candidateGround)) {
                continue;
            }

            const heightDelta = candidateGround.point.y - referenceGroundY;
            if (heightDelta > maxStepHeight + this.groundProbeStepTolerance ||
                heightDelta < -(maxDropHeight + this.groundProbeStepTolerance)) {
                continue;
            }

            supportCount++;
            const score = Math.abs(heightDelta) +
                (offset.lengthSq() * 0.08) +
                (candidateGround.slope * 0.002);
            if (score < bestScore) {
                bestScore = score;
                foundBest = true;
                this.copyGroundHit(candidateGround, this.autoSupportBestGroundHit);
                if (Math.abs(heightDelta) <= heightTolerance) {
                    this.autoSupportBestGroundHit.point.y = referenceGroundY;
                }
                this.autoSupportBestGroundHit.point.x = position.x;
                this.autoSupportBestGroundHit.point.z = position.z;
            }
        }

        if (!foundBest || supportCount < minSupport) {
            return null;
        }

        outputGround = outputGround || this.autoSupportResolvedGroundHit;
        return this.copyGroundHit(this.autoSupportBestGroundHit, outputGround);
    },
    shouldPreferAutoSupportGround: function (directGround, referenceGroundY) {
        return this.isAutoGroundHit(directGround) &&
            typeof referenceGroundY === 'number' &&
            isFinite(referenceGroundY) &&
            referenceGroundY - directGround.point.y > this.autoGroundPitDropThreshold;
    },
    hasAutoGroundSupportAt: function (position, referenceGroundY, minSupport, limits) {
        if (typeof referenceGroundY !== 'number' || !isFinite(referenceGroundY)) {
            return false;
        }

        const requiredSupport = typeof minSupport === 'number' ? minSupport : this.autoGroundBridgeMinSupport;
        let supportCount = 0;

        for (let i = 0; i < this.autoRecoveryOffsets.length; i++) {
            const offset = this.autoRecoveryOffsets[i];
            this.autoSupportProbePosition.set(
                position.x + offset.x,
                position.y,
                position.z + offset.y
            );

            const supportGround = this.sampleGroundAtSingle(
                this.autoSupportProbePosition,
                referenceGroundY,
                this.autoRecoveryProbeGroundHit,
                limits
            );
            if (!this.isAutoGroundHit(supportGround)) {
                continue;
            }

            if (Math.abs(supportGround.point.y - referenceGroundY) >
                (this.getAutoStepAssistHeight() + this.autoGroundSupportHeightTolerance)) {
                continue;
            }

            supportCount++;
            if (supportCount >= requiredSupport) {
                return true;
            }
        }

        return false;
    },
    canUseAutoGroundMissGrace: function (groundHit, fromPosition, toPosition, missCount) {
        if (!groundHit || groundHit.behavior !== 'auto') {
            return false;
        }

        if (missCount >= this.autoGroundMissAllowance) {
            return false;
        }

        return this.horizontalDistanceSquared(fromPosition, toPosition) <=
            (this.autoGroundMissDistance * this.autoGroundMissDistance);
    },
    getRecoverySearchRadius: function (position) {
        this.refreshNavMeshRoots();
        if (this.navMeshRoots.length === 0 || this.navMeshBounds.isEmpty()) {
            return 12;
        }

        this.navMeshBounds.getSize(this.boundsSize);
        const boundsRadius = VRODOSMaster.clamp(this.boundsSize.length() * 0.35, 12, 120);
        if (this.isImmersiveXrPresenting()) {
            return boundsRadius;
        }

        this.boundsClosestPoint.copy(position);
        this.navMeshBounds.clampPoint(position, this.boundsClosestPoint);
        const horizontalDistanceToBounds = Math.sqrt(this.horizontalDistanceSquared(position, this.boundsClosestPoint));

        return Math.max(boundsRadius, horizontalDistanceToBounds + 6);
    },
    areCollisionsEnabled: function (settings) {
        settings = settings || this.getSceneSettings();
        if (!settings || settings.collisionMode === 'off' || this.getNavigationMode(settings) !== 'walkable') {
            return false;
        }

        this.refreshNavMeshRoots();
        this.refreshCollisionWorld();
        return this.navMeshCollisionTargets.length > 0;
    },
    getMovementDeltaFromInput: function (inputX, inputY, distance) {
        const referenceEl = this.cameraEl || this.cameraRig;
        if (!referenceEl || !referenceEl.object3D) {
            return null;
        }

        referenceEl.object3D.getWorldDirection(this.forwardVector);
        this.forwardVector.y = 0;
        if (this.forwardVector.lengthSq() < 0.000001) {
            this.forwardVector.set(0, 0, -1);
        } else {
            this.forwardVector.normalize();
        }

        this.rightVector.crossVectors(this.forwardVector, this.upVector).normalize().negate();

        const movementDelta = {
            x: (-this.forwardVector.x * inputY + this.rightVector.x * inputX) * distance,
            z: (-this.forwardVector.z * inputY + this.rightVector.z * inputX) * distance
        };

        if (this.isImmersiveXrPresenting() && Math.abs(this.immersiveRenderYaw) > 0.000001) {
            this.immersiveRenderedDirection.set(movementDelta.x, 0, movementDelta.z);
            this.renderedToAuthoredDirection(this.immersiveRenderedDirection, this.immersiveAuthoredDirection);
            const authoredDistance = Math.sqrt((movementDelta.x * movementDelta.x) + (movementDelta.z * movementDelta.z));
            movementDelta.x = this.immersiveAuthoredDirection.x * authoredDistance;
            movementDelta.z = this.immersiveAuthoredDirection.z * authoredDistance;
        }

        return movementDelta;
    },
    getLookControlsComponent: function () {
        if (this.cameraEl && this.cameraEl.components && this.cameraEl.components['look-controls']) {
            return this.cameraEl.components['look-controls'];
        }

        if (this.cameraRig && this.cameraRig.components && this.cameraRig.components['look-controls']) {
            return this.cameraRig.components['look-controls'];
        }

        return null;
    },
    shouldSkipLookControlsOrientationRefresh: function (lookControls) {
        const lookScene = lookControls && lookControls.el ? lookControls.el.sceneEl : null;
        return Boolean(
            lookScene &&
            (lookScene.is('vr-mode') || lookScene.is('ar-mode')) &&
            typeof lookScene.checkHeadsetConnected === 'function' &&
            lookScene.checkHeadsetConnected()
        );
    },
    refreshLookControlsOrientation: function () {
        const lookControls = this.getLookControlsComponent();
        if (
            lookControls &&
            typeof lookControls.updateOrientation === 'function' &&
            !this.shouldSkipLookControlsOrientationRefresh(lookControls)
        ) {
            lookControls.updateOrientation();
        }

        return lookControls;
    },
    getFlyCameraElement: function () {
        if (this.cameraEl && this.cameraEl.components && this.cameraEl.components.camera) {
            return this.cameraEl;
        }

        if (this.sceneEl && this.sceneEl.camera && this.sceneEl.camera.el) {
            this.cameraEl = this.sceneEl.camera.el;
            return this.sceneEl.camera.el;
        }

        const cameraEl = document.querySelector('#cameraA') || document.querySelector('[camera]') || document.querySelector('a-camera');
        if (cameraEl) {
            this.cameraEl = cameraEl;
            return cameraEl;
        }

        return this.cameraEl || null;
    },
    getFlyCameraObject: function () {
        const cameraEl = this.getFlyCameraElement();
        if (cameraEl && cameraEl.components && cameraEl.components.camera && cameraEl.components.camera.camera) {
            return cameraEl.components.camera.camera;
        }

        if (cameraEl && cameraEl.object3DMap && cameraEl.object3DMap.camera) {
            return cameraEl.object3DMap.camera;
        }

        if (this.sceneEl && this.sceneEl.camera) {
            return this.sceneEl.camera;
        }

        return null;
    },
    updateFlyCameraWorldMatrix: function (cameraEl, cameraObject) {
        if (cameraObject && typeof cameraObject.updateProjectionMatrix === 'function') {
            cameraObject.updateProjectionMatrix();
        }

        if (this.sceneEl && this.sceneEl.object3D && typeof this.sceneEl.object3D.updateMatrixWorld === 'function') {
            this.sceneEl.object3D.matrixWorldNeedsUpdate = true;
            this.sceneEl.object3D.updateMatrixWorld(true);
        }

        if (cameraEl && cameraEl.object3D && typeof cameraEl.object3D.updateMatrixWorld === 'function') {
            cameraEl.object3D.matrixWorldNeedsUpdate = true;
            cameraEl.object3D.updateMatrixWorld(true);
        }

        if (cameraObject && typeof cameraObject.updateMatrixWorld === 'function') {
            cameraObject.matrixWorldNeedsUpdate = true;
            cameraObject.updateMatrixWorld(true);
        }
    },
    setFlyForwardVectorFromLookControls: function () {
        const lookControls = this.refreshLookControlsOrientation();
        if (!lookControls || !lookControls.el || !lookControls.el.object3D) {
            return false;
        }

        if (this.shouldSkipLookControlsOrientationRefresh(lookControls)) {
            return false;
        }

        if (!lookControls.pitchObject || !lookControls.yawObject) {
            return false;
        }

        const pitch = lookControls.pitchObject.rotation ? lookControls.pitchObject.rotation.x : null;
        const yaw = lookControls.yawObject.rotation ? lookControls.yawObject.rotation.y : null;
        if (typeof pitch !== 'number' || typeof yaw !== 'number') {
            return false;
        }

        const cosPitch = Math.cos(pitch);
        this.forwardVector.set(
            -Math.sin(yaw) * cosPitch,
            Math.sin(pitch),
            -Math.cos(yaw) * cosPitch
        );

        if (this.forwardVector.lengthSq() < 0.000001) {
            return false;
        }

        this.forwardVector.normalize();
        return true;
    },
    setFlyForwardVectorFromScreenCenter: function () {
        this.refreshLookControlsOrientation();

        const cameraEl = this.getFlyCameraElement();
        const camera = this.getFlyCameraObject();
        if (!camera || typeof this.centerRaycaster.setFromCamera !== 'function') {
            return false;
        }

        this.updateFlyCameraWorldMatrix(cameraEl, camera);

        if (typeof camera.getWorldPosition === 'function') {
            camera.getWorldPosition(this.cameraWorldPosition);
            this.screenCenterWorldPoint.set(0, 0, 0.5).unproject(camera);
            this.forwardVector.copy(this.screenCenterWorldPoint).sub(this.cameraWorldPosition);
        }

        if (this.forwardVector.lengthSq() < 0.000001) {
            this.centerRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
            this.forwardVector.copy(this.centerRaycaster.ray.direction);
        }

        if (this.forwardVector.lengthSq() < 0.000001) {
            return false;
        }

        this.forwardVector.normalize();
        return true;
    },
    getFlyDirectionObject: function () {
        const cameraObject = this.getFlyCameraObject();
        if (cameraObject && typeof cameraObject.getWorldDirection === 'function') {
            return cameraObject;
        }

        if (this.cameraEl && this.cameraEl.object3D) {
            return this.cameraEl.object3D;
        }

        return this.cameraRig ? this.cameraRig.object3D : null;
    },
    getFlyMovementDeltaFromInput: function (inputX, inputY, inputVertical, distance) {
        if (!this.setFlyForwardVectorFromLookControls() && !this.setFlyForwardVectorFromScreenCenter()) {
            const directionObject = this.getFlyDirectionObject();
            if (!directionObject || typeof directionObject.getWorldDirection !== 'function') {
                return null;
            }

            if (typeof directionObject.updateMatrixWorld === 'function') {
                directionObject.updateMatrixWorld(true);
            }
            directionObject.getWorldDirection(this.forwardVector);
            if (this.forwardVector.lengthSq() < 0.000001) {
                this.forwardVector.set(0, 0, -1);
            } else {
                this.forwardVector.normalize();
            }
        }

        this.rightVector.crossVectors(this.forwardVector, this.upVector);
        if (this.rightVector.lengthSq() < 0.000001) {
            this.rightVector.set(1, 0, 0);
        } else {
            this.rightVector.normalize();
        }

        return {
            x: (-this.forwardVector.x * inputY + this.rightVector.x * inputX) * distance,
            y: (
                (-this.forwardVector.y * inputY * this.data.flyPitchVerticalMultiplier) +
                (inputVertical * this.data.flyVerticalSpeedMultiplier)
            ) * distance,
            z: (-this.forwardVector.z * inputY + this.rightVector.z * inputX) * distance
        };
    },
    setWASDControlsEnabled: function (targetEl, enabled, hardStop) {
        if (!targetEl || !targetEl.components || !targetEl.components['wasd-controls']) {
            return false;
        }

        const wasdControls = targetEl.components['wasd-controls'];
        const wasAlreadyEnabled = wasdControls.data ? wasdControls.data.enabled === enabled : false;
        if (!wasAlreadyEnabled) {
            targetEl.setAttribute('wasd-controls', `fly: false; acceleration: 20; enabled: ${enabled ? 'true' : 'false'}`);
        }

        if (wasdControls.data) {
            wasdControls.data.enabled = enabled;
        }

        if (!enabled && hardStop) {
            if (wasdControls.keys) {
                wasdControls.keys = {};
            }
            if (wasdControls.velocity && typeof wasdControls.velocity.set === 'function') {
                wasdControls.velocity.set(0, 0, 0);
            }
            if (typeof wasdControls.pause === 'function') {
                wasdControls.pause();
            }
        } else if (typeof wasdControls.play === 'function') {
            wasdControls.play();
        }

        return true;
    },
    updateWASDControlsState: function (navigationMode, collisionsEnabled) {
        const flyMode = navigationMode === 'fly';
        const suppressRigWASD = collisionsEnabled || flyMode;
        const rigUpdated = this.setWASDControlsEnabled(this.el, !suppressRigWASD, false);
        const cameraUpdated = flyMode
            ? this.setWASDControlsEnabled(this.getFlyCameraElement ? this.getFlyCameraElement() : this.cameraEl, false, true)
            : false;

        if (rigUpdated || cameraUpdated) {
            this.wasdControlsSuppressed = suppressRigWASD;
        } else {
            this.wasdControlsSuppressed = null;
        }
    },
    isImmersiveXrPresenting: function () {
        const xr = this.sceneEl && this.sceneEl.renderer ? this.sceneEl.renderer.xr : null;
        if (xr && xr.isPresenting) {
            return true;
        }

        return Boolean(this.sceneEl && this.sceneEl.is && (this.sceneEl.is('vr-mode') || this.sceneEl.is('ar-mode')));
    },
    applyRightThumbstickTurn: function (timeDelta) {
        const turnInput = Math.abs(this.rightThumbInput.x) > this.data.thumbstickDeadzone ? this.rightThumbInput.x : 0;
        if (!turnInput || !this.el || !this.el.object3D) {
            return false;
        }

        const deltaSeconds = Math.min(timeDelta || 0, 50) / 1000;
        const yawDelta = (this.data.turnSpeed * turnInput * Math.PI / 180) * deltaSeconds;
        if (this.isImmersiveXrPresenting()) {
            if (!this.immersiveWasPresenting) {
                this.resetImmersiveWorldLocomotion();
            }

            this.immersiveRenderYaw += yawDelta;
            this.clearImmersiveGroundCaches();
            this.applyImmersiveRenderTransform();
            this.lastResolvedPosition.copy(this.immersiveVirtualNavPosition);
            return true;
        }

        const lookControls = this.getLookControlsComponent();
        if (
            lookControls &&
            lookControls.el === this.el &&
            lookControls.yawObject &&
            lookControls.yawObject.rotation
        ) {
            lookControls.yawObject.rotation.y -= yawDelta;
        }

        this.el.object3D.rotation.y -= yawDelta;

        if (typeof this.el.object3D.updateMatrixWorld === 'function') {
            this.el.object3D.updateMatrixWorld(true);
        } else {
            this.el.object3D.matrixWorldNeedsUpdate = true;
        }

        return true;
    },
    sampleGroundAtSingle: function (position, referenceGroundY, outputGround, limits) {
        const navPerfFrame = this.navPerfDebug ? this.navPerfDebug.frame : null;
        const sampleStart = navPerfFrame ? performance.now() : 0;
        const finalizeSample = function (result) {
            if (navPerfFrame) {
                navPerfFrame.sampleMs += performance.now() - sampleStart;
            }
            return result;
        };

        this.refreshNavMeshRoots();
        if (this.navMeshCollisionTargets.length === 0) {
            return finalizeSample(null);
        }

        const maxStepHeight = limits && typeof limits.maxStepHeight === 'number'
            ? Math.max(0, limits.maxStepHeight)
            : this.data.maxStepHeight;
        const maxDropHeight = limits && typeof limits.maxDropHeight === 'number'
            ? Math.max(0, limits.maxDropHeight)
            : this.data.maxDropHeight;
        const originY = typeof referenceGroundY === 'number'
            ? referenceGroundY + maxStepHeight + 2
            : position.y + maxStepHeight + 2;

        this.raycastOrigin.set(position.x, originY, position.z);
        const immersivePresenting = this.isImmersiveXrPresenting();
        const rayOrigin = immersivePresenting
            ? this.authoredToRenderedPosition(this.raycastOrigin, this.immersiveRenderedRayOrigin)
            : this.raycastOrigin;
        const rayDirection = immersivePresenting
            ? this.authoredToRenderedDirection(this.raycastDirection, this.immersiveRenderedRayDirection)
            : this.raycastDirection;
        this.raycaster.set(rayOrigin, rayDirection);
        this.raycaster.far = maxStepHeight + maxDropHeight + 20;

        const raycastStart = navPerfFrame ? performance.now() : 0;
        const intersections = this.raycaster.intersectObjects(this.navMeshCollisionTargets, false);
        if (navPerfFrame) {
            navPerfFrame.raycastMs += performance.now() - raycastStart;
            navPerfFrame.raycasts += 1;
            navPerfFrame.intersections += intersections.length;
        }
        const hasReferenceGround = typeof referenceGroundY === 'number' && isFinite(referenceGroundY);
        const minAllowedY = hasReferenceGround ? referenceGroundY - (maxDropHeight + this.groundProbeStepTolerance) : -Infinity;
        const maxAllowedY = hasReferenceGround ? referenceGroundY + maxStepHeight + this.groundProbeStepTolerance : Infinity;
        let bestAutoHit = null;
        let bestAutoHeightDelta = Infinity;
        let bestScore = Infinity;

        for (let i = 0; i < intersections.length; i++) {
            const hit = intersections[i];
            if (!hit.face) {
                continue;
            }

            this.tempWorldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
            if (immersivePresenting) {
                this.renderedToAuthoredDirection(this.tempWorldNormal, this.tempWorldNormal);
            }
            const authoredHitPoint = immersivePresenting
                ? this.renderedToAuthoredPosition(hit.point, this.immersiveAuthoredHitPoint)
                : hit.point;
            const authoredHitY = authoredHitPoint.y;
            const slope = THREE.MathUtils.radToDeg(Math.acos(VRODOSMaster.clamp(this.tempWorldNormal.dot(this.upVector), -1, 1)));
            const behavior = this.getWalkBehaviorFromIntersection(hit);

            if (slope > this.data.maxSlope + 0.5) {
                continue;
            }

            if (behavior === 'precise') {
                if (hasReferenceGround && (authoredHitY < minAllowedY || authoredHitY > maxAllowedY)) {
                    continue;
                }

                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, authoredHitY, position.z);
                outputGround.rawPoint.copy(authoredHitPoint);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
                outputGround.behavior = behavior;
                return finalizeSample(outputGround);
            }

            const autoMaxAllowedY = hasReferenceGround
                ? referenceGroundY + Math.max(maxStepHeight, this.getAutoStepAssistHeight()) + this.groundProbeStepTolerance
                : Infinity;
            if (!hasReferenceGround) {
                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, authoredHitY, position.z);
                outputGround.rawPoint.copy(authoredHitPoint);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
                outputGround.behavior = behavior;
                return finalizeSample(outputGround);
            }

            if (authoredHitY < minAllowedY || authoredHitY > autoMaxAllowedY) {
                continue;
            }

            const autoHeightDelta = Math.abs(authoredHitY - referenceGroundY);
            const autoScore = autoHeightDelta + (i * 0.0001);
            let shouldReplaceAutoHit = autoScore < bestScore;

            if (!shouldReplaceAutoHit && bestAutoHit &&
                Math.abs(autoHeightDelta - bestAutoHeightDelta) <= this.autoGroundOverlayTolerance &&
                authoredHitY < outputGround.point.y &&
                (outputGround.point.y - authoredHitY) <= this.autoGroundOverlayTolerance) {
                shouldReplaceAutoHit = true;
            }

            if (shouldReplaceAutoHit) {
                bestScore = autoScore;
                bestAutoHeightDelta = autoHeightDelta;
                bestAutoHit = hit;
                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, authoredHitY, position.z);
                outputGround.rawPoint.copy(authoredHitPoint);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
                outputGround.behavior = behavior;
            }
        }

        return finalizeSample(bestAutoHit ? outputGround : null);
    },
    sampleGroundAt: function (position, referenceGroundY, outputGround) {
        if (this.shouldReuseAutoGroundSample(position, referenceGroundY)) {
            return this.reuseAutoGroundSample(position, outputGround);
        }

        const directGround = this.sampleGroundAtSingle(position, referenceGroundY, outputGround);
        if (directGround) {
            if (this.shouldPreferAutoSupportGround(directGround, referenceGroundY)) {
                const supportedGround = this.findAutoSupportGroundAt(
                    position,
                    referenceGroundY,
                    this.autoSupportResolvedGroundHit
                );
                if (supportedGround && supportedGround.point.y > directGround.point.y + this.autoGroundPitDropThreshold) {
                    outputGround = outputGround || this.createGroundHit();
                    this.copyGroundHit(supportedGround, outputGround);
                    this.storeAutoGroundSample(position, outputGround);
                    return outputGround;
                }
            }

            this.storeAutoGroundSample(position, directGround);
            return directGround;
        }

        const hasReferenceGround = typeof referenceGroundY === 'number' && isFinite(referenceGroundY);
        const bridgedAutoGround = this.findAutoSupportGroundAt(
            position,
            referenceGroundY,
            this.autoSupportResolvedGroundHit
        );
        if (bridgedAutoGround) {
            outputGround = outputGround || this.createGroundHit();
            this.copyGroundHit(bridgedAutoGround, outputGround);
            this.storeAutoGroundSample(position, outputGround);
            return outputGround;
        }

        let foundBestCandidate = false;
        let bestScore = Infinity;

        for (let i = 1; i < this.groundProbeOffsets.length; i++) {
            const probeOffset = this.groundProbeOffsets[i];
            this.groundProbePosition.set(
                position.x + probeOffset.x,
                position.y,
                position.z + probeOffset.y
            );

            const candidateGround = this.sampleGroundAtSingle(
                this.groundProbePosition,
                referenceGroundY,
                this.offsetGroundHit
            );

            if (!candidateGround) {
                continue;
            }

            let score = this.horizontalDistanceSquared(candidateGround.rawPoint, position);
            if (hasReferenceGround) {
                score += Math.abs(candidateGround.point.y - referenceGroundY) * 1.5;
            }

            if (score < bestScore) {
                bestScore = score;
                foundBestCandidate = true;
                this.copyGroundHit(candidateGround, this.candidateGroundHit);
            }
        }

        if (!foundBestCandidate) {
            return null;
        }

        outputGround = outputGround || this.createGroundHit();
        this.copyGroundHit(this.candidateGroundHit, outputGround);
        outputGround.point.x = position.x;
        outputGround.point.z = position.z;
        this.storeAutoGroundSample(position, outputGround);
        return outputGround;
    },
    canAttemptRecovery: function () {
        const now = performance.now();
        if (now - this.lastRecoveryAttemptAt < 250) {
            return false;
        }

        this.lastRecoveryAttemptAt = now;
        return true;
    },
    findNearestGroundAt: function (position, searchRadius, outputGround) {
        const radius = typeof searchRadius === 'number' ? searchRadius : 6;
        const bestGround = outputGround || this.bestGroundHit;
        let foundBestGround = Boolean(this.sampleGroundAt(position, undefined, bestGround));
        let bestDistanceSq = foundBestGround ? this.horizontalDistanceSquared(bestGround.rawPoint, position) : Infinity;

        if (foundBestGround && bestDistanceSq < 0.0001) {
            return bestGround;
        }

        this.searchRadii[this.searchRadii.length - 1] = radius;

        for (let r = 0; r < this.searchRadii.length; r++) {
            const offsetRadius = this.searchRadii[r];
            if (offsetRadius > radius) {
                continue;
            }

            for (let a = 0; a < this.searchAngles.length; a++) {
                const radians = THREE.MathUtils.degToRad(this.searchAngles[a]);
                this.targetWorldPosition.set(
                    position.x + Math.cos(radians) * offsetRadius,
                    position.y,
                    position.z + Math.sin(radians) * offsetRadius
                );

                const candidateGround = this.sampleGroundAt(this.targetWorldPosition, undefined, this.candidateGroundHit);
                if (!candidateGround) {
                    continue;
                }

                const distanceSq = this.horizontalDistanceSquared(candidateGround.rawPoint, position);
                if (distanceSq < bestDistanceSq) {
                    this.copyGroundHit(candidateGround, bestGround);
                    foundBestGround = true;
                    bestDistanceSq = distanceSq;
                }
            }
        }

        return foundBestGround ? bestGround : null;
    },
    recordStableAutoGround: function (position, groundHit) {
        if (!this.isAutoGroundHit(groundHit) || !position) {
            return;
        }

        const slot = this.autoStableGroundHistory[this.autoStableGroundHistoryIndex];
        slot.valid = true;
        slot.time = performance.now();
        slot.position.copy(position);
        this.copyGroundHit(groundHit, slot.ground);
        this.autoStableGroundHistoryIndex = (this.autoStableGroundHistoryIndex + 1) % this.autoStableGroundHistory.length;
    },
    hasRecentStableAutoGround: function (currentPosition) {
        const now = performance.now();
        const maxDistanceSq = this.autoStableGroundMaxDistance * this.autoStableGroundMaxDistance;
        for (let i = 0; i < this.autoStableGroundHistory.length; i++) {
            const slot = this.autoStableGroundHistory[i];
            if (!slot.valid || now - slot.time > this.autoStableGroundMaxAgeMs) {
                continue;
            }

            if (this.horizontalDistanceSquared(slot.position, currentPosition) <= maxDistanceSq) {
                return true;
            }
        }

        return false;
    },
    getRecoveryGroundY: function (position, currentGround) {
        if (currentGround && currentGround.point && typeof currentGround.point.y === 'number') {
            return currentGround.point.y;
        }

        if (this.hasLastGroundHit && this.lastGroundHit && this.lastGroundHit.point) {
            return this.lastGroundHit.point.y;
        }

        if (this.heightOffset !== null) {
            return position.y - this.heightOffset;
        }

        return position.y - 1.6;
    },
    setAutoRecoveryStatus: function (status) {
        this.lastAutoRecoveryStatus = status || 'unknown';
        this.lastAutoRecoveryAt = performance.now();
    },
    isAutoRecoveryCandidateValid: function (currentPosition, currentGround, candidatePosition, candidateGround, minSupport) {
        if (!this.isAutoGroundHit(candidateGround) || !candidatePosition) {
            return false;
        }

        if (candidateGround.slope > this.data.maxSlope + 0.5) {
            return false;
        }

        const currentGroundY = this.getRecoveryGroundY(currentPosition, currentGround);
        const lift = candidateGround.point.y - currentGroundY;
        if (lift > this.autoRecoveryMaxLift + this.groundProbeStepTolerance ||
            lift < -(this.data.maxDropHeight + this.groundProbeStepTolerance)) {
            return false;
        }

        if (!this.hasAutoGroundSupportAt(candidatePosition, candidateGround.point.y, minSupport || this.autoGroundBridgeMinSupport)) {
            return false;
        }

        const targetY = candidateGround.point.y + (this.heightOffset !== null ? this.heightOffset : 1.6);
        this.autoRecoveryTargetPosition.set(candidatePosition.x, targetY, candidatePosition.z);
        return !this.isHorizontalPathBlocked(
            currentPosition,
            this.autoRecoveryTargetPosition,
            currentGround,
            candidateGround,
            {
                ignoreNavmeshBlockers: true,
                maxIgnoredNavmeshBlockerHeight: this.autoRecoveryNavmeshBypassHeight
            }
        );
    },
    findRecentStableAutoRecoveryGround: function (currentPosition, currentGround) {
        const now = performance.now();
        const maxDistanceSq = this.autoStableGroundMaxDistance * this.autoStableGroundMaxDistance;
        let foundBest = false;
        let bestScore = Infinity;

        for (let i = 0; i < this.autoStableGroundHistory.length; i++) {
            const slot = this.autoStableGroundHistory[i];
            if (!slot.valid || now - slot.time > this.autoStableGroundMaxAgeMs) {
                continue;
            }

            const distanceSq = this.horizontalDistanceSquared(slot.position, currentPosition);
            if (distanceSq > maxDistanceSq) {
                continue;
            }

            if (!this.isAutoRecoveryCandidateValid(currentPosition, currentGround, slot.position, slot.ground, 1)) {
                continue;
            }

            const ageScore = (now - slot.time) / this.autoStableGroundMaxAgeMs;
            const score = distanceSq + ageScore;
            if (score < bestScore) {
                bestScore = score;
                foundBest = true;
                this.autoRecoveryCandidatePosition.copy(slot.position);
                this.copyGroundHit(slot.ground, this.autoRecoveryBestGroundHit);
            }
        }

        return foundBest ? this.autoRecoveryBestGroundHit : null;
    },
    findNearbyAutoRecoveryGround: function (currentPosition, currentGround) {
        const currentGroundY = this.getRecoveryGroundY(currentPosition, currentGround);
        const recoveryLimits = {
            maxStepHeight: this.autoRecoveryMaxLift,
            maxDropHeight: this.data.maxDropHeight
        };
        let foundBest = false;
        let bestScore = Infinity;

        for (let r = 0; r < this.autoRecoverySearchRadii.length; r++) {
            const radius = this.autoRecoverySearchRadii[r];
            foundBest = false;
            bestScore = Infinity;

            for (let a = 0; a < this.autoRecoverySearchAngles.length; a++) {
                const radians = THREE.MathUtils.degToRad(this.autoRecoverySearchAngles[a]);
                this.autoRecoveryProbePosition.set(
                    currentPosition.x + Math.cos(radians) * radius,
                    currentPosition.y,
                    currentPosition.z + Math.sin(radians) * radius
                );

                const candidateGround = this.sampleGroundAtSingle(
                    this.autoRecoveryProbePosition,
                    currentGroundY,
                    this.autoRecoveryProbeGroundHit,
                    recoveryLimits
                );
                if (!this.isAutoGroundHit(candidateGround)) {
                    continue;
                }

                if (!this.isAutoRecoveryCandidateValid(
                    currentPosition,
                    currentGround,
                    this.autoRecoveryProbePosition,
                    candidateGround,
                    this.autoGroundBridgeMinSupport
                )) {
                    continue;
                }

                const lift = candidateGround.point.y - currentGroundY;
                const score = (radius * radius) +
                    (Math.max(0, -lift) * 1.5) +
                    (Math.max(0, lift) * 0.25) +
                    (candidateGround.slope * 0.002);
                if (score < bestScore) {
                    bestScore = score;
                    foundBest = true;
                    this.autoRecoveryCandidatePosition.copy(this.autoRecoveryProbePosition);
                    this.copyGroundHit(candidateGround, this.autoRecoveryBestGroundHit);
                }
            }

            if (foundBest) {
                return this.autoRecoveryBestGroundHit;
            }
        }

        return null;
    },
    snapNavigationToAutoRecoveryGround: function (candidatePosition, groundHit) {
        if (!candidatePosition || !groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            this.heightOffset = 1.6;
        }

        this.heightOffset = this.resolveNavigationHeightOffset(this.heightOffset);
        this.targetWorldPosition.set(
            candidatePosition.x,
            groundHit.point.y + this.heightOffset,
            candidatePosition.z
        );

        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.setResolvedGroundHit(groundHit, this.targetWorldPosition, this.lastGroundHit);
        this.hasLastGroundHit = true;
        this.recordStableAutoGround(this.targetWorldPosition, this.lastGroundHit);
        return true;
    },
    requestAutoTerrainRecovery: function (source) {
        const settings = this.getSceneSettings();
        if (!settings || this.getNavigationMode(settings) !== 'walkable' || !this.areCollisionsEnabled(settings)) {
            this.setAutoRecoveryStatus('unavailable');
            return false;
        }

        const movementDisabled = settings.movement_disabled === true ||
            settings.movement_disabled === 'true' ||
            settings.movement_disabled === '1';
        if (movementDisabled) {
            this.setAutoRecoveryStatus('movement-disabled');
            return false;
        }

        const now = performance.now();
        if (now - this.lastManualRecoveryAttemptAt < this.autoRecoveryCooldownMs) {
            this.setAutoRecoveryStatus('cooldown');
            return false;
        }

        const currentPosition = this.getNavigationWorldPosition();
        const currentGround = this.sampleGroundAt(
            currentPosition,
            this.hasLastGroundHit ? this.lastGroundHit.point.y : undefined,
            this.sampledGroundHit
        );
        this.lastManualRecoveryAttemptAt = now;

        let recoveryGround = this.findRecentStableAutoRecoveryGround(currentPosition, currentGround);
        if (recoveryGround && this.snapNavigationToAutoRecoveryGround(this.autoRecoveryCandidatePosition, recoveryGround)) {
            this.setAutoRecoveryStatus(`${source || 'manual'}:recent`);
            return true;
        }

        recoveryGround = this.findNearbyAutoRecoveryGround(currentPosition, currentGround);
        if (recoveryGround && this.snapNavigationToAutoRecoveryGround(this.autoRecoveryCandidatePosition, recoveryGround)) {
            this.setAutoRecoveryStatus(`${source || 'manual'}:nearby`);
            return true;
        }

        this.setAutoRecoveryStatus('no-valid-target');
        return false;
    },
    resolveMovementAgainstGround: function (currentPosition, deltaX, deltaZ, currentGround, outputStep) {
        outputStep = outputStep || this.resolvedMovementStep;
        this.stepDelta.set(deltaX, 0, deltaZ);
        const totalDistance = this.stepDelta.length();
        if (totalDistance < 0.00001) {
            outputStep.position.copy(currentPosition);
            this.copyGroundHit(currentGround, outputStep.ground);
            return outputStep;
        }

        const steps = Math.max(1, Math.ceil(totalDistance / 0.2));
        const bestPosition = outputStep.position;
        const bestGround = this.bestGroundHit;
        let autoGroundMisses = 0;
        bestPosition.copy(currentPosition);
        this.copyGroundHit(currentGround, bestGround);

        for (let step = 1; step <= steps; step++) {
            this.stepPosition.copy(currentPosition);
            this.stepPosition.x += deltaX * (step / steps);
            this.stepPosition.z += deltaZ * (step / steps);

            let stepGround = this.sampleGroundAt(this.stepPosition, bestGround.point.y, this.sampledGroundHit);
            if (!stepGround) {
                if (this.canUseAutoGroundMissGrace(bestGround, bestPosition, this.stepPosition, autoGroundMisses)) {
                    autoGroundMisses++;
                    bestPosition.copy(this.stepPosition);
                    continue;
                }

                stepGround = this.findNearestGroundAt(this.stepPosition, 1.5, this.recoveryGroundHit);
            }
            if (!stepGround) {
                break;
            }

            autoGroundMisses = 0;

            let deltaY = stepGround.point.y - bestGround.point.y;
            if (stepGround.behavior === 'auto' && Math.abs(deltaY) <= this.autoGroundHeightDeadband) {
                stepGround.point.y = bestGround.point.y;
                deltaY = 0;
            }

            const stepMaxHeight = this.getMaxStepHeightForGround(stepGround);
            if (deltaY > stepMaxHeight + this.groundProbeStepTolerance ||
                deltaY < -(this.data.maxDropHeight + this.groundProbeStepTolerance)) {
                break;
            }

            bestPosition.copy(this.stepPosition);
            this.copyGroundHit(stepGround, bestGround);
        }

        if (bestPosition.distanceToSquared(currentPosition) < 0.0000001) {
            return null;
        }

        this.copyGroundHit(bestGround, outputStep.ground);
        return outputStep;
    },
    getCollisionRoleFromObject: function (object3D) {
        let current = object3D;
        while (current) {
            if (current.userData && current.userData.vrodosCollisionRole) {
                return current.userData.vrodosCollisionRole;
            }
            current = current.parent || null;
        }

        return 'solid';
    },
    isBlockingCollisionHit: function (hit, options) {
        if (!hit || !hit.face || !hit.object) {
            return false;
        }

        this.blockerHitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
        if (this.isImmersiveXrPresenting()) {
            this.renderedToAuthoredDirection(this.blockerHitNormal, this.blockerHitNormal);
        }
        const upDot = this.blockerHitNormal.dot(this.upVector);
        const role = this.getCollisionRoleFromObject(hit.object);
        if (role === 'navmesh') {
            const canIgnoreNavmeshHit = options &&
                options.ignoreNavmeshBlockers &&
                typeof options.sweepHeight === 'number' &&
                typeof options.maxIgnoredNavmeshBlockerHeight === 'number' &&
                options.sweepHeight <= options.maxIgnoredNavmeshBlockerHeight;
            if (canIgnoreNavmeshHit) {
                return false;
            }

            const slope = THREE.MathUtils.radToDeg(Math.acos(VRODOSMaster.clamp(upDot, -1, 1)));
            return slope > this.data.maxSlope + 0.5;
        }

        if (upDot > 0.65) {
            return false;
        }

        return true;
    },
    raycastBlockingColliders: function (origin, direction, far, options) {
        const navPerfFrame = this.navPerfDebug ? this.navPerfDebug.frame : null;
        const immersivePresenting = this.isImmersiveXrPresenting();
        const rayOrigin = immersivePresenting
            ? this.authoredToRenderedPosition(origin, this.immersiveRenderedRayOrigin)
            : origin;
        const rayDirection = immersivePresenting
            ? this.authoredToRenderedDirection(direction, this.immersiveRenderedRayDirection)
            : direction;
        this.blockerRaycaster.set(rayOrigin, rayDirection);
        this.blockerRaycaster.near = 0;
        this.blockerRaycaster.far = Math.max(0.001, far);

        const raycastStart = navPerfFrame ? performance.now() : 0;
        const intersections = this.blockerRaycaster.intersectObjects(this.blockerCollisionTargets, false);
        if (navPerfFrame) {
            navPerfFrame.raycastMs += performance.now() - raycastStart;
            navPerfFrame.raycasts += 1;
            navPerfFrame.intersections += intersections.length;
        }

        for (let i = 0; i < intersections.length; i++) {
            if (this.isBlockingCollisionHit(intersections[i], options)) {
                return intersections[i];
            }
        }

        return null;
    },
    getGroundYForBlockerSweep: function (position, groundHit) {
        if (groundHit && groundHit.point && typeof groundHit.point.y === 'number') {
            return groundHit.point.y;
        }

        if (this.heightOffset !== null) {
            return position.y - this.heightOffset;
        }

        return position.y - 1.6;
    },
    isHorizontalPathBlocked: function (fromPosition, toPosition, fromGround, toGround, options) {
        this.refreshCollisionWorld();
        if (this.blockerCollisionTargets.length === 0) {
            return false;
        }

        this.blockerRayDirection.set(toPosition.x - fromPosition.x, 0, toPosition.z - fromPosition.z);
        const travelDistance = this.blockerRayDirection.length();
        if (travelDistance < 0.00001) {
            return false;
        }

        this.blockerRayDirection.multiplyScalar(1 / travelDistance);
        this.rightVector.crossVectors(this.blockerRayDirection, this.upVector);
        if (this.rightVector.lengthSq() < 0.000001) {
            this.rightVector.set(1, 0, 0);
        } else {
            this.rightVector.normalize();
        }

        const fromGroundY = this.getGroundYForBlockerSweep(fromPosition, fromGround);
        const toGroundY = this.getGroundYForBlockerSweep(toPosition, toGround);
        const far = travelDistance + this.blockerCapsuleRadius + this.blockerSkin;

        for (let heightIndex = 0; heightIndex < this.blockerSweepHeights.length; heightIndex++) {
            const height = Math.min(this.blockerSweepHeights[heightIndex], this.blockerCapsuleHeight);
            const originY = THREE.MathUtils.lerp(fromGroundY, toGroundY, 0.5) + height;
            if (options) {
                options.sweepHeight = height;
            }

            for (let offsetIndex = 0; offsetIndex < this.blockerSweepOffsets.length; offsetIndex++) {
                const offsetFactor = this.blockerSweepOffsets[offsetIndex];
                this.blockerSideOffset.copy(this.rightVector).multiplyScalar(offsetFactor * this.blockerCapsuleRadius);
                this.blockerRayOrigin.set(
                    fromPosition.x + this.blockerSideOffset.x,
                    originY,
                    fromPosition.z + this.blockerSideOffset.z
                );

                if (this.raycastBlockingColliders(this.blockerRayOrigin, this.blockerRayDirection, far, options)) {
                    return true;
                }
            }
        }

        return false;
    },
    getAutoStepNavmeshBlockerOptions: function (fromGround, toGround) {
        if (!this.isAutoGroundHit(toGround)) {
            return null;
        }

        if (!fromGround || !fromGround.point || !toGround.point) {
            return {
                ignoreNavmeshBlockers: true,
                maxIgnoredNavmeshBlockerHeight: this.autoNavmeshRiserBypassHeight
            };
        }

        const deltaY = toGround.point.y - fromGround.point.y;
        if (deltaY > this.getAutoStepAssistHeight() + this.groundProbeStepTolerance ||
            deltaY < -(this.data.maxDropHeight + this.groundProbeStepTolerance)) {
            return null;
        }

        return {
            ignoreNavmeshBlockers: true,
            maxIgnoredNavmeshBlockerHeight: this.autoNavmeshRiserBypassHeight
        };
    },
    resolveMovementAgainstBlockers: function (currentPosition, deltaX, deltaZ, currentGround, resolvedStep) {
        if (!resolvedStep || !resolvedStep.position) {
            return resolvedStep;
        }

        const blockerOptions = this.getAutoStepNavmeshBlockerOptions(currentGround, resolvedStep.ground);

        if (!this.isHorizontalPathBlocked(currentPosition, resolvedStep.position, currentGround, resolvedStep.ground, blockerOptions)) {
            return resolvedStep;
        }

        let bestStep = null;
        let bestDistanceSq = 0;

        const trySlideStep = (candidateDeltaX, candidateDeltaZ, outputStep) => {
            if (Math.abs(candidateDeltaX) < 0.00001 && Math.abs(candidateDeltaZ) < 0.00001) {
                return;
            }

            const candidateStep = this.resolveMovementAgainstGround(currentPosition, candidateDeltaX, candidateDeltaZ, currentGround, outputStep);
            if (!candidateStep) {
                return;
            }

            const slideBlockerOptions = this.getAutoStepNavmeshBlockerOptions(currentGround, candidateStep.ground);
            if (this.isHorizontalPathBlocked(currentPosition, candidateStep.position, currentGround, candidateStep.ground, slideBlockerOptions)) {
                return;
            }

            const distanceSq = this.horizontalDistanceSquared(currentPosition, candidateStep.position);
            if (distanceSq > bestDistanceSq) {
                bestDistanceSq = distanceSq;
                bestStep = candidateStep;
            }
        };

        trySlideStep(deltaX, 0, this.blockerSlideStepX);
        trySlideStep(0, deltaZ, this.blockerSlideStepZ);

        return bestStep;
    },
    snapNavigationVerticallyToGround: function (groundHit, horizontalPosition) {
        if (!groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            const currentPosition = this.getNavigationWorldPosition();
            this.heightOffset = currentPosition.y - groundHit.point.y;
        }

        this.heightOffset = this.resolveNavigationHeightOffset(this.heightOffset);
        horizontalPosition = horizontalPosition || this.getNavigationWorldPosition();
        this.targetWorldPosition.set(
            horizontalPosition.x,
            groundHit.point.y + this.heightOffset,
            horizontalPosition.z
        );

        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.setResolvedGroundHit(groundHit, this.targetWorldPosition, this.lastGroundHit);
        this.hasLastGroundHit = true;
        this.recordStableAutoGround(this.lastResolvedPosition, this.lastGroundHit);
        return true;
    },
    snapNavigationToRecoveredGround: function (groundHit) {
        if (!groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            const currentPosition = this.getNavigationWorldPosition();
            this.heightOffset = currentPosition.y - groundHit.point.y;
        }

        this.heightOffset = this.resolveNavigationHeightOffset(this.heightOffset);
        this.targetWorldPosition.set(
            groundHit.rawPoint.x,
            groundHit.point.y + this.heightOffset,
            groundHit.rawPoint.z
        );

        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.setResolvedGroundHit(groundHit, this.targetWorldPosition, this.lastGroundHit);
        this.hasLastGroundHit = true;
        this.recordStableAutoGround(this.lastResolvedPosition, this.lastGroundHit);
        return true;
    },
    syncHeightOffset: function () {
        if (!this.areCollisionsEnabled()) {
            return;
        }

        const navigationPosition = this.getNavigationWorldPosition();
        let currentGround = this.sampleGroundAt(navigationPosition, this.hasLastGroundHit ? this.lastGroundHit.point.y : undefined, this.sampledGroundHit);
        if (!currentGround) {
            currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition), this.recoveryGroundHit);
            if (!currentGround) {
                return;
            }

            this.heightOffset = this.resolveNavigationHeightOffset(navigationPosition.y - currentGround.point.y);
            this.snapNavigationToRecoveredGround(currentGround);
            return;
        }

        this.heightOffset = this.resolveNavigationHeightOffset(navigationPosition.y - currentGround.point.y);
        this.snapNavigationVerticallyToGround(currentGround, navigationPosition);
    },
    syncInitialHeightOffset: function () {
        if (!this.areCollisionsEnabled()) {
            return;
        }

        const navigationPosition = this.getNavigationWorldPosition();
        const currentGround = this.sampleGroundAt(
            navigationPosition,
            this.hasLastGroundHit ? this.lastGroundHit.point.y : undefined,
            this.sampledGroundHit
        );

        if (!currentGround) {
            this.lastResolvedPosition.copy(navigationPosition);
            this.hasLastGroundHit = false;
            return;
        }

        this.heightOffset = this.resolveNavigationHeightOffset(navigationPosition.y - currentGround.point.y);
        this.snapNavigationVerticallyToGround(currentGround, navigationPosition);
    },
    applyDirectMovement: function (deltaX, deltaZ) {
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return;
        }

        this.targetWorldPosition.copy(this.lastResolvedPosition);
        this.targetWorldPosition.x += deltaX;
        this.targetWorldPosition.z += deltaZ;

        if (this.setNavigationWorldPosition(this.targetWorldPosition)) {
            this.lastResolvedPosition.copy(this.targetWorldPosition);
            this.hasLastGroundHit = false;
        }
    },
    applyFreeMovement: function (deltaX, deltaY, deltaZ) {
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaY) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return;
        }

        this.targetWorldPosition.copy(this.lastResolvedPosition);
        this.targetWorldPosition.x += deltaX;
        this.targetWorldPosition.y += deltaY;
        this.targetWorldPosition.z += deltaZ;

        if (this.setNavigationWorldPosition(this.targetWorldPosition)) {
            this.lastResolvedPosition.copy(this.targetWorldPosition);
            this.hasLastGroundHit = false;
            this.heightOffset = null;
        }
    },
    applyConstrainedMovement: function (deltaX, deltaZ) {
        const navPerfFrame = this.navPerfDebug ? this.navPerfDebug.frame : null;
        const constrainedStart = navPerfFrame ? performance.now() : 0;
        const finalizeConstrained = function (result) {
            if (navPerfFrame) {
                navPerfFrame.constrainedMs += performance.now() - constrainedStart;
            }
            return result;
        };

        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return finalizeConstrained(true);
        }

        if (this.heightOffset === null) {
            this.syncHeightOffset();
        }

        const currentPosition = this.constrainedCurrentPosition.copy(this.lastResolvedPosition);
        let currentGround = this.hasLastGroundHit ? this.lastGroundHit : null;
        if (currentGround && this.horizontalDistanceSquared(currentGround.point, currentPosition) > (1.5 * 1.5)) {
            currentGround = null;
        }
        if (!currentGround) {
            currentGround = this.sampleGroundAt(
                currentPosition,
                this.hasLastGroundHit ? this.lastGroundHit.point.y : undefined,
                this.sampledGroundHit
            );
        }
        if (!currentGround) {
            const navigationPosition = this.getNavigationWorldPosition();
            if (!this.canAttemptRecovery()) {
                return false;
            }

            currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition), this.recoveryGroundHit);
            if (!currentGround) {
                return finalizeConstrained(false);
            }

            if (this.heightOffset === null) {
                this.heightOffset = this.resolveNavigationHeightOffset(navigationPosition.y - currentGround.point.y);
            }

            if (!this.snapNavigationToRecoveredGround(currentGround)) {
                return finalizeConstrained(false);
            }

            currentPosition.copy(this.lastResolvedPosition);
        }

        let resolvedStep = this.resolveMovementAgainstGround(currentPosition, deltaX, deltaZ, currentGround, this.resolvedMovementStep);
        if (!resolvedStep) {
            return finalizeConstrained(false);
        }

        resolvedStep = this.resolveMovementAgainstBlockers(currentPosition, deltaX, deltaZ, currentGround, resolvedStep);
        if (!resolvedStep) {
            return finalizeConstrained(false);
        }

        this.immersiveLastStepDeltaY = resolvedStep.ground.point.y - currentGround.point.y;
        const nextY = resolvedStep.ground.point.y + (this.heightOffset !== null ? this.heightOffset : 0);
        this.targetWorldPosition.set(resolvedStep.position.x, nextY, resolvedStep.position.z);
        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return finalizeConstrained(false);
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.setResolvedGroundHit(resolvedStep.ground, this.targetWorldPosition, this.lastGroundHit);
        this.hasLastGroundHit = true;
        this.recordStableAutoGround(this.lastResolvedPosition, this.lastGroundHit);
        return finalizeConstrained(true);
    },
    tick: function (time, timeDelta) {
        const settings = this.getSceneSettings();
        if (!settings) {
            return;
        }

        this.beginNavPerfDebugFrame();

        try {
            const immersivePresenting = this.isImmersiveXrPresenting();
            if (immersivePresenting) {
                if (!this.immersiveWasPresenting) {
                    this.resetImmersiveWorldLocomotion();
                }
                this.ensureImmersiveRuntimeHelpers();
            } else if (this.immersiveWasPresenting) {
                this.handleExitVr();
            } else {
                this.rememberNonImmersiveNavigationPosition();
            }

            const movementDisabled = settings.movement_disabled === true || settings.movement_disabled === 'true' || settings.movement_disabled === '1';
            if (movementDisabled) {
                this.setNavigationWorldPosition(this.lastResolvedPosition);
                return;
            }

            this.ensureNavigationStatePrimed();

            const currentPosition = this.tickWorldPosition.copy(this.getNavigationWorldPosition());
            const externalDeltaX = currentPosition.x - this.lastResolvedPosition.x;
            const externalDeltaY = currentPosition.y - this.lastResolvedPosition.y;
            const externalDeltaZ = currentPosition.z - this.lastResolvedPosition.z;
            const navigationMode = this.getNavigationMode(settings);
            const flyMode = navigationMode === 'fly';
            let hasExternalMovement = Math.abs(externalDeltaX) > 0.0001 ||
                Math.abs(externalDeltaZ) > 0.0001 ||
                (flyMode && Math.abs(externalDeltaY) > 0.0001);
            if (immersivePresenting && hasExternalMovement) {
                this.lastResolvedPosition.copy(currentPosition);
                hasExternalMovement = false;
            }

            const collisionsEnabled = this.areCollisionsEnabled(settings);
            this.updateWASDControlsState(navigationMode, collisionsEnabled);
            if (this.navPerfDebug && this.navPerfDebug.frame) {
                this.navPerfDebug.frame.collisionsEnabled = collisionsEnabled;
                this.navPerfDebug.frame.immersiveCollisionsEnabled = immersivePresenting && collisionsEnabled;
            }

            if (hasExternalMovement) {
                this.setNavigationWorldPosition(this.lastResolvedPosition);

                if (flyMode) {
                    this.applyFreeMovement(externalDeltaX, externalDeltaY, externalDeltaZ);
                } else if (collisionsEnabled) {
                    this.applyConstrainedMovement(externalDeltaX, externalDeltaZ);
                } else {
                    this.applyDirectMovement(externalDeltaX, externalDeltaZ);
                }
            }

            const turnedWithRightStick = this.applyRightThumbstickTurn(timeDelta);
            const thumbstickX = Math.abs(this.leftThumbInput.x) > this.data.thumbstickDeadzone ? this.leftThumbInput.x : 0;
            const thumbstickY = Math.abs(this.leftThumbInput.y) > this.data.thumbstickDeadzone ? this.leftThumbInput.y : 0;
            const keyboardX = (collisionsEnabled || flyMode) ? this.keyboardInput.x : 0;
            const keyboardY = (collisionsEnabled || flyMode) ? this.keyboardInput.y : 0;
            const keyboardVertical = flyMode ? this.keyboardInput.vertical : 0;
            const inputX = VRODOSMaster.clamp(keyboardX + thumbstickX, -1, 1);
            const inputY = VRODOSMaster.clamp(keyboardY + thumbstickY, -1, 1);
            const inputVertical = flyMode ? VRODOSMaster.clamp(keyboardVertical, -1, 1) : 0;
            if (this.navPerfDebug && this.navPerfDebug.frame) {
                this.navPerfDebug.frame.moving = hasExternalMovement || turnedWithRightStick || inputX !== 0 || inputY !== 0 || inputVertical !== 0;
            }

            if (inputX === 0 && inputY === 0 && inputVertical === 0) {
                if (!hasExternalMovement) {
                    this.lastResolvedPosition.copy(currentPosition);
                }
                return;
            }

            const movementSpeed = flyMode ? this.data.flyMovementSpeed : this.data.movementSpeed;
            const movementDistance = movementSpeed * (Math.min(timeDelta, 50) / 1000);
            const movementDelta = flyMode
                ? this.getFlyMovementDeltaFromInput(inputX, inputY, inputVertical, movementDistance)
                : this.getMovementDeltaFromInput(inputX, inputY, movementDistance);
            if (!movementDelta) {
                return;
            }

            if (flyMode) {
                this.applyFreeMovement(movementDelta.x, movementDelta.y, movementDelta.z);
            } else if (collisionsEnabled) {
                this.applyConstrainedMovement(movementDelta.x, movementDelta.z);
            } else {
                this.applyDirectMovement(movementDelta.x, movementDelta.z);
            }
        } finally {
            this.finishNavPerfDebugFrame();
        }
    }
});
