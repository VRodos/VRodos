"use strict";

VRODOS.ui.badges = VRODOS.ui.badges || {};

VRODOS.ui.badges.cefrLevels = ['A1', 'A2', 'B1', 'B2'];

VRODOS.ui.badges.decodeText = function(value) {
    return VRODOS.utils.displayText(value);
};

VRODOS.ui.badges.escapeHTML = VRODOS.utils.escapeHTML;

VRODOS.ui.badges.normalizeCefrLevels = VRODOS.utils.normalizeCefrLevels;

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
