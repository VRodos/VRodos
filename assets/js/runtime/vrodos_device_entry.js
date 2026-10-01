(function () {
    'use strict';

    async function selectTarget(variants) {
        const profiles = Object.keys(variants);
        const override = new URLSearchParams(window.location.search).get('vrodos_target');
        if (profiles.includes(override)) return override;
        if (profiles.length === 1) return profiles[0];

        const ua = navigator.userAgent || '';
        // Quest Browser retains its OculusBrowser identity in desktop browsing mode.
        if (/OculusBrowser|\bQuest(?:\s|;|\))/i.test(ua)) return 'headset';
        const platform = navigator.userAgentData?.platform || '';
        const desktop = !/Android|Mobile|iPhone|iPad/i.test(ua) && (
            /Windows|macOS|Linux/i.test(platform) || /Windows NT|Macintosh|X11|Linux x86_64/i.test(ua)
        );
        if (!desktop || !navigator.xr?.isSessionSupported) return 'desktop';

        let timer;
        try {
            const supported = await Promise.race([
                navigator.xr.isSessionSupported('immersive-vr'),
                new Promise((resolve) => { timer = window.setTimeout(() => resolve(false), 3000); })
            ]);
            return supported === true ? 'pc-rendered-vr' : 'desktop';
        } catch (_error) {
            return 'desktop';
        } finally {
            window.clearTimeout(timer);
        }
    }

    function destination(filename) {
        const url = new URL(filename, window.location.href);
        url.search = window.location.search;
        url.hash = window.location.hash;
        return url.href;
    }

    window.VRODOSDeviceEntry = {
        selectTarget,
        async bootstrap(variants) {
            const profile = await selectTarget(variants);
            window.location.replace(destination(variants[profile]));
        }
    };
}());
