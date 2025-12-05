// supermedium/superframe sun-sky component
// Ported to single file for local usage
// Adapted for A-Frame 1.7.0 / Three.js r173

var vertexShader = `
precision mediump float;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

var fragmentShader = `
precision mediump float;
layout(location = 0) out vec4 outColor;
uniform vec3 sunPosition;
in vec3 vWorldPosition;

vec3 cameraPos = vec3(0., 0., 0.);

uniform float luminance;
uniform float turbidity;
uniform float reileigh;
uniform float mieCoefficient;
uniform float mieDirectionalG;

// constants for atmospheric scattering
const float constE = 2.71828182845904523536028747135266249775724709369995957;
const float constPI = 3.141592653589793238462643383279502884197169;

const float refractiveIndex = 1.0003; // refractive index of air
const float numMolecules = 2.545E25; // number of molecules per unit volume for air at
// 288.15K and 1013mb (sea level -45 celsius)
const float depolarizationFactor = 0.035;  // depolatization factor for standard air

// wavelength of used primaries, according to preetham
const vec3 lambda = vec3(680.0e-9, 550.0e-9, 450.0e-9);

// mie stuff
// K coefficient for the primaries
const vec3 mieK = vec3(0.686, 0.678, 0.666);
const float mieV = 4.0;

// optical length at zenith for molecules
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const vec3 up = vec3(0.0, 1.0, 0.0);

const float EE = 1000.0;
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
// 66 arc seconds -> degrees, and the cosine of that

// earth shadow hack
const float cutoffAngle = constPI/1.95;
const float steepness = 1.5;

vec3 totalRayleigh(vec3 lambda_w)
{
  return (8.0 * pow(constPI, 3.0) * pow(pow(refractiveIndex, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * depolarizationFactor)) / (3.0 * numMolecules * pow(lambda_w, vec3(4.0)) * (6.0 - 7.0 * depolarizationFactor));
}

// see http://blenderartists.org/forum/showthread.php?321110-Shaders-and-Skybox-madness
// A simplied version of the total Rayleigh scattering to works on browsers that use ANGLE
vec3 simplifiedRayleigh()
{
  return 0.0005 / vec3(94.0, 40.0, 18.0);
}

float rayleighPhase(float cosTheta)
{
  return (3.0 / (16.0*constPI)) * (1.0 + pow(cosTheta, 2.0));
}

vec3 totalMie(vec3 lambda_w, vec3 K, float T)
{
  float c = (0.2 * T ) * 10.0e-18;
  return 0.434 * c * constPI * pow((2.0 * constPI) / lambda_w, vec3(mieV - 2.0)) * K;
}

float hgPhase(float cosTheta, float g)
{
  return (1.0 / (4.0*constPI)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));
}

float sunIntensity(float zenithAngleCos)
{
  return EE * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos))/steepness)));
}

// Filmic ToneMapping http://filmicgames.com/archives/75
float A = 0.15;
float B = 0.50;
float C = 0.10;
float D = 0.20;
float E = 0.02;
float F = 0.30;
float W = 1000.0;

