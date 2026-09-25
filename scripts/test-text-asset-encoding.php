<?php
declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

function wp_check_invalid_utf8( string $text, bool $strip = false ): string {
	if ( 1 !== preg_match( '//u', $text ) ) {
		throw new RuntimeException( 'Extractor passed invalid UTF-8 to text normalization.' );
	}
	return $text;
}

require_once __DIR__ . '/../includes/class-vrodos-text-asset-helper.php';

function extract_fixture( string $bytes, string $format ): array {
	$path = tempnam( sys_get_temp_dir(), 'vrodos-text-' );
	if ( ! is_string( $path ) ) {
		throw new RuntimeException( 'Could not create a text fixture.' );
	}
	try {
		file_put_contents( $path, $bytes );
		return VRodos_Text_Asset_Helper::extract_from_file( $path, $format );
	} finally {
		unlink( $path );
	}
}

function assert_extracted_text( string $name, array $result, string $expected ): void {
	if ( ! $result['success'] || $result['text'] !== $expected ) {
		throw new RuntimeException( $name . ': expected ' . var_export( $expected, true ) . ', got ' . var_export( $result, true ) );
	}
}

$spanish = "¿Puedes identificar todos los ingredientes?\nAsegúrate de que encaja con la sartén.";
assert_extracted_text( 'UTF-8 TXT', extract_fixture( "\xEF\xBB\xBF" . $spanish, 'txt' ), $spanish );
assert_extracted_text(
	'Windows-1252 TXT',
	extract_fixture( "\xBFPuedes identificar todos los ingredientes?\nAseg\xFArate de que encaja con la sart\xE9n.", 'txt' ),
	$spanish
);

$rtf_1252 = <<<'RTF'
{\rtf1\ansi\ansicpg1252\uc1 \'bfPuedes identificar?\par Aseg\'farate con la sart\'e9n y el ni\'f1o. \u191?Otra vez}
RTF;
assert_extracted_text(
	'Windows-1252 RTF with Unicode control',
	extract_fixture( $rtf_1252, 'rtf' ),
	"¿Puedes identificar?\nAsegúrate con la sartén y el niño. ¿Otra vez"
);

$rtf_utf8 = <<<'RTF'
{\rtf1\ansi\ansicpg65001 \'c2\'bfPuedes?}
RTF;
assert_extracted_text( 'UTF-8 RTF escapes', extract_fixture( $rtf_utf8, 'rtf' ), '¿Puedes?' );

foreach ( [
	[ "\xFF\xFEP\0", 'txt' ],
	[ "A\x81B", 'txt' ],
	[ '{\rtf1\ansi\ansicpg99999 Text}', 'rtf' ],
] as [ $bytes, $format ] ) {
	$result = extract_fixture( $bytes, $format );
	if ( $result['success'] || $result['text'] !== '' || $result['error'] === '' ) {
		throw new RuntimeException( 'Unsupported encoding was not rejected.' );
	}
}

echo "3D text encoding tests passed.\n";
