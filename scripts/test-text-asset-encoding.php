<?php
declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

function wp_parse_url( string $url, int $component = -1 ) {
	return parse_url( $url, $component );
}

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

foreach ( [
	[ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'https://example.test/download/1', '' ],
	[ 'application/octet-stream', 'https://example.test/falles.docx?download=1', '' ],
	[ '', 'https://example.test/download/1', 'falles (text).DOCX' ],
] as [ $mime, $url, $title ] ) {
	if ( ! VRodos_Text_Asset_Helper::is_supported_text_attachment( $mime, $url, $title ) ) {
		throw new RuntimeException( 'DOCX must be recognized without a repository category.' );
	}
}

function extract_docx_fixture( string $xml, string $entry = 'word/document.xml' ): array {
	$path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vrodos-docx-' . bin2hex( random_bytes( 8 ) ) . '.docx';
	try {
		$zip = new ZipArchive();
		$zip->open( $path, ZipArchive::CREATE );
		$zip->addFromString( $entry, $xml );
		$zip->close();
		return VRodos_Text_Asset_Helper::extract_from_file( $path, 'docx' );
	} finally {
		unlink( $path );
	}
}

$docx_xml = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
	. '<w:p><w:r><w:t>Les Falles </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>de València &amp; Ελληνικά</w:t><w:br/><w:t>Segona línia</w:t></w:r></w:p>'
	. '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Foc</w:t><w:tab/><w:t>i música</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
	. '</w:body></w:document>';
assert_extracted_text( 'DOCX styled runs, paragraphs, breaks and table text', extract_docx_fixture( $docx_xml ), "Les Falles de València & Ελληνικά\nSegona línia\nFoc i música" );
$long_docx = str_replace( 'Les Falles ', str_repeat( 'a', 2100 ), $docx_xml );
$truncated = extract_docx_fixture( $long_docx );
if ( ! $truncated['success'] || ! $truncated['truncated'] || ! str_ends_with( $truncated['text'], '...' ) ) {
	throw new RuntimeException( 'DOCX must use the existing text slab length limit.' );
}
if ( extract_fixture( 'Not a DOCX archive', 'docx' )['success'] ) {
	throw new RuntimeException( 'Invalid DOCX must be rejected.' );
}
foreach ( [
	[ $docx_xml, 'other.xml' ],
	[ '<w:document>', 'word/document.xml' ],
	[ '', 'word/document.xml' ],
	[ '<!DOCTYPE document [<!ENTITY external SYSTEM "file:///missing">]>' . $docx_xml, 'word/document.xml' ],
	[ str_repeat( 'a', 10 * 1024 * 1024 + 1 ), 'word/document.xml' ],
] as [ $xml, $entry ] ) {
	if ( extract_docx_fixture( $xml, $entry )['success'] ) {
		throw new RuntimeException( 'Missing, malformed, DTD-bearing or oversized DOCX content must be rejected.' );
	}
}
echo "3D text encoding and DOCX extraction tests passed.\n";
