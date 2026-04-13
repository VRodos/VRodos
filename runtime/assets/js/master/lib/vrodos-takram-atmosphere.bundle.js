(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@takram/three-atmosphere/build/index.js
  var build_exports = {};
  __export(build_exports, {
    AerialPerspectiveEffect: () => H3,
    AtmosphereMaterialBase: () => se2,
    AtmosphereParameters: () => n0,
    DEFAULT_PRECOMPUTED_TEXTURES_URL: () => m3,
    DEFAULT_STARS_DATA_URL: () => S2,
    DensityProfileLayer: () => v0,
    IRRADIANCE_TEXTURE_HEIGHT: () => A3,
    IRRADIANCE_TEXTURE_WIDTH: () => f2,
    LightingMaskPass: () => ki,
    METER_TO_LENGTH_UNIT: () => w2,
    PrecomputedTexturesGenerator: () => Vi,
    PrecomputedTexturesLoader: () => Bi,
    SCATTERING_TEXTURE_DEPTH: () => N2,
    SCATTERING_TEXTURE_HEIGHT: () => g3,
    SCATTERING_TEXTURE_MU_SIZE: () => _2,
    SCATTERING_TEXTURE_MU_S_SIZE: () => R3,
    SCATTERING_TEXTURE_NU_SIZE: () => u3,
    SCATTERING_TEXTURE_R_SIZE: () => i2,
    SCATTERING_TEXTURE_WIDTH: () => U2,
    SKY_RENDER_ORDER: () => h,
    SkyLightProbe: () => Wi,
    SkyMaterial: () => Ke,
    StarsGeometry: () => ji,
    StarsMaterial: () => $t2,
    SunDirectionalLight: () => Xi,
    TRANSMITTANCE_TEXTURE_HEIGHT: () => p2,
    TRANSMITTANCE_TEXTURE_WIDTH: () => C3,
    XYZ_TO_SRGB: () => D3,
    aerialPerspectiveEffectOptionsDefaults: () => Kn2,
    atmosphereMaterialParametersBaseDefaults: () => Be2,
    convertBVIndexToLinearSRGBChromaticity: () => U3,
    convertTemperatureToLinearSRGBChromaticity: () => D4,
    fromAstroRotationMatrix: () => Wr,
    fromAstroVector: () => jt2,
    getAltitudeCorrectionOffset: () => X,
    getECIToECEFRotationMatrix: () => Xe,
    getMoonDirectionECEF: () => zi,
    getMoonDirectionECI: () => Gi,
    getMoonFixedToECIRotationMatrix: () => bi,
    getSunDirectionECEF: () => Fi,
    getSunDirectionECI: () => Ui,
    getSunLightColor: () => ei,
    skyLightProbeParametersDefaults: () => Si,
    skyMaterialParametersDefaults: () => Ri,
    starsMaterialParametersDefaults: () => wi,
    sunDirectionalLightParametersDefaults: () => Di,
    toAstroTime: () => P0
  });

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
  var CompressedArrayTexture = moduleValue2["CompressedArrayTexture"];
  var CompressedCubeTexture = moduleValue2["CompressedCubeTexture"];
  var CompressedTexture = moduleValue2["CompressedTexture"];
  var CompressedTextureLoader = moduleValue2["CompressedTextureLoader"];
  var ConeGeometry = moduleValue2["ConeGeometry"];
  var ConstantAlphaFactor = moduleValue2["ConstantAlphaFactor"];
  var ConstantColorFactor = moduleValue2["ConstantColorFactor"];
  var Controls = moduleValue2["Controls"];
  var CubeCamera = moduleValue2["CubeCamera"];
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
  var NoToneMapping = moduleValue2["NoToneMapping"];
  var NormalAnimationBlendMode = moduleValue2["NormalAnimationBlendMode"];
  var NormalBlending = moduleValue2["NormalBlending"];
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
  var RED_GREEN_RGTC2_Format = moduleValue2["RED_GREEN_RGTC2_Format"];
  var RED_RGTC1_Format = moduleValue2["RED_RGTC1_Format"];
  var REVISION = moduleValue2["REVISION"];
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
  var SIGNED_RED_GREEN_RGTC2_Format = moduleValue2["SIGNED_RED_GREEN_RGTC2_Format"];
  var SIGNED_RED_RGTC1_Format = moduleValue2["SIGNED_RED_RGTC1_Format"];
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

  // node_modules/@takram/three-geospatial/build/shared.js
  var a = true;
  var n = "Invariant failed";
  function c(i3, r4) {
    if (!i3) {
      if (a)
        throw new Error(n);
      var o3 = typeof r4 == "function" ? r4() : r4, t2 = o3 ? "".concat(n, ": ").concat(o3) : n;
      throw new Error(t2);
    }
  }

  // node_modules/@takram/three-geospatial/build/shared2.js
  var $ = /* @__PURE__ */ new Vector3();
  function D(q2, t2, i3 = new Vector3(), s) {
    var _a2;
    const { x: r4, y: e3, z: n4 } = q2, o3 = t2.x, h2 = t2.y, u5 = t2.z, d3 = r4 * r4 * o3, m4 = e3 * e3 * h2, c3 = n4 * n4 * u5, l3 = d3 + m4 + c3, p3 = Math.sqrt(1 / l3);
    if (!Number.isFinite(p3))
      return;
    const w3 = $.copy(q2).multiplyScalar(p3);
    if (l3 < ((_a2 = s == null ? void 0 : s.centerTolerance) != null ? _a2 : 0.1))
      return i3.copy(w3);
    const f4 = w3.multiply(t2).multiplyScalar(2);
    let y2 = (1 - p3) * q2.length() / (f4.length() / 2), I3 = 0, x3, M2, g5, v3;
    do {
      y2 -= I3, x3 = 1 / (1 + y2 * o3), M2 = 1 / (1 + y2 * h2), g5 = 1 / (1 + y2 * u5);
      const V2 = x3 * x3, F2 = M2 * M2, L3 = g5 * g5, G4 = V2 * x3, j2 = F2 * M2, B = L3 * g5;
      v3 = d3 * V2 + m4 * F2 + c3 * L3 - 1, I3 = v3 / ((d3 * G4 * o3 + m4 * j2 * h2 + c3 * B * u5) * -2);
    } while (Math.abs(v3) > 1e-12);
    return i3.set(r4 * x3, e3 * M2, n4 * g5);
  }
  var E = /* @__PURE__ */ new Vector3();
  var R = /* @__PURE__ */ new Vector3();
  var U = /* @__PURE__ */ new Vector3();
  var b = class b2 {
    constructor(t2, i3, s) {
      this.radii = new Vector3(t2, i3, s);
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
      const t2 = this.maximumRadius ** 2, i3 = this.minimumRadius ** 2;
      return (t2 - i3) / t2;
    }
    reciprocalRadii(t2 = new Vector3()) {
      const { x: i3, y: s, z: r4 } = this.radii;
      return t2.set(1 / i3, 1 / s, 1 / r4);
    }
    reciprocalRadiiSquared(t2 = new Vector3()) {
      const { x: i3, y: s, z: r4 } = this.radii;
      return t2.set(1 / i3 ** 2, 1 / s ** 2, 1 / r4 ** 2);
    }
    projectOnSurface(t2, i3 = new Vector3(), s) {
      return D(
        t2,
        this.reciprocalRadiiSquared(),
        i3,
        s
      );
    }
    getSurfaceNormal(t2, i3 = new Vector3()) {
      return i3.multiplyVectors(this.reciprocalRadiiSquared(E), t2).normalize();
    }
    getEastNorthUpVectors(t2, i3 = new Vector3(), s = new Vector3(), r4 = new Vector3()) {
      this.getSurfaceNormal(t2, r4), i3.set(-t2.y, t2.x, 0).normalize(), s.crossVectors(r4, i3).normalize();
    }
    getEastNorthUpFrame(t2, i3 = new Matrix4()) {
      const s = E, r4 = R, e3 = U;
      return this.getEastNorthUpVectors(t2, s, r4, e3), i3.makeBasis(s, r4, e3).setPosition(t2);
    }
    getNorthUpEastFrame(t2, i3 = new Matrix4()) {
      const s = E, r4 = R, e3 = U;
      return this.getEastNorthUpVectors(t2, s, r4, e3), i3.makeBasis(r4, e3, s).setPosition(t2);
    }
    getIntersection(t2, i3 = new Vector3()) {
      const s = this.reciprocalRadii(E), r4 = R.copy(s).multiply(t2.origin), e3 = U.copy(s).multiply(t2.direction), n4 = r4.lengthSq(), o3 = e3.lengthSq(), h2 = r4.dot(e3), u5 = h2 ** 2 - o3 * (n4 - 1);
      if (n4 === 1)
        return i3.copy(t2.origin);
      if (n4 > 1) {
        if (h2 >= 0 || u5 < 0)
          return;
        const d3 = Math.sqrt(u5), m4 = (-h2 - d3) / o3, c3 = (-h2 + d3) / o3;
        return t2.at(Math.min(m4, c3), i3);
      }
      if (n4 < 1) {
        const d3 = h2 ** 2 - o3 * (n4 - 1), m4 = Math.sqrt(d3), c3 = (-h2 + m4) / o3;
        return t2.at(c3, i3);
      }
      if (h2 < 0)
        return t2.at(-h2 / o3, i3);
    }
    getOsculatingSphereCenter(t2, i3, s = new Vector3()) {
      c(this.radii.x === this.radii.y);
      const r4 = this.radii.x ** 2, e3 = this.radii.z ** 2, n4 = E.set(
        t2.x / r4,
        t2.y / r4,
        t2.z / e3
      ).normalize();
      return s.copy(n4.multiplyScalar(-i3).add(t2));
    }
    getNormalAtHorizon(t2, i3, s = new Vector3()) {
      c(this.radii.x === this.radii.y);
      const r4 = this.radii.x ** 2, e3 = this.radii.z ** 2, n4 = t2, o3 = i3;
      let h2 = (n4.x * o3.x + n4.y * o3.y) / r4 + n4.z * o3.z / e3;
      h2 /= (n4.x ** 2 + n4.y ** 2) / r4 + n4.z ** 2 / e3;
      const u5 = E.copy(o3).multiplyScalar(-h2).add(t2);
      return s.set(u5.x / r4, u5.y / r4, u5.z / e3).normalize();
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
    constructor(t2 = 0, i3 = 0, s = 0) {
      this.longitude = t2, this.latitude = i3, this.height = s;
    }
    set(t2, i3, s) {
      return this.longitude = t2, this.latitude = i3, s != null && (this.height = s), this;
    }
    clone() {
      return new z2(this.longitude, this.latitude, this.height);
    }
    copy(t2) {
      return this.longitude = t2.longitude, this.latitude = t2.latitude, this.height = t2.height, this;
    }
    equals(t2) {
      return t2.longitude === this.longitude && t2.latitude === this.latitude && t2.height === this.height;
    }
    setLongitude(t2) {
      return this.longitude = t2, this;
    }
    setLatitude(t2) {
      return this.latitude = t2, this;
    }
    setHeight(t2) {
      return this.height = t2, this;
    }
    normalize() {
      return this.longitude < z2.MIN_LONGITUDE && (this.longitude += Math.PI * 2), this;
    }
    // See: https://en.wikipedia.org/wiki/Geographic_coordinate_conversion
    // Reference: https://github.com/CesiumGS/cesium/blob/1.122/packages/engine/Source/Core/Geodetic.js#L119
    setFromECEF(t2, i3) {
      var _a2;
      const r4 = ((_a2 = i3 == null ? void 0 : i3.ellipsoid) != null ? _a2 : N.WGS84).reciprocalRadiiSquared(A), e3 = D(
        t2,
        r4,
        P,
        i3
      );
      if (e3 == null)
        throw new Error(
          `Could not project position to ellipsoid surface: ${t2.toArray()}`
        );
      const n4 = A.multiplyVectors(e3, r4).normalize();
      this.longitude = Math.atan2(n4.y, n4.x), this.latitude = Math.asin(n4.z);
      const o3 = A.subVectors(t2, e3);
      return this.height = Math.sign(o3.dot(t2)) * o3.length(), this;
    }
    // See: https://en.wikipedia.org/wiki/Geographic_coordinate_conversion
    // Reference: https://github.com/CesiumGS/cesium/blob/1.122/packages/engine/Source/Core/Cartesian3.js#L916
    toECEF(t2 = new Vector3(), i3) {
      var _a2;
      const s = (_a2 = i3 == null ? void 0 : i3.ellipsoid) != null ? _a2 : N.WGS84, r4 = A.multiplyVectors(
        s.radii,
        s.radii
      ), e3 = Math.cos(this.latitude), n4 = P.set(
        e3 * Math.cos(this.longitude),
        e3 * Math.sin(this.longitude),
        Math.sin(this.latitude)
      ).normalize();
      return t2.multiplyVectors(r4, n4), t2.divideScalar(Math.sqrt(n4.dot(t2))).add(n4.multiplyScalar(this.height));
    }
    fromArray(t2, i3 = 0) {
      return this.longitude = t2[i3], this.latitude = t2[i3 + 1], this.height = t2[i3 + 2], this;
    }
    toArray(t2 = [], i3 = 0) {
      return t2[i3] = this.longitude, t2[i3 + 1] = this.latitude, t2[i3 + 2] = this.height, t2;
    }
    *[Symbol.iterator]() {
      yield this.longitude, yield this.latitude, yield this.height;
    }
  };
  z.MIN_LONGITUDE = -Math.PI, z.MAX_LONGITUDE = Math.PI, z.MIN_LATITUDE = -Math.PI / 2, z.MAX_LATITUDE = Math.PI / 2;
  var C = z;

  // node_modules/three/examples/jsm/libs/fflate.module.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b4 = new u16(31);
    for (var i3 = 0; i3 < 31; ++i3) {
      b4[i3] = start += 1 << eb[i3 - 1];
    }
    var r4 = new i32(b4[30]);
    for (var i3 = 1; i3 < 30; ++i3) {
      for (var j2 = b4[i3]; j2 < b4[i3 + 1]; ++j2) {
        r4[j2] = j2 - b4[i3] << 5 | i3;
      }
    }
    return { b: b4, r: r4 };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i3 = 0; i3 < 32768; ++i3) {
    x3 = (i3 & 43690) >> 1 | (i3 & 21845) << 1;
    x3 = (x3 & 52428) >> 2 | (x3 & 13107) << 2;
    x3 = (x3 & 61680) >> 4 | (x3 & 3855) << 4;
    rev[i3] = ((x3 & 65280) >> 8 | (x3 & 255) << 8) >> 1;
  }
  var x3;
  var i3;
  var hMap = (function(cd, mb, r4) {
    var s = cd.length;
    var i3 = 0;
    var l3 = new u16(mb);
    for (; i3 < s; ++i3) {
      if (cd[i3])
        ++l3[cd[i3] - 1];
    }
    var le2 = new u16(mb);
    for (i3 = 1; i3 < mb; ++i3) {
      le2[i3] = le2[i3 - 1] + l3[i3 - 1] << 1;
    }
    var co;
    if (r4) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i3 = 0; i3 < s; ++i3) {
        if (cd[i3]) {
          var sv = i3 << 4 | cd[i3];
          var r_1 = mb - cd[i3];
          var v3 = le2[cd[i3] - 1]++ << r_1;
          for (var m4 = v3 | (1 << r_1) - 1; v3 <= m4; ++v3) {
            co[rev[v3] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i3 = 0; i3 < s; ++i3) {
        if (cd[i3]) {
          co[i3] = rev[le2[cd[i3] - 1]++] >> 15 - cd[i3];
        }
      }
    }
    return co;
  });
  var flt = new u8(288);
  for (i3 = 0; i3 < 144; ++i3)
    flt[i3] = 8;
  var i3;
  for (i3 = 144; i3 < 256; ++i3)
    flt[i3] = 9;
  var i3;
  for (i3 = 256; i3 < 280; ++i3)
    flt[i3] = 7;
  var i3;
  for (i3 = 280; i3 < 288; ++i3)
    flt[i3] = 8;
  var i3;
  var fdt = new u8(32);
  for (i3 = 0; i3 < 32; ++i3)
    fdt[i3] = 5;
  var i3;
  var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
  var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
  var max = function(a3) {
    var m4 = a3[0];
    for (var i3 = 1; i3 < a3.length; ++i3) {
      if (a3[i3] > m4)
        m4 = a3[i3];
    }
    return m4;
  };
  var bits = function(d3, p3, m4) {
    var o3 = p3 / 8 | 0;
    return (d3[o3] | d3[o3 + 1] << 8) >> (p3 & 7) & m4;
  };
  var bits16 = function(d3, p3) {
    var o3 = p3 / 8 | 0;
    return (d3[o3] | d3[o3 + 1] << 8 | d3[o3 + 2] << 16) >> (p3 & 7);
  };
  var shft = function(p3) {
    return (p3 + 7) / 8 | 0;
  };
  var slc = function(v3, s, e3) {
    if (s == null || s < 0)
      s = 0;
    if (e3 == null || e3 > v3.length)
      e3 = v3.length;
    return new u8(v3.subarray(s, e3));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt2) {
    var e3 = new Error(msg || ec[ind]);
    e3.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e3, err);
    if (!nt2)
      throw e3;
    return e3;
  };
  var inflt = function(dat, st3, buf, dict) {
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st3.f && !st3.l)
      return buf || new u8(0);
    var noBuf = !buf;
    var resize = noBuf || st3.i != 2;
    var noSt = st3.i;
    if (noBuf)
      buf = new u8(sl * 3);
    var cbuf = function(l4) {
      var bl = buf.length;
      if (l4 > bl) {
        var nbuf = new u8(Math.max(bl * 2, l4));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    var final = st3.f || 0, pos = st3.p || 0, bt3 = st3.b || 0, lm = st3.l, dm = st3.d, lbt = st3.m, dbt = st3.n;
    var tbts = sl * 8;
    do {
      if (!lm) {
        final = bits(dat, pos, 1);
        var type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          var s = shft(pos) + 4, l3 = dat[s - 4] | dat[s - 3] << 8, t2 = s + l3;
          if (t2 > sl) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt3 + l3);
          buf.set(dat.subarray(s, t2), bt3);
          st3.b = bt3 += l3, st3.p = pos = t2 * 8, st3.f = final;
          continue;
        } else if (type == 1)
          lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
        else if (type == 2) {
          var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
          var tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          var ldt = new u8(tl);
          var clt = new u8(19);
          for (var i3 = 0; i3 < hcLen; ++i3) {
            clt[clim[i3]] = bits(dat, pos + i3 * 3, 7);
          }
          pos += hcLen * 3;
          var clb = max(clt), clbmsk = (1 << clb) - 1;
          var clm = hMap(clt, clb, 1);
          for (var i3 = 0; i3 < tl; ) {
            var r4 = clm[bits(dat, pos, clbmsk)];
            pos += r4 & 15;
            var s = r4 >> 4;
            if (s < 16) {
              ldt[i3++] = s;
            } else {
              var c3 = 0, n4 = 0;
              if (s == 16)
                n4 = 3 + bits(dat, pos, 3), pos += 2, c3 = ldt[i3 - 1];
              else if (s == 17)
                n4 = 3 + bits(dat, pos, 7), pos += 3;
              else if (s == 18)
                n4 = 11 + bits(dat, pos, 127), pos += 7;
              while (n4--)
                ldt[i3++] = c3;
            }
          }
          var lt3 = ldt.subarray(0, hLit), dt2 = ldt.subarray(hLit);
          lbt = max(lt3);
          dbt = max(dt2);
          lm = hMap(lt3, lbt, 1);
          dm = hMap(dt2, dbt, 1);
        } else
          err(1);
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
      }
      if (resize)
        cbuf(bt3 + 131072);
      var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
      var lpos = pos;
      for (; ; lpos = pos) {
        var c3 = lm[bits16(dat, pos) & lms], sym = c3 >> 4;
        pos += c3 & 15;
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (!c3)
          err(2);
        if (sym < 256)
          buf[bt3++] = sym;
        else if (sym == 256) {
          lpos = pos, lm = null;
          break;
        } else {
          var add = sym - 254;
          if (sym > 264) {
            var i3 = sym - 257, b4 = fleb[i3];
            add = bits(dat, pos, (1 << b4) - 1) + fl[i3];
            pos += b4;
          }
          var d3 = dm[bits16(dat, pos) & dms], dsym = d3 >> 4;
          if (!d3)
            err(3);
          pos += d3 & 15;
          var dt2 = fd[dsym];
          if (dsym > 3) {
            var b4 = fdeb[dsym];
            dt2 += bits16(dat, pos) & (1 << b4) - 1, pos += b4;
          }
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt3 + 131072);
          var end = bt3 + add;
          if (bt3 < dt2) {
            var shift = dl - dt2, dend = Math.min(dt2, end);
            if (shift + bt3 < 0)
              err(3);
            for (; bt3 < dend; ++bt3)
              buf[bt3] = dict[shift + bt3];
          }
          for (; bt3 < end; ++bt3)
            buf[bt3] = buf[bt3 - dt2];
        }
      }
      st3.l = lm, st3.p = lpos, st3.b = bt3, st3.f = final;
      if (lm)
        final = 1, st3.m = lbt, st3.d = dm, st3.n = dbt;
    } while (!final);
    return bt3 != buf.length && noBuf ? slc(buf, 0, bt3) : buf.subarray(0, bt3);
  };
  var et = /* @__PURE__ */ new u8(0);
  var zls = function(d3, dict) {
    if ((d3[0] & 15) != 8 || d3[0] >> 4 > 7 || (d3[0] << 8 | d3[1]) % 31)
      err(6, "invalid zlib data");
    if ((d3[1] >> 5 & 1) == +!dict)
      err(6, "invalid zlib data: " + (d3[1] & 32 ? "need" : "unexpected") + " dictionary");
    return (d3[1] >> 3 & 4) + 2;
  };
  function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
  }
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e3) {
  }

  // node_modules/three/examples/jsm/loaders/EXRLoader.js
  var EXRLoader = class extends DataTextureLoader {
    /**
     * Constructs a new EXR loader.
     *
     * @param {LoadingManager} [manager] - The loading manager.
     */
    constructor(manager) {
      super(manager);
      this.type = HalfFloatType;
      this.outputFormat = RGBAFormat;
    }
    /**
     * Parses the given EXR texture data.
     *
     * @param {ArrayBuffer} buffer - The raw texture data.
     * @return {DataTextureLoader~TexData} An object representing the parsed texture data.
     */
    parse(buffer) {
      const USHORT_RANGE = 1 << 16;
      const BITMAP_SIZE = USHORT_RANGE >> 3;
      const HUF_ENCBITS = 16;
      const HUF_DECBITS = 14;
      const HUF_ENCSIZE = (1 << HUF_ENCBITS) + 1;
      const HUF_DECSIZE = 1 << HUF_DECBITS;
      const HUF_DECMASK = HUF_DECSIZE - 1;
      const NBITS = 16;
      const A_OFFSET = 1 << NBITS - 1;
      const MOD_MASK = (1 << NBITS) - 1;
      const SHORT_ZEROCODE_RUN = 59;
      const LONG_ZEROCODE_RUN = 63;
      const SHORTEST_LONG_RUN = 2 + LONG_ZEROCODE_RUN - SHORT_ZEROCODE_RUN;
      const ULONG_SIZE = 8;
      const FLOAT32_SIZE = 4;
      const INT32_SIZE = 4;
      const INT16_SIZE = 2;
      const INT8_SIZE = 1;
      const STATIC_HUFFMAN = 0;
      const DEFLATE = 1;
      const UNKNOWN = 0;
      const LOSSY_DCT = 1;
      const RLE = 2;
      const logBase = Math.pow(2.7182818, 2.2);
      function reverseLutFromBitmap(bitmap, lut) {
        let k2 = 0;
        for (let i3 = 0; i3 < USHORT_RANGE; ++i3) {
          if (i3 == 0 || bitmap[i3 >> 3] & 1 << (i3 & 7)) {
            lut[k2++] = i3;
          }
        }
        const n4 = k2 - 1;
        while (k2 < USHORT_RANGE) lut[k2++] = 0;
        return n4;
      }
      function hufClearDecTable(hdec) {
        for (let i3 = 0; i3 < HUF_DECSIZE; i3++) {
          hdec[i3] = {};
          hdec[i3].len = 0;
          hdec[i3].lit = 0;
          hdec[i3].p = null;
        }
      }
      const getBitsReturn = { l: 0, c: 0, lc: 0 };
      function getBits(nBits, c3, lc, uInt8Array2, inOffset) {
        while (lc < nBits) {
          c3 = c3 << 8 | parseUint8Array(uInt8Array2, inOffset);
          lc += 8;
        }
        lc -= nBits;
        getBitsReturn.l = c3 >> lc & (1 << nBits) - 1;
        getBitsReturn.c = c3;
        getBitsReturn.lc = lc;
      }
      const hufTableBuffer = new Array(59);
      function hufCanonicalCodeTable(hcode) {
        for (let i3 = 0; i3 <= 58; ++i3) hufTableBuffer[i3] = 0;
        for (let i3 = 0; i3 < HUF_ENCSIZE; ++i3) hufTableBuffer[hcode[i3]] += 1;
        let c3 = 0;
        for (let i3 = 58; i3 > 0; --i3) {
          const nc = c3 + hufTableBuffer[i3] >> 1;
          hufTableBuffer[i3] = c3;
          c3 = nc;
        }
        for (let i3 = 0; i3 < HUF_ENCSIZE; ++i3) {
          const l3 = hcode[i3];
          if (l3 > 0) hcode[i3] = l3 | hufTableBuffer[l3]++ << 6;
        }
      }
      function hufUnpackEncTable(uInt8Array2, inOffset, ni2, im, iM, hcode) {
        const p3 = inOffset;
        let c3 = 0;
        let lc = 0;
        for (; im <= iM; im++) {
          if (p3.value - inOffset.value > ni2) return false;
          getBits(6, c3, lc, uInt8Array2, p3);
          const l3 = getBitsReturn.l;
          c3 = getBitsReturn.c;
          lc = getBitsReturn.lc;
          hcode[im] = l3;
          if (l3 == LONG_ZEROCODE_RUN) {
            if (p3.value - inOffset.value > ni2) {
              throw new Error("Something wrong with hufUnpackEncTable");
            }
            getBits(8, c3, lc, uInt8Array2, p3);
            let zerun = getBitsReturn.l + SHORTEST_LONG_RUN;
            c3 = getBitsReturn.c;
            lc = getBitsReturn.lc;
            if (im + zerun > iM + 1) {
              throw new Error("Something wrong with hufUnpackEncTable");
            }
            while (zerun--) hcode[im++] = 0;
            im--;
          } else if (l3 >= SHORT_ZEROCODE_RUN) {
            let zerun = l3 - SHORT_ZEROCODE_RUN + 2;
            if (im + zerun > iM + 1) {
              throw new Error("Something wrong with hufUnpackEncTable");
            }
            while (zerun--) hcode[im++] = 0;
            im--;
          }
        }
        hufCanonicalCodeTable(hcode);
      }
      function hufLength(code) {
        return code & 63;
      }
      function hufCode(code) {
        return code >> 6;
      }
      function hufBuildDecTable(hcode, im, iM, hdecod) {
        for (; im <= iM; im++) {
          const c3 = hufCode(hcode[im]);
          const l3 = hufLength(hcode[im]);
          if (c3 >> l3) {
            throw new Error("Invalid table entry");
          }
          if (l3 > HUF_DECBITS) {
            const pl = hdecod[c3 >> l3 - HUF_DECBITS];
            if (pl.len) {
              throw new Error("Invalid table entry");
            }
            pl.lit++;
            if (pl.p) {
              const p3 = pl.p;
              pl.p = new Array(pl.lit);
              for (let i3 = 0; i3 < pl.lit - 1; ++i3) {
                pl.p[i3] = p3[i3];
              }
            } else {
              pl.p = new Array(1);
            }
            pl.p[pl.lit - 1] = im;
          } else if (l3) {
            let plOffset = 0;
            for (let i3 = 1 << HUF_DECBITS - l3; i3 > 0; i3--) {
              const pl = hdecod[(c3 << HUF_DECBITS - l3) + plOffset];
              if (pl.len || pl.p) {
                throw new Error("Invalid table entry");
              }
              pl.len = l3;
              pl.lit = im;
              plOffset++;
            }
          }
        }
        return true;
      }
      const getCharReturn = { c: 0, lc: 0 };
      function getChar(c3, lc, uInt8Array2, inOffset) {
        c3 = c3 << 8 | parseUint8Array(uInt8Array2, inOffset);
        lc += 8;
        getCharReturn.c = c3;
        getCharReturn.lc = lc;
      }
      const getCodeReturn = { c: 0, lc: 0 };
      function getCode(po, rlc, c3, lc, uInt8Array2, inOffset, outBuffer, outBufferOffset, outBufferEndOffset) {
        if (po == rlc) {
          if (lc < 8) {
            getChar(c3, lc, uInt8Array2, inOffset);
            c3 = getCharReturn.c;
            lc = getCharReturn.lc;
          }
          lc -= 8;
          let cs2 = c3 >> lc;
          cs2 = new Uint8Array([cs2])[0];
          if (outBufferOffset.value + cs2 > outBufferEndOffset) {
            return false;
          }
          const s = outBuffer[outBufferOffset.value - 1];
          while (cs2-- > 0) {
            outBuffer[outBufferOffset.value++] = s;
          }
        } else if (outBufferOffset.value < outBufferEndOffset) {
          outBuffer[outBufferOffset.value++] = po;
        } else {
          return false;
        }
        getCodeReturn.c = c3;
        getCodeReturn.lc = lc;
      }
      function UInt16(value) {
        return value & 65535;
      }
      function Int16(value) {
        const ref = UInt16(value);
        return ref > 32767 ? ref - 65536 : ref;
      }
      const wdec14Return = { a: 0, b: 0 };
      function wdec14(l3, h2) {
        const ls = Int16(l3);
        const hs = Int16(h2);
        const hi2 = hs;
        const ai2 = ls + (hi2 & 1) + (hi2 >> 1);
        const as2 = ai2;
        const bs = ai2 - hi2;
        wdec14Return.a = as2;
        wdec14Return.b = bs;
      }
      function wdec16(l3, h2) {
        const m4 = UInt16(l3);
        const d3 = UInt16(h2);
        const bb = m4 - (d3 >> 1) & MOD_MASK;
        const aa = d3 + bb - A_OFFSET & MOD_MASK;
        wdec14Return.a = aa;
        wdec14Return.b = bb;
      }
      function wav2Decode(buffer2, j2, nx, ox, ny, oy, mx) {
        const w14 = mx < 1 << 14;
        const n4 = nx > ny ? ny : nx;
        let p3 = 1;
        let p22;
        let py;
        while (p3 <= n4) p3 <<= 1;
        p3 >>= 1;
        p22 = p3;
        p3 >>= 1;
        while (p3 >= 1) {
          py = 0;
          const ey = py + oy * (ny - p22);
          const oy1 = oy * p3;
          const oy2 = oy * p22;
          const ox1 = ox * p3;
          const ox2 = ox * p22;
          let i00, i01, i10, i11;
          for (; py <= ey; py += oy2) {
            let px = py;
            const ex = py + ox * (nx - p22);
            for (; px <= ex; px += ox2) {
              const p01 = px + ox1;
              const p10 = px + oy1;
              const p11 = p10 + ox1;
              if (w14) {
                wdec14(buffer2[px + j2], buffer2[p10 + j2]);
                i00 = wdec14Return.a;
                i10 = wdec14Return.b;
                wdec14(buffer2[p01 + j2], buffer2[p11 + j2]);
                i01 = wdec14Return.a;
                i11 = wdec14Return.b;
                wdec14(i00, i01);
                buffer2[px + j2] = wdec14Return.a;
                buffer2[p01 + j2] = wdec14Return.b;
                wdec14(i10, i11);
                buffer2[p10 + j2] = wdec14Return.a;
                buffer2[p11 + j2] = wdec14Return.b;
              } else {
                wdec16(buffer2[px + j2], buffer2[p10 + j2]);
                i00 = wdec14Return.a;
                i10 = wdec14Return.b;
                wdec16(buffer2[p01 + j2], buffer2[p11 + j2]);
                i01 = wdec14Return.a;
                i11 = wdec14Return.b;
                wdec16(i00, i01);
                buffer2[px + j2] = wdec14Return.a;
                buffer2[p01 + j2] = wdec14Return.b;
                wdec16(i10, i11);
                buffer2[p10 + j2] = wdec14Return.a;
                buffer2[p11 + j2] = wdec14Return.b;
              }
            }
            if (nx & p3) {
              const p10 = px + oy1;
              if (w14)
                wdec14(buffer2[px + j2], buffer2[p10 + j2]);
              else
                wdec16(buffer2[px + j2], buffer2[p10 + j2]);
              i00 = wdec14Return.a;
              buffer2[p10 + j2] = wdec14Return.b;
              buffer2[px + j2] = i00;
            }
          }
          if (ny & p3) {
            let px = py;
            const ex = py + ox * (nx - p22);
            for (; px <= ex; px += ox2) {
              const p01 = px + ox1;
              if (w14)
                wdec14(buffer2[px + j2], buffer2[p01 + j2]);
              else
                wdec16(buffer2[px + j2], buffer2[p01 + j2]);
              i00 = wdec14Return.a;
              buffer2[p01 + j2] = wdec14Return.b;
              buffer2[px + j2] = i00;
            }
          }
          p22 = p3;
          p3 >>= 1;
        }
        return py;
      }
      function hufDecode(encodingTable, decodingTable, uInt8Array2, inOffset, ni2, rlc, no, outBuffer, outOffset) {
        let c3 = 0;
        let lc = 0;
        const outBufferEndOffset = no;
        const inOffsetEnd = Math.trunc(inOffset.value + (ni2 + 7) / 8);
        while (inOffset.value < inOffsetEnd) {
          getChar(c3, lc, uInt8Array2, inOffset);
          c3 = getCharReturn.c;
          lc = getCharReturn.lc;
          while (lc >= HUF_DECBITS) {
            const index = c3 >> lc - HUF_DECBITS & HUF_DECMASK;
            const pl = decodingTable[index];
            if (pl.len) {
              lc -= pl.len;
              getCode(pl.lit, rlc, c3, lc, uInt8Array2, inOffset, outBuffer, outOffset, outBufferEndOffset);
              c3 = getCodeReturn.c;
              lc = getCodeReturn.lc;
            } else {
              if (!pl.p) {
                throw new Error("hufDecode issues");
              }
              let j2;
              for (j2 = 0; j2 < pl.lit; j2++) {
                const l3 = hufLength(encodingTable[pl.p[j2]]);
                while (lc < l3 && inOffset.value < inOffsetEnd) {
                  getChar(c3, lc, uInt8Array2, inOffset);
                  c3 = getCharReturn.c;
                  lc = getCharReturn.lc;
                }
                if (lc >= l3) {
                  if (hufCode(encodingTable[pl.p[j2]]) == (c3 >> lc - l3 & (1 << l3) - 1)) {
                    lc -= l3;
                    getCode(pl.p[j2], rlc, c3, lc, uInt8Array2, inOffset, outBuffer, outOffset, outBufferEndOffset);
                    c3 = getCodeReturn.c;
                    lc = getCodeReturn.lc;
                    break;
                  }
                }
              }
              if (j2 == pl.lit) {
                throw new Error("hufDecode issues");
              }
            }
          }
        }
        const i3 = 8 - ni2 & 7;
        c3 >>= i3;
        lc -= i3;
        while (lc > 0) {
          const pl = decodingTable[c3 << HUF_DECBITS - lc & HUF_DECMASK];
          if (pl.len) {
            lc -= pl.len;
            getCode(pl.lit, rlc, c3, lc, uInt8Array2, inOffset, outBuffer, outOffset, outBufferEndOffset);
            c3 = getCodeReturn.c;
            lc = getCodeReturn.lc;
          } else {
            throw new Error("hufDecode issues");
          }
        }
        return true;
      }
      function hufUncompress(uInt8Array2, inDataView, inOffset, nCompressed, outBuffer, nRaw) {
        const outOffset = { value: 0 };
        const initialInOffset = inOffset.value;
        const im = parseUint32(inDataView, inOffset);
        const iM = parseUint32(inDataView, inOffset);
        inOffset.value += 4;
        const nBits = parseUint32(inDataView, inOffset);
        inOffset.value += 4;
        if (im < 0 || im >= HUF_ENCSIZE || iM < 0 || iM >= HUF_ENCSIZE) {
          throw new Error("Something wrong with HUF_ENCSIZE");
        }
        const freq = new Array(HUF_ENCSIZE);
        const hdec = new Array(HUF_DECSIZE);
        hufClearDecTable(hdec);
        const ni2 = nCompressed - (inOffset.value - initialInOffset);
        hufUnpackEncTable(uInt8Array2, inOffset, ni2, im, iM, freq);
        if (nBits > 8 * (nCompressed - (inOffset.value - initialInOffset))) {
          throw new Error("Something wrong with hufUncompress");
        }
        hufBuildDecTable(freq, im, iM, hdec);
        hufDecode(freq, hdec, uInt8Array2, inOffset, nBits, iM, nRaw, outBuffer, outOffset);
      }
      function applyLut(lut, data, nData) {
        for (let i3 = 0; i3 < nData; ++i3) {
          data[i3] = lut[data[i3]];
        }
      }
      function predictor(source) {
        for (let t2 = 1; t2 < source.length; t2++) {
          const d3 = source[t2 - 1] + source[t2] - 128;
          source[t2] = d3;
        }
      }
      function interleaveScalar(source, out) {
        let t1 = 0;
        let t2 = Math.floor((source.length + 1) / 2);
        let s = 0;
        const stop = source.length - 1;
        while (true) {
          if (s > stop) break;
          out[s++] = source[t1++];
          if (s > stop) break;
          out[s++] = source[t2++];
        }
      }
      function decodeRunLength(source) {
        let size = source.byteLength;
        const out = new Array();
        let p3 = 0;
        const reader = new DataView(source);
        while (size > 0) {
          const l3 = reader.getInt8(p3++);
          if (l3 < 0) {
            const count = -l3;
            size -= count + 1;
            for (let i3 = 0; i3 < count; i3++) {
              out.push(reader.getUint8(p3++));
            }
          } else {
            const count = l3;
            size -= 2;
            const value = reader.getUint8(p3++);
            for (let i3 = 0; i3 < count + 1; i3++) {
              out.push(value);
            }
          }
        }
        return out;
      }
      function lossyDctDecode(cscSet, rowPtrs, channelData, acBuffer, dcBuffer, outBuffer) {
        let dataView = new DataView(outBuffer.buffer);
        const width = channelData[cscSet.idx[0]].width;
        const height = channelData[cscSet.idx[0]].height;
        const numComp = 3;
        const numFullBlocksX = Math.floor(width / 8);
        const numBlocksX = Math.ceil(width / 8);
        const numBlocksY = Math.ceil(height / 8);
        const leftoverX = width - (numBlocksX - 1) * 8;
        const leftoverY = height - (numBlocksY - 1) * 8;
        const currAcComp = { value: 0 };
        const currDcComp = new Array(numComp);
        const dctData = new Array(numComp);
        const halfZigBlock = new Array(numComp);
        const rowBlock = new Array(numComp);
        const rowOffsets = new Array(numComp);
        for (let comp = 0; comp < numComp; ++comp) {
          rowOffsets[comp] = rowPtrs[cscSet.idx[comp]];
          currDcComp[comp] = comp < 1 ? 0 : currDcComp[comp - 1] + numBlocksX * numBlocksY;
          dctData[comp] = new Float32Array(64);
          halfZigBlock[comp] = new Uint16Array(64);
          rowBlock[comp] = new Uint16Array(numBlocksX * 64);
        }
        for (let blocky = 0; blocky < numBlocksY; ++blocky) {
          let maxY = 8;
          if (blocky == numBlocksY - 1)
            maxY = leftoverY;
          let maxX = 8;
          for (let blockx = 0; blockx < numBlocksX; ++blockx) {
            if (blockx == numBlocksX - 1)
              maxX = leftoverX;
            for (let comp = 0; comp < numComp; ++comp) {
              halfZigBlock[comp].fill(0);
              halfZigBlock[comp][0] = dcBuffer[currDcComp[comp]++];
              unRleAC(currAcComp, acBuffer, halfZigBlock[comp]);
              unZigZag(halfZigBlock[comp], dctData[comp]);
              dctInverse(dctData[comp]);
            }
            if (numComp == 3) {
              csc709Inverse(dctData);
            }
            for (let comp = 0; comp < numComp; ++comp) {
              convertToHalf(dctData[comp], rowBlock[comp], blockx * 64);
            }
          }
          let offset2 = 0;
          for (let comp = 0; comp < numComp; ++comp) {
            const type = channelData[cscSet.idx[comp]].type;
            for (let y2 = 8 * blocky; y2 < 8 * blocky + maxY; ++y2) {
              offset2 = rowOffsets[comp][y2];
              for (let blockx = 0; blockx < numFullBlocksX; ++blockx) {
                const src = blockx * 64 + (y2 & 7) * 8;
                dataView.setUint16(offset2 + 0 * INT16_SIZE * type, rowBlock[comp][src + 0], true);
                dataView.setUint16(offset2 + 1 * INT16_SIZE * type, rowBlock[comp][src + 1], true);
                dataView.setUint16(offset2 + 2 * INT16_SIZE * type, rowBlock[comp][src + 2], true);
                dataView.setUint16(offset2 + 3 * INT16_SIZE * type, rowBlock[comp][src + 3], true);
                dataView.setUint16(offset2 + 4 * INT16_SIZE * type, rowBlock[comp][src + 4], true);
                dataView.setUint16(offset2 + 5 * INT16_SIZE * type, rowBlock[comp][src + 5], true);
                dataView.setUint16(offset2 + 6 * INT16_SIZE * type, rowBlock[comp][src + 6], true);
                dataView.setUint16(offset2 + 7 * INT16_SIZE * type, rowBlock[comp][src + 7], true);
                offset2 += 8 * INT16_SIZE * type;
              }
            }
            if (numFullBlocksX != numBlocksX) {
              for (let y2 = 8 * blocky; y2 < 8 * blocky + maxY; ++y2) {
                const offset3 = rowOffsets[comp][y2] + 8 * numFullBlocksX * INT16_SIZE * type;
                const src = numFullBlocksX * 64 + (y2 & 7) * 8;
                for (let x3 = 0; x3 < maxX; ++x3) {
                  dataView.setUint16(offset3 + x3 * INT16_SIZE * type, rowBlock[comp][src + x3], true);
                }
              }
            }
          }
        }
        const halfRow = new Uint16Array(width);
        dataView = new DataView(outBuffer.buffer);
        for (let comp = 0; comp < numComp; ++comp) {
          channelData[cscSet.idx[comp]].decoded = true;
          const type = channelData[cscSet.idx[comp]].type;
          if (channelData[comp].type != 2) continue;
          for (let y2 = 0; y2 < height; ++y2) {
            const offset2 = rowOffsets[comp][y2];
            for (let x3 = 0; x3 < width; ++x3) {
              halfRow[x3] = dataView.getUint16(offset2 + x3 * INT16_SIZE * type, true);
            }
            for (let x3 = 0; x3 < width; ++x3) {
              dataView.setFloat32(offset2 + x3 * INT16_SIZE * type, decodeFloat16(halfRow[x3]), true);
            }
          }
        }
      }
      function lossyDctChannelDecode(channelIndex, rowPtrs, channelData, acBuffer, dcBuffer, outBuffer) {
        const dataView = new DataView(outBuffer.buffer);
        const cd = channelData[channelIndex];
        const width = cd.width;
        const height = cd.height;
        const numBlocksX = Math.ceil(width / 8);
        const numBlocksY = Math.ceil(height / 8);
        const numFullBlocksX = Math.floor(width / 8);
        const leftoverX = width - (numBlocksX - 1) * 8;
        const leftoverY = height - (numBlocksY - 1) * 8;
        const currAcComp = { value: 0 };
        let currDcComp = 0;
        const dctData = new Float32Array(64);
        const halfZigBlock = new Uint16Array(64);
        const rowBlock = new Uint16Array(numBlocksX * 64);
        for (let blocky = 0; blocky < numBlocksY; ++blocky) {
          let maxY = 8;
          if (blocky == numBlocksY - 1) maxY = leftoverY;
          for (let blockx = 0; blockx < numBlocksX; ++blockx) {
            halfZigBlock.fill(0);
            halfZigBlock[0] = dcBuffer[currDcComp++];
            unRleAC(currAcComp, acBuffer, halfZigBlock);
            unZigZag(halfZigBlock, dctData);
            dctInverse(dctData);
            convertToHalf(dctData, rowBlock, blockx * 64);
          }
          for (let y2 = 8 * blocky; y2 < 8 * blocky + maxY; ++y2) {
            let offset2 = rowPtrs[channelIndex][y2];
            for (let blockx = 0; blockx < numFullBlocksX; ++blockx) {
              const src = blockx * 64 + (y2 & 7) * 8;
              for (let x3 = 0; x3 < 8; ++x3) {
                dataView.setUint16(offset2 + x3 * INT16_SIZE * cd.type, rowBlock[src + x3], true);
              }
              offset2 += 8 * INT16_SIZE * cd.type;
            }
            if (numBlocksX != numFullBlocksX) {
              const src = numFullBlocksX * 64 + (y2 & 7) * 8;
              for (let x3 = 0; x3 < leftoverX; ++x3) {
                dataView.setUint16(offset2 + x3 * INT16_SIZE * cd.type, rowBlock[src + x3], true);
              }
            }
          }
        }
        cd.decoded = true;
      }
      function unRleAC(currAcComp, acBuffer, halfZigBlock) {
        let acValue;
        let dctComp = 1;
        while (dctComp < 64) {
          acValue = acBuffer[currAcComp.value];
          if (acValue == 65280) {
            dctComp = 64;
          } else if (acValue >> 8 == 255) {
            dctComp += acValue & 255;
          } else {
            halfZigBlock[dctComp] = acValue;
            dctComp++;
          }
          currAcComp.value++;
        }
      }
      function unZigZag(src, dst) {
        dst[0] = decodeFloat16(src[0]);
        dst[1] = decodeFloat16(src[1]);
        dst[2] = decodeFloat16(src[5]);
        dst[3] = decodeFloat16(src[6]);
        dst[4] = decodeFloat16(src[14]);
        dst[5] = decodeFloat16(src[15]);
        dst[6] = decodeFloat16(src[27]);
        dst[7] = decodeFloat16(src[28]);
        dst[8] = decodeFloat16(src[2]);
        dst[9] = decodeFloat16(src[4]);
        dst[10] = decodeFloat16(src[7]);
        dst[11] = decodeFloat16(src[13]);
        dst[12] = decodeFloat16(src[16]);
        dst[13] = decodeFloat16(src[26]);
        dst[14] = decodeFloat16(src[29]);
        dst[15] = decodeFloat16(src[42]);
        dst[16] = decodeFloat16(src[3]);
        dst[17] = decodeFloat16(src[8]);
        dst[18] = decodeFloat16(src[12]);
        dst[19] = decodeFloat16(src[17]);
        dst[20] = decodeFloat16(src[25]);
        dst[21] = decodeFloat16(src[30]);
        dst[22] = decodeFloat16(src[41]);
        dst[23] = decodeFloat16(src[43]);
        dst[24] = decodeFloat16(src[9]);
        dst[25] = decodeFloat16(src[11]);
        dst[26] = decodeFloat16(src[18]);
        dst[27] = decodeFloat16(src[24]);
        dst[28] = decodeFloat16(src[31]);
        dst[29] = decodeFloat16(src[40]);
        dst[30] = decodeFloat16(src[44]);
        dst[31] = decodeFloat16(src[53]);
        dst[32] = decodeFloat16(src[10]);
        dst[33] = decodeFloat16(src[19]);
        dst[34] = decodeFloat16(src[23]);
        dst[35] = decodeFloat16(src[32]);
        dst[36] = decodeFloat16(src[39]);
        dst[37] = decodeFloat16(src[45]);
        dst[38] = decodeFloat16(src[52]);
        dst[39] = decodeFloat16(src[54]);
        dst[40] = decodeFloat16(src[20]);
        dst[41] = decodeFloat16(src[22]);
        dst[42] = decodeFloat16(src[33]);
        dst[43] = decodeFloat16(src[38]);
        dst[44] = decodeFloat16(src[46]);
        dst[45] = decodeFloat16(src[51]);
        dst[46] = decodeFloat16(src[55]);
        dst[47] = decodeFloat16(src[60]);
        dst[48] = decodeFloat16(src[21]);
        dst[49] = decodeFloat16(src[34]);
        dst[50] = decodeFloat16(src[37]);
        dst[51] = decodeFloat16(src[47]);
        dst[52] = decodeFloat16(src[50]);
        dst[53] = decodeFloat16(src[56]);
        dst[54] = decodeFloat16(src[59]);
        dst[55] = decodeFloat16(src[61]);
        dst[56] = decodeFloat16(src[35]);
        dst[57] = decodeFloat16(src[36]);
        dst[58] = decodeFloat16(src[48]);
        dst[59] = decodeFloat16(src[49]);
        dst[60] = decodeFloat16(src[57]);
        dst[61] = decodeFloat16(src[58]);
        dst[62] = decodeFloat16(src[62]);
        dst[63] = decodeFloat16(src[63]);
      }
      function dctInverse(data) {
        const a3 = 0.5 * Math.cos(3.14159 / 4);
        const b4 = 0.5 * Math.cos(3.14159 / 16);
        const c3 = 0.5 * Math.cos(3.14159 / 8);
        const d3 = 0.5 * Math.cos(3 * 3.14159 / 16);
        const e3 = 0.5 * Math.cos(5 * 3.14159 / 16);
        const f4 = 0.5 * Math.cos(3 * 3.14159 / 8);
        const g5 = 0.5 * Math.cos(7 * 3.14159 / 16);
        const alpha = new Array(4);
        const beta = new Array(4);
        const theta = new Array(4);
        const gamma = new Array(4);
        for (let row = 0; row < 8; ++row) {
          const rowPtr = row * 8;
          alpha[0] = c3 * data[rowPtr + 2];
          alpha[1] = f4 * data[rowPtr + 2];
          alpha[2] = c3 * data[rowPtr + 6];
          alpha[3] = f4 * data[rowPtr + 6];
          beta[0] = b4 * data[rowPtr + 1] + d3 * data[rowPtr + 3] + e3 * data[rowPtr + 5] + g5 * data[rowPtr + 7];
          beta[1] = d3 * data[rowPtr + 1] - g5 * data[rowPtr + 3] - b4 * data[rowPtr + 5] - e3 * data[rowPtr + 7];
          beta[2] = e3 * data[rowPtr + 1] - b4 * data[rowPtr + 3] + g5 * data[rowPtr + 5] + d3 * data[rowPtr + 7];
          beta[3] = g5 * data[rowPtr + 1] - e3 * data[rowPtr + 3] + d3 * data[rowPtr + 5] - b4 * data[rowPtr + 7];
          theta[0] = a3 * (data[rowPtr + 0] + data[rowPtr + 4]);
          theta[3] = a3 * (data[rowPtr + 0] - data[rowPtr + 4]);
          theta[1] = alpha[0] + alpha[3];
          theta[2] = alpha[1] - alpha[2];
          gamma[0] = theta[0] + theta[1];
          gamma[1] = theta[3] + theta[2];
          gamma[2] = theta[3] - theta[2];
          gamma[3] = theta[0] - theta[1];
          data[rowPtr + 0] = gamma[0] + beta[0];
          data[rowPtr + 1] = gamma[1] + beta[1];
          data[rowPtr + 2] = gamma[2] + beta[2];
          data[rowPtr + 3] = gamma[3] + beta[3];
          data[rowPtr + 4] = gamma[3] - beta[3];
          data[rowPtr + 5] = gamma[2] - beta[2];
          data[rowPtr + 6] = gamma[1] - beta[1];
          data[rowPtr + 7] = gamma[0] - beta[0];
        }
        for (let column = 0; column < 8; ++column) {
          alpha[0] = c3 * data[16 + column];
          alpha[1] = f4 * data[16 + column];
          alpha[2] = c3 * data[48 + column];
          alpha[3] = f4 * data[48 + column];
          beta[0] = b4 * data[8 + column] + d3 * data[24 + column] + e3 * data[40 + column] + g5 * data[56 + column];
          beta[1] = d3 * data[8 + column] - g5 * data[24 + column] - b4 * data[40 + column] - e3 * data[56 + column];
          beta[2] = e3 * data[8 + column] - b4 * data[24 + column] + g5 * data[40 + column] + d3 * data[56 + column];
          beta[3] = g5 * data[8 + column] - e3 * data[24 + column] + d3 * data[40 + column] - b4 * data[56 + column];
          theta[0] = a3 * (data[column] + data[32 + column]);
          theta[3] = a3 * (data[column] - data[32 + column]);
          theta[1] = alpha[0] + alpha[3];
          theta[2] = alpha[1] - alpha[2];
          gamma[0] = theta[0] + theta[1];
          gamma[1] = theta[3] + theta[2];
          gamma[2] = theta[3] - theta[2];
          gamma[3] = theta[0] - theta[1];
          data[0 + column] = gamma[0] + beta[0];
          data[8 + column] = gamma[1] + beta[1];
          data[16 + column] = gamma[2] + beta[2];
          data[24 + column] = gamma[3] + beta[3];
          data[32 + column] = gamma[3] - beta[3];
          data[40 + column] = gamma[2] - beta[2];
          data[48 + column] = gamma[1] - beta[1];
          data[56 + column] = gamma[0] - beta[0];
        }
      }
      function csc709Inverse(data) {
        for (let i3 = 0; i3 < 64; ++i3) {
          const y2 = data[0][i3];
          const cb = data[1][i3];
          const cr3 = data[2][i3];
          data[0][i3] = y2 + 1.5747 * cr3;
          data[1][i3] = y2 - 0.1873 * cb - 0.4682 * cr3;
          data[2][i3] = y2 + 1.8556 * cb;
        }
      }
      function convertToHalf(src, dst, idx) {
        for (let i3 = 0; i3 < 64; ++i3) {
          dst[idx + i3] = DataUtils.toHalfFloat(toLinear(src[i3]));
        }
      }
      function toLinear(float) {
        if (float <= 1) {
          return Math.sign(float) * Math.pow(Math.abs(float), 2.2);
        } else {
          return Math.sign(float) * Math.pow(logBase, Math.abs(float) - 1);
        }
      }
      function uncompressRAW(info) {
        return new DataView(info.array.buffer, info.offset.value, info.size);
      }
      function uncompressRLE(info) {
        const compressed = info.viewer.buffer.slice(info.offset.value, info.offset.value + info.size);
        const rawBuffer = new Uint8Array(decodeRunLength(compressed));
        const tmpBuffer = new Uint8Array(rawBuffer.length);
        predictor(rawBuffer);
        interleaveScalar(rawBuffer, tmpBuffer);
        return new DataView(tmpBuffer.buffer);
      }
      function uncompressZIP(info) {
        const compressed = info.array.slice(info.offset.value, info.offset.value + info.size);
        const rawBuffer = unzlibSync(compressed);
        const tmpBuffer = new Uint8Array(rawBuffer.length);
        predictor(rawBuffer);
        interleaveScalar(rawBuffer, tmpBuffer);
        return new DataView(tmpBuffer.buffer);
      }
      function uncompressPIZ(info) {
        const inDataView = info.viewer;
        const inOffset = { value: info.offset.value };
        const outBuffer = new Uint16Array(info.columns * info.lines * (info.inputChannels.length * info.type));
        const bitmap = new Uint8Array(BITMAP_SIZE);
        let outBufferEnd = 0;
        const pizChannelData = new Array(info.inputChannels.length);
        for (let i3 = 0, il = info.inputChannels.length; i3 < il; i3++) {
          pizChannelData[i3] = {};
          pizChannelData[i3]["start"] = outBufferEnd;
          pizChannelData[i3]["end"] = pizChannelData[i3]["start"];
          pizChannelData[i3]["nx"] = info.columns;
          pizChannelData[i3]["ny"] = info.lines;
          pizChannelData[i3]["size"] = info.type;
          outBufferEnd += pizChannelData[i3].nx * pizChannelData[i3].ny * pizChannelData[i3].size;
        }
        const minNonZero = parseUint16(inDataView, inOffset);
        const maxNonZero = parseUint16(inDataView, inOffset);
        if (maxNonZero >= BITMAP_SIZE) {
          throw new Error("Something is wrong with PIZ_COMPRESSION BITMAP_SIZE");
        }
        if (minNonZero <= maxNonZero) {
          for (let i3 = 0; i3 < maxNonZero - minNonZero + 1; i3++) {
            bitmap[i3 + minNonZero] = parseUint8(inDataView, inOffset);
          }
        }
        const lut = new Uint16Array(USHORT_RANGE);
        const maxValue = reverseLutFromBitmap(bitmap, lut);
        const length = parseUint32(inDataView, inOffset);
        hufUncompress(info.array, inDataView, inOffset, length, outBuffer, outBufferEnd);
        for (let i3 = 0; i3 < info.inputChannels.length; ++i3) {
          const cd = pizChannelData[i3];
          for (let j2 = 0; j2 < pizChannelData[i3].size; ++j2) {
            wav2Decode(
              outBuffer,
              cd.start + j2,
              cd.nx,
              cd.size,
              cd.ny,
              cd.nx * cd.size,
              maxValue
            );
          }
        }
        applyLut(lut, outBuffer, outBufferEnd);
        let tmpOffset = 0;
        const tmpBuffer = new Uint8Array(outBuffer.buffer.byteLength);
        for (let y2 = 0; y2 < info.lines; y2++) {
          for (let c3 = 0; c3 < info.inputChannels.length; c3++) {
            const cd = pizChannelData[c3];
            const n4 = cd.nx * cd.size;
            const cp = new Uint8Array(outBuffer.buffer, cd.end * INT16_SIZE, n4 * INT16_SIZE);
            tmpBuffer.set(cp, tmpOffset);
            tmpOffset += n4 * INT16_SIZE;
            cd.end += n4;
          }
        }
        return new DataView(tmpBuffer.buffer);
      }
      function uncompressPXR(info) {
        const compressed = info.array.slice(info.offset.value, info.offset.value + info.size);
        const rawBuffer = unzlibSync(compressed);
        const byteSize = info.inputChannels.length * info.lines * info.columns * info.totalBytes;
        const tmpBuffer = new ArrayBuffer(byteSize);
        const viewer = new DataView(tmpBuffer);
        let tmpBufferEnd = 0;
        let writePtr = 0;
        const ptr = new Array(4);
        for (let y2 = 0; y2 < info.lines; y2++) {
          for (let c3 = 0; c3 < info.inputChannels.length; c3++) {
            let pixel = 0;
            const type = info.inputChannels[c3].pixelType;
            switch (type) {
              case 1:
                ptr[0] = tmpBufferEnd;
                ptr[1] = ptr[0] + info.columns;
                tmpBufferEnd = ptr[1] + info.columns;
                for (let j2 = 0; j2 < info.columns; ++j2) {
                  const diff = rawBuffer[ptr[0]++] << 8 | rawBuffer[ptr[1]++];
                  pixel += diff;
                  viewer.setUint16(writePtr, pixel, true);
                  writePtr += 2;
                }
                break;
              case 2:
                ptr[0] = tmpBufferEnd;
                ptr[1] = ptr[0] + info.columns;
                ptr[2] = ptr[1] + info.columns;
                tmpBufferEnd = ptr[2] + info.columns;
                for (let j2 = 0; j2 < info.columns; ++j2) {
                  const diff = rawBuffer[ptr[0]++] << 24 | rawBuffer[ptr[1]++] << 16 | rawBuffer[ptr[2]++] << 8;
                  pixel += diff;
                  viewer.setUint32(writePtr, pixel, true);
                  writePtr += 4;
                }
                break;
            }
          }
        }
        return viewer;
      }
      function uncompressDWA(info) {
        const inDataView = info.viewer;
        const inOffset = { value: info.offset.value };
        const outBuffer = new Uint8Array(info.columns * info.lines * (info.inputChannels.length * info.type * INT16_SIZE));
        const dwaHeader = {
          version: parseInt64(inDataView, inOffset),
          unknownUncompressedSize: parseInt64(inDataView, inOffset),
          unknownCompressedSize: parseInt64(inDataView, inOffset),
          acCompressedSize: parseInt64(inDataView, inOffset),
          dcCompressedSize: parseInt64(inDataView, inOffset),
          rleCompressedSize: parseInt64(inDataView, inOffset),
          rleUncompressedSize: parseInt64(inDataView, inOffset),
          rleRawSize: parseInt64(inDataView, inOffset),
          totalAcUncompressedCount: parseInt64(inDataView, inOffset),
          totalDcUncompressedCount: parseInt64(inDataView, inOffset),
          acCompression: parseInt64(inDataView, inOffset)
        };
        if (dwaHeader.version < 2)
          throw new Error("EXRLoader.parse: " + EXRHeader.compression + " version " + dwaHeader.version + " is unsupported");
        const channelRules = new Array();
        let ruleSize = parseUint16(inDataView, inOffset) - INT16_SIZE;
        while (ruleSize > 0) {
          const name = parseNullTerminatedString(inDataView.buffer, inOffset);
          const value = parseUint8(inDataView, inOffset);
          const compression = value >> 2 & 3;
          const csc = (value >> 4) - 1;
          const index = new Int8Array([csc])[0];
          const type = parseUint8(inDataView, inOffset);
          channelRules.push({
            name,
            index,
            type,
            compression
          });
          ruleSize -= name.length + 3;
        }
        const channels = EXRHeader.channels;
        const channelData = new Array(info.inputChannels.length);
        for (let i3 = 0; i3 < info.inputChannels.length; ++i3) {
          const cd = channelData[i3] = {};
          const channel = channels[i3];
          cd.name = channel.name;
          cd.compression = UNKNOWN;
          cd.decoded = false;
          cd.type = channel.pixelType;
          cd.pLinear = channel.pLinear;
          cd.width = info.columns;
          cd.height = info.lines;
        }
        const cscSet = {
          idx: new Array(3)
        };
        for (let offset2 = 0; offset2 < info.inputChannels.length; ++offset2) {
          const cd = channelData[offset2];
          for (let i3 = 0; i3 < channelRules.length; ++i3) {
            const rule = channelRules[i3];
            if (cd.name == rule.name) {
              cd.compression = rule.compression;
              if (rule.index >= 0) {
                cscSet.idx[rule.index] = offset2;
              }
              cd.offset = offset2;
            }
          }
        }
        let acBuffer, dcBuffer, rleBuffer;
        if (dwaHeader.acCompressedSize > 0) {
          switch (dwaHeader.acCompression) {
            case STATIC_HUFFMAN:
              acBuffer = new Uint16Array(dwaHeader.totalAcUncompressedCount);
              hufUncompress(info.array, inDataView, inOffset, dwaHeader.acCompressedSize, acBuffer, dwaHeader.totalAcUncompressedCount);
              break;
            case DEFLATE:
              const compressed = info.array.slice(inOffset.value, inOffset.value + dwaHeader.totalAcUncompressedCount);
              const data = unzlibSync(compressed);
              acBuffer = new Uint16Array(data.buffer);
              inOffset.value += dwaHeader.totalAcUncompressedCount;
              break;
          }
        }
        if (dwaHeader.dcCompressedSize > 0) {
          const zlibInfo = {
            array: info.array,
            offset: inOffset,
            size: dwaHeader.dcCompressedSize
          };
          dcBuffer = new Uint16Array(uncompressZIP(zlibInfo).buffer);
          inOffset.value += dwaHeader.dcCompressedSize;
        }
        if (dwaHeader.rleRawSize > 0) {
          const compressed = info.array.slice(inOffset.value, inOffset.value + dwaHeader.rleCompressedSize);
          const data = unzlibSync(compressed);
          rleBuffer = decodeRunLength(data.buffer);
          inOffset.value += dwaHeader.rleCompressedSize;
        }
        let outBufferEnd = 0;
        const rowOffsets = new Array(channelData.length);
        for (let i3 = 0; i3 < rowOffsets.length; ++i3) {
          rowOffsets[i3] = new Array();
        }
        for (let y2 = 0; y2 < info.lines; ++y2) {
          for (let chan = 0; chan < channelData.length; ++chan) {
            rowOffsets[chan].push(outBufferEnd);
            outBufferEnd += channelData[chan].width * info.type * INT16_SIZE;
          }
        }
        if (cscSet.idx[0] !== void 0 && channelData[cscSet.idx[0]]) {
          lossyDctDecode(cscSet, rowOffsets, channelData, acBuffer, dcBuffer, outBuffer);
        }
        for (let i3 = 0; i3 < channelData.length; ++i3) {
          const cd = channelData[i3];
          if (cd.decoded) continue;
          switch (cd.compression) {
            case RLE:
              let row = 0;
              let rleOffset = 0;
              for (let y2 = 0; y2 < info.lines; ++y2) {
                let rowOffsetBytes = rowOffsets[i3][row];
                for (let x3 = 0; x3 < cd.width; ++x3) {
                  for (let byte = 0; byte < INT16_SIZE * cd.type; ++byte) {
                    outBuffer[rowOffsetBytes++] = rleBuffer[rleOffset + byte * cd.width * cd.height];
                  }
                  rleOffset++;
                }
                row++;
              }
              break;
            case LOSSY_DCT:
              lossyDctChannelDecode(i3, rowOffsets, channelData, acBuffer, dcBuffer, outBuffer);
              break;
            default:
              throw new Error("EXRLoader.parse: unsupported channel compression");
          }
        }
        return new DataView(outBuffer.buffer);
      }
      function parseNullTerminatedString(buffer2, offset2) {
        const uintBuffer = new Uint8Array(buffer2);
        let endOffset = 0;
        while (uintBuffer[offset2.value + endOffset] != 0) {
          endOffset += 1;
        }
        const stringValue = new TextDecoder().decode(
          uintBuffer.slice(offset2.value, offset2.value + endOffset)
        );
        offset2.value = offset2.value + endOffset + 1;
        return stringValue;
      }
      function parseFixedLengthString(buffer2, offset2, size) {
        const stringValue = new TextDecoder().decode(
          new Uint8Array(buffer2).slice(offset2.value, offset2.value + size)
        );
        offset2.value = offset2.value + size;
        return stringValue;
      }
      function parseRational(dataView, offset2) {
        const x3 = parseInt32(dataView, offset2);
        const y2 = parseUint32(dataView, offset2);
        return [x3, y2];
      }
      function parseTimecode(dataView, offset2) {
        const x3 = parseUint32(dataView, offset2);
        const y2 = parseUint32(dataView, offset2);
        return [x3, y2];
      }
      function parseInt32(dataView, offset2) {
        const Int32 = dataView.getInt32(offset2.value, true);
        offset2.value = offset2.value + INT32_SIZE;
        return Int32;
      }
      function parseUint32(dataView, offset2) {
        const Uint32 = dataView.getUint32(offset2.value, true);
        offset2.value = offset2.value + INT32_SIZE;
        return Uint32;
      }
      function parseUint8Array(uInt8Array2, offset2) {
        const Uint8 = uInt8Array2[offset2.value];
        offset2.value = offset2.value + INT8_SIZE;
        return Uint8;
      }
      function parseUint8(dataView, offset2) {
        const Uint8 = dataView.getUint8(offset2.value);
        offset2.value = offset2.value + INT8_SIZE;
        return Uint8;
      }
      const parseInt64 = function(dataView, offset2) {
        let int;
        if ("getBigInt64" in DataView.prototype) {
          int = Number(dataView.getBigInt64(offset2.value, true));
        } else {
          int = dataView.getUint32(offset2.value + 4, true) + Number(dataView.getUint32(offset2.value, true) << 32);
        }
        offset2.value += ULONG_SIZE;
        return int;
      };
      function parseFloat32(dataView, offset2) {
        const float = dataView.getFloat32(offset2.value, true);
        offset2.value += FLOAT32_SIZE;
        return float;
      }
      function decodeFloat32(dataView, offset2) {
        return DataUtils.toHalfFloat(parseFloat32(dataView, offset2));
      }
      function decodeFloat16(binary) {
        const exponent = (binary & 31744) >> 10, fraction = binary & 1023;
        return (binary >> 15 ? -1 : 1) * (exponent ? exponent === 31 ? fraction ? NaN : Infinity : Math.pow(2, exponent - 15) * (1 + fraction / 1024) : 6103515625e-14 * (fraction / 1024));
      }
      function parseUint16(dataView, offset2) {
        const Uint16 = dataView.getUint16(offset2.value, true);
        offset2.value += INT16_SIZE;
        return Uint16;
      }
      function parseFloat16(buffer2, offset2) {
        return decodeFloat16(parseUint16(buffer2, offset2));
      }
      function parseChlist(dataView, buffer2, offset2, size) {
        const startOffset = offset2.value;
        const channels = [];
        while (offset2.value < startOffset + size - 1) {
          const name = parseNullTerminatedString(buffer2, offset2);
          const pixelType = parseInt32(dataView, offset2);
          const pLinear = parseUint8(dataView, offset2);
          offset2.value += 3;
          const xSampling = parseInt32(dataView, offset2);
          const ySampling = parseInt32(dataView, offset2);
          channels.push({
            name,
            pixelType,
            pLinear,
            xSampling,
            ySampling
          });
        }
        offset2.value += 1;
        return channels;
      }
      function parseChromaticities(dataView, offset2) {
        const redX = parseFloat32(dataView, offset2);
        const redY = parseFloat32(dataView, offset2);
        const greenX = parseFloat32(dataView, offset2);
        const greenY = parseFloat32(dataView, offset2);
        const blueX = parseFloat32(dataView, offset2);
        const blueY = parseFloat32(dataView, offset2);
        const whiteX = parseFloat32(dataView, offset2);
        const whiteY = parseFloat32(dataView, offset2);
        return { redX, redY, greenX, greenY, blueX, blueY, whiteX, whiteY };
      }
      function parseCompression(dataView, offset2) {
        const compressionCodes = [
          "NO_COMPRESSION",
          "RLE_COMPRESSION",
          "ZIPS_COMPRESSION",
          "ZIP_COMPRESSION",
          "PIZ_COMPRESSION",
          "PXR24_COMPRESSION",
          "B44_COMPRESSION",
          "B44A_COMPRESSION",
          "DWAA_COMPRESSION",
          "DWAB_COMPRESSION"
        ];
        const compression = parseUint8(dataView, offset2);
        return compressionCodes[compression];
      }
      function parseBox2i(dataView, offset2) {
        const xMin = parseInt32(dataView, offset2);
        const yMin = parseInt32(dataView, offset2);
        const xMax = parseInt32(dataView, offset2);
        const yMax = parseInt32(dataView, offset2);
        return { xMin, yMin, xMax, yMax };
      }
      function parseLineOrder(dataView, offset2) {
        const lineOrders = [
          "INCREASING_Y",
          "DECREASING_Y",
          "RANDOM_Y"
        ];
        const lineOrder = parseUint8(dataView, offset2);
        return lineOrders[lineOrder];
      }
      function parseEnvmap(dataView, offset2) {
        const envmaps = [
          "ENVMAP_LATLONG",
          "ENVMAP_CUBE"
        ];
        const envmap = parseUint8(dataView, offset2);
        return envmaps[envmap];
      }
      function parseTiledesc(dataView, offset2) {
        const levelModes = [
          "ONE_LEVEL",
          "MIPMAP_LEVELS",
          "RIPMAP_LEVELS"
        ];
        const roundingModes = [
          "ROUND_DOWN",
          "ROUND_UP"
        ];
        const xSize = parseUint32(dataView, offset2);
        const ySize = parseUint32(dataView, offset2);
        const modes = parseUint8(dataView, offset2);
        return {
          xSize,
          ySize,
          levelMode: levelModes[modes & 15],
          roundingMode: roundingModes[modes >> 4]
        };
      }
      function parseV2f(dataView, offset2) {
        const x3 = parseFloat32(dataView, offset2);
        const y2 = parseFloat32(dataView, offset2);
        return [x3, y2];
      }
      function parseV3f(dataView, offset2) {
        const x3 = parseFloat32(dataView, offset2);
        const y2 = parseFloat32(dataView, offset2);
        const z4 = parseFloat32(dataView, offset2);
        return [x3, y2, z4];
      }
      function parseValue(dataView, buffer2, offset2, type, size) {
        if (type === "string" || type === "stringvector" || type === "iccProfile") {
          return parseFixedLengthString(buffer2, offset2, size);
        } else if (type === "chlist") {
          return parseChlist(dataView, buffer2, offset2, size);
        } else if (type === "chromaticities") {
          return parseChromaticities(dataView, offset2);
        } else if (type === "compression") {
          return parseCompression(dataView, offset2);
        } else if (type === "box2i") {
          return parseBox2i(dataView, offset2);
        } else if (type === "envmap") {
          return parseEnvmap(dataView, offset2);
        } else if (type === "tiledesc") {
          return parseTiledesc(dataView, offset2);
        } else if (type === "lineOrder") {
          return parseLineOrder(dataView, offset2);
        } else if (type === "float") {
          return parseFloat32(dataView, offset2);
        } else if (type === "v2f") {
          return parseV2f(dataView, offset2);
        } else if (type === "v3f") {
          return parseV3f(dataView, offset2);
        } else if (type === "int") {
          return parseInt32(dataView, offset2);
        } else if (type === "rational") {
          return parseRational(dataView, offset2);
        } else if (type === "timecode") {
          return parseTimecode(dataView, offset2);
        } else if (type === "preview") {
          offset2.value += size;
          return "skipped";
        } else {
          offset2.value += size;
          return void 0;
        }
      }
      function roundLog2(x3, mode) {
        const log2 = Math.log2(x3);
        return mode == "ROUND_DOWN" ? Math.floor(log2) : Math.ceil(log2);
      }
      function calculateTileLevels(tiledesc, w3, h2) {
        let num = 0;
        switch (tiledesc.levelMode) {
          case "ONE_LEVEL":
            num = 1;
            break;
          case "MIPMAP_LEVELS":
            num = roundLog2(Math.max(w3, h2), tiledesc.roundingMode) + 1;
            break;
          case "RIPMAP_LEVELS":
            throw new Error("THREE.EXRLoader: RIPMAP_LEVELS tiles currently unsupported.");
        }
        return num;
      }
      function calculateTiles(count, dataSize, size, roundingMode) {
        const tiles = new Array(count);
        for (let i3 = 0; i3 < count; i3++) {
          const b4 = 1 << i3;
          let s = dataSize / b4 | 0;
          if (roundingMode == "ROUND_UP" && s * b4 < dataSize) s += 1;
          const l3 = Math.max(s, 1);
          tiles[i3] = (l3 + size - 1) / size | 0;
        }
        return tiles;
      }
      function parseTiles() {
        const EXRDecoder2 = this;
        const offset2 = EXRDecoder2.offset;
        const tmpOffset = { value: 0 };
        for (let tile = 0; tile < EXRDecoder2.tileCount; tile++) {
          const tileX = parseInt32(EXRDecoder2.viewer, offset2);
          const tileY = parseInt32(EXRDecoder2.viewer, offset2);
          offset2.value += 8;
          EXRDecoder2.size = parseUint32(EXRDecoder2.viewer, offset2);
          const startX = tileX * EXRDecoder2.blockWidth;
          const startY = tileY * EXRDecoder2.blockHeight;
          EXRDecoder2.columns = startX + EXRDecoder2.blockWidth > EXRDecoder2.width ? EXRDecoder2.width - startX : EXRDecoder2.blockWidth;
          EXRDecoder2.lines = startY + EXRDecoder2.blockHeight > EXRDecoder2.height ? EXRDecoder2.height - startY : EXRDecoder2.blockHeight;
          const bytesBlockLine = EXRDecoder2.columns * EXRDecoder2.totalBytes;
          const isCompressed = EXRDecoder2.size < EXRDecoder2.lines * bytesBlockLine;
          const viewer = isCompressed ? EXRDecoder2.uncompress(EXRDecoder2) : uncompressRAW(EXRDecoder2);
          offset2.value += EXRDecoder2.size;
          for (let line = 0; line < EXRDecoder2.lines; line++) {
            const lineOffset = line * EXRDecoder2.columns * EXRDecoder2.totalBytes;
            for (let channelID = 0; channelID < EXRDecoder2.inputChannels.length; channelID++) {
              const name = EXRHeader.channels[channelID].name;
              const lOff = EXRDecoder2.channelByteOffsets[name] * EXRDecoder2.columns;
              const cOff = EXRDecoder2.decodeChannels[name];
              if (cOff === void 0) continue;
              tmpOffset.value = lineOffset + lOff;
              const outLineOffset = (EXRDecoder2.height - (1 + startY + line)) * EXRDecoder2.outLineWidth;
              for (let x3 = 0; x3 < EXRDecoder2.columns; x3++) {
                const outIndex = outLineOffset + (x3 + startX) * EXRDecoder2.outputChannels + cOff;
                EXRDecoder2.byteArray[outIndex] = EXRDecoder2.getter(viewer, tmpOffset);
              }
            }
          }
        }
      }
      function parseScanline() {
        const EXRDecoder2 = this;
        const offset2 = EXRDecoder2.offset;
        const tmpOffset = { value: 0 };
        for (let scanlineBlockIdx = 0; scanlineBlockIdx < EXRDecoder2.height / EXRDecoder2.blockHeight; scanlineBlockIdx++) {
          const line = parseInt32(EXRDecoder2.viewer, offset2) - EXRHeader.dataWindow.yMin;
          EXRDecoder2.size = parseUint32(EXRDecoder2.viewer, offset2);
          EXRDecoder2.lines = line + EXRDecoder2.blockHeight > EXRDecoder2.height ? EXRDecoder2.height - line : EXRDecoder2.blockHeight;
          const bytesPerLine = EXRDecoder2.columns * EXRDecoder2.totalBytes;
          const isCompressed = EXRDecoder2.size < EXRDecoder2.lines * bytesPerLine;
          const viewer = isCompressed ? EXRDecoder2.uncompress(EXRDecoder2) : uncompressRAW(EXRDecoder2);
          offset2.value += EXRDecoder2.size;
          for (let line_y = 0; line_y < EXRDecoder2.blockHeight; line_y++) {
            const scan_y = scanlineBlockIdx * EXRDecoder2.blockHeight;
            const true_y = line_y + EXRDecoder2.scanOrder(scan_y);
            if (true_y >= EXRDecoder2.height) continue;
            const lineOffset = line_y * bytesPerLine;
            const outLineOffset = (EXRDecoder2.height - 1 - true_y) * EXRDecoder2.outLineWidth;
            for (let channelID = 0; channelID < EXRDecoder2.inputChannels.length; channelID++) {
              const name = EXRHeader.channels[channelID].name;
              const lOff = EXRDecoder2.channelByteOffsets[name] * EXRDecoder2.columns;
              const cOff = EXRDecoder2.decodeChannels[name];
              if (cOff === void 0) continue;
              tmpOffset.value = lineOffset + lOff;
              for (let x3 = 0; x3 < EXRDecoder2.columns; x3++) {
                const outIndex = outLineOffset + x3 * EXRDecoder2.outputChannels + cOff;
                EXRDecoder2.byteArray[outIndex] = EXRDecoder2.getter(viewer, tmpOffset);
              }
            }
          }
        }
      }
      function parseHeader(dataView, buffer2, offset2) {
        const EXRHeader2 = {};
        if (dataView.getUint32(0, true) != 20000630) {
          throw new Error("THREE.EXRLoader: Provided file doesn't appear to be in OpenEXR format.");
        }
        EXRHeader2.version = dataView.getUint8(4);
        const spec = dataView.getUint8(5);
        EXRHeader2.spec = {
          singleTile: !!(spec & 2),
          longName: !!(spec & 4),
          deepFormat: !!(spec & 8),
          multiPart: !!(spec & 16)
        };
        offset2.value = 8;
        let keepReading = true;
        while (keepReading) {
          const attributeName = parseNullTerminatedString(buffer2, offset2);
          if (attributeName === "") {
            keepReading = false;
          } else {
            const attributeType = parseNullTerminatedString(buffer2, offset2);
            const attributeSize = parseUint32(dataView, offset2);
            const attributeValue = parseValue(dataView, buffer2, offset2, attributeType, attributeSize);
            if (attributeValue === void 0) {
              console.warn(`THREE.EXRLoader: Skipped unknown header attribute type '${attributeType}'.`);
            } else {
              EXRHeader2[attributeName] = attributeValue;
            }
          }
        }
        if ((spec & ~6) != 0) {
          console.error("THREE.EXRHeader:", EXRHeader2);
          throw new Error("THREE.EXRLoader: Provided file is currently unsupported.");
        }
        return EXRHeader2;
      }
      function setupDecoder(EXRHeader2, dataView, uInt8Array2, offset2, outputType, outputFormat) {
        const EXRDecoder2 = {
          size: 0,
          viewer: dataView,
          array: uInt8Array2,
          offset: offset2,
          width: EXRHeader2.dataWindow.xMax - EXRHeader2.dataWindow.xMin + 1,
          height: EXRHeader2.dataWindow.yMax - EXRHeader2.dataWindow.yMin + 1,
          inputChannels: EXRHeader2.channels,
          channelByteOffsets: {},
          shouldExpand: false,
          scanOrder: null,
          totalBytes: null,
          columns: null,
          lines: null,
          type: null,
          uncompress: null,
          getter: null,
          format: null,
          colorSpace: LinearSRGBColorSpace
        };
        switch (EXRHeader2.compression) {
          case "NO_COMPRESSION":
            EXRDecoder2.blockHeight = 1;
            EXRDecoder2.uncompress = uncompressRAW;
            break;
          case "RLE_COMPRESSION":
            EXRDecoder2.blockHeight = 1;
            EXRDecoder2.uncompress = uncompressRLE;
            break;
          case "ZIPS_COMPRESSION":
            EXRDecoder2.blockHeight = 1;
            EXRDecoder2.uncompress = uncompressZIP;
            break;
          case "ZIP_COMPRESSION":
            EXRDecoder2.blockHeight = 16;
            EXRDecoder2.uncompress = uncompressZIP;
            break;
          case "PIZ_COMPRESSION":
            EXRDecoder2.blockHeight = 32;
            EXRDecoder2.uncompress = uncompressPIZ;
            break;
          case "PXR24_COMPRESSION":
            EXRDecoder2.blockHeight = 16;
            EXRDecoder2.uncompress = uncompressPXR;
            break;
          case "DWAA_COMPRESSION":
            EXRDecoder2.blockHeight = 32;
            EXRDecoder2.uncompress = uncompressDWA;
            break;
          case "DWAB_COMPRESSION":
            EXRDecoder2.blockHeight = 256;
            EXRDecoder2.uncompress = uncompressDWA;
            break;
          default:
            throw new Error("EXRLoader.parse: " + EXRHeader2.compression + " is unsupported");
        }
        const channels = {};
        for (const channel of EXRHeader2.channels) {
          switch (channel.name) {
            case "Y":
            case "R":
            case "G":
            case "B":
            case "A":
              channels[channel.name] = true;
              EXRDecoder2.type = channel.pixelType;
          }
        }
        let fillAlpha = false;
        let invalidOutput = false;
        if (channels.R && channels.G && channels.B) {
          EXRDecoder2.outputChannels = 4;
        } else if (channels.Y) {
          EXRDecoder2.outputChannels = 1;
        } else {
          throw new Error("EXRLoader.parse: file contains unsupported data channels.");
        }
        switch (EXRDecoder2.outputChannels) {
          case 4:
            if (outputFormat == RGBAFormat) {
              fillAlpha = !channels.A;
              EXRDecoder2.format = RGBAFormat;
              EXRDecoder2.colorSpace = LinearSRGBColorSpace;
              EXRDecoder2.outputChannels = 4;
              EXRDecoder2.decodeChannels = { R: 0, G: 1, B: 2, A: 3 };
            } else if (outputFormat == RGFormat) {
              EXRDecoder2.format = RGFormat;
              EXRDecoder2.colorSpace = LinearSRGBColorSpace;
              EXRDecoder2.outputChannels = 2;
              EXRDecoder2.decodeChannels = { R: 0, G: 1 };
            } else if (outputFormat == RedFormat) {
              EXRDecoder2.format = RedFormat;
              EXRDecoder2.colorSpace = LinearSRGBColorSpace;
              EXRDecoder2.outputChannels = 1;
              EXRDecoder2.decodeChannels = { R: 0 };
            } else {
              invalidOutput = true;
            }
            break;
          case 1:
            if (outputFormat == RGBAFormat) {
              fillAlpha = true;
              EXRDecoder2.format = RGBAFormat;
              EXRDecoder2.colorSpace = LinearSRGBColorSpace;
              EXRDecoder2.outputChannels = 4;
              EXRDecoder2.shouldExpand = true;
              EXRDecoder2.decodeChannels = { Y: 0 };
            } else if (outputFormat == RGFormat) {
              EXRDecoder2.format = RGFormat;
              EXRDecoder2.colorSpace = LinearSRGBColorSpace;
              EXRDecoder2.outputChannels = 2;
              EXRDecoder2.shouldExpand = true;
              EXRDecoder2.decodeChannels = { Y: 0 };
            } else if (outputFormat == RedFormat) {
              EXRDecoder2.format = RedFormat;
              EXRDecoder2.colorSpace = LinearSRGBColorSpace;
              EXRDecoder2.outputChannels = 1;
              EXRDecoder2.decodeChannels = { Y: 0 };
            } else {
              invalidOutput = true;
            }
            break;
          default:
            invalidOutput = true;
        }
        if (invalidOutput) throw new Error("EXRLoader.parse: invalid output format for specified file.");
        if (EXRDecoder2.type == 1) {
          switch (outputType) {
            case FloatType:
              EXRDecoder2.getter = parseFloat16;
              break;
            case HalfFloatType:
              EXRDecoder2.getter = parseUint16;
              break;
          }
        } else if (EXRDecoder2.type == 2) {
          switch (outputType) {
            case FloatType:
              EXRDecoder2.getter = parseFloat32;
              break;
            case HalfFloatType:
              EXRDecoder2.getter = decodeFloat32;
          }
        } else {
          throw new Error("EXRLoader.parse: unsupported pixelType " + EXRDecoder2.type + " for " + EXRHeader2.compression + ".");
        }
        EXRDecoder2.columns = EXRDecoder2.width;
        const size = EXRDecoder2.width * EXRDecoder2.height * EXRDecoder2.outputChannels;
        switch (outputType) {
          case FloatType:
            EXRDecoder2.byteArray = new Float32Array(size);
            if (fillAlpha)
              EXRDecoder2.byteArray.fill(1, 0, size);
            break;
          case HalfFloatType:
            EXRDecoder2.byteArray = new Uint16Array(size);
            if (fillAlpha)
              EXRDecoder2.byteArray.fill(15360, 0, size);
            break;
          default:
            console.error("THREE.EXRLoader: unsupported type: ", outputType);
            break;
        }
        let byteOffset = 0;
        for (const channel of EXRHeader2.channels) {
          if (EXRDecoder2.decodeChannels[channel.name] !== void 0) {
            EXRDecoder2.channelByteOffsets[channel.name] = byteOffset;
          }
          byteOffset += channel.pixelType * 2;
        }
        EXRDecoder2.totalBytes = byteOffset;
        EXRDecoder2.outLineWidth = EXRDecoder2.width * EXRDecoder2.outputChannels;
        if (EXRHeader2.lineOrder === "INCREASING_Y") {
          EXRDecoder2.scanOrder = (y2) => y2;
        } else {
          EXRDecoder2.scanOrder = (y2) => EXRDecoder2.height - 1 - y2;
        }
        if (EXRHeader2.spec.singleTile) {
          EXRDecoder2.blockHeight = EXRHeader2.tiles.ySize;
          EXRDecoder2.blockWidth = EXRHeader2.tiles.xSize;
          const numXLevels = calculateTileLevels(EXRHeader2.tiles, EXRDecoder2.width, EXRDecoder2.height);
          const numXTiles = calculateTiles(numXLevels, EXRDecoder2.width, EXRHeader2.tiles.xSize, EXRHeader2.tiles.roundingMode);
          const numYTiles = calculateTiles(numXLevels, EXRDecoder2.height, EXRHeader2.tiles.ySize, EXRHeader2.tiles.roundingMode);
          EXRDecoder2.tileCount = numXTiles[0] * numYTiles[0];
          for (let l3 = 0; l3 < numXLevels; l3++)
            for (let y2 = 0; y2 < numYTiles[l3]; y2++)
              for (let x3 = 0; x3 < numXTiles[l3]; x3++)
                parseInt64(dataView, offset2);
          EXRDecoder2.decode = parseTiles.bind(EXRDecoder2);
        } else {
          EXRDecoder2.blockWidth = EXRDecoder2.width;
          const blockCount = Math.ceil(EXRDecoder2.height / EXRDecoder2.blockHeight);
          for (let i3 = 0; i3 < blockCount; i3++)
            parseInt64(dataView, offset2);
          EXRDecoder2.decode = parseScanline.bind(EXRDecoder2);
        }
        return EXRDecoder2;
      }
      const offset = { value: 0 };
      const bufferDataView = new DataView(buffer);
      const uInt8Array = new Uint8Array(buffer);
      const EXRHeader = parseHeader(bufferDataView, buffer, offset);
      const EXRDecoder = setupDecoder(EXRHeader, bufferDataView, uInt8Array, offset, this.type, this.outputFormat);
      EXRDecoder.decode();
      if (EXRDecoder.shouldExpand) {
        const byteArray = EXRDecoder.byteArray;
        if (this.outputFormat == RGBAFormat) {
          for (let i3 = 0; i3 < byteArray.length; i3 += 4)
            byteArray[i3 + 2] = byteArray[i3 + 1] = byteArray[i3];
        } else if (this.outputFormat == RGFormat) {
          for (let i3 = 0; i3 < byteArray.length; i3 += 2)
            byteArray[i3 + 1] = byteArray[i3];
        }
      }
      return {
        header: EXRHeader,
        width: EXRDecoder.width,
        height: EXRDecoder.height,
        data: EXRDecoder.byteArray,
        format: EXRDecoder.format,
        colorSpace: EXRDecoder.colorSpace,
        type: this.type
      };
    }
    /**
     * Sets the texture type.
     *
     * @param {(HalfFloatType|FloatType)} value - The texture type to set.
     * @return {EXRLoader} A reference to this loader.
     */
    setDataType(value) {
      this.type = value;
      return this;
    }
    /**
     * Sets texture output format. Defaults to `RGBAFormat`.
     *
     * @param {(RGBAFormat|RGFormat|RedFormat)} value - Texture output format.
     * @return {EXRLoader} A reference to this loader.
     */
    setOutputFormat(value) {
      this.outputFormat = value;
      return this;
    }
    load(url, onLoad, onProgress, onError) {
      function onLoadCallback(texture, texData) {
        texture.colorSpace = texData.colorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;
        texture.flipY = false;
        if (onLoad) onLoad(texture, texData);
      }
      return super.load(url, onLoadCallback, onProgress, onError);
    }
  };

  // node_modules/@takram/three-geospatial/build/index.js
  var an = class extends Loader {
    load(t2, n4, r4, s) {
      const o3 = new FileLoader(this.manager);
      o3.setResponseType("arraybuffer"), o3.setRequestHeader(this.requestHeader), o3.setPath(this.path), o3.setWithCredentials(this.withCredentials), o3.load(
        t2,
        (i3) => {
          c(i3 instanceof ArrayBuffer);
          try {
            n4(i3);
          } catch (c3) {
            s != null ? s(c3) : console.error(c3), this.manager.itemError(t2);
          }
        },
        r4,
        s
      );
    }
  };
  function Pr(e3) {
    var _a2, _b2, _c;
    return e3 instanceof WebGLRenderer ? e3.getContext().getExtension("OES_texture_float_linear") != null : (_c = (_b2 = (_a2 = e3.backend).hasFeature) == null ? void 0 : _b2.call(_a2, "float32-filterable")) != null ? _c : false;
  }
  var un = "9627216cc50057994c98a2118f3c4a23765d43b9";
  var xr = `https://media.githubusercontent.com/media/takram-design-engineering/three-geospatial/${un}/packages/core/assets/stbn.bin`;
  var yn = "This is not an object";
  var dn = "This is not a Float16Array object";
  var Jt = "This constructor is not a subclass of Float16Array";
  var we = "The constructor property value is not an object";
  var pn = "Species constructor didn't return TypedArray object";
  var An = "Derived constructor created TypedArray object which was too small length";
  var J = "Attempting to access detached ArrayBuffer";
  var xt = "Cannot convert undefined or null to object";
  var Nt = "Cannot mix BigInt and other types, use explicit conversions";
  var $t = "@@iterator property is not callable";
  var Qt = "Reduce of empty array with no initial value";
  var gn = "The comparison function must be either a function or undefined";
  var St = "Offset is out of bounds";
  function g(e3) {
    return (t2, ...n4) => m(e3, t2, n4);
  }
  function H(e3, t2) {
    return g(
      v(
        e3,
        t2
      ).get
    );
  }
  var {
    apply: m,
    construct: k,
    defineProperty: Zt,
    get: _t,
    getOwnPropertyDescriptor: v,
    getPrototypeOf: tt,
    has: Rt,
    ownKeys: Te,
    set: Kt,
    setPrototypeOf: be
  } = Reflect;
  var wn = Proxy;
  var {
    EPSILON: Tn,
    MAX_SAFE_INTEGER: te,
    isFinite: me,
    isNaN: G
  } = Number;
  var {
    iterator: x,
    species: bn,
    toStringTag: Mt,
    for: mn
  } = Symbol;
  var j = Object;
  var {
    create: At,
    defineProperty: et2,
    freeze: Sn,
    is: ee
  } = j;
  var Lt = j.prototype;
  var _n = (
    /** @type {any} */
    Lt.__lookupGetter__ ? g(
      /** @type {any} */
      Lt.__lookupGetter__
    ) : (e3, t2) => {
      if (e3 == null)
        throw w(
          xt
        );
      let n4 = j(e3);
      do {
        const r4 = v(n4, t2);
        if (r4 !== void 0)
          return L(r4, "get") ? r4.get : void 0;
      } while ((n4 = tt(n4)) !== null);
    }
  );
  var L = (
    /** @type {any} */
    j.hasOwn || g(Lt.hasOwnProperty)
  );
  var Se = Array;
  var _e = Se.isArray;
  var gt = Se.prototype;
  var En = g(gt.join);
  var In = g(gt.push);
  var On = g(
    gt.toLocaleString
  );
  var Bt = gt[x];
  var Pn = g(Bt);
  var {
    abs: xn,
    trunc: Ee
  } = Math;
  var wt = ArrayBuffer;
  var Nn = wt.isView;
  var Ie = wt.prototype;
  var Rn = g(Ie.slice);
  var Ln = H(Ie, "byteLength");
  var Ut = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : null;
  var Un = Ut && H(Ut.prototype, "byteLength");
  var Dt = tt(Uint8Array);
  var Cn = Dt.from;
  var b3 = Dt.prototype;
  var Fn = b3[x];
  var Mn = g(b3.keys);
  var Bn = g(
    b3.values
  );
  var Dn = g(
    b3.entries
  );
  var vn = g(b3.set);
  var ne = g(
    b3.reverse
  );
  var Gn = g(b3.fill);
  var jn = g(
    b3.copyWithin
  );
  var re = g(b3.sort);
  var Y = g(b3.slice);
  var zn = g(
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
  var y = H(
    b3,
    "length"
  );
  var Oe = H(
    b3,
    Mt
  );
  var Hn = Uint8Array;
  var S = Uint16Array;
  var se = (...e3) => m(Cn, S, e3);
  var vt = Uint32Array;
  var Wn = Float32Array;
  var F = tt([][x]());
  var Tt = g(F.next);
  var Vn = g((function* () {
  })().next);
  var Yn = tt(F);
  var Xn = DataView.prototype;
  var kn = g(
    Xn.getUint16
  );
  var w = TypeError;
  var Et = RangeError;
  var Pe = WeakSet;
  var xe = Pe.prototype;
  var qn = g(xe.add);
  var Jn = g(xe.has);
  var bt = WeakMap;
  var Gt = bt.prototype;
  var at = g(Gt.get);
  var $n = g(Gt.has);
  var jt = g(Gt.set);
  var Ne = new bt();
  var Qn = At(null, {
    next: {
      value: function() {
        const t2 = at(Ne, this);
        return Tt(t2);
      }
    },
    [x]: {
      value: function() {
        return this;
      }
    }
  });
  function q(e3) {
    if (e3[x] === Bt && F.next === Tt)
      return e3;
    const t2 = At(Qn);
    return jt(Ne, t2, Pn(e3)), t2;
  }
  var Re = new bt();
  var Le = At(Yn, {
    next: {
      value: function() {
        const t2 = at(Re, this);
        return Vn(t2);
      },
      writable: true,
      configurable: true
    }
  });
  for (const e3 of Te(F))
    e3 !== "next" && et2(Le, e3, v(F, e3));
  function oe(e3) {
    const t2 = At(Le);
    return jt(Re, t2, e3), t2;
  }
  function ht(e3) {
    return e3 !== null && typeof e3 == "object" || typeof e3 == "function";
  }
  function ie(e3) {
    return e3 !== null && typeof e3 == "object";
  }
  function ft(e3) {
    return Oe(e3) !== void 0;
  }
  function Ct(e3) {
    const t2 = Oe(e3);
    return t2 === "BigInt64Array" || t2 === "BigUint64Array";
  }
  function Zn(e3) {
    try {
      return _e(e3) ? false : (Ln(
        /** @type {any} */
        e3
      ), true);
    } catch {
      return false;
    }
  }
  function Ue(e3) {
    if (Ut === null)
      return false;
    try {
      return Un(
        /** @type {any} */
        e3
      ), true;
    } catch {
      return false;
    }
  }
  function Kn(e3) {
    return Zn(e3) || Ue(e3);
  }
  function ce(e3) {
    return _e(e3) ? e3[x] === Bt && F.next === Tt : false;
  }
  function tr(e3) {
    return ft(e3) ? e3[x] === Fn && F.next === Tt : false;
  }
  function nt(e3) {
    if (typeof e3 != "string")
      return false;
    const t2 = +e3;
    return e3 !== t2 + "" || !me(t2) ? false : t2 === Ee(t2);
  }
  var lt = mn("__Float16Array__");
  function er(e3) {
    if (!ie(e3))
      return false;
    const t2 = tt(e3);
    if (!ie(t2))
      return false;
    const n4 = t2.constructor;
    if (n4 === void 0)
      return false;
    if (!ht(n4))
      throw w(we);
    return Rt(n4, lt);
  }
  var Ft = 1 / Tn;
  function nr(e3) {
    return e3 + Ft - Ft;
  }
  var Ce = 6103515625e-14;
  var rr = 65504;
  var Fe = 9765625e-10;
  var ae = Fe * Ce;
  var sr = Fe * Ft;
  function or(e3) {
    const t2 = +e3;
    if (!me(t2) || t2 === 0)
      return t2;
    const n4 = t2 > 0 ? 1 : -1, r4 = xn(t2);
    if (r4 < Ce)
      return n4 * nr(r4 / ae) * ae;
    const s = (1 + sr) * r4, o3 = s - (s - r4);
    return o3 > rr || G(o3) ? n4 * (1 / 0) : n4 * o3;
  }
  var Me = new wt(4);
  var Be = new Wn(Me);
  var De = new vt(Me);
  var E2 = new S(512);
  var I = new Hn(512);
  for (let e3 = 0; e3 < 256; ++e3) {
    const t2 = e3 - 127;
    t2 < -24 ? (E2[e3] = 0, E2[e3 | 256] = 32768, I[e3] = 24, I[e3 | 256] = 24) : t2 < -14 ? (E2[e3] = 1024 >> -t2 - 14, E2[e3 | 256] = 1024 >> -t2 - 14 | 32768, I[e3] = -t2 - 1, I[e3 | 256] = -t2 - 1) : t2 <= 15 ? (E2[e3] = t2 + 15 << 10, E2[e3 | 256] = t2 + 15 << 10 | 32768, I[e3] = 13, I[e3 | 256] = 13) : t2 < 128 ? (E2[e3] = 31744, E2[e3 | 256] = 64512, I[e3] = 24, I[e3 | 256] = 24) : (E2[e3] = 31744, E2[e3 | 256] = 64512, I[e3] = 13, I[e3 | 256] = 13);
  }
  function P2(e3) {
    Be[0] = or(e3);
    const t2 = De[0], n4 = t2 >> 23 & 511;
    return E2[n4] + ((t2 & 8388607) >> I[n4]);
  }
  var zt = new vt(2048);
  for (let e3 = 1; e3 < 1024; ++e3) {
    let t2 = e3 << 13, n4 = 0;
    for (; (t2 & 8388608) === 0; )
      t2 <<= 1, n4 -= 8388608;
    t2 &= -8388609, n4 += 947912704, zt[e3] = t2 | n4;
  }
  for (let e3 = 1024; e3 < 2048; ++e3)
    zt[e3] = 939524096 + (e3 - 1024 << 13);
  var W = new vt(64);
  for (let e3 = 1; e3 < 31; ++e3)
    W[e3] = e3 << 23;
  W[31] = 1199570944;
  W[32] = 2147483648;
  for (let e3 = 33; e3 < 63; ++e3)
    W[e3] = 2147483648 + (e3 - 32 << 23);
  W[63] = 3347054592;
  var ve = new S(64);
  for (let e3 = 1; e3 < 64; ++e3)
    e3 !== 32 && (ve[e3] = 1024);
  function d(e3) {
    const t2 = e3 >> 10;
    return De[0] = zt[ve[t2] + (e3 & 1023)] + W[t2], Be[0];
  }
  function R2(e3) {
    const t2 = +e3;
    return G(t2) || t2 === 0 ? 0 : Ee(t2);
  }
  function It(e3) {
    const t2 = R2(e3);
    return t2 < 0 ? 0 : t2 < te ? t2 : te;
  }
  function rt(e3, t2) {
    if (!ht(e3))
      throw w(yn);
    const n4 = e3.constructor;
    if (n4 === void 0)
      return t2;
    if (!ht(n4))
      throw w(we);
    const r4 = n4[bn];
    return r4 != null ? r4 : t2;
  }
  function $2(e3) {
    if (Ue(e3))
      return false;
    try {
      return Rn(e3, 0, 0), false;
    } catch {
    }
    return true;
  }
  function he(e3, t2) {
    const n4 = G(e3), r4 = G(t2);
    if (n4 && r4)
      return 0;
    if (n4)
      return 1;
    if (r4 || e3 < t2)
      return -1;
    if (e3 > t2)
      return 1;
    if (e3 === 0 && t2 === 0) {
      const s = ee(e3, 0), o3 = ee(t2, 0);
      if (!s && o3)
        return -1;
      if (s && !o3)
        return 1;
    }
    return 0;
  }
  var Ht = 2;
  var ut = new bt();
  function D2(e3) {
    return $n(ut, e3) || !Nn(e3) && er(e3);
  }
  function u(e3) {
    if (!D2(e3))
      throw w(dn);
  }
  function st(e3, t2) {
    const n4 = D2(e3), r4 = ft(e3);
    if (!n4 && !r4)
      throw w(pn);
    if (typeof t2 == "number") {
      let s;
      if (n4) {
        const o3 = l(e3);
        s = y(o3);
      } else
        s = y(e3);
      if (s < t2)
        throw w(
          An
        );
    }
    if (Ct(e3))
      throw w(Nt);
  }
  function l(e3) {
    const t2 = at(ut, e3);
    if (t2 !== void 0) {
      const s = T(t2);
      if ($2(s))
        throw w(J);
      return t2;
    }
    const n4 = (
      /** @type {any} */
      e3.buffer
    );
    if ($2(n4))
      throw w(J);
    const r4 = k(A2, [
      n4,
      /** @type {any} */
      e3.byteOffset,
      /** @type {any} */
      e3.length
    ], e3.constructor);
    return at(ut, r4);
  }
  function fe(e3) {
    const t2 = y(e3), n4 = [];
    for (let r4 = 0; r4 < t2; ++r4)
      n4[r4] = d(e3[r4]);
    return n4;
  }
  var Ge = new Pe();
  for (const e3 of Te(b3)) {
    if (e3 === Mt)
      continue;
    const t2 = v(b3, e3);
    L(t2, "get") && typeof t2.get == "function" && qn(Ge, t2.get);
  }
  var ir = Sn(
    /** @type {ProxyHandler<Float16BitsArray>} */
    {
      get(e3, t2, n4) {
        return nt(t2) && L(e3, t2) ? d(_t(e3, t2)) : Jn(Ge, _n(e3, t2)) ? _t(e3, t2) : _t(e3, t2, n4);
      },
      set(e3, t2, n4, r4) {
        return nt(t2) && L(e3, t2) ? Kt(e3, t2, P2(n4)) : Kt(e3, t2, n4, r4);
      },
      getOwnPropertyDescriptor(e3, t2) {
        if (nt(t2) && L(e3, t2)) {
          const n4 = v(e3, t2);
          return n4.value = d(n4.value), n4;
        }
        return v(e3, t2);
      },
      defineProperty(e3, t2, n4) {
        return nt(t2) && L(e3, t2) && L(n4, "value") && (n4.value = P2(n4.value)), Zt(e3, t2, n4);
      }
    }
  );
  var A2 = class _A {
    /** @see https://tc39.es/ecma262/#sec-typedarray */
    constructor(t2, n4, r4) {
      let s;
      if (D2(t2))
        s = k(S, [l(t2)], new.target);
      else if (ht(t2) && !Kn(t2)) {
        let i3, c3;
        if (ft(t2)) {
          i3 = t2, c3 = y(t2);
          const a3 = T(t2);
          if ($2(a3))
            throw w(J);
          if (Ct(t2))
            throw w(Nt);
          const h2 = new wt(
            c3 * Ht
          );
          s = k(S, [h2], new.target);
        } else {
          const a3 = t2[x];
          if (a3 != null && typeof a3 != "function")
            throw w($t);
          a3 != null ? ce(t2) ? (i3 = t2, c3 = t2.length) : (i3 = [.../** @type {Iterable<unknown>} */
          t2], c3 = i3.length) : (i3 = /** @type {ArrayLike<unknown>} */
          t2, c3 = It(i3.length)), s = k(S, [c3], new.target);
        }
        for (let a3 = 0; a3 < c3; ++a3)
          s[a3] = P2(i3[a3]);
      } else
        s = k(S, arguments, new.target);
      const o3 = (
        /** @type {any} */
        new wn(s, ir)
      );
      return jt(ut, o3, s), o3;
    }
    /**
     * limitation: `Object.getOwnPropertyNames(Float16Array)` or `Reflect.ownKeys(Float16Array)` include this key
     * @see https://tc39.es/ecma262/#sec-%typedarray%.from
     */
    static from(t2, ...n4) {
      const r4 = this;
      if (!Rt(r4, lt))
        throw w(
          Jt
        );
      if (r4 === _A) {
        if (D2(t2) && n4.length === 0) {
          const f4 = l(t2), p3 = new S(
            T(f4),
            C2(f4),
            y(f4)
          );
          return new _A(
            T(Y(p3))
          );
        }
        if (n4.length === 0)
          return new _A(
            T(
              se(t2, P2)
            )
          );
        const a3 = n4[0], h2 = n4[1];
        return new _A(
          T(
            se(t2, function(f4, ...p3) {
              return P2(
                m(a3, this, [f4, ...q(p3)])
              );
            }, h2)
          )
        );
      }
      let s, o3;
      const i3 = t2[x];
      if (i3 != null && typeof i3 != "function")
        throw w($t);
      if (i3 != null)
        ce(t2) ? (s = t2, o3 = t2.length) : tr(t2) ? (s = t2, o3 = y(t2)) : (s = [...t2], o3 = s.length);
      else {
        if (t2 == null)
          throw w(
            xt
          );
        s = j(t2), o3 = It(s.length);
      }
      const c3 = new r4(o3);
      if (n4.length === 0)
        for (let a3 = 0; a3 < o3; ++a3)
          c3[a3] = /** @type {number} */
          s[a3];
      else {
        const a3 = n4[0], h2 = n4[1];
        for (let f4 = 0; f4 < o3; ++f4)
          c3[f4] = m(a3, h2, [s[f4], f4]);
      }
      return c3;
    }
    /**
     * limitation: `Object.getOwnPropertyNames(Float16Array)` or `Reflect.ownKeys(Float16Array)` include this key
     * @see https://tc39.es/ecma262/#sec-%typedarray%.of
     */
    static of(...t2) {
      const n4 = this;
      if (!Rt(n4, lt))
        throw w(
          Jt
        );
      const r4 = t2.length;
      if (n4 === _A) {
        const o3 = new _A(r4), i3 = l(o3);
        for (let c3 = 0; c3 < r4; ++c3)
          i3[c3] = P2(t2[c3]);
        return o3;
      }
      const s = new n4(r4);
      for (let o3 = 0; o3 < r4; ++o3)
        s[o3] = t2[o3];
      return s;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.keys */
    keys() {
      u(this);
      const t2 = l(this);
      return Mn(t2);
    }
    /**
     * limitation: returns a object whose prototype is not `%ArrayIteratorPrototype%`
     * @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.values
     */
    values() {
      u(this);
      const t2 = l(this);
      return oe((function* () {
        for (const n4 of Bn(t2))
          yield d(n4);
      })());
    }
    /**
     * limitation: returns a object whose prototype is not `%ArrayIteratorPrototype%`
     * @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.entries
     */
    entries() {
      u(this);
      const t2 = l(this);
      return oe((function* () {
        for (const [n4, r4] of Dn(t2))
          yield (
            /** @type {[number, number]} */
            [n4, d(r4)]
          );
      })());
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.at */
    at(t2) {
      u(this);
      const n4 = l(this), r4 = y(n4), s = R2(t2), o3 = s >= 0 ? s : r4 + s;
      if (!(o3 < 0 || o3 >= r4))
        return d(n4[o3]);
    }
    /** @see https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.with */
    with(t2, n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = R2(t2), i3 = o3 >= 0 ? o3 : s + o3, c3 = +n4;
      if (i3 < 0 || i3 >= s)
        throw Et(St);
      const a3 = new S(
        T(r4),
        C2(r4),
        y(r4)
      ), h2 = new _A(
        T(
          Y(a3)
        )
      ), f4 = l(h2);
      return f4[i3] = P2(c3), h2;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.map */
    map(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0], i3 = rt(r4, _A);
      if (i3 === _A) {
        const a3 = new _A(s), h2 = l(a3);
        for (let f4 = 0; f4 < s; ++f4) {
          const p3 = d(r4[f4]);
          h2[f4] = P2(
            m(t2, o3, [p3, f4, this])
          );
        }
        return a3;
      }
      const c3 = new i3(s);
      st(c3, s);
      for (let a3 = 0; a3 < s; ++a3) {
        const h2 = d(r4[a3]);
        c3[a3] = m(t2, o3, [h2, a3, this]);
      }
      return (
        /** @type {any} */
        c3
      );
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.filter */
    filter(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0], i3 = [];
      for (let h2 = 0; h2 < s; ++h2) {
        const f4 = d(r4[h2]);
        m(t2, o3, [f4, h2, this]) && In(i3, f4);
      }
      const c3 = rt(r4, _A), a3 = new c3(i3);
      return st(a3), /** @type {any} */
      a3;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.reduce */
    reduce(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4);
      if (s === 0 && n4.length === 0)
        throw w(Qt);
      let o3, i3;
      n4.length === 0 ? (o3 = d(r4[0]), i3 = 1) : (o3 = n4[0], i3 = 0);
      for (let c3 = i3; c3 < s; ++c3)
        o3 = t2(
          o3,
          d(r4[c3]),
          c3,
          this
        );
      return o3;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.reduceright */
    reduceRight(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4);
      if (s === 0 && n4.length === 0)
        throw w(Qt);
      let o3, i3;
      n4.length === 0 ? (o3 = d(r4[s - 1]), i3 = s - 2) : (o3 = n4[0], i3 = s - 1);
      for (let c3 = i3; c3 >= 0; --c3)
        o3 = t2(
          o3,
          d(r4[c3]),
          c3,
          this
        );
      return o3;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.foreach */
    forEach(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = 0; i3 < s; ++i3)
        m(t2, o3, [
          d(r4[i3]),
          i3,
          this
        ]);
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.find */
    find(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = 0; i3 < s; ++i3) {
        const c3 = d(r4[i3]);
        if (m(t2, o3, [c3, i3, this]))
          return c3;
      }
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.findindex */
    findIndex(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = 0; i3 < s; ++i3) {
        const c3 = d(r4[i3]);
        if (m(t2, o3, [c3, i3, this]))
          return i3;
      }
      return -1;
    }
    /** @see https://tc39.es/proposal-array-find-from-last/index.html#sec-%typedarray%.prototype.findlast */
    findLast(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = s - 1; i3 >= 0; --i3) {
        const c3 = d(r4[i3]);
        if (m(t2, o3, [c3, i3, this]))
          return c3;
      }
    }
    /** @see https://tc39.es/proposal-array-find-from-last/index.html#sec-%typedarray%.prototype.findlastindex */
    findLastIndex(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = s - 1; i3 >= 0; --i3) {
        const c3 = d(r4[i3]);
        if (m(t2, o3, [c3, i3, this]))
          return i3;
      }
      return -1;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.every */
    every(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = 0; i3 < s; ++i3)
        if (!m(t2, o3, [
          d(r4[i3]),
          i3,
          this
        ]))
          return false;
      return true;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.some */
    some(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4), o3 = n4[0];
      for (let i3 = 0; i3 < s; ++i3)
        if (m(t2, o3, [
          d(r4[i3]),
          i3,
          this
        ]))
          return true;
      return false;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.set */
    set(t2, ...n4) {
      u(this);
      const r4 = l(this), s = R2(n4[0]);
      if (s < 0)
        throw Et(St);
      if (t2 == null)
        throw w(
          xt
        );
      if (Ct(t2))
        throw w(
          Nt
        );
      if (D2(t2))
        return vn(
          l(this),
          l(t2),
          s
        );
      if (ft(t2)) {
        const a3 = T(t2);
        if ($2(a3))
          throw w(J);
      }
      const o3 = y(r4), i3 = j(t2), c3 = It(i3.length);
      if (s === 1 / 0 || c3 + s > o3)
        throw Et(St);
      for (let a3 = 0; a3 < c3; ++a3)
        r4[a3 + s] = P2(i3[a3]);
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.reverse */
    reverse() {
      u(this);
      const t2 = l(this);
      return ne(t2), this;
    }
    /** @see https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.toReversed */
    toReversed() {
      u(this);
      const t2 = l(this), n4 = new S(
        T(t2),
        C2(t2),
        y(t2)
      ), r4 = new _A(
        T(
          Y(n4)
        )
      ), s = l(r4);
      return ne(s), r4;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.fill */
    fill(t2, ...n4) {
      u(this);
      const r4 = l(this);
      return Gn(
        r4,
        P2(t2),
        ...q(n4)
      ), this;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.copywithin */
    copyWithin(t2, n4, ...r4) {
      u(this);
      const s = l(this);
      return jn(s, t2, n4, ...q(r4)), this;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.sort */
    sort(t2) {
      u(this);
      const n4 = l(this), r4 = t2 !== void 0 ? t2 : he;
      return re(n4, (s, o3) => r4(d(s), d(o3))), this;
    }
    /** @see https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.toSorted */
    toSorted(t2) {
      u(this);
      const n4 = l(this);
      if (t2 !== void 0 && typeof t2 != "function")
        throw new w(gn);
      const r4 = t2 !== void 0 ? t2 : he, s = new S(
        T(n4),
        C2(n4),
        y(n4)
      ), o3 = new _A(
        T(
          Y(s)
        )
      ), i3 = l(o3);
      return re(i3, (c3, a3) => r4(d(c3), d(a3))), o3;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.slice */
    slice(t2, n4) {
      u(this);
      const r4 = l(this), s = rt(r4, _A);
      if (s === _A) {
        const We2 = new S(
          T(r4),
          C2(r4),
          y(r4)
        );
        return new _A(
          T(
            Y(We2, t2, n4)
          )
        );
      }
      const o3 = y(r4), i3 = R2(t2), c3 = n4 === void 0 ? o3 : R2(n4);
      let a3;
      i3 === -1 / 0 ? a3 = 0 : i3 < 0 ? a3 = o3 + i3 > 0 ? o3 + i3 : 0 : a3 = o3 < i3 ? o3 : i3;
      let h2;
      c3 === -1 / 0 ? h2 = 0 : c3 < 0 ? h2 = o3 + c3 > 0 ? o3 + c3 : 0 : h2 = o3 < c3 ? o3 : c3;
      const f4 = h2 - a3 > 0 ? h2 - a3 : 0, p3 = new s(f4);
      if (st(p3, f4), f4 === 0)
        return p3;
      const O2 = T(r4);
      if ($2(O2))
        throw w(J);
      let B = 0;
      for (; a3 < h2; )
        p3[B] = d(r4[a3]), ++a3, ++B;
      return (
        /** @type {any} */
        p3
      );
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.subarray */
    subarray(t2, n4) {
      u(this);
      const r4 = l(this), s = rt(r4, _A), o3 = new S(
        T(r4),
        C2(r4),
        y(r4)
      ), i3 = zn(o3, t2, n4), c3 = new s(
        T(i3),
        C2(i3),
        y(i3)
      );
      return st(c3), /** @type {any} */
      c3;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.indexof */
    indexOf(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4);
      let o3 = R2(n4[0]);
      if (o3 === 1 / 0)
        return -1;
      o3 < 0 && (o3 += s, o3 < 0 && (o3 = 0));
      for (let i3 = o3; i3 < s; ++i3)
        if (L(r4, i3) && d(r4[i3]) === t2)
          return i3;
      return -1;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.lastindexof */
    lastIndexOf(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4);
      let o3 = n4.length >= 1 ? R2(n4[0]) : s - 1;
      if (o3 === -1 / 0)
        return -1;
      o3 >= 0 ? o3 = o3 < s - 1 ? o3 : s - 1 : o3 += s;
      for (let i3 = o3; i3 >= 0; --i3)
        if (L(r4, i3) && d(r4[i3]) === t2)
          return i3;
      return -1;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.includes */
    includes(t2, ...n4) {
      u(this);
      const r4 = l(this), s = y(r4);
      let o3 = R2(n4[0]);
      if (o3 === 1 / 0)
        return false;
      o3 < 0 && (o3 += s, o3 < 0 && (o3 = 0));
      const i3 = G(t2);
      for (let c3 = o3; c3 < s; ++c3) {
        const a3 = d(r4[c3]);
        if (i3 && G(a3) || a3 === t2)
          return true;
      }
      return false;
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.join */
    join(t2) {
      u(this);
      const n4 = l(this), r4 = fe(n4);
      return En(r4, t2);
    }
    /** @see https://tc39.es/ecma262/#sec-%typedarray%.prototype.tolocalestring */
    toLocaleString(...t2) {
      u(this);
      const n4 = l(this), r4 = fe(n4);
      return On(r4, ...q(t2));
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
  et2(A2, "BYTES_PER_ELEMENT", {
    value: Ht
  });
  et2(A2, lt, {});
  be(A2, Dt);
  var yt = A2.prototype;
  et2(yt, "BYTES_PER_ELEMENT", {
    value: Ht
  });
  et2(yt, x, {
    value: yt.values,
    writable: true,
    configurable: true
  });
  be(yt, b3);
  function cr(e3, t2, ...n4) {
    return d(
      kn(e3, t2, ...q(n4))
    );
  }
  function Nr(e3) {
    return e3 instanceof Int8Array || e3 instanceof Uint8Array || e3 instanceof Uint8ClampedArray || e3 instanceof Int16Array || e3 instanceof Uint16Array || e3 instanceof Int32Array || e3 instanceof Uint32Array || e3 instanceof A2 || e3 instanceof Float32Array || e3 instanceof Float64Array;
  }
  var ar = class extends Loader {
    constructor(t2, n4) {
      super(n4), this.parser = t2;
    }
    load(t2, n4, r4, s) {
      const o3 = new an(this.manager);
      o3.setRequestHeader(this.requestHeader), o3.setPath(this.path), o3.setWithCredentials(this.withCredentials), o3.load(
        t2,
        (i3) => {
          try {
            n4(this.parser(i3));
          } catch (c3) {
            s != null ? s(c3) : console.error(c3), this.manager.itemError(t2);
          }
        },
        r4,
        s
      );
    }
  };
  function hr(e3) {
    const t2 = e3 instanceof Int8Array ? ByteType : e3 instanceof Uint8Array ? UnsignedByteType : e3 instanceof Uint8ClampedArray ? UnsignedByteType : e3 instanceof Int16Array ? ShortType : e3 instanceof Uint16Array ? UnsignedShortType : e3 instanceof Int32Array ? IntType : e3 instanceof Uint32Array ? UnsignedIntType : e3 instanceof A2 ? HalfFloatType : e3 instanceof Float32Array ? FloatType : e3 instanceof Float64Array ? FloatType : null;
    return c(t2 != null), t2;
  }
  var fr = class extends Loader {
    constructor(t2, n4, r4 = {}, s) {
      super(s), this.textureClass = t2, this.parser = n4, this.options = {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        ...r4
      };
    }
    load(t2, n4, r4, s) {
      const o3 = new this.textureClass(), i3 = new ar(this.parser, this.manager);
      return i3.setRequestHeader(this.requestHeader), i3.setPath(this.path), i3.setWithCredentials(this.withCredentials), i3.load(
        t2,
        (c3) => {
          o3.image.data = c3 instanceof A2 ? new Uint16Array(c3.buffer) : c3;
          const { width: a3, height: h2, depth: f4, ...p3 } = this.options;
          a3 != null && (o3.image.width = a3), h2 != null && (o3.image.height = h2), "depth" in o3.image && f4 != null && (o3.image.depth = f4), o3.type = hr(c3), Object.assign(o3, p3), o3.needsUpdate = true, n4 == null ? void 0 : n4(o3);
        },
        r4,
        s
      ), o3;
    }
  };
  var z3 = MathUtils.clamp;
  var Rr = MathUtils.euclideanModulo;
  var Lr = MathUtils.inverseLerp;
  var Ur = MathUtils.lerp;
  var Cr = MathUtils.degToRad;
  var Fr = MathUtils.radToDeg;
  var Mr = MathUtils.isPowerOfTwo;
  var Br = MathUtils.ceilPowerOfTwo;
  var Dr = MathUtils.floorPowerOfTwo;
  var vr = MathUtils.normalize;
  function Gr(e3, t2, n4, r4 = 0, s = 1) {
    return MathUtils.mapLinear(e3, t2, n4, r4, s);
  }
  function Hr(e3) {
    return Math.min(Math.max(e3, 0), 1);
  }
  function Vr(e3) {
    return (t2, n4) => {
      t2 instanceof Material ? Object.defineProperty(t2, n4, {
        enumerable: true,
        get() {
          var _a2;
          return ((_a2 = this.defines) == null ? void 0 : _a2[e3]) != null;
        },
        set(r4) {
          var _a2, _b2;
          r4 !== this[n4] && (r4 ? ((_a2 = this.defines) != null ? _a2 : this.defines = {}, this.defines[e3] = "1") : (_b2 = this.defines) == null ? true : delete _b2[e3], this.needsUpdate = true);
        }
      }) : Object.defineProperty(t2, n4, {
        enumerable: true,
        get() {
          return this.defines.has(e3);
        },
        set(r4) {
          r4 !== this[n4] && (r4 ? this.defines.set(e3, "1") : this.defines.delete(e3), this.setChanged());
        }
      });
    };
  }
  function le(e3) {
    return typeof e3 == "number" ? Math.floor(e3) : typeof e3 == "string" ? parseInt(e3, 10) : typeof e3 == "boolean" ? +e3 : 0;
  }
  function Yr(e3, {
    min: t2 = Number.MIN_SAFE_INTEGER,
    max: n4 = Number.MAX_SAFE_INTEGER
  } = {}) {
    return (r4, s) => {
      r4 instanceof Material ? Object.defineProperty(r4, s, {
        enumerable: true,
        get() {
          var _a2;
          const o3 = (_a2 = this.defines) == null ? void 0 : _a2[e3];
          return o3 != null ? le(o3) : 0;
        },
        set(o3) {
          var _a2;
          const i3 = this[s];
          o3 !== i3 && ((_a2 = this.defines) != null ? _a2 : this.defines = {}, this.defines[e3] = z3(o3, t2, n4).toFixed(0), this.needsUpdate = true);
        }
      }) : Object.defineProperty(r4, s, {
        enumerable: true,
        get() {
          const o3 = this.defines.get(e3);
          return o3 != null ? le(o3) : 0;
        },
        set(o3) {
          const i3 = this[s];
          o3 !== i3 && (this.defines.set(e3, z3(o3, t2, n4).toFixed(0)), this.setChanged());
        }
      });
    };
  }
  var $r = class extends Loader {
    constructor(t2 = {}, n4) {
      super(n4), this.options = t2;
    }
    load(t2, n4, r4, s) {
      const { width: o3, height: i3, depth: c3 } = this.options, a3 = new Data3DTexture(null, o3, i3, c3), h2 = new EXRLoader(this.manager);
      return h2.setRequestHeader(this.requestHeader), h2.setPath(this.path), h2.setWithCredentials(this.withCredentials), h2.load(
        t2,
        (f4) => {
          const { image: p3 } = f4;
          a3.image = {
            data: p3.data,
            width: o3 != null ? o3 : p3.width,
            height: i3 != null ? i3 : p3.height,
            depth: c3 != null ? c3 : Math.sqrt(p3.height)
          }, a3.type = f4.type, a3.format = f4.format, a3.colorSpace = f4.colorSpace, a3.needsUpdate = true;
          try {
            n4 == null ? void 0 : n4(a3);
          } catch (O2) {
            s != null ? s(O2) : console.error(O2), this.manager.itemError(t2);
          }
        },
        r4,
        s
      ), a3;
    }
  };
  var Qr = class extends Loader {
    constructor(t2 = {}, n4) {
      super(n4), this.options = t2;
    }
    load(t2, n4, r4, s) {
      const { width: o3, height: i3 } = this.options, c3 = new DataTexture(null, o3, i3), a3 = new EXRLoader(this.manager);
      return a3.setRequestHeader(this.requestHeader), a3.setPath(this.path), a3.setWithCredentials(this.withCredentials), a3.load(
        t2,
        (h2) => {
          const { image: f4 } = h2;
          c3.image = {
            data: f4.data,
            width: o3 != null ? o3 : f4.width,
            height: i3 != null ? i3 : f4.height
          }, c3.type = h2.type, c3.format = h2.format, c3.colorSpace = h2.colorSpace, c3.needsUpdate = true;
          try {
            n4 == null ? void 0 : n4(c3);
          } catch (p3) {
            s != null ? s(p3) : console.error(p3), this.manager.itemError(t2);
          }
        },
        r4,
        s
      ), c3;
    }
  };
  var Q2 = class Q3 {
    constructor(t2 = 0, n4 = 0, r4 = 0, s = 0) {
      this.west = t2, this.south = n4, this.east = r4, this.north = s;
    }
    get width() {
      let t2 = this.east;
      return t2 < this.west && (t2 += Math.PI * 2), t2 - this.west;
    }
    get height() {
      return this.north - this.south;
    }
    set(t2, n4, r4, s) {
      return this.west = t2, this.south = n4, this.east = r4, this.north = s, this;
    }
    clone() {
      return new Q3(this.west, this.south, this.east, this.north);
    }
    copy(t2) {
      return this.west = t2.west, this.south = t2.south, this.east = t2.east, this.north = t2.north, this;
    }
    equals(t2) {
      return t2.west === this.west && t2.south === this.south && t2.east === this.east && t2.north === this.north;
    }
    at(t2, n4, r4 = new C()) {
      return r4.set(
        this.west + (this.east - this.west) * t2,
        this.north + (this.south - this.north) * n4
      );
    }
    fromArray(t2, n4 = 0) {
      return this.west = t2[n4], this.south = t2[n4 + 1], this.east = t2[n4 + 2], this.north = t2[n4 + 3], this;
    }
    toArray(t2 = [], n4 = 0) {
      return t2[n4] = this.west, t2[n4 + 1] = this.south, t2[n4 + 2] = this.east, t2[n4 + 3] = this.north, t2;
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
  var pr = /^[ \t]*#include +"([\w\d./]+)"/gm;
  function Ar(e3, t2) {
    return e3.replace(pr, (n4, r4) => {
      const o3 = r4.split("/").reduce(
        (i3, c3) => typeof i3 != "string" && i3 != null ? i3[c3] : void 0,
        t2
      );
      if (typeof o3 != "string")
        throw new Error(`Could not find include for ${r4}.`);
      return Ar(o3, t2);
    });
  }
  var ct;
  function gr() {
    if (ct != null)
      return ct;
    const e3 = new Uint32Array([268435456]);
    return ct = new Uint8Array(e3.buffer, e3.byteOffset, e3.byteLength)[0] === 0, ct;
  }
  function M(e3, t2, n4, r4 = true) {
    if (r4 === gr())
      return new t2(e3);
    const s = Object.assign(new DataView(e3), {
      getFloat16(i3, c3) {
        return cr(this, i3, c3);
      }
    }), o3 = new t2(s.byteLength / t2.BYTES_PER_ELEMENT);
    for (let i3 = 0, c3 = 0; i3 < o3.length; ++i3, c3 += t2.BYTES_PER_ELEMENT)
      o3[i3] = s[n4](c3, r4);
    return o3;
  }
  var rs = (e3, t2) => M(e3, A2, "getFloat16", t2);
  function cs(e3) {
  }
  var Tr = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*(?:i\s*\+\+|\+\+\s*i)\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
  function br(e3, t2, n4, r4) {
    let s = "";
    for (let o3 = parseInt(t2, 10); o3 < parseInt(n4, 10); ++o3)
      s += r4.replace(/\[\s*i\s*\]/g, `[${o3}]`).replace(/UNROLLED_LOOP_INDEX/g, `${o3}`);
    return s;
  }
  function as(e3) {
    return e3.replace(Tr, br);
  }

  // node_modules/@takram/three-geospatial/build/shaders.js
  var n2 = `// Reference: https://github.com/mrdoob/three.js/blob/r171/examples/jsm/csm/CSMShader.js

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
  var e = `// cSpell:words logdepthbuf

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
  var c2 = `// Reference: https://advances.realtimerendering.com/s2014/index.html#_NEXT_GENERATION_POST

float interleavedGradientNoise(const vec2 coord) {
  const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(coord, magic.xy)));
}
`;
  var i = `#if !defined(saturate)
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
  var r = `// Reference: https://jcgt.org/published/0003/02/01/paper.pdf

vec2 signNotZero(vec2 v) {
  return vec2(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0);
}

vec2 packNormalToVec2(vec3 v) {
  vec2 p = v.xy * (1.0 / (abs(v.x) + abs(v.y) + abs(v.z)));
  return v.z <= 0.0
    ? (1.0 - abs(p.yx)) * signNotZero(p)
    : p;
}

vec3 unpackVec2ToNormal(vec2 e) {
  vec3 v = vec3(e.xy, 1.0 - abs(e.x) - abs(e.y));
  if (v.z < 0.0) {
    v.xy = (1.0 - abs(v.yx)) * signNotZero(v.xy);
  }
  return normalize(v);
}
`;
  var o2 = `float raySphereFirstIntersection(
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
  var a2 = `vec3 screenToView(
  const vec2 uv,
  const float depth,
  const float viewZ,
  const mat4 projectionMatrix,
  const mat4 inverseProjectionMatrix
) {
  vec4 clip = vec4(vec3(uv, depth) * 2.0 - 1.0, 1.0);
  float clipW = projectionMatrix[2][3] * viewZ + projectionMatrix[3][3];
  clip *= clipW;
  return (inverseProjectionMatrix * clip).xyz;
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
  var m2 = n2;
  var d2 = e;
  var f = c2;
  var x2 = i;
  var p = r;
  var u2 = o2;
  var _ = a2;
  var g2 = v2;

  // node_modules/@takram/three-atmosphere/build/shared2.js
  var T2 = "9c6dfd0054f077f3ad4695b802e74d4c6a814440";
  var m3 = `https://media.githubusercontent.com/media/takram-design-engineering/three-geospatial/${T2}/packages/atmosphere/assets`;
  var S2 = `https://media.githubusercontent.com/media/takram-design-engineering/three-geospatial/${T2}/packages/atmosphere/assets/stars.bin`;
  var f2 = 64;
  var A3 = 16;
  var i2 = 32;
  var _2 = 128;
  var R3 = 32;
  var u3 = 8;
  var U2 = u3 * R3;
  var g3 = _2;
  var N2 = i2;
  var C3 = 256;
  var p2 = 64;
  var w2 = 1 / 1e3;
  var h = 100;
  var D3 = /* @__PURE__ */ new Matrix3(
    3.2406255,
    -1.537208,
    -0.4986286,
    -0.9689307,
    1.8757561,
    0.0415175,
    0.0557101,
    -0.2040211,
    1.0569959
  );
  var I2 = /* @__PURE__ */ new Vector3();
  function X(t2, a3, e3, s) {
    const n4 = e3.projectOnSurface(
      t2,
      I2
    );
    return n4 != null ? e3.getOsculatingSphereCenter(n4, a3, s).negate() : s.setScalar(0);
  }
  var l2 = true;
  var r2 = "Invariant failed";
  function G2(t2, a3) {
    if (!t2) {
      if (l2)
        throw new Error(r2);
      var e3 = r2;
      throw new Error(e3);
    }
  }
  var H2 = typeof window < "u" && window.requestIdleCallback != null ? window.requestIdleCallback : function(a3, e3 = {}) {
    var _a2;
    const n4 = (_a2 = e3.timeout) != null ? _a2 : 1, o3 = performance.now();
    return setTimeout(() => {
      a3({
        get didTimeout() {
          return e3.timeout != null ? false : performance.now() - o3 - 1 > n4;
        },
        timeRemaining() {
          return Math.max(0, 1 + (performance.now() - o3));
        }
      });
    }, 1);
  };

  // node_modules/@takram/three-atmosphere/build/shared3.js
  var e2 = `// Based on: https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl

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
  var n3 = `// Based on: https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl

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
  var r3 = `// Based on: https://github.com/ebruneton/precomputed_atmospheric_scattering/blob/master/atmosphere/functions.glsl

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

Number GetLayerDensity(const DensityProfileLayer layer, const Length altitude) {
  Number density = layer.exp_term * exp(layer.exp_scale * altitude) +
      layer.linear_term * altitude + layer.constant_term;
  return clamp(density, Number(0.0), Number(1.0));
}

Number GetProfileDensity(const DensityProfile profile, const Length altitude) {
  DensityProfileLayer layers[2] = profile.layers;
  return altitude < layers[0].width
    ? GetLayerDensity(layers[0], altitude)
    : GetLayerDensity(layers[1], altitude);
}

Length ComputeOpticalLengthToTopAtmosphereBoundary(
    const AtmosphereParameters atmosphere, const DensityProfile profile,
    const Length r, const Number mu) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  // Number of intervals for the numerical integration.
  const int SAMPLE_COUNT = 500;
  // The integration step, i.e. the length of each integration interval.
  Length dx =
      DistanceToTopAtmosphereBoundary(atmosphere, r, mu) / Number(SAMPLE_COUNT);
  // Integration loop.
  Length result = 0.0 * m;
  for (int i = 0; i <= SAMPLE_COUNT; ++i) {
    Length d_i = Number(i) * dx;
    // Distance between the current sample point and the planet center.
    Length r_i = sqrt(d_i * d_i + 2.0 * r * mu * d_i + r * r);
    // Number density at the current sample point (divided by the number density
    // at the bottom of the atmosphere, yielding a dimensionless number).
    Number y_i = GetProfileDensity(profile, r_i - atmosphere.bottom_radius);
    // Sample weight (from the trapezoidal rule).
    Number weight_i = i == 0 || i == SAMPLE_COUNT ? 0.5 : 1.0;
    result += y_i * weight_i * dx;
  }
  return result;
}

DimensionlessSpectrum ComputeTransmittanceToTopAtmosphereBoundary(
    const AtmosphereParameters atmosphere, const Length r, const Number mu) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  vec3 optical_depth = (
      atmosphere.rayleigh_scattering *
          ComputeOpticalLengthToTopAtmosphereBoundary(
              atmosphere, atmosphere.rayleigh_density, r, mu) +
      atmosphere.mie_extinction *
          ComputeOpticalLengthToTopAtmosphereBoundary(
              atmosphere, atmosphere.mie_density, r, mu) +
      atmosphere.absorption_extinction *
          ComputeOpticalLengthToTopAtmosphereBoundary(
              atmosphere, atmosphere.absorption_density, r, mu));
  // @shotamatsuda: Added for the precomputation stage in half-float precision.
  #ifdef TRANSMITTANCE_PRECISION_LOG
  return optical_depth;
  #else // TRANSMITTANCE_PRECISION_LOG
  return exp(-optical_depth);
  #endif // TRANSMITTANCE_PRECISION_LOG
}

Number GetUnitRangeFromTextureCoord(const Number u, const int texture_size) {
  return (u - 0.5 / Number(texture_size)) / (1.0 - 1.0 / Number(texture_size));
}

void GetRMuFromTransmittanceTextureUv(const AtmosphereParameters atmosphere,
    const vec2 uv, out Length r, out Number mu) {
  assert(uv.x >= 0.0 && uv.x <= 1.0);
  assert(uv.y >= 0.0 && uv.y <= 1.0);
  Number x_mu = GetUnitRangeFromTextureCoord(uv.x, TRANSMITTANCE_TEXTURE_WIDTH);
  Number x_r = GetUnitRangeFromTextureCoord(uv.y, TRANSMITTANCE_TEXTURE_HEIGHT);
  // Distance to top atmosphere boundary for a horizontal ray at ground level.
  Length H = sqrt(atmosphere.top_radius * atmosphere.top_radius -
      atmosphere.bottom_radius * atmosphere.bottom_radius);
  // Distance to the horizon, from which we can compute r:
  Length rho = H * x_r;
  r = sqrt(rho * rho + atmosphere.bottom_radius * atmosphere.bottom_radius);
  // Distance to the top atmosphere boundary for the ray (r,mu), and its minimum
  // and maximum values over all mu - obtained for (r,1) and (r,mu_horizon) -
  // from which we can recover mu:
  Length d_min = atmosphere.top_radius - r;
  Length d_max = rho + H;
  Length d = d_min + x_mu * (d_max - d_min);
  mu = d == 0.0 * m ? Number(1.0) : (H * H - rho * rho - d * d) / (2.0 * r * d);
  mu = ClampCosine(mu);
}

DimensionlessSpectrum ComputeTransmittanceToTopAtmosphereBoundaryTexture(
    const AtmosphereParameters atmosphere, const vec2 frag_coord) {
  const vec2 TRANSMITTANCE_TEXTURE_SIZE =
      vec2(TRANSMITTANCE_TEXTURE_WIDTH, TRANSMITTANCE_TEXTURE_HEIGHT);
  Length r;
  Number mu;
  GetRMuFromTransmittanceTextureUv(
      atmosphere, frag_coord / TRANSMITTANCE_TEXTURE_SIZE, r, mu);
  return ComputeTransmittanceToTopAtmosphereBoundary(atmosphere, r, mu);
}

void ComputeSingleScatteringIntegrand(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const Length d, const bool ray_r_mu_intersects_ground,
    out DimensionlessSpectrum rayleigh, out DimensionlessSpectrum mie) {
  Length r_d = ClampRadius(atmosphere, sqrt(d * d + 2.0 * r * mu * d + r * r));
  Number mu_s_d = ClampCosine((r * mu_s + d * nu) / r_d);
  DimensionlessSpectrum transmittance =
      GetTransmittance(
          atmosphere, transmittance_texture, r, mu, d,
          ray_r_mu_intersects_ground) *
      GetTransmittanceToSun(
          atmosphere, transmittance_texture, r_d, mu_s_d);
  rayleigh = transmittance * GetProfileDensity(
      atmosphere.rayleigh_density, r_d - atmosphere.bottom_radius);
  mie = transmittance * GetProfileDensity(
      atmosphere.mie_density, r_d - atmosphere.bottom_radius);
}

Length DistanceToNearestAtmosphereBoundary(const AtmosphereParameters atmosphere,
    Length r, Number mu, bool ray_r_mu_intersects_ground) {
  if (ray_r_mu_intersects_ground) {
    return DistanceToBottomAtmosphereBoundary(atmosphere, r, mu);
  } else {
    return DistanceToTopAtmosphereBoundary(atmosphere, r, mu);
  }
}

void ComputeSingleScattering(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const bool ray_r_mu_intersects_ground,
    out IrradianceSpectrum rayleigh, out IrradianceSpectrum mie) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  assert(mu_s >= -1.0 && mu_s <= 1.0);
  assert(nu >= -1.0 && nu <= 1.0);

  // Number of intervals for the numerical integration.
  const int SAMPLE_COUNT = 50;
  // The integration step, i.e. the length of each integration interval.
  Length dx =
      DistanceToNearestAtmosphereBoundary(atmosphere, r, mu,
          ray_r_mu_intersects_ground) / Number(SAMPLE_COUNT);
  // Integration loop.
  DimensionlessSpectrum rayleigh_sum = DimensionlessSpectrum(0.0);
  DimensionlessSpectrum mie_sum = DimensionlessSpectrum(0.0);
  for (int i = 0; i <= SAMPLE_COUNT; ++i) {
    Length d_i = Number(i) * dx;
    // The Rayleigh and Mie single scattering at the current sample point.
    DimensionlessSpectrum rayleigh_i;
    DimensionlessSpectrum mie_i;
    ComputeSingleScatteringIntegrand(atmosphere, transmittance_texture,
        r, mu, mu_s, nu, d_i, ray_r_mu_intersects_ground, rayleigh_i, mie_i);
    // Sample weight (from the trapezoidal rule).
    Number weight_i = (i == 0 || i == SAMPLE_COUNT) ? 0.5 : 1.0;
    rayleigh_sum += rayleigh_i * weight_i;
    mie_sum += mie_i * weight_i;
  }
  rayleigh = rayleigh_sum * dx * atmosphere.solar_irradiance *
      atmosphere.rayleigh_scattering;
  mie = mie_sum * dx * atmosphere.solar_irradiance * atmosphere.mie_scattering;
}

void GetRMuMuSNuFromScatteringTextureUvwz(const AtmosphereParameters atmosphere,
    const vec4 uvwz, out Length r, out Number mu, out Number mu_s,
    out Number nu, out bool ray_r_mu_intersects_ground) {
  assert(uvwz.x >= 0.0 && uvwz.x <= 1.0);
  assert(uvwz.y >= 0.0 && uvwz.y <= 1.0);
  assert(uvwz.z >= 0.0 && uvwz.z <= 1.0);
  assert(uvwz.w >= 0.0 && uvwz.w <= 1.0);

  // Distance to top atmosphere boundary for a horizontal ray at ground level.
  Length H = sqrt(atmosphere.top_radius * atmosphere.top_radius -
      atmosphere.bottom_radius * atmosphere.bottom_radius);
  // Distance to the horizon.
  Length rho =
      H * GetUnitRangeFromTextureCoord(uvwz.w, SCATTERING_TEXTURE_R_SIZE);
  r = sqrt(rho * rho + atmosphere.bottom_radius * atmosphere.bottom_radius);

  if (uvwz.z < 0.5) {
    // Distance to the ground for the ray (r,mu), and its minimum and maximum
    // values over all mu - obtained for (r,-1) and (r,mu_horizon) - from which
    // we can recover mu:
    Length d_min = r - atmosphere.bottom_radius;
    Length d_max = rho;
    Length d = d_min + (d_max - d_min) * GetUnitRangeFromTextureCoord(
        1.0 - 2.0 * uvwz.z, SCATTERING_TEXTURE_MU_SIZE / 2);
    mu = d == 0.0 * m ? Number(-1.0) :
        ClampCosine(-(rho * rho + d * d) / (2.0 * r * d));
    ray_r_mu_intersects_ground = true;
  } else {
    // Distance to the top atmosphere boundary for the ray (r,mu), and its
    // minimum and maximum values over all mu - obtained for (r,1) and
    // (r,mu_horizon) - from which we can recover mu:
    Length d_min = atmosphere.top_radius - r;
    Length d_max = rho + H;
    Length d = d_min + (d_max - d_min) * GetUnitRangeFromTextureCoord(
        2.0 * uvwz.z - 1.0, SCATTERING_TEXTURE_MU_SIZE / 2);
    mu = d == 0.0 * m ? Number(1.0) :
        ClampCosine((H * H - rho * rho - d * d) / (2.0 * r * d));
    ray_r_mu_intersects_ground = false;
  }

  Number x_mu_s =
      GetUnitRangeFromTextureCoord(uvwz.y, SCATTERING_TEXTURE_MU_S_SIZE);
  Length d_min = atmosphere.top_radius - atmosphere.bottom_radius;
  Length d_max = H;
  Length D = DistanceToTopAtmosphereBoundary(
      atmosphere, atmosphere.bottom_radius, atmosphere.mu_s_min);
  Number A = (D - d_min) / (d_max - d_min);
  Number a = (A - x_mu_s * A) / (1.0 + x_mu_s * A);
  Length d = d_min + min(a, A) * (d_max - d_min);
  mu_s = d == 0.0 * m ? Number(1.0) :
     ClampCosine((H * H - d * d) / (2.0 * atmosphere.bottom_radius * d));

  nu = ClampCosine(uvwz.x * 2.0 - 1.0);
}

void GetRMuMuSNuFromScatteringTextureFragCoord(
    const AtmosphereParameters atmosphere, const vec3 frag_coord,
    out Length r, out Number mu, out Number mu_s, out Number nu,
    out bool ray_r_mu_intersects_ground) {
  const vec4 SCATTERING_TEXTURE_SIZE = vec4(
      SCATTERING_TEXTURE_NU_SIZE - 1,
      SCATTERING_TEXTURE_MU_S_SIZE,
      SCATTERING_TEXTURE_MU_SIZE,
      SCATTERING_TEXTURE_R_SIZE);
  Number frag_coord_nu =
      floor(frag_coord.x / Number(SCATTERING_TEXTURE_MU_S_SIZE));
  Number frag_coord_mu_s =
      mod(frag_coord.x, Number(SCATTERING_TEXTURE_MU_S_SIZE));
  vec4 uvwz =
      vec4(frag_coord_nu, frag_coord_mu_s, frag_coord.y, frag_coord.z) /
          SCATTERING_TEXTURE_SIZE;
  GetRMuMuSNuFromScatteringTextureUvwz(
      atmosphere, uvwz, r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  // Clamp nu to its valid range of values, given mu and mu_s.
  nu = clamp(nu, mu * mu_s - sqrt((1.0 - mu * mu) * (1.0 - mu_s * mu_s)),
      mu * mu_s + sqrt((1.0 - mu * mu) * (1.0 - mu_s * mu_s)));
}

void ComputeSingleScatteringTexture(const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture, const vec3 frag_coord,
    out IrradianceSpectrum rayleigh, out IrradianceSpectrum mie) {
  Length r;
  Number mu;
  Number mu_s;
  Number nu;
  bool ray_r_mu_intersects_ground;
  GetRMuMuSNuFromScatteringTextureFragCoord(atmosphere, frag_coord,
      r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  ComputeSingleScattering(atmosphere, transmittance_texture,
      r, mu, mu_s, nu, ray_r_mu_intersects_ground, rayleigh, mie);
}

AbstractSpectrum GetScattering(
    const AtmosphereParameters atmosphere,
    const AbstractScatteringTexture scattering_texture,
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
  return AbstractSpectrum(texture(scattering_texture, uvw0) * (1.0 - lerp) +
      texture(scattering_texture, uvw1) * lerp);
}

RadianceSpectrum GetScattering(
    const AtmosphereParameters atmosphere,
    const ReducedScatteringTexture single_rayleigh_scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    const ScatteringTexture multiple_scattering_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const bool ray_r_mu_intersects_ground,
    const int scattering_order) {
  if (scattering_order == 1) {
    IrradianceSpectrum rayleigh = GetScattering(
        atmosphere, single_rayleigh_scattering_texture, r, mu, mu_s, nu,
        ray_r_mu_intersects_ground);
    IrradianceSpectrum mie = GetScattering(
        atmosphere, single_mie_scattering_texture, r, mu, mu_s, nu,
        ray_r_mu_intersects_ground);
    return rayleigh * RayleighPhaseFunction(nu) +
        mie * MiePhaseFunction(atmosphere.mie_phase_function_g, nu);
  } else {
    return GetScattering(
        atmosphere, multiple_scattering_texture, r, mu, mu_s, nu,
        ray_r_mu_intersects_ground);
  }
}

IrradianceSpectrum GetIrradiance(
    const AtmosphereParameters atmosphere,
    const IrradianceTexture irradiance_texture,
    const Length r, const Number mu_s);

RadianceDensitySpectrum ComputeScatteringDensity(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const ReducedScatteringTexture single_rayleigh_scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    const ScatteringTexture multiple_scattering_texture,
    const IrradianceTexture irradiance_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const int scattering_order) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  assert(mu_s >= -1.0 && mu_s <= 1.0);
  assert(nu >= -1.0 && nu <= 1.0);
  assert(scattering_order >= 2);

  // Compute unit direction vectors for the zenith, the view direction omega and
  // and the sun direction omega_s, such that the cosine of the view-zenith
  // angle is mu, the cosine of the sun-zenith angle is mu_s, and the cosine of
  // the view-sun angle is nu. The goal is to simplify computations below.
  vec3 zenith_direction = vec3(0.0, 0.0, 1.0);
  vec3 omega = vec3(sqrt(1.0 - mu * mu), 0.0, mu);
  Number sun_dir_x = omega.x == 0.0 ? 0.0 : (nu - mu * mu_s) / omega.x;
  Number sun_dir_y = sqrt(max(1.0 - sun_dir_x * sun_dir_x - mu_s * mu_s, 0.0));
  vec3 omega_s = vec3(sun_dir_x, sun_dir_y, mu_s);

  const int SAMPLE_COUNT = 16;
  const Angle dphi = pi / Number(SAMPLE_COUNT);
  const Angle dtheta = pi / Number(SAMPLE_COUNT);
  RadianceDensitySpectrum rayleigh_mie =
      RadianceDensitySpectrum(0.0 * watt_per_cubic_meter_per_sr_per_nm);

  // Nested loops for the integral over all the incident directions omega_i.
  for (int l = 0; l < SAMPLE_COUNT; ++l) {
    Angle theta = (Number(l) + 0.5) * dtheta;
    Number cos_theta = cos(theta);
    Number sin_theta = sin(theta);
    bool ray_r_theta_intersects_ground =
        RayIntersectsGround(atmosphere, r, cos_theta);

    // The distance and transmittance to the ground only depend on theta, so we
    // can compute them in the outer loop for efficiency.
    Length distance_to_ground = 0.0 * m;
    DimensionlessSpectrum transmittance_to_ground = DimensionlessSpectrum(0.0);
    DimensionlessSpectrum ground_albedo = DimensionlessSpectrum(0.0);
    if (ray_r_theta_intersects_ground) {
      distance_to_ground =
          DistanceToBottomAtmosphereBoundary(atmosphere, r, cos_theta);
      transmittance_to_ground =
          GetTransmittance(atmosphere, transmittance_texture, r, cos_theta,
              distance_to_ground, true /* ray_intersects_ground */);
      ground_albedo = atmosphere.ground_albedo;
    }

    for (int m = 0; m < 2 * SAMPLE_COUNT; ++m) {
      Angle phi = (Number(m) + 0.5) * dphi;
      vec3 omega_i =
          vec3(cos(phi) * sin_theta, sin(phi) * sin_theta, cos_theta);
      SolidAngle domega_i = (dtheta / rad) * (dphi / rad) * sin(theta) * sr;

      // The radiance L_i arriving from direction omega_i after n-1 bounces is
      // the sum of a term given by the precomputed scattering texture for the
      // (n-1)-th order:
      Number nu1 = dot(omega_s, omega_i);
      RadianceSpectrum incident_radiance = GetScattering(atmosphere,
          single_rayleigh_scattering_texture, single_mie_scattering_texture,
          multiple_scattering_texture, r, omega_i.z, mu_s, nu1,
          ray_r_theta_intersects_ground, scattering_order - 1);

      // and of the contribution from the light paths with n-1 bounces and whose
      // last bounce is on the ground. This contribution is the product of the
      // transmittance to the ground, the ground albedo, the ground BRDF, and
      // the irradiance received on the ground after n-2 bounces.
      vec3 ground_normal =
          normalize(zenith_direction * r + omega_i * distance_to_ground);
      IrradianceSpectrum ground_irradiance = GetIrradiance(
          atmosphere, irradiance_texture, atmosphere.bottom_radius,
          dot(ground_normal, omega_s));
      incident_radiance += transmittance_to_ground *
          ground_albedo * (1.0 / (PI * sr)) * ground_irradiance;

      // The radiance finally scattered from direction omega_i towards direction
      // -omega is the product of the incident radiance, the scattering
      // coefficient, and the phase function for directions omega and omega_i
      // (all this summed over all particle types, i.e. Rayleigh and Mie).
      Number nu2 = dot(omega, omega_i);
      Number rayleigh_density = GetProfileDensity(
          atmosphere.rayleigh_density, r - atmosphere.bottom_radius);
      Number mie_density = GetProfileDensity(
          atmosphere.mie_density, r - atmosphere.bottom_radius);
      rayleigh_mie += incident_radiance * (
          atmosphere.rayleigh_scattering * rayleigh_density *
              RayleighPhaseFunction(nu2) +
          atmosphere.mie_scattering * mie_density *
              MiePhaseFunction(atmosphere.mie_phase_function_g, nu2)) *
          domega_i;
    }
  }
  return rayleigh_mie;
}

RadianceSpectrum ComputeMultipleScattering(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const ScatteringDensityTexture scattering_density_texture,
    const Length r, const Number mu, const Number mu_s, const Number nu,
    const bool ray_r_mu_intersects_ground) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu >= -1.0 && mu <= 1.0);
  assert(mu_s >= -1.0 && mu_s <= 1.0);
  assert(nu >= -1.0 && nu <= 1.0);

  // Number of intervals for the numerical integration.
  const int SAMPLE_COUNT = 50;
  // The integration step, i.e. the length of each integration interval.
  Length dx =
      DistanceToNearestAtmosphereBoundary(
          atmosphere, r, mu, ray_r_mu_intersects_ground) /
              Number(SAMPLE_COUNT);
  // Integration loop.
  RadianceSpectrum rayleigh_mie_sum =
      RadianceSpectrum(0.0 * watt_per_square_meter_per_sr_per_nm);
  for (int i = 0; i <= SAMPLE_COUNT; ++i) {
    Length d_i = Number(i) * dx;

    // The r, mu and mu_s parameters at the current integration point (see the
    // single scattering section for a detailed explanation).
    Length r_i =
        ClampRadius(atmosphere, sqrt(d_i * d_i + 2.0 * r * mu * d_i + r * r));
    Number mu_i = ClampCosine((r * mu + d_i) / r_i);
    Number mu_s_i = ClampCosine((r * mu_s + d_i * nu) / r_i);

    // The Rayleigh and Mie multiple scattering at the current sample point.
    RadianceSpectrum rayleigh_mie_i =
        GetScattering(
            atmosphere, scattering_density_texture, r_i, mu_i, mu_s_i, nu,
            ray_r_mu_intersects_ground) *
        GetTransmittance(
            atmosphere, transmittance_texture, r, mu, d_i,
            ray_r_mu_intersects_ground) *
        dx;
    // Sample weight (from the trapezoidal rule).
    Number weight_i = (i == 0 || i == SAMPLE_COUNT) ? 0.5 : 1.0;
    rayleigh_mie_sum += rayleigh_mie_i * weight_i;
  }
  return rayleigh_mie_sum;
}

RadianceDensitySpectrum ComputeScatteringDensityTexture(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const ReducedScatteringTexture single_rayleigh_scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    const ScatteringTexture multiple_scattering_texture,
    const IrradianceTexture irradiance_texture,
    const vec3 frag_coord, const int scattering_order) {
  Length r;
  Number mu;
  Number mu_s;
  Number nu;
  bool ray_r_mu_intersects_ground;
  GetRMuMuSNuFromScatteringTextureFragCoord(atmosphere, frag_coord,
      r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  return ComputeScatteringDensity(atmosphere, transmittance_texture,
      single_rayleigh_scattering_texture, single_mie_scattering_texture,
      multiple_scattering_texture, irradiance_texture, r, mu, mu_s, nu,
      scattering_order);
}

RadianceSpectrum ComputeMultipleScatteringTexture(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const ScatteringDensityTexture scattering_density_texture,
    const vec3 frag_coord, out Number nu) {
  Length r;
  Number mu;
  Number mu_s;
  bool ray_r_mu_intersects_ground;
  GetRMuMuSNuFromScatteringTextureFragCoord(atmosphere, frag_coord,
      r, mu, mu_s, nu, ray_r_mu_intersects_ground);
  return ComputeMultipleScattering(atmosphere, transmittance_texture,
      scattering_density_texture, r, mu, mu_s, nu,
      ray_r_mu_intersects_ground);
}

IrradianceSpectrum ComputeDirectIrradiance(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const Length r, const Number mu_s) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu_s >= -1.0 && mu_s <= 1.0);

  Number alpha_s = atmosphere.sun_angular_radius / rad;
  // Approximate average of the cosine factor mu_s over the visible fraction of
  // the Sun disc.
  Number average_cosine_factor =
    mu_s < -alpha_s ? 0.0 : (mu_s > alpha_s ? mu_s :
        (mu_s + alpha_s) * (mu_s + alpha_s) / (4.0 * alpha_s));

  return atmosphere.solar_irradiance *
      GetTransmittanceToTopAtmosphereBoundary(
          atmosphere, transmittance_texture, r, mu_s) * average_cosine_factor;

}

IrradianceSpectrum ComputeIndirectIrradiance(
    const AtmosphereParameters atmosphere,
    const ReducedScatteringTexture single_rayleigh_scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    const ScatteringTexture multiple_scattering_texture,
    const Length r, const Number mu_s, const int scattering_order) {
  assert(r >= atmosphere.bottom_radius && r <= atmosphere.top_radius);
  assert(mu_s >= -1.0 && mu_s <= 1.0);
  assert(scattering_order >= 1);

  const int SAMPLE_COUNT = 32;
  const Angle dphi = pi / Number(SAMPLE_COUNT);
  const Angle dtheta = pi / Number(SAMPLE_COUNT);

  IrradianceSpectrum result =
      IrradianceSpectrum(0.0 * watt_per_square_meter_per_nm);
  vec3 omega_s = vec3(sqrt(1.0 - mu_s * mu_s), 0.0, mu_s);
  for (int j = 0; j < SAMPLE_COUNT / 2; ++j) {
    Angle theta = (Number(j) + 0.5) * dtheta;
    for (int i = 0; i < 2 * SAMPLE_COUNT; ++i) {
      Angle phi = (Number(i) + 0.5) * dphi;
      vec3 omega =
          vec3(cos(phi) * sin(theta), sin(phi) * sin(theta), cos(theta));
      SolidAngle domega = (dtheta / rad) * (dphi / rad) * sin(theta) * sr;

      Number nu = dot(omega, omega_s);
      result += GetScattering(atmosphere, single_rayleigh_scattering_texture,
          single_mie_scattering_texture, multiple_scattering_texture,
          r, omega.z, mu_s, nu, false /* ray_r_theta_intersects_ground */,
          scattering_order) *
              omega.z * domega;
    }
  }
  return result;
}

void GetRMuSFromIrradianceTextureUv(const AtmosphereParameters atmosphere,
    const vec2 uv, out Length r, out Number mu_s) {
  assert(uv.x >= 0.0 && uv.x <= 1.0);
  assert(uv.y >= 0.0 && uv.y <= 1.0);
  Number x_mu_s = GetUnitRangeFromTextureCoord(uv.x, IRRADIANCE_TEXTURE_WIDTH);
  Number x_r = GetUnitRangeFromTextureCoord(uv.y, IRRADIANCE_TEXTURE_HEIGHT);
  r = atmosphere.bottom_radius +
      x_r * (atmosphere.top_radius - atmosphere.bottom_radius);
  mu_s = ClampCosine(2.0 * x_mu_s - 1.0);
}

const vec2 IRRADIANCE_TEXTURE_SIZE =
    vec2(IRRADIANCE_TEXTURE_WIDTH, IRRADIANCE_TEXTURE_HEIGHT);

IrradianceSpectrum ComputeDirectIrradianceTexture(
    const AtmosphereParameters atmosphere,
    const TransmittanceTexture transmittance_texture,
    const vec2 frag_coord) {
  Length r;
  Number mu_s;
  GetRMuSFromIrradianceTextureUv(
      atmosphere, frag_coord / IRRADIANCE_TEXTURE_SIZE, r, mu_s);
  return ComputeDirectIrradiance(atmosphere, transmittance_texture, r, mu_s);
}

IrradianceSpectrum ComputeIndirectIrradianceTexture(
    const AtmosphereParameters atmosphere,
    const ReducedScatteringTexture single_rayleigh_scattering_texture,
    const ReducedScatteringTexture single_mie_scattering_texture,
    const ScatteringTexture multiple_scattering_texture,
    const vec2 frag_coord, const int scattering_order) {
  Length r;
  Number mu_s;
  GetRMuSFromIrradianceTextureUv(
      atmosphere, frag_coord / IRRADIANCE_TEXTURE_SIZE, r, mu_s);
  return ComputeIndirectIrradiance(atmosphere,
      single_rayleigh_scattering_texture, single_mie_scattering_texture,
      multiple_scattering_texture, r, mu_s, scattering_order);
}
`;

  // node_modules/@takram/three-atmosphere/build/shared.js
  var Fn2 = /* @__PURE__ */ new Vector3(0.2126, 0.7152, 0.0722);
  var zn2 = [
    "solarIrradiance",
    "sunAngularRadius",
    "bottomRadius",
    "topRadius",
    "rayleighDensity",
    "rayleighScattering",
    "mieDensity",
    "mieScattering",
    "mieExtinction",
    "miePhaseFunctionG",
    "absorptionDensity",
    "absorptionExtinction",
    "groundAlbedo",
    "muSMin",
    "skyRadianceToLuminance",
    "sunRadianceToLuminance"
  ];
  function kn2(n4, e3) {
    if (e3 != null)
      for (const t2 of zn2) {
        const r4 = e3[t2];
        r4 != null && (n4[t2] instanceof Vector3 ? n4[t2].copy(r4) : n4[t2] = r4);
      }
  }
  var v0 = class {
    constructor(e3, t2, r4, i3, a3) {
      this.width = e3, this.expTerm = t2, this.expScale = r4, this.linearTerm = i3, this.constantTerm = a3;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    toUniform() {
      return new Uniform({
        width: this.width,
        exp_term: this.expTerm,
        exp_scale: this.expScale,
        linear_term: this.linearTerm,
        constant_term: this.constantTerm
      });
    }
  };
  var ie2 = class ie3 {
    constructor(e3) {
      this.solarIrradiance = new Vector3(1.474, 1.8504, 1.91198), this.sunAngularRadius = 4675e-6, this.bottomRadius = 636e4, this.topRadius = 642e4, this.rayleighDensity = [
        new v0(0, 0, 0, 0, 0),
        new v0(0, 1, -0.125, 0, 0)
      ], this.rayleighScattering = new Vector3(5802e-6, 0.013558, 0.0331), this.mieDensity = [
        new v0(0, 0, 0, 0, 0),
        new v0(0, 1, -0.833333, 0, 0)
      ], this.mieScattering = new Vector3(3996e-6, 3996e-6, 3996e-6), this.mieExtinction = new Vector3(444e-5, 444e-5, 444e-5), this.miePhaseFunctionG = 0.8, this.absorptionDensity = [
        new v0(25, 0, 0, 1 / 15, -2 / 3),
        new v0(0, 0, 0, -1 / 15, 8 / 3)
      ], this.absorptionExtinction = new Vector3(65e-5, 1881e-6, 85e-6), this.groundAlbedo = new Color().setScalar(0.1), this.muSMin = Math.cos(Cr(120)), this.sunRadianceToLuminance = new Vector3(98242.786222, 69954.398112, 66475.012354), this.skyRadianceToLuminance = new Vector3(114974.916437, 71305.954816, 65310.548555), this.sunRadianceToRelativeLuminance = new Vector3(), this.skyRadianceToRelativeLuminance = new Vector3(), kn2(this, e3);
      const t2 = Fn2.dot(this.sunRadianceToLuminance);
      this.sunRadianceToRelativeLuminance.copy(this.sunRadianceToLuminance).divideScalar(t2), this.skyRadianceToRelativeLuminance.copy(this.skyRadianceToLuminance).divideScalar(t2);
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    toUniform() {
      return new Uniform({
        solar_irradiance: this.solarIrradiance,
        sun_angular_radius: this.sunAngularRadius,
        bottom_radius: this.bottomRadius * w2,
        top_radius: this.topRadius * w2,
        rayleigh_density: {
          layers: this.rayleighDensity.map((e3) => e3.toUniform().value)
        },
        rayleigh_scattering: this.rayleighScattering,
        mie_density: {
          layers: this.mieDensity.map((e3) => e3.toUniform().value)
        },
        mie_scattering: this.mieScattering,
        mie_extinction: this.mieExtinction,
        mie_phase_function_g: this.miePhaseFunctionG,
        absorption_density: {
          layers: this.absorptionDensity.map((e3) => e3.toUniform().value)
        },
        absorption_extinction: this.absorptionExtinction,
        ground_albedo: this.groundAlbedo,
        mu_s_min: this.muSMin
      });
    }
  };
  ie2.DEFAULT = /* @__PURE__ */ new ie2();
  var n0 = ie2;
  var Vn2 = `precision highp sampler2DArray;

#include "core/depth"
#include "core/math"
#include "core/packing"
#include "core/transform"
#ifdef HAS_SHADOW
#include "core/raySphereIntersection"
#include "core/cascadedShadowMaps"
#include "core/interleavedGradientNoise"
#include "core/vogelDisk"
#endif // HAS_SHADOW

#include "bruneton/definitions"

uniform AtmosphereParameters ATMOSPHERE;
uniform vec3 SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform vec3 SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;

uniform sampler2D transmittance_texture;
uniform sampler3D scattering_texture;
uniform sampler2D irradiance_texture;
uniform sampler3D single_mie_scattering_texture;
uniform sampler3D higher_order_scattering_texture;

#include "bruneton/common"
#include "bruneton/runtime"

#include "sky"

uniform sampler2D normalBuffer;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 inverseProjectionMatrix;
uniform mat4 inverseViewMatrix;
uniform float bottomRadius;
uniform mat4 worldToECEFMatrix;
uniform float geometricErrorCorrectionAmount;
uniform vec3 sunDirection;
uniform vec3 moonDirection;
uniform float moonAngularRadius;
uniform float lunarRadianceScale;
uniform float albedoScale;

#ifdef HAS_LIGHTING_MASK
uniform sampler2D lightingMaskBuffer;
#endif // HAS_LIGHTING_MASK

// prettier-ignore
#define LIGHTING_MASK_CHANNEL_ LIGHTING_MASK_CHANNEL

#ifdef HAS_OVERLAY
uniform sampler2D overlayBuffer;
#endif // HAS_OVERLAY

#ifdef HAS_SHADOW
uniform sampler2DArray shadowBuffer;
uniform vec2 shadowIntervals[SHADOW_CASCADE_COUNT];
uniform mat4 shadowMatrices[SHADOW_CASCADE_COUNT];
uniform mat4 inverseShadowMatrices[SHADOW_CASCADE_COUNT];
uniform float shadowFar;
uniform float shadowTopHeight;
uniform float shadowRadius;
uniform sampler3D stbnTexture;
uniform int frame;
#endif // HAS_SHADOW

#ifdef HAS_SHADOW_LENGTH
uniform sampler2D shadowLengthBuffer;
#endif // HAS_SHADOW_LENGTH

varying vec3 vCameraPosition;
varying vec3 vRayDirection;
varying vec3 vGeometryAltitudeCorrection;
varying vec3 vEllipsoidRadiiSquared;

vec3 readNormal(const vec2 uv, out bool degenerate) {
  vec3 normal = texture(normalBuffer, uv).xyz;
  degenerate = normal == vec3(0.0);
  #ifdef OCT_ENCODED_NORMAL
  return unpackVec2ToNormal(normal.xy);
  #else // OCT_ENCODED_NORMAL
  return 2.0 * normal - 1.0;
  #endif // OCT_ENCODED_NORMAL
}

void correctGeometricError(inout vec3 positionECEF, inout vec3 normalECEF) {
  // TODO: The error is pronounced at the edge of the ellipsoid due to the
  // large difference between the sphere position and the unprojected position
  // at the current fragment. Calculating the sphere position from the fragment
  // UV may resolve this.

  // Correct way is slerp, but this will be small-angle interpolation anyways.
  vec3 sphereNormal = normalize(positionECEF / vEllipsoidRadiiSquared);
  vec3 spherePosition = ATMOSPHERE.bottom_radius * sphereNormal;
  normalECEF = mix(normalECEF, sphereNormal, geometricErrorCorrectionAmount);
  positionECEF = mix(positionECEF, spherePosition, geometricErrorCorrectionAmount);
}

#if defined(SUN_LIGHT) || defined(SKY_LIGHT)

vec3 getSunSkyIrradiance(
  const vec3 positionECEF,
  const vec3 normal,
  const vec3 inputColor,
  const float sunTransmittance
) {
  // Assume lambertian BRDF. If both SUN_LIGHT and SKY_LIGHT are not defined,
  // regard the inputColor as radiance at the texel.
  vec3 diffuse = inputColor * albedoScale * RECIPROCAL_PI;
  vec3 skyIrradiance;
  vec3 sunIrradiance = GetSunAndSkyIrradiance(positionECEF, normal, sunDirection, skyIrradiance);

  #ifdef HAS_SHADOW
  sunIrradiance *= sunTransmittance;
  #endif // HAS_SHADOW

  #if defined(SUN_LIGHT) && defined(SKY_LIGHT)
  return diffuse * (sunIrradiance + skyIrradiance);
  #elif defined(SUN_LIGHT)
  return diffuse * sunIrradiance;
  #elif defined(SKY_LIGHT)
  return diffuse * skyIrradiance;
  #endif // defined(SUN_LIGHT) && defined(SKY_LIGHT)
}

#endif // defined(SUN_LIGHT) || defined(SKY_LIGHT)

#if defined(TRANSMITTANCE) || defined(INSCATTER)

void applyTransmittanceInscatter(const vec3 positionECEF, float shadowLength, inout vec3 radiance) {
  vec3 transmittance;
  vec3 inscatter = GetSkyRadianceToPoint(
    vCameraPosition,
    positionECEF,
    shadowLength,
    sunDirection,
    transmittance
  );
  #ifdef TRANSMITTANCE
  radiance = radiance * transmittance;
  #endif // TRANSMITTANCE
  #ifdef INSCATTER
  radiance = radiance + inscatter;
  #endif // INSCATTER
}

#endif // defined(TRANSMITTANCE) || defined(INSCATTER)

#ifdef HAS_SHADOW

float getSTBN() {
  ivec3 size = textureSize(stbnTexture, 0);
  vec3 scale = 1.0 / vec3(size);
  return texture(stbnTexture, vec3(gl_FragCoord.xy, float(frame % size.z)) * scale).r;
}

vec2 getShadowUv(const vec3 worldPosition, const int cascadeIndex) {
  vec4 clip = shadowMatrices[cascadeIndex] * vec4(worldPosition, 1.0);
  clip /= clip.w;
  return clip.xy * 0.5 + 0.5;
}

float getDistanceToShadowTop(const vec3 positionECEF) {
  // Distance to the top of the shadows along the sun direction, which matches
  // the ray origin of BSM.
  return raySphereSecondIntersection(
    positionECEF / METER_TO_LENGTH_UNIT, // TODO: Make units consistent
    sunDirection,
    vec3(0.0),
    bottomRadius + shadowTopHeight
  );
}

float readShadowOpticalDepth(const vec2 uv, const float distanceToTop, const int cascadeIndex) {
  // r: frontDepth, g: meanExtinction, b: maxOpticalDepth, a: maxOpticalDepthTail
  vec4 shadow = texture(shadowBuffer, vec3(uv, float(cascadeIndex)));
  // Omit adding maxOpticalDepthTail to avoid pronounced aliasing. Ground
  // shadow will be attenuated by inscatter anyways.
  return min(shadow.b, shadow.g * max(0.0, distanceToTop - shadow.r));
}

float sampleShadowOpticalDepthPCF(
  const vec3 worldPosition,
  const float distanceToTop,
  const float radius,
  const int cascadeIndex
) {
  vec2 uv = getShadowUv(worldPosition, cascadeIndex);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return 0.0;
  }

  vec2 texelSize = vec2(1.0) / vec2(textureSize(shadowBuffer, 0).xy);
  float sum = 0.0;
  vec2 offset;
  #pragma unroll_loop_start
  for (int i = 0; i < 16; ++i) {
    #if UNROLLED_LOOP_INDEX < SHADOW_SAMPLE_COUNT
    offset = vogelDisk(
      UNROLLED_LOOP_INDEX,
      SHADOW_SAMPLE_COUNT,
      interleavedGradientNoise(gl_FragCoord.xy) * PI2
    );
    sum += readShadowOpticalDepth(uv + offset * radius * texelSize, distanceToTop, cascadeIndex);
    #endif // UNROLLED_LOOP_INDEX < SHADOW_SAMPLE_COUNT
  }
  #pragma unroll_loop_end
  return sum / float(SHADOW_SAMPLE_COUNT);
}

float sampleShadowOpticalDepth(
  const vec3 worldPosition,
  const vec3 positionECEF,
  const float radius,
  const float jitter
) {
  float distanceToTop = getDistanceToShadowTop(positionECEF);
  if (distanceToTop <= 0.0) {
    return 0.0;
  }
  int cascadeIndex = getFadedCascadeIndex(
    viewMatrix,
    worldPosition,
    shadowIntervals,
    cameraNear,
    shadowFar,
    jitter
  );
  return cascadeIndex >= 0
    ? sampleShadowOpticalDepthPCF(worldPosition, distanceToTop, radius, cascadeIndex)
    : 0.0;
}

float getShadowRadius(const vec3 worldPosition) {
  vec4 clip = shadowMatrices[0] * vec4(worldPosition, 1.0);
  clip /= clip.w;

  // Offset by 1px in each direction in shadow's clip coordinates.
  vec2 shadowSize = vec2(textureSize(shadowBuffer, 0));
  vec3 offset = vec3(2.0 / shadowSize, 0.0);
  vec4 clipX = clip + offset.xzzz;
  vec4 clipY = clip + offset.zyzz;

  // Convert back to world space.
  vec4 worldX = inverseShadowMatrices[0] * clipX;
  vec4 worldY = inverseShadowMatrices[0] * clipY;

  // Project into the main camera's clip space.
  mat4 viewProjectionMatrix = projectionMatrix * viewMatrix;
  vec4 projected = viewProjectionMatrix * vec4(worldPosition, 1.0);
  vec4 projectedX = viewProjectionMatrix * worldX;
  vec4 projectedY = viewProjectionMatrix * worldY;
  projected /= projected.w;
  projectedX /= projectedX.w;
  projectedY /= projectedY.w;

  // Take the mean of pixel sizes.
  vec2 center = (projected.xy * 0.5 + 0.5) * resolution;
  vec2 offsetX = (projectedX.xy * 0.5 + 0.5) * resolution;
  vec2 offsetY = (projectedY.xy * 0.5 + 0.5) * resolution;
  float size = max(length(offsetX - center), length(offsetY - center));

  return remapClamped(size, 10.0, 50.0, 0.0, shadowRadius);
}

#endif // HAS_SHADOW

void mainImage(const vec4 inputColor, const vec2 uv, out vec4 outputColor) {
  #if defined(HAS_LIGHTING_MASK) && defined(DEBUG_SHOW_LIGHTING_MASK)
  outputColor.rgb = vec3(texture(lightingMaskBuffer, uv).LIGHTING_MASK_CHANNEL_);
  outputColor.a = 1.0;
  return;
  #endif // defined(HAS_LIGHTING_MASK) && defined(DEBUG_SHOW_LIGHTING_MASK)

  float shadowLength = 0.0;
  #ifdef HAS_SHADOW_LENGTH
  shadowLength = texture(shadowLengthBuffer, uv).r;
  #endif // HAS_SHADOW_LENGTH

  #ifdef HAS_OVERLAY
  vec4 overlay = texture(overlayBuffer, uv);
  if (overlay.a >= 0.5) {
    outputColor = vec4(overlay.rgb, 1.0);
    return;
  }
  #endif // HAS_OVERLAY

  float depth = readDepthValue(depthBuffer, uv);
  if (depth >= 1.0 - 1e-8) {
    #ifdef SKY
    vec3 rayDirection = normalize(vRayDirection);
    outputColor.rgb = getSkyRadiance(
      vCameraPosition,
      rayDirection,
      shadowLength,
      sunDirection,
      moonDirection,
      moonAngularRadius,
      lunarRadianceScale
    );
    outputColor.a = 1.0;
    #else // SKY
    outputColor = inputColor;
    #endif // SKY

    #ifdef HAS_OVERLAY
    outputColor.rgb = outputColor.rgb * (1.0 - overlay.a) + overlay.rgb;
    #endif // HAS_OVERLAY
    return;
  }
  depth = reverseLogDepth(depth, cameraNear, cameraFar);

  // Reconstruct position and normal in world space.
  vec3 viewPosition = screenToView(
    uv,
    depth,
    getViewZ(depth),
    projectionMatrix,
    inverseProjectionMatrix
  );
  vec3 worldPosition = (inverseViewMatrix * vec4(viewPosition, 1.0)).xyz;
  vec3 positionECEF = (worldToECEFMatrix * vec4(worldPosition, 1.0)).xyz;
  positionECEF = positionECEF * METER_TO_LENGTH_UNIT + vGeometryAltitudeCorrection;

  vec3 viewNormal;
  bool degenerateNormal = false;
  #ifdef RECONSTRUCT_NORMAL
  vec3 dx = dFdx(viewPosition);
  vec3 dy = dFdy(viewPosition);
  viewNormal = normalize(cross(dx, dy));
  #elif defined(HAS_NORMALS)
  viewNormal = readNormal(uv, degenerateNormal);
  #endif // defined(HAS_NORMALS)

  #if defined(RECONSTRUCT_NORMAL) || defined(HAS_NORMALS)
  vec3 worldNormal = (inverseViewMatrix * vec4(viewNormal, 0.0)).xyz;
  vec3 normalECEF = (worldToECEFMatrix * vec4(worldNormal, 0.0)).xyz;
  #else // defined(RECONSTRUCT_NORMAL) || defined(HAS_NORMALS)
  vec3 normalECEF = normalize(positionECEF);
  #endif // defined(RECONSTRUCT_NORMAL) || defined(HAS_NORMALS)

  #ifdef CORRECT_GEOMETRIC_ERROR
  correctGeometricError(positionECEF, normalECEF);
  #endif // CORRECT_GEOMETRIC_ERROR

  #ifdef HAS_SHADOW
  float stbn = getSTBN();
  float radius = getShadowRadius(worldPosition);
  float opticalDepth = sampleShadowOpticalDepth(worldPosition, positionECEF, radius, stbn);
  float sunTransmittance = exp(-opticalDepth);
  #else // HAS_SHADOW
  float sunTransmittance = 1.0;
  #endif // HAS_SHADOW

  vec3 radiance;
  #if defined(SUN_LIGHT) || defined(SKY_LIGHT)
  // WORKAROUND: When both post-process lighting and sky options are enabled,
  // stars have degenerate normals. We use this to disable irradiance, which is
  // irrelevant for them.
  if (!degenerateNormal) {
    radiance = getSunSkyIrradiance(positionECEF, normalECEF, inputColor.rgb, sunTransmittance);
  } else {
    radiance = inputColor.rgb;
  }
  #ifdef HAS_LIGHTING_MASK
  float lightingMask = texture(lightingMaskBuffer, uv).LIGHTING_MASK_CHANNEL_;
  radiance = mix(inputColor.rgb, radiance, lightingMask);
  #endif // HAS_LIGHTING_MASK
  #else // defined(SUN_LIGHT) || defined(SKY_LIGHT)
  radiance = inputColor.rgb;
  #endif // defined(SUN_LIGHT) || defined(SKY_LIGHT)

  #if defined(TRANSMITTANCE) || defined(INSCATTER)
  applyTransmittanceInscatter(positionECEF, shadowLength, radiance);
  #endif // defined(TRANSMITTANCE) || defined(INSCATTER)

  outputColor = vec4(radiance, inputColor.a);

  #ifdef HAS_OVERLAY
  outputColor.rgb = outputColor.rgb * (1.0 - overlay.a) + overlay.rgb;
  #endif // HAS_OVERLAY
}
`;
  var Bn2 = `uniform mat4 inverseViewMatrix;
uniform mat4 inverseProjectionMatrix;
uniform vec3 cameraPosition;
uniform mat4 worldToECEFMatrix;
uniform vec3 altitudeCorrection;
uniform float geometricErrorCorrectionAmount;
uniform vec3 ellipsoidRadii;

varying vec3 vCameraPosition;
varying vec3 vRayDirection;
varying vec3 vGeometryAltitudeCorrection;
varying vec3 vEllipsoidRadiiSquared;

void getCameraRay(out vec3 origin, out vec3 direction) {
  bool isPerspective = inverseProjectionMatrix[2][3] != 0.0; // 4th entry in the 3rd column

  if (isPerspective) {
    // Calculate the camera ray for a perspective camera.
    vec4 viewPosition = inverseProjectionMatrix * vec4(position, 1.0);
    vec4 worldDirection = inverseViewMatrix * vec4(viewPosition.xyz, 0.0);
    origin = cameraPosition;
    direction = worldDirection.xyz;
  } else {
    // Unprojected points to calculate direction.
    vec4 nearPoint = inverseProjectionMatrix * vec4(position.xy, -1.0, 1.0);
    vec4 farPoint = inverseProjectionMatrix * vec4(position.xy, -0.9, 1.0);
    nearPoint /= nearPoint.w;
    farPoint /= farPoint.w;

    // Calculate world values.
    vec4 worldDirection = inverseViewMatrix * vec4(farPoint.xyz - nearPoint.xyz, 0.0);
    vec4 worldOrigin = inverseViewMatrix * nearPoint;

    // Outputs
    direction = worldDirection.xyz;
    origin = worldOrigin.xyz;
  }
}

void mainSupport() {
  vec3 direction, origin;
  getCameraRay(origin, direction);

  vec3 cameraPositionECEF = (worldToECEFMatrix * vec4(origin, 1.0)).xyz;
  vCameraPosition = (cameraPositionECEF + altitudeCorrection) * METER_TO_LENGTH_UNIT;
  vRayDirection = (worldToECEFMatrix * vec4(direction, 0.0)).xyz;

  vGeometryAltitudeCorrection = altitudeCorrection * METER_TO_LENGTH_UNIT;
  // Gradually turn off the altitude correction on geometries as the geometric
  // error correction takes effect, because that on the ideal sphere will be
  // over corrected.
  // See: https://github.com/takram-design-engineering/three-geospatial/pull/23#issuecomment-2542914656
  #ifdef CORRECT_GEOMETRIC_ERROR
  vGeometryAltitudeCorrection *= 1.0 - geometricErrorCorrectionAmount;
  #endif // CORRECT_GEOMETRIC_ERROR

  vec3 radii = ellipsoidRadii * METER_TO_LENGTH_UNIT;
  vEllipsoidRadiiSquared = radii * radii;
}
`;
  var Ct2 = `vec3 getLunarRadiance(const float moonAngularRadius) {
  // Not a physical number but the order of 10^-6 relative to the sun may fit.
  vec3 radiance =
    ATMOSPHERE.solar_irradiance *
    0.000002 /
    (PI * moonAngularRadius * moonAngularRadius) *
    SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
  return radiance;
}

float intersectSphere(const vec3 ray, const vec3 point, const float radius) {
  vec3 P = -point;
  float PoR = dot(P, ray);
  float D = dot(P, P) - radius * radius;
  return -PoR - sqrt(PoR * PoR - D);
}

float orenNayarDiffuse(const vec3 L, const vec3 V, const vec3 N) {
  float NoL = dot(N, L);
  float NoV = dot(N, V);
  float s = dot(L, V) - NoL * NoV;
  float t = mix(1.0, max(NoL, NoV), step(0.0, s));
  return max(0.0, NoL) * (0.62406015 + 0.41284404 * s / t);
}

vec3 getSkyRadiance(
  const vec3 cameraPosition,
  const vec3 rayDirection,
  const float shadowLength,
  const vec3 sunDirection,
  const vec3 moonDirection,
  const float moonAngularRadius,
  const float lunarRadianceScale
) {
  vec3 transmittance;
  vec3 radiance = GetSkyRadiance(
    cameraPosition,
    rayDirection,
    shadowLength,
    sunDirection,
    transmittance
  );

  // Rendering celestial objects without perspective doesn't make sense.
  #ifdef PERSPECTIVE_CAMERA

  #if defined(SUN) || defined(MOON)
  vec3 ddx = dFdx(rayDirection);
  vec3 ddy = dFdy(rayDirection);
  float fragmentAngle = length(ddx + ddy) / length(rayDirection);
  #endif // defined(SUN) || defined(MOON)

  #ifdef SUN
  float viewDotSun = dot(rayDirection, sunDirection);
  if (viewDotSun > cos(ATMOSPHERE.sun_angular_radius)) {
    float angle = acos(clamp(viewDotSun, -1.0, 1.0));
    float antialias = smoothstep(
      ATMOSPHERE.sun_angular_radius,
      ATMOSPHERE.sun_angular_radius - fragmentAngle,
      angle
    );
    radiance += transmittance * GetSolarRadiance() * antialias;
  }
  #endif // SUN

  #ifdef MOON
  float intersection = intersectSphere(rayDirection, moonDirection, moonAngularRadius);
  if (intersection > 0.0) {
    vec3 normal = normalize(moonDirection - rayDirection * intersection);
    float diffuse = orenNayarDiffuse(-sunDirection, rayDirection, normal);
    float viewDotMoon = dot(rayDirection, moonDirection);
    float angle = acos(clamp(viewDotMoon, -1.0, 1.0));
    float antialias = smoothstep(moonAngularRadius, moonAngularRadius - fragmentAngle, angle);
    radiance +=
      transmittance *
      getLunarRadiance(moonAngularRadius) *
      lunarRadianceScale *
      diffuse *
      antialias;
  }
  #endif // MOON

  #endif // PERSPECTIVE_CAMERA

  return radiance;
}
`;
  var Wn2 = Object.defineProperty;
  var L2 = (n4, e3, t2, r4) => {
    for (var i3 = void 0, a3 = n4.length - 1, o3; a3 >= 0; a3--)
      (o3 = n4[a3]) && (i3 = o3(e3, t2, i3) || i3);
    return i3 && Wn2(e3, t2, i3), i3;
  };
  var jn2 = /* @__PURE__ */ new Vector3();
  var Xn2 = /* @__PURE__ */ new Vector3();
  var Yn2 = /* @__PURE__ */ new C();
  var Kn2 = {
    blendFunction: BlendFunction.NORMAL,
    octEncodedNormal: false,
    reconstructNormal: false,
    ellipsoid: N.WGS84,
    correctAltitude: true,
    correctGeometricError: true,
    sunLight: false,
    skyLight: false,
    transmittance: true,
    inscatter: true,
    albedoScale: 1,
    sky: false,
    sun: true,
    moon: true,
    moonAngularRadius: 45e-4,
    // ≈ 15.5 arcminutes
    lunarRadianceScale: 1,
    ground: true
  };
  var H3 = class extends Effect {
    constructor(e3 = new Camera(), t2, r4 = n0.DEFAULT) {
      var _a2, _b2;
      const {
        blendFunction: i3,
        normalBuffer: a3 = null,
        octEncodedNormal: o3,
        reconstructNormal: c3,
        irradianceTexture: s = null,
        scatteringTexture: l3 = null,
        transmittanceTexture: d3 = null,
        singleMieScatteringTexture: m4 = null,
        higherOrderScatteringTexture: f4 = null,
        ellipsoid: v3,
        correctAltitude: T3,
        correctGeometricError: E3,
        sunDirection: x3,
        sunLight: y2,
        skyLight: I3,
        transmittance: N3,
        inscatter: b4,
        albedoScale: U4,
        sky: z4,
        sun: F2,
        moon: q2,
        moonDirection: Z,
        moonAngularRadius: i0,
        lunarRadianceScale: a0,
        ground: J2
      } = { ...Kn2, ...t2 };
      super(
        "AerialPerspectiveEffect",
        as(
          Ar(Vn2, {
            core: {
              depth: d2,
              packing: p,
              math: x2,
              transform: _,
              raySphereIntersection: u2,
              cascadedShadowMaps: m2,
              interleavedGradientNoise: f,
              vogelDisk: g2
            },
            bruneton: {
              common: e2,
              definitions: t,
              runtime: n3
            },
            sky: Ct2
          })
        ),
        {
          blendFunction: i3,
          vertexShader: Bn2,
          attributes: EffectAttribute.DEPTH,
          // prettier-ignore
          uniforms: new Map(
            Object.entries({
              normalBuffer: new Uniform(a3),
              projectionMatrix: new Uniform(new Matrix4()),
              viewMatrix: new Uniform(new Matrix4()),
              inverseProjectionMatrix: new Uniform(new Matrix4()),
              inverseViewMatrix: new Uniform(new Matrix4()),
              cameraPosition: new Uniform(new Vector3()),
              bottomRadius: new Uniform(r4.bottomRadius),
              ellipsoidRadii: new Uniform(new Vector3()),
              worldToECEFMatrix: new Uniform(new Matrix4()),
              altitudeCorrection: new Uniform(new Vector3()),
              geometricErrorCorrectionAmount: new Uniform(0),
              sunDirection: new Uniform((_a2 = x3 == null ? void 0 : x3.clone()) != null ? _a2 : new Vector3()),
              albedoScale: new Uniform(U4),
              moonDirection: new Uniform((_b2 = Z == null ? void 0 : Z.clone()) != null ? _b2 : new Vector3()),
              moonAngularRadius: new Uniform(i0),
              lunarRadianceScale: new Uniform(a0),
              // Composition and shadow
              overlayBuffer: new Uniform(null),
              shadowBuffer: new Uniform(null),
              shadowMapSize: new Uniform(new Vector2()),
              shadowIntervals: new Uniform([]),
              shadowMatrices: new Uniform([]),
              inverseShadowMatrices: new Uniform([]),
              shadowFar: new Uniform(0),
              shadowTopHeight: new Uniform(0),
              shadowRadius: new Uniform(3),
              stbnTexture: new Uniform(null),
              frame: new Uniform(0),
              shadowLengthBuffer: new Uniform(null),
              // Lighting mask
              lightingMaskBuffer: new Uniform(null),
              // Uniforms for atmosphere functions
              ATMOSPHERE: r4.toUniform(),
              SUN_SPECTRAL_RADIANCE_TO_LUMINANCE: new Uniform(r4.sunRadianceToRelativeLuminance),
              SKY_SPECTRAL_RADIANCE_TO_LUMINANCE: new Uniform(r4.skyRadianceToRelativeLuminance),
              irradiance_texture: new Uniform(s),
              scattering_texture: new Uniform(l3),
              transmittance_texture: new Uniform(d3),
              single_mie_scattering_texture: new Uniform(null),
              higher_order_scattering_texture: new Uniform(null)
            })
          ),
          // prettier-ignore
          defines: /* @__PURE__ */ new Map([
            ["TRANSMITTANCE_TEXTURE_WIDTH", C3.toFixed(0)],
            ["TRANSMITTANCE_TEXTURE_HEIGHT", p2.toFixed(0)],
            ["SCATTERING_TEXTURE_R_SIZE", i2.toFixed(0)],
            ["SCATTERING_TEXTURE_MU_SIZE", _2.toFixed(0)],
            ["SCATTERING_TEXTURE_MU_S_SIZE", R3.toFixed(0)],
            ["SCATTERING_TEXTURE_NU_SIZE", u3.toFixed(0)],
            ["IRRADIANCE_TEXTURE_WIDTH", f2.toFixed(0)],
            ["IRRADIANCE_TEXTURE_HEIGHT", A3.toFixed(0)],
            ["METER_TO_LENGTH_UNIT", w2.toFixed(7)]
          ])
        }
      ), this.camera = e3, this.atmosphere = r4, this.overlay = null, this.shadow = null, this.shadowLength = null, this.lightingMask = null, this.hasNormals = false, this.combinedScatteringTextures = false, this.hasHigherOrderScatteringTexture = false, this.shadowSampleCount = 8, this.octEncodedNormal = o3, this.reconstructNormal = c3, this.singleMieScatteringTexture = m4, this.higherOrderScatteringTexture = f4, this.ellipsoid = v3, this.correctAltitude = T3, this.correctGeometricError = E3, this.sunLight = y2, this.skyLight = I3, this.transmittance = N3, this.inscatter = b4, this.sky = z4, this.sun = F2, this.moon = q2, this.ground = J2;
    }
    get mainCamera() {
      return this.camera;
    }
    set mainCamera(e3) {
      this.camera = e3;
    }
    copyCameraSettings(e3) {
      const {
        projectionMatrix: t2,
        matrixWorldInverse: r4,
        projectionMatrixInverse: i3,
        matrixWorld: a3
      } = e3, o3 = this.uniforms;
      o3.get("projectionMatrix").value.copy(t2), o3.get("viewMatrix").value.copy(r4), o3.get("inverseProjectionMatrix").value.copy(i3), o3.get("inverseViewMatrix").value.copy(a3);
      const c3 = e3.getWorldPosition(
        o3.get("cameraPosition").value
      ), s = o3.get("worldToECEFMatrix").value, l3 = jn2.copy(c3).applyMatrix4(s);
      try {
        const m4 = Yn2.setFromECEF(l3).height, f4 = Xn2.set(0, this.ellipsoid.maximumRadius, -Math.max(0, m4)).applyMatrix4(t2);
        o3.get("geometricErrorCorrectionAmount").value = Hr(
          Gr(f4.y, 41.5, 13.8, 0, 1)
        );
      } catch {
        return;
      }
      const d3 = o3.get("altitudeCorrection");
      this.correctAltitude ? X(
        l3,
        this.atmosphere.bottomRadius,
        this.ellipsoid,
        d3.value
      ) : d3.value.setScalar(0);
    }
    updateOverlay() {
      let e3 = false;
      const { uniforms: t2, defines: r4, overlay: i3 } = this, a3 = r4.has("HAS_OVERLAY"), o3 = i3 != null;
      return o3 !== a3 && (o3 ? r4.set("HAS_OVERLAY", "1") : (r4.delete("HAS_OVERLAY"), t2.get("overlayBuffer").value = null), e3 = true), o3 && (t2.get("overlayBuffer").value = i3.map), e3;
    }
    updateShadow() {
      let e3 = false;
      const { uniforms: t2, defines: r4, shadow: i3 } = this, a3 = r4.has("HAS_SHADOW"), o3 = i3 != null;
      if (o3 !== a3 && (o3 ? r4.set("HAS_SHADOW", "1") : (r4.delete("HAS_SHADOW"), t2.get("shadowBuffer").value = null), e3 = true), o3) {
        const c3 = r4.get("SHADOW_CASCADE_COUNT"), s = `${i3.cascadeCount}`;
        c3 !== s && (r4.set("SHADOW_CASCADE_COUNT", i3.cascadeCount.toFixed(0)), e3 = true), t2.get("shadowBuffer").value = i3.map, t2.get("shadowMapSize").value = i3.mapSize, t2.get("shadowIntervals").value = i3.intervals, t2.get("shadowMatrices").value = i3.matrices, t2.get("inverseShadowMatrices").value = i3.inverseMatrices, t2.get("shadowFar").value = i3.far, t2.get("shadowTopHeight").value = i3.topHeight;
      }
      return e3;
    }
    updateShadowLength() {
      let e3 = false;
      const { uniforms: t2, defines: r4, shadowLength: i3 } = this, a3 = r4.has("HAS_SHADOW_LENGTH"), o3 = i3 != null;
      return o3 !== a3 && (o3 ? r4.set("HAS_SHADOW_LENGTH", "1") : (r4.delete("HAS_SHADOW_LENGTH"), t2.get("shadowLengthBuffer").value = null), e3 = true), o3 && (t2.get("shadowLengthBuffer").value = i3.map), e3;
    }
    updateLightingMask() {
      let e3 = false;
      const { uniforms: t2, defines: r4, lightingMask: i3 } = this, a3 = r4.has("HAS_LIGHTING_MASK"), o3 = i3 != null;
      if (o3 !== a3 && (o3 ? r4.set("HAS_LIGHTING_MASK", "1") : (r4.delete("HAS_LIGHTING_MASK"), t2.get("lightingMaskBuffer").value = null), e3 = true), o3) {
        t2.get("lightingMaskBuffer").value = i3.map;
        const c3 = r4.get("LIGHTING_MASK_CHANNEL"), s = i3.channel;
        s !== c3 && (/^[rgba]$/.test(s) ? (r4.set("LIGHTING_MASK_CHANNEL", s), e3 = true) : console.error(`Expression validation failed: ${s}`));
      }
      return e3;
    }
    update(e3, t2, r4) {
      this.copyCameraSettings(this.camera);
      let i3 = false;
      i3 || (i3 = this.updateOverlay()), i3 || (i3 = this.updateShadow()), i3 || (i3 = this.updateShadowLength()), i3 || (i3 = this.updateLightingMask()), i3 && this.setChanged(), ++this.uniforms.get("frame").value;
    }
    get normalBuffer() {
      return this.uniforms.get("normalBuffer").value;
    }
    set normalBuffer(e3) {
      this.uniforms.get("normalBuffer").value = e3, this.hasNormals = e3 != null;
    }
    get irradianceTexture() {
      return this.uniforms.get("irradiance_texture").value;
    }
    set irradianceTexture(e3) {
      this.uniforms.get("irradiance_texture").value = e3;
    }
    get scatteringTexture() {
      return this.uniforms.get("scattering_texture").value;
    }
    set scatteringTexture(e3) {
      this.uniforms.get("scattering_texture").value = e3;
    }
    get transmittanceTexture() {
      return this.uniforms.get("transmittance_texture").value;
    }
    set transmittanceTexture(e3) {
      this.uniforms.get("transmittance_texture").value = e3;
    }
    get singleMieScatteringTexture() {
      return this.uniforms.get("single_mie_scattering_texture").value;
    }
    set singleMieScatteringTexture(e3) {
      this.uniforms.get("single_mie_scattering_texture").value = e3, this.combinedScatteringTextures = e3 == null;
    }
    get higherOrderScatteringTexture() {
      return this.uniforms.get("higher_order_scattering_texture").value;
    }
    set higherOrderScatteringTexture(e3) {
      this.uniforms.get("higher_order_scattering_texture").value = e3, this.hasHigherOrderScatteringTexture = e3 != null;
    }
    get ellipsoid() {
      return this._ellipsoid;
    }
    set ellipsoid(e3) {
      this._ellipsoid = e3, this.uniforms.get("ellipsoidRadii").value.copy(e3.radii);
    }
    get worldToECEFMatrix() {
      return this.uniforms.get("worldToECEFMatrix").value;
    }
    get sunDirection() {
      return this.uniforms.get("sunDirection").value;
    }
    get albedoScale() {
      return this.uniforms.get("albedoScale").value;
    }
    set albedoScale(e3) {
      this.uniforms.get("albedoScale").value = e3;
    }
    get moonDirection() {
      return this.uniforms.get("moonDirection").value;
    }
    get moonAngularRadius() {
      return this.uniforms.get("moonAngularRadius").value;
    }
    set moonAngularRadius(e3) {
      this.uniforms.get("moonAngularRadius").value = e3;
    }
    get lunarRadianceScale() {
      return this.uniforms.get("lunarRadianceScale").value;
    }
    set lunarRadianceScale(e3) {
      this.uniforms.get("lunarRadianceScale").value = e3;
    }
    get stbnTexture() {
      return this.uniforms.get("stbnTexture").value;
    }
    set stbnTexture(e3) {
      this.uniforms.get("stbnTexture").value = e3;
    }
    get shadowRadius() {
      return this.uniforms.get("shadowRadius").value;
    }
    set shadowRadius(e3) {
      this.uniforms.get("shadowRadius").value = e3;
    }
  };
  L2([
    Vr("OCT_ENCODED_NORMAL")
  ], H3.prototype, "octEncodedNormal");
  L2([
    Vr("RECONSTRUCT_NORMAL")
  ], H3.prototype, "reconstructNormal");
  L2([
    Vr("HAS_NORMALS")
  ], H3.prototype, "hasNormals");
  L2([
    Vr("COMBINED_SCATTERING_TEXTURES")
  ], H3.prototype, "combinedScatteringTextures");
  L2([
    Vr("HAS_HIGHER_ORDER_SCATTERING_TEXTURE")
  ], H3.prototype, "hasHigherOrderScatteringTexture");
  L2([
    Vr("CORRECT_GEOMETRIC_ERROR")
  ], H3.prototype, "correctGeometricError");
  L2([
    Vr("SUN_LIGHT")
  ], H3.prototype, "sunLight");
  L2([
    Vr("SKY_LIGHT")
  ], H3.prototype, "skyLight");
  L2([
    Vr("TRANSMITTANCE")
  ], H3.prototype, "transmittance");
  L2([
    Vr("INSCATTER")
  ], H3.prototype, "inscatter");
  L2([
    Vr("SKY")
  ], H3.prototype, "sky");
  L2([
    Vr("SUN")
  ], H3.prototype, "sun");
  L2([
    Vr("MOON")
  ], H3.prototype, "moon");
  L2([
    Vr("GROUND")
  ], H3.prototype, "ground");
  L2([
    Yr("SHADOW_SAMPLE_COUNT", { min: 1, max: 16 })
  ], H3.prototype, "shadowSampleCount");
  var $n2 = Object.defineProperty;
  var Dt2 = (n4, e3, t2, r4) => {
    for (var i3 = void 0, a3 = n4.length - 1, o3; a3 >= 0; a3--)
      (o3 = n4[a3]) && (i3 = o3(e3, t2, i3) || i3);
    return i3 && $n2(e3, t2, i3), i3;
  };
  var qn2 = /* @__PURE__ */ new Vector3();
  function Zn2(n4, e3) {
    let t2 = "", r4 = "";
    for (let i3 = 1; i3 < e3; ++i3)
      t2 += `layout(location = ${i3}) out float renderTarget${i3};
`, r4 += `renderTarget${i3} = 0.0;
`;
    return n4.replace("#include <mrt_layout>", t2).replace("#include <mrt_output>", r4);
  }
  var Be2 = {
    ellipsoid: N.WGS84,
    correctAltitude: true,
    renderTargetCount: 1
  };
  var se2 = class extends RawShaderMaterial {
    constructor(e3, t2 = n0.DEFAULT) {
      var _a2;
      const {
        irradianceTexture: r4 = null,
        scatteringTexture: i3 = null,
        transmittanceTexture: a3 = null,
        singleMieScatteringTexture: o3 = null,
        higherOrderScatteringTexture: c3 = null,
        ellipsoid: s,
        correctAltitude: l3,
        sunDirection: d3,
        sunAngularRadius: m4,
        renderTargetCount: f4,
        ...v3
      } = { ...Be2, ...e3 };
      super({
        toneMapped: false,
        depthWrite: false,
        depthTest: false,
        ...v3,
        // prettier-ignore
        uniforms: {
          cameraPosition: new Uniform(new Vector3()),
          worldToECEFMatrix: new Uniform(new Matrix4()),
          altitudeCorrection: new Uniform(new Vector3()),
          sunDirection: new Uniform((_a2 = d3 == null ? void 0 : d3.clone()) != null ? _a2 : new Vector3()),
          // Uniforms for atmosphere functions
          ATMOSPHERE: t2.toUniform(),
          SUN_SPECTRAL_RADIANCE_TO_LUMINANCE: new Uniform(t2.sunRadianceToRelativeLuminance),
          SKY_SPECTRAL_RADIANCE_TO_LUMINANCE: new Uniform(t2.skyRadianceToRelativeLuminance),
          irradiance_texture: new Uniform(r4),
          scattering_texture: new Uniform(i3),
          transmittance_texture: new Uniform(a3),
          single_mie_scattering_texture: new Uniform(null),
          higher_order_scattering_texture: new Uniform(null),
          ...v3.uniforms
        },
        defines: {
          PI: `${Math.PI}`,
          TRANSMITTANCE_TEXTURE_WIDTH: C3.toFixed(0),
          TRANSMITTANCE_TEXTURE_HEIGHT: p2.toFixed(0),
          SCATTERING_TEXTURE_R_SIZE: i2.toFixed(0),
          SCATTERING_TEXTURE_MU_SIZE: _2.toFixed(0),
          SCATTERING_TEXTURE_MU_S_SIZE: R3.toFixed(0),
          SCATTERING_TEXTURE_NU_SIZE: u3.toFixed(0),
          IRRADIANCE_TEXTURE_WIDTH: f2.toFixed(0),
          IRRADIANCE_TEXTURE_HEIGHT: A3.toFixed(0),
          METER_TO_LENGTH_UNIT: w2.toFixed(7),
          ...v3.defines
        }
      }), this.atmosphere = t2, this.combinedScatteringTextures = false, this.hasHigherOrderScatteringTexture = false, this.singleMieScatteringTexture = o3, this.higherOrderScatteringTexture = c3, this.ellipsoid = s, this.correctAltitude = l3, m4 != null && (this.sunAngularRadius = m4), this.renderTargetCount = f4;
    }
    copyCameraSettings(e3) {
      const t2 = this.uniforms, r4 = e3.getWorldPosition(
        t2.cameraPosition.value
      ), i3 = qn2.copy(r4).applyMatrix4(t2.worldToECEFMatrix.value), a3 = t2.altitudeCorrection.value;
      this.correctAltitude ? X(
        i3,
        this.atmosphere.bottomRadius,
        this.ellipsoid,
        a3
      ) : a3.setScalar(0);
    }
    onBeforeCompile(e3, t2) {
      e3.fragmentShader = Zn2(
        e3.fragmentShader,
        this.renderTargetCount
      );
    }
    onBeforeRender(e3, t2, r4, i3, a3, o3) {
      this.copyCameraSettings(r4);
    }
    get irradianceTexture() {
      return this.uniforms.irradiance_texture.value;
    }
    set irradianceTexture(e3) {
      this.uniforms.irradiance_texture.value = e3;
    }
    get scatteringTexture() {
      return this.uniforms.scattering_texture.value;
    }
    set scatteringTexture(e3) {
      this.uniforms.scattering_texture.value = e3;
    }
    get transmittanceTexture() {
      return this.uniforms.transmittance_texture.value;
    }
    set transmittanceTexture(e3) {
      this.uniforms.transmittance_texture.value = e3;
    }
    get singleMieScatteringTexture() {
      return this.uniforms.single_mie_scattering_texture.value;
    }
    set singleMieScatteringTexture(e3) {
      this.uniforms.single_mie_scattering_texture.value = e3, this.combinedScatteringTextures = e3 == null;
    }
    get higherOrderScatteringTexture() {
      return this.uniforms.higher_order_scattering_texture.value;
    }
    set higherOrderScatteringTexture(e3) {
      this.uniforms.higher_order_scattering_texture.value = e3, this.hasHigherOrderScatteringTexture = e3 != null;
    }
    get worldToECEFMatrix() {
      return this.uniforms.worldToECEFMatrix.value;
    }
    get sunDirection() {
      return this.uniforms.sunDirection.value;
    }
    get sunAngularRadius() {
      return this.uniforms.ATMOSPHERE.value.sun_angular_radius;
    }
    set sunAngularRadius(e3) {
      this.uniforms.ATMOSPHERE.value.sun_angular_radius = e3;
    }
    /** @package */
    get renderTargetCount() {
      return this._renderTargetCount;
    }
    /** @package */
    set renderTargetCount(e3) {
      e3 !== this.renderTargetCount && (this._renderTargetCount = e3, this.needsUpdate = true);
    }
  };
  Dt2([
    Vr("COMBINED_SCATTERING_TEXTURES")
  ], se2.prototype, "combinedScatteringTextures");
  Dt2([
    Vr("HAS_HIGHER_ORDER_SCATTERING_TEXTURE")
  ], se2.prototype, "hasHigherOrderScatteringTexture");
  var Jn2 = 173.1446326846693;
  var It2 = 14959787069098932e-8;
  var g4 = 0.017453292519943295;
  var at2 = 57.29577951308232;
  var Qn2 = 365.24217;
  var ot = /* @__PURE__ */ new Date("2000-01-01T12:00:00Z");
  var X2 = 2 * Math.PI;
  var e0 = 3600 * (180 / Math.PI);
  var x0 = 484813681109536e-20;
  var er2 = 10800 * 60;
  var tr2 = 2 * er2;
  var nr2 = 6378.1366;
  var rr2 = nr2 / It2;
  var ir2 = 81.30056;
  var We = 2959122082855911e-19;
  var xe2 = 2825345909524226e-22;
  var Me2 = 8459715185680659e-23;
  var Ae = 1292024916781969e-23;
  var we2 = 1524358900784276e-23;
  function l0(n4) {
    if (!Number.isFinite(n4))
      throw console.trace(), `Value is not a finite number: ${n4}`;
    return n4;
  }
  function E0(n4) {
    return n4 - Math.floor(n4);
  }
  var S3;
  (function(n4) {
    n4.Sun = "Sun", n4.Moon = "Moon", n4.Mercury = "Mercury", n4.Venus = "Venus", n4.Earth = "Earth", n4.Mars = "Mars", n4.Jupiter = "Jupiter", n4.Saturn = "Saturn", n4.Uranus = "Uranus", n4.Neptune = "Neptune", n4.Pluto = "Pluto", n4.SSB = "SSB", n4.EMB = "EMB", n4.Star1 = "Star1", n4.Star2 = "Star2", n4.Star3 = "Star3", n4.Star4 = "Star4", n4.Star5 = "Star5", n4.Star6 = "Star6", n4.Star7 = "Star7", n4.Star8 = "Star8";
  })(S3 || (S3 = {}));
  var ar2 = [
    S3.Star1,
    S3.Star2,
    S3.Star3,
    S3.Star4,
    S3.Star5,
    S3.Star6,
    S3.Star7,
    S3.Star8
  ];
  var or2 = [
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 },
    { ra: 0, dec: 0, dist: 0 }
  ];
  function sr2(n4) {
    const e3 = ar2.indexOf(n4);
    return e3 >= 0 ? or2[e3] : null;
  }
  function Pt(n4) {
    const e3 = sr2(n4);
    return e3 && e3.dist > 0 ? e3 : null;
  }
  var V;
  (function(n4) {
    n4[n4.From2000 = 0] = "From2000", n4[n4.Into2000 = 1] = "Into2000";
  })(V || (V = {}));
  var M0 = {
    Mercury: [
      [
        [
          [4.40250710144, 0, 0],
          [0.40989414977, 1.48302034195, 26087.9031415742],
          [0.050462942, 4.47785489551, 52175.8062831484],
          [0.00855346844, 1.16520322459, 78263.70942472259],
          [0.00165590362, 4.11969163423, 104351.61256629678],
          [34561897e-11, 0.77930768443, 130439.51570787099],
          [7583476e-11, 3.71348404924, 156527.41884944518]
        ],
        [
          [26087.90313685529, 0, 0],
          [0.01131199811, 6.21874197797, 26087.9031415742],
          [0.00292242298, 3.04449355541, 52175.8062831484],
          [75775081e-11, 6.08568821653, 78263.70942472259],
          [19676525e-11, 2.80965111777, 104351.61256629678]
        ]
      ],
      [
        [
          [0.11737528961, 1.98357498767, 26087.9031415742],
          [0.02388076996, 5.03738959686, 52175.8062831484],
          [0.01222839532, 3.14159265359, 0],
          [0.0054325181, 1.79644363964, 78263.70942472259],
          [0.0012977877, 4.83232503958, 104351.61256629678],
          [31866927e-11, 1.58088495658, 130439.51570787099],
          [7963301e-11, 4.60972126127, 156527.41884944518]
        ],
        [
          [0.00274646065, 3.95008450011, 26087.9031415742],
          [99737713e-11, 3.14159265359, 0]
        ]
      ],
      [
        [
          [0.39528271651, 0, 0],
          [0.07834131818, 6.19233722598, 26087.9031415742],
          [0.00795525558, 2.95989690104, 52175.8062831484],
          [0.00121281764, 6.01064153797, 78263.70942472259],
          [21921969e-11, 2.77820093972, 104351.61256629678],
          [4354065e-11, 5.82894543774, 130439.51570787099]
        ],
        [
          [0.0021734774, 4.65617158665, 26087.9031415742],
          [44141826e-11, 1.42385544001, 52175.8062831484]
        ]
      ]
    ],
    Venus: [
      [
        [
          [3.17614666774, 0, 0],
          [0.01353968419, 5.59313319619, 10213.285546211],
          [89891645e-11, 5.30650047764, 20426.571092422],
          [5477194e-11, 4.41630661466, 7860.4193924392],
          [3455741e-11, 2.6996444782, 11790.6290886588],
          [2372061e-11, 2.99377542079, 3930.2096962196],
          [1317168e-11, 5.18668228402, 26.2983197998],
          [1664146e-11, 4.25018630147, 1577.3435424478],
          [1438387e-11, 4.15745084182, 9683.5945811164],
          [1200521e-11, 6.15357116043, 30639.856638633]
        ],
        [
          [10213.28554621638, 0, 0],
          [95617813e-11, 2.4640651111, 10213.285546211],
          [7787201e-11, 0.6247848222, 20426.571092422]
        ]
      ],
      [
        [
          [0.05923638472, 0.26702775812, 10213.285546211],
          [40107978e-11, 1.14737178112, 20426.571092422],
          [32814918e-11, 3.14159265359, 0]
        ],
        [
          [0.00287821243, 1.88964962838, 10213.285546211]
        ]
      ],
      [
        [
          [0.72334820891, 0, 0],
          [0.00489824182, 4.02151831717, 10213.285546211],
          [1658058e-11, 4.90206728031, 20426.571092422],
          [1378043e-11, 1.12846591367, 11790.6290886588],
          [1632096e-11, 2.84548795207, 7860.4193924392],
          [498395e-11, 2.58682193892, 9683.5945811164],
          [221985e-11, 2.01346696541, 19367.1891622328],
          [237454e-11, 2.55136053886, 15720.8387848784]
        ],
        [
          [34551041e-11, 0.89198706276, 10213.285546211]
        ]
      ]
    ],
    Earth: [
      [
        [
          [1.75347045673, 0, 0],
          [0.03341656453, 4.66925680415, 6283.0758499914],
          [34894275e-11, 4.62610242189, 12566.1516999828],
          [3417572e-11, 2.82886579754, 3.523118349],
          [3497056e-11, 2.74411783405, 5753.3848848968],
          [3135899e-11, 3.62767041756, 77713.7714681205],
          [2676218e-11, 4.41808345438, 7860.4193924392],
          [2342691e-11, 6.13516214446, 3930.2096962196],
          [1273165e-11, 2.03709657878, 529.6909650946],
          [1324294e-11, 0.74246341673, 11506.7697697936],
          [901854e-11, 2.04505446477, 26.2983197998],
          [1199167e-11, 1.10962946234, 1577.3435424478],
          [857223e-11, 3.50849152283, 398.1490034082],
          [779786e-11, 1.17882681962, 5223.6939198022],
          [99025e-10, 5.23268072088, 5884.9268465832],
          [753141e-11, 2.53339052847, 5507.5532386674],
          [505267e-11, 4.58292599973, 18849.2275499742],
          [492392e-11, 4.20505711826, 775.522611324],
          [356672e-11, 2.91954114478, 0.0673103028],
          [284125e-11, 1.89869240932, 796.2980068164],
          [242879e-11, 0.34481445893, 5486.777843175],
          [317087e-11, 5.84901948512, 11790.6290886588],
          [271112e-11, 0.31486255375, 10977.078804699],
          [206217e-11, 4.80646631478, 2544.3144198834],
          [205478e-11, 1.86953770281, 5573.1428014331],
          [202318e-11, 2.45767790232, 6069.7767545534],
          [126225e-11, 1.08295459501, 20.7753954924],
          [155516e-11, 0.83306084617, 213.299095438]
        ],
        [
          [6283.0758499914, 0, 0],
          [0.00206058863, 2.67823455808, 6283.0758499914],
          [4303419e-11, 2.63512233481, 12566.1516999828]
        ],
        [
          [8721859e-11, 1.07253635559, 6283.0758499914]
        ]
      ],
      [
        [],
        [
          [0.00227777722, 3.4137662053, 6283.0758499914],
          [3805678e-11, 3.37063423795, 12566.1516999828]
        ]
      ],
      [
        [
          [1.00013988784, 0, 0],
          [0.01670699632, 3.09846350258, 6283.0758499914],
          [13956024e-11, 3.05524609456, 12566.1516999828],
          [308372e-10, 5.19846674381, 77713.7714681205],
          [1628463e-11, 1.17387558054, 5753.3848848968],
          [1575572e-11, 2.84685214877, 7860.4193924392],
          [924799e-11, 5.45292236722, 11506.7697697936],
          [542439e-11, 4.56409151453, 3930.2096962196],
          [47211e-10, 3.66100022149, 5884.9268465832],
          [85831e-11, 1.27079125277, 161000.6857376741],
          [57056e-11, 2.01374292245, 83996.84731811189],
          [55736e-11, 5.2415979917, 71430.69561812909],
          [174844e-11, 3.01193636733, 18849.2275499742],
          [243181e-11, 4.2734953079, 11790.6290886588]
        ],
        [
          [0.00103018607, 1.10748968172, 6283.0758499914],
          [1721238e-11, 1.06442300386, 12566.1516999828]
        ],
        [
          [4359385e-11, 5.78455133808, 6283.0758499914]
        ]
      ]
    ],
    Mars: [
      [
        [
          [6.20347711581, 0, 0],
          [0.18656368093, 5.0503710027, 3340.6124266998],
          [0.01108216816, 5.40099836344, 6681.2248533996],
          [91798406e-11, 5.75478744667, 10021.8372800994],
          [27744987e-11, 5.97049513147, 3.523118349],
          [10610235e-11, 2.93958560338, 2281.2304965106],
          [12315897e-11, 0.84956094002, 2810.9214616052],
          [8926784e-11, 4.15697846427, 0.0172536522],
          [8715691e-11, 6.11005153139, 13362.4497067992],
          [6797556e-11, 0.36462229657, 398.1490034082],
          [7774872e-11, 3.33968761376, 5621.8429232104],
          [3575078e-11, 1.6618650571, 2544.3144198834],
          [4161108e-11, 0.22814971327, 2942.4634232916],
          [3075252e-11, 0.85696614132, 191.4482661116],
          [2628117e-11, 0.64806124465, 3337.0893083508],
          [2937546e-11, 6.07893711402, 0.0673103028],
          [2389414e-11, 5.03896442664, 796.2980068164],
          [2579844e-11, 0.02996736156, 3344.1355450488],
          [1528141e-11, 1.14979301996, 6151.533888305],
          [1798806e-11, 0.65634057445, 529.6909650946],
          [1264357e-11, 3.62275122593, 5092.1519581158],
          [1286228e-11, 3.06796065034, 2146.1654164752],
          [1546404e-11, 2.91579701718, 1751.539531416],
          [1024902e-11, 3.69334099279, 8962.4553499102],
          [891566e-11, 0.18293837498, 16703.062133499],
          [858759e-11, 2.4009381194, 2914.0142358238],
          [832715e-11, 2.46418619474, 3340.5951730476],
          [83272e-10, 4.49495782139, 3340.629680352],
          [712902e-11, 3.66335473479, 1059.3819301892],
          [748723e-11, 3.82248614017, 155.4203994342],
          [723861e-11, 0.67497311481, 3738.761430108],
          [635548e-11, 2.92182225127, 8432.7643848156],
          [655162e-11, 0.48864064125, 3127.3133312618],
          [550474e-11, 3.81001042328, 0.9803210682],
          [55275e-10, 4.47479317037, 1748.016413067],
          [425966e-11, 0.55364317304, 6283.0758499914],
          [415131e-11, 0.49662285038, 213.299095438],
          [472167e-11, 3.62547124025, 1194.4470102246],
          [306551e-11, 0.38052848348, 6684.7479717486],
          [312141e-11, 0.99853944405, 6677.7017350506],
          [293198e-11, 4.22131299634, 20.7753954924],
          [302375e-11, 4.48618007156, 3532.0606928114],
          [274027e-11, 0.54222167059, 3340.545116397],
          [281079e-11, 5.88163521788, 1349.8674096588],
          [231183e-11, 1.28242156993, 3870.3033917944],
          [283602e-11, 5.7688543494, 3149.1641605882],
          [236117e-11, 5.75503217933, 3333.498879699],
          [274033e-11, 0.13372524985, 3340.6797370026],
          [299395e-11, 2.78323740866, 6254.6266625236]
        ],
        [
          [3340.61242700512, 0, 0],
          [0.01457554523, 3.60433733236, 3340.6124266998],
          [0.00168414711, 3.92318567804, 6681.2248533996],
          [20622975e-11, 4.26108844583, 10021.8372800994],
          [3452392e-11, 4.7321039319, 3.523118349],
          [2586332e-11, 4.60670058555, 13362.4497067992],
          [841535e-11, 4.45864030426, 2281.2304965106]
        ],
        [
          [58152577e-11, 2.04961712429, 3340.6124266998],
          [13459579e-11, 2.45738706163, 6681.2248533996]
        ]
      ],
      [
        [
          [0.03197134986, 3.76832042431, 3340.6124266998],
          [0.00298033234, 4.10616996305, 6681.2248533996],
          [0.00289104742, 0, 0],
          [31365539e-11, 4.4465105309, 10021.8372800994],
          [34841e-9, 4.7881254926, 13362.4497067992]
        ],
        [
          [0.00217310991, 6.04472194776, 3340.6124266998],
          [20976948e-11, 3.14159265359, 0],
          [12834709e-11, 1.60810667915, 6681.2248533996]
        ]
      ],
      [
        [
          [1.53033488271, 0, 0],
          [0.1418495316, 3.47971283528, 3340.6124266998],
          [0.00660776362, 3.81783443019, 6681.2248533996],
          [46179117e-11, 4.15595316782, 10021.8372800994],
          [8109733e-11, 5.55958416318, 2810.9214616052],
          [7485318e-11, 1.77239078402, 5621.8429232104],
          [5523191e-11, 1.3643630377, 2281.2304965106],
          [382516e-10, 4.49407183687, 13362.4497067992],
          [2306537e-11, 0.09081579001, 2544.3144198834],
          [1999396e-11, 5.36059617709, 3337.0893083508],
          [2484394e-11, 4.9254563992, 2942.4634232916],
          [1960195e-11, 4.74249437639, 3344.1355450488],
          [1167119e-11, 2.11260868341, 5092.1519581158],
          [1102816e-11, 5.00908403998, 398.1490034082],
          [899066e-11, 4.40791133207, 529.6909650946],
          [992252e-11, 5.83861961952, 6151.533888305],
          [807354e-11, 2.10217065501, 1059.3819301892],
          [797915e-11, 3.44839203899, 796.2980068164],
          [740975e-11, 1.49906336885, 2146.1654164752]
        ],
        [
          [0.01107433345, 2.03250524857, 3340.6124266998],
          [0.00103175887, 2.37071847807, 6681.2248533996],
          [128772e-9, 0, 0],
          [1081588e-10, 2.70888095665, 10021.8372800994]
        ],
        [
          [44242249e-11, 0.47930604954, 3340.6124266998],
          [8138042e-11, 0.86998389204, 6681.2248533996]
        ]
      ]
    ],
    Jupiter: [
      [
        [
          [0.59954691494, 0, 0],
          [0.09695898719, 5.06191793158, 529.6909650946],
          [0.00573610142, 1.44406205629, 7.1135470008],
          [0.00306389205, 5.41734730184, 1059.3819301892],
          [97178296e-11, 4.14264726552, 632.7837393132],
          [72903078e-11, 3.64042916389, 522.5774180938],
          [64263975e-11, 3.41145165351, 103.0927742186],
          [39806064e-11, 2.29376740788, 419.4846438752],
          [38857767e-11, 1.27231755835, 316.3918696566],
          [27964629e-11, 1.7845459182, 536.8045120954],
          [1358973e-10, 5.7748104079, 1589.0728952838],
          [8246349e-11, 3.5822792584, 206.1855484372],
          [8768704e-11, 3.63000308199, 949.1756089698],
          [7368042e-11, 5.0810119427, 735.8765135318],
          [626315e-10, 0.02497628807, 213.299095438],
          [6114062e-11, 4.51319998626, 1162.4747044078],
          [4905396e-11, 1.32084470588, 110.2063212194],
          [5305285e-11, 1.30671216791, 14.2270940016],
          [5305441e-11, 4.18625634012, 1052.2683831884],
          [4647248e-11, 4.69958103684, 3.9321532631],
          [3045023e-11, 4.31676431084, 426.598190876],
          [2609999e-11, 1.56667394063, 846.0828347512],
          [2028191e-11, 1.06376530715, 3.1813937377],
          [1764763e-11, 2.14148655117, 1066.49547719],
          [1722972e-11, 3.88036268267, 1265.5674786264],
          [1920945e-11, 0.97168196472, 639.897286314],
          [1633223e-11, 3.58201833555, 515.463871093],
          [1431999e-11, 4.29685556046, 625.6701923124],
          [973272e-11, 4.09764549134, 95.9792272178]
        ],
        [
          [529.69096508814, 0, 0],
          [0.00489503243, 4.2208293947, 529.6909650946],
          [0.00228917222, 6.02646855621, 7.1135470008],
          [30099479e-11, 4.54540782858, 1059.3819301892],
          [2072092e-10, 5.45943156902, 522.5774180938],
          [12103653e-11, 0.16994816098, 536.8045120954],
          [6067987e-11, 4.42422292017, 103.0927742186],
          [5433968e-11, 3.98480737746, 419.4846438752],
          [4237744e-11, 5.89008707199, 14.2270940016]
        ],
        [
          [47233601e-11, 4.32148536482, 7.1135470008],
          [30649436e-11, 2.929777887, 529.6909650946],
          [14837605e-11, 3.14159265359, 0]
        ]
      ],
      [
        [
          [0.02268615702, 3.55852606721, 529.6909650946],
          [0.00109971634, 3.90809347197, 1059.3819301892],
          [0.00110090358, 0, 0],
          [8101428e-11, 3.60509572885, 522.5774180938],
          [6043996e-11, 4.25883108339, 1589.0728952838],
          [6437782e-11, 0.30627119215, 536.8045120954]
        ],
        [
          [78203446e-11, 1.52377859742, 529.6909650946]
        ]
      ],
      [
        [
          [5.20887429326, 0, 0],
          [0.25209327119, 3.49108639871, 529.6909650946],
          [0.00610599976, 3.84115365948, 1059.3819301892],
          [0.00282029458, 2.57419881293, 632.7837393132],
          [0.00187647346, 2.07590383214, 522.5774180938],
          [86792905e-11, 0.71001145545, 419.4846438752],
          [72062974e-11, 0.21465724607, 536.8045120954],
          [65517248e-11, 5.9799588479, 316.3918696566],
          [29134542e-11, 1.67759379655, 103.0927742186],
          [30135335e-11, 2.16132003734, 949.1756089698],
          [23453271e-11, 3.54023522184, 735.8765135318],
          [22283743e-11, 4.19362594399, 1589.0728952838],
          [23947298e-11, 0.2745803748, 7.1135470008],
          [13032614e-11, 2.96042965363, 1162.4747044078],
          [970336e-10, 1.90669633585, 206.1855484372],
          [12749023e-11, 2.71550286592, 1052.2683831884],
          [7057931e-11, 2.18184839926, 1265.5674786264],
          [6137703e-11, 6.26418240033, 846.0828347512],
          [2616976e-11, 2.00994012876, 1581.959348283]
        ],
        [
          [0.0127180152, 2.64937512894, 529.6909650946],
          [61661816e-11, 3.00076460387, 1059.3819301892],
          [53443713e-11, 3.89717383175, 522.5774180938],
          [31185171e-11, 4.88276958012, 536.8045120954],
          [41390269e-11, 0, 0]
        ]
      ]
    ],
    Saturn: [
      [
        [
          [0.87401354025, 0, 0],
          [0.11107659762, 3.96205090159, 213.299095438],
          [0.01414150957, 4.58581516874, 7.1135470008],
          [0.00398379389, 0.52112032699, 206.1855484372],
          [0.00350769243, 3.30329907896, 426.598190876],
          [0.00206816305, 0.24658372002, 103.0927742186],
          [792713e-9, 3.84007056878, 220.4126424388],
          [23990355e-11, 4.66976924553, 110.2063212194],
          [16573588e-11, 0.43719228296, 419.4846438752],
          [14906995e-11, 5.76903183869, 316.3918696566],
          [1582029e-10, 0.93809155235, 632.7837393132],
          [14609559e-11, 1.56518472, 3.9321532631],
          [13160301e-11, 4.44891291899, 14.2270940016],
          [15053543e-11, 2.71669915667, 639.897286314],
          [13005299e-11, 5.98119023644, 11.0457002639],
          [10725067e-11, 3.12939523827, 202.2533951741],
          [5863206e-11, 0.23656938524, 529.6909650946],
          [5227757e-11, 4.20783365759, 3.1813937377],
          [6126317e-11, 1.76328667907, 277.0349937414],
          [5019687e-11, 3.17787728405, 433.7117378768],
          [459255e-10, 0.61977744975, 199.0720014364],
          [4005867e-11, 2.24479718502, 63.7358983034],
          [2953796e-11, 0.98280366998, 95.9792272178],
          [387367e-10, 3.22283226966, 138.5174968707],
          [2461186e-11, 2.03163875071, 735.8765135318],
          [3269484e-11, 0.77492638211, 949.1756089698],
          [1758145e-11, 3.2658010994, 522.5774180938],
          [1640172e-11, 5.5050445305, 846.0828347512],
          [1391327e-11, 4.02333150505, 323.5054166574],
          [1580648e-11, 4.37265307169, 309.2783226558],
          [1123498e-11, 2.83726798446, 415.5524906121],
          [1017275e-11, 3.71700135395, 227.5261894396],
          [848642e-11, 3.1915017083, 209.3669421749]
        ],
        [
          [213.2990952169, 0, 0],
          [0.01297370862, 1.82834923978, 213.299095438],
          [0.00564345393, 2.88499717272, 7.1135470008],
          [93734369e-11, 1.06311793502, 426.598190876],
          [0.00107674962, 2.27769131009, 206.1855484372],
          [40244455e-11, 2.04108104671, 220.4126424388],
          [19941774e-11, 1.2795439047, 103.0927742186],
          [10511678e-11, 2.7488034213, 14.2270940016],
          [6416106e-11, 0.38238295041, 639.897286314],
          [4848994e-11, 2.43037610229, 419.4846438752],
          [4056892e-11, 2.92133209468, 110.2063212194],
          [3768635e-11, 3.6496533078, 3.9321532631]
        ],
        [
          [0.0011644133, 1.17988132879, 7.1135470008],
          [91841837e-11, 0.0732519584, 213.299095438],
          [36661728e-11, 0, 0],
          [15274496e-11, 4.06493179167, 206.1855484372]
        ]
      ],
      [
        [
          [0.04330678039, 3.60284428399, 213.299095438],
          [0.00240348302, 2.85238489373, 426.598190876],
          [84745939e-11, 0, 0],
          [30863357e-11, 3.48441504555, 220.4126424388],
          [34116062e-11, 0.57297307557, 206.1855484372],
          [1473407e-10, 2.11846596715, 639.897286314],
          [9916667e-11, 5.79003188904, 419.4846438752],
          [6993564e-11, 4.7360468972, 7.1135470008],
          [4807588e-11, 5.43305312061, 316.3918696566]
        ],
        [
          [0.00198927992, 4.93901017903, 213.299095438],
          [36947916e-11, 3.14159265359, 0],
          [17966989e-11, 0.5197943111, 426.598190876]
        ]
      ],
      [
        [
          [9.55758135486, 0, 0],
          [0.52921382865, 2.39226219573, 213.299095438],
          [0.01873679867, 5.2354960466, 206.1855484372],
          [0.01464663929, 1.64763042902, 426.598190876],
          [0.00821891141, 5.93520042303, 316.3918696566],
          [0.00547506923, 5.0153261898, 103.0927742186],
          [0.0037168465, 2.27114821115, 220.4126424388],
          [0.00361778765, 3.13904301847, 7.1135470008],
          [0.00140617506, 5.70406606781, 632.7837393132],
          [0.00108974848, 3.29313390175, 110.2063212194],
          [69006962e-11, 5.94099540992, 419.4846438752],
          [61053367e-11, 0.94037691801, 639.897286314],
          [48913294e-11, 1.55733638681, 202.2533951741],
          [34143772e-11, 0.19519102597, 277.0349937414],
          [32401773e-11, 5.47084567016, 949.1756089698],
          [20936596e-11, 0.46349251129, 735.8765135318],
          [9796004e-11, 5.20477537945, 1265.5674786264],
          [11993338e-11, 5.98050967385, 846.0828347512],
          [208393e-9, 1.52102476129, 433.7117378768],
          [15298404e-11, 3.0594381494, 529.6909650946],
          [6465823e-11, 0.17732249942, 1052.2683831884],
          [11380257e-11, 1.7310542704, 522.5774180938],
          [3419618e-11, 4.94550542171, 1581.959348283]
        ],
        [
          [0.0618298134, 0.2584351148, 213.299095438],
          [0.00506577242, 0.71114625261, 206.1855484372],
          [0.00341394029, 5.79635741658, 426.598190876],
          [0.00188491195, 0.47215589652, 220.4126424388],
          [0.00186261486, 3.14159265359, 0],
          [0.00143891146, 1.40744822888, 7.1135470008]
        ],
        [
          [0.00436902572, 4.78671677509, 213.299095438]
        ]
      ]
    ],
    Uranus: [
      [
        [
          [5.48129294297, 0, 0],
          [0.09260408234, 0.89106421507, 74.7815985673],
          [0.01504247898, 3.6271926092, 1.4844727083],
          [0.00365981674, 1.89962179044, 73.297125859],
          [0.00272328168, 3.35823706307, 149.5631971346],
          [70328461e-11, 5.39254450063, 63.7358983034],
          [68892678e-11, 6.09292483287, 76.2660712756],
          [61998615e-11, 2.26952066061, 2.9689454166],
          [61950719e-11, 2.85098872691, 11.0457002639],
          [2646877e-10, 3.14152083966, 71.8126531507],
          [25710476e-11, 6.11379840493, 454.9093665273],
          [2107885e-10, 4.36059339067, 148.0787244263],
          [17818647e-11, 1.74436930289, 36.6485629295],
          [14613507e-11, 4.73732166022, 3.9321532631],
          [11162509e-11, 5.8268179635, 224.3447957019],
          [1099791e-10, 0.48865004018, 138.5174968707],
          [9527478e-11, 2.95516862826, 35.1640902212],
          [7545601e-11, 5.236265824, 109.9456887885],
          [4220241e-11, 3.23328220918, 70.8494453042],
          [40519e-9, 2.277550173, 151.0476698429],
          [3354596e-11, 1.0654900738, 4.4534181249],
          [2926718e-11, 4.62903718891, 9.5612275556],
          [349034e-10, 5.48306144511, 146.594251718],
          [3144069e-11, 4.75199570434, 77.7505439839],
          [2922333e-11, 5.35235361027, 85.8272988312],
          [2272788e-11, 4.36600400036, 70.3281804424],
          [2051219e-11, 1.51773566586, 0.1118745846],
          [2148602e-11, 0.60745949945, 38.1330356378],
          [1991643e-11, 4.92437588682, 277.0349937414],
          [1376226e-11, 2.04283539351, 65.2203710117],
          [1666902e-11, 3.62744066769, 380.12776796],
          [1284107e-11, 3.11347961505, 202.2533951741],
          [1150429e-11, 0.93343589092, 3.1813937377],
          [1533221e-11, 2.58594681212, 52.6901980395],
          [1281604e-11, 0.54271272721, 222.8603229936],
          [1372139e-11, 4.19641530878, 111.4301614968],
          [1221029e-11, 0.1990065003, 108.4612160802],
          [946181e-11, 1.19253165736, 127.4717966068],
          [1150989e-11, 4.17898916639, 33.6796175129]
        ],
        [
          [74.7815986091, 0, 0],
          [0.00154332863, 5.24158770553, 74.7815985673],
          [24456474e-11, 1.71260334156, 1.4844727083],
          [9258442e-11, 0.4282973235, 11.0457002639],
          [8265977e-11, 1.50218091379, 63.7358983034],
          [915016e-10, 1.41213765216, 149.5631971346]
        ]
      ],
      [
        [
          [0.01346277648, 2.61877810547, 74.7815985673],
          [623414e-9, 5.08111189648, 149.5631971346],
          [61601196e-11, 3.14159265359, 0],
          [9963722e-11, 1.61603805646, 76.2660712756],
          [992616e-10, 0.57630380333, 73.297125859]
        ],
        [
          [34101978e-11, 0.01321929936, 74.7815985673]
        ]
      ],
      [
        [
          [19.21264847206, 0, 0],
          [0.88784984413, 5.60377527014, 74.7815985673],
          [0.03440836062, 0.32836099706, 73.297125859],
          [0.0205565386, 1.7829515933, 149.5631971346],
          [0.0064932241, 4.52247285911, 76.2660712756],
          [0.00602247865, 3.86003823674, 63.7358983034],
          [0.00496404167, 1.40139935333, 454.9093665273],
          [0.00338525369, 1.58002770318, 138.5174968707],
          [0.00243509114, 1.57086606044, 71.8126531507],
          [0.00190522303, 1.99809394714, 1.4844727083],
          [0.00161858838, 2.79137786799, 148.0787244263],
          [0.00143706183, 1.38368544947, 11.0457002639],
          [93192405e-11, 0.17437220467, 36.6485629295],
          [71424548e-11, 4.24509236074, 224.3447957019],
          [89806014e-11, 3.66105364565, 109.9456887885],
          [39009723e-11, 1.66971401684, 70.8494453042],
          [46677296e-11, 1.39976401694, 35.1640902212],
          [39025624e-11, 3.36234773834, 277.0349937414],
          [36755274e-11, 3.88649278513, 146.594251718],
          [30348723e-11, 0.70100838798, 151.0476698429],
          [29156413e-11, 3.180563367, 77.7505439839],
          [22637073e-11, 0.72518687029, 529.6909650946],
          [11959076e-11, 1.7504339214, 984.6003316219],
          [25620756e-11, 5.25656086672, 380.12776796]
        ],
        [
          [0.01479896629, 3.67205697578, 74.7815985673]
        ]
      ]
    ],
    Neptune: [
      [
        [
          [5.31188633046, 0, 0],
          [0.0179847553, 2.9010127389, 38.1330356378],
          [0.01019727652, 0.48580922867, 1.4844727083],
          [0.00124531845, 4.83008090676, 36.6485629295],
          [42064466e-11, 5.41054993053, 2.9689454166],
          [37714584e-11, 6.09221808686, 35.1640902212],
          [33784738e-11, 1.24488874087, 76.2660712756],
          [16482741e-11, 7727998e-11, 491.5579294568],
          [9198584e-11, 4.93747051954, 39.6175083461],
          [899425e-10, 0.27462171806, 175.1660598002]
        ],
        [
          [38.13303563957, 0, 0],
          [16604172e-11, 4.86323329249, 1.4844727083],
          [15744045e-11, 2.27887427527, 38.1330356378]
        ]
      ],
      [
        [
          [0.03088622933, 1.44104372644, 38.1330356378],
          [27780087e-11, 5.91271884599, 76.2660712756],
          [27623609e-11, 0, 0],
          [15355489e-11, 2.52123799551, 36.6485629295],
          [15448133e-11, 3.50877079215, 39.6175083461]
        ]
      ],
      [
        [
          [30.07013205828, 0, 0],
          [0.27062259632, 1.32999459377, 38.1330356378],
          [0.01691764014, 3.25186135653, 36.6485629295],
          [0.00807830553, 5.18592878704, 1.4844727083],
          [0.0053776051, 4.52113935896, 35.1640902212],
          [0.00495725141, 1.5710564165, 491.5579294568],
          [0.00274571975, 1.84552258866, 175.1660598002],
          [1201232e-10, 1.92059384991, 1021.2488945514],
          [0.00121801746, 5.79754470298, 76.2660712756],
          [0.00100896068, 0.3770272493, 73.297125859],
          [0.00135134092, 3.37220609835, 39.6175083461],
          [7571796e-11, 1.07149207335, 388.4651552382]
        ]
      ]
    ]
  };
  function cr2(n4) {
    var e3, t2, r4, i3, a3, o3, c3;
    const s = 2e3 + (n4 - 14) / Qn2;
    return s < -500 ? (e3 = (s - 1820) / 100, -20 + 32 * e3 * e3) : s < 500 ? (e3 = s / 100, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, a3 = t2 * r4, o3 = r4 * r4, 10583.6 - 1014.41 * e3 + 33.78311 * t2 - 5.952053 * r4 - 0.1798452 * i3 + 0.022174192 * a3 + 0.0090316521 * o3) : s < 1600 ? (e3 = (s - 1e3) / 100, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, a3 = t2 * r4, o3 = r4 * r4, 1574.2 - 556.01 * e3 + 71.23472 * t2 + 0.319781 * r4 - 0.8503463 * i3 - 5050998e-9 * a3 + 0.0083572073 * o3) : s < 1700 ? (e3 = s - 1600, t2 = e3 * e3, r4 = e3 * t2, 120 - 0.9808 * e3 - 0.01532 * t2 + r4 / 7129) : s < 1800 ? (e3 = s - 1700, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, 8.83 + 0.1603 * e3 - 59285e-7 * t2 + 13336e-8 * r4 - i3 / 1174e3) : s < 1860 ? (e3 = s - 1800, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, a3 = t2 * r4, o3 = r4 * r4, c3 = r4 * i3, 13.72 - 0.332447 * e3 + 68612e-7 * t2 + 41116e-7 * r4 - 37436e-8 * i3 + 121272e-10 * a3 - 1699e-10 * o3 + 875e-12 * c3) : s < 1900 ? (e3 = s - 1860, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, a3 = t2 * r4, 7.62 + 0.5737 * e3 - 0.251754 * t2 + 0.01680668 * r4 - 4473624e-10 * i3 + a3 / 233174) : s < 1920 ? (e3 = s - 1900, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, -2.79 + 1.494119 * e3 - 0.0598939 * t2 + 61966e-7 * r4 - 197e-6 * i3) : s < 1941 ? (e3 = s - 1920, t2 = e3 * e3, r4 = e3 * t2, 21.2 + 0.84493 * e3 - 0.0761 * t2 + 20936e-7 * r4) : s < 1961 ? (e3 = s - 1950, t2 = e3 * e3, r4 = e3 * t2, 29.07 + 0.407 * e3 - t2 / 233 + r4 / 2547) : s < 1986 ? (e3 = s - 1975, t2 = e3 * e3, r4 = e3 * t2, 45.45 + 1.067 * e3 - t2 / 260 - r4 / 718) : s < 2005 ? (e3 = s - 2e3, t2 = e3 * e3, r4 = e3 * t2, i3 = t2 * t2, a3 = t2 * r4, 63.86 + 0.3345 * e3 - 0.060374 * t2 + 17275e-7 * r4 + 651814e-9 * i3 + 2373599e-11 * a3) : s < 2050 ? (e3 = s - 2e3, 62.92 + 0.32217 * e3 + 5589e-6 * e3 * e3) : s < 2150 ? (e3 = (s - 1820) / 100, -20 + 32 * e3 * e3 - 0.5628 * (2150 - s)) : (e3 = (s - 1820) / 100, -20 + 32 * e3 * e3);
  }
  var ur = cr2;
  function st2(n4) {
    return n4 + ur(n4) / 86400;
  }
  var t0 = class _t0 {
    /**
     * @param {FlexibleDateTime} date
     *      A JavaScript Date object, a numeric UTC value expressed in J2000 days, or another AstroTime object.
     */
    constructor(e3) {
      if (e3 instanceof _t0) {
        this.date = e3.date, this.ut = e3.ut, this.tt = e3.tt;
        return;
      }
      const t2 = 1e3 * 3600 * 24;
      if (e3 instanceof Date && Number.isFinite(e3.getTime())) {
        this.date = e3, this.ut = (e3.getTime() - ot.getTime()) / t2, this.tt = st2(this.ut);
        return;
      }
      if (Number.isFinite(e3)) {
        this.date = new Date(ot.getTime() + e3 * t2), this.ut = e3, this.tt = st2(this.ut);
        return;
      }
      throw "Argument must be a Date object, an AstroTime object, or a numeric UTC Julian date.";
    }
    /**
     * @brief Creates an `AstroTime` value from a Terrestrial Time (TT) day value.
     *
     * This function can be used in rare cases where a time must be based
     * on Terrestrial Time (TT) rather than Universal Time (UT).
     * Most developers will want to invoke `new AstroTime(ut)` with a universal time
     * instead of this function, because usually time is based on civil time adjusted
     * by leap seconds to match the Earth's rotation, rather than the uniformly
     * flowing TT used to calculate solar system dynamics. In rare cases
     * where the caller already knows TT, this function is provided to create
     * an `AstroTime` value that can be passed to Astronomy Engine functions.
     *
     * @param {number} tt
     *      The number of days since the J2000 epoch as expressed in Terrestrial Time.
     *
     * @returns {AstroTime}
     *      An `AstroTime` object for the specified terrestrial time.
     */
    static FromTerrestrialTime(e3) {
      let t2 = new _t0(e3);
      for (; ; ) {
        const r4 = e3 - t2.tt;
        if (Math.abs(r4) < 1e-12)
          return t2;
        t2 = t2.AddDays(r4);
      }
    }
    /**
     * Formats an `AstroTime` object as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
     * date/time string in UTC, to millisecond resolution.
     * Example: `2018-08-17T17:22:04.050Z`
     * @returns {string}
     */
    toString() {
      return this.date.toISOString();
    }
    /**
     * Returns a new `AstroTime` object adjusted by the floating point number of days.
     * Does NOT modify the original `AstroTime` object.
     *
     * @param {number} days
     *      The floating point number of days by which to adjust the given date and time.
     *      Positive values adjust the date toward the future, and
     *      negative values adjust the date toward the past.
     *
     * @returns {AstroTime}
     */
    AddDays(e3) {
      return new _t0(this.ut + e3);
    }
  };
  function r0(n4) {
    return n4 instanceof t0 ? n4 : new t0(n4);
  }
  function lr(n4) {
    function e3(f4) {
      return f4 % tr2 * x0;
    }
    const t2 = n4.tt / 36525, r4 = e3(128710479305e-5 + t2 * 1295965810481e-4), i3 = e3(335779.526232 + t2 * 17395272628478e-4), a3 = e3(107226070369e-5 + t2 * 1602961601209e-3), o3 = e3(450160.398036 - t2 * 69628905431e-4);
    let c3 = Math.sin(o3), s = Math.cos(o3), l3 = (-172064161 - 174666 * t2) * c3 + 33386 * s, d3 = (92052331 + 9086 * t2) * s + 15377 * c3, m4 = 2 * (i3 - a3 + o3);
    return c3 = Math.sin(m4), s = Math.cos(m4), l3 += (-13170906 - 1675 * t2) * c3 - 13696 * s, d3 += (5730336 - 3015 * t2) * s - 4587 * c3, m4 = 2 * (i3 + o3), c3 = Math.sin(m4), s = Math.cos(m4), l3 += (-2276413 - 234 * t2) * c3 + 2796 * s, d3 += (978459 - 485 * t2) * s + 1374 * c3, m4 = 2 * o3, c3 = Math.sin(m4), s = Math.cos(m4), l3 += (2074554 + 207 * t2) * c3 - 698 * s, d3 += (-897492 + 470 * t2) * s - 291 * c3, c3 = Math.sin(r4), s = Math.cos(r4), l3 += (1475877 - 3633 * t2) * c3 + 11817 * s, d3 += (73871 - 184 * t2) * s - 1924 * c3, {
      dpsi: -135e-6 + l3 * 1e-7,
      deps: 388e-6 + d3 * 1e-7
    };
  }
  function Nt2(n4) {
    var e3 = n4.tt / 36525, t2 = ((((-434e-10 * e3 - 576e-9) * e3 + 20034e-7) * e3 - 1831e-7) * e3 - 46.836769) * e3 + 84381.406;
    return t2 / 3600;
  }
  var K0;
  function Ot(n4) {
    if (!K0 || Math.abs(K0.tt - n4.tt) > 1e-6) {
      const e3 = lr(n4), t2 = Nt2(n4), r4 = t2 + e3.deps / 3600;
      K0 = {
        tt: n4.tt,
        dpsi: e3.dpsi,
        deps: e3.deps,
        ee: e3.dpsi * Math.cos(t2 * g4) / 15,
        mobl: t2,
        tobl: r4
      };
    }
    return K0;
  }
  function dr(n4, e3) {
    const t2 = n4 * g4, r4 = Math.cos(t2), i3 = Math.sin(t2);
    return [
      e3[0],
      e3[1] * r4 - e3[2] * i3,
      e3[1] * i3 + e3[2] * r4
    ];
  }
  function hr2(n4, e3) {
    return dr(Nt2(n4), e3);
  }
  function mr(n4) {
    const e3 = n4.tt / 36525;
    function t2(_3, R4) {
      const A4 = [];
      let C4;
      for (C4 = 0; C4 <= R4 - _3; ++C4)
        A4.push(0);
      return { min: _3, array: A4 };
    }
    function r4(_3, R4, A4, C4) {
      const P3 = [];
      for (let Q4 = 0; Q4 <= R4 - _3; ++Q4)
        P3.push(t2(A4, C4));
      return { min: _3, array: P3 };
    }
    function i3(_3, R4, A4) {
      const C4 = _3.array[R4 - _3.min];
      return C4.array[A4 - C4.min];
    }
    function a3(_3, R4, A4, C4) {
      const P3 = _3.array[R4 - _3.min];
      P3.array[A4 - P3.min] = C4;
    }
    let o3, c3, s, l3, d3, m4, f4, v3, T3, E3, x3, y2, I3, N3, b4, U4, z4, F2, q2, Z, i0, a0, J2, N0 = r4(-6, 6, 1, 4), p0 = r4(-6, 6, 1, 4);
    function z0(_3, R4) {
      return i3(N0, _3, R4);
    }
    function k0(_3, R4) {
      return i3(p0, _3, R4);
    }
    function V0(_3, R4, A4) {
      return a3(N0, _3, R4, A4);
    }
    function B0(_3, R4, A4) {
      return a3(p0, _3, R4, A4);
    }
    function $e(_3, R4, A4, C4, P3) {
      P3(_3 * A4 - R4 * C4, R4 * A4 + _3 * C4);
    }
    function M2(_3) {
      return Math.sin(X2 * _3);
    }
    f4 = e3 * e3, T3 = 0, J2 = 0, x3 = 0, y2 = 3422.7;
    var W0 = M2(0.19833 + 0.05611 * e3), le2 = M2(0.27869 + 0.04508 * e3), de = M2(0.16827 - 0.36903 * e3), he2 = M2(0.34734 - 5.37261 * e3), me2 = M2(0.10498 - 5.37899 * e3), j0 = M2(0.42681 - 0.41855 * e3), qt = M2(0.14943 - 5.37511 * e3);
    for (F2 = 0.84 * W0 + 0.31 * le2 + 14.27 * de + 7.26 * he2 + 0.28 * me2 + 0.24 * j0, q2 = 2.94 * W0 + 0.31 * le2 + 14.27 * de + 9.34 * he2 + 1.12 * me2 + 0.83 * j0, Z = -6.4 * W0 - 1.89 * j0, i0 = 0.21 * W0 + 0.31 * le2 + 14.27 * de - 88.7 * he2 - 15.3 * me2 + 0.24 * j0 - 1.86 * qt, a0 = F2 - Z, v3 = -3332e-9 * M2(0.59734 - 5.37261 * e3) - 539e-9 * M2(0.35498 - 5.37899 * e3) - 64e-9 * M2(0.39943 - 5.37511 * e3), I3 = X2 * E0(0.60643382 + 1336.85522467 * e3 - 313e-8 * f4) + F2 / e0, N3 = X2 * E0(0.37489701 + 1325.55240982 * e3 + 2565e-8 * f4) + q2 / e0, b4 = X2 * E0(0.99312619 + 99.99735956 * e3 - 44e-8 * f4) + Z / e0, U4 = X2 * E0(0.25909118 + 1342.2278298 * e3 - 892e-8 * f4) + i0 / e0, z4 = X2 * E0(0.82736186 + 1236.85308708 * e3 - 397e-8 * f4) + a0 / e0, d3 = 1; d3 <= 4; ++d3) {
      switch (d3) {
        case 1:
          s = N3, c3 = 4, l3 = 1.000002208;
          break;
        case 2:
          s = b4, c3 = 3, l3 = 0.997504612 - 2495388e-9 * e3;
          break;
        case 3:
          s = U4, c3 = 4, l3 = 1.000002708 + 139.978 * v3;
          break;
        case 4:
          s = z4, c3 = 6, l3 = 1;
          break;
        default:
          throw `Internal error: I = ${d3}`;
      }
      for (V0(0, d3, 1), V0(1, d3, Math.cos(s) * l3), B0(0, d3, 0), B0(1, d3, Math.sin(s) * l3), m4 = 2; m4 <= c3; ++m4)
        $e(z0(m4 - 1, d3), k0(m4 - 1, d3), z0(1, d3), k0(1, d3), (_3, R4) => (V0(m4, d3, _3), B0(m4, d3, R4)));
      for (m4 = 1; m4 <= c3; ++m4)
        V0(-m4, d3, z0(m4, d3)), B0(-m4, d3, -k0(m4, d3));
    }
    function qe(_3, R4, A4, C4) {
      for (var P3 = { x: 1, y: 0 }, Q4 = [0, _3, R4, A4, C4], j2 = 1; j2 <= 4; ++j2)
        Q4[j2] !== 0 && $e(P3.x, P3.y, z0(Q4[j2], j2), k0(Q4[j2], j2), (fe2, T0) => (P3.x = fe2, P3.y = T0));
      return P3;
    }
    function u5(_3, R4, A4, C4, P3, Q4, j2, fe2) {
      var T0 = qe(P3, Q4, j2, fe2);
      T3 += _3 * T0.y, J2 += R4 * T0.y, x3 += A4 * T0.x, y2 += C4 * T0.x;
    }
    u5(13.902, 14.06, -1e-3, 0.2607, 0, 0, 0, 4), u5(0.403, -4.01, 0.394, 23e-4, 0, 0, 0, 3), u5(2369.912, 2373.36, 0.601, 28.2333, 0, 0, 0, 2), u5(-125.154, -112.79, -0.725, -0.9781, 0, 0, 0, 1), u5(1.979, 6.98, -0.445, 0.0433, 1, 0, 0, 4), u5(191.953, 192.72, 0.029, 3.0861, 1, 0, 0, 2), u5(-8.466, -13.51, 0.455, -0.1093, 1, 0, 0, 1), u5(22639.5, 22609.07, 0.079, 186.5398, 1, 0, 0, 0), u5(18.609, 3.59, -0.094, 0.0118, 1, 0, 0, -1), u5(-4586.465, -4578.13, -0.077, 34.3117, 1, 0, 0, -2), u5(3.215, 5.44, 0.192, -0.0386, 1, 0, 0, -3), u5(-38.428, -38.64, 1e-3, 0.6008, 1, 0, 0, -4), u5(-0.393, -1.43, -0.092, 86e-4, 1, 0, 0, -6), u5(-0.289, -1.59, 0.123, -53e-4, 0, 1, 0, 4), u5(-24.42, -25.1, 0.04, -0.3, 0, 1, 0, 2), u5(18.023, 17.93, 7e-3, 0.1494, 0, 1, 0, 1), u5(-668.146, -126.98, -1.302, -0.3997, 0, 1, 0, 0), u5(0.56, 0.32, -1e-3, -37e-4, 0, 1, 0, -1), u5(-165.145, -165.06, 0.054, 1.9178, 0, 1, 0, -2), u5(-1.877, -6.46, -0.416, 0.0339, 0, 1, 0, -4), u5(0.213, 1.02, -0.074, 54e-4, 2, 0, 0, 4), u5(14.387, 14.78, -0.017, 0.2833, 2, 0, 0, 2), u5(-0.586, -1.2, 0.054, -0.01, 2, 0, 0, 1), u5(769.016, 767.96, 0.107, 10.1657, 2, 0, 0, 0), u5(1.75, 2.01, -0.018, 0.0155, 2, 0, 0, -1), u5(-211.656, -152.53, 5.679, -0.3039, 2, 0, 0, -2), u5(1.225, 0.91, -0.03, -88e-4, 2, 0, 0, -3), u5(-30.773, -34.07, -0.308, 0.3722, 2, 0, 0, -4), u5(-0.57, -1.4, -0.074, 0.0109, 2, 0, 0, -6), u5(-2.921, -11.75, 0.787, -0.0484, 1, 1, 0, 2), u5(1.267, 1.52, -0.022, 0.0164, 1, 1, 0, 1), u5(-109.673, -115.18, 0.461, -0.949, 1, 1, 0, 0), u5(-205.962, -182.36, 2.056, 1.4437, 1, 1, 0, -2), u5(0.233, 0.36, 0.012, -25e-4, 1, 1, 0, -3), u5(-4.391, -9.66, -0.471, 0.0673, 1, 1, 0, -4), u5(0.283, 1.53, -0.111, 6e-3, 1, -1, 0, 4), u5(14.577, 31.7, -1.54, 0.2302, 1, -1, 0, 2), u5(147.687, 138.76, 0.679, 1.1528, 1, -1, 0, 0), u5(-1.089, 0.55, 0.021, 0, 1, -1, 0, -1), u5(28.475, 23.59, -0.443, -0.2257, 1, -1, 0, -2), u5(-0.276, -0.38, -6e-3, -36e-4, 1, -1, 0, -3), u5(0.636, 2.27, 0.146, -0.0102, 1, -1, 0, -4), u5(-0.189, -1.68, 0.131, -28e-4, 0, 2, 0, 2), u5(-7.486, -0.66, -0.037, -86e-4, 0, 2, 0, 0), u5(-8.096, -16.35, -0.74, 0.0918, 0, 2, 0, -2), u5(-5.741, -0.04, 0, -9e-4, 0, 0, 2, 2), u5(0.255, 0, 0, 0, 0, 0, 2, 1), u5(-411.608, -0.2, 0, -0.0124, 0, 0, 2, 0), u5(0.584, 0.84, 0, 71e-4, 0, 0, 2, -1), u5(-55.173, -52.14, 0, -0.1052, 0, 0, 2, -2), u5(0.254, 0.25, 0, -17e-4, 0, 0, 2, -3), u5(0.025, -1.67, 0, 31e-4, 0, 0, 2, -4), u5(1.06, 2.96, -0.166, 0.0243, 3, 0, 0, 2), u5(36.124, 50.64, -1.3, 0.6215, 3, 0, 0, 0), u5(-13.193, -16.4, 0.258, -0.1187, 3, 0, 0, -2), u5(-1.187, -0.74, 0.042, 74e-4, 3, 0, 0, -4), u5(-0.293, -0.31, -2e-3, 46e-4, 3, 0, 0, -6), u5(-0.29, -1.45, 0.116, -51e-4, 2, 1, 0, 2), u5(-7.649, -10.56, 0.259, -0.1038, 2, 1, 0, 0), u5(-8.627, -7.59, 0.078, -0.0192, 2, 1, 0, -2), u5(-2.74, -2.54, 0.022, 0.0324, 2, 1, 0, -4), u5(1.181, 3.32, -0.212, 0.0213, 2, -1, 0, 2), u5(9.703, 11.67, -0.151, 0.1268, 2, -1, 0, 0), u5(-0.352, -0.37, 1e-3, -28e-4, 2, -1, 0, -1), u5(-2.494, -1.17, -3e-3, -17e-4, 2, -1, 0, -2), u5(0.36, 0.2, -0.012, -43e-4, 2, -1, 0, -4), u5(-1.167, -1.25, 8e-3, -0.0106, 1, 2, 0, 0), u5(-7.412, -6.12, 0.117, 0.0484, 1, 2, 0, -2), u5(-0.311, -0.65, -0.032, 44e-4, 1, 2, 0, -4), u5(0.757, 1.82, -0.105, 0.0112, 1, -2, 0, 2), u5(2.58, 2.32, 0.027, 0.0196, 1, -2, 0, 0), u5(2.533, 2.4, -0.014, -0.0212, 1, -2, 0, -2), u5(-0.344, -0.57, -0.025, 36e-4, 0, 3, 0, -2), u5(-0.992, -0.02, 0, 0, 1, 0, 2, 2), u5(-45.099, -0.02, 0, -1e-3, 1, 0, 2, 0), u5(-0.179, -9.52, 0, -0.0833, 1, 0, 2, -2), u5(-0.301, -0.33, 0, 14e-4, 1, 0, 2, -4), u5(-6.382, -3.37, 0, -0.0481, 1, 0, -2, 2), u5(39.528, 85.13, 0, -0.7136, 1, 0, -2, 0), u5(9.366, 0.71, 0, -0.0112, 1, 0, -2, -2), u5(0.202, 0.02, 0, 0, 1, 0, -2, -4), u5(0.415, 0.1, 0, 13e-4, 0, 1, 2, 0), u5(-2.152, -2.26, 0, -66e-4, 0, 1, 2, -2), u5(-1.44, -1.3, 0, 14e-4, 0, 1, -2, 2), u5(0.384, -0.04, 0, 0, 0, 1, -2, -2), u5(1.938, 3.6, -0.145, 0.0401, 4, 0, 0, 0), u5(-0.952, -1.58, 0.052, -0.013, 4, 0, 0, -2), u5(-0.551, -0.94, 0.032, -97e-4, 3, 1, 0, 0), u5(-0.482, -0.57, 5e-3, -45e-4, 3, 1, 0, -2), u5(0.681, 0.96, -0.026, 0.0115, 3, -1, 0, 0), u5(-0.297, -0.27, 2e-3, -9e-4, 2, 2, 0, -2), u5(0.254, 0.21, -3e-3, 0, 2, -2, 0, -2), u5(-0.25, -0.22, 4e-3, 14e-4, 1, 3, 0, -2), u5(-3.996, 0, 0, 4e-4, 2, 0, 2, 0), u5(0.557, -0.75, 0, -9e-3, 2, 0, 2, -2), u5(-0.459, -0.38, 0, -53e-4, 2, 0, -2, 2), u5(-1.298, 0.74, 0, 4e-4, 2, 0, -2, 0), u5(0.538, 1.14, 0, -0.0141, 2, 0, -2, -2), u5(0.263, 0.02, 0, 0, 1, 1, 2, 0), u5(0.426, 0.07, 0, -6e-4, 1, 1, -2, -2), u5(-0.304, 0.03, 0, 3e-4, 1, -1, 2, 0), u5(-0.372, -0.19, 0, -27e-4, 1, -1, -2, 2), u5(0.418, 0, 0, 0, 0, 0, 4, 0), u5(-0.33, -0.04, 0, 0, 3, 0, 2, 0);
    function B(_3, R4, A4, C4, P3) {
      return _3 * qe(R4, A4, C4, P3).y;
    }
    E3 = 0, E3 += B(-526.069, 0, 0, 1, -2), E3 += B(-3.352, 0, 0, 1, -4), E3 += B(44.297, 1, 0, 1, -2), E3 += B(-6, 1, 0, 1, -4), E3 += B(20.599, -1, 0, 1, 0), E3 += B(-30.598, -1, 0, 1, -2), E3 += B(-24.649, -2, 0, 1, 0), E3 += B(-2, -2, 0, 1, -2), E3 += B(-22.571, 0, 1, 1, -2), E3 += B(10.985, 0, -1, 1, -2), T3 += 0.82 * M2(0.7736 - 62.5512 * e3) + 0.31 * M2(0.0466 - 125.1025 * e3) + 0.35 * M2(0.5785 - 25.1042 * e3) + 0.66 * M2(0.4591 + 1335.8075 * e3) + 0.64 * M2(0.313 - 91.568 * e3) + 1.14 * M2(0.148 + 1331.2898 * e3) + 0.21 * M2(0.5918 + 1056.5859 * e3) + 0.44 * M2(0.5784 + 1322.8595 * e3) + 0.24 * M2(0.2275 - 5.7374 * e3) + 0.28 * M2(0.2965 + 2.6929 * e3) + 0.33 * M2(0.3132 + 6.3368 * e3), o3 = U4 + J2 / e0;
    let Zt2 = (1.000002708 + 139.978 * v3) * (18518.511 + 1.189 + x3) * Math.sin(o3) - 6.24 * Math.sin(3 * o3) + E3;
    return {
      geo_eclip_lon: X2 * E0((I3 + T3 / e0) / X2),
      geo_eclip_lat: Math.PI / (180 * 3600) * Zt2,
      distance_au: e0 * rr2 / (0.999953253 * y2)
    };
  }
  function Lt2(n4, e3) {
    return [
      n4.rot[0][0] * e3[0] + n4.rot[1][0] * e3[1] + n4.rot[2][0] * e3[2],
      n4.rot[0][1] * e3[0] + n4.rot[1][1] * e3[1] + n4.rot[2][1] * e3[2],
      n4.rot[0][2] * e3[0] + n4.rot[1][2] * e3[1] + n4.rot[2][2] * e3[2]
    ];
  }
  function Ht2(n4, e3, t2) {
    const r4 = bt2(e3, t2);
    return Lt2(r4, n4);
  }
  function bt2(n4, e3) {
    const t2 = n4.tt / 36525;
    let r4 = 84381.406, i3 = ((((-951e-10 * t2 + 132851e-9) * t2 - 114045e-8) * t2 - 1.0790069) * t2 + 5038.481507) * t2, a3 = ((((3337e-10 * t2 - 467e-9) * t2 - 772503e-8) * t2 + 0.0512623) * t2 - 0.025754) * t2 + r4, o3 = ((((-56e-9 * t2 + 170663e-9) * t2 - 121197e-8) * t2 - 2.3814292) * t2 + 10.556403) * t2;
    r4 *= x0, i3 *= x0, a3 *= x0, o3 *= x0;
    const c3 = Math.sin(r4), s = Math.cos(r4), l3 = Math.sin(-i3), d3 = Math.cos(-i3), m4 = Math.sin(-a3), f4 = Math.cos(-a3), v3 = Math.sin(o3), T3 = Math.cos(o3), E3 = T3 * d3 - l3 * v3 * f4, x3 = T3 * l3 * s + v3 * f4 * d3 * s - c3 * v3 * m4, y2 = T3 * l3 * c3 + v3 * f4 * d3 * c3 + s * v3 * m4, I3 = -v3 * d3 - l3 * T3 * f4, N3 = -v3 * l3 * s + T3 * f4 * d3 * s - c3 * T3 * m4, b4 = -v3 * l3 * c3 + T3 * f4 * d3 * c3 + s * T3 * m4, U4 = l3 * m4, z4 = -m4 * d3 * s - c3 * f4, F2 = -m4 * d3 * c3 + f4 * s;
    if (e3 === V.Into2000)
      return new I0([
        [E3, x3, y2],
        [I3, N3, b4],
        [U4, z4, F2]
      ]);
    if (e3 === V.From2000)
      return new I0([
        [E3, I3, U4],
        [x3, N3, z4],
        [y2, b4, F2]
      ]);
    throw "Invalid precess direction";
  }
  function fr2(n4) {
    const e3 = 0.779057273264 + 0.00273781191135448 * n4.ut, t2 = n4.ut % 1;
    let r4 = 360 * ((e3 + t2) % 1);
    return r4 < 0 && (r4 += 360), r4;
  }
  var $0;
  function gr2(n4) {
    if (!$0 || $0.tt !== n4.tt) {
      const e3 = n4.tt / 36525;
      let t2 = 15 * Ot(n4).ee;
      const r4 = fr2(n4);
      let a3 = ((t2 + 0.014506 + ((((-368e-10 * e3 - 29956e-9) * e3 - 44e-8) * e3 + 1.3915817) * e3 + 4612.156534) * e3) / 3600 + r4) % 360 / 15;
      a3 < 0 && (a3 += 24), $0 = {
        tt: n4.tt,
        st: a3
      };
    }
    return $0.st;
  }
  function pr2(n4) {
    const e3 = r0(n4);
    return gr2(e3);
  }
  function Tr2(n4, e3, t2) {
    const r4 = Ut2(e3, t2);
    return Lt2(r4, n4);
  }
  function Ut2(n4, e3) {
    const t2 = Ot(n4), r4 = t2.mobl * g4, i3 = t2.tobl * g4, a3 = t2.dpsi * x0, o3 = Math.cos(r4), c3 = Math.sin(r4), s = Math.cos(i3), l3 = Math.sin(i3), d3 = Math.cos(a3), m4 = Math.sin(a3), f4 = d3, v3 = -m4 * o3, T3 = -m4 * c3, E3 = m4 * s, x3 = d3 * o3 * s + c3 * l3, y2 = d3 * c3 * s - o3 * l3, I3 = m4 * l3, N3 = d3 * o3 * l3 - c3 * s, b4 = d3 * c3 * l3 + o3 * s;
    if (e3 === V.From2000)
      return new I0([
        [f4, E3, I3],
        [v3, x3, N3],
        [T3, y2, b4]
      ]);
    if (e3 === V.Into2000)
      return new I0([
        [f4, v3, T3],
        [E3, x3, y2],
        [I3, N3, b4]
      ]);
    throw "Invalid precess direction";
  }
  var G3 = class {
    constructor(e3, t2, r4, i3) {
      this.x = e3, this.y = t2, this.z = r4, this.t = i3;
    }
    /**
     * Returns the length of the vector in astronomical units (AU).
     * @returns {number}
     */
    Length() {
      return Math.hypot(this.x, this.y, this.z);
    }
  };
  var Sr = class {
    constructor(e3, t2, r4, i3, a3, o3, c3) {
      this.x = e3, this.y = t2, this.z = r4, this.vx = i3, this.vy = a3, this.vz = o3, this.t = c3;
    }
  };
  var Gt2 = class {
    constructor(e3, t2, r4) {
      this.lat = l0(e3), this.lon = l0(t2), this.dist = l0(r4);
    }
  };
  var vr2 = class {
    constructor(e3, t2, r4, i3) {
      this.ra = l0(e3), this.dec = l0(t2), this.dist = l0(r4), this.vec = i3;
    }
  };
  var I0 = class {
    constructor(e3) {
      this.rot = e3;
    }
  };
  function ye(n4) {
    const e3 = r0(n4), t2 = mr(e3), r4 = t2.distance_au * Math.cos(t2.geo_eclip_lat), i3 = [
      r4 * Math.cos(t2.geo_eclip_lon),
      r4 * Math.sin(t2.geo_eclip_lon),
      t2.distance_au * Math.sin(t2.geo_eclip_lat)
    ], a3 = hr2(e3, i3), o3 = Ht2(a3, e3, V.Into2000);
    return new G3(o3[0], o3[1], o3[2], e3);
  }
  function y0(n4, e3, t2) {
    let r4 = 1, i3 = 0;
    for (let a3 of n4) {
      let o3 = 0;
      for (let [s, l3, d3] of a3)
        o3 += s * Math.cos(l3 + e3 * d3);
      let c3 = r4 * o3;
      t2 && (c3 %= X2), i3 += c3, r4 *= e3;
    }
    return i3;
  }
  function Se2(n4, e3) {
    let t2 = 1, r4 = 0, i3 = 0, a3 = 0;
    for (let o3 of n4) {
      let c3 = 0, s = 0;
      for (let [l3, d3, m4] of o3) {
        let f4 = d3 + e3 * m4;
        c3 += l3 * m4 * Math.sin(f4), a3 > 0 && (s += l3 * Math.cos(f4));
      }
      i3 += a3 * r4 * s - t2 * c3, r4 = t2, t2 *= e3, ++a3;
    }
    return i3;
  }
  var b0 = 365250;
  var Ce2 = 0;
  var De2 = 1;
  var Ie2 = 2;
  function Pe2(n4) {
    return new O(n4[0] + 44036e-11 * n4[1] - 190919e-12 * n4[2], -479966e-12 * n4[0] + 0.917482137087 * n4[1] - 0.397776982902 * n4[2], 0.397776982902 * n4[1] + 0.917482137087 * n4[2]);
  }
  function Ft2(n4, e3, t2) {
    const r4 = t2 * Math.cos(e3), i3 = Math.cos(n4), a3 = Math.sin(n4);
    return [
      r4 * i3,
      r4 * a3,
      t2 * Math.sin(e3)
    ];
  }
  function Q0(n4, e3) {
    const t2 = e3.tt / b0, r4 = y0(n4[Ce2], t2, true), i3 = y0(n4[De2], t2, false), a3 = y0(n4[Ie2], t2, false), o3 = Ft2(r4, i3, a3);
    return Pe2(o3).ToAstroVector(e3);
  }
  function Er(n4, e3) {
    const t2 = e3 / b0, r4 = y0(n4[Ce2], t2, true), i3 = y0(n4[De2], t2, false), a3 = y0(n4[Ie2], t2, false), o3 = Se2(n4[Ce2], t2), c3 = Se2(n4[De2], t2), s = Se2(n4[Ie2], t2), l3 = Math.cos(r4), d3 = Math.sin(r4), m4 = Math.cos(i3), f4 = Math.sin(i3), v3 = +(s * m4 * l3) - a3 * f4 * l3 * c3 - a3 * m4 * d3 * o3, T3 = +(s * m4 * d3) - a3 * f4 * d3 * c3 + a3 * m4 * l3 * o3, E3 = +(s * f4) + a3 * m4 * c3, x3 = Ft2(r4, i3, a3), y2 = [
      v3 / b0,
      T3 / b0,
      E3 / b0
    ], I3 = Pe2(x3), N3 = Pe2(y2);
    return new d0(e3, I3, N3);
  }
  function q0(n4, e3, t2, r4) {
    const i3 = r4 / (r4 + We), a3 = Q0(M0[t2], e3);
    n4.x += i3 * a3.x, n4.y += i3 * a3.y, n4.z += i3 * a3.z;
  }
  function _r(n4) {
    const e3 = new G3(0, 0, 0, n4);
    return q0(e3, n4, S3.Jupiter, xe2), q0(e3, n4, S3.Saturn, Me2), q0(e3, n4, S3.Uranus, Ae), q0(e3, n4, S3.Neptune, we2), e3;
  }
  var Ne2 = 51;
  var Rr2 = 29200;
  var A0 = 146;
  var Y2 = 201;
  var o0 = [
    [-73e4, [-26.118207232108, -14.376168177825, 3.384402515299], [0.0016339372163656, -0.0027861699588508, -0.0013585880229445]],
    [-700800, [41.974905202127, -0.448502952929, -12.770351505989], [73458569351457e-17, 0.0022785014891658, 48619778602049e-17]],
    [-671600, [14.706930780744, 44.269110540027, 9.353698474772], [-0.00210001479998, 22295915939915e-17, 70143443551414e-17]],
    [-642400, [-29.441003929957, -6.43016153057, 6.858481011305], [84495803960544e-17, -0.0030783914758711, -0.0012106305981192]],
    [-613200, [39.444396946234, -6.557989760571, -13.913760296463], [0.0011480029005873, 0.0022400006880665, 35168075922288e-17]],
    [-584e3, [20.2303809507, 43.266966657189, 7.382966091923], [-0.0019754081700585, 53457141292226e-17, 75929169129793e-17]],
    [-554800, [-30.65832536462, 2.093818874552, 9.880531138071], [61010603013347e-18, -0.0031326500935382, -99346125151067e-17]],
    [-525600, [35.737703251673, -12.587706024764, -14.677847247563], [0.0015802939375649, 0.0021347678412429, 19074436384343e-17]],
    [-496400, [25.466295188546, 41.367478338417, 5.216476873382], [-0.0018054401046468, 8328308359951e-16, 80260156912107e-17]],
    [-467200, [-29.847174904071, 10.636426313081, 12.297904180106], [-63257063052907e-17, -0.0029969577578221, -74476074151596e-17]],
    [-438e3, [30.774692107687, -18.236637015304, -14.945535879896], [0.0020113162005465, 0.0019353827024189, -20937793168297e-19]],
    [-408800, [30.243153324028, 38.656267888503, 2.938501750218], [-0.0016052508674468, 0.0011183495337525, 83333973416824e-17]],
    [-379600, [-27.288984772533, 18.643162147874, 14.023633623329], [-0.0011856388898191, -0.0027170609282181, -49015526126399e-17]],
    [-350400, [24.519605196774, -23.245756064727, -14.626862367368], [0.0024322321483154, 0.0016062008146048, -23369181613312e-17]],
    [-321200, [34.505274805875, 35.125338586954, 0.557361475637], [-0.0013824391637782, 0.0013833397561817, 84823598806262e-17]],
    [-292e3, [-23.275363915119, 25.818514298769, 15.055381588598], [-0.0016062295460975, -0.0023395961498533, -24377362639479e-17]],
    [-262800, [17.050384798092, -27.180376290126, -13.608963321694], [0.0028175521080578, 0.0011358749093955, -49548725258825e-17]],
    [-233600, [38.093671910285, 30.880588383337, -1.843688067413], [-0.0011317697153459, 0.0016128814698472, 84177586176055e-17]],
    [-204400, [-18.197852930878, 31.932869934309, 15.438294826279], [-0.0019117272501813, -0.0019146495909842, -19657304369835e-18]],
    [-175200, [8.528924039997, -29.618422200048, -11.805400994258], [0.0031034370787005, 5139363329243e-16, -77293066202546e-17]],
    [-146e3, [40.94685725864, 25.904973592021, -4.256336240499], [-83652705194051e-17, 0.0018129497136404, 8156422827306e-16]],
    [-116800, [-12.326958895325, 36.881883446292, 15.217158258711], [-0.0021166103705038, -0.001481442003599, 17401209844705e-17]],
    [-87600, [-0.633258375909, -30.018759794709, -9.17193287495], [0.0032016994581737, -25279858672148e-17, -0.0010411088271861]],
    [-58400, [42.936048423883, 20.344685584452, -6.588027007912], [-50525450073192e-17, 0.0019910074335507, 77440196540269e-17]],
    [-29200, [-5.975910552974, 40.61180995846, 14.470131723673], [-0.0022184202156107, -0.0010562361130164, 33652250216211e-17]],
    [0, [-9.875369580774, -27.978926224737, -5.753711824704], [0.0030287533248818, -0.0011276087003636, -0.0012651326732361]],
    [29200, [43.958831986165, 14.214147973292, -8.808306227163], [-14717608981871e-17, 0.0021404187242141, 71486567806614e-17]],
    [58400, [0.67813676352, 43.094461639362, 13.243238780721], [-0.0022358226110718, -63233636090933e-17, 47664798895648e-17]],
    [87600, [-18.282602096834, -23.30503958666, -1.766620508028], [0.0025567245263557, -0.0019902940754171, -0.0013943491701082]],
    [116800, [43.873338744526, 7.700705617215, -10.814273666425], [23174803055677e-17, 0.0022402163127924, 62988756452032e-17]],
    [146e3, [7.392949027906, 44.382678951534, 11.629500214854], [-0.002193281545383, -21751799585364e-17, 59556516201114e-17]],
    [175200, [-24.981690229261, -16.204012851426, 2.466457544298], [0.001819398914958, -0.0026765419531201, -0.0013848283502247]],
    [204400, [42.530187039511, 0.845935508021, -12.554907527683], [65059779150669e-17, 0.0022725657282262, 51133743202822e-17]],
    [233600, [13.999526486822, 44.462363044894, 9.669418486465], [-0.0021079296569252, 17533423831993e-17, 69128485798076e-17]],
    [262800, [-29.184024803031, -7.371243995762, 6.493275957928], [93581363109681e-17, -0.0030610357109184, -0.0012364201089345]],
    [292e3, [39.831980671753, -6.078405766765, -13.909815358656], [0.0011117769689167, 0.0022362097830152, 36230548231153e-17]],
    [321200, [20.294955108476, 43.417190420251, 7.450091985932], [-0.0019742157451535, 53102050468554e-17, 75938408813008e-17]],
    [350400, [-30.66999230216, 2.318743558955, 9.973480913858], [45605107450676e-18, -0.0031308219926928, -99066533301924e-17]],
    [379600, [35.626122155983, -12.897647509224, -14.777586508444], [0.0016015684949743, 0.0021171931182284, 18002516202204e-17]],
    [408800, [26.133186148561, 41.232139187599, 5.00640132622], [-0.0017857704419579, 86046232702817e-17, 80614690298954e-17]],
    [438e3, [-29.57674022923, 11.863535943587, 12.631323039872], [-72292830060955e-17, -0.0029587820140709, -708242964503e-15]],
    [467200, [29.910805787391, -19.159019294, -15.013363865194], [0.0020871080437997, 0.0018848372554514, -38528655083926e-18]],
    [496400, [31.375957451819, 38.050372720763, 2.433138343754], [-0.0015546055556611, 0.0011699815465629, 83565439266001e-17]],
    [525600, [-26.360071336928, 20.662505904952, 14.414696258958], [-0.0013142373118349, -0.0026236647854842, -42542017598193e-17]],
    [554800, [22.599441488648, -24.508879898306, -14.484045731468], [0.0025454108304806, 0.0014917058755191, -30243665086079e-17]],
    [584e3, [35.877864013014, 33.894226366071, -0.224524636277], [-0.0012941245730845, 0.0014560427668319, 84762160640137e-17]],
    [613200, [-21.538149762417, 28.204068269761, 15.321973799534], [-0.001731211740901, -0.0021939631314577, -1631691327518e-16]],
    [642400, [13.971521374415, -28.339941764789, -13.083792871886], [0.0029334630526035, 91860931752944e-17, -59939422488627e-17]],
    [671600, [39.526942044143, 28.93989736011, -2.872799527539], [-0.0010068481658095, 0.001702113288809, 83578230511981e-17]],
    [700800, [-15.576200701394, 34.399412961275, 15.466033737854], [-0.0020098814612884, -0.0017191109825989, 70414782780416e-18]],
    [73e4, [4.24325283709, -30.118201690825, -10.707441231349], [0.0031725847067411, 1609846120227e-16, -90672150593868e-17]]
  ];
  var O = class _O {
    constructor(e3, t2, r4) {
      this.x = e3, this.y = t2, this.z = r4;
    }
    clone() {
      return new _O(this.x, this.y, this.z);
    }
    ToAstroVector(e3) {
      return new G3(this.x, this.y, this.z, e3);
    }
    static zero() {
      return new _O(0, 0, 0);
    }
    quadrature() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    add(e3) {
      return new _O(this.x + e3.x, this.y + e3.y, this.z + e3.z);
    }
    sub(e3) {
      return new _O(this.x - e3.x, this.y - e3.y, this.z - e3.z);
    }
    incr(e3) {
      this.x += e3.x, this.y += e3.y, this.z += e3.z;
    }
    decr(e3) {
      this.x -= e3.x, this.y -= e3.y, this.z -= e3.z;
    }
    mul(e3) {
      return new _O(e3 * this.x, e3 * this.y, e3 * this.z);
    }
    div(e3) {
      return new _O(this.x / e3, this.y / e3, this.z / e3);
    }
    mean(e3) {
      return new _O((this.x + e3.x) / 2, (this.y + e3.y) / 2, (this.z + e3.z) / 2);
    }
    neg() {
      return new _O(-this.x, -this.y, -this.z);
    }
  };
  var d0 = class _d0 {
    constructor(e3, t2, r4) {
      this.tt = e3, this.r = t2, this.v = r4;
    }
    clone() {
      return new _d0(this.tt, this.r, this.v);
    }
    sub(e3) {
      return new _d0(this.tt, this.r.sub(e3.r), this.v.sub(e3.v));
    }
  };
  function xr2(n4) {
    let [e3, [t2, r4, i3], [a3, o3, c3]] = n4;
    return new d0(e3, new O(t2, r4, i3), new O(a3, o3, c3));
  }
  function Z0(n4, e3, t2, r4) {
    const i3 = r4 / (r4 + We), a3 = Er(M0[t2], e3);
    return n4.r.incr(a3.r.mul(i3)), n4.v.incr(a3.v.mul(i3)), a3;
  }
  function H0(n4, e3, t2) {
    const r4 = t2.sub(n4), i3 = r4.quadrature();
    return r4.mul(e3 / (i3 * Math.sqrt(i3)));
  }
  var je = class {
    constructor(e3) {
      let t2 = new d0(e3, new O(0, 0, 0), new O(0, 0, 0));
      this.Jupiter = Z0(t2, e3, S3.Jupiter, xe2), this.Saturn = Z0(t2, e3, S3.Saturn, Me2), this.Uranus = Z0(t2, e3, S3.Uranus, Ae), this.Neptune = Z0(t2, e3, S3.Neptune, we2), this.Jupiter.r.decr(t2.r), this.Jupiter.v.decr(t2.v), this.Saturn.r.decr(t2.r), this.Saturn.v.decr(t2.v), this.Uranus.r.decr(t2.r), this.Uranus.v.decr(t2.v), this.Neptune.r.decr(t2.r), this.Neptune.v.decr(t2.v), this.Sun = new d0(e3, t2.r.mul(-1), t2.v.mul(-1));
    }
    Acceleration(e3) {
      let t2 = H0(e3, We, this.Sun.r);
      return t2.incr(H0(e3, xe2, this.Jupiter.r)), t2.incr(H0(e3, Me2, this.Saturn.r)), t2.incr(H0(e3, Ae, this.Uranus.r)), t2.incr(H0(e3, we2, this.Neptune.r)), t2;
    }
  };
  var ce2 = class _ce {
    constructor(e3, t2, r4, i3) {
      this.tt = e3, this.r = t2, this.v = r4, this.a = i3;
    }
    clone() {
      return new _ce(this.tt, this.r.clone(), this.v.clone(), this.a.clone());
    }
  };
  var zt2 = class {
    constructor(e3, t2) {
      this.bary = e3, this.grav = t2;
    }
  };
  function te2(n4, e3, t2, r4) {
    return new O(e3.x + n4 * (t2.x + n4 * r4.x / 2), e3.y + n4 * (t2.y + n4 * r4.y / 2), e3.z + n4 * (t2.z + n4 * r4.z / 2));
  }
  function ct2(n4, e3, t2) {
    return new O(e3.x + n4 * t2.x, e3.y + n4 * t2.y, e3.z + n4 * t2.z);
  }
  function Oe2(n4, e3) {
    const t2 = n4 - e3.tt, r4 = new je(n4), i3 = te2(t2, e3.r, e3.v, e3.a), a3 = r4.Acceleration(i3).mean(e3.a), o3 = te2(t2, e3.r, e3.v, a3), c3 = e3.v.add(a3.mul(t2)), s = r4.Acceleration(o3), l3 = new ce2(n4, o3, c3, s);
    return new zt2(r4, l3);
  }
  var Mr2 = [];
  function kt(n4, e3) {
    const t2 = Math.floor(n4);
    return t2 < 0 ? 0 : t2 >= e3 ? e3 - 1 : t2;
  }
  function Le2(n4) {
    const e3 = xr2(n4), t2 = new je(e3.tt), r4 = e3.r.add(t2.Sun.r), i3 = e3.v.add(t2.Sun.v), a3 = t2.Acceleration(r4), o3 = new ce2(e3.tt, r4, i3, a3);
    return new zt2(t2, o3);
  }
  function Ar2(n4, e3) {
    const t2 = o0[0][0];
    if (e3 < t2 || e3 > o0[Ne2 - 1][0])
      return null;
    const r4 = kt((e3 - t2) / Rr2, Ne2 - 1);
    if (!n4[r4]) {
      const a3 = n4[r4] = [];
      a3[0] = Le2(o0[r4]).grav, a3[Y2 - 1] = Le2(o0[r4 + 1]).grav;
      let o3, c3 = a3[0].tt;
      for (o3 = 1; o3 < Y2 - 1; ++o3)
        a3[o3] = Oe2(c3 += A0, a3[o3 - 1]).grav;
      c3 = a3[Y2 - 1].tt;
      var i3 = [];
      for (i3[Y2 - 1] = a3[Y2 - 1], o3 = Y2 - 2; o3 > 0; --o3)
        i3[o3] = Oe2(c3 -= A0, i3[o3 + 1]).grav;
      for (o3 = Y2 - 2; o3 > 0; --o3) {
        const s = o3 / (Y2 - 1);
        a3[o3].r = a3[o3].r.mul(1 - s).add(i3[o3].r.mul(s)), a3[o3].v = a3[o3].v.mul(1 - s).add(i3[o3].v.mul(s)), a3[o3].a = a3[o3].a.mul(1 - s).add(i3[o3].a.mul(s));
      }
    }
    return n4[r4];
  }
  function ut2(n4, e3, t2) {
    let r4 = Le2(n4);
    const i3 = Math.ceil((e3 - r4.grav.tt) / t2);
    for (let a3 = 0; a3 < i3; ++a3)
      r4 = Oe2(a3 + 1 === i3 ? e3 : r4.grav.tt + t2, r4.grav);
    return r4;
  }
  function wr(n4, e3) {
    let t2, r4, i3;
    const a3 = Ar2(Mr2, n4.tt);
    if (a3) {
      const o3 = kt((n4.tt - a3[0].tt) / A0, Y2 - 1), c3 = a3[o3], s = a3[o3 + 1], l3 = c3.a.mean(s.a), d3 = te2(n4.tt - c3.tt, c3.r, c3.v, l3), m4 = ct2(n4.tt - c3.tt, c3.v, l3), f4 = te2(n4.tt - s.tt, s.r, s.v, l3), v3 = ct2(n4.tt - s.tt, s.v, l3), T3 = (n4.tt - c3.tt) / A0;
      t2 = d3.mul(1 - T3).add(f4.mul(T3)), r4 = m4.mul(1 - T3).add(v3.mul(T3));
    } else {
      let o3;
      n4.tt < o0[0][0] ? o3 = ut2(o0[0], n4.tt, -A0) : o3 = ut2(o0[Ne2 - 1], n4.tt, +A0), t2 = o3.grav.r, r4 = o3.grav.v, i3 = o3.bary;
    }
    return i3 || (i3 = new je(n4.tt)), t2 = t2.sub(i3.Sun.r), r4 = r4.sub(i3.Sun.v), new Sr(t2.x, t2.y, t2.z, r4.x, r4.y, r4.z, n4);
  }
  function G0(n4, e3) {
    var t2 = r0(e3);
    if (n4 in M0)
      return Q0(M0[n4], t2);
    if (n4 === S3.Pluto) {
      const o3 = wr(t2);
      return new G3(o3.x, o3.y, o3.z, t2);
    }
    if (n4 === S3.Sun)
      return new G3(0, 0, 0, t2);
    if (n4 === S3.Moon) {
      var r4 = Q0(M0.Earth, t2), i3 = ye(t2);
      return new G3(r4.x + i3.x, r4.y + i3.y, r4.z + i3.z, t2);
    }
    if (n4 === S3.EMB) {
      const o3 = Q0(M0.Earth, t2), c3 = ye(t2), s = 1 + ir2;
      return new G3(o3.x + c3.x / s, o3.y + c3.y / s, o3.z + c3.z / s, t2);
    }
    if (n4 === S3.SSB)
      return _r(t2);
    const a3 = Pt(n4);
    if (a3) {
      const o3 = new Gt2(a3.dec, 15 * a3.ra, a3.dist);
      return Or(o3, t2);
    }
    throw `HelioVector: Unknown body "${n4}"`;
  }
  function yr(n4, e3) {
    let t2 = e3, r4 = 0;
    for (let i3 = 0; i3 < 10; ++i3) {
      const a3 = n4(t2), o3 = a3.Length() / Jn2;
      if (o3 > 1)
        throw "Object is too distant for light-travel solver.";
      const c3 = e3.AddDays(-o3);
      if (r4 = Math.abs(c3.tt - t2.tt), r4 < 1e-9)
        return a3;
      t2 = c3;
    }
    throw `Light-travel time solver did not converge: dt = ${r4}`;
  }
  var Cr2 = class {
    constructor(e3, t2, r4, i3) {
      this.observerBody = e3, this.targetBody = t2, this.aberration = r4, this.observerPos = i3;
    }
    Position(e3) {
      this.aberration && (this.observerPos = G0(this.observerBody, e3));
      const t2 = G0(this.targetBody, e3);
      return new G3(t2.x - this.observerPos.x, t2.y - this.observerPos.y, t2.z - this.observerPos.z, e3);
    }
  };
  function Dr2(n4, e3, t2, r4) {
    const i3 = r0(n4);
    if (Pt(t2)) {
      const c3 = G0(t2, i3), s = G0(e3, i3);
      return new G3(c3.x - s.x, c3.y - s.y, c3.z - s.z, i3);
    }
    let a3;
    a3 = G0(e3, i3);
    const o3 = new Cr2(e3, t2, r4, a3);
    return yr((c3) => o3.Position(c3), i3);
  }
  function Ir(n4, e3, t2) {
    const r4 = r0(e3);
    switch (n4) {
      case S3.Earth:
        return new G3(0, 0, 0, r4);
      case S3.Moon:
        return ye(r4);
      default:
        const i3 = Dr2(r4, S3.Earth, n4, t2);
        return i3.t = r4, i3;
    }
  }
  var lt2;
  (function(n4) {
    n4[n4.Pericenter = 0] = "Pericenter", n4[n4.Apocenter = 1] = "Apocenter";
  })(lt2 || (lt2 = {}));
  function Pr2(n4, e3) {
    return new I0([
      [
        e3.rot[0][0] * n4.rot[0][0] + e3.rot[1][0] * n4.rot[0][1] + e3.rot[2][0] * n4.rot[0][2],
        e3.rot[0][1] * n4.rot[0][0] + e3.rot[1][1] * n4.rot[0][1] + e3.rot[2][1] * n4.rot[0][2],
        e3.rot[0][2] * n4.rot[0][0] + e3.rot[1][2] * n4.rot[0][1] + e3.rot[2][2] * n4.rot[0][2]
      ],
      [
        e3.rot[0][0] * n4.rot[1][0] + e3.rot[1][0] * n4.rot[1][1] + e3.rot[2][0] * n4.rot[1][2],
        e3.rot[0][1] * n4.rot[1][0] + e3.rot[1][1] * n4.rot[1][1] + e3.rot[2][1] * n4.rot[1][2],
        e3.rot[0][2] * n4.rot[1][0] + e3.rot[1][2] * n4.rot[1][1] + e3.rot[2][2] * n4.rot[1][2]
      ],
      [
        e3.rot[0][0] * n4.rot[2][0] + e3.rot[1][0] * n4.rot[2][1] + e3.rot[2][0] * n4.rot[2][2],
        e3.rot[0][1] * n4.rot[2][0] + e3.rot[1][1] * n4.rot[2][1] + e3.rot[2][1] * n4.rot[2][2],
        e3.rot[0][2] * n4.rot[2][0] + e3.rot[1][2] * n4.rot[2][1] + e3.rot[2][2] * n4.rot[2][2]
      ]
    ]);
  }
  function Nr2(n4, e3, t2) {
    const r4 = l0(t2) * g4, i3 = Math.cos(r4), a3 = Math.sin(r4), o3 = (e3 + 1) % 3, c3 = (e3 + 2) % 3, s = e3;
    let l3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    return l3[o3][o3] = i3 * n4.rot[o3][o3] - a3 * n4.rot[o3][c3], l3[o3][c3] = a3 * n4.rot[o3][o3] + i3 * n4.rot[o3][c3], l3[o3][s] = n4.rot[o3][s], l3[c3][o3] = i3 * n4.rot[c3][o3] - a3 * n4.rot[c3][c3], l3[c3][c3] = a3 * n4.rot[c3][o3] + i3 * n4.rot[c3][c3], l3[c3][s] = n4.rot[c3][s], l3[s][o3] = i3 * n4.rot[s][o3] - a3 * n4.rot[s][c3], l3[s][c3] = a3 * n4.rot[s][o3] + i3 * n4.rot[s][c3], l3[s][s] = n4.rot[s][s], new I0(l3);
  }
  function Or(n4, e3) {
    e3 = r0(e3);
    const t2 = n4.lat * g4, r4 = n4.lon * g4, i3 = n4.dist * Math.cos(t2);
    return new G3(i3 * Math.cos(r4), i3 * Math.sin(r4), n4.dist * Math.sin(t2), e3);
  }
  function Lr2(n4) {
    const e3 = Hr2(n4);
    return new vr2(e3.lon / 15, e3.lat, e3.dist, n4);
  }
  function Hr2(n4) {
    const e3 = n4.x * n4.x + n4.y * n4.y, t2 = Math.sqrt(e3 + n4.z * n4.z);
    let r4, i3;
    if (e3 === 0) {
      if (n4.z === 0)
        throw "Zero-length vector not allowed.";
      i3 = 0, r4 = n4.z < 0 ? -90 : 90;
    } else
      i3 = at2 * Math.atan2(n4.y, n4.x), i3 < 0 && (i3 += 360), r4 = at2 * Math.atan2(n4.z, Math.sqrt(e3));
    return new Gt2(r4, i3, t2);
  }
  function br2(n4) {
    n4 = r0(n4);
    const e3 = bt2(n4, V.From2000), t2 = Ut2(n4, V.From2000);
    return Pr2(e3, t2);
  }
  var dt;
  (function(n4) {
    n4.Penumbral = "penumbral", n4.Partial = "partial", n4.Annular = "annular", n4.Total = "total";
  })(dt || (dt = {}));
  var ht2;
  (function(n4) {
    n4[n4.Invalid = 0] = "Invalid", n4[n4.Ascending = 1] = "Ascending", n4[n4.Descending = -1] = "Descending";
  })(ht2 || (ht2 = {}));
  var Vt = class {
    constructor(e3, t2, r4, i3) {
      this.ra = e3, this.dec = t2, this.spin = r4, this.north = i3;
    }
  };
  function Ur2(n4) {
    const e3 = Tr2([0, 0, 1], n4, V.Into2000), t2 = Ht2(e3, n4, V.Into2000), r4 = new G3(t2[0], t2[1], t2[2], n4), i3 = Lr2(r4), a3 = 190.41375788700253 + 360.9856122880876 * n4.ut;
    return new Vt(i3.ra, i3.dec, a3, r4);
  }
  function Gr2(n4, e3) {
    const t2 = r0(e3), r4 = t2.tt, i3 = r4 / 36525;
    let a3, o3, c3;
    switch (n4) {
      case S3.Sun:
        a3 = 286.13, o3 = 63.87, c3 = 84.176 + 14.1844 * r4;
        break;
      case S3.Mercury:
        a3 = 281.0103 - 0.0328 * i3, o3 = 61.4155 - 49e-4 * i3, c3 = 329.5988 + 6.1385108 * r4 + 0.01067257 * Math.sin(g4 * (174.7910857 + 4.092335 * r4)) - 112309e-8 * Math.sin(g4 * (349.5821714 + 8.18467 * r4)) - 1104e-7 * Math.sin(g4 * (164.3732571 + 12.277005 * r4)) - 2539e-8 * Math.sin(g4 * (339.1643429 + 16.36934 * r4)) - 571e-8 * Math.sin(g4 * (153.9554286 + 20.461675 * r4));
        break;
      case S3.Venus:
        a3 = 272.76, o3 = 67.16, c3 = 160.2 - 1.4813688 * r4;
        break;
      case S3.Earth:
        return Ur2(t2);
      case S3.Moon:
        const f4 = g4 * (125.045 - 0.0529921 * r4), v3 = g4 * (250.089 - 0.1059842 * r4), T3 = g4 * (260.008 + 13.0120009 * r4), E3 = g4 * (176.625 + 13.3407154 * r4), x3 = g4 * (357.529 + 0.9856003 * r4), y2 = g4 * (311.589 + 26.4057084 * r4), I3 = g4 * (134.963 + 13.064993 * r4), N3 = g4 * (276.617 + 0.3287146 * r4), b4 = g4 * (34.226 + 1.7484877 * r4), U4 = g4 * (15.134 - 0.1589763 * r4), z4 = g4 * (119.743 + 36096e-7 * r4), F2 = g4 * (239.961 + 0.1643573 * r4), q2 = g4 * (25.053 + 12.9590088 * r4);
        a3 = 269.9949 + 31e-4 * i3 - 3.8787 * Math.sin(f4) - 0.1204 * Math.sin(v3) + 0.07 * Math.sin(T3) - 0.0172 * Math.sin(E3) + 72e-4 * Math.sin(y2) - 52e-4 * Math.sin(U4) + 43e-4 * Math.sin(q2), o3 = 66.5392 + 0.013 * i3 + 1.5419 * Math.cos(f4) + 0.0239 * Math.cos(v3) - 0.0278 * Math.cos(T3) + 68e-4 * Math.cos(E3) - 29e-4 * Math.cos(y2) + 9e-4 * Math.cos(I3) + 8e-4 * Math.cos(U4) - 9e-4 * Math.cos(q2), c3 = 38.3213 + (13.17635815 - 14e-13 * r4) * r4 + 3.561 * Math.sin(f4) + 0.1208 * Math.sin(v3) - 0.0642 * Math.sin(T3) + 0.0158 * Math.sin(E3) + 0.0252 * Math.sin(x3) - 66e-4 * Math.sin(y2) - 47e-4 * Math.sin(I3) - 46e-4 * Math.sin(N3) + 28e-4 * Math.sin(b4) + 52e-4 * Math.sin(U4) + 4e-3 * Math.sin(z4) + 19e-4 * Math.sin(F2) - 44e-4 * Math.sin(q2);
        break;
      case S3.Mars:
        a3 = 317.269202 - 0.10927547 * i3 + 68e-6 * Math.sin(g4 * (198.991226 + 19139.4819985 * i3)) + 238e-6 * Math.sin(g4 * (226.292679 + 38280.8511281 * i3)) + 52e-6 * Math.sin(g4 * (249.663391 + 57420.7251593 * i3)) + 9e-6 * Math.sin(g4 * (266.18351 + 76560.636795 * i3)) + 0.419057 * Math.sin(g4 * (79.398797 + 0.5042615 * i3)), o3 = 54.432516 - 0.05827105 * i3 + 51e-6 * Math.cos(g4 * (122.433576 + 19139.9407476 * i3)) + 141e-6 * Math.cos(g4 * (43.058401 + 38280.8753272 * i3)) + 31e-6 * Math.cos(g4 * (57.663379 + 57420.7517205 * i3)) + 5e-6 * Math.cos(g4 * (79.476401 + 76560.6495004 * i3)) + 1.591274 * Math.cos(g4 * (166.325722 + 0.5042615 * i3)), c3 = 176.049863 + 350.891982443297 * r4 + 145e-6 * Math.sin(g4 * (129.071773 + 19140.0328244 * i3)) + 157e-6 * Math.sin(g4 * (36.352167 + 38281.0473591 * i3)) + 4e-5 * Math.sin(g4 * (56.668646 + 57420.929536 * i3)) + 1e-6 * Math.sin(g4 * (67.364003 + 76560.2552215 * i3)) + 1e-6 * Math.sin(g4 * (104.79268 + 95700.4387578 * i3)) + 0.584542 * Math.sin(g4 * (95.391654 + 0.5042615 * i3));
        break;
      case S3.Jupiter:
        const Z = g4 * (99.360714 + 4850.4046 * i3), i0 = g4 * (175.895369 + 1191.9605 * i3), a0 = g4 * (300.323162 + 262.5475 * i3), J2 = g4 * (114.012305 + 6070.2476 * i3), N0 = g4 * (49.511251 + 64.3 * i3);
        a3 = 268.056595 - 6499e-6 * i3 + 117e-6 * Math.sin(Z) + 938e-6 * Math.sin(i0) + 1432e-6 * Math.sin(a0) + 3e-5 * Math.sin(J2) + 215e-5 * Math.sin(N0), o3 = 64.495303 + 2413e-6 * i3 + 5e-5 * Math.cos(Z) + 404e-6 * Math.cos(i0) + 617e-6 * Math.cos(a0) - 13e-6 * Math.cos(J2) + 926e-6 * Math.cos(N0), c3 = 284.95 + 870.536 * r4;
        break;
      case S3.Saturn:
        a3 = 40.589 - 0.036 * i3, o3 = 83.537 - 4e-3 * i3, c3 = 38.9 + 810.7939024 * r4;
        break;
      case S3.Uranus:
        a3 = 257.311, o3 = -15.175, c3 = 203.81 - 501.1600928 * r4;
        break;
      case S3.Neptune:
        const p0 = g4 * (357.85 + 52.316 * i3);
        a3 = 299.36 + 0.7 * Math.sin(p0), o3 = 43.46 - 0.51 * Math.cos(p0), c3 = 249.978 + 541.1397757 * r4 - 0.48 * Math.sin(p0);
        break;
      case S3.Pluto:
        a3 = 132.993, o3 = -6.163, c3 = 302.695 + 56.3625225 * r4;
        break;
      default:
        throw `Invalid body: ${n4}`;
    }
    const s = o3 * g4, l3 = a3 * g4, d3 = Math.cos(s), m4 = new G3(d3 * Math.cos(l3), d3 * Math.sin(l3), Math.sin(s), t2);
    return new Vt(a3 / 15, o3, c3, m4);
  }
  var Fr2 = 1e-3 / It2;
  var Bt2 = /* @__PURE__ */ new Vector3();
  var zr = /* @__PURE__ */ new Vector3();
  var kr = /* @__PURE__ */ new Vector3();
  var Wt = /* @__PURE__ */ new Matrix4();
  var Vr2 = /* @__PURE__ */ new Matrix4();
  var Br2 = /* @__PURE__ */ new Quaternion();
  function P0(n4) {
    return n4 instanceof t0 ? n4 : (
      // Prefer number to be JS timestamp.
      new t0(n4 instanceof Date ? n4 : new Date(n4))
    );
  }
  function jt2(n4, e3 = new Vector3()) {
    const { x: t2, y: r4, z: i3 } = n4;
    return e3.set(t2, r4, i3);
  }
  function Wr(n4, e3 = new Matrix4()) {
    const [t2, r4, i3] = n4.rot;
    return e3.set(
      t2[0],
      r4[0],
      i3[0],
      0,
      t2[1],
      r4[1],
      i3[1],
      0,
      t2[2],
      r4[2],
      i3[2],
      0,
      0,
      0,
      0,
      1
    );
  }
  function Xe(n4, e3 = new Matrix4()) {
    const t2 = P0(n4), r4 = Nr2(br2(t2), 2, -15 * pr2(t2));
    return Wr(r4, e3);
  }
  function bi(n4, e3 = new Matrix4()) {
    const t2 = P0(n4), r4 = Gr2(S3.Moon, t2), i3 = jt2(r4.north, Bt2), a3 = Cr(r4.spin), c3 = zr.set(0, 0, 1).cross(i3).normalize().applyQuaternion(Br2.setFromAxisAngle(i3, a3)).normalize(), s = kr.copy(i3).cross(c3).normalize();
    return e3.makeBasis(c3, s, i3);
  }
  function ue(n4, e3, t2, r4, i3) {
    const a3 = Ir(n4, e3, false);
    if (jt2(a3, t2), r4 != null) {
      const o3 = Xe(e3, Vr2).transpose();
      t2.sub(
        Bt2.copy(r4).applyMatrix4(o3).multiplyScalar(Fr2)
      );
    }
    return t2.normalize();
  }
  function Ui(n4, e3 = new Vector3(), t2) {
    return ue(S3.Sun, P0(n4), e3, t2);
  }
  function Gi(n4, e3 = new Vector3(), t2) {
    return ue(S3.Moon, P0(n4), e3, t2);
  }
  function Fi(n4, e3 = new Vector3(), t2) {
    const r4 = P0(n4);
    return ue(S3.Sun, r4, e3, t2).applyMatrix4(
      Xe(r4, Wt)
    );
  }
  function zi(n4, e3 = new Vector3(), t2) {
    const r4 = P0(n4);
    return ue(S3.Moon, r4, e3, t2).applyMatrix4(
      Xe(r4, Wt)
    );
  }
  function Xt(n4) {
    return Math.sqrt(Math.max(n4, 0));
  }
  function jr(n4) {
    return Math.max(n4, 0);
  }
  function Xr(n4, e3, t2) {
    const { bottomRadius: r4 } = n4;
    return t2 < 0 && e3 ** 2 * (t2 ** 2 - 1) + r4 ** 2 >= 0;
  }
  function Yr2(n4, e3, t2) {
    const { topRadius: r4 } = n4, i3 = e3 ** 2 * (t2 ** 2 - 1) + r4 ** 2;
    return jr(-e3 * t2 + Xt(i3));
  }
  function ne2(n4, e3) {
    return 0.5 / e3 + n4 * (1 - 1 / e3);
  }
  var Kr = /* @__PURE__ */ new Vector3();
  var mt = /* @__PURE__ */ new Vector3();
  var $r2 = /* @__PURE__ */ new Vector3();
  var ft2 = /* @__PURE__ */ new WeakMap();
  function qr(n4) {
    cs(n4.image);
    let e3 = Nr(n4.image.data) ? n4.image.data : Nr(n4.userData.imageData) ? n4.userData.imageData : void 0;
    if (n4.type === HalfFloatType && e3 instanceof Uint16Array) {
      const t2 = ft2.get(e3.buffer);
      t2 == null ? (e3 = new A2(e3.buffer), ft2.set(e3.buffer, e3)) : e3 = t2;
    }
    return e3;
  }
  function J0(n4, e3, t2) {
    const r4 = e3 * 4;
    return t2.set(n4[r4], n4[r4 + 1], n4[r4 + 2]);
  }
  function Yt(n4, e3, t2) {
    const r4 = qr(n4);
    if (r4 == null)
      return t2.setScalar(0);
    cs(n4.image);
    const { width: i3, height: a3 } = n4.image, o3 = z3(e3.x, 0, 1) * (i3 - 1), c3 = z3(e3.y, 0, 1) * (a3 - 1), s = Math.floor(o3), l3 = Math.floor(c3), d3 = o3 - s, m4 = c3 - l3, f4 = d3, v3 = m4, T3 = s % i3, E3 = (T3 + 1) % i3, x3 = l3 % a3, y2 = (x3 + 1) % a3, I3 = J0(r4, x3 * i3 + T3, Kr), N3 = J0(r4, x3 * i3 + E3, mt), b4 = I3.lerp(N3, f4), U4 = J0(r4, y2 * i3 + T3, mt), z4 = J0(r4, y2 * i3 + E3, $r2), F2 = U4.lerp(z4, f4);
    return t2.copy(b4.lerp(F2, v3));
  }
  function Zr(n4, e3, t2, r4) {
    const { topRadius: i3, bottomRadius: a3 } = n4, o3 = Math.sqrt(i3 ** 2 - a3 ** 2), c3 = Xt(e3 ** 2 - a3 ** 2), s = Yr2(n4, e3, t2), l3 = i3 - e3, d3 = c3 + o3, m4 = (s - l3) / (d3 - l3), f4 = c3 / o3;
    return r4.set(
      ne2(m4, C3),
      ne2(f4, p2)
    );
  }
  var Jr = /* @__PURE__ */ new Vector3();
  var ve2 = /* @__PURE__ */ new Vector3();
  var Qr2 = /* @__PURE__ */ new Vector2();
  function ei(n4, e3, t2, r4 = new Color(), {
    ellipsoid: i3 = N.WGS84,
    correctAltitude: a3 = true
  } = {}, o3 = n0.DEFAULT) {
    const c3 = Jr.copy(e3);
    if (a3) {
      const T3 = i3.projectOnSurface(
        e3,
        ve2
      );
      T3 != null && c3.sub(
        i3.getOsculatingSphereCenter(
          T3,
          o3.bottomRadius,
          ve2
        )
      );
    }
    const s = ve2;
    let l3 = c3.length(), d3 = c3.dot(t2);
    const { topRadius: m4 } = o3, f4 = -d3 - Math.sqrt(d3 ** 2 - l3 ** 2 + m4 ** 2);
    if (f4 > 0 && (l3 = m4, d3 += f4), l3 > m4)
      s.set(1, 1, 1);
    else {
      const T3 = d3 / l3;
      if (Xr(o3, l3, T3))
        s.setScalar(0);
      else {
        const x3 = Zr(o3, l3, T3, Qr2);
        Yt(n4, x3, s);
      }
    }
    const v3 = s.multiply(o3.solarIrradiance).multiply(o3.sunRadianceToRelativeLuminance);
    return r4.setFromVector3(v3);
  }
  var ti = `// Based on: https://github.com/pmndrs/postprocessing/blob/v6.37.4/src/materials/glsl/depth-mask.frag

#include <common>
#include <packing>

#include "core/depth"

#ifdef GL_FRAGMENT_PRECISION_HIGH
uniform highp sampler2D depthBuffer0;
uniform highp sampler2D depthBuffer1;
#else // GL_FRAGMENT_PRECISION_HIGH
uniform mediump sampler2D depthBuffer0;
uniform mediump sampler2D depthBuffer1;
#endif // GL_FRAGMENT_PRECISION_HIGH

uniform sampler2D inputBuffer;
uniform vec2 cameraNearFar;
uniform bool inverted;

float getViewZ(const float depth) {
  #ifdef PERSPECTIVE_CAMERA
  return perspectiveDepthToViewZ(depth, cameraNearFar.x, cameraNearFar.y);
  #else // PERSPECTIVE_CAMERA
  return orthographicDepthToViewZ(depth, cameraNearFar.x, cameraNearFar.y);
  #endif // PERSPECTIVE_CAMERA
}

varying vec2 vUv;

void main() {
  vec2 depth;

  #if DEPTH_PACKING_0 == 3201
  depth.x = unpackRGBAToDepth(texture2D(depthBuffer0, vUv));
  #else // DEPTH_PACKING_0 == 3201
  depth.x = reverseLogDepth(texture2D(depthBuffer0, vUv).r, cameraNearFar.x, cameraNearFar.y);
  #endif // DEPTH_PACKING_0 == 3201

  #if DEPTH_PACKING_1 == 3201
  depth.y = unpackRGBAToDepth(texture2D(depthBuffer1, vUv));
  #else // DEPTH_PACKING_1 == 3201
  depth.y = reverseLogDepth(texture2D(depthBuffer1, vUv).r, cameraNearFar.x, cameraNearFar.y);
  #endif // DEPTH_PACKING_1 == 3201

  bool isMaxDepth = depth.x == 1.0;

  #ifdef PERSPECTIVE_CAMERA
  depth.x = viewZToOrthographicDepth(getViewZ(depth.x), cameraNearFar.x, cameraNearFar.y);
  depth.y = viewZToOrthographicDepth(getViewZ(depth.y), cameraNearFar.x, cameraNearFar.y);
  #endif // PERSPECTIVE_CAMERA

  #if DEPTH_TEST_STRATEGY == 0
  // Decide based on depth test.
  bool keep = depthTest(depth.x, depth.y);

  #elif DEPTH_TEST_STRATEGY == 1
  // Always keep max depth.
  bool keep = isMaxDepth || depthTest(depth.x, depth.y);

  #else // DEPTH_TEST_STRATEGY
  // Always discard max depth.
  bool keep = !isMaxDepth && depthTest(depth.x, depth.y);

  #endif // DEPTH_TEST_STRATEGY

  if (inverted) {
    keep = !keep;
  }
  if (keep) {
    gl_FragColor = texture2D(inputBuffer, vUv);
  } else {
    discard;
  }
}
`;
  var ki = class extends Pass {
    constructor(e3, t2) {
      super("LightingMaskPass"), this.selection = new Selection(), this.needsSwap = false, this.needsDepthTexture = true, this.renderPass = new RenderPass(e3, t2, new MeshBasicMaterial()), this.renderPass.ignoreBackground = true, this.renderPass.skipShadowMapUpdate = true, this.renderPass.selection = this.selection, this.depthTexture = new DepthTexture(1, 1, UnsignedIntType), this.renderTarget = new WebGLRenderTarget(1, 1, {
        format: RedFormat,
        depthTexture: this.depthTexture
      }), this.depthCopyPass0 = new DepthCopyPass({ depthPacking: RGBADepthPacking }), this.depthCopyPass1 = new DepthCopyPass({ depthPacking: RGBADepthPacking }), this.clearPass = new ClearPass(true, false, false), this.clearPass.overrideClearColor = new Color(16777215), this.clearPass.overrideClearAlpha = 1;
      const r4 = new DepthMaskMaterial();
      r4.fragmentShader = Ar(ti, {
        core: { depth: d2 }
      }), r4.uniforms.inverted = new Uniform(false), r4.copyCameraSettings(t2), r4.depthBuffer0 = this.depthCopyPass0.texture, r4.depthPacking0 = RGBADepthPacking, r4.depthBuffer1 = this.depthCopyPass1.texture, r4.depthPacking1 = RGBADepthPacking, r4.depthMode = LessEqualDepth, r4.maxDepthStrategy = DepthTestStrategy.DISCARD_MAX_DEPTH, this.depthMaskMaterial = r4, this.depthMaskPass = new ShaderPass(r4);
    }
    // eslint-disable-next-line accessor-pairs
    set mainScene(e3) {
      this.renderPass.mainScene = e3;
    }
    // eslint-disable-next-line accessor-pairs
    set mainCamera(e3) {
      this.renderPass.mainCamera = e3, this.depthMaskMaterial.copyCameraSettings(e3);
    }
    initialize(e3, t2, r4) {
      this.renderPass.initialize(e3, t2, r4), this.clearPass.initialize(e3, t2, r4), this.depthMaskPass.initialize(e3, t2, r4);
    }
    setDepthTexture(e3, t2 = BasicDepthPacking) {
      this.depthCopyPass0.setDepthTexture(e3, t2), this.depthCopyPass1.setDepthTexture(this.depthTexture, t2);
    }
    render(e3, t2, r4, i3, a3) {
      const o3 = e3.autoClear;
      e3.autoClear = false, this.depthCopyPass0.render(e3, null, null), this.renderPass.render(e3, this.renderTarget, null), this.depthCopyPass1.render(e3, null, null), this.clearPass.render(e3, this.renderTarget, null), this.depthMaskPass.render(e3, null, this.renderTarget), e3.autoClear = o3;
    }
    setSize(e3, t2) {
      this.renderTarget.setSize(e3, t2), this.depthCopyPass0.setSize(e3, t2), this.depthCopyPass1.setSize(e3, t2);
    }
    get texture() {
      return this.renderTarget.texture;
    }
    get selectionLayer() {
      return this.selection.layer;
    }
    set selectionLayer(e3) {
      this.selection.layer = e3;
    }
    get inverted() {
      return this.depthMaskMaterial.uniforms.inverted.value;
    }
    set inverted(e3) {
      this.depthMaskMaterial.uniforms.inverted.value = e3;
    }
  };
  var ni = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"
#include "bruneton/common"
#include "bruneton/precompute"

uniform AtmosphereParameters ATMOSPHERE;

uniform sampler2D transmittanceTexture;

layout(location = 0) out vec4 outputColor;

void main() {
  vec3 deltaIrradiance;
  vec3 irradiance;
  deltaIrradiance = ComputeDirectIrradianceTexture(
    ATMOSPHERE,
    transmittanceTexture,
    gl_FragCoord.xy
  );
  irradiance = vec3(0.0);
  outputColor = vec4(OUTPUT, 1.0);
}
`;
  var ri = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"
#include "bruneton/common"
#include "bruneton/precompute"

uniform AtmosphereParameters ATMOSPHERE;

uniform mat3 luminanceFromRadiance;
uniform sampler3D singleRayleighScatteringTexture;
uniform sampler3D singleMieScatteringTexture;
uniform sampler3D multipleScatteringTexture;
uniform int scatteringOrder;

layout(location = 0) out vec4 outputColor;

void main() {
  vec3 deltaIrradiance;
  vec3 irradiance;
  deltaIrradiance = ComputeIndirectIrradianceTexture(
    ATMOSPHERE,
    singleRayleighScatteringTexture,
    singleMieScatteringTexture,
    multipleScatteringTexture,
    gl_FragCoord.xy,
    scatteringOrder
  );
  irradiance = luminanceFromRadiance * deltaIrradiance;
  outputColor = vec4(OUTPUT, 1.0);
}
`;
  var ii = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"
#include "bruneton/common"
#include "bruneton/precompute"

uniform AtmosphereParameters ATMOSPHERE;

uniform mat3 luminanceFromRadiance;
uniform sampler2D transmittanceTexture;
uniform sampler3D scatteringDensityTexture;
uniform int layer;

layout(location = 0) out vec4 outputColor;

void main() {
  vec4 deltaMultipleScattering;
  vec4 scattering;
  float nu;
  deltaMultipleScattering.rgb = ComputeMultipleScatteringTexture(
    ATMOSPHERE,
    transmittanceTexture,
    scatteringDensityTexture,
    vec3(gl_FragCoord.xy, float(layer) + 0.5),
    nu
  );
  deltaMultipleScattering.a = 1.0;
  scattering = vec4(
    luminanceFromRadiance * deltaMultipleScattering.rgb / RayleighPhaseFunction(nu),
    0.0
  );
  outputColor = OUTPUT;
}
`;
  var ai = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"
#include "bruneton/common"
#include "bruneton/precompute"

uniform AtmosphereParameters ATMOSPHERE;

uniform sampler2D transmittanceTexture;
uniform sampler3D singleRayleighScatteringTexture;
uniform sampler3D singleMieScatteringTexture;
uniform sampler3D multipleScatteringTexture;
uniform sampler2D irradianceTexture;
uniform int scatteringOrder;
uniform int layer;

layout(location = 0) out vec4 scatteringDensity;

void main() {
  scatteringDensity.rgb = ComputeScatteringDensityTexture(
    ATMOSPHERE,
    transmittanceTexture,
    singleRayleighScatteringTexture,
    singleMieScatteringTexture,
    multipleScatteringTexture,
    irradianceTexture,
    vec3(gl_FragCoord.xy, float(layer) + 0.5),
    scatteringOrder
  );
  scatteringDensity.a = 1.0;
}
`;
  var oi = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"
#include "bruneton/common"
#include "bruneton/precompute"

uniform AtmosphereParameters ATMOSPHERE;

uniform mat3 luminanceFromRadiance;
uniform sampler2D transmittanceTexture;
uniform int layer;

layout(location = 0) out vec4 outputColor;

void main() {
  vec4 deltaRayleigh;
  vec4 deltaMie;
  vec4 scattering;
  vec4 singleMieScattering;
  ComputeSingleScatteringTexture(
    ATMOSPHERE,
    transmittanceTexture,
    vec3(gl_FragCoord.xy, float(layer) + 0.5),
    deltaRayleigh.rgb,
    deltaMie.rgb
  );
  deltaRayleigh.a = 1.0;
  deltaMie.a = 1.0;
  scattering = vec4(
    luminanceFromRadiance * deltaRayleigh.rgb,
    (luminanceFromRadiance * deltaMie.rgb).r
  );
  singleMieScattering.rgb = luminanceFromRadiance * deltaMie.rgb;
  singleMieScattering.a = 1.0;
  outputColor = OUTPUT;
}
`;
  var si = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"
#include "bruneton/common"
#include "bruneton/precompute"

uniform AtmosphereParameters ATMOSPHERE;

layout(location = 0) out vec4 transmittance;

void main() {
  transmittance.rgb = ComputeTransmittanceToTopAtmosphereBoundaryTexture(
    ATMOSPHERE,
    gl_FragCoord.xy
  );
  transmittance.a = 1.0;
}
`;
  var ci = (
    /* glsl */
    `
  precision highp float;
  in vec2 position;
  void main() {
    gl_Position = vec4(position, 1.0, 1.0);
  }
`
  );
  function re2(n4, e3, t2) {
    const r4 = new WebGLRenderTarget(e3, t2, {
      depthBuffer: false,
      type: n4,
      format: RGBAFormat
    }), i3 = r4.texture;
    return i3.minFilter = LinearFilter, i3.magFilter = LinearFilter, i3.wrapS = ClampToEdgeWrapping, i3.wrapT = ClampToEdgeWrapping, i3.colorSpace = NoColorSpace, r4;
  }
  function C0(n4, e3, t2, r4) {
    const i3 = new WebGL3DRenderTarget(e3, t2, r4, {
      depthBuffer: false,
      type: n4,
      format: RGBAFormat
    }), a3 = i3.texture;
    return a3.minFilter = LinearFilter, a3.magFilter = LinearFilter, a3.wrapS = ClampToEdgeWrapping, a3.wrapT = ClampToEdgeWrapping, a3.wrapR = ClampToEdgeWrapping, a3.colorSpace = NoColorSpace, i3;
  }
  function ui(n4) {
    const e3 = n4[Symbol.iterator]();
    return new Promise((t2, r4) => {
      const i3 = () => {
        try {
          const { value: a3, done: o3 } = e3.next();
          o3 === true ? t2(a3) : H2(i3);
        } catch (a3) {
          r4(a3 instanceof Error ? a3 : new Error());
        }
      };
      H2(i3);
    });
  }
  async function gt2(n4, e3, t2) {
    const { width: r4, height: i3 } = e3, a3 = t2.type === HalfFloatType ? new Uint16Array(r4 * i3 * 4) : new Float32Array(r4 * i3 * 4);
    await n4.readRenderTargetPixelsAsync(
      e3,
      0,
      0,
      e3.width,
      e3.height,
      a3
    ), t2.userData.imageData = a3;
  }
  var li = class {
    constructor(e3) {
      this.lambdas = new Vector3(), this.luminanceFromRadiance = new Matrix3(), e3 === HalfFloatType && (this.opticalDepth = re2(
        e3,
        C3,
        p2
      )), this.deltaIrradiance = re2(
        e3,
        f2,
        A3
      ), this.deltaRayleighScattering = C0(
        e3,
        U2,
        g3,
        N2
      ), this.deltaMieScattering = C0(
        e3,
        U2,
        g3,
        N2
      ), this.deltaScatteringDensity = C0(
        e3,
        U2,
        g3,
        N2
      ), this.deltaMultipleScattering = this.deltaRayleighScattering;
    }
    dispose() {
      var _a2;
      (_a2 = this.opticalDepth) == null ? void 0 : _a2.dispose(), this.deltaIrradiance.dispose(), this.deltaRayleighScattering.dispose(), this.deltaMieScattering.dispose(), this.deltaScatteringDensity.dispose();
    }
  };
  var _0 = class extends RawShaderMaterial {
    constructor(e3) {
      super({
        glslVersion: GLSL3,
        vertexShader: ci,
        ...e3,
        defines: {
          TRANSMITTANCE_TEXTURE_WIDTH: C3.toFixed(0),
          TRANSMITTANCE_TEXTURE_HEIGHT: p2.toFixed(0),
          SCATTERING_TEXTURE_R_SIZE: i2.toFixed(0),
          SCATTERING_TEXTURE_MU_SIZE: _2.toFixed(0),
          SCATTERING_TEXTURE_MU_S_SIZE: R3.toFixed(0),
          SCATTERING_TEXTURE_NU_SIZE: u3.toFixed(0),
          IRRADIANCE_TEXTURE_WIDTH: f2.toFixed(0),
          IRRADIANCE_TEXTURE_HEIGHT: A3.toFixed(0),
          ...e3.defines
        }
      });
    }
    // eslint-disable-next-line accessor-pairs
    set additive(e3) {
      this.transparent = e3, this.blending = e3 ? CustomBlending : NoBlending, this.blendEquation = AddEquation, this.blendEquationAlpha = AddEquation, this.blendSrc = OneFactor, this.blendDst = OneFactor, this.blendSrcAlpha = OneFactor, this.blendDstAlpha = OneFactor;
    }
    setUniforms(e3) {
      const t2 = this.uniforms;
      t2.luminanceFromRadiance != null && t2.luminanceFromRadiance.value.copy(e3.luminanceFromRadiance), t2.singleRayleighScatteringTexture != null && (t2.singleRayleighScatteringTexture.value = e3.deltaRayleighScattering.texture), t2.singleMieScatteringTexture != null && (t2.singleMieScatteringTexture.value = e3.deltaMieScattering.texture), t2.multipleScatteringTexture != null && (t2.multipleScatteringTexture.value = e3.deltaMultipleScattering.texture), t2.scatteringDensityTexture != null && (t2.scatteringDensityTexture.value = e3.deltaScatteringDensity.texture), t2.irradianceTexture != null && (t2.irradianceTexture.value = e3.deltaIrradiance.texture);
    }
  };
  var Vi = class {
    constructor(e3, {
      type: t2 = Pr(e3) ? FloatType : HalfFloatType,
      combinedScattering: r4 = true,
      higherOrderScattering: i3 = true
    } = {}) {
      var _a2, _b2;
      this.transmittanceMaterial = new _0({
        fragmentShader: Ar(si, {
          bruneton: {
            common: e2,
            definitions: t,
            precompute: r3
          }
        })
      }), this.directIrradianceMaterial = new _0({
        fragmentShader: Ar(ni, {
          bruneton: {
            common: e2,
            definitions: t,
            precompute: r3
          }
        }),
        uniforms: {
          transmittanceTexture: new Uniform(null)
        }
      }), this.singleScatteringMaterial = new _0({
        fragmentShader: Ar(oi, {
          bruneton: {
            common: e2,
            definitions: t,
            precompute: r3
          }
        }),
        uniforms: {
          luminanceFromRadiance: new Uniform(new Matrix3()),
          transmittanceTexture: new Uniform(null),
          layer: new Uniform(0)
        }
      }), this.scatteringDensityMaterial = new _0({
        fragmentShader: Ar(ai, {
          bruneton: {
            common: e2,
            definitions: t,
            precompute: r3
          }
        }),
        uniforms: {
          transmittanceTexture: new Uniform(null),
          singleRayleighScatteringTexture: new Uniform(null),
          singleMieScatteringTexture: new Uniform(null),
          multipleScatteringTexture: new Uniform(null),
          irradianceTexture: new Uniform(null),
          scatteringOrder: new Uniform(0),
          layer: new Uniform(0)
        }
      }), this.indirectIrradianceMaterial = new _0({
        fragmentShader: Ar(ri, {
          bruneton: {
            common: e2,
            definitions: t,
            precompute: r3
          }
        }),
        uniforms: {
          luminanceFromRadiance: new Uniform(new Matrix3()),
          singleRayleighScatteringTexture: new Uniform(null),
          singleMieScatteringTexture: new Uniform(null),
          multipleScatteringTexture: new Uniform(null),
          scatteringOrder: new Uniform(0)
        }
      }), this.multipleScatteringMaterial = new _0({
        fragmentShader: Ar(ii, {
          bruneton: {
            common: e2,
            definitions: t,
            precompute: r3
          }
        }),
        uniforms: {
          luminanceFromRadiance: new Uniform(new Matrix3()),
          transmittanceTexture: new Uniform(null),
          scatteringDensityTexture: new Uniform(null),
          layer: new Uniform(0)
        }
      }), this.mesh = new Mesh(new PlaneGeometry(2, 2)), this.scene = new Scene().add(this.mesh), this.camera = new Camera(), this.updating = false, this.renderer = e3, this.type = t2, this.transmittanceRenderTarget = re2(
        t2,
        C3,
        p2
      ), this.scatteringRenderTarget = C0(
        t2,
        U2,
        g3,
        N2
      ), this.irradianceRenderTarget = re2(
        t2,
        f2,
        A3
      ), r4 || (this.singleMieScatteringRenderTarget = C0(
        t2,
        U2,
        g3,
        N2
      )), i3 && (this.higherOrderScatteringRenderTarget = C0(
        t2,
        U2,
        g3,
        N2
      )), this.textures = {
        transmittanceTexture: this.transmittanceRenderTarget.texture,
        scatteringTexture: this.scatteringRenderTarget.texture,
        irradianceTexture: this.irradianceRenderTarget.texture,
        singleMieScatteringTexture: (_a2 = this.singleMieScatteringRenderTarget) == null ? void 0 : _a2.texture,
        higherOrderScatteringTexture: (_b2 = this.higherOrderScatteringRenderTarget) == null ? void 0 : _b2.texture
      };
    }
    render3DRenderTarget(e3, t2) {
      for (let r4 = 0; r4 < e3.depth; ++r4)
        t2.uniforms.layer.value = r4, this.renderer.setRenderTarget(e3, r4), this.renderer.render(this.scene, this.camera);
    }
    computeTransmittance(e3) {
      const t2 = this.transmittanceMaterial;
      delete t2.defines.TRANSMITTANCE_PRECISION_LOG, t2.needsUpdate = true, this.mesh.material = t2, this.renderer.setRenderTarget(e3.renderTarget), this.renderer.render(this.scene, this.camera);
    }
    computeOpticalDepth(e3) {
      const t2 = this.transmittanceMaterial;
      t2.defines.TRANSMITTANCE_PRECISION_LOG = "1", t2.needsUpdate = true, this.mesh.material = t2, this.renderer.setRenderTarget(e3.renderTarget), this.renderer.render(this.scene, this.camera);
    }
    computeDirectIrradiance(e3) {
      var _a2, _b2;
      const t2 = this.directIrradianceMaterial;
      t2.defines.OUTPUT = e3.output, t2.additive = e3.additive, this.type === HalfFloatType ? t2.defines.TRANSMITTANCE_PRECISION_LOG = "1" : delete t2.defines.TRANSMITTANCE_PRECISION_LOG, t2.needsUpdate = true;
      const r4 = t2.uniforms;
      r4.transmittanceTexture.value = (_b2 = (_a2 = e3.context.opticalDepth) == null ? void 0 : _a2.texture) != null ? _b2 : this.transmittanceRenderTarget.texture, this.mesh.material = t2, this.renderer.setRenderTarget(e3.renderTarget), this.renderer.render(this.scene, this.camera);
    }
    computeSingleScattering(e3) {
      var _a2, _b2;
      const t2 = this.singleScatteringMaterial;
      t2.defines.OUTPUT = e3.output, t2.additive = e3.additive, this.type === HalfFloatType ? t2.defines.TRANSMITTANCE_PRECISION_LOG = "1" : delete t2.defines.TRANSMITTANCE_PRECISION_LOG, t2.needsUpdate = true;
      const r4 = t2.uniforms;
      r4.transmittanceTexture.value = (_b2 = (_a2 = e3.context.opticalDepth) == null ? void 0 : _a2.texture) != null ? _b2 : this.transmittanceRenderTarget.texture, t2.setUniforms(e3.context), this.mesh.material = t2, this.render3DRenderTarget(e3.renderTarget, t2);
    }
    computeScatteringDensity(e3) {
      var _a2, _b2;
      const t2 = this.scatteringDensityMaterial;
      this.type === HalfFloatType ? t2.defines.TRANSMITTANCE_PRECISION_LOG = "1" : delete t2.defines.TRANSMITTANCE_PRECISION_LOG, t2.needsUpdate = true;
      const r4 = t2.uniforms;
      r4.transmittanceTexture.value = (_b2 = (_a2 = e3.context.opticalDepth) == null ? void 0 : _a2.texture) != null ? _b2 : this.transmittanceRenderTarget.texture, r4.scatteringOrder.value = e3.scatteringOrder, t2.setUniforms(e3.context), this.mesh.material = t2, this.render3DRenderTarget(e3.renderTarget, t2);
    }
    computeIndirectIrradiance(e3) {
      const t2 = this.indirectIrradianceMaterial;
      t2.defines.OUTPUT = e3.output, t2.additive = e3.additive, t2.needsUpdate = true;
      const r4 = t2.uniforms;
      r4.scatteringOrder.value = e3.scatteringOrder - 1, t2.setUniforms(e3.context), this.mesh.material = t2, this.renderer.setRenderTarget(e3.renderTarget), this.renderer.render(this.scene, this.camera);
    }
    computeMultipleScattering(e3) {
      var _a2, _b2;
      const t2 = this.multipleScatteringMaterial;
      t2.defines.OUTPUT = e3.output, t2.additive = e3.additive, this.type === HalfFloatType ? t2.defines.TRANSMITTANCE_PRECISION_LOG = "1" : delete t2.defines.TRANSMITTANCE_PRECISION_LOG, t2.needsUpdate = true;
      const r4 = t2.uniforms;
      r4.transmittanceTexture.value = (_b2 = (_a2 = e3.context.opticalDepth) == null ? void 0 : _a2.texture) != null ? _b2 : this.transmittanceRenderTarget.texture, t2.setUniforms(e3.context), this.mesh.material = t2, this.render3DRenderTarget(e3.renderTarget, t2);
    }
    *precompute(e3, t2) {
      this.computeTransmittance({
        renderTarget: this.transmittanceRenderTarget
      }), this.type === HalfFloatType && (G2(e3.opticalDepth != null), this.computeOpticalDepth({
        renderTarget: e3.opticalDepth
      })), this.computeDirectIrradiance({
        renderTarget: e3.deltaIrradiance,
        context: e3,
        output: "deltaIrradiance",
        additive: false
      }), this.computeDirectIrradiance({
        renderTarget: this.irradianceRenderTarget,
        context: e3,
        output: "irradiance",
        additive: t2
      }), this.renderer.setRenderTarget(null), yield, this.computeSingleScattering({
        renderTarget: e3.deltaRayleighScattering,
        context: e3,
        output: "deltaRayleigh",
        additive: false
      }), this.computeSingleScattering({
        renderTarget: e3.deltaMieScattering,
        context: e3,
        output: "deltaMie",
        additive: false
      }), this.computeSingleScattering({
        renderTarget: this.scatteringRenderTarget,
        context: e3,
        output: "scattering",
        additive: t2
      }), this.singleMieScatteringRenderTarget != null && this.computeSingleScattering({
        renderTarget: this.singleMieScatteringRenderTarget,
        context: e3,
        output: "singleMieScattering",
        additive: t2
      }), this.renderer.setRenderTarget(null), yield;
      for (let r4 = 2; r4 <= 4; ++r4)
        this.computeScatteringDensity({
          renderTarget: e3.deltaScatteringDensity,
          context: e3,
          scatteringOrder: r4
        }), this.computeIndirectIrradiance({
          renderTarget: e3.deltaIrradiance,
          context: e3,
          scatteringOrder: r4,
          output: "deltaIrradiance",
          additive: false
        }), this.computeIndirectIrradiance({
          renderTarget: this.irradianceRenderTarget,
          context: e3,
          scatteringOrder: r4,
          output: "irradiance",
          additive: true
        }), this.computeMultipleScattering({
          renderTarget: e3.deltaMultipleScattering,
          context: e3,
          output: "deltaMultipleScattering",
          additive: false
        }), this.computeMultipleScattering({
          renderTarget: this.scatteringRenderTarget,
          context: e3,
          output: "scattering",
          additive: true
        }), this.higherOrderScatteringRenderTarget != null && this.computeMultipleScattering({
          renderTarget: this.higherOrderScatteringRenderTarget,
          context: e3,
          output: "scattering",
          additive: true
        }), this.renderer.setRenderTarget(null), yield;
    }
    async update(e3 = n0.DEFAULT) {
      var _a2;
      this.updating = true;
      const t2 = e3.toUniform();
      this.transmittanceMaterial.uniforms.ATMOSPHERE = t2, this.directIrradianceMaterial.uniforms.ATMOSPHERE = t2, this.singleScatteringMaterial.uniforms.ATMOSPHERE = t2, this.scatteringDensityMaterial.uniforms.ATMOSPHERE = t2, this.indirectIrradianceMaterial.uniforms.ATMOSPHERE = t2, this.multipleScatteringMaterial.uniforms.ATMOSPHERE = t2;
      const r4 = this.renderer, i3 = new li(this.type);
      i3.lambdas.set(680, 550, 440), i3.luminanceFromRadiance.identity();
      const a3 = r4.autoClear;
      return r4.autoClear = false, await ui(this.precompute(i3, false)), r4.autoClear = a3, i3.dispose(), await gt2(
        this.renderer,
        this.transmittanceRenderTarget,
        this.transmittanceRenderTarget.texture
      ), await gt2(
        this.renderer,
        this.irradianceRenderTarget,
        this.irradianceRenderTarget.texture
      ), this.updating = false, (_a2 = this.disposeQueue) == null ? void 0 : _a2.call(this), this.textures;
    }
    dispose(e3 = {}) {
      var _a2, _b2, _c, _d;
      if (this.updating) {
        this.disposeQueue = () => {
          this.dispose(e3), this.disposeQueue = void 0;
        };
        return;
      }
      const { textures: t2 = true } = e3;
      t2 || (this.transmittanceRenderTarget.textures.splice(0, 1), this.scatteringRenderTarget.textures.splice(0, 1), this.irradianceRenderTarget.textures.splice(0, 1), (_a2 = this.singleMieScatteringRenderTarget) == null ? void 0 : _a2.textures.splice(0, 1), (_b2 = this.higherOrderScatteringRenderTarget) == null ? void 0 : _b2.textures.splice(0, 1)), this.transmittanceRenderTarget.dispose(), this.scatteringRenderTarget.dispose(), this.irradianceRenderTarget.dispose(), (_c = this.singleMieScatteringRenderTarget) == null ? void 0 : _c.dispose(), (_d = this.higherOrderScatteringRenderTarget) == null ? void 0 : _d.dispose(), this.transmittanceMaterial.dispose(), this.directIrradianceMaterial.dispose(), this.singleScatteringMaterial.dispose(), this.scatteringDensityMaterial.dispose(), this.indirectIrradianceMaterial.dispose(), this.multipleScatteringMaterial.dispose(), this.mesh.geometry.dispose();
    }
  };
  function di(n4) {
    var e3 = [];
    if (n4.length === 0)
      return "";
    if (typeof n4[0] != "string")
      throw new TypeError("Url must be a string. Received " + n4[0]);
    if (n4[0].match(/^[^/:]+:\/*$/) && n4.length > 1) {
      var t2 = n4.shift();
      n4[0] = t2 + n4[0];
    }
    n4[0].match(/^file:\/\/\//) ? n4[0] = n4[0].replace(/^([^/:]+):\/*/, "$1:///") : n4[0] = n4[0].replace(/^([^/:]+):\/*/, "$1://");
    for (var r4 = 0; r4 < n4.length; r4++) {
      var i3 = n4[r4];
      if (typeof i3 != "string")
        throw new TypeError("Url must be a string. Received " + i3);
      i3 !== "" && (r4 > 0 && (i3 = i3.replace(/^[\/]+/, "")), r4 < n4.length - 1 ? i3 = i3.replace(/[\/]+$/, "") : i3 = i3.replace(/[\/]+$/, "/"), e3.push(i3));
    }
    var a3 = e3.join("/");
    a3 = a3.replace(/\/(\?|&|#[^!])/g, "$1");
    var o3 = a3.split("?");
    return a3 = o3.shift() + (o3.length > 0 ? "?" : "") + o3.join("&"), a3;
  }
  function hi() {
    var n4;
    return typeof arguments[0] == "object" ? n4 = arguments[0] : n4 = [].slice.call(arguments), di(n4);
  }
  var pt = {
    width: C3,
    height: p2
  };
  var R0 = {
    width: U2,
    height: g3,
    depth: N2
  };
  var Tt2 = {
    width: f2,
    height: A3
  };
  var Bi = class extends Loader {
    constructor({
      format: e3 = "exr",
      type: t2 = HalfFloatType,
      combinedScattering: r4 = true,
      higherOrderScattering: i3 = true
    } = {}, a3) {
      super(a3), this.format = e3, this.type = t2, this.combinedScattering = r4, this.higherOrderScattering = i3;
    }
    setType(e3) {
      return this.type = Pr(e3) ? FloatType : HalfFloatType, this;
    }
    load(e3, t2, r4, i3) {
      const a3 = {}, o3 = ({
        key: c3,
        loader: s,
        path: l3
      }) => (s.setRequestHeader(this.requestHeader), s.setPath(this.path), s.setWithCredentials(this.withCredentials), s.load(
        hi(e3, l3),
        (d3) => {
          var _a2;
          d3.type = this.type, this.type === FloatType && (cs(d3.image), d3.image.data != null && (d3.image.data = new Float32Array(
            new A2((_a2 = d3.image.data) == null ? void 0 : _a2.buffer)
          ))), d3.minFilter = LinearFilter, d3.magFilter = LinearFilter, a3[`${c3}Texture`] = d3, a3.irradianceTexture != null && a3.scatteringTexture != null && a3.transmittanceTexture != null && (this.combinedScattering || a3.singleMieScatteringTexture != null) && (!this.higherOrderScattering || a3.higherOrderScatteringTexture != null) && (t2 == null ? void 0 : t2(a3));
        },
        r4,
        i3
      ));
      return this.format === "exr" ? {
        transmittanceTexture: o3({
          key: "transmittance",
          loader: new Qr(pt, this.manager),
          path: "transmittance.exr"
        }),
        scatteringTexture: o3({
          key: "scattering",
          loader: new $r(R0, this.manager),
          path: "scattering.exr"
        }),
        irradianceTexture: o3({
          key: "irradiance",
          loader: new Qr(Tt2, this.manager),
          path: "irradiance.exr"
        }),
        singleMieScatteringTexture: this.combinedScattering ? void 0 : o3({
          key: "singleMieScattering",
          loader: new $r(R0, this.manager),
          path: "single_mie_scattering.exr"
        }),
        higherOrderScatteringTexture: this.higherOrderScattering ? o3({
          key: "higherOrderScattering",
          loader: new $r(R0, this.manager),
          path: "higher_order_scattering.exr"
        }) : void 0
      } : {
        transmittanceTexture: o3({
          key: "transmittance",
          loader: new fr(
            DataTexture,
            rs,
            pt,
            this.manager
          ),
          path: "transmittance.bin"
        }),
        scatteringTexture: o3({
          key: "scattering",
          loader: new fr(
            Data3DTexture,
            rs,
            R0,
            this.manager
          ),
          path: "scattering.bin"
        }),
        irradianceTexture: o3({
          key: "irradiance",
          loader: new fr(
            DataTexture,
            rs,
            Tt2,
            this.manager
          ),
          path: "irradiance.bin"
        }),
        singleMieScatteringTexture: this.combinedScattering ? void 0 : o3({
          key: "singleMieScattering",
          loader: new fr(
            Data3DTexture,
            rs,
            R0,
            this.manager
          ),
          path: "single_mie_scattering.bin"
        }),
        higherOrderScatteringTexture: this.higherOrderScattering ? o3({
          key: "higherOrderScattering",
          loader: new fr(
            Data3DTexture,
            rs,
            R0,
            this.manager
          ),
          path: "higher_order_scattering.bin"
        }) : void 0
      };
    }
  };
  function mi({ topRadius: n4, bottomRadius: e3 }, t2, r4, i3) {
    const a3 = (t2 - e3) / (n4 - e3), o3 = r4 * 0.5 + 0.5;
    return i3.set(
      ne2(o3, f2),
      ne2(a3, A3)
    );
  }
  var fi = 1 / Math.sqrt(Math.PI);
  var Ee2 = Math.sqrt(3) / (2 * Math.sqrt(Math.PI));
  var gi = /* @__PURE__ */ new Vector3();
  var _e2 = /* @__PURE__ */ new Vector3();
  var pi = /* @__PURE__ */ new Vector2();
  var Ti = /* @__PURE__ */ new Matrix3();
  var Si = {
    ellipsoid: N.WGS84,
    correctAltitude: true
  };
  var Wi = class extends LightProbe {
    constructor(e3, t2 = n0.DEFAULT) {
      var _a2;
      super(), this.atmosphere = t2, this.worldToECEFMatrix = new Matrix4();
      const {
        irradianceTexture: r4 = null,
        ellipsoid: i3,
        correctAltitude: a3,
        sunDirection: o3
      } = { ...Si, ...e3 };
      this.irradianceTexture = r4, this.ellipsoid = i3, this.correctAltitude = a3, this.sunDirection = (_a2 = o3 == null ? void 0 : o3.clone()) != null ? _a2 : new Vector3();
    }
    update() {
      if (this.irradianceTexture == null)
        return;
      const e3 = this.worldToECEFMatrix, t2 = Ti.setFromMatrix4(e3).transpose(), i3 = this.getWorldPosition(gi).applyMatrix4(e3);
      if (this.correctAltitude) {
        const m4 = this.ellipsoid.projectOnSurface(
          i3,
          _e2
        );
        m4 != null && i3.add(
          X(
            m4,
            this.atmosphere.bottomRadius,
            this.ellipsoid,
            _e2
          )
        );
      }
      const a3 = i3.length(), o3 = i3.dot(this.sunDirection) / a3, c3 = mi(this.atmosphere, a3, o3, pi), s = Yt(this.irradianceTexture, c3, _e2);
      s.multiply(this.atmosphere.skyRadianceToRelativeLuminance);
      const l3 = this.ellipsoid.getSurfaceNormal(i3).applyMatrix3(t2), d3 = this.sh.coefficients;
      d3[0].copy(s).multiplyScalar(fi), d3[1].copy(s).multiplyScalar(Ee2 * l3.y), d3[2].copy(s).multiplyScalar(Ee2 * l3.z), d3[3].copy(s).multiplyScalar(Ee2 * l3.x);
    }
  };
  var vi = `precision highp float;
precision highp sampler3D;

#define RECIPROCAL_PI 0.3183098861837907

#include "core/raySphereIntersection"

#include "bruneton/definitions"

uniform AtmosphereParameters ATMOSPHERE;
uniform vec3 SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform vec3 SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;

uniform sampler2D transmittance_texture;
uniform sampler3D scattering_texture;
uniform sampler2D irradiance_texture;
uniform sampler3D single_mie_scattering_texture;
uniform sampler3D higher_order_scattering_texture;

#include "bruneton/common"
#include "bruneton/runtime"

#include "sky"

uniform vec3 sunDirection;
uniform vec3 moonDirection;
uniform float moonAngularRadius;
uniform float lunarRadianceScale;
uniform vec3 groundAlbedo;

#ifdef HAS_SHADOW_LENGTH
uniform sampler2D shadowLengthBuffer;
#endif // HAS_SHADOW_LENGTH

in vec2 vUv;
in vec3 vCameraPosition;
in vec3 vRayDirection;

layout(location = 0) out vec4 outputColor;

#include <mrt_layout>

void main() {
  float shadowLength = 0.0;
  #ifdef HAS_SHADOW_LENGTH
  shadowLength = texture(shadowLengthBuffer, vUv).r;
  #endif // HAS_SHADOW_LENGTH

  vec3 cameraPosition = vCameraPosition;
  vec3 rayDirection = normalize(vRayDirection);

  #ifdef GROUND_ALBEDO

  float r = length(cameraPosition);
  float mu = dot(cameraPosition, rayDirection) / r;
  bool intersectsGround = RayIntersectsGround(ATMOSPHERE, r, mu);
  if (intersectsGround) {
    float distanceToGround = raySphereFirstIntersection(
      cameraPosition,
      rayDirection,
      ATMOSPHERE.bottom_radius
    );
    vec3 groundPosition = rayDirection * distanceToGround + cameraPosition;
    vec3 surfaceNormal = normalize(groundPosition);
    vec3 skyIrradiance;
    vec3 sunIrradiance = GetSunAndSkyIrradiance(
      cameraPosition,
      surfaceNormal,
      sunDirection,
      skyIrradiance
    );
    vec3 transmittance;
    vec3 inscatter = GetSkyRadianceToPoint(
      cameraPosition,
      ATMOSPHERE.bottom_radius * surfaceNormal,
      shadowLength,
      sunDirection,
      transmittance
    );
    vec3 radiance = groundAlbedo * RECIPROCAL_PI * (sunIrradiance + skyIrradiance);
    outputColor.rgb = radiance * transmittance + inscatter;
  } else {
    outputColor.rgb = getSkyRadiance(
      cameraPosition,
      rayDirection,
      shadowLength,
      sunDirection,
      moonDirection,
      moonAngularRadius,
      lunarRadianceScale
    );
  }

  #else // GROUND_ALBEDO

  outputColor.rgb = getSkyRadiance(
    cameraPosition,
    rayDirection,
    shadowLength,
    sunDirection,
    moonDirection,
    moonAngularRadius,
    lunarRadianceScale
  );

  #endif // GROUND_ALBEDO

  outputColor.a = 1.0;

  #include <mrt_output>
}
`;
  var Ei = `precision highp float;
precision highp sampler3D;

uniform mat4 inverseProjectionMatrix;
uniform mat4 inverseViewMatrix;
uniform vec3 cameraPosition;
uniform mat4 worldToECEFMatrix;
uniform vec3 altitudeCorrection;

layout(location = 0) in vec3 position;

out vec2 vUv;
out vec3 vCameraPosition;
out vec3 vRayDirection;

void getCameraRay(out vec3 origin, out vec3 direction) {
  bool isPerspective = inverseProjectionMatrix[2][3] != 0.0; // 4th entry in the 3rd column

  if (isPerspective) {
    // Calculate the camera ray for a perspective camera.
    vec4 viewPosition = inverseProjectionMatrix * vec4(position, 1.0);
    vec4 worldDirection = inverseViewMatrix * vec4(viewPosition.xyz, 0.0);
    origin = cameraPosition;
    direction = worldDirection.xyz;
  } else {
    // Unprojected points to calculate direction.
    vec4 nearPoint = inverseProjectionMatrix * vec4(position.xy, -1.0, 1.0);
    vec4 farPoint = inverseProjectionMatrix * vec4(position.xy, -0.9, 1.0);
    nearPoint /= nearPoint.w;
    farPoint /= farPoint.w;

    // Calculate world values
    vec4 worldDirection = inverseViewMatrix * vec4(farPoint.xyz - nearPoint.xyz, 0.0);
    vec4 worldOrigin = inverseViewMatrix * nearPoint;

    // Outputs
    direction = worldDirection.xyz;
    origin = worldOrigin.xyz;
  }
}

void main() {
  vUv = position.xy * 0.5 + 0.5;

  vec3 direction, origin;
  getCameraRay(origin, direction);

  vec3 cameraPositionECEF = (worldToECEFMatrix * vec4(origin, 1.0)).xyz;
  vCameraPosition = (cameraPositionECEF + altitudeCorrection) * METER_TO_LENGTH_UNIT;
  vRayDirection = (worldToECEFMatrix * vec4(direction, 0.0)).xyz;

  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;
  var _i = Object.defineProperty;
  var Ye = (n4, e3, t2, r4) => {
    for (var i3 = void 0, a3 = n4.length - 1, o3; a3 >= 0; a3--)
      (o3 = n4[a3]) && (i3 = o3(e3, t2, i3) || i3);
    return i3 && _i(e3, t2, i3), i3;
  };
  var Ri = {
    ...Be2,
    sun: true,
    moon: true,
    moonAngularRadius: 45e-4,
    // ≈ 15.5 arcminutes
    lunarRadianceScale: 1,
    ground: true,
    groundAlbedo: new Color(0)
  };
  var Ke = class extends se2 {
    constructor(e3) {
      var _a2;
      const {
        sun: t2,
        moon: r4,
        moonDirection: i3,
        moonAngularRadius: a3,
        lunarRadianceScale: o3,
        ground: c3,
        groundAlbedo: s,
        ...l3
      } = { ...Ri, ...e3 };
      super({
        name: "SkyMaterial",
        glslVersion: GLSL3,
        vertexShader: Ei,
        fragmentShader: Ar(vi, {
          core: { raySphereIntersection: u2 },
          bruneton: {
            common: e2,
            definitions: t,
            runtime: n3
          },
          sky: Ct2
        }),
        ...l3,
        uniforms: {
          inverseProjectionMatrix: new Uniform(new Matrix4()),
          inverseViewMatrix: new Uniform(new Matrix4()),
          moonDirection: new Uniform((_a2 = i3 == null ? void 0 : i3.clone()) != null ? _a2 : new Vector3()),
          moonAngularRadius: new Uniform(a3),
          lunarRadianceScale: new Uniform(o3),
          groundAlbedo: new Uniform(s.clone()),
          shadowLengthBuffer: new Uniform(null),
          ...l3.uniforms
        },
        defines: {
          PERSPECTIVE_CAMERA: "1"
        },
        depthWrite: false,
        depthTest: true
      }), this.shadowLength = null, this.sun = t2, this.moon = r4, this.ground = c3;
    }
    onBeforeRender(e3, t2, r4, i3, a3, o3) {
      super.onBeforeRender(e3, t2, r4, i3, a3, o3);
      const { uniforms: c3, defines: s } = this;
      c3.inverseProjectionMatrix.value.copy(r4.projectionMatrixInverse), c3.inverseViewMatrix.value.copy(r4.matrixWorld);
      const l3 = s.PERSPECTIVE_CAMERA != null, d3 = r4.isPerspectiveCamera === true;
      d3 !== l3 && (d3 ? s.PERSPECTIVE_CAMERA = "1" : delete s.PERSPECTIVE_CAMERA, this.needsUpdate = true);
      const m4 = this.groundAlbedo, f4 = s.GROUND_ALBEDO != null, v3 = m4.r !== 0 || m4.g !== 0 || m4.b !== 0;
      v3 !== f4 && (v3 ? this.defines.GROUND_ALBEDO = "1" : delete this.defines.GROUND_ALBEDO, this.needsUpdate = true);
      const T3 = this.shadowLength, E3 = s.HAS_SHADOW_LENGTH != null, x3 = T3 != null;
      x3 !== E3 && (x3 ? s.HAS_SHADOW_LENGTH = "1" : (delete s.HAS_SHADOW_LENGTH, c3.shadowLengthBuffer.value = null), this.needsUpdate = true), x3 && (c3.shadowLengthBuffer.value = T3.map);
    }
    get moonDirection() {
      return this.uniforms.moonDirection.value;
    }
    get moonAngularRadius() {
      return this.uniforms.moonAngularRadius.value;
    }
    set moonAngularRadius(e3) {
      this.uniforms.moonAngularRadius.value = e3;
    }
    get lunarRadianceScale() {
      return this.uniforms.lunarRadianceScale.value;
    }
    set lunarRadianceScale(e3) {
      this.uniforms.lunarRadianceScale.value = e3;
    }
    get groundAlbedo() {
      return this.uniforms.groundAlbedo.value;
    }
  };
  Ye([
    Vr("SUN")
  ], Ke.prototype, "sun");
  Ye([
    Vr("MOON")
  ], Ke.prototype, "moon");
  Ye([
    Vr("GROUND")
  ], Ke.prototype, "ground");
  var ji = class extends BufferGeometry {
    constructor(e3) {
      super();
      const t2 = new Int16Array(e3), r4 = new Uint8Array(e3), i3 = new InterleavedBuffer(t2, 5), a3 = new InterleavedBuffer(r4, 10);
      this.setAttribute(
        "position",
        new InterleavedBufferAttribute(i3, 3, 0, true)
      ), this.setAttribute(
        "magnitude",
        new InterleavedBufferAttribute(a3, 1, 6, true)
      ), this.setAttribute(
        "color",
        new InterleavedBufferAttribute(a3, 3, 7, true)
      ), this.boundingSphere = new Sphere(new Vector3(), 1);
    }
  };
  var xi = `precision highp float;
precision highp sampler3D;

#include "bruneton/definitions"

uniform AtmosphereParameters ATMOSPHERE;
uniform vec3 SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform vec3 SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;

uniform sampler2D transmittance_texture;
uniform sampler3D scattering_texture;
uniform sampler2D irradiance_texture;
uniform sampler3D single_mie_scattering_texture;
uniform sampler3D higher_order_scattering_texture;

#include "bruneton/common"
#include "bruneton/runtime"

uniform vec3 sunDirection;

in vec3 vCameraPosition;
in vec3 vRayDirection;

layout(location = 0) out vec4 outputColor;

#include <mrt_layout>

in vec3 vColor;

void main() {
  #if !defined(PERSPECTIVE_CAMERA)
  outputColor = vec4(0.0);
  discard; // Rendering celestial objects without perspective doesn't make sense.
  #endif // !defined(PERSPECTIVE_CAMERA)

  #ifdef BACKGROUND
  vec3 rayDirection = normalize(vRayDirection);
  float r = length(vCameraPosition);
  float mu = dot(vCameraPosition, rayDirection) / r;

  if (RayIntersectsGround(ATMOSPHERE, r, mu)) {
    discard;
  }

  vec3 transmittance;
  vec3 radiance = GetSkyRadiance(
    vCameraPosition,
    normalize(vRayDirection),
    0.0, // Shadow length
    sunDirection,
    transmittance
  );
  radiance += transmittance * vColor;
  outputColor = vec4(radiance, 1.0);
  #else // BACKGROUND
  outputColor = vec4(vColor, 1.0);
  #endif // BACKGROUND

  #include <mrt_output>
}
`;
  var Mi = `precision highp float;
precision highp sampler3D;

#define saturate(x) clamp(x, 0.0, 1.0)

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 viewMatrix;
uniform mat4 matrixWorld;
uniform vec3 cameraPosition;
uniform float cameraFar;
uniform mat4 worldToECEFMatrix;
uniform vec3 altitudeCorrection;
uniform float pointSize;
uniform vec2 magnitudeRange;
uniform float intensity;

layout(location = 0) in vec3 position;
layout(location = 1) in float magnitude;
layout(location = 2) in vec3 color;

out vec3 vCameraPosition;
out vec3 vRayDirection;
out vec3 vEllipsoidCenter;
out vec3 vColor;

void main() {
  // Magnitude is stored between 0 to 1 within the given range.
  float m = mix(magnitudeRange.x, magnitudeRange.y, magnitude);
  vec3 v = pow(vec3(10.0), -vec3(magnitudeRange, m) / 2.5);
  vColor = vec3(intensity * color);
  vColor *= saturate((v.z - v.y) / (v.x - v.y));

  #ifdef BACKGROUND
  vec3 worldDirection = normalize(matrixWorld * vec4(position, 1.0)).xyz;
  vec3 cameraPositionECEF = (worldToECEFMatrix * vec4(cameraPosition, 1.0)).xyz;
  vCameraPosition = (cameraPositionECEF + altitudeCorrection) * METER_TO_LENGTH_UNIT;
  vRayDirection = (worldToECEFMatrix * vec4(worldDirection, 0.0)).xyz;
  gl_Position =
    projectionMatrix * viewMatrix * vec4(cameraPosition + worldDirection * cameraFar, 1.0);
  #else // BACKGROUND
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #endif // BACKGROUND

  gl_PointSize = pointSize;
}
`;
  var Ai = Object.defineProperty;
  var Kt2 = (n4, e3, t2, r4) => {
    for (var i3 = void 0, a3 = n4.length - 1, o3; a3 >= 0; a3--)
      (o3 = n4[a3]) && (i3 = o3(e3, t2, i3) || i3);
    return i3 && Ai(e3, t2, i3), i3;
  };
  var wi = {
    ...Be2,
    pointSize: 1,
    intensity: 1,
    background: true,
    ground: true
  };
  var $t2 = class extends se2 {
    constructor(e3) {
      const { pointSize: t2, intensity: r4, background: i3, ground: a3, ...o3 } = {
        ...wi,
        ...e3
      };
      super({
        name: "StarsMaterial",
        glslVersion: GLSL3,
        vertexShader: Mi,
        fragmentShader: Ar(xi, {
          bruneton: {
            common: e2,
            definitions: t,
            runtime: n3
          }
        }),
        ...o3,
        uniforms: {
          projectionMatrix: new Uniform(new Matrix4()),
          modelViewMatrix: new Uniform(new Matrix4()),
          viewMatrix: new Uniform(new Matrix4()),
          matrixWorld: new Uniform(new Matrix4()),
          cameraFar: new Uniform(0),
          pointSize: new Uniform(0),
          magnitudeRange: new Uniform(new Vector2(-2, 8)),
          intensity: new Uniform(r4),
          ...o3.uniforms
        },
        defines: {
          PERSPECTIVE_CAMERA: "1"
        },
        depthWrite: true,
        depthTest: true
      }), this.pointSize = t2, this.background = i3, this.ground = a3;
    }
    onBeforeRender(e3, t2, r4, i3, a3, o3) {
      super.onBeforeRender(e3, t2, r4, i3, a3, o3);
      const c3 = this.uniforms;
      c3.projectionMatrix.value.copy(r4.projectionMatrix), c3.modelViewMatrix.value.copy(r4.modelViewMatrix), c3.viewMatrix.value.copy(r4.matrixWorldInverse), c3.matrixWorld.value.copy(a3.matrixWorld), c3.cameraFar.value = r4.far, c3.pointSize.value = this.pointSize * e3.getPixelRatio();
      const s = r4.isPerspectiveCamera === true;
      this.defines.PERSPECTIVE_CAMERA != null !== s && (s ? this.defines.PERSPECTIVE_CAMERA = "1" : delete this.defines.PERSPECTIVE_CAMERA, this.needsUpdate = true);
    }
    get magnitudeRange() {
      return this.uniforms.magnitudeRange.value;
    }
    get intensity() {
      return this.uniforms.intensity.value;
    }
    set intensity(e3) {
      this.uniforms.intensity.value = e3;
    }
  };
  Kt2([
    Vr("BACKGROUND")
  ], $t2.prototype, "background");
  Kt2([
    Vr("GROUND")
  ], $t2.prototype, "ground");
  var yi = /* @__PURE__ */ new Vector3();
  var Ci = /* @__PURE__ */ new Matrix3();
  var Di = {
    ellipsoid: N.WGS84,
    correctAltitude: true,
    distance: 1
  };
  var Xi = class extends DirectionalLight {
    constructor(e3, t2 = n0.DEFAULT) {
      var _a2;
      super(), this.atmosphere = t2, this.worldToECEFMatrix = new Matrix4();
      const {
        irradianceTexture: r4 = null,
        ellipsoid: i3,
        correctAltitude: a3,
        sunDirection: o3,
        distance: c3
      } = { ...Di, ...e3 };
      this.transmittanceTexture = r4, this.ellipsoid = i3, this.correctAltitude = a3, this.sunDirection = (_a2 = o3 == null ? void 0 : o3.clone()) != null ? _a2 : new Vector3(), this.distance = c3;
    }
    update() {
      const e3 = this.worldToECEFMatrix, t2 = Ci.setFromMatrix4(e3).transpose();
      if (this.position.copy(this.sunDirection).applyMatrix3(t2).normalize().multiplyScalar(this.distance).add(this.target.position), this.transmittanceTexture == null)
        return;
      const r4 = this.target.getWorldPosition(yi).applyMatrix4(e3);
      ei(
        this.transmittanceTexture,
        r4,
        this.sunDirection,
        this.color,
        {
          ellipsoid: this.ellipsoid,
          correctAltitude: this.correctAltitude
        },
        this.atmosphere
      );
    }
  };

  // node_modules/@takram/three-atmosphere/build/index.js
  var u4 = /* @__PURE__ */ new Vector3();
  function D4(t2, r4 = new Color()) {
    const a3 = t2, o3 = a3 ** 2, T3 = (0.860117757 + 154118254e-12 * a3 + 128641212e-15 * o3) / (1 + 842420235e-12 * a3 + 708145163e-15 * o3), E3 = (0.317398726 + 422806245e-13 * a3 + 420481691e-16 * o3) / (1 - 289741816e-13 * a3 + 161456053e-15 * o3), c3 = 3 * T3 / (2 * T3 - 8 * E3 + 4), s = 2 * E3 / (2 * T3 - 8 * E3 + 4), i3 = 1, _3 = s > 0 ? c3 * i3 / s : 0, S4 = s > 0 ? (1 - c3 - s) * i3 / s : 0, e3 = u4.set(_3, i3, S4).applyMatrix3(D3);
    return e3.x = Hr(e3.x), e3.y = Hr(e3.y), e3.z = Hr(e3.z), r4.setFromVector3(e3.normalize());
  }
  function f3(t2) {
    return 4600 * (1 / (0.92 * z3(t2, -0.4, 2) + 1.7) + 1 / (0.92 * t2 + 0.62));
  }
  function U3(t2, r4 = new Color()) {
    return D4(
      f3(t2),
      r4
    );
  }

  // scripts/.tmp-build-takram-atmosphere-entry.mjs
  window.VRODOS_TAKRAM_ATMOSPHERE = build_exports;
})();
