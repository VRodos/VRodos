/** Moon phase, illumination, and orientation calculations. */
(function () {
    const RuntimeSettings = VRODOSMaster.RuntimeSettings || {};
    const PMNDRS_MOON_PHASE_ANGLES_DEG = Object.freeze({
        full: 0,
        'waxing-gibbous': -45,
        'first-quarter': -90,
        'waxing-crescent': -135,
        new: 180,
        'waning-crescent': 135,
        'last-quarter': 90,
        'waning-gibbous': 45
    });

    function buildPmndrsMoonDirection(sunDirection) {
        return sunDirection.clone().multiplyScalar(-1).normalize();
    }

    function normalizePmndrsMoonPhase(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsMoonPhase', value, 'auto');
        }
        return value === 'auto' || Object.prototype.hasOwnProperty.call(PMNDRS_MOON_PHASE_ANGLES_DEG, value)
            ? value
            : 'auto';
    }

    function getPmndrsMoonPhaseIlluminationFromAngle(angleDeg) {
        return Math.max(0, Math.min(1, (1 + Math.cos(THREE.MathUtils.degToRad(angleDeg))) * 0.5));
    }

    function getPmndrsAutoMoonIllumination(config) {
        if (!(config && config.sunDirection && config.moonDirection)) {
            return 1;
        }
        return Math.max(0, Math.min(1, (1 - config.sunDirection.dot(config.moonDirection)) * 0.5));
    }

    function getPmndrsStableMoonNorth(moonDirection) {
        const north = new THREE.Vector3(0, 1, 0);
        north.addScaledVector(moonDirection, -north.dot(moonDirection));
        if (north.lengthSq() < 1e-6) {
            north.set(0, 0, 1).addScaledVector(moonDirection, -moonDirection.z);
        }
        return north.normalize();
    }

    function getPmndrsStableMoonFixedToEcefMatrix(moonDirection) {
        const center = moonDirection.clone().normalize();
        const north = getPmndrsStableMoonNorth(center);
        const east = north.clone().cross(center).normalize();
        return new THREE.Matrix4().makeBasis(center, east, north);
    }

    function applyPmndrsMoonPhaseConfig(config, vta) {
        const authoredPhase = normalizePmndrsMoonPhase(config.moonPhase);
        const astronomicalPosition = config.celestialMode === 'datetime' && config.astronomicalMoonPosition === true;
        const astronomicalAuto = authoredPhase === 'auto' && astronomicalPosition;
        let phaseAngleDeg = 0;
        let illumination = 1;

        // Date/time scenes always retain Takram's real lunar ephemeris so the
        // Moon drifts against the sidereal star field. Named phases only replace
        // illumination in that mode. Manual/preset scenes remain night-anchored.
        if (!astronomicalPosition) {
            config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);
            config.localMoonDirection = buildPmndrsMoonDirection(config.localSunDirection || config.sunDirection);
        }

        const lightDirection = config.moonDirection.clone().normalize();
        let effectivePhase = authoredPhase;

        if (astronomicalAuto) {
            illumination = getPmndrsAutoMoonIllumination(config);
            lightDirection.copy(config.sunDirection).negate().normalize();
            effectivePhase = 'auto';
        } else {
            phaseAngleDeg = authoredPhase === 'auto' ? 0 : PMNDRS_MOON_PHASE_ANGLES_DEG[authoredPhase];
            illumination = getPmndrsMoonPhaseIlluminationFromAngle(phaseAngleDeg);
            lightDirection.applyAxisAngle(
                getPmndrsStableMoonNorth(config.moonDirection),
                THREE.MathUtils.degToRad(phaseAngleDeg)
            ).normalize();
            effectivePhase = authoredPhase === 'auto' ? 'full' : authoredPhase;
        }

        let orientationMode = 'stable-north-up';
        let moonFixedToECEFMatrix = getPmndrsStableMoonFixedToEcefMatrix(config.moonDirection);
        const moonEffectiveDate = config.moonEffectiveDate || config.effectiveDate;
        const moonInertialToECEFMatrix = config.moonInertialToECEFMatrix || config.inertialToECEFMatrix;
        if (config.celestialMode === 'datetime' && moonEffectiveDate && moonInertialToECEFMatrix &&
            vta && typeof vta.getMoonFixedToECIRotationMatrix === 'function') {
            moonFixedToECEFMatrix = new THREE.Matrix4().multiplyMatrices(
                moonInertialToECEFMatrix,
                vta.getMoonFixedToECIRotationMatrix(moonEffectiveDate, new THREE.Matrix4())
            );
            orientationMode = 'moon-fixed-date-time';
        }

        config.moonPhase = authoredPhase;
        config.effectiveMoonPhase = effectivePhase;
        config.moonPhaseAngleDeg = phaseAngleDeg;
        config.moonIllumination = illumination;
        config.moonLightDirection = lightDirection;
        config.moonFixedToECEFMatrix = moonFixedToECEFMatrix;
        config.moonOrientationMode = orientationMode;
        config.moonPositionMode = astronomicalAuto
            ? 'astronomical-auto-phase'
            : (astronomicalPosition ? 'astronomical-fixed-phase' : 'author-controlled-night');
        return config;
    }

    VRODOSMaster.MoonPhase = Object.freeze({
        anglesDeg: PMNDRS_MOON_PHASE_ANGLES_DEG,
        normalize: normalizePmndrsMoonPhase,
        illuminationFromAngle: getPmndrsMoonPhaseIlluminationFromAngle,
        directionFromSun: buildPmndrsMoonDirection,
        applyConfig: applyPmndrsMoonPhaseConfig
    });

})();
