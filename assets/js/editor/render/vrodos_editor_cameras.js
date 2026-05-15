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
            needleElement.style.transform = 'rotate(0deg)';
            return;
        }

        direction.normalize();

        const headingRadians = Math.atan2(direction.x, -direction.z);
        const headingDegrees = (THREE.MathUtils.radToDeg(headingRadians) + 360) % 360;

        needleElement.style.transform = `rotate(${  headingDegrees.toFixed(2)  }deg)`;
    }

    function setOrbitCamera() {
        this.cameraOrbit = new THREE.OrthographicCamera(
            this.FRUSTUM_SIZE * this.ASPECT / -2,
            this.FRUSTUM_SIZE * this.ASPECT / 2,
            this.FRUSTUM_SIZE / 2,
            this.FRUSTUM_SIZE / -2,
            0,
            this.FAR
        );

        this.cameraOrbit.name = "orbitCamera";
        this.scene.add(this.cameraOrbit);
        this.cameraOrbit.position.set(0, this.FRUSTUM_SIZE, 0);

        this.orbitControls = new THREE.OrbitControls(this.cameraOrbit, this.renderer.domElement);
        this.orbitControls.userPanSpeed = 1;
        this.orbitControls.enableDamping = false;
        this.orbitControls.dampingFactor = 0;
        this.orbitControls.zoomSpeed = 1.25;
        this.orbitControls.object.zoom = 1;
        this.orbitControls.minZoom = 1;
        this.orbitControls.maxZoom = 10000;
        this.orbitControls.enableRotate = true;

        this.orbitControls.addEventListener('change', () => {
            if (VRODOS.ui.transform && typeof VRODOS.ui.transform.setSize === 'function') {
                VRODOS.ui.transform.setSize();
            }
            requestEditorRender('orbit-change');
        });
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
        if (!this.cameraOrbit) {
            return;
        }

        if (this.cameraOrbit.type === 'OrthographicCamera') {
            this.updateScreenMetrics();
            this.cameraOrbit.left = this.FRUSTUM_SIZE * this.ASPECT / -2;
            this.cameraOrbit.right = this.FRUSTUM_SIZE * this.ASPECT / 2;
            this.cameraOrbit.zoom = VRODOS.utils.orthoFitZoom(
                this.FRUSTUM_SIZE,
                this.ASPECT,
                this.SCENE_DIMENSION_SURFACE
            );
        }

        if (this.is2d) {
            this.cameraOrbit.position.set(this.SCENE_CENTER_X, this.FRUSTUM_SIZE, this.SCENE_CENTER_Z);
        } else {
            this.cameraOrbit.position.set(
                this.SCENE_CENTER_X + this.FRUSTUM_SIZE,
                this.FRUSTUM_SIZE,
                this.SCENE_CENTER_Z + this.FRUSTUM_SIZE
            );
        }

        if (this.orbitControls) {
            this.orbitControls.target.set(this.SCENE_CENTER_X, this.SCENE_CENTER_Y, this.SCENE_CENTER_Z);
            this.orbitControls.update();
        }

        this.cameraOrbit.zoom = VRODOS.utils.clampNumber(
            this.cameraOrbit.zoom,
            zoomDefaults.min,
            zoomDefaults.max,
            zoomDefaults.fallback
        );
        this.cameraOrbit.updateProjectionMatrix();
    }

    VRODOS.editorRender.installCameraMethods = function(prototype) {
        if (!prototype) return;

        prototype.isAvatarControlsEnabled = isAvatarControlsEnabled;
        prototype.getActiveEditorCamera = getActiveEditorCamera;
        prototype.updateCompassUI = updateCompassUI;
        prototype.setOrbitCamera = setOrbitCamera;
        prototype.setAvatarCamera = setAvatarCamera;
        prototype.fitCameraToSceneLimits = fitCameraToSceneLimits;
    };
})();
