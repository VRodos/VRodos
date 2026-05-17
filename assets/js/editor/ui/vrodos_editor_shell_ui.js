'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosEditorShellUi() {
    const SHELL_IDS = {
        hierarchyToggle: 'bt_close_hierarchy_toolbar',
        hierarchyPanel: 'right-elements-panel',
        compass: 'scene-editor-compass',
        assetBrowserToggle: 'bt_close_file_toolbar',
        assetBrowserToolbar: 'assetBrowserToolbar',
        clearVisionToggle: 'toggleUIBtn',
        scenesPanel: 'scenesInsideVREditor',
        sceneListToggle: 'scenesList-toggle-btn',
        objectControlsPanel: 'object-controls-panel'
    };

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

    function getElement(id) {
        return document.getElementById(id);
    }

    function queryElement(selector) {
        return document.querySelector(selector);
    }

    function closestTarget(event, selector) {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return null;
        return target.closest(selector);
    }

    function refreshLucideIcons() {
        VRODOS.ui.refreshLucideIcons();
    }

    function swapIcon(button, iconName) {
        if (typeof VRODOS.ui.swapLucideIcon === 'function') {
            VRODOS.ui.swapLucideIcon(button, iconName);
        }
    }

    function requestShellRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'editor-shell');
        }
    }

    function getEnvir() {
        return VRODOS.editor.envir || null;
    }

    function getDirectorRig(envir) {
        return envir && typeof envir.getDirectorRig === 'function' ? envir.getDirectorRig() : null;
    }

    function setTwoStateButton(button, isOn, onClass, offClass, onIcon, offIcon) {
        button.classList.toggle(onClass, isOn);
        button.classList.toggle(offClass, !isOn);
        button.dataset.toggle = isOn ? 'on' : 'off';
        swapIcon(button, isOn ? onIcon : offIcon);
    }

    function setClosedClass(element, isClosed) {
        if (element) {
            element.classList.toggle('closed', Boolean(isClosed));
        }
    }

    function setCompassPanelClosed(compass, isClosed) {
        if (compass) {
            compass.classList.toggle('panel-closed', Boolean(isClosed));
        }
    }

    function bindHierarchyToggle() {
        document.addEventListener('click', (event) => {
            const button = closestTarget(event, `#${SHELL_IDS.hierarchyToggle}`);
            if (!button) return;

            event.preventDefault();

            const panel = getElement(SHELL_IDS.hierarchyPanel);
            const compass = getElement(SHELL_IDS.compass);
            if (!panel) return;

            const shouldOpen = !button.classList.contains('HierarchyToggleOn');
            setTwoStateButton(button, shouldOpen, 'HierarchyToggleOn', 'HierarchyToggleOff', 'chevron-right', 'chevron-left');
            setClosedClass(panel, !shouldOpen);
            setCompassPanelClosed(compass, !shouldOpen);
            refreshLucideIcons();
        });
    }

    function bindAssetBrowserToggle() {
        document.addEventListener('click', (event) => {
            const button = closestTarget(event, `#${SHELL_IDS.assetBrowserToggle}`);
            if (!button) return;

            event.preventDefault();

            const toolbar = getElement(SHELL_IDS.assetBrowserToolbar);
            if (!toolbar) return;

            const shouldOpen = !button.classList.contains('AssetsToggleOn');
            setTwoStateButton(button, shouldOpen, 'AssetsToggleOn', 'AssetsToggleOff', 'chevron-left', 'chevron-right');
            setClosedClass(toolbar, !shouldOpen);
            refreshLucideIcons();
        });
    }

    function bindClearVisionToggle() {
        const toggleButton = getElement(SHELL_IDS.clearVisionToggle);
        if (!toggleButton) {
            return;
        }

        const elementsToToggle = [
            getElement(SHELL_IDS.hierarchyPanel),
            getElement(SHELL_IDS.compass),
            getElement(SHELL_IDS.objectControlsPanel),
            queryElement('.environmentBar'),
            getElement(SHELL_IDS.scenesPanel),
            getElement(SHELL_IDS.assetBrowserToolbar),
            getElement(SHELL_IDS.assetBrowserToggle),
            queryElement('.HierarchyToggleStyle'),
            getElement(SHELL_IDS.sceneListToggle)
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
            requestShellRender('clear-vision-toggle');
        });
    }

    function setElementsDisplayHidden(elements, isHidden) {
        elements.forEach((element) => {
            if (isHidden) {
                element.style.setProperty('display', 'none', 'important');
                return;
            }

            element.style.removeProperty('display');
        });
    }

    function setCoreEditorHelpersVisible(isVisible) {
        const envir = getEnvir();
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setVisible === 'function') {
            VRODOS.editor.transforms.setVisible(isVisible);
        }
        if (envir && envir.gridHelper) envir.gridHelper.visible = isVisible;
        if (envir && envir.axesHelper) envir.axesHelper.visible = isVisible;
    }

    function hideEditorChrome(button, elementsToToggle) {
        button.classList.add('tw-opacity-40');
        swapIcon(button, 'eye-off');
        button.dataset.toggle = 'off';

        setElementsDisplayHidden(elementsToToggle, true);

        setCoreEditorHelpersVisible(false);
        const rig = getDirectorRig(getEnvir());
        if (rig) rig.visible = false;
        if (typeof VRODOS.ui.removeAllCelOutlines === 'function') VRODOS.ui.removeAllCelOutlines();
        VRODOS.ui.setVisiblityLightHelpingElements(false);
    }

    function showEditorChrome(button, elementsToToggle) {
        button.classList.remove('tw-opacity-40');
        swapIcon(button, 'eye');
        button.dataset.toggle = 'on';

        setElementsDisplayHidden(elementsToToggle, false);

        setCoreEditorHelpersVisible(true);

        const selectedObject = VRODOS.editor.transforms ? VRODOS.editor.transforms.getRealObject() : null;
        if (selectedObject && typeof VRODOS.ui.addCelOutline === 'function') {
            VRODOS.ui.addCelOutline(selectedObject);
        }

        VRODOS.ui.setVisiblityLightHelpingElements(true);

        const envir = getEnvir();
        const rig = getDirectorRig(envir);
        if (!envir || !rig) return;

        if (envir.thirdPersonView || VRODOS.editor.avatarControlsEnabled) {
            rig.visible = false;
        } else {
            rig.visible = true;
        }
    }

    function getLightHelperVisibilityTargets() {
        const targets = new Set();
        const envir = VRODOS.editor.envir || null;
        const scene = envir ? envir.scene : null;
        const registry = VRODOS.editor.sceneRegistry || null;
        const selectableRoots = registry && typeof registry.getSelectableRoots === 'function'
            ? registry.getSelectableRoots({ rebuildIfEmpty: false })
            : [];

        function addLightVisibilityTarget(currentObject) {
            if (!currentObject) return;

            const category = currentObject.category_name || '';
            if (category === 'lightHelper' || category === 'lightTargetSpot' || currentObject.type === 'CameraHelper') {
                targets.add(currentObject);
                return;
            }

            if (
                (
                    category === 'lightSun' ||
                    category === 'lightLamp' ||
                    category === 'lightSpot'
                ) &&
                currentObject.children[0]
            ) {
                targets.add(currentObject.children[0]);
            }
        }

        selectableRoots.forEach(addLightVisibilityTarget);

        if (scene && Array.isArray(scene.children)) {
            scene.children.forEach(addLightVisibilityTarget);
        }

        return Array.from(targets);
    }

    VRODOS.ui.setVisiblityLightHelpingElements = function(statusVisibility) {
        if (!VRODOS.editor.envir) {
            return;
        }

        getLightHelperVisibilityTargets().forEach((currentObject) => {
            currentObject.visible = statusVisibility;
        });
    };

    VRODOS.ui.editorShell = shellUi;
    VRODOS.ui.bindEditorShellControls = function() {
        return shellUi.bind();
    };
})();
