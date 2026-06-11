(() => {
  // scripts/.tmp-three-global-shim.mjs
  var moduleValue = window.THREE || window.AFRAME && window.AFRAME.THREE || {};
  var ACESFilmicToneMapping = moduleValue["ACESFilmicToneMapping"];
  var AddEquation = moduleValue["AddEquation"];
  var AddOperation = moduleValue["AddOperation"];
  var AdditiveAnimationBlendMode = moduleValue["AdditiveAnimationBlendMode"];
  var AdditiveBlending = moduleValue["AdditiveBlending"];
  var AgXToneMapping = moduleValue["AgXToneMapping"];
  var AlphaFormat = moduleValue["AlphaFormat"];
  var AlwaysCompare = moduleValue["AlwaysCompare"];
  var AlwaysDepth = moduleValue["AlwaysDepth"];
  var AlwaysStencilFunc = moduleValue["AlwaysStencilFunc"];
  var AmbientLight = moduleValue["AmbientLight"];
  var AnimationAction = moduleValue["AnimationAction"];
  var AnimationClip = moduleValue["AnimationClip"];
  var AnimationLoader = moduleValue["AnimationLoader"];
  var AnimationMixer = moduleValue["AnimationMixer"];
  var AnimationObjectGroup = moduleValue["AnimationObjectGroup"];
  var AnimationUtils = moduleValue["AnimationUtils"];
  var ArcCurve = moduleValue["ArcCurve"];
  var ArrayCamera = moduleValue["ArrayCamera"];
  var ArrowHelper = moduleValue["ArrowHelper"];
  var AttachedBindMode = moduleValue["AttachedBindMode"];
  var Audio = moduleValue["Audio"];
  var AudioAnalyser = moduleValue["AudioAnalyser"];
  var AudioContext = moduleValue["AudioContext"];
  var AudioListener = moduleValue["AudioListener"];
  var AudioLoader = moduleValue["AudioLoader"];
  var AxesHelper = moduleValue["AxesHelper"];
  var BackSide = moduleValue["BackSide"];
  var BasicDepthPacking = moduleValue["BasicDepthPacking"];
  var BasicShadowMap = moduleValue["BasicShadowMap"];
  var BatchedMesh = moduleValue["BatchedMesh"];
  var BezierInterpolant = moduleValue["BezierInterpolant"];
  var Bone = moduleValue["Bone"];
  var BooleanKeyframeTrack = moduleValue["BooleanKeyframeTrack"];
  var Box2 = moduleValue["Box2"];
  var Box3 = moduleValue["Box3"];
  var Box3Helper = moduleValue["Box3Helper"];
  var BoxGeometry = moduleValue["BoxGeometry"];
  var BoxHelper = moduleValue["BoxHelper"];
  var BufferAttribute = moduleValue["BufferAttribute"];
  var BufferGeometry = moduleValue["BufferGeometry"];
  var BufferGeometryLoader = moduleValue["BufferGeometryLoader"];
  var ByteType = moduleValue["ByteType"];
  var Cache = moduleValue["Cache"];
  var Camera = moduleValue["Camera"];
  var CameraHelper = moduleValue["CameraHelper"];
  var CanvasTexture = moduleValue["CanvasTexture"];
  var CapsuleGeometry = moduleValue["CapsuleGeometry"];
  var CatmullRomCurve3 = moduleValue["CatmullRomCurve3"];
  var CineonToneMapping = moduleValue["CineonToneMapping"];
  var CircleGeometry = moduleValue["CircleGeometry"];
  var ClampToEdgeWrapping = moduleValue["ClampToEdgeWrapping"];
  var Clock = moduleValue["Clock"];
  var Color = moduleValue["Color"];
  var ColorKeyframeTrack = moduleValue["ColorKeyframeTrack"];
  var ColorManagement = moduleValue["ColorManagement"];
  var Compatibility = moduleValue["Compatibility"];
  var CompressedArrayTexture = moduleValue["CompressedArrayTexture"];
  var CompressedCubeTexture = moduleValue["CompressedCubeTexture"];
  var CompressedTexture = moduleValue["CompressedTexture"];
  var CompressedTextureLoader = moduleValue["CompressedTextureLoader"];
  var ConeGeometry = moduleValue["ConeGeometry"];
  var ConstantAlphaFactor = moduleValue["ConstantAlphaFactor"];
  var ConstantColorFactor = moduleValue["ConstantColorFactor"];
  var Controls = moduleValue["Controls"];
  var CubeCamera = moduleValue["CubeCamera"];
  var CubeDepthTexture = moduleValue["CubeDepthTexture"];
  var CubeReflectionMapping = moduleValue["CubeReflectionMapping"];
  var CubeRefractionMapping = moduleValue["CubeRefractionMapping"];
  var CubeTexture = moduleValue["CubeTexture"];
  var CubeTextureLoader = moduleValue["CubeTextureLoader"];
  var CubeUVReflectionMapping = moduleValue["CubeUVReflectionMapping"];
  var CubicBezierCurve = moduleValue["CubicBezierCurve"];
  var CubicBezierCurve3 = moduleValue["CubicBezierCurve3"];
  var CubicInterpolant = moduleValue["CubicInterpolant"];
  var CullFaceBack = moduleValue["CullFaceBack"];
  var CullFaceFront = moduleValue["CullFaceFront"];
  var CullFaceFrontBack = moduleValue["CullFaceFrontBack"];
  var CullFaceNone = moduleValue["CullFaceNone"];
  var Curve = moduleValue["Curve"];
  var CurvePath = moduleValue["CurvePath"];
  var CustomBlending = moduleValue["CustomBlending"];
  var CustomToneMapping = moduleValue["CustomToneMapping"];
  var CylinderGeometry = moduleValue["CylinderGeometry"];
  var Cylindrical = moduleValue["Cylindrical"];
  var Data3DTexture = moduleValue["Data3DTexture"];
  var DataArrayTexture = moduleValue["DataArrayTexture"];
  var DataTexture = moduleValue["DataTexture"];
  var DataTextureLoader = moduleValue["DataTextureLoader"];
  var DataUtils = moduleValue["DataUtils"];
  var DecrementStencilOp = moduleValue["DecrementStencilOp"];
  var DecrementWrapStencilOp = moduleValue["DecrementWrapStencilOp"];
  var DefaultLoadingManager = moduleValue["DefaultLoadingManager"];
  var DepthFormat = moduleValue["DepthFormat"];
  var DepthStencilFormat = moduleValue["DepthStencilFormat"];
  var DepthTexture = moduleValue["DepthTexture"];
  var DetachedBindMode = moduleValue["DetachedBindMode"];
  var DirectionalLight = moduleValue["DirectionalLight"];
  var DirectionalLightHelper = moduleValue["DirectionalLightHelper"];
  var DiscreteInterpolant = moduleValue["DiscreteInterpolant"];
  var DodecahedronGeometry = moduleValue["DodecahedronGeometry"];
  var DoubleSide = moduleValue["DoubleSide"];
  var DstAlphaFactor = moduleValue["DstAlphaFactor"];
  var DstColorFactor = moduleValue["DstColorFactor"];
  var DynamicCopyUsage = moduleValue["DynamicCopyUsage"];
  var DynamicDrawUsage = moduleValue["DynamicDrawUsage"];
  var DynamicReadUsage = moduleValue["DynamicReadUsage"];
  var EdgesGeometry = moduleValue["EdgesGeometry"];
  var EllipseCurve = moduleValue["EllipseCurve"];
  var EqualCompare = moduleValue["EqualCompare"];
  var EqualDepth = moduleValue["EqualDepth"];
  var EqualStencilFunc = moduleValue["EqualStencilFunc"];
  var EquirectangularReflectionMapping = moduleValue["EquirectangularReflectionMapping"];
  var EquirectangularRefractionMapping = moduleValue["EquirectangularRefractionMapping"];
  var Euler = moduleValue["Euler"];
  var EventDispatcher = moduleValue["EventDispatcher"];
  var ExternalTexture = moduleValue["ExternalTexture"];
  var ExtrudeGeometry = moduleValue["ExtrudeGeometry"];
  var FileLoader = moduleValue["FileLoader"];
  var Float16BufferAttribute = moduleValue["Float16BufferAttribute"];
  var Float32BufferAttribute = moduleValue["Float32BufferAttribute"];
  var FloatType = moduleValue["FloatType"];
  var Fog = moduleValue["Fog"];
  var FogExp2 = moduleValue["FogExp2"];
  var FramebufferTexture = moduleValue["FramebufferTexture"];
  var FrontSide = moduleValue["FrontSide"];
  var Frustum = moduleValue["Frustum"];
  var FrustumArray = moduleValue["FrustumArray"];
  var GLBufferAttribute = moduleValue["GLBufferAttribute"];
  var GLSL1 = moduleValue["GLSL1"];
  var GLSL3 = moduleValue["GLSL3"];
  var GreaterCompare = moduleValue["GreaterCompare"];
  var GreaterDepth = moduleValue["GreaterDepth"];
  var GreaterEqualCompare = moduleValue["GreaterEqualCompare"];
  var GreaterEqualDepth = moduleValue["GreaterEqualDepth"];
  var GreaterEqualStencilFunc = moduleValue["GreaterEqualStencilFunc"];
  var GreaterStencilFunc = moduleValue["GreaterStencilFunc"];
  var GridHelper = moduleValue["GridHelper"];
  var Group = moduleValue["Group"];
  var HTMLTexture = moduleValue["HTMLTexture"];
  var HalfFloatType = moduleValue["HalfFloatType"];
  var HemisphereLight = moduleValue["HemisphereLight"];
  var HemisphereLightHelper = moduleValue["HemisphereLightHelper"];
  var IcosahedronGeometry = moduleValue["IcosahedronGeometry"];
  var ImageBitmapLoader = moduleValue["ImageBitmapLoader"];
  var ImageLoader = moduleValue["ImageLoader"];
  var ImageUtils = moduleValue["ImageUtils"];
  var IncrementStencilOp = moduleValue["IncrementStencilOp"];
  var IncrementWrapStencilOp = moduleValue["IncrementWrapStencilOp"];
  var InstancedBufferAttribute = moduleValue["InstancedBufferAttribute"];
  var InstancedBufferGeometry = moduleValue["InstancedBufferGeometry"];
  var InstancedInterleavedBuffer = moduleValue["InstancedInterleavedBuffer"];
  var InstancedMesh = moduleValue["InstancedMesh"];
  var Int16BufferAttribute = moduleValue["Int16BufferAttribute"];
  var Int32BufferAttribute = moduleValue["Int32BufferAttribute"];
  var Int8BufferAttribute = moduleValue["Int8BufferAttribute"];
  var IntType = moduleValue["IntType"];
  var InterleavedBuffer = moduleValue["InterleavedBuffer"];
  var InterleavedBufferAttribute = moduleValue["InterleavedBufferAttribute"];
  var Interpolant = moduleValue["Interpolant"];
  var InterpolateBezier = moduleValue["InterpolateBezier"];
  var InterpolateDiscrete = moduleValue["InterpolateDiscrete"];
  var InterpolateLinear = moduleValue["InterpolateLinear"];
  var InterpolateSmooth = moduleValue["InterpolateSmooth"];
  var InterpolationSamplingMode = moduleValue["InterpolationSamplingMode"];
  var InterpolationSamplingType = moduleValue["InterpolationSamplingType"];
  var InvertStencilOp = moduleValue["InvertStencilOp"];
  var KeepStencilOp = moduleValue["KeepStencilOp"];
  var KeyframeTrack = moduleValue["KeyframeTrack"];
  var LOD = moduleValue["LOD"];
  var LatheGeometry = moduleValue["LatheGeometry"];
  var Layers = moduleValue["Layers"];
  var LessCompare = moduleValue["LessCompare"];
  var LessDepth = moduleValue["LessDepth"];
  var LessEqualCompare = moduleValue["LessEqualCompare"];
  var LessEqualDepth = moduleValue["LessEqualDepth"];
  var LessEqualStencilFunc = moduleValue["LessEqualStencilFunc"];
  var LessStencilFunc = moduleValue["LessStencilFunc"];
  var Light = moduleValue["Light"];
  var LightProbe = moduleValue["LightProbe"];
  var Line = moduleValue["Line"];
  var Line3 = moduleValue["Line3"];
  var LineBasicMaterial = moduleValue["LineBasicMaterial"];
  var LineCurve = moduleValue["LineCurve"];
  var LineCurve3 = moduleValue["LineCurve3"];
  var LineDashedMaterial = moduleValue["LineDashedMaterial"];
  var LineLoop = moduleValue["LineLoop"];
  var LineSegments = moduleValue["LineSegments"];
  var LinearFilter = moduleValue["LinearFilter"];
  var LinearInterpolant = moduleValue["LinearInterpolant"];
  var LinearMipMapLinearFilter = moduleValue["LinearMipMapLinearFilter"];
  var LinearMipMapNearestFilter = moduleValue["LinearMipMapNearestFilter"];
  var LinearMipmapLinearFilter = moduleValue["LinearMipmapLinearFilter"];
  var LinearMipmapNearestFilter = moduleValue["LinearMipmapNearestFilter"];
  var LinearSRGBColorSpace = moduleValue["LinearSRGBColorSpace"];
  var LinearToneMapping = moduleValue["LinearToneMapping"];
  var LinearTransfer = moduleValue["LinearTransfer"];
  var Loader = moduleValue["Loader"];
  var LoaderUtils = moduleValue["LoaderUtils"];
  var LoadingManager = moduleValue["LoadingManager"];
  var LoopOnce = moduleValue["LoopOnce"];
  var LoopPingPong = moduleValue["LoopPingPong"];
  var LoopRepeat = moduleValue["LoopRepeat"];
  var MOUSE = moduleValue["MOUSE"];
  var Material = moduleValue["Material"];
  var MaterialBlending = moduleValue["MaterialBlending"];
  var MaterialLoader = moduleValue["MaterialLoader"];
  var MathUtils = moduleValue["MathUtils"];
  var Matrix2 = moduleValue["Matrix2"];
  var Matrix3 = moduleValue["Matrix3"];
  var Matrix4 = moduleValue["Matrix4"];
  var MaxEquation = moduleValue["MaxEquation"];
  var Mesh = moduleValue["Mesh"];
  var MeshBasicMaterial = moduleValue["MeshBasicMaterial"];
  var MeshDepthMaterial = moduleValue["MeshDepthMaterial"];
  var MeshDistanceMaterial = moduleValue["MeshDistanceMaterial"];
  var MeshLambertMaterial = moduleValue["MeshLambertMaterial"];
  var MeshMatcapMaterial = moduleValue["MeshMatcapMaterial"];
  var MeshNormalMaterial = moduleValue["MeshNormalMaterial"];
  var MeshPhongMaterial = moduleValue["MeshPhongMaterial"];
  var MeshPhysicalMaterial = moduleValue["MeshPhysicalMaterial"];
  var MeshStandardMaterial = moduleValue["MeshStandardMaterial"];
  var MeshToonMaterial = moduleValue["MeshToonMaterial"];
  var MinEquation = moduleValue["MinEquation"];
  var MirroredRepeatWrapping = moduleValue["MirroredRepeatWrapping"];
  var MixOperation = moduleValue["MixOperation"];
  var MultiplyBlending = moduleValue["MultiplyBlending"];
  var MultiplyOperation = moduleValue["MultiplyOperation"];
  var NearestFilter = moduleValue["NearestFilter"];
  var NearestMipMapLinearFilter = moduleValue["NearestMipMapLinearFilter"];
  var NearestMipMapNearestFilter = moduleValue["NearestMipMapNearestFilter"];
  var NearestMipmapLinearFilter = moduleValue["NearestMipmapLinearFilter"];
  var NearestMipmapNearestFilter = moduleValue["NearestMipmapNearestFilter"];
  var NeutralToneMapping = moduleValue["NeutralToneMapping"];
  var NeverCompare = moduleValue["NeverCompare"];
  var NeverDepth = moduleValue["NeverDepth"];
  var NeverStencilFunc = moduleValue["NeverStencilFunc"];
  var NoBlending = moduleValue["NoBlending"];
  var NoColorSpace = moduleValue["NoColorSpace"];
  var NoNormalPacking = moduleValue["NoNormalPacking"];
  var NoToneMapping = moduleValue["NoToneMapping"];
  var NormalAnimationBlendMode = moduleValue["NormalAnimationBlendMode"];
  var NormalBlending = moduleValue["NormalBlending"];
  var NormalGAPacking = moduleValue["NormalGAPacking"];
  var NormalRGPacking = moduleValue["NormalRGPacking"];
  var NotEqualCompare = moduleValue["NotEqualCompare"];
  var NotEqualDepth = moduleValue["NotEqualDepth"];
  var NotEqualStencilFunc = moduleValue["NotEqualStencilFunc"];
  var NumberKeyframeTrack = moduleValue["NumberKeyframeTrack"];
  var Object3D = moduleValue["Object3D"];
  var ObjectLoader = moduleValue["ObjectLoader"];
  var ObjectSpaceNormalMap = moduleValue["ObjectSpaceNormalMap"];
  var OctahedronGeometry = moduleValue["OctahedronGeometry"];
  var OneFactor = moduleValue["OneFactor"];
  var OneMinusConstantAlphaFactor = moduleValue["OneMinusConstantAlphaFactor"];
  var OneMinusConstantColorFactor = moduleValue["OneMinusConstantColorFactor"];
  var OneMinusDstAlphaFactor = moduleValue["OneMinusDstAlphaFactor"];
  var OneMinusDstColorFactor = moduleValue["OneMinusDstColorFactor"];
  var OneMinusSrcAlphaFactor = moduleValue["OneMinusSrcAlphaFactor"];
  var OneMinusSrcColorFactor = moduleValue["OneMinusSrcColorFactor"];
  var OrthographicCamera = moduleValue["OrthographicCamera"];
  var PCFShadowMap = moduleValue["PCFShadowMap"];
  var PCFSoftShadowMap = moduleValue["PCFSoftShadowMap"];
  var PMREMGenerator = moduleValue["PMREMGenerator"];
  var Path = moduleValue["Path"];
  var PerspectiveCamera = moduleValue["PerspectiveCamera"];
  var Plane = moduleValue["Plane"];
  var PlaneGeometry = moduleValue["PlaneGeometry"];
  var PlaneHelper = moduleValue["PlaneHelper"];
  var PointLight = moduleValue["PointLight"];
  var PointLightHelper = moduleValue["PointLightHelper"];
  var Points = moduleValue["Points"];
  var PointsMaterial = moduleValue["PointsMaterial"];
  var PolarGridHelper = moduleValue["PolarGridHelper"];
  var PolyhedronGeometry = moduleValue["PolyhedronGeometry"];
  var PositionalAudio = moduleValue["PositionalAudio"];
  var PropertyBinding = moduleValue["PropertyBinding"];
  var PropertyMixer = moduleValue["PropertyMixer"];
  var QuadraticBezierCurve = moduleValue["QuadraticBezierCurve"];
  var QuadraticBezierCurve3 = moduleValue["QuadraticBezierCurve3"];
  var Quaternion = moduleValue["Quaternion"];
  var QuaternionKeyframeTrack = moduleValue["QuaternionKeyframeTrack"];
  var QuaternionLinearInterpolant = moduleValue["QuaternionLinearInterpolant"];
  var R11_EAC_Format = moduleValue["R11_EAC_Format"];
  var RED_GREEN_RGTC2_Format = moduleValue["RED_GREEN_RGTC2_Format"];
  var RED_RGTC1_Format = moduleValue["RED_RGTC1_Format"];
  var REVISION = moduleValue["REVISION"];
  var RG11_EAC_Format = moduleValue["RG11_EAC_Format"];
  var RGBADepthPacking = moduleValue["RGBADepthPacking"];
  var RGBAFormat = moduleValue["RGBAFormat"];
  var RGBAIntegerFormat = moduleValue["RGBAIntegerFormat"];
  var RGBA_ASTC_10x10_Format = moduleValue["RGBA_ASTC_10x10_Format"];
  var RGBA_ASTC_10x5_Format = moduleValue["RGBA_ASTC_10x5_Format"];
  var RGBA_ASTC_10x6_Format = moduleValue["RGBA_ASTC_10x6_Format"];
  var RGBA_ASTC_10x8_Format = moduleValue["RGBA_ASTC_10x8_Format"];
  var RGBA_ASTC_12x10_Format = moduleValue["RGBA_ASTC_12x10_Format"];
  var RGBA_ASTC_12x12_Format = moduleValue["RGBA_ASTC_12x12_Format"];
  var RGBA_ASTC_4x4_Format = moduleValue["RGBA_ASTC_4x4_Format"];
  var RGBA_ASTC_5x4_Format = moduleValue["RGBA_ASTC_5x4_Format"];
  var RGBA_ASTC_5x5_Format = moduleValue["RGBA_ASTC_5x5_Format"];
  var RGBA_ASTC_6x5_Format = moduleValue["RGBA_ASTC_6x5_Format"];
  var RGBA_ASTC_6x6_Format = moduleValue["RGBA_ASTC_6x6_Format"];
  var RGBA_ASTC_8x5_Format = moduleValue["RGBA_ASTC_8x5_Format"];
  var RGBA_ASTC_8x6_Format = moduleValue["RGBA_ASTC_8x6_Format"];
  var RGBA_ASTC_8x8_Format = moduleValue["RGBA_ASTC_8x8_Format"];
  var RGBA_BPTC_Format = moduleValue["RGBA_BPTC_Format"];
  var RGBA_ETC2_EAC_Format = moduleValue["RGBA_ETC2_EAC_Format"];
  var RGBA_PVRTC_2BPPV1_Format = moduleValue["RGBA_PVRTC_2BPPV1_Format"];
  var RGBA_PVRTC_4BPPV1_Format = moduleValue["RGBA_PVRTC_4BPPV1_Format"];
  var RGBA_S3TC_DXT1_Format = moduleValue["RGBA_S3TC_DXT1_Format"];
  var RGBA_S3TC_DXT3_Format = moduleValue["RGBA_S3TC_DXT3_Format"];
  var RGBA_S3TC_DXT5_Format = moduleValue["RGBA_S3TC_DXT5_Format"];
  var RGBDepthPacking = moduleValue["RGBDepthPacking"];
  var RGBFormat = moduleValue["RGBFormat"];
  var RGBIntegerFormat = moduleValue["RGBIntegerFormat"];
  var RGB_BPTC_SIGNED_Format = moduleValue["RGB_BPTC_SIGNED_Format"];
  var RGB_BPTC_UNSIGNED_Format = moduleValue["RGB_BPTC_UNSIGNED_Format"];
  var RGB_ETC1_Format = moduleValue["RGB_ETC1_Format"];
  var RGB_ETC2_Format = moduleValue["RGB_ETC2_Format"];
  var RGB_PVRTC_2BPPV1_Format = moduleValue["RGB_PVRTC_2BPPV1_Format"];
  var RGB_PVRTC_4BPPV1_Format = moduleValue["RGB_PVRTC_4BPPV1_Format"];
  var RGB_S3TC_DXT1_Format = moduleValue["RGB_S3TC_DXT1_Format"];
  var RGDepthPacking = moduleValue["RGDepthPacking"];
  var RGFormat = moduleValue["RGFormat"];
  var RGIntegerFormat = moduleValue["RGIntegerFormat"];
  var RawShaderMaterial = moduleValue["RawShaderMaterial"];
  var Ray = moduleValue["Ray"];
  var Raycaster = moduleValue["Raycaster"];
  var RectAreaLight = moduleValue["RectAreaLight"];
  var RedFormat = moduleValue["RedFormat"];
  var RedIntegerFormat = moduleValue["RedIntegerFormat"];
  var ReinhardToneMapping = moduleValue["ReinhardToneMapping"];
  var RenderTarget = moduleValue["RenderTarget"];
  var RenderTarget3D = moduleValue["RenderTarget3D"];
  var RepeatWrapping = moduleValue["RepeatWrapping"];
  var ReplaceStencilOp = moduleValue["ReplaceStencilOp"];
  var ReverseSubtractEquation = moduleValue["ReverseSubtractEquation"];
  var RingGeometry = moduleValue["RingGeometry"];
  var SIGNED_R11_EAC_Format = moduleValue["SIGNED_R11_EAC_Format"];
  var SIGNED_RED_GREEN_RGTC2_Format = moduleValue["SIGNED_RED_GREEN_RGTC2_Format"];
  var SIGNED_RED_RGTC1_Format = moduleValue["SIGNED_RED_RGTC1_Format"];
  var SIGNED_RG11_EAC_Format = moduleValue["SIGNED_RG11_EAC_Format"];
  var SRGBColorSpace = moduleValue["SRGBColorSpace"];
  var SRGBTransfer = moduleValue["SRGBTransfer"];
  var Scene = moduleValue["Scene"];
  var ShaderChunk = moduleValue["ShaderChunk"];
  var ShaderLib = moduleValue["ShaderLib"];
  var ShaderMaterial = moduleValue["ShaderMaterial"];
  var ShadowMaterial = moduleValue["ShadowMaterial"];
  var Shape = moduleValue["Shape"];
  var ShapeGeometry = moduleValue["ShapeGeometry"];
  var ShapePath = moduleValue["ShapePath"];
  var ShapeUtils = moduleValue["ShapeUtils"];
  var ShortType = moduleValue["ShortType"];
  var Skeleton = moduleValue["Skeleton"];
  var SkeletonHelper = moduleValue["SkeletonHelper"];
  var SkinnedMesh = moduleValue["SkinnedMesh"];
  var Source = moduleValue["Source"];
  var Sphere = moduleValue["Sphere"];
  var SphereGeometry = moduleValue["SphereGeometry"];
  var Spherical = moduleValue["Spherical"];
  var SphericalHarmonics3 = moduleValue["SphericalHarmonics3"];
  var SplineCurve = moduleValue["SplineCurve"];
  var SpotLight = moduleValue["SpotLight"];
  var SpotLightHelper = moduleValue["SpotLightHelper"];
  var Sprite = moduleValue["Sprite"];
  var SpriteMaterial = moduleValue["SpriteMaterial"];
  var SrcAlphaFactor = moduleValue["SrcAlphaFactor"];
  var SrcAlphaSaturateFactor = moduleValue["SrcAlphaSaturateFactor"];
  var SrcColorFactor = moduleValue["SrcColorFactor"];
  var StaticCopyUsage = moduleValue["StaticCopyUsage"];
  var StaticDrawUsage = moduleValue["StaticDrawUsage"];
  var StaticReadUsage = moduleValue["StaticReadUsage"];
  var StereoCamera = moduleValue["StereoCamera"];
  var StreamCopyUsage = moduleValue["StreamCopyUsage"];
  var StreamDrawUsage = moduleValue["StreamDrawUsage"];
  var StreamReadUsage = moduleValue["StreamReadUsage"];
  var StringKeyframeTrack = moduleValue["StringKeyframeTrack"];
  var SubtractEquation = moduleValue["SubtractEquation"];
  var SubtractiveBlending = moduleValue["SubtractiveBlending"];
  var TOUCH = moduleValue["TOUCH"];
  var TangentSpaceNormalMap = moduleValue["TangentSpaceNormalMap"];
  var TetrahedronGeometry = moduleValue["TetrahedronGeometry"];
  var Texture = moduleValue["Texture"];
  var TextureLoader = moduleValue["TextureLoader"];
  var TextureUtils = moduleValue["TextureUtils"];
  var Timer = moduleValue["Timer"];
  var TimestampQuery = moduleValue["TimestampQuery"];
  var TorusGeometry = moduleValue["TorusGeometry"];
  var TorusKnotGeometry = moduleValue["TorusKnotGeometry"];
  var Triangle = moduleValue["Triangle"];
  var TriangleFanDrawMode = moduleValue["TriangleFanDrawMode"];
  var TriangleStripDrawMode = moduleValue["TriangleStripDrawMode"];
  var TrianglesDrawMode = moduleValue["TrianglesDrawMode"];
  var TubeGeometry = moduleValue["TubeGeometry"];
  var UVMapping = moduleValue["UVMapping"];
  var Uint16BufferAttribute = moduleValue["Uint16BufferAttribute"];
  var Uint32BufferAttribute = moduleValue["Uint32BufferAttribute"];
  var Uint8BufferAttribute = moduleValue["Uint8BufferAttribute"];
  var Uint8ClampedBufferAttribute = moduleValue["Uint8ClampedBufferAttribute"];
  var Uniform = moduleValue["Uniform"];
  var UniformsGroup = moduleValue["UniformsGroup"];
  var UniformsLib = moduleValue["UniformsLib"];
  var UniformsUtils = moduleValue["UniformsUtils"];
  var UnsignedByteType = moduleValue["UnsignedByteType"];
  var UnsignedInt101111Type = moduleValue["UnsignedInt101111Type"];
  var UnsignedInt248Type = moduleValue["UnsignedInt248Type"];
  var UnsignedInt5999Type = moduleValue["UnsignedInt5999Type"];
  var UnsignedIntType = moduleValue["UnsignedIntType"];
  var UnsignedShort4444Type = moduleValue["UnsignedShort4444Type"];
  var UnsignedShort5551Type = moduleValue["UnsignedShort5551Type"];
  var UnsignedShortType = moduleValue["UnsignedShortType"];
  var VSMShadowMap = moduleValue["VSMShadowMap"];
  var Vector2 = moduleValue["Vector2"];
  var Vector3 = moduleValue["Vector3"];
  var Vector4 = moduleValue["Vector4"];
  var VectorKeyframeTrack = moduleValue["VectorKeyframeTrack"];
  var VideoFrameTexture = moduleValue["VideoFrameTexture"];
  var VideoTexture = moduleValue["VideoTexture"];
  var WebGL3DRenderTarget = moduleValue["WebGL3DRenderTarget"];
  var WebGLArrayRenderTarget = moduleValue["WebGLArrayRenderTarget"];
  var WebGLCoordinateSystem = moduleValue["WebGLCoordinateSystem"];
  var WebGLCubeRenderTarget = moduleValue["WebGLCubeRenderTarget"];
  var WebGLRenderTarget = moduleValue["WebGLRenderTarget"];
  var WebGLRenderer = moduleValue["WebGLRenderer"];
  var WebGLUtils = moduleValue["WebGLUtils"];
  var WebGPUCoordinateSystem = moduleValue["WebGPUCoordinateSystem"];
  var WebXRController = moduleValue["WebXRController"];
  var WireframeGeometry = moduleValue["WireframeGeometry"];
  var WrapAroundEnding = moduleValue["WrapAroundEnding"];
  var ZeroCurvatureEnding = moduleValue["ZeroCurvatureEnding"];
  var ZeroFactor = moduleValue["ZeroFactor"];
  var ZeroSlopeEnding = moduleValue["ZeroSlopeEnding"];
  var ZeroStencilOp = moduleValue["ZeroStencilOp"];
  var createCanvasElement = moduleValue["createCanvasElement"];
  var error = moduleValue["error"];
  var getConsoleFunction = moduleValue["getConsoleFunction"];
  var log = moduleValue["log"];
  var setConsoleFunction = moduleValue["setConsoleFunction"];
  var warn = moduleValue["warn"];
  var warnOnce = moduleValue["warnOnce"];

  // node_modules/three/examples/jsm/loaders/HDRLoader.js
  var HDRLoader = class extends DataTextureLoader {
    /**
        * Constructs a new RGBE/HDR loader.
        *
        * @param {LoadingManager} [manager] - The loading manager.
        */
    constructor(manager) {
      super(manager);
      this.type = HalfFloatType;
    }
    /**
        * Parses the given RGBE texture data.
        *
        * @param {ArrayBuffer} buffer - The raw texture data.
        * @return {DataTextureLoader~TexData} An object representing the parsed texture data.
        */
    parse(buffer) {
      const rgbe_read_error = 1, rgbe_write_error = 2, rgbe_format_error = 3, rgbe_memory_error = 4, rgbe_error = function(rgbe_error_code, msg) {
        switch (rgbe_error_code) {
          case rgbe_read_error:
            throw new Error("THREE.HDRLoader: Read Error: " + (msg || ""));
          case rgbe_write_error:
            throw new Error("THREE.HDRLoader: Write Error: " + (msg || ""));
          case rgbe_format_error:
            throw new Error("THREE.HDRLoader: Bad File Format: " + (msg || ""));
          default:
          case rgbe_memory_error:
            throw new Error("THREE.HDRLoader: Memory Error: " + (msg || ""));
        }
      }, RGBE_VALID_PROGRAMTYPE = 1, RGBE_VALID_FORMAT = 2, RGBE_VALID_DIMENSIONS = 4, NEWLINE = "\n", fgets = function(buffer2, lineLimit, consume) {
        const chunkSize = 128;
        lineLimit = !lineLimit ? 1024 : lineLimit;
        let p = buffer2.pos, i = -1, len = 0, s = "", chunk = String.fromCharCode.apply(null, new Uint16Array(buffer2.subarray(p, p + chunkSize)));
        while (0 > (i = chunk.indexOf(NEWLINE)) && len < lineLimit && p < buffer2.byteLength) {
          s += chunk;
          len += chunk.length;
          p += chunkSize;
          chunk = String.fromCharCode.apply(null, new Uint16Array(buffer2.subarray(p, p + chunkSize)));
        }
        if (-1 < i) {
          if (false !== consume) buffer2.pos += len + i + 1;
          return s + chunk.slice(0, i);
        }
        return false;
      }, RGBE_ReadHeader = function(buffer2) {
        const magic_token_re = /^#\?(\S+)/, gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/, exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/, format_re = /^\s*FORMAT=(\S+)\s*$/, dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/, header = {
          valid: 0,
          /* indicate which fields are valid */
          string: "",
          /* the actual header string */
          comments: "",
          /* comments found in header */
          programtype: "RGBE",
          /* listed at beginning of file to identify it after "#?". defaults to "RGBE" */
          format: "",
          /* RGBE format, default 32-bit_rle_rgbe */
          gamma: 1,
          /* image has already been gamma corrected with given gamma. defaults to 1.0 (no correction) */
          exposure: 1,
          /* a value of 1.0 in an image corresponds to <exposure> watts/steradian/m^2. defaults to 1.0 */
          width: 0,
          height: 0
          /* image dimensions, width/height */
        };
        let line, match;
        if (buffer2.pos >= buffer2.byteLength || !(line = fgets(buffer2))) {
          rgbe_error(rgbe_read_error, "no header found");
        }
        if (!(match = line.match(magic_token_re))) {
          rgbe_error(rgbe_format_error, "bad initial token");
        }
        header.valid |= RGBE_VALID_PROGRAMTYPE;
        header.programtype = match[1];
        header.string += line + "\n";
        while (true) {
          line = fgets(buffer2);
          if (false === line) break;
          header.string += line + "\n";
          if ("#" === line.charAt(0)) {
            header.comments += line + "\n";
            continue;
          }
          if (match = line.match(gamma_re)) {
            header.gamma = parseFloat(match[1]);
          }
          if (match = line.match(exposure_re)) {
            header.exposure = parseFloat(match[1]);
          }
          if (match = line.match(format_re)) {
            header.valid |= RGBE_VALID_FORMAT;
            header.format = match[1];
          }
          if (match = line.match(dimensions_re)) {
            header.valid |= RGBE_VALID_DIMENSIONS;
            header.height = parseInt(match[1], 10);
            header.width = parseInt(match[2], 10);
          }
          if (header.valid & RGBE_VALID_FORMAT && header.valid & RGBE_VALID_DIMENSIONS) break;
        }
        if (!(header.valid & RGBE_VALID_FORMAT)) {
          rgbe_error(rgbe_format_error, "missing format specifier");
        }
        if (!(header.valid & RGBE_VALID_DIMENSIONS)) {
          rgbe_error(rgbe_format_error, "missing image size specifier");
        }
        return header;
      }, RGBE_ReadPixels_RLE = function(buffer2, w2, h2) {
        const scanline_width = w2;
        if (
          // run length encoding is not allowed so read flat
          scanline_width < 8 || scanline_width > 32767 || // this file is not run length encoded
          (2 !== buffer2[0] || 2 !== buffer2[1] || buffer2[2] & 128)
        ) {
          return new Uint8Array(buffer2);
        }
        if (scanline_width !== (buffer2[2] << 8 | buffer2[3])) {
          rgbe_error(rgbe_format_error, "wrong scanline width");
        }
        const data_rgba = new Uint8Array(4 * w2 * h2);
        if (!data_rgba.length) {
          rgbe_error(rgbe_memory_error, "unable to allocate buffer space");
        }
        let offset = 0, pos = 0;
        const ptr_end = 4 * scanline_width;
        const rgbeStart = new Uint8Array(4);
        const scanline_buffer = new Uint8Array(ptr_end);
        let num_scanlines = h2;
        while (num_scanlines > 0 && pos < buffer2.byteLength) {
          if (pos + 4 > buffer2.byteLength) {
            rgbe_error(rgbe_read_error);
          }
          rgbeStart[0] = buffer2[pos++];
          rgbeStart[1] = buffer2[pos++];
          rgbeStart[2] = buffer2[pos++];
          rgbeStart[3] = buffer2[pos++];
          if (2 != rgbeStart[0] || 2 != rgbeStart[1] || (rgbeStart[2] << 8 | rgbeStart[3]) != scanline_width) {
            rgbe_error(rgbe_format_error, "bad rgbe scanline format");
          }
          let ptr = 0, count;
          while (ptr < ptr_end && pos < buffer2.byteLength) {
            count = buffer2[pos++];
            const isEncodedRun = count > 128;
            if (isEncodedRun) count -= 128;
            if (0 === count || ptr + count > ptr_end) {
              rgbe_error(rgbe_format_error, "bad scanline data");
            }
            if (isEncodedRun) {
              const byteValue = buffer2[pos++];
              for (let i = 0; i < count; i++) {
                scanline_buffer[ptr++] = byteValue;
              }
            } else {
              scanline_buffer.set(buffer2.subarray(pos, pos + count), ptr);
              ptr += count;
              pos += count;
            }
          }
          const l = scanline_width;
          for (let i = 0; i < l; i++) {
            let off = 0;
            data_rgba[offset] = scanline_buffer[i + off];
            off += scanline_width;
            data_rgba[offset + 1] = scanline_buffer[i + off];
            off += scanline_width;
            data_rgba[offset + 2] = scanline_buffer[i + off];
            off += scanline_width;
            data_rgba[offset + 3] = scanline_buffer[i + off];
            offset += 4;
          }
          num_scanlines--;
        }
        return data_rgba;
      };
      const RGBEByteToRGBFloat = function(sourceArray, sourceOffset, destArray, destOffset) {
        const e = sourceArray[sourceOffset + 3];
        const scale = Math.pow(2, e - 128) / 255;
        destArray[destOffset + 0] = sourceArray[sourceOffset + 0] * scale;
        destArray[destOffset + 1] = sourceArray[sourceOffset + 1] * scale;
        destArray[destOffset + 2] = sourceArray[sourceOffset + 2] * scale;
        destArray[destOffset + 3] = 1;
      };
      const RGBEByteToRGBHalf = function(sourceArray, sourceOffset, destArray, destOffset) {
        const e = sourceArray[sourceOffset + 3];
        const scale = Math.pow(2, e - 128) / 255;
        destArray[destOffset + 0] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 0] * scale, 65504));
        destArray[destOffset + 1] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 1] * scale, 65504));
        destArray[destOffset + 2] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 2] * scale, 65504));
        destArray[destOffset + 3] = DataUtils.toHalfFloat(1);
      };
      const byteArray = new Uint8Array(buffer);
      byteArray.pos = 0;
      const rgbe_header_info = RGBE_ReadHeader(byteArray);
      const w = rgbe_header_info.width, h = rgbe_header_info.height, image_rgba_data = RGBE_ReadPixels_RLE(byteArray.subarray(byteArray.pos), w, h);
      let data, type;
      let numElements;
      switch (this.type) {
        case FloatType:
          numElements = image_rgba_data.length / 4;
          const floatArray = new Float32Array(numElements * 4);
          for (let j = 0; j < numElements; j++) {
            RGBEByteToRGBFloat(image_rgba_data, j * 4, floatArray, j * 4);
          }
          data = floatArray;
          type = FloatType;
          break;
        case HalfFloatType:
          numElements = image_rgba_data.length / 4;
          const halfArray = new Uint16Array(numElements * 4);
          for (let j = 0; j < numElements; j++) {
            RGBEByteToRGBHalf(image_rgba_data, j * 4, halfArray, j * 4);
          }
          data = halfArray;
          type = HalfFloatType;
          break;
        default:
          throw new Error("THREE.HDRLoader: Unsupported type: " + this.type);
      }
      return {
        width: w,
        height: h,
        data,
        header: rgbe_header_info.string,
        gamma: rgbe_header_info.gamma,
        exposure: rgbe_header_info.exposure,
        type
      };
    }
    /**
        * Sets the texture type.
        *
        * @param {(HalfFloatType|FloatType)} value - The texture type to set.
        * @return {HDRLoader} A reference to this loader.
        */
    setDataType(value) {
      this.type = value;
      return this;
    }
    load(url, onLoad, onProgress, onError) {
      function onLoadCallback(texture, texData) {
        switch (texture.type) {
          case FloatType:
          case HalfFloatType:
            texture.colorSpace = LinearSRGBColorSpace;
            texture.minFilter = LinearFilter;
            texture.magFilter = LinearFilter;
            texture.generateMipmaps = false;
            texture.flipY = true;
            break;
        }
        if (onLoad) onLoad(texture, texData);
      }
      return super.load(url, onLoadCallback, onProgress, onError);
    }
  };

  // node_modules/three/examples/jsm/loaders/RGBELoader.js
  var RGBELoader = class extends HDRLoader {
    constructor(manager) {
      console.warn("RGBELoader has been deprecated. Please use HDRLoader instead.");
      super(manager);
    }
  };

  // scripts/.tmp-build-three-addons-runtime-entry.mjs
  var THREE = window.THREE || window.AFRAME && window.AFRAME.THREE || {};
  THREE.HDRLoader = HDRLoader;
  THREE.RGBELoader = RGBELoader || HDRLoader;
  window.THREE = THREE;
  window.VRODOS_THREE_ADDONS = {
    HDRLoader,
    RGBELoader: THREE.RGBELoader
  };
})();
