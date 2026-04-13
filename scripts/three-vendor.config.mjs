export const THREE_VENDOR_VERSION = '0.181.0';
export const THREE_VENDOR_DIR = 'threejs181';
export const THREE_VENDOR_BUNDLE_FILE = 'vrodos-three-r181.bundle.js';
export const THREE_VENDOR_BUILD_ENTRY_FILE = '.tmp-build-three-vendor-entry.mjs';
export const THREE_SMOKE_BUNDLE_FILE = 'vrodos-phase0-smoke.bundle.js';

// Stable and migration-target A-Frame sources are kept here so the eventual
// runtime switch can be driven from one place instead of scattered literals.
export const AFRAME_STABLE_VERSION = '1.7.1';
export const AFRAME_STABLE_URL = `https://aframe.io/releases/${AFRAME_STABLE_VERSION}/aframe.min.js`;
export const AFRAME_MASTER_COMMIT = '96cc74fa7a4640f394a78985a637a788daf56186';
export const AFRAME_MASTER_URL = `https://cdn.jsdelivr.net/gh/aframevr/aframe@${AFRAME_MASTER_COMMIT}/dist/aframe-master.min.js`;
