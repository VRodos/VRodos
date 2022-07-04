/**
 * @author alteredq / http://alteredqualia.com/
 */
THREE.SceneExporter = function () {};

THREE.SceneExporter.prototype = {

    constructor: THREE.SceneExporter,

    parse: function ( scene ) {

        var position = Vector3String( scene.position );
        var rotation = Vector3String( scene.rotation );
        var scale = Vector3String( scene.scale );

        var nobjects = 0;
        var ngeometries = 0;
        var nmaterials = 0;
        var ntextures = 0;

        var objectsArray = [];
        var geometriesArray = [];
        var materialsArray = [];
        var texturesArray = [];
        var fogsArray = [];

        var geometriesMap = {};
        var materialsMap = {};
        var texturesMap = {};

        // extract objects, geometries, materials, textures

        var checkTexture = function ( map ) {

            if ( ! map ) return;

            if ( ! ( map.id in texturesMap ) ) {

                texturesMap[ map.id ] = true;
                texturesArray.push( TextureString( map ) );
                ntextures += 1;
            }

        };

        var linesArray = [];

        /**
         * This does the core translation
         *
         * @param object
         * @param pad
         * @param whocalls
         */
        function createObjectsList( object, pad, whocalls ) {

            for ( var i = 0; i < object.children.length; i ++ ) {

                var node = object.children[i];

                if (node.name === 'rayLine' || node.name === 'rayLine' || node.name === 'mylightAvatar' ||
                    node.name === 'mylightOrbit' || node.name === 'SteveShieldMesh' || node.name === 'Steve' ||
                    node.name === 'SteveMesh' || node.name === 'avatarCamera' || node.name === 'avatarPitchObject' ||
                    node.name === 'orbitCamera' || node.name === 'myAxisHelper' || node.name === 'myAxisHelper' ||
                    node.name === 'myGridHelper' || node.name === 'myTransformControls' || node.categoryName === 'lightHelper' || node.categoryName === 'lightTargetSpot' || node.name === 'Camera3Dmodel' || node.name === 'Camera3DmodelMesh' || typeof node.categoryName === 'undefined')
                    continue;

                if (node instanceof THREE.Mesh  && node.categoryName !== "pawn" )
                    continue;

                if ( node instanceof THREE.Mesh && node.categoryName === "pawn" ) {

                    linesArray.push(ObjectString(node, pad));
                    nobjects += 1;

                } else if ( node instanceof THREE.Mesh ) {

                    linesArray.push( MeshString( node, pad ) );
                    nobjects += 1;

                    if ( ! ( node.geometry.id in geometriesMap ) ) {
                        geometriesMap[ node.geometry.id ] = true;
                        geometriesArray.push( GeometryString( node.geometry ) );
                        ngeometries += 1;
                    }

                    if ( ! ( node.material.id in materialsMap ) ) {

                        materialsMap[ node.material.id ] = true;
                        materialsArray.push( MaterialString( node.material ) );
                        nmaterials += 1;

                        checkTexture( node.material.map );
                        checkTexture( node.material.envMap );
                        checkTexture( node.material.lightMap );
                        checkTexture( node.material.specularMap );
                        checkTexture( node.material.bumpMap );
                        checkTexture( node.material.normalMap );

                    }

                } else if ( node instanceof THREE.Light ) {

                    linesArray.push(ObjectString(node, pad));
                    nobjects += 1;


                } else if ( node instanceof THREE.Camera || node instanceof THREE.CameraHelper ) {
                    // Cameras are not modifiable
                    // linesArray.push( CameraString( node, pad ) );
                    // nobjects += 1;
                    continue;
                } else if ( node instanceof THREE.Object3D ) {

                        // Everything is Object3D !
                        // What remains here is the (Groups) = 3d models obj to load
                        // and Object3D avatarYawObject

                    if (node.name === "bbox" || node.name === "xline" || node.name === "yline" ||
                        node.name === "zline" || node.name == 'SteveOld' )
                        continue;

                    linesArray.push(ObjectString(node, pad));
                    nobjects += 1;
                }


                if ( node.children.length > 0 ) {
                    linesArray.push( PaddingString( pad + 1 ) + '\t\t"children" : {' );
                }

                createObjectsList( node, pad + 2, pad+2 );

                if ( node.children.length > 0 ) {

                    linesArray.push( PaddingString( pad + 1 ) + "\t\t}" );

                }





                linesArray.push( PaddingString( pad ) + "\t\t}" + ( i < object.children.length - 1 ? ",\n" : "" ) );

            }

        }

        // ignite the loop
        createObjectsList( scene, 0, "pad 0" );

        var objects = linesArray.join( "\n" );

        // extract fog if exists
        if ( scene.fog ) {
            fogsArray.push( FogString( scene.fog ) );
        }


        // generate sections
        var geometries = generateMultiLineString( geometriesArray, ",\n\n\t" );
        var materials = generateMultiLineString( materialsArray, ",\n\n\t" );
        var textures = generateMultiLineString( texturesArray, ",\n\n\t" );
        var fogs = generateMultiLineString( fogsArray, ",\n\n\t" );

        // generate defaults

        var activeCamera = null;

        scene.traverse( function ( node ) {

            if ( node instanceof THREE.Camera && node.userData.active ) {

                activeCamera = node;

            }

        } );

        var defcamera = LabelString( activeCamera ? getObjectName( activeCamera ) : "" );
        var deffog = LabelString( scene.fog ? getFogName( scene.fog ) : "" );



        // function LightString( o, n ) {
        //
        //     if ( o instanceof THREE.AmbientLight ) {
        //
        //         var output = [
        //
        //             '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
        //             '	"type"  : "AmbientLight",',
        //             '	"color" : ' + o.color.getHex() + ( o.children.length ? ',' : '' )
        //
        //         ];
        //
        //     } else if ( o instanceof THREE.DirectionalLight ) {
        //
        //         var output = [
        //
        //             '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
        //             '	"type"      : "DirectionalLight",',
        //             '	"color"     : ' + o.color.getHex() + ',',
        //             '	"intensity" : ' + o.intensity + ',',
        //             '	"direction" : ' + Vector3String( o.position ) + ',',
        //             '	"target"    : ' + LabelString( getObjectName( o.target ) ) + ( o.children.length ? ',' : '' )
        //
        //         ];
        //
        //     } else if ( o instanceof THREE.PointLight ) {
        //
        //         var output = [
        //
        //             '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
        //             '	"type"      : "PointLight",',
        //             '	"color"     : ' + o.color.getHex() + ',',
        //             '	"shadowRadius" : ' + o.shadow.radius + ',',
        //             '	"decay" : ' + o.decay + ',',
        //             '	"intensity" : ' + o.intensity + ',',
        //             '	"position"  : ' + Vector3String( o.position ) + ',',
        //             '	"distance"  : ' + o.distance + ( o.children.length ? ',' : '' )
        //
        //         ];
        //
        //     } else if ( o instanceof THREE.SpotLight ) {
        //
        //         var output = [
        //
        //             '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
        //             '	"type"      : "SpotLight",',
        //             '	"color"     : ' + o.color.getHex() + ',',
        //             '	"intensity" : ' + o.intensity + ',',
        //             '	"position"  : ' + Vector3String( o.position ) + ',',
        //             '	"distance"  : ' + o.distance + ',',
        //             '	"angle"     : ' + o.angle + ',',
        //             '	"exponent"  : ' + o.exponent + ',',
        //             '	"target"    : ' + LabelString( getObjectName( o.target ) ) + ( o.children.length ? ',' : '' )
        //
        //         ];
        //
        //     } else if ( o instanceof THREE.HemisphereLight ) {
        //
        //         var output = [
        //
        //             '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
        //             '	"type"        : "HemisphereLight",',
        //             '	"skyColor"    : ' + o.color.getHex() + ',',
        //             '	"groundColor" : ' + o.groundColor.getHex() + ',',
        //             '	"intensity"   : ' + o.intensity + ',',
        //             '	"position"    : ' + Vector3String( o.position ) + ( o.children.length ? ',' : '' )
        //
        //         ];
        //
        //     } else {
        //
        //         var output = [];
        //
        //     }
        //
        //     return generateMultiLineString( output, '\n\t\t', n );
        //
        // }



        function CameraString( o, n ) {

            if ( o instanceof THREE.PerspectiveCamera ) {

                var output = [

                    '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
                    '	"type"     : "PerspectiveCamera",',
                    '	"fov"      : ' + o.fov + ',',
                    '	"aspect"   : ' + o.aspect + ',',
                    '	"near"     : ' + o.near + ',',
                    '	"far"      : ' + o.far + ',',
                    '	"position" : ' + Vector3String( o.position ) + ( o.children.length ? ',' : '' )

                ];

            } else if ( o instanceof THREE.OrthographicCamera ) {

                var output = [

                    '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
                    '	"type"     : "OrthographicCamera",',
                    '	"left"     : ' + o.left + ',',
                    '	"right"    : ' + o.right + ',',
                    '	"top"      : ' + o.top + ',',
                    '	"bottom"   : ' + o.bottom + ',',
                    '	"near"     : ' + o.near + ',',
                    '	"far"      : ' + o.far + ',',
                    '	"position" : ' + Vector3String( o.position ) + ( o.children.length ? ',' : '' )

                ];

            } else {

                var output = [];

            }

            return generateMultiLineString( output, '\n\t\t', n );

        }

        function ObjectString( o, n ) {


            if (o.name != 'avatarYawObject'
                && !o.categoryName.includes('lightSun')
                && !o.categoryName.includes('lightTargetSpot')
                && !o.categoryName.includes('lightLamp')
                && !o.categoryName.includes('lightSpot')
                && !o.categoryName.includes('lightAmbient')
                && !o.categoryName.includes('pawn')

                ){
                // Asset



                var quatR = new THREE.Quaternion();

                var eulerR = new THREE.Euler( o.rotation._x,  -o.rotation.y , - o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR.setFromEuler(eulerR);

                // console.log("ROTATION:", eulerR);
//                console.log("Quaternion:", o);

                // ================ Ververidis Main =============: All objs



                if (o.children[0].isMesh){
                    var vswitch  =  o.children[0].material.map;
                    var vcolor = o.children[0].material.color.getHexString() ; // : "0x000000";
                    var vemissive = (o.children[0].material.emissive !== undefined ?
                                        o.children[0].material.emissive.getHexString() : '000000');
                    var vroughness = o.children[0].material.roughness;
                    var vmetalness = o.children[0].material.metalness;
                    var vemissiveIntensity = o.children[0].material.emissiveIntensity;
                } else {
                    var vswitch  =  false;
                    var vcolor = "0x000000";
                    var vemissive = 0;
                    var vroughness = 0;
                    var vmetalness = 0;
                    var vemissiveIntensity = 0;
                }


                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.rotation.x  + "," +
                                               o.rotation.y  + "," +
                                               o.rotation.z  + "]" + ',', //+ Vector3String(o.rotation) + ',',

                    '	"quaternion" : ' + "[" + quatR._x + "," +
                                                quatR._y + "," +
                                                quatR._z + "," +
                                                quatR._w + "]" + ',',


                    '	"scale"	   : ' + Vector3String(o.scale) + ',',
                    '	"fnPath" : ' + '"' + o.fnPath  + '"' + ',',
                    '	"assetid" : ' + '"' + o.assetid  + '"' + ',',
                    '	"assetname" : ' + '"' + o.assetname  + '"' + ',',
                    '	"fnObj" : ' + '"' + o.fnObj  + '"' + ',',
                    '	"fnObjID" : ' + '"' + o.fnObjID  + '"' + ',',
                    '	"categoryName" : ' + '"' + o.categoryName  + '"' + ',',
                    '	"categoryDescription" : ' + '"' + o.categoryDescription  + '"' + ',',
                    '	"categoryIcon" : ' + '"' + o.categoryIcon  + '"' + ',',
                    '	"categoryID" : ' + '"' + o.categoryID  + '"' + ',',
                    '   "fbxID" : ' + '"' + o.fbxID + '"' + ',',
                    '   "glbID" : ' + '"' + o.glbID + '"' + ',',
                    '   "color" : ' + '"' +  vcolor + '"' + ',',
                    '   "emissive" : ' + '"' + vemissive + '"' + ',',
                    '   "roughness" : ' + '"' + vroughness + '"' + ',',
                    '   "metalness" : ' + '"' + vmetalness + '"' + ',',
                    '   "emissiveIntensity" : ' + '"' + vemissiveIntensity + '"' + ',',
                    '   "videoTextureSrc" : ' + '"' + (vswitch? vswitch.image.src : '') + '"' + ',',
                    '   "videoTextureRepeatX" : ' + '"' + (vswitch? vswitch.repeat.x :'') + '"' + ',',
                    '   "videoTextureRepeatY" : ' + '"' + (vswitch? vswitch.repeat.y:'') + '"' + ',',
                    '   "videoTextureCenterX" : ' + '"' + (vswitch? vswitch.center.x:'') + '"' + ',',
                    '   "videoTextureCenterY" : ' + '"' + (vswitch? vswitch.center.y:'') + '"' + ',',
                    '   "videoTextureRotation" : ' + '"' + (vswitch? vswitch.rotation:'') + '"' + ',',
                    '   "audioID" : ' + '"' + o.audioID + '"' + ',',
                    '	"image1id" : ' + '"' + o.image1id  + '"' + ',',
                    '   "doorName_source" : ' + '"' + o.doorName_source  + '"' + ',',
                    '   "doorName_target" : ' + '"' + o.doorName_target  + '"' + ',',
                    '   "sceneName_target" : ' + '"' + o.sceneName_target  + '"' + ',',
                    '   "sceneID_target" : ' + '"' + o.sceneID_target  + '"' + ',',
                    '   "archaeology_penalty" : ' + '"' + o.archaeology_penalty  + '"' + ',',
                    '   "hv_penalty" : ' + '"' + o.hv_penalty  + '"' + ',',
                    '   "natural_penalty" : ' + '"' + o.natural_penalty  + '"' + ',',
                    '   "isreward" : ' + '"' + o.isreward  + '"' + ',',
                    '   "isCloned" : ' + '"' + o.isCloned  + '"' + ',',
                    '   "isLight" : ' + '"' + 'false'  + '"' + ',',
                    '	"fnMtl" : ' + '"' + o.fnMtl + '"' + ',',
                    '	"fnMtlID" : ' + '"' + o.fnMtlID + '"' + ( o.children.length ? ',' : '' )

                    //+ ',',
                    //'	"visible"  : ' + o.visible + ( o.children.length ? ',' : '' )
                ];
                //===============================================

            } else if ( o.categoryName==="lightSun" ){

                var quatR_light = new THREE.Quaternion();

                var eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);


                // REM HERE Check with trailing comma
                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.rotation.x + "," +
                    o.rotation.y + "," +
                    o.rotation.z + "]" + ',', //+ Vector3String(o.rotation) + ',',

                    '	"quaternion" : ' + "[" + quatR_light._x + "," + quatR_light._y + "," + quatR_light._z + "," +
                                                                                            quatR_light._w + "]" + ',',

                    '	"scale"	    : ' + '[' + o.scale.x + ',' + o.scale.y + ',' + o.scale.z + '],',
                    '	"lightintensity"	: "' + o.intensity + '",',
                    '	"lightcolor"	: ' + ColorString(o.color) + ',',  // To transfor object r g b to Hex ???
                    '	"targetposition" : ' + Vector3String(o.target.position) + ',',
                    '	"categoryName" : "' + o.categoryName + '",',
                    '	"isLight"   : ' + '"' + 'true' + '"' + ( o.children.length ? ',' : '' )
                ];
            } else if ( o.categoryName==="lightLamp" ){

                var quatR_light = new THREE.Quaternion();

                var eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                // REM HERE Check with trailing comma
                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.rotation.x + "," +
                    o.rotation.y + "," +
                    o.rotation.z + "]" + ',', //+ Vector3String(o.rotation) + ',',

                    '	"quaternion" : ' + "[" + quatR_light._x + "," +
                    quatR_light._y + "," +
                    quatR_light._z + "," +
                    quatR_light._w + "]" + ',',
                    '	"scale"	    : ' + Vector3String(o.scale) + ',',
                    '	"lightintensity"	: "' + o.intensity + '",',
                    '	"lightcolor"	: ' + ColorString(o.color) + ',',  // To transfor object r g b to Hex ???
                    '	"lightdecay" : "' + o.decay + '",',
                    '	"lightdistance" : "' + o.distance + '",',
                    '	"shadowRadius" : "' + o.shadow.radius + '",',
                    '	"categoryName" : "' + o.categoryName + '",',
                    '	"isLight"   : ' + '"' + 'true' + '"' + ( o.children.length ? ',' : '' )
                ];



            } else if ( o.categoryName==="lightSpot" ){



                var quatR_light = new THREE.Quaternion();

                var eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);


                // REM HERE Check with trailing comma
                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.rotation.x + "," +
                    o.rotation.y + "," +
                    o.rotation.z + "]" + ',', //+ Vector3String(o.rotation) + ',',

                    '	"quaternion" : ' + "[" + quatR_light._x + "," +
                    quatR_light._y + "," +
                    quatR_light._z + "," +
                    quatR_light._w + "]" + ',',
                    '	"scale"	    : ' + Vector3String(o.scale) + ',',
                    '	"lightintensity"	: "' + o.intensity + '",',
                    '	"lightcolor"	: ' + ColorString(o.color) + ',',  // To transfor object r g b to Hex ???
                    '	"lightdecay" : "' + o.decay + '",',
                    '	"lightdistance" : "' + o.distance + '",',
                    '	"lightangle" : "' + o.angle + '",',
                    '	"lightpenumbra" : "' + o.penumbra + '",',
                    '	"lighttargetobjectname" : "' + o.target.name + '",',
                    '	"categoryName" : "' + o.categoryName + '",',
                    '	"isLight"   : ' + '"' + 'true' + '"' + ( o.children.length ? ',' : '' )
                ];

            } else if ( o.categoryName === "lightAmbient" ){

                var quatR_light = new THREE.Quaternion();

                var eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.rotation.x + "," + o.rotation.y + "," + o.rotation.z + "]" + ',', //+ Vector3String(o.rotation) + ',',
                    '	"quaternion" : ' + "[" + quatR_light._x + "," +
                                                 quatR_light._y + "," +
                                                 quatR_light._z + "," +
                                                 quatR_light._w + "]" + ',',
                    '	"scale"	    : ' + Vector3String(o.scale) + ',',
                    '	"lightintensity"	: "' + o.intensity + '",',
                    '	"lightcolor"	: ' + ColorString(o.color) + ',',  // To transfor object r g b to Hex ???
                    '	"categoryName" : "' + o.categoryName + '",',
                    '	"isLight"   : ' + '"' + 'true' + '"' + ( o.children.length ? ',' : '' )
                ];

                //console.log(output);

            } else if ( o.categoryName === "pawn" ){


                var quatR_light = new THREE.Quaternion();

                var eulerR_light = new THREE.Euler(o.rotation._x, -o.rotation.y, -o.rotation._z, 'XYZ'); // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_light.setFromEuler(eulerR_light);

                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.rotation.x + "," + o.rotation.y + "," + o.rotation.z + "]" + ',', //+ Vector3String(o.rotation) + ',',
                    '	"quaternion" : ' + "[" + quatR_light._x + "," + quatR_light._y + "," + quatR_light._z + "," + quatR_light._w + "]" + ',',
                    '	"scale"	    : ' + Vector3String(o.scale) + ',',
                    '	"categoryName" : "' + o.categoryName + '",',
                    '	"isLight"   : ' + '"' + 'false' + '"' + ( o.children.length ? ',' : '' )
                ];

                //console.log(output);

            } else if (o.name === 'avatarYawObject'){

                var quatCombined = new THREE.Quaternion();
                var camEulerCombined = new THREE.Euler(- o.children[0].rotation._x, (Math.PI - o.rotation.y)%(2*Math.PI), 0, 'YXZ');
                quatCombined.setFromEuler(camEulerCombined);

                // player is only around y
                var quatR_player = new THREE.Quaternion();
                var eulerR_player = new THREE.Euler( 0, (Math.PI - o.rotation._y)%(2*Math.PI) , 0, 'YXZ')   ; // (Math.PI - o.rotation.y)%(2*Math.PI)
                quatR_player.setFromEuler(eulerR_player);


                //console.log("o.rotation", o.rotation);

                // camera is only around x
                var quatR_camera = new THREE.Quaternion();
                var eulerR_camera = new THREE.Euler( -o.children[0].rotation._x,  0 , 0, 'YXZ');
                quatR_camera.setFromEuler(eulerR_camera);

                var output = [
                    '\t\t' + LabelString(getObjectName(o)) + ' : {',
                    '	"position" : ' + Vector3String(o.position) + ',',
                    '	"rotation" : ' + "[" + o.children[0].rotation._x + "," +
                                               o.rotation.y + "," +
                                               0  + "]" + ',', //+ Vector3String(o.rotation) + ',',
                    '	"quaternion" : ' + "[" + quatCombined._x.toFixed(4) + "," +
                                                 quatCombined._y.toFixed(4) + "," +
                                                 quatCombined._z.toFixed(4) + "," +
                                                 quatCombined._w.toFixed(4) + "]" + ',',
                    '	"quaternion_player" : ' + "[" + quatR_player._x.toFixed(4) + "," +
                    quatR_player._y.toFixed(4) + "," +
                    quatR_player._z.toFixed(4) + "," +
                    quatR_player._w.toFixed(4) + "]" + ',',
                    '	"quaternion_camera" : ' + "[" + quatR_camera._x.toFixed(4) + "," +
                    quatR_camera._y.toFixed(4) + "," +
                    quatR_camera._z.toFixed(4) + "," +
                    quatR_camera._w.toFixed(4) + "]" + ',',
                    '	"scale"	   : ' + Vector3String(o.scale) + ',',
                    '	"categoryName" : "' + 'avatarYawObject' + '",',
                    '	"visible"  : ' + o.visible + ( o.children.length ? ',' : '' )
                ];
            }

            return generateMultiLineString( output, '\n\t\t', n );
        }

        function mradians2degrees(x){

            var out = x - (x/(2*Math.PI) >> 0) * 2 * Math.PI;

            return out;
        }

        function MeshString( o, n ) {

            var output = [

                '\t\t' + LabelString( getObjectName( o ) ) + ' : {',
                '	"geometry" : ' + LabelString( getGeometryName( o.geometry ) ) + ',',
                '	"material" : ' + LabelString( getMaterialName( o.material ) ) + ',',
                '	"position" : ' + Vector3String( o.position ) + ',',
                '	"rotation" : ' + Vector3String( o.rotation ) + ',',
                '	"scale"	   : ' + Vector3String( o.scale ) + ',',
                '	"visible"  : ' + o.visible + ( o.children.length ? ',' : '' )

            ];

            return generateMultiLineString( output, '\n\t\t', n );
        }

        function GeometryString( g ) {

            if ( g instanceof THREE.SphereGeometry ) {

                var output = [

                    '\t' + LabelString( getGeometryName( g ) ) + ': {',
                    '	"type"    : "sphere",',
                    '	"radius"  : ' 		 + g.parameters.radius + ',',
                    '	"widthSegments"  : ' + g.parameters.widthSegments + ',',
                    '	"heightSegments" : ' + g.parameters.heightSegments,
                    '}'

                ];

            } else if ( g instanceof THREE.BoxGeometry ) {

                var output = [

                    '\t' + LabelString( getGeometryName( g ) ) + ': {',
                    '	"type"    : "cube",',
                    '	"width"  : '  + g.parameters.width  + ',',
                    '	"height"  : ' + g.parameters.height + ',',
                    '	"depth"  : '  + g.parameters.depth  + ',',
                    '	"widthSegments"  : ' + g.widthSegments + ',',
                    '	"heightSegments" : ' + g.heightSegments + ',',
                    '	"depthSegments" : '  + g.depthSegments,
                    '}'

                ];

            } else if ( g instanceof THREE.PlaneGeometry ) {

                var output = [

                    '\t' + LabelString( getGeometryName( g ) ) + ': {',
                    '	"type"    : "plane",',
                    '	"width"  : '  + g.parameters.width  + ',',
                    '	"height"  : ' + g.parameters.height + ',',
                    '	"widthSegments"  : ' + g.parameters.widthSegments + ',',
                    '	"heightSegments" : ' + g.parameters.heightSegments,
                    '}'

                ];

            } else if ( g instanceof THREE.Geometry ) {



                if ( g.sourceType === "ascii" || g.sourceType === "ctm" || g.sourceType === "stl" || g.sourceType === "vtk" ) {

                    var output = [

                        '\t' + LabelString( getGeometryName( g ) ) + ': {',
                        '	"type" : ' + LabelString( g.sourceType ) + ',',
                        '	"url"  : ' + LabelString( g.sourceFile ),
                        '}'

                    ];

                } else {

                    var output = [];

                }

            } else {

                var output = [];

            }

            return generateMultiLineString( output, '\n\t\t' );

        }

        function MaterialString( m ) {

            if ( m instanceof THREE.MeshBasicMaterial ) {

                var output = [

                    '\t' + LabelString( getMaterialName( m ) ) + ': {',
                    '	"type"    : "MeshBasicMaterial",',
                    '	"parameters"  : {',
                    '		"color"  : ' 	+ m.color.getHex() + ',',

                    m.map ? 		'		"map" : ' + LabelString( getTextureName( m.map ) ) + ',' : '',
                    m.envMap ? 		'		"envMap" : ' + LabelString( getTextureName( m.envMap ) ) + ',' : '',
                    m.specularMap ? '		"specularMap" : ' + LabelString( getTextureName( m.specularMap ) ) + ',' : '',
                    m.lightMap ? 	'		"lightMap" : ' + LabelString( getTextureName( m.lightMap ) ) + ',' : '',

                    '		"reflectivity"  : ' + m.reflectivity + ',',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' 	+ m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];


            } else if ( m instanceof THREE.MeshLambertMaterial ) {

                var output = [

                    '\t' + LabelString( getMaterialName( m ) ) + ': {',
                    '	"type"    : "MeshLambertMaterial",',
                    '	"parameters"  : {',
                    '		"color"  : ' 	+ m.color.getHex() + ',',
                    //'		"ambient"  : ' 	+ m.ambient.getHex() + ',',
                    //'		"emissive"  : ' + m.emissive.getHex() + ',',

                    m.map ? 		'		"map" : ' + LabelString( getTextureName( m.map ) ) + ',' : '',
                    m.envMap ? 		'		"envMap" : ' + LabelString( getTextureName( m.envMap ) ) + ',' : '',
                    m.specularMap ? '		"specularMap" : ' + LabelString( getTextureName( m.specularMap ) ) + ',' : '',
                    m.lightMap ? 	'		"lightMap" : ' + LabelString( getTextureName( m.lightMap ) ) + ',' : '',

                    '		"reflectivity"  : ' + m.reflectivity + ',',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' 	+ m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if ( m instanceof THREE.MeshPhongMaterial ) {

                var output = [

                    '\t' + LabelString( getMaterialName( m ) ) + ': {',
                    '	"type"    : "MeshPhongMaterial",',
                    '	"parameters"  : {',
                    '		"color"  : ' 	+ m.color.getHex() + ',',
                    //'		"ambient"  : ' 	+ m.ambient.getHex() + ',',
                    //'		"emissive"  : ' + m.emissive.getHex() + ',',
                    '		"specular"  : ' + m.specular.getHex() + ',',
                    '		"shininess" : ' + m.shininess + ',',

                    m.map ? 		'		"map" : ' + LabelString( getTextureName( m.map ) ) + ',' : '',
                    m.envMap ? 		'		"envMap" : ' + LabelString( getTextureName( m.envMap ) ) + ',' : '',
                    m.specularMap ? '		"specularMap" : ' + LabelString( getTextureName( m.specularMap ) ) + ',' : '',
                    m.lightMap ? 	'		"lightMap" : ' + LabelString( getTextureName( m.lightMap ) ) + ',' : '',
                    m.normalMap ? 	'		"normalMap" : ' + LabelString( getTextureName( m.normalMap ) ) + ',' : '',
                    m.bumpMap ? 	'		"bumpMap" : ' + LabelString( getTextureName( m.bumpMap ) ) + ',' : '',

                    '		"bumpScale"  : ' + m.bumpScale + ',',
                    '		"reflectivity"  : ' + m.reflectivity + ',',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' 	+ m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if ( m instanceof THREE.MeshDepthMaterial ) {

                var output = [

                    '\t' + LabelString( getMaterialName( m ) ) + ': {',
                    '	"type"    : "MeshDepthMaterial",',
                    '	"parameters"  : {',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' 	+ m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if ( m instanceof THREE.MeshNormalMaterial ) {

                var output = [

                    '\t' + LabelString( getMaterialName( m ) ) + ': {',
                    '	"type"    : "MeshNormalMaterial",',
                    '	"parameters"  : {',
                    '		"transparent" : ' + m.transparent + ',',
                    '		"opacity" : ' 	+ m.opacity + ',',
                    '		"wireframe" : ' + m.wireframe + ',',
                    '		"wireframeLinewidth" : ' + m.wireframeLinewidth,
                    '	}',
                    '}'

                ];

            } else if ( m instanceof THREE.MeshFaceMaterial ) {

                var output = [

                    '\t' + LabelString( getMaterialName( m ) ) + ': {',
                    '	"type"    : "MeshFaceMaterial",',
                    '	"parameters"  : {}',
                    '}'

                ];

            }

            return generateMultiLineString( output, '\n\t\t' );

        }

        function TextureString( t ) {

            // here would be also an option to use data URI
            // with embedded image from "t.image.src"
            // (that's a side effect of using FileReader to load images)

            var output = [

                '\t' + LabelString( getTextureName( t ) ) + ': {',
                '	"url"    : "' + t.sourceFile + '",',
                '	"repeat" : ' + Vector2String( t.repeat ) + ',',
                '	"offset" : ' + Vector2String( t.offset ) + ',',
                '	"magFilter" : ' + NumConstantString( t.magFilter ) + ',',
                '	"minFilter" : ' + NumConstantString( t.minFilter ) + ',',
                '	"anisotropy" : ' + t.anisotropy,
                '}'

            ];

            return generateMultiLineString( output, '\n\t\t' );

        }

        //

        function FogString( f ) {

            if ( f instanceof THREE.Fog ) {

                var output = [

                    '\t' + LabelString( getFogName( f ) ) + ': {',
                    '	"type"  : "linear",',
                    '	"color" : ' + ColorString( f.color ) + ',',
                    '	"near"  : '  + f.near + ',',
                    '	"far"   : '    + f.far,
                    '}'

                ];

            } else if ( f instanceof THREE.FogExp2 ) {

                var output = [

                    '\t' + LabelString( getFogName( f ) ) + ': {',
                    '	"type"    : "exp2",',
                    '	"color"   : '  + ColorString( f.color ) + ',',
                    '	"density" : ' + f.density,
                    '}'

                ];

            } else {

                var output = [];

            }

            return generateMultiLineString( output, '\n\t\t' );

        }

        if (objects.substr(objects.length-2,1) == ',' )
            objects = objects.substr(0,objects.length-2) + '\n';

        var output = [
            '{',
            '	"metadata": {',
            '		"formatVersion" : 4.0,',
            '		"type"		: "scene",',
            '		"generatedBy"	: "SceneExporter.js",',
            '		"ClearColor" : "#' + (envir.scene.background.isColor?envir.scene.background.getHexString():'000000') + '",',
            '		"toneMappingExposure" : "' + envir.renderer.toneMappingExposure + '",',
            '		"enableEnvironmentTexture" : "' + (!!envir.scene.environment) + '",',
            '		"objects"       : ' + nobjects + //+  ',',
            '	},',
            '',
            '	"urlBaseType": "relativeToScene",',
            '',

            '	"objects" :',
            '	{',
            objects,
            '	}',    // Original line:   '	},',
            '',



            // '	"geometries" :',
            // '	{',
            // '\t' + 	geometries,
            // '	},',
            // '',
            //
            // '	"materials" :',
            // '	{',
            // '\t' + 	materials,
            // '	},',
            // '',
            //
            // '	"textures" :',
            // '	{',
            // '\t' + 	textures,
            // '	},',
            // '',
            //
            // '	"fogs" :',
            // '	{',
            // '\t' + 	fogs,
            // '	},',
            // '',
            //
            // '	"transform" :',
            // '	{',
            // '		"position"  : ' + position + ',',
            // '		"rotation"  : ' + rotation + ',',
            // '		"scale"     : ' + scale,
            // '	},',
            // '',
            // '	"defaults" :',
            // '	{',
            // '		"camera"  : ' + defcamera + ',',
            // '		"fog"  	  : ' + deffog,
            // '	}',
            '}'
        ].join( '\n' );


        //console.log(output);

        return output; //JSON.parse( output );
    }

}
