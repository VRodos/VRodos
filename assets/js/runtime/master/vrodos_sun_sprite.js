/** Sun sprite textures and presentation presets.
 * Texture caches and disposal remain owned by the scene component.
 */
(function () {
    function createPmndrsSunTexture(self) {
        if (!self || self._pmndrsSunTexture || typeof document === 'undefined') {
            return self ? self._pmndrsSunTexture : null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0.0, 'rgba(255,253,246,1)');
        gradient.addColorStop(0.46, 'rgba(255,245,226,0.98)');
        gradient.addColorStop(0.74, 'rgba(255,232,192,0.84)');
        gradient.addColorStop(0.9, 'rgba(255,214,168,0.16)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        self._pmndrsSunTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunTexture.generateMipmaps = false;
        self._pmndrsSunTexture.minFilter = THREE.LinearFilter;
        self._pmndrsSunTexture.magFilter = THREE.LinearFilter;
        self._pmndrsSunTexture.needsUpdate = true;
        return self._pmndrsSunTexture;
    }

    function createPmndrsSunHazeTexture(self) {
        if (!self || self._pmndrsSunHazeTexture || typeof document === 'undefined') {
            return self ? self._pmndrsSunHazeTexture : null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0.0, 'rgba(255,220,170,0.42)');
        gradient.addColorStop(0.24, 'rgba(255,206,156,0.3)');
        gradient.addColorStop(0.48, 'rgba(255,188,136,0.16)');
        gradient.addColorStop(0.72, 'rgba(255,170,122,0.06)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tiny alpha dithering in the baked haze texture avoids visible rings
        // after tone mapping at dusk while preserving a smooth glow.
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                const jitter = ((Math.random() * 2) - 1) * 10;
                const a = data[i + 3] + jitter;
                data[i + 3] = a < 0 ? 0 : (a > 255 ? 255 : a);
            }
        }
        ctx.putImageData(image, 0, 0);

        self._pmndrsSunHazeTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunHazeTexture.generateMipmaps = false;
        self._pmndrsSunHazeTexture.minFilter = THREE.LinearFilter;
        self._pmndrsSunHazeTexture.magFilter = THREE.LinearFilter;
        self._pmndrsSunHazeTexture.needsUpdate = true;
        return self._pmndrsSunHazeTexture;
    }

    function getPmndrsHorizonSunConfig(preset, mode) {
        const atmosphereMode = mode === 'atmosphere';
        switch (preset) {
            case 'clear':
                return {
                    scale: atmosphereMode ? 42 : 95,
                    color: atmosphereMode ? '#fff6d8' : '#fff3c7',
                    distance: 5400,
                    intensity: atmosphereMode ? 4.6 : 4.0,
                    hazeScale: atmosphereMode ? 190 : 0,
                    hazeIntensity: atmosphereMode ? 1.3 : 0
                };
            case 'crisp':
                return {
                    scale: atmosphereMode ? 46 : 108,
                    color: atmosphereMode ? '#fff2cc' : '#fff0bc',
                    distance: 5300,
                    intensity: atmosphereMode ? 4.9 : 4.0,
                    hazeScale: atmosphereMode ? 210 : 0,
                    hazeIntensity: atmosphereMode ? 1.45 : 0
                };
            default:
                return {
                    scale: atmosphereMode ? 50 : 120,
                    color: atmosphereMode ? '#ffefc9' : '#ffedb2',
                    distance: 5200,
                    intensity: atmosphereMode ? 5.2 : 4.0,
                    hazeScale: atmosphereMode ? 230 : 0,
                    hazeIntensity: atmosphereMode ? 1.6 : 0
                };
        }
    }

    VRODOSMaster.SunSprite = Object.freeze({
        createPmndrsSunTexture,
        createPmndrsSunHazeTexture,
        getPmndrsHorizonSunConfig
    });
})();
