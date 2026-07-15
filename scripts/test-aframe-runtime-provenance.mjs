import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const packageLock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8"));
const servicePackageJson = JSON.parse(readFileSync(resolve(root, "services/vrodos-network-runtime/package.json"), "utf8"));
const servicePackageLock = JSON.parse(readFileSync(resolve(root, "services/vrodos-network-runtime/package-lock.json"), "utf8"));
const libraryAudit = readFileSync(resolve(root, "documentation/runtime-library-audit.md"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(root, "assets/runtime-version-manifest.json"), "utf8"));
const declared = packageJson.vrodos?.runtime?.aframe;
const artifact = manifest.aframe;
const threeArtifact = manifest.three;
const lockedThree = packageLock.packages?.["node_modules/three"];

assert(declared, "package.json must declare vrodos.runtime.aframe metadata");
assert(artifact, "runtime-version-manifest.json must contain A-Frame metadata");
assert(manifest.schemaVersion === 2, "runtime version manifest must use schema v2");
assert(declared.version === "1.8.0", "A-Frame 1.8.0 must be declared");
assert(declared.commit === "e145c1a01a1cdc817329503d49cf5a9b0b32288b", "A-Frame must pin the audited r185 CDN artifact");
assert(artifact.version === declared.version, "A-Frame manifest version must match package.json");
assert(artifact.commit === declared.commit, "A-Frame manifest commit must match package.json");
assert(artifact.sourceCommit === declared.commit, "A-Frame manifest source commit must match package.json");
assert(artifact.url === declared.url, "A-Frame manifest URL must match package.json");
assert(artifact.bundlePath === "assets/vendor/aframe/aframe-master.min.js", "A-Frame local bundle path must be recorded");
assert(artifact.requestedPowerPreference === "high-performance", "A-Frame power preference invariant must be recorded");

