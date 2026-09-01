<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Builds a portable static package from a compiled single-player scene. */
final class VRodos_Scene_Standalone_Exporter {
	private const PLUGIN_ARCHIVE_ROOT = 'wp-content/plugins/VRodos/';
	private const README_FILENAME     = 'README.txt';
	private const SERVER_FILENAME     = 'server.mjs';
	private int $project_id = 0;

	/** @return array{path:string,temp_dir:string,filename:string,file_count:int}|WP_Error */
	public function build( int $project_id, int $scene_id ): array|WP_Error {
		$this->project_id = $project_id;
		if ( ! function_exists( 'wp_tempnam' ) || ! function_exists( 'wp_delete_file' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if ( ! class_exists( 'ZipArchive' ) ) {
			return new WP_Error( 'zip_unavailable', 'PHP ZipArchive is required to export standalone scenes.', [ 'status' => 500 ] );
		}

		$clients_dir = VRodos_Storage_Manager::published_project_directory( $project_id, 'clients' );
		if ( is_wp_error( $clients_dir ) ) {
			return $clients_dir;
		}
		$compiled_path = $clients_dir . 'Master_Client_' . $scene_id . '.html';
		if ( ! is_readable( $compiled_path ) ) {
			return new WP_Error( 'compiled_scene_missing', 'Build this scene in Single-player static mode before exporting it.', [ 'status' => 409 ] );
		}

		$html = file_get_contents( $compiled_path );
		if ( ! is_string( $html ) || '' === trim( $html ) ) {
			return new WP_Error( 'compiled_scene_unreadable', 'The compiled scene could not be read.', [ 'status' => 500 ] );
		}
		if ( 1 !== preg_match( '/runtimeMode:\s*single-player\b/', $html ) ) {
			return new WP_Error( 'standalone_requires_single_player', 'Rebuild this scene with Runtime Mode set to Single-player static, then export it again.', [ 'status' => 409 ] );
		}

		$temp_dir = VRodos_Storage_Manager::temporary_directory( 'export', wp_generate_uuid4() );
		if ( is_wp_error( $temp_dir ) ) {
			return $temp_dir;
		}

		$temp_path = wp_tempnam( 'vrodos-scene-' . $scene_id . '.zip', trailingslashit( $temp_dir ) );
		if ( ! is_string( $temp_path ) || '' === $temp_path ) {
			@rmdir( untrailingslashit( $temp_dir ) );
			return new WP_Error( 'zip_temp_failed', 'The temporary ZIP file could not be created.', [ 'status' => 500 ] );
		}

		$zip = new ZipArchive();
		if ( true !== $zip->open( $temp_path, ZipArchive::CREATE | ZipArchive::OVERWRITE ) ) {
			wp_delete_file( $temp_path );
			@rmdir( untrailingslashit( $temp_dir ) );
			return new WP_Error( 'zip_open_failed', 'The standalone ZIP could not be opened for writing.', [ 'status' => 500 ] );
		}

		try {
			$standalone_html = $this->rewrite_html( $html );
			if ( ! $zip->addFromString( 'index.html', $standalone_html ) ) {
				throw new RuntimeException( 'The standalone entry page could not be added to the ZIP.' );
			}

			$dependencies = $this->collect_dependencies( $html );
			foreach ( $dependencies as $archive_path => $source_path ) {
				if ( ! $zip->addFile( $source_path, $archive_path ) ) {
					throw new RuntimeException( 'A scene dependency could not be added: ' . $archive_path );
				}
			}

			$zip->addFromString( self::README_FILENAME, $this->readme( $scene_id ) );
			$zip->addFromString( self::SERVER_FILENAME, $this->server_script() );
			$zip->addFromString( 'start.cmd', "@echo off\r\nnode server.mjs\r\npause\r\n" );
		} catch ( Throwable $error ) {
			$zip->close();
			wp_delete_file( $temp_path );
			@rmdir( untrailingslashit( $temp_dir ) );
			return new WP_Error( 'zip_build_failed', $error->getMessage(), [ 'status' => 500 ] );
		}

		if ( ! $zip->close() || ! is_readable( $temp_path ) ) {
			wp_delete_file( $temp_path );
			@rmdir( untrailingslashit( $temp_dir ) );
			return new WP_Error( 'zip_finalize_failed', 'The standalone ZIP could not be finalized.', [ 'status' => 500 ] );
		}

		$scene_title = sanitize_title( get_the_title( $scene_id ) );
		$filename    = 'vrodos-scene-' . $scene_id . ( '' !== $scene_title ? '-' . $scene_title : '' ) . '.zip';

		return [
			'path'       => $temp_path,
			'temp_dir'   => $temp_dir,
			'filename'   => $filename,
			'file_count' => count( $dependencies ) + 4,
		];
	}

	/** @return array<string,string> Archive path => local source path. */
	private function collect_dependencies( string $html ): array {
		$files   = [];
		$pending = $this->extract_local_url_paths( $html );

		// These template-relative models are always present in Master clients.
		$pending[] = '/wp-content/plugins/VRodos/assets/models/editor/checkmark.glb';
		$pending[] = '/wp-content/plugins/VRodos/assets/models/editor/xmark.glb';

		$scanned_files = [];
		while ( [] !== $pending ) {
			$url_path = array_shift( $pending );
			$resolved = $this->resolve_dependency( $url_path );
			if ( null === $resolved ) {
				continue;
			}

			if ( is_dir( $resolved['source'] ) ) {
				foreach ( $this->directory_files( $resolved['source'], $resolved['archive'] ) as $archive_path => $source_path ) {
					$files[ $archive_path ] = $source_path;
				}
				continue;
			}

			$files[ $resolved['archive'] ] = $resolved['source'];
			$extension = strtolower( (string) pathinfo( $resolved['source'], PATHINFO_EXTENSION ) );
			if ( ! in_array( $extension, [ 'css', 'js', 'mjs' ], true ) || isset( $scanned_files[ $resolved['source'] ] ) ) {
				continue;
			}

			$scanned_files[ $resolved['source'] ] = true;
			$source = file_get_contents( $resolved['source'] );
			if ( is_string( $source ) ) {
				$pending = array_merge( $pending, $this->extract_local_url_paths( $source ) );
			}
		}

		ksort( $files );
		return $files;
	}

	/** @return string[] */
	private function extract_local_url_paths( string $content ): array {
		$paths = [];
		if ( preg_match_all( '#(?:https?://[^/\"\'\s]+)?(/wp-content/(?:plugins/VRodos|uploads)/[^\"\'<>\s;,)]+)#i', $content, $matches ) ) {
			foreach ( $matches[1] as $path ) {
				$paths[] = $path;
			}
		}

		if ( preg_match_all( '#\.\./\.\./assets/[^\"\'<>\s;,)]+#i', $content, $matches ) ) {
			foreach ( $matches[0] as $path ) {
				$paths[] = '/wp-content/plugins/VRodos/assets/' . substr( $path, strlen( '../../assets/' ) );
			}
		}

		// Runtime bundles construct some optional data URLs from the plugin base at run time.
		if ( preg_match_all( '#assets/(?:vendor|images|models|media)/[A-Za-z0-9_./-]+#', $content, $matches ) ) {
			foreach ( $matches[0] as $path ) {
				$paths[] = '/wp-content/plugins/VRodos/' . $path;
			}
		}

		return array_values( array_unique( array_map( 'html_entity_decode', $paths ) ) );
	}

	/** @return array{source:string,archive:string}|null */
	private function resolve_dependency( string $url_path ): ?array {
		$path = rawurldecode( (string) wp_parse_url( trim( $url_path ), PHP_URL_PATH ) );
		$path = str_replace( '\\', '/', $path );
		if ( str_contains( $path, "\0" ) || $this->contains_parent_segment( $path ) ) {
			return null;
		}

		$plugin_url_path = (string) wp_parse_url( VRodos_Path_Manager::plugin_url(), PHP_URL_PATH );
		$upload_dir      = wp_upload_dir();
		$upload_url_path = (string) wp_parse_url( (string) $upload_dir['baseurl'], PHP_URL_PATH );

		if ( str_starts_with( $path, $plugin_url_path ) ) {
			$relative = ltrim( substr( $path, strlen( $plugin_url_path ) ), '/' );
			if ( '' === $relative || ! str_starts_with( $relative, 'assets/' ) ) {
				return null;
			}
			return $this->resolve_within_root( VRodos_Path_Manager::plugin_path(), self::PLUGIN_ARCHIVE_ROOT, $relative, true );
		}

		if ( str_starts_with( $path, trailingslashit( $upload_url_path ) ) ) {
			$relative = ltrim( substr( $path, strlen( trailingslashit( $upload_url_path ) ) ), '/' );
			$owned_prefix = 'vrodos/published/projects/' . $this->project_id . '/';
			if ( '' === $relative || ! str_starts_with( $relative, $owned_prefix ) ) {
				return null;
			}
			return $this->resolve_within_root( (string) $upload_dir['basedir'], 'wp-content/uploads/', $relative, false );
		}

		return null;
	}

	/** @return array{source:string,archive:string}|null */
	private function resolve_within_root( string $root, string $archive_root, string $relative, bool $allow_directory ): ?array {
		$root_real = realpath( $root );
		$candidate = realpath( trailingslashit( $root ) . str_replace( '/', DIRECTORY_SEPARATOR, $relative ) );
		if ( false === $root_real || false === $candidate || ! $this->is_within_root( $candidate, $root_real ) ) {
			return null;
		}
		if ( is_dir( $candidate ) && ! $allow_directory ) {
			return null;
		}
		if ( ! is_file( $candidate ) && ! is_dir( $candidate ) ) {
			return null;
		}

		return [
			'source'  => $candidate,
			'archive' => $archive_root . str_replace( '\\', '/', $relative ),
		];
	}

	private function is_within_root( string $candidate, string $root ): bool {
		$candidate = strtolower( rtrim( str_replace( '\\', '/', $candidate ), '/' ) );
		$root      = strtolower( rtrim( str_replace( '\\', '/', $root ), '/' ) );
		return $candidate === $root || str_starts_with( $candidate, $root . '/' );
	}

	private function contains_parent_segment( string $path ): bool {
		return in_array( '..', explode( '/', $path ), true );
	}

	/** @return array<string,string> */
	private function directory_files( string $directory, string $archive_root ): array {
		$files     = [];
		$base_path = rtrim( str_replace( '\\', '/', $directory ), '/' ) . '/';
		$iterator  = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $directory, FilesystemIterator::SKIP_DOTS )
		);
		foreach ( $iterator as $file_info ) {
			if ( ! $file_info->isFile() || $file_info->isLink() ) {
				continue;
			}
			$source_path = $file_info->getPathname();
			$relative    = substr( str_replace( '\\', '/', $source_path ), strlen( $base_path ) );
			$files[ trailingslashit( $archive_root ) . $relative ] = $source_path;
		}
		return $files;
	}

