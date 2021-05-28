// AJAX NO 1: COMPILE BUTTON
//var os_dependend_var = phpvars.PHP_OS.toUpperCase().substr(0, 3) === 'WIN'? 1:4;

// handles the click event for link 1, sends the query
function vrodos_classifyObjAjax() {

    document.getElementById('vrodos_segmentButton').innerHTML = "Classifying ...";
    document.getElementById("vrodos-segmentation-report").innerHTML = "...";
    document.getElementById("vrodos-segmentation-status").innerHTML = "-1";
    document.getElementById("vrodos-segmentation-log").innerHTML = "Trying to classify the obj ...";

    //  AJAX 1: Send the segmentation command.
    jQuery.ajax({
        url : 'admin-ajax.php',
        type : 'POST',
        data : {'action': 'vrodos_classify_obj_action'},
        success : function(response){
            document.getElementById('vrodos_classifyButton').innerHTML = "Success.";
            enlistObjs();
        },
        error : function(xhr, ajaxOptions, thrownError){
            document.getElementById('vrodos_classifyButton').innerHTML = 'Error: Classify again?';
        }
    });

    // AJAX NO 2: Periodically check log file
    // Constantly monitor the stdout.log file
    var counterLinesPrevious = 0;
    var interval = 0;
    var start_time = new Date().getTime();

    interval = setInterval(function() {
        reqMonitor = jQuery.ajax({
            url : 'admin-ajax.php',
            type : 'POST',
            cache: false,
            data: {'action': 'vrodos_monitor_classify_obj_action'},
            success : function(response){
                console.log("onread log file: " + response.length);

                var counterLines = response.split(/\r\n|\r|\n/).length;

                if (counterLines != counterLinesPrevious) {
                    counterLinesPrevious = counterLines;

                    document.getElementById("vrodos-classify-report").innerHTML = "Log file:" + counterLinesPrevious + " lines";
                    document.getElementById("vrodos-classify-log").innerHTML = response;
                } else {
                    clearInterval(interval);

                    document.getElementById("vrodos-classify-report").innerHTML = "Classification completed, lasted: " + (new Date().getTime() - start_time)/1000 + " seconds";

                    if (response.indexOf("Completed successfully")>0){
                        document.getElementById("vrodos-classification-status").innerHTML = "and the result is Success.";
                        clearInterval(interval);
                    } else {
                        document.getElementById("vrodos-classification-status").innerHTML = 'and the result is Error [145] : Classification error ' + response;
                    }

                    document.getElementById("vrodos-classification-report").innerHTML = response;
                }
            },
            error : function(xhr, ajaxOptions, thrownError){
                document.getElementById("vrodos-classification-log").innerHTML = "and the result is Error [171] : HTML " + xhr.status + "<br />" +
                    xhr.getAllResponseHeaders() + " " + thrownError;

                document.getElementById("vrodos-classification-report").innerHTML = response;
            }
        });
    }, 2000);
}
