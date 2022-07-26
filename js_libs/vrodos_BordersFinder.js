
// Find dimensions of the selected object
function findDimensions(groupObj){

    groupObj.remove( groupObj.getObjectByName('bbox') );
    groupObj.remove( groupObj.getObjectByName('x_dim_line') );

    // ======= bbox ========================
    var box;
    if (groupObj.type !== "PointLight" &&  groupObj.type !== "PointLightHelper" && groupObj.type !== "SpotLight") {

        box = new THREE.BoxHelper(groupObj, 0xff00ff);
    } else {
        const geometryBox = new THREE.BoxGeometry( 1, 1, 1 );
        const materialBox = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        var simpleBox = new THREE.Mesh( geometryBox, materialBox );
        box = new THREE.BoxHelper(simpleBox, 0xff00ff);
    }

    box.geometry.computeBoundingBox();
    box.name = "bbox";

    var finalVec = new THREE.Vector3().subVectors(box.geometry.boundingBox.min, box.geometry.boundingBox.max);

    var x = Math.abs(finalVec.x);
    var y = Math.abs(finalVec.y);
    var z = Math.abs(finalVec.z);

    return [x,y,z];
}

// Find dimensions of the selected object
function findBorders(groupObj){

    groupObj.remove( groupObj.getObjectByName('bbox') );
    groupObj.remove( groupObj.getObjectByName('x_dim_line') );

    // ======= bbox ========================
    var box;
    if (groupObj.type !== "PointLight" &&  groupObj.type !== "PointLightHelper") {
        box = new THREE.BoxHelper(groupObj, 0xff00ff);
    } else {
        const geometryBox = new THREE.BoxGeometry( 1, 1, 1 );
        const materialBox = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        const simpleBox = new THREE.Mesh( geometryBox, materialBox );
        box = new THREE.BoxHelper(simpleBox, 0xff00ff);
    }

    box.geometry.computeBoundingBox();
    box.name = "bbox";

    var finalVec = new THREE.Vector3().subVectors(box.geometry.boundingBox.min, box.geometry.boundingBox.max);

    var x = Math.abs(finalVec.x);
    var y = Math.abs(finalVec.y);
    var z = Math.abs(finalVec.z);

    return [box.geometry.boundingBox.min, box.geometry.boundingBox.max];
}


// Find Limits (world coordinates) of the selected object
function findObjectLimits(groupObj){

    groupObj.remove( groupObj.getObjectByName('bbox') );
    groupObj.remove( groupObj.getObjectByName('x_dim_line') );

    // ======= bbox ========================
    try {

        var box;
        if (groupObj.type !== "PointLight" &&  groupObj.type !== "PointLightHelper") {
            box = new THREE.BoxHelper(groupObj, 0xff00ff);
        } else {
            const geometryBox = new THREE.BoxGeometry( 1, 1, 1 );
            const materialBox = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
            const simpleBox = new THREE.Mesh( geometryBox, materialBox );
            box = new THREE.BoxHelper(simpleBox, 0xff00ff);
        }

        box.geometry.computeBoundingBox();
        box.name = "bbox";

        // var finalVec = new THREE.Vector3().subVectors(box.geometry.boundingBox.min, box.geometry.boundingBox.max);
        // var x = Math.abs(finalVec.x);
        // var y = Math.abs(finalVec.y);
        // var z = Math.abs(finalVec.z);

        return [box.geometry.boundingBox.min, box.geometry.boundingBox.max];
    } catch (e){
        console.error("ERROR 512" + groupObj.name + "is problematic");
        return [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
    }
}


// Reset
function findSceneDimensions(){

    var xMax = 0;
    var xMin = 0;
    var zMax = 0;
    var zMin = 0;
    var yMax = 0;
    var yMin = 0;

    for (var i = 0; i < envir.scene.children.length; i++) {

        if (envir.scene.children[i].name !== "myTransformControls" && envir.scene.children[i].name !== "myGridHelper") {

            if ( envir.scene.children[i].categoryName === 'lightHelper')
                continue;

            var sizeXYZ_Arr = findObjectLimits(envir.scene.children[i]);

            xMin = Math.min(sizeXYZ_Arr[0].x, xMin);
            xMax = Math.max(sizeXYZ_Arr[1].x, xMax);

            yMin = Math.min(sizeXYZ_Arr[0].y, yMin);
            yMax = Math.max(sizeXYZ_Arr[1].y, yMax);

            zMin = Math.min(sizeXYZ_Arr[0].z, zMin);
            zMax = Math.max(sizeXYZ_Arr[1].z, zMax);

        }
    }

    envir.SCENE_DIMENSION_SURFACE = Math.max(xMax - xMin, zMax - zMin);

    // In empty scene lets fix it to 10
    //envir.SCENE_DIMENSION_SURFACE = envir.SCENE_DIMENSION_SURFACE > 0 ? envir.SCENE_DIMENSION_SURFACE * 1.5 : 10;
}
