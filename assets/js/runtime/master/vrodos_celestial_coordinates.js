/** Celestial coordinate frames shared by atmosphere sky and lights. */
(function () {
    const WGS84_EQUATORIAL_RADIUS = 6378137;
    const WGS84_POLAR_RADIUS = 6356752.3142451793;
    const clampPmndrsNumber = VRODOSMaster.RuntimeSettings.clampNumber;

    function buildPmndrsLocalSunDirection(elevationDeg, azimuthDeg) {
        const elevation = THREE.MathUtils.degToRad(elevationDeg);
        const azimuth = THREE.MathUtils.degToRad(azimuthDeg);
        const cosElevation = Math.cos(elevation);
        return new THREE.Vector3(
            Math.sin(azimuth) * cosElevation,
            Math.sin(elevation),
            -Math.cos(azimuth) * cosElevation
        ).normalize();
    }

    function buildPmndrsGeospatialFrame(latitudeDeg, longitudeDeg, altitudeMeters) {
        const lat = THREE.MathUtils.degToRad(clampPmndrsNumber(latitudeDeg, -90, 90, 0));
        const lon = THREE.MathUtils.degToRad(clampPmndrsNumber(longitudeDeg, -180, 180, 0));
        const height = clampPmndrsNumber(altitudeMeters, -500, 20000, 0);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);
        const a = WGS84_EQUATORIAL_RADIUS;
        const b = WGS84_POLAR_RADIUS;
        const e2 = 1 - ((b * b) / (a * a));
        const n = a / Math.sqrt(1 - (e2 * sinLat * sinLat));
        const position = new THREE.Vector3(
            (n + height) * cosLat * cosLon,
            (n + height) * cosLat * sinLon,
            ((n * (1 - e2)) + height) * sinLat
        );
        const up = new THREE.Vector3(cosLat * cosLon, cosLat * sinLon, sinLat).normalize();
        const east = new THREE.Vector3(-sinLon, cosLon, 0);
        if (east.lengthSq() < 0.000001) {
            east.set(0, 1, 0);
        }
        east.normalize();
        const north = new THREE.Vector3().crossVectors(up, east).normalize();
        const south = north.clone().multiplyScalar(-1);
        const matrix = new THREE.Matrix4().makeBasis(east, up, south).setPosition(position);

        return {
            latitudeDeg: THREE.MathUtils.radToDeg(lat),
            longitudeDeg: THREE.MathUtils.radToDeg(lon),
            altitudeMeters: height,
            position,
            east,
            up,
            north,
            south,
            matrix
        };
    }

    function getPmndrsGeospatialFrame(config) {
        if (!config || !config.geospatialEnabled) {
            return null;
        }
        if (!config._geospatialFrame) {
            config._geospatialFrame = buildPmndrsGeospatialFrame(
                config.geospatialLatitudeDeg,
                config.geospatialLongitudeDeg,
                config.geospatialAltitudeMeters
            );
        }
        return config._geospatialFrame;
    }

    function getPmndrsResolvedGeospatialFrame(config) {
        if (!config) {
            return null;
        }
        if (config._resolvedGeospatialFrame) {
            return config._resolvedGeospatialFrame;
        }

        config._resolvedGeospatialFrame = getPmndrsGeospatialFrame(config) || buildPmndrsGeospatialFrame(0, 90, 0);
        return config._resolvedGeospatialFrame;
    }

    function ecefDirectionToPmndrsLocal(direction, frame) {
        if (!direction || !frame) {
            return direction ? direction.clone().normalize() : new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3(
            direction.dot(frame.east),
            direction.dot(frame.up),
            direction.dot(frame.south)
        ).normalize();
    }

    function localDirectionToPmndrsEcef(localDirection, frame) {
        if (!localDirection || !frame) {
            return new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3()
            .addScaledVector(frame.east, localDirection.x)
            .addScaledVector(frame.up, localDirection.y)
            .addScaledVector(frame.south, localDirection.z)
            .normalize();
    }

    function applyLocalDirectionAngles(config) {
        const local = config && config.localSunDirection ? config.localSunDirection : null;
        if (!local) {
            return;
        }
        config.sunElevationDeg = THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, local.y))));
        config.sunAzimuthDeg = THREE.MathUtils.radToDeg(Math.atan2(local.x, -local.z));
    }

    function buildPmndrsEcefSunDirection(localSunDirection, config) {
        if (!localSunDirection) {
            return new THREE.Vector3(0, 1, 0);
        }

        const frame = getPmndrsGeospatialFrame(config);
        if (frame) {
            return localDirectionToPmndrsEcef(localSunDirection, frame);
        }

        // VRodos authored worlds use X=east, Y=up, Z=south so that -Z is the
        // natural forward/north-ish direction. Takram expects sunDirection in
        // ECEF space, so we mirror X/Z into the default fixed frame anchored below.
        return new THREE.Vector3(
            -localSunDirection.x,
            localSunDirection.y,
            -localSunDirection.z
        ).normalize();
    }

    function ensurePmndrsWorldToEcefMatrix(target, config) {
        if (!target) {
            return null;
        }

        const matrix = target.worldToECEFMatrix;
        if (!matrix || typeof matrix.makeTranslation !== 'function') {
            return null;
        }

        const frame = getPmndrsResolvedGeospatialFrame(config);
        if (frame) {
            matrix.copy(frame.matrix);
            return matrix;
        }

        // Takram expects an orthogonal world -> ECEF transform. VRodos authored
        // scenes use X=east, Y=up, Z=south (so -Z behaves like "forward"), so
        // we anchor the local origin onto an actual WGS84 surface point near the
        // equator and provide the matching rotation instead of translation alone.
        // Using atmosphere.bottomRadius here is wrong because Takram's altitude
        // correction then pushes the camera below the ground sphere, which shows
        // up as a giant fake horizon dome.
        matrix.makeBasis(
            new THREE.Vector3(-1, 0, 0), // local +X (east) -> ECEF west at +Y anchor
            new THREE.Vector3(0, 1, 0),  // local +Y (up)   -> ECEF up
            new THREE.Vector3(0, 0, -1)  // local +Z (south)-> ECEF south
        ).setPosition(0, WGS84_EQUATORIAL_RADIUS, 0);
        return matrix;
    }

    VRODOSMaster.CelestialCoordinates = Object.freeze({
        localSunDirection: buildPmndrsLocalSunDirection,
        buildFrame: buildPmndrsGeospatialFrame,
        getFrame: getPmndrsGeospatialFrame,
        resolveFrame: getPmndrsResolvedGeospatialFrame,
        toLocal: ecefDirectionToPmndrsLocal,
        toEcef: localDirectionToPmndrsEcef,
        applyLocalAngles: applyLocalDirectionAngles,
        sunDirectionToEcef: buildPmndrsEcefSunDirection,
        applyWorldMatrix: ensurePmndrsWorldToEcefMatrix
    });
})();
