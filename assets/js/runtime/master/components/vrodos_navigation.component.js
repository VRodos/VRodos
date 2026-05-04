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
        var params = new URLSearchParams(window.location.search);
        return params.get('vrodos_debug_nav_perf') === '1';
    } catch (err) {
        return false;
    }
}

AFRAME.registerComponent('vrodos-navmesh-helper', {
    init: function () {
        this.applyHiddenNavmeshState = this.applyHiddenNavmeshState.bind(this);
        this.el.addEventListener('model-loaded', this.applyHiddenNavmeshState);

        if (this.el.getObject3D('mesh')) {
            this.applyHiddenNavmeshState();
        }
    },
    applyHiddenNavmeshState: function () {
        var meshRoot = this.el.getObject3D('mesh');
        if (!meshRoot) {
            return;
        }

        meshRoot.visible = true;
        meshRoot.traverse(function (node) {
            if (!node.isMesh) {
                return;
            }

            node.frustumCulled = false;
            node.castShadow = false;
            node.receiveShadow = false;

            if (Array.isArray(node.material)) {
                node.material = node.material.map(function (material) {
                    return vrodosCreateHiddenNavmeshMaterial(material);
                });
            } else if (node.material) {
                node.material = vrodosCreateHiddenNavmeshMaterial(node.material);
            }
        });
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.applyHiddenNavmeshState);
    }
});


