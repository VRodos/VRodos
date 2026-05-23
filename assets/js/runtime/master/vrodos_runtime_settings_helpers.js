/**
 * Runtime settings helpers backed by assets/runtime-settings-contract.json.
 */
window.VRODOSMaster = window.VRODOSMaster || {};

(function () {
    const Master = window.VRODOSMaster;
    if (!Master.RuntimeSettings) {
        Master.RuntimeSettings = {};
    }
    const H = Master.RuntimeSettings;
    const contract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || { sceneSettings: {} };

    function setting(key) {
        return contract.sceneSettings && contract.sceneSettings[key] ? contract.sceneSettings[key] : {};
    }

    function defaultValue(key, fallback, defaultKey) {
        const config = setting(key);
        const field = defaultKey || 'default';
        return Object.prototype.hasOwnProperty.call(config, field) ? config[field] : fallback;
    }

    function defaultString(key, fallback) {
        const value = defaultValue(key, fallback);
        if (typeof value === 'boolean') {
            return value ? '1' : '0';
        }
        return String(value);
    }

    function normalizeBool(value, fallback) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (value === null || typeof value === 'undefined') {
            return Boolean(fallback);
        }
        if (value === 1 || value === '1' || value === 'true' || value === 'yes' || value === 'on') {
            return true;
        }
        if (value === 0 || value === '0' || value === 'false' || value === 'no' || value === 'off') {
            return false;
        }
        return Boolean(fallback);
    }

    function normalizeNumber(key, value, fallback, min, max) {
        const config = setting(key);
        const resolvedFallback = defaultValue(key, fallback);
        let number = parseFloat(value);
        if (isNaN(number)) {
            number = parseFloat(resolvedFallback);
        }
        if (isNaN(number)) {
            number = parseFloat(fallback);
        }
        if (isNaN(number)) {
            number = 0;
        }

        const lower = typeof min === 'number' ? min : (typeof config.min === 'number' ? config.min : null);
        const upper = typeof max === 'number' ? max : (typeof config.max === 'number' ? config.max : null);
        if (lower !== null && number < lower) {
            number = lower;
        }
        if (upper !== null && number > upper) {
            number = upper;
        }
        const step = typeof config.step === 'number' ? config.step : null;
        if (step !== null && step > 0) {
            const base = lower !== null ? lower : 0;
            number = base + Math.round((number - base) / step) * step;
            number = Number(number.toFixed(6));
            if (lower !== null && number < lower) {
                number = lower;
            }
            if (upper !== null && number > upper) {
                number = upper;
            }
        }
        return number;
    }

    function normalizeEnum(key, value, fallback) {
        const config = setting(key);
        const allowed = Array.isArray(config.allowed) ? config.allowed : [];
        if (allowed.indexOf(value) !== -1) {
            return value;
        }
        return defaultValue(key, fallback);
    }

    function normalizeColor(key, value, fallback) {
        const raw = typeof value === 'string' ? value.trim() : '';
        if (/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return raw.charAt(0) === '#' ? raw : `#${raw}`;
        }
        return defaultValue(key, fallback);
    }

    function normalizePattern(key, value, fallback, validator) {
        const candidate = typeof value === 'string' ? value.trim() : '';
        if (validator(candidate)) {
            return candidate;
        }
        return defaultValue(key, fallback);
    }

    H.setting = setting;
    H.defaultValue = defaultValue;
    H.defaultString = defaultString;
    H.schemaString = function (key, fallback) {
        return { type: 'string', default: defaultString(key, fallback) };
    };
    H.schemaStringMap = function (defaults) {
        const schema = {};
        Object.keys(defaults || {}).forEach((key) => {
            schema[key] = H.schemaString(key, defaults[key]);
        });
        return schema;
    };
    H.bool = normalizeBool;
    H.readBool = function (data, key, fallback) {
        return normalizeBool(data && data[key] !== undefined ? data[key] : fallback, fallback);
    };
    H.number = normalizeNumber;
    H.readNumber = function (data, key, fallback, min, max) {
        const raw = data && data[key] !== undefined ? data[key] : fallback;
        return normalizeNumber(key, raw, fallback, min, max);
    };
    H.normalizeEnum = normalizeEnum;
    H.normalizeColor = normalizeColor;
    H.normalizeDate = function (key, value, fallback) {
        return normalizePattern(key, value, fallback, (candidate) => /^\d{4}-\d{2}-\d{2}$/.test(candidate));
    };
    H.normalizeUtcTime = function (key, value, fallback) {
        return normalizePattern(key, value, fallback, (candidate) => {
            if (!/^\d{2}:\d{2}$/.test(candidate)) {
                return false;
            }
            const parts = candidate.split(':');
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
        });
    };
}());
