/**
 * VRodos Master Navigation Components
 */

var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});
var VRODOSNavmeshDefaults = VRODOSMaster.NAVMESH_DEFAULTS || window.VRODOS_NAVMESH_DEFAULTS || {
    maxStepHeight: 0.6,
    maxDropHeight: 1.0,
    maxSlope: 45
};

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
        this.resolvedMovementStep = {
            position: new THREE.Vector3(),
            ground: this.createGroundHit()
        };
        this.searchRadii = [0.5, 1, 2, 4, 6];
        this.searchAngles = [0, 45, 90, 135, 180, 225, 270, 315];

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
            slope: 0
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
        this.navMeshBounds.makeEmpty();

        var navMeshEntities = this.sceneEl.querySelectorAll(this.navMeshEntitySelector);
        for (var i = 0; i < navMeshEntities.length; i++) {
            var meshRoot = navMeshEntities[i].getObject3D('mesh');
            if (meshRoot) {
                this.navMeshRoots.push(meshRoot);
                this.navMeshRootBounds.setFromObject(meshRoot);
                if (!this.navMeshRootBounds.isEmpty()) {
                    this.navMeshBounds.union(this.navMeshRootBounds);
                }
            }
        }

        this.navMeshDirty = false;
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
        return this.navMeshRoots.length > 0;
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
            this.el.setAttribute('wasd-controls', 'fly: false; acceleration: 20; enabled: ' + (collisionsEnabled ? 'false' : 'true'));
        }

        this.wasdControlsSuppressed = collisionsEnabled;
    },
    sampleGroundAtSingle: function (position, referenceGroundY, outputGround) {
        this.refreshNavMeshRoots();
        if (this.navMeshRoots.length === 0) {
            return null;
        }

        var originY = typeof referenceGroundY === 'number'
            ? referenceGroundY + this.data.maxStepHeight + 2
            : position.y + this.data.maxStepHeight + 2;

        this.raycastOrigin.set(position.x, originY, position.z);
        this.raycaster.set(this.raycastOrigin, this.raycastDirection);
        this.raycaster.far = this.data.maxStepHeight + this.data.maxDropHeight + 20;

        var intersections = this.raycaster.intersectObjects(this.navMeshRoots, true);
        var hasReferenceGround = typeof referenceGroundY === 'number' && isFinite(referenceGroundY);
        var minAllowedY = hasReferenceGround ? referenceGroundY - (this.data.maxDropHeight + this.groundProbeStepTolerance) : -Infinity;
        var maxAllowedY = hasReferenceGround ? referenceGroundY + this.data.maxStepHeight + this.groundProbeStepTolerance : Infinity;
        var bestHit = null;
        var bestScore = Infinity;

        for (var i = 0; i < intersections.length; i++) {
            var hit = intersections[i];
            if (!hit.face) {
                continue;
            }

            this.tempWorldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
            var slope = THREE.MathUtils.radToDeg(Math.acos(VRODOSMaster.clamp(this.tempWorldNormal.dot(this.upVector), -1, 1)));

            if (slope > this.data.maxSlope + 0.5) {
                continue;
            }

            if (!hasReferenceGround) {
                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, hit.point.y, position.z);
                outputGround.rawPoint.copy(hit.point);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
                return outputGround;
            }

            if (hit.point.y < minAllowedY || hit.point.y > maxAllowedY) {
                continue;
            }

            var score = Math.abs(hit.point.y - referenceGroundY) + (i * 0.0001);
            if (score < bestScore) {
                bestScore = score;
                bestHit = hit;
                outputGround = outputGround || this.createGroundHit();
                outputGround.point.set(position.x, hit.point.y, position.z);
                outputGround.rawPoint.copy(hit.point);
                outputGround.normal.copy(this.tempWorldNormal);
                outputGround.slope = slope;
            }
        }

        return bestHit ? outputGround : null;
    },
    sampleGroundAt: function (position, referenceGroundY, outputGround) {
        var directGround = this.sampleGroundAtSingle(position, referenceGroundY, outputGround);
        if (directGround) {
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
        var foundBestGround = !!this.sampleGroundAt(position, undefined, bestGround);
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
        bestPosition.copy(currentPosition);
        this.copyGroundHit(currentGround, bestGround);

        for (var step = 1; step <= steps; step++) {
            this.stepPosition.copy(currentPosition);
            this.stepPosition.x += deltaX * (step / steps);
            this.stepPosition.z += deltaZ * (step / steps);

            var stepGround = this.sampleGroundAt(this.stepPosition, bestGround.point.y, this.sampledGroundHit);
            if (!stepGround) {
                stepGround = this.findNearestGroundAt(this.stepPosition, 1.5, this.recoveryGroundHit);
            }
            if (!stepGround) {
                break;
            }

            var deltaY = stepGround.point.y - bestGround.point.y;
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
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return true;
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
                return false;
            }

            if (this.heightOffset === null) {
                this.heightOffset = VRODOSMaster.clamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
            }

            if (!this.snapNavigationToRecoveredGround(currentGround)) {
                return false;
            }

            currentPosition.copy(this.lastResolvedPosition);
        }

        var resolvedStep = this.resolveMovementAgainstGround(currentPosition, deltaX, deltaZ, currentGround, this.resolvedMovementStep);
        if (!resolvedStep) {
            return false;
        }

        var nextY = resolvedStep.ground.point.y + (this.heightOffset !== null ? this.heightOffset : 0);
        this.targetWorldPosition.set(resolvedStep.position.x, nextY, resolvedStep.position.z);
        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.setResolvedGroundHit(resolvedStep.ground, this.targetWorldPosition, this.lastGroundHit);
        this.hasLastGroundHit = true;
        return true;
    },
    tick: function (time, timeDelta) {
        var settings = this.getSceneSettings();
        if (!settings) {
            return;
        }

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
    }
});

