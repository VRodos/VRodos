"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};
VRODOS.data = VRODOS.data || {};

(function initVrodosEditorSceneEnvironment() {
    const sceneDefaults = VRODOS.editorRender.sceneDefaults;
    const resolveBaseUrl = VRODOS.editorRender.resolveBaseUrl;

    function createEditorScene() {
        this.scene = new THREE.Scene();
        this.scene.name = "vrodosScene";
        this.bindDirectorGroundGuideSceneMutationHooks();
        this.loadSceneEnvironmentTexture();
    }

    function addEditorSceneHelpers() {
        this.gridHelper = new THREE.GridHelper(
            sceneDefaults.gridSize,
            sceneDefaults.gridDivisions
        );
        this.gridHelper.name = "myGridHelper";
        this.scene.add(this.gridHelper);
        this.gridHelper.visible = true;

        this.axesHelper = new THREE.AxesHelper(sceneDefaults.axesSize);
        this.axesHelper.name = "myAxisHelper";
        this.scene.add(this.axesHelper);
        this.axesHelper.visible = true;
    }

    function loadSceneEnvironmentTexture() {
        const imageBaseUrl = resolveBaseUrl(VRODOS.data.pluginPath, 'imageBaseUrl', 'assets/images/');
        const hdrLoader = new THREE.HDRLoader();

        hdrLoader.setPath(`${imageBaseUrl  }hdr/`)
            .load('Stonewall_Ref.hdr', (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.maintexture = texture;
                this.scene.environment = this.maintexture;
            });
    }

    VRODOS.editorRender.installSceneEnvironmentMethods = function(prototype) {
        if (!prototype) return;

        prototype.createEditorScene = createEditorScene;
        prototype.addEditorSceneHelpers = addEditorSceneHelpers;
        prototype.loadSceneEnvironmentTexture = loadSceneEnvironmentTexture;
    };
})();
