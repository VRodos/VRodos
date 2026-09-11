<?php
function maybe_unserialize( $value ) { return $value; }
require_once __DIR__ . '/../includes/class-vrodos-cefr-levels.php';
foreach ( json_decode( file_get_contents( __DIR__ . '/fixtures/cefr-levels.json' ), true ) as $fixture ) {
	if ( VRodos_Cefr_Levels::normalize( $fixture['input'] ) !== $fixture['levels'] ) {
		throw new RuntimeException( 'CEFR normalization fixture failed.' );
	}
}
echo "PHP CEFR parity fixtures passed.\n";
