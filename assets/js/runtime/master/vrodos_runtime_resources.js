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

    function disposeOne(resource, seen = new Set()) {
        if (!resource || seen.has(resource)) {
            return;
        }
        seen.add(resource);

        if (Array.isArray(resource)) {
            resource.forEach((entry) => disposeOne(entry, seen));
            return;
        }

        if (resource.geometry) {
            disposeOne(resource.geometry, seen);
        }

        if (Array.isArray(resource.material)) {
            resource.material.forEach((entry) => disposeOne(entry, seen));
        } else if (resource.material) {
            disposeOne(resource.material, seen);
        }

        if (typeof resource.dispose === 'function') {
            resource.dispose();
        }
    }

    Resources.dispose = function (resource) {
        disposeOne(resource);
    };

    Resources.createRegistry = function () {
        const resources = [];
        const cleanups = new Set();
        let released = false;

        function cleanup(callback) {
            const release = () => {
                if (!cleanups.delete(release)) return;
                callback();
            };
            if (released) callback();
            else cleanups.add(release);
            return release;
        }

        function defer(callback, schedule, cancel) {
            if (released) return () => {};
            let pending = true;
            const handle = schedule((...args) => {
                if (!pending || released) return;
                pending = false;
                cleanups.delete(release);
                callback(...args);
            });
            const release = cleanup(() => { pending = false; cancel(handle); });
            return release;
        }

        return {
            cleanup,
            defer,
            timeout: (callback, delay) => defer(callback, run => window.setTimeout(run, delay), handle => window.clearTimeout(handle)),
            frame: callback => defer(callback, run => window.requestAnimationFrame(run), handle => window.cancelAnimationFrame(handle)),
            track: function (resource) {
                if (resource) {
                    if (released) disposeOne(resource);
                    else resources.push(resource);
                }
                return resource;
            },
            listen: function (target, type, handler, options) {
                if (released || !target || typeof target.addEventListener !== 'function') {
                    return;
                }
                target.addEventListener(type, handler, options);
                return cleanup(() => target.removeEventListener(type, handler, options));
            },
            disposeAll: function () {
                if (released) return;
                released = true;
                const disposed = new Set();
                for (const release of [...cleanups]) {
                    try { release(); } catch (error) { console.warn('[VRodos] Resource cleanup failed:', error); }
                }

                while (resources.length) {
                    try { disposeOne(resources.pop(), disposed); } catch (error) { console.warn('[VRodos] Resource disposal failed:', error); }
                }
            }
        };
    };
}());
