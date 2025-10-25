( function () {

        /**
 * THREE.Loader loads FBX file and generates THREE.Group representing FBX scene.
 * Requires FBX file to be >= 7.0 and in ASCII or >= 6400 in Binary format
 * Versions lower than this may load but will probably have errors
 *
 * Needs Support:
 *  Morph normals / blend shape normals
 *
 * FBX format references:
 *      https://help.autodesk.com/view/FBX/2017/ENU/?guid=__cpp_ref_index_html (
C++ SDK reference)
 *
 * Binary format specification:
 *      https://code.blender.org/2013/08/fbx-binary-file-format-specification/
 */

        let fbxTree;
        let connections;
        let sceneGraph;

        class FBXLoader extends THREE.Loader {

                constructor( manager ) {

                        super( manager );

                }

                load( url, onLoad, onProgress, onError ) {

                        const scope = this;
                        const path = scope.path === '' ? THREE.LoaderUtils.extra
ctUrlBase( url ) : scope.path;
                        const loader = new THREE.FileLoader( this.manager );
                        loader.setPath( scope.path );
                        loader.setResponseType( 'arraybuffer' );
                        loader.setRequestHeader( scope.requestHeader );
                        loader.setWithCredentials( scope.withCredentials );
                        loader.load( url, function ( buffer ) {

                                try {

                                        onLoad( scope.parse( buffer, path ) );

                                } catch ( e ) {

                                        if ( onError ) {

                                                onError( e );

                                        } else {

                                                console.error( e );

                                        }

                                        scope.manager.itemError( url );

                                }

                        }, onProgress, onError );

                }

                parse( FBXBuffer, path ) {

                        if ( isFbxFormatBinary( FBXBuffer ) ) {

                                fbxTree = new BinaryParser().parse( FBXBuffer );

                        } else {

                                const FBXText = convertArrayBufferToString( FBXB
uffer );

                                if ( ! isFbxFormatASCII( FBXText ) ) {

                                        throw new Error( 'THREE.FBXLoader: Unkno
wn format.' );

                                }

                                if ( getFbxVersion( FBXText ) < 7000 ) {

                                        throw new Error( 'THREE.FBXLoader: FBX v
ersion not supported, FileVersion: ' + getFbxVersion( FBXText ) );

                                }

                                fbxTree = new TextParser().parse( FBXText );

                        } // console.log( fbxTree );


                        const textureLoader = new THREE.TextureLoader( this.mana
ger ).setPath( this.resourcePath || path ).setCrossOrigin( this.crossOrigin );
                        return new FBXTreeParser( textureLoader, this.manager ).
parse( fbxTree );

                }

        } // Parse the FBXTree object returned by the BinaryParser or TextParser
 and return a THREE.Group


        class FBXTreeParser {

                constructor( textureLoader, manager ) {

                        this.textureLoader = textureLoader;
                        this.manager = manager;

                }

                parse() {

                        connections = this.parseConnections();
                        const images = this.parseImages();
                        const textures = this.parseTextures( images );
                        const materials = this.parseMaterials( textures );
                        const deformers = this.parseDeformers();
                        const geometryMap = new GeometryParser().parse( deformer
s );
                        this.parseScene( deformers, geometryMap, materials );
                        return sceneGraph;

                } // Parses FBXTree.Connections which holds parent-child connect
ions between objects (e.g. material -> texture, model->geometry )
                // and details the connection type


                parseConnections() {

                        const connectionMap = new Map();

                        if ( 'Connections' in fbxTree ) {

                                const rawConnections = fbxTree.Connections.conne
ctions;
                                rawConnections.forEach( function ( rawConnection
 ) {

                                        const fromID = rawConnection[ 0 ];
                                        const toID = rawConnection[ 1 ];
                                        const relationship = rawConnection[ 2 ];

                                        if ( ! connectionMap.has( fromID ) ) {

                                                connectionMap.set( fromID, {
                                                        parents: [],
                                                        children: []
                                                } );

                                        }

                                        const parentRelationship = {
                                                ID: toID,
                                                relationship: relationship
                                        };
                                        connectionMap.get( fromID ).parents.push
( parentRelationship );

                                        if ( ! connectionMap.has( toID ) ) {

                                                connectionMap.set( toID, {
                                                        parents: [],
                                                        children: []
                                                } );

                                        }

                                        const childRelationship = {
                                                ID: fromID,
                                                relationship: relationship
                                        };
                                        connectionMap.get( toID ).children.push(
 childRelationship );

                                } );

                        }

                        return connectionMap;

                } // Parse FBXTree.Objects.Video for embedded image data
                // These images are connected to textures in FBXTree.Objects.Tex
tures
                // via FBXTree.Connections.


                parseImages() {

                        const images = {};
                        const blobs = {};

                        if ( 'Video' in fbxTree.Objects ) {

                                const videoNodes = fbxTree.Objects.Video;

                                for ( const nodeID in videoNodes ) {

                                        const videoNode = videoNodes[ nodeID ];
                                        const id = parseInt( nodeID );
                                        images[ id ] = videoNode.RelativeFilenam
e || videoNode.Filename; // raw image data is in videoNode.Content

                                        if ( 'Content' in videoNode ) {

                                                const arrayBufferContent = video
Node.Content instanceof ArrayBuffer && videoNode.Content.byteLength > 0;
                                                const base64Content = typeof vid
eoNode.Content === 'string' && videoNode.Content !== '';

                                                if ( arrayBufferContent || base6
4Content ) {

                                                        const image = this.parse
Image( videoNodes[ nodeID ] );
                                                        blobs[ videoNode.Relativ
eFilename || videoNode.Filename ] = image;

                                                }

                                        }

                                }

                        }

                        for ( const id in images ) {

                                const filename = images[ id ];
                                if ( blobs[ filename ] !== undefined ) images[ i
d ] = blobs[ filename ]; else images[ id ] = images[ id ].split( '\\' ).pop();

                        }

                        return images;

                } // Parse embedded image data in FBXTree.Video.Content


                parseImage( videoNode ) {

                        const content = videoNode.Content;
                        const fileName = videoNode.RelativeFilename || videoNode
.Filename;
                        const extension = fileName.slice( fileName.lastIndexOf(
'.' ) + 1 ).toLowerCase();
                        let type;

                        switch ( extension ) {

                                case 'bmp':
                                        type = 'image/bmp';
                                        break;

                                case 'jpg':
                                case 'jpeg':
                                        type = 'image/jpeg';
                                        break;

                                case 'png':
                                        type = 'image/png';
                                        break;

                                case 'tif':
                                        type = 'image/tiff';
                                        break;

                                case 'tga':
                                        if ( this.manager.getHandler( '.tga' ) =
== null ) {

                                                console.warn( 'FBXLoader: TGA lo
ader not found, skipping ', fileName );

                                        }

                                        type = 'image/tga';
                                        break;

                                default:
                                        console.warn( 'FBXLoader: Image type "'
+ extension + '" is not supported.' );
                                        return;

                        }

                        if ( typeof content === 'string' ) {

                                // ASCII format
                                return 'data:' + type + ';base64,' + content;

                        } else {

                                // Binary Format
                                const array = new Uint8Array( content );
                                return window.URL.createObjectURL( new Blob( [ a
rray ], {
                                        type: type
                                } ) );

                        }

                } // Parse nodes in FBXTree.Objects.Texture
                // These contain details such as UV scaling, cropping, rotation
etc and are connected
                // to images in FBXTree.Objects.Video


                parseTextures( images ) {

                        const textureMap = new Map();

                        if ( 'Texture' in fbxTree.Objects ) {

                                const textureNodes = fbxTree.Objects.Texture;

                                for ( const nodeID in textureNodes ) {

                                        const texture = this.parseTexture( textu
reNodes[ nodeID ], images );
                                        textureMap.set( parseInt( nodeID ), text
ure );

                                }

                        }

                        return textureMap;

                } // Parse individual node in FBXTree.Objects.Texture


                parseTexture( textureNode, images ) {

                        const texture = this.loadTexture( textureNode, images );
                        texture.ID = textureNode.id;
                        texture.name = textureNode.attrName;
                        const wrapModeU = textureNode.WrapModeU;
                        const wrapModeV = textureNode.WrapModeV;
                        const valueU = wrapModeU !== undefined ? wrapModeU.value
 : 0;
                        const valueV = wrapModeV !== undefined ? wrapModeV.value
 : 0; // http://download.autodesk.com/us/fbx/SDKdocs/FBX_SDK_Help/files/fbxsdkre
f/class_k_fbx_texture.html#889640e63e2e681259ea81061b85143a
                        // 0: repeat(default), 1: clamp

                        texture.wrapS = valueU === 0 ? THREE.RepeatWrapping : TH
REE.ClampToEdgeWrapping;
                        texture.wrapT = valueV === 0 ? THREE.RepeatWrapping : TH
REE.ClampToEdgeWrapping;

                        if ( 'Scaling' in textureNode ) {

                                const values = textureNode.Scaling.value;
                                texture.repeat.x = values[ 0 ];
                                texture.repeat.y = values[ 1 ];

                        }

                        if ( 'Translation' in textureNode ) {

                                const values = textureNode.Translation.value;
                                texture.offset.x = values[ 0 ];
                                texture.offset.y = values[ 1 ];

                        }

                        return texture;

                } // load a texture specified as a blob or data URI, or via an e
xternal URL using THREE.TextureLoader


                loadTexture( textureNode, images ) {

                        let fileName;
                        const currentPath = this.textureLoader.path;
                        const children = connections.get( textureNode.id ).child
ren;

                        if ( children !== undefined && children.length > 0 && im
ages[ children[ 0 ].ID ] !== undefined ) {

                                fileName = images[ children[ 0 ].ID ];

                                if ( fileName.indexOf( 'blob:' ) === 0 || fileNa
me.indexOf( 'data:' ) === 0 ) {

                                        this.textureLoader.setPath( undefined );

                                }

                        }

                        let texture;
                        const extension = textureNode.FileName.slice( - 3 ).toLo
werCase();

                        if ( extension === 'tga' ) {

                                const loader = this.manager.getHandler( '.tga' )
;

                                if ( loader === null ) {

                                        console.warn( 'FBXLoader: TGA loader not
 found, creating placeholder texture for', textureNode.RelativeFilename );
                                        texture = new THREE.Texture();

                                } else {

                                        loader.setPath( this.textureLoader.path
);
                                        texture = loader.load( fileName );

                                }

                        } else if ( extension === 'psd' ) {

                                console.warn( 'FBXLoader: PSD textures are not s
upported, creating placeholder texture for', textureNode.RelativeFilename );
                                texture = new THREE.Texture();

                        } else {

                                texture = this.textureLoader.load( fileName );

                        }

                        this.textureLoader.setPath( currentPath );
                        return texture;

                } // Parse nodes in FBXTree.Objects.Material


                parseMaterials( textureMap ) {

                        const materialMap = new Map();

                        if ( 'Material' in fbxTree.Objects ) {

                                const materialNodes = fbxTree.Objects.Material;

                                for ( const nodeID in materialNodes ) {

                                        const material = this.parseMaterial( mat
erialNodes[ nodeID ], textureMap );
                                        if ( material !== null ) materialMap.set
( parseInt( nodeID ), material );

                                }

                        }

                        return materialMap;

                } // Parse single node in FBXTree.Objects.Material
                // Materials are connected to texture maps in FBXTree.Objects.Te
xtures
                // FBX format currently only supports Lambert and Phong shading
models


                parseMaterial( materialNode, textureMap ) {

                        const ID = materialNode.id;
                        const name = materialNode.attrName;
                        let type = materialNode.ShadingModel; // Case where FBX
wraps shading model in property object.

                        if ( typeof type === 'object' ) {

                                type = type.value;

                        } // Ignore unused materials which don't have any connec
tions.


                        if ( ! connections.has( ID ) ) return null;
                        const parameters = this.parseParameters( materialNode, t
extureMap, ID );
                        let material;

                        switch ( type.toLowerCase() ) {

                                case 'phong':
                                        material = new THREE.MeshPhongMaterial()
;
                                        break;

                                case 'lambert':
                                        material = new THREE.MeshLambertMaterial
();
                                        break;

                                default:
                                        console.warn( 'THREE.FBXLoader: unknown
material type "%s". Defaulting to THREE.MeshPhongMaterial.', type );
                                        material = new THREE.MeshPhongMaterial()
;
                                        break;

                        }

                        material.setValues( parameters );
                        material.name = name;
                        return material;

                } // Parse FBX material and return parameters suitable for a thr
ee.js material
                // Also parse the texture map and return any textures associated
 with the material


                parseParameters( materialNode, textureMap, ID ) {

                        const parameters = {};

                        if ( materialNode.BumpFactor ) {

                                parameters.bumpScale = materialNode.BumpFactor.v
alue;

                        }

                        if ( materialNode.Diffuse ) {

                                parameters.color = new THREE.Color().fromArray(
materialNode.Diffuse.value );

                        } else if ( materialNode.DiffuseColor && ( materialNode.
DiffuseColor.type === 'Color' || materialNode.DiffuseColor.type === 'ColorRGB' )
 ) {

                                // The blender exporter exports diffuse here ins
tead of in materialNode.Diffuse
                                parameters.color = new THREE.Color().fromArray(
materialNode.DiffuseColor.value );

                        }

                        if ( materialNode.DisplacementFactor ) {

                                parameters.displacementScale = materialNode.Disp
lacementFactor.value;

                        }

                        if ( materialNode.Emissive ) {

                                parameters.emissive = new THREE.Color().fromArra
y( materialNode.Emissive.value );

                        } else if ( materialNode.EmissiveColor && ( materialNode
.EmissiveColor.type === 'Color' || materialNode.EmissiveColor.type === 'ColorRGB
' ) ) {

                                // The blender exporter exports emissive color h
ere instead of in materialNode.Emissive
                                parameters.emissive = new THREE.Color().fromArra
y( materialNode.EmissiveColor.value );

                        }

                        if ( materialNode.EmissiveFactor ) {

                                parameters.emissiveIntensity = parseFloat( mater
ialNode.EmissiveFactor.value );

                        }

                        if ( materialNode.Opacity ) {

                                parameters.opacity = parseFloat( materialNode.Op
acity.value );

                        }

                        if ( parameters.opacity < 1.0 ) {

                                parameters.transparent = true;

                        }

                        if ( materialNode.ReflectionFactor ) {

                                parameters.reflectivity = materialNode.Reflectio
nFactor.value;

                        }

                        if ( materialNode.Shininess ) {

                                parameters.shininess = materialNode.Shininess.va
lue;

                        }

                        if ( materialNode.Specular ) {

                                parameters.specular = new THREE.Color().fromArra
y( materialNode.Specular.value );

                        } else if ( materialNode.SpecularColor && materialNode.S
pecularColor.type === 'Color' ) {

                                // The blender exporter exports specular color h
ere instead of in materialNode.Specular
                                parameters.specular = new THREE.Color().fromArra
y( materialNode.SpecularColor.value );

                        }

                        const scope = this;
                        connections.get( ID ).children.forEach( function ( child
 ) {

                                const type = child.relationship;

                                switch ( type ) {

                                        case 'Bump':
                                                parameters.bumpMap = scope.getTe
xture( textureMap, child.ID );
                                                break;

                                        case 'Maya|TEX_ao_map':
                                                parameters.aoMap = scope.getText
ure( textureMap, child.ID );
                                                break;

                                        case 'DiffuseColor':
                                        case 'Maya|TEX_color_map':
                                                parameters.map = scope.getTextur
e( textureMap, child.ID );

                                                if ( parameters.map !== undefine
d ) {

                                                        parameters.map.encoding
= THREE.sRGBEncoding;

                                                }

                                                break;

                                        case 'DisplacementColor':
                                                parameters.displacementMap = sco
pe.getTexture( textureMap, child.ID );
                                                break;

                                        case 'EmissiveColor':
                                                parameters.emissiveMap = scope.g
etTexture( textureMap, child.ID );

                                                if ( parameters.emissiveMap !==
undefined ) {

                                                        parameters.emissiveMap.e
ncoding = THREE.sRGBEncoding;

                                                }

                                                break;

                                        case 'NormalMap':
                                        case 'Maya|TEX_normal_map':
                                                parameters.normalMap = scope.get
Texture( textureMap, child.ID );
                                                break;

                                        case 'ReflectionColor':
                                                parameters.envMap = scope.getTex
ture( textureMap, child.ID );

                                                if ( parameters.envMap !== undef
ined ) {

                                                        parameters.envMap.mappin
g = THREE.EquirectangularReflectionMapping;
                                                        parameters.envMap.encodi
ng = THREE.sRGBEncoding;

                                                }

                                                break;

                                        case 'SpecularColor':
                                                parameters.specularMap = scope.g
etTexture( textureMap, child.ID );

                                                if ( parameters.specularMap !==
undefined ) {

                                                        parameters.specularMap.e
ncoding = THREE.sRGBEncoding;

                                                }

                                                break;

                                        case 'TransparentColor':
                                        case 'TransparencyFactor':
                                                parameters.alphaMap = scope.getT
exture( textureMap, child.ID );
                                                parameters.transparent = true;
                                                break;

                                        case 'AmbientColor':
                                        case 'ShininessExponent': // AKA glossin
ess map

                                        case 'SpecularFactor': // AKA specularLe
vel

                                        case 'VectorDisplacementColor': // NOTE:
 Seems to be a copy of DisplacementColor

                                        default:
                                                console.warn( 'THREE.FBXLoader:
%s map is not supported in three.js, skipping texture.', type );
                                                break;

                                }

                        } );
                        return parameters;

                } // get a texture from the textureMap for use by a material.


                getTexture( textureMap, id ) {

                        // if the texture is a layered texture, just use the fir
st layer and issue a warning
                        if ( 'LayeredTexture' in fbxTree.Objects && id in fbxTre
e.Objects.LayeredTexture ) {

                                console.warn( 'THREE.FBXLoader: layered textures
 are not supported in three.js. Discarding all but first layer.' );
                                id = connections.get( id ).children[ 0 ].ID;

                        }

                        return textureMap.get( id );

                } // Parse nodes in FBXTree.Objects.Deformer
                // Deformer node can contain skinning or Vertex Cache animation
data, however only skinning is supported here
                // Generates map of THREE.Skeleton-like objects for use later wh
en generating and binding skeletons.


                parseDeformers() {

                        const skeletons = {};
                        const morphTargets = {};

                        if ( 'Deformer' in fbxTree.Objects ) {

                                const DeformerNodes = fbxTree.Objects.Deformer;

                                for ( const nodeID in DeformerNodes ) {

                                        const deformerNode = DeformerNodes[ node
ID ];
                                        const relationships = connections.get( p
arseInt( nodeID ) );

                                        if ( deformerNode.attrType === 'Skin' )
{

                                                const skeleton = this.parseSkele
ton( relationships, DeformerNodes );
                                                skeleton.ID = nodeID;
                                                if ( relationships.parents.lengt
h > 1 ) console.warn( 'THREE.FBXLoader: skeleton attached to more than one geome
try is not supported.' );
                                                skeleton.geometryID = relationsh
ips.parents[ 0 ].ID;
                                                skeletons[ nodeID ] = skeleton;

                                        } else if ( deformerNode.attrType === 'B
lendShape' ) {

                                                const morphTarget = {
                                                        id: nodeID
                                                };
                                                morphTarget.rawTargets = this.pa
rseMorphTargets( relationships, DeformerNodes );
                                                morphTarget.id = nodeID;
                                                if ( relationships.parents.lengt
h > 1 ) console.warn( 'THREE.FBXLoader: morph target attached to more than one g
eometry is not supported.' );
                                                morphTargets[ nodeID ] = morphTa
rget;

                                        }

                                }

                        }

                        return {
                                skeletons: skeletons,
                                morphTargets: morphTargets
                        };

                } // Parse single nodes in FBXTree.Objects.Deformer
                // The top level skeleton node has type 'Skin' and sub nodes hav
e type 'Cluster'
                // Each skin node represents a skeleton and each cluster node re
presents a bone


                parseSkeleton( relationships, deformerNodes ) {

                        const rawBones = [];
                        relationships.children.forEach( function ( child ) {

                                const boneNode = deformerNodes[ child.ID ];
                                if ( boneNode.attrType !== 'Cluster' ) return;
                                const rawBone = {
                                        ID: child.ID,
                                        indices: [],
                                        weights: [],
                                        transformLink: new THREE.Matrix4().fromA
rray( boneNode.TransformLink.a ) // transform: new THREE.Matrix4().fromArray( bo
neNode.Transform.a ),
                                        // linkMode: boneNode.Mode,

                                };

                                if ( 'Indexes' in boneNode ) {

                                        rawBone.indices = boneNode.Indexes.a;
                                        rawBone.weights = boneNode.Weights.a;

                                }

                                rawBones.push( rawBone );

                        } );
                        return {
                                rawBones: rawBones,
                                bones: []
                        };

                } // The top level morph deformer node has type "BlendShape" and
 sub nodes have type "BlendShapeChannel"


                parseMorphTargets( relationships, deformerNodes ) {

                        const rawMorphTargets = [];

                        for ( let i = 0; i < relationships.children.length; i ++
 ) {

                                const child = relationships.children[ i ];
                                const morphTargetNode = deformerNodes[ child.ID
];
                                const rawMorphTarget = {
                                        name: morphTargetNode.attrName,
                                        initialWeight: morphTargetNode.DeformPer
cent,
                                        id: morphTargetNode.id,
                                        fullWeights: morphTargetNode.FullWeights
.a
                                };
                                if ( morphTargetNode.attrType !== 'BlendShapeCha
nnel' ) return;
                                rawMorphTarget.geoID = connections.get( parseInt
( child.ID ) ).children.filter( function ( child ) {

                                        return child.relationship === undefined;

                                } )[ 0 ].ID;
                                rawMorphTargets.push( rawMorphTarget );

                        }

                        return rawMorphTargets;

                } // create the main THREE.Group() to be returned by the loader


                parseScene( deformers, geometryMap, materialMap ) {

                        sceneGraph = new THREE.Group();
                        const modelMap = this.parseModels( deformers.skeletons,
geometryMap, materialMap );
                        const modelNodes = fbxTree.Objects.Model;
                        const scope = this;
                        modelMap.forEach( function ( model ) {

                                const modelNode = modelNodes[ model.ID ];
                                scope.setLookAtProperties( model, modelNode );
                                const parentConnections = connections.get( model
.ID ).parents;
                                parentConnections.forEach( function ( connection
 ) {

                                        const parent = modelMap.get( connection.
ID );
                                        if ( parent !== undefined ) parent.add(
model );

                                } );

                                if ( model.parent === null ) {

                                        sceneGraph.add( model );

                                }

                        } );
                        this.bindSkeleton( deformers.skeletons, geometryMap, mod
elMap );
                        this.createAmbientLight();
                        sceneGraph.traverse( function ( node ) {

                                if ( node.userData.transformData ) {

                                        if ( node.parent ) {

                                                node.userData.transformData.pare
ntMatrix = node.parent.matrix;
                                                node.userData.transformData.pare
ntMatrixWorld = node.parent.matrixWorld;

                                        }

                                        const transform = generateTransform( nod
e.userData.transformData );
                                        node.applyMatrix4( transform );
                                        node.updateWorldMatrix();

                                }

                        } );
                        const animations = new AnimationParser().parse(); // if
all the models where already combined in a single group, just return that

                        if ( sceneGraph.children.length === 1 && sceneGraph.chil
dren[ 0 ].isGroup ) {

                                sceneGraph.children[ 0 ].animations = animations
;
                                sceneGraph = sceneGraph.children[ 0 ];

                        }

                        sceneGraph.animations = animations;

                } // parse nodes in FBXTree.Objects.Model


                parseModels( skeletons, geometryMap, materialMap ) {

                        const modelMap = new Map();
                        const modelNodes = fbxTree.Objects.Model;

                        for ( const nodeID in modelNodes ) {

                                const id = parseInt( nodeID );
                                const node = modelNodes[ nodeID ];
                                const relationships = connections.get( id );
                                let model = this.buildSkeleton( relationships, s
keletons, id, node.attrName );

                                if ( ! model ) {

                                        switch ( node.attrType ) {

                                                case 'Camera':
                                                        model = this.createCamer
a( relationships );
                                                        break;

                                                case 'Light':
                                                        model = this.createLight
( relationships );
                                                        break;

                                                case 'Mesh':
                                                        model = this.createMesh(
 relationships, geometryMap, materialMap );
                                                        break;

                                                case 'NurbsCurve':
                                                        model = this.createCurve
( relationships, geometryMap );
                                                        break;

                                                case 'LimbNode':
                                                case 'Root':
                                                        model = new THREE.Bone()
;
                                                        break;

                                                case 'Null':
                                                default:
                                                        model = new THREE.Group(
);
                                                        break;

                                        }

                                        model.name = node.attrName ? THREE.Prope
rtyBinding.sanitizeNodeName( node.attrName ) : '';
                                        model.ID = id;

                                }

                                this.getTransformData( model, node );
                                modelMap.set( id, model );

                        }

                        return modelMap;

                }

                buildSkeleton( relationships, skeletons, id, name ) {

                        let bone = null;
                        relationships.parents.forEach( function ( parent ) {

                                for ( const ID in skeletons ) {

                                        const skeleton = skeletons[ ID ];
                                        skeleton.rawBones.forEach( function ( ra
wBone, i ) {

                                                if ( rawBone.ID === parent.ID )
{

                                                        const subBone = bone;
                                                        bone = new THREE.Bone();
                                                        bone.matrixWorld.copy( r
awBone.transformLink ); // set name and id here - otherwise in cases where "subB
one" is created it will not have a name / id

                                                        bone.name = name ? THREE
.PropertyBinding.sanitizeNodeName( name ) : '';
                                                        bone.ID = id;
                                                        skeleton.bones[ i ] = bo
ne; // In cases where a bone is shared between multiple meshes
                                                        // duplicate the bone he
re and and it as a child of the first bone

                                                        if ( subBone !== null )
{

                                                                bone.add( subBon
e );

                                                        }

                                                }

                                        } );

                                }

                        } );
                        return bone;

                } // create a THREE.PerspectiveCamera or THREE.OrthographicCamer
a


                createCamera( relationships ) {

                        let model;
                        let cameraAttribute;
                        relationships.children.forEach( function ( child ) {

                                const attr = fbxTree.Objects.NodeAttribute[ chil
d.ID ];

                                if ( attr !== undefined ) {

                                        cameraAttribute = attr;

                                }

                        } );

                        if ( cameraAttribute === undefined ) {

                                model = new THREE.Object3D();

                        } else {

                                let type = 0;

                                if ( cameraAttribute.CameraProjectionType !== un
defined && cameraAttribute.CameraProjectionType.value === 1 ) {

                                        type = 1;

                                }

                                let nearClippingPlane = 1;

                                if ( cameraAttribute.NearPlane !== undefined ) {

                                        nearClippingPlane = cameraAttribute.Near
Plane.value / 1000;

                                }

                                let farClippingPlane = 1000;

                                if ( cameraAttribute.FarPlane !== undefined ) {

                                        farClippingPlane = cameraAttribute.FarPl
ane.value / 1000;

                                }

                                let width = window.innerWidth;
                                let height = window.innerHeight;

                                if ( cameraAttribute.AspectWidth !== undefined &
& cameraAttribute.AspectHeight !== undefined ) {

                                        width = cameraAttribute.AspectWidth.valu
e;
                                        height = cameraAttribute.AspectHeight.va
lue;

                                }

                                const aspect = width / height;
                                let fov = 45;

                                if ( cameraAttribute.FieldOfView !== undefined )
 {

                                        fov = cameraAttribute.FieldOfView.value;

                                }

                                const focalLength = cameraAttribute.FocalLength
? cameraAttribute.FocalLength.value : null;

                                switch ( type ) {

                                        case 0:
                                                // Perspective
                                                model = new THREE.PerspectiveCam
era( fov, aspect, nearClippingPlane, farClippingPlane );
                                                if ( focalLength !== null ) mode
l.setFocalLength( focalLength );
                                                break;

                                        case 1:
                                                // Orthographic
                                                model = new THREE.OrthographicCa
mera( - width / 2, width / 2, height / 2, - height / 2, nearClippingPlane, farCl
ippingPlane );
                                                break;

                                        default:
                                                console.warn( 'THREE.FBXLoader:
Unknown camera type ' + type + '.' );
                                                model = new THREE.Object3D();
                                                break;

                                }

                        }

                        return model;

                } // Create a THREE.DirectionalLight, THREE.PointLight or THREE.
SpotLight


                createLight( relationships ) {

                        let model;
                        let lightAttribute;
                        relationships.children.forEach( function ( child ) {

                                const attr = fbxTree.Objects.NodeAttribute[ chil
d.ID ];

                                if ( attr !== undefined ) {

                                        lightAttribute = attr;

                                }

                        } );

                        if ( lightAttribute === undefined ) {

                                model = new THREE.Object3D();

                        } else {

                                let type; // LightType can be undefined for Poin
t lights

                                if ( lightAttribute.LightType === undefined ) {

                                        type = 0;

                                } else {

                                        type = lightAttribute.LightType.value;

                                }

                                let color = 0xffffff;

                                if ( lightAttribute.Color !== undefined ) {

                                        color = new THREE.Color().fromArray( lig
htAttribute.Color.value );

                                }

                                let intensity = lightAttribute.Intensity === und
efined ? 1 : lightAttribute.Intensity.value / 100; // light disabled

                                if ( lightAttribute.CastLightOnObject !== undefi
ned && lightAttribute.CastLightOnObject.value === 0 ) {

                                        intensity = 0;

                                }

                                let distance = 0;

                                if ( lightAttribute.FarAttenuationEnd !== undefi
ned ) {

                                        if ( lightAttribute.EnableFarAttenuation
 !== undefined && lightAttribute.EnableFarAttenuation.value === 0 ) {

                                                distance = 0;

                                        } else {

                                                distance = lightAttribute.FarAtt
enuationEnd.value;

                                        }

                                } // TODO: could this be calculated linearly fro
m FarAttenuationStart to FarAttenuationEnd?


                                const decay = 1;

                                switch ( type ) {

                                        case 0:
                                                // Point
                                                model = new THREE.PointLight( co
lor, intensity, distance, decay );
                                                break;

                                        case 1:
                                                // Directional
                                                model = new THREE.DirectionalLig
ht( color, intensity );
                                                break;

                                        case 2:
                                                // Spot
                                                let angle = Math.PI / 3;

                                                if ( lightAttribute.InnerAngle !
== undefined ) {

                                                        angle = THREE.MathUtils.
degToRad( lightAttribute.InnerAngle.value );

                                                }

                                                let penumbra = 0;

                                                if ( lightAttribute.OuterAngle !
== undefined ) {

                                                        // TODO: this is not cor
rect - FBX calculates outer and inner angle in degrees
                                                        // with OuterAngle > Inn
erAngle && OuterAngle <= Math.PI
                                                        // while three.js uses a
 penumbra between (0, 1) to attenuate the inner angle
                                                        penumbra = THREE.MathUti
ls.degToRad( lightAttribute.OuterAngle.value );
                                                        penumbra = Math.max( pen
umbra, 1 );

                                                }

                                                model = new THREE.SpotLight( col
or, intensity, distance, angle, penumbra, decay );
                                                break;

                                        default:
                                                console.warn( 'THREE.FBXLoader:
Unknown light type ' + lightAttribute.LightType.value + ', defaulting to a THREE
.PointLight.' );
                                                model = new THREE.PointLight( co
lor, intensity );
                                                break;

                                }

                                if ( lightAttribute.CastShadows !== undefined &&
 lightAttribute.CastShadows.value === 1 ) {

                                        model.castShadow = true;

                                }

                        }

                        return model;

                }

                createMesh( relationships, geometryMap, materialMap ) {

                        let model;
                        let geometry = null;
                        let material = null;
                        const materials = []; // get geometry and materials(s) f
rom connections

                        relationships.children.forEach( function ( child ) {

                                if ( geometryMap.has( child.ID ) ) {

                                        geometry = geometryMap.get( child.ID );

                                }

                                if ( materialMap.has( child.ID ) ) {

                                        materials.push( materialMap.get( child.I
D ) );

                                }

                        } );

                        if ( materials.length > 1 ) {

                                material = materials;

                        } else if ( materials.length > 0 ) {

                                material = materials[ 0 ];

                        } else {

                                material = new THREE.MeshPhongMaterial( {
                                        color: 0xcccccc
                                } );
                                materials.push( material );

                        }

                        if ( 'color' in geometry.attributes ) {

                                materials.forEach( function ( material ) {

                                        material.vertexColors = true;

                                } );

                        }

                        if ( geometry.FBX_Deformer ) {

                                model = new THREE.SkinnedMesh( geometry, materia
l );
                                model.normalizeSkinWeights();

                        } else {

                                model = new THREE.Mesh( geometry, material );

                        }

                        return model;

                }

                createCurve( relationships, geometryMap ) {

                        const geometry = relationships.children.reduce( function
 ( geo, child ) {

                                if ( geometryMap.has( child.ID ) ) geo = geometr
yMap.get( child.ID );
                                return geo;

                        }, null ); // FBX does not list materials for Nurbs line
s, so we'll just put our own in here.

                        const material = new THREE.LineBasicMaterial( {
                                color: 0x3300ff,
                                linewidth: 1
                        } );
                        return new THREE.Line( geometry, material );

                } // parse the model node for transform data


                getTransformData( model, modelNode ) {

                        const transformData = {};
                        if ( 'InheritType' in modelNode ) transformData.inheritT
ype = parseInt( modelNode.InheritType.value );
                        if ( 'RotationOrder' in modelNode ) transformData.eulerO
rder = getEulerOrder( modelNode.RotationOrder.value ); else transformData.eulerO
rder = 'ZYX';
                        if ( 'Lcl_Translation' in modelNode ) transformData.tran
slation = modelNode.Lcl_Translation.value;
                        if ( 'PreRotation' in modelNode ) transformData.preRotat
ion = modelNode.PreRotation.value;
                        if ( 'Lcl_Rotation' in modelNode ) transformData.rotatio
n = modelNode.Lcl_Rotation.value;
                        if ( 'PostRotation' in modelNode ) transformData.postRot
ation = modelNode.PostRotation.value;
                        if ( 'Lcl_Scaling' in modelNode ) transformData.scale =
modelNode.Lcl_Scaling.value;
                        if ( 'ScalingOffset' in modelNode ) transformData.scalin
gOffset = modelNode.ScalingOffset.value;
                        if ( 'ScalingPivot' in modelNode ) transformData.scaling
Pivot = modelNode.ScalingPivot.value;
                        if ( 'RotationOffset' in modelNode ) transformData.rotat
ionOffset = modelNode.RotationOffset.value;
                        if ( 'RotationPivot' in modelNode ) transformData.rotati
onPivot = modelNode.RotationPivot.value;
                        model.userData.transformData = transformData;

                }

                setLookAtProperties( model, modelNode ) {

                        if ( 'LookAtProperty' in modelNode ) {

                                const children = connections.get( model.ID ).chi
ldren;
                                children.forEach( function ( child ) {

                                        if ( child.relationship === 'LookAtPrope
rty' ) {

                                                const lookAtTarget = fbxTree.Obj
ects.Model[ child.ID ];

                                                if ( 'Lcl_Translation' in lookAt
Target ) {

                                                        const pos = lookAtTarget
.Lcl_Translation.value; // THREE.DirectionalLight, THREE.SpotLight

                                                        if ( model.target !== un
defined ) {

                                                                model.target.pos
ition.fromArray( pos );
                                                                sceneGraph.add(
model.target );

                                                        } else {

                                                                // Cameras and o
ther Object3Ds
                                                                model.lookAt( ne
w THREE.Vector3().fromArray( pos ) );

                                                        }

                                                }

                                        }

                                } );

                        }

                }

                bindSkeleton( skeletons, geometryMap, modelMap ) {

                        const bindMatrices = this.parsePoseNodes();

                        for ( const ID in skeletons ) {

                                const skeleton = skeletons[ ID ];
                                const parents = connections.get( parseInt( skele
ton.ID ) ).parents;
                                parents.forEach( function ( parent ) {

                                        if ( geometryMap.has( parent.ID ) ) {

                                                const geoID = parent.ID;
                                                const geoRelationships = connect
ions.get( geoID );
                                                geoRelationships.parents.forEach
( function ( geoConnParent ) {

                                                        if ( modelMap.has( geoCo
nnParent.ID ) ) {

                                                                const model = mo
delMap.get( geoConnParent.ID );
                                                                model.bind( new
THREE.Skeleton( skeleton.bones ), bindMatrices[ geoConnParent.ID ] );

                                                        }

                                                } );

                                        }

                                } );

                        }

                }

                parsePoseNodes() {

                        const bindMatrices = {};

                        if ( 'Pose' in fbxTree.Objects ) {

                                const BindPoseNode = fbxTree.Objects.Pose;

                                for ( const nodeID in BindPoseNode ) {

                                        if ( BindPoseNode[ nodeID ].attrType ===
 'BindPose' && BindPoseNode[ nodeID ].NbPoseNodes > 0 ) {

                                                const poseNodes = BindPoseNode[
nodeID ].PoseNode;

                                                if ( Array.isArray( poseNodes )
) {

                                                        poseNodes.forEach( funct
ion ( poseNode ) {

                                                                bindMatrices[ po
seNode.Node ] = new THREE.Matrix4().fromArray( poseNode.Matrix.a );

                                                        } );

                                                } else {

                                                        bindMatrices[ poseNodes.
Node ] = new THREE.Matrix4().fromArray( poseNodes.Matrix.a );

                                                }

                                        }

                                }

                        }

                        return bindMatrices;

                } // Parse ambient color in FBXTree.GlobalSettings - if it's not
 set to black (default), create an ambient light


                createAmbientLight() {

                        if ( 'GlobalSettings' in fbxTree && 'AmbientColor' in fb
xTree.GlobalSettings ) {

                                const ambientColor = fbxTree.GlobalSettings.Ambi
entColor.value;
                                const r = ambientColor[ 0 ];
                                const g = ambientColor[ 1 ];
                                const b = ambientColor[ 2 ];

                                if ( r !== 0 || g !== 0 || b !== 0 ) {

                                        const color = new THREE.Color( r, g, b )
;
                                        sceneGraph.add( new THREE.AmbientLight(
color, 1 ) );

                                }

                        }

                }

        } // parse Geometry data from FBXTree and return map of BufferGeometries


        class GeometryParser {

                // Parse nodes in FBXTree.Objects.Geometry
                parse( deformers ) {

                        const geometryMap = new Map();

                        if ( 'Geometry' in fbxTree.Objects ) {

                                const geoNodes = fbxTree.Objects.Geometry;

                                for ( const nodeID in geoNodes ) {

                                        const relationships = connections.get( p
arseInt( nodeID ) );
                                        const geo = this.parseGeometry( relation
ships, geoNodes[ nodeID ], deformers );
                                        geometryMap.set( parseInt( nodeID ), geo
 );

                                }

                        }

                        return geometryMap;

                } // Parse single node in FBXTree.Objects.Geometry


                parseGeometry( relationships, geoNode, deformers ) {

                        switch ( geoNode.attrType ) {

                                case 'Mesh':
                                        return this.parseMeshGeometry( relations
hips, geoNode, deformers );
                                        break;

                                case 'NurbsCurve':
                                        return this.parseNurbsGeometry( geoNode
);
                                        break;

                        }

                } // Parse single node mesh geometry in FBXTree.Objects.Geometry


                parseMeshGeometry( relationships, geoNode, deformers ) {

                        const skeletons = deformers.skeletons;
                        const morphTargets = [];
                        const modelNodes = relationships.parents.map( function (
 parent ) {

                                return fbxTree.Objects.Model[ parent.ID ];

                        } ); // don't create geometry if it is not associated wi
th any models

                        if ( modelNodes.length === 0 ) return;
                        const skeleton = relationships.children.reduce( function
 ( skeleton, child ) {

                                if ( skeletons[ child.ID ] !== undefined ) skele
ton = skeletons[ child.ID ];
                                return skeleton;

                        }, null );
                        relationships.children.forEach( function ( child ) {

                                if ( deformers.morphTargets[ child.ID ] !== unde
fined ) {

                                        morphTargets.push( deformers.morphTarget
s[ child.ID ] );

                                }

                        } ); // Assume one model and get the preRotation from th
at
                        // if there is more than one model associated with the g
eometry this may cause problems

                        const modelNode = modelNodes[ 0 ];
                        const transformData = {};
                        if ( 'RotationOrder' in modelNode ) transformData.eulerO
rder = getEulerOrder( modelNode.RotationOrder.value );
                        if ( 'InheritType' in modelNode ) transformData.inheritT
ype = parseInt( modelNode.InheritType.value );
                        if ( 'GeometricTranslation' in modelNode ) transformData
.translation = modelNode.GeometricTranslation.value;
                        if ( 'GeometricRotation' in modelNode ) transformData.ro
tation = modelNode.GeometricRotation.value;
                        if ( 'GeometricScaling' in modelNode ) transformData.sca
le = modelNode.GeometricScaling.value;
                        const transform = generateTransform( transformData );
                        return this.genGeometry( geoNode, skeleton, morphTargets
, transform );

                } // Generate a THREE.BufferGeometry from a node in FBXTree.Obje
cts.Geometry


                genGeometry( geoNode, skeleton, morphTargets, preTransform ) {

                        const geo = new THREE.BufferGeometry();
                        if ( geoNode.attrName ) geo.name = geoNode.attrName;
                        const geoInfo = this.parseGeoNode( geoNode, skeleton );
                        const buffers = this.genBuffers( geoInfo );
                        const positionAttribute = new THREE.Float32BufferAttribu
te( buffers.vertex, 3 );
                        positionAttribute.applyMatrix4( preTransform );
                        geo.setAttribute( 'position', positionAttribute );

                        if ( buffers.colors.length > 0 ) {

                                geo.setAttribute( 'color', new THREE.Float32Buff
erAttribute( buffers.colors, 3 ) );

                        }

                        if ( skeleton ) {

                                geo.setAttribute( 'skinIndex', new THREE.Uint16B
ufferAttribute( buffers.weightsIndices, 4 ) );
                                geo.setAttribute( 'skinWeight', new THREE.Float3
2BufferAttribute( buffers.vertexWeights, 4 ) ); // used later to bind the skelet
on to the model

                                geo.FBX_Deformer = skeleton;

                        }

                        if ( buffers.normal.length > 0 ) {

                                const normalMatrix = new THREE.Matrix3().getNorm
alMatrix( preTransform );
                                const normalAttribute = new THREE.Float32BufferA
ttribute( buffers.normal, 3 );
                                normalAttribute.applyNormalMatrix( normalMatrix
);
                                geo.setAttribute( 'normal', normalAttribute );

                        }

                        buffers.uvs.forEach( function ( uvBuffer, i ) {

                                // subsequent uv buffers are called 'uv1', 'uv2'
, ...
                                let name = 'uv' + ( i + 1 ).toString(); // the f
irst uv buffer is just called 'uv'

                                if ( i === 0 ) {

                                        name = 'uv';

                                }

                                geo.setAttribute( name, new THREE.Float32BufferA
ttribute( buffers.uvs[ i ], 2 ) );

                        } );

                        if ( geoInfo.material && geoInfo.material.mappingType !=
= 'AllSame' ) {

                                // Convert the material indices of each vertex i
nto rendering groups on the geometry.
                                let prevMaterialIndex = buffers.materialIndex[ 0
 ];
                                let startIndex = 0;
                                buffers.materialIndex.forEach( function ( curren
tIndex, i ) {

                                        if ( currentIndex !== prevMaterialIndex
) {

                                                geo.addGroup( startIndex, i - st
artIndex, prevMaterialIndex );
                                                prevMaterialIndex = currentIndex
;
                                                startIndex = i;

                                        }

                                } ); // the loop above doesn't add the last grou
p, do that here.

                                if ( geo.groups.length > 0 ) {

                                        const lastGroup = geo.groups[ geo.groups
.length - 1 ];
                                        const lastIndex = lastGroup.start + last
Group.count;

                                        if ( lastIndex !== buffers.materialIndex
.length ) {

                                                geo.addGroup( lastIndex, buffers
.materialIndex.length - lastIndex, prevMaterialIndex );

                                        }

                                } // case where there are multiple materials but
 the whole geometry is only
                                // using one of them


                                if ( geo.groups.length === 0 ) {

                                        geo.addGroup( 0, buffers.materialIndex.l
ength, buffers.materialIndex[ 0 ] );

                                }

                        }

                        this.addMorphTargets( geo, geoNode, morphTargets, preTra
nsform );
                        return geo;

                }

                parseGeoNode( geoNode, skeleton ) {

                        const geoInfo = {};
                        geoInfo.vertexPositions = geoNode.Vertices !== undefined
 ? geoNode.Vertices.a : [];
                        geoInfo.vertexIndices = geoNode.PolygonVertexIndex !== u
ndefined ? geoNode.PolygonVertexIndex.a : [];

                        if ( geoNode.LayerElementColor ) {

                                geoInfo.color = this.parseVertexColors( geoNode.
LayerElementColor[ 0 ] );

                        }

                        if ( geoNode.LayerElementMaterial ) {

                                geoInfo.material = this.parseMaterialIndices( ge
oNode.LayerElementMaterial[ 0 ] );

                        }

                        if ( geoNode.LayerElementNormal ) {

                                geoInfo.normal = this.parseNormals( geoNode.Laye
rElementNormal[ 0 ] );

                        }

                        if ( geoNode.LayerElementUV ) {

                                geoInfo.uv = [];
                                let i = 0;

                                while ( geoNode.LayerElementUV[ i ] ) {

                                        if ( geoNode.LayerElementUV[ i ].UV ) {

                                                geoInfo.uv.push( this.parseUVs(
geoNode.LayerElementUV[ i ] ) );

                                        }

                                        i ++;

                                }

                        }

                        geoInfo.weightTable = {};

                        if ( skeleton !== null ) {

                                geoInfo.skeleton = skeleton;
                                skeleton.rawBones.forEach( function ( rawBone, i
 ) {

                                        // loop over the bone's vertex indices a
nd weights
                                        rawBone.indices.forEach( function ( inde
x, j ) {

                                                if ( geoInfo.weightTable[ index
] === undefined ) geoInfo.weightTable[ index ] = [];
                                                geoInfo.weightTable[ index ].pus
h( {
                                                        id: i,
                                                        weight: rawBone.weights[
 j ]
                                                } );

                                        } );

                                } );

                        }

                        return geoInfo;

                }

                genBuffers( geoInfo ) {

                        const buffers = {
                                vertex: [],
                                normal: [],
                                colors: [],
                                uvs: [],
                                materialIndex: [],
                                vertexWeights: [],
                                weightsIndices: []
                        };
                        let polygonIndex = 0;
                        let faceLength = 0;
                        let displayedWeightsWarning = false; // these will hold
data for a single face

                        let facePositionIndexes = [];
                        let faceNormals = [];
                        let faceColors = [];
                        let faceUVs = [];
                        let faceWeights = [];
                        let faceWeightIndices = [];
                        const scope = this;
                        geoInfo.vertexIndices.forEach( function ( vertexIndex, p
olygonVertexIndex ) {

                                let materialIndex;
                                let endOfFace = false; // Face index and vertex
index arrays are combined in a single array
                                // A cube with quad faces looks like this:
                                // PolygonVertexIndex: *24 {
                                //  a: 0, 1, 3, -3, 2, 3, 5, -5, 4, 5, 7, -7, 6,
 7, 1, -1, 1, 7, 5, -4, 6, 0, 2, -5
                                //  }
                                // Negative numbers mark the end of a face - fir
st face here is 0, 1, 3, -3
                                // to find index of last vertex bit shift the in
dex: ^ - 1

                                if ( vertexIndex < 0 ) {

                                        vertexIndex = vertexIndex ^ - 1; // equi
valent to ( x * -1 ) - 1

                                        endOfFace = true;

                                }

                                let weightIndices = [];
                                let weights = [];
                                facePositionIndexes.push( vertexIndex * 3, verte
xIndex * 3 + 1, vertexIndex * 3 + 2 );

                                if ( geoInfo.color ) {

                                        const data = getData( polygonVertexIndex
, polygonIndex, vertexIndex, geoInfo.color );
                                        faceColors.push( data[ 0 ], data[ 1 ], d
ata[ 2 ] );

                                }

                                if ( geoInfo.skeleton ) {

                                        if ( geoInfo.weightTable[ vertexIndex ]
!== undefined ) {

                                                geoInfo.weightTable[ vertexIndex
 ].forEach( function ( wt ) {

                                                        weights.push( wt.weight
);
                                                        weightIndices.push( wt.i
d );

                                                } );

                                        }

                                        if ( weights.length > 4 ) {

                                                if ( ! displayedWeightsWarning )
 {

                                                        console.warn( 'THREE.FBX
Loader: Vertex has more than 4 skinning weights assigned to vertex. Deleting add
itional weights.' );
                                                        displayedWeightsWarning
= true;

                                                }

                                                const wIndex = [ 0, 0, 0, 0 ];
                                                const Weight = [ 0, 0, 0, 0 ];
                                                weights.forEach( function ( weig
ht, weightIndex ) {

                                                        let currentWeight = weig
ht;
                                                        let currentIndex = weigh
tIndices[ weightIndex ];
                                                        Weight.forEach( function
 ( comparedWeight, comparedWeightIndex, comparedWeightArray ) {

                                                                if ( currentWeig
ht > comparedWeight ) {

                                                                        compared
WeightArray[ comparedWeightIndex ] = currentWeight;
                                                                        currentW
eight = comparedWeight;
                                                                        const tm
p = wIndex[ comparedWeightIndex ];
                                                                        wIndex[
comparedWeightIndex ] = currentIndex;
                                                                        currentI
ndex = tmp;

                                                                }

                                                        } );

                                                } );
                                                weightIndices = wIndex;
                                                weights = Weight;

                                        } // if the weight array is shorter than
 4 pad with 0s


                                        while ( weights.length < 4 ) {

                                                weights.push( 0 );
                                                weightIndices.push( 0 );

                                        }

                                        for ( let i = 0; i < 4; ++ i ) {

                                                faceWeights.push( weights[ i ] )
;
                                                faceWeightIndices.push( weightIn
dices[ i ] );

                                        }

                                }

                                if ( geoInfo.normal ) {

                                        const data = getData( polygonVertexIndex
, polygonIndex, vertexIndex, geoInfo.normal );
                                        faceNormals.push( data[ 0 ], data[ 1 ],
data[ 2 ] );

                                }

                                if ( geoInfo.material && geoInfo.material.mappin
gType !== 'AllSame' ) {

                                        materialIndex = getData( polygonVertexIn
dex, polygonIndex, vertexIndex, geoInfo.material )[ 0 ];

                                }

                                if ( geoInfo.uv ) {

                                        geoInfo.uv.forEach( function ( uv, i ) {

                                                const data = getData( polygonVer
texIndex, polygonIndex, vertexIndex, uv );

                                                if ( faceUVs[ i ] === undefined
) {

                                                        faceUVs[ i ] = [];

                                                }

                                                faceUVs[ i ].push( data[ 0 ] );
                                                faceUVs[ i ].push( data[ 1 ] );

                                        } );

                                }

                                faceLength ++;

                                if ( endOfFace ) {

                                        scope.genFace( buffers, geoInfo, facePos
itionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, face
WeightIndices, faceLength );
                                        polygonIndex ++;
                                        faceLength = 0; // reset arrays for the
next face

                                        facePositionIndexes = [];
                                        faceNormals = [];
                                        faceColors = [];
                                        faceUVs = [];
                                        faceWeights = [];
                                        faceWeightIndices = [];

                                }

                        } );
                        return buffers;

                } // Generate data for a single face in a geometry. If the face
is a quad then split it into 2 tris


                genFace( buffers, geoInfo, facePositionIndexes, materialIndex, f
aceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength ) {

                        for ( let i = 2; i < faceLength; i ++ ) {

                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ 0 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ 1 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ 2 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ ( i - 1 ) * 3 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ ( i - 1 ) * 3 + 1 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ ( i - 1 ) * 3 + 2 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ i * 3 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ i * 3 + 1 ] ] );
                                buffers.vertex.push( geoInfo.vertexPositions[ fa
cePositionIndexes[ i * 3 + 2 ] ] );

                                if ( geoInfo.skeleton ) {

                                        buffers.vertexWeights.push( faceWeights[
 0 ] );
                                        buffers.vertexWeights.push( faceWeights[
 1 ] );
                                        buffers.vertexWeights.push( faceWeights[
 2 ] );
                                        buffers.vertexWeights.push( faceWeights[
 3 ] );
                                        buffers.vertexWeights.push( faceWeights[
 ( i - 1 ) * 4 ] );
                                        buffers.vertexWeights.push( faceWeights[
 ( i - 1 ) * 4 + 1 ] );
                                        buffers.vertexWeights.push( faceWeights[
 ( i - 1 ) * 4 + 2 ] );
                                        buffers.vertexWeights.push( faceWeights[
 ( i - 1 ) * 4 + 3 ] );
                                        buffers.vertexWeights.push( faceWeights[
 i * 4 ] );
                                        buffers.vertexWeights.push( faceWeights[
 i * 4 + 1 ] );
                                        buffers.vertexWeights.push( faceWeights[
 i * 4 + 2 ] );
                                        buffers.vertexWeights.push( faceWeights[
 i * 4 + 3 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ 0 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ 1 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ 2 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ 3 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ ( i - 1 ) * 4 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ ( i - 1 ) * 4 + 1 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ ( i - 1 ) * 4 + 2 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ ( i - 1 ) * 4 + 3 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ i * 4 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ i * 4 + 1 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ i * 4 + 2 ] );
                                        buffers.weightsIndices.push( faceWeightI
ndices[ i * 4 + 3 ] );

                                }

                                if ( geoInfo.color ) {

                                        buffers.colors.push( faceColors[ 0 ] );
                                        buffers.colors.push( faceColors[ 1 ] );
                                        buffers.colors.push( faceColors[ 2 ] );
                                        buffers.colors.push( faceColors[ ( i - 1
 ) * 3 ] );
                                        buffers.colors.push( faceColors[ ( i - 1
 ) * 3 + 1 ] );
                                        buffers.colors.push( faceColors[ ( i - 1
 ) * 3 + 2 ] );
                                        buffers.colors.push( faceColors[ i * 3 ]
 );
                                        buffers.colors.push( faceColors[ i * 3 +
 1 ] );
                                        buffers.colors.push( faceColors[ i * 3 +
 2 ] );

                                }

                                if ( geoInfo.material && geoInfo.material.mappin
gType !== 'AllSame' ) {

                                        buffers.materialIndex.push( materialInde
x );
                                        buffers.materialIndex.push( materialInde
x );
                                        buffers.materialIndex.push( materialInde
x );

                                }

                                if ( geoInfo.normal ) {

                                        buffers.normal.push( faceNormals[ 0 ] );
                                        buffers.normal.push( faceNormals[ 1 ] );
                                        buffers.normal.push( faceNormals[ 2 ] );
                                        buffers.normal.push( faceNormals[ ( i -
1 ) * 3 ] );
                                        buffers.normal.push( faceNormals[ ( i -
1 ) * 3 + 1 ] );
                                        buffers.normal.push( faceNormals[ ( i -
1 ) * 3 + 2 ] );
                                        buffers.normal.push( faceNormals[ i * 3
] );
                                        buffers.normal.push( faceNormals[ i * 3
+ 1 ] );
                                        buffers.normal.push( faceNormals[ i * 3
+ 2 ] );

                                }

                                if ( geoInfo.uv ) {

                                        geoInfo.uv.forEach( function ( uv, j ) {

                                                if ( buffers.uvs[ j ] === undefi
ned ) buffers.uvs[ j ] = [];
                                                buffers.uvs[ j ].push( faceUVs[
j ][ 0 ] );
                                                buffers.uvs[ j ].push( faceUVs[
j ][ 1 ] );
                                                buffers.uvs[ j ].push( faceUVs[
j ][ ( i - 1 ) * 2 ] );
                                                buffers.uvs[ j ].push( faceUVs[
j ][ ( i - 1 ) * 2 + 1 ] );
                                                buffers.uvs[ j ].push( faceUVs[
j ][ i * 2 ] );
                                                buffers.uvs[ j ].push( faceUVs[
j ][ i * 2 + 1 ] );

                                        } );

                                }

                        }

                }

                addMorphTargets( parentGeo, parentGeoNode, morphTargets, preTran
sform ) {

                        if ( morphTargets.length === 0 ) return;
                        parentGeo.morphTargetsRelative = true;
                        parentGeo.morphAttributes.position = []; // parentGeo.mo
rphAttributes.normal = []; // not implemented

                        const scope = this;
                        morphTargets.forEach( function ( morphTarget ) {

                                morphTarget.rawTargets.forEach( function ( rawTa
rget ) {

                                        const morphGeoNode = fbxTree.Objects.Geo
metry[ rawTarget.geoID ];

                                        if ( morphGeoNode !== undefined ) {

                                                scope.genMorphGeometry( parentGe
o, parentGeoNode, morphGeoNode, preTransform, rawTarget.name );

                                        }

                                } );

                        } );

                } // a morph geometry node is similar to a standard  node, and t
he node is also contained
                // in FBXTree.Objects.Geometry, however it can only have attribu
tes for position, normal
                // and a special attribute Index defining which vertices of the
original geometry are affected
                // Normal and position attributes only have data for the vertice
s that are affected by the morph


                genMorphGeometry( parentGeo, parentGeoNode, morphGeoNode, preTra
nsform, name ) {

                        const vertexIndices = parentGeoNode.PolygonVertexIndex !
== undefined ? parentGeoNode.PolygonVertexIndex.a : [];
                        const morphPositionsSparse = morphGeoNode.Vertices !== u
ndefined ? morphGeoNode.Vertices.a : [];
                        const indices = morphGeoNode.Indexes !== undefined ? mor
phGeoNode.Indexes.a : [];
                        const length = parentGeo.attributes.position.count * 3;
                        const morphPositions = new Float32Array( length );

                        for ( let i = 0; i < indices.length; i ++ ) {

                                const morphIndex = indices[ i ] * 3;
                                morphPositions[ morphIndex ] = morphPositionsSpa
rse[ i * 3 ];
                                morphPositions[ morphIndex + 1 ] = morphPosition
sSparse[ i * 3 + 1 ];
                                morphPositions[ morphIndex + 2 ] = morphPosition
sSparse[ i * 3 + 2 ];

                        } // TODO: add morph normal support


                        const morphGeoInfo = {
                                vertexIndices: vertexIndices,
                                vertexPositions: morphPositions
                        };
                        const morphBuffers = this.genBuffers( morphGeoInfo );
                        const positionAttribute = new THREE.Float32BufferAttribu
te( morphBuffers.vertex, 3 );
                        positionAttribute.name = name || morphGeoNode.attrName;
                        positionAttribute.applyMatrix4( preTransform );
                        parentGeo.morphAttributes.position.push( positionAttribu
te );

                } // Parse normal from FBXTree.Objects.Geometry.LayerElementNorm
al if it exists


                parseNormals( NormalNode ) {

                        const mappingType = NormalNode.MappingInformationType;
                        const referenceType = NormalNode.ReferenceInformationTyp
e;
                        const buffer = NormalNode.Normals.a;
                        let indexBuffer = [];

                        if ( referenceType === 'IndexToDirect' ) {

                                if ( 'NormalIndex' in NormalNode ) {

                                        indexBuffer = NormalNode.NormalIndex.a;

                                } else if ( 'NormalsIndex' in NormalNode ) {

                                        indexBuffer = NormalNode.NormalsIndex.a;

                                }

                        }

                        return {
                                dataSize: 3,
                                buffer: buffer,
                                indices: indexBuffer,
                                mappingType: mappingType,
                                referenceType: referenceType
                        };

                } // Parse UVs from FBXTree.Objects.Geometry.LayerElementUV if i
t exists


                parseUVs( UVNode ) {

                        const mappingType = UVNode.MappingInformationType;
                        const referenceType = UVNode.ReferenceInformationType;
                        const buffer = UVNode.UV.a;
                        let indexBuffer = [];

                        if ( referenceType === 'IndexToDirect' ) {

                                indexBuffer = UVNode.UVIndex.a;

                        }

                        return {
                                dataSize: 2,
                                buffer: buffer,
                                indices: indexBuffer,
                                mappingType: mappingType,
                                referenceType: referenceType
                        };

                } // Parse Vertex Colors from FBXTree.Objects.Geometry.LayerElem
entColor if it exists


                parseVertexColors( ColorNode ) {

                        const mappingType = ColorNode.MappingInformationType;
                        const referenceType = ColorNode.ReferenceInformationType
;
                        const buffer = ColorNode.Colors.a;
                        let indexBuffer = [];

                        if ( referenceType === 'IndexToDirect' ) {

                                indexBuffer = ColorNode.ColorIndex.a;

                        }

                        return {
                                dataSize: 4,
                                buffer: buffer,
                                indices: indexBuffer,
                                mappingType: mappingType,
                                referenceType: referenceType
                        };

                } // Parse mapping and material data in FBXTree.Objects.Geometry
.LayerElementMaterial if it exists


                parseMaterialIndices( MaterialNode ) {

                        const mappingType = MaterialNode.MappingInformationType;
                        const referenceType = MaterialNode.ReferenceInformationT
ype;

                        if ( mappingType === 'NoMappingInformation' ) {

                                return {
                                        dataSize: 1,
                                        buffer: [ 0 ],
                                        indices: [ 0 ],
                                        mappingType: 'AllSame',
                                        referenceType: referenceType
                                };

                        }

                        const materialIndexBuffer = MaterialNode.Materials.a; //
 Since materials are stored as indices, there's a bit of a mismatch between FBX
and what
                        // we expect.So we create an intermediate buffer that po
ints to the index in the buffer,
                        // for conforming with the other functions we've written
 for other data.

                        const materialIndices = [];

                        for ( let i = 0; i < materialIndexBuffer.length; ++ i )
{

                                materialIndices.push( i );

                        }

                        return {
                                dataSize: 1,
                                buffer: materialIndexBuffer,
                                indices: materialIndices,
                                mappingType: mappingType,
                                referenceType: referenceType
                        };

                } // Generate a NurbGeometry from a node in FBXTree.Objects.Geom
etry


                parseNurbsGeometry( geoNode ) {

                        if ( THREE.NURBSCurve === undefined ) {

                                console.error( 'THREE.FBXLoader: The loader reli
es on THREE.NURBSCurve for any nurbs present in the model. Nurbs will show up as
 empty geometry.' );
                                return new THREE.BufferGeometry();

                        }

                        const order = parseInt( geoNode.Order );

                        if ( isNaN( order ) ) {

                                console.error( 'THREE.FBXLoader: Invalid Order %
s given for geometry ID: %s', geoNode.Order, geoNode.id );
                                return new THREE.BufferGeometry();

                        }

                        const degree = order - 1;
                        const knots = geoNode.KnotVector.a;
                        const controlPoints = [];
                        const pointsValues = geoNode.Points.a;

                        for ( let i = 0, l = pointsValues.length; i < l; i += 4
) {

                                controlPoints.push( new THREE.Vector4().fromArra
y( pointsValues, i ) );

                        }

                        let startKnot, endKnot;

                        if ( geoNode.Form === 'Closed' ) {

                                controlPoints.push( controlPoints[ 0 ] );

                        } else if ( geoNode.Form === 'Periodic' ) {

                                startKnot = degree;
                                endKnot = knots.length - 1 - startKnot;

                                for ( let i = 0; i < degree; ++ i ) {

                                        controlPoints.push( controlPoints[ i ] )
;

                                }

                        }

                        const curve = new THREE.NURBSCurve( degree, knots, contr
olPoints, startKnot, endKnot );
                        const points = curve.getPoints( controlPoints.length * 1
2 );
                        return new THREE.BufferGeometry().setFromPoints( points
);

                }

        } // parse animation data from FBXTree


        class AnimationParser {

                // take raw animation clips and turn them into three.js animatio
n clips
                parse() {

                        const animationClips = [];
                        const rawClips = this.parseClips();

                        if ( rawClips !== undefined ) {

                                for ( const key in rawClips ) {

                                        const rawClip = rawClips[ key ];
                                        const clip = this.addClip( rawClip );
                                        animationClips.push( clip );

                                }

                        }

                        return animationClips;

                }

                parseClips() {

                        // since the actual transformation data is stored in FBX
Tree.Objects.AnimationCurve,
                        // if this is undefined we can safely assume there are n
o animations
                        if ( fbxTree.Objects.AnimationCurve === undefined ) retu
rn undefined;
                        const curveNodesMap = this.parseAnimationCurveNodes();
                        this.parseAnimationCurves( curveNodesMap );
                        const layersMap = this.parseAnimationLayers( curveNodesM
ap );
                        const rawClips = this.parseAnimStacks( layersMap );
                        return rawClips;

                } // parse nodes in FBXTree.Objects.AnimationCurveNode
                // each AnimationCurveNode holds data for an animation transform
 for a model (e.g. left arm rotation )
                // and is referenced by an AnimationLayer


                parseAnimationCurveNodes() {

                        const rawCurveNodes = fbxTree.Objects.AnimationCurveNode
;
                        const curveNodesMap = new Map();

                        for ( const nodeID in rawCurveNodes ) {

                                const rawCurveNode = rawCurveNodes[ nodeID ];

                                if ( rawCurveNode.attrName.match( /S|R|T|DeformP
ercent/ ) !== null ) {

                                        const curveNode = {
                                                id: rawCurveNode.id,
                                                attr: rawCurveNode.attrName,
                                                curves: {}
                                        };
                                        curveNodesMap.set( curveNode.id, curveNo
de );

                                }

                        }

                        return curveNodesMap;

                } // parse nodes in FBXTree.Objects.AnimationCurve and connect t
hem up to
                // previously parsed AnimationCurveNodes. Each AnimationCurve ho
lds data for a single animated
                // axis ( e.g. times and values of x rotation)


                parseAnimationCurves( curveNodesMap ) {

                        const rawCurves = fbxTree.Objects.AnimationCurve; // TOD
O: Many values are identical up to roundoff error, but won't be optimised
                        // e.g. position times: [0, 0.4, 0. 8]
                        // position values: [7.23538335023477e-7, 93.67518615722
656, -0.9982695579528809, 7.23538335023477e-7, 93.67518615722656, -0.99826955795
28809, 7.235384487103147e-7, 93.67520904541016, -0.9982695579528809]
                        // clearly, this should be optimised to
                        // times: [0], positions [7.23538335023477e-7, 93.675186
15722656, -0.9982695579528809]
                        // this shows up in nearly every FBX file, and generally
 time array is length > 100

                        for ( const nodeID in rawCurves ) {

                                const animationCurve = {
                                        id: rawCurves[ nodeID ].id,
                                        times: rawCurves[ nodeID ].KeyTime.a.map
( convertFBXTimeToSeconds ),
                                        values: rawCurves[ nodeID ].KeyValueFloa
t.a
                                };
                                const relationships = connections.get( animation
Curve.id );

                                if ( relationships !== undefined ) {

                                        const animationCurveID = relationships.p
arents[ 0 ].ID;
                                        const animationCurveRelationship = relat
ionships.parents[ 0 ].relationship;

                                        if ( animationCurveRelationship.match( /
X/ ) ) {

                                                curveNodesMap.get( animationCurv
eID ).curves[ 'x' ] = animationCurve;

                                        } else if ( animationCurveRelationship.m
atch( /Y/ ) ) {

                                                curveNodesMap.get( animationCurv
eID ).curves[ 'y' ] = animationCurve;

                                        } else if ( animationCurveRelationship.m
atch( /Z/ ) ) {

                                                curveNodesMap.get( animationCurv
eID ).curves[ 'z' ] = animationCurve;

                                        } else if ( animationCurveRelationship.m
atch( /d|DeformPercent/ ) && curveNodesMap.has( animationCurveID ) ) {

                                                curveNodesMap.get( animationCurv
eID ).curves[ 'morph' ] = animationCurve;

                                        }

                                }

                        }

                } // parse nodes in FBXTree.Objects.AnimationLayer. Each layers
holds references
                // to various AnimationCurveNodes and is referenced by an Animat
ionStack node
                // note: theoretically a stack can have multiple layers, however
 in practice there always seems to be one per stack


                parseAnimationLayers( curveNodesMap ) {

                        const rawLayers = fbxTree.Objects.AnimationLayer;
                        const layersMap = new Map();

                        for ( const nodeID in rawLayers ) {

                                const layerCurveNodes = [];
                                const connection = connections.get( parseInt( no
deID ) );

                                if ( connection !== undefined ) {

                                        // all the animationCurveNodes used in t
he layer
                                        const children = connection.children;
                                        children.forEach( function ( child, i )
{

                                                if ( curveNodesMap.has( child.ID
 ) ) {

                                                        const curveNode = curveN
odesMap.get( child.ID ); // check that the curves are defined for at least one a
xis, otherwise ignore the curveNode

                                                        if ( curveNode.curves.x
!== undefined || curveNode.curves.y !== undefined || curveNode.curves.z !== unde
fined ) {

                                                                if ( layerCurveN
odes[ i ] === undefined ) {

                                                                        const mo
delID = connections.get( child.ID ).parents.filter( function ( parent ) {


return parent.relationship !== undefined;

                                                                        } )[ 0 ]
.ID;

                                                                        if ( mod
elID !== undefined ) {


const rawModel = fbxTree.Objects.Model[ modelID.toString() ];


if ( rawModel === undefined ) {


console.warn( 'THREE.FBXLoader: Encountered a unused curve.', child );

return;


}


const node = {

modelName: rawModel.attrName ? THREE.PropertyBinding.sanitizeNodeName( rawModel.
attrName ) : '',

ID: rawModel.id,

initialPosition: [ 0, 0, 0 ],

initialRotation: [ 0, 0, 0 ],

initialScale: [ 1, 1, 1 ]

};

sceneGraph.traverse( function ( child ) {


if ( child.ID === rawModel.id ) {


        node.transform = child.matrix;

        if ( child.userData.transformData ) node.eulerOrder = child.userData.tra
nsformData.eulerOrder;


}


} );

if ( ! node.transform ) node.transform = new THREE.Matrix4(); // if the animated
 model is pre rotated, we'll have to apply the pre rotations to every

// animation value as well


if ( 'PreRotation' in rawModel ) node.preRotation = rawModel.PreRotation.value;

if ( 'PostRotation' in rawModel ) node.postRotation = rawModel.PostRotation.valu
e;

layerCurveNodes[ i ] = node;

                                                                        }

                                                                }

                                                                if ( layerCurveN
odes[ i ] ) layerCurveNodes[ i ][ curveNode.attr ] = curveNode;

                                                        } else if ( curveNode.cu
rves.morph !== undefined ) {

                                                                if ( layerCurveN
odes[ i ] === undefined ) {

                                                                        const de
formerID = connections.get( child.ID ).parents.filter( function ( parent ) {


return parent.relationship !== undefined;

                                                                        } )[ 0 ]
.ID;
                                                                        const mo
rpherID = connections.get( deformerID ).parents[ 0 ].ID;
                                                                        const ge
oID = connections.get( morpherID ).parents[ 0 ].ID; // assuming geometry is not
used in more than one model

                                                                        const mo
delID = connections.get( geoID ).parents[ 0 ].ID;
                                                                        const ra
wModel = fbxTree.Objects.Model[ modelID ];
                                                                        const no
de = {

modelName: rawModel.attrName ? THREE.PropertyBinding.sanitizeNodeName( rawModel.
attrName ) : '',

morphName: fbxTree.Objects.Deformer[ deformerID ].attrName
                                                                        };
                                                                        layerCur
veNodes[ i ] = node;

                                                                }

                                                                layerCurveNodes[
 i ][ curveNode.attr ] = curveNode;

                                                        }

                                                }

                                        } );
                                        layersMap.set( parseInt( nodeID ), layer
CurveNodes );

                                }

                        }

                        return layersMap;

                } // parse nodes in FBXTree.Objects.AnimationStack. These are th
e top level node in the animation
                // hierarchy. Each Stack node will be used to create a THREE.Ani
mationClip


                parseAnimStacks( layersMap ) {

                        const rawStacks = fbxTree.Objects.AnimationStack; // con
nect the stacks (clips) up to the layers

                        const rawClips = {};

                        for ( const nodeID in rawStacks ) {

                                const children = connections.get( parseInt( node
ID ) ).children;

                                if ( children.length > 1 ) {

                                        // it seems like stacks will always be a
ssociated with a single layer. But just in case there are files
                                        // where there are multiple layers per s
tack, we'll display a warning
                                        console.warn( 'THREE.FBXLoader: Encounte
red an animation stack with multiple layers, this is currently not supported. Ig
noring subsequent layers.' );

                                }

                                const layer = layersMap.get( children[ 0 ].ID );
                                rawClips[ nodeID ] = {
                                        name: rawStacks[ nodeID ].attrName,
                                        layer: layer
                                };

                        }

                        return rawClips;

                }

                addClip( rawClip ) {

                        let tracks = [];
                        const scope = this;
                        rawClip.layer.forEach( function ( rawTracks ) {

                                tracks = tracks.concat( scope.generateTracks( ra
wTracks ) );

                        } );
                        return new THREE.AnimationClip( rawClip.name, - 1, track
s );

                }

                generateTracks( rawTracks ) {

                        const tracks = [];
                        let initialPosition = new THREE.Vector3();
                        let initialRotation = new THREE.Quaternion();
                        let initialScale = new THREE.Vector3();
                        if ( rawTracks.transform ) rawTracks.transform.decompose
( initialPosition, initialRotation, initialScale );
                        initialPosition = initialPosition.toArray();
                        initialRotation = new THREE.Euler().setFromQuaternion( i
nitialRotation, rawTracks.eulerOrder ).toArray();
                        initialScale = initialScale.toArray();

                        if ( rawTracks.T !== undefined && Object.keys( rawTracks
.T.curves ).length > 0 ) {

                                const positionTrack = this.generateVectorTrack(
rawTracks.modelName, rawTracks.T.curves, initialPosition, 'position' );
                                if ( positionTrack !== undefined ) tracks.push(
positionTrack );

                        }

                        if ( rawTracks.R !== undefined && Object.keys( rawTracks
.R.curves ).length > 0 ) {

                                const rotationTrack = this.generateRotationTrack
( rawTracks.modelName, rawTracks.R.curves, initialRotation, rawTracks.preRotatio
n, rawTracks.postRotation, rawTracks.eulerOrder );
                                if ( rotationTrack !== undefined ) tracks.push(
rotationTrack );

                        }

                        if ( rawTracks.S !== undefined && Object.keys( rawTracks
.S.curves ).length > 0 ) {

                                const scaleTrack = this.generateVectorTrack( raw
Tracks.modelName, rawTracks.S.curves, initialScale, 'scale' );
                                if ( scaleTrack !== undefined ) tracks.push( sca
leTrack );

                        }

                        if ( rawTracks.DeformPercent !== undefined ) {

                                const morphTrack = this.generateMorphTrack( rawT
racks );
                                if ( morphTrack !== undefined ) tracks.push( mor
phTrack );

                        }

                        return tracks;

                }

                generateVectorTrack( modelName, curves, initialValue, type ) {

                        const times = this.getTimesForAllAxes( curves );
                        const values = this.getKeyframeTrackValues( times, curve
s, initialValue );
                        return new THREE.VectorKeyframeTrack( modelName + '.' +
type, times, values );

                }

                generateRotationTrack( modelName, curves, initialValue, preRotat
ion, postRotation, eulerOrder ) {

                        if ( curves.x !== undefined ) {

                                this.interpolateRotations( curves.x );
                                curves.x.values = curves.x.values.map( THREE.Mat
hUtils.degToRad );

                        }

                        if ( curves.y !== undefined ) {

                                this.interpolateRotations( curves.y );
                                curves.y.values = curves.y.values.map( THREE.Mat
hUtils.degToRad );

                        }

                        if ( curves.z !== undefined ) {

                                this.interpolateRotations( curves.z );
                                curves.z.values = curves.z.values.map( THREE.Mat
hUtils.degToRad );

                        }

                        const times = this.getTimesForAllAxes( curves );
                        const values = this.getKeyframeTrackValues( times, curve
s, initialValue );

                        if ( preRotation !== undefined ) {

                                preRotation = preRotation.map( THREE.MathUtils.d
egToRad );
                                preRotation.push( eulerOrder );
                                preRotation = new THREE.Euler().fromArray( preRo
tation );
                                preRotation = new THREE.Quaternion().setFromEule
r( preRotation );

                        }

                        if ( postRotation !== undefined ) {

                                postRotation = postRotation.map( THREE.MathUtils
.degToRad );
                                postRotation.push( eulerOrder );
                                postRotation = new THREE.Euler().fromArray( post
Rotation );
                                postRotation = new THREE.Quaternion().setFromEul
er( postRotation ).invert();

                        }

                        const quaternion = new THREE.Quaternion();
                        const euler = new THREE.Euler();
                        const quaternionValues = [];

                        for ( let i = 0; i < values.length; i += 3 ) {

                                euler.set( values[ i ], values[ i + 1 ], values[
 i + 2 ], eulerOrder );
                                quaternion.setFromEuler( euler );
                                if ( preRotation !== undefined ) quaternion.prem
ultiply( preRotation );
                                if ( postRotation !== undefined ) quaternion.mul
tiply( postRotation );
                                quaternion.toArray( quaternionValues, i / 3 * 4
);

                        }

                        return new THREE.QuaternionKeyframeTrack( modelName + '.
quaternion', times, quaternionValues );

                }

                generateMorphTrack( rawTracks ) {

                        const curves = rawTracks.DeformPercent.curves.morph;
                        const values = curves.values.map( function ( val ) {

                                return val / 100;

                        } );
                        const morphNum = sceneGraph.getObjectByName( rawTracks.m
odelName ).morphTargetDictionary[ rawTracks.morphName ];
                        return new THREE.NumberKeyframeTrack( rawTracks.modelNam
e + '.morphTargetInfluences[' + morphNum + ']', curves.times, values );

                } // For all animated objects, times are defined separately for
each axis
                // Here we'll combine the times into one sorted array without du
plicates


                getTimesForAllAxes( curves ) {

                        let times = []; // first join together the times for eac
h axis, if defined

                        if ( curves.x !== undefined ) times = times.concat( curv
es.x.times );
                        if ( curves.y !== undefined ) times = times.concat( curv
es.y.times );
                        if ( curves.z !== undefined ) times = times.concat( curv
es.z.times ); // then sort them

                        times = times.sort( function ( a, b ) {

                                return a - b;

                        } ); // and remove duplicates

                        if ( times.length > 1 ) {

                                let targetIndex = 1;
                                let lastValue = times[ 0 ];

                                for ( let i = 1; i < times.length; i ++ ) {

                                        const currentValue = times[ i ];

                                        if ( currentValue !== lastValue ) {

                                                times[ targetIndex ] = currentVa
lue;
                                                lastValue = currentValue;
                                                targetIndex ++;

                                        }

                                }

                                times = times.slice( 0, targetIndex );

                        }

                        return times;

                }

                getKeyframeTrackValues( times, curves, initialValue ) {

                        const prevValue = initialValue;
                        const values = [];
                        let xIndex = - 1;
                        let yIndex = - 1;
                        let zIndex = - 1;
                        times.forEach( function ( time ) {

                                if ( curves.x ) xIndex = curves.x.times.indexOf(
 time );
                                if ( curves.y ) yIndex = curves.y.times.indexOf(
 time );
                                if ( curves.z ) zIndex = curves.z.times.indexOf(
 time ); // if there is an x value defined for this frame, use that

                                if ( xIndex !== - 1 ) {

                                        const xValue = curves.x.values[ xIndex ]
;
                                        values.push( xValue );
                                        prevValue[ 0 ] = xValue;

                                } else {

                                        // otherwise use the x value from the pr
evious frame
                                        values.push( prevValue[ 0 ] );

                                }

                                if ( yIndex !== - 1 ) {

                                        const yValue = curves.y.values[ yIndex ]
;
                                        values.push( yValue );
                                        prevValue[ 1 ] = yValue;

                                } else {

                                        values.push( prevValue[ 1 ] );

                                }

                                if ( zIndex !== - 1 ) {

                                        const zValue = curves.z.values[ zIndex ]
;
                                        values.push( zValue );
                                        prevValue[ 2 ] = zValue;

                                } else {

                                        values.push( prevValue[ 2 ] );

                                }

                        } );
                        return values;

                } // Rotations are defined as THREE.Euler angles which can have
values  of any size
                // These will be converted to quaternions which don't support va
lues greater than
                // PI, so we'll interpolate large rotations


                interpolateRotations( curve ) {

                        for ( let i = 1; i < curve.values.length; i ++ ) {

                                const initialValue = curve.values[ i - 1 ];
                                const valuesSpan = curve.values[ i ] - initialVa
lue;
                                const absoluteSpan = Math.abs( valuesSpan );

                                if ( absoluteSpan >= 180 ) {

                                        const numSubIntervals = absoluteSpan / 1
80;
                                        const step = valuesSpan / numSubInterval
s;
                                        let nextValue = initialValue + step;
                                        const initialTime = curve.times[ i - 1 ]
;
                                        const timeSpan = curve.times[ i ] - init
ialTime;
                                        const interval = timeSpan / numSubInterv
als;
                                        let nextTime = initialTime + interval;
                                        const interpolatedTimes = [];
                                        const interpolatedValues = [];

                                        while ( nextTime < curve.times[ i ] ) {

                                                interpolatedTimes.push( nextTime
 );
                                                nextTime += interval;
                                                interpolatedValues.push( nextVal
ue );
                                                nextValue += step;

                                        }

                                        curve.times = inject( curve.times, i, in
terpolatedTimes );
                                        curve.values = inject( curve.values, i,
interpolatedValues );

                                }

                        }

                }

        } // parse an FBX file in ASCII format


        class TextParser {

                getPrevNode() {

                        return this.nodeStack[ this.currentIndent - 2 ];

                }

                getCurrentNode() {

                        return this.nodeStack[ this.currentIndent - 1 ];

                }

                getCurrentProp() {

                        return this.currentProp;

                }

                pushStack( node ) {

                        this.nodeStack.push( node );
                        this.currentIndent += 1;

                }

                popStack() {

                        this.nodeStack.pop();
                        this.currentIndent -= 1;

                }

                setCurrentProp( val, name ) {

                        this.currentProp = val;
                        this.currentPropName = name;

                }

                parse( text ) {

                        this.currentIndent = 0;
                        this.allNodes = new FBXTree();
                        this.nodeStack = [];
                        this.currentProp = [];
                        this.currentPropName = '';
                        const scope = this;
                        const split = text.split( /[\r\n]+/ );
                        split.forEach( function ( line, i ) {

                                const matchComment = line.match( /^[\s\t]*;/ );
                                const matchEmpty = line.match( /^[\s\t]*$/ );
                                if ( matchComment || matchEmpty ) return;
                                const matchBeginning = line.match( '^\\t{' + sco
pe.currentIndent + '}(\\w+):(.*){', '' );
                                const matchProperty = line.match( '^\\t{' + scop
e.currentIndent + '}(\\w+):[\\s\\t\\r\\n](.*)' );
                                const matchEnd = line.match( '^\\t{' + ( scope.c
urrentIndent - 1 ) + '}}' );

                                if ( matchBeginning ) {

                                        scope.parseNodeBegin( line, matchBeginni
ng );

                                } else if ( matchProperty ) {

                                        scope.parseNodeProperty( line, matchProp
erty, split[ ++ i ] );

                                } else if ( matchEnd ) {

                                        scope.popStack();

                                } else if ( line.match( /^[^\s\t}]/ ) ) {

                                        // large arrays are split over multiple
lines terminated with a ',' character
                                        // if this is encountered the line needs
 to be joined to the previous line
                                        scope.parseNodePropertyContinued( line )
;

                                }

                        } );
                        return this.allNodes;

                }

                parseNodeBegin( line, property ) {

                        const nodeName = property[ 1 ].trim().replace( /^"/, ''
).replace( /"$/, '' );
                        const nodeAttrs = property[ 2 ].split( ',' ).map( functi
on ( attr ) {

                                return attr.trim().replace( /^"/, '' ).replace(
/"$/, '' );

                        } );
                        const node = {
                                name: nodeName
                        };
                        const attrs = this.parseNodeAttr( nodeAttrs );
                        const currentNode = this.getCurrentNode(); // a top node

                        if ( this.currentIndent === 0 ) {

                                this.allNodes.add( nodeName, node );

                        } else {

                                // a subnode
                                // if the subnode already exists, append it
                                if ( nodeName in currentNode ) {

                                        // special case Pose needs PoseNodes as
an array
                                        if ( nodeName === 'PoseNode' ) {

                                                currentNode.PoseNode.push( node
);

                                        } else if ( currentNode[ nodeName ].id !
== undefined ) {

                                                currentNode[ nodeName ] = {};
                                                currentNode[ nodeName ][ current
Node[ nodeName ].id ] = currentNode[ nodeName ];

                                        }

                                        if ( attrs.id !== '' ) currentNode[ node
Name ][ attrs.id ] = node;

                                } else if ( typeof attrs.id === 'number' ) {

                                        currentNode[ nodeName ] = {};
                                        currentNode[ nodeName ][ attrs.id ] = no
de;

                                } else if ( nodeName !== 'Properties70' ) {

                                        if ( nodeName === 'PoseNode' ) currentNo
de[ nodeName ] = [ node ]; else currentNode[ nodeName ] = node;

                                }

                        }

                        if ( typeof attrs.id === 'number' ) node.id = attrs.id;
                        if ( attrs.name !== '' ) node.attrName = attrs.name;
                        if ( attrs.type !== '' ) node.attrType = attrs.type;
                        this.pushStack( node );

                }

                parseNodeAttr( attrs ) {

                        let id = attrs[ 0 ];

                        if ( attrs[ 0 ] !== '' ) {

                                id = parseInt( attrs[ 0 ] );

                                if ( isNaN( id ) ) {

                                        id = attrs[ 0 ];

                                }

                        }

                        let name = '',
                                type = '';

                        if ( attrs.length > 1 ) {

                                name = attrs[ 1 ].replace( /^(\w+)::/, '' );
                                type = attrs[ 2 ];

                        }

                        return {
                                id: id,
                                name: name,
                                type: type
                        };

                }

                parseNodeProperty( line, property, contentLine ) {

                        let propName = property[ 1 ].replace( /^"/, '' ).replace
( /"$/, '' ).trim();
                        let propValue = property[ 2 ].replace( /^"/, '' ).replac
e( /"$/, '' ).trim(); // for special case: base64 image data follows "Content: ,
" line
                        //      Content: ,
                        //       "/9j/4RDaRXhpZgAATU0A..."

                        if ( propName === 'Content' && propValue === ',' ) {

                                propValue = contentLine.replace( /"/g, '' ).repl
ace( /,$/, '' ).trim();

                        }

                        const currentNode = this.getCurrentNode();
                        const parentName = currentNode.name;

                        if ( parentName === 'Properties70' ) {

                                this.parseNodeSpecialProperty( line, propName, p
ropValue );
                                return;

                        } // Connections


                        if ( propName === 'C' ) {

                                const connProps = propValue.split( ',' ).slice(
1 );
                                const from = parseInt( connProps[ 0 ] );
                                const to = parseInt( connProps[ 1 ] );
                                let rest = propValue.split( ',' ).slice( 3 );
                                rest = rest.map( function ( elem ) {

                                        return elem.trim().replace( /^"/, '' );

                                } );
                                propName = 'connections';
                                propValue = [ from, to ];
                                append( propValue, rest );

                                if ( currentNode[ propName ] === undefined ) {

                                        currentNode[ propName ] = [];

                                }

                        } // Node


                        if ( propName === 'Node' ) currentNode.id = propValue; /
/ connections

                        if ( propName in currentNode && Array.isArray( currentNo
de[ propName ] ) ) {

                                currentNode[ propName ].push( propValue );

                        } else {

                                if ( propName !== 'a' ) currentNode[ propName ]
= propValue; else currentNode.a = propValue;

                        }

                        this.setCurrentProp( currentNode, propName ); // convert
 string to array, unless it ends in ',' in which case more will be added to it

                        if ( propName === 'a' && propValue.slice( - 1 ) !== ','
) {

                                currentNode.a = parseNumberArray( propValue );

                        }

                }

                parseNodePropertyContinued( line ) {

                        const currentNode = this.getCurrentNode();
                        currentNode.a += line; // if the line doesn't end in ','
 we have reached the end of the property value
                        // so convert the string to an array

                        if ( line.slice( - 1 ) !== ',' ) {

                                currentNode.a = parseNumberArray( currentNode.a
);

                        }

                } // parse "Property70"


                parseNodeSpecialProperty( line, propName, propValue ) {

                        // split this
                        // P: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
                        // into array like below
                        // ["Lcl Scaling", "Lcl Scaling", "", "A", "1,1,1" ]
                        const props = propValue.split( '",' ).map( function ( pr
op ) {

                                return prop.trim().replace( /^\"/, '' ).replace(
 /\s/, '_' );

                        } );
                        const innerPropName = props[ 0 ];
                        const innerPropType1 = props[ 1 ];
                        const innerPropType2 = props[ 2 ];
                        const innerPropFlag = props[ 3 ];
                        let innerPropValue = props[ 4 ]; // cast values where ne
eded, otherwise leave as strings

                        switch ( innerPropType1 ) {

                                case 'int':
                                case 'enum':
                                case 'bool':
                                case 'ULongLong':
                                case 'double':
                                case 'Number':
                                case 'FieldOfView':
                                        innerPropValue = parseFloat( innerPropVa
lue );
                                        break;

                                case 'Color':
                                case 'ColorRGB':
                                case 'Vector3D':
                                case 'Lcl_Translation':
                                case 'Lcl_Rotation':
                                case 'Lcl_Scaling':
                                        innerPropValue = parseNumberArray( inner
PropValue );
                                        break;

                        } // CAUTION: these props must append to parent's parent


                        this.getPrevNode()[ innerPropName ] = {
                                'type': innerPropType1,
                                'type2': innerPropType2,
                                'flag': innerPropFlag,
                                'value': innerPropValue
                        };
                        this.setCurrentProp( this.getPrevNode(), innerPropName )
;

                }

        } // Parse an FBX file in Binary format


        class BinaryParser {

                parse( buffer ) {

                        const reader = new BinaryReader( buffer );
                        reader.skip( 23 ); // skip magic 23 bytes

                        const version = reader.getUint32();

                        if ( version < 6400 ) {

                                throw new Error( 'THREE.FBXLoader: FBX version n
ot supported, FileVersion: ' + version );

                        }

                        const allNodes = new FBXTree();

                        while ( ! this.endOfContent( reader ) ) {

                                const node = this.parseNode( reader, version );
                                if ( node !== null ) allNodes.add( node.name, no
de );

                        }

                        return allNodes;

                } // Check if reader has reached the end of content.


                endOfContent( reader ) {

                        // footer size: 160bytes + 16-byte alignment padding
                        // - 16bytes: magic
                        // - padding til 16-byte alignment (at least 1byte?)
                        //      (seems like some exporters embed fixed 15 or 16b
ytes?)
                        // - 4bytes: magic
                        // - 4bytes: version
                        // - 120bytes: zero
                        // - 16bytes: magic
                        if ( reader.size() % 16 === 0 ) {

                                return ( reader.getOffset() + 160 + 16 & ~ 0xf )
 >= reader.size();

                        } else {

                                return reader.getOffset() + 160 + 16 >= reader.s
ize();

                        }

                } // recursively parse nodes until the end of the file is reache
d


                parseNode( reader, version ) {

                        const node = {}; // The first three data sizes depends o
n version.

                        const endOffset = version >= 7500 ? reader.getUint64() :
 reader.getUint32();
                        const numProperties = version >= 7500 ? reader.getUint64
() : reader.getUint32();
                        version >= 7500 ? reader.getUint64() : reader.getUint32(
); // the returned propertyListLen is not used

                        const nameLen = reader.getUint8();
                        const name = reader.getString( nameLen ); // Regards thi
s node as NULL-record if endOffset is zero

                        if ( endOffset === 0 ) return null;
                        const propertyList = [];

                        for ( let i = 0; i < numProperties; i ++ ) {

                                propertyList.push( this.parseProperty( reader )
);

                        } // Regards the first three elements in propertyList as
 id, attrName, and attrType


                        const id = propertyList.length > 0 ? propertyList[ 0 ] :
 '';
                        const attrName = propertyList.length > 1 ? propertyList[
 1 ] : '';
                        const attrType = propertyList.length > 2 ? propertyList[
 2 ] : ''; // check if this node represents just a single property
                        // like (name, 0) set or (name2, [0, 1, 2]) set of {name
: 0, name2: [0, 1, 2]}

                        node.singleProperty = numProperties === 1 && reader.getO
ffset() === endOffset ? true : false;

                        while ( endOffset > reader.getOffset() ) {

                                const subNode = this.parseNode( reader, version
);
                                if ( subNode !== null ) this.parseSubNode( name,
 node, subNode );

                        }

                        node.propertyList = propertyList; // raw property list u
sed by parent

                        if ( typeof id === 'number' ) node.id = id;
                        if ( attrName !== '' ) node.attrName = attrName;
                        if ( attrType !== '' ) node.attrType = attrType;
                        if ( name !== '' ) node.name = name;
                        return node;

                }

                parseSubNode( name, node, subNode ) {

                        // special case: child node is single property
                        if ( subNode.singleProperty === true ) {

                                const value = subNode.propertyList[ 0 ];

                                if ( Array.isArray( value ) ) {

                                        node[ subNode.name ] = subNode;
                                        subNode.a = value;

                                } else {

                                        node[ subNode.name ] = value;

                                }

                        } else if ( name === 'Connections' && subNode.name === '
C' ) {

                                const array = [];
                                subNode.propertyList.forEach( function ( propert
y, i ) {

                                        // first Connection is FBX type (OO, OP,
 etc.). We'll discard these
                                        if ( i !== 0 ) array.push( property );

                                } );

                                if ( node.connections === undefined ) {

                                        node.connections = [];

                                }

                                node.connections.push( array );

                        } else if ( subNode.name === 'Properties70' ) {

                                const keys = Object.keys( subNode );
                                keys.forEach( function ( key ) {

                                        node[ key ] = subNode[ key ];

                                } );

                        } else if ( name === 'Properties70' && subNode.name ===
'P' ) {

                                let innerPropName = subNode.propertyList[ 0 ];
                                let innerPropType1 = subNode.propertyList[ 1 ];
                                const innerPropType2 = subNode.propertyList[ 2 ]
;
                                const innerPropFlag = subNode.propertyList[ 3 ];
                                let innerPropValue;
                                if ( innerPropName.indexOf( 'Lcl ' ) === 0 ) inn
erPropName = innerPropName.replace( 'Lcl ', 'Lcl_' );
                                if ( innerPropType1.indexOf( 'Lcl ' ) === 0 ) in
nerPropType1 = innerPropType1.replace( 'Lcl ', 'Lcl_' );

                                if ( innerPropType1 === 'Color' || innerPropType
1 === 'ColorRGB' || innerPropType1 === 'Vector' || innerPropType1 === 'Vector3D'
 || innerPropType1.indexOf( 'Lcl_' ) === 0 ) {

                                        innerPropValue = [ subNode.propertyList[
 4 ], subNode.propertyList[ 5 ], subNode.propertyList[ 6 ] ];

                                } else {

                                        innerPropValue = subNode.propertyList[ 4
 ];

                                } // this will be copied to parent, see above


                                node[ innerPropName ] = {
                                        'type': innerPropType1,
                                        'type2': innerPropType2,
                                        'flag': innerPropFlag,
                                        'value': innerPropValue
                                };

                        } else if ( node[ subNode.name ] === undefined ) {

                                if ( typeof subNode.id === 'number' ) {

                                        node[ subNode.name ] = {};
                                        node[ subNode.name ][ subNode.id ] = sub
Node;

                                } else {

                                        node[ subNode.name ] = subNode;

                                }

                        } else {

                                if ( subNode.name === 'PoseNode' ) {

                                        if ( ! Array.isArray( node[ subNode.name
 ] ) ) {

                                                node[ subNode.name ] = [ node[ s
ubNode.name ] ];

                                        }

                                        node[ subNode.name ].push( subNode );

                                } else if ( node[ subNode.name ][ subNode.id ] =
== undefined ) {

                                        node[ subNode.name ][ subNode.id ] = sub
Node;

                                }

                        }

                }

                parseProperty( reader ) {

                        const type = reader.getString( 1 );
                        let length;

                        switch ( type ) {

                                case 'C':
                                        return reader.getBoolean();

                                case 'D':
                                        return reader.getFloat64();

                                case 'F':
                                        return reader.getFloat32();

                                case 'I':
                                        return reader.getInt32();

                                case 'L':
                                        return reader.getInt64();

                                case 'R':
                                        length = reader.getUint32();
                                        return reader.getArrayBuffer( length );

                                case 'S':
                                        length = reader.getUint32();
                                        return reader.getString( length );

                                case 'Y':
                                        return reader.getInt16();

                                case 'b':
                                case 'c':
                                case 'd':
                                case 'f':
                                case 'i':
                                case 'l':
                                        const arrayLength = reader.getUint32();
                                        const encoding = reader.getUint32(); //
0: non-compressed, 1: compressed

                                        const compressedLength = reader.getUint3
2();

                                        if ( encoding === 0 ) {

                                                switch ( type ) {

                                                        case 'b':
                                                        case 'c':
                                                                return reader.ge
tBooleanArray( arrayLength );

                                                        case 'd':
                                                                return reader.ge
tFloat64Array( arrayLength );

                                                        case 'f':
                                                                return reader.ge
tFloat32Array( arrayLength );

                                                        case 'i':
                                                                return reader.ge
tInt32Array( arrayLength );

                                                        case 'l':
                                                                return reader.ge
tInt64Array( arrayLength );

                                                }

                                        }

                                        if ( typeof fflate === 'undefined' ) {

                                                console.error( 'THREE.FBXLoader:
 External library fflate.min.js required.' );

                                        }

                                        const data = fflate.unzlibSync( new Uint
8Array( reader.getArrayBuffer( compressedLength ) ) ); // eslint-disable-line no
-undef

                                        const reader2 = new BinaryReader( data.b
uffer );

                                        switch ( type ) {

                                                case 'b':
                                                case 'c':
                                                        return reader2.getBoolea
nArray( arrayLength );

                                                case 'd':
                                                        return reader2.getFloat6
4Array( arrayLength );

                                                case 'f':
                                                        return reader2.getFloat3
2Array( arrayLength );

                                                case 'i':
                                                        return reader2.getInt32A
rray( arrayLength );

                                                case 'l':
                                                        return reader2.getInt64A
rray( arrayLength );

                                        }

                                        break;
                                        // cannot happen but is required by the
DeepScan

                                default:
                                        throw new Error( 'THREE.FBXLoader: Unkno
wn property type ' + type );

                        }

                }

        }

        class BinaryReader {

                constructor( buffer, littleEndian ) {

                        this.dv = new DataView( buffer );
                        this.offset = 0;
                        this.littleEndian = littleEndian !== undefined ? littleE
ndian : true;

                }

                getOffset() {

                        return this.offset;

                }

                size() {

                        return this.dv.buffer.byteLength;

                }

                skip( length ) {

                        this.offset += length;

                } // seems like true/false representation depends on exporter.
                // true: 1 or 'Y'(=0x59), false: 0 or 'T'(=0x54)
                // then sees LSB.


                getBoolean() {

                        return ( this.getUint8() & 1 ) === 1;

                }

                getBooleanArray( size ) {

                        const a = [];

                        for ( let i = 0; i < size; i ++ ) {

                                a.push( this.getBoolean() );

                        }

                        return a;

                }

                getUint8() {

                        const value = this.dv.getUint8( this.offset );
                        this.offset += 1;
                        return value;

                }

                getInt16() {

                        const value = this.dv.getInt16( this.offset, this.little
Endian );
                        this.offset += 2;
                        return value;

                }

                getInt32() {

                        const value = this.dv.getInt32( this.offset, this.little
Endian );
                        this.offset += 4;
                        return value;

                }

                getInt32Array( size ) {

                        const a = [];

                        for ( let i = 0; i < size; i ++ ) {

                                a.push( this.getInt32() );

                        }

                        return a;

                }

                getUint32() {

                        const value = this.dv.getUint32( this.offset, this.littl
eEndian );
                        this.offset += 4;
                        return value;

                } // JavaScript doesn't support 64-bit integer so calculate this
 here
                // 1 << 32 will return 1 so using multiply operation instead her
e.
                // There's a possibility that this method returns wrong value if
 the value
                // is out of the range between Number.MAX_SAFE_INTEGER and Numbe
r.MIN_SAFE_INTEGER.
                // TODO: safely handle 64-bit integer


                getInt64() {

                        let low, high;

                        if ( this.littleEndian ) {

                                low = this.getUint32();
                                high = this.getUint32();

                        } else {

                                high = this.getUint32();
                                low = this.getUint32();

                        } // calculate negative value


                        if ( high & 0x80000000 ) {

                                high = ~ high & 0xFFFFFFFF;
                                low = ~ low & 0xFFFFFFFF;
                                if ( low === 0xFFFFFFFF ) high = high + 1 & 0xFF
FFFFFF;
                                low = low + 1 & 0xFFFFFFFF;
                                return - ( high * 0x100000000 + low );

                        }

                        return high * 0x100000000 + low;

                }

                getInt64Array( size ) {

                        const a = [];

                        for ( let i = 0; i < size; i ++ ) {

                                a.push( this.getInt64() );

                        }

                        return a;

                } // Note: see getInt64() comment


                getUint64() {

                        let low, high;

                        if ( this.littleEndian ) {

                                low = this.getUint32();
                                high = this.getUint32();

                        } else {

                                high = this.getUint32();
                                low = this.getUint32();

                        }

                        return high * 0x100000000 + low;

                }

                getFloat32() {

                        const value = this.dv.getFloat32( this.offset, this.litt
leEndian );
                        this.offset += 4;
                        return value;

                }

                getFloat32Array( size ) {

                        const a = [];

                        for ( let i = 0; i < size; i ++ ) {

                                a.push( this.getFloat32() );

                        }

                        return a;

                }

                getFloat64() {

                        const value = this.dv.getFloat64( this.offset, this.litt
leEndian );
                        this.offset += 8;
                        return value;

                }

                getFloat64Array( size ) {

                        const a = [];

                        for ( let i = 0; i < size; i ++ ) {

                                a.push( this.getFloat64() );

                        }

                        return a;

                }

                getArrayBuffer( size ) {

                        const value = this.dv.buffer.slice( this.offset, this.of
fset + size );
                        this.offset += size;
                        return value;

                }

                getString( size ) {

                        // note: safari 9 doesn't support Uint8Array.indexOf; cr
eate intermediate array instead
                        let a = [];

                        for ( let i = 0; i < size; i ++ ) {

                                a[ i ] = this.getUint8();

                        }

                        const nullByte = a.indexOf( 0 );
                        if ( nullByte >= 0 ) a = a.slice( 0, nullByte );
                        return THREE.LoaderUtils.decodeText( new Uint8Array( a )
 );

                }

        } // FBXTree holds a representation of the FBX data, returned by the Tex
tParser ( FBX ASCII format)
        // and BinaryParser( FBX Binary format)


        class FBXTree {

                add( key, val ) {

                        this[ key ] = val;

                }

        } // ************** UTILITY FUNCTIONS **************


        function isFbxFormatBinary( buffer ) {

                const CORRECT = 'Kaydara\u0020FBX\u0020Binary\u0020\u0020\0';
                return buffer.byteLength >= CORRECT.length && CORRECT === conver
tArrayBufferToString( buffer, 0, CORRECT.length );

        }

        function isFbxFormatASCII( text ) {

                const CORRECT = [ 'K', 'a', 'y', 'd', 'a', 'r', 'a', '\\', 'F',
'B', 'X', '\\', 'B', 'i', 'n', 'a', 'r', 'y', '\\', '\\' ];
                let cursor = 0;

                function read( offset ) {

                        const result = text[ offset - 1 ];
                        text = text.slice( cursor + offset );
                        cursor ++;
                        return result;

                }

                for ( let i = 0; i < CORRECT.length; ++ i ) {

                        const num = read( 1 );

                        if ( num === CORRECT[ i ] ) {

                                return false;

                        }

                }

                return true;

        }

        function getFbxVersion( text ) {

                const versionRegExp = /FBXVersion: (\d+)/;
                const match = text.match( versionRegExp );

                if ( match ) {

                        const version = parseInt( match[ 1 ] );
                        return version;

                }

                throw new Error( 'THREE.FBXLoader: Cannot find the version numbe
r for the file given.' );

        } // Converts FBX ticks into real time seconds.


        function convertFBXTimeToSeconds( time ) {

                return time / 46186158000;

        }

        const dataArray = []; // extracts the data from the correct position in
the FBX array based on indexing type

        function getData( polygonVertexIndex, polygonIndex, vertexIndex, infoObj
ect ) {

                let index;

                switch ( infoObject.mappingType ) {

                        case 'ByPolygonVertex':
                                index = polygonVertexIndex;
                                break;

                        case 'ByPolygon':
                                index = polygonIndex;
                                break;

                        case 'ByVertice':
                                index = vertexIndex;
                                break;

                        case 'AllSame':
                                index = infoObject.indices[ 0 ];
                                break;

                        default:
                                console.warn( 'THREE.FBXLoader: unknown attribut
e mapping type ' + infoObject.mappingType );

                }

                if ( infoObject.referenceType === 'IndexToDirect' ) index = info
Object.indices[ index ];
                const from = index * infoObject.dataSize;
                const to = from + infoObject.dataSize;
                return slice( dataArray, infoObject.buffer, from, to );

        }

        const tempEuler = new THREE.Euler();
        const tempVec = new THREE.Vector3(); // generate transformation from FBX
 transform data
        // ref: https://help.autodesk.com/view/FBX/2017/ENU/?guid=__files_GUID_1
0CDD63C_79C1_4F2D_BB28_AD2BE65A02ED_htm
        // ref: http://docs.autodesk.com/FBX/2014/ENU/FBX-SDK-Documentation/inde
x.html?url=cpp_ref/_transformations_2main_8cxx-example.html,topicNumber=cpp_ref_
_transformations_2main_8cxx_example_htmlfc10a1e1-b18d-4e72-9dc0-70d0f1959f5e

        function generateTransform( transformData ) {

                const lTranslationM = new THREE.Matrix4();
                const lPreRotationM = new THREE.Matrix4();
                const lRotationM = new THREE.Matrix4();
                const lPostRotationM = new THREE.Matrix4();
                const lScalingM = new THREE.Matrix4();
                const lScalingPivotM = new THREE.Matrix4();
                const lScalingOffsetM = new THREE.Matrix4();
                const lRotationOffsetM = new THREE.Matrix4();
                const lRotationPivotM = new THREE.Matrix4();
                const lParentGX = new THREE.Matrix4();
                const lParentLX = new THREE.Matrix4();
                const lGlobalT = new THREE.Matrix4();
                const inheritType = transformData.inheritType ? transformData.in
heritType : 0;
                if ( transformData.translation ) lTranslationM.setPosition( temp
Vec.fromArray( transformData.translation ) );

                if ( transformData.preRotation ) {

                        const array = transformData.preRotation.map( THREE.MathU
tils.degToRad );
                        array.push( transformData.eulerOrder );
                        lPreRotationM.makeRotationFromEuler( tempEuler.fromArray
( array ) );

                }

                if ( transformData.rotation ) {

                        const array = transformData.rotation.map( THREE.MathUtil
s.degToRad );
                        array.push( transformData.eulerOrder );
                        lRotationM.makeRotationFromEuler( tempEuler.fromArray( a
rray ) );

                }

                if ( transformData.postRotation ) {

                        const array = transformData.postRotation.map( THREE.Math
Utils.degToRad );
                        array.push( transformData.eulerOrder );
                        lPostRotationM.makeRotationFromEuler( tempEuler.fromArra
y( array ) );
                        lPostRotationM.invert();

                }

                if ( transformData.scale ) lScalingM.scale( tempVec.fromArray( t
ransformData.scale ) ); // Pivots and offsets

                if ( transformData.scalingOffset ) lScalingOffsetM.setPosition(
tempVec.fromArray( transformData.scalingOffset ) );
                if ( transformData.scalingPivot ) lScalingPivotM.setPosition( te
mpVec.fromArray( transformData.scalingPivot ) );
                if ( transformData.rotationOffset ) lRotationOffsetM.setPosition
( tempVec.fromArray( transformData.rotationOffset ) );
                if ( transformData.rotationPivot ) lRotationPivotM.setPosition(
tempVec.fromArray( transformData.rotationPivot ) ); // parent transform

                if ( transformData.parentMatrixWorld ) {

                        lParentLX.copy( transformData.parentMatrix );
                        lParentGX.copy( transformData.parentMatrixWorld );

                }

                const lLRM = lPreRotationM.clone().multiply( lRotationM ).multip
ly( lPostRotationM ); // Global Rotation

                const lParentGRM = new THREE.Matrix4();
                lParentGRM.extractRotation( lParentGX ); // Global Shear*Scaling

                const lParentTM = new THREE.Matrix4();
                lParentTM.copyPosition( lParentGX );
                const lParentGRSM = lParentTM.clone().invert().multiply( lParent
GX );
                const lParentGSM = lParentGRM.clone().invert().multiply( lParent
GRSM );
                const lLSM = lScalingM;
                const lGlobalRS = new THREE.Matrix4();

                if ( inheritType === 0 ) {

                        lGlobalRS.copy( lParentGRM ).multiply( lLRM ).multiply(
lParentGSM ).multiply( lLSM );

                } else if ( inheritType === 1 ) {

                        lGlobalRS.copy( lParentGRM ).multiply( lParentGSM ).mult
iply( lLRM ).multiply( lLSM );

                } else {

                        const lParentLSM = new THREE.Matrix4().scale( new THREE.
Vector3().setFromMatrixScale( lParentLX ) );
                        const lParentLSM_inv = lParentLSM.clone().invert();
                        const lParentGSM_noLocal = lParentGSM.clone().multiply(
lParentLSM_inv );
                        lGlobalRS.copy( lParentGRM ).multiply( lLRM ).multiply(
lParentGSM_noLocal ).multiply( lLSM );

                }

                const lRotationPivotM_inv = lRotationPivotM.clone().invert();
                const lScalingPivotM_inv = lScalingPivotM.clone().invert(); // C
alculate the local transform matrix

                let lTransform = lTranslationM.clone().multiply( lRotationOffset
M ).multiply( lRotationPivotM ).multiply( lPreRotationM ).multiply( lRotationM )
.multiply( lPostRotationM ).multiply( lRotationPivotM_inv ).multiply( lScalingOf
fsetM ).multiply( lScalingPivotM ).multiply( lScalingM ).multiply( lScalingPivot
M_inv );
                const lLocalTWithAllPivotAndOffsetInfo = new THREE.Matrix4().cop
yPosition( lTransform );
                const lGlobalTranslation = lParentGX.clone().multiply( lLocalTWi
thAllPivotAndOffsetInfo );
                lGlobalT.copyPosition( lGlobalTranslation );
                lTransform = lGlobalT.clone().multiply( lGlobalRS ); // from glo
bal to local

                lTransform.premultiply( lParentGX.invert() );
                return lTransform;

        } // Returns the three.js intrinsic THREE.Euler order corresponding to F
BX extrinsic THREE.Euler order
        // ref: http://help.autodesk.com/view/FBX/2017/ENU/?guid=__cpp_ref_class
_fbx_euler_html


        function getEulerOrder( order ) {

                order = order || 0;
                const enums = [ 'ZYX', // -> XYZ extrinsic
                        'YZX', // -> XZY extrinsic
                        'XZY', // -> YZX extrinsic
                        'ZXY', // -> YXZ extrinsic
                        'YXZ', // -> ZXY extrinsic
                        'XYZ' // -> ZYX extrinsic
                        //'SphericXYZ', // not possible to support
                ];

                if ( order === 6 ) {

                        console.warn( 'THREE.FBXLoader: unsupported THREE.Euler
Order: Spherical XYZ. Animations and rotations may be incorrect.' );
                        return enums[ 0 ];

                }

                return enums[ order ];

        } // Parses comma separated list of numbers and returns them an array.
        // Used internally by the TextParser


        function parseNumberArray( value ) {

                const array = value.split( ',' ).map( function ( val ) {

                        return parseFloat( val );

                } );
                return array;

        }

        function convertArrayBufferToString( buffer, from, to ) {

                if ( from === undefined ) from = 0;
                if ( to === undefined ) to = buffer.byteLength;
                return THREE.LoaderUtils.decodeText( new Uint8Array( buffer, fro
m, to ) );

        }

        function append( a, b ) {

                for ( let i = 0, j = a.length, l = b.length; i < l; i ++, j ++ )
 {

                        a[ j ] = b[ i ];

                }

        }

        function slice( a, b, from, to ) {

                for ( let i = from, j = 0; i < to; i ++, j ++ ) {

                        a[ j ] = b[ i ];

                }

                return a;

        } // inject array a2 into array a1 at index


        function inject( a1, index, a2 ) {

                return a1.slice( 0, index ).concat( a2 ).concat( a1.slice( index
 ) );

        }

        THREE.FBXLoader = FBXLoader;

} )();
