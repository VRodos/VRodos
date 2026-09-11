/** Shadow map type compatibility and render-target disposal. */
(function () {
    function normalizeAFrameShadowMapType(value, fallback) {
        switch (String(value || '').toLowerCase()) {
            case 'basic':
            case 'pcf':
                return String(value).toLowerCase();
            default:
                return fallback || 'pcf';
        }
    }

    function getThreeShadowMapType(type) {
        switch (normalizeAFrameShadowMapType(type, 'pcf')) {
            case 'basic':
                return typeof THREE.BasicShadowMap !== 'undefined' ? THREE.BasicShadowMap : THREE.PCFShadowMap;
            case 'pcf':
            default:
                return THREE.PCFShadowMap;
        }
    }

    function getThreeShadowMapTypeName(type) {
        if (typeof THREE !== 'undefined') {
            if (typeof THREE.BasicShadowMap !== 'undefined' && type === THREE.BasicShadowMap) {
                return 'BasicShadowMap';
            }
            if (type === THREE.PCFShadowMap) {
                return 'PCFShadowMap';
            }
        }

        return typeof type === 'number' ? `ShadowMap(${type})` : String(type || 'unknown');
    }

    function getAFrameShadowComponentType(type) {
        const normalized = normalizeAFrameShadowMapType(type, 'pcf');
        return normalized === 'basic' ? 'basic' : 'pcf';
    }

    function disposeLightShadowMap(shadow) {
        if (!shadow || !shadow.map) {
            return false;
        }

        if (shadow.map.depthTexture && typeof shadow.map.depthTexture.dispose === 'function') {
            shadow.map.depthTexture.dispose();
        }
        if (typeof shadow.map.dispose === 'function') {
            shadow.map.dispose();
        }
        shadow.map = null;

        if (shadow.mapPass) {
            if (shadow.mapPass.depthTexture && typeof shadow.mapPass.depthTexture.dispose === 'function') {
                shadow.mapPass.depthTexture.dispose();
            }
            if (typeof shadow.mapPass.dispose === 'function') {
                shadow.mapPass.dispose();
            }
            shadow.mapPass = null;
        }

        shadow.needsUpdate = true;
        return true;
    }

    function isLightShadowMapCompatibleWithType(shadow, shadowMapType) {
        if (!shadow || !shadow.map || typeof THREE === 'undefined') {
            return true;
        }

        const depthTexture = shadow.map.depthTexture || null;
        if (shadowMapType === THREE.PCFShadowMap) {
            return Boolean(depthTexture && depthTexture.compareFunction);
        }
        if (typeof THREE.BasicShadowMap !== 'undefined' && shadowMapType === THREE.BasicShadowMap) {
            return Boolean(!depthTexture || !depthTexture.compareFunction);
        }

        return true;
    }

    VRODOSMaster.ShadowMaps = Object.freeze({
        normalizeType: normalizeAFrameShadowMapType,
        threeType: getThreeShadowMapType,
        typeName: getThreeShadowMapTypeName,
        componentType: getAFrameShadowComponentType,
        dispose: disposeLightShadowMap,
        isCompatible: isLightShadowMapCompatibleWithType
    });
})();
