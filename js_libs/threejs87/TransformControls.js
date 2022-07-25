// Map of the Gizmos as Children of transform_controls.children


// 0:  2D Rot Trans Delete        :  Delete
// 1:  2D Rot Trans Delete         :  Move
// 2:  2D Rot Trans Delete         :  Rotate
// (.handleGizmos.XZY[0][0])

// 3:  3D Translate
// 4:  3D Rotate
// 5:  3D Scale



( function () {

    'use strict';

    // linewidth
    var lwidth = 0.1;

    // arrow width
    var arrWidth = 0.2;





    var GizmoMaterial = function ( parameters ) {

        THREE.MeshBasicMaterial.call( this );

        this.depthTest = false;
        this.depthWrite = false;
        this.side = THREE.DoubleSide; //THREE.FrontSide;
        this.transparent = true;

        this.setValues( parameters );

        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;

        this.highlight = function( highlighted ) {

            if ( highlighted ) {

                this.color.setRGB( 1, 1, 0 );
                this.opacity = 1;

            } else {

                this.color.copy( this.oldColor );
                this.opacity = 1; // this.oldOpacity;

            }

        };

    };

    GizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );
    GizmoMaterial.prototype.constructor = GizmoMaterial;


    THREE.GizmoLineMaterial = function ( parameters ) {

        THREE.LineBasicMaterial.call( this );

        this.depthTest = false;
        this.depthWrite = false;
        this.transparent = true;
        this.linewidth = 1;

        this.setValues( parameters );

        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;

        this.highlight = function( highlighted ) {

            if ( highlighted ) {

                this.color.setRGB( 1, 1, 0 );
                this.opacity = 1;

            } else {

                this.color.copy( this.oldColor );
                this.opacity = this.oldOpacity;

            }

        };

    };

    THREE.GizmoLineMaterial.prototype = Object.create( THREE.LineBasicMaterial.prototype );
    THREE.GizmoLineMaterial.prototype.constructor = THREE.GizmoLineMaterial;

    var pickerMaterial = new GizmoMaterial( { visible: false, transparent: true } );



    THREE.TransformGizmo = function () {

        this.init = function () {

            THREE.Object3D.call( this );

            this.handles = new THREE.Object3D();
            this.pickers = new THREE.Object3D();
            this.planes = new THREE.Object3D();

            this.handles.name = 'handles';
            this.pickers.name = 'pickers';
            this.planes.name = 'planes';

            this.add( this.handles );
            this.add( this.pickers );
            this.add( this.planes );

            //// Planes for Translate

            var planeGeometry = new THREE.PlaneBufferGeometry( 50, 50, 2, 2 );
            var planeMaterial = new THREE.MeshBasicMaterial( { visible: false, side: THREE.DoubleSide } );

            var planes = {
                "XY":   new THREE.Mesh( planeGeometry, planeMaterial ),
                "YZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
                "XZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
                "XYZE": new THREE.Mesh( planeGeometry, planeMaterial )
            };

            this.activePlane = planes[ "XYZE" ];

            planes[ "YZ" ].rotation.set( 0, Math.PI / 2, 0 );
            planes[ "XZ" ].rotation.set( - Math.PI / 2, 0, 0 );

            for ( var i in planes ) {

                planes[ i ].name = i;
                this.planes.add( planes[ i ] );
                this.planes[ i ] = planes[ i ];

            }

            //// HANDLES AND PICKERS

            var setupGizmos = function( gizmoMap, parent ) {

                for ( var name in gizmoMap ) {

                    for ( i = gizmoMap[ name ].length; i --; ) {

                        var object = gizmoMap[ name ][ i ][ 0 ];
                        var position = gizmoMap[ name ][ i ][ 1 ];
                        var rotation = gizmoMap[ name ][ i ][ 2 ];

                        object.name = name;

                        if ( position ) object.position.set( position[ 0 ], position[ 1 ], position[ 2 ] );
                        if ( rotation ) object.rotation.set( rotation[ 0 ], rotation[ 1 ], rotation[ 2 ] );

                        parent.add( object );
                    }
                }
            };

            setupGizmos( this.handleGizmos, this.handles );
            setupGizmos( this.pickerGizmos, this.pickers );

            // reset Transformations

            this.traverse( function ( child ) {

                if ( child instanceof THREE.Mesh ) {

                    child.updateMatrix();

                    var tempGeometry = child.geometry.clone();
                    tempGeometry.applyMatrix4( child.matrix );
                    child.geometry = tempGeometry;

                    child.position.set( 0, 0, 0 );
                    child.rotation.set( 0, 0, 0 );
                    child.scale.set( 1, 1, 1 );

                }

            } );

        };

        this.highlight = function ( axis ) {

            this.traverse( function( child ) {

                if ( child.material && child.material.highlight ) {

                    if ( child.name === axis ) {

                        child.material.highlight( true );

                    } else {

                        child.material.highlight( false );

                    }

                }

            } );

        };

    };

    THREE.TransformGizmo.prototype = Object.create( THREE.Object3D.prototype );
    THREE.TransformGizmo.prototype.constructor = THREE.TransformGizmo;

    THREE.TransformGizmo.prototype.update = function ( rotation, eye ) {

        var vec1 = new THREE.Vector3( 0, 0, 0 );
        var vec2 = new THREE.Vector3( 0, 1, 0 );
        var lookAtMatrix = new THREE.Matrix4();

        this.traverse( function( child ) {

            if ( child.name.search( "E" ) !== - 1 ) {

                child.quaternion.setFromRotationMatrix( lookAtMatrix.lookAt( eye, vec1, vec2 ) );

            } else if ( child.name.search( "X" ) !== - 1 || child.name.search( "Y" ) !== - 1 || child.name.search( "Z" ) !== - 1 ) {

                child.quaternion.setFromEuler( rotation );

            }

        } );

    };

    THREE.TransformGizmoTranslate = function () {

        THREE.TransformGizmo.call( this );

        var arrowGeometry = new THREE.Geometry();

        // Arrow head
        var mesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, arrWidth, 0.2, 12, 1, false ) );
        mesh.position.y = 0.5;
        mesh.updateMatrix();

        // Arrow body
        var cylMesh = new THREE.Mesh(new THREE.CylinderGeometry( lwidth, lwidth, 1, 16, 1, false ));
        cylMesh.position.y = 0;
        cylMesh.updateMatrix();

        arrowGeometry.merge( mesh.geometry, mesh.matrix );
        arrowGeometry.merge( cylMesh.geometry, cylMesh.matrix );

        var lineGeometryX = new THREE.Geometry();
        lineGeometryX.vertices.push( new THREE.Vector3( -100000, 0, 0 ), new THREE.Vector3( 100000, 0, 0 ));

        var lineGeometryY = new THREE.Geometry();
        lineGeometryY.vertices.push( new THREE.Vector3( 0, -100000, 0), new THREE.Vector3( 0, 100000, 0 ));

        var lineGeometryZ = new THREE.Geometry();
        lineGeometryZ.vertices.push( new THREE.Vector3( 0, 0, -100000), new THREE.Vector3( 0, 0, 100000 ));

        this.handleGizmos = {
            X: [
                [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 1.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
                [ new THREE.Line( lineGeometryX, new THREE.GizmoLineMaterial( { color: 0xff0000, opacity : 0 } ) ) ]
            ],

            Y: [
                [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ), [ 0, 1.5, 0 ] ],
                [ new THREE.Line( lineGeometryY, new THREE.GizmoLineMaterial( { color: 0x00ff00, opacity : 0 } ) ) ]
            ],

            Z: [
                [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 1.5 ], [ Math.PI / 2, 0, 0 ] ],
                [ new THREE.Line( lineGeometryZ, new THREE.GizmoLineMaterial( { color: 0x00ff00, opacity : 0 } ) ) ]
            ],
        };

        this.handleGizmos.X[0][0].renderOrder = 1;
        this.handleGizmos.Y[0][0].renderOrder = 1;
        this.handleGizmos.Z[0][0].renderOrder = 1;

        this.handleGizmos.X[0][1].renderOrder = 1;
        this.handleGizmos.Y[0][1].renderOrder = 1;
        this.handleGizmos.Z[0][1].renderOrder = 1;


        this.pickerGizmos = {
            X: [[ new THREE.Mesh( arrowGeometry, pickerMaterial ), [ 1.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ]],
            Y: [[ new THREE.Mesh( arrowGeometry, pickerMaterial ), [ 0, 1.5, 0 ] ]],
            Z: [[ new THREE.Mesh( arrowGeometry, pickerMaterial ), [ 0, 0, 1.5 ], [ Math.PI / 2, 0, 0 ] ]]
        };

        this.setActivePlane = function ( axis, eye ) {

            var tempMatrix = new THREE.Matrix4();
            eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

            if ( axis === "X" ) {

                this.activePlane = this.planes[ "XY" ];

                if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];

            }

            if ( axis === "Y" ) {

                this.activePlane = this.planes[ "XY" ];

                if ( Math.abs( eye.x ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "YZ" ];

            }

            if ( axis === "Z" ) {

                this.activePlane = this.planes[ "XZ" ];

                if ( Math.abs( eye.x ) > Math.abs( eye.y ) ) this.activePlane = this.planes[ "YZ" ];

            }

            if ( axis === "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

            if ( axis === "XY" ) this.activePlane = this.planes[ "XY" ];

            if ( axis === "YZ" ) this.activePlane = this.planes[ "YZ" ];

            if ( axis === "XZ" ) this.activePlane = this.planes[ "XZ" ];

        };

        this.init();

    };

    THREE.TransformGizmoTranslate.prototype = Object.create( THREE.TransformGizmo.prototype );
    THREE.TransformGizmoTranslate.prototype.constructor = THREE.TransformGizmoTranslate;

    THREE.TransformGizmoRotate = function () {

        THREE.TransformGizmo.call( this );

        var rotGeometryOuter = new THREE.Geometry();

        var ringMesh = new THREE.Mesh(new THREE.RingGeometry(1 + 2*lwidth, 1 + lwidth, 64, 16, (2 - 1/8) * Math.PI,  Math.PI/4) );
        ringMesh.updateMatrix();


        var arrowPlanarMesh1 = new THREE.Mesh( new THREE.RingGeometry( 0.001, 0.1, 1, 1) );
        arrowPlanarMesh1.position.set(1.045, -0.487, 0);
        arrowPlanarMesh1.rotation.set(0, 0, 0.71 * Math.PI);
        arrowPlanarMesh1.updateMatrix();

        var arrowPlanarMesh2 = new THREE.Mesh( new THREE.RingGeometry( 0.001, 0.1, 1, 1) );
        arrowPlanarMesh2.position.set(1.045,  0.487, 0);
        arrowPlanarMesh2.rotation.set(0, 0, -0.71 * Math.PI);
        arrowPlanarMesh2.updateMatrix();

        rotGeometryOuter.merge( ringMesh.geometry, ringMesh.matrix );
        rotGeometryOuter.merge( arrowPlanarMesh1.geometry, arrowPlanarMesh1.matrix );
        rotGeometryOuter.merge( arrowPlanarMesh2.geometry, arrowPlanarMesh2.matrix );


        var CircleGeometry = function ( radius, facing, arc ) {

            var geometry = new THREE.BufferGeometry();
            var vertices = [];
            arc = arc ? arc : 1;

            for ( var i = 0; i <= 64 * arc; ++ i ) {

                if ( facing === 'x' ) {
                    vertices.push(0, Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius);

                    vertices.push(0, Math.cos(i / 32 * Math.PI) * radius*1.05, Math.sin(i / 32 * Math.PI) * radius*1.05);
                    vertices.push(0, Math.cos(i / 32 * Math.PI) * radius*0.95, Math.sin(i / 32 * Math.PI) * radius*0.95);

                    vertices.push(0, Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius);
                }


                if ( facing === 'y' ) {

                    vertices.push(Math.cos(i / 32 * Math.PI) * radius, 0, Math.sin(i / 32 * Math.PI) * radius);

                    vertices.push(Math.cos(i / 32 * Math.PI) * radius*1.05, 0, Math.sin(i / 32 * Math.PI) * radius*1.05);
                    vertices.push(Math.cos(i / 32 * Math.PI) * radius*0.95, 0, Math.sin(i / 32 * Math.PI) * radius*0.95);

                    vertices.push(Math.cos(i / 32 * Math.PI) * radius, 0, Math.sin(i / 32 * Math.PI) * radius);
                }

                if ( facing === 'z' ){
                    vertices.push(Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius, 0);

                    vertices.push(Math.cos(i / 32 * Math.PI) * radius*1.05, Math.sin(i / 32 * Math.PI) * radius*1.05, 0);
                    vertices.push(Math.cos(i / 32 * Math.PI) * radius*0.95, Math.sin(i / 32 * Math.PI) * radius*0.95, 0);

                    vertices.push(Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius, 0);
                }
            }

            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
            return geometry;
        };


        this.handleGizmos = {
            X: [
                [ new THREE.Mesh( rotGeometryOuter, new GizmoMaterial( { color: 0xff0000, opacity: 0.75 } ) ) ,  [ 0, 0, 0 ], [ 0, - Math.PI / 2, Math.PI / 4 ] ],
                [ new THREE.Line( new CircleGeometry( 1, 'x', 2*Math.PI ), new THREE.GizmoLineMaterial( { color: 0xff0000, opacity : 0 } ) ) ]
            ],
            Y: [
                [ new THREE.Mesh( rotGeometryOuter, new GizmoMaterial( { color: 0x00ff00, opacity: 0.75 } ) ) ,  [ 0, 0, 0 ], [ Math.PI / 2, 0, - Math.PI / 4 ] ],
                [ new THREE.Line( new CircleGeometry( 1, 'y', 2*Math.PI ), new THREE.GizmoLineMaterial( { color: 0x00ff00, opacity : 0 } ) ) ]
            ],
            Z: [
                [ new THREE.Mesh( rotGeometryOuter, new GizmoMaterial( { color: 0x0000ff, opacity: 0.75 } ) ) , [ 0, 0, 0 ], [ 0,  0,  - Math.PI / 4 ] ],
                [ new THREE.Line( new CircleGeometry( 1, 'z', 2*Math.PI ), new THREE.GizmoLineMaterial( { color: 0x0000ff, opacity : 0 } ) ) ]
            ]
        };

        this.handleGizmos.X[0][0].renderOrder = 1;
        this.handleGizmos.X[0][1].renderOrder = 1;
        this.handleGizmos.Y[0][0].renderOrder = 1;
        this.handleGizmos.Y[0][1].renderOrder = 1;
        this.handleGizmos.Z[0][0].renderOrder = 1;
        this.handleGizmos.Z[0][1].renderOrder = 1;


        this.pickerGizmos = {
            X: [[ new THREE.Mesh( rotGeometryOuter, pickerMaterial ) ,  [ 0, 0, 0 ], [ 0, - Math.PI / 2, Math.PI / 4 ] ]],
            Y: [[ new THREE.Mesh( rotGeometryOuter, pickerMaterial ) ,  [ 0, 0, 0 ], [ Math.PI / 2, 0, - Math.PI / 4 ]   ]],
            Z: [[ new THREE.Mesh( rotGeometryOuter, pickerMaterial ), [ 0, 0, 0 ], [ 0, 0, - Math.PI / 4 ]]]
        };

        this.setActivePlane = function ( axis ) {

            if ( axis === "E" ) this.activePlane = this.planes[ "XYZE" ];

            if ( axis === "X" ) this.activePlane = this.planes[ "YZ" ];

            if ( axis === "Y" ) this.activePlane = this.planes[ "XZ" ];

            if ( axis === "Z" ) this.activePlane = this.planes[ "XY" ];

        };

        this.update = function ( rotation, eye2 ) {

            THREE.TransformGizmo.prototype.update.apply( this, arguments );

            var tempMatrix = new THREE.Matrix4();
            var worldRotation = new THREE.Euler( 0, 0, 1 );
            var tempQuaternion = new THREE.Quaternion();
            var unitX = new THREE.Vector3( 1, 0, 0 );
            var unitY = new THREE.Vector3( 0, 1, 0 );
            var unitZ = new THREE.Vector3( 0, 0, 1 );
            var quaternionX = new THREE.Quaternion();
            var quaternionY = new THREE.Quaternion();
            var quaternionZ = new THREE.Quaternion();
            var eye = eye2.clone();

            worldRotation.copy( this.planes[ "XY" ].rotation );
            tempQuaternion.setFromEuler( worldRotation );

            tempMatrix.makeRotationFromQuaternion( tempQuaternion ).getInverse( tempMatrix );
            eye.applyMatrix4( tempMatrix );

            this.traverse( function( child ) {

                tempQuaternion.setFromEuler( worldRotation );

                if ( child.name === "X" ) {

                    quaternionX.setFromAxisAngle( unitX, Math.atan2( - eye.y, eye.z ) );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                    child.quaternion.copy( tempQuaternion );

                }

                if ( child.name === "Y" ) {

                    quaternionY.setFromAxisAngle( unitY, Math.atan2( eye.x, eye.z ) );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
                    child.quaternion.copy( tempQuaternion );

                }

                if ( child.name === "Z" ) {

                    quaternionZ.setFromAxisAngle( unitZ, Math.atan2( eye.y, eye.x ) );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );
                    child.quaternion.copy( tempQuaternion );

                }

            } );

        };

        this.init();

    };

    THREE.TransformGizmoRotate.prototype = Object.create( THREE.TransformGizmo.prototype );
    THREE.TransformGizmoRotate.prototype.constructor = THREE.TransformGizmoRotate;

    THREE.TransformGizmoScale = function () {

        THREE.TransformGizmo.call( this );

        var arrowGeometry = new THREE.Geometry();

        // Arrow 1 head
        var meshArrow1 = new THREE.Mesh( new THREE.CylinderGeometry( 0, arrWidth, 0.2, 12, 1, false ) );
        meshArrow1.position.y = 0.5;
        meshArrow1.updateMatrix();

        var meshArrow2 = new THREE.Mesh( new THREE.CylinderGeometry( arrWidth, 0, 0.2, 12, 1, false ) );
        meshArrow2.position.y = - 0.5;
        meshArrow2.updateMatrix();

        // var mesh = new THREE.Mesh( new THREE.BoxGeometry( arrWidth, arrWidth, arrWidth ) );
        // mesh.position.y = 0.5;
        // mesh.updateMatrix();

        // cylinder
        var cylMesh = new THREE.Mesh(new THREE.CylinderGeometry( lwidth, lwidth, 1, 16, 1, false ));
        cylMesh.position.y = 0;
        cylMesh.updateMatrix();

        arrowGeometry.merge( meshArrow1.geometry, meshArrow1.matrix );
        arrowGeometry.merge( meshArrow2.geometry, meshArrow2.matrix );
        arrowGeometry.merge( cylMesh.geometry, cylMesh.matrix );

        this.handleGizmos = {
            Y: [[new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x888888 } ) ), [ 1.5, 0, 0 ]]]
        };


        this.handleGizmos.Y[0][0].renderOrder = 1;

        this.pickerGizmos = {
            Y: [
                [ new THREE.Mesh( arrowGeometry, pickerMaterial ), [ 1.5, 0, 0 ] ]
            ]
        };

        this.setActivePlane = function ( axis, eye ) {

            var tempMatrix = new THREE.Matrix4();
            eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

            if ( axis === "X" ) {

                this.activePlane = this.planes[ "XY" ];
                if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];

            }

            if ( axis === "Y" ) {

                this.activePlane = this.planes[ "YZ" ];
                if ( Math.abs( eye.x ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "YZ" ];

            }

            if ( axis === "Z" ) {

                this.activePlane = this.planes[ "XZ" ];
                if ( Math.abs( eye.x ) > Math.abs( eye.y ) ) this.activePlane = this.planes[ "YZ" ];

            }

            if ( axis === "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

        };

        this.init();

    };

    THREE.TransformGizmoScale.prototype = Object.create( THREE.TransformGizmo.prototype );
    THREE.TransformGizmoScale.prototype.constructor = THREE.TransformGizmoScale;


    //-------------- RotTransGizmo --------------------------------
    THREE.TransformGizmoRotTrans = function () {

        THREE.TransformGizmo.call( this );



        //--------- In Arrow --------------
        var arrowGeometry = new THREE.Geometry();

        // Arrow head
        var mesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, arrWidth, 0.2, 12, 1, false ));
        mesh.position.x = 0.5;
        mesh.position.z = - 1.5;
        mesh.rotation.z = - Math.PI / 2;

        mesh.updateMatrix();

        // Arrow body
        var cylMesh = new THREE.Mesh(new THREE.CylinderGeometry( lwidth, lwidth, 1, 16, 1, false ));
        cylMesh.rotation.z = Math.PI / 2;
        cylMesh.position.z = - 1.5;
        cylMesh.updateMatrix();

        arrowGeometry.merge( mesh.geometry, mesh.matrix );
        arrowGeometry.merge( cylMesh.geometry, cylMesh.matrix );

        //----------rotate arrow-----------------------
        var arrowRotGeometry = new THREE.Geometry();

        // Arrow head
        var meshArr = new THREE.Mesh( new THREE.CylinderGeometry( 0, arrWidth, 0.2, 12, 1, false ) );
        meshArr.position.x = - 0.37;
        meshArr.position.z = - 0.92;
        meshArr.rotation.x =   Math.PI/2;
        meshArr.rotation.z =  - 1.3 * Math.PI/2;
        //meshArr.rotation.y = Math.PI/4;
        meshArr.updateMatrix();

        // Arrow Torus
        var torMesh = new THREE.Mesh(new THREE.TorusGeometry( 1, lwidth, 2, 24, 1.85*Math.PI ));
        torMesh.rotation.x =   Math.PI / 2;
        torMesh.rotation.z = - Math.PI / 2;
        torMesh.updateMatrix();


        arrowRotGeometry.merge( meshArr.geometry, meshArr.matrix );
        arrowRotGeometry.merge( torMesh.geometry, torMesh.matrix );

        //----------- X mark -----------------
        var xGeometry = new THREE.Geometry();

        // X mark line 1
        var cylMesh1 = new THREE.Mesh(new THREE.CylinderGeometry( lwidth/2, lwidth/2, 0.5, 16, 1, false ));
        cylMesh1.position.z =  1.75;
        cylMesh1.rotation.z = Math.PI/2;
        cylMesh1.rotation.y = Math.PI/4;
        cylMesh1.updateMatrix();

        // X mark line 2
        var cylMesh2 = new THREE.Mesh(new THREE.CylinderGeometry( lwidth/2, lwidth/2, 0.5, 16, 1, false ));
        cylMesh2.position.z =  1.75;
        cylMesh2.rotation.z =    Math.PI/2;
        cylMesh2.rotation.y =  - Math.PI/4;
        cylMesh2.updateMatrix();

        xGeometry.merge( cylMesh1.geometry, cylMesh1.matrix );
        xGeometry.merge( cylMesh2.geometry, cylMesh2.matrix );




        this.handleGizmos = {
            XZ: [[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ) ]],   // Move
            Y:  [[ new THREE.Mesh( arrowRotGeometry, new GizmoMaterial( { color: 0x00ffff } ) )]],  // Rotate
            XZY:[[ new THREE.Mesh( xGeometry, new GizmoMaterial( { color: 0xff0000 } ) ) ]]             // Delete
        };



        this.handleGizmos.XZ[0][0].renderOrder = 1;
        this.handleGizmos.Y[0][0].renderOrder = 1;
        this.handleGizmos.XZY[0][0].renderOrder = 1;

        this.pickerGizmos = {
            XZ: [[ new THREE.Mesh( arrowGeometry, pickerMaterial ) ]],
             Y: [[ new THREE.Mesh( arrowRotGeometry, pickerMaterial )]],
            XZY: [[ new THREE.Mesh( xGeometry, pickerMaterial ) ]]
        };

        this.setActivePlane = function ( axis ) {
        };

        this.update = function ( rotation, eye2 ) {

            THREE.TransformGizmo.prototype.update.apply( this, arguments );

            var tempMatrix = new THREE.Matrix4();
            var worldRotation = new THREE.Euler( 0, 0, 1 );
            var tempQuaternion = new THREE.Quaternion();
            // var unitX = new THREE.Vector3( 1, 0, 0 );
            // var unitY = new THREE.Vector3( 0, 1, 0 );
            // var unitZ = new THREE.Vector3( 0, 0, 1 );
            // var quaternionX = new THREE.Quaternion();
            // var quaternionY = new THREE.Quaternion();
            // var quaternionZ = new THREE.Quaternion();
            var eye = eye2.clone();

            worldRotation.copy( this.planes[ "XY" ].rotation );
            tempQuaternion.setFromEuler( worldRotation );

            tempMatrix.makeRotationFromQuaternion( tempQuaternion ).getInverse( tempMatrix );
            eye.applyMatrix4( tempMatrix );

            this.traverse( function( child ) {

                tempQuaternion.setFromEuler( worldRotation );

                // if ( child.name === "X" ) {
                //     // quaternionX.setFromAxisAngle( unitX, Math.atan2( - eye.y, eye.z ) );
                //     // tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                //     // child.quaternion.copy( tempQuaternion );
                // }
                //
                // if ( child.name === "Y" ) {
                //     // quaternionY.setFromAxisAngle( unitY, Math.atan2( eye.x, eye.z ) );
                //     // tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
                //     // child.quaternion.copy( tempQuaternion );
                // }
                //
                // if ( child.name === "Z" ) {
                //     // quaternionZ.setFromAxisAngle( unitZ, Math.atan2( eye.y, eye.x ) );
                //     // tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );
                //     // child.quaternion.copy( tempQuaternion );
                // }
            } );

        };

        this.init();

    };

    THREE.TransformGizmoRotTrans.prototype = Object.create( THREE.TransformGizmo.prototype );
    THREE.TransformGizmoRotTrans.prototype.constructor = THREE.TransformGizmoRotTrans;

    //----------------------------------------------------- End of RotTrans ---------------------------------------------------

    THREE.TransformControls = function ( domElement ) {

        // TODO: Make non-uniform scale and rotate play nice in hierarchies
        // TODO: ADD RXYZ contol

        THREE.Object3D.call( this );

        domElement = ( domElement !== undefined ) ? domElement : document;

        this.object = undefined;
        this.sphereCenter = new THREE.Vector3(0,0,0);
        this.bbox = undefined;

        this.visible = false;
        this.translationSnap = null;
        this.rotationSnap = null;
        this.space = "world";
        this.size = 1;
        this.axis = null;

        var scope = this;






        var _mode = "translate";
        var _dragging = false;
        var _gizmo = {

            "translate": new THREE.TransformGizmoTranslate(),
            "rotate": new THREE.TransformGizmoRotate(),
            "scale": new THREE.TransformGizmoScale(),
            "rottrans": new THREE.TransformGizmoRotTrans()
        };

        for ( var type in _gizmo ) {

            var gizmoObj = _gizmo[ type ];

            gizmoObj.visible = ( type === _mode );
            this.add( gizmoObj );

        }

        var changeEvent = { type: "change" };
        var mouseDownEvent = { type: "mouseDown" };
        var mouseUpEvent = { type: "mouseUp", mode: _mode };
        var objectChangeEvent = { type: "objectChange" };

        var ray = new THREE.Raycaster();
        var pointerVector = new THREE.Vector2();

        var point = new THREE.Vector3();
        var offset = new THREE.Vector3();

        var rotation = new THREE.Vector3();
        var offsetRotation = new THREE.Vector3();
        var scale = 1;

        var lookAtMatrix = new THREE.Matrix4();
        var eye = new THREE.Vector3();

        var tempMatrix = new THREE.Matrix4();
        var tempVector = new THREE.Vector3();
        var tempQuaternion = new THREE.Quaternion();
        var unitX = new THREE.Vector3( 1, 0, 0 );
        var unitY = new THREE.Vector3( 0, 1, 0 );
        var unitZ = new THREE.Vector3( 0, 0, 1 );

        var quaternionXYZ = new THREE.Quaternion();
        var quaternionX = new THREE.Quaternion();
        var quaternionY = new THREE.Quaternion();
        var quaternionZ = new THREE.Quaternion();
        var quaternionE = new THREE.Quaternion();

        var oldPosition = new THREE.Vector3();
        var oldScale = new THREE.Vector3();
        var oldRotationMatrix = new THREE.Matrix4();

        var parentRotationMatrix  = new THREE.Matrix4();
        var parentScale = new THREE.Vector3();

        var worldPosition = new THREE.Vector3();
        var worldRotation = new THREE.Euler();
        var worldRotationMatrix  = new THREE.Matrix4();
        var camPosition = new THREE.Vector3();
        var camRotation = new THREE.Euler();

        domElement.addEventListener( "mousedown", onPointerDown, false );
        domElement.addEventListener( "touchstart", onPointerDown, false );

        domElement.addEventListener( "mousemove", onPointerHover, false );
        domElement.addEventListener( "touchmove", onPointerHover, false );

        domElement.addEventListener( "mousemove", onPointerMove, false );
        domElement.addEventListener( "touchmove", onPointerMove, false );

        domElement.addEventListener( "mouseup", onPointerUp, false );
        domElement.addEventListener( "mouseout", onPointerUp, false );
        domElement.addEventListener( "touchend", onPointerUp, false );
        domElement.addEventListener( "touchcancel", onPointerUp, false );
        domElement.addEventListener( "touchleave", onPointerUp, false );

        this.dispose = function () {

            domElement.removeEventListener( "mousedown", onPointerDown );
            domElement.removeEventListener( "touchstart", onPointerDown );

            domElement.removeEventListener( "mousemove", onPointerHover );
            domElement.removeEventListener( "touchmove", onPointerHover );

            domElement.removeEventListener( "mousemove", onPointerMove );
            domElement.removeEventListener( "touchmove", onPointerMove );

            domElement.removeEventListener( "mouseup", onPointerUp );
            domElement.removeEventListener( "mouseout", onPointerUp );
            domElement.removeEventListener( "touchend", onPointerUp );
            domElement.removeEventListener( "touchcancel", onPointerUp );
            domElement.removeEventListener( "touchleave", onPointerUp );

        };

        this.attach = function ( object ) {

            this.object = object;

             this.sphereCenter = object.name === 'avatarYawObject' ? new THREE.Vector3(0,0,0) :
                                                                           computeSceneBoundingSphereAll(object)[0];

            try {
                //this.bboxX = new THREE.BoxHelper(this.object, 0xff0000);

                this.bboxX = '';

                if (this.object.type !== "PointLight" &&
                    this.object.type !== "PointLightHelper" &&
                    this.object.type !== "SpotLight" &&
                    this.object.type !== "AmbientLight" &&
                    this.object.categoryName !== "pawn") {

                    this.bboxX = new THREE.BoxHelper(this.object, 0xff00ff);

                    //console.log(this.bboxX);
                } else {

                    const geometryBox = new THREE.BoxGeometry( 1, 1, 1 );
                    const materialBox = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
                    var simpleBox = new THREE.Mesh( geometryBox, materialBox );
                    this.bboxX = new THREE.BoxHelper(simpleBox, 0xff00ff);
                }

            } catch(e){
                console.error("555:" + this.object.name, this.object.position.x);
            }

            //-------------- X ------------------------------
            this.bboxX.geometry.index.array[0] = 0;
            this.bboxX.geometry.index.array[1] = 0;
            this.bboxX.geometry.index.array[2] = 0;
            this.bboxX.geometry.index.array[3] = 0;

            this.bboxX.geometry.index.array[6] = 0;
            this.bboxX.geometry.index.array[7] = 0;
            this.bboxX.geometry.index.array[8] = 0;
            this.bboxX.geometry.index.array[9] = 0;
            this.bboxX.geometry.index.array[10] = 0;
            this.bboxX.geometry.index.array[11] = 0;
            this.bboxX.geometry.index.array[12] = 0;
            this.bboxX.geometry.index.array[13] = 0;
            this.bboxX.geometry.index.array[14] = 0;
            this.bboxX.geometry.index.array[15] = 0;
            this.bboxX.geometry.index.array[16] = 0;
            this.bboxX.geometry.index.array[17] = 0;
            this.bboxX.geometry.index.array[18] = 0;
            this.bboxX.geometry.index.array[19] = 0;
            this.bboxX.geometry.index.array[20] = 0;
            this.bboxX.geometry.index.array[21] = 0;
            this.bboxX.geometry.index.array[22] = 0;
            this.bboxX.geometry.index.array[23] = 0;
            this.bboxX.name = "bboxX";
            this.bboxX.geometry.attributes.position.array[8] *= 1.25;
            this.bboxX.geometry.attributes.position.array[11] *= 1.25;

            //-------------- Y ---------------------------------
            this.bboxY = this.bboxX; //new THREE.BoxHelper( this.object, 0x00ff00 );
            this.bboxY.geometry.index.array[0] = 0;
            this.bboxY.geometry.index.array[1] = 0;
            this.bboxY.geometry.index.array[2] = 0;
            this.bboxY.geometry.index.array[3] = 0;
            this.bboxY.geometry.index.array[4] = 0;
            this.bboxY.geometry.index.array[5] = 0;
            this.bboxY.geometry.index.array[6] = 0;
            this.bboxY.geometry.index.array[7] = 0;
            this.bboxY.geometry.index.array[8] = 0;
            this.bboxY.geometry.index.array[9] = 0;
            this.bboxY.geometry.index.array[10] = 0;
            this.bboxY.geometry.index.array[11] = 0;
            this.bboxY.geometry.index.array[12] = 0;
            this.bboxY.geometry.index.array[13] = 0;
            //this.bboxY.geometry.index.array[14] = 0;
            //this.bboxY.geometry.index.array[15] = 0;
            this.bboxY.geometry.index.array[16] = 0;
            this.bboxY.geometry.index.array[17] = 0;
            this.bboxY.geometry.index.array[18] = 0;
            this.bboxY.geometry.index.array[19] = 0;
            this.bboxY.geometry.index.array[20] = 0;
            this.bboxY.geometry.index.array[21] = 0;
            this.bboxY.geometry.index.array[22] = 0;
            this.bboxY.geometry.index.array[23] = 0;
            this.bboxY.name = "bboxY";
            this.bboxY.geometry.attributes.position.array[21]  *= 1.25;
            this.bboxY.geometry.attributes.position.array[12]  *= 1.25;


            //-------------- Z ---------------------------------
            this.bboxZ = this.bboxY; //new THREE.BoxHelper( this.object, 0x5555ff );
            this.bboxZ.geometry.index.array[0] = 0;
            this.bboxZ.geometry.index.array[1] = 0;
            this.bboxZ.geometry.index.array[2] = 0;
            this.bboxZ.geometry.index.array[3] = 0;
            this.bboxZ.geometry.index.array[4] = 0;
            this.bboxZ.geometry.index.array[5] = 0;
            this.bboxZ.geometry.index.array[6] = 0;
            this.bboxZ.geometry.index.array[7] = 0;
            this.bboxZ.geometry.index.array[8] = 0;
            this.bboxZ.geometry.index.array[9] = 0;
            this.bboxZ.geometry.index.array[10] = 0;
            this.bboxZ.geometry.index.array[11] = 0;
            this.bboxZ.geometry.index.array[12] = 0;
            this.bboxZ.geometry.index.array[13] = 0;
            this.bboxZ.geometry.index.array[14] = 0;
            this.bboxZ.geometry.index.array[15] = 0;
            this.bboxZ.geometry.index.array[16] = 0;
            this.bboxZ.geometry.index.array[17] = 0;
            this.bboxZ.geometry.index.array[18] = 0;
            this.bboxZ.geometry.index.array[19] = 0;
            this.bboxZ.geometry.index.array[20] = 0;
            // this.bboxY.geometry.index.array[21] = 0;
            // this.bboxY.geometry.index.array[22] = 0;
            // this.bboxY.geometry.index.array[23] = 0;
            this.bboxZ.name = "bboxZ";
            this.bboxZ.geometry.attributes.position.array[21]  *= 1.25;
            this.bboxZ.geometry.attributes.position.array[9]   *= 1.25;

            this.visible = true;
            this.update();
        };

        this.detach = function () {

            this.object = undefined;
            this.visible = false;
            this.axis = null;

        };

        this.getMode = function () {

            return _mode;

        };

        this.setMode = function ( mode ) {

            _mode = mode ? mode : _mode;

            //if ( _mode === "scale" ) scope.space = "world";

            for ( var type in _gizmo ) _gizmo[ type ].visible = ( type === _mode );

            this.update();
            scope.dispatchEvent( changeEvent );

        };

        this.setTranslationSnap = function ( translationSnap ) {

            scope.translationSnap = translationSnap;

        };

        this.setRotationSnap = function ( rotationSnap ) {

            scope.rotationSnap = rotationSnap;

        };

        this.setSize = function ( size ) {

            scope.size = size;
            this.update();
            scope.dispatchEvent( changeEvent );

        };

        this.setSpace = function ( space ) {

            scope.space = space;
            this.update();
            scope.dispatchEvent( changeEvent );

        };

        this.update = function () {

            if ( scope.object === undefined ) return;

            scope.object.updateMatrixWorld();
            worldPosition.setFromMatrixPosition( scope.object.matrixWorld );
            worldRotation.setFromRotationMatrix( tempMatrix.extractRotation( scope.object.matrixWorld ) );

            for (var i = 0; i < envir.scene.children.length; i++){

                var node = envir.scene.children[i];

                if (node.isLightHelper){
                    node.position.setFromMatrixPosition(node.light.matrix);
                    node.updateMatrix();
                    node.update();
                }

                if (node.isLightTargetSpot){
                    node.parentLight.target.position.setFromMatrixPosition(node.matrix);
                    node.parentLight.target.updateMatrixWorld();
                }

            }


            var camera;

            if(avatarControlsEnabled)
                camera = envir.cameraAvatar;
            else
                camera = envir.cameraOrbit;

            camera.updateMatrixWorld();
            camPosition.setFromMatrixPosition( camera.matrixWorld );
            camRotation.setFromRotationMatrix( tempMatrix.extractRotation( camera.matrixWorld ) );

            scale = scope.size; // //worldPosition.distanceTo( camPosition ) / 6 * scope.size;

            this.position.copy( worldPosition );
            this.scale.set( scale, scale, scale );

            if ( camera instanceof THREE.PerspectiveCamera ) {

                eye.copy( camPosition ).sub( worldPosition ).normalize();

            } else if ( camera instanceof THREE.OrthographicCamera ) {

                eye.copy( camPosition ).normalize();

            }

            if ( scope.space === "local" ) {

                _gizmo[ _mode ].update( worldRotation, eye );

            } else if ( scope.space === "world" ) {

                _gizmo[ _mode ].update( new THREE.Euler(), eye );

            }

            _gizmo[ _mode ].highlight( scope.axis );

        };


        function computeSceneBoundingSphereAll(myGroupObj)
        {
            var sceneBSCenter = new THREE.Vector3(0,0,0);
            var sceneBSRadius = 0;

            myGroupObj.traverse( function (object)
            {
                if (object instanceof THREE.Mesh)
                {
                     object.geometry.computeBoundingSphere();

                    // Object radius
                    var radius = object.geometry.boundingSphere.radius;

                    if (radius) {

                        // Object center in world space
                        // var objectCenterLocal = object.position.clone();
                        // var objectCenterWorld = object.localToWorld(objectCenterLocal);

                        var objectCenterWorld = object.geometry.boundingSphere.center;

                        // // New center in world space
                        var newCenter = new THREE.Vector3();

                        newCenter.addVectors(sceneBSCenter, objectCenterWorld);
                        newCenter.divideScalar(2.0);

                        // New radius in world space
                        var dCenter = newCenter.distanceTo(sceneBSCenter);

                        var newRadius = Math.max(dCenter + radius, dCenter + sceneBSRadius);
                        //sceneBSCenter = dCenter;
                        sceneBSCenter = newCenter.multiplyScalar(2);
                        sceneBSRadius = newRadius;
                    }
                }
            } );

            return [sceneBSCenter, sceneBSRadius];
        }


        function onPointerHover( event ) {

            if ( scope.object === undefined || _dragging === true || ( event.button !== undefined && event.button !== 0 ) ) return;

            var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

            var intersect = intersectObjects( pointer, _gizmo[ _mode ].pickers.children );

            var axis = null;

            if ( intersect ) {
                axis = intersect.object.name;
                event.preventDefault();
            }

            if ( scope.axis !== axis ) {
                scope.axis = axis;
                scope.update();
                scope.dispatchEvent( changeEvent );
            }
        }

        function onPointerDown( event ) {

            if ( scope.object === undefined || _dragging === true || ( event.button !== undefined && event.button !== 0 ) ) return;

            var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

            if ( pointer.button === 0 || pointer.button === undefined ) {

                var intersect = intersectObjects( pointer, _gizmo[ _mode ].pickers.children );

                if ( intersect ) {

                    event.stopImmediatePropagation();

                    event.preventDefault();
                    event.stopPropagation();

                    scope.dispatchEvent( mouseDownEvent );

                    scope.axis = intersect.object.name;

                    scope.update();

                    eye.copy( camPosition ).sub( worldPosition ).normalize();

                    _gizmo[ _mode ].setActivePlane( scope.axis, eye );


                    var planeIntersect = intersectObjects( pointer, [ _gizmo[ _mode ].activePlane ] );

                    if ( planeIntersect ) {

                        oldPosition.copy( scope.object.position );
                        oldScale.copy( scope.object.scale );

                        oldRotationMatrix.extractRotation( scope.object.matrix );
                        worldRotationMatrix.extractRotation( scope.object.matrixWorld );

                        parentRotationMatrix.extractRotation( scope.object.parent.matrixWorld );
                        parentScale.setFromMatrixScale( tempMatrix.getInverse( scope.object.parent.matrixWorld ) );

                        offset.copy( planeIntersect.point );

                    }

                }

            }
            _dragging = true;


            if (_mode === "rotate") {
                scope.add( labelInfo );
                labelInfo.element.innerHTML = '0';

                if (scope.axis === "X") {
                    labelInfo.position.set(0, 1.21, 0);
                    textInfo.style.color = 'rgb(' + 255 + ',' + 0 + ',' + 0 + ')';
                    angle_lineX.quaternion.copy(new THREE.Quaternion());
                    angle_lineX.visible = true;
                } else if (scope.axis === "Y") {
                    labelInfo.position.set(0, 0, 1.21);
                    textInfo.style.color = 'rgb(' + 0 + ',' + 255 + ',' + 0 + ')';
                    angle_lineY.quaternion.copy(new THREE.Quaternion());
                    angle_lineY.visible = true;
                } else if (scope.axis === "Z") {
                    labelInfo.position.set(0, 1.21, 0);
                    textInfo.style.color = 'rgb(' + 0 + ',' + 0 + ',' + 255 + ')';
                    angle_lineZ.quaternion.copy(new THREE.Quaternion());
                    angle_lineZ.visible = true;
                }
            } else if (_mode === "translate"){

                scope.add( labelInfo );
                textInfo.style.color = scope.axis === 'X' ? 'red' : (scope.axis === 'Y'?'green':'blue') ;

                // Make some invisible
                if(scope.axis!=null)
                if (scope.axis.length === 1){
                    // _gizmo.translate.handleGizmos.XY[0][0].visible = false;
                    // _gizmo.translate.handleGizmos.XZ[0][0].visible = false;
                    // _gizmo.translate.handleGizmos.YZ[0][0].visible = false;

                    _gizmo.translate.handleGizmos.X[0][0].visible = false;
                    _gizmo.translate.handleGizmos.Y[0][0].visible = false;
                    _gizmo.translate.handleGizmos.Z[0][0].visible = false;

                    if (scope.axis === "X"){

                        labelInfo.element.innerHTML = "" + Math.round(scope.object.position.x*100)/100 + "";
                        labelInfo.position.set(1, 0.5, 0);

                    } else if (scope.axis === "Y"){

                        labelInfo.element.innerHTML = "" + Math.round(scope.object.position.y*100)/100 + "";
                        labelInfo.position.set(0.5, 1, 0);

                    } else if (scope.axis === "Z") {

                        labelInfo.element.innerHTML = "" + Math.round(scope.object.position.z*100)/100 + "";
                        labelInfo.position.set(0, 0.5, 1);

                    }
                }

            } else if (_mode === "scale"){
                scope.add( labelInfo );
                labelInfo.element.innerHTML = '' + scope.object.scale.y + '';

                var dims = findBoundingBox();

                labelInfo.element.innerHTML = '<span style="color:red">' + Math.round(dims[0]*100)/100 + '</span>,' +
                    '<span style="color:green">' + Math.round(dims[1]*100)/100 + '</span>,' +
                    '<span style="color:blue">' + Math.round(dims[2]*100)/100 + '</span>';

                scope.object.add(scope.bboxX);
                scope.object.add(scope.bboxY);
                scope.object.add(scope.bboxZ);

                _gizmo.scale.handleGizmos.Y[0][0].visible = false;

                labelInfo.position.set(1.21, 1.21, 0);

            }

            scope.update();
            scope.dispatchEvent( changeEvent );
            scope.dispatchEvent( objectChangeEvent );
        }


        function onPointerMove( event ) {

            if ( scope.object === undefined || scope.axis === null || _dragging === false || ( event.button !== undefined && event.button !== 0 ) ) return;

            var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

            var planeIntersect = intersectObjects( pointer, [ _gizmo[ _mode ].activePlane ] );

            if ( planeIntersect === false ) return;

            event.preventDefault();
            event.stopPropagation();

            point.copy( planeIntersect.point );

            if ( _mode === "translate" ) {

                point.sub( offset );
                point.multiply( parentScale );

                if ( scope.space === "local" ) {

                    point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    if ( scope.axis.search( "X" ) === - 1 ) point.x = 0;
                    if ( scope.axis.search( "Y" ) === - 1 ) point.y = 0;
                    if ( scope.axis.search( "Z" ) === - 1 ) point.z = 0;

                    point.applyMatrix4( oldRotationMatrix );

                    scope.object.position.copy( oldPosition );
                    scope.object.position.add( point );

                }

                if ( scope.space === "world" || scope.axis.search( "XYZ" ) !== - 1 ) {

                    if ( scope.axis.search( "X" ) === - 1 ) point.x = 0;
                    if ( scope.axis.search( "Y" ) === - 1 ) point.y = 0;
                    if ( scope.axis.search( "Z" ) === - 1 ) point.z = 0;

                    point.applyMatrix4( tempMatrix.getInverse( parentRotationMatrix ) );

                    scope.object.position.copy( oldPosition );
                    scope.object.position.add( point );

                }

                if ( scope.translationSnap !== null ) {

                    if ( scope.space === "local" ) {

                        scope.object.position.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    }

                    if ( scope.axis.search( "X" ) !== - 1 ) scope.object.position.x = Math.round( scope.object.position.x / scope.translationSnap ) * scope.translationSnap;
                    if ( scope.axis.search( "Y" ) !== - 1 ) scope.object.position.y = Math.round( scope.object.position.y / scope.translationSnap ) * scope.translationSnap;
                    if ( scope.axis.search( "Z" ) !== - 1 ) scope.object.position.z = Math.round( scope.object.position.z / scope.translationSnap ) * scope.translationSnap;

                    if ( scope.space === "local" ) {

                        scope.object.position.applyMatrix4( worldRotationMatrix );

                    }

                }


                if (scope.axis === "X") {
                    labelInfo.element.innerHTML = "" + Math.round(scope.object.position.x * 100) / 100 + "";
                } else if (scope.axis === "Y") {
                    labelInfo.element.innerHTML = "" + Math.round(scope.object.position.y * 100) / 100 + "";
                } else if (scope.axis === "Z") {
                    labelInfo.element.innerHTML = "" + Math.round(scope.object.position.z * 100) / 100 + "";
                } else if (scope.axis === "XY") {
                    labelInfo.element.innerHTML = "<span style='color:green'>" + Math.round(scope.object.position.y * 100) / 100 + "<span>, " +
                        "<span style='color:red'>" + Math.round(scope.object.position.x * 100) / 100 + "<span>";
                } else if (scope.axis === "XZ"){
                    labelInfo.element.innerHTML = "<span style='color:blue'>" + Math.round(scope.object.position.z * 100) / 100 + "</span>, " +
                        "<span style='color:red'>" + Math.round(scope.object.position.x * 100) / 100 + "</span>";

                } else if (scope.axis === "YZ"){
                    labelInfo.element.innerHTML = "<span style='color:blue'>" + Math.round(scope.object.position.z * 100) / 100 + "</span>, " +
                        "<span style='color:green'>" + Math.round(scope.object.position.y * 100) / 100 + "<span>";
                }


            } else if ( _mode === "scale" ) {

                point.sub( offset );
                point.multiply( parentScale );

                point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                var sc =  ( 1 + 0.1* point.y / oldScale.y );
                if( sc <= 0 )
                    sc = 0.001;

                scope.object.scale.set(sc, sc, sc);

                var dims = findBoundingBox();

                labelInfo.element.innerHTML = '<span style="color:red">'   + Math.round(dims[0]*100)/100 + '</span>,' +
                    '<span style="color:green">' + Math.round(dims[1]*100)/100 + '</span>,' +
                    '<span style="color:blue">'  + Math.round(dims[2]*100)/100 + '</span>';

            } else if ( _mode === "rotate" ) {

                point.sub( worldPosition );
                point.multiply( parentScale );
                tempVector.copy( offset ).sub( worldPosition );
                tempVector.multiply( parentScale );

                if ( scope.axis === "E" ) {

                    point.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );
                    tempVector.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );

                    rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
                    offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

                    tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

                    quaternionE.setFromAxisAngle( eye, rotation.z - offsetRotation.z );
                    quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionE );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

                    scope.object.quaternion.copy( tempQuaternion );

                } else if ( scope.axis === "XYZE" ) {

                    quaternionE.setFromEuler( point.clone().cross( tempVector ).normalize() ); // rotation axis

                    tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );
                    quaternionX.setFromAxisAngle( quaternionE, - point.clone().angleTo( tempVector ) );
                    quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

                    scope.object.quaternion.copy( tempQuaternion );

                } else if ( scope.space === "local" ) {

                    point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    tempVector.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

                    rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
                    offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

                    quaternionXYZ.setFromRotationMatrix( oldRotationMatrix );

                    if ( scope.rotationSnap !== null ) {

                        quaternionX.setFromAxisAngle( unitX, Math.round( ( rotation.x - offsetRotation.x ) / scope.rotationSnap ) * scope.rotationSnap );
                        quaternionY.setFromAxisAngle( unitY, Math.round( ( rotation.y - offsetRotation.y ) / scope.rotationSnap ) * scope.rotationSnap );
                        quaternionZ.setFromAxisAngle( unitZ, Math.round( ( rotation.z - offsetRotation.z ) / scope.rotationSnap ) * scope.rotationSnap );

                    } else {

                        quaternionX.setFromAxisAngle( unitX, rotation.x - offsetRotation.x );
                        quaternionY.setFromAxisAngle( unitY, rotation.y - offsetRotation.y );
                        quaternionZ.setFromAxisAngle( unitZ, rotation.z - offsetRotation.z );

                    }

                    if ( scope.axis === "X" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionX );
                    if ( scope.axis === "Y" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionY );
                    if ( scope.axis === "Z" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionZ );

                    scope.object.quaternion.copy( quaternionXYZ );

                } else if ( scope.space === "world" ) {

                    rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
                    offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

                    tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

                    if ( scope.rotationSnap !== null ) {

                        quaternionX.setFromAxisAngle( unitX, Math.round( ( rotation.x - offsetRotation.x ) / scope.rotationSnap ) * scope.rotationSnap );
                        quaternionY.setFromAxisAngle( unitY, Math.round( ( rotation.y - offsetRotation.y ) / scope.rotationSnap ) * scope.rotationSnap );
                        quaternionZ.setFromAxisAngle( unitZ, Math.round( ( rotation.z - offsetRotation.z ) / scope.rotationSnap ) * scope.rotationSnap );

                    } else {

                        quaternionX.setFromAxisAngle( unitX, rotation.x - offsetRotation.x );
                        quaternionY.setFromAxisAngle( unitY, rotation.y - offsetRotation.y );
                        quaternionZ.setFromAxisAngle( unitZ, rotation.z - offsetRotation.z );

                    }

                    quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

                    // Make  X Y Z Arrows invisible
                    for (var iDim = 0; iDim < 3; iDim++) {
                        _gizmo.rotate.handleGizmos.X[0][iDim].visible = false;
                        _gizmo.rotate.handleGizmos.Y[0][iDim].visible = false;
                        _gizmo.rotate.handleGizmos.Z[0][iDim].visible = false;
                    }


                    if ( scope.axis === "X" ) {
                        tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionX);
                        angle_lineX.quaternion.copy( quaternionX );

                        // Y and Z angle lines
                        _gizmo.rotate.handleGizmos.Y[1][0].visible = false;
                        _gizmo.rotate.handleGizmos.Z[1][0].visible = false;
                    } else if ( scope.axis === "Y" ) {
                        tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionY);
                        angle_lineY.quaternion.copy( quaternionY );

                        // Y and Z angle lines
                        _gizmo.rotate.handleGizmos.X[1][0].visible = false;
                        _gizmo.rotate.handleGizmos.Z[1][0].visible = false;

                    } else if ( scope.axis === "Z" ) {
                        tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionZ);
                        angle_lineZ.quaternion.copy( quaternionZ );

                        // Y and Z angle lines
                        _gizmo.rotate.handleGizmos.X[1][0].visible = false;
                        _gizmo.rotate.handleGizmos.Y[1][0].visible = false;
                    }

                    tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

                    scope.object.quaternion.copy( tempQuaternion );

                    // label X
                    if (scope.axis === "X") {
                        var labelpos_new = new THREE.Vector3(0,1.21,0).applyQuaternion(quaternionX);
                        var angle_in_radians = labelpos_new.angleTo(new THREE.Vector3(0, 1, 0));
                    } else if (scope.axis === "Y"){
                        var labelpos_new = new THREE.Vector3(0, 0, 1.21).applyQuaternion( quaternionY );
                        var angle_in_radians = labelpos_new.angleTo(new THREE.Vector3(0, 0, 1));
                    } else if (scope.axis === "Z"){
                        var labelpos_new = new THREE.Vector3(0,1.21,0).applyQuaternion( quaternionZ );
                        var angle_in_radians = labelpos_new.angleTo(new THREE.Vector3(0, 1, 0));
                    }

                    labelInfo.position.copy(labelpos_new);
                    textInfo.textContent = Math.round(angle_in_radians * 180 / Math.PI);
                }

            } else if (_mode==="rottrans") {

                // Rotation
                if(scope.axis === 'Y') {

                    point.sub(worldPosition);
                    point.multiply(parentScale);
                    tempVector.copy(offset).sub(worldPosition);
                    tempVector.multiply(parentScale);

                    if (scope.space === "world") {

                        rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
                        offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));

                        tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));

                        if (scope.rotationSnap !== null) {
                            quaternionY.setFromAxisAngle(unitY, Math.round((rotation.y - offsetRotation.y) / scope.rotationSnap) * scope.rotationSnap);
                        } else {
                            quaternionY.setFromAxisAngle(unitY, rotation.y - offsetRotation.y);
                        }

                        quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);

                        //if ( scope.axis === "X" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
                        if (scope.axis === "Y") tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionY);
                        //if ( scope.axis === "Z" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );

                        tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);

                        scope.object.quaternion.copy(tempQuaternion);

                    }
                }


                // Translation
                if(scope.axis === 'XZ') {

                    point.sub(offset);
                    point.multiply(parentScale);

                    if (scope.space === "world" || scope.axis.search("XYZ") !== -1) {

                        if (scope.axis.search("X") === -1) point.x = 0;
                        if (scope.axis.search("Y") === -1) point.y = 0;
                        if (scope.axis.search("Z") === -1) point.z = 0;

                        point.applyMatrix4(tempMatrix.getInverse(parentRotationMatrix));

                        scope.object.position.copy(oldPosition);
                        scope.object.position.add(point);
                    }

                    if (scope.translationSnap !== null) {

                        if (scope.space === "local") {

                            scope.object.position.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));

                        }

                        if (scope.axis.search("X") !== -1) scope.object.position.x = Math.round(scope.object.position.x / scope.translationSnap) * scope.translationSnap;
                        if (scope.axis.search("Y") !== -1) scope.object.position.y = Math.round(scope.object.position.y / scope.translationSnap) * scope.translationSnap;
                        if (scope.axis.search("Z") !== -1) scope.object.position.z = Math.round(scope.object.position.z / scope.translationSnap) * scope.translationSnap;

                        if (scope.space === "local") {

                            scope.object.position.applyMatrix4(worldRotationMatrix);

                        }

                    }
                }
            }

            scope.update();
            scope.dispatchEvent( changeEvent );
            scope.dispatchEvent( objectChangeEvent );
        }


        function onPointerUp( event ) {

            scope.remove( labelInfo);

            if(_mode === "rotate"){

                angle_lineX.visible = false;
                angle_lineY.visible = false;
                angle_lineZ.visible = false;

                _gizmo.rotate.handleGizmos.X[0][0].visible = true;
                _gizmo.rotate.handleGizmos.X[0][1].visible = true;
                _gizmo.rotate.handleGizmos.X[0][2].visible = true;
                _gizmo.rotate.handleGizmos.X[1][0].visible = true;

                _gizmo.rotate.handleGizmos.Y[0][0].visible = true;
                _gizmo.rotate.handleGizmos.Y[0][1].visible = true;
                _gizmo.rotate.handleGizmos.Y[0][2].visible = true;
                _gizmo.rotate.handleGizmos.Y[1][0].visible = true;

                _gizmo.rotate.handleGizmos.Z[0][0].visible = true;
                _gizmo.rotate.handleGizmos.Z[0][1].visible = true;
                _gizmo.rotate.handleGizmos.Z[0][2].visible = true;
                _gizmo.rotate.handleGizmos.Z[1][0].visible = true;

            } else if (_mode === "translate"){

                _gizmo.translate.handleGizmos.X[0][0].visible = true;
                _gizmo.translate.handleGizmos.Y[0][0].visible = true;
                _gizmo.translate.handleGizmos.Z[0][0].visible = true;

            } else if (_mode === "scale"){

                _gizmo.scale.handleGizmos.Y[0][0].visible = true;

                scope.object.remove ( scope.bboxX ) ;
                scope.object.remove ( scope.bboxY ) ;
                scope.object.remove ( scope.bboxZ ) ;
            }

            event.preventDefault(); // Prevent MouseEvent on mobile

            if ( event.button !== undefined && event.button !== 0 ) return;

            if ( _dragging && ( scope.axis !== null ) ) {

                mouseUpEvent.mode = _mode;
                scope.dispatchEvent( mouseUpEvent );
            }

            _dragging = false;

            if ( 'TouchEvent' in window && event instanceof TouchEvent ) {
                // Force "rollover"
                scope.axis = null;
                scope.update();
                scope.dispatchEvent( changeEvent );

            } else {

                onPointerHover( event );

            }

            // DELETE
            if(scope.axis === 'XZY') {
                deleterFomScene(transform_controls.object.name);
            }

            scope.update();
            scope.dispatchEvent( changeEvent );
            scope.dispatchEvent( objectChangeEvent );
        }

        function intersectObjects( pointer, objects ) {

            var rect = domElement.getBoundingClientRect();
            var x = ( pointer.clientX - rect.left ) / rect.width;
            var y = ( pointer.clientY - rect.top ) / rect.height;

            pointerVector.set( ( x * 2 ) - 1, - ( y * 2 ) + 1 );

            var camera;
            if(avatarControlsEnabled)
                camera = envir.cameraAvatar;
            else
                camera = envir.cameraOrbit;

            ray.setFromCamera( pointerVector, camera );

            var intersections = ray.intersectObjects( objects, true );
            return intersections[ 0 ] ? intersections[ 0 ] : false;
        }

        // Estimate bounding box for finding the dimensions
        function findBoundingBox(){

            var helperbbox = new THREE.BoxHelper( scope.object, 0xff00ff );
            helperbbox.geometry.computeBoundingBox();

            var finalVec = new THREE.Vector3().subVectors(helperbbox.geometry.boundingBox.min, helperbbox.geometry.boundingBox.max);

            return [Math.abs(finalVec.x), Math.abs(finalVec.y), Math.abs(finalVec.z)];
        }

    };

    THREE.TransformControls.prototype = Object.create( THREE.Object3D.prototype );
    THREE.TransformControls.prototype.constructor = THREE.TransformControls;

}() );
