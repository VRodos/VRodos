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
            this.VIEW_ANGLE,
            this.ASPECT,
            cameraDefaults.near,
            cameraDefaults.avatarFar
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
        if (!this.cameraOrbit3D || !this.cameraOrbit2D) {
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

    function setOrbitCameraMode(is2d) {
        if (!this.orbitControls) return;

        if (this.cameraOrbit === this.cameraOrbit2D) {
            this.orbitTarget2D.copy(this.orbitControls.target);
        } else {
            this.orbitTarget3D.copy(this.orbitControls.target);
        }

        this.is2d = Boolean(is2d);
        this.cameraOrbit = this.is2d ? this.cameraOrbit2D : this.cameraOrbit3D;
        this.orbitControls.object = this.cameraOrbit;
        this.orbitControls.target.copy(this.is2d ? this.orbitTarget2D : this.orbitTarget3D);
        this.orbitControls.enableRotate = !this.is2d;
        this.orbitControls.update();

        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setCamera === 'function') {
            VRODOS.editor.transforms.setCamera(this.cameraOrbit);
        }
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
        if (!object || !this.orbitControls || !this.cameraOrbit3D || !this.cameraOrbit2D) return;

        const { center } = getObjectFocus(object);
        centerOrbitAt.call(this, center);
        requestEditorRender('selection-camera-focus');
    }

    function centerOrbitAt(center) {
        const activeTarget = this.is2d ? this.orbitTarget2D : this.orbitTarget3D;
        activeTarget.copy(this.orbitControls.target);

        this.cameraOrbit3D.position.add(new THREE.Vector3().subVectors(center, this.orbitTarget3D));
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
        prototype.centerOrbitOnObject = centerOrbitOnObject;
        prototype.frameOrbitObject = frameOrbitObject;
    };
})();
