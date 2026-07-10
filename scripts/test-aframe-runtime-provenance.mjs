import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "assets/runtime-version-manifest.json"), "utf8"));
const declared = packageJson.vrodos?.runtime?.aframe;
const artifact = manifest.aframe;

assert(declared, "package.json must declare vrodos.runtime.aframe metadata");
assert(artifact, "runtime-version-manifest.json must contain A-Frame metadata");
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
assert(bundle.includes(artifact.artifactCommit), "A-Frame local bundle must identify its embedded build commit");
assert(bundle.includes(declared.version), "A-Frame local bundle must identify the declared version");
assert(
    /powerPreference\s*:\s*["']high-performance["']/.test(bundle),
    "A-Frame local bundle must request powerPreference: high-performance"
);

const runtimeManager = readFileSync(resolve(root, "includes/class-vrodos-render-runtime-manager.php"), "utf8");
assert(runtimeManager.includes("hash_file( 'sha256', $path )"), "runtime manager must hash the served local A-Frame artifact");
assert(runtimeManager.includes("hash_equals( $expected_sha256"), "runtime manager must compare the local A-Frame hash safely");

console.log("A-Frame runtime provenance tests passed.");
