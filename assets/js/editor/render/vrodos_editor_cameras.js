"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosEditorCameras() {
    const cameraDefaults = VRODOS.editorRender.camera;
    const zoomDefaults = VRODOS.editorRender.zoom;
    const getPointerLockObject = VRODOS.editorRender.getPointerLockObject;

    function requestEditorRender(reason) {
        if (VRODOS.editor && typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason);
        }
    }

    function beginCameraInteraction(reason) {
        if (VRODOS.editor && typeof VRODOS.editor.beginCameraInteraction === 'function') {
            VRODOS.editor.beginCameraInteraction(reason);
            return;
        }

        requestEditorRender(reason);
    }

    function markCameraInteraction(reason) {
        if (VRODOS.editor && typeof VRODOS.editor.markCameraInteraction === 'function') {
            VRODOS.editor.markCameraInteraction(reason);
            return;
        }

        requestEditorRender(reason);
    }

    function endCameraInteraction(reason) {
        if (VRODOS.editor && typeof VRODOS.editor.endCameraInteraction === 'function') {
            VRODOS.editor.endCameraInteraction(reason);
            return;
        }

        requestEditorRender(reason);
    }

    function isAvatarControlsEnabled() {
        return typeof VRODOS.editor.avatarControlsEnabled !== 'undefined' && VRODOS.editor.avatarControlsEnabled;
    }

    function getActiveEditorCamera() {
        if (this.isAvatarControlsEnabled()) {
            return this.thirdPersonView ? this.cameraThirdPerson : this.cameraAvatar;
        }

        return this.cameraOrbit;
    }

    function updateCompassUI() {
        const compassElement = document.getElementById('scene-editor-compass');
        if (!compassElement) {
            return;
        }

        const needleElement = document.getElementById('scene-editor-compass-needle');
        const activeCamera = this.getActiveEditorCamera();

        if (!activeCamera || !needleElement) {
            return;
        }

        const direction = this.compassDirection;
        activeCamera.getWorldDirection(direction);
        direction.y = 0;

        if (direction.lengthSq() < 1e-6) {
            if (this.lastCompassHeadingDegrees !== 0) {
                this.lastCompassHeadingDegrees = 0;
                needleElement.style.transform = 'rotate(0deg)';
            }
            return;
        }

        direction.normalize();

        const headingRadians = Math.atan2(direction.x, -direction.z);
        const headingDegrees = Number(((THREE.MathUtils.radToDeg(headingRadians) + 360) % 360).toFixed(1));

        if (Number.isFinite(this.lastCompassHeadingDegrees) &&
            Math.abs(headingDegrees - this.lastCompassHeadingDegrees) < 0.1) {
            return;
        }

        this.lastCompassHeadingDegrees = headingDegrees;
        needleElement.style.transform = `rotate(${  headingDegrees.toFixed(1)  }deg)`;
    }

    function setOrbitCamera() {
        this.cameraOrbit3D = new THREE.PerspectiveCamera(
            this.VIEW_ANGLE,
            this.ASPECT,
            this.NEAR,
            this.FAR
        );
        this.cameraOrbit3D.name = 'orbitCamera';
        this.scene.add(this.cameraOrbit3D);

        this.cameraOrbitOrtho3D = new THREE.OrthographicCamera(-1, 1, 1, -1, this.NEAR, this.FAR);
        this.cameraOrbitOrtho3D.name = 'orbitCameraOrtho3D';
        this.scene.add(this.cameraOrbitOrtho3D);

        this.cameraOrbit2D = new THREE.OrthographicCamera(
            this.FRUSTUM_SIZE * this.ASPECT / -2,
            this.FRUSTUM_SIZE * this.ASPECT / 2,
            this.FRUSTUM_SIZE / 2,
            this.FRUSTUM_SIZE / -2,
            0,
            this.FAR
        );
        this.cameraOrbit2D.name = 'orbitCamera2D';
        this.scene.add(this.cameraOrbit2D);

        this.orbitTarget3D = new THREE.Vector3();
        this.orbitTarget2D = new THREE.Vector3();
        this.orbitProjection = 'perspective';
        this.cameraOrbit = this.cameraOrbit3D;
        this.fitCameraToSceneLimits();

        this.orbitControls = new THREE.OrbitControls(this.cameraOrbit, this.renderer.domElement);
        this.orbitControls.userPanSpeed = 1;
        this.orbitControls.enableDamping = false;
        this.orbitControls.dampingFactor = 0;
        this.orbitControls.zoomSpeed = 1.25;
        this.orbitControls.minDistance = 0.05;
        this.orbitControls.minZoom = zoomDefaults.min;
        this.orbitControls.maxZoom = zoomDefaults.max;
        this.orbitControls.enableRotate = true;
        this.orbitControls.target.copy(this.orbitTarget3D);
        this.orbitControls.update();

        this.orbitControls.addEventListener('start', () => beginCameraInteraction('orbit-start'));
        this.orbitControls.addEventListener('change', () => markCameraInteraction('orbit-change'));
        this.orbitControls.addEventListener('end', () => endCameraInteraction('orbit-end'));
    }

    function setAvatarCamera() {
        this.cameraAvatar = new THREE.PerspectiveCamera(
            60,
            this.ASPECT,
            0.1,
            7000
        );
        this.cameraAvatar.name = "avatarCamera";
        this.cameraAvatar.category_name = "avatarYawObject";
        this.cameraAvatar.isSelectableMesh = true;
        this.cameraAvatar.rotation.order = 'YXZ';
        this.cameraAvatar.rotation.y = Math.PI * 2;

        this.audiolistener = new THREE.AudioListener();
        this.cameraAvatar.add(this.audiolistener);
        this.scene.add(this.cameraAvatar);

        this.avatarControls = new THREE.PointerLockControls(this.cameraAvatar, this.renderer.domElement);
        this.avatarControls.name = "avatarControls";

        const avatarControlsYawObject = getPointerLockObject(this.avatarControls);
        if (!avatarControlsYawObject) {
            return;
        }

        this.initAvatarPosition = new THREE.Vector3(0, 0, 0);
        avatarControlsYawObject.position.set(this.initAvatarPosition.x, this.initAvatarPosition.y, this.initAvatarPosition.z);
        this.scene.add(avatarControlsYawObject);

        this.cameraThirdPerson = new THREE.PerspectiveCamera(
            this.VIEW_ANGLE,
            this.ASPECT,
            cameraDefaults.near,
            cameraDefaults.thirdPersonFar
        );
        this.cameraThirdPerson.position.set(0, 4, 5);
        this.cameraThirdPerson.rotation.x = -0.2;
        this.cameraThirdPerson.name = "cameraThirdPerson";

        avatarControlsYawObject.add(this.cameraThirdPerson);
    }

    function fitCameraToSceneLimits() {
        if (!this.cameraOrbit3D || !this.cameraOrbitOrtho3D || !this.cameraOrbit2D) {
            return;
        }

        this.updateScreenMetrics();
        const center = new THREE.Vector3(this.SCENE_CENTER_X, this.SCENE_CENTER_Y, this.SCENE_CENTER_Z);
        const surface = Math.max(this.SCENE_DIMENSION_SURFACE || 0, 10);
        const height = Math.max(this.SCENE_DIMENSION_HEIGHT || 0, 1);
        const distance = perspectiveFitDistance.call(this, new THREE.Vector3(surface, height, surface));

        this.orbitTarget3D.copy(center);
        this.cameraOrbit3D.position.copy(center).add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(distance));
        this.cameraOrbit3D.lookAt(center);
        this.cameraOrbit3D.updateProjectionMatrix();

        this.cameraOrbitOrtho3D.position.copy(this.cameraOrbit3D.position);
        this.cameraOrbitOrtho3D.lookAt(center);
        setOrtho3DVisibleHeight(this.cameraOrbitOrtho3D, 2 * distance * Math.tan(THREE.MathUtils.degToRad(this.VIEW_ANGLE) / 2), this.ASPECT);
        this.cameraOrbitOrtho3D.zoom = 1;
        this.cameraOrbitOrtho3D.updateProjectionMatrix();

        this.orbitTarget2D.copy(center);
        this.cameraOrbit2D.left = this.FRUSTUM_SIZE * this.ASPECT / -2;
        this.cameraOrbit2D.right = this.FRUSTUM_SIZE * this.ASPECT / 2;
        this.cameraOrbit2D.position.set(center.x, center.y + this.FRUSTUM_SIZE, center.z);
        this.cameraOrbit2D.zoom = VRODOS.utils.orthoFitZoom(
            this.FRUSTUM_SIZE, this.ASPECT, surface
        );
        this.cameraOrbit2D.updateProjectionMatrix();

        if (this.orbitControls) {
            this.orbitControls.target.copy(this.is2d ? this.orbitTarget2D : this.orbitTarget3D);
            this.orbitControls.update();
        }
    }

    function perspectiveFitDistance(size) {
        const radius = Math.max(size.length() / 2, 1);
        const verticalFov = THREE.MathUtils.degToRad(this.VIEW_ANGLE);
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(this.ASPECT, 0.1));
        return radius * 1.3 / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
    }

    function setOrtho3DVisibleHeight(camera, visibleHeight, aspect) {
        const halfHeight = Math.max(visibleHeight, 0.01) / 2;
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
    }

    function setOrbitZoomLimits() {
        if (!this.orbitControls) return;
        this.orbitControls.minZoom = this.is2d ? zoomDefaults.min : 0.05;
        this.orbitControls.maxZoom = this.is2d ? zoomDefaults.max : 1000;
    }

    function setOrbitProjection(mode) {
        if (!this.orbitControls || this.is2d || !['perspective', 'orthographic'].includes(mode)) return false;
        if (this.orbitProjection === mode) return true;

        const target = this.orbitControls.target;
        const source = this.cameraOrbit;
        const offset = new THREE.Vector3().subVectors(source.position, target);
        if (offset.lengthSq() < 0.000001) offset.set(1, 1, 1);
        const fovFactor = 2 * Math.tan(THREE.MathUtils.degToRad(this.VIEW_ANGLE) / 2);

        if (mode === 'orthographic') {
            const camera = this.cameraOrbitOrtho3D;
            camera.position.copy(source.position);
            camera.quaternion.copy(source.quaternion);
            setOrtho3DVisibleHeight(camera, offset.length() * fovFactor, this.ASPECT);
            camera.zoom = 1;
            camera.updateProjectionMatrix();
            this.cameraOrbit = camera;
        } else {
            const camera = this.cameraOrbit3D;
            const visibleHeight = (source.top - source.bottom) / source.zoom;
            camera.position.copy(target).add(offset.normalize().multiplyScalar(visibleHeight / fovFactor));
            camera.quaternion.copy(source.quaternion);
            camera.updateProjectionMatrix();
            this.cameraOrbit = camera;
        }

        this.orbitProjection = mode;
        this.orbitTarget3D.copy(target);
        this.orbitControls.object = this.cameraOrbit;
        setOrbitZoomLimits.call(this);
        this.orbitControls.update();
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setCamera === 'function') {
            VRODOS.editor.transforms.setCamera(this.cameraOrbit);
        }
        requestEditorRender('orbit-projection-change');
        return true;
    }

    function setOrbitCameraMode(is2d) {
        if (!this.orbitControls) return;

        if (this.cameraOrbit === this.cameraOrbit2D) {
            this.orbitTarget2D.copy(this.orbitControls.target);
        } else {
            this.orbitTarget3D.copy(this.orbitControls.target);
        }

        this.is2d = Boolean(is2d);
        this.cameraOrbit = this.is2d ? this.cameraOrbit2D : (this.orbitProjection === 'orthographic' ? this.cameraOrbitOrtho3D : this.cameraOrbit3D);
        this.orbitControls.object = this.cameraOrbit;
        this.orbitControls.target.copy(this.is2d ? this.orbitTarget2D : this.orbitTarget3D);
        this.orbitControls.enableRotate = !this.is2d;
        setOrbitZoomLimits.call(this);
        this.orbitControls.update();

        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setCamera === 'function') {
            VRODOS.editor.transforms.setCamera(this.cameraOrbit);
        }
    }

    function panOrbitOnGround(horizontal, depth) {
        if (!this.orbitControls || !this.orbitControls.enabled || !this.cameraOrbit) return;

        const camera = this.cameraOrbit;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() < 0.000001) {
            forward.set(0, 1, 0).applyQuaternion(camera.quaternion);
            forward.y = 0;
        }
        forward.normalize();

        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        const distance = camera.position.distanceTo(this.orbitControls.target);
        const visibleHeight = camera.isOrthographicCamera
            ? (camera.top - camera.bottom) / camera.zoom
            : 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        const step = Math.max(0.05, visibleHeight * 0.04);
        const offset = right.multiplyScalar(horizontal).addScaledVector(forward, depth).normalize().multiplyScalar(step);

        camera.position.add(offset);
        this.orbitControls.target.add(offset);
        (this.is2d ? this.orbitTarget2D : this.orbitTarget3D).copy(this.orbitControls.target);
        this.orbitControls.update();
        requestEditorRender('orbit-keyboard-pan');
    }

    function getObjectFocus(object) {
        object.updateWorldMatrix(true, true);
        const registry = VRODOS.editor.sceneRegistry;
        const bounds = registry && typeof registry.getBounds === 'function'
            ? registry.getBounds(object)
            : new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3(1, 1, 1);

        if (bounds && !bounds.isEmpty()) {
            bounds.getCenter(center);
            bounds.getSize(size);
        } else {
            object.getWorldPosition(center);
        }

        return { center, size };
    }

    function centerOrbitOnObject(object) {
        if (!object || !this.orbitControls || !this.cameraOrbit3D || !this.cameraOrbitOrtho3D || !this.cameraOrbit2D) return;

        const { center } = getObjectFocus(object);
        centerOrbitAt.call(this, center);
        requestEditorRender('selection-camera-focus');
    }

    function centerOrbitAt(center) {
        const activeTarget = this.is2d ? this.orbitTarget2D : this.orbitTarget3D;
        activeTarget.copy(this.orbitControls.target);

        this.cameraOrbit3D.position.add(new THREE.Vector3().subVectors(center, this.orbitTarget3D));
        this.cameraOrbitOrtho3D.position.add(new THREE.Vector3().subVectors(center, this.orbitTarget3D));
        this.cameraOrbit2D.position.add(new THREE.Vector3().subVectors(center, this.orbitTarget2D));
        this.orbitTarget3D.copy(center);
        this.orbitTarget2D.copy(center);
        this.orbitControls.target.copy(center);
        this.orbitControls.update();
    }

    function frameOrbitObject(object) {
        if (!object || !this.orbitControls) return;

        const { center, size } = getObjectFocus(object);
        centerOrbitAt.call(this, center);
        const camera = this.cameraOrbit;
        const currentOffset = new THREE.Vector3().subVectors(camera.position, center);

        if (this.is2d) {
            camera.position.set(center.x, center.y + this.FRUSTUM_SIZE, center.z);
            camera.zoom = VRODOS.utils.orthoFitZoom(
                this.FRUSTUM_SIZE, this.ASPECT, Math.max(size.x, size.y, size.z, 1) * 2.4
            );
            camera.updateProjectionMatrix();
        } else if (camera.isOrthographicCamera) {
            const visibleHeight = 2 * perspectiveFitDistance.call(this, size) * Math.tan(THREE.MathUtils.degToRad(this.VIEW_ANGLE) / 2);
            camera.zoom = THREE.MathUtils.clamp((camera.top - camera.bottom) / visibleHeight, 0.05, 1000);
            camera.updateProjectionMatrix();
        } else {
            if (currentOffset.lengthSq() < 0.000001) currentOffset.set(1, 1, 1);
            camera.position.copy(center).add(currentOffset.normalize().multiplyScalar(perspectiveFitDistance.call(this, size)));
        }

        this.orbitControls.update();
        requestEditorRender('object-framed');
    }

    VRODOS.editorRender.installCameraMethods = function(prototype) {
        if (!prototype) return;

        prototype.isAvatarControlsEnabled = isAvatarControlsEnabled;
        prototype.getActiveEditorCamera = getActiveEditorCamera;
        prototype.updateCompassUI = updateCompassUI;
        prototype.setOrbitCamera = setOrbitCamera;
        prototype.setAvatarCamera = setAvatarCamera;
        prototype.fitCameraToSceneLimits = fitCameraToSceneLimits;
        prototype.setOrbitCameraMode = setOrbitCameraMode;
        prototype.setOrbitProjection = setOrbitProjection;
        prototype.panOrbitOnGround = panOrbitOnGround;
        prototype.centerOrbitOnObject = centerOrbitOnObject;
        prototype.frameOrbitObject = frameOrbitObject;
    };
})();
