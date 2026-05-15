"use strict";

VRODOS.ui.badges = VRODOS.ui.badges || {};

VRODOS.ui.badges.cefrLevels = ['A1', 'A2', 'B1', 'B2'];

VRODOS.ui.badges.escapeHTML = function(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

VRODOS.ui.badges.decodeText = function(value) {
    if (typeof VRODOS.utils.decodeDisplayText === 'function') {
        return VRODOS.utils.decodeDisplayText(value);
    }

    let text = typeof value === 'string' ? value : '';
    if (!text) return '';

    if (/%[0-9a-fA-F]{2}/.test(text)) {
        try {
            text = decodeURIComponent(text);
        } catch (err) {
            // Keep original text if decoding fails.
        }
    }

    if (/(?:\\+|\/+)?u[0-9a-fA-F]{4}/.test(text)) {
        text = text.replace(/(?:\\+|\/+)?u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
    }

    return text;
};

VRODOS.ui.badges.normalizeCefrLevels = function(levels) {
    let source = levels;
    const allowedLevels = ['A1', 'A2', 'B1', 'B2', 'ALL', 'ALL LEVELS'];

    if (Array.isArray(source)) {
        return source
            .map((level) => {
                if (level && typeof level === 'object') {
                    return '';
                }
                return VRODOS.ui.badges.decodeText(level).trim().toUpperCase();
            })
            .filter(Boolean);
    }

    if (typeof source === 'string' && source.trim() !== '') {
        try {
            source = JSON.parse(source);
        } catch (err) {
            try {
                const binary = window.atob(source);
                const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
                const decoded = new TextDecoder('utf-8').decode(bytes);
                source = JSON.parse(decoded);
            } catch (base64Err) {
                const matches = source.toUpperCase().match(/\b(?:ALL LEVELS|ALL|A1|A2|B1|B2)\b/g);
                source = matches || [];
            }
        }
    }

    if (typeof source === 'string') {
        const matches = source.toUpperCase().match(/\b(?:ALL LEVELS|ALL|A1|A2|B1|B2)\b/g);
        source = matches || [];
    }

    if (!Array.isArray(source)) {
        return [];
    }

    return Array.from(new Set(source
        .map((level) => VRODOS.ui.badges.decodeText(level).trim().toUpperCase())
        .filter((level) => allowedLevels.indexOf(level) !== -1)
        .filter(Boolean)));
};

VRODOS.ui.badges.resolveCefrLevels = function(levels, emptyMeansAll) {
    const normalizedLevels = VRODOS.ui.badges.normalizeCefrLevels(levels);
    const allLevels = VRODOS.ui.badges.cefrLevels;

    if (!normalizedLevels.length) {
        return emptyMeansAll === false ? [] : allLevels.slice();
    }

    if (normalizedLevels.indexOf('ALL') !== -1 || normalizedLevels.indexOf('ALL LEVELS') !== -1) {
        return allLevels.slice();
    }

    return allLevels.filter((level) => normalizedLevels.indexOf(level) !== -1);
};

VRODOS.ui.badges.hasAllCefrLevels = function(levels) {
    const allLevels = VRODOS.ui.badges.cefrLevels;
    return levels.length === allLevels.length && allLevels.every((level) => levels.indexOf(level) !== -1);
};

VRODOS.ui.badges.renderCefrLevelBadgesHTML = function(levels, options) {
    const settings = options || {};
    const resolvedLevels = VRODOS.ui.badges.resolveCefrLevels(levels, settings.emptyMeansAll);
    if (!resolvedLevels.length) {
        return '';
    }

    const textClass = settings.textClass || 'tw-text-emerald-100';
    const badgeClass = settings.badgeClass ||
        `tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-emerald-400/35 tw-bg-emerald-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] ${textClass}`;
    const fullLevelTitle = VRODOS.ui.badges.cefrLevels.join(', ');

    if (VRODOS.ui.badges.hasAllCefrLevels(resolvedLevels)) {
        return `<span class="${badgeClass}" title="${VRODOS.ui.badges.escapeHTML(fullLevelTitle)}">All</span>`;
    }

    return resolvedLevels.map((level) => (
        `<span class="${badgeClass}">${VRODOS.ui.badges.escapeHTML(level)}</span>`
    )).join('');
};

VRODOS.ui.buildCefrLevelBadgesHTML = function(levels, options) {
    return VRODOS.ui.badges.renderCefrLevelBadgesHTML(levels, options);
};
