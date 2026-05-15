"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};

VRODOS.loader.LightsPawnLoader = class {
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

            if (VRODOS.loader.handleResourceMetadata(name, resource, resources3D)) continue;

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
