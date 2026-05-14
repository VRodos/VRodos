'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosEditorShellUi() {
    const shellUi = VRODOS.ui.editorShell || {
        isBound: false,

        bind() {
            if (this.isBound) {
                return true;
            }

            bindHierarchyToggle();
            bindAssetBrowserToggle();
            bindClearVisionToggle();

            this.isBound = true;
            return true;
        }
    };

    function bindHierarchyToggle() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!target || typeof target.closest !== 'function') return;

            const button = target.closest('#bt_close_hierarchy_toolbar');
            if (!button) return;

            event.preventDefault();

            const panel = document.getElementById('right-elements-panel');
            const compass = document.getElementById('scene-editor-compass');
            if (!panel) return;

            if (button.classList.contains('HierarchyToggleOn')) {
                button.classList.add('HierarchyToggleOff');
                button.classList.remove('HierarchyToggleOn');
                button.dataset.toggle = 'off';
                VRODOS.ui.swapLucideIcon(button, 'chevron-left');
                panel.classList.add('closed');
                if (compass) compass.classList.add('panel-closed');
            } else {
                button.classList.add('HierarchyToggleOn');
                button.classList.remove('HierarchyToggleOff');
                button.dataset.toggle = 'on';
                VRODOS.ui.swapLucideIcon(button, 'chevron-right');
                panel.classList.remove('closed');
                if (compass) compass.classList.remove('panel-closed');
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    function bindAssetBrowserToggle() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!target || typeof target.closest !== 'function') return;

            const button = target.closest('#bt_close_file_toolbar');
            if (!button) return;

            event.preventDefault();

            const toolbar = document.getElementById('assetBrowserToolbar');
            if (!toolbar) return;

            if (button.classList.contains('AssetsToggleOn')) {
                button.classList.add('AssetsToggleOff');
                button.classList.remove('AssetsToggleOn');
                button.dataset.toggle = 'off';
                VRODOS.ui.swapLucideIcon(button, 'chevron-right');
                toolbar.classList.add('closed');
            } else {
                button.classList.add('AssetsToggleOn');
                button.classList.remove('AssetsToggleOff');
                button.dataset.toggle = 'on';
                VRODOS.ui.swapLucideIcon(button, 'chevron-left');
                toolbar.classList.remove('closed');
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    function bindClearVisionToggle() {
        const toggleButton = document.getElementById('toggleUIBtn');
        if (!toggleButton) {
            return;
        }

        const elementsToToggle = [
            document.getElementById('right-elements-panel'),
            document.getElementById('scene-editor-compass'),
            document.getElementById('object-controls-panel'),
            document.querySelector('.environmentBar'),
            document.getElementById('scenesInsideVREditor'),
            document.getElementById('assetBrowserToolbar'),
            document.getElementById('bt_close_file_toolbar'),
            document.querySelector('.HierarchyToggleStyle'),
            document.getElementById('scenesList-toggle-btn')
        ].filter(Boolean);

        toggleButton.addEventListener('click', function() {
            const isHiding = this.dataset.toggle === 'on';

            if (isHiding) {
                hideEditorChrome(this, elementsToToggle);
            } else {
                showEditorChrome(this, elementsToToggle);
            }

            if (VRODOS.editor.envir && VRODOS.editor.envir.turboResize) {
                VRODOS.editor.envir.turboResize();
            }
        });
    }

    function hideEditorChrome(button, elementsToToggle) {
        button.classList.add('tw-opacity-40');
        VRODOS.ui.swapLucideIcon(button, 'eye-off');
        button.dataset.toggle = 'off';

        elementsToToggle.forEach((element) => element.style.setProperty('display', 'none', 'important'));

        if (VRODOS.editor.transforms) VRODOS.editor.transforms.setVisible(false);
        if (VRODOS.editor.envir && VRODOS.editor.envir.getDirectorRig()) VRODOS.editor.envir.getDirectorRig().visible = false;
        if (VRODOS.editor.envir && VRODOS.editor.envir.gridHelper) VRODOS.editor.envir.gridHelper.visible = false;
        if (VRODOS.editor.envir && VRODOS.editor.envir.axesHelper) VRODOS.editor.envir.axesHelper.visible = false;
        if (typeof VRODOS.ui.removeAllCelOutlines === 'function') VRODOS.ui.removeAllCelOutlines();
        VRODOS.ui.setVisiblityLightHelpingElements(false);
    }

    function showEditorChrome(button, elementsToToggle) {
        button.classList.remove('tw-opacity-40');
        VRODOS.ui.swapLucideIcon(button, 'eye');
        button.dataset.toggle = 'on';

        elementsToToggle.forEach((element) => {
            element.style.removeProperty('display');
        });

        if (VRODOS.editor.transforms) VRODOS.editor.transforms.setVisible(true);
        if (VRODOS.editor.envir && VRODOS.editor.envir.gridHelper) VRODOS.editor.envir.gridHelper.visible = true;
        if (VRODOS.editor.envir && VRODOS.editor.envir.axesHelper) VRODOS.editor.envir.axesHelper.visible = true;

        const selectedObject = VRODOS.editor.transforms ? VRODOS.editor.transforms.getRealObject() : null;
        if (selectedObject && typeof VRODOS.ui.addCelOutline === 'function') {
            VRODOS.ui.addCelOutline(selectedObject);
        }

        VRODOS.ui.setVisiblityLightHelpingElements(true);

        if (!VRODOS.editor.envir || !VRODOS.editor.envir.getDirectorRig()) return;

        if (VRODOS.editor.envir.thirdPersonView || VRODOS.editor.avatarControlsEnabled) {
            VRODOS.editor.envir.getDirectorRig().visible = false;
        } else {
            VRODOS.editor.envir.getDirectorRig().visible = true;
        }
    }

    VRODOS.ui.setVisiblityLightHelpingElements = function(statusVisibility) {
        if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) {
            return;
        }

        VRODOS.editor.envir.scene.traverse((currentObject) => {
            if (!currentObject) return;

            if (currentObject.category_name === 'lightHelper' || currentObject.category_name === 'lightTargetSpot') {
                currentObject.visible = statusVisibility;
            }

            if (
                (
                    currentObject.category_name === 'lightSun' ||
                    currentObject.category_name === 'lightLamp' ||
                    currentObject.category_name === 'lightSpot'
                ) &&
                currentObject.children[0]
            ) {
                currentObject.children[0].visible = statusVisibility;
            }

            if (currentObject.type === 'CameraHelper') {
                currentObject.visible = statusVisibility;
            }
        });
    };

    VRODOS.ui.editorShell = shellUi;
    VRODOS.ui.bindEditorShellControls = function() {
        return shellUi.bind();
    };
})();
