<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Import_Blender_Converter {
	private const OPTION_KEY                 = 'vrodos_asset_import_settings';
	private const VERSION_TIMEOUT_SECONDS    = 10;
	private const CONVERSION_TIMEOUT_SECONDS = 300;
	private const RENDER_TIMEOUT_SECONDS     = 180;

	public static function get_settings(): array {
		$settings = get_option( self::OPTION_KEY, [] );
		$settings = is_array( $settings ) ? $settings : [];

		return wp_parse_args(
			$settings,
			[
				'blender_path' => '',
			]
		);
	}

	public static function get_configured_path(): string {
		$settings = self::get_settings();
		return (string) ( $settings['blender_path'] ?? '' );
	}

	public static function get_configured_status(): array {
		return self::validate_executable_path( self::get_configured_path() );
	}

	public static function test_path( string $path ): array {
		$status = self::validate_executable_path( $path );
		if ( empty( $status['success'] ) ) {
			return $status;
		}

		$result = self::run_command( [ $status['path'], '--version' ], self::VERSION_TIMEOUT_SECONDS );
		if ( empty( $result['success'] ) ) {
			return [
				'success' => false,
				'code'    => 'invalid',
				'label'   => 'Invalid path',
				'message' => 'Blender could not be executed: ' . self::summarize_process_output( $result ),
				'path'    => $status['path'],
			];
		}

		$output  = trim( (string) ( $result['stdout'] ?? '' ) . "\n" . (string) ( $result['stderr'] ?? '' ) );
		$version = '';
		if ( preg_match( '/Blender\s+([0-9][^\s]*)/i', $output, $matches ) ) {
			$version = (string) $matches[1];
		}

		return [
			'success' => true,
			'code'    => 'ready',
			'label'   => 'Ready',
			'message' => '' !== $version ? 'Blender is ready: ' . $version : 'Blender is ready.',
			'path'    => $status['path'],
			'version' => $version,
			'output'  => self::truncate_text( $output, 1200 ),
		];
	}

	public static function convert_to_glb( string $source_path, string $source_extension, string $output_path, string $working_dir, ?callable $progress_callback = null ): array {
		$status = self::validate_executable_path( self::get_configured_path() );
		if ( empty( $status['success'] ) ) {
			return $status;
		}

		$source_extension = strtolower( ltrim( $source_extension, '.' ) );
		if ( ! in_array( $source_extension, [ 'blend', 'fbx', 'obj', 'dae', 'gltf', 'glb' ], true ) ) {
			return [
				'success' => false,
				'code'    => 'unsupported',
				'label'   => 'Unsupported format',
				'message' => 'Blender conversion does not support .' . $source_extension . ' files.',
			];
		}

		if ( 'fbx' === $source_extension && self::is_ascii_fbx( $source_path ) ) {
			return [
				'success' => false,
				'code'    => 'unsupported-ascii-fbx',
				'label'   => 'Unsupported FBX encoding',
				'message' => 'This is an ASCII FBX file. Blender only supports binary FBX import, so re-export the model as Binary FBX, glTF/GLB, OBJ, DAE, or package it as a ZIP with a supported source.',
			];
		}

		$script_path = self::write_conversion_script();
		if ( is_wp_error( $script_path ) ) {
			return [
				'success' => false,
				'code'    => 'script-failed',
				'label'   => 'Conversion setup failed',
				'message' => $script_path->get_error_message(),
			];
		}

		@unlink( $output_path );

		$command = [
			$status['path'],
			'--background',
			'--factory-startup',
			'--python',
			$script_path,
			'--',
			'--input',
			$source_path,
			'--output',
			$output_path,
			'--type',
			$source_extension,
		];

		if ( is_callable( $progress_callback ) ) {
			$progress_callback( 3, 'Starting Blender...' );
		}

		$result = self::run_command( $command, self::CONVERSION_TIMEOUT_SECONDS, $working_dir, $progress_callback );
		@unlink( $script_path );

		if ( empty( $result['success'] ) ) {
			$failure_code = (string) ( $result['code'] ?? '' ) === 'process-start-failed'
				? 'invalid'
				: 'conversion-failed';
			$output = trim( (string) ( $result['stderr'] ?? '' ) . "\n" . (string) ( $result['stdout'] ?? '' ) );
			$message = 'fbx' === $source_extension && stripos( $output, 'ASCII FBX files are not supported' ) !== false
				? 'This is an ASCII FBX file. Blender only supports binary FBX import, so re-export the model as Binary FBX, glTF/GLB, OBJ, DAE, or package it as a ZIP with a supported source.'
				: self::summarize_process_output( $result );

			return [
				'success' => false,
				'code'    => $failure_code,
				'label'   => 'Conversion failed',
				'message' => $message,
				'stdout'  => self::truncate_text( (string) ( $result['stdout'] ?? '' ), 2000 ),
				'stderr'  => self::truncate_text( (string) ( $result['stderr'] ?? '' ), 2000 ),
			];
		}

		if ( ! file_exists( $output_path ) || filesize( $output_path ) <= 0 ) {
			return [
				'success' => false,
				'code'    => 'conversion-failed',
				'label'   => 'Conversion failed',
				'message' => 'Blender finished without producing a GLB file.',
				'stdout'  => self::truncate_text( (string) ( $result['stdout'] ?? '' ), 2000 ),
				'stderr'  => self::truncate_text( (string) ( $result['stderr'] ?? '' ), 2000 ),
			];
		}

		return [
			'success'        => true,
			'code'           => 'converted',
			'message'        => 'Blender exported GLB successfully.',
			'path'           => $output_path,
			'output_path'    => $output_path,
			'size'           => filesize( $output_path ),
			'stdout'         => self::truncate_text( (string) ( $result['stdout'] ?? '' ), 1000 ),
			'stderr'         => self::truncate_text( (string) ( $result['stderr'] ?? '' ), 1000 ),
			'geometry_stats' => self::parse_geometry_stats( (string) ( $result['stdout'] ?? '' ) ),
			'texture_stats'  => self::parse_texture_stats( (string) ( $result['stdout'] ?? '' ) ),
		];
	}

	public static function render_glb_thumbnail( string $glb_path, string $output_png ): array {
		$status = self::validate_executable_path( self::get_configured_path() );
		if ( empty( $status['success'] ) ) {
			return $status;
		}

		if ( ! file_exists( $glb_path ) ) {
			return [
				'success' => false,
				'code'    => 'missing-glb',
				'label'   => 'Missing GLB',
				'message' => 'The converted GLB file does not exist on disk.',
			];
		}

		$script_path = self::write_thumbnail_script();
		if ( is_wp_error( $script_path ) ) {
			return [
				'success' => false,
				'code'    => 'script-failed',
				'label'   => 'Thumbnail setup failed',
				'message' => $script_path->get_error_message(),
			];
		}

		@unlink( $output_png );

		$command = [
			$status['path'],
			'--background',
			'--factory-startup',
			'--python',
			$script_path,
			'--',
			'--input',
			$glb_path,
			'--output',
			$output_png,
		];

		$result = self::run_command( $command, self::RENDER_TIMEOUT_SECONDS, dirname( $glb_path ) );
		@unlink( $script_path );

		if ( empty( $result['success'] ) ) {
			return [
				'success' => false,
				'code'    => 'thumbnail-render-failed',
				'label'   => 'Thumbnail render failed',
				'message' => self::summarize_process_output( $result ),
				'stdout'  => self::truncate_text( (string) ( $result['stdout'] ?? '' ), 2000 ),
				'stderr'  => self::truncate_text( (string) ( $result['stderr'] ?? '' ), 2000 ),
			];
		}

		if ( ! file_exists( $output_png ) || filesize( $output_png ) <= 1024 ) {
			return [
				'success' => false,
				'code'    => 'thumbnail-empty',
				'label'   => 'Thumbnail render failed',
				'message' => 'Blender finished without producing a usable thumbnail image.',
				'stdout'  => self::truncate_text( (string) ( $result['stdout'] ?? '' ), 2000 ),
				'stderr'  => self::truncate_text( (string) ( $result['stderr'] ?? '' ), 2000 ),
			];
		}

		return [
			'success' => true,
			'code'    => 'thumbnail-rendered',
			'message' => 'Blender rendered thumbnail successfully.',
			'path'    => $output_png,
			'size'    => filesize( $output_png ),
		];
	}

	private static function validate_executable_path( string $path ): array {
		$path = trim( $path, " \t\n\r\0\x0B\"'" );

		if ( ! self::can_run_processes() ) {
			return [
				'success' => false,
				'code'    => 'disabled',
				'label'   => 'PHP command execution disabled',
				'message' => 'PHP command execution is disabled, so Blender cannot be run from WordPress.',
				'path'    => $path,
			];
		}

		if ( '' === $path ) {
			return [
				'success' => false,
				'code'    => 'missing',
				'label'   => 'Missing',
				'message' => 'Blender executable path is not configured.',
				'path'    => '',
			];
		}

		if ( ! file_exists( $path ) ) {
			return [
				'success' => false,
				'code'    => 'invalid',
				'label'   => 'Invalid path',
				'message' => 'Blender executable path does not exist.',
				'path'    => $path,
			];
		}

		if ( ! self::is_executable_path( $path ) ) {
			return [
				'success' => false,
				'code'    => 'invalid',
				'label'   => 'Invalid path',
				'message' => 'Blender executable path exists but is not executable.',
				'path'    => $path,
			];
		}

		return [
			'success' => true,
			'code'    => 'ready',
			'label'   => 'Ready',
			'message' => 'Blender path is configured.',
			'path'    => $path,
		];
	}

	private static function can_run_processes(): bool {
		if ( ! function_exists( 'proc_open' ) ) {
			return false;
		}

		$disabled = array_filter(
			array_map(
				static fn( $name ) => strtolower( trim( (string) $name ) ),
				explode( ',', (string) ini_get( 'disable_functions' ) )
			)
		);

		return ! in_array( 'proc_open', $disabled, true );
	}

	private static function is_executable_path( string $path ): bool {
		if ( is_executable( $path ) ) {
			return true;
		}

		if ( strtoupper( substr( PHP_OS, 0, 3 ) ) === 'WIN' ) {
			return in_array( strtolower( pathinfo( $path, PATHINFO_EXTENSION ) ), [ 'exe', 'bat', 'cmd' ], true );
		}

		return false;
	}

	private static function is_ascii_fbx( string $path ): bool {
		if ( ! is_file( $path ) || ! is_readable( $path ) ) {
			return false;
		}

		$handle = @fopen( $path, 'rb' );
		if ( ! $handle ) {
			return false;
		}
		$header = (string) fread( $handle, 4096 );
		fclose( $handle );

		if ( str_starts_with( $header, "Kaydara FBX Binary  \x00\x1a\x00" ) ) {
			return false;
		}

		if ( preg_match( '/^\s*(;|FBXHeaderExtension\s*:|Kaydara FBX)/i', $header ) ) {
			return true;
		}

		return ! str_contains( $header, "\x00" ) && stripos( $header, 'FBXHeaderExtension' ) !== false;
	}

	private static function create_temp_file( string $prefix, string $extension = '' ): string|WP_Error {
		$prefix = preg_replace( '/[^A-Za-z0-9_-]/', '-', $prefix );
		$extension = trim( $extension );
		$extension = '' === $extension ? '' : '.' . ltrim( $extension, '.' );

		foreach ( self::temp_directory_candidates() as $temp_dir ) {
			$temp_dir = rtrim( (string) $temp_dir, "\\/" );
			if ( '' === $temp_dir ) {
				continue;
			}
			if ( ! is_dir( $temp_dir ) && ! wp_mkdir_p( $temp_dir ) ) {
				continue;
			}
			if ( ! is_writable( $temp_dir ) ) {
				continue;
			}

			$path = @tempnam( $temp_dir, $prefix ?: 'vrodos-' );
			if ( ! is_string( $path ) || '' === $path ) {
				continue;
			}

			if ( '' === $extension ) {
				return $path;
			}

			$target = $path . $extension;
			if ( @rename( $path, $target ) ) {
				return $target;
			}

			@unlink( $path );
		}

		return new WP_Error( 'tmp_failed', 'Could not create a writable temporary file for Blender.' );
	}

	private static function temp_directory_candidates(): array {
		$candidates = [];
		$upload_dir = wp_upload_dir();
		if ( empty( $upload_dir['error'] ) && ! empty( $upload_dir['basedir'] ) ) {
			$candidates[] = trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-asset-import-temp';
		}
		if ( function_exists( 'get_temp_dir' ) ) {
			$candidates[] = get_temp_dir();
		}
		$candidates[] = sys_get_temp_dir();

		return array_values( array_unique( array_filter( array_map( 'strval', $candidates ) ) ) );
	}

	private static function write_conversion_script(): string|WP_Error {
		$path = self::create_temp_file( 'vrodos-blender-convert-', '.py' );
		if ( is_wp_error( $path ) ) {
			return $path;
		}

		$script = <<<'PY'
import argparse
import os
import sys
import traceback

import bpy

parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--type", required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])

source = os.path.abspath(args.input)
target = os.path.abspath(args.output)
kind = args.type.lower().lstrip(".")

def progress(percent, message):
    print("VRODOS_PROGRESS", int(percent), message, flush=True)

def patch_fbx_light_shadow_property():
    try:
        cycles_light_settings = getattr(bpy.types, "CyclesLightSettings", None)
        if cycles_light_settings is not None and not hasattr(cycles_light_settings, "cast_shadow"):
            cycles_light_settings.cast_shadow = bpy.props.BoolProperty(
                name="FBX Cast Shadow Compatibility",
                default=True,
            )
            print("Applied FBX compatibility patch for CyclesLightSettings.cast_shadow")
    except Exception as exc:
        print("Could not apply FBX light compatibility patch:", exc)

def patch_fbx_light_reader():
    try:
        import math
        from io_scene_fbx import import_fbx

        def safe_blen_read_light(fbx_tmpl, fbx_obj, settings):
            elem_name_utf8 = import_fbx.elem_name_ensure_class(fbx_obj, b"NodeAttribute")
            fbx_props = (
                import_fbx.elem_find_first(fbx_obj, b"Properties70"),
                import_fbx.elem_find_first(fbx_tmpl, b"Properties70", import_fbx.fbx_elem_nil),
            )

            light_type = {
                0: "POINT",
                1: "SUN",
                2: "SPOT",
            }.get(import_fbx.elem_props_get_enum(fbx_props, b"LightType", 0), "POINT")

            lamp = bpy.data.lights.new(name=elem_name_utf8, type=light_type)

            if light_type == "SPOT":
                spot_size = import_fbx.elem_props_get_number(fbx_props, b"OuterAngle", None)
                if spot_size is None:
                    spot_size = import_fbx.elem_props_get_number(fbx_props, b"Cone angle", 45.0)
                lamp.spot_size = math.radians(spot_size)

                spot_blend = import_fbx.elem_props_get_number(fbx_props, b"InnerAngle", None)
                if spot_blend is None:
                    spot_blend = import_fbx.elem_props_get_number(fbx_props, b"HotSpot", 45.0)
                lamp.spot_blend = 1.0 - (spot_blend / spot_size)

            lamp.color = import_fbx.elem_props_get_color_rgb(fbx_props, b"Color", (1.0, 1.0, 1.0))
            lamp.energy = import_fbx.elem_props_get_number(fbx_props, b"Intensity", 100.0) / 100.0
            lamp.exposure = import_fbx.elem_props_get_number(fbx_props, b"Exposure", 0.0)
            lamp.use_shadow = import_fbx.elem_props_get_bool(fbx_props, b"CastShadow", True)

            if settings.use_custom_props:
                import_fbx.blen_read_custom_properties(fbx_obj, lamp, settings)

            return lamp

        import_fbx.blen_read_light = safe_blen_read_light
        print("Patched Blender FBX light reader for Cycles cast_shadow compatibility")
    except Exception as exc:
        print("Could not patch Blender FBX light reader:", exc)

def convert_supported_objects_to_mesh():
    convertible_types = {"CURVE", "SURFACE", "FONT", "META"}
    for obj in list(bpy.context.scene.objects):
        if obj.type not in convertible_types:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.convert(target="MESH")
        except Exception as exc:
            print("Could not convert object to mesh:", obj.name, exc)

def build_texture_index():
    texture_extensions = {
        ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tga", ".tif", ".tiff", ".exr", ".hdr"
    }
    roots = [
        os.path.dirname(source),
        os.getcwd(),
    ]
    index = {}
    for root in roots:
        if not root or not os.path.isdir(root):
            continue
        for current_root, dirs, files in os.walk(root):
            dirs[:] = [
                item for item in dirs
                if item not in {"__MACOSX"} and not item.startswith(".")
            ]
            for filename in files:
                extension = os.path.splitext(filename)[1].lower()
                if extension not in texture_extensions:
                    continue
                key = filename.lower()
                path = os.path.join(current_root, filename)
                index.setdefault(key, path)
    return index

def resolve_image_paths(texture_index):
    resolved = 0
    missing = 0
    for image in bpy.data.images:
        if image.packed_file is not None:
            continue

        current_path = bpy.path.abspath(image.filepath) if image.filepath else ""
        if current_path and os.path.exists(current_path):
            try:
                image.reload()
            except Exception as exc:
                print("Could not reload image:", image.name, exc)
            continue

        candidates = []
        if image.filepath:
            candidates.append(os.path.basename(image.filepath))
        if image.name:
            candidates.append(os.path.basename(image.name))

        replacement = ""
        for candidate in candidates:
            if not candidate:
                continue
            replacement = texture_index.get(candidate.lower(), "")
            if replacement:
                break

        if replacement:
            image.filepath = replacement
            try:
                image.reload()
                resolved += 1
            except Exception as exc:
                print("Could not load resolved image:", image.name, replacement, exc)
        else:
            missing += 1

    print("Texture search:", len(texture_index), "texture file(s) available,", resolved, "missing image path(s) resolved,", missing, "image(s) still missing")

def material_has_alpha_texture(material):
    if not material.use_nodes or material.node_tree is None:
        return False
    for node in material.node_tree.nodes:
        if node.bl_idname != "ShaderNodeBsdfPrincipled":
            continue
        alpha_input = node.inputs.get("Alpha")
        if alpha_input is not None and alpha_input.is_linked:
            return True
    return False

def normalize_materials():
    texture_index = build_texture_index()
    resolve_image_paths(texture_index)

    opaque_count = 0
    alpha_count = 0
    for material in bpy.data.materials:
        has_alpha_texture = material_has_alpha_texture(material)
        if has_alpha_texture:
            alpha_count += 1
            continue

        material.blend_method = "OPAQUE"
        material.use_screen_refraction = False
        if hasattr(material, "show_transparent_back"):
            material.show_transparent_back = False

        if material.use_nodes and material.node_tree is not None:
            for node in material.node_tree.nodes:
                if node.bl_idname != "ShaderNodeBsdfPrincipled":
                    continue
                alpha_input = node.inputs.get("Alpha")
                if alpha_input is not None and not alpha_input.is_linked:
                    alpha_input.default_value = 1.0
        else:
            color = list(material.diffuse_color)
            if len(color) >= 4:
                color[3] = 1.0
                material.diffuse_color = color
        opaque_count += 1

    print("Material cleanup:", opaque_count, "material(s) forced opaque,", alpha_count, "material(s) kept with linked alpha")

def require_scene_geometry():
    convert_supported_objects_to_mesh()
    mesh_objects = [
        obj for obj in bpy.context.scene.objects
        if obj.type == "MESH" and obj.data is not None
    ]
    vertex_count = sum(len(obj.data.vertices) for obj in mesh_objects)
    face_count = sum(len(obj.data.polygons) for obj in mesh_objects)
    mesh_names = ", ".join(obj.name for obj in mesh_objects[:8])
    print("Imported geometry:", len(mesh_objects), "mesh object(s),", vertex_count, "vertices,", face_count, "faces")
    if len(mesh_objects) == 0 or vertex_count == 0 or face_count == 0:
        object_summary = ", ".join(obj.name + ":" + obj.type for obj in list(bpy.context.scene.objects)[:12])
        raise RuntimeError(
            "Blender imported no usable mesh geometry from "
            + os.path.basename(source)
            + ". Meshes: "
            + (mesh_names if mesh_names else "none")
            + ". Objects: "
            + (object_summary if object_summary else "none")
        )

try:
    progress(8, "Preparing Blender scene")
    if kind == "blend":
        progress(12, "Opening BLEND file")
        bpy.ops.wm.open_mainfile(filepath=source)
    else:
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete()

        if kind == "fbx":
            progress(12, "Importing FBX source")
            patch_fbx_light_shadow_property()
            patch_fbx_light_reader()
            bpy.ops.import_scene.fbx(filepath=source, use_image_search=True)
        elif kind == "obj":
            progress(12, "Importing OBJ source")
            if hasattr(bpy.ops.wm, "obj_import"):
                bpy.ops.wm.obj_import(filepath=source)
            else:
                bpy.ops.import_scene.obj(filepath=source)
        elif kind == "dae":
            progress(12, "Importing DAE source")
            bpy.ops.wm.collada_import(filepath=source)
        elif kind in {"gltf", "glb"}:
            progress(12, "Importing glTF/GLB source")
            bpy.ops.import_scene.gltf(filepath=source)
        else:
            raise RuntimeError("Unsupported source type: " + kind)

    progress(45, "Validating geometry")
    require_scene_geometry()
    progress(58, "Resolving textures and materials")
    normalize_materials()
    os.makedirs(os.path.dirname(target), exist_ok=True)
    progress(72, "Exporting GLB")
    bpy.ops.export_scene.gltf(
        filepath=target,
        export_format="GLB",
        export_image_format="AUTO",
        export_materials="EXPORT",
    )
    progress(100, "GLB export complete")
except Exception:
	traceback.print_exc()
	sys.exit(10)
PY;

		if ( file_put_contents( $path, $script ) === false ) {
			@unlink( $path );
			return new WP_Error( 'write_failed', 'Could not write temporary Blender script.' );
		}

		return $path;
	}

	private static function write_thumbnail_script(): string|WP_Error {
		$path = self::create_temp_file( 'vrodos-blender-thumb-', '.py' );
		if ( is_wp_error( $path ) ) {
			return $path;
		}

		$script = <<<'PY'
import argparse
import math
import os
import sys
import traceback

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])

