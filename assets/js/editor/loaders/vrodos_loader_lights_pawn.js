"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};

VRODOS.loader.LightsPawnLoader = class {

    /**
     * Update visibility of fog-related UI elements.
     */
    updateFogUI(fogCategory) {
        const linearElems = document.getElementsByClassName('linearElement');
        const expoElems = document.getElementsByClassName('exponentialElement');
        const colorElems = document.getElementsByClassName('colorElement');
        const fogValues = document.getElementById("FogValues");

        const isLinear = String(fogCategory) === '1';
        const isExponential = String(fogCategory) === '2';
        const isNone = String(fogCategory) === '0';

        if (fogValues) fogValues.style.display = isNone ? "none" : "flex";

        for (const el of linearElems) el.style.display = isLinear ? "flex" : "none";
        for (const el of expoElems) el.style.display = isExponential ? "flex" : "none";
        for (const el of colorElems) el.style.display = isNone ? "none" : "flex";

        const radioMap = { '0': 'RadioNoFog', '1': 'RadioLinearFog', '2': 'RadioExponentialFog' };
        if (radioMap[fogCategory]) {
            const radio = document.getElementById(radioMap[fogCategory]);
            if (radio) radio.checked = true;
        }
    }

    /**
     * Main load entry point for lights and pawns.
     */
    load(resources3D, providedPath, manager) {
        if (!resources3D) return Promise.allSettled([]);
        const pendingLoads = [];
        
        // Use provided path or fallback to global VRODOS.data.pluginPath
        const finalPath = providedPath || ((VRODOS.data && typeof VRODOS.data.pluginPath !== 'undefined') ? VRODOS.data.pluginPath : '');

        for (const name in resources3D) {
            if (!Object.prototype.hasOwnProperty.call(resources3D, name)) continue;
            const resource = resources3D[name];

            // 1. Recursive handling for nested objects
            if (name === 'objects' && typeof resource === 'object') {
                pendingLoads.push(this.load(resource, finalPath, manager));
                continue;
            }

            // 2. Handle Special Scene Keys (Metadata)
            if (name === 'SceneSettings') {
                this.processSceneSettings(resource);
                continue;
            }

            // Restore Director/Camera position
            if (name === 'cameraCoords' && typeof resource === 'object') {
                if (typeof VRODOS.editor.envir !== 'undefined' && typeof VRODOS.editor.envir.applyDirectorTransform === 'function') {
                    VRODOS.editor.envir.applyDirectorTransform(resource.position, resource.rotation);
                }
                continue;
            }

            // Fallback for flat metadata (backward compatibility)
            if (name === 'fogCategory' || name === 'fogcolor' || name === 'fognear' || name === 'fogfar' || name === 'fogdensity') {
               this.processSceneSettings(resources3D);
               continue;
            }

            if (name === 'ClearColor') {
                if (VRODOS.editor.envir?.scene) {
                    VRODOS.editor.envir.scene.background = new THREE.Color(resource);
                }
                ['sceneClearColor', 'jscolorpick'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = resource;
                });
                continue;
            }

            // 3. Filter for Lights and Pawns
            const category = resource && resource.category_name;
            if (!category || (!category.startsWith("light") && !category.startsWith("pawn"))) {
                continue;
            }

            // 4. Dispatch to Category Handlers
            const pendingLoad = this.dispatchToHandlers(name, resource, finalPath, category, manager);
            if (pendingLoad) {
                pendingLoads.push(pendingLoad);
            }
        }

        return Promise.allSettled(pendingLoads);
    }

    processSceneSettings(settings) {
        if (!settings) return;

        // Populate UI fields
        const fields = { 
            'FogNear': 'fognear', 'FogFar': 'fogfar', 
            'FogDensity': 'fogdensity' 
        };
        Object.entries(fields).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el && settings[key] !== undefined) el.value = parseFloat(settings[key]);
        });

        // Sync Fog Type
        if (settings.fogtype) {
            const fogTypeInput = document.getElementById('FogType');
            if (fogTypeInput) fogTypeInput.value = settings.fogtype;
        }

        // Sync Color Picker
        if (settings.fogcolor) {
            const fcolor = settings.fogcolor;
            const colorValue = fcolor.startsWith('#') ? fcolor : `#${fcolor}`;
            const picker = document.getElementById('jscolorpickFog');
            if (picker) {
                picker.value = colorValue;
            }
        }

        // Update Visibility & Radio buttons
        if (settings.fogCategory !== undefined) {
            this.updateFogUI(settings.fogCategory);
        }
        
        // Apply to THREE.js Scene
        if (typeof VRODOS.ui.updateFog === 'function') {
            VRODOS.ui.updateFog("loading");
        }
    }

    dispatchToHandlers(name, resource, finalPath, category, manager) {
        if (category.startsWith("light")) {
            VRODOS.loader.loadLightAsset(name, resource, category);
            return null;
        }

        if (category === 'pawn') {
            return VRODOS.loader.loadPawnAsset(name, resource, finalPath, manager);
        }

        return null;
    }
};
