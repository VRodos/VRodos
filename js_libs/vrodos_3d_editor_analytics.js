function loadAnalyticsTab(project_id, scene_id, project_keys, game_type, user_email, current_user_id, energy_stats){

    // Analytic keys
    if (project_keys.gioID && game_type === "chemistry") {
        ddaIframe(user_email, project_keys.extraPass, project_keys.gioID);
    }

    // Regional scene checkbox
    if (document.getElementById('regional-checkbox-component')) {
        var regionalCheckbox = mdc.checkbox.MDCCheckbox.attachTo(document.getElementById('regional-checkbox-component'));

        jQuery('#regional-checkbox-component').click(function () {
            jQuery('#regional-scene-checkbox').prop('checked', regionalCheckbox.checked);
        });
    }

    if (game_type === "energy" || game_type === "chemistry") {
        loadAnalyticsIframe(game_type, project_id, scene_id, game_type, current_user_id);
        loadAtRiskIframe(project_keys.expID);
    }

    //var dynamicTabBar = window.dynamicTabBar = new mdc.tabs.MDCTabBar(document.querySelector('#dynamic-tab-bar'));
    // var dots = document.querySelector('.dots');
    // var panels = document.querySelector('.panels');
}

function loadAnalyticsIframe(game_type, project_id, scene_id, type, current_user_id) {

    jQuery('#analyticsIframeFallback').hide();
    jQuery('#analyticsIframeContainer').show();

    var type = game_type === 'chemistry' ? game_type : 'energy3d' ;

    var url = "https://analytics.envisage-h2020.eu/?" +
        "vrodos_game=" + project_id +
        "&vrodos_scene=" + scene_id +
        "&scene_type=scene" +
        "&lab=" + type +
        /*"&version=" + version +
        "&location=" + location +*/
        "&gamemaster_id=" + current_user_id;

    var iframe = jQuery('#analyticsIframeContent');

    if (iframe.length) {
        iframe.attr('src', url);
        return false;
    }

    // In Firefox iframe causes the 3D not to display textures and the analytics charts are not showing
    // The following patch
    // Firefox iframe bug: https://stackoverflow.com/questions/3253362/iframe-src-caching-issue-on-firefox
    // makes 3D editor to work, however Analytics charts still not render
    jQuery(parent.document).find("analyticsIframeContent").each(function () {
        if (this.contentDocument == window.document) {
            // if the href of the iframe is not same as
            // the value of src attribute then reload it
            if (this.src != url) {
                this.src = this.src;
            }
        }
    });
    return true;
}

function loadAtRiskIframe(exp_id) {

    if (exp_id) {

        var url = "https://envisage.goedle.io/at-risk/index.htm?exp_id=" + exp_id;

        var iframe = jQuery('#atRiskIframeContent');
        if (iframe.length) {
            iframe.attr('src', url);
            return false;
        }

        jQuery(parent.document).find("atRiskIframeContent").each(function () {
            if (this.contentDocument == window.document) {
                // if the href of the iframe is not same as
                // the value of src attribute then reload it
                if (this.src != url) {
                    this.src = this.src;
                }
            }
        });
        return true;

    }
}


function ddaIframe(email, pwd, app_key) {

    var url = "https://envisage.goedle.io/dda/index.htm?" +
        "email=" + email +
        "&pwd=" + pwd +
        "&app_key=" + app_key;

    var iframe = jQuery('#ddaIframeContent');
    if (iframe.length) {
        iframe.attr('src', url);
        return false;
    }

    jQuery(parent.document).find("ddaIframeContent").each(function () {
        if (this.contentDocument == window.document) {
            // if the href of the iframe is not same as
            // the value of src attribute then reload it
            if (this.src != url) {
                this.src = this.src;
            }
        }
    });
    return true;
}

function updatePanel(index) {
    var activePanel = panels.querySelector('.panel.active');
    if (activePanel) {
        activePanel.classList.remove('active');
    }
    var newActivePanel = panels.querySelector('.panel:nth-child(' + (index + 1) + ')');
    if (newActivePanel) {
        newActivePanel.classList.add('active');
    }
}