source = os.path.abspath(args.input)
target = os.path.abspath(args.output)

def scene_bounds():
    mins = Vector((float("inf"), float("inf"), float("inf")))
    maxs = Vector((float("-inf"), float("-inf"), float("-inf")))
    found = False
    for obj in bpy.context.scene.objects:
        if obj.type not in {"MESH", "CURVE", "SURFACE", "FONT", "META"}:
            continue
        for corner in obj.bound_box:
            point = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, point.x)
            mins.y = min(mins.y, point.y)
            mins.z = min(mins.z, point.z)
            maxs.x = max(maxs.x, point.x)
            maxs.y = max(maxs.y, point.y)
            maxs.z = max(maxs.z, point.z)
            found = True
    if not found:
        raise RuntimeError("No renderable geometry found in GLB")
    return mins, maxs

try:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.gltf(filepath=source)

    mins, maxs = scene_bounds()
    center = (mins + maxs) * 0.5
    root_objects = [obj for obj in bpy.context.scene.objects if obj.parent is None and obj.type not in {"CAMERA", "LIGHT"}]
    for obj in root_objects:
        obj.location -= center

    mins, maxs = scene_bounds()
    size = maxs - mins
    max_dim = max(size.x, size.y, size.z, 0.001)
    scale = 2.0 / max_dim
    for obj in root_objects:
        obj.scale *= scale

    mins, maxs = scene_bounds()
    center = (mins + maxs) * 0.5
    for obj in root_objects:
        obj.location.x -= center.x
        obj.location.y -= center.y
        obj.location.z -= center.z

    mins, maxs = scene_bounds()
    size = maxs - mins
    max_dim = max(size.x, size.y, size.z, 0.001)
    radius = max_dim * 0.5

    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.color = (0.09, 0.13, 0.2)

    light_data = bpy.data.lights.new("Key", type="AREA")
    light_data.energy = 500
    light_data.size = 4
    light = bpy.data.objects.new("Key", light_data)
    light.location = (3.5, -4.0, 5.0)
    bpy.context.collection.objects.link(light)

    fill_data = bpy.data.lights.new("Fill", type="POINT")
    fill_data.energy = 80
    fill = bpy.data.objects.new("Fill", fill_data)
    fill.location = (-3.0, 2.5, 2.5)
    bpy.context.collection.objects.link(fill)

    camera_data = bpy.data.cameras.new("Camera")
    camera_data.lens = 55
    camera = bpy.data.objects.new("Camera", camera_data)
    distance = max(radius * 4.0, 3.2)
    camera.location = (distance * 0.75, -distance * 0.85, distance * 0.55)
    direction = Vector((0.0, 0.0, 0.0)) - Vector(camera.location)
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 512
    bpy.context.scene.render.film_transparent = False
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = target

    if "BLENDER_EEVEE_NEXT" in {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}:
        bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    elif "BLENDER_EEVEE" in {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}:
        bpy.context.scene.render.engine = "BLENDER_EEVEE"

    os.makedirs(os.path.dirname(target), exist_ok=True)
    bpy.ops.render.render(write_still=True)
