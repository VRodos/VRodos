//  AJAX: FETCH Assets 3d
let vrodos_fetchListAvailableAssetsAjax = (isAdmin, gameProjectSlug, urlforAssetEdit, gameProjectID) => {

    jQuery.ajax({
        url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_fbrowse.ajax_url,
        type: 'POST',
        dataType: 'json',
        data: {
            'action': 'vrodos_fetch_game_assets_action',
            'gameProjectSlug': gameProjectSlug,
            'gameProjectID': gameProjectID
        },

        success: function (responseRecords) {

            responseRecords = responseRecords.items;

            file_Browsing_By_DB(responseRecords, gameProjectSlug, urlforAssetEdit);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("ERROR 51:" + thrownError);
        }
    });
}

/**
 * Start the browser
 * @param responseData
 */
function file_Browsing_By_DB(responseData, gameProjectSlug, urlforAssetEdit) {

    let filemanager = jQuery('#assetBrowserToolbar');
    // breadcrumbs = jQuery('.breadcrumbs'),
    let fileList = filemanager.find('.data');
    // closeButton = jQuery('#bt_close_file_toolbar');


    // Create drag image BEFORE event is fired - THEN call it inside the event
    function createDragImage() {
        var img = jQuery('<img>');
        img.attr('src', pluginPath + '/images/ic_asset.png');
        img.css({
            "top": 0,
            "left": 0,
            "width": "60px",
            "height": "40px",
            "position": "absolute",
            "pointerEvents": "none"
        }).appendTo(document.body);
        setTimeout(function () {
            img.remove();
        });
        return img[0];
    }
    let dragImg = createDragImage();

    render(responseData, gameProjectSlug, urlforAssetEdit);

    // Hiding and showing the search box
    filemanager.find('.search').click(function () {
        var search = jQuery(this);
        search.find('span').hide();
        search.find('input[type=search]').show().focus();
    });

    // Listening for keyboard input on the search field.
    // We are using the "input" event which detects cut and paste
    // in addition to keyboard input.

    filemanager.find('input').on('input', function (e) {

        let value = this.value.trim();

        if (value.length) {
            filemanager.addClass('searching');

            fileList.empty();

            // Filter the responseData according to value.trim()
            let filteredResponseData = selectByTitleComparizon(responseData, value.trim());

            render(filteredResponseData, gameProjectSlug, urlforAssetEdit);
        } else {
            filemanager.removeClass('searching');
            render(responseData, gameProjectSlug, urlforAssetEdit);
        }

    }).on('keyup', function (e) { // Clicking 'ESC' button triggers focusout and cancels the search
        var search = jQuery(this);
        if (e.keyCode === 27)
            search.trigger('focusout');
    }).focusout(function (e) {  // Cancel the search
        var search = jQuery(this);
        if (!search.val().trim().length) {
            //window.location.hash = encodeURIComponent(currentPath);
            search.hide();
            search.parent().find('span').show();
        }
    });


    fileList.on({
        click: function (e) {
            //alert("Drag n drop models onto 3D space");

            e.preventDefault();
        },

        dragstart: function (e) {
            // Problems with Chrome. Firefox ok.

            let screenshotImage = e.target.attributes.getNamedItem("data-screenshot_path");

            dragImg.src = screenshotImage ? screenshotImage.value : "/wp-content/plugins/VRodos/images/ic_asset.png";

            e.originalEvent.dataTransfer.setDragImage(dragImg, 32, 32);

            let dragData = {};
            for (let entry in Object.keys(e.target.attributes)) {

                let name = (Object.values(e.target.attributes)[entry]).name;

                name = name.substring(name.indexOf('-')+1);
                dragData[name] = (Object.values(e.target.attributes)[entry]).value;

            }
            dragData.title = e.target.attributes.getNamedItem("data-asset_slug").value + "_" + Math.floor(Date.now() / 1000);
            dragData.name = dragData.title;

            let jsonDataDrag = JSON.stringify(dragData);

            e.originalEvent.dataTransfer.setData("text/plain", jsonDataDrag);

        },
        drag: function (e) {
            e.preventDefault();
        },
        dragend: function (e) {
            e.preventDefault();
        }
    });

    // Render the HTML for the file manager
    // Here we make the list
    function render(enlistData, gameProjectSlug, urlforAssetEdit) {

        var f, name;

        if (enlistData) {

            // allAssetsViewBt
            document.getElementById("assetCategTab").children[0].addEventListener("click",
                function (event) { openCategoryTab(event, this); }
            );

            for (let i = 0; i < enlistData.length; i++) {
                f = enlistData[i];

                name = escapeHTML(f['asset_name']);

                // Add the category in tabs if not yet added
                if (jQuery("#assetCategTab").find("[id='" + f.category_slug + "']").length == 0) {
                    //Create an input type dynamically.
                    let element = document.createElement("button");
                    //Assign different attributes to the element.
                    element.className = "tablinks mdc-button";
                    element.id = f['category_slug'];
                    element.innerHTML = "<i class='material-icons' title='" + f['category_name'] + "' style='font-size:18px;'>" + f['category_icon'] + "</i>";
                    element.addEventListener("click", function (event) { openCategoryTab(event, this); });

                    document.getElementById("assetCategTab").appendChild(element);
                }

                f['screenshot_path'] = f['screenshot_path'] ? f['screenshot_path'] : "../wp-content/plugins/vrodos/images/ic_no_sshot.png";

                let img = '<span class="mdc-list-item__start-detail CenterContents">' +
                    '<img class="assetImg" draggable="false" style="-webkit-user-drag: none" src=' + encodeURI(f['screenshot_path']) + '>' +
                    // '<span class="megabytesAsset mdc-typography--caption mdc-theme--text-secondary-on-light">'+ fileSize + '</span>'+
                    '</span>';

                let draggable_string = '';
                for (let entry in Object.keys(f)) {
                    draggable_string = draggable_string.concat('data-'+Object.keys(f)[entry] + '="' + Object.values(f)[entry]) + '" ';
                }



                let file = jQuery('<li draggable="true" id="asset-' + f['asset_id'] + '"  class="mdc-list-item mdc-elevation--z2 mdc-list-item"' +
                    ' title="Drag the card into the plane"' +
                    draggable_string +'>' + img +

                    '<span class="FileListItemName mdc-list-item__text" title="Drag the card into the plane">' + name +
                    '<span class="assetCategoryNameInList mdc-list-item__text__secondary mdc-typography--caption"><i class="material-icons">' + f['category_icon']
                    + '</i></span></span>' +
                    '<span class="FileListItemFooter">' +

                    (f['is_joker'] === 'false' ?
                            ('<a draggable="false" ondragstart="return false;" title="Edit asset" id="editAssetBtn-' + f['asset_id'] +
                                '" onclick="window.location.href=\'' + urlforAssetEdit + f['asset_id'] + '&scene_type=scene&preview=0&editable=true' +
                                '\'" class="editAssetbutton mdc-button mdc-button--dense">Edit</a>')
                            :
                            ('<a draggable="false" ondragstart="return false;" title="View asset" id="editAssetBtn-' + f['asset_id'] +
                                '" onclick="window.location.href=\'' + urlforAssetEdit + f['asset_id'] + '&scene_type=scene&preview=1&editable=false' +
                                '\'" class="deleteAssetbutton mdc-button mdc-button--dense">View</a>')
                    ) +

                    // (f['is_joker'] === 'false' ?
                    //         ('<a draggable="false" ondragstart="return false;" title="Delete asset" href="#" id="deleteAssetBtn-' + f['asset_id']
                    //             + '" onclick="vrodos_deleteAssetAjax(' +
                    //             f['asset_id'] + ', \'' + gameProjectSlug + '\',' + f['is_cloned'] + ')" class="deleteAssetbutton mdc-button mdc-button--dense">Del</a>') :
                    //         ''
                    // )
                    // +

                    '</span>' +
                    '<div id="deleteAssetProgressBar-' + f['asset_id'] + '" class="progressSlider" style="position: absolute;bottom: 0;display: none;">\n' +
                    '<div class="progressSliderLine"></div>\n' +
                    '<div class="progressSliderSubLine progressIncrease"></div>\n' +
                    '<div class="progressSliderSubLine progressDecrease"></div>\n' +
                    '</div>' +
                    '</li>');


                file.appendTo(fileList);
            }
            // Don't delete. Needed to auto init the mdc components after they have loaded.
            mdc.autoInit(document, () => { });
        }

        // Remove animation
        if (filemanager.hasClass('searching'))
            fileList.removeClass('animated');

        // Show the generated elements
        fileList.animate({ 'display': 'inline-block' });

        // Perform click to open (bug appeared from migrating jquery-1.11 to 3.1.1
        //closeButton.click();
    }

    // This function escapes special html characters in names
    function escapeHTML(text) {
        return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    }

    // Convert file sizes from bytes to human readable units
    function bytesToSize(bytes) {
        let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Bytes';
        let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    function selectByTitleComparizon(input_data, needle) {
        let output_data = [];
        input_data.forEach(function (d) {
            if (d['asset_name'].indexOf(needle) !== -1)
                output_data.push(d);
        });
        return output_data;
    }


    function openCategoryTab(evt, b) {

        let categName = b.id;

        // Declare all variables
        let tabcontent, tablinks;

        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        let items = fileList[0].getElementsByTagName("li");
        for (let i = 0; i < items.length; ++i) {
            if (categName === "allAssetsViewBt")
                items[i].style.display = '';
            else {
                if (items[i].dataset.category_slug === categName)
                    items[i].style.display = '';
                else
                    items[i].style.display = 'none';
            }
        }
        evt.currentTarget.className += " active";
    }
}
