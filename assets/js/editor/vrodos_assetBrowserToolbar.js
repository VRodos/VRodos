//  AJAX: FETCH Assets 3d
const vrodos_fetchListAvailableAssetsAjax = (isAdmin, gameProjectSlug, urlforAssetEdit, gameProjectID) => {

    const url = isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_fbrowse.ajax_url;
    const body = new URLSearchParams({
        'action': 'vrodos_fetch_game_assets_action',
        gameProjectSlug,
        gameProjectID
    });

    fetch(url, { method: 'POST', body })
        .then((r) => r.json())
        .then((responseRecords) => {
            file_Browsing_By_DB(responseRecords.items, gameProjectSlug, urlforAssetEdit);
        })
        .catch((err) => {
            console.log(`ERROR 51:${  err}`);
        });
}

/**
 * Start the browser
 * @param responseData
 */
function file_Browsing_By_DB(responseData, gameProjectSlug, urlforAssetEdit) {
    window.vrodosAssetBrowserItemsById = {};

    function vrodos_getAssetPreviewFallbackIcon(asset) {
        const categoryKey = asset && (asset.category_slug || asset.category_icon);
        return categoryKey === "assessment"
          ? vrodos_getCategoryIcon(categoryKey)
          : "image-off";
    }

    function vrodos_decodeAssessmentText(value) {
        let text = typeof value === 'string' ? value : '';
        if (!text) return '';

        if (/%[0-9a-fA-F]{2}/.test(text)) {
            try {
                text = decodeURIComponent(text);
            } catch (err) {
                // Keep original text if decoding fails.
            }
        }

        if (/(?:\\u|u)[0-9a-fA-F]{4}/.test(text)) {
            text = text.replace(/(?:\\u|u)([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        }

        return text;
    }

    function vrodos_normalizeAssessmentLevels(levels) {
        let source = levels;
        const allowedLevels = ['A1', 'A2', 'B1', 'B2', 'ALL', 'ALL LEVELS'];

        if (Array.isArray(source)) {
            return source
                .map((level) => {
                    if (level && typeof level === 'object') {
                        return '';
                    }
                    return vrodos_decodeAssessmentText(level).trim().toUpperCase();
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
                    const matches = source.toUpperCase().match(/\b(?:A1|A2|B1|B2|ALL LEVELS|ALL)\b/g);
                    source = matches || [];
                }
            }
        }

        if (!Array.isArray(source)) {
            return [];
        }

        return Array.from(new Set(source
            .map((level) => vrodos_decodeAssessmentText(level).trim().toUpperCase())
            .filter((level) => allowedLevels.indexOf(level) !== -1)
            .filter(Boolean)));
    }

    function vrodos_resolvedCefrLevels(levels, emptyMeansAll) {
        const normalizedLevels = vrodos_normalizeAssessmentLevels(levels);
        const allLevels = ['A1', 'A2', 'B1', 'B2'];

        if (!normalizedLevels.length) {
            return emptyMeansAll === false ? [] : allLevels;
        }

        if (normalizedLevels.indexOf('ALL') !== -1 || normalizedLevels.indexOf('ALL LEVELS') !== -1) {
            return allLevels;
        }

        return allLevels.filter((level) => normalizedLevels.indexOf(level) !== -1);
    }

    function vrodos_resolvedAssessmentLevels(levels) {
        return vrodos_resolvedCefrLevels(levels, true);
    }

    function vrodos_buildAssessmentMetaHTML(asset) {
        if (!asset) {
            return '';
        }

        const isAssessment = String(asset.category_slug || '').toLowerCase() === 'assessment';
        const genericLevelsSource = asset.immerse_cefr_levels || '';
        const assessmentType = vrodos_decodeAssessmentText(asset.assessment_type || asset.assessment_group || '').trim();
        const assessmentLevels = isAssessment
            ? vrodos_resolvedAssessmentLevels(asset.assessment_levels || '')
            : vrodos_resolvedCefrLevels(genericLevelsSource, false);
        let typeBadgeHTML = '';
        let levelBadgesHTML = '';

        if (isAssessment && assessmentType) {
            typeBadgeHTML =
                `<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-sky-400/35 tw-bg-sky-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-sky-100">${ 
                escapeHTML(assessmentType) 
                }</span>`;
        }

        if (assessmentLevels.length) {
            levelBadgesHTML = assessmentLevels.map((level) => (
                    `<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-emerald-400/35 tw-bg-emerald-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-emerald-100">${ 
                    escapeHTML(level) 
                    }</span>`
                )).join('');
        }

        if (!typeBadgeHTML && !levelBadgesHTML) {
            return '';
        }

        return `<div class="tw-mt-1 tw-flex tw-flex-col tw-gap-1">${ 
            typeBadgeHTML ? `<div class="tw-flex tw-flex-wrap tw-gap-1">${  typeBadgeHTML  }</div>` : '' 
            }${levelBadgesHTML ? `<div class="tw-flex tw-flex-wrap tw-gap-1">${  levelBadgesHTML  }</div>` : '' 
            }</div>`;
    }

    const filemanager = document.getElementById('assetBrowserToolbar');
    const fileList = filemanager.querySelector('.data');

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

    render(responseData, gameProjectSlug, urlforAssetEdit);
    if (typeof setHierarchyViewer === 'function') {
        setHierarchyViewer();
    }

    // Hiding and showing the search box
    const searchBox = filemanager.querySelector('.search');
    if (searchBox) {
        searchBox.addEventListener('click', function () {
            const span = this.querySelector('span');
            const input = this.querySelector('input[type=search]');
            if (span) span.style.display = 'none';
            if (input) { input.style.display = ''; input.focus(); }
        });
    }

    // Listening for keyboard input on the search field.
    const searchInput = filemanager.querySelector('input');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const value = this.value.trim();
            if (value.length) {
                filemanager.classList.add('searching');
                fileList.innerHTML = '';
                const filteredResponseData = selectByTitleComparizon(responseData, value.trim());
                render(filteredResponseData, gameProjectSlug, urlforAssetEdit);
            } else {
                filemanager.classList.remove('searching');
                fileList.innerHTML = '';
                render(responseData, gameProjectSlug, urlforAssetEdit);
            }
        });
        searchInput.addEventListener('keyup', function (e) {
            if (e.keyCode === 27) this.blur();
        });
        searchInput.addEventListener('focusout', function (e) {
            if (!this.value.trim().length) {
                this.style.display = 'none';
                const span = this.parentElement.querySelector('span');
                if (span) span.style.display = '';
            }
        });
    }


    fileList.addEventListener('click', (e) => { e.preventDefault(); });

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
            dragGhostFallback.innerHTML = `<i data-lucide="${  fallbackIcon  }" style="width:28px; height:28px;"></i>`;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        dragGhostLabel.textContent = assetName;
        e.dataTransfer.setDragImage(dragGhost, 60, 45);

        const dragData = {};
        for (let i = 0; i < target.attributes.length; i++) {
            const attr = target.attributes[i];
            const name = attr.name.substring(attr.name.indexOf('-') + 1);
            dragData[name] = attr.value;
        }
        dragData.title = `${target.getAttribute("data-asset_slug")  }_${  Math.floor(Date.now() / 1000)}`;
        dragData.name = dragData.title;
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    });

    fileList.addEventListener('drag', (e) => { e.preventDefault(); });
    fileList.addEventListener('dragend', (e) => { e.preventDefault(); });

    // Render the HTML for the file manager
    // Here we make the list
    function render(enlistData, gameProjectSlug, urlforAssetEdit) {

        // Remove skeleton placeholders on first render
        fileList.querySelectorAll('.asset-skeleton').forEach((el) => { el.remove(); });

        // Remove any previous empty state
        fileList.querySelectorAll('.asset-empty-state').forEach((el) => { el.remove(); });

        let f; let name;

        if (enlistData && enlistData.length > 0) {

            // allAssetsViewBt
            document.getElementById("assetCategTab").children[0].addEventListener("click",
                function (event) { openCategoryTab(event, this); }
            );

            for (let i = 0; i < enlistData.length; i++) {
                f = enlistData[i];

                name = escapeHTML(f.asset_name);

                const lucideIconName = vrodos_getCategoryIcon(f.category_slug || f.category_icon);

                // Add the category in tabs if not yet added
                if (!document.getElementById(f.category_slug)) {
                    //Create an input type dynamically.
                    const element = document.createElement("button");
                    //Assign different attributes to the element.
                    element.className = "tablinks tw-btn tw-btn-xs tw-btn-ghost";
                    element.id = f.category_slug;
                    element.innerHTML = `<i data-lucide='${  lucideIconName  }' title='${  f.category_name  }' style='width:18px; height:18px;'></i>`;
                    element.addEventListener("click", function (event) { openCategoryTab(event, this); });

                    document.getElementById("assetCategTab").appendChild(element);
                }

                let draggable_string = '';
                for (const [key, value] of Object.entries(f)) {
                    draggable_string += `data-${  key  }="${  value  }" `;
                }

                const previewFallbackIcon = vrodos_getAssetPreviewFallbackIcon(f);
                const assessmentMetaHTML = vrodos_buildAssessmentMetaHTML(f);
                const previewMarkup = f.screenshot_path
                    ? `<img class="assetImg tw-w-full tw-h-full tw-object-cover tw-transition-transform tw-duration-700 group-hover:tw-scale-110" draggable="false" src="${  encodeURI(f.screenshot_path)  }">`
                    : `<div class="assetImg tw-flex tw-items-center tw-justify-center tw-bg-slate-700/80">` +
                        `<i data-lucide="${  previewFallbackIcon  }" class="tw-w-10 tw-h-10 tw-text-slate-300"></i>` +
                      `</div>`;

                const liHTML = `<li draggable="true" id="asset-${  f.asset_id  }" ` +
                    `class="vrodos-asset-card tw-relative tw-bg-slate-800 tw-rounded-lg tw-overflow-hidden tw-shadow-md hover:tw-shadow-xl tw-transition-all tw-group tw-cursor-move"` +
                    ` title="Drag into scene" ${  draggable_string  }>${ 

                    previewMarkup 

                    }<div class="tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-slate-900/80 tw-via-transparent tw-to-transparent tw-opacity-60 group-hover:tw-opacity-90 tw-transition-opacity"></div>` +

                    `<div class="tw-absolute tw-top-1.5 tw-left-1.5 tw-bg-slate-900/60 tw-backdrop-blur-sm tw-px-1.5 tw-py-1 tw-rounded-md tw-border tw-border-white/10 tw-z-10 tw-max-w-[78%]">` +
                         `<span class="tw-text-[9px] tw-font-bold tw-text-slate-200 tw-truncate tw-block">${  name  }</span>${ 
                         assessmentMetaHTML 
                    }</div>` +

                    `<div class="tw-absolute tw-top-1.5 tw-right-1.5 tw-bg-slate-900/60 tw-backdrop-blur-sm tw-p-1 tw-rounded-md tw-border tw-border-white/10 tw-z-10">` +
                        `<i data-lucide="${  lucideIconName  }" class="tw-w-3 tw-h-3 tw-text-slate-200"></i>` +
                    `</div>${ 

                    (function() {
                        const canEditThis = Boolean(vrodos_data.isUserAdmin) || (String(f.author_id) === String(vrodos_data.current_user_id));
                        if (canEditThis) {
                            return `<div class="tw-absolute tw-bottom-0 tw-left-0 tw-w-full tw-p-2 tw-z-10 tw-transform tw-translate-y-1 group-hover:tw-translate-y-0 tw-transition-transform">` +
                                `<button class="tw-w-full tw-bg-indigo-500/80 hover:tw-bg-indigo-500 tw-backdrop-blur-md tw-text-[9px] tw-font-bold tw-text-white tw-py-1 tw-rounded tw-transition-all tw-tracking-widest" onclick="window.location.href='${  urlforAssetEdit  }${f.asset_id  }&scene_type=scene&preview=0&editable=true'">EDIT</button>` +
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
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            // Show empty state when no assets exist
            const emptyHTML = '<li class="asset-empty-state tw-col-span-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-px-4 tw-text-center tw-bg-slate-800/20 tw-rounded-xl tw-border tw-border-dashed tw-border-white/10 tw-my-4">' +
                '<div class="tw-bg-slate-800/40 tw-p-4 tw-rounded-full tw-mb-4 tw-border tw-border-white/5">' +
                    '<i data-lucide="package-open" class="tw-w-10 tw-h-10 tw-text-slate-400"></i>' +
                '</div>' +
                '<p class="tw-text-xs tw-font-bold tw-text-white tw-tracking-wide">No assets found</p>' +
                '<p class="tw-text-[10px] tw-text-slate-300 tw-mt-2 tw-leading-relaxed">Your library is empty. Add new 3D models and media from the Asset Manager to start building.</p>' +
            '</li>';
            fileList.insertAdjacentHTML('beforeend', emptyHTML);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Remove animation
        if (filemanager.classList.contains('searching'))
            {fileList.classList.remove('animated');}

        // Show the generated elements
        fileList.style.display = '';
    }

    // Icon mapping now handled by vrodos_icons.js (single source of truth)

    // This function escapes special html characters in names
    function escapeHTML(text) {
        return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    }

    // Convert file sizes from bytes to human readable units
    function bytesToSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return `${Math.round(bytes / Math.pow(1024, i), 2)  } ${  sizes[i]}`;
    }

    function selectByTitleComparizon(input_data, needle) {
        const output_data = [];
        input_data.forEach((d) => {
            if (d.asset_name.toLowerCase().indexOf(needle.toLowerCase()) !== -1)
                {output_data.push(d);}
        });
        return output_data;
    }


    function openCategoryTab(evt, b) {

        const categName = b.id;

        // Declare all variables
        let tabcontent; let tablinks;

        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        const items = fileList.querySelectorAll("li:not(.asset-empty-state)");
        let visibleCount = 0;
        for (let i = 0; i < items.length; ++i) {
            if (categName === "allAssetsViewBt") {
                items[i].style.display = '';
                visibleCount++;
            } else {
                if (items[i].dataset.category_slug === categName) {
                    items[i].style.display = '';
                    visibleCount++;
                } else {
                    items[i].style.display = 'none';
                }
            }
        }

        // Show/hide empty state based on visibility
        const emptyState = fileList.querySelector(".asset-empty-state");
        if (visibleCount === 0) {
            if (!emptyState) {
                const emptyHTML = '<li class="asset-empty-state tw-col-span-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-px-4 tw-text-center tw-bg-slate-800/20 tw-rounded-xl tw-border tw-border-dashed tw-border-white/10 tw-my-4">' +
                    '<div class="tw-bg-slate-800/40 tw-p-4 tw-rounded-full tw-mb-4 tw-border tw-border-white/5">' +
                    '<i data-lucide="package-open" class="tw-w-10 tw-h-10 tw-text-slate-400"></i>' +
                    '</div>' +
                    '<p class="tw-text-xs tw-font-bold tw-text-white tw-tracking-wide">Empty Category</p>' +
                    '<p class="tw-text-[10px] tw-text-slate-300 tw-mt-2 tw-leading-relaxed">No assets match this category in your project library.</p>' +
                    '</li>';
                fileList.insertAdjacentHTML('beforeend', emptyHTML);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                 emptyState.style.display = '';
                 emptyState.querySelector('p:nth-of-type(1)').textContent = "Empty Category";
                 emptyState.querySelector('p:nth-of-type(2)').textContent = "No assets match this category in your project library.";
            }
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }

        evt.currentTarget.classList.add("active");
    }
}
