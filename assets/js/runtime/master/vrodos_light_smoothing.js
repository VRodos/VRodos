/** Light interpolation; state stays on the owning scene component. */
(function () {
    function getPmndrsRuntimeLightTimeMs(self) {
        return self && typeof self._pmndrsTickTimeMs === 'number' && isFinite(self._pmndrsTickTimeMs)
            ? self._pmndrsTickTimeMs
            : (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
    }

    function getPmndrsRuntimeLightSmoothingAlpha(self, key, smoothingMs) {
        const now = getPmndrsRuntimeLightTimeMs(self);
        self._pmndrsRuntimeLightSmoothTimes = self._pmndrsRuntimeLightSmoothTimes || {};
        const previous = self._pmndrsRuntimeLightSmoothTimes[key];
        self._pmndrsRuntimeLightSmoothTimes[key] = now;
        if (!smoothingMs || smoothingMs <= 0) {
            return 1;
        }
        if (typeof previous !== 'number') {
            return 0;
        }

        const deltaMs = Math.max(0, Math.min(250, now - previous));
        return deltaMs > 0 ? 1 - Math.exp(-deltaMs / smoothingMs) : 0;
    }

    function smoothPmndrsRuntimeLightValue(self, key, target, smoothingMs, currentValue) {
        if (!isFinite(target)) {
            return 0;
        }

        self._pmndrsRuntimeLightSmoothValues = self._pmndrsRuntimeLightSmoothValues || {};
        const alpha = getPmndrsRuntimeLightSmoothingAlpha(self, key, smoothingMs);
        if (typeof self._pmndrsRuntimeLightSmoothValues[key] !== 'number') {
            self._pmndrsRuntimeLightSmoothValues[key] = typeof currentValue === 'number' && isFinite(currentValue)
                ? currentValue
                : target;
        }
        if (alpha >= 1) {
            self._pmndrsRuntimeLightSmoothValues[key] = target;
            return target;
        }

        const previous = self._pmndrsRuntimeLightSmoothValues[key];
        const value = previous + ((target - previous) * alpha);
        self._pmndrsRuntimeLightSmoothValues[key] = value;
        return value;
    }

    function smoothPmndrsRuntimeLightColor(self, key, targetColor, smoothingMs, currentColor) {
        self._pmndrsRuntimeLightSmoothColors = self._pmndrsRuntimeLightSmoothColors || {};
        const alpha = getPmndrsRuntimeLightSmoothingAlpha(self, `${key}:color`, smoothingMs);
        const color = new THREE.Color(targetColor || '#ffffff');

        if (!self._pmndrsRuntimeLightSmoothColors[key]) {
            self._pmndrsRuntimeLightSmoothColors[key] = currentColor && currentColor.isColor
                ? currentColor.clone()
                : color.clone();
        }

        if (alpha >= 1) {
            self._pmndrsRuntimeLightSmoothColors[key] = color;
            return color;
        }

        self._pmndrsRuntimeLightSmoothColors[key].lerp(color, alpha);
        return self._pmndrsRuntimeLightSmoothColors[key];
    }

    VRODOSMaster.LightSmoothing = Object.freeze({
        value: smoothPmndrsRuntimeLightValue,
        color: smoothPmndrsRuntimeLightColor
    });
})();