except Exception:
    traceback.print_exc()
    sys.exit(10)
PY;

		if ( file_put_contents( $path, $script ) === false ) {
			@unlink( $path );
			return new WP_Error( 'write_failed', 'Could not write temporary Blender thumbnail script.' );
		}

		return $path;
	}

	private static function run_command( array $command, int $timeout_seconds, string $cwd = '', ?callable $progress_callback = null ): array {
		$descriptor_spec = [
			0 => [ 'pipe', 'r' ],
			1 => [ 'pipe', 'w' ],
			2 => [ 'pipe', 'w' ],
		];

		$process = @proc_open(
			$command,
			$descriptor_spec,
			$pipes,
			'' !== $cwd ? $cwd : null,
			null,
			[ 'bypass_shell' => true ]
		);

		if ( ! is_resource( $process ) ) {
			return [
				'success' => false,
				'code'    => 'process-start-failed',
				'message' => 'Could not start Blender process.',
				'stdout'  => '',
				'stderr'  => '',
			];
		}

		fclose( $pipes[0] );
		stream_set_blocking( $pipes[1], false );
		stream_set_blocking( $pipes[2], false );

		$stdout          = '';
		$stderr          = '';
		$stdout_progress = '';
		$stderr_progress = '';
		$start           = time();
		$exit_code       = null;
		$timed_out       = false;

		while ( true ) {
			$stdout_chunk = (string) stream_get_contents( $pipes[1] );
			$stderr_chunk = (string) stream_get_contents( $pipes[2] );
			$stdout      .= $stdout_chunk;
			$stderr      .= $stderr_chunk;
			self::dispatch_progress_markers( $stdout_progress, $stdout_chunk, $progress_callback );
			self::dispatch_progress_markers( $stderr_progress, $stderr_chunk, $progress_callback );

			$status = proc_get_status( $process );
			if ( empty( $status['running'] ) ) {
				$exit_code = isset( $status['exitcode'] ) ? (int) $status['exitcode'] : null;
				break;
			}

			if ( time() - $start > $timeout_seconds ) {
				$timed_out = true;
				proc_terminate( $process );
				break;
			}

			usleep( 100000 );
		}

		$stdout_chunk = (string) stream_get_contents( $pipes[1] );
		$stderr_chunk = (string) stream_get_contents( $pipes[2] );
		$stdout      .= $stdout_chunk;
		$stderr      .= $stderr_chunk;
		self::dispatch_progress_markers( $stdout_progress, $stdout_chunk, $progress_callback );
		self::dispatch_progress_markers( $stderr_progress, $stderr_chunk, $progress_callback );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$close_code = proc_close( $process );
		if ( null === $exit_code || $exit_code < 0 ) {
			$exit_code = (int) $close_code;
		}

		return [
			'success'   => ! $timed_out && 0 === $exit_code,
			'code'      => $timed_out ? 'timeout' : ( 0 === $exit_code ? 'ok' : 'non-zero' ),
			'exit_code' => $exit_code,
			'timed_out' => $timed_out,
			'stdout'    => self::truncate_text( $stdout, 8000 ),
			'stderr'    => self::truncate_text( $stderr, 8000 ),
		];
	}

	private static function dispatch_progress_markers( string &$buffer, string $chunk, ?callable $progress_callback ): void {
		if ( '' === $chunk || ! is_callable( $progress_callback ) ) {
			return;
		}

		$buffer .= $chunk;
		$lines   = preg_split( "/\r\n|\n|\r/", $buffer );
		$buffer  = (string) array_pop( $lines );
		foreach ( $lines as $line ) {
			if ( preg_match( '/^VRODOS_PROGRESS\s+(\d{1,3})\s*(.*)$/', trim( (string) $line ), $matches ) ) {
				$percent = max( 0, min( 100, (int) $matches[1] ) );
				$message = trim( (string) ( $matches[2] ?? '' ) );
				$progress_callback( $percent, '' !== $message ? $message : 'Blender conversion running...' );
			}
		}
	}

	private static function summarize_process_output( array $result ): string {
		if ( ! empty( $result['timed_out'] ) ) {
			return 'Blender command timed out.';
		}

		$exit_code = isset( $result['exit_code'] ) ? ' Exit code: ' . (int) $result['exit_code'] . '.' : '';
		$output    = trim( (string) ( $result['stderr'] ?? '' ) );
		if ( '' === $output ) {
			$output = trim( (string) ( $result['stdout'] ?? '' ) );
		}

		return trim( $exit_code . ' ' . self::truncate_text( '' !== $output ? $output : 'No process output.', 1200 ) );
	}

	private static function parse_geometry_stats( string $stdout ): array {
		if ( preg_match( '/Imported geometry:\s*(\d+)\s*mesh object\(s\),\s*(\d+)\s*vertices,\s*(\d+)\s*faces/i', $stdout, $matches ) ) {
			return [
				'mesh_objects' => (int) $matches[1],
				'vertices'     => (int) $matches[2],
				'faces'        => (int) $matches[3],
			];
		}

		return [];
	}

	private static function parse_texture_stats( string $stdout ): array {
		$stats = [];
		if ( preg_match( '/Texture search:\s*(\d+)\s*texture file\(s\) available,\s*(\d+)\s*missing image path\(s\) resolved,\s*(\d+)\s*image\(s\) still missing/i', $stdout, $matches ) ) {
			$stats = [
				'available_files'        => (int) $matches[1],
				'resolved_missing_paths' => (int) $matches[2],
				'still_missing_images'   => (int) $matches[3],
			];
		}

		if ( preg_match( '/Material cleanup:\s*(\d+)\s*material\(s\) forced opaque,\s*(\d+)\s*material\(s\) kept with linked alpha/i', $stdout, $matches ) ) {
			$stats['forced_opaque_materials'] = (int) $matches[1];
			$stats['alpha_materials']         = (int) $matches[2];
		}

		return $stats;
	}

	private static function truncate_text( string $text, int $limit ): string {
		$text = trim( $text );
		if ( strlen( $text ) <= $limit ) {
			return $text;
		}

		return substr( $text, 0, max( 0, $limit - 3 ) ) . '...';
	}
}
