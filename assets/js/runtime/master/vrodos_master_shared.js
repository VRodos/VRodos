/**
 * VRodos Master shared runtime helpers.
 */

var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});
var browsingModeVR = typeof window.browsingModeVR === 'boolean' ? window.browsingModeVR : false;
window.browsingModeVR = browsingModeVR;

VRODOSMaster.domCache = VRODOSMaster.domCache || {};

VRODOSMaster.getElement = function (id, refresh) {
    var cache = VRODOSMaster.domCache;
    var cached = cache[id];
    if (!refresh && cached && cached.isConnected) {
        return cached;
    }

    cached = document.getElementById(id);
    if (cached) {
        cache[id] = cached;
    }

    return cached || null;
};

VRODOSMaster.queryOne = function (selector, root) {
    return (root || document).querySelector(selector);
};

VRODOSMaster.setBrowsingModeVR = function (value) {
    browsingModeVR = Boolean(value);
    window.browsingModeVR = browsingModeVR;
    return browsingModeVR;
};

VRODOSMaster.vectorRequiresUpdateRotation = function (epsilon) {
    return function () {
        var prev = null;
        return function (curr) {
            if (prev === null) {
                prev = new THREE.Vector3(curr.x, curr.y, curr.z);
                return true;
            }

            if (!NAF.utils.almostEqualVec3(prev, curr, epsilon)) {
                curr.x = 0;
                prev.copy(curr);
                return true;
            }

            return false;
        };
    };
};

VRODOSMaster.randomColor = function () {
    return `#${  Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

window.ntExample = window.ntExample || {
    randomColor: VRODOSMaster.randomColor
};

VRODOSMaster.formatBytes = function (bytes, decimals) {
    var safeDecimals = typeof decimals === 'number' ? decimals : 2;
    if (!+bytes) {
        return '0 Bytes';
    }

    var k = 1024;
    var dm = safeDecimals < 0 ? 0 : safeDecimals;
    var sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))  } ${  sizes[i]}`;
};

window.selectAvatarType = function (value) {
    var selectedValue = value;
    if (!selectedValue) {
        var checkedRadio = VRODOSMaster.queryOne('input[name="avatar-radios"]:checked');
        selectedValue = checkedRadio ? checkedRadio.value : 'no-avatar';
    }

    var cameraA = VRODOSMaster.getElement('cameraA', true);
    if (cameraA) {
        cameraA.setAttribute('player-info', 'avatarType', selectedValue);
    }
};