vec3 Uncharted2Tonemap(vec3 x)
{
   return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

void main()
{
  float sunfade = 1.0-clamp(1.0-exp((sunPosition.y/450000.0)),0.0,1.0);

  float reileighCoefficient = reileigh - (1.0* (1.0-sunfade));

  vec3 sunDirection = normalize(sunPosition);

  float sunE = sunIntensity(dot(sunDirection, up));

  // extinction (absorbtion + out scattering)
  // rayleigh coefficients

  vec3 betaR = simplifiedRayleigh() * reileighCoefficient;

  // mie coefficients
  vec3 betaM = totalMie(lambda, mieK, turbidity) * mieCoefficient;

  // optical length
  // cutoff angle at 90 to avoid singularity in next formula.
  float zenithAngle = acos(max(0.0, dot(up, normalize(vWorldPosition - cameraPos))));
  float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / constPI), -1.253));
  float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / constPI), -1.253));

  // combined extinction factor
  vec3 Fex = exp(-(betaR * sR + betaM * sM));

  // in scattering
  float cosTheta = dot(normalize(vWorldPosition - cameraPos), sunDirection);

  float rPhase = rayleighPhase(cosTheta*0.5+0.5);
  vec3 betaRTheta = betaR * rPhase;

  float mPhase = hgPhase(cosTheta, mieDirectionalG);
  vec3 betaMTheta = betaM * mPhase;

  vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));
  Lin *= mix(vec3(1.0),pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex,vec3(1.0/2.0)),clamp(pow(1.0-dot(up, sunDirection),5.0),0.0,1.0));

  //nightsky
  vec3 direction = normalize(vWorldPosition - cameraPos);
  float theta = acos(direction.y); // elevation --> y-axis, [-pi/2, pi/2]
  float phi = atan(direction.z, direction.x); // azimuth --> x-axis [-pi/2, pi/2]
  vec2 uv = vec2(phi, theta) / vec2(2.0*constPI, constPI) + vec2(0.5, 0.0);
  // vec3 L0 = texture2D(skySampler, uv).rgb+0.1 * Fex;
  vec3 L0 = vec3(0.1) * Fex;

  // composition + solar disc
  float sundisk = smoothstep(sunAngularDiameterCos,sunAngularDiameterCos+0.00002,cosTheta);
  L0 += (sunE * 19000.0 * Fex)*sundisk;

  vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));

  vec3 texColor = (Lin+L0);
  texColor *= 0.04 ;
  texColor += vec3(0.0,0.001,0.0025)*0.3;

  float g_fMaxLuminance = 1.0;
  float fLumScaled = 0.1 / luminance;
  float fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled);

  float ExposureBias = fLumCompressed;

  vec3 curr = Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);
  vec3 color = curr*whiteScale;

  vec3 retColor = pow(color,vec3(1.0/(1.2+(1.2*sunfade))));

  outColor = vec4(retColor, 1.0);
}
`;

AFRAME.registerShader('sunSky', {
    schema: {
        luminance: { default: 1, min: 0, max: 2, is: 'uniform' },
        mieCoefficient: { default: 0.005, min: 0, max: 0.1, is: 'uniform' },
        mieDirectionalG: { default: 0.8, min: 0, max: 1, is: 'uniform' },
        reileigh: { default: 1, min: 0, max: 4, is: 'uniform' },
        sunPosition: { type: 'vec3', default: { x: 0, y: 0, z: -1 }, is: 'uniform' },
        turbidity: { default: 2, min: 0, max: 20, is: 'uniform' }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,

    /**
     * Fix for Three.js r173+: 
     * Explicitly disable fog in shader definition to prevent 
     * "Cannot read properties of undefined" crash loop when scene has global fog.
     */
    init: function (data) {
        this.material = new THREE.ShaderMaterial({
            uniforms: this.getUniforms(data),
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            fog: false,
            lights: false,
            glslVersion: THREE.GLSL3 // Force GLSL 3.0 for WebGL 2 correctness
        });
    },

    // Helper to construct uniforms from schema default/initial values
    getUniforms: function (data) {
        var uniforms = {};
        for (var key in this.schema) {
            if (this.schema[key].is === 'uniform') {
                var val = data[key];
                if (this.schema[key].type === 'vec3') {
                    // Robust handling: val might be string or object
                    if (typeof val === 'string') {
                        var parts = val.trim().split(/\s+/);
                        val = new THREE.Vector3(parseFloat(parts[0] || 0), parseFloat(parts[1] || 0), parseFloat(parts[2] || 0));
                    } else if (val) {
                        val = new THREE.Vector3(val.x, val.y, val.z);
                    } else {
                        val = new THREE.Vector3(0, 0, -1); // fallback
                    }
                }
                uniforms[key] = { value: val };
            }
        }
        return uniforms;
    },

    update: function (data) {
        if (!this.material) return;
        for (var key in data) {
            if (this.schema[key] && this.schema[key].is === 'uniform') {
                var val = data[key];
                if (this.schema[key].type === 'vec3') {
                    // Ensure it's a vector for Three.js
                    // A-Frame passes object {x,y,z}, but ShaderMaterial wants THREE.Vector3
                    if (this.material.uniforms[key].value instanceof THREE.Vector3) {
                        this.material.uniforms[key].value.set(val.x, val.y, val.z);
                    } else {
                        this.material.uniforms[key].value = val;
                    }
                } else {
                    this.material.uniforms[key].value = val;
                }
            }
        }
    }
});

AFRAME.registerPrimitive('a-sun-sky', {
    defaultComponents: {
        geometry: {
            primitive: 'sphere',
            radius: 5000,
            segmentsWidth: 64,
            segmentsHeight: 20
        },
        material: {
            shader: 'sunSky',
            side: 'back'
        },
        scale: '-1 1 1'
    },

    mappings: {
        luminance: 'material.luminance',
        miecoefficient: 'material.mieCoefficient',    // Lowercased for A-Frame warnings
        miedirectionalg: 'material.mieDirectionalG',  // Lowercased
        reileigh: 'material.reileigh',
        sunposition: 'material.sunPosition',          // Lowercased
        turbidity: 'material.turbidity'
    }
});