AFRAME.registerComponent('custom-movement', {
    schema: {
        movementSpeed: { type: 'number', default: 3.2 },
        maxStepHeight: { type: 'number', default: VRODOSNavmeshDefaults.maxStepHeight },
        maxDropHeight: { type: 'number', default: VRODOSNavmeshDefaults.maxDropHeight },
        maxSlope: { type: 'number', default: VRODOSNavmeshDefaults.maxSlope }
    },
    init: function () {
        this.cameraRig = this.el;
        this.sceneEl = this.el.sceneEl;
        this.cameraEl = document.querySelector('#cameraA') || document.querySelector('a-camera');
        this.navMeshEntitySelector = '.vrodos-navmesh';
        this.thumbInput = { x: 0, y: 0 };
        this.keyboardInput = { x: 0, y: 0 };
        this.navMeshRoots = [];
        this.navMeshCollisionTargets = [];
        this.navMeshDirty = true;
        this.navMeshBounds = new THREE.Box3();
        this.navMeshRootBounds = new THREE.Box3();
        this.heightOffset = null;
        this.lastResolvedPosition = new THREE.Vector3();
        this.lastGroundHit = this.createGroundHit();
        this.hasLastGroundHit = false;
        this.upVector = new THREE.Vector3(0, 1, 0);
        this.forwardVector = new THREE.Vector3();
        this.rightVector = new THREE.Vector3();
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
        this.wasdControlsSuppressed = null;
        this.lastRecoveryAttemptAt = 0;
        this.positionPrimed = false;
        this.sampledGroundHit = this.createGroundHit();
        this.candidateGroundHit = this.createGroundHit();
        this.bestGroundHit = this.createGroundHit();
        this.recoveryGroundHit = this.createGroundHit();
        this.offsetGroundHit = this.createGroundHit();
        this.autoGroundSampleHit = this.createGroundHit();
        this.autoGroundSamplePosition = new THREE.Vector3();
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

        this.thumbL = document.querySelector('#leftHand');
        this.thumbR = document.querySelector('#rightHand');

        if (this.thumbL) {
            this.thumbL.addEventListener('thumbstickmoved', this.handleThumbstickMove);
        }

        if (this.thumbR) {
            this.thumbR.addEventListener('thumbstickmoved', this.handleThumbstickMove);
        }

        this.sceneEl.addEventListener('model-loaded', this.handleNavmeshModelLoad);
        this.sceneEl.addEventListener('loaded', this.handleSceneLoaded);
        this.sceneEl.addEventListener('child-attached', this.handleSceneChildAttached);
        this.sceneEl.addEventListener('child-detached', this.handleSceneChildDetached);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
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
        this.hasLastGroundHit = false;
        this.hasLastAutoGroundSample = false;
    },
    handleSceneLoaded: function () {
        this.markNavMeshDirty();
        this.positionPrimed = false;
    },
    handleSceneChildAttached: function (event) {
        if (event && event.detail && event.detail.el && event.detail.el.classList && event.detail.el.classList.contains('vrodos-navmesh')) {
            this.markNavMeshDirty();
        }
    },
    handleSceneChildDetached: function (event) {
        if (event && event.detail && event.detail.el && event.detail.el.classList && event.detail.el.classList.contains('vrodos-navmesh')) {
            this.markNavMeshDirty();
        }
    },
    handleThumbstickMove: function (event) {
        if (!event || !event.detail) {
            return;
        }

        this.thumbInput.x = event.detail.x || 0;
        this.thumbInput.y = event.detail.y || 0;
    },
    handleThumbstickEnd: function () {
        this.thumbInput.x = 0;
        this.thumbInput.y = 0;
    },
    handleNavmeshModelLoad: function (event) {
        if (!event || !event.target || !event.target.classList || !event.target.classList.contains('vrodos-navmesh')) {
            return;
        }

        this.markNavMeshDirty();
        this.syncHeightOffset();
    },
    shouldIgnoreKeyboardEvent: function (event) {
        var target = event ? event.target : null;
        if (!target) {
            return false;
        }

        var tagName = target.tagName ? target.tagName.toLowerCase() : '';
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
        }

        return false;
    },
    handleKeyDown: function (event) {
        if (!event || this.shouldIgnoreKeyboardEvent(event)) {
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
    remove: function () {
        if (this.thumbL) {
            this.thumbL.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
        }
        if (this.thumbR) {
            this.thumbR.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
        }
        this.sceneEl.removeEventListener('model-loaded', this.handleNavmeshModelLoad);
        this.sceneEl.removeEventListener('loaded', this.handleSceneLoaded);
        this.sceneEl.removeEventListener('child-attached', this.handleSceneChildAttached);
        this.sceneEl.removeEventListener('child-detached', this.handleSceneChildDetached);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
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
            var overlay = document.createElement('div');
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
            moving: false
        };
    },
    finishNavPerfDebugFrame: function () {
        if (!this.navPerfDebug || !this.navPerfDebug.frame) {
            return;
        }

        var now = performance.now();
        var frame = this.navPerfDebug.frame;
        var alpha = 0.2;
        frame.tickMs = now - frame.tickStart;

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

        var overlay = this.ensureNavPerfDebugOverlay();
        if (!overlay) {
            return;
        }

        var frame = this.navPerfDebug.frame;
        overlay.textContent = [
            'NAV PERF DEBUG',
            `moving: ${  frame.moving ? 'yes' : 'no'}`,
            `collisions: ${  frame.collisionsEnabled ? 'on' : 'off'}`,
            `tick ms: ${  frame.tickMs.toFixed(2)  } avg ${  this.navPerfDebug.avgTickMs.toFixed(2)}`,
            `constrained ms: ${  frame.constrainedMs.toFixed(2)  } avg ${  this.navPerfDebug.avgConstrainedMs.toFixed(2)}`,
            `sample ms: ${  frame.sampleMs.toFixed(2)  } avg ${  this.navPerfDebug.avgSampleMs.toFixed(2)}`,
            `raycast ms: ${  frame.raycastMs.toFixed(2)  } avg ${  this.navPerfDebug.avgRaycastMs.toFixed(2)}`,
            `raycasts: ${  frame.raycasts  } avg ${  this.navPerfDebug.avgRaycasts.toFixed(1)}`,
            `intersections: ${  frame.intersections  } avg ${  this.navPerfDebug.avgIntersections.toFixed(1)}`
        ].join('\n');
    },
    getSceneSettings: function () {
        return this.sceneEl ? this.sceneEl.getAttribute('scene-settings') : null;
    },
    getNavigationAnchorObject: function () {
        if (this.cameraEl && this.cameraEl.object3D) {
            return this.cameraEl.object3D;
        }

        return this.cameraRig ? this.cameraRig.object3D : null;
    },
    getNavigationWorldPosition: function () {
        var anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject) {
            return this.currentWorldPosition.set(0, 0, 0);
        }

        return anchorObject.getWorldPosition(this.currentWorldPosition);
    },
    setNavigationWorldPosition: function (targetWorldPosition) {
        var anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject || !this.cameraRig || !this.cameraRig.object3D) {
            return false;
        }

        var currentWorldPosition = this.getNavigationWorldPosition();
        this.movementOffset.copy(targetWorldPosition).sub(currentWorldPosition);
        this.cameraRig.object3D.position.add(this.movementOffset);
        return true;
    },
    horizontalDistanceSquared: function (pointA, pointB) {
        if (!pointA || !pointB) {
            return Infinity;
        }

        var deltaX = pointA.x - pointB.x;
        var deltaZ = pointA.z - pointB.z;
        return deltaX * deltaX + deltaZ * deltaZ;
    },
    ensureNavigationStatePrimed: function () {
        if (this.positionPrimed) {
            return;
        }

        this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        this.hasLastGroundHit = false;

        if (this.areCollisionsEnabled()) {
            this.syncHeightOffset();
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

        var navMeshEntities = this.sceneEl.querySelectorAll(this.navMeshEntitySelector);
        for (var i = 0; i < navMeshEntities.length; i++) {
            var meshRoot = navMeshEntities[i].getObject3D('mesh');
            if (meshRoot) {
                this.applyWalkBehaviorToNavMeshRoot(meshRoot, this.normalizeWalkBehavior(navMeshEntities[i].getAttribute('data-vrodos-walk-behavior')));
                this.navMeshRoots.push(meshRoot);
                meshRoot.traverse(function (node) {
                    if (node && node.isMesh) {
                        this.navMeshCollisionTargets.push(node);
                    }
                }.bind(this));
                this.navMeshRootBounds.setFromObject(meshRoot);
                if (!this.navMeshRootBounds.isEmpty()) {
                    this.navMeshBounds.union(this.navMeshRootBounds);
                }
            }
        }

        this.navMeshDirty = false;
    },
    normalizeWalkBehavior: function (value) {
        return String(value || '').toLowerCase() === 'auto' ? 'auto' : 'precise';
    },
    applyWalkBehaviorToNavMeshRoot: function (meshRoot, behavior) {
        var normalizedBehavior = this.normalizeWalkBehavior(behavior);
        meshRoot.traverse(function (node) {
            if (!node.isMesh) {
                return;
            }

            node.userData = node.userData || {};
            node.userData.vrodosWalkBehavior = normalizedBehavior;
        });
    },
    getWalkBehaviorFromIntersection: function (hit) {
        var object3D = hit && hit.object ? hit.object : null;
        while (object3D) {
            if (object3D.userData && object3D.userData.vrodosWalkBehavior) {
                return this.normalizeWalkBehavior(object3D.userData.vrodosWalkBehavior);
            }
            object3D = object3D.parent || null;
        }

        return 'precise';
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
        var boundsRadius = VRODOSMaster.clamp(this.boundsSize.length() * 0.35, 12, 120);

        this.boundsClosestPoint.copy(position);
        this.navMeshBounds.clampPoint(position, this.boundsClosestPoint);
        var horizontalDistanceToBounds = Math.sqrt(this.horizontalDistanceSquared(position, this.boundsClosestPoint));

        return Math.max(boundsRadius, horizontalDistanceToBounds + 6);
    },
    areCollisionsEnabled: function () {
        var settings = this.getSceneSettings();
        if (!settings || settings.collisionMode === 'off') {
            return false;
        }

        this.refreshNavMeshRoots();
        return this.navMeshCollisionTargets.length > 0;
    },
    getMovementDeltaFromInput: function (inputX, inputY, distance) {
        var referenceEl = this.cameraEl || this.cameraRig;
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

        return {
            x: (-this.forwardVector.x * inputY + this.rightVector.x * inputX) * distance,
            z: (-this.forwardVector.z * inputY + this.rightVector.z * inputX) * distance
        };
    },
    updateWASDControlsState: function (collisionsEnabled) {
        if (this.wasdControlsSuppressed === collisionsEnabled) {
            return;
        }

        if (this.el.components && this.el.components['wasd-controls']) {
            this.el.setAttribute('wasd-controls', `fly: false; acceleration: 20; enabled: ${  collisionsEnabled ? 'false' : 'true'}`);
        }

        this.wasdControlsSuppressed = collisionsEnabled;
    },
    sampleGroundAtSingle: function (position, referenceGroundY, outputGround) {
        var navPerfFrame = this.navPerfDebug ? this.navPerfDebug.frame : null;
        var sampleStart = navPerfFrame ? performance.now() : 0;
        var finalizeSample = function (result) {
            if (navPerfFrame) {
                navPerfFrame.sampleMs += performance.now() - sampleStart;
            }
            return result;
        };

        this.refreshNavMeshRoots();
        if (this.navMeshCollisionTargets.length === 0) {
            return finalizeSample(null);
        }

        var originY = typeof referenceGroundY === 'number'
            ? referenceGroundY + this.data.maxStepHeight + 2
            : position.y + this.data.maxStepHeight + 2;

        this.raycastOrigin.set(position.x, originY, position.z);
        this.raycaster.set(this.raycastOrigin, this.raycastDirection);
        this.raycaster.far = this.data.maxStepHeight + this.data.maxDropHeight + 20;

        var raycastStart = navPerfFrame ? performance.now() : 0;
        var intersections = this.raycaster.intersectObjects(this.navMeshCollisionTargets, false);
        if (navPerfFrame) {
            navPerfFrame.raycastMs += performance.now() - raycastStart;
            navPerfFrame.raycasts += 1;
            navPerfFrame.intersections += intersections.length;
        }
        var hasReferenceGround = typeof referenceGroundY === 'number' && isFinite(referenceGroundY);
        var minAllowedY = hasReferenceGround ? referenceGroundY - (this.data.maxDropHeight + this.groundProbeStepTolerance) : -Infinity;
        var maxAllowedY = hasReferenceGround ? referenceGroundY + this.data.maxStepHeight + this.groundProbeStepTolerance : Infinity;
        var bestAutoHit = null;
        var bestAutoHeightDelta = Infinity;
        var bestScore = Infinity;

        for (var i = 0; i < intersections.length; i++) {
            var hit = intersections[i];
            if (!hit.face) {
                continue;
            }

            this.tempWorldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
            var slope = THREE.MathUtils.radToDeg(Math.acos(VRODOSMaster.clamp(this.tempWorldNormal.dot(this.upVector), -1, 1)));
            var behavior = this.getWalkBehaviorFromIntersection(hit);

            if (slope > this.data.maxSlope + 0.5) {
                continue;
            }

            if (behavior === 'precise') {
                if (hasReferenceGround && (hit.point.y < minAllowedY || hit.point.y > maxAllowedY)) {
                    continue;
                }

                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, hit.point.y, position.z);
                outputGround.rawPoint.copy(hit.point);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
                outputGround.behavior = behavior;
                return finalizeSample(outputGround);
            }

            if (!hasReferenceGround) {
                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, hit.point.y, position.z);
                outputGround.rawPoint.copy(hit.point);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
                outputGround.behavior = behavior;
                return finalizeSample(outputGround);
            }

            if (hit.point.y < minAllowedY || hit.point.y > maxAllowedY) {
                continue;
            }

            var autoHeightDelta = Math.abs(hit.point.y - referenceGroundY);
            var autoScore = autoHeightDelta + (i * 0.0001);
            var shouldReplaceAutoHit = autoScore < bestScore;

            if (!shouldReplaceAutoHit && bestAutoHit &&
                Math.abs(autoHeightDelta - bestAutoHeightDelta) <= this.autoGroundOverlayTolerance &&
                hit.point.y < outputGround.point.y &&
                (outputGround.point.y - hit.point.y) <= this.autoGroundOverlayTolerance) {
                shouldReplaceAutoHit = true;
            }

            if (shouldReplaceAutoHit) {
                bestScore = autoScore;
                bestAutoHeightDelta = autoHeightDelta;
                bestAutoHit = hit;
                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, hit.point.y, position.z);
                outputGround.rawPoint.copy(hit.point);
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

        var directGround = this.sampleGroundAtSingle(position, referenceGroundY, outputGround);
        if (directGround) {
            this.storeAutoGroundSample(position, directGround);
            return directGround;
        }

        var hasReferenceGround = typeof referenceGroundY === 'number' && isFinite(referenceGroundY);
        var bestCandidate = null;
        var bestScore = Infinity;

        for (var i = 1; i < this.groundProbeOffsets.length; i++) {
            var probeOffset = this.groundProbeOffsets[i];
            this.groundProbePosition.set(
                position.x + probeOffset.x,
                position.y,
                position.z + probeOffset.y
            );

            var candidateGround = this.sampleGroundAtSingle(
                this.groundProbePosition,
                referenceGroundY,
                this.offsetGroundHit
            );

            if (!candidateGround) {
                continue;
            }

            var score = this.horizontalDistanceSquared(candidateGround.rawPoint, position);
            if (hasReferenceGround) {
                score += Math.abs(candidateGround.point.y - referenceGroundY) * 1.5;
            }

            if (score < bestScore) {
                bestScore = score;
                bestCandidate = candidateGround;
            }
        }

        if (!bestCandidate) {
            return null;
        }

        outputGround = outputGround || this.createGroundHit();
        this.copyGroundHit(bestCandidate, outputGround);
        outputGround.point.x = position.x;
        outputGround.point.z = position.z;
        this.storeAutoGroundSample(position, outputGround);
        return outputGround;
    },
    canAttemptRecovery: function () {
        var now = performance.now();
        if (now - this.lastRecoveryAttemptAt < 250) {
            return false;
        }

        this.lastRecoveryAttemptAt = now;
        return true;
    },
    findNearestGroundAt: function (position, searchRadius, outputGround) {
        var radius = typeof searchRadius === 'number' ? searchRadius : 6;
        var bestGround = outputGround || this.bestGroundHit;
        var foundBestGround = Boolean(this.sampleGroundAt(position, undefined, bestGround));
        var bestDistanceSq = foundBestGround ? this.horizontalDistanceSquared(bestGround.rawPoint, position) : Infinity;

        if (foundBestGround && bestDistanceSq < 0.0001) {
            return bestGround;
        }

        this.searchRadii[this.searchRadii.length - 1] = radius;

        for (var r = 0; r < this.searchRadii.length; r++) {
            var offsetRadius = this.searchRadii[r];
            if (offsetRadius > radius) {
                continue;
            }

            for (var a = 0; a < this.searchAngles.length; a++) {
                var radians = THREE.MathUtils.degToRad(this.searchAngles[a]);
                this.targetWorldPosition.set(
                    position.x + Math.cos(radians) * offsetRadius,
                    position.y,
                    position.z + Math.sin(radians) * offsetRadius
                );

                var candidateGround = this.sampleGroundAt(this.targetWorldPosition, undefined, this.candidateGroundHit);
                if (!candidateGround) {
                    continue;
                }

                var distanceSq = this.horizontalDistanceSquared(candidateGround.rawPoint, position);
                if (distanceSq < bestDistanceSq) {
                    this.copyGroundHit(candidateGround, bestGround);
                    foundBestGround = true;
                    bestDistanceSq = distanceSq;
                }
            }
        }

        return foundBestGround ? bestGround : null;
    },
    resolveMovementAgainstGround: function (currentPosition, deltaX, deltaZ, currentGround, outputStep) {
        outputStep = outputStep || this.resolvedMovementStep;
        this.stepDelta.set(deltaX, 0, deltaZ);
        var totalDistance = this.stepDelta.length();
        if (totalDistance < 0.00001) {
            outputStep.position.copy(currentPosition);
            this.copyGroundHit(currentGround, outputStep.ground);
            return outputStep;
        }

        var steps = Math.max(1, Math.ceil(totalDistance / 0.2));
        var bestPosition = outputStep.position;
        var bestGround = this.bestGroundHit;
        var autoGroundMisses = 0;
        bestPosition.copy(currentPosition);
        this.copyGroundHit(currentGround, bestGround);

        for (var step = 1; step <= steps; step++) {
            this.stepPosition.copy(currentPosition);
            this.stepPosition.x += deltaX * (step / steps);
            this.stepPosition.z += deltaZ * (step / steps);

            var stepGround = this.sampleGroundAt(this.stepPosition, bestGround.point.y, this.sampledGroundHit);
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

            var deltaY = stepGround.point.y - bestGround.point.y;
            if (stepGround.behavior === 'auto' && Math.abs(deltaY) <= this.autoGroundHeightDeadband) {
                stepGround.point.y = bestGround.point.y;
                deltaY = 0;
            }

            if (deltaY > this.data.maxStepHeight + this.groundProbeStepTolerance ||
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
    snapNavigationVerticallyToGround: function (groundHit, horizontalPosition) {
        if (!groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            var currentPosition = this.getNavigationWorldPosition();
            this.heightOffset = currentPosition.y - groundHit.point.y;
        }

        this.heightOffset = VRODOSMaster.clamp(this.heightOffset, 0.2, 2.5);
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
        return true;
    },
    snapNavigationToRecoveredGround: function (groundHit) {
        if (!groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            var currentPosition = this.getNavigationWorldPosition();
            this.heightOffset = currentPosition.y - groundHit.point.y;
        }

        this.heightOffset = VRODOSMaster.clamp(this.heightOffset, 0.2, 2.5);
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
        return true;
    },
    syncHeightOffset: function () {
        if (!this.areCollisionsEnabled()) {
            return;
        }

        var navigationPosition = this.getNavigationWorldPosition();
        var currentGround = this.sampleGroundAt(navigationPosition, this.hasLastGroundHit ? this.lastGroundHit.point.y : undefined, this.sampledGroundHit);
        if (!currentGround) {
            currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition), this.recoveryGroundHit);
            if (!currentGround) {
                return;
            }

            this.heightOffset = VRODOSMaster.clamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
            this.snapNavigationToRecoveredGround(currentGround);
            return;
        }

        this.heightOffset = VRODOSMaster.clamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
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
    applyConstrainedMovement: function (deltaX, deltaZ) {
        var navPerfFrame = this.navPerfDebug ? this.navPerfDebug.frame : null;
        var constrainedStart = navPerfFrame ? performance.now() : 0;
        var finalizeConstrained = function (result) {
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

        var currentPosition = this.constrainedCurrentPosition.copy(this.lastResolvedPosition);
        var currentGround = this.hasLastGroundHit ? this.lastGroundHit : null;
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
            var navigationPosition = this.getNavigationWorldPosition();
            if (!this.canAttemptRecovery()) {
                return false;
            }

            currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition), this.recoveryGroundHit);
            if (!currentGround) {
                return finalizeConstrained(false);
            }

            if (this.heightOffset === null) {
                this.heightOffset = VRODOSMaster.clamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
            }

            if (!this.snapNavigationToRecoveredGround(currentGround)) {
                return finalizeConstrained(false);
            }

            currentPosition.copy(this.lastResolvedPosition);
        }

        var resolvedStep = this.resolveMovementAgainstGround(currentPosition, deltaX, deltaZ, currentGround, this.resolvedMovementStep);
        if (!resolvedStep) {
            return finalizeConstrained(false);
        }

        var nextY = resolvedStep.ground.point.y + (this.heightOffset !== null ? this.heightOffset : 0);
        this.targetWorldPosition.set(resolvedStep.position.x, nextY, resolvedStep.position.z);
        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return finalizeConstrained(false);
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.setResolvedGroundHit(resolvedStep.ground, this.targetWorldPosition, this.lastGroundHit);
        this.hasLastGroundHit = true;
        return finalizeConstrained(true);
    },
    tick: function (time, timeDelta) {
        var settings = this.getSceneSettings();
        if (!settings) {
            return;
        }

        this.beginNavPerfDebugFrame();

        try {
            var movementDisabled = settings.movement_disabled === true || settings.movement_disabled === 'true' || settings.movement_disabled === '1';
            if (movementDisabled) {
                this.setNavigationWorldPosition(this.lastResolvedPosition);
                return;
            }

            this.ensureNavigationStatePrimed();

            var currentPosition = this.tickWorldPosition.copy(this.getNavigationWorldPosition());
            var externalDeltaX = currentPosition.x - this.lastResolvedPosition.x;
            var externalDeltaZ = currentPosition.z - this.lastResolvedPosition.z;
            var hasExternalMovement = Math.abs(externalDeltaX) > 0.0001 || Math.abs(externalDeltaZ) > 0.0001;
            var collisionsEnabled = this.areCollisionsEnabled();
            this.updateWASDControlsState(collisionsEnabled);
            if (this.navPerfDebug && this.navPerfDebug.frame) {
                this.navPerfDebug.frame.collisionsEnabled = collisionsEnabled;
            }

            if (hasExternalMovement) {
                this.setNavigationWorldPosition(this.lastResolvedPosition);

                if (collisionsEnabled) {
                    this.applyConstrainedMovement(externalDeltaX, externalDeltaZ);
                } else {
                    this.applyDirectMovement(externalDeltaX, externalDeltaZ);
                }
            }

            var thumbstickX = Math.abs(this.thumbInput.x) > 0.08 ? this.thumbInput.x : 0;
            var thumbstickY = Math.abs(this.thumbInput.y) > 0.08 ? this.thumbInput.y : 0;
            var keyboardX = collisionsEnabled ? this.keyboardInput.x : 0;
            var keyboardY = collisionsEnabled ? this.keyboardInput.y : 0;
            var inputX = VRODOSMaster.clamp(keyboardX + thumbstickX, -1, 1);
            var inputY = VRODOSMaster.clamp(keyboardY + thumbstickY, -1, 1);
            if (this.navPerfDebug && this.navPerfDebug.frame) {
                this.navPerfDebug.frame.moving = hasExternalMovement || inputX !== 0 || inputY !== 0;
            }

            if (inputX === 0 && inputY === 0) {
                if (!hasExternalMovement) {
                    this.lastResolvedPosition.copy(currentPosition);
                }
                return;
            }

            var movementDistance = this.data.movementSpeed * (Math.min(timeDelta, 50) / 1000);
            var movementDelta = this.getMovementDeltaFromInput(inputX, inputY, movementDistance);
            if (!movementDelta) {
                return;
            }

            if (collisionsEnabled) {
                this.applyConstrainedMovement(movementDelta.x, movementDelta.z);
            } else {
                this.applyDirectMovement(movementDelta.x, movementDelta.z);
            }
        } finally {
            this.finishNavPerfDebugFrame();
        }
    }
});

