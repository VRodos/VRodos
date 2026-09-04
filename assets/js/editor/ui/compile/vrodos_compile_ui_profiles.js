'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initDesktopPerformanceProfileEditor() {
    const TIER_IDS = ['low', 'medium', 'high'];
    const PROFILE_IDS = ['custom'].concat(TIER_IDS);
    const SETTING_LABELS = {
        shadowQuality: 'Shadows', shadowUpdateMode: 'Shadow updates', flatMediaShadowCasting: 'Media casts shadows',
        aaQuality: 'Anti-aliasing', ambientOcclusionPreset: 'Ambient occlusion', contactShadowPreset: 'Contact shadows',
        postFXEnabled: 'Lightweight post-processing', postFXEngine: 'Post-processing engine', postFXBloomEnabled: 'Bloom',
        postFXEdgeAAEnabled: 'Edge AA', postFXTAAEnabled: 'TAA', postFXSSREnabled: 'SSR', postFXSSRStrength: 'SSR quality',
        bloomStrength: 'Bloom quality', reflectionProfile: 'Reflection quality', reflectionSource: 'Reflection source',
        sceneProbeUpdateMode: 'Scene-probe updates', sceneProbeResolution: 'Scene-probe resolution',
        pmndrsAAMode: 'PMNDRS AA', pmndrsAAPreset: 'PMNDRS AA quality', pmndrsLensFlareEnabled: 'Lens flare',
        pmndrsLutEnabled: 'LUT', pmndrsVignetteEnabled: 'Vignette', pmndrsNoiseEnabled: 'Noise',
        pmndrsChromaticAberrationEnabled: 'Chromatic aberration', pmndrsAtmosphereEnabled: 'Atmosphere',
        pmndrsAtmosphereQuality: 'Atmosphere quality', pmndrsAerialPerspectiveEnabled: 'Aerial perspective',
        pmndrsCloudsEnabled: 'Clouds', pmndrsCloudsQuality: 'Cloud quality', pmndrsCloudsLightShaftsEnabled: 'Cloud light shafts',
        reflectionsEnabled: 'Reflections'
    };
    const FIXED_SUMMARIES = {
        low: 'Shadows, AA, AO/contact shadows, heavy post-effects, scene probes, and cloud shafts are fixed off.',
        medium: 'Shadow updates are static. Shafts, bloom, SSR, TAA, flare, noise, chromatic aberration, and scene probes are fixed off.',
        high: 'Texture and geometry fidelity stay authored. All supported runtime quality controls remain available.'
    };
    const ORDERED_SETTINGS = {
        renderQuality: ['performance', 'standard', 'high'],
        shadowQuality: ['off', 'medium', 'high'],
        shadowUpdateMode: ['static', 'dynamic'],
        aaQuality: ['off', 'balanced', 'high', 'ultra'],
        ambientOcclusionPreset: ['off', 'soft', 'balanced', 'strong'],
        contactShadowPreset: ['off', 'soft', 'balanced', 'strong'],
        postFXSSRStrength: ['off', 'subtle', 'balanced', 'strong'],
        bloomStrength: ['off', 'soft', 'medium'],
        reflectionProfile: ['soft', 'balanced', 'enhanced'],
        reflectionSource: ['hdr', 'scene-probe'],
        sceneProbeResolution: ['64', '128', '256'],
        sceneProbeUpdateMode: ['static', 'slow-dynamic'],
        pmndrsAAMode: ['none', 'smaa', 'msaa'],
        pmndrsAAPreset: ['low', 'medium', 'high', 'ultra'],
        pmndrsAtmosphereQuality: ['performance', 'balanced', 'quality', 'cinematic'],
        pmndrsCloudsQuality: ['low', 'medium', 'high', 'ultra']
    };
    const BOOLEAN_SETTINGS = [
        'flatMediaShadowCasting', 'postFXEnabled', 'postFXBloomEnabled', 'postFXEdgeAAEnabled', 'postFXTAAEnabled',
        'postFXSSREnabled', 'pmndrsLensFlareEnabled', 'pmndrsNoiseEnabled',
        'pmndrsLutEnabled', 'pmndrsVignetteEnabled', 'pmndrsChromaticAberrationEnabled', 'pmndrsAtmosphereEnabled', 'pmndrsAerialPerspectiveEnabled',
        'pmndrsCloudsEnabled', 'pmndrsCloudsLightShaftsEnabled', 'reflectionsEnabled'
    ];

    function contract() {
        return window.VRODOS_DESKTOP_PERFORMANCE_PROFILE_CONTRACT || null;
    }

    function runtimeSettings() {
        return (window.VRODOS_RUNTIME_SETTINGS_CONTRACT || {}).sceneSettings || {};
    }

    function scene() {
        return VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function bool(value) {
        if (typeof value === 'boolean') return value;
        return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
    }

    function normalizeValue(settingKey, value) {
        const definition = runtimeSettings()[settingKey] || {};
        if (definition.type === 'boolean') return bool(value);
        if (definition.type === 'number') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : Number(definition.default || 0);
        }
        return value === undefined || value === null ? definition.default : String(value);
    }

    function normalizeSettings(settings) {
        const managed = (contract() && contract().managedSettings) || [];
        const normalized = {};
        managed.forEach((settingKey) => {
            if (Object.prototype.hasOwnProperty.call(settings || {}, settingKey)) {
                normalized[settingKey] = normalizeValue(settingKey, settings[settingKey]);
            }
        });
        return normalized;
    }

    function editableSettings(profileId) {
        const definition = (contract() && contract().profiles && contract().profiles[profileId]) || {};
        return Array.isArray(definition.editableSettings) ? definition.editableSettings : [];
    }

    function tierSettings(profileId, settings) {
        const normalized = normalizeSettings(settings || {});
        const picked = {};
        editableSettings(profileId).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(normalized, key)) picked[key] = normalized[key];
        });
        return picked;
    }

    function allowedValues(profileId, settingKey) {
        const profile = (contract() && contract().profiles && contract().profiles[profileId]) || {};
        if (profile.allowedValues && Array.isArray(profile.allowedValues[settingKey])) {
            return profile.allowedValues[settingKey].slice();
        }
        const definition = runtimeSettings()[settingKey] || {};
        if (definition.type === 'boolean') return [false, true];
        return Array.isArray(definition.allowed) ? definition.allowed.slice() : [];
    }

    function captureManagedSettings() {
        const activeScene = scene();
        const managed = (contract() && contract().managedSettings) || [];
        const captured = {};
        managed.forEach((settingKey) => {
            const definition = runtimeSettings()[settingKey];
            if (!definition || !definition.metadataKey) return;
            const value = Object.prototype.hasOwnProperty.call(activeScene, definition.metadataKey)
                ? activeScene[definition.metadataKey]
                : definition.default;
            captured[settingKey] = normalizeValue(settingKey, value);
        });
        return captured;
    }

    function derivePreset(highSettings, profileId) {
        const definition = contract().profiles[profileId] || {};
        const preset = Object.assign({}, highSettings, normalizeSettings(definition.settings || {}));
        if (profileId === 'high') {
            preset.renderQuality = 'high';
            return preset;
        }

        const highClouds = bool(highSettings.pmndrsCloudsEnabled);
        const highAtmosphere = bool(highSettings.pmndrsAtmosphereEnabled);
        const highReflections = bool(highSettings.reflectionsEnabled);
        const envMapDefinition = runtimeSettings().envMapPreset || {};
        const activeScene = scene();
        const authoredEnvMap = activeScene && envMapDefinition.metadataKey && Object.prototype.hasOwnProperty.call(activeScene, envMapDefinition.metadataKey)
            ? activeScene[envMapDefinition.metadataKey]
            : envMapDefinition.default;
        const highHasHdr = String(authoredEnvMap || 'none') !== 'none';
        preset.pmndrsAtmosphereEnabled = highAtmosphere;
        preset.pmndrsCloudsEnabled = highClouds;
        preset.reflectionsEnabled = highReflections && (String(highSettings.reflectionSource || 'hdr') === 'hdr' || highHasHdr);

        if (highClouds) {
            preset.postFXEnabled = true;
            preset.postFXEngine = 'pmndrs';
        } else if (profileId === 'low') {
            preset.postFXEnabled = false;
        }
        Object.entries(ORDERED_SETTINGS).forEach(([settingKey, order]) => {
            if (settingKey === 'renderQuality') return;
            const highCost = order.indexOf(String(highSettings[settingKey]));
            const presetCost = order.indexOf(String(preset[settingKey]));
            if (highCost >= 0 && presetCost > highCost) preset[settingKey] = highSettings[settingKey];
        });
        BOOLEAN_SETTINGS.forEach((settingKey) => {
            if (!bool(highSettings[settingKey])) preset[settingKey] = false;
        });
        return preset;
    }

    function createProfiles() {
        const highPreset = derivePreset(captureManagedSettings(), 'high');
        const profiles = {};
        TIER_IDS.forEach((profileId) => {
            const presetSettings = derivePreset(highPreset, profileId);
            profiles[profileId] = {
                presetSettings: tierSettings(profileId, presetSettings),
                settings: tierSettings(profileId, presetSettings)
            };
        });
        return {
            schemaVersion: 2,
            activeTab: 'custom',
            buildMode: 'adaptive',
            profiles
        };
    }

    function migrateState(stored) {
        if (!stored || typeof stored !== 'object') return createProfiles();
        if (Number(stored.schemaVersion) === 2) return stored;
        const activeProfile = TIER_IDS.includes(stored.activeProfile) ? stored.activeProfile : 'high';
        const adaptive = stored.autoSelect !== false;
        const migrated = {
            schemaVersion: 2,
            activeTab: adaptive ? activeProfile : 'custom',
            buildMode: adaptive ? 'adaptive' : 'custom',
            profiles: stored.profiles && typeof stored.profiles === 'object' ? clone(stored.profiles) : {}
        };
        if (!adaptive && migrated.profiles[activeProfile] && migrated.profiles[activeProfile].settings) {
            applySettingsToScene(migrated.profiles[activeProfile].settings);
        }
        return migrated;
    }

    function ensureProfiles() {
        const activeScene = scene();
        if (!activeScene || !contract()) return null;
        activeScene.desktopPerformanceProfiles = migrateState(activeScene.desktopPerformanceProfiles);
        const state = activeScene.desktopPerformanceProfiles;
        state.schemaVersion = 2;
        state.activeTab = PROFILE_IDS.includes(state.activeTab) ? state.activeTab : 'custom';
        state.buildMode = state.buildMode === 'custom' ? 'custom' : 'adaptive';
        state.profiles = state.profiles && typeof state.profiles === 'object' ? state.profiles : {};
        const currentHighPreset = derivePreset(captureManagedSettings(), 'high');
        TIER_IDS.forEach((profileId) => {
            if (!state.profiles[profileId] || !state.profiles[profileId].settings) {
                const presetSettings = tierSettings(profileId, derivePreset(currentHighPreset, profileId));
                state.profiles[profileId] = { presetSettings, settings: clone(presetSettings) };
            }
            state.profiles[profileId].settings = tierSettings(profileId, state.profiles[profileId].settings);
            state.profiles[profileId].presetSettings = tierSettings(
                profileId,
                state.profiles[profileId].presetSettings || derivePreset(currentHighPreset, profileId)
            );
        });
        delete state.activeProfile;
        delete state.autoSelect;
        return state;
    }

    function applySettingsToScene(settings) {
        const activeScene = scene();
        Object.entries(normalizeSettings(settings)).forEach(([settingKey, value]) => {
            const definition = runtimeSettings()[settingKey];
            if (definition && definition.metadataKey) {
                activeScene[definition.metadataKey] = value;
            }
        });
    }

    function settingsEqual(left, right) {
        return JSON.stringify(normalizeSettings(left)) === JSON.stringify(normalizeSettings(right));
    }

    function orderedCost(settingKey, settings, order) {
        let value = String(settings[settingKey]);
        if (settingKey === 'pmndrsAAMode' && value === 'inherit') {
            value = String(settings.aaQuality) === 'off' ? 'none' : 'msaa';
        }
        if (settingKey === 'pmndrsAAPreset' && value === 'inherit') {
            value = ({ off: 'low', balanced: 'medium', high: 'high', ultra: 'ultra' })[String(settings.aaQuality)] || 'medium';
        }
        return order.indexOf(value);
    }

    function currentTargetIsDesktop() {
        const target = document.getElementById('compileRuntimeTargetSelect');
        if (target) return target.value === 'desktop';
        return scene() && scene().aframeVrRuntimeProfile === 'desktop';
    }

    function effectiveTierSettings(state, profileId) {
        const high = Object.assign({}, captureManagedSettings(), normalizeSettings((contract().profiles.high || {}).settings || {}), state.profiles.high.settings);
        if (profileId === 'high') return high;
        return Object.assign({}, derivePreset(high, profileId), state.profiles[profileId].settings);
    }

    function refreshTierPresets(state) {
        const highPreset = derivePreset(captureManagedSettings(), 'high');
        TIER_IDS.forEach((profileId) => {
            const slot = state.profiles[profileId];
            const previous = slot.presetSettings || {};
            const next = tierSettings(profileId, derivePreset(highPreset, profileId));
            const current = slot.settings || {};
            Object.keys(next).forEach((key) => {
                if (!Object.prototype.hasOwnProperty.call(current, key) || normalizeValue(key, current[key]) === normalizeValue(key, previous[key])) {
                    current[key] = next[key];
                }
            });
            slot.settings = tierSettings(profileId, current);
            slot.presetSettings = next;
        });
    }

    function formatOption(value) {
        if (typeof value === 'boolean') return value ? 'On' : 'Off';
        return String(value).split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }

    function sharedFeatureAllows(settingKey, value) {
        if (!bool(value)) return true;
        const shared = captureManagedSettings();
        return !BOOLEAN_SETTINGS.includes(settingKey) || bool(shared[settingKey]);
    }

    function renderTierControls(state) {
        const profileId = state.activeTab;
        const container = document.getElementById('compileDesktopTierControls');
        if (!container || !TIER_IDS.includes(profileId)) return;
        container.replaceChildren();
        const slot = state.profiles[profileId];
        editableSettings(profileId).forEach((settingKey) => {
            const values = allowedValues(profileId, settingKey);
            if (!values.length) return;
            const label = document.createElement('label');
            label.className = 'tw-form-control';
            const title = document.createElement('span');
            title.className = 'tw-label-text tw-text-[10px] tw-font-bold tw-uppercase tw-text-slate-500';
            title.textContent = SETTING_LABELS[settingKey] || settingKey;
            const select = document.createElement('select');
            select.className = 'tw-select tw-select-bordered tw-select-xs tw-w-full tw-mt-1 tw-bg-white';
            select.dataset.vrodosTierSetting = settingKey;
            values.forEach((value) => {
                const option = document.createElement('option');
                option.value = String(value);
                option.textContent = formatOption(value);
                option.disabled = !sharedFeatureAllows(settingKey, value);
                select.appendChild(option);
            });
            select.value = String(slot.settings[settingKey]);
            if (!Array.from(select.options).some((option) => option.value === select.value && !option.disabled)) {
                const first = Array.from(select.options).find((option) => !option.disabled);
                if (first) {
                    select.value = first.value;
                    slot.settings[settingKey] = normalizeValue(settingKey, first.value);
                }
            }
            select.addEventListener('change', () => {
                slot.settings[settingKey] = normalizeValue(settingKey, select.value);
                updateUi();
            });
            label.appendChild(title);
            label.appendChild(select);
            container.appendChild(label);
        });
    }

    function setCustomQualityVisibility(state, desktop) {
        const qualityIds = [
            'compileRenderQualitySelect', 'compileShadowQualitySelect', 'compileAmbientOcclusionPresetSelect',
            'compileContactShadowPresetSelect', 'compileReflectionSourceSelect', 'compileReflectionProfileSelect',
            'compileAAQualitySelect', 'compilePmndrsAAModeSelect', 'compilePmndrsAAPresetSelect',
            'compilePmndrsAtmosphereQualitySelect', 'compilePmndrsCloudsQualitySelect'
        ];
        const show = !desktop || state.buildMode === 'custom';
        qualityIds.forEach((id) => {
            const control = document.getElementById(id);
            const wrapper = control && control.closest('label');
            if (wrapper) wrapper.style.display = show ? '' : 'none';
        });
        const probe = document.getElementById('compileSceneProbeControlsWrapper');
        if (probe) probe.style.display = show ? '' : 'none';
    }

    function updateUi() {
        const state = ensureProfiles();
        const panel = document.getElementById('compileDesktopProfilesPanel');
        if (!panel || !state) return;
        const desktop = currentTargetIsDesktop();
        panel.style.display = desktop ? '' : 'none';
        const customPanel = document.getElementById('compileDesktopCustomPanel');
        const tierPanel = document.getElementById('compileDesktopTierPanel');
        if (!desktop) {
            if (customPanel) customPanel.style.display = '';
            if (tierPanel) tierPanel.style.display = 'none';
            setCustomQualityVisibility(state, false);
            return;
        }

        panel.querySelectorAll('[data-vrodos-desktop-profile]').forEach((button) => {
            const active = button.dataset.vrodosDesktopProfile === state.activeTab;
            button.classList.toggle('tw-tab-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panel.querySelectorAll('input[name="compileDesktopBuildMode"]').forEach((input) => {
            input.checked = input.value === state.buildMode;
        });
        const isTier = TIER_IDS.includes(state.activeTab);
        if (customPanel) customPanel.style.display = isTier ? 'none' : '';
        if (tierPanel) tierPanel.style.display = isTier ? '' : 'none';
        const badge = document.getElementById('compileDesktopProfileState');
        if (badge) {
            badge.style.display = isTier ? '' : 'none';
            if (isTier) {
                badge.textContent = settingsEqual(state.profiles[state.activeTab].settings, state.profiles[state.activeTab].presetSettings) ? 'Default' : 'Modified';
            }
        }
        const hint = document.getElementById('compileDesktopProfileSelectionHint');
        if (hint) {
            hint.textContent = state.buildMode === 'adaptive'
                ? 'The browser selects Low, Medium, or High before A-Frame, runtime chunks, or GLBs download.'
                : 'Only the authored Custom experience is published. Adaptive selection and downgrades are disabled.';
        }
        if (isTier) {
            const definition = contract().profiles[state.activeTab] || {};
            const title = document.getElementById('compileDesktopTierTitle');
            const budget = document.getElementById('compileDesktopTierBudget');
            const fixed = document.getElementById('compileDesktopTierFixedSummary');
            const excluded = document.getElementById('compileDesktopTierExcluded');
            if (title) title.textContent = `${definition.label || state.activeTab} quality controls`;
            if (budget) budget.textContent = definition.summary || '';
            if (fixed) fixed.textContent = FIXED_SUMMARIES[state.activeTab] || '';
            if (excluded) excluded.style.display = state.buildMode === 'custom' ? '' : 'none';
            renderTierControls(state);
        }
        setCustomQualityVisibility(state, true);
        showValidation();
    }

    function captureActive() {
        if (!currentTargetIsDesktop()) return;
        const state = ensureProfiles();
        if (!state || state.activeTab !== 'custom') return;
        refreshTierPresets(state);
        updateUi();
    }

    function switchProfile(profileId) {
        const state = ensureProfiles();
        if (!state || !PROFILE_IDS.includes(profileId) || profileId === state.activeTab) return;
        if (state.activeTab === 'custom' && typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
            VRODOS.ui.applyCompileDialogSettingsToScene();
        }
        state.activeTab = profileId;
        updateUi();
    }

    function resetActive() {
        const state = ensureProfiles();
        if (!state || !TIER_IDS.includes(state.activeTab)) return;
        const highPreset = derivePreset(captureManagedSettings(), 'high');
        const preset = tierSettings(state.activeTab, derivePreset(highPreset, state.activeTab));
        state.profiles[state.activeTab] = { presetSettings: preset, settings: clone(preset) };
        updateUi();
    }

    function validationErrors() {
        const state = ensureProfiles();
        if (!state || !currentTargetIsDesktop() || state.buildMode !== 'adaptive') return [];
        const values = {};
        TIER_IDS.forEach((profileId) => { values[profileId] = effectiveTierSettings(state, profileId); });
        const errors = [];
        TIER_IDS.forEach((profileId) => {
            editableSettings(profileId).forEach((settingKey) => {
                const allowed = allowedValues(profileId, settingKey);
                const value = state.profiles[profileId].settings[settingKey];
                if (!allowed.some((candidate) => typeof candidate === 'boolean' ? bool(value) === candidate : String(value) === String(candidate))) {
                    errors.push(`${SETTING_LABELS[settingKey] || settingKey} is outside the allowed ${profileId} range.`);
                }
            });
        });
        Object.entries(ORDERED_SETTINGS).forEach(([settingKey, order]) => {
            const costs = TIER_IDS.map((profileId) => orderedCost(settingKey, values[profileId], order));
            if (costs.some((cost) => cost < 0) || costs[0] > costs[1] || costs[1] > costs[2]) errors.push(`${SETTING_LABELS[settingKey] || settingKey} cannot be more expensive in a lower tier.`);
        });
        BOOLEAN_SETTINGS.forEach((settingKey) => {
            const costs = TIER_IDS.map((profileId) => bool(values[profileId][settingKey]) ? 1 : 0);
            if (costs[0] > costs[1] || costs[1] > costs[2]) errors.push(`${SETTING_LABELS[settingKey] || settingKey} cannot be enabled below a tier where it is disabled.`);
        });
        return [...new Set(errors)];
    }

    function showValidation() {
        const warning = document.getElementById('compileDesktopProfileWarning');
        if (!warning) return;
        const errors = validationErrors();
        warning.textContent = errors.length ? errors[0] : '';
        warning.style.display = errors.length ? '' : 'none';
    }

    function prepare() {
        const state = ensureProfiles();
        if (!state) return;
        updateUi();
    }

    function moveRuntimeControlsAboveProfiles() {
        const mount = document.getElementById('compileRuntimePolicyMount');
        const mode = document.getElementById('compileRuntimeModeSelect');
        const target = document.getElementById('compileRuntimeTargetSelect');
        if (!mount || !mode || !target || mount.childElementCount) return;
        const card = document.createElement('div');
        card.className = 'tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-space-y-3';
        const heading = document.createElement('h4');
        heading.className = 'tw-text-sm tw-font-bold tw-text-slate-800';
        heading.textContent = 'Runtime output';
        card.appendChild(heading);
        const modeWrapper = mode.closest('.tw-rounded-lg');
        const targetWrapper = target.closest('label');
        const headset = document.getElementById('compileVrHeadsetPolicyPanel');
        if (modeWrapper) card.appendChild(modeWrapper);
        if (targetWrapper) card.appendChild(targetWrapper);
        if (headset) card.appendChild(headset);
        mount.appendChild(card);
    }

    function bind() {
        const panel = document.getElementById('compileDesktopProfilesPanel');
        if (!panel || panel.dataset.vrodosProfilesBound === '1') return;
        panel.dataset.vrodosProfilesBound = '1';
        moveRuntimeControlsAboveProfiles();
        panel.querySelectorAll('[data-vrodos-desktop-profile]').forEach((button) => {
            button.addEventListener('click', () => switchProfile(button.dataset.vrodosDesktopProfile));
        });
        const reset = document.getElementById('compileDesktopProfileReset');
        if (reset) reset.addEventListener('click', resetActive);
        panel.querySelectorAll('input[name="compileDesktopBuildMode"]').forEach((input) => {
            input.addEventListener('change', () => {
                const state = ensureProfiles();
                if (state && input.checked) state.buildMode = input.value === 'custom' ? 'custom' : 'adaptive';
                updateUi();
            });
        });
        const target = document.getElementById('compileRuntimeTargetSelect');
        if (target) target.addEventListener('change', updateUi);
        const dialog = document.getElementById('compile-dialog');
        if (dialog) {
            dialog.addEventListener('change', () => window.setTimeout(captureActive, 0));
            dialog.addEventListener('input', () => window.setTimeout(captureActive, 0));
        }
        updateUi();
    }

    VRODOS.ui.desktopPerformanceProfiles = {
        bind,
        prepare,
        captureActive,
        validationErrors,
        switchProfile,
        resetActive,
        _test: { migrateState, tierSettings, allowedValues, settingsEqual }
    };
    window.addEventListener('DOMContentLoaded', bind);
}());