	private function rewrite_html( string $html ): string {
		$plugin_url      = VRodos_Path_Manager::plugin_url();
		$plugin_url_path = (string) wp_parse_url( $plugin_url, PHP_URL_PATH );
		$upload_dir      = wp_upload_dir();
		$upload_base_url = trailingslashit( (string) $upload_dir['baseurl'] );
		$upload_url_path = trailingslashit( (string) wp_parse_url( $upload_base_url, PHP_URL_PATH ) );

		$html = str_replace(
			[ $plugin_url, $plugin_url_path, $upload_base_url, $upload_url_path, '../../assets/' ],
			[ self::PLUGIN_ARCHIVE_ROOT, self::PLUGIN_ARCHIVE_ROOT, 'wp-content/uploads/', 'wp-content/uploads/', self::PLUGIN_ARCHIVE_ROOT . 'assets/' ],
			$html
		);

		$html = preg_replace_callback(
			'/var context = (\{.*?\});/s',
			static function ( array $matches ): string {
				$context = json_decode( $matches[1], true );
				if ( ! is_array( $context ) ) {
					return $matches[0];
				}
				$context['ajaxUrl']    = '';
				$context['standalone'] = true;
				return 'var context = ' . wp_json_encode( $context, JSON_UNESCAPED_SLASHES ) . ';';
			},
			$html,
			1
		);

		return is_string( $html ) ? $html : '';
	}

