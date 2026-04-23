<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Render_Runtime_Manager {
	/**
	 * Single source of truth for the active A-Frame + Three runtime pair.
	 * Update this file when we move the whole plugin to a newer supported stack.
	 */
	private const AFRAME_RUNTIME_LABEL = 'A-Frame master';
	private const AFRAME_RUNTIME_URL = 'https://cdn.jsdelivr.net/gh/aframevr/aframe@96cc74fa7a4640f394a78985a637a788daf56186/dist/aframe-master.min.js';
	private const AFRAME_RUNTIME_COMMIT = '96cc74fa7a4640f394a78985a637a788daf56186';

	private const THREE_VENDOR_VERSION = '0.181.0';
	private const THREE_VENDOR_DIR = 'three-r181';
	private const THREE_VENDOR_BUNDLE = 'vrodos-three-r181.bundle.js';

	public static function get_config(): array {
		return [
			'aframe_runtime_label' => self::AFRAME_RUNTIME_LABEL,
			'aframe_runtime_url' => self::AFRAME_RUNTIME_URL,
			'aframe_master_commit' => self::AFRAME_RUNTIME_COMMIT,
			'three_vendor_version' => self::THREE_VENDOR_VERSION,
			'three_vendor_dir' => self::THREE_VENDOR_DIR,
			'three_vendor_bundle' => self::THREE_VENDOR_BUNDLE,
		];
	}

	public static function get_aframe_runtime_url(): string {
		return self::AFRAME_RUNTIME_URL;
	}

	public static function get_three_vendor_dir(): string {
		return self::THREE_VENDOR_DIR;
	}

	public static function get_three_vendor_bundle(): string {
		return self::THREE_VENDOR_BUNDLE;
	}
}
