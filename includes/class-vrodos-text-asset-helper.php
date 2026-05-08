<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Text_Asset_Helper {
	public const MAX_TEXT_LENGTH = 2000;

	public static function is_supported_text_attachment( string $mime_type, string $url = '', string $title = '' ): bool {
		$mime_type = strtolower( trim( $mime_type ) );
		if ( in_array( $mime_type, [ 'text/plain', 'text/rtf', 'application/rtf', 'application/x-rtf' ], true ) ) {
			return true;
		}

		$extension = self::detect_format( $title, $mime_type );
		if ( $extension !== '' ) {
			return true;
		}

		return self::detect_format( $url, $mime_type ) !== '';
	}

	public static function detect_format( string $filename_or_url, string $mime_type = '' ): string {
		$mime_type = strtolower( trim( $mime_type ) );
		if ( $mime_type === 'text/plain' ) {
			return 'txt';
		}
		if ( in_array( $mime_type, [ 'text/rtf', 'application/rtf', 'application/x-rtf' ], true ) ) {
			return 'rtf';
		}

		$path = (string) wp_parse_url( $filename_or_url, PHP_URL_PATH );
		if ( $path === '' ) {
			$path = $filename_or_url;
		}

		$extension = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
		return in_array( $extension, [ 'txt', 'rtf' ], true ) ? $extension : '';
	}

	public static function extract_from_file( string $path, string $format = '' ): array {
		if ( $path === '' || ! file_exists( $path ) || ! is_readable( $path ) ) {
			return [
				'success'         => false,
				'text'            => '',
				'format'          => $format,
				'original_length' => 0,
				'truncated'       => false,
				'error'           => 'Text file could not be read.',
			];
		}

		$format = $format !== '' ? $format : self::detect_format( $path );
		if ( ! in_array( $format, [ 'txt', 'rtf' ], true ) ) {
			return [
				'success'         => false,
				'text'            => '',
				'format'          => '',
				'original_length' => 0,
				'truncated'       => false,
				'error'           => 'Unsupported text file format.',
			];
		}

		$raw = file_get_contents( $path );
		if ( ! is_string( $raw ) || $raw === '' ) {
			return [
				'success'         => false,
				'text'            => '',
				'format'          => $format,
				'original_length' => 0,
				'truncated'       => false,
				'error'           => 'Text file is empty.',
			];
		}

		$text = $format === 'rtf' ? self::rtf_to_plain_text( $raw ) : $raw;
		$text = self::normalize_text( $text );
		$original_length = self::text_length( $text );

		if ( $text === '' ) {
			return [
				'success'         => false,
				'text'            => '',
				'format'          => $format,
				'original_length' => 0,
				'truncated'       => false,
				'error'           => 'No extractable text was found.',
			];
		}

		$clamped = self::clamp_text( $text );

		return [
			'success'         => $clamped['text'] !== '',
			'text'            => $clamped['text'],
			'format'          => $format,
			'original_length' => $original_length,
			'truncated'       => $clamped['truncated'],
			'error'           => $clamped['text'] !== '' ? '' : 'No extractable text was found.',
		];
	}

	public static function normalize_manual_text( string $text ): array {
		$text = self::normalize_text( $text );
		$original_length = self::text_length( $text );
		$clamped = self::clamp_text( $text );

		return [
			'success'         => $clamped['text'] !== '',
			'text'            => $clamped['text'],
			'format'          => 'manual',
			'original_length' => $original_length,
			'truncated'       => $clamped['truncated'],
			'error'           => $clamped['text'] !== '' ? '' : 'Text content is empty.',
		];
	}

	public static function persist_extracted_text( int $asset_id, array $result, int $attachment_id = 0 ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		if ( $attachment_id > 0 ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_text_file', $attachment_id );
		}

		if ( empty( $result['success'] ) ) {
			update_post_meta( $asset_id, 'vrodos_asset3d_text_extract_error', (string) ( $result['error'] ?? 'Text extraction failed.' ) );
			delete_post_meta( $asset_id, 'vrodos_asset3d_text_content' );
			delete_post_meta( $asset_id, 'vrodos_asset3d_text_format' );
			delete_post_meta( $asset_id, 'vrodos_asset3d_text_original_length' );
			delete_post_meta( $asset_id, 'vrodos_asset3d_text_truncated' );
			return;
		}

		update_post_meta( $asset_id, 'vrodos_asset3d_text_content', wp_slash( (string) ( $result['text'] ?? '' ) ) );
		update_post_meta( $asset_id, 'vrodos_asset3d_text_format', sanitize_key( (string) ( $result['format'] ?? '' ) ) );
		update_post_meta( $asset_id, 'vrodos_asset3d_text_original_length', (int) ( $result['original_length'] ?? 0 ) );
		update_post_meta( $asset_id, 'vrodos_asset3d_text_truncated', ! empty( $result['truncated'] ) ? '1' : '0' );
		delete_post_meta( $asset_id, 'vrodos_asset3d_text_extract_error' );
	}

	private static function normalize_text( string $text ): string {
		$text = str_replace( "\0", '', $text );
		$text = preg_replace( '/^\xEF\xBB\xBF/', '', $text ) ?? $text;
		$text = wp_check_invalid_utf8( $text, true );
		$text = str_replace( [ "\r\n", "\r" ], "\n", $text );
		$text = preg_replace( "/[ \t]+/", ' ', $text ) ?? $text;
		$text = preg_replace( "/\n{3,}/", "\n\n", $text ) ?? $text;
		$text = preg_replace( '/[^\P{C}\n\t]/u', '', $text ) ?? $text;

		return trim( $text );
	}

	private static function clamp_text( string $text ): array {
		$length = self::text_length( $text );
		if ( $length <= self::MAX_TEXT_LENGTH ) {
			return [
				'text'      => $text,
				'truncated' => false,
			];
		}

		if ( function_exists( 'mb_substr' ) ) {
			$text = mb_substr( $text, 0, self::MAX_TEXT_LENGTH );
		} else {
			$text = substr( $text, 0, self::MAX_TEXT_LENGTH );
		}

		return [
			'text'      => rtrim( $text ) . '...',
			'truncated' => true,
		];
	}

	private static function text_length( string $text ): int {
		return function_exists( 'mb_strlen' ) ? (int) mb_strlen( $text ) : strlen( $text );
	}

	private static function rtf_to_plain_text( string $rtf ): string {
		$output       = '';
		$stack        = [];
		$ignorable    = false;
		$uc_skip      = 1;
		$skip_chars   = 0;
		$length       = strlen( $rtf );
		$destinations = [
			'fonttbl' => true, 'colortbl' => true, 'stylesheet' => true, 'info' => true,
			'pict' => true, 'object' => true, 'datastore' => true, 'themedata' => true,
			'xmlnstbl' => true, 'header' => true, 'footer' => true, 'footnote' => true,
		];

		for ( $i = 0; $i < $length; $i++ ) {
			$char = $rtf[ $i ];

			if ( $char === '{' ) {
				$stack[] = [ $ignorable, $uc_skip ];
				continue;
			}

			if ( $char === '}' ) {
				$state = array_pop( $stack );
				if ( is_array( $state ) ) {
					$ignorable = (bool) $state[0];
					$uc_skip   = (int) $state[1];
				}
				continue;
			}

			if ( $char !== '\\' ) {
				if ( $skip_chars > 0 ) {
					$skip_chars--;
					continue;
				}
				if ( ! $ignorable ) {
					$output .= $char;
				}
				continue;
			}

			if ( $i + 1 >= $length ) {
				continue;
			}

			$next = $rtf[ ++$i ];
			if ( in_array( $next, [ '\\', '{', '}' ], true ) ) {
				if ( ! $ignorable ) {
					$output .= $next;
				}
				continue;
			}

			if ( $next === "'" && $i + 2 < $length ) {
				$hex = substr( $rtf, $i + 1, 2 );
				if ( preg_match( '/^[0-9a-fA-F]{2}$/', $hex ) ) {
					if ( ! $ignorable ) {
						$output .= chr( hexdec( $hex ) );
					}
					$i += 2;
				}
				continue;
			}

			if ( ! preg_match( '/[A-Za-z*]/', $next ) ) {
				if ( ! $ignorable && $next === '~' ) {
					$output .= ' ';
				}
				continue;
			}

			$control = $next;
			while ( $i + 1 < $length && preg_match( '/[A-Za-z]/', $rtf[ $i + 1 ] ) ) {
				$control .= $rtf[ ++$i ];
			}

			$negative = false;
			if ( $i + 1 < $length && $rtf[ $i + 1 ] === '-' ) {
				$negative = true;
				$i++;
			}

			$number = '';
			while ( $i + 1 < $length && preg_match( '/[0-9]/', $rtf[ $i + 1 ] ) ) {
				$number .= $rtf[ ++$i ];
			}
			if ( $negative ) {
				$number = '-' . $number;
			}

			if ( $i + 1 < $length && $rtf[ $i + 1 ] === ' ' ) {
				$i++;
			}

			if ( $control === '*' ) {
				$ignorable = true;
				continue;
			}

			if ( isset( $destinations[ $control ] ) ) {
				$ignorable = true;
				continue;
			}

			if ( $control === 'uc' && $number !== '' ) {
				$uc_skip = max( 0, (int) $number );
				continue;
			}

			if ( $ignorable ) {
				continue;
			}

			if ( in_array( $control, [ 'par', 'line', 'page' ], true ) ) {
				$output .= "\n";
			} elseif ( $control === 'tab' ) {
				$output .= "\t";
			} elseif ( $control === 'u' && $number !== '' ) {
				$output .= self::codepoint_to_utf8( (int) $number );
				$skip_chars = $uc_skip;
			}
		}

		return $output;
	}

	private static function codepoint_to_utf8( int $codepoint ): string {
		if ( $codepoint < 0 ) {
			$codepoint += 65536;
		}

		if ( function_exists( 'mb_chr' ) ) {
			return mb_chr( $codepoint, 'UTF-8' );
		}

		if ( $codepoint <= 0x7F ) {
			return chr( $codepoint );
		}
		if ( $codepoint <= 0x7FF ) {
			return chr( 0xC0 | ( $codepoint >> 6 ) ) . chr( 0x80 | ( $codepoint & 0x3F ) );
		}

		return chr( 0xE0 | ( $codepoint >> 12 ) )
			. chr( 0x80 | ( ( $codepoint >> 6 ) & 0x3F ) )
			. chr( 0x80 | ( $codepoint & 0x3F ) );
	}
}
