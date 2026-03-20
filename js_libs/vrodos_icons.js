/**
 * VRodos — Single Source of Truth for category → Lucide icon mapping.
 *
 * Used by: Hierarchy Viewer, Asset Browser Toolbar, and any other
 * place that needs to display a category icon.
 *
 * Keys can be a category_slug (from taxonomy) or a category_name
 * (set at runtime for lights/pawn/director).  Both namespaces are
 * merged here so a single lookup works everywhere.
 *
 * To add a new category icon, add ONE entry here.
 */
var VRODOS_CATEGORY_ICONS = {

    // ── Asset taxonomy categories (slug) ──────────────────────
    'decoration':      'leaf',
    'door':            'door-open',
    'video':           'clapperboard',
    'poi-imagetext':   'image',
    'chat':            'message-square',
    'poi-link':        'external-link',

    // ── Lights (category_name, set by JS at runtime) ──────────
    'lightSun':        'sun',
    'lightLamp':       'lightbulb',
    'lightSpot':       'flashlight',
    'lightAmbient':    'sun-dim',
    'lightTargetSpot': 'target',
    'lightHelper':     'circle-dot',

    // ── Special types ─────────────────────────────────────────
    'pawn':            'person-standing',
    'director':        'video',          // avatarCamera
};

/** Default icon when category is unknown */
var VRODOS_CATEGORY_ICON_DEFAULT = 'package';

/**
 * Look up the Lucide icon name for a category.
 *
 * Checks category_slug first, then category_name, then falls back
 * to VRODOS_CATEGORY_ICON_DEFAULT.
 *
 * @param {string} categoryKey  category_slug, category_name, or category_icon from DB
 * @returns {string} Lucide icon name
 */
function vrodos_getCategoryIcon(categoryKey) {
    if (!categoryKey) return VRODOS_CATEGORY_ICON_DEFAULT;
    return VRODOS_CATEGORY_ICONS[categoryKey] || VRODOS_CATEGORY_ICON_DEFAULT;
}
