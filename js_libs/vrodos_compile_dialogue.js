document.addEventListener('DOMContentLoaded', function() {
    function getCompileDialogElements() {
        return {
            renderQuality: document.getElementById('compileRenderQualitySelect'),
            shadowQuality: document.getElementById('compileShadowQualitySelect'),
            postFx: document.getElementById('compilePostFxToggle'),
            postFxHelp: document.getElementById('compilePostFxHelp')
        };
    }

    function ensureCompileSceneSettingsDefaults() {
        if (typeof envir === 'undefined' || !envir.scene) {
            return;
        }

        if (!envir.scene.aframeRenderQuality) {
            envir.scene.aframeRenderQuality = 'standard';
        }
        if (!envir.scene.aframeShadowQuality) {
            envir.scene.aframeShadowQuality = 'medium';
        }
        if (typeof envir.scene.aframePostFXEnabled === 'undefined') {
            envir.scene.aframePostFXEnabled = false;
        }
    }

    function syncCompilePostFxState() {
        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.postFx) {
            return;
        }

        var highQualityEnabled = controls.renderQuality.value === 'high';
        controls.postFx.disabled = !highQualityEnabled;

        if (!highQualityEnabled) {
            controls.postFx.checked = false;
        }

        if (controls.postFxHelp) {
            controls.postFxHelp.textContent = highQualityEnabled
                ? 'Available in High render quality for a subtle cinematic finish.'
                : 'Switch Render Quality to High to enable this option.';
        }
    }

    function persistCompileDialogSettings() {
        if (typeof envir === 'undefined' || !envir.scene) {
            return;
        }

        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.postFx) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        envir.scene.aframeRenderQuality = controls.renderQuality.value || 'standard';
        envir.scene.aframeShadowQuality = controls.shadowQuality.value || 'medium';
        envir.scene.aframePostFXEnabled = controls.renderQuality.value === 'high' && controls.postFx.checked === true;

        if (typeof saveChanges === 'function') {
            saveChanges();
        }
    }

    window.syncCompileDialogFromSceneSettings = function() {
        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.postFx) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        controls.renderQuality.value = envir && envir.scene && envir.scene.aframeRenderQuality
            ? envir.scene.aframeRenderQuality
            : 'standard';
        controls.shadowQuality.value = envir && envir.scene && envir.scene.aframeShadowQuality
            ? envir.scene.aframeShadowQuality
            : 'medium';
        controls.postFx.checked = !!(envir && envir.scene && envir.scene.aframePostFXEnabled);

        syncCompilePostFxState();
    };

    var controls = getCompileDialogElements();
    if (controls.renderQuality) {
        controls.renderQuality.addEventListener('change', function() {
            syncCompilePostFxState();
            persistCompileDialogSettings();
        });
    }
    if (controls.shadowQuality) {
        controls.shadowQuality.addEventListener('change', persistCompileDialogSettings);
    }
    if (controls.postFx) {
        controls.postFx.addEventListener('change', persistCompileDialogSettings);
    }

    if (typeof window.syncCompileDialogFromSceneSettings === 'function') {
        window.syncCompileDialogFromSceneSettings();
    }

    function copyURLToClipboard() {
        let linkElement = document.getElementById("openWebLinkhref");
        if(linkElement && linkElement.href) {
            navigator.clipboard.writeText(linkElement.href)
                .then(() => {
                    alert("Copied url: " + linkElement.href);
                })
                .catch(err => {
                    console.error('Failed to copy URL: ', err);
                });
        }
    }

    var copyButton = document.getElementById("buttonCopyWebLink");
    if(copyButton) {
        copyButton.addEventListener("click", copyURLToClipboard);
    }
});
