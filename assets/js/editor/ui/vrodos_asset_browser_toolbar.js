//  AJAX: FETCH Assets 3d
const VRODOS_ASSET_BROWSER_SELECTORS = {
    toolbar: 'assetBrowserToolbar',
    categoryTabs: 'assetCategTab',
    allAssetsTab: 'allAssetsViewBt',
    visibilityFilter: '[data-asset-visibility-filter]',
    dataList: '.data',
    assetCard: 'li:not(.asset-empty-state)',
    editButton: '[data-vrodos-asset-edit-url]',
    emptyState: '.asset-empty-state',
    skeleton: '.asset-skeleton'
};

function getAssetBrowserElement(id) {
    return document.getElementById(id);
}

function getAssetBrowserElements() {
    const toolbar = getAssetBrowserElement(VRODOS_ASSET_BROWSER_SELECTORS.toolbar);
    const categoryTabs = getAssetBrowserElement(VRODOS_ASSET_BROWSER_SELECTORS.categoryTabs);
    const fileList = toolbar ? toolbar.querySelector(VRODOS_ASSET_BROWSER_SELECTORS.dataList) : null;

    return { toolbar, categoryTabs, fileList };
}

function buildAssetEditUrl(editBaseUrl, assetId, ownerProjectId) {
	const url = new URL(`${editBaseUrl}${assetId}`, window.location.href);
	const returnProjectId = url.searchParams.get('vrodos_game');
	if (returnProjectId) {
		url.searchParams.set('vrodos_return_game', returnProjectId);
	}
	if (ownerProjectId) {
		url.searchParams.set('vrodos_game', String(ownerProjectId));
	}
	url.searchParams.set('scene_type', 'scene');
	url.searchParams.set('preview', '0');
	url.searchParams.set('editable', 'true');
	return url.toString();
}

function bindAssetListControls(fileList) {
    if (!fileList || fileList.dataset.vrodosAssetListBound === '1') {
        return;
    }

    fileList.dataset.vrodosAssetListBound = '1';
    fileList.addEventListener('click', (event) => {
        event.preventDefault();

        const editButton = event.target.closest(VRODOS_ASSET_BROWSER_SELECTORS.editButton);
        if (editButton && editButton.dataset.vrodosAssetEditUrl) {
            window.location.href = editButton.dataset.vrodosAssetEditUrl;
        }
    });
}

function bindAssetCategoryTabs(categoryTabs, openCategoryTab) {
    if (!categoryTabs || categoryTabs.dataset.vrodosAssetTabsBound === '1') {
        return;
    }

    categoryTabs.dataset.vrodosAssetTabsBound = '1';
    categoryTabs.addEventListener('click', (event) => {
        const button = event.target.closest('.tablinks');
        if (!button || !categoryTabs.contains(button)) {
            return;
        }

        openCategoryTab(button);
    });
}