	private function readme( int $scene_id ): string {
		return "VRodos standalone scene #{$scene_id}\r\n"
			. "================================\r\n\r\n"
			. "This package contains the compiled single-player scene and its local runtime/media dependencies.\r\n\r\n"
			. "Run locally on Windows:\r\n"
			. "1. Install Node.js if it is not already installed.\r\n"
			. "2. Double-click start.cmd.\r\n"
			. "3. Open http://localhost:8080/ if the browser does not open automatically.\r\n\r\n"
			. "Run locally on macOS/Linux:\r\n"
			. "1. In a terminal, run: node server.mjs\r\n"
			. "2. Open http://localhost:8080/\r\n\r\n"
			. "Deployment:\r\n"
			. "Upload the extracted directory unchanged to any static HTTPS web host.\r\n\r\n"
			. "Important:\r\n"
			. "- Do not open index.html directly with file://; browser security rules block model and XR loading.\r\n"
			. "- WordPress AJAX, collaborative networking, authenticated uploads, and other server-backed features are unavailable.\r\n"
			. "- WebXR requires HTTPS, except that localhost is accepted for local testing.\r\n";
	}

	private function server_script(): string {
		return <<<'JS'
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number.parseInt(process.env.VRODOS_STANDALONE_PORT || '8080', 10);
const mimeTypes = {
  '.bin': 'application/octet-stream', '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream',
  '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon', '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.ktx2': 'image/ktx2', '.mjs': 'text/javascript; charset=utf-8', '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4', '.ogg': 'audio/ogg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.wav': 'audio/wav', '.webm': 'video/webm',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

const server = createServer((request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const filePath = resolve(root, relativePath);
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const stats = statSync(filePath);
    if (!stats.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}/`;
  console.log(`VRodos scene available at ${url}`);
  const commands = process.platform === 'win32'
    ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]];
  try {
    spawn(commands[0], commands[1], { detached: true, stdio: 'ignore' }).unref();
  } catch {}
});
JS;
	}
}