const bundle = readFileSync(resolve(root, ...artifact.bundlePath.split("/")), "utf8");
const sha256 = createHash("sha256").update(bundle, "utf8").digest("hex");
assert(sha256 === artifact.sha256, "A-Frame local bundle SHA-256 must match the runtime manifest");
assert(artifact.artifactCommit, "A-Frame manifest must record the artifact's embedded build commit");
assert(artifact.artifactCommit === "4573b956", "A-Frame artifact must embed the audited r185 source commit");
assert(bundle.includes(artifact.artifactCommit), "A-Frame local bundle must identify its embedded build commit");
assert(bundle.includes(declared.version), "A-Frame local bundle must identify the declared version");
assert(
    /powerPreference\s*:\s*["']high-performance["']/.test(bundle),
    "A-Frame local bundle must request powerPreference: high-performance"
);

const runtimeManager = readFileSync(resolve(root, "includes/class-vrodos-render-runtime-manager.php"), "utf8");
const assetManager = readFileSync(resolve(root, "includes/class-vrodos-asset-manager.php"), "utf8");
assert(runtimeManager.includes("hash_file( 'sha256', $path )"), "runtime manager must hash the served local A-Frame artifact");
assert(runtimeManager.includes("hash_equals( $expected"), "runtime manager must compare the local A-Frame hash safely");
assert(!runtimeManager.includes("FALLBACK_AFRAME_RUNTIME_URL"), "runtime manager must not retain a CDN fallback");
assert(runtimeManager.includes("three_draco_decoder_url"), "runtime manager must expose the canonical Draco decoder URL");
assert(runtimeManager.includes("three_basis_transcoder_url"), "runtime manager must expose the canonical Basis transcoder URL");
assert(runtimeManager.includes("three_meshopt_decoder_url"), "runtime manager must expose the canonical Meshopt decoder URL");
assert(runtimeManager.includes("browser_library_versions"), "runtime manager must expose browser-library versions for cache busting");
assert(assetManager.includes("$browser_library_versions['stats-gl']"), "stats-gl registration must use its generated package version");
assert(assetManager.includes("$browser_library_versions['lil-gui']"), "lil-gui registration must use its generated package version");
assert(assetManager.includes("$browser_library_versions['lucide']"), "Lucide registration must use its generated package version");

assert(lockedThree?.version === "0.185.0", "package-lock.json must lock super-three 0.185.0");
assert(packageJson.devDependencies?.three === "npm:super-three@0.185.0", "package.json must declare exact super-three 0.185.0");
assert(packageJson.dependencies?.["@pmndrs/msdfonts"] === "1.0.74", "Direct MSDF import must have exact package ownership");
assert(packageJson.dependencies?.["@takram/three-geospatial"] === "0.9.1", "Direct Takram geospatial import must have exact package ownership");
for (const packageName of [
    "aframe-extras",
    "aframe-environment-component",
    "stats-gl",
    "lil-gui",
    "lucide"
]) {
    assert(packageJson.dependencies?.[packageName], `Browser library must have direct package ownership: ${packageName}`);
    assert(packageLock.packages?.[`node_modules/${packageName}`]?.version, `Browser library must be locked: ${packageName}`);
}
assert(threeArtifact?.version === lockedThree.version, "Three manifest version must match package-lock.json");
assert(threeArtifact?.revision === "185", "Three manifest revision must be 185");
assert(threeArtifact?.vendorDir === "three-r185", "Three manifest vendor directory must be three-r185");
assert(threeArtifact?.bundleFile === "vrodos-three-r185.bundle.js", "Three manifest bundle filename must be revisioned for r185");

const manifestVersions = {
    three: manifest.three?.version,
    postprocessing: manifest.postprocessing?.version,
    "@takram/three-atmosphere": manifest.takram?.atmosphereVersion,
    "@takram/three-clouds": manifest.takram?.cloudsVersion,
    "@takram/three-geospatial-effects": manifest.takram?.effectsVersion,
    "three-mesh-bvh": manifest.collisionBvh?.version,
    ...(manifest.browserLibraries?.versions || {})
};
for (const [packageName, manifestVersion] of Object.entries(manifestVersions)) {
    const lockedVersion = packageLock.packages?.[`node_modules/${packageName}`]?.version;
    assert(lockedVersion, `Runtime package must be locked: ${packageName}`);
    assert(manifestVersion === lockedVersion, `Runtime manifest version drift for ${packageName}: ${manifestVersion} != ${lockedVersion}`);
}
for (const relativePath of Object.values(manifest.browserLibraries?.files || {})) {
    assert(existsSync(resolve(root, ...relativePath.split("/"))), `Browser vendor artifact is missing: ${relativePath}`);
}
assert(
    manifest.browserLibraries?.files?.["stats-gl:main.js"] === "assets/vendor/stats-gl/main.js",
    "stats-gl must have one stable local browser bundle"
);
assert(!manifest.browserLibraries?.files?.["stats-gl:panel.js"], "stats-gl internals must not leak into the runtime manifest");
assert(!existsSync(resolve(root, "assets/vendor/stats-gl/panel.js")), "stale stats-gl internal modules must be removed");
const statsGlBundle = readFileSync(resolve(root, "assets/vendor/stats-gl/main.js"), "utf8");
assert(
    !/(?:from\s*|import\s*)["']\.\//.test(statsGlBundle),
    "stats-gl local bundle must not import unpublished sibling files"
);

function assertDirectDependenciesAudited(packageMetadata, lockMetadata, label) {
    const auditNames = {
        tailwindcss: "Tailwind CSS"
    };
    const dependencies = {
        ...(packageMetadata.dependencies || {}),
        ...(packageMetadata.devDependencies || {})
    };
    for (const packageName of Object.keys(dependencies)) {
        const lockedVersion = lockMetadata.packages?.[`node_modules/${packageName}`]?.version;
        assert(lockedVersion, `${label} direct dependency must be locked: ${packageName}`);
        const escapedName = (auditNames[packageName] || packageName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedVersion = lockedVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const auditRow = new RegExp(`^\\|[^\\n]*${escapedName}[^\\n]*\\|[^\\n]*${escapedVersion}[^\\n]*$`, "im");
        assert(auditRow.test(libraryAudit), `${label} direct dependency must be versioned in the library audit: ${packageName}@${lockedVersion}`);
    }
}

assertDirectDependenciesAudited(packageJson, packageLock, "Root");
assertDirectDependenciesAudited(servicePackageJson, servicePackageLock, "Network service");

const threeBundle = readFileSync(resolve(root, ...threeArtifact.bundlePath.split("/")), "utf8");
assert(threeBundle.includes('var REVISION = "185";'), "Editor Three bundle must contain revision 185");
assert(threeBundle.includes("VRODOS_THREE_CLASSIC_BUNDLE_URL"), "Editor Three bundle must contain the r185 classic-loader URL patch");
assert(threeBundle.includes('new URL("./draco/gltf/draco_decoder.wasm"'), "Editor Three bundle must resolve the r185 Draco default relative to its classic bundle");
assert(threeBundle.includes('new URL("./basis/basis_transcoder.wasm"'), "Editor Three bundle must resolve the r185 Basis default relative to its classic bundle");
assert(!/new URL\([^)]*import_meta\d*\.url/.test(threeBundle), "Editor Three bundle must not retain unusable import.meta decoder URLs");

const requiredDecoderAssets = [
    `${threeArtifact.decoders.dracoDecoderPath}draco_decoder.js`,
    `${threeArtifact.decoders.dracoDecoderPath}draco_decoder.wasm`,
    `${threeArtifact.decoders.dracoDecoderPath}draco_wasm_wrapper.js`,
    `${threeArtifact.decoders.basisTranscoderPath}basis_transcoder.js`,
    `${threeArtifact.decoders.basisTranscoderPath}basis_transcoder.wasm`,
    threeArtifact.decoders.meshoptDecoderPath
];
requiredDecoderAssets.forEach((relativePath) => {
    assert(existsSync(resolve(root, ...relativePath.split("/"))), `Required decoder asset is missing: ${relativePath}`);
});
assert(!existsSync(resolve(root, "assets/vendor/three-r185/fonts")), "The obsolete Helvetiker font directory must not be generated");
assert(!existsSync(resolve(root, "assets/vendor/three-r185/draco/gltf/draco_encoder.js")), "The obsolete browser Draco encoder must not be restored");

function authoredFiles(directory) {
    const ignoredDirectories = new Set([".git", "node_modules", "runtime/build", "assets/vendor", "assets/js/runtime/master/lib"]);
    const files = [];
    const visit = (current) => {
        const relative = current.slice(root.length + 1).replaceAll("\\", "/");
        const pathSegments = relative.split("/");
        if (pathSegments.includes("node_modules") || ignoredDirectories.has(relative) || [...ignoredDirectories].some((entry) => relative.startsWith(`${entry}/`))) {
            return;
        }
        for (const entry of readdirSync(current)) {
            const path = resolve(current, entry);
            if (statSync(path).isDirectory()) {
                visit(path);
            } else if (/\.(?:js|mjs|json|php|md)$/i.test(entry)) {
                files.push(path);
            }
        }
    };
    visit(directory);
    return files;
}

const obsoletePattern = /r184|0\.184\.0|three-r184|vrodos-three-r184|helvetiker|vrodos_three_font_path/i;
const provenanceTestPath = resolve(root, "scripts/test-aframe-runtime-provenance.mjs");
const obsoleteReferences = authoredFiles(root)
    .filter((path) => path !== provenanceTestPath)
    .filter((path) => obsoletePattern.test(readFileSync(path, "utf8")))
    .map((path) => path.slice(root.length + 1));
assert(obsoleteReferences.length === 0, `Obsolete r184/font references remain: ${obsoleteReferences.join(", ")}`);

console.log("A-Frame and Three r185 runtime provenance tests passed.");