function assetBrowserFlagIsTrue(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function assetBrowserMatchesVisibility(value, visibility) {
    if (visibility === 'shared') {
        return assetBrowserFlagIsTrue(value);
    }
    if (visibility === 'private') {
        return !assetBrowserFlagIsTrue(value);
    }
    return true;
}

VRODOS.api.fetchListAvailableAssets = function(isAdmin, gameProjectSlug, urlforAssetEdit, gameProjectID) {

    const url = VRODOS.config.isAdmin === "back" ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl();
	const body = new URLSearchParams({
		'action': 'vrodos_fetch_game_assets_action',
		nonce: window.vrodos_data.scene_mutation_nonce,
        gameProjectSlug,
        gameProjectID
    });

    fetch(url, { method: 'POST', body })
        .then((r) => r.text())
        .then((text) => {
            const trimmed = text.trim();
            if (!trimmed || trimmed[0] === '<') {
                throw new Error(`Asset list endpoint returned HTML from ${url}`);
            }

            return JSON.parse(trimmed);
        })
        .then((responseRecords) => {
            VRODOS.ui.fileBrowsingByDb(responseRecords.items, gameProjectSlug, urlforAssetEdit);
        })
        .catch((err) => {
            console.log(`ERROR 51:${  err}`);
        });
};

/**
 * Start the browser
 * @param responseData
 */
VRODOS.ui.fileBrowsingByDb = function(responseData, gameProjectSlug, urlforAssetEdit) {
    window.vrodosAssetBrowserItemsById = {};

    function vrodos_getAssetPreviewFallbackIcon(asset) {
        const categoryKey = asset && (asset.category_slug || asset.category_icon);
        return ["assessment", "3d-text"].indexOf(categoryKey) !== -1
          ? VRODOS.ui.getCategoryIcon(categoryKey)
          : "image-off";
    }

    function vrodos_buildAssetMetaHTML(asset) {
        if (!asset) {
            return '';
        }

        const isAssessment = String(asset.category_slug || '').toLowerCase() === 'assessment';
        const genericLevelsSource = asset.immerse_cefr_levels || '';
        const assessmentType = VRODOS.utils.displayText(asset.assessment_type || asset.assessment_group || '').trim();
        const buildLevelBadges = typeof VRODOS.ui.buildCefrLevelBadgesHTML === 'function'
            ? VRODOS.ui.buildCefrLevelBadgesHTML
            : function() { return ''; };
        const levelBadgesHTML = isAssessment
            ? buildLevelBadges(asset.assessment_levels || '', { emptyMeansAll: false, textClass: 'tw-text-emerald-100' })
            : buildLevelBadges(genericLevelsSource, { emptyMeansAll: false, textClass: 'tw-text-emerald-100' });
        let typeBadgeHTML = '';

        if (isAssessment && assessmentType) {
            typeBadgeHTML =
                `<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-sky-400/35 tw-bg-sky-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-sky-100">${ 
                VRODOS.utils.escapeHTML(assessmentType)
                }</span>`;
        }

        if (!typeBadgeHTML && !levelBadgesHTML) {
            return '';
        }

        return `<div class="vrodos-asset-card-meta">${
            typeBadgeHTML ? `<div class="vrodos-asset-card-meta-row">${  typeBadgeHTML  }</div>` : ''
        }${
            levelBadgesHTML ? `<div class="vrodos-asset-card-meta-row">${  levelBadgesHTML  }</div>` : ''
        }</div>`;
    }

    const { toolbar: filemanager, categoryTabs, fileList } = getAssetBrowserElements();
    if (!filemanager || !fileList) {
        return;
    }

    // Persistent drag ghost element — styled card with thumbnail + name
    const dragGhost = document.createElement('div');
    Object.assign(dragGhost.style, {
        position: 'absolute', top: '-9999px', left: '-9999px',
        width: '120px', borderRadius: '8px', overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)', pointerEvents: 'none',
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)'
    });
    const dragGhostMedia = document.createElement('div');
    Object.assign(dragGhostMedia.style, {
        width: '100%',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#334155'
    });
    const dragGhostImg = document.createElement('img');
    Object.assign(dragGhostImg.style, { width: '100%', height: '72px', objectFit: 'cover', display: 'none' });
    const dragGhostFallback = document.createElement('div');
    Object.assign(dragGhostFallback.style, {
        width: '100%',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#cbd5e1'
    });
    const dragGhostLabel = document.createElement('div');
    Object.assign(dragGhostLabel.style, {
        padding: '4px 6px', fontSize: '9px', fontWeight: '700',
        color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', textAlign: 'center', letterSpacing: '0.03em'
    });
    dragGhostMedia.appendChild(dragGhostImg);
    dragGhostMedia.appendChild(dragGhostFallback);
    dragGhost.appendChild(dragGhostMedia);
    dragGhost.appendChild(dragGhostLabel);
    document.body.appendChild(dragGhost);

    responseData.forEach((asset) => {
        if (!asset || !asset.asset_id) {
            return;
        }

        window.vrodosAssetBrowserItemsById[String(asset.asset_id)] = asset;
    });

    const filterState = {
        category: VRODOS_ASSET_BROWSER_SELECTORS.allAssetsTab,
        visibility: 'all',
        search: ''
    };

    bindAssetListControls(fileList);
    bindAssetCategoryTabs(categoryTabs, openCategoryTab);
    bindAssetVisibilityFilters();
    render(responseData, gameProjectSlug, urlforAssetEdit);
    applyAssetBrowserFilters();
    if (typeof VRODOS.ui.setHierarchyViewer === 'function') {
        VRODOS.ui.setHierarchyViewer();
    }

    const searchBox = filemanager.querySelector('.search');
    const searchInput = searchBox ? searchBox.querySelector('input[type=search]') : null;
    const searchToggle = searchBox ? searchBox.querySelector('.asset-search-toggle') : null;
    if (searchBox && searchInput && searchToggle) {
        searchToggle.addEventListener('click', () => {
            searchBox.classList.add('expanded');
            searchToggle.setAttribute('aria-expanded', 'true');
            searchInput.focus();
        });
        searchInput.addEventListener('input', function () {
            filterState.search = this.value.trim().toLowerCase();
            filemanager.classList.toggle('searching', filterState.search.length > 0);
            applyAssetBrowserFilters();
        });
        searchInput.addEventListener('keyup', function (e) {
            if (e.key !== 'Escape') {
                return;
            }

            if (this.value) {
                this.value = '';
                filterState.search = '';
                filemanager.classList.remove('searching');
                applyAssetBrowserFilters();
            } else {
                searchBox.classList.remove('expanded');
                searchToggle.setAttribute('aria-expanded', 'false');
                searchToggle.focus();
            }
        });
        searchBox.addEventListener('focusout', (event) => {
            if (!searchBox.contains(event.relatedTarget) && !searchInput.value.trim()) {
                searchBox.classList.remove('expanded');
                searchToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    fileList.addEventListener('dragstart', (e) => {
        const target = e.target.closest('li[draggable]') || e.target;
        const screenshotImage = target.getAttribute("data-screenshot_path");
        const assetName = target.getAttribute("data-asset_name") || '';
        const fallbackIcon = vrodos_getAssetPreviewFallbackIcon({
            category_slug: target.getAttribute("data-category_slug"),
            category_icon: target.getAttribute("data-category_icon")
        });

        // Update drag ghost with this asset's image and name
        if (screenshotImage) {
            dragGhostImg.src = screenshotImage;
            dragGhostImg.style.display = 'block';
            dragGhostFallback.style.display = 'none';
            dragGhostFallback.innerHTML = '';
        } else {
            dragGhostImg.removeAttribute('src');
            dragGhostImg.style.display = 'none';
            dragGhostFallback.style.display = 'flex';
            dragGhostFallback.innerHTML = `<i data-lucide="${  VRODOS.utils.escapeAttribute(fallbackIcon)  }" style="width:28px; height:28px;"></i>`;
            VRODOS.ui.refreshLucideIcons();
        }
        dragGhostLabel.textContent = VRODOS.utils.displayText(assetName);
        e.dataTransfer.setDragImage(dragGhost, 60, 45);

        const dragData = VRODOS.utils.createAssetDragPayload(target);
        VRODOS.utils.writeJsonDataTransfer(e, dragData);
    });

    fileList.addEventListener('drag', (e) => { e.preventDefault(); });
    fileList.addEventListener('dragend', (e) => { e.preventDefault(); });

    // Render the HTML for the file manager
    // Here we make the list
    function render(enlistData, gameProjectSlug, urlforAssetEdit) {

        // Remove skeleton placeholders on first render
        fileList.querySelectorAll(VRODOS_ASSET_BROWSER_SELECTORS.skeleton).forEach((el) => { el.remove(); });

        // Remove any previous empty state
        fileList.querySelectorAll(VRODOS_ASSET_BROWSER_SELECTORS.emptyState).forEach((el) => { el.remove(); });

        let f; let name;

        if (enlistData && enlistData.length > 0) {

            for (let i = 0; i < enlistData.length; i++) {
                f = enlistData[i];

                name = VRODOS.utils.escapeHTML(VRODOS.utils.displayText(f.asset_name));

                const lucideIconName = VRODOS.ui.getCategoryIcon(f.category_slug || f.category_icon);

                // Add the category in tabs if not yet added
                if (categoryTabs && !document.getElementById(f.category_slug)) {
                    //Create an input type dynamically.
                    const element = document.createElement("button");
                    //Assign different attributes to the element.
                    element.className = "tablinks tw-btn tw-btn-xs tw-btn-ghost";
                    element.id = f.category_slug;
                    element.innerHTML = `<i data-lucide='${  VRODOS.utils.escapeAttribute(lucideIconName)  }' title='${  VRODOS.utils.escapeAttribute(f.category_name)  }' style='width:18px; height:18px;'></i>`;

                    categoryTabs.appendChild(element);
                }

                let draggable_string = '';
                for (const [key, value] of Object.entries(f)) {
                    draggable_string += `data-${  key  }="${  VRODOS.utils.escapeAttribute(value)  }" `;
                }

                const previewFallbackIcon = vrodos_getAssetPreviewFallbackIcon(f);
                const assetMetaHTML = vrodos_buildAssetMetaHTML(f);
                const previewMarkup = f.screenshot_path
                    ? `<img class="assetImg tw-w-full tw-h-full tw-object-cover tw-transition-transform tw-duration-700 group-hover:tw-scale-110" draggable="false" loading="lazy" decoding="async" src="${  encodeURI(f.screenshot_path)  }">`
                    : `<div class="assetImg tw-flex tw-items-center tw-justify-center tw-bg-slate-700/80">` +
                        `<i data-lucide="${  VRODOS.utils.escapeAttribute(previewFallbackIcon)  }" class="tw-w-10 tw-h-10 tw-text-slate-300"></i>` +
                      `</div>`;

                const liHTML = `<li draggable="true" id="asset-${  f.asset_id  }" ` +
                    `class="vrodos-asset-card tw-relative tw-bg-slate-800 tw-rounded-lg tw-overflow-hidden tw-shadow-md hover:tw-shadow-xl tw-transition-all tw-group tw-cursor-move"` +
                    ` title="Drag into scene" ${  draggable_string  }>${ 

                    previewMarkup 

                    }<div class="tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-slate-900/80 tw-via-transparent tw-to-transparent tw-opacity-60 group-hover:tw-opacity-90 tw-transition-opacity"></div>` +

                    `<div class="tw-absolute tw-top-1.5 tw-left-1.5 tw-bg-slate-900/60 tw-backdrop-blur-sm tw-px-1.5 tw-py-1 tw-rounded-md tw-border tw-border-white/10 tw-z-10 tw-max-w-[78%]">` +
                         `<span class="tw-text-[9px] tw-font-bold tw-text-slate-200 tw-truncate tw-block">${  name  }</span>` +
                    `</div>${  assetMetaHTML  }` +

                    `<div class="tw-absolute tw-top-1.5 tw-right-1.5 tw-bg-slate-900/60 tw-backdrop-blur-sm tw-p-1 tw-rounded-md tw-border tw-border-white/10 tw-z-10">` +
                        `<i data-lucide="${  VRODOS.utils.escapeAttribute(lucideIconName)  }" class="tw-w-3 tw-h-3 tw-text-slate-200"></i>` +
                    `</div>${ 

                    (function() {
						const canEditThis = f.can_edit === true || f.can_edit === 1 || f.can_edit === '1';
						if (canEditThis) {
							const editUrl = buildAssetEditUrl(urlforAssetEdit, f.asset_id, f.owner_project_id);
                            return `<div class="tw-absolute tw-bottom-0 tw-left-0 tw-w-full tw-p-2 tw-z-10 tw-transform tw-translate-y-1 group-hover:tw-translate-y-0 tw-transition-transform">` +
                                `<button type="button" class="tw-w-full tw-bg-indigo-500/80 hover:tw-bg-indigo-500 tw-backdrop-blur-md tw-text-[9px] tw-font-bold tw-text-white tw-py-1 tw-rounded tw-transition-all tw-tracking-widest" data-vrodos-asset-edit-url="${  VRODOS.utils.escapeAttribute(editUrl)  }">EDIT</button>` +
                            `</div>`;
                        }
                        return '';
                    })() 

                    }<div id="deleteAssetProgressBar-${  f.asset_id  }" class="tw-absolute tw-bottom-0 tw-left-0 tw-w-full tw-h-0.5 tw-bg-slate-700 tw-hidden tw-z-20">` +
                        `<div class="tw-h-full tw-bg-indigo-500 tw-animate-pulse"></div>` +
                    `</div>` +
                `</li>`;

                fileList.insertAdjacentHTML('beforeend', liHTML);
            }
            // Re-initialize Lucide icons after dynamic DOM insertion
            VRODOS.ui.refreshLucideIcons();
        }

        // Remove animation
        if (filemanager.classList.contains('searching'))
            {fileList.classList.remove('animated');}

        // Show the generated elements
        fileList.style.display = '';
    }

    // Icon mapping now handled by vrodos_icons.js (single source of truth)

    function bindAssetVisibilityFilters() {
        const buttons = filemanager.querySelectorAll(VRODOS_ASSET_BROWSER_SELECTORS.visibilityFilter);
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                filterState.visibility = button.dataset.assetVisibilityFilter || 'all';
                buttons.forEach((candidate) => {
                    const isActive = candidate === button;
                    candidate.classList.toggle('active', isActive);
                    candidate.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
                applyAssetBrowserFilters();
            });
        });
    }

    function assetMatchesSearch(item) {
        if (!filterState.search) {
            return true;
        }

        const searchableText = [
            item.dataset.asset_name,
            item.dataset.asset_slug,
            item.dataset.category_name,
            item.dataset.category_slug
        ].map((value) => VRODOS.utils.displayText(value).toLowerCase()).join(' ');

        return searchableText.indexOf(filterState.search) !== -1;
    }

    function updateAssetBrowserEmptyState(totalCount, visibleCount) {
        const existingEmptyState = fileList.querySelector(VRODOS_ASSET_BROWSER_SELECTORS.emptyState);
        if (visibleCount > 0) {
            if (existingEmptyState) {
                existingEmptyState.remove();
            }
            return;
        }

        const title = totalCount > 0 ? 'No matching assets' : 'No assets found';
        const message = totalCount > 0
            ? 'No assets match the selected category, visibility, and search filters.'
            : 'Your library is empty. Add a private asset or ask an administrator to add shared assets.';

        if (existingEmptyState) {
            existingEmptyState.querySelector('p:nth-of-type(1)').textContent = title;
            existingEmptyState.querySelector('p:nth-of-type(2)').textContent = message;
            return;
        }

        const emptyHTML = '<li class="asset-empty-state tw-col-span-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-px-4 tw-text-center tw-bg-slate-800/20 tw-rounded-xl tw-border tw-border-dashed tw-border-white/10 tw-my-4">' +
            '<div class="tw-bg-slate-800/40 tw-p-4 tw-rounded-full tw-mb-4 tw-border tw-border-white/5">' +
                '<i data-lucide="package-open" class="tw-w-10 tw-h-10 tw-text-slate-400"></i>' +
            '</div>' +
            `<p class="tw-text-xs tw-font-bold tw-text-white tw-tracking-wide">${  title  }</p>` +
            `<p class="tw-text-[10px] tw-text-slate-300 tw-mt-2 tw-leading-relaxed">${  message  }</p>` +
        '</li>';
        fileList.insertAdjacentHTML('beforeend', emptyHTML);
        VRODOS.ui.refreshLucideIcons();
    }

    function applyAssetBrowserFilters() {
        const items = fileList.querySelectorAll(VRODOS_ASSET_BROWSER_SELECTORS.assetCard);
        let visibleCount = 0;

        items.forEach((item) => {
            const matchesCategory = filterState.category === VRODOS_ASSET_BROWSER_SELECTORS.allAssetsTab
                || item.dataset.category_slug === filterState.category;
            const matchesVisibility = assetBrowserMatchesVisibility(item.dataset.is_shared, filterState.visibility);
            const isVisible = matchesCategory && matchesVisibility && assetMatchesSearch(item);

            item.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visibleCount++;
            }
        });

        updateAssetBrowserEmptyState(items.length, visibleCount);
    }

    function openCategoryTab(b) {
        filterState.category = b.id;
        categoryTabs.querySelectorAll('.tablinks').forEach((button) => {
            button.classList.toggle('active', button === b);
        });
        applyAssetBrowserFilters();
    }
};
