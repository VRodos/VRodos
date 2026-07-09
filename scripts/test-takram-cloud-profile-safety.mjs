#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePath = resolve(root, "assets/js/runtime/master/vrodos_postprocessing_pmndrs.js");
const source = readFileSync(sourcePath, "utf8");
const takramCloudsBundlePath = resolve(root, "assets/js/runtime/master/lib/vrodos-takram-clouds.bundle.js");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function extractBetween(startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert(start !== -1, `Missing ${startMarker}`);
    assert(end !== -1, `Missing ${endMarker}`);
    return source.slice(start, end);
}

function smoothStep01(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - (2 * t));
}

function effectiveCoverage(authoredCoverage, mapper) {
    return Math.max(0, Math.min(1, Math.min(
        mapper.max,
        (authoredCoverage * mapper.scale) + (mapper.bias * smoothStep01(authoredCoverage))
    )));
}

const styleProfilesSource = extractBetween(
    "const PMNDRS_CLOUD_STYLE_PROFILES = {",
    "const PMNDRS_CLOUD_PERFORMANCE_PROFILES = {"
);

for (const forbidden of [
    "densityProfile:",
    "coverageFilterWidth:",
    "weatherExponent:",
    "shapeAlteringBias:",
    "localWeatherRepeat:",
    "localWeatherOffset:",
    "shapeRepeat:",
    "shapeDetailRepeat:",
    "turbulenceRepeat:",
    "turbulenceDisplacement:"
]) {
    assert(
        !styleProfilesSource.includes(forbidden),
        `Cloud style profiles must not set low-level Takram field ${forbidden}`
    );
}

for (const required of [
    "PMNDRS_CLOUD_DENSITY_PROFILE_DEFAULT",
    "PMNDRS_CLOUD_HORIZON_COVERAGE_MAPPER",
    "normalizePmndrsCloudDensityProfile",
    "normalizePmndrsCloudLayer",
    "normalizePmndrsCloudLayers",
    "normalizePmndrsCloudCoverageMapper",
    "effect._vrodosCloudProfileValidationStatus",
    "effect._vrodosCloudProfileFallbackReason",
    "shouldUsePmndrsCloudLocalWeatherUv",
    "setPmndrsCloudLocalWeatherUvMode",
    "VRODOS_LOCAL_HORIZON_WEATHER_UV",
    "geospatialEnabled === true",
    "local-tangent",
    "cube-sphere",
    "cloudWeatherUvPatchApplied",
    "cloudWorldToEcefFrame",
    "cloudCoverageMapperShared"
]) {
    assert(source.includes(required), `Missing cloud profile safety hook ${required}`);
}

const mapperMatch = source.match(
    /const PMNDRS_CLOUD_HORIZON_COVERAGE_MAPPER = Object\.freeze\(\{ scale: ([0-9.]+), bias: ([0-9.]+), max: ([0-9.]+) \}\);/
);
assert(mapperMatch, "Missing shared Horizon cloud coverage mapper");
const sharedMapper = {
    scale: Number(mapperMatch[1]),
    bias: Number(mapperMatch[2]),
    max: Number(mapperMatch[3])
};
assert(
    Number.isFinite(sharedMapper.scale) &&
        Number.isFinite(sharedMapper.bias) &&
        Number.isFinite(sharedMapper.max),
    "Shared Horizon cloud coverage mapper must be finite"
);
const sharedSamples = [0, 0.1, 0.27, 0.5, 0.85, 1].map((coverage) => effectiveCoverage(coverage, sharedMapper));
assert(sharedSamples[0] === 0, "Shared Horizon cloud coverage must map 0 to 0");
for (let index = 1; index < sharedSamples.length; index += 1) {
    assert(sharedSamples[index] >= sharedSamples[index - 1], "Shared Horizon cloud coverage must be monotonic");
}
assert(sharedSamples[2] > sharedSamples[0], "Shared Horizon cloud coverage 0.27 must produce visible effective coverage");
assert(sharedSamples[3] > sharedSamples[2], "Shared Horizon cloud coverage 0.5 must be higher than 0.27");
assert(sharedSamples[4] > sharedSamples[3], "Shared Horizon high coverage must be higher than 0.5");

for (const style of ["default", "scattered", "broken", "overcast", "storm"]) {
    const match = styleProfilesSource.match(new RegExp(
        `${style}: \\{[\\s\\S]*?coverageMapper: PMNDRS_CLOUD_HORIZON_COVERAGE_MAPPER`
    ));
    assert(match, `${style} must use the shared Horizon coverage mapper`);
}

assert(existsSync(takramCloudsBundlePath), "Generated Takram clouds bundle is missing");
const takramCloudsBundle = readFileSync(takramCloudsBundlePath, "utf8");
assert(
    takramCloudsBundle.includes("VRODOS_LOCAL_HORIZON_WEATHER_UV"),
    "Generated Takram clouds bundle is missing the VRodos local Horizon UV define"
);
assert(
    takramCloudsBundle.includes("getVrodosLocalHorizonUv"),
    "Generated Takram clouds bundle is missing the VRodos local Horizon UV helper"
);

console.log("Takram cloud profile safety tests passed.");
