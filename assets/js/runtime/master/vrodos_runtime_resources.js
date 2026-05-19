/**
 * Runtime resource disposal helpers for compiled scenes.
 */
window.VRODOSMaster = window.VRODOSMaster || {};

(function () {
    const Master = window.VRODOSMaster;
    if (!Master.RuntimeResources) {
        Master.RuntimeResources = {};
    }
    const Resources = Master.RuntimeResources;

    function disposeOne(resource) {
        if (!resource) {
            return;
        }

        if (Array.isArray(resource)) {
            resource.forEach(disposeOne);
            return;
        }

        if (resource.geometry) {
            disposeOne(resource.geometry);
        }

        if (Array.isArray(resource.material)) {
            resource.material.forEach(disposeOne);
        } else if (resource.material) {
            disposeOne(resource.material);
        }

        if (typeof resource.dispose === 'function') {
            resource.dispose();
        }
    }

    Resources.dispose = disposeOne;

    Resources.createRegistry = function () {
        const resources = [];
        const listeners = [];

        return {
            track: function (resource) {
                if (resource) {
                    resources.push(resource);
                }
                return resource;
            },
            listen: function (target, type, handler, options) {
                if (!target || typeof target.addEventListener !== 'function') {
                    return;
                }
                target.addEventListener(type, handler, options);
                listeners.push({ target, type, handler, options });
            },
            disposeAll: function () {
                while (listeners.length) {
                    const listener = listeners.pop();
                    if (listener.target && typeof listener.target.removeEventListener === 'function') {
                        listener.target.removeEventListener(listener.type, listener.handler, listener.options);
                    }
                }

                while (resources.length) {
                    disposeOne(resources.pop());
                }
            }
        };
    };
}());
