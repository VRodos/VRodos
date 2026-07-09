#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePath = resolve(root, "assets/js/runtime/master/vrodos_postprocessing_pmndrs.js");
const source = readFileSync(sourcePath, "utf8");

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
    "normalizePmndrsCloudDensityProfile",
    "normalizePmndrsCloudLayer",
    "normalizePmndrsCloudLayers",
    "normalizePmndrsCloudCoverageMapper",
    "effect._vrodosCloudProfileValidationStatus",
    "effect._vrodosCloudProfileFallbackReason"
]) {
    assert(source.includes(required), `Missing cloud profile safety hook ${required}`);
}

for (const style of ["default", "scattered", "broken", "overcast", "storm"]) {
    const match = styleProfilesSource.match(new RegExp(
        `${style}: \\{[\\s\\S]*?coverageMapper: \\{ scale: ([0-9.]+), bias: ([0-9.]+), max: ([0-9.]+) \\}`
    ));
    assert(match, `Missing coverage mapper for ${style}`);
    const mapper = {
        scale: Number(match[1]),
        bias: Number(match[2]),
        max: Number(match[3])
    };
    assert(
        Number.isFinite(mapper.scale) &&
            Number.isFinite(mapper.bias) &&
            Number.isFinite(mapper.max),
        `Coverage mapper for ${style} must be finite`
    );

    const samples = [0, 0.1, 0.27, 0.5, 0.85, 1].map((coverage) => effectiveCoverage(coverage, mapper));
    assert(samples[0] === 0, `${style} coverage must map 0 to 0`);
    for (let index = 1; index < samples.length; index += 1) {
        assert(samples[index] >= samples[index - 1], `${style} effective coverage must be monotonic`);
    }
    assert(samples[2] > samples[0], `${style} coverage 0.27 must produce visible effective coverage`);
    assert(samples[3] > samples[2], `${style} coverage 0.5 must be higher than 0.27`);
    assert(samples[4] > samples[3], `${style} high coverage must be higher than 0.5`);
}

console.log("Takram cloud profile safety tests passed.");
