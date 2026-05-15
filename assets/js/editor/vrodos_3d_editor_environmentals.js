"use strict";

class vrodos_3d_editor_environmentals {

    constructor(vr_editor_main_div) {
        this.initializeEnvironment(vr_editor_main_div);
    }

}

VRODOS.editorRender.installPerformanceProfileMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installRendererLifecycleMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installCameraMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installDirectorHelperMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installSceneEnvironmentMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installEnvironmentBootstrapMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editor.Environmentals = vrodos_3d_editor_environmentals;
