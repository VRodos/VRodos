(() => {
  // scripts/.tmp-postprocessing-global-shim.mjs
  var moduleValue = window.POSTPROCESSING || {};
  var ASCIIEffect = moduleValue["ASCIIEffect"];
  var ASCIITexture = moduleValue["ASCIITexture"];
  var AdaptiveLuminanceMaterial = moduleValue["AdaptiveLuminanceMaterial"];
  var AdaptiveLuminancePass = moduleValue["AdaptiveLuminancePass"];
  var BlendFunction = moduleValue["BlendFunction"];
  var BlendMode = moduleValue["BlendMode"];
  var BloomEffect = moduleValue["BloomEffect"];
  var BlurPass = moduleValue["BlurPass"];
  var BokehEffect = moduleValue["BokehEffect"];
  var BokehMaterial = moduleValue["BokehMaterial"];
  var BoxBlurMaterial = moduleValue["BoxBlurMaterial"];
  var BoxBlurPass = moduleValue["BoxBlurPass"];
  var BrightnessContrastEffect = moduleValue["BrightnessContrastEffect"];
  var ChromaticAberrationEffect = moduleValue["ChromaticAberrationEffect"];
  var CircleOfConfusionMaterial = moduleValue["CircleOfConfusionMaterial"];
  var ClearMaskPass = moduleValue["ClearMaskPass"];
  var ClearPass = moduleValue["ClearPass"];
  var ColorAverageEffect = moduleValue["ColorAverageEffect"];
  var ColorChannel = moduleValue["ColorChannel"];
  var ColorDepthEffect = moduleValue["ColorDepthEffect"];
  var ColorEdgesMaterial = moduleValue["ColorEdgesMaterial"];
  var ConvolutionMaterial = moduleValue["ConvolutionMaterial"];
  var CopyMaterial = moduleValue["CopyMaterial"];
  var CopyPass = moduleValue["CopyPass"];
  var DepthComparisonMaterial = moduleValue["DepthComparisonMaterial"];
  var DepthCopyMaterial = moduleValue["DepthCopyMaterial"];
  var DepthCopyMode = moduleValue["DepthCopyMode"];
  var DepthCopyPass = moduleValue["DepthCopyPass"];
  var DepthDownsamplingMaterial = moduleValue["DepthDownsamplingMaterial"];
  var DepthDownsamplingPass = moduleValue["DepthDownsamplingPass"];
  var DepthEffect = moduleValue["DepthEffect"];
  var DepthMaskMaterial = moduleValue["DepthMaskMaterial"];
  var DepthOfFieldEffect = moduleValue["DepthOfFieldEffect"];
  var DepthPass = moduleValue["DepthPass"];
  var DepthPickingPass = moduleValue["DepthPickingPass"];
  var DepthSavePass = moduleValue["DepthSavePass"];
  var DepthTestStrategy = moduleValue["DepthTestStrategy"];
  var Disposable = moduleValue["Disposable"];
  var DotScreenEffect = moduleValue["DotScreenEffect"];
  var DownsamplingMaterial = moduleValue["DownsamplingMaterial"];
  var EdgeDetectionMaterial = moduleValue["EdgeDetectionMaterial"];
  var EdgeDetectionMode = moduleValue["EdgeDetectionMode"];
  var Effect = moduleValue["Effect"];
  var EffectAttribute = moduleValue["EffectAttribute"];
  var EffectComposer = moduleValue["EffectComposer"];
  var EffectMaterial = moduleValue["EffectMaterial"];
  var EffectPass = moduleValue["EffectPass"];
  var EffectShaderData = moduleValue["EffectShaderData"];
  var EffectShaderSection = moduleValue["EffectShaderSection"];
  var FXAAEffect = moduleValue["FXAAEffect"];
  var GammaCorrectionEffect = moduleValue["GammaCorrectionEffect"];
  var GaussKernel = moduleValue["GaussKernel"];
  var GaussianBlurMaterial = moduleValue["GaussianBlurMaterial"];
  var GaussianBlurPass = moduleValue["GaussianBlurPass"];
  var GlitchEffect = moduleValue["GlitchEffect"];
  var GlitchMode = moduleValue["GlitchMode"];
  var GodRaysEffect = moduleValue["GodRaysEffect"];
  var GodRaysMaterial = moduleValue["GodRaysMaterial"];
  var GridEffect = moduleValue["GridEffect"];
  var HueSaturationEffect = moduleValue["HueSaturationEffect"];
  var ImmutableTimer = moduleValue["ImmutableTimer"];
  var Initializable = moduleValue["Initializable"];
  var KawaseBlurMaterial = moduleValue["KawaseBlurMaterial"];
  var KawaseBlurPass = moduleValue["KawaseBlurPass"];
  var KernelSize = moduleValue["KernelSize"];
  var LUT1DEffect = moduleValue["LUT1DEffect"];
  var LUT3DEffect = moduleValue["LUT3DEffect"];
  var LUT3dlLoader = moduleValue["LUT3dlLoader"];
  var LUTCubeLoader = moduleValue["LUTCubeLoader"];
  var LUTEffect = moduleValue["LUTEffect"];
  var LUTOperation = moduleValue["LUTOperation"];
  var LambdaPass = moduleValue["LambdaPass"];
  var LensDistortionEffect = moduleValue["LensDistortionEffect"];
  var LookupTexture = moduleValue["LookupTexture"];
  var LookupTexture3D = moduleValue["LookupTexture3D"];
  var LuminanceMaterial = moduleValue["LuminanceMaterial"];
  var LuminancePass = moduleValue["LuminancePass"];
  var MaskFunction = moduleValue["MaskFunction"];
  var MaskMaterial = moduleValue["MaskMaterial"];
  var MaskPass = moduleValue["MaskPass"];
  var MipmapBlurPass = moduleValue["MipmapBlurPass"];
  var NoiseEffect = moduleValue["NoiseEffect"];
  var NoiseTexture = moduleValue["NoiseTexture"];
  var NormalPass = moduleValue["NormalPass"];
  var OutlineEdgesMaterial = moduleValue["OutlineEdgesMaterial"];
  var OutlineEffect = moduleValue["OutlineEffect"];
  var OutlineMaterial = moduleValue["OutlineMaterial"];
  var OverrideMaterialManager = moduleValue["OverrideMaterialManager"];
  var Pass = moduleValue["Pass"];
  var PixelationEffect = moduleValue["PixelationEffect"];
  var PredicationMode = moduleValue["PredicationMode"];
  var RawImageData = moduleValue["RawImageData"];
  var RealisticBokehEffect = moduleValue["RealisticBokehEffect"];
  var RenderPass = moduleValue["RenderPass"];
  var Resizable = moduleValue["Resizable"];
  var Resizer = moduleValue["Resizer"];
  var Resolution = moduleValue["Resolution"];
  var SMAAAreaImageData = moduleValue["SMAAAreaImageData"];
  var SMAAEffect = moduleValue["SMAAEffect"];
  var SMAAImageGenerator = moduleValue["SMAAImageGenerator"];
  var SMAAImageLoader = moduleValue["SMAAImageLoader"];
  var SMAAPreset = moduleValue["SMAAPreset"];
  var SMAASearchImageData = moduleValue["SMAASearchImageData"];
  var SMAAWeightsMaterial = moduleValue["SMAAWeightsMaterial"];
  var SSAOEffect = moduleValue["SSAOEffect"];
  var SSAOMaterial = moduleValue["SSAOMaterial"];
  var SavePass = moduleValue["SavePass"];
  var ScanlineEffect = moduleValue["ScanlineEffect"];
  var Section = moduleValue["Section"];
  var Selection = moduleValue["Selection"];
  var SelectiveBloomEffect = moduleValue["SelectiveBloomEffect"];
  var SepiaEffect = moduleValue["SepiaEffect"];
  var ShaderPass = moduleValue["ShaderPass"];
  var ShockWaveEffect = moduleValue["ShockWaveEffect"];
  var TetrahedralUpscaler = moduleValue["TetrahedralUpscaler"];
  var TextureEffect = moduleValue["TextureEffect"];
  var TiltShiftBlurMaterial = moduleValue["TiltShiftBlurMaterial"];
  var TiltShiftBlurPass = moduleValue["TiltShiftBlurPass"];
  var TiltShiftEffect = moduleValue["TiltShiftEffect"];
  var Timer = moduleValue["Timer"];
  var ToneMappingEffect = moduleValue["ToneMappingEffect"];
  var ToneMappingMode = moduleValue["ToneMappingMode"];
  var UpsamplingMaterial = moduleValue["UpsamplingMaterial"];
  var VignetteEffect = moduleValue["VignetteEffect"];
  var VignetteTechnique = moduleValue["VignetteTechnique"];
  var WebGLExtension = moduleValue["WebGLExtension"];
  var version = moduleValue["version"];

  // scripts/.tmp-three-global-shim.mjs
  var moduleValue2 = window.THREE || {};
  var ACESFilmicToneMapping = moduleValue2["ACESFilmicToneMapping"];
  var AddEquation = moduleValue2["AddEquation"];
  var AddOperation = moduleValue2["AddOperation"];
  var AdditiveAnimationBlendMode = moduleValue2["AdditiveAnimationBlendMode"];
  var AdditiveBlending = moduleValue2["AdditiveBlending"];
  var AgXToneMapping = moduleValue2["AgXToneMapping"];
  var AlphaFormat = moduleValue2["AlphaFormat"];
  var AlwaysCompare = moduleValue2["AlwaysCompare"];
  var AlwaysDepth = moduleValue2["AlwaysDepth"];
  var AlwaysStencilFunc = moduleValue2["AlwaysStencilFunc"];
  var AmbientLight = moduleValue2["AmbientLight"];
  var AnimationAction = moduleValue2["AnimationAction"];
  var AnimationClip = moduleValue2["AnimationClip"];
  var AnimationLoader = moduleValue2["AnimationLoader"];
  var AnimationMixer = moduleValue2["AnimationMixer"];
  var AnimationObjectGroup = moduleValue2["AnimationObjectGroup"];
  var AnimationUtils = moduleValue2["AnimationUtils"];
  var ArcCurve = moduleValue2["ArcCurve"];
  var ArrayCamera = moduleValue2["ArrayCamera"];
  var ArrowHelper = moduleValue2["ArrowHelper"];
  var AttachedBindMode = moduleValue2["AttachedBindMode"];
  var Audio = moduleValue2["Audio"];
  var AudioAnalyser = moduleValue2["AudioAnalyser"];
  var AudioContext = moduleValue2["AudioContext"];
  var AudioListener = moduleValue2["AudioListener"];
  var AudioLoader = moduleValue2["AudioLoader"];
  var AxesHelper = moduleValue2["AxesHelper"];
  var BackSide = moduleValue2["BackSide"];
  var BasicDepthPacking = moduleValue2["BasicDepthPacking"];
  var BasicShadowMap = moduleValue2["BasicShadowMap"];
  var BatchedMesh = moduleValue2["BatchedMesh"];
  var BezierInterpolant = moduleValue2["BezierInterpolant"];
  var Bone = moduleValue2["Bone"];
  var BooleanKeyframeTrack = moduleValue2["BooleanKeyframeTrack"];
  var Box2 = moduleValue2["Box2"];
  var Box3 = moduleValue2["Box3"];
  var Box3Helper = moduleValue2["Box3Helper"];
  var BoxGeometry = moduleValue2["BoxGeometry"];
  var BoxHelper = moduleValue2["BoxHelper"];
  var BufferAttribute = moduleValue2["BufferAttribute"];
  var BufferGeometry = moduleValue2["BufferGeometry"];
  var BufferGeometryLoader = moduleValue2["BufferGeometryLoader"];
  var ByteType = moduleValue2["ByteType"];
  var Cache = moduleValue2["Cache"];
  var Camera = moduleValue2["Camera"];
  var CameraHelper = moduleValue2["CameraHelper"];
  var CanvasTexture = moduleValue2["CanvasTexture"];
  var CapsuleGeometry = moduleValue2["CapsuleGeometry"];
  var CatmullRomCurve3 = moduleValue2["CatmullRomCurve3"];
  var CineonToneMapping = moduleValue2["CineonToneMapping"];
  var CircleGeometry = moduleValue2["CircleGeometry"];
  var ClampToEdgeWrapping = moduleValue2["ClampToEdgeWrapping"];
  var Clock = moduleValue2["Clock"];
  var Color = moduleValue2["Color"];
  var ColorKeyframeTrack = moduleValue2["ColorKeyframeTrack"];
  var ColorManagement = moduleValue2["ColorManagement"];
  var Compatibility = moduleValue2["Compatibility"];
  var CompressedArrayTexture = moduleValue2["CompressedArrayTexture"];
  var CompressedCubeTexture = moduleValue2["CompressedCubeTexture"];
  var CompressedTexture = moduleValue2["CompressedTexture"];
  var CompressedTextureLoader = moduleValue2["CompressedTextureLoader"];
  var ConeGeometry = moduleValue2["ConeGeometry"];
  var ConstantAlphaFactor = moduleValue2["ConstantAlphaFactor"];
  var ConstantColorFactor = moduleValue2["ConstantColorFactor"];
  var Controls = moduleValue2["Controls"];
  var CubeCamera = moduleValue2["CubeCamera"];
  var CubeDepthTexture = moduleValue2["CubeDepthTexture"];
  var CubeReflectionMapping = moduleValue2["CubeReflectionMapping"];
  var CubeRefractionMapping = moduleValue2["CubeRefractionMapping"];
  var CubeTexture = moduleValue2["CubeTexture"];
  var CubeTextureLoader = moduleValue2["CubeTextureLoader"];
  var CubeUVReflectionMapping = moduleValue2["CubeUVReflectionMapping"];
  var CubicBezierCurve = moduleValue2["CubicBezierCurve"];
  var CubicBezierCurve3 = moduleValue2["CubicBezierCurve3"];
  var CubicInterpolant = moduleValue2["CubicInterpolant"];
  var CullFaceBack = moduleValue2["CullFaceBack"];
  var CullFaceFront = moduleValue2["CullFaceFront"];
  var CullFaceFrontBack = moduleValue2["CullFaceFrontBack"];
  var CullFaceNone = moduleValue2["CullFaceNone"];
  var Curve = moduleValue2["Curve"];
  var CurvePath = moduleValue2["CurvePath"];
  var CustomBlending = moduleValue2["CustomBlending"];
  var CustomToneMapping = moduleValue2["CustomToneMapping"];
  var CylinderGeometry = moduleValue2["CylinderGeometry"];
  var Cylindrical = moduleValue2["Cylindrical"];
  var Data3DTexture = moduleValue2["Data3DTexture"];
  var DataArrayTexture = moduleValue2["DataArrayTexture"];
  var DataTexture = moduleValue2["DataTexture"];
  var DataTextureLoader = moduleValue2["DataTextureLoader"];
  var DataUtils = moduleValue2["DataUtils"];
  var DecrementStencilOp = moduleValue2["DecrementStencilOp"];
  var DecrementWrapStencilOp = moduleValue2["DecrementWrapStencilOp"];
  var DefaultLoadingManager = moduleValue2["DefaultLoadingManager"];
  var DepthFormat = moduleValue2["DepthFormat"];
  var DepthStencilFormat = moduleValue2["DepthStencilFormat"];
  var DepthTexture = moduleValue2["DepthTexture"];
  var DetachedBindMode = moduleValue2["DetachedBindMode"];
  var DirectionalLight = moduleValue2["DirectionalLight"];
  var DirectionalLightHelper = moduleValue2["DirectionalLightHelper"];
  var DiscreteInterpolant = moduleValue2["DiscreteInterpolant"];
  var DodecahedronGeometry = moduleValue2["DodecahedronGeometry"];
  var DoubleSide = moduleValue2["DoubleSide"];
  var DstAlphaFactor = moduleValue2["DstAlphaFactor"];
  var DstColorFactor = moduleValue2["DstColorFactor"];
  var DynamicCopyUsage = moduleValue2["DynamicCopyUsage"];
  var DynamicDrawUsage = moduleValue2["DynamicDrawUsage"];
  var DynamicReadUsage = moduleValue2["DynamicReadUsage"];
  var EdgesGeometry = moduleValue2["EdgesGeometry"];
  var EllipseCurve = moduleValue2["EllipseCurve"];
  var EqualCompare = moduleValue2["EqualCompare"];
  var EqualDepth = moduleValue2["EqualDepth"];
  var EqualStencilFunc = moduleValue2["EqualStencilFunc"];
  var EquirectangularReflectionMapping = moduleValue2["EquirectangularReflectionMapping"];
  var EquirectangularRefractionMapping = moduleValue2["EquirectangularRefractionMapping"];
  var Euler = moduleValue2["Euler"];
  var EventDispatcher = moduleValue2["EventDispatcher"];
  var ExternalTexture = moduleValue2["ExternalTexture"];
  var ExtrudeGeometry = moduleValue2["ExtrudeGeometry"];
  var FileLoader = moduleValue2["FileLoader"];
  var Float16BufferAttribute = moduleValue2["Float16BufferAttribute"];
  var Float32BufferAttribute = moduleValue2["Float32BufferAttribute"];
  var FloatType = moduleValue2["FloatType"];
  var Fog = moduleValue2["Fog"];
  var FogExp2 = moduleValue2["FogExp2"];
  var FramebufferTexture = moduleValue2["FramebufferTexture"];
  var FrontSide = moduleValue2["FrontSide"];
  var Frustum = moduleValue2["Frustum"];
  var FrustumArray = moduleValue2["FrustumArray"];
  var GLBufferAttribute = moduleValue2["GLBufferAttribute"];
  var GLSL1 = moduleValue2["GLSL1"];
  var GLSL3 = moduleValue2["GLSL3"];
  var GreaterCompare = moduleValue2["GreaterCompare"];
  var GreaterDepth = moduleValue2["GreaterDepth"];
  var GreaterEqualCompare = moduleValue2["GreaterEqualCompare"];
  var GreaterEqualDepth = moduleValue2["GreaterEqualDepth"];
  var GreaterEqualStencilFunc = moduleValue2["GreaterEqualStencilFunc"];
  var GreaterStencilFunc = moduleValue2["GreaterStencilFunc"];
  var GridHelper = moduleValue2["GridHelper"];
  var Group = moduleValue2["Group"];
  var HTMLTexture = moduleValue2["HTMLTexture"];
  var HalfFloatType = moduleValue2["HalfFloatType"];
  var HemisphereLight = moduleValue2["HemisphereLight"];
  var HemisphereLightHelper = moduleValue2["HemisphereLightHelper"];
  var IcosahedronGeometry = moduleValue2["IcosahedronGeometry"];
  var ImageBitmapLoader = moduleValue2["ImageBitmapLoader"];
  var ImageLoader = moduleValue2["ImageLoader"];
  var ImageUtils = moduleValue2["ImageUtils"];
  var IncrementStencilOp = moduleValue2["IncrementStencilOp"];
  var IncrementWrapStencilOp = moduleValue2["IncrementWrapStencilOp"];
  var InstancedBufferAttribute = moduleValue2["InstancedBufferAttribute"];
  var InstancedBufferGeometry = moduleValue2["InstancedBufferGeometry"];
  var InstancedInterleavedBuffer = moduleValue2["InstancedInterleavedBuffer"];
  var InstancedMesh = moduleValue2["InstancedMesh"];
  var Int16BufferAttribute = moduleValue2["Int16BufferAttribute"];
  var Int32BufferAttribute = moduleValue2["Int32BufferAttribute"];
  var Int8BufferAttribute = moduleValue2["Int8BufferAttribute"];
  var IntType = moduleValue2["IntType"];
  var InterleavedBuffer = moduleValue2["InterleavedBuffer"];
  var InterleavedBufferAttribute = moduleValue2["InterleavedBufferAttribute"];
  var Interpolant = moduleValue2["Interpolant"];
  var InterpolateBezier = moduleValue2["InterpolateBezier"];
  var InterpolateDiscrete = moduleValue2["InterpolateDiscrete"];
  var InterpolateLinear = moduleValue2["InterpolateLinear"];
  var InterpolateSmooth = moduleValue2["InterpolateSmooth"];
  var InterpolationSamplingMode = moduleValue2["InterpolationSamplingMode"];
  var InterpolationSamplingType = moduleValue2["InterpolationSamplingType"];
  var InvertStencilOp = moduleValue2["InvertStencilOp"];
  var KeepStencilOp = moduleValue2["KeepStencilOp"];
  var KeyframeTrack = moduleValue2["KeyframeTrack"];
  var LOD = moduleValue2["LOD"];
  var LatheGeometry = moduleValue2["LatheGeometry"];
  var Layers = moduleValue2["Layers"];
  var LessCompare = moduleValue2["LessCompare"];
  var LessDepth = moduleValue2["LessDepth"];
  var LessEqualCompare = moduleValue2["LessEqualCompare"];
  var LessEqualDepth = moduleValue2["LessEqualDepth"];
  var LessEqualStencilFunc = moduleValue2["LessEqualStencilFunc"];
  var LessStencilFunc = moduleValue2["LessStencilFunc"];
  var Light = moduleValue2["Light"];
  var LightProbe = moduleValue2["LightProbe"];
  var Line = moduleValue2["Line"];
  var Line3 = moduleValue2["Line3"];
  var LineBasicMaterial = moduleValue2["LineBasicMaterial"];
  var LineCurve = moduleValue2["LineCurve"];
  var LineCurve3 = moduleValue2["LineCurve3"];
  var LineDashedMaterial = moduleValue2["LineDashedMaterial"];
  var LineLoop = moduleValue2["LineLoop"];
  var LineSegments = moduleValue2["LineSegments"];
  var LinearFilter = moduleValue2["LinearFilter"];
  var LinearInterpolant = moduleValue2["LinearInterpolant"];
  var LinearMipMapLinearFilter = moduleValue2["LinearMipMapLinearFilter"];
  var LinearMipMapNearestFilter = moduleValue2["LinearMipMapNearestFilter"];
  var LinearMipmapLinearFilter = moduleValue2["LinearMipmapLinearFilter"];
  var LinearMipmapNearestFilter = moduleValue2["LinearMipmapNearestFilter"];
  var LinearSRGBColorSpace = moduleValue2["LinearSRGBColorSpace"];
  var LinearToneMapping = moduleValue2["LinearToneMapping"];
  var LinearTransfer = moduleValue2["LinearTransfer"];
  var Loader = moduleValue2["Loader"];
  var LoaderUtils = moduleValue2["LoaderUtils"];
  var LoadingManager = moduleValue2["LoadingManager"];
  var LoopOnce = moduleValue2["LoopOnce"];
  var LoopPingPong = moduleValue2["LoopPingPong"];
  var LoopRepeat = moduleValue2["LoopRepeat"];
  var MOUSE = moduleValue2["MOUSE"];
  var Material = moduleValue2["Material"];
  var MaterialBlending = moduleValue2["MaterialBlending"];
  var MaterialLoader = moduleValue2["MaterialLoader"];
  var MathUtils = moduleValue2["MathUtils"];
  var Matrix2 = moduleValue2["Matrix2"];
  var Matrix3 = moduleValue2["Matrix3"];
  var Matrix4 = moduleValue2["Matrix4"];
  var MaxEquation = moduleValue2["MaxEquation"];
  var Mesh = moduleValue2["Mesh"];
  var MeshBasicMaterial = moduleValue2["MeshBasicMaterial"];
  var MeshDepthMaterial = moduleValue2["MeshDepthMaterial"];
  var MeshDistanceMaterial = moduleValue2["MeshDistanceMaterial"];
  var MeshLambertMaterial = moduleValue2["MeshLambertMaterial"];
  var MeshMatcapMaterial = moduleValue2["MeshMatcapMaterial"];
  var MeshNormalMaterial = moduleValue2["MeshNormalMaterial"];
  var MeshPhongMaterial = moduleValue2["MeshPhongMaterial"];
  var MeshPhysicalMaterial = moduleValue2["MeshPhysicalMaterial"];
  var MeshStandardMaterial = moduleValue2["MeshStandardMaterial"];
  var MeshToonMaterial = moduleValue2["MeshToonMaterial"];
  var MinEquation = moduleValue2["MinEquation"];
  var MirroredRepeatWrapping = moduleValue2["MirroredRepeatWrapping"];
  var MixOperation = moduleValue2["MixOperation"];
  var MultiplyBlending = moduleValue2["MultiplyBlending"];
  var MultiplyOperation = moduleValue2["MultiplyOperation"];
  var NearestFilter = moduleValue2["NearestFilter"];
  var NearestMipMapLinearFilter = moduleValue2["NearestMipMapLinearFilter"];
  var NearestMipMapNearestFilter = moduleValue2["NearestMipMapNearestFilter"];
  var NearestMipmapLinearFilter = moduleValue2["NearestMipmapLinearFilter"];
  var NearestMipmapNearestFilter = moduleValue2["NearestMipmapNearestFilter"];
  var NeutralToneMapping = moduleValue2["NeutralToneMapping"];
  var NeverCompare = moduleValue2["NeverCompare"];
  var NeverDepth = moduleValue2["NeverDepth"];
  var NeverStencilFunc = moduleValue2["NeverStencilFunc"];
  var NoBlending = moduleValue2["NoBlending"];
  var NoColorSpace = moduleValue2["NoColorSpace"];
  var NoNormalPacking = moduleValue2["NoNormalPacking"];
  var NoToneMapping = moduleValue2["NoToneMapping"];
  var NormalAnimationBlendMode = moduleValue2["NormalAnimationBlendMode"];
  var NormalBlending = moduleValue2["NormalBlending"];
  var NormalGAPacking = moduleValue2["NormalGAPacking"];
  var NormalRGPacking = moduleValue2["NormalRGPacking"];
  var NotEqualCompare = moduleValue2["NotEqualCompare"];
  var NotEqualDepth = moduleValue2["NotEqualDepth"];
  var NotEqualStencilFunc = moduleValue2["NotEqualStencilFunc"];
  var NumberKeyframeTrack = moduleValue2["NumberKeyframeTrack"];
  var Object3D = moduleValue2["Object3D"];
  var ObjectLoader = moduleValue2["ObjectLoader"];
  var ObjectSpaceNormalMap = moduleValue2["ObjectSpaceNormalMap"];
  var OctahedronGeometry = moduleValue2["OctahedronGeometry"];
  var OneFactor = moduleValue2["OneFactor"];
  var OneMinusConstantAlphaFactor = moduleValue2["OneMinusConstantAlphaFactor"];
  var OneMinusConstantColorFactor = moduleValue2["OneMinusConstantColorFactor"];
  var OneMinusDstAlphaFactor = moduleValue2["OneMinusDstAlphaFactor"];
  var OneMinusDstColorFactor = moduleValue2["OneMinusDstColorFactor"];
  var OneMinusSrcAlphaFactor = moduleValue2["OneMinusSrcAlphaFactor"];
  var OneMinusSrcColorFactor = moduleValue2["OneMinusSrcColorFactor"];
  var OrthographicCamera = moduleValue2["OrthographicCamera"];
  var PCFShadowMap = moduleValue2["PCFShadowMap"];
  var PCFSoftShadowMap = moduleValue2["PCFSoftShadowMap"];
  var PMREMGenerator = moduleValue2["PMREMGenerator"];
  var Path = moduleValue2["Path"];
  var PerspectiveCamera = moduleValue2["PerspectiveCamera"];
  var Plane = moduleValue2["Plane"];
  var PlaneGeometry = moduleValue2["PlaneGeometry"];
  var PlaneHelper = moduleValue2["PlaneHelper"];
  var PointLight = moduleValue2["PointLight"];
  var PointLightHelper = moduleValue2["PointLightHelper"];
  var Points = moduleValue2["Points"];
  var PointsMaterial = moduleValue2["PointsMaterial"];
  var PolarGridHelper = moduleValue2["PolarGridHelper"];
  var PolyhedronGeometry = moduleValue2["PolyhedronGeometry"];
  var PositionalAudio = moduleValue2["PositionalAudio"];
  var PropertyBinding = moduleValue2["PropertyBinding"];
  var PropertyMixer = moduleValue2["PropertyMixer"];
  var QuadraticBezierCurve = moduleValue2["QuadraticBezierCurve"];
  var QuadraticBezierCurve3 = moduleValue2["QuadraticBezierCurve3"];
  var Quaternion = moduleValue2["Quaternion"];
  var QuaternionKeyframeTrack = moduleValue2["QuaternionKeyframeTrack"];
  var QuaternionLinearInterpolant = moduleValue2["QuaternionLinearInterpolant"];
  var R11_EAC_Format = moduleValue2["R11_EAC_Format"];
  var RED_GREEN_RGTC2_Format = moduleValue2["RED_GREEN_RGTC2_Format"];
  var RED_RGTC1_Format = moduleValue2["RED_RGTC1_Format"];
  var REVISION = moduleValue2["REVISION"];
  var RG11_EAC_Format = moduleValue2["RG11_EAC_Format"];
  var RGBADepthPacking = moduleValue2["RGBADepthPacking"];
  var RGBAFormat = moduleValue2["RGBAFormat"];
  var RGBAIntegerFormat = moduleValue2["RGBAIntegerFormat"];
  var RGBA_ASTC_10x10_Format = moduleValue2["RGBA_ASTC_10x10_Format"];
  var RGBA_ASTC_10x5_Format = moduleValue2["RGBA_ASTC_10x5_Format"];
  var RGBA_ASTC_10x6_Format = moduleValue2["RGBA_ASTC_10x6_Format"];
  var RGBA_ASTC_10x8_Format = moduleValue2["RGBA_ASTC_10x8_Format"];
  var RGBA_ASTC_12x10_Format = moduleValue2["RGBA_ASTC_12x10_Format"];
  var RGBA_ASTC_12x12_Format = moduleValue2["RGBA_ASTC_12x12_Format"];
  var RGBA_ASTC_4x4_Format = moduleValue2["RGBA_ASTC_4x4_Format"];
  var RGBA_ASTC_5x4_Format = moduleValue2["RGBA_ASTC_5x4_Format"];
  var RGBA_ASTC_5x5_Format = moduleValue2["RGBA_ASTC_5x5_Format"];
  var RGBA_ASTC_6x5_Format = moduleValue2["RGBA_ASTC_6x5_Format"];
  var RGBA_ASTC_6x6_Format = moduleValue2["RGBA_ASTC_6x6_Format"];
  var RGBA_ASTC_8x5_Format = moduleValue2["RGBA_ASTC_8x5_Format"];
  var RGBA_ASTC_8x6_Format = moduleValue2["RGBA_ASTC_8x6_Format"];
  var RGBA_ASTC_8x8_Format = moduleValue2["RGBA_ASTC_8x8_Format"];
  var RGBA_BPTC_Format = moduleValue2["RGBA_BPTC_Format"];
  var RGBA_ETC2_EAC_Format = moduleValue2["RGBA_ETC2_EAC_Format"];
  var RGBA_PVRTC_2BPPV1_Format = moduleValue2["RGBA_PVRTC_2BPPV1_Format"];
  var RGBA_PVRTC_4BPPV1_Format = moduleValue2["RGBA_PVRTC_4BPPV1_Format"];
  var RGBA_S3TC_DXT1_Format = moduleValue2["RGBA_S3TC_DXT1_Format"];
  var RGBA_S3TC_DXT3_Format = moduleValue2["RGBA_S3TC_DXT3_Format"];
  var RGBA_S3TC_DXT5_Format = moduleValue2["RGBA_S3TC_DXT5_Format"];
  var RGBDepthPacking = moduleValue2["RGBDepthPacking"];
  var RGBFormat = moduleValue2["RGBFormat"];
  var RGBIntegerFormat = moduleValue2["RGBIntegerFormat"];
  var RGB_BPTC_SIGNED_Format = moduleValue2["RGB_BPTC_SIGNED_Format"];
  var RGB_BPTC_UNSIGNED_Format = moduleValue2["RGB_BPTC_UNSIGNED_Format"];
  var RGB_ETC1_Format = moduleValue2["RGB_ETC1_Format"];
  var RGB_ETC2_Format = moduleValue2["RGB_ETC2_Format"];
  var RGB_PVRTC_2BPPV1_Format = moduleValue2["RGB_PVRTC_2BPPV1_Format"];
  var RGB_PVRTC_4BPPV1_Format = moduleValue2["RGB_PVRTC_4BPPV1_Format"];
  var RGB_S3TC_DXT1_Format = moduleValue2["RGB_S3TC_DXT1_Format"];
  var RGDepthPacking = moduleValue2["RGDepthPacking"];
  var RGFormat = moduleValue2["RGFormat"];
  var RGIntegerFormat = moduleValue2["RGIntegerFormat"];
  var RawShaderMaterial = moduleValue2["RawShaderMaterial"];
  var Ray = moduleValue2["Ray"];
  var Raycaster = moduleValue2["Raycaster"];
  var RectAreaLight = moduleValue2["RectAreaLight"];
  var RedFormat = moduleValue2["RedFormat"];
  var RedIntegerFormat = moduleValue2["RedIntegerFormat"];
  var ReinhardToneMapping = moduleValue2["ReinhardToneMapping"];
  var RenderTarget = moduleValue2["RenderTarget"];
  var RenderTarget3D = moduleValue2["RenderTarget3D"];
  var RepeatWrapping = moduleValue2["RepeatWrapping"];
  var ReplaceStencilOp = moduleValue2["ReplaceStencilOp"];
  var ReverseSubtractEquation = moduleValue2["ReverseSubtractEquation"];
  var RingGeometry = moduleValue2["RingGeometry"];
  var SIGNED_R11_EAC_Format = moduleValue2["SIGNED_R11_EAC_Format"];
  var SIGNED_RED_GREEN_RGTC2_Format = moduleValue2["SIGNED_RED_GREEN_RGTC2_Format"];
  var SIGNED_RED_RGTC1_Format = moduleValue2["SIGNED_RED_RGTC1_Format"];
  var SIGNED_RG11_EAC_Format = moduleValue2["SIGNED_RG11_EAC_Format"];
  var SRGBColorSpace = moduleValue2["SRGBColorSpace"];
  var SRGBTransfer = moduleValue2["SRGBTransfer"];
  var Scene = moduleValue2["Scene"];
  var ShaderChunk = moduleValue2["ShaderChunk"];
  var ShaderLib = moduleValue2["ShaderLib"];
  var ShaderMaterial = moduleValue2["ShaderMaterial"];
  var ShadowMaterial = moduleValue2["ShadowMaterial"];
  var Shape = moduleValue2["Shape"];
  var ShapeGeometry = moduleValue2["ShapeGeometry"];
  var ShapePath = moduleValue2["ShapePath"];
  var ShapeUtils = moduleValue2["ShapeUtils"];
  var ShortType = moduleValue2["ShortType"];
  var Skeleton = moduleValue2["Skeleton"];
  var SkeletonHelper = moduleValue2["SkeletonHelper"];
  var SkinnedMesh = moduleValue2["SkinnedMesh"];
  var Source = moduleValue2["Source"];
  var Sphere = moduleValue2["Sphere"];
  var SphereGeometry = moduleValue2["SphereGeometry"];
  var Spherical = moduleValue2["Spherical"];
  var SphericalHarmonics3 = moduleValue2["SphericalHarmonics3"];
  var SplineCurve = moduleValue2["SplineCurve"];
  var SpotLight = moduleValue2["SpotLight"];
  var SpotLightHelper = moduleValue2["SpotLightHelper"];
  var Sprite = moduleValue2["Sprite"];
  var SpriteMaterial = moduleValue2["SpriteMaterial"];
  var SrcAlphaFactor = moduleValue2["SrcAlphaFactor"];
  var SrcAlphaSaturateFactor = moduleValue2["SrcAlphaSaturateFactor"];
  var SrcColorFactor = moduleValue2["SrcColorFactor"];
  var StaticCopyUsage = moduleValue2["StaticCopyUsage"];
  var StaticDrawUsage = moduleValue2["StaticDrawUsage"];
  var StaticReadUsage = moduleValue2["StaticReadUsage"];
  var StereoCamera = moduleValue2["StereoCamera"];
  var StreamCopyUsage = moduleValue2["StreamCopyUsage"];
  var StreamDrawUsage = moduleValue2["StreamDrawUsage"];
  var StreamReadUsage = moduleValue2["StreamReadUsage"];
  var StringKeyframeTrack = moduleValue2["StringKeyframeTrack"];
  var SubtractEquation = moduleValue2["SubtractEquation"];
  var SubtractiveBlending = moduleValue2["SubtractiveBlending"];
  var TOUCH = moduleValue2["TOUCH"];
  var TangentSpaceNormalMap = moduleValue2["TangentSpaceNormalMap"];
  var TetrahedronGeometry = moduleValue2["TetrahedronGeometry"];
  var Texture = moduleValue2["Texture"];
  var TextureLoader = moduleValue2["TextureLoader"];
  var TextureUtils = moduleValue2["TextureUtils"];
  var Timer2 = moduleValue2["Timer"];
  var TimestampQuery = moduleValue2["TimestampQuery"];
  var TorusGeometry = moduleValue2["TorusGeometry"];
  var TorusKnotGeometry = moduleValue2["TorusKnotGeometry"];
  var Triangle = moduleValue2["Triangle"];
  var TriangleFanDrawMode = moduleValue2["TriangleFanDrawMode"];
  var TriangleStripDrawMode = moduleValue2["TriangleStripDrawMode"];
  var TrianglesDrawMode = moduleValue2["TrianglesDrawMode"];
  var TubeGeometry = moduleValue2["TubeGeometry"];
  var UVMapping = moduleValue2["UVMapping"];
  var Uint16BufferAttribute = moduleValue2["Uint16BufferAttribute"];
  var Uint32BufferAttribute = moduleValue2["Uint32BufferAttribute"];
  var Uint8BufferAttribute = moduleValue2["Uint8BufferAttribute"];
  var Uint8ClampedBufferAttribute = moduleValue2["Uint8ClampedBufferAttribute"];
  var Uniform = moduleValue2["Uniform"];
  var UniformsGroup = moduleValue2["UniformsGroup"];
  var UniformsLib = moduleValue2["UniformsLib"];
  var UniformsUtils = moduleValue2["UniformsUtils"];
  var UnsignedByteType = moduleValue2["UnsignedByteType"];
  var UnsignedInt101111Type = moduleValue2["UnsignedInt101111Type"];
  var UnsignedInt248Type = moduleValue2["UnsignedInt248Type"];
  var UnsignedInt5999Type = moduleValue2["UnsignedInt5999Type"];
  var UnsignedIntType = moduleValue2["UnsignedIntType"];
  var UnsignedShort4444Type = moduleValue2["UnsignedShort4444Type"];
  var UnsignedShort5551Type = moduleValue2["UnsignedShort5551Type"];
  var UnsignedShortType = moduleValue2["UnsignedShortType"];
  var VSMShadowMap = moduleValue2["VSMShadowMap"];
  var Vector2 = moduleValue2["Vector2"];
  var Vector3 = moduleValue2["Vector3"];
  var Vector4 = moduleValue2["Vector4"];
  var VectorKeyframeTrack = moduleValue2["VectorKeyframeTrack"];
  var VideoFrameTexture = moduleValue2["VideoFrameTexture"];
  var VideoTexture = moduleValue2["VideoTexture"];
  var WebGL3DRenderTarget = moduleValue2["WebGL3DRenderTarget"];
  var WebGLArrayRenderTarget = moduleValue2["WebGLArrayRenderTarget"];
  var WebGLCoordinateSystem = moduleValue2["WebGLCoordinateSystem"];
  var WebGLCubeRenderTarget = moduleValue2["WebGLCubeRenderTarget"];
  var WebGLRenderTarget = moduleValue2["WebGLRenderTarget"];
  var WebGLRenderer = moduleValue2["WebGLRenderer"];
  var WebGLUtils = moduleValue2["WebGLUtils"];
  var WebGPUCoordinateSystem = moduleValue2["WebGPUCoordinateSystem"];
  var WebXRController = moduleValue2["WebXRController"];
  var WireframeGeometry = moduleValue2["WireframeGeometry"];
  var WrapAroundEnding = moduleValue2["WrapAroundEnding"];
  var ZeroCurvatureEnding = moduleValue2["ZeroCurvatureEnding"];
  var ZeroFactor = moduleValue2["ZeroFactor"];
  var ZeroSlopeEnding = moduleValue2["ZeroSlopeEnding"];
  var ZeroStencilOp = moduleValue2["ZeroStencilOp"];
  var createCanvasElement = moduleValue2["createCanvasElement"];
  var error = moduleValue2["error"];
  var getConsoleFunction = moduleValue2["getConsoleFunction"];
  var log = moduleValue2["log"];
  var setConsoleFunction = moduleValue2["setConsoleFunction"];
  var warn = moduleValue2["warn"];
  var warnOnce = moduleValue2["warnOnce"];

  // scripts/.tmp-takram-atmosphere-global-shim.mjs
  var moduleValue3 = window.VRODOS_TAKRAM_ATMOSPHERE || {};
  var AerialPerspectiveEffect = moduleValue3["AerialPerspectiveEffect"];
  var AtmosphereMaterialBase = moduleValue3["AtmosphereMaterialBase"];
  var AtmosphereParameters = moduleValue3["AtmosphereParameters"];
  var DEFAULT_PRECOMPUTED_TEXTURES_URL = moduleValue3["DEFAULT_PRECOMPUTED_TEXTURES_URL"];
  var DEFAULT_STARS_DATA_URL = moduleValue3["DEFAULT_STARS_DATA_URL"];
  var DensityProfileLayer = moduleValue3["DensityProfileLayer"];
  var IRRADIANCE_TEXTURE_HEIGHT = moduleValue3["IRRADIANCE_TEXTURE_HEIGHT"];
  var IRRADIANCE_TEXTURE_WIDTH = moduleValue3["IRRADIANCE_TEXTURE_WIDTH"];
  var LightingMaskPass = moduleValue3["LightingMaskPass"];
  var METER_TO_LENGTH_UNIT = moduleValue3["METER_TO_LENGTH_UNIT"];
  var PrecomputedTexturesGenerator = moduleValue3["PrecomputedTexturesGenerator"];
  var PrecomputedTexturesLoader = moduleValue3["PrecomputedTexturesLoader"];
  var SCATTERING_TEXTURE_DEPTH = moduleValue3["SCATTERING_TEXTURE_DEPTH"];
  var SCATTERING_TEXTURE_HEIGHT = moduleValue3["SCATTERING_TEXTURE_HEIGHT"];
  var SCATTERING_TEXTURE_MU_SIZE = moduleValue3["SCATTERING_TEXTURE_MU_SIZE"];
  var SCATTERING_TEXTURE_MU_S_SIZE = moduleValue3["SCATTERING_TEXTURE_MU_S_SIZE"];
  var SCATTERING_TEXTURE_NU_SIZE = moduleValue3["SCATTERING_TEXTURE_NU_SIZE"];
  var SCATTERING_TEXTURE_R_SIZE = moduleValue3["SCATTERING_TEXTURE_R_SIZE"];
  var SCATTERING_TEXTURE_WIDTH = moduleValue3["SCATTERING_TEXTURE_WIDTH"];
  var SKY_RENDER_ORDER = moduleValue3["SKY_RENDER_ORDER"];
  var SkyLightProbe = moduleValue3["SkyLightProbe"];
  var SkyMaterial = moduleValue3["SkyMaterial"];
  var StarsGeometry = moduleValue3["StarsGeometry"];
  var StarsMaterial = moduleValue3["StarsMaterial"];
  var SunDirectionalLight = moduleValue3["SunDirectionalLight"];
  var TRANSMITTANCE_TEXTURE_HEIGHT = moduleValue3["TRANSMITTANCE_TEXTURE_HEIGHT"];
  var TRANSMITTANCE_TEXTURE_WIDTH = moduleValue3["TRANSMITTANCE_TEXTURE_WIDTH"];
  var XYZ_TO_SRGB = moduleValue3["XYZ_TO_SRGB"];
  var aerialPerspectiveEffectOptionsDefaults = moduleValue3["aerialPerspectiveEffectOptionsDefaults"];
  var atmosphereMaterialParametersBaseDefaults = moduleValue3["atmosphereMaterialParametersBaseDefaults"];
  var fromAstroRotationMatrix = moduleValue3["fromAstroRotationMatrix"];
  var fromAstroVector = moduleValue3["fromAstroVector"];
  var getAltitudeCorrectionOffset = moduleValue3["getAltitudeCorrectionOffset"];
  var getECIToECEFRotationMatrix = moduleValue3["getECIToECEFRotationMatrix"];
  var getMoonDirectionECEF = moduleValue3["getMoonDirectionECEF"];
  var getMoonDirectionECI = moduleValue3["getMoonDirectionECI"];
  var getMoonFixedToECIRotationMatrix = moduleValue3["getMoonFixedToECIRotationMatrix"];
  var getSunDirectionECEF = moduleValue3["getSunDirectionECEF"];
  var getSunDirectionECI = moduleValue3["getSunDirectionECI"];
  var getSunLightColor = moduleValue3["getSunLightColor"];
  var skyLightProbeParametersDefaults = moduleValue3["skyLightProbeParametersDefaults"];
  var skyMaterialParametersDefaults = moduleValue3["skyMaterialParametersDefaults"];
  var starsMaterialParametersDefaults = moduleValue3["starsMaterialParametersDefaults"];
  var sunDirectionalLightParametersDefaults = moduleValue3["sunDirectionalLightParametersDefaults"];
  var toAstroTime = moduleValue3["toAstroTime"];

  // node_modules/@takram/three-geospatial/build/shared.js
  var a = true;
  var n = "Invariant failed";
  function c(i3, r2) {
    if (!i3) {
      if (a)
        throw new Error(n);
      var o2 = typeof r2 == "function" ? r2() : r2, t3 = o2 ? "".concat(n, ": ").concat(o2) : n;
      throw new Error(t3);
    }
  }

  // node_modules/@takram/three-geospatial/build/shared2.js
  var R = "9627216cc50057994c98a2118f3c4a23765d43b9";
  var _ = 'assets/vendor/takram-clouds/stbn.bin';

  // node_modules/@takram/three-geospatial/build/shared3.js
  var $ = /* @__PURE__ */ new Vector3();
  function D(q3, t3, i3 = new Vector3(), s2) {
    var _a;
    const { x: r2, y: e4, z: n4 } = q3, o2 = t3.x, h2 = t3.y, u3 = t3.z, d2 = r2 * r2 * o2, m3 = e4 * e4 * h2, c5 = n4 * n4 * u3, l3 = d2 + m3 + c5, p2 = Math.sqrt(1 / l3);
    if (!Number.isFinite(p2))
      return;
    const w3 = $.copy(q3).multiplyScalar(p2);
    if (l3 < ((_a = s2 == null ? void 0 : s2.centerTolerance) != null ? _a : 0.1))
      return i3.copy(w3);
    const f2 = w3.multiply(t3).multiplyScalar(2);
    let y4 = (1 - p2) * q3.length() / (f2.length() / 2), I3 = 0, x3, M3, g4, v3;
    do {
      y4 -= I3, x3 = 1 / (1 + y4 * o2), M3 = 1 / (1 + y4 * h2), g4 = 1 / (1 + y4 * u3);
      const V = x3 * x3, F3 = M3 * M3, L2 = g4 * g4, G2 = V * x3, j3 = F3 * M3, B = L2 * g4;
      v3 = d2 * V + m3 * F3 + c5 * L2 - 1, I3 = v3 / ((d2 * G2 * o2 + m3 * j3 * h2 + c5 * B * u3) * -2);
    } while (Math.abs(v3) > 1e-12);
    return i3.set(r2 * x3, e4 * M3, n4 * g4);
  }
  var E = /* @__PURE__ */ new Vector3();
  var R2 = /* @__PURE__ */ new Vector3();
  var U = /* @__PURE__ */ new Vector3();
  var b = class b2 {
    constructor(t3, i3, s2) {
      this.radii = new Vector3(t3, i3, s2);
    }
    // TODO: Rename to semiMinorAxis
    get minimumRadius() {
      return Math.min(this.radii.x, this.radii.y, this.radii.z);
    }
    // TODO: Rename to semiMajorAxis
    get maximumRadius() {
      return Math.max(this.radii.x, this.radii.y, this.radii.z);
    }
    get flattening() {
      return 1 - this.minimumRadius / this.maximumRadius;
    }
    get eccentricity() {
      return Math.sqrt(this.eccentricitySquared);
    }
    get eccentricitySquared() {
      const t3 = this.maximumRadius ** 2, i3 = this.minimumRadius ** 2;
      return (t3 - i3) / t3;
    }
    reciprocalRadii(t3 = new Vector3()) {
      const { x: i3, y: s2, z: r2 } = this.radii;
      return t3.set(1 / i3, 1 / s2, 1 / r2);
    }
    reciprocalRadiiSquared(t3 = new Vector3()) {
      const { x: i3, y: s2, z: r2 } = this.radii;
      return t3.set(1 / i3 ** 2, 1 / s2 ** 2, 1 / r2 ** 2);
    }
    projectOnSurface(t3, i3 = new Vector3(), s2) {
      return D(
        t3,
        this.reciprocalRadiiSquared(),
        i3,
        s2
      );
    }
    getSurfaceNormal(t3, i3 = new Vector3()) {
      return i3.multiplyVectors(this.reciprocalRadiiSquared(E), t3).normalize();
    }
    getEastNorthUpVectors(t3, i3 = new Vector3(), s2 = new Vector3(), r2 = new Vector3()) {
      this.getSurfaceNormal(t3, r2), i3.set(-t3.y, t3.x, 0).normalize(), s2.crossVectors(r2, i3).normalize();
    }
    getEastNorthUpFrame(t3, i3 = new Matrix4()) {
      const s2 = E, r2 = R2, e4 = U;
      return this.getEastNorthUpVectors(t3, s2, r2, e4), i3.makeBasis(s2, r2, e4).setPosition(t3);
    }
    getNorthUpEastFrame(t3, i3 = new Matrix4()) {
      const s2 = E, r2 = R2, e4 = U;
      return this.getEastNorthUpVectors(t3, s2, r2, e4), i3.makeBasis(r2, e4, s2).setPosition(t3);
    }
    getIntersection(t3, i3 = new Vector3()) {
      const s2 = this.reciprocalRadii(E), r2 = R2.copy(s2).multiply(t3.origin), e4 = U.copy(s2).multiply(t3.direction), n4 = r2.lengthSq(), o2 = e4.lengthSq(), h2 = r2.dot(e4), u3 = h2 ** 2 - o2 * (n4 - 1);
      if (n4 === 1)
        return i3.copy(t3.origin);
      if (n4 > 1) {
        if (h2 >= 0 || u3 < 0)
          return;
        const d2 = Math.sqrt(u3), m3 = (-h2 - d2) / o2, c5 = (-h2 + d2) / o2;
        return t3.at(Math.min(m3, c5), i3);
      }
      if (n4 < 1) {
        const d2 = h2 ** 2 - o2 * (n4 - 1), m3 = Math.sqrt(d2), c5 = (-h2 + m3) / o2;
        return t3.at(c5, i3);
      }
      if (h2 < 0)
        return t3.at(-h2 / o2, i3);
    }
    getOsculatingSphereCenter(t3, i3, s2 = new Vector3()) {
      c(this.radii.x === this.radii.y);
      const r2 = this.radii.x ** 2, e4 = this.radii.z ** 2, n4 = E.set(
        t3.x / r2,
        t3.y / r2,
        t3.z / e4
      ).normalize();
      return s2.copy(n4.multiplyScalar(-i3).add(t3));
    }
    getNormalAtHorizon(t3, i3, s2 = new Vector3()) {
      c(this.radii.x === this.radii.y);
      const r2 = this.radii.x ** 2, e4 = this.radii.z ** 2, n4 = t3, o2 = i3;
      let h2 = (n4.x * o2.x + n4.y * o2.y) / r2 + n4.z * o2.z / e4;
      h2 /= (n4.x ** 2 + n4.y ** 2) / r2 + n4.z ** 2 / e4;
      const u3 = E.copy(o2).multiplyScalar(-h2).add(t3);
      return s2.set(u3.x / r2, u3.y / r2, u3.z / e4).normalize();
    }
  };
  b.WGS84 = /* @__PURE__ */ new b(
    6378137,
    6378137,
    6356752314245179e-9
  );
  var N = b;
  var A = /* @__PURE__ */ new Vector3();
  var P = /* @__PURE__ */ new Vector3();
  var z = class z2 {
    constructor(t3 = 0, i3 = 0, s2 = 0) {
      this.longitude = t3, this.latitude = i3, this.height = s2;
    }
    set(t3, i3, s2) {
      return this.longitude = t3, this.latitude = i3, s2 != null && (this.height = s2), this;
    }
    clone() {
      return new z2(this.longitude, this.latitude, this.height);
    }
    copy(t3) {
      return this.longitude = t3.longitude, this.latitude = t3.latitude, this.height = t3.height, this;
    }
    equals(t3) {
      return t3.longitude === this.longitude && t3.latitude === this.latitude && t3.height === this.height;
    }
    setLongitude(t3) {
      return this.longitude = t3, this;
    }
    setLatitude(t3) {
      return this.latitude = t3, this;
    }
    setHeight(t3) {
      return this.height = t3, this;
    }
    normalize() {
      return this.longitude < z2.MIN_LONGITUDE && (this.longitude += Math.PI * 2), this;
    }
    // See: https://en.wikipedia.org/wiki/Geographic_coordinate_conversion
    // Reference: https://github.com/CesiumGS/cesium/blob/1.122/packages/engine/Source/Core/Geodetic.js#L119
    setFromECEF(t3, i3) {
      var _a;
      const r2 = ((_a = i3 == null ? void 0 : i3.ellipsoid) != null ? _a : N.WGS84).reciprocalRadiiSquared(A), e4 = D(
        t3,
        r2,
        P,
        i3
      );
      if (e4 == null)
        throw new Error(
          `Could not project position to ellipsoid surface: ${t3.toArray()}`
        );
      const n4 = A.multiplyVectors(e4, r2).normalize();
      this.longitude = Math.atan2(n4.y, n4.x), this.latitude = Math.asin(n4.z);
      const o2 = A.subVectors(t3, e4);
      return this.height = Math.sign(o2.dot(t3)) * o2.length(), this;
    }
    // See: https://en.wikipedia.org/wiki/Geographic_coordinate_conversion
    // Reference: https://github.com/CesiumGS/cesium/blob/1.122/packages/engine/Source/Core/Cartesian3.js#L916
    toECEF(t3 = new Vector3(), i3) {
      var _a;
      const s2 = (_a = i3 == null ? void 0 : i3.ellipsoid) != null ? _a : N.WGS84, r2 = A.multiplyVectors(
        s2.radii,
        s2.radii
      ), e4 = Math.cos(this.latitude), n4 = P.set(
        e4 * Math.cos(this.longitude),
        e4 * Math.sin(this.longitude),
        Math.sin(this.latitude)
      ).normalize();
      return t3.multiplyVectors(r2, n4), t3.divideScalar(Math.sqrt(n4.dot(t3))).add(n4.multiplyScalar(this.height));
    }
    fromArray(t3, i3 = 0) {
      return this.longitude = t3[i3], this.latitude = t3[i3 + 1], this.height = t3[i3 + 2], this;
    }
    toArray(t3 = [], i3 = 0) {
      return t3[i3] = this.longitude, t3[i3 + 1] = this.latitude, t3[i3 + 2] = this.height, t3;
    }
    *[Symbol.iterator]() {
      yield this.longitude, yield this.latitude, yield this.height;
    }
  };
  z.MIN_LONGITUDE = -Math.PI, z.MAX_LONGITUDE = Math.PI, z.MIN_LATITUDE = -Math.PI / 2, z.MAX_LATITUDE = Math.PI / 2;
  var C = z;

  // node_modules/@takram/three-geospatial/build/index.js
  var on = "This is not an object";
  var cn = "This is not a Float16Array object";
  var qt = "This constructor is not a subclass of Float16Array";
  var pe = "The constructor property value is not an object";
  var an = "Species constructor didn't return TypedArray object";
  var hn = "Derived constructor created TypedArray object which was too small length";
  var J = "Attempting to access detached ArrayBuffer";
  var Pt = "Cannot convert undefined or null to object";
  var xt = "Cannot mix BigInt and other types, use explicit conversions";
  var kt = "@@iterator property is not callable";
  var Jt = "Reduce of empty array with no initial value";
  var fn = "The comparison function must be either a function or undefined";
  var St = "Offset is out of bounds";
  function g(e4) {
    return (t3, ...n4) => S2(e4, t3, n4);
  }
  function H(e4, t3) {
    return g(
      v(
        e4,
        t3
      ).get
    );
  }
  var {
    apply: S2,
    construct: q,
    defineProperty: $t,
    get: mt,
    getOwnPropertyDescriptor: v,
    getPrototypeOf: tt,
    has: Nt,
    ownKeys: Ae,
    set: Qt,
    setPrototypeOf: ge
  } = Reflect;
  var ln = Proxy;
  var {
    EPSILON: un,
    MAX_SAFE_INTEGER: Zt,
    isFinite: we,
    isNaN: G
  } = Number;
  var {
    iterator: x,
    species: yn,
    toStringTag: Mt,
    for: dn
  } = Symbol;
  var j = Object;
  var {
    create: At,
    defineProperty: et,
    freeze: pn,
    is: Kt
  } = j;
  var Lt = j.prototype;
  var An = (
    /** @type {any} */
    Lt.__lookupGetter__ ? g(
      /** @type {any} */
      Lt.__lookupGetter__
    ) : (e4, t3) => {
      if (e4 == null)
        throw w(
          Pt
        );
      let n4 = j(e4);
      do {
        const r2 = v(n4, t3);
        if (r2 !== void 0)
          return R3(r2, "get") ? r2.get : void 0;
      } while ((n4 = tt(n4)) !== null);
    }
  );
  var R3 = (
    /** @type {any} */
    j.hasOwn || g(Lt.hasOwnProperty)
  );
  var Te = Array;
  var be = Te.isArray;
  var gt = Te.prototype;
  var gn = g(gt.join);
  var wn = g(gt.push);
  var Tn = g(
    gt.toLocaleString
  );
  var Bt = gt[x];
  var bn = g(Bt);
  var {
    abs: Sn,
    trunc: Se
  } = Math;
  var wt = ArrayBuffer;
  var mn = wt.isView;
  var me = wt.prototype;
  var _n = g(me.slice);
  var En = H(me, "byteLength");
  var Rt = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : null;
  var In = Rt && H(Rt.prototype, "byteLength");
  var Ft = tt(Uint8Array);
  var On = Ft.from;
  var b3 = Ft.prototype;
  var Pn = b3[x];
  var xn = g(b3.keys);
  var Nn = g(
    b3.values
  );
  var Ln = g(
    b3.entries
  );
  var Rn = g(b3.set);
  var te = g(
    b3.reverse
  );
  var Un = g(b3.fill);
  var Cn = g(
    b3.copyWithin
  );
  var ee = g(b3.sort);
  var Y = g(b3.slice);
  var Mn = g(
    b3.subarray
  );
  var T = H(
    b3,
    "buffer"
  );
  var C2 = H(
    b3,
    "byteOffset"
  );
  var y2 = H(
    b3,
    "length"
  );
  var _e = H(
    b3,
    Mt
  );
  var Bn = Uint8Array;
  var m = Uint16Array;
  var ne = (...e4) => S2(On, m, e4);
  var Dt = Uint32Array;
  var Fn = Float32Array;
  var M = tt([][x]());
  var Tt = g(M.next);
  var Dn = g((function* () {
  })().next);
  var vn = tt(M);
  var Gn = DataView.prototype;
  var jn = g(
    Gn.getUint16
  );
  var w = TypeError;
  var _t = RangeError;
  var Ee = WeakSet;
  var Ie = Ee.prototype;
  var zn = g(Ie.add);
  var Hn = g(Ie.has);
  var bt = WeakMap;
  var vt = bt.prototype;
  var at = g(vt.get);
  var Wn = g(vt.has);
  var Gt = g(vt.set);
  var Oe = new bt();
  var Vn = At(null, {
    next: {
      value: function() {
        const t3 = at(Oe, this);
        return Tt(t3);
      }
    },
    [x]: {
      value: function() {
        return this;
      }
    }
  });
  function k(e4) {
    if (e4[x] === Bt && M.next === Tt)
      return e4;
    const t3 = At(Vn);
    return Gt(Oe, t3, bn(e4)), t3;
  }
  var Pe = new bt();
  var xe = At(vn, {
    next: {
      value: function() {
        const t3 = at(Pe, this);
        return Dn(t3);
      },
      writable: true,
      configurable: true
    }
  });
  for (const e4 of Ae(M))
    e4 !== "next" && et(xe, e4, v(M, e4));
  function re(e4) {
    const t3 = At(xe);
    return Gt(Pe, t3, e4), t3;
  }
  function ht(e4) {
    return e4 !== null && typeof e4 == "object" || typeof e4 == "function";
  }
  function se(e4) {
    return e4 !== null && typeof e4 == "object";
  }
  function ft(e4) {
    return _e(e4) !== void 0;
  }
  function Ut(e4) {
    const t3 = _e(e4);
    return t3 === "BigInt64Array" || t3 === "BigUint64Array";
  }
  function Yn(e4) {
    try {
      return be(e4) ? false : (En(
        /** @type {any} */
        e4
      ), true);
    } catch {
      return false;
    }
  }
  function Ne(e4) {
    if (Rt === null)
      return false;
    try {
      return In(
        /** @type {any} */
        e4
      ), true;
    } catch {
      return false;
    }
  }
  function Xn(e4) {
    return Yn(e4) || Ne(e4);
  }
  function oe(e4) {
    return be(e4) ? e4[x] === Bt && M.next === Tt : false;
  }
  function qn(e4) {
    return ft(e4) ? e4[x] === Pn && M.next === Tt : false;
  }
  function nt(e4) {
    if (typeof e4 != "string")
      return false;
    const t3 = +e4;
    return e4 !== t3 + "" || !we(t3) ? false : t3 === Se(t3);
  }
  var lt = dn("__Float16Array__");
  function kn(e4) {
    if (!se(e4))
      return false;
    const t3 = tt(e4);
    if (!se(t3))
      return false;
    const n4 = t3.constructor;
    if (n4 === void 0)
      return false;
    if (!ht(n4))
      throw w(pe);
    return Nt(n4, lt);
  }
  var Ct = 1 / un;
  function Jn(e4) {
    return e4 + Ct - Ct;
  }
  var Le = 6103515625e-14;
  var $n = 65504;
  var Re = 9765625e-10;
  var ie = Re * Le;
  var Qn = Re * Ct;
  function Zn(e4) {
    const t3 = +e4;
    if (!we(t3) || t3 === 0)
      return t3;
    const n4 = t3 > 0 ? 1 : -1, r2 = Sn(t3);
    if (r2 < Le)
      return n4 * Jn(r2 / ie) * ie;
    const o2 = (1 + Qn) * r2, s2 = o2 - (o2 - r2);
    return s2 > $n || G(s2) ? n4 * (1 / 0) : n4 * s2;
  }
  var Ue = new wt(4);
  var Ce = new Fn(Ue);
  var Me = new Dt(Ue);
  var E3 = new m(512);
  var I = new Bn(512);
  for (let e4 = 0; e4 < 256; ++e4) {
    const t3 = e4 - 127;
    t3 < -24 ? (E3[e4] = 0, E3[e4 | 256] = 32768, I[e4] = 24, I[e4 | 256] = 24) : t3 < -14 ? (E3[e4] = 1024 >> -t3 - 14, E3[e4 | 256] = 1024 >> -t3 - 14 | 32768, I[e4] = -t3 - 1, I[e4 | 256] = -t3 - 1) : t3 <= 15 ? (E3[e4] = t3 + 15 << 10, E3[e4 | 256] = t3 + 15 << 10 | 32768, I[e4] = 13, I[e4 | 256] = 13) : t3 < 128 ? (E3[e4] = 31744, E3[e4 | 256] = 64512, I[e4] = 24, I[e4 | 256] = 24) : (E3[e4] = 31744, E3[e4 | 256] = 64512, I[e4] = 13, I[e4 | 256] = 13);
  }
  function P2(e4) {
    Ce[0] = Zn(e4);
    const t3 = Me[0], n4 = t3 >> 23 & 511;
    return E3[n4] + ((t3 & 8388607) >> I[n4]);
  }
  var jt = new Dt(2048);
  for (let e4 = 1; e4 < 1024; ++e4) {
    let t3 = e4 << 13, n4 = 0;
    for (; (t3 & 8388608) === 0; )
      t3 <<= 1, n4 -= 8388608;
    t3 &= -8388609, n4 += 947912704, jt[e4] = t3 | n4;
  }
  for (let e4 = 1024; e4 < 2048; ++e4)
    jt[e4] = 939524096 + (e4 - 1024 << 13);
  var W = new Dt(64);
  for (let e4 = 1; e4 < 31; ++e4)
    W[e4] = e4 << 23;
  W[31] = 1199570944;
  W[32] = 2147483648;
  for (let e4 = 33; e4 < 63; ++e4)
    W[e4] = 2147483648 + (e4 - 32 << 23);
  W[63] = 3347054592;
  var Be = new m(64);
  for (let e4 = 1; e4 < 64; ++e4)
    e4 !== 32 && (Be[e4] = 1024);
  function p(e4) {
    const t3 = e4 >> 10;
    return Me[0] = jt[Be[t3] + (e4 & 1023)] + W[t3], Ce[0];
  }
  function L(e4) {
    const t3 = +e4;
    return G(t3) || t3 === 0 ? 0 : Se(t3);
  }
  function Et(e4) {
    const t3 = L(e4);
    return t3 < 0 ? 0 : t3 < Zt ? t3 : Zt;
  }
  function rt(e4, t3) {
    if (!ht(e4))
      throw w(on);
    const n4 = e4.constructor;
    if (n4 === void 0)
      return t3;
    if (!ht(n4))
      throw w(pe);
    const r2 = n4[yn];
    return r2 != null ? r2 : t3;
  }
  function $2(e4) {
    if (Ne(e4))
      return false;
    try {
      return _n(e4, 0, 0), false;
    } catch {
    }
    return true;
  }
  function ce(e4, t3) {
    const n4 = G(e4), r2 = G(t3);
    if (n4 && r2)
      return 0;
    if (n4)
      return 1;
    if (r2 || e4 < t3)
      return -1;
    if (e4 > t3)
      return 1;
    if (e4 === 0 && t3 === 0) {
      const o2 = Kt(e4, 0), s2 = Kt(t3, 0);
      if (!o2 && s2)
        return -1;
      if (o2 && !s2)
        return 1;
    }
    return 0;
  }
  var zt = 2;
  var ut = new bt();
  function D2(e4) {
    return Wn(ut, e4) || !mn(e4) && kn(e4);
  }
  function u(e4) {
    if (!D2(e4))
      throw w(cn);
  }
  function st(e4, t3) {
    const n4 = D2(e4), r2 = ft(e4);
    if (!n4 && !r2)
      throw w(an);
    if (typeof t3 == "number") {
      let o2;
      if (n4) {
        const s2 = l(e4);
        o2 = y2(s2);
      } else
        o2 = y2(e4);
      if (o2 < t3)
        throw w(
          hn
        );
    }
    if (Ut(e4))
      throw w(xt);
  }
  function l(e4) {
    const t3 = at(ut, e4);
    if (t3 !== void 0) {
      const o2 = T(t3);
      if ($2(o2))
        throw w(J);
      return t3;
    }
    const n4 = (
      /** @type {any} */
      e4.buffer
    );
    if ($2(n4))
      throw w(J);
    const r2 = q(A3, [
      n4,
      /** @type {any} */
      e4.byteOffset,
      /** @type {any} */
      e4.length
    ], e4.constructor);
    return at(ut, r2);
  }
  function ae(e4) {
    const t3 = y2(e4), n4 = [];
    for (let r2 = 0; r2 < t3; ++r2)
      n4[r2] = p(e4[r2]);
    return n4;
  }
  var Fe = new Ee();
  for (const e4 of Ae(b3)) {
    if (e4 === Mt)
      continue;
    const t3 = v(b3, e4);
    R3(t3, "get") && typeof t3.get == "function" && zn(Fe, t3.get);
  }
  var Kn = pn(
    /** @type {ProxyHandler<Float16BitsArray>} */
    {
      get(e4, t3, n4) {
        return nt(t3) && R3(e4, t3) ? p(mt(e4, t3)) : Hn(Fe, An(e4, t3)) ? mt(e4, t3) : mt(e4, t3, n4);
      },
      set(e4, t3, n4, r2) {
        return nt(t3) && R3(e4, t3) ? Qt(e4, t3, P2(n4)) : Qt(e4, t3, n4, r2);
      },
      getOwnPropertyDescriptor(e4, t3) {
        if (nt(t3) && R3(e4, t3)) {
          const n4 = v(e4, t3);
          return n4.value = p(n4.value), n4;
        }
        return v(e4, t3);
      },
      defineProperty(e4, t3, n4) {
        return nt(t3) && R3(e4, t3) && R3(n4, "value") && (n4.value = P2(n4.value)), $t(e4, t3, n4);
      }
    }
  );
  var A3 = class _A {
    /** @see https://tc39.es/ecma262/#sec-typedarray */
    constructor(t3, n4, r2) {
      let o2;
      if (D2(t3))
        o2 = q(m, [l(t3)], new.target);
      else if (ht(t3) && !Xn(t3)) {
        let i3, c5;
        if (ft(t3)) {
          i3 = t3, c5 = y2(t3);
          const a2 = T(t3);
          if ($2(a2))
            throw w(J);
          if (Ut(t3))
            throw w(xt);
          const h2 = new wt(
            c5 * zt
          );
          o2 = q(m, [h2], new.target);
        } else {
          const a2 = t3[x];
          if (a2 != null && typeof a2 != "function")
            throw w(kt);
          a2 != null ? oe(t3) ? (i3 = t3, c5 = t3.length) : (i3 = [.../** @type {Iterable<unknown>} */
          t3], c5 = i3.length) : (i3 = /** @type {ArrayLike<unknown>} */
          t3, c5 = Et(i3.length)), o2 = q(m, [c5], new.target);
        }
        for (let a2 = 0; a2 < c5; ++a2)
          o2[a2] = P2(i3[a2]);
      } else
        o2 = q(m, arguments, new.target);
      const s2 = (
        /** @type {any} */
        new ln(o2, Kn)
      );
      return Gt(ut, s2, o2), s2;
    }
    /**
     * limitation: `Object.getOwnPropertyNames(Float16Array)` or `Reflect.ownKeys(Float16Array)` include this key
     * @see https://tc39.es/ecma262/#sec-%typedarray%.from
     */
    static from(t3, ...n4) {
      const r2 = this;
      if (!Nt(r2, lt))
        throw w(
          qt
        );
      if (r2 === _A) {
        if (D2(t3) && n4.length === 0) {
          const f2 = l(t3), d2 = new m(
            T(f2),
            C2(f2),
            y2(f2)
          );
          return new _A(
            T(Y(d2))
          );
        }
        if (n4.length === 0)
          return new _A(
            T(
              ne(t3, P2)
            )
          );
        const a2 = n4[0], h2 = n4[1];
        return new _A(
          T(
            ne(t3, function(f2, ...d2) {
              return P2(
                S2(a2, this, [f2, ...k(d2)])
              );
            }, h2)
          )
        );
      }
      let o2, s2;
      const i3 = t3[x];
      if (i3 != null && typeof i3 != "function")
        throw w(kt);
      if (i3 != null)
        oe(t3) ? (o2 = t3, s2 = t3.length) : qn(t3) ? (o2 = t3, s2 = y2(t3)) : (o2 = [...t3], s2 = o2.length);
      else {
        if (t3 == null)
          throw w(
            Pt
          );
        o2 = j(t3), s2 = Et(o2.length);
      }
      const c5 = new r2(s2);
      if (n4.length === 0)
        for (let a2 = 0; a2 < s2; ++a2)
          c5[a2] = /** @type {number} */
          o2[a2];
      else {
        const a2 = n4[0], h2 = n4[1];
        for (let f2 = 0; f2 < s2; ++f2)
          c5[f2] = S2(a2, h2, [o2[f2], f2]);
      }
      return c5;
    }
    /**
     * limitation: `Object.getOwnPropertyNames(Float16Array)` or `Reflect.ownKeys(Float16Array)` include this key
     * @see https://tc39.es/ecma262/#sec-%typedarray%.of
     */
    static of(...t3) {
      const n4 = this;
      if (!Nt(n4, lt))
        throw w(
          qt
        );
      const r2 = t3.length;
      if (n4 === _A) {
        const s2 = new _A(r2), i3 = l(s2);
        for (let c5 = 0; c5 < r2; ++c5)
          i3[c5] = P2(t3[c5]);
        return s2;
      }
      const o2 = new n4(r2);
      for (let s2 = 0; s2 < r2; ++s2)
        o2[s2] = t3[s2];
      return o2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.keys */
    keys() {
      u(this);
      const t3 = l(this);
      return xn(t3);
    }
    /**
     * limitation: returns a object whose prototype is not `%ArrayIteratorPrototype%`
     * @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.values
     */
    values() {
      u(this);
      const t3 = l(this);
      return re((function* () {
        for (const n4 of Nn(t3))
          yield p(n4);
      })());
    }
    /**
     * limitation: returns a object whose prototype is not `%ArrayIteratorPrototype%`
     * @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.entries
     */
    entries() {
      u(this);
      const t3 = l(this);
      return re((function* () {
        for (const [n4, r2] of Ln(t3))
          yield (
            /** @type {[number, number]} */
            [n4, p(r2)]
          );
      })());
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.at */
    at(t3) {
      u(this);
      const n4 = l(this), r2 = y2(n4), o2 = L(t3), s2 = o2 >= 0 ? o2 : r2 + o2;
      if (!(s2 < 0 || s2 >= r2))
        return p(n4[s2]);
    }
    /** @see https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.with */
    with(t3, n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = L(t3), i3 = s2 >= 0 ? s2 : o2 + s2, c5 = +n4;
      if (i3 < 0 || i3 >= o2)
        throw _t(St);
      const a2 = new m(
        T(r2),
        C2(r2),
        y2(r2)
      ), h2 = new _A(
        T(
          Y(a2)
        )
      ), f2 = l(h2);
      return f2[i3] = P2(c5), h2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.map */
    map(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0], i3 = rt(r2, _A);
      if (i3 === _A) {
        const a2 = new _A(o2), h2 = l(a2);
        for (let f2 = 0; f2 < o2; ++f2) {
          const d2 = p(r2[f2]);
          h2[f2] = P2(
            S2(t3, s2, [d2, f2, this])
          );
        }
        return a2;
      }
      const c5 = new i3(o2);
      st(c5, o2);
      for (let a2 = 0; a2 < o2; ++a2) {
        const h2 = p(r2[a2]);
        c5[a2] = S2(t3, s2, [h2, a2, this]);
      }
      return (
        /** @type {any} */
        c5
      );
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.filter */
    filter(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0], i3 = [];
      for (let h2 = 0; h2 < o2; ++h2) {
        const f2 = p(r2[h2]);
        S2(t3, s2, [f2, h2, this]) && wn(i3, f2);
      }
      const c5 = rt(r2, _A), a2 = new c5(i3);
      return st(a2), /** @type {any} */
      a2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.reduce */
    reduce(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2);
      if (o2 === 0 && n4.length === 0)
        throw w(Jt);
      let s2, i3;
      n4.length === 0 ? (s2 = p(r2[0]), i3 = 1) : (s2 = n4[0], i3 = 0);
      for (let c5 = i3; c5 < o2; ++c5)
        s2 = t3(
          s2,
          p(r2[c5]),
          c5,
          this
        );
      return s2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.reduceright */
    reduceRight(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2);
      if (o2 === 0 && n4.length === 0)
        throw w(Jt);
      let s2, i3;
      n4.length === 0 ? (s2 = p(r2[o2 - 1]), i3 = o2 - 2) : (s2 = n4[0], i3 = o2 - 1);
      for (let c5 = i3; c5 >= 0; --c5)
        s2 = t3(
          s2,
          p(r2[c5]),
          c5,
          this
        );
      return s2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.foreach */
    forEach(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = 0; i3 < o2; ++i3)
        S2(t3, s2, [
          p(r2[i3]),
          i3,
          this
        ]);
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.find */
    find(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = 0; i3 < o2; ++i3) {
        const c5 = p(r2[i3]);
        if (S2(t3, s2, [c5, i3, this]))
          return c5;
      }
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.findindex */
    findIndex(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = 0; i3 < o2; ++i3) {
        const c5 = p(r2[i3]);
        if (S2(t3, s2, [c5, i3, this]))
          return i3;
      }
      return -1;
    }
    /** @see https://tc39.es/proposal-array-find-from-last/index.html#sec-%typedarray%.prototype.findlast */
    findLast(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = o2 - 1; i3 >= 0; --i3) {
        const c5 = p(r2[i3]);
        if (S2(t3, s2, [c5, i3, this]))
          return c5;
      }
    }
    /** @see https://tc39.es/proposal-array-find-from-last/index.html#sec-%typedarray%.prototype.findlastindex */
    findLastIndex(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = o2 - 1; i3 >= 0; --i3) {
        const c5 = p(r2[i3]);
        if (S2(t3, s2, [c5, i3, this]))
          return i3;
      }
      return -1;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.every */
    every(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = 0; i3 < o2; ++i3)
        if (!S2(t3, s2, [
          p(r2[i3]),
          i3,
          this
        ]))
          return false;
      return true;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.some */
    some(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2), s2 = n4[0];
      for (let i3 = 0; i3 < o2; ++i3)
        if (S2(t3, s2, [
          p(r2[i3]),
          i3,
          this
        ]))
          return true;
      return false;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.set */
    set(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = L(n4[0]);
      if (o2 < 0)
        throw _t(St);
      if (t3 == null)
        throw w(
          Pt
        );
      if (Ut(t3))
        throw w(
          xt
        );
      if (D2(t3))
        return Rn(
          l(this),
          l(t3),
          o2
        );
      if (ft(t3)) {
        const a2 = T(t3);
        if ($2(a2))
          throw w(J);
      }
      const s2 = y2(r2), i3 = j(t3), c5 = Et(i3.length);
      if (o2 === 1 / 0 || c5 + o2 > s2)
        throw _t(St);
      for (let a2 = 0; a2 < c5; ++a2)
        r2[a2 + o2] = P2(i3[a2]);
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.reverse */
    reverse() {
      u(this);
      const t3 = l(this);
      return te(t3), this;
    }
    /** @see https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.toReversed */
    toReversed() {
      u(this);
      const t3 = l(this), n4 = new m(
        T(t3),
        C2(t3),
        y2(t3)
      ), r2 = new _A(
        T(
          Y(n4)
        )
      ), o2 = l(r2);
      return te(o2), r2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.fill */
    fill(t3, ...n4) {
      u(this);
      const r2 = l(this);
      return Un(
        r2,
        P2(t3),
        ...k(n4)
      ), this;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.copywithin */
    copyWithin(t3, n4, ...r2) {
      u(this);
      const o2 = l(this);
      return Cn(o2, t3, n4, ...k(r2)), this;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.sort */
    sort(t3) {
      u(this);
      const n4 = l(this), r2 = t3 !== void 0 ? t3 : ce;
      return ee(n4, (o2, s2) => r2(p(o2), p(s2))), this;
    }
    /** @see https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.toSorted */
    toSorted(t3) {
      u(this);
      const n4 = l(this);
      if (t3 !== void 0 && typeof t3 != "function")
        throw new w(fn);
      const r2 = t3 !== void 0 ? t3 : ce, o2 = new m(
        T(n4),
        C2(n4),
        y2(n4)
      ), s2 = new _A(
        T(
          Y(o2)
        )
      ), i3 = l(s2);
      return ee(i3, (c5, a2) => r2(p(c5), p(a2))), s2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.slice */
    slice(t3, n4) {
      u(this);
      const r2 = l(this), o2 = rt(r2, _A);
      if (o2 === _A) {
        const je = new m(
          T(r2),
          C2(r2),
          y2(r2)
        );
        return new _A(
          T(
            Y(je, t3, n4)
          )
        );
      }
      const s2 = y2(r2), i3 = L(t3), c5 = n4 === void 0 ? s2 : L(n4);
      let a2;
      i3 === -1 / 0 ? a2 = 0 : i3 < 0 ? a2 = s2 + i3 > 0 ? s2 + i3 : 0 : a2 = s2 < i3 ? s2 : i3;
      let h2;
      c5 === -1 / 0 ? h2 = 0 : c5 < 0 ? h2 = s2 + c5 > 0 ? s2 + c5 : 0 : h2 = s2 < c5 ? s2 : c5;
      const f2 = h2 - a2 > 0 ? h2 - a2 : 0, d2 = new o2(f2);
      if (st(d2, f2), f2 === 0)
        return d2;
      const O = T(r2);
      if ($2(O))
        throw w(J);
      let F3 = 0;
      for (; a2 < h2; )
        d2[F3] = p(r2[a2]), ++a2, ++F3;
      return (
        /** @type {any} */
        d2
      );
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.subarray */
    subarray(t3, n4) {
      u(this);
      const r2 = l(this), o2 = rt(r2, _A), s2 = new m(
        T(r2),
        C2(r2),
        y2(r2)
      ), i3 = Mn(s2, t3, n4), c5 = new o2(
        T(i3),
        C2(i3),
        y2(i3)
      );
      return st(c5), /** @type {any} */
      c5;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.indexof */
    indexOf(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2);
      let s2 = L(n4[0]);
      if (s2 === 1 / 0)
        return -1;
      s2 < 0 && (s2 += o2, s2 < 0 && (s2 = 0));
      for (let i3 = s2; i3 < o2; ++i3)
        if (R3(r2, i3) && p(r2[i3]) === t3)
          return i3;
      return -1;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.lastindexof */
    lastIndexOf(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2);
      let s2 = n4.length >= 1 ? L(n4[0]) : o2 - 1;
      if (s2 === -1 / 0)
        return -1;
      s2 >= 0 ? s2 = s2 < o2 - 1 ? s2 : o2 - 1 : s2 += o2;
      for (let i3 = s2; i3 >= 0; --i3)
        if (R3(r2, i3) && p(r2[i3]) === t3)
          return i3;
      return -1;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.includes */
    includes(t3, ...n4) {
      u(this);
      const r2 = l(this), o2 = y2(r2);
      let s2 = L(n4[0]);
      if (s2 === 1 / 0)
        return false;
      s2 < 0 && (s2 += o2, s2 < 0 && (s2 = 0));
      const i3 = G(t3);
      for (let c5 = s2; c5 < o2; ++c5) {
        const a2 = p(r2[c5]);
        if (i3 && G(a2) || a2 === t3)
          return true;
      }
      return false;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.join */
    join(t3) {
      u(this);
      const n4 = l(this), r2 = ae(n4);
      return gn(r2, t3);
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.tolocalestring */
    toLocaleString(...t3) {
      u(this);
      const n4 = l(this), r2 = ae(n4);
      return Tn(r2, ...k(t3));
    }
    /** @see https://tc39.es/ecma262/#sec-get-%typedarray%.prototype-@@tostringtag */
    get [Mt]() {
      if (D2(this))
        return (
          /** @type {any} */
          "Float16Array"
        );
    }
  };
  et(A3, "BYTES_PER_ELEMENT", {
    value: zt
  });
  et(A3, lt, {});
  ge(A3, Ft);
  var yt = A3.prototype;
  et(yt, "BYTES_PER_ELEMENT", {
    value: zt
  });
  et(yt, x, {
    value: yt.values,
    writable: true,
    configurable: true
  });
  ge(yt, b3);
  var z3 = MathUtils.clamp;
  var Sr = MathUtils.euclideanModulo;
  var mr = MathUtils.inverseLerp;
  var _r = MathUtils.lerp;
  var Er = MathUtils.degToRad;
  var Ir = MathUtils.radToDeg;
  var Or = MathUtils.isPowerOfTwo;
  var Pr = MathUtils.ceilPowerOfTwo;
  var xr = MathUtils.floorPowerOfTwo;
  var Nr = MathUtils.normalize;
  function Br(e4) {
    return (t3, n4) => {
      t3 instanceof Material ? Object.defineProperty(t3, n4, {
        enumerable: true,
        get() {
          var _a;
          return ((_a = this.defines) == null ? void 0 : _a[e4]) != null;
        },
        set(r2) {
          var _a, _b;
          r2 !== this[n4] && (r2 ? ((_a = this.defines) != null ? _a : this.defines = {}, this.defines[e4] = "1") : (_b = this.defines) == null ? true : delete _b[e4], this.needsUpdate = true);
        }
      }) : Object.defineProperty(t3, n4, {
        enumerable: true,
        get() {
          return this.defines.has(e4);
        },
        set(r2) {
          r2 !== this[n4] && (r2 ? this.defines.set(e4, "1") : this.defines.delete(e4), this.setChanged());
        }
      });
    };
  }
  function he(e4) {
    return typeof e4 == "number" ? Math.floor(e4) : typeof e4 == "string" ? parseInt(e4, 10) : typeof e4 == "boolean" ? +e4 : 0;
  }
  function Fr(e4, {
    min: t3 = Number.MIN_SAFE_INTEGER,
    max: n4 = Number.MAX_SAFE_INTEGER
  } = {}) {
    return (r2, o2) => {
      r2 instanceof Material ? Object.defineProperty(r2, o2, {
        enumerable: true,
        get() {
          var _a;
          const s2 = (_a = this.defines) == null ? void 0 : _a[e4];
          return s2 != null ? he(s2) : 0;
        },
        set(s2) {
          var _a;
          const i3 = this[o2];
          s2 !== i3 && ((_a = this.defines) != null ? _a : this.defines = {}, this.defines[e4] = z3(s2, t3, n4).toFixed(0), this.needsUpdate = true);
        }
      }) : Object.defineProperty(r2, o2, {
        enumerable: true,
        get() {
          const s2 = this.defines.get(e4);
          return s2 != null ? he(s2) : 0;
        },
        set(s2) {
          const i3 = this[o2];
          s2 !== i3 && (this.defines.set(e4, z3(s2, t3, n4).toFixed(0)), this.setChanged());
        }
      });
    };
  }
  function fe(e4) {
    return typeof e4 == "number" ? e4 : typeof e4 == "string" ? parseFloat(e4) : typeof e4 == "boolean" ? +e4 : 0;
  }
  function Dr(e4, {
    min: t3 = -1 / 0,
    max: n4 = 1 / 0,
    precision: r2 = 7
  } = {}) {
    return (o2, s2) => {
      o2 instanceof Material ? Object.defineProperty(o2, s2, {
        enumerable: true,
        get() {
          var _a;
          const i3 = (_a = this.defines) == null ? void 0 : _a[e4];
          return i3 != null ? fe(i3) : 0;
        },
        set(i3) {
          var _a;
          const c5 = this[s2];
          i3 !== c5 && ((_a = this.defines) != null ? _a : this.defines = {}, this.defines[e4] = z3(i3, t3, n4).toFixed(r2), this.needsUpdate = true);
        }
      }) : Object.defineProperty(o2, s2, {
        enumerable: true,
        get() {
          const i3 = this.defines.get(e4);
          return i3 != null ? fe(i3) : 0;
        },
        set(i3) {
          const c5 = this[s2];
          i3 !== c5 && (this.defines.set(e4, z3(i3, t3, n4).toFixed(r2)), this.setChanged());
        }
      });
    };
  }
  function vr(e4, { validate: t3 } = {}) {
    return (n4, r2) => {
      n4 instanceof Material ? Object.defineProperty(n4, r2, {
        enumerable: true,
        get() {
          var _a;
          return (_a = this.defines) == null ? void 0 : _a[e4];
        },
        set(o2) {
          var _a;
          if (o2 !== this[r2]) {
            if ((t3 == null ? void 0 : t3(o2)) === false) {
              console.error(`Expression validation failed: ${o2}`);
              return;
            }
            (_a = this.defines) != null ? _a : this.defines = {}, this.defines[e4] = o2, this.needsUpdate = true;
          }
        }
      }) : Object.defineProperty(n4, r2, {
        enumerable: true,
        get() {
          return this.defines.get(e4);
        },
        set(o2) {
          if (o2 !== this[r2]) {
            if ((t3 == null ? void 0 : t3(o2)) === false) {
              console.error(`Expression validation failed: ${o2}`);
              return;
            }
            this.defines.set(e4, o2), this.setChanged();
          }
        }
      });
    };
  }
  function Gr(e4, ...t3) {
    const n4 = {};
    for (let r2 = 0; r2 < t3.length; r2 += 2) {
      const o2 = t3[r2], s2 = t3[r2 + 1];
      for (const i3 of s2)
        n4[i3] = {
          enumerable: true,
          get: () => o2[i3],
          set: (c5) => {
            o2[i3] = c5;
          }
        };
    }
    return Object.defineProperties(e4, n4), e4;
  }
  function jr(e4, t3, n4) {
    const r2 = {};
    for (const o2 of n4)
      r2[o2] = {
        enumerable: true,
        get: () => t3.uniforms[o2].value,
        set: (s2) => {
          t3.uniforms[o2].value = s2;
        }
      };
    return Object.defineProperties(e4, r2), e4;
  }
  var Q2 = class Q3 {
    constructor(t3 = 0, n4 = 0, r2 = 0, o2 = 0) {
      this.west = t3, this.south = n4, this.east = r2, this.north = o2;
    }
    get width() {
      let t3 = this.east;
      return t3 < this.west && (t3 += Math.PI * 2), t3 - this.west;
    }
    get height() {
      return this.north - this.south;
    }
    set(t3, n4, r2, o2) {
      return this.west = t3, this.south = n4, this.east = r2, this.north = o2, this;
    }
    clone() {
      return new Q3(this.west, this.south, this.east, this.north);
    }
    copy(t3) {
      return this.west = t3.west, this.south = t3.south, this.east = t3.east, this.north = t3.north, this;
    }
    equals(t3) {
      return t3.west === this.west && t3.south === this.south && t3.east === this.east && t3.north === this.north;
    }
    at(t3, n4, r2 = new C()) {
      return r2.set(
        this.west + (this.east - this.west) * t3,
        this.north + (this.south - this.north) * n4
      );
    }
    fromArray(t3, n4 = 0) {
      return this.west = t3[n4], this.south = t3[n4 + 1], this.east = t3[n4 + 2], this.north = t3[n4 + 3], this;
    }
    toArray(t3 = [], n4 = 0) {
      return t3[n4] = this.west, t3[n4 + 1] = this.south, t3[n4 + 2] = this.east, t3[n4 + 3] = this.north, t3;
    }
    *[Symbol.iterator]() {
      yield this.west, yield this.south, yield this.east, yield this.north;
    }
  };
  Q2.MAX = /* @__PURE__ */ new Q2(
    C.MIN_LONGITUDE,
    C.MIN_LATITUDE,
    C.MAX_LONGITUDE,
    C.MAX_LATITUDE
  );
  var cr = /^[ \t]*#include +"([\w\d./]+)"/gm;
  function ar(e4, t3) {
    return e4.replace(cr, (n4, r2) => {
      const s2 = r2.split("/").reduce(
        (i3, c5) => typeof i3 != "string" && i3 != null ? i3[c5] : void 0,
        t3
      );
      if (typeof s2 != "string")
        throw new Error(`Could not find include for ${r2}.`);
      return ar(s2, t3);
    });
  }
  function Zr(e4) {
  }
  var fr = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*(?:i\s*\+\+|\+\+\s*i)\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
  function lr(e4, t3, n4, r2) {
    let o2 = "";
    for (let s2 = parseInt(t3, 10); s2 < parseInt(n4, 10); ++s2)
      o2 += r2.replace(/\[\s*i\s*\]/g, `[${s2}]`).replace(/UNROLLED_LOOP_INDEX/g, `${s2}`);
    return o2;
  }
  function Kr(e4) {
    return e4.replace(fr, lr);
  }

  // node_modules/@takram/three-atmosphere/build/shared3.js
  var e = `// Based on: https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl

/**
 * Copyright (c) 2017 Eric Bruneton
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holders nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Precomputed Atmospheric Scattering
 * Copyright (c) 2008 INRIA
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holders nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

Number ClampCosine(const Number mu) {
  return clamp(mu, Number(-1.0), Number(1.0));
}

Length ClampDistance(const Length d) {
  return max(d, 0.0 * m);
}

Length ClampRadius(const AtmosphereParameters atmosphere, const Length r) {
  return clamp(r, atmosphere.bottom_radius, atmosphere.top_radius);
}

Length SafeSqrt(const Area a) {
  return sqrt(max(a, 0.0 * m2));
}

Length DistanceToTopAtmosphereBoundary(const AtmosphereParameters atmosphere,
    const Length r, const Number mu) {
  assert(r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  Area discriminant = r * r * (mu * mu - 1.0) +
      atmosphere.top_radius * atmosphere.top_radius;
  return ClampDistance(-r * mu + SafeSqrt(discriminant));
}

Length DistanceToBottomAtmosphereBoundary(const AtmosphereParameters atmosphere,
    const Length r, const Number mu) {
  assert(r >= atmosphere.bottom_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  Area discriminant = r * r * (mu * mu - 1.0) +
      atmosphere.bottom_radius * atmosphere.bottom_radius;
  return ClampDistance(-r * mu - SafeSqrt(discriminant));
}

bool RayIntersectsGround(const AtmosphereParameters atmosphere,
    const Length r, const Number mu) {
  assert(r >= atmosphere.bottom_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  return mu < 0.0 && r * r * (mu * mu - 1.0) +
      atmosphere.bottom_radius * atmosphere.bottom_radius >= 0.0 * m2;
}

Number GetTextureCoordFromUnitRange(const Number x, const int texture_size) {
  return 0.5 / Number(texture_size) + x * (1.0 - 1.0 / Number(texture_size));
}

vec2 GetTransmittanceTextureUvFromRMu(const AtmosphereParameters atmosphere,
    const Length r, const Number mu) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  // Distance to top atmosphere boundary for a horizontal ray at ground level.
  Length H = sqrt(atmosphere.top_radius * atmosphere.top_radius -
      atmosphere.bottom_radius * atmosphere.bottom_radius);
  // Distance to the horizon.
  Length rho =
      SafeSqrt(r * r - atmosphere.bottom_radius * atmosphere.bottom_radius);
  // Distance to the top atmosphere boundary for the ray (r,mu), and its minimum
  // and maximum values over all mu - obtained for (r,1) and (r,mu_horizon).
  Length d = DistanceToTopAtmosphereBoundary(atmosphere, r, mu);
  Length d_min = atmosphere.top_radius - r;
  Length d_max = rho + H;
  Number x_mu = (d - d_min) / (d_max - d_min);
  Number x_r = rho / H;
  return vec2(GetTextureCoordFromUnitRange(x_mu, TRANSMITTANCE_TEXTURE_WIDTH),
              GetTextureCoordFromUnitRange(x_r, TRANSMITTANCE_TEXTURE_HEIGHT));
}

DimensionlessSpectrum GetTransmittanceToTopAtmosphereBoundary(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const Length r, const Number mu) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  vec2 uv = GetTransmittanceTextureUvFromRMu(atmosphere, r, mu);
  // @shotamatsuda: Added for the precomputation stage in half-float precision.
  #ifdef TRANSMITTANCE_PRECISION_LOG
  // Manually interpolate the transmittance instead of the optical depth.
  const vec2 size = vec2(TRANSMITTANCE_TEXTURE_WIDTH, TRANSMITTANCE_TEXTURE_HEIGHT);
  const vec3 texel_size = vec3(1.0 / size, 0.0);
  vec2 coord = (uv * size) - 0.5;
  vec2 i = (floor(coord) + 0.5) * texel_size.xy;
  vec2 f = fract(coord);
  vec4 t1 = exp(-texture(transmittance_texture, i));
  vec4 t2 = exp(-texture(transmittance_texture, i + texel_size.xz));
  vec4 t3 = exp(-texture(transmittance_texture, i + texel_size.zy));
  vec4 t4 = exp(-texture(transmittance_texture, i + texel_size.xy));
  return DimensionlessSpectrum(mix(mix(t1, t2, f.x), mix(t3, t4, f.x), f.y));
  #else // TRANSMITTANCE_PRECISION_LOG
  return DimensionlessSpectrum(texture(transmittance_texture, uv));
  #endif // TRANSMITTANCE_PRECISION_LOG
}

DimensionlessSpectrum GetTransmittance(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const Length r, const Number mu, const Length d,
    const bool ray_r_mu_intersects_ground) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  assert(d >= 0.0 * m);

  Length r_d = ClampRadius(atmosphere, sqrt(d * d + 2.0 * r * mu * d + r * r));
  Number mu_d = ClampCosine((r * mu + d) / r_d);

  if (ray_r_mu_intersects_ground) {
    return min(
        GetTransmittanceToTopAtmosphereBoundary(
            atmosphere, transmittance_texture, r_d, -mu_d) /
        GetTransmittanceToTopAtmosphereBoundary(
            atmosphere, transmittance_texture, r, -mu),
        DimensionlessSpectrum(1.0));
  } else {
    return min(
        GetTransmittanceToTopAtmosphereBoundary(
            atmosphere, transmittance_texture, r, mu) /
        GetTransmittanceToTopAtmosphereBoundary(
            atmosphere, transmittance_texture, r_d, mu_d),
        DimensionlessSpectrum(1.0));
  }
}

DimensionlessSpectrum GetTransmittanceToSun(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const Length r, const Number mu_s) {
  Number sin_theta_h = atmosphere.bottom_radius / r;
  Number cos_theta_h = -sqrt(max(1.0 - sin_theta_h * sin_theta_h, 0.0));
  return GetTransmittanceToTopAtmosphereBoundary(
          atmosphere, transmittance_texture, r, mu_s) *
      smoothstep(-sin_theta_h * atmosphere.sun_angular_radius / rad,
                 sin_theta_h * atmosphere.sun_angular_radius / rad,
                 mu_s - cos_theta_h);
}

InverseSolidAngle RayleighPhaseFunction(const Number nu) {
  InverseSolidAngle k = 3.0 / (16.0 * PI * sr);
  return k * (1.0 + nu * nu);
}

InverseSolidAngle MiePhaseFunction(const Number g, const Number nu) {
  InverseSolidAngle k = 3.0 / (8.0 * PI * sr) * (1.0 - g * g) / (2.0 + g * g);
  return k * (1.0 + nu * nu) / pow(1.0 + g * g - 2.0 * g * nu, 1.5);
}

vec4 GetScatteringTextureUvwzFromRMuMuSNu(const AtmosphereParameters atmosphere,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const bool ray_r_mu_intersects_ground) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  assert(mu_s >= -1.0 && mu_s <= 1.0);
  assert(nu >= -1.0 && nu <= 1.0);

  // Distance to top atmosphere boundary for a horizontal ray at ground level.
  Length H = sqrt(atmosphere.top_radius * atmosphere.top_radius -
      atmosphere.bottom_radius * atmosphere.bottom_radius);
  // Distance to the horizon.
  Length rho =
      SafeSqrt(r * r - atmosphere.bottom_radius * atmosphere.bottom_radius);
  Number u_r = GetTextureCoordFromUnitRange(rho / H, SCATTERING_TEXTURE_R_SIZE);

  // Discriminant of the quadratic equation for the intersections of the ray
  // (r,mu) with the ground (see RayIntersectsGround).
  Length r_mu = r * mu;
  Area discriminant =
      r_mu * r_mu - r * r + atmosphere.bottom_radius * atmosphere.bottom_radius;
  Number u_mu;
  if (ray_r_mu_intersects_ground) {
    // Distance to the ground for the ray (r,mu), and its minimum and maximum
    // values over all mu - obtained for (r,-1) and (r,mu_horizon).
    Length d = -r_mu - SafeSqrt(discriminant);
    Length d_min = r - atmosphere.bottom_radius;
    Length d_max = rho;
    u_mu = 0.5 - 0.5 * GetTextureCoordFromUnitRange(d_max == d_min ? 0.0 :
        (d - d_min) / (d_max - d_min), SCATTERING_TEXTURE_MU_SIZE / 2);
  } else {
    // Distance to the top atmosphere boundary for the ray (r,mu), and its
    // minimum and maximum values over all mu - obtained for (r,1) and
    // (r,mu_horizon).
    Length d = -r_mu + SafeSqrt(discriminant + H * H);
    Length d_min = atmosphere.top_radius - r;
    Length d_max = rho + H;
    u_mu = 0.5 + 0.5 * GetTextureCoordFromUnitRange(
        (d - d_min) / (d_max - d_min), SCATTERING_TEXTURE_MU_SIZE / 2);
  }

  Length d = DistanceToTopAtmosphereBoundary(
      atmosphere, atmosphere.bottom_radius, mu_s);
  Length d_min = atmosphere.top_radius - atmosphere.bottom_radius;
  Length d_max = H;
  Number a = (d - d_min) / (d_max - d_min);
  Length D = DistanceToTopAtmosphereBoundary(
      atmosphere, atmosphere.bottom_radius, atmosphere.mu_s_min);
  Number A = (D - d_min) / (d_max - d_min);
  // An ad-hoc function equal to 0 for mu_s = mu_s_min (because then d = D and
  // thus a = A), equal to 1 for mu_s = 1 (because then d = d_min and thus
  // a = 0), and with a large slope around mu_s = 0, to get more texture
  // samples near the horizon.
  Number u_mu_s = GetTextureCoordFromUnitRange(
      max(1.0 - a / A, 0.0) / (1.0 + a), SCATTERING_TEXTURE_MU_S_SIZE);

  Number u_nu = (nu + 1.0) / 2.0;
  return vec4(u_nu, u_mu_s, u_mu, u_r);
}

vec2 GetIrradianceTextureUvFromRMuS(const AtmosphereParameters atmosphere,
    const Length r, const Number mu_s) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu_s >= -1.0 && mu_s <= 1.0);
  Number x_r = (r - atmosphere.bottom_radius) /
      (atmosphere.top_radius - atmosphere.bottom_radius);
  Number x_mu_s = mu_s * 0.5 + 0.5;
  return vec2(GetTextureCoordFromUnitRange(x_mu_s, IRRADIANCE_TEXTURE_WIDTH),
              GetTextureCoordFromUnitRange(x_r, IRRADIANCE_TEXTURE_HEIGHT));
}

IrradianceSpectrum GetIrradiance(
    const AtmosphereParameters atmosphere,
    const IrradianceTexture irradiance_texture,
    const Length r, const Number mu_s) {
  vec2 uv = GetIrradianceTextureUvFromRMuS(atmosphere, r, mu_s);
  return IrradianceSpectrum(texture(irradiance_texture, uv));
}
`;
  var t = `// Based on: https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/definitions.glsl

/**
 * Copyright (c) 2017 Eric Bruneton
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holders nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#define assert(x)

#define Length float
#define Wavelength float
#define Angle float
#define SolidAngle float
#define Power float
#define LuminousPower float

#define Number float
#define InverseLength float
#define Area float
#define Volume float
#define NumberDensity float
#define Irradiance float
#define Radiance float
#define SpectralPower float
#define SpectralIrradiance float
#define SpectralRadiance float
#define SpectralRadianceDensity float
#define ScatteringCoefficient float
#define InverseSolidAngle float
#define LuminousIntensity float
#define Luminance float
#define Illuminance float

// A generic function from Wavelength to some other type.
#define AbstractSpectrum vec3
// A function from Wavelength to Number.
#define DimensionlessSpectrum vec3
// A function from Wavelength to SpectralPower.
#define PowerSpectrum vec3
// A function from Wavelength to SpectralIrradiance.
#define IrradianceSpectrum vec3
// A function from Wavelength to SpectralRadiance.
#define RadianceSpectrum vec3
// A function from Wavelength to SpectralRadianceDensity.
#define RadianceDensitySpectrum vec3
// A function from Wavelength to ScatteringCoefficient.
#define ScatteringSpectrum vec3

// A position in 3D (3 length values).
#define Position vec3
// A unit direction vector in 3D (3 unit-less values).
#define Direction vec3
// A vector of 3 luminance values.
#define Luminance3 vec3
// A vector of 3 illuminance values.
#define Illuminance3 vec3

#define TransmittanceTexture sampler2D
#define AbstractScatteringTexture sampler3D
#define ReducedScatteringTexture sampler3D
#define ScatteringTexture sampler3D
#define ScatteringDensityTexture sampler3D
#define IrradianceTexture sampler2D

const Length m = 1.0;
const Wavelength nm = 1.0;
const Angle rad = 1.0;
const SolidAngle sr = 1.0;
const Power watt = 1.0;
const LuminousPower lm = 1.0;

#if !defined(PI)
const float PI = 3.14159265358979323846;
#endif // !defined(PI)

const Length km = 1000.0 * m;
const Area m2 = m * m;
const Volume m3 = m * m * m;
const Angle pi = PI * rad;
const Angle deg = pi / 180.0;
const Irradiance watt_per_square_meter = watt / m2;
const Radiance watt_per_square_meter_per_sr = watt / (m2 * sr);
const SpectralIrradiance watt_per_square_meter_per_nm = watt / (m2 * nm);
const SpectralRadiance watt_per_square_meter_per_sr_per_nm = watt / (m2 * sr * nm);
const SpectralRadianceDensity watt_per_cubic_meter_per_sr_per_nm = watt / (m3 * sr * nm);
const LuminousIntensity cd = lm / sr;
const LuminousIntensity kcd = 1000.0 * cd;
const Luminance cd_per_square_meter = cd / m2;
const Luminance kcd_per_square_meter = kcd / m2;

struct DensityProfileLayer {
  Length width;
  Number exp_term;
  InverseLength exp_scale;
  InverseLength linear_term;
  Number constant_term;
};

struct DensityProfile {
  DensityProfileLayer layers[2];
};

// See AtmosphereParameter.ts for further details.
struct AtmosphereParameters {
  IrradianceSpectrum solar_irradiance;
  Angle sun_angular_radius;
  Length bottom_radius;
  Length top_radius;
  DensityProfile rayleigh_density;
  ScatteringSpectrum rayleigh_scattering;
  DensityProfile mie_density;
  ScatteringSpectrum mie_scattering;
  ScatteringSpectrum mie_extinction;
  Number mie_phase_function_g;
  DensityProfile absorption_density;
  ScatteringSpectrum absorption_extinction;
  DimensionlessSpectrum ground_albedo;
  Number mu_s_min;
};
`;
  var n2 = `// Based on: https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl

/**
 * Copyright (c) 2017 Eric Bruneton
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holders nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Precomputed Atmospheric Scattering
 * Copyright (c) 2008 INRIA
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holders nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifdef COMBINED_SCATTERING_TEXTURES
vec3 GetExtrapolatedSingleMieScattering(
    const AtmosphereParameters atmosphere, const vec4 scattering) {
  // Algebraically this can never be negative, but rounding errors can produce
  // that effect for sufficiently short view rays.
  // @shotamatsuda: Avoid division by infinitesimal values.
  // See https://github.com/takram-design-engineering/three-geospatial/issues/47
  if (scattering.r < 1e-5) {
    return vec3(0.0);
  }
  return scattering.rgb * scattering.a / scattering.r *
	    (atmosphere.rayleigh_scattering.r / atmosphere.mie_scattering.r) *
	    (atmosphere.mie_scattering / atmosphere.rayleigh_scattering);
}
#endif // COMBINED_SCATTERING_TEXTURES

IrradianceSpectrum GetCombinedScattering(
    const AtmosphereParameters atmosphere,
    const ReducedScatteringTexture scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const bool ray_r_mu_intersects_ground,
    out IrradianceSpectrum single_mie_scattering) {
  vec4 uvwz = GetScatteringTextureUvwzFromRMuMuSNu(
      atmosphere, r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  Number tex_coord_x = uvwz.x * Number(SCATTERING_TEXTURE_NU_SIZE - 1);
  Number tex_x = floor(tex_coord_x);
  Number lerp = tex_coord_x - tex_x;
  vec3 uvw0 = vec3((tex_x + uvwz.y) / Number(SCATTERING_TEXTURE_NU_SIZE),
      uvwz.z, uvwz.w);
  vec3 uvw1 = vec3((tex_x + 1.0 + uvwz.y) / Number(SCATTERING_TEXTURE_NU_SIZE),
      uvwz.z, uvwz.w);
#ifdef COMBINED_SCATTERING_TEXTURES
  vec4 combined_scattering =
      texture(scattering_texture, uvw0) * (1.0 - lerp) +
      texture(scattering_texture, uvw1) * lerp;
  IrradianceSpectrum scattering = IrradianceSpectrum(combined_scattering);
  single_mie_scattering =
      GetExtrapolatedSingleMieScattering(atmosphere, combined_scattering);
#else // COMBINED_SCATTERING_TEXTURES
  IrradianceSpectrum scattering = IrradianceSpectrum(
      texture(scattering_texture, uvw0) * (1.0 - lerp) +
      texture(scattering_texture, uvw1) * lerp);
  single_mie_scattering = IrradianceSpectrum(
      texture(single_mie_scattering_texture, uvw0) * (1.0 - lerp) +
      texture(single_mie_scattering_texture, uvw1) * lerp);
#endif // COMBINED_SCATTERING_TEXTURES
  return scattering;
}

// @shotamatsuda: Added for reading higher-order scattering texture.
#ifdef HAS_HIGHER_ORDER_SCATTERING_TEXTURE
IrradianceSpectrum GetScattering(
    const AtmosphereParameters atmosphere,
    const ReducedScatteringTexture scattering_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const bool ray_r_mu_intersects_ground) {
  vec4 uvwz = GetScatteringTextureUvwzFromRMuMuSNu(
      atmosphere, r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  Number tex_coord_x = uvwz.x * Number(SCATTERING_TEXTURE_NU_SIZE - 1);
  Number tex_x = floor(tex_coord_x);
  Number lerp = tex_coord_x - tex_x;
  vec3 uvw0 = vec3((tex_x + uvwz.y) / Number(SCATTERING_TEXTURE_NU_SIZE),
      uvwz.z, uvwz.w);
  vec3 uvw1 = vec3((tex_x + 1.0 + uvwz.y) / Number(SCATTERING_TEXTURE_NU_SIZE),
      uvwz.z, uvwz.w);
  IrradianceSpectrum scattering = IrradianceSpectrum(
      texture(scattering_texture, uvw0) * (1.0 - lerp) +
      texture(scattering_texture, uvw1) * lerp);
  return scattering;
}
#endif // HAS_HIGHER_ORDER_SCATTERING_TEXTURE

RadianceSpectrum GetSkyRadiance(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const ReducedScatteringTexture scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    Position camera, const Direction view_ray, const Length shadow_length,
    const Direction sun_direction,
    out DimensionlessSpectrum transmittance) {
  // Compute the distance to the top atmosphere boundary along the view ray,
  // assuming the viewer is in space (or NaN if the view ray does not intersect
  // the atmosphere).
  Length r = length(camera);
  Length rmu = dot(camera, view_ray);
  // @shotamatsuda: Use SafeSqrt instead.
  // See: https://github.com/takram-design-engineering/three-geospatial/pull/26
  Length distance_to_top_atmosphere_boundary = -rmu -
      SafeSqrt(rmu * rmu - r * r +
          atmosphere.top_radius * atmosphere.top_radius);
  // If the viewer is in space and the view ray intersects the atmosphere, move
  // the viewer to the top atmosphere boundary (along the view ray):
  if (distance_to_top_atmosphere_boundary > 0.0 * m) {
    camera = camera + view_ray * distance_to_top_atmosphere_boundary;
    r = atmosphere.top_radius;
    rmu += distance_to_top_atmosphere_boundary;
  } else if (r > atmosphere.top_radius) {
    // If the view ray does not intersect the atmosphere, simply return 0.
    transmittance = DimensionlessSpectrum(1.0);
    return RadianceSpectrum(0.0 * watt_per_square_meter_per_sr_per_nm);
  }
  // Compute the r, mu, mu_s and nu parameters needed for the texture lookups.
  Number mu = rmu / r;
  Number mu_s = dot(camera, sun_direction) / r;
  Number nu = dot(view_ray, sun_direction);

  // @shotamatsuda: For rendering points below the bottom atmosphere.
  #ifdef GROUND
  bool ray_r_mu_intersects_ground = RayIntersectsGround(atmosphere, r, mu);
  #else // GROUND
  bool ray_r_mu_intersects_ground = false;
  #endif // GROUND

  transmittance = ray_r_mu_intersects_ground ? DimensionlessSpectrum(0.0) :
      GetTransmittanceToTopAtmosphereBoundary(
          atmosphere, transmittance_texture, r, mu);
  IrradianceSpectrum single_mie_scattering;
  IrradianceSpectrum scattering;
  if (shadow_length == 0.0 * m) {
    scattering = GetCombinedScattering(
        atmosphere, scattering_texture, single_mie_scattering_texture,
        r, mu, mu_s, nu, ray_r_mu_intersects_ground,
        single_mie_scattering);
  } else {
    // Case of light shafts (shadow_length is the total length noted l in our
    // paper): we omit the scattering between the camera and the point at
    // distance l, by implementing Eq. (18) of the paper (shadow_transmittance
    // is the T(x,x_s) term, scattering is the S|x_s=x+lv term).
    Length d = shadow_length;
    Length r_p =
        ClampRadius(atmosphere, sqrt(d * d + 2.0 * r * mu * d + r * r));
    Number mu_p = (r * mu + d) / r_p;
    Number mu_s_p = (r * mu_s + d * nu) / r_p;

    scattering = GetCombinedScattering(
        atmosphere, scattering_texture, single_mie_scattering_texture,
        r_p, mu_p, mu_s_p, nu, ray_r_mu_intersects_ground,
        single_mie_scattering);
    DimensionlessSpectrum shadow_transmittance =
        GetTransmittance(atmosphere, transmittance_texture,
            r, mu, shadow_length, ray_r_mu_intersects_ground);
    // @shotamatsuda: Occlude only single Rayleigh scattering by the shadow.
#ifdef HAS_HIGHER_ORDER_SCATTERING_TEXTURE
    IrradianceSpectrum higher_order_scattering = GetScattering(
        atmosphere, higher_order_scattering_texture,
        r_p, mu_p, mu_s_p, nu, ray_r_mu_intersects_ground);
    IrradianceSpectrum single_scattering = scattering - higher_order_scattering;
    scattering = single_scattering * shadow_transmittance + higher_order_scattering;
#else // HAS_HIGHER_ORDER_SCATTERING_TEXTURE
    scattering = scattering * shadow_transmittance;
#endif // HAS_HIGHER_ORDER_SCATTERING_TEXTURE
    single_mie_scattering = single_mie_scattering * shadow_transmittance;
  }
  return scattering * RayleighPhaseFunction(nu) + single_mie_scattering *
      MiePhaseFunction(atmosphere.mie_phase_function_g, nu);
}

// @shotamatsuda: Returns the point on the ray closest to the origin.
vec3 ClosestPointOnRay(const Position camera, const Position point) {
  Position ray = point - camera;
  Number t = clamp(-dot(camera, ray) / dot(ray, ray), 0.0, 1.0);
  return camera + t * ray;
}

vec2 RaySphereIntersections(
    const Position camera, const Direction direction, const Length radius) {
  float b = 2.0 * dot(direction, camera);
  float c = dot(camera, camera) - radius * radius;
  float discriminant = b * b - 4.0 * c;
  float Q = sqrt(discriminant);
  return vec2(-b - Q, -b + Q) * 0.5;
}

// @shotamatsuda: Clip the view ray at the bottom atmosphere boundary.
bool ClipAtBottomAtmosphere(
    const AtmosphereParameters atmosphere,
    const Direction view_ray, inout Position camera, inout Position point) {
  const Length eps = 0.0;
  Length bottom_radius = atmosphere.bottom_radius + eps;
  Length r_camera = length(camera);
  Length r_point = length(point);
  bool camera_below = r_camera < bottom_radius;
  bool point_below = r_point < bottom_radius;

  vec2 t = RaySphereIntersections(camera, view_ray, bottom_radius);
  Position intersection = camera + view_ray * (camera_below ? t.y : t.x);
  camera = camera_below ? intersection : camera;
  point = point_below ? intersection : point;

  return camera_below && point_below;
}

RadianceSpectrum GetSkyRadianceToPoint(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const ReducedScatteringTexture scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    Position camera, Position point, const Length shadow_length,
    const Direction sun_direction, out DimensionlessSpectrum transmittance) {
  // @shotamatsuda: Avoid artifacts when the ray does not intersect the top
  // atmosphere boundary.
  if (length(ClosestPointOnRay(camera, point)) > atmosphere.top_radius) {
    transmittance = vec3(1.0);
    return vec3(0.0);
  }

  Direction view_ray = normalize(point - camera);
  if (ClipAtBottomAtmosphere(atmosphere, view_ray, camera, point)) {
    transmittance = vec3(1.0);
    return vec3(0.0);
  }

  // Compute the distance to the top atmosphere boundary along the view ray,
  // assuming the viewer is in space (or NaN if the view ray does not intersect
  // the atmosphere).
  Length r = length(camera);
  Length rmu = dot(camera, view_ray);
  // @shotamatsuda: Use SafeSqrt instead.
  // See: https://github.com/takram-design-engineering/three-geospatial/pull/26
  Length distance_to_top_atmosphere_boundary = -rmu -
      SafeSqrt(rmu * rmu - r * r +
          atmosphere.top_radius * atmosphere.top_radius);
  // If the viewer is in space and the view ray intersects the atmosphere, move
  // the viewer to the top atmosphere boundary (along the view ray):
  if (distance_to_top_atmosphere_boundary > 0.0 * m) {
    camera = camera + view_ray * distance_to_top_atmosphere_boundary;
    r = atmosphere.top_radius;
    rmu += distance_to_top_atmosphere_boundary;
  }

  // Compute the r, mu, mu_s and nu parameters for the first texture lookup.
  Number mu = rmu / r;
  Number mu_s = dot(camera, sun_direction) / r;
  Number nu = dot(view_ray, sun_direction);
  Length d = length(point - camera);
  bool ray_r_mu_intersects_ground = RayIntersectsGround(atmosphere, r, mu);

  // @shotamatsuda: Hack to avoid rendering artifacts near the horizon, due to
  // finite atmosphere texture resolution and finite floating point precision.
  // See: https://github.com/ebruneton/precomputed_atmospheric_scattering/pull/32
  if (!ray_r_mu_intersects_ground) {
    Number mu_horizon = -SafeSqrt(1.0 -
        (atmosphere.bottom_radius * atmosphere.bottom_radius) / (r * r));
    const Number eps = 0.004;
    mu = max(mu, mu_horizon + eps);
  }

  transmittance = GetTransmittance(atmosphere, transmittance_texture,
      r, mu, d, ray_r_mu_intersects_ground);

  IrradianceSpectrum single_mie_scattering;
  IrradianceSpectrum scattering = GetCombinedScattering(
      atmosphere, scattering_texture, single_mie_scattering_texture,
      r, mu, mu_s, nu, ray_r_mu_intersects_ground,
      single_mie_scattering);

  // Compute the r, mu, mu_s and nu parameters for the second texture lookup.
  // If shadow_length is not 0 (case of light shafts), we want to ignore the
  // scattering along the last shadow_length meters of the view ray, which we
  // do by subtracting shadow_length from d (this way scattering_p is equal to
  // the S|x_s=x_0-lv term in Eq. (17) of our paper).
  d = max(d - shadow_length, 0.0 * m);
  Length r_p = ClampRadius(atmosphere, sqrt(d * d + 2.0 * r * mu * d + r * r));
  Number mu_p = (r * mu + d) / r_p;
  Number mu_s_p = (r * mu_s + d * nu) / r_p;

  IrradianceSpectrum single_mie_scattering_p;
  IrradianceSpectrum scattering_p = GetCombinedScattering(
      atmosphere, scattering_texture, single_mie_scattering_texture,
      r_p, mu_p, mu_s_p, nu, ray_r_mu_intersects_ground,
      single_mie_scattering_p);

  // Combine the lookup results to get the scattering between camera and point.
  DimensionlessSpectrum shadow_transmittance = transmittance;
  if (shadow_length > 0.0 * m) {
    // This is the T(x,x_s) term in Eq. (17) of our paper, for light shafts.
    shadow_transmittance = GetTransmittance(atmosphere, transmittance_texture,
        r, mu, d, ray_r_mu_intersects_ground);
  }
  // @shotamatsuda: Occlude only single Rayleigh scattering by the shadow.
#ifdef HAS_HIGHER_ORDER_SCATTERING_TEXTURE
  IrradianceSpectrum higher_order_scattering = GetScattering(
      atmosphere, higher_order_scattering_texture,
      r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  IrradianceSpectrum single_scattering = scattering - higher_order_scattering;
  IrradianceSpectrum higher_order_scattering_p = GetScattering(
      atmosphere, higher_order_scattering_texture,
      r_p, mu_p, mu_s_p, nu, ray_r_mu_intersects_ground);
  IrradianceSpectrum single_scattering_p =
      scattering_p - higher_order_scattering_p;
  scattering =
      single_scattering - shadow_transmittance * single_scattering_p +
      higher_order_scattering - transmittance * higher_order_scattering_p;
#else // HAS_HIGHER_ORDER_SCATTERING_TEXTURE
  scattering = scattering - shadow_transmittance * scattering_p;
#endif // HAS_HIGHER_ORDER_SCATTERING_TEXTURE

  single_mie_scattering =
      single_mie_scattering - shadow_transmittance * single_mie_scattering_p;
#ifdef COMBINED_SCATTERING_TEXTURES
  single_mie_scattering = GetExtrapolatedSingleMieScattering(
      atmosphere, vec4(scattering, single_mie_scattering.r));
#endif // COMBINED_SCATTERING_TEXTURES

  // Hack to avoid rendering artifacts when the sun is below the horizon.
  single_mie_scattering = single_mie_scattering *
      smoothstep(Number(0.0), Number(0.01), mu_s);

  return scattering * RayleighPhaseFunction(nu) + single_mie_scattering *
      MiePhaseFunction(atmosphere.mie_phase_function_g, nu);
}

IrradianceSpectrum GetSunAndSkyIrradiance(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const IrradianceTexture irradiance_texture,
    const Position point, const Direction normal, const Direction sun_direction,
    out IrradianceSpectrum sky_irradiance) {
  Length r = length(point);
  Number mu_s = dot(point, sun_direction) / r;

  // Indirect irradiance (approximated if the surface is not horizontal).
  sky_irradiance = GetIrradiance(atmosphere, irradiance_texture, r, mu_s) *
      (1.0 + dot(normal, point) / r) * 0.5;

  // Direct irradiance.
  return atmosphere.solar_irradiance *
      GetTransmittanceToSun(
          atmosphere, transmittance_texture, r, mu_s) *
      max(dot(normal, sun_direction), 0.0);
}

// @shotamatsuda: Added for the clouds.
IrradianceSpectrum GetSunAndSkyScalarIrradiance(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const IrradianceTexture irradiance_texture,
    const Position point, const Direction sun_direction,
    out IrradianceSpectrum sky_irradiance) {
  Length r = length(point);
  Number mu_s = dot(point, sun_direction) / r;

  // Indirect irradiance. Integral over sphere yields 2\u03C0.
  sky_irradiance = GetIrradiance(atmosphere, irradiance_texture, r, mu_s) *
      2.0 * PI;

  // Direct irradiance. Omit the cosine term.
  return atmosphere.solar_irradiance *
      GetTransmittanceToSun(atmosphere, transmittance_texture, r, mu_s);
}

Luminance3 GetSolarLuminance() {
  return ATMOSPHERE.solar_irradiance /
      (PI * ATMOSPHERE.sun_angular_radius * ATMOSPHERE.sun_angular_radius) *
      SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
}

Luminance3 GetSkyLuminance(
    const Position camera, Direction view_ray, const Length shadow_length,
    const Direction sun_direction, out DimensionlessSpectrum transmittance) {
  return GetSkyRadiance(ATMOSPHERE, transmittance_texture,
      scattering_texture, single_mie_scattering_texture,
      camera, view_ray, shadow_length, sun_direction,
      transmittance) * SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;
}

Luminance3 GetSkyLuminanceToPoint(
    const Position camera, const Position point, const Length shadow_length,
    const Direction sun_direction, out DimensionlessSpectrum transmittance) {
  return GetSkyRadianceToPoint(ATMOSPHERE, transmittance_texture,
      scattering_texture, single_mie_scattering_texture,
      camera, point, shadow_length, sun_direction, transmittance) *
      SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;
}

Illuminance3 GetSunAndSkyIlluminance(
    const Position p, const Direction normal, const Direction sun_direction,
    out IrradianceSpectrum sky_irradiance) {
  IrradianceSpectrum sun_irradiance = GetSunAndSkyIrradiance(
      ATMOSPHERE, transmittance_texture, irradiance_texture, p, normal,
      sun_direction, sky_irradiance);
  sky_irradiance *= SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;
  return sun_irradiance * SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
}

// @shotamatsuda: Added for the clouds.
Illuminance3 GetSunAndSkyScalarIlluminance(
    const Position p, const Direction sun_direction,
    out IrradianceSpectrum sky_irradiance) {
  IrradianceSpectrum sun_irradiance = GetSunAndSkyScalarIrradiance(
      ATMOSPHERE, transmittance_texture, irradiance_texture, p,
      sun_direction, sky_irradiance);
  sky_irradiance *= SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;
  return sun_irradiance * SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
}

#define GetSolarRadiance GetSolarLuminance
#define GetSkyRadiance GetSkyLuminance
#define GetSkyRadianceToPoint GetSkyLuminanceToPoint
#define GetSunAndSkyIrradiance GetSunAndSkyIlluminance
#define GetSunAndSkyScalarIrradiance GetSunAndSkyScalarIlluminance
`;

  // node_modules/@takram/three-atmosphere/build/shaders/bruneton.js
  var c2 = n2;
  var e2 = e;
  var i = t;

  // node_modules/@takram/three-geospatial/build/shaders.js
  var n3 = `// Reference: https://github.com/mrdoob/three.js/blob/r171/examples/jsm/csm/CSMShader.js

#ifndef SHADOW_CASCADE_COUNT
#error "SHADOW_CASCADE_COUNT macro must be defined."
#endif // SHADOW_CASCADE_COUNT

int getCascadeIndex(
  const mat4 viewMatrix,
  const vec3 worldPosition,
  const vec2 intervals[SHADOW_CASCADE_COUNT],
  const float near,
  const float far
) {
  vec4 viewPosition = viewMatrix * vec4(worldPosition, 1.0);
  float depth = viewZToOrthographicDepth(viewPosition.z, near, far);
  vec2 interval;
  #pragma unroll_loop_start
  for (int i = 0; i < 4; ++i) {
    #if UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT
    interval = intervals[i];
    if (depth >= interval.x && depth < interval.y) {
      return UNROLLED_LOOP_INDEX;
    }
    #endif // UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT
  }
  #pragma unroll_loop_end
  return SHADOW_CASCADE_COUNT - 1;
}

int getFadedCascadeIndex(
  const mat4 viewMatrix,
  const vec3 worldPosition,
  const vec2 intervals[SHADOW_CASCADE_COUNT],
  const float near,
  const float far,
  const float jitter
) {
  vec4 viewPosition = viewMatrix * vec4(worldPosition, 1.0);
  float depth = viewZToOrthographicDepth(viewPosition.z, near, far);

  vec2 interval;
  float intervalCenter;
  float closestEdge;
  float margin;
  int nextIndex = -1;
  int prevIndex = -1;
  float alpha;

  #pragma unroll_loop_start
  for (int i = 0; i < 4; ++i) {
    #if UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT
    interval = intervals[i];
    intervalCenter = (interval.x + interval.y) * 0.5;
    closestEdge = depth < intervalCenter ? interval.x : interval.y;
    margin = closestEdge * closestEdge * 0.5;
    interval += margin * vec2(-0.5, 0.5);

    #if UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT - 1
    if (depth >= interval.x && depth < interval.y) {
      prevIndex = nextIndex;
      nextIndex = UNROLLED_LOOP_INDEX;
      alpha = saturate(min(depth - interval.x, interval.y - depth) / margin);
    }
    #else // UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT - 1
    // Don't fade out the last cascade.
    if (depth >= interval.x) {
      prevIndex = nextIndex;
      nextIndex = UNROLLED_LOOP_INDEX;
      alpha = saturate((depth - interval.x) / margin);
    }
    #endif // UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT - 1
    #endif // UNROLLED_LOOP_INDEX < SHADOW_CASCADE_COUNT
  }
  #pragma unroll_loop_end

  return jitter <= alpha
    ? nextIndex
    : prevIndex;
}
`;
  var e3 = `// cSpell:words logdepthbuf

#ifdef DEPTH_PACKING
float readDepthValue(const sampler2D depthBuffer, const vec2 uv) {
  #if DEPTH_PACKING == 3201
  return unpackRGBAToDepth(texture(depthBuffer, uv));
  #else // DEPTH_PACKING == 3201
  return texture(depthBuffer, uv).r;
  #endif // DEPTH_PACKING == 3201
}
#endif // DEPTH_PACKING

float reverseLogDepth(const float depth, const float near, const float far) {
  #if defined(USE_LOGDEPTHBUF) || defined(USE_LOGARITHMIC_DEPTH_BUFFER)
  float d = pow(2.0, depth * log2(far + 1.0)) - 1.0;
  float a = far / (far - near);
  float b = far * near / (near - far);
  return a + b / d;
  #else // defined(USE_LOGARITHMIC_DEPTH_BUFFER) || defined(USE_LOGARITHMIC_DEPTH_BUFFER)
  return depth;
  #endif // defined(USE_LOGARITHMIC_DEPTH_BUFFER) || defined(USE_LOGARITHMIC_DEPTH_BUFFER)
}

float linearizeDepth(const float depth, const float near, const float far) {
  float ndc = depth * 2.0 - 1.0;
  return 2.0 * near * far / (far + near - ndc * (far - near));
}
`;
  var t2 = `float checker(const vec2 uv, const vec2 repeats) {
  vec2 c = floor(repeats * uv);
  float result = mod(c.x + c.y, 2.0);
  return sign(result);
}

float checker(const vec2 uv, const float repeats) {
  return checker(uv, vec2(repeats));
}
`;
  var c3 = `// Reference: https://advances.realtimerendering.com/s2014/index.html#_NEXT_GENERATION_POST

float interleavedGradientNoise(const vec2 coord) {
  const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(coord, magic.xy)));
}
`;
  var i2 = `#if !defined(saturate)
#define saturate(a) clamp(a, 0.0, 1.0)
#endif // !defined(saturate)

float remap(const float x, const float min1, const float max1, const float min2, const float max2) {
  return min2 + (x - min1) / (max1 - min1) * (max2 - min2);
}

vec2 remap(const vec2 x, const vec2 min1, const vec2 max1, const vec2 min2, const vec2 max2) {
  return min2 + (x - min1) / (max1 - min1) * (max2 - min2);
}

vec3 remap(const vec3 x, const vec3 min1, const vec3 max1, const vec3 min2, const vec3 max2) {
  return min2 + (x - min1) / (max1 - min1) * (max2 - min2);
}

vec4 remap(const vec4 x, const vec4 min1, const vec4 max1, const vec4 min2, const vec4 max2) {
  return min2 + (x - min1) / (max1 - min1) * (max2 - min2);
}

float remapClamped(
  const float x,
  const float min1,
  const float max1,
  const float min2,
  const float max2
) {
  return clamp(min2 + (x - min1) / (max1 - min1) * (max2 - min2), min2, max2);
}

vec2 remapClamped(
  const vec2 x,
  const vec2 min1,
  const vec2 max1,
  const vec2 min2,
  const vec2 max2
) {
  return clamp(min2 + (x - min1) / (max1 - min1) * (max2 - min2), min2, max2);
}

vec3 remapClamped(
  const vec3 x,
  const vec3 min1,
  const vec3 max1,
  const vec3 min2,
  const vec3 max2
) {
  return clamp(min2 + (x - min1) / (max1 - min1) * (max2 - min2), min2, max2);
}

vec4 remapClamped(
  const vec4 x,
  const vec4 min1,
  const vec4 max1,
  const vec4 min2,
  const vec4 max2
) {
  return clamp(min2 + (x - min1) / (max1 - min1) * (max2 - min2), min2, max2);
}

// Implicitly remap to 0 and 1
float remap(const float x, const float min1, const float max1) {
  return (x - min1) / (max1 - min1);
}

vec2 remap(const vec2 x, const vec2 min1, const vec2 max1) {
  return (x - min1) / (max1 - min1);
}

vec3 remap(const vec3 x, const vec3 min1, const vec3 max1) {
  return (x - min1) / (max1 - min1);
}

vec4 remap(const vec4 x, const vec4 min1, const vec4 max1) {
  return (x - min1) / (max1 - min1);
}

float remapClamped(const float x, const float min1, const float max1) {
  return saturate((x - min1) / (max1 - min1));
}

vec2 remapClamped(const vec2 x, const vec2 min1, const vec2 max1) {
  return saturate((x - min1) / (max1 - min1));
}

vec3 remapClamped(const vec3 x, const vec3 min1, const vec3 max1) {
  return saturate((x - min1) / (max1 - min1));
}

vec4 remapClamped(const vec4 x, const vec4 min1, const vec4 max1) {
  return saturate((x - min1) / (max1 - min1));
}
`;
  var o = `float raySphereFirstIntersection(
  const vec3 origin,
  const vec3 direction,
  const vec3 center,
  const float radius
) {
  vec3 a = origin - center;
  float b = 2.0 * dot(direction, a);
  float c = dot(a, a) - radius * radius;
  float discriminant = b * b - 4.0 * c;
  return discriminant < 0.0
    ? -1.0
    : (-b - sqrt(discriminant)) * 0.5;
}

float raySphereFirstIntersection(const vec3 origin, const vec3 direction, const float radius) {
  return raySphereFirstIntersection(origin, direction, vec3(0.0), radius);
}

vec4 raySphereFirstIntersection(
  const vec3 origin,
  const vec3 direction,
  const vec3 center,
  const vec4 radius
) {
  vec3 a = origin - center;
  float b = 2.0 * dot(direction, a);
  vec4 c = dot(a, a) - radius * radius;
  vec4 discriminant = b * b - 4.0 * c;
  vec4 mask = step(discriminant, vec4(0.0));
  return mix((-b - sqrt(max(vec4(0.0), discriminant))) * 0.5, vec4(-1.0), mask);
}

vec4 raySphereFirstIntersection(const vec3 origin, const vec3 direction, const vec4 radius) {
  return raySphereFirstIntersection(origin, direction, vec3(0.0), radius);
}

float raySphereSecondIntersection(
  const vec3 origin,
  const vec3 direction,
  const vec3 center,
  const float radius
) {
  vec3 a = origin - center;
  float b = 2.0 * dot(direction, a);
  float c = dot(a, a) - radius * radius;
  float discriminant = b * b - 4.0 * c;
  return discriminant < 0.0
    ? -1.0
    : (-b + sqrt(discriminant)) * 0.5;
}

float raySphereSecondIntersection(const vec3 origin, const vec3 direction, const float radius) {
  return raySphereSecondIntersection(origin, direction, vec3(0.0), radius);
}

vec4 raySphereSecondIntersection(
  const vec3 origin,
  const vec3 direction,
  const vec3 center,
  const vec4 radius
) {
  vec3 a = origin - center;
  float b = 2.0 * dot(direction, a);
  vec4 c = dot(a, a) - radius * radius;
  vec4 discriminant = b * b - 4.0 * c;
  vec4 mask = step(discriminant, vec4(0.0));
  return mix((-b + sqrt(max(vec4(0.0), discriminant))) * 0.5, vec4(-1.0), mask);
}

vec4 raySphereSecondIntersection(const vec3 origin, const vec3 direction, const vec4 radius) {
  return raySphereSecondIntersection(origin, direction, vec3(0.0), radius);
}

void raySphereIntersections(
  const vec3 origin,
  const vec3 direction,
  const vec3 center,
  const float radius,
  out float intersection1,
  out float intersection2
) {
  vec3 a = origin - center;
  float b = 2.0 * dot(direction, a);
  float c = dot(a, a) - radius * radius;
  float discriminant = b * b - 4.0 * c;
  if (discriminant < 0.0) {
    intersection1 = -1.0;
    intersection2 = -1.0;
    return;
  } else {
    float Q = sqrt(discriminant);
    intersection1 = (-b - Q) * 0.5;
    intersection2 = (-b + Q) * 0.5;
  }
}

void raySphereIntersections(
  const vec3 origin,
  const vec3 direction,
  const float radius,
  out float intersection1,
  out float intersection2
) {
  raySphereIntersections(origin, direction, vec3(0.0), radius, intersection1, intersection2);
}

void raySphereIntersections(
  const vec3 origin,
  const vec3 direction,
  const vec3 center,
  const vec4 radius,
  out vec4 intersection1,
  out vec4 intersection2
) {
  vec3 a = origin - center;
  float b = 2.0 * dot(direction, a);
  vec4 c = dot(a, a) - radius * radius;
  vec4 discriminant = b * b - 4.0 * c;
  vec4 mask = step(discriminant, vec4(0.0));
  vec4 Q = sqrt(max(vec4(0.0), discriminant));
  intersection1 = mix((-b - Q) * 0.5, vec4(-1.0), mask);
  intersection2 = mix((-b + Q) * 0.5, vec4(-1.0), mask);
}

void raySphereIntersections(
  const vec3 origin,
  const vec3 direction,
  const vec4 radius,
  out vec4 intersection1,
  out vec4 intersection2
) {
  raySphereIntersections(origin, direction, vec3(0.0), radius, intersection1, intersection2);
}
`;
  var s = `// A fifth-order polynomial approximation of Turbo color map.
// See: https://observablehq.com/@mbostock/turbo
// prettier-ignore
vec3 turbo(const float x) {
  float r = 0.1357 + x * (4.5974 - x * (42.3277 - x * (130.5887 - x * (150.5666 - x * 58.1375))));
  float g = 0.0914 + x * (2.1856 + x * (4.8052 - x * (14.0195 - x * (4.2109 + x * 2.7747))));
  float b = 0.1067 + x * (12.5925 - x * (60.1097 - x * (109.0745 - x * (88.5066 - x * 26.8183))));
  return vec3(r, g, b);
}
`;
  var v2 = `// Reference: https://www.gamedev.net/tutorials/programming/graphics/contact-hardening-soft-shadows-made-fast-r4906/

vec2 vogelDisk(const int index, const int sampleCount, const float phi) {
  const float goldenAngle = 2.39996322972865332;
  float r = sqrt(float(index) + 0.5) / sqrt(float(sampleCount));
  float theta = float(index) * goldenAngle + phi;
  return r * vec2(cos(theta), sin(theta));
}
`;
  var m2 = n3;
  var d = e3;
  var l2 = t2;
  var f = c3;
  var x2 = i2;
  var u2 = o;
  var h = s;
  var g2 = v2;

  // node_modules/@takram/three-clouds/build/shared.js
  var k2 = class _k {
    constructor(e4 = 0, t3 = 0, n4 = 0, a2 = 0) {
      this.expTerm = e4, this.exponent = t3, this.linearTerm = n4, this.constantTerm = a2;
    }
    set(e4 = 0, t3 = 0, n4 = 0, a2 = 0) {
      return this.expTerm = e4, this.exponent = t3, this.linearTerm = n4, this.constantTerm = a2, this;
    }
    clone() {
      return new _k(
        this.expTerm,
        this.exponent,
        this.linearTerm,
        this.constantTerm
      );
    }
    copy(e4) {
      return this.expTerm = e4.expTerm, this.exponent = e4.exponent, this.linearTerm = e4.linearTerm, this.constantTerm = e4.constantTerm, this;
    }
  };
  var nt2 = [
    "channel",
    "altitude",
    "height",
    "densityScale",
    "shapeAmount",
    "shapeDetailAmount",
    "weatherExponent",
    "shapeAlteringBias",
    "coverageFilterWidth",
    "shadow",
    "densityProfile"
  ];
  function at2(o2, e4) {
    if (e4 != null)
      for (const t3 of nt2) {
        const n4 = e4[t3];
        n4 != null && (o2[t3] instanceof k2 ? o2[t3].copy(n4) : o2[t3] = n4);
      }
  }
  var b4 = class b5 {
    constructor(e4) {
      this.channel = "r", this.altitude = 0, this.height = 0, this.densityScale = 0.2, this.shapeAmount = 1, this.shapeDetailAmount = 1, this.weatherExponent = 1, this.shapeAlteringBias = 0.35, this.coverageFilterWidth = 0.6, this.densityProfile = new k2(0, 0, 0.75, 0.25), this.shadow = false, this.set(e4);
    }
    set(e4) {
      return at2(this, e4), this;
    }
    clone() {
      return new b5(this);
    }
    copy(e4) {
      return this.channel = e4.channel, this.altitude = e4.altitude, this.height = e4.height, this.densityScale = e4.densityScale, this.shapeAmount = e4.shapeAmount, this.shapeDetailAmount = e4.shapeDetailAmount, this.weatherExponent = e4.weatherExponent, this.shapeAlteringBias = e4.shapeAlteringBias, this.coverageFilterWidth = e4.coverageFilterWidth, this.densityProfile.copy(e4.densityProfile), this.shadow = e4.shadow, this;
    }
  };
  b4.DEFAULT = /* @__PURE__ */ new b4();
  var w2 = b4;
  var R4 = /* @__PURE__ */ Array.from(
    { length: 8 },
    () => ({ value: 0, flag: 0 })
  );
  var I2 = /* @__PURE__ */ Array.from(
    { length: 3 },
    () => ({ min: 0, max: 0 })
  );
  function it(o2, e4) {
    return o2.value !== e4.value ? o2.value - e4.value : o2.flag - e4.flag;
  }
  var U2 = class U3 extends Array {
    constructor(e4) {
      super(
        new w2(e4 == null ? void 0 : e4[0]),
        new w2(e4 == null ? void 0 : e4[1]),
        new w2(e4 == null ? void 0 : e4[2]),
        new w2(e4 == null ? void 0 : e4[3])
      );
    }
    set(e4) {
      return this[0].set(e4 == null ? void 0 : e4[0]), this[1].set(e4 == null ? void 0 : e4[1]), this[2].set(e4 == null ? void 0 : e4[2]), this[3].set(e4 == null ? void 0 : e4[3]), this;
    }
    reset() {
      return this[0].copy(w2.DEFAULT), this[1].copy(w2.DEFAULT), this[2].copy(w2.DEFAULT), this[3].copy(w2.DEFAULT), this;
    }
    clone() {
      return new U3(this);
    }
    copy(e4) {
      return this[0].copy(e4[0]), this[1].copy(e4[1]), this[2].copy(e4[2]), this[3].copy(e4[3]), this;
    }
    get localWeatherChannels() {
      return this[0].channel + this[1].channel + this[2].channel + this[3].channel;
    }
    packValues(e4, t3) {
      return t3.set(this[0][e4], this[1][e4], this[2][e4], this[3][e4]);
    }
    packSums(e4, t3, n4) {
      return n4.set(
        this[0][e4] + this[0][t3],
        this[1][e4] + this[1][t3],
        this[2][e4] + this[2][t3],
        this[3][e4] + this[3][t3]
      );
    }
    packDensityProfiles(e4, t3) {
      return t3.set(
        this[0].densityProfile[e4],
        this[1].densityProfile[e4],
        this[2].densityProfile[e4],
        this[3].densityProfile[e4]
      );
    }
    // Redundant, but need to avoid creating garbage here as this runs every frame.
    packIntervalHeights(e4, t3) {
      for (let s2 = 0; s2 < 4; ++s2) {
        const l3 = this[s2];
        let h2 = R4[s2];
        h2.value = l3.altitude, h2.flag = 0, h2 = R4[s2 + 4], h2.value = l3.altitude + l3.height, h2.flag = 1;
      }
      R4.sort(it);
      let n4 = 0, a2 = 0;
      for (let s2 = 0; s2 < R4.length; ++s2) {
        const { value: l3, flag: h2 } = R4[s2];
        if (a2 === 0 && s2 > 0) {
          const u3 = I2[n4++];
          u3.min = R4[s2 - 1].value, u3.max = l3;
        }
        a2 += h2 === 0 ? 1 : -1;
      }
      for (; n4 < 3; ++n4) {
        const s2 = I2[n4];
        s2.min = 0, s2.max = 0;
      }
      let i3 = I2[0];
      e4.x = i3.min, t3.x = i3.max, i3 = I2[1], e4.y = i3.min, t3.y = i3.max, i3 = I2[2], e4.z = i3.min, t3.z = i3.max;
    }
  };
  U2.DEFAULT = /* @__PURE__ */ new U2([
    {
      channel: "r",
      altitude: 750,
      height: 650,
      densityScale: 0.2,
      shapeAmount: 1,
      shapeDetailAmount: 1,
      weatherExponent: 1,
      shapeAlteringBias: 0.35,
      coverageFilterWidth: 0.6,
      shadow: true
    },
    {
      channel: "g",
      altitude: 1e3,
      height: 1200,
      densityScale: 0.2,
      shapeAmount: 1,
      shapeDetailAmount: 1,
      weatherExponent: 1,
      shapeAlteringBias: 0.35,
      coverageFilterWidth: 0.6,
      shadow: true
    },
    {
      channel: "b",
      altitude: 7500,
      height: 500,
      densityScale: 3e-3,
      shapeAmount: 0.4,
      shapeDetailAmount: 0,
      weatherExponent: 1,
      shapeAlteringBias: 0.35,
      coverageFilterWidth: 0.5
    },
    { channel: "a" }
  ]);
  var X = U2;
  var rt2 = true;
  var me2 = "Invariant failed";
  function A4(o2, e4) {
    if (!o2) {
      if (rt2)
        throw new Error(me2);
      var t3 = me2;
      throw new Error(t3);
    }
  }
  var F2 = class _F {
    constructor(e4, t3) {
      this.near = [new Vector3(), new Vector3(), new Vector3(), new Vector3()], this.far = [new Vector3(), new Vector3(), new Vector3(), new Vector3()], e4 != null && t3 != null && this.setFromCamera(e4, t3);
    }
    clone() {
      return new _F().copy(this);
    }
    copy(e4) {
      for (let t3 = 0; t3 < 4; ++t3)
        this.near[t3].copy(e4.near[t3]), this.far[t3].copy(e4.far[t3]);
      return this;
    }
    setFromCamera(e4, t3) {
      const n4 = e4.isOrthographicCamera === true, a2 = e4.projectionMatrixInverse;
      this.near[0].set(1, 1, -1), this.near[1].set(1, -1, -1), this.near[2].set(-1, -1, -1), this.near[3].set(-1, 1, -1);
      for (let i3 = 0; i3 < 4; ++i3)
        this.near[i3].applyMatrix4(a2);
      this.far[0].set(1, 1, 1), this.far[1].set(1, -1, 1), this.far[2].set(-1, -1, 1), this.far[3].set(-1, 1, 1);
      for (let i3 = 0; i3 < 4; ++i3) {
        const s2 = this.far[i3];
        s2.applyMatrix4(a2);
        const l3 = Math.abs(s2.z);
        n4 ? s2.z *= Math.min(t3 / l3, 1) : s2.multiplyScalar(Math.min(t3 / l3, 1));
      }
      return this;
    }
    split(e4, t3 = []) {
      var _a;
      for (let n4 = 0; n4 < e4.length; ++n4) {
        const a2 = (_a = t3[n4]) != null ? _a : t3[n4] = new _F();
        if (n4 === 0)
          for (let i3 = 0; i3 < 4; ++i3)
            a2.near[i3].copy(this.near[i3]);
        else
          for (let i3 = 0; i3 < 4; ++i3)
            a2.near[i3].lerpVectors(
              this.near[i3],
              this.far[i3],
              e4[n4 - 1]
            );
        if (n4 === e4.length - 1)
          for (let i3 = 0; i3 < 4; ++i3)
            a2.far[i3].copy(this.far[i3]);
        else
          for (let i3 = 0; i3 < 4; ++i3)
            a2.far[i3].lerpVectors(
              this.near[i3],
              this.far[i3],
              e4[n4]
            );
      }
      return t3.length = e4.length, t3;
    }
    applyMatrix4(e4) {
      for (let t3 = 0; t3 < 4; ++t3)
        this.near[t3].applyMatrix4(e4), this.far[t3].applyMatrix4(e4);
      return this;
    }
  };
  var ot = {
    uniform: (o2, e4, t3, n4, a2 = []) => {
      for (let i3 = 0; i3 < o2; ++i3)
        a2[i3] = (e4 + (t3 - e4) * (i3 + 1) / o2) / t3;
      return a2.length = o2, a2;
    },
    logarithmic: (o2, e4, t3, n4, a2 = []) => {
      for (let i3 = 0; i3 < o2; ++i3)
        a2[i3] = e4 * (t3 / e4) ** ((i3 + 1) / o2) / t3;
      return a2.length = o2, a2;
    },
    practical: (o2, e4, t3, n4 = 0.5, a2 = []) => {
      for (let i3 = 0; i3 < o2; ++i3) {
        const s2 = (e4 + (t3 - e4) * (i3 + 1) / o2) / t3, l3 = e4 * (t3 / e4) ** ((i3 + 1) / o2) / t3;
        a2[i3] = _r(s2, l3, n4);
      }
      return a2.length = o2, a2;
    }
  };
  function st2(o2, e4, t3, n4, a2, i3 = []) {
    return ot[o2](e4, t3, n4, a2, i3);
  }
  var ve = /* @__PURE__ */ new Vector3();
  var ge2 = /* @__PURE__ */ new Vector3();
  var ct = /* @__PURE__ */ new Matrix4();
  var Se2 = /* @__PURE__ */ new Matrix4();
  var lt2 = /* @__PURE__ */ new F2();
  var ht2 = /* @__PURE__ */ new Box3();
  var ut2 = {
    maxFar: null,
    farScale: 1,
    splitMode: "practical",
    splitLambda: 0.5,
    margin: 0,
    fade: true
  };
  var dt = class {
    constructor(e4) {
      this.cascades = [], this.mapSize = new Vector2(), this.cameraFrustum = new F2(), this.frusta = [], this.splits = [], this._far = 0;
      const {
        cascadeCount: t3,
        mapSize: n4,
        maxFar: a2,
        farScale: i3,
        splitMode: s2,
        splitLambda: l3,
        margin: h2,
        fade: u3
      } = {
        ...ut2,
        ...e4
      };
      this.cascadeCount = t3, this.mapSize.copy(n4), this.maxFar = a2, this.farScale = i3, this.splitMode = s2, this.splitLambda = l3, this.margin = h2, this.fade = u3;
    }
    get cascadeCount() {
      return this.cascades.length;
    }
    set cascadeCount(e4) {
      var _a, _b;
      if (e4 !== this.cascadeCount) {
        for (let t3 = 0; t3 < e4; ++t3)
          (_b = (_a = this.cascades)[t3]) != null ? _b : _a[t3] = {
            interval: new Vector2(),
            matrix: new Matrix4(),
            inverseMatrix: new Matrix4(),
            projectionMatrix: new Matrix4(),
            inverseProjectionMatrix: new Matrix4(),
            viewMatrix: new Matrix4(),
            inverseViewMatrix: new Matrix4()
          };
        this.cascades.length = e4;
      }
    }
    get far() {
      return this._far;
    }
    updateIntervals(e4) {
      var _a, _b;
      const t3 = this.cascadeCount, n4 = this.splits, a2 = this.far;
      st2(
        this.splitMode,
        t3,
        e4.near,
        a2,
        this.splitLambda,
        n4
      ), this.cameraFrustum.setFromCamera(e4, a2), this.cameraFrustum.split(n4, this.frusta);
      const i3 = this.cascades;
      for (let s2 = 0; s2 < t3; ++s2)
        i3[s2].interval.set((_a = n4[s2 - 1]) != null ? _a : 0, (_b = n4[s2]) != null ? _b : 0);
    }
    getFrustumRadius(e4, t3) {
      const n4 = t3.near, a2 = t3.far;
      let i3 = Math.max(
        a2[0].distanceTo(a2[2]),
        a2[0].distanceTo(n4[2])
      );
      if (this.fade) {
        const s2 = e4.near, l3 = this.far, h2 = a2[0].z / (l3 - s2);
        i3 += 0.25 * h2 ** 2 * (l3 - s2);
      }
      return i3 * 0.5;
    }
    updateMatrices(e4, t3, n4 = 1) {
      const a2 = ct.lookAt(
        ve.setScalar(0),
        ge2.copy(t3).multiplyScalar(-1),
        Object3D.DEFAULT_UP
      ), i3 = Se2.multiplyMatrices(
        Se2.copy(a2).invert(),
        e4.matrixWorld
      ), s2 = this.frusta, l3 = this.cascades;
      A4(s2.length === l3.length);
      const h2 = this.margin, u3 = this.mapSize;
      for (let d2 = 0; d2 < s2.length; ++d2) {
        const v3 = s2[d2], C3 = l3[d2], D3 = this.getFrustumRadius(e4, s2[d2]), P3 = -D3, O = D3, ne2 = D3, ae2 = -D3;
        C3.projectionMatrix.makeOrthographic(
          P3,
          O,
          ne2,
          ae2,
          -this.margin,
          // near
          D3 * 2 + this.margin
          // far
        );
        const { near: Ue2, far: He } = lt2.copy(v3).applyMatrix4(i3), z4 = ht2.makeEmpty();
        for (let W2 = 0; W2 < 4; W2++)
          z4.expandByPoint(Ue2[W2]), z4.expandByPoint(He[W2]);
        const E4 = z4.getCenter(ve);
        E4.z = z4.max.z + h2;
        const ie2 = (O - P3) / u3.width, re2 = (ne2 - ae2) / u3.height;
        E4.x = Math.round(E4.x / ie2) * ie2, E4.y = Math.round(E4.y / re2) * re2, E4.applyMatrix4(a2);
        const oe2 = ge2.copy(t3).multiplyScalar(n4).add(E4);
        C3.inverseViewMatrix.lookAt(E4, oe2, Object3D.DEFAULT_UP).setPosition(oe2);
      }
    }
    update(e4, t3, n4) {
      this._far = this.maxFar != null ? Math.min(this.maxFar, e4.far * this.farScale) : e4.far * this.farScale, this.updateIntervals(e4), this.updateMatrices(e4, t3, n4);
      const a2 = this.cascades, i3 = this.cascadeCount;
      for (let s2 = 0; s2 < i3; ++s2) {
        const {
          matrix: l3,
          inverseMatrix: h2,
          projectionMatrix: u3,
          inverseProjectionMatrix: d2,
          viewMatrix: v3,
          inverseViewMatrix: C3
        } = a2[s2];
        d2.copy(u3).invert(), v3.copy(C3).invert(), l3.copy(u3).multiply(v3), h2.copy(C3).multiply(d2);
      }
    }
  };
  var ye = [
    0,
    8,
    2,
    10,
    12,
    4,
    14,
    6,
    3,
    11,
    1,
    9,
    15,
    7,
    13,
    5
  ];
  var Oe2 = /* @__PURE__ */ ye.reduce((o2, e4, t3) => {
    const n4 = new Vector2();
    for (let a2 = 0; a2 < 16; ++a2)
      if (ye[a2] === t3) {
        n4.set((a2 % 4 + 0.5) / 4, (Math.floor(a2 / 4) + 0.5) / 4);
        break;
      }
    return [...o2, n4];
  }, []);
  var pt = {
    resolutionScale: 1,
    lightShafts: true,
    shapeDetail: true,
    turbulence: true,
    haze: true,
    clouds: {
      multiScatteringOctaves: 8,
      accurateSunSkyLight: true,
      accuratePhaseFunction: false,
      // Primary raymarch
      maxIterationCount: 500,
      minStepSize: 50,
      maxStepSize: 1e3,
      maxRayDistance: 2e5,
      perspectiveStepScale: 1.01,
      minDensity: 1e-5,
      minExtinction: 1e-5,
      minTransmittance: 0.01,
      // Secondary raymarch
      maxIterationCountToGround: 3,
      maxIterationCountToSun: 2,
      minSecondaryStepSize: 100,
      secondaryStepScale: 2,
      // Shadow length
      maxShadowLengthIterationCount: 500,
      minShadowLengthStepSize: 50,
      maxShadowLengthRayDistance: 2e5
    },
    shadow: {
      cascadeCount: 3,
      mapSize: /* @__PURE__ */ new Vector2(512, 512),
      // Primary raymarch
      maxIterationCount: 50,
      minStepSize: 100,
      maxStepSize: 1e3,
      minDensity: 1e-5,
      minExtinction: 1e-5,
      minTransmittance: 1e-4
    }
  };
  var c4 = pt;
  var ft2 = {
    // TODO: We cloud decrease multi-scattering octaves for lower quality presets,
    // but it leads to a loss of higher frequency scattering, making it darker
    // overall, which suggests the need for a fudge factor to scale the radiance.
    low: {
      ...c4,
      lightShafts: false,
      // Expensive
      shapeDetail: false,
      // Expensive
      turbulence: false,
      // Expensive
      clouds: {
        ...c4.clouds,
        accurateSunSkyLight: false,
        // Greatly reduces texel reads.
        maxIterationCount: 200,
        minStepSize: 100,
        maxRayDistance: 1e5,
        minDensity: 1e-4,
        minExtinction: 1e-4,
        minTransmittance: 0.1,
        // Makes the primary march terminate earlier.
        maxIterationCountToGround: 0,
        // Expensive
        maxIterationCountToSun: 1
        // Only 1 march makes big difference
      },
      shadow: {
        ...c4.shadow,
        maxIterationCount: 25,
        minDensity: 1e-4,
        minExtinction: 1e-4,
        minTransmittance: 0.01,
        // Makes the primary march terminate earlier.
        cascadeCount: 2,
        // Obvious
        mapSize: /* @__PURE__ */ new Vector2(256, 256)
        // Obvious
      }
    },
    medium: {
      ...c4,
      lightShafts: false,
      // Expensive
      turbulence: false,
      // Expensive
      clouds: {
        ...c4.clouds,
        minDensity: 1e-4,
        minExtinction: 1e-4,
        accurateSunSkyLight: false,
        maxIterationCountToSun: 2,
        maxIterationCountToGround: 1
      },
      shadow: {
        ...c4.shadow,
        minDensity: 1e-4,
        minExtinction: 1e-4,
        mapSize: /* @__PURE__ */ new Vector2(256, 256)
      }
    },
    high: c4,
    // Consider high quality preset as default.
    ultra: {
      ...c4,
      clouds: {
        ...c4.clouds,
        minStepSize: 10
      },
      shadow: {
        ...c4.shadow,
        mapSize: /* @__PURE__ */ new Vector2(1024, 1024)
      }
    }
  };
  var mt2 = `precision highp float;
precision highp sampler3D;
precision highp sampler2DArray;

#include <common>
#include <packing>

#include "core/depth"
#include "core/math"
#include "core/turbo"
#include "core/generators"
#include "core/raySphereIntersection"
#include "core/cascadedShadowMaps"
#include "core/interleavedGradientNoise"
#include "core/vogelDisk"

#include "atmosphere/bruneton/definitions"

uniform AtmosphereParameters ATMOSPHERE;
uniform vec3 SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform vec3 SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;

uniform sampler2D transmittance_texture;
uniform sampler3D scattering_texture;
uniform sampler2D irradiance_texture;
uniform sampler3D single_mie_scattering_texture;
uniform sampler3D higher_order_scattering_texture;

#include "atmosphere/bruneton/common"
#include "atmosphere/bruneton/runtime"

#include "types"
#include "parameters"
#include "clouds"

#if !defined(RECIPROCAL_PI4)
#define RECIPROCAL_PI4 0.07957747154594767
#endif // !defined(RECIPROCAL_PI4)

uniform sampler2D depthBuffer;
uniform mat4 viewMatrix;
uniform mat4 reprojectionMatrix;
uniform mat4 viewReprojectionMatrix;
uniform float cameraNear;
uniform float cameraFar;
uniform float cameraHeight;
uniform vec2 temporalJitter;
uniform vec2 targetUvScale;
uniform float mipLevelScale;

// Scattering
const vec2 scatterAnisotropy = vec2(SCATTER_ANISOTROPY_1, SCATTER_ANISOTROPY_2);
const float scatterAnisotropyMix = SCATTER_ANISOTROPY_MIX;
uniform float skyLightScale;
uniform float groundBounceScale;
uniform float powderScale;
uniform float powderExponent;

// Primary raymarch
uniform int maxIterationCount;
uniform float minStepSize;
uniform float maxStepSize;
uniform float maxRayDistance;
uniform float perspectiveStepScale;

// Secondary raymarch
uniform int maxIterationCountToSun;
uniform int maxIterationCountToGround;
uniform float minSecondaryStepSize;
uniform float secondaryStepScale;

// Beer shadow map
uniform sampler2DArray shadowBuffer;
uniform vec2 shadowTexelSize;
uniform vec2 shadowIntervals[SHADOW_CASCADE_COUNT];
uniform mat4 shadowMatrices[SHADOW_CASCADE_COUNT];
uniform float shadowFar;
uniform float maxShadowFilterRadius;

// Shadow length
#ifdef SHADOW_LENGTH
uniform int maxShadowLengthIterationCount;
uniform float minShadowLengthStepSize;
uniform float maxShadowLengthRayDistance;
#endif // SHADOW_LENGTH

in vec2 vUv;
in vec3 vCameraPosition;
in vec3 vCameraDirection; // Direction to the center of screen
in vec3 vRayDirection; // Direction to the texel
in vec3 vViewPosition;
in GroundIrradiance vGroundIrradiance;
in CloudsIrradiance vCloudsIrradiance;

layout(location = 0) out vec4 outputColor;
layout(location = 1) out vec3 outputDepthVelocity;
#ifdef SHADOW_LENGTH
layout(location = 2) out float outputShadowLength;
#endif // SHADOW_LENGTH

float getViewZ(const float depth) {
  #ifdef PERSPECTIVE_CAMERA
  return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
  #else // PERSPECTIVE_CAMERA
  return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
  #endif // PERSPECTIVE_CAMERA
}

vec3 ecefToWorld(const vec3 positionECEF) {
  return (ecefToWorldMatrix * vec4(positionECEF - altitudeCorrection, 1.0)).xyz;
}

vec2 getShadowUv(const vec3 worldPosition, const int cascadeIndex) {
  vec4 clip = shadowMatrices[cascadeIndex] * vec4(worldPosition, 1.0);
  clip /= clip.w;
  return clip.xy * 0.5 + 0.5;
}

float getDistanceToShadowTop(const vec3 rayPosition) {
  // Distance to the top of the shadows along the sun direction, which matches
  // the ray origin of BSM.
  return raySphereSecondIntersection(
    rayPosition,
    sunDirection,
    vec3(0.0),
    bottomRadius + shadowTopHeight
  );
}

#ifdef DEBUG_SHOW_CASCADES

const vec3 cascadeColors[4] = vec3[4](
  vec3(1.0, 0.0, 0.0),
  vec3(0.0, 1.0, 0.0),
  vec3(0.0, 0.0, 1.0),
  vec3(1.0, 1.0, 0.0)
);

vec3 getCascadeColor(const vec3 rayPosition) {
  vec3 worldPosition = ecefToWorld(rayPosition);
  int cascadeIndex = getCascadeIndex(
    viewMatrix,
    worldPosition,
    shadowIntervals,
    cameraNear,
    shadowFar
  );
  vec2 uv = getShadowUv(worldPosition, cascadeIndex);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec3(1.0);
  }
  return cascadeColors[cascadeIndex];
}

vec3 getFadedCascadeColor(const vec3 rayPosition, const float jitter) {
  vec3 worldPosition = ecefToWorld(rayPosition);
  int cascadeIndex = getFadedCascadeIndex(
    viewMatrix,
    worldPosition,
    shadowIntervals,
    cameraNear,
    shadowFar,
    jitter
  );
  return cascadeIndex >= 0
    ? cascadeColors[cascadeIndex]
    : vec3(1.0);
}

#endif // DEBUG_SHOW_CASCADES

float readShadowOpticalDepth(
  const vec2 uv,
  const float distanceToTop,
  const float distanceOffset,
  const int cascadeIndex
) {
  // r: frontDepth, g: meanExtinction, b: maxOpticalDepth, a: maxOpticalDepthTail
  // Also see the discussion here: https://x.com/shotamatsuda/status/1885322308908442106
  vec4 shadow = texture(shadowBuffer, vec3(uv, float(cascadeIndex)));
  float distanceToFront = max(0.0, distanceToTop - distanceOffset - shadow.r);
  return min(shadow.b + shadow.a, shadow.g * distanceToFront);
}

float sampleShadowOpticalDepthPCF(
  const vec3 worldPosition,
  const float distanceToTop,
  const float distanceOffset,
  const float radius,
  const int cascadeIndex
) {
  vec2 uv = getShadowUv(worldPosition, cascadeIndex);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return 0.0;
  }
  if (radius < 0.1) {
    return readShadowOpticalDepth(uv, distanceToTop, distanceOffset, cascadeIndex);
  }
  float sum = 0.0;
  vec2 offset;
  #pragma unroll_loop_start
  for (int i = 0; i < 16; ++i) {
    #if UNROLLED_LOOP_INDEX < SHADOW_SAMPLE_COUNT
    offset = vogelDisk(
      UNROLLED_LOOP_INDEX,
      SHADOW_SAMPLE_COUNT,
      interleavedGradientNoise(gl_FragCoord.xy + temporalJitter * resolution) * PI2
    );
    sum += readShadowOpticalDepth(
      uv + offset * radius * shadowTexelSize,
      distanceToTop,
      distanceOffset,
      cascadeIndex
    );
    #endif // UNROLLED_LOOP_INDEX < SHADOW_SAMPLE_COUNT
  }
  #pragma unroll_loop_end
  return sum / float(SHADOW_SAMPLE_COUNT);
}

float sampleShadowOpticalDepth(
  const vec3 rayPosition,
  const float distanceOffset,
  const float radius,
  const float jitter
) {
  float distanceToTop = getDistanceToShadowTop(rayPosition);
  if (distanceToTop <= 0.0) {
    return 0.0;
  }
  vec3 worldPosition = ecefToWorld(rayPosition);
  int cascadeIndex = getFadedCascadeIndex(
    viewMatrix,
    worldPosition,
    shadowIntervals,
    cameraNear,
    shadowFar,
    jitter
  );
  return cascadeIndex >= 0
    ? sampleShadowOpticalDepthPCF(
      worldPosition,
      distanceToTop,
      distanceOffset,
      radius,
      cascadeIndex
    )
    : 0.0;
}

#ifdef DEBUG_SHOW_SHADOW_MAP
vec4 getCascadedShadowMaps(vec2 uv) {
  vec4 coord = vec4(vUv, vUv - 0.5) * 2.0;
  vec4 shadow = vec4(0.0);
  if (uv.y > 0.5) {
    if (uv.x < 0.5) {
      shadow = texture(shadowBuffer, vec3(coord.xw, 0.0));
    } else {
      #if SHADOW_CASCADE_COUNT > 1
      shadow = texture(shadowBuffer, vec3(coord.zw, 1.0));
      #endif // SHADOW_CASCADE_COUNT > 1
    }
  } else {
    if (uv.x < 0.5) {
      #if SHADOW_CASCADE_COUNT > 2
      shadow = texture(shadowBuffer, vec3(coord.xy, 2.0));
      #endif // SHADOW_CASCADE_COUNT > 2
    } else {
      #if SHADOW_CASCADE_COUNT > 3
      shadow = texture(shadowBuffer, vec3(coord.zy, 3.0));
      #endif // SHADOW_CASCADE_COUNT > 3
    }
  }

  #if !defined(DEBUG_SHOW_SHADOW_MAP_TYPE)
  #define DEBUG_SHOW_SHADOW_MAP_TYPE 0
  #endif // !defined(DEBUG_SHOW_SHADOW_MAP_TYPE

  const float frontDepthScale = 1e-5;
  const float meanExtinctionScale = 10.0;
  const float maxOpticalDepthScale = 0.01;
  vec3 color;
  #if DEBUG_SHOW_SHADOW_MAP_TYPE == 1
  color = vec3(shadow.r * frontDepthScale);
  #elif DEBUG_SHOW_SHADOW_MAP_TYPE == 2
  color = vec3(shadow.g * meanExtinctionScale);
  #elif DEBUG_SHOW_SHADOW_MAP_TYPE == 3
  color = vec3((shadow.b + shadow.a) * maxOpticalDepthScale);
  #else // DEBUG_SHOW_SHADOW_MAP_TYPE
  color =
    (shadow.rgb + vec3(0.0, 0.0, shadow.a)) *
    vec3(frontDepthScale, meanExtinctionScale, maxOpticalDepthScale);
  #endif // DEBUG_SHOW_SHADOW_MAP_TYPE
  return vec4(color, 1.0);
}
#endif // DEBUG_SHOW_SHADOW_MAP

vec2 henyeyGreenstein(const vec2 g, const float cosTheta) {
  vec2 g2 = g * g;
  // prettier-ignore
  return RECIPROCAL_PI4 *
    ((1.0 - g2) / max(vec2(1e-7), pow(1.0 + g2 - 2.0 * g * cosTheta, vec2(1.5))));
}

#ifdef ACCURATE_PHASE_FUNCTION

float draine(float u, float g, float a) {
  float g2 = g * g;
  // prettier-ignore
  return (1.0 - g2) *
    (1.0 + a * u * u) /
    (4.0 * (1.0 + a * (1.0 + 2.0 * g2) / 3.0) * PI * pow(1.0 + g2 - 2.0 * g * u, 1.5));
}

// Numerically-fitted large particles (d=10) phase function It won't be
// plausible without a more precise multiple scattering.
// Reference: https://research.nvidia.com/labs/rtr/approximate-mie/
float phaseFunction(const float cosTheta, const float attenuation) {
  const float gHG = 0.988176691700256; // exp(-0.0990567/(d-1.67154))
  const float gD = 0.5556712547839497; // exp(-2.20679/(d+3.91029) - 0.428934)
  const float alpha = 21.995520856274638; // exp(3.62489 - 8.29288/(d+5.52825))
  const float weight = 0.4819554318404214; // exp(-0.599085/(d-0.641583)-0.665888)
  return mix(
    henyeyGreenstein(vec2(gHG) * attenuation, cosTheta).x,
    draine(cosTheta, gD * attenuation, alpha),
    weight
  );
}

#else // ACCURATE_PHASE_FUNCTION

float phaseFunction(const float cosTheta, const float attenuation) {
  const vec2 g = scatterAnisotropy;
  const vec2 weights = vec2(1.0 - scatterAnisotropyMix, scatterAnisotropyMix);
  // A similar approximation is described in the Frostbite's paper, where phase
  // angle is attenuated instead of anisotropy.
  return dot(henyeyGreenstein(g * attenuation, cosTheta), weights);
}

#endif // ACCURATE_PHASE_FUNCTION

float phaseFunction(const float cosTheta) {
  return phaseFunction(cosTheta, 1.0);
}

float marchOpticalDepth(
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const int maxIterationCount,
  const float mipLevel,
  const float jitter,
  out float rayDistance
) {
  int iterationCount = int(
    max(0.0, remap(mipLevel, 0.0, 1.0, float(maxIterationCount + 1), 1.0) - jitter)
  );
  if (iterationCount == 0) {
    // Fudge factor to approximate the mean optical depth.
    // TODO: Remove it.
    return 0.5;
  }
  float stepSize = minSecondaryStepSize / float(iterationCount);
  float nextDistance = stepSize * jitter;
  float opticalDepth = 0.0;
  for (int i = 0; i < iterationCount; ++i) {
    rayDistance = nextDistance;
    vec3 position = rayDistance * rayDirection + rayOrigin;
    vec2 uv = getGlobeUv(position);
    float height = length(position) - bottomRadius;
    WeatherSample weather = sampleWeather(uv, height, mipLevel);
    MediaSample media = sampleMedia(weather, position, uv, mipLevel, jitter);
    opticalDepth += media.extinction * stepSize;
    nextDistance += stepSize;
    stepSize *= secondaryStepScale;
  }
  return opticalDepth;
}

float marchOpticalDepth(
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const int maxIterationCount,
  const float mipLevel,
  const float jitter
) {
  float rayDistance;
  return marchOpticalDepth(
    rayOrigin,
    rayDirection,
    maxIterationCount,
    mipLevel,
    jitter,
    rayDistance
  );
}

float approximateMultipleScattering(const float opticalDepth, const float cosTheta) {
  // Multiple scattering approximation
  // See: https://fpsunflower.github.io/ckulla/data/oz_volumes.pdf
  // a: attenuation, b: contribution, c: phase attenuation
  vec3 coeffs = vec3(1.0); // [a, b, c]
  const vec3 attenuation = vec3(0.5, 0.5, 0.5); // Should satisfy a <= b
  float scattering = 0.0;
  float beerLambert;
  #pragma unroll_loop_start
  for (int i = 0; i < 12; ++i) {
    #if UNROLLED_LOOP_INDEX < MULTI_SCATTERING_OCTAVES
    beerLambert = exp(-opticalDepth * coeffs.y);
    scattering += coeffs.x * beerLambert * phaseFunction(cosTheta, coeffs.z);
    coeffs *= attenuation;
    #endif // UNROLLED_LOOP_INDEX < MULTI_SCATTERING_OCTAVES
  }
  #pragma unroll_loop_end
  return scattering;
}

// TODO: Construct spherical harmonics of degree 2 using 2 sample points
// positioned near the horizon occlusion points on the sun direction plane.
vec3 getGroundSunSkyIrradiance(
  const vec3 position,
  const vec3 surfaceNormal,
  const float height,
  out vec3 skyIrradiance
) {
  #ifdef ACCURATE_SUN_SKY_LIGHT
  return GetSunAndSkyIrradiance(
    (position - surfaceNormal * height) * METER_TO_LENGTH_UNIT,
    surfaceNormal,
    sunDirection,
    skyIrradiance
  );
  #else // ACCURATE_SUN_SKY_LIGHT
  skyIrradiance = vGroundIrradiance.sky;
  return vGroundIrradiance.sun;
  #endif // ACCURATE_SUN_SKY_LIGHT
}

vec3 getCloudsSunSkyIrradiance(const vec3 position, const float height, out vec3 skyIrradiance) {
  #ifdef ACCURATE_SUN_SKY_LIGHT
  return GetSunAndSkyScalarIrradiance(position * METER_TO_LENGTH_UNIT, sunDirection, skyIrradiance);
  #else // ACCURATE_SUN_SKY_LIGHT
  float alpha = remapClamped(height, minHeight, maxHeight);
  skyIrradiance = mix(vCloudsIrradiance.minSky, vCloudsIrradiance.maxSky, alpha);
  return mix(vCloudsIrradiance.minSun, vCloudsIrradiance.maxSun, alpha);
  #endif // ACCURATE_SUN_SKY_LIGHT
}

#ifdef GROUND_BOUNCE
vec3 approximateRadianceFromGround(
  const vec3 position,
  const vec3 surfaceNormal,
  const float height,
  const float mipLevel,
  const float jitter
) {
  float opticalDepthToGround = marchOpticalDepth(
    position,
    -surfaceNormal,
    maxIterationCountToGround,
    mipLevel,
    jitter
  );
  vec3 skyIrradiance;
  vec3 sunIrradiance = getGroundSunSkyIrradiance(position, surfaceNormal, height, skyIrradiance);
  const float groundAlbedo = 0.3;
  vec3 groundIrradiance = skyIrradiance + (1.0 - coverage) * sunIrradiance;
  vec3 bouncedRadiance = groundAlbedo * RECIPROCAL_PI * groundIrradiance;
  return bouncedRadiance * exp(-opticalDepthToGround);
}
#endif // GROUND_BOUNCE

vec4 marchClouds(
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const vec2 rayNearFar,
  const float cosTheta,
  const float jitter,
  const float rayStartTexelsPerPixel,
  out float frontDepth,
  out ivec3 sampleCount
) {
  vec3 radianceIntegral = vec3(0.0);
  float transmittanceIntegral = 1.0;
  float weightedDistanceSum = 0.0;
  float transmittanceSum = 0.0;

  float maxRayDistance = rayNearFar.y - rayNearFar.x;
  float stepSize = minStepSize + (perspectiveStepScale - 1.0) * rayNearFar.x;
  // I don't understand why spatial aliasing remains unless doubling the jitter.
  float rayDistance = stepSize * jitter * 2.0;

  for (int i = 0; i < maxIterationCount; ++i) {
    if (rayDistance > maxRayDistance) {
      break; // Termination
    }

    vec3 position = rayDistance * rayDirection + rayOrigin;
    float height = length(position) - bottomRadius;
    float mipLevel = log2(max(1.0, rayStartTexelsPerPixel + rayDistance * 1e-5));

    #if !defined(DEBUG_MARCH_INTERVALS)
    if (insideLayerIntervals(height)) {
      stepSize *= perspectiveStepScale;
      rayDistance += mix(stepSize, maxStepSize, min(1.0, mipLevel));
      continue;
    }
    #endif // !defined(DEBUG_MARCH_INTERVALS)

    // Sample rough weather.
    vec2 uv = getGlobeUv(position);
    WeatherSample weather = sampleWeather(uv, height, mipLevel);

    #ifdef DEBUG_SHOW_SAMPLE_COUNT
    ++sampleCount.x;
    #endif // DEBUG_SHOW_SAMPLE_COUNT

    if (!any(greaterThan(weather.density, vec4(minDensity)))) {
      // Step longer in empty space.
      // TODO: This produces banding artifacts.
      // Possible improvement: Binary search refinement
      stepSize *= perspectiveStepScale;
      rayDistance += mix(stepSize, maxStepSize, min(1.0, mipLevel));
      continue;
    }

    // Sample detailed participating media.
    MediaSample media = sampleMedia(weather, position, uv, mipLevel, jitter, sampleCount);

    if (media.extinction > minExtinction) {
      vec3 skyIrradiance;
      vec3 sunIrradiance = getCloudsSunSkyIrradiance(position, height, skyIrradiance);
      vec3 surfaceNormal = normalize(position);

      // March optical depth to the sun for finer details, which BSM lacks.
      float sunRayDistance = 0.0;
      float opticalDepth = marchOpticalDepth(
        position,
        sunDirection,
        maxIterationCountToSun,
        mipLevel,
        jitter,
        sunRayDistance
      );

      if (height < shadowTopHeight) {
        // Obtain the optical depth from BSM at the ray position.
        opticalDepth += sampleShadowOpticalDepth(
          position,
          // Take account of only positions further than the marched ray
          // distance.
          sunRayDistance,
          // Apply PCF only when the sun is close to the horizon.
          maxShadowFilterRadius * remapClamped(dot(sunDirection, surfaceNormal), 0.1, 0.0),
          jitter
        );
      }

      vec3 radiance = sunIrradiance * approximateMultipleScattering(opticalDepth, cosTheta);

      #ifdef GROUND_BOUNCE
      // Fudge factor for the irradiance from ground.
      if (height < shadowTopHeight && mipLevel < 0.5) {
        vec3 groundRadiance = approximateRadianceFromGround(
          position,
          surfaceNormal,
          height,
          mipLevel,
          jitter
        );
        radiance += groundRadiance * RECIPROCAL_PI4 * groundBounceScale;
      }
      #endif // GROUND_BOUNCE

      // Crude approximation of sky gradient. Better than none in the shadows.
      float skyGradient = dot(weather.heightFraction * 0.5 + 0.5, media.weight);
      radiance += skyIrradiance * RECIPROCAL_PI4 * skyGradient * skyLightScale;

      // Finally multiply by scattering.
      radiance *= media.scattering;

      #ifdef POWDER
      radiance *= 1.0 - powderScale * exp(-media.extinction * powderExponent);
      #endif // POWDER

      #ifdef DEBUG_SHOW_CASCADES
      if (height < shadowTopHeight) {
        radiance = 1e-3 * getFadedCascadeColor(position, jitter);
      }
      #endif // DEBUG_SHOW_CASCADES

      // Energy-conserving analytical integration of scattered light
      // See 5.6.3 in https://media.contentapi.ea.com/content/dam/eacom/frostbite/files/s2016-pbs-frostbite-sky-clouds-new.pdf
      float transmittance = exp(-media.extinction * stepSize);
      float clampedExtinction = max(media.extinction, 1e-7);
      vec3 scatteringIntegral = (radiance - radiance * transmittance) / clampedExtinction;
      radianceIntegral += transmittanceIntegral * scatteringIntegral;
      transmittanceIntegral *= transmittance;

      // Aerial perspective affecting clouds
      // See 5.9.1 in https://media.contentapi.ea.com/content/dam/eacom/frostbite/files/s2016-pbs-frostbite-sky-clouds-new.pdf
      weightedDistanceSum += rayDistance * transmittanceIntegral;
      transmittanceSum += transmittanceIntegral;
    }

    if (transmittanceIntegral <= minTransmittance) {
      break; // Early termination
    }

    // Take a shorter step because we've already hit the clouds.
    stepSize *= perspectiveStepScale;
    rayDistance += stepSize;
  }

  // The final product of 5.9.1 and we'll evaluate this in aerial perspective.
  frontDepth = transmittanceSum > 0.0 ? weightedDistanceSum / transmittanceSum : -1.0;

  return vec4(radianceIntegral, remapClamped(transmittanceIntegral, 1.0, minTransmittance));
}

#ifdef SHADOW_LENGTH

float marchShadowLength(
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const vec2 rayNearFar,
  const float jitter
) {
  float shadowLength = 0.0;
  float maxRayDistance = rayNearFar.y - rayNearFar.x;
  float stepSize = minShadowLengthStepSize;
  float rayDistance = stepSize * jitter;
  const float attenuationFactor = 1.0 - 5e-4;
  float attenuation = 1.0;

  // TODO: This march is closed, and sample resolution can be much lower.
  // Refining the termination by binary search will make it much more efficient.
  for (int i = 0; i < maxShadowLengthIterationCount; ++i) {
    if (rayDistance > maxRayDistance) {
      break; // Termination
    }
    vec3 position = rayDistance * rayDirection + rayOrigin;
    float opticalDepth = sampleShadowOpticalDepth(position, 0.0, 0.0, jitter);
    shadowLength += (1.0 - exp(-opticalDepth)) * stepSize * attenuation;
    stepSize *= perspectiveStepScale;
    rayDistance += stepSize;
  }
  return shadowLength;
}

#endif // SHADOW_LENGTH

#ifdef HAZE

vec4 approximateHaze(
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const float maxRayDistance,
  const float cosTheta,
  const float shadowLength
) {
  float modulation = remapClamped(coverage, 0.2, 0.4);
  if (cameraHeight * modulation < 0.0) {
    return vec4(0.0);
  }
  float density = modulation * hazeDensityScale * exp(-cameraHeight * hazeExponent);
  if (density < 1e-7) {
    return vec4(0.0); // Prevent artifact in views from space
  }

  // Blend two normals by the difference in angle so that normal near the
  // ground becomes that of the origin, and in the sky that of the horizon.
  vec3 normalAtOrigin = normalize(rayOrigin);
  vec3 normalAtHorizon = (rayOrigin - dot(rayOrigin, rayDirection) * rayDirection) / bottomRadius;
  float alpha = remapClamped(dot(normalAtOrigin, normalAtHorizon), 0.9, 1.0);
  vec3 normal = mix(normalAtOrigin, normalAtHorizon, alpha);

  // Analytical optical depth where density exponentially decreases with height.
  // Based on: https://iquilezles.org/articles/fog/
  float angle = max(dot(normal, rayDirection), 1e-5);
  float exponent = angle * hazeExponent;
  float linearTerm = density / hazeExponent / angle;

  // Derive the optical depths separately for with and without shadow length.
  float expTerm = 1.0 - exp(-maxRayDistance * exponent);
  float shadowExpTerm = 1.0 - exp(-min(maxRayDistance, shadowLength) * exponent);
  float opticalDepth = expTerm * linearTerm;
  float shadowOpticalDepth = max((expTerm - shadowExpTerm) * linearTerm, 0.0);
  float transmittance = saturate(1.0 - exp(-opticalDepth));
  float shadowTransmittance = saturate(1.0 - exp(-shadowOpticalDepth));

  vec3 skyIrradiance = vGroundIrradiance.sky;
  vec3 sunIrradiance = vGroundIrradiance.sun;
  vec3 inscatter = sunIrradiance * phaseFunction(cosTheta) * shadowTransmittance;
  inscatter += skyIrradiance * RECIPROCAL_PI4 * skyLightScale * transmittance;
  inscatter *= hazeScatteringCoefficient / (hazeAbsorptionCoefficient + hazeScatteringCoefficient);
  return vec4(inscatter, transmittance);
}

#endif // HAZE

void applyAerialPerspective(
  const vec3 cameraPosition,
  const vec3 frontPosition,
  const float shadowLength,
  inout vec4 color
) {
  vec3 transmittance;
  vec3 inscatter = GetSkyRadianceToPoint(
    cameraPosition * METER_TO_LENGTH_UNIT,
    frontPosition * METER_TO_LENGTH_UNIT,
    shadowLength * METER_TO_LENGTH_UNIT,
    sunDirection,
    transmittance
  );
  color.rgb = color.rgb * transmittance + inscatter * color.a;
}

bool rayIntersectsGround(const vec3 cameraPosition, const vec3 rayDirection) {
  float r = length(cameraPosition);
  float mu = dot(cameraPosition, rayDirection) / r;
  return mu < 0.0 && r * r * (mu * mu - 1.0) + bottomRadius * bottomRadius >= 0.0;
}

struct IntersectionResult {
  bool ground;
  vec4 first;
  vec4 second;
};

IntersectionResult getIntersections(const vec3 cameraPosition, const vec3 rayDirection) {
  IntersectionResult intersections;
  intersections.ground = rayIntersectsGround(cameraPosition, rayDirection);
  raySphereIntersections(
    cameraPosition,
    rayDirection,
    bottomRadius + vec4(0.0, minHeight, maxHeight, shadowTopHeight),
    intersections.first,
    intersections.second
  );
  return intersections;
}

vec2 getRayNearFar(const IntersectionResult intersections) {
  vec2 nearFar;
  if (cameraHeight < minHeight) {
    // View below the clouds
    if (intersections.ground) {
      nearFar = vec2(-1.0); // No clouds to the ground
    } else {
      nearFar = vec2(intersections.second.y, intersections.second.z);
      nearFar.y = min(nearFar.y, maxRayDistance);
    }
  } else if (cameraHeight < maxHeight) {
    // View inside the total cloud layer
    if (intersections.ground) {
      nearFar = vec2(cameraNear, intersections.first.y);
    } else {
      nearFar = vec2(cameraNear, intersections.second.z);
    }
  } else {
    // View above the clouds
    nearFar = vec2(intersections.first.z, intersections.second.z);
    if (intersections.ground) {
      // Clamp the ray at the min height.
      nearFar.y = intersections.first.y;
    }
  }
  return nearFar;
}

#ifdef SHADOW_LENGTH
vec2 getShadowRayNearFar(const IntersectionResult intersections) {
  vec2 nearFar;
  if (cameraHeight < shadowTopHeight) {
    if (intersections.ground) {
      nearFar = vec2(cameraNear, intersections.first.x);
    } else {
      nearFar = vec2(cameraNear, intersections.second.w);
    }
  } else {
    nearFar = vec2(intersections.first.w, intersections.second.w);
    if (intersections.ground) {
      // Clamp the ray at the ground.
      nearFar.y = intersections.first.x;
    }
  }
  nearFar.y = min(nearFar.y, maxShadowLengthRayDistance);
  return nearFar;
}
#endif // SHADOW_LENGTH

#ifdef HAZE
vec2 getHazeRayNearFar(const IntersectionResult intersections) {
  vec2 nearFar;
  if (cameraHeight < maxHeight) {
    if (intersections.ground) {
      nearFar = vec2(cameraNear, intersections.first.x);
    } else {
      nearFar = vec2(cameraNear, intersections.second.z);
    }
  } else {
    nearFar = vec2(cameraNear, intersections.second.z);
    if (intersections.ground) {
      // Clamp the ray at the ground.
      nearFar.y = intersections.first.x;
    }
  }
  return nearFar;
}
#endif // HAZE

float getRayDistanceToScene(const vec3 rayDirection, out float viewZ) {
  float depth = readDepthValue(depthBuffer, vUv * targetUvScale + temporalJitter);
  if (depth < 1.0 - 1e-7) {
    depth = reverseLogDepth(depth, cameraNear, cameraFar);
    viewZ = getViewZ(depth);
    return -viewZ / dot(rayDirection, vCameraDirection);
  }
  viewZ = 0.0;
  return 0.0;
}

void main() {
  #ifdef DEBUG_SHOW_SHADOW_MAP
  outputColor = getCascadedShadowMaps(vUv);
  outputDepthVelocity = vec3(0.0);
  #ifdef SHADOW_LENGTH
  outputShadowLength = 0.0;
  #endif // SHADOW_LENGTH
  return;
  #endif // DEBUG_SHOW_SHADOW_MAP

  vec3 cameraPosition = vCameraPosition + altitudeCorrection;
  vec3 rayDirection = normalize(vRayDirection);
  float cosTheta = dot(sunDirection, rayDirection);

  IntersectionResult intersections = getIntersections(cameraPosition, rayDirection);
  vec2 rayNearFar = getRayNearFar(intersections);
  #ifdef SHADOW_LENGTH
  vec2 shadowRayNearFar = getShadowRayNearFar(intersections);
  #endif // SHADOW_LENGTH
  #ifdef HAZE
  vec2 hazeRayNearFar = getHazeRayNearFar(intersections);
  #endif // HAZE

  float sceneViewZ;
  float rayDistanceToScene = getRayDistanceToScene(rayDirection, sceneViewZ);
  if (rayDistanceToScene > 0.0) {
    rayNearFar.y = min(rayNearFar.y, rayDistanceToScene);
    #ifdef SHADOW_LENGTH
    shadowRayNearFar.y = min(shadowRayNearFar.y, rayDistanceToScene);
    #endif // SHADOW_LENGTH
    #ifdef HAZE
    hazeRayNearFar.y = min(hazeRayNearFar.y, rayDistanceToScene);
    #endif // HAZE
  }

  bool intersectsGround = any(lessThan(rayNearFar, vec2(0.0)));
  bool intersectsScene = rayNearFar.y < rayNearFar.x;

  float stbn = getSTBN();

  vec4 color = vec4(0.0);
  float frontDepth = rayNearFar.y;
  vec3 depthVelocity = vec3(0.0);
  float shadowLength = 0.0;
  bool hitClouds = false;

  if (!intersectsGround && !intersectsScene) {
    vec3 rayOrigin = rayNearFar.x * rayDirection + cameraPosition;

    vec2 globeUv = getGlobeUv(rayOrigin);
    #ifdef DEBUG_SHOW_UV
    outputColor = vec4(vec3(checker(globeUv, localWeatherRepeat + localWeatherOffset)), 1.0);
    outputDepthVelocity = vec3(0.0);
    #ifdef SHADOW_LENGTH
    outputShadowLength = 0.0;
    #endif // SHADOW_LENGTH
    return;
    #endif // DEBUG_SHOW_UV

    float mipLevel = getMipLevel(globeUv * localWeatherRepeat) * mipLevelScale;
    mipLevel = mix(0.0, mipLevel, min(1.0, 0.2 * cameraHeight / maxHeight));

    float marchedFrontDepth;
    ivec3 sampleCount = ivec3(0);
    color = marchClouds(
      rayOrigin,
      rayDirection,
      rayNearFar,
      cosTheta,
      stbn,
      pow(2.0, mipLevel),
      marchedFrontDepth,
      sampleCount
    );

    #ifdef DEBUG_SHOW_SAMPLE_COUNT
    outputColor = vec4(vec3(sampleCount) / vec3(500.0, 5.0, 5.0), 1.0);
    outputDepthVelocity = vec3(0.0);
    #ifdef SHADOW_LENGTH
    outputShadowLength = 0.0;
    #endif // SHADOW_LENGTH
    return;
    #endif // DEBUG_SHOW_SAMPLE_COUNT

    // Front depth will be -1.0 when no samples are accumulated.
    hitClouds = marchedFrontDepth >= 0.0;
    if (hitClouds) {
      frontDepth = rayNearFar.x + marchedFrontDepth;

      #ifdef SHADOW_LENGTH
      // Clamp the shadow length ray at the clouds.
      shadowRayNearFar.y = mix(
        shadowRayNearFar.y,
        min(frontDepth, shadowRayNearFar.y),
        color.a // Interpolate by the alpha for smoother edges.
      );

      // Shadow length must be computed before applying aerial perspective.
      if (all(greaterThanEqual(shadowRayNearFar, vec2(0.0)))) {
        shadowLength = marchShadowLength(
          shadowRayNearFar.x * rayDirection + cameraPosition,
          rayDirection,
          shadowRayNearFar,
          stbn
        );
      }
      #endif // SHADOW_LENGTH

      #ifdef HAZE
      // Clamp the haze ray at the clouds.
      hazeRayNearFar.y = mix(
        hazeRayNearFar.y,
        min(frontDepth, hazeRayNearFar.y),
        color.a // Interpolate by the alpha for smoother edges.
      );
      #endif // HAZE

      // Apply aerial perspective.
      vec3 frontPosition = cameraPosition + frontDepth * rayDirection;
      applyAerialPerspective(cameraPosition, frontPosition, shadowLength, color);

      // Velocity for temporal resolution.
      vec3 frontPositionWorld = ecefToWorld(frontPosition);
      vec4 prevClip = reprojectionMatrix * vec4(frontPositionWorld, 1.0);
      prevClip /= prevClip.w;
      vec2 prevUv = prevClip.xy * 0.5 + 0.5;
      vec2 velocity = vUv - prevUv;
      depthVelocity = vec3(frontDepth, velocity);
    }
  }

  if (!hitClouds) {
    #ifdef SHADOW_LENGTH
    if (all(greaterThanEqual(shadowRayNearFar, vec2(0.0)))) {
      shadowLength = marchShadowLength(
        shadowRayNearFar.x * rayDirection + cameraPosition,
        rayDirection,
        shadowRayNearFar,
        stbn
      );
    }
    #endif // SHADOW_LENGTH

    // Velocity for temporal resolution. Here reproject in the view space for
    // greatly reducing the precision errors.
    frontDepth = sceneViewZ < 0.0 ? -sceneViewZ : cameraFar;
    vec3 frontView = vViewPosition * frontDepth;
    vec4 prevClip = viewReprojectionMatrix * vec4(frontView, 1.0);
    prevClip /= prevClip.w;
    vec2 prevUv = prevClip.xy * 0.5 + 0.5;
    vec2 velocity = vUv - prevUv;
    depthVelocity = vec3(frontDepth, velocity);
  }

  #ifdef DEBUG_SHOW_FRONT_DEPTH
  outputColor = vec4(turbo(frontDepth / maxRayDistance), 1.0);
  outputDepthVelocity = vec3(0.0);
  #ifdef SHADOW_LENGTH
  outputShadowLength = 0.0;
  #endif // SHADOW_LENGTH
  return;
  #endif // DEBUG_SHOW_FRONT_DEPTH

  #ifdef HAZE
  vec4 haze = approximateHaze(
    cameraNear * rayDirection + cameraPosition,
    rayDirection,
    hazeRayNearFar.y - hazeRayNearFar.x,
    cosTheta,
    shadowLength
  );
  color.rgb = mix(color.rgb, haze.rgb, haze.a);
  color.a = color.a * (1.0 - haze.a) + haze.a;
  #endif // HAZE

  outputColor = color;
  outputDepthVelocity = depthVelocity;
  #ifdef SHADOW_LENGTH
  outputShadowLength = shadowLength * METER_TO_LENGTH_UNIT;
  #endif // SHADOW_LENGTH
}
`;
  var Re2 = `float getSTBN() {
  ivec3 size = textureSize(stbnTexture, 0);
  vec3 scale = 1.0 / vec3(size);
  return texture(stbnTexture, vec3(gl_FragCoord.xy, float(frame % size.z)) * scale).r;
}

// Straightforward spherical mapping
vec2 getSphericalUv(const vec3 position) {
  vec2 st = normalize(position.yx);
  float phi = atan(st.x, st.y);
  float theta = asin(normalize(position).z);
  return vec2(phi * RECIPROCAL_PI2 + 0.5, theta * RECIPROCAL_PI + 0.5);
}

vec2 getCubeSphereUv(const vec3 position) {
  // Cube-sphere relaxation by: http://mathproofs.blogspot.com/2005/07/mapping-cube-to-sphere.html
  // TODO: Tile and fix seams.
  // Possible improvements:
  // https://iquilezles.org/articles/texturerepetition/
  // https://gamedev.stackexchange.com/questions/184388/fragment-shader-map-dot-texture-repeatedly-over-the-sphere
  // https://github.com/mmikk/hextile-demo

  vec3 n = normalize(position);
  vec3 f = abs(n);
  vec3 c = n / max(f.x, max(f.y, f.z));
  vec2 m;
  if (all(greaterThan(f.yy, f.xz))) {
    m = c.y > 0.0 ? vec2(-n.x, n.z) : n.xz;
  } else if (all(greaterThan(f.xx, f.yz))) {
    m = c.x > 0.0 ? n.yz : vec2(-n.y, n.z);
  } else {
    m = c.z > 0.0 ? n.xy : vec2(n.x, -n.y);
  }

  vec2 m2 = m * m;
  float q = dot(m2.xy, vec2(-2.0, 2.0)) - 3.0;
  float q2 = q * q;
  vec2 uv;
  uv.x = sqrt(1.5 + m2.x - m2.y - 0.5 * sqrt(-24.0 * m2.x + q2)) * (m.x > 0.0 ? 1.0 : -1.0);
  uv.y = sqrt(6.0 / (3.0 - uv.x * uv.x)) * m.y;
  return uv * 0.5 + 0.5;
}

vec2 getGlobeUv(const vec3 position) {
  return getCubeSphereUv(position);
}

float getMipLevel(const vec2 uv) {
  const float mipLevelScale = 0.1;
  vec2 coord = uv * resolution;
  vec2 ddx = dFdx(coord);
  vec2 ddy = dFdy(coord);
  float deltaMaxSqr = max(dot(ddx, ddx), dot(ddy, ddy)) * mipLevelScale;
  return max(0.0, 0.5 * log2(max(1.0, deltaMaxSqr)));
}

bool insideLayerIntervals(const float height) {
  bvec3 gt = greaterThan(vec3(height), minIntervalHeights);
  bvec3 lt = lessThan(vec3(height), maxIntervalHeights);
  return any(bvec3(gt.x && lt.x, gt.y && lt.y, gt.z && lt.z));
}

struct WeatherSample {
  vec4 heightFraction; // Normalized height of each layer
  vec4 density;
};

vec4 shapeAlteringFunction(const vec4 heightFraction, const vec4 bias) {
  // Apply a semi-circle transform to round the clouds towards the top.
  vec4 biased = pow(heightFraction, bias);
  vec4 x = clamp(biased * 2.0 - 1.0, -1.0, 1.0);
  return 1.0 - x * x;
}

WeatherSample sampleWeather(const vec2 uv, const float height, const float mipLevel) {
  WeatherSample weather;
  weather.heightFraction = remapClamped(vec4(height), minLayerHeights, maxLayerHeights);

  vec4 localWeather = pow(
    textureLod(
      localWeatherTexture,
      uv * localWeatherRepeat + localWeatherOffset,
      mipLevel
    ).LOCAL_WEATHER_CHANNELS,
    weatherExponents
  );
  #ifdef SHADOW
  localWeather *= shadowLayerMask;
  #endif // SHADOW

  vec4 heightScale = shapeAlteringFunction(weather.heightFraction, shapeAlteringBiases);

  // Modulation to control weather by coverage parameter.
  // Reference: https://github.com/Prograda/Skybolt/blob/master/Assets/Core/Shaders/Clouds.h#L63
  vec4 factor = 1.0 - coverage * heightScale;
  weather.density = remapClamped(
    mix(localWeather, vec4(1.0), coverageFilterWidths),
    factor,
    factor + coverageFilterWidths
  );

  return weather;
}

vec4 getLayerDensity(const vec4 heightFraction) {
  // prettier-ignore
  return densityProfile.expTerms * exp(densityProfile.exponents * heightFraction) +
    densityProfile.linearTerms * heightFraction +
    densityProfile.constantTerms;
}

struct MediaSample {
  float density;
  vec4 weight;
  float scattering;
  float extinction;
};

MediaSample sampleMedia(
  const WeatherSample weather,
  const vec3 position,
  const vec2 uv,
  const float mipLevel,
  const float jitter,
  out ivec3 sampleCount
) {
  vec4 density = weather.density;

  // TODO: Define in physical length.
  vec3 surfaceNormal = normalize(position);
  float localWeatherSpeed = length(localWeatherOffset);
  vec3 evolution = -surfaceNormal * localWeatherSpeed * 2e4;

  vec3 turbulence = vec3(0.0);
  #ifdef TURBULENCE
  vec2 turbulenceUv = uv * localWeatherRepeat * turbulenceRepeat;
  turbulence =
    turbulenceDisplacement *
    (texture(turbulenceTexture, turbulenceUv).rgb * 2.0 - 1.0) *
    dot(density, remapClamped(weather.heightFraction, vec4(0.3), vec4(0.0)));
  #endif // TURBULENCE

  vec3 shapePosition = (position + evolution + turbulence) * shapeRepeat + shapeOffset;
  float shape = texture(shapeTexture, shapePosition).r;
  density = remapClamped(density, vec4(1.0 - shape) * shapeAmounts, vec4(1.0));

  #ifdef DEBUG_SHOW_SAMPLE_COUNT
  ++sampleCount.y;
  #endif // DEBUG_SHOW_SAMPLE_COUNT

  #ifdef SHAPE_DETAIL
  if (mipLevel * 0.5 + (jitter - 0.5) * 0.5 < 0.5) {
    vec3 detailPosition = (position + turbulence) * shapeDetailRepeat + shapeDetailOffset;
    float detail = texture(shapeDetailTexture, detailPosition).r;
    // Fluffy at the top and whippy at the bottom.
    vec4 modifier = mix(
      vec4(pow(detail, 6.0)),
      vec4(1.0 - detail),
      remapClamped(weather.heightFraction, vec4(0.2), vec4(0.4))
    );
    modifier = mix(vec4(0.0), modifier, shapeDetailAmounts);
    density = remapClamped(density * 2.0, vec4(modifier * 0.5), vec4(1.0));

    #ifdef DEBUG_SHOW_SAMPLE_COUNT
    ++sampleCount.z;
    #endif // DEBUG_SHOW_SAMPLE_COUNT
  }
  #endif // SHAPE_DETAIL

  // Apply the density profiles.
  density = saturate(density * densityScales * getLayerDensity(weather.heightFraction));

  MediaSample media;
  float densitySum = density.x + density.y + density.z + density.w;
  media.weight = density / densitySum;
  media.scattering = densitySum * scatteringCoefficient;
  media.extinction = densitySum * absorptionCoefficient + media.scattering;
  return media;
}

MediaSample sampleMedia(
  const WeatherSample weather,
  const vec3 position,
  const vec2 uv,
  const float mipLevel,
  const float jitter
) {
  ivec3 sampleCount;
  return sampleMedia(weather, position, uv, mipLevel, jitter, sampleCount);
}
`;
  var vt2 = `precision highp float;
precision highp sampler3D;

#include "atmosphere/bruneton/definitions"

uniform AtmosphereParameters ATMOSPHERE;
uniform vec3 SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform vec3 SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;

uniform sampler2D transmittance_texture;
uniform sampler3D scattering_texture;
uniform sampler2D irradiance_texture;
uniform sampler3D single_mie_scattering_texture;
uniform sampler3D higher_order_scattering_texture;

#include "atmosphere/bruneton/common"
#include "atmosphere/bruneton/runtime"

#include "types"

uniform mat4 inverseProjectionMatrix;
uniform mat4 inverseViewMatrix;
uniform vec3 cameraPosition;
uniform mat4 worldToECEFMatrix;
uniform vec3 altitudeCorrection;

// Atmosphere
uniform float bottomRadius;
uniform vec3 sunDirection;

// Cloud layers
uniform float minHeight;
uniform float maxHeight;

layout(location = 0) in vec3 position;

out vec2 vUv;
out vec3 vCameraPosition;
out vec3 vCameraDirection; // Direction to the center of screen
out vec3 vRayDirection; // Direction to the texel
out vec3 vViewPosition;

out GroundIrradiance vGroundIrradiance;
out CloudsIrradiance vCloudsIrradiance;

void sampleSunSkyIrradiance(const vec3 positionECEF) {
  vGroundIrradiance.sun = GetSunAndSkyScalarIrradiance(
    positionECEF * METER_TO_LENGTH_UNIT,
    sunDirection,
    vGroundIrradiance.sky
  );

  vec3 surfaceNormal = normalize(positionECEF);
  vec2 radii = (bottomRadius + vec2(minHeight, maxHeight)) * METER_TO_LENGTH_UNIT;
  vCloudsIrradiance.minSun = GetSunAndSkyScalarIrradiance(
    surfaceNormal * radii.x,
    sunDirection,
    vCloudsIrradiance.minSky
  );
  vCloudsIrradiance.maxSun = GetSunAndSkyScalarIrradiance(
    surfaceNormal * radii.y,
    sunDirection,
    vCloudsIrradiance.maxSky
  );
}

void main() {
  vUv = position.xy * 0.5 + 0.5;

  vec3 viewPosition = (inverseProjectionMatrix * vec4(position, 1.0)).xyz;
  vec3 worldDirection = (inverseViewMatrix * vec4(viewPosition.xyz, 0.0)).xyz;
  vec3 cameraDirection = normalize((inverseViewMatrix * vec4(0.0, 0.0, -1.0, 0.0)).xyz);
  vCameraPosition = (worldToECEFMatrix * vec4(cameraPosition, 1.0)).xyz;
  vCameraDirection = (worldToECEFMatrix * vec4(cameraDirection, 0.0)).xyz;
  vRayDirection = (worldToECEFMatrix * vec4(worldDirection, 0.0)).xyz;
  vViewPosition = viewPosition;

  sampleSunSkyIrradiance(vCameraPosition + altitudeCorrection);

  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;
  var Le2 = `uniform vec2 resolution;
uniform int frame;
uniform sampler3D stbnTexture;

// Atmosphere
uniform float bottomRadius;
uniform mat4 worldToECEFMatrix;
uniform mat4 ecefToWorldMatrix;
uniform vec3 altitudeCorrection;
uniform vec3 sunDirection;

// Participating medium
uniform float scatteringCoefficient;
uniform float absorptionCoefficient;

// Primary raymarch
uniform float minDensity;
uniform float minExtinction;
uniform float minTransmittance;

// Shape and weather
uniform sampler2D localWeatherTexture;
uniform vec2 localWeatherRepeat;
uniform vec2 localWeatherOffset;
uniform float coverage;
uniform sampler3D shapeTexture;
uniform vec3 shapeRepeat;
uniform vec3 shapeOffset;

#ifdef SHAPE_DETAIL
uniform sampler3D shapeDetailTexture;
uniform vec3 shapeDetailRepeat;
uniform vec3 shapeDetailOffset;
#endif // SHAPE_DETAIL

#ifdef TURBULENCE
uniform sampler2D turbulenceTexture;
uniform vec2 turbulenceRepeat;
uniform float turbulenceDisplacement;
#endif // TURBULENCE

// Haze
#ifdef HAZE
uniform float hazeDensityScale;
uniform float hazeExponent;
uniform float hazeScatteringCoefficient;
uniform float hazeAbsorptionCoefficient;
#endif // HAZE

// Cloud layers
uniform vec4 minLayerHeights;
uniform vec4 maxLayerHeights;
uniform vec3 minIntervalHeights;
uniform vec3 maxIntervalHeights;
uniform vec4 densityScales;
uniform vec4 shapeAmounts;
uniform vec4 shapeDetailAmounts;
uniform vec4 weatherExponents;
uniform vec4 shapeAlteringBiases;
uniform vec4 coverageFilterWidths;
uniform float minHeight;
uniform float maxHeight;
uniform float shadowTopHeight;
uniform float shadowBottomHeight;
uniform vec4 shadowLayerMask;
uniform CloudDensityProfile densityProfile;
`;
  var J2 = `struct GroundIrradiance {
  vec3 sun;
  vec3 sky;
};

struct CloudsIrradiance {
  vec3 minSun;
  vec3 minSky;
  vec3 maxSun;
  vec3 maxSky;
};

struct CloudDensityProfile {
  vec4 expTerms;
  vec4 exponents;
  vec4 linearTerms;
  vec4 constantTerms;
};
`;
  var gt2 = Object.defineProperty;
  var y3 = (o2, e4, t3, n4) => {
    for (var a2 = void 0, i3 = o2.length - 1, s2; i3 >= 0; i3--)
      (s2 = o2[i3]) && (a2 = s2(e4, t3, a2) || a2);
    return a2 && gt2(e4, t3, a2), a2;
  };
  var St2 = /* @__PURE__ */ new Vector3();
  var yt2 = /* @__PURE__ */ new C();
  var g3 = class extends AtmosphereMaterialBase {
    constructor({
      parameterUniforms: e4,
      layerUniforms: t3,
      atmosphereUniforms: n4
    }, a2 = AtmosphereParameters.DEFAULT) {
      super(
        {
          name: "CloudsMaterial",
          glslVersion: GLSL3,
          vertexShader: ar(vt2, {
            atmosphere: {
              bruneton: {
                common: e2,
                definitions: i,
                runtime: c2
              }
            },
            types: J2
          }),
          fragmentShader: Kr(
            ar(mt2, {
              core: {
                depth: d,
                math: x2,
                turbo: h,
                generators: l2,
                raySphereIntersection: u2,
                cascadedShadowMaps: m2,
                interleavedGradientNoise: f,
                vogelDisk: g2
              },
              atmosphere: {
                bruneton: {
                  common: e2,
                  definitions: i,
                  runtime: c2
                }
              },
              types: J2,
              parameters: Le2,
              clouds: Re2
            })
          ),
          // prettier-ignore
          uniforms: {
            ...e4,
            ...t3,
            ...n4,
            depthBuffer: new Uniform(null),
            viewMatrix: new Uniform(new Matrix4()),
            inverseProjectionMatrix: new Uniform(new Matrix4()),
            inverseViewMatrix: new Uniform(new Matrix4()),
            reprojectionMatrix: new Uniform(new Matrix4()),
            viewReprojectionMatrix: new Uniform(new Matrix4()),
            resolution: new Uniform(new Vector2()),
            cameraNear: new Uniform(0),
            cameraFar: new Uniform(0),
            cameraHeight: new Uniform(0),
            frame: new Uniform(0),
            temporalJitter: new Uniform(new Vector2()),
            targetUvScale: new Uniform(new Vector2()),
            mipLevelScale: new Uniform(1),
            stbnTexture: new Uniform(null),
            // Scattering
            skyLightScale: new Uniform(1),
            groundBounceScale: new Uniform(1),
            powderScale: new Uniform(0.8),
            powderExponent: new Uniform(150),
            // Primary raymarch
            maxIterationCount: new Uniform(c4.clouds.maxIterationCount),
            minStepSize: new Uniform(c4.clouds.minStepSize),
            maxStepSize: new Uniform(c4.clouds.maxStepSize),
            maxRayDistance: new Uniform(c4.clouds.maxRayDistance),
            perspectiveStepScale: new Uniform(c4.clouds.perspectiveStepScale),
            minDensity: new Uniform(c4.clouds.minDensity),
            minExtinction: new Uniform(c4.clouds.minExtinction),
            minTransmittance: new Uniform(c4.clouds.minTransmittance),
            // Secondary raymarch
            maxIterationCountToSun: new Uniform(c4.clouds.maxIterationCountToSun),
            maxIterationCountToGround: new Uniform(c4.clouds.maxIterationCountToGround),
            minSecondaryStepSize: new Uniform(c4.clouds.minSecondaryStepSize),
            secondaryStepScale: new Uniform(c4.clouds.secondaryStepScale),
            // Beer shadow map
            shadowBuffer: new Uniform(null),
            shadowTexelSize: new Uniform(new Vector2()),
            shadowIntervals: new Uniform(
              Array.from({ length: 4 }, () => new Vector2())
              // Populate the max number of elements
            ),
            shadowMatrices: new Uniform(
              Array.from({ length: 4 }, () => new Matrix4())
              // Populate the max number of elements
            ),
            shadowFar: new Uniform(0),
            maxShadowFilterRadius: new Uniform(6),
            shadowLayerMask: new Uniform(new Vector4().setScalar(1)),
            // Disable mask
            // Shadow length
            maxShadowLengthIterationCount: new Uniform(c4.clouds.maxShadowLengthIterationCount),
            minShadowLengthStepSize: new Uniform(c4.clouds.minShadowLengthStepSize),
            maxShadowLengthRayDistance: new Uniform(c4.clouds.maxShadowLengthRayDistance),
            // Haze
            hazeDensityScale: new Uniform(3e-5),
            hazeExponent: new Uniform(1e-3),
            hazeScatteringCoefficient: new Uniform(0.9),
            hazeAbsorptionCoefficient: new Uniform(0.5)
          }
        },
        a2
      ), this.temporalUpscale = true, this.depthPacking = 0, this.localWeatherChannels = "rgba", this.shapeDetail = c4.shapeDetail, this.turbulence = c4.turbulence, this.shadowLength = c4.lightShafts, this.haze = c4.haze, this.multiScatteringOctaves = c4.clouds.multiScatteringOctaves, this.accurateSunSkyLight = c4.clouds.accurateSunSkyLight, this.accuratePhaseFunction = c4.clouds.accuratePhaseFunction, this.shadowCascadeCount = c4.shadow.cascadeCount, this.shadowSampleCount = 8, this.scatterAnisotropy1 = 0.7, this.scatterAnisotropy2 = -0.2, this.scatterAnisotropyMix = 0.5;
    }
    onBeforeRender(e4, t3, n4, a2, i3, s2) {
      const l3 = this.defines.USE_LOGARITHMIC_DEPTH_BUFFER != null, h2 = e4.capabilities.logarithmicDepthBuffer;
      h2 !== l3 && (h2 ? this.defines.USE_LOGARITHMIC_DEPTH_BUFFER = "1" : delete this.defines.USE_LOGARITHMIC_DEPTH_BUFFER);
      const u3 = this.defines.POWDER != null, d2 = this.uniforms.powderScale.value > 0;
      d2 !== u3 && (d2 ? this.defines.POWDER = "1" : delete this.defines.POWDER, this.needsUpdate = true);
      const v3 = this.defines.GROUND_BOUNCE != null;
      (this.uniforms.groundBounceScale.value > 0 && this.uniforms.maxIterationCountToGround.value > 0) !== v3 && (d2 ? this.defines.GROUND_BOUNCE = "1" : delete this.defines.GROUND_BOUNCE, this.needsUpdate = true);
    }
    copyCameraSettings(e4) {
      var _a, _b;
      e4.isPerspectiveCamera === true ? this.defines.PERSPECTIVE_CAMERA !== "1" && (this.defines.PERSPECTIVE_CAMERA = "1", this.needsUpdate = true) : this.defines.PERSPECTIVE_CAMERA != null && (delete this.defines.PERSPECTIVE_CAMERA, this.needsUpdate = true);
      const t3 = this.uniforms;
      t3.viewMatrix.value.copy(e4.matrixWorldInverse), t3.inverseViewMatrix.value.copy(e4.matrixWorld);
      const n4 = (_a = this.previousProjectionMatrix) != null ? _a : e4.projectionMatrix, a2 = (_b = this.previousViewMatrix) != null ? _b : e4.matrixWorldInverse, i3 = t3.inverseProjectionMatrix.value, s2 = t3.inverseViewMatrix.value, l3 = t3.reprojectionMatrix.value, h2 = t3.viewReprojectionMatrix.value;
      if (this.temporalUpscale) {
        const v3 = t3.frame.value % 16, C3 = t3.resolution.value, D3 = Oe2[v3], P3 = (D3.x - 0.5) / C3.x * 4, O = (D3.y - 0.5) / C3.y * 4;
        t3.temporalJitter.value.set(P3, O), t3.mipLevelScale.value = 0.25, i3.copy(e4.projectionMatrix), i3.elements[8] += P3 * 2, i3.elements[9] += O * 2, i3.invert(), l3.copy(n4), l3.elements[8] += P3 * 2, l3.elements[9] += O * 2, l3.multiply(a2), h2.copy(l3).multiply(s2);
      } else
        t3.temporalJitter.value.setScalar(0), t3.mipLevelScale.value = 1, i3.copy(e4.projectionMatrixInverse), l3.copy(n4).multiply(a2), h2.copy(l3).multiply(s2);
      Zr(e4), t3.cameraNear.value = e4.near, t3.cameraFar.value = e4.far;
      const u3 = e4.getWorldPosition(
        t3.cameraPosition.value
      ), d2 = St2.copy(u3).applyMatrix4(t3.worldToECEFMatrix.value);
      try {
        t3.cameraHeight.value = yt2.setFromECEF(d2).height;
      } catch {
      }
    }
    // copyCameraSettings can be called multiple times within a frame. Only
    // reliable way is to explicitly store the matrices.
    copyReprojectionMatrix(e4) {
      var _a, _b;
      (_a = this.previousProjectionMatrix) != null ? _a : this.previousProjectionMatrix = new Matrix4(), (_b = this.previousViewMatrix) != null ? _b : this.previousViewMatrix = new Matrix4(), this.previousProjectionMatrix.copy(e4.projectionMatrix), this.previousViewMatrix.copy(e4.matrixWorldInverse);
    }
    setSize(e4, t3, n4, a2) {
      this.uniforms.resolution.value.set(e4, t3), n4 != null && a2 != null ? this.uniforms.targetUvScale.value.set(
        e4 / n4,
        t3 / a2
      ) : this.uniforms.targetUvScale.value.setScalar(1), this.previousProjectionMatrix = void 0, this.previousViewMatrix = void 0;
    }
    setShadowSize(e4, t3) {
      this.uniforms.shadowTexelSize.value.set(1 / e4, 1 / t3);
    }
    get depthBuffer() {
      return this.uniforms.depthBuffer.value;
    }
    set depthBuffer(e4) {
      this.uniforms.depthBuffer.value = e4;
    }
  };
  y3([
    Fr("DEPTH_PACKING")
  ], g3.prototype, "depthPacking");
  y3([
    vr("LOCAL_WEATHER_CHANNELS", {
      validate: (o2) => /^[rgba]{4}$/.test(o2)
    })
  ], g3.prototype, "localWeatherChannels");
  y3([
    Br("SHAPE_DETAIL")
  ], g3.prototype, "shapeDetail");
  y3([
    Br("TURBULENCE")
  ], g3.prototype, "turbulence");
  y3([
    Br("SHADOW_LENGTH")
  ], g3.prototype, "shadowLength");
  y3([
    Br("HAZE")
  ], g3.prototype, "haze");
  y3([
    Fr("MULTI_SCATTERING_OCTAVES", { min: 1, max: 12 })
  ], g3.prototype, "multiScatteringOctaves");
  y3([
    Br("ACCURATE_SUN_SKY_LIGHT")
  ], g3.prototype, "accurateSunSkyLight");
  y3([
    Br("ACCURATE_PHASE_FUNCTION")
  ], g3.prototype, "accuratePhaseFunction");
  y3([
    Fr("SHADOW_CASCADE_COUNT", { min: 1, max: 4 })
  ], g3.prototype, "shadowCascadeCount");
  y3([
    Fr("SHADOW_SAMPLE_COUNT", { min: 1, max: 16 })
  ], g3.prototype, "shadowSampleCount");
  y3([
    Dr("SCATTER_ANISOTROPY_1")
  ], g3.prototype, "scatterAnisotropy1");
  y3([
    Dr("SCATTER_ANISOTROPY_2")
  ], g3.prototype, "scatterAnisotropy2");
  y3([
    Dr("SCATTER_ANISOTROPY_MIX")
  ], g3.prototype, "scatterAnisotropyMix");
  var xt2 = `// Taken from https://gist.github.com/TheRealMJP/c83b8c0f46b63f3a88a5986f4fa982b1
// TODO: Use 5-taps version: https://www.shadertoy.com/view/MtVGWz
// Or even 4 taps (requires preprocessing in the input buffer):
// https://www.shadertoy.com/view/4tyGDD

/**
 * MIT License
 *
 * Copyright (c) 2019 MJP
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

vec4 textureCatmullRom(sampler2D tex, vec2 uv) {
  vec2 texSize = vec2(textureSize(tex, 0));

  // We're going to sample a a 4x4 grid of texels surrounding the target UV
  // coordinate. We'll do this by rounding down the sample location to get the
  // exact center of our "starting" texel. The starting texel will be at
  // location [1, 1] in the grid, where [0, 0] is the top left corner.
  vec2 samplePos = uv * texSize;
  vec2 texPos1 = floor(samplePos - 0.5) + 0.5;

  // Compute the fractional offset from our starting texel to our original
  // sample location, which we'll feed into the Catmull-Rom spline function to
  // get our filter weights.
  vec2 f = samplePos - texPos1;

  // Compute the Catmull-Rom weights using the fractional offset that we
  // calculated earlier. These equations are pre-expanded based on our knowledge
  // of where the texels will be located, which lets us avoid having to evaluate
  // a piece-wise function.
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);

  // Work out weighting factors and sampling offsets that will let us use
  // bilinear filtering to simultaneously evaluate the middle 2 samples from the
  // 4x4 grid.
  vec2 w12 = w1 + w2;
  vec2 offset12 = w2 / (w1 + w2);

  // Compute the final UV coordinates we'll use for sampling the texture
  vec2 texPos0 = texPos1 - 1.0;
  vec2 texPos3 = texPos1 + 2.0;
  vec2 texPos12 = texPos1 + offset12;

  texPos0 /= texSize;
  texPos3 /= texSize;
  texPos12 /= texSize;

  vec4 result = vec4(0.0);
  result += texture(tex, vec2(texPos0.x, texPos0.y)) * w0.x * w0.y;
  result += texture(tex, vec2(texPos12.x, texPos0.y)) * w12.x * w0.y;
  result += texture(tex, vec2(texPos3.x, texPos0.y)) * w3.x * w0.y;

  result += texture(tex, vec2(texPos0.x, texPos12.y)) * w0.x * w12.y;
  result += texture(tex, vec2(texPos12.x, texPos12.y)) * w12.x * w12.y;
  result += texture(tex, vec2(texPos3.x, texPos12.y)) * w3.x * w12.y;

  result += texture(tex, vec2(texPos0.x, texPos3.y)) * w0.x * w3.y;
  result += texture(tex, vec2(texPos12.x, texPos3.y)) * w12.x * w3.y;
  result += texture(tex, vec2(texPos3.x, texPos3.y)) * w3.x * w3.y;

  return result;
}

vec4 textureCatmullRom(sampler2DArray tex, vec3 uv) {
  vec2 texSize = vec2(textureSize(tex, 0));
  vec2 samplePos = uv.xy * texSize;
  vec2 texPos1 = floor(samplePos - 0.5) + 0.5;
  vec2 f = samplePos - texPos1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 offset12 = w2 / (w1 + w2);
  vec2 texPos0 = texPos1 - 1.0;
  vec2 texPos3 = texPos1 + 2.0;
  vec2 texPos12 = texPos1 + offset12;
  texPos0 /= texSize;
  texPos3 /= texSize;
  texPos12 /= texSize;
  vec4 result = vec4(0.0);
  result += texture(tex, vec3(texPos0.x, texPos0.y, uv.z)) * w0.x * w0.y;
  result += texture(tex, vec3(texPos12.x, texPos0.y, uv.z)) * w12.x * w0.y;
  result += texture(tex, vec3(texPos3.x, texPos0.y, uv.z)) * w3.x * w0.y;
  result += texture(tex, vec3(texPos0.x, texPos12.y, uv.z)) * w0.x * w12.y;
  result += texture(tex, vec3(texPos12.x, texPos12.y, uv.z)) * w12.x * w12.y;
  result += texture(tex, vec3(texPos3.x, texPos12.y, uv.z)) * w3.x * w12.y;
  result += texture(tex, vec3(texPos0.x, texPos3.y, uv.z)) * w0.x * w3.y;
  result += texture(tex, vec3(texPos12.x, texPos3.y, uv.z)) * w12.x * w3.y;
  result += texture(tex, vec3(texPos3.x, texPos3.y, uv.z)) * w3.x * w3.y;
  return result;
}
`;
  var wt2 = `precision highp float;
precision highp sampler2DArray;

#include "core/turbo"
#include "catmullRomSampling"
#include "varianceClipping"

uniform sampler2D colorBuffer;
uniform sampler2D depthVelocityBuffer;
uniform sampler2D colorHistoryBuffer;

#ifdef SHADOW_LENGTH
uniform sampler2D shadowLengthBuffer;
uniform sampler2D shadowLengthHistoryBuffer;
#endif // SHADOW_LENGTH

uniform vec2 texelSize;
uniform int frame;
uniform float varianceGamma;
uniform float temporalAlpha;
uniform vec2 jitterOffset;

in vec2 vUv;

layout(location = 0) out vec4 outputColor;
#ifdef SHADOW_LENGTH
layout(location = 1) out float outputShadowLength;
#endif // SHADOW_LENGTH

const ivec2 neighborOffsets[9] = ivec2[9](
  ivec2(-1, -1),
  ivec2(-1, 0),
  ivec2(-1, 1),
  ivec2(0, -1),
  ivec2(0, 0),
  ivec2(0, 1),
  ivec2(1, -1),
  ivec2(1, 0),
  ivec2(1, 1)
);

const ivec4[4] bayerIndices = ivec4[4](
  ivec4(0, 12, 3, 15),
  ivec4(8, 4, 11, 7),
  ivec4(2, 14, 1, 13),
  ivec4(10, 6, 9, 5)
);

vec4 getClosestFragment(const ivec2 coord) {
  vec4 result = vec4(1e7, 0.0, 0.0, 0.0);
  vec4 neighbor;
  #pragma unroll_loop_start
  for (int i = 0; i < 9; ++i) {
    neighbor = texelFetchOffset(depthVelocityBuffer, coord, 0, neighborOffsets[i]);
    if (neighbor.r < result.r) {
      result = neighbor;
    }
  }
  #pragma unroll_loop_end
  return result;
}

void temporalUpscale(
  const ivec2 coord,
  const ivec2 lowResCoord,
  const bool currentFrame,
  out vec4 outputColor,
  out float outputShadowLength
) {
  vec4 currentColor = texelFetch(colorBuffer, lowResCoord, 0);
  #ifdef SHADOW_LENGTH
  vec4 currentShadowLength = vec4(texelFetch(shadowLengthBuffer, lowResCoord, 0).rgb, 1.0);
  #endif // SHADOW_LENGTH

  if (currentFrame) {
    // Use the texel just rendered without any accumulation.
    outputColor = currentColor;
    #ifdef SHADOW_LENGTH
    outputShadowLength = currentShadowLength.r;
    #endif // SHADOW_LENGTH
    return;
  }

  vec4 depthVelocity = getClosestFragment(lowResCoord);
  vec2 velocity = depthVelocity.gb;
  vec2 prevUv = vUv - velocity;
  if (prevUv.x < 0.0 || prevUv.x > 1.0 || prevUv.y < 0.0 || prevUv.y > 1.0) {
    outputColor = currentColor;
    #ifdef SHADOW_LENGTH
    outputShadowLength = currentShadowLength.r;
    #endif // SHADOW_LENGTH
    return; // Rejection
  }

  // Variance clipping with a large variance gamma seems to work fine for
  // upsampling. This increases ghosting, of course, but it's hard to notice on
  // clouds.
  // vec4 historyColor = textureCatmullRom(colorHistoryBuffer, prevUv);
  vec4 historyColor = texture(colorHistoryBuffer, prevUv);
  vec4 clippedColor = varianceClipping(colorBuffer, vUv, currentColor, historyColor, varianceGamma);
  outputColor = clippedColor;

  #ifdef SHADOW_LENGTH
  // Sampling the shadow length history using scene depth doesn't make much
  // sense, but it's too hard to derive it properly. At least this approach
  // resolves the edges of scene objects.
  // vec4 historyShadowLength = vec4(textureCatmullRom(shadowLengthHistoryBuffer, prevUv).rgb, 1.0);
  vec4 historyShadowLength = vec4(texture(shadowLengthHistoryBuffer, prevUv).rgb, 1.0);
  vec4 clippedShadowLength = varianceClipping(
    shadowLengthBuffer,
    vUv,
    currentShadowLength,
    historyShadowLength,
    varianceGamma
  );
  outputShadowLength = clippedShadowLength.r;
  #endif // SHADOW_LENGTH
}

void temporalAntialiasing(const ivec2 coord, out vec4 outputColor, out float outputShadowLength) {
  vec4 currentColor = texelFetch(colorBuffer, coord, 0);
  #ifdef SHADOW_LENGTH
  vec4 currentShadowLength = vec4(texelFetch(shadowLengthBuffer, coord, 0).rgb, 1.0);
  #endif // SHADOW_LENGTH

  vec4 depthVelocity = getClosestFragment(coord);
  vec2 velocity = depthVelocity.gb;

  vec2 prevUv = vUv - velocity;
  if (prevUv.x < 0.0 || prevUv.x > 1.0 || prevUv.y < 0.0 || prevUv.y > 1.0) {
    outputColor = currentColor;
    #ifdef SHADOW_LENGTH
    outputShadowLength = currentShadowLength.r;
    #endif // SHADOW_LENGTH
    return; // Rejection
  }

  vec4 historyColor = texture(colorHistoryBuffer, prevUv);
  vec4 clippedColor = varianceClipping(colorBuffer, coord, currentColor, historyColor);
  outputColor = mix(clippedColor, currentColor, temporalAlpha);

  #ifdef SHADOW_LENGTH
  vec4 historyShadowLength = vec4(texture(shadowLengthHistoryBuffer, prevUv).rgb, 1.0);
  vec4 clippedShadowLength = varianceClipping(
    shadowLengthBuffer,
    coord,
    currentShadowLength,
    historyShadowLength
  );
  outputShadowLength = mix(clippedShadowLength.r, currentShadowLength.r, temporalAlpha);
  #endif // SHADOW_LENGTH
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);

  #if !defined(SHADOW_LENGTH)
  float outputShadowLength;
  #endif // !defined(SHADOW_LENGTH)

  #ifdef TEMPORAL_UPSCALE
  ivec2 lowResCoord = coord / 4;
  int bayerValue = bayerIndices[coord.x % 4][coord.y % 4];
  bool currentFrame = bayerValue == frame % 16;
  temporalUpscale(coord, lowResCoord, currentFrame, outputColor, outputShadowLength);
  #else // TEMPORAL_UPSCALE
  temporalAntialiasing(coord, outputColor, outputShadowLength);
  #endif // TEMPORAL_UPSCALE

  #if defined(SHADOW_LENGTH) && defined(DEBUG_SHOW_SHADOW_LENGTH)
  outputColor = vec4(turbo(outputShadowLength * 0.05), 1.0);
  #endif // defined(SHADOW_LENGTH) && defined(DEBUG_SHOW_SHADOW_LENGTH)

  #ifdef DEBUG_SHOW_VELOCITY
  outputColor.rgb = outputColor.rgb + vec3(abs(texture(depthVelocityBuffer, vUv).gb) * 10.0, 0.0);
  #endif // DEBUG_SHOW_VELOCITY
}
`;
  var Ct2 = `precision highp float;

layout(location = 0) in vec3 position;

out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;
  var Me2 = `#ifdef VARIANCE_9_SAMPLES
#define VARIANCE_OFFSET_COUNT 8
const ivec2 varianceOffsets[8] = ivec2[8](
  ivec2(-1, -1),
  ivec2(-1, 1),
  ivec2(1, -1),
  ivec2(1, 1),
  ivec2(1, 0),
  ivec2(0, -1),
  ivec2(0, 1),
  ivec2(-1, 0)
);
#else // VARIANCE_9_SAMPLES
#define VARIANCE_OFFSET_COUNT 4
const ivec2 varianceOffsets[4] = ivec2[4](ivec2(1, 0), ivec2(0, -1), ivec2(0, 1), ivec2(-1, 0));
#endif // VARIANCE_9_SAMPLES

// Reference: https://github.com/playdeadgames/temporal
vec4 clipAABB(const vec4 current, const vec4 history, const vec4 minColor, const vec4 maxColor) {
  vec3 pClip = 0.5 * (maxColor.rgb + minColor.rgb);
  vec3 eClip = 0.5 * (maxColor.rgb - minColor.rgb) + 1e-7;
  vec4 vClip = history - vec4(pClip, current.a);
  vec3 vUnit = vClip.xyz / eClip;
  vec3 aUnit = abs(vUnit);
  float maUnit = max(aUnit.x, max(aUnit.y, aUnit.z));
  if (maUnit > 1.0) {
    return vec4(pClip, current.a) + vClip / maUnit;
  }
  return history;
}

#ifdef VARIANCE_SAMPLER_ARRAY
#define VARIANCE_SAMPLER sampler2DArray
#define VARIANCE_SAMPLER_COORD ivec3
#else // VARIANCE_SAMPLER_ARRAY
#define VARIANCE_SAMPLER sampler2D
#define VARIANCE_SAMPLER_COORD ivec2
#endif // VARIANCE_SAMPLER_ARRAY

// Variance clipping
// Reference: https://developer.download.nvidia.com/gameworks/events/GDC2016/msalvi_temporal_supersampling.pdf
vec4 varianceClipping(
  const VARIANCE_SAMPLER inputBuffer,
  const VARIANCE_SAMPLER_COORD coord,
  const vec4 current,
  const vec4 history,
  const float gamma
) {
  vec4 moment1 = current;
  vec4 moment2 = current * current;
  vec4 neighbor;
  #pragma unroll_loop_start
  for (int i = 0; i < 8; ++i) {
    #if UNROLLED_LOOP_INDEX < VARIANCE_OFFSET_COUNT
    neighbor = texelFetchOffset(inputBuffer, coord, 0, varianceOffsets[i]);
    moment1 += neighbor;
    moment2 += neighbor * neighbor;
    #endif // UNROLLED_LOOP_INDEX < VARIANCE_OFFSET_COUNT
  }
  #pragma unroll_loop_end

  const float N = float(VARIANCE_OFFSET_COUNT + 1);
  vec4 mean = moment1 / N;
  vec4 varianceGamma = sqrt(max(moment2 / N - mean * mean, 0.0)) * gamma;
  vec4 minColor = mean - varianceGamma;
  vec4 maxColor = mean + varianceGamma;
  return clipAABB(clamp(mean, minColor, maxColor), history, minColor, maxColor);
}

vec4 varianceClipping(
  const VARIANCE_SAMPLER inputBuffer,
  const VARIANCE_SAMPLER_COORD coord,
  const vec4 current,
  const vec4 history
) {
  return varianceClipping(inputBuffer, coord, current, history, 1.0);
}

vec4 varianceClipping(
  const sampler2D inputBuffer,
  const vec2 coord,
  const vec4 current,
  const vec4 history,
  const float gamma
) {
  vec4 moment1 = current;
  vec4 moment2 = current * current;
  vec4 neighbor;
  #pragma unroll_loop_start
  for (int i = 0; i < 8; ++i) {
    #if UNROLLED_LOOP_INDEX < VARIANCE_OFFSET_COUNT
    neighbor = textureOffset(inputBuffer, coord, varianceOffsets[i]);
    moment1 += neighbor;
    moment2 += neighbor * neighbor;
    #endif // UNROLLED_LOOP_INDEX < VARIANCE_OFFSET_COUNT
  }
  #pragma unroll_loop_end

  const float N = float(VARIANCE_OFFSET_COUNT + 1);
  vec4 mean = moment1 / N;
  vec4 varianceGamma = sqrt(max(moment2 / N - mean * mean, 0.0)) * gamma;
  vec4 minColor = mean - varianceGamma;
  vec4 maxColor = mean + varianceGamma;
  return clipAABB(clamp(mean, minColor, maxColor), history, minColor, maxColor);
}

vec4 varianceClipping(
  const sampler2D inputBuffer,
  const vec2 coord,
  const vec4 current,
  const vec4 history
) {
  return varianceClipping(inputBuffer, coord, current, history, 1.0);
}
`;
  var Tt2 = Object.defineProperty;
  var Ie2 = (o2, e4, t3, n4) => {
    for (var a2 = void 0, i3 = o2.length - 1, s2; i3 >= 0; i3--)
      (s2 = o2[i3]) && (a2 = s2(e4, t3, a2) || a2);
    return a2 && Tt2(e4, t3, a2), a2;
  };
  var te2 = class extends RawShaderMaterial {
    constructor({
      colorBuffer: e4 = null,
      depthVelocityBuffer: t3 = null,
      shadowLengthBuffer: n4 = null,
      colorHistoryBuffer: a2 = null,
      shadowLengthHistoryBuffer: i3 = null
    } = {}) {
      super({
        name: "CloudsResolveMaterial",
        glslVersion: GLSL3,
        vertexShader: Ct2,
        fragmentShader: Kr(
          ar(wt2, {
            core: { turbo: h },
            catmullRomSampling: xt2,
            varianceClipping: Me2
          })
        ),
        uniforms: {
          colorBuffer: new Uniform(e4),
          depthVelocityBuffer: new Uniform(t3),
          shadowLengthBuffer: new Uniform(n4),
          colorHistoryBuffer: new Uniform(a2),
          shadowLengthHistoryBuffer: new Uniform(i3),
          texelSize: new Uniform(new Vector2()),
          frame: new Uniform(0),
          jitterOffset: new Uniform(new Vector2()),
          varianceGamma: new Uniform(2),
          temporalAlpha: new Uniform(0.1)
        }
      }), this.temporalUpscale = true, this.shadowLength = true;
    }
    setSize(e4, t3) {
      this.uniforms.texelSize.value.set(1 / e4, 1 / t3);
    }
    onBeforeRender(e4, t3, n4, a2, i3, s2) {
      const h2 = this.uniforms.frame.value % 16, u3 = Oe2[h2], d2 = (u3.x - 0.5) * 4, v3 = (u3.y - 0.5) * 4;
      this.uniforms.jitterOffset.value.set(d2, v3);
    }
  };
  Ie2([
    Br("TEMPORAL_UPSCALE")
  ], te2.prototype, "temporalUpscale");
  Ie2([
    Br("SHADOW_LENGTH")
  ], te2.prototype, "shadowLength");
  var Ne2 = class extends Pass {
    constructor(e4, t3) {
      super(e4), this._mainCamera = new Camera();
      const { shadow: n4 } = t3;
      this.shadow = n4;
    }
    get mainCamera() {
      return this._mainCamera;
    }
    set mainCamera(e4) {
      this._mainCamera = e4;
    }
  };
  function Y2(o2, { depthVelocity: e4, shadowLength: t3 }) {
    const n4 = new WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      type: HalfFloatType
    });
    n4.texture.minFilter = LinearFilter, n4.texture.magFilter = LinearFilter, n4.texture.name = o2;
    let a2;
    e4 && (a2 = n4.texture.clone(), a2.isRenderTargetTexture = true, n4.depthVelocity = a2, n4.textures.push(a2));
    let i3;
    return t3 && (i3 = n4.texture.clone(), i3.isRenderTargetTexture = true, i3.format = RedFormat, n4.shadowLength = i3, n4.textures.push(i3)), Object.assign(n4, {
      depthVelocity: a2 != null ? a2 : null,
      shadowLength: i3 != null ? i3 : null
    });
  }
  var Dt2 = class extends Ne2 {
    constructor({
      parameterUniforms: e4,
      layerUniforms: t3,
      atmosphereUniforms: n4,
      ...a2
    }, i3) {
      super("CloudsPass", a2), this.atmosphere = i3, this.width = 0, this.height = 0, this.currentMaterial = new g3(
        {
          parameterUniforms: e4,
          layerUniforms: t3,
          atmosphereUniforms: n4
        },
        i3
      ), this.currentPass = new ShaderPass(this.currentMaterial), this.resolveMaterial = new te2(), this.resolvePass = new ShaderPass(this.resolveMaterial), this.initRenderTargets({
        depthVelocity: true,
        shadowLength: c4.lightShafts
      });
    }
    copyCameraSettings(e4) {
      this.currentMaterial.copyCameraSettings(e4);
    }
    initialize(e4, t3, n4) {
      this.currentPass.initialize(e4, t3, n4), this.resolvePass.initialize(e4, t3, n4);
    }
    initRenderTargets(e4) {
      var _a, _b, _c;
      (_a = this.currentRenderTarget) == null ? void 0 : _a.dispose(), (_b = this.resolveRenderTarget) == null ? void 0 : _b.dispose(), (_c = this.historyRenderTarget) == null ? void 0 : _c.dispose();
      const t3 = Y2("Clouds", e4), n4 = Y2("Clouds.A", {
        ...e4,
        depthVelocity: false
      }), a2 = Y2("Clouds.B", {
        ...e4,
        depthVelocity: false
      });
      this.currentRenderTarget = t3, this.resolveRenderTarget = n4, this.historyRenderTarget = a2;
      const i3 = this.resolveMaterial.uniforms;
      i3.colorBuffer.value = t3.texture, i3.depthVelocityBuffer.value = t3.depthVelocity, i3.shadowLengthBuffer.value = t3.shadowLength, i3.colorHistoryBuffer.value = a2.texture, i3.shadowLengthHistoryBuffer.value = a2.shadowLength;
    }
    copyShadow() {
      const e4 = this.shadow, t3 = this.currentMaterial.uniforms;
      for (let n4 = 0; n4 < e4.cascadeCount; ++n4) {
        const a2 = e4.cascades[n4];
        t3.shadowIntervals.value[n4].copy(a2.interval), t3.shadowMatrices.value[n4].copy(a2.matrix);
      }
      t3.shadowFar.value = e4.far;
    }
    copyReprojection() {
      this.currentMaterial.copyReprojectionMatrix(this.mainCamera);
    }
    swapBuffers() {
      const e4 = this.historyRenderTarget, t3 = this.resolveRenderTarget;
      this.resolveRenderTarget = e4, this.historyRenderTarget = t3;
      const n4 = this.resolveMaterial.uniforms;
      n4.colorHistoryBuffer.value = t3.texture, n4.shadowLengthHistoryBuffer.value = t3.shadowLength;
    }
    update(e4, t3, n4) {
      this.currentMaterial.uniforms.frame.value = t3, this.resolveMaterial.uniforms.frame.value = t3, this.copyCameraSettings(this.mainCamera), this.copyShadow(), this.currentPass.render(e4, null, this.currentRenderTarget), this.resolvePass.render(e4, null, this.resolveRenderTarget), this.copyReprojection(), this.swapBuffers();
    }
    setSize(e4, t3) {
      if (this.width = e4, this.height = t3, this.temporalUpscale) {
        const n4 = Math.ceil(e4 / 4), a2 = Math.ceil(t3 / 4);
        this.currentRenderTarget.setSize(n4, a2), this.currentMaterial.setSize(
          n4 * 4,
          a2 * 4,
          e4,
          t3
        );
      } else
        this.currentRenderTarget.setSize(e4, t3), this.currentMaterial.setSize(e4, t3);
      this.resolveRenderTarget.setSize(e4, t3), this.resolveMaterial.setSize(e4, t3), this.historyRenderTarget.setSize(e4, t3);
    }
    setShadowSize(e4, t3, n4) {
      this.currentMaterial.shadowCascadeCount = n4, this.currentMaterial.setShadowSize(e4, t3);
    }
    setDepthTexture(e4, t3) {
      this.currentMaterial.depthBuffer = e4, this.currentMaterial.depthPacking = t3 != null ? t3 : 0;
    }
    get outputBuffer() {
      return this.historyRenderTarget.texture;
    }
    get shadowBuffer() {
      return this.currentMaterial.uniforms.shadowBuffer.value;
    }
    set shadowBuffer(e4) {
      this.currentMaterial.uniforms.shadowBuffer.value = e4;
    }
    get shadowLengthBuffer() {
      return this.historyRenderTarget.shadowLength;
    }
    get temporalUpscale() {
      return this.currentMaterial.temporalUpscale;
    }
    set temporalUpscale(e4) {
      e4 !== this.temporalUpscale && (this.currentMaterial.temporalUpscale = e4, this.resolveMaterial.temporalUpscale = e4, this.setSize(this.width, this.height));
    }
    get lightShafts() {
      return this.currentMaterial.shadowLength;
    }
    set lightShafts(e4) {
      e4 !== this.lightShafts && (this.currentMaterial.shadowLength = e4, this.resolveMaterial.shadowLength = e4, this.initRenderTargets({
        depthVelocity: true,
        shadowLength: e4
      }), this.setSize(this.width, this.height));
    }
  };
  function Et2(o2, e4) {
    const n4 = o2.properties.get(e4.texture).__webglTexture, a2 = o2.getContext();
    A4(a2 instanceof WebGL2RenderingContext), o2.setRenderTarget(e4);
    const i3 = [];
    if (n4 != null)
      for (let s2 = 0; s2 < e4.depth; ++s2)
        a2.framebufferTextureLayer(
          a2.FRAMEBUFFER,
          a2.COLOR_ATTACHMENT0 + s2,
          n4,
          0,
          s2
        ), i3.push(a2.COLOR_ATTACHMENT0 + s2);
    a2.drawBuffers(i3);
  }
  var xe2 = class extends ShaderPass {
    render(e4, t3, n4, a2, i3) {
      const s2 = this.fullscreenMaterial.uniforms;
      t3 !== null && (s2 == null ? void 0 : s2[this.input]) != null && (s2[this.input].value = t3.texture), Et2(e4, n4), e4.render(this.scene, this.camera);
    }
  };
  var At2 = `precision highp float;
precision highp sampler3D;

#include <common>

#include "core/math"
#include "core/raySphereIntersection"
#include "types"
#include "parameters"
#include "structuredSampling"
#include "clouds"

uniform mat4 inverseShadowMatrices[CASCADE_COUNT];
uniform mat4 reprojectionMatrices[CASCADE_COUNT];

// Primary raymarch
uniform int maxIterationCount;
uniform float minStepSize;
uniform float maxStepSize;
uniform float opticalDepthTailScale;

in vec2 vUv;

layout(location = 0) out vec4 outputColor[CASCADE_COUNT];

// Redundant notation for prettier.
#if CASCADE_COUNT == 1
layout(location = 1) out vec3 outputDepthVelocity[CASCADE_COUNT];
#elif CASCADE_COUNT == 2
layout(location = 2) out vec3 outputDepthVelocity[CASCADE_COUNT];
#elif CASCADE_COUNT == 3
layout(location = 3) out vec3 outputDepthVelocity[CASCADE_COUNT];
#elif CASCADE_COUNT == 4
layout(location = 4) out vec3 outputDepthVelocity[CASCADE_COUNT];
#endif // CASCADE_COUNT

vec4 marchClouds(
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const float maxRayDistance,
  const float jitter,
  const float mipLevel
) {
  // Setup structured volume sampling (SVS).
  // While SVS introduces spatial aliasing, it is indeed temporally stable,
  // which is important for lower-resolution shadow maps where a flickering
  // single pixel can be highly noticeable.
  vec3 normal = getStructureNormal(rayDirection, jitter);
  float rayDistance;
  float stepSize;
  intersectStructuredPlanes(
    normal,
    rayOrigin,
    rayDirection,
    clamp(maxRayDistance / float(maxIterationCount), minStepSize, maxStepSize),
    rayDistance,
    stepSize
  );

  #ifdef TEMPORAL_JITTER
  rayDistance -= stepSize * jitter;
  #endif // TEMPORAL_JITTER

  float extinctionSum = 0.0;
  float maxOpticalDepth = 0.0;
  float maxOpticalDepthTail = 0.0;
  float transmittanceIntegral = 1.0;
  float weightedDistanceSum = 0.0;
  float transmittanceSum = 0.0;

  int sampleCount = 0;
  for (int i = 0; i < maxIterationCount; ++i) {
    if (rayDistance > maxRayDistance) {
      break; // Termination
    }

    vec3 position = rayDistance * rayDirection + rayOrigin;
    float height = length(position) - bottomRadius;

    #if !defined(DEBUG_MARCH_INTERVALS)
    if (insideLayerIntervals(height)) {
      rayDistance += stepSize;
      continue;
    }
    #endif // !defined(DEBUG_MARCH_INTERVALS)

    // Sample rough weather.
    vec2 uv = getGlobeUv(position);
    WeatherSample weather = sampleWeather(uv, height, mipLevel);

    if (any(greaterThan(weather.density, vec4(minDensity)))) {
      // Sample detailed participating media.
      // Note this assumes an homogeneous medium.
      MediaSample media = sampleMedia(weather, position, uv, mipLevel, jitter);
      if (media.extinction > minExtinction) {
        extinctionSum += media.extinction;
        maxOpticalDepth += media.extinction * stepSize;
        transmittanceIntegral *= exp(-media.extinction * stepSize);
        weightedDistanceSum += rayDistance * transmittanceIntegral;
        transmittanceSum += transmittanceIntegral;
        ++sampleCount;
      }
    }

    if (transmittanceIntegral <= minTransmittance) {
      // A large amount of optical depth accumulates in the tail, beyond the
      // point of minimum transmittance. The expected optical depth seems to
      // decrease exponentially with the number of samples taken before reaching
      // the minimum transmittance.
      // See the discussion here: https://x.com/shotamatsuda/status/1886259549931520437
      maxOpticalDepthTail = min(
        opticalDepthTailScale * stepSize * exp(float(1 - sampleCount)),
        stepSize * 0.5 // Excessive optical depth only introduces aliasing.
      );
      break; // Early termination
    }
    rayDistance += stepSize;
  }

  if (sampleCount == 0) {
    return vec4(maxRayDistance, 0.0, 0.0, 0.0);
  }
  float frontDepth = min(weightedDistanceSum / transmittanceSum, maxRayDistance);
  float meanExtinction = extinctionSum / float(sampleCount);
  return vec4(frontDepth, meanExtinction, maxOpticalDepth, maxOpticalDepthTail);
}

void getRayNearFar(
  const vec3 sunPosition,
  const vec3 rayDirection,
  out float rayNear,
  out float rayFar
) {
  vec4 firstIntersections = raySphereFirstIntersection(
    sunPosition,
    rayDirection,
    vec3(0.0),
    bottomRadius + vec4(shadowTopHeight, shadowBottomHeight, 0.0, 0.0)
  );
  rayNear = max(0.0, firstIntersections.x);
  rayFar = firstIntersections.y;
  if (rayFar < 0.0) {
    rayFar = 1e6;
  }
}

void cascade(
  const int cascadeIndex,
  const float mipLevel,
  out vec4 outputColor,
  out vec3 outputDepthVelocity
) {
  vec2 clip = vUv * 2.0 - 1.0;
  vec4 point = inverseShadowMatrices[cascadeIndex] * vec4(clip.xy, -1.0, 1.0);
  point /= point.w;
  vec3 sunPosition = (worldToECEFMatrix * vec4(point.xyz, 1.0)).xyz + altitudeCorrection;

  vec3 rayDirection = normalize(-sunDirection);
  float rayNear;
  float rayFar;
  getRayNearFar(sunPosition, rayDirection, rayNear, rayFar);

  vec3 rayOrigin = rayNear * rayDirection + sunPosition;
  float stbn = getSTBN();
  vec4 color = marchClouds(rayOrigin, rayDirection, rayFar - rayNear, stbn, mipLevel);
  outputColor = color;

  // Velocity for temporal resolution.
  #ifdef TEMPORAL_PASS
  vec3 frontPosition = color.x * rayDirection + rayOrigin;
  vec3 frontPositionWorld = (ecefToWorldMatrix * vec4(frontPosition - altitudeCorrection, 1.0)).xyz;
  vec4 prevClip = reprojectionMatrices[cascadeIndex] * vec4(frontPositionWorld, 1.0);
  prevClip /= prevClip.w;
  vec2 prevUv = prevClip.xy * 0.5 + 0.5;
  vec2 velocity = (vUv - prevUv) * resolution;
  outputDepthVelocity = vec3(color.x, velocity);
  #else // TEMPORAL_PASS
  outputDepthVelocity = vec3(0.0);
  #endif // TEMPORAL_PASS
}

// TODO: Calculate from the main camera frustum perhaps?
const float mipLevels[4] = float[4](0.0, 0.5, 1.0, 2.0);

void main() {
  #pragma unroll_loop_start
  for (int i = 0; i < 4; ++i) {
    #if UNROLLED_LOOP_INDEX < CASCADE_COUNT
    cascade(UNROLLED_LOOP_INDEX, mipLevels[i], outputColor[i], outputDepthVelocity[i]);
    #endif // UNROLLED_LOOP_INDEX < CASCADE_COUNT
  }
  #pragma unroll_loop_end
}
`;
  var _t2 = `precision highp float;

layout(location = 0) in vec3 position;

out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;
  var Pt2 = `// Implements Structured Volume Sampling in fragment shader:
// https://github.com/huwb/volsample
// Implementation reference:
// https://www.shadertoy.com/view/ttVfDc

void getIcosahedralVertices(const vec3 direction, out vec3 v1, out vec3 v2, out vec3 v3) {
  // Normalization scalers to fit dodecahedron to unit sphere.
  const float a = 0.85065080835204; // phi / sqrt(2 + phi)
  const float b = 0.5257311121191336; // 1 / sqrt(2 + phi)

  // Derive the vertices of icosahedron where triangle intersects the direction.
  // See: https://www.ppsloan.org/publications/AmbientDice.pdf
  const float kT = 0.6180339887498948; // 1 / phi
  const float kT2 = 0.38196601125010515; // 1 / phi^2
  vec3 absD = abs(direction);
  float selector1 = dot(absD, vec3(1.0, kT2, -kT));
  float selector2 = dot(absD, vec3(-kT, 1.0, kT2));
  float selector3 = dot(absD, vec3(kT2, -kT, 1.0));
  v1 = selector1 > 0.0 ? vec3(a, b, 0.0) : vec3(-b, 0.0, a);
  v2 = selector2 > 0.0 ? vec3(0.0, a, b) : vec3(a, -b, 0.0);
  v3 = selector3 > 0.0 ? vec3(b, 0.0, a) : vec3(0.0, a, -b);
  vec3 octantSign = sign(direction);
  v1 *= octantSign;
  v2 *= octantSign;
  v3 *= octantSign;
}

void swapIfBigger(inout vec4 a, inout vec4 b) {
  if (a.w > b.w) {
    vec4 t = a;
    a = b;
    b = t;
  }
}

void sortVertices(inout vec3 a, inout vec3 b, inout vec3 c) {
  const vec3 base = vec3(0.5, 0.5, 1.0);
  vec4 aw = vec4(a, dot(a, base));
  vec4 bw = vec4(b, dot(b, base));
  vec4 cw = vec4(c, dot(c, base));
  swapIfBigger(aw, bw);
  swapIfBigger(bw, cw);
  swapIfBigger(aw, bw);
  a = aw.xyz;
  b = bw.xyz;
  c = cw.xyz;
}

vec3 getPentagonalWeights(const vec3 direction, const vec3 v1, const vec3 v2, const vec3 v3) {
  float d1 = dot(v1, direction);
  float d2 = dot(v2, direction);
  float d3 = dot(v3, direction);
  vec3 w = exp(vec3(d1, d2, d3) * 40.0);
  return w / (w.x + w.y + w.z);
}

vec3 getStructureNormal(
  const vec3 direction,
  const float jitter,
  out vec3 a,
  out vec3 b,
  out vec3 c,
  out vec3 weights
) {
  getIcosahedralVertices(direction, a, b, c);
  sortVertices(a, b, c);
  weights = getPentagonalWeights(direction, a, b, c);
  return jitter < weights.x
    ? a
    : jitter < weights.x + weights.y
      ? b
      : c;
}

vec3 getStructureNormal(const vec3 direction, const float jitter) {
  vec3 a, b, c, weights;
  return getStructureNormal(direction, jitter, a, b, c, weights);
}

// Reference: https://github.com/huwb/volsample/blob/master/src/unity/Assets/Shaders/RayMarchCore.cginc
void intersectStructuredPlanes(
  const vec3 normal,
  const vec3 rayOrigin,
  const vec3 rayDirection,
  const float samplePeriod,
  out float stepOffset,
  out float stepSize
) {
  float NoD = dot(rayDirection, normal);
  stepSize = samplePeriod / abs(NoD);

  // Skips leftover bit to get from rayOrigin to first strata plane.
  stepOffset = -mod(dot(rayOrigin, normal), samplePeriod) / NoD;

  // mod() gives different results depending on if the arg is negative or
  // positive. This line makes it consistent, and ensures the first sample is in
  // front of the viewer.
  if (stepOffset < 0.0) {
    stepOffset += stepSize;
  }
}
`;
  var Ot = Object.defineProperty;
  var M2 = (o2, e4, t3, n4) => {
    for (var a2 = void 0, i3 = o2.length - 1, s2; i3 >= 0; i3--)
      (s2 = o2[i3]) && (a2 = s2(e4, t3, a2) || a2);
    return a2 && Ot(e4, t3, a2), a2;
  };
  var _2 = class extends RawShaderMaterial {
    constructor({
      parameterUniforms: e4,
      layerUniforms: t3,
      atmosphereUniforms: n4
    }) {
      super({
        name: "ShadowMaterial",
        glslVersion: GLSL3,
        vertexShader: _t2,
        fragmentShader: Kr(
          ar(At2, {
            core: {
              math: x2,
              raySphereIntersection: u2
            },
            types: J2,
            parameters: Le2,
            structuredSampling: Pt2,
            clouds: Re2
          })
        ),
        uniforms: {
          ...e4,
          ...t3,
          ...n4,
          inverseShadowMatrices: new Uniform(
            Array.from({ length: 4 }, () => new Matrix4())
            // Populate the max number of elements
          ),
          reprojectionMatrices: new Uniform(
            Array.from({ length: 4 }, () => new Matrix4())
            // Populate the max number of elements
          ),
          resolution: new Uniform(new Vector2()),
          frame: new Uniform(0),
          stbnTexture: new Uniform(null),
          // Primary raymarch
          maxIterationCount: new Uniform(c4.shadow.maxIterationCount),
          minStepSize: new Uniform(c4.shadow.minStepSize),
          maxStepSize: new Uniform(c4.shadow.maxStepSize),
          minDensity: new Uniform(c4.shadow.minDensity),
          minExtinction: new Uniform(c4.shadow.minExtinction),
          minTransmittance: new Uniform(c4.shadow.minTransmittance),
          opticalDepthTailScale: new Uniform(2)
        },
        defines: {
          SHADOW: "1",
          TEMPORAL_PASS: "1",
          TEMPORAL_JITTER: "1"
        }
      }), this.localWeatherChannels = "rgba", this.cascadeCount = c4.shadow.cascadeCount, this.temporalPass = true, this.temporalJitter = true, this.shapeDetail = c4.shapeDetail, this.turbulence = c4.turbulence, this.cascadeCount = c4.shadow.cascadeCount;
    }
    setSize(e4, t3) {
      this.uniforms.resolution.value.set(e4, t3);
    }
  };
  M2([
    vr("LOCAL_WEATHER_CHANNELS", {
      validate: (o2) => /^[rgba]{4}$/.test(o2)
    })
  ], _2.prototype, "localWeatherChannels");
  M2([
    Fr("CASCADE_COUNT", { min: 1, max: 4 })
  ], _2.prototype, "cascadeCount");
  M2([
    Br("TEMPORAL_PASS")
  ], _2.prototype, "temporalPass");
  M2([
    Br("TEMPORAL_JITTER")
  ], _2.prototype, "temporalJitter");
  M2([
    Br("SHAPE_DETAIL")
  ], _2.prototype, "shapeDetail");
  M2([
    Br("TURBULENCE")
  ], _2.prototype, "turbulence");
  var Rt2 = `precision highp float;
precision highp sampler2DArray;

#define VARIANCE_9_SAMPLES 1
#define VARIANCE_SAMPLER_ARRAY 1

#include "varianceClipping"

uniform sampler2DArray inputBuffer;
uniform sampler2DArray historyBuffer;

uniform vec2 texelSize;
uniform float varianceGamma;
uniform float temporalAlpha;

in vec2 vUv;

layout(location = 0) out vec4 outputColor[CASCADE_COUNT];

const ivec2 neighborOffsets[9] = ivec2[9](
  ivec2(-1, -1),
  ivec2(-1, 0),
  ivec2(-1, 1),
  ivec2(0, -1),
  ivec2(0, 0),
  ivec2(0, 1),
  ivec2(1, -1),
  ivec2(1, 0),
  ivec2(1, 1)
);

vec4 getClosestFragment(const ivec3 coord) {
  vec4 result = vec4(1e7, 0.0, 0.0, 0.0);
  vec4 neighbor;
  #pragma unroll_loop_start
  for (int i = 0; i < 9; ++i) {
    neighbor = texelFetchOffset(
      inputBuffer,
      coord + ivec3(0, 0, CASCADE_COUNT),
      0,
      neighborOffsets[i]
    );
    if (neighbor.r < result.r) {
      result = neighbor;
    }
  }
  #pragma unroll_loop_end
  return result;
}

void cascade(const int cascadeIndex, out vec4 outputColor) {
  ivec3 coord = ivec3(gl_FragCoord.xy, cascadeIndex);
  vec4 current = texelFetch(inputBuffer, coord, 0);

  vec4 depthVelocity = getClosestFragment(coord);
  vec2 velocity = depthVelocity.gb * texelSize;
  vec2 prevUv = vUv - velocity;
  if (prevUv.x < 0.0 || prevUv.x > 1.0 || prevUv.y < 0.0 || prevUv.y > 1.0) {
    outputColor = current;
    return; // Rejection
  }

  vec4 history = texture(historyBuffer, vec3(prevUv, float(cascadeIndex)));
  vec4 clippedHistory = varianceClipping(inputBuffer, coord, current, history, varianceGamma);
  outputColor = mix(clippedHistory, current, temporalAlpha);
}

void main() {
  #pragma unroll_loop_start
  for (int i = 0; i < 4; ++i) {
    #if UNROLLED_LOOP_INDEX < CASCADE_COUNT
    cascade(UNROLLED_LOOP_INDEX, outputColor[i]);
    #endif // UNROLLED_LOOP_INDEX < CASCADE_COUNT
  }
  #pragma unroll_loop_end
}
`;
  var Lt2 = `precision highp float;

layout(location = 0) in vec3 position;

out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;
  var Mt2 = Object.defineProperty;
  var It = (o2, e4, t3, n4) => {
    for (var a2 = void 0, i3 = o2.length - 1, s2; i3 >= 0; i3--)
      (s2 = o2[i3]) && (a2 = s2(e4, t3, a2) || a2);
    return a2 && Mt2(e4, t3, a2), a2;
  };
  var be2 = class extends RawShaderMaterial {
    constructor({
      inputBuffer: e4 = null,
      historyBuffer: t3 = null
    } = {}) {
      super({
        name: "ShadowResolveMaterial",
        glslVersion: GLSL3,
        vertexShader: Lt2,
        fragmentShader: Kr(
          ar(Rt2, {
            varianceClipping: Me2
          })
        ),
        uniforms: {
          inputBuffer: new Uniform(e4),
          historyBuffer: new Uniform(t3),
          texelSize: new Uniform(new Vector2()),
          varianceGamma: new Uniform(1),
          // Use a very slow alpha because a single flickering pixel can be highly
          // noticeable in shadow maps. This value can be increased if temporal
          // jitter is turned off in the shadows rendering, but it will suffer
          // from spatial aliasing.
          temporalAlpha: new Uniform(0.01)
        },
        defines: {}
      }), this.cascadeCount = c4.shadow.cascadeCount;
    }
    setSize(e4, t3) {
      this.uniforms.texelSize.value.set(1 / e4, 1 / t3);
    }
  };
  It([
    Fr("CASCADE_COUNT", { min: 1, max: 4 })
  ], be2.prototype, "cascadeCount");
  function Z(o2) {
    const e4 = new WebGLArrayRenderTarget(1, 1, 1, {
      depthBuffer: false
    });
    return e4.texture.type = HalfFloatType, e4.texture.minFilter = LinearFilter, e4.texture.magFilter = LinearFilter, e4.texture.name = o2, e4;
  }
  var Nt2 = class extends Ne2 {
    constructor({
      parameterUniforms: e4,
      layerUniforms: t3,
      atmosphereUniforms: n4,
      ...a2
    }) {
      super("ShadowPass", a2), this.width = 0, this.height = 0, this.currentMaterial = new _2({
        parameterUniforms: e4,
        layerUniforms: t3,
        atmosphereUniforms: n4
      }), this.currentPass = new xe2(this.currentMaterial), this.resolveMaterial = new be2(), this.resolvePass = new xe2(this.resolveMaterial), this.initRenderTargets();
    }
    initialize(e4, t3, n4) {
      this.currentPass.initialize(e4, t3, n4), this.resolvePass.initialize(e4, t3, n4);
    }
    initRenderTargets() {
      var _a, _b, _c, _d;
      (_a = this.currentRenderTarget) == null ? void 0 : _a.dispose(), (_b = this.resolveRenderTarget) == null ? void 0 : _b.dispose(), (_c = this.historyRenderTarget) == null ? void 0 : _c.dispose();
      const e4 = Z("Shadow"), t3 = this.temporalPass ? Z("Shadow.A") : null, n4 = this.temporalPass ? Z("Shadow.B") : null;
      this.currentRenderTarget = e4, this.resolveRenderTarget = t3, this.historyRenderTarget = n4;
      const a2 = this.resolveMaterial.uniforms;
      a2.inputBuffer.value = e4.texture, a2.historyBuffer.value = (_d = n4 == null ? void 0 : n4.texture) != null ? _d : null;
    }
    copyShadow() {
      const e4 = this.shadow, t3 = this.currentMaterial.uniforms;
      for (let n4 = 0; n4 < e4.cascadeCount; ++n4) {
        const a2 = e4.cascades[n4];
        t3.inverseShadowMatrices.value[n4].copy(a2.inverseMatrix);
      }
    }
    copyReprojection() {
      const e4 = this.shadow, t3 = this.currentMaterial.uniforms;
      for (let n4 = 0; n4 < e4.cascadeCount; ++n4) {
        const a2 = e4.cascades[n4];
        t3.reprojectionMatrices.value[n4].copy(a2.matrix);
      }
    }
    swapBuffers() {
      A4(this.historyRenderTarget != null), A4(this.resolveRenderTarget != null);
      const e4 = this.historyRenderTarget, t3 = this.resolveRenderTarget;
      this.resolveRenderTarget = e4, this.historyRenderTarget = t3, this.resolveMaterial.uniforms.historyBuffer.value = t3.texture;
    }
    update(e4, t3, n4) {
      this.currentMaterial.uniforms.frame.value = t3, this.copyShadow(), this.currentPass.render(e4, null, this.currentRenderTarget), this.temporalPass && (A4(this.resolveRenderTarget != null), this.resolvePass.render(e4, null, this.resolveRenderTarget), this.copyReprojection(), this.swapBuffers());
    }
    setSize(e4, t3, n4 = this.shadow.cascadeCount) {
      var _a, _b;
      this.width = e4, this.height = t3, this.currentMaterial.cascadeCount = n4, this.resolveMaterial.cascadeCount = n4, this.currentMaterial.setSize(e4, t3), this.resolveMaterial.setSize(e4, t3), this.currentRenderTarget.setSize(
        e4,
        t3,
        this.temporalPass ? n4 * 2 : n4
        // For depth velocity
      ), (_a = this.resolveRenderTarget) == null ? void 0 : _a.setSize(e4, t3, n4), (_b = this.historyRenderTarget) == null ? void 0 : _b.setSize(e4, t3, n4);
    }
    get outputBuffer() {
      return this.temporalPass ? (A4(this.historyRenderTarget != null), this.historyRenderTarget.texture) : this.currentRenderTarget.texture;
    }
    get temporalPass() {
      return this.currentMaterial.temporalPass;
    }
    set temporalPass(e4) {
      e4 !== this.temporalPass && (this.currentMaterial.temporalPass = e4, this.initRenderTargets(), this.setSize(this.width, this.height));
    }
  };
  function bt2(o2) {
    return {
      // Participating medium
      scatteringCoefficient: new Uniform(1),
      absorptionCoefficient: new Uniform(0),
      // Weather and shape
      coverage: new Uniform(0.3),
      localWeatherTexture: new Uniform(o2.localWeatherTexture),
      localWeatherRepeat: new Uniform(o2.localWeatherRepeat),
      localWeatherOffset: new Uniform(o2.localWeatherOffset),
      shapeTexture: new Uniform(o2.shapeTexture),
      shapeRepeat: new Uniform(o2.shapeRepeat),
      shapeOffset: new Uniform(o2.shapeOffset),
      shapeDetailTexture: new Uniform(o2.shapeDetailTexture),
      shapeDetailRepeat: new Uniform(o2.shapeDetailRepeat),
      shapeDetailOffset: new Uniform(o2.shapeDetailOffset),
      turbulenceTexture: new Uniform(o2.turbulenceTexture),
      turbulenceRepeat: new Uniform(o2.turbulenceRepeat),
      turbulenceDisplacement: new Uniform(350)
    };
  }
  function Ut2() {
    return {
      minLayerHeights: new Uniform(new Vector4()),
      maxLayerHeights: new Uniform(new Vector4()),
      minIntervalHeights: new Uniform(new Vector3()),
      maxIntervalHeights: new Uniform(new Vector3()),
      densityScales: new Uniform(new Vector4()),
      shapeAmounts: new Uniform(new Vector4()),
      shapeDetailAmounts: new Uniform(new Vector4()),
      weatherExponents: new Uniform(new Vector4()),
      shapeAlteringBiases: new Uniform(new Vector4()),
      coverageFilterWidths: new Uniform(new Vector4()),
      minHeight: new Uniform(0),
      maxHeight: new Uniform(0),
      shadowTopHeight: new Uniform(0),
      shadowBottomHeight: new Uniform(0),
      shadowLayerMask: new Uniform(new Vector4()),
      densityProfile: new Uniform({
        expTerms: new Vector4(),
        exponents: new Vector4(),
        linearTerms: new Vector4(),
        constantTerms: new Vector4()
      })
    };
  }
  var q2 = [0, 0, 0, 0];
  function Ht(o2, e4) {
    e4.packValues("altitude", o2.minLayerHeights.value), e4.packSums("altitude", "height", o2.maxLayerHeights.value), e4.packIntervalHeights(
      o2.minIntervalHeights.value,
      o2.maxIntervalHeights.value
    ), e4.packValues("densityScale", o2.densityScales.value), e4.packValues("shapeAmount", o2.shapeAmounts.value), e4.packValues("shapeDetailAmount", o2.shapeDetailAmounts.value), e4.packValues("weatherExponent", o2.weatherExponents.value), e4.packValues("shapeAlteringBias", o2.shapeAlteringBiases.value), e4.packValues("coverageFilterWidth", o2.coverageFilterWidths.value);
    const t3 = o2.densityProfile.value;
    e4.packDensityProfiles("expTerm", t3.expTerms), e4.packDensityProfiles("exponent", t3.exponents), e4.packDensityProfiles("linearTerm", t3.linearTerms), e4.packDensityProfiles("constantTerm", t3.constantTerms);
    let n4 = 1 / 0, a2 = 0, i3 = 1 / 0, s2 = 0;
    q2.fill(0);
    for (let l3 = 0; l3 < e4.length; ++l3) {
      const { altitude: h2, height: u3, shadow: d2 } = e4[l3], v3 = h2 + u3;
      u3 > 0 && (h2 < n4 && (n4 = h2), d2 && h2 < i3 && (i3 = h2), v3 > a2 && (a2 = v3), d2 && v3 > s2 && (s2 = v3)), q2[l3] = d2 ? 1 : 0;
    }
    n4 !== 1 / 0 ? (o2.minHeight.value = n4, o2.maxHeight.value = a2) : (A4(a2 === 0), o2.minHeight.value = 0), i3 !== 1 / 0 ? (o2.shadowBottomHeight.value = i3, o2.shadowTopHeight.value = s2) : (A4(s2 === 0), o2.shadowBottomHeight.value = 0), o2.shadowLayerMask.value.fromArray(q2);
  }
  function Ft2(o2, e4) {
    return {
      bottomRadius: new Uniform(o2.bottomRadius),
      topRadius: new Uniform(o2.topRadius),
      worldToECEFMatrix: new Uniform(e4.worldToECEFMatrix),
      ecefToWorldMatrix: new Uniform(e4.ecefToWorldMatrix),
      altitudeCorrection: new Uniform(e4.altitudeCorrection),
      sunDirection: new Uniform(e4.sunDirection)
    };
  }
  var zt2 = `uniform sampler2D cloudsBuffer;

void mainImage(const vec4 inputColor, const vec2 uv, out vec4 outputColor) {
  #ifdef SKIP_RENDERING
  outputColor = inputColor;
  #else // SKIP_RENDERING
  vec4 clouds = texture(cloudsBuffer, uv);
  outputColor.rgb = inputColor.rgb * (1.0 - clouds.a) + clouds.rgb;
  outputColor.a = inputColor.a * (1.0 - clouds.a) + clouds.a;
  #endif // SKIP_RENDERING
}
`;
  var Wt = Object.defineProperty;
  var Bt2 = (o2, e4, t3, n4) => {
    for (var a2 = void 0, i3 = o2.length - 1, s2; i3 >= 0; i3--)
      (s2 = o2[i3]) && (a2 = s2(e4, t3, a2) || a2);
    return a2 && Wt(e4, t3, a2), a2;
  };
  var N2 = /* @__PURE__ */ new Vector3();
  var Gt2 = /* @__PURE__ */ new Vector2();
  var Vt = /* @__PURE__ */ new Matrix3();
  var kt2 = [
    "maxIterationCount",
    "minStepSize",
    "maxStepSize",
    "maxRayDistance",
    "perspectiveStepScale",
    "minDensity",
    "minExtinction",
    "minTransmittance",
    "maxIterationCountToSun",
    "maxIterationCountToGround",
    "minSecondaryStepSize",
    "secondaryStepScale",
    "maxShadowFilterRadius",
    "maxShadowLengthIterationCount",
    "minShadowLengthStepSize",
    "maxShadowLengthRayDistance",
    "hazeDensityScale",
    "hazeExponent",
    "hazeScatteringCoefficient",
    "hazeAbsorptionCoefficient"
  ];
  var jt2 = [
    "multiScatteringOctaves",
    "accurateSunSkyLight",
    "accuratePhaseFunction"
  ];
  var Yt = [
    "maxIterationCount",
    "minStepSize",
    "maxStepSize",
    "minDensity",
    "minExtinction",
    "minTransmittance",
    "opticalDepthTailScale"
  ];
  var Zt2 = [
    "temporalJitter"
  ];
  var qt2 = [
    "temporalPass"
  ];
  var Kt2 = [
    "cascadeCount",
    "mapSize",
    "maxFar",
    "farScale",
    "splitMode",
    "splitLambda"
  ];
  var T2 = {
    type: "change"
  };
  var $t2 = {
    resolutionScale: c4.resolutionScale,
    width: Resolution.AUTO_SIZE,
    height: Resolution.AUTO_SIZE
  };
  var Xt = class extends Effect {
    constructor(e4 = new Camera(), t3, n4 = AtmosphereParameters.DEFAULT) {
      var _a, _b, _c, _d, _e2, _f, _g, _h;
      super("CloudsEffect", zt2, {
        attributes: EffectAttribute.DEPTH,
        uniforms: /* @__PURE__ */ new Map([["cloudsBuffer", new Uniform(null)]])
      }), this.camera = e4, this.atmosphere = n4, this.cloudLayers = X.DEFAULT.clone(), this.correctAltitude = true, this.localWeatherRepeat = new Vector2().setScalar(100), this.localWeatherOffset = new Vector2(), this.shapeRepeat = new Vector3().setScalar(3e-4), this.shapeOffset = new Vector3(), this.shapeDetailRepeat = new Vector3().setScalar(6e-3), this.shapeDetailOffset = new Vector3(), this.turbulenceRepeat = new Vector2().setScalar(20), this.worldToECEFMatrix = new Matrix4(), this.ecefToWorldMatrix = new Matrix4(), this.altitudeCorrection = new Vector3(), this.sunDirection = new Vector3(), this.localWeatherVelocity = new Vector2(), this.shapeVelocity = new Vector3(), this.shapeDetailVelocity = new Vector3(), this._atmosphereOverlay = null, this._atmosphereShadow = null, this._atmosphereShadowLength = null, this.events = new EventDispatcher(), this.frame = 0, this.shadowCascadeCount = 0, this.shadowMapSize = new Vector2(), this.onResolutionChange = () => {
        this.setSize(this.resolution.baseWidth, this.resolution.baseHeight);
      }, this.skipRendering = true;
      const {
        resolutionScale: a2,
        width: i3,
        height: s2,
        resolutionX: l3 = i3,
        resolutionY: h2 = s2
      } = {
        ...$t2,
        ...t3
      };
      this.shadowMaps = new dt({
        cascadeCount: c4.shadow.cascadeCount,
        mapSize: c4.shadow.mapSize,
        splitLambda: 0.6
      }), this.parameterUniforms = bt2({
        localWeatherTexture: (_b = (_a = this.proceduralLocalWeather) == null ? void 0 : _a.texture) != null ? _b : null,
        localWeatherRepeat: this.localWeatherRepeat,
        localWeatherOffset: this.localWeatherOffset,
        shapeTexture: (_d = (_c = this.proceduralShape) == null ? void 0 : _c.texture) != null ? _d : null,
        shapeRepeat: this.shapeRepeat,
        shapeOffset: this.shapeOffset,
        shapeDetailTexture: (_f = (_e2 = this.proceduralShapeDetail) == null ? void 0 : _e2.texture) != null ? _f : null,
        shapeDetailRepeat: this.shapeDetailRepeat,
        shapeDetailOffset: this.shapeDetailOffset,
        turbulenceTexture: (_h = (_g = this.proceduralTurbulence) == null ? void 0 : _g.texture) != null ? _h : null,
        turbulenceRepeat: this.turbulenceRepeat
      }), this.layerUniforms = Ut2(), this.atmosphereUniforms = Ft2(n4, {
        worldToECEFMatrix: this.worldToECEFMatrix,
        ecefToWorldMatrix: this.ecefToWorldMatrix,
        altitudeCorrection: this.altitudeCorrection,
        sunDirection: this.sunDirection
      });
      const u3 = {
        shadow: this.shadowMaps,
        parameterUniforms: this.parameterUniforms,
        layerUniforms: this.layerUniforms,
        atmosphereUniforms: this.atmosphereUniforms
      };
      this.shadowPass = new Nt2(u3), this.shadowPass.mainCamera = e4, this.cloudsPass = new Dt2(u3, n4), this.cloudsPass.mainCamera = e4, this.clouds = Gr(
        jr(
          {},
          this.cloudsPass.currentMaterial,
          kt2
        ),
        this.cloudsPass.currentMaterial,
        jt2
      ), this.shadow = Gr(
        jr(
          {},
          this.shadowPass.currentMaterial,
          Yt
        ),
        this.shadowPass.currentMaterial,
        Zt2,
        this.shadowPass,
        qt2,
        this.shadowMaps,
        Kt2
      ), this.resolution = new Resolution(
        this,
        l3,
        h2,
        a2
      ), this.resolution.addEventListener("change", this.onResolutionChange);
    }
    get mainCamera() {
      return this.camera;
    }
    set mainCamera(e4) {
      this.camera = e4, this.shadowPass.mainCamera = e4, this.cloudsPass.mainCamera = e4;
    }
    initialize(e4, t3, n4) {
      this.shadowPass.initialize(e4, t3, n4), this.cloudsPass.initialize(e4, t3, n4);
    }
    updateSharedUniforms(e4) {
      Ht(this.layerUniforms, this.cloudLayers);
      const { parameterUniforms: t3 } = this;
      t3.localWeatherOffset.value.add(
        Gt2.copy(this.localWeatherVelocity).multiplyScalar(e4)
      ), t3.shapeOffset.value.add(
        N2.copy(this.shapeVelocity).multiplyScalar(e4)
      ), t3.shapeDetailOffset.value.add(
        N2.copy(this.shapeDetailVelocity).multiplyScalar(e4)
      );
      const n4 = this.worldToECEFMatrix;
      this.ecefToWorldMatrix.copy(n4).invert();
      const a2 = this.camera.getWorldPosition(N2).applyMatrix4(this.worldToECEFMatrix), i3 = this.altitudeCorrection;
      this.correctAltitude ? getAltitudeCorrectionOffset(
        a2,
        this.atmosphere.bottomRadius,
        this.ellipsoid,
        i3
      ) : i3.setScalar(0);
      const s2 = this.ellipsoid.getSurfaceNormal(
        a2,
        N2
      ), l3 = this.sunDirection.dot(s2), h2 = _r(1e6, 1e3, l3), u3 = Vt.setFromMatrix4(n4).transpose();
      this.shadowMaps.update(
        this.camera,
        N2.copy(this.sunDirection).applyMatrix3(u3),
        h2
      );
    }
    updateWeatherTextureChannels() {
      const e4 = this.cloudLayers.localWeatherChannels;
      this.cloudsPass.currentMaterial.localWeatherChannels = e4, this.shadowPass.currentMaterial.localWeatherChannels = e4;
    }
    updateAtmosphereComposition() {
      var _a, _b, _c;
      const { shadowMaps: e4, shadowPass: t3, cloudsPass: n4 } = this, a2 = t3.currentMaterial.uniforms, i3 = n4.currentMaterial.uniforms, s2 = this._atmosphereOverlay, l3 = Object.assign((_a = this._atmosphereOverlay) != null ? _a : {}, {
        map: n4.outputBuffer
      });
      s2 !== l3 && (this._atmosphereOverlay = l3, T2.target = this, T2.property = "atmosphereOverlay", this.events.dispatchEvent(T2));
      const h2 = this._atmosphereShadow, u3 = Object.assign((_b = this._atmosphereShadow) != null ? _b : {}, {
        map: t3.outputBuffer,
        mapSize: e4.mapSize,
        cascadeCount: e4.cascadeCount,
        intervals: i3.shadowIntervals.value,
        matrices: i3.shadowMatrices.value,
        inverseMatrices: a2.inverseShadowMatrices.value,
        far: e4.far,
        topHeight: i3.shadowTopHeight.value
      });
      h2 !== u3 && (this._atmosphereShadow = u3, T2.target = this, T2.property = "atmosphereShadow", this.events.dispatchEvent(T2));
      const d2 = this._atmosphereShadowLength, v3 = n4.shadowLengthBuffer != null ? Object.assign((_c = this._atmosphereShadowLength) != null ? _c : {}, {
        map: n4.shadowLengthBuffer
      }) : null;
      d2 !== v3 && (this._atmosphereShadowLength = v3, T2.target = this, T2.property = "atmosphereShadowLength", this.events.dispatchEvent(T2));
    }
    update(e4, t3, n4 = 0) {
      var _a, _b, _c, _d;
      const { shadowMaps: a2, shadowPass: i3, cloudsPass: s2 } = this;
      if (a2.cascadeCount !== this.shadowCascadeCount || !a2.mapSize.equals(this.shadowMapSize)) {
        const { width: l3, height: h2 } = a2.mapSize, u3 = a2.cascadeCount;
        this.shadowMapSize.set(l3, h2), this.shadowCascadeCount = u3, i3.setSize(l3, h2, u3), s2.setShadowSize(l3, h2, u3);
      }
      (_a = this.proceduralLocalWeather) == null ? void 0 : _a.render(e4, n4), (_b = this.proceduralShape) == null ? void 0 : _b.render(e4, n4), (_c = this.proceduralShapeDetail) == null ? void 0 : _c.render(e4, n4), (_d = this.proceduralTurbulence) == null ? void 0 : _d.render(e4, n4), ++this.frame, this.updateSharedUniforms(n4), this.updateWeatherTextureChannels(), i3.update(e4, this.frame, n4), s2.shadowBuffer = i3.outputBuffer, s2.update(e4, this.frame, n4), this.updateAtmosphereComposition(), this.uniforms.get("cloudsBuffer").value = this.cloudsPass.outputBuffer;
    }
    setSize(e4, t3) {
      const { resolution: n4 } = this;
      n4.setBaseSize(e4, t3);
      const { width: a2, height: i3 } = n4;
      this.cloudsPass.setSize(a2, i3);
    }
    setDepthTexture(e4, t3) {
      this.shadowPass.setDepthTexture(e4, t3), this.cloudsPass.setDepthTexture(e4, t3);
    }
    // eslint-disable-next-line accessor-pairs
    set qualityPreset(e4) {
      const { clouds: t3, shadow: n4, ...a2 } = ft2[e4];
      Object.assign(this, a2), Object.assign(this.clouds, t3), Object.assign(this.shadow, n4);
    }
    // Textures
    get localWeatherTexture() {
      var _a;
      return (_a = this.proceduralLocalWeather) != null ? _a : this.parameterUniforms.localWeatherTexture.value;
    }
    set localWeatherTexture(e4) {
      e4 instanceof Texture || e4 == null ? (this.proceduralLocalWeather = void 0, this.parameterUniforms.localWeatherTexture.value = e4) : (this.proceduralLocalWeather = e4, this.parameterUniforms.localWeatherTexture.value = e4.texture);
    }
    get shapeTexture() {
      var _a;
      return (_a = this.proceduralShape) != null ? _a : this.parameterUniforms.shapeTexture.value;
    }
    set shapeTexture(e4) {
      e4 instanceof Data3DTexture || e4 == null ? (this.proceduralShape = void 0, this.parameterUniforms.shapeTexture.value = e4) : (this.proceduralShape = e4, this.parameterUniforms.shapeTexture.value = e4.texture);
    }
    get shapeDetailTexture() {
      var _a;
      return (_a = this.proceduralShapeDetail) != null ? _a : this.parameterUniforms.shapeDetailTexture.value;
    }
    set shapeDetailTexture(e4) {
      e4 instanceof Data3DTexture || e4 == null ? (this.proceduralShapeDetail = void 0, this.parameterUniforms.shapeDetailTexture.value = e4) : (this.proceduralShapeDetail = e4, this.parameterUniforms.shapeDetailTexture.value = e4.texture);
    }
    get turbulenceTexture() {
      var _a;
      return (_a = this.proceduralTurbulence) != null ? _a : this.parameterUniforms.turbulenceTexture.value;
    }
    set turbulenceTexture(e4) {
      e4 instanceof Texture || e4 == null ? (this.proceduralTurbulence = void 0, this.parameterUniforms.turbulenceTexture.value = e4) : (this.proceduralTurbulence = e4, this.parameterUniforms.turbulenceTexture.value = e4.texture);
    }
    get stbnTexture() {
      return this.cloudsPass.currentMaterial.uniforms.stbnTexture.value;
    }
    set stbnTexture(e4) {
      this.cloudsPass.currentMaterial.uniforms.stbnTexture.value = e4, this.shadowPass.currentMaterial.uniforms.stbnTexture.value = e4;
    }
    // Rendering controls
    get resolutionScale() {
      return this.resolution.scale;
    }
    set resolutionScale(e4) {
      this.resolution.scale = e4;
    }
    get temporalUpscale() {
      return this.cloudsPass.temporalUpscale;
    }
    set temporalUpscale(e4) {
      this.cloudsPass.temporalUpscale = e4;
    }
    get lightShafts() {
      return this.cloudsPass.lightShafts;
    }
    set lightShafts(e4) {
      this.cloudsPass.lightShafts = e4;
    }
    get shapeDetail() {
      return this.cloudsPass.currentMaterial.shapeDetail;
    }
    set shapeDetail(e4) {
      this.cloudsPass.currentMaterial.shapeDetail = e4, this.shadowPass.currentMaterial.shapeDetail = e4;
    }
    get turbulence() {
      return this.cloudsPass.currentMaterial.turbulence;
    }
    set turbulence(e4) {
      this.cloudsPass.currentMaterial.turbulence = e4, this.shadowPass.currentMaterial.turbulence = e4;
    }
    get haze() {
      return this.cloudsPass.currentMaterial.haze;
    }
    set haze(e4) {
      this.cloudsPass.currentMaterial.haze = e4;
    }
    // Cloud parameter primitives
    get scatteringCoefficient() {
      return this.parameterUniforms.scatteringCoefficient.value;
    }
    set scatteringCoefficient(e4) {
      this.parameterUniforms.scatteringCoefficient.value = e4;
    }
    get absorptionCoefficient() {
      return this.parameterUniforms.absorptionCoefficient.value;
    }
    set absorptionCoefficient(e4) {
      this.parameterUniforms.absorptionCoefficient.value = e4;
    }
    get coverage() {
      return this.parameterUniforms.coverage.value;
    }
    set coverage(e4) {
      this.parameterUniforms.coverage.value = e4;
    }
    get turbulenceDisplacement() {
      return this.parameterUniforms.turbulenceDisplacement.value;
    }
    set turbulenceDisplacement(e4) {
      this.parameterUniforms.turbulenceDisplacement.value = e4;
    }
    // Scattering parameters
    get scatterAnisotropy1() {
      return this.cloudsPass.currentMaterial.scatterAnisotropy1;
    }
    set scatterAnisotropy1(e4) {
      this.cloudsPass.currentMaterial.scatterAnisotropy1 = e4;
    }
    get scatterAnisotropy2() {
      return this.cloudsPass.currentMaterial.scatterAnisotropy2;
    }
    set scatterAnisotropy2(e4) {
      this.cloudsPass.currentMaterial.scatterAnisotropy2 = e4;
    }
    get scatterAnisotropyMix() {
      return this.cloudsPass.currentMaterial.scatterAnisotropyMix;
    }
    set scatterAnisotropyMix(e4) {
      this.cloudsPass.currentMaterial.scatterAnisotropyMix = e4;
    }
    get skyLightScale() {
      return this.cloudsPass.currentMaterial.uniforms.skyLightScale.value;
    }
    set skyLightScale(e4) {
      this.cloudsPass.currentMaterial.uniforms.skyLightScale.value = e4;
    }
    get groundBounceScale() {
      return this.cloudsPass.currentMaterial.uniforms.groundBounceScale.value;
    }
    set groundBounceScale(e4) {
      this.cloudsPass.currentMaterial.uniforms.groundBounceScale.value = e4;
    }
    get powderScale() {
      return this.cloudsPass.currentMaterial.uniforms.powderScale.value;
    }
    set powderScale(e4) {
      this.cloudsPass.currentMaterial.uniforms.powderScale.value = e4;
    }
    get powderExponent() {
      return this.cloudsPass.currentMaterial.uniforms.powderExponent.value;
    }
    set powderExponent(e4) {
      this.cloudsPass.currentMaterial.uniforms.powderExponent.value = e4;
    }
    // Atmosphere composition
    get atmosphereOverlay() {
      return this._atmosphereOverlay;
    }
    get atmosphereShadow() {
      return this._atmosphereShadow;
    }
    get atmosphereShadowLength() {
      return this._atmosphereShadowLength;
    }
    // Atmosphere parameters
    get irradianceTexture() {
      return this.cloudsPass.currentMaterial.irradianceTexture;
    }
    set irradianceTexture(e4) {
      this.cloudsPass.currentMaterial.irradianceTexture = e4;
    }
    get scatteringTexture() {
      return this.cloudsPass.currentMaterial.scatteringTexture;
    }
    set scatteringTexture(e4) {
      this.cloudsPass.currentMaterial.scatteringTexture = e4;
    }
    get transmittanceTexture() {
      return this.cloudsPass.currentMaterial.transmittanceTexture;
    }
    set transmittanceTexture(e4) {
      this.cloudsPass.currentMaterial.transmittanceTexture = e4;
    }
    get singleMieScatteringTexture() {
      return this.cloudsPass.currentMaterial.singleMieScatteringTexture;
    }
    set singleMieScatteringTexture(e4) {
      this.cloudsPass.currentMaterial.singleMieScatteringTexture = e4;
    }
    get higherOrderScatteringTexture() {
      return this.cloudsPass.currentMaterial.higherOrderScatteringTexture;
    }
    set higherOrderScatteringTexture(e4) {
      this.cloudsPass.currentMaterial.higherOrderScatteringTexture = e4;
    }
    get ellipsoid() {
      return this.cloudsPass.currentMaterial.ellipsoid;
    }
    set ellipsoid(e4) {
      this.cloudsPass.currentMaterial.ellipsoid = e4;
    }
    get sunAngularRadius() {
      return this.cloudsPass.currentMaterial.sunAngularRadius;
    }
    set sunAngularRadius(e4) {
      this.cloudsPass.currentMaterial.sunAngularRadius = e4;
    }
  };
  Bt2([
    Br("SKIP_RENDERING")
  ], Xt.prototype, "skipRendering");
  var rn = 128;
  var on2 = 32;
  var j2 = "45a1c6c1bb9fd38b3680fd120795ff4c32df68ff";
  var sn = 'assets/vendor/takram-clouds/local_weather.png';
  var cn2 = 'assets/vendor/takram-clouds/shape.bin';
  var ln2 = 'assets/vendor/takram-clouds/shape_detail.bin';
  var hn2 = 'assets/vendor/takram-clouds/turbulence.png';

  // scripts/.tmp-build-takram-clouds-entry.mjs
  function parseUint8Array(buffer) {
    return new Uint8Array(buffer);
  }
  function getTextureDataType(array) {
    if (array instanceof Int8Array) return ByteType;
    if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return UnsignedByteType;
    if (array instanceof Int16Array) return ShortType;
    if (array instanceof Uint16Array) return UnsignedShortType;
    if (array instanceof Int32Array) return IntType;
    if (array instanceof Uint32Array) return UnsignedIntType;
    if (array instanceof Float32Array || array instanceof Float64Array) return FloatType;
    if (typeof Float16Array !== "undefined" && array instanceof Float16Array) return HalfFloatType;
    return UnsignedByteType;
  }
  var DataTextureLoader2 = class extends Loader {
    constructor(textureClass, parser, options = {}, manager) {
      super(manager);
      this.textureClass = textureClass;
      this.parser = parser;
      this.options = {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        ...options
      };
    }
    load(url, onLoad, onProgress, onError) {
      const texture = new this.textureClass();
      const loader = new FileLoader(this.manager);
      loader.setRequestHeader(this.requestHeader);
      loader.setPath(this.path);
      loader.setWithCredentials(this.withCredentials);
      loader.setResponseType("arraybuffer");
      loader.load(url, (buffer) => {
        const array = this.parser(buffer);
        texture.image.data = array;
        const { width, height, depth, ...options } = this.options;
        if (width != null) texture.image.width = width;
        if (height != null) texture.image.height = height;
        if (texture.image && "depth" in texture.image && depth != null) {
          texture.image.depth = depth;
        }
        texture.type = getTextureDataType(array);
        Object.assign(texture, options);
        texture.needsUpdate = true;
        if (typeof onLoad === "function") onLoad(texture);
      }, onProgress, onError);
      return texture;
    }
  };
  window.VRODOS_TAKRAM_CLOUDS = {
    CloudsEffect: Xt,
    CloudLayer: w2,
    CloudLayers: X,
    CLOUD_SHAPE_TEXTURE_SIZE: rn,
    CLOUD_SHAPE_DETAIL_TEXTURE_SIZE: on2,
    DataTextureLoader: DataTextureLoader2,
    parseUint8Array,
    STBN_TEXTURE_WIDTH: 128,
    STBN_TEXTURE_HEIGHT: 128,
    STBN_TEXTURE_DEPTH: 64
  };
})();
