<?php

define( 'ABSPATH', __DIR__ );

function sanitize_text_field( $value ): string { return trim( strip_tags( $value ) ); }
function sanitize_textarea_field( $value ): string { return trim( strip_tags( $value ) ); }
function sanitize_key( $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function wp_strip_all_tags( $value ): string { return strip_tags( $value ); }
function absint( $value ): int { return abs( (int) $value ); }
function get_post_meta( $id, $key, $single ) { return $GLOBALS['diary_meta'][ $id ][ $key ] ?? ''; }
function get_post_type( $id ): string { return 100 === $id ? 'vrodos_game' : ( 200 === $id ? 'vrodos_scene' : 'vrodos_asset3d' ); }
function get_post_field(): string { return 'test-project'; }
function current_user_can(): bool { return $GLOBALS['diary_permitted'] ?? true; }
function has_term( $term, $taxonomy, $id ): bool {
	return match ( $taxonomy ) {
		'vrodos_game_type' => $term === ( $GLOBALS['diary_project_type'] ?? 'archaeological_site_games' ),
		'vrodos_scene_pgame' => 200 === $id && 'test-project' === $term,
		'vrodos_asset3d_pgame' => $id >= 300 && 'test-project' === $term,
		default => false,
	};
}

require_once __DIR__ . '/../includes/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/../includes/class-vrodos-spatial-diary.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-assets.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-scene-repository.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-aframe-entity-renderer.php';

function verify( bool $condition, string $description ): void {
	if ( ! $condition ) throw new RuntimeException( $description );
}

$draft = VRodos_Spatial_Diary::read( 200 );
$stages = implode( ',', VRodos_Spatial_Diary::STAGE_COLUMNS ) . "\r\n"
	. "field,1,2025-04,Field,001,Αρχικό έδαφος,Example\r\ntrench,2,2025-05-01,Open trench,002,Stairs visible,Example\r\n";
$import = VRodos_Spatial_Diary::import_csv( $draft, 'stages', "\xEF\xBB\xBF" . $stages );
verify( ! $import['errors'] && 2 === $import['counts']['added'], 'Valid staged excavation records with UTF-8 BOM must import.' );
$draft = $import['diary'];
$draft['models'] = [ 'cover', 'trench', 'find' ];
$draft['stages'][0]['site_model'] = 'cover';
$draft['stages'][0]['layers'] = [ 'cover' ];
$draft['stages'][1]['site_model'] = 'trench';
$draft['stages'][1]['layers'] = [ 'trench', 'find' ];
$draft['safePoint'] = [ -3.5, 0.0, 3.6 ];
$draft['safePointLocked'] = true;

$reimport = VRodos_Spatial_Diary::import_csv( $draft, 'stages', str_replace( 'Stairs visible', 'Stairs excavated', $stages ) );
$entry = $reimport['diary']['stages'][1];
verify( 1 === $reimport['counts']['updated'] && 'trench' === $entry['site_model'] && [ 'trench', 'find' ] === $entry['layers'], 'Re-import must preserve the site model and additional layers.' );
verify( true === $reimport['diary']['safePointLocked'] && $draft['safePoint'] === $reimport['diary']['safePoint'], 'CSV re-import must preserve the safe viewpoint and its lock.' );

$finds = implode( ',', VRodos_Spatial_Diary::FIND_COLUMNS ) . "\n"
	. "vessel,Ceramic, trench,recovered,1,2025-05,Recovered,Found beside stairs,Example\nvessel,Ceramic,trench,assessment,2,,Assessment,Condition unchanged,Example\n";
$import = VRodos_Spatial_Diary::import_csv( $draft, 'finds', $finds );
verify( ! $import['errors'] && 2 === $import['counts']['added'], 'A find history must support multiple records with one discovery ID.' );
$draft = $import['diary'];
$draft['finds'][0]['point'] = [ 0, -1.44, -1 ];
$draft['finds'][0]['entries'][0]['model'] = 'find';
$draft['finds'][0]['entries'][0]['pins'] = [ [ 'point' => [ 0, 0.25, 0 ], 'text' => 'Rim', 'model' => 'find' ] ];

$reimport = VRodos_Spatial_Diary::import_csv( $draft, 'finds', str_replace( 'Found beside stairs', 'Revised observation', $finds ) );
$result = $reimport['diary']['finds'][0];
verify( 1 === $reimport['counts']['updated'] && $result['point'] === [ 0.0, -1.44, -1.0 ] && 'find' === $result['entries'][0]['model'] && 'Rim' === $result['entries'][0]['pins'][0]['text'], 'Re-import must preserve placed marks, model assignments, and annotation pins.' );
$standalone_csv = str_replace( [ ', trench,', ',trench,' ], ',,', $finds );
$unlink = VRodos_Spatial_Diary::import_csv( $draft, 'finds', $standalone_csv );
verify( ! $unlink['errors'] && 2 === $unlink['counts']['updated'] && '' === $unlink['changes'][0]['discovery_stage_id'], 'Making a find standalone must be reported in CSV preview.' );
$standalone_find = $unlink['diary']['finds'][0];
verify( '' === $standalone_find['discovery_stage_id'] && $standalone_find['point'] === [ 0.0, -1.44, -1.0 ] && 'find' === $standalone_find['entries'][0]['model'] && 'Rim' === $standalone_find['entries'][0]['pins'][0]['text'], 'Removing a discovery link must preserve model versions, the marker, and annotation pins.' );
$relink = VRodos_Spatial_Diary::import_csv( $unlink['diary'], 'finds', $finds );
verify( ! $relink['errors'] && 'trench' === $relink['changes'][0]['discovery_stage_id'] && 'trench' === $relink['diary']['finds'][0]['discovery_stage_id'], 'A standalone find can be relinked by CSV.' );
$import_without_stages = VRodos_Spatial_Diary::import_csv( VRodos_Spatial_Diary::read( 200 ), 'finds', $standalone_csv );
verify( ! $import_without_stages['errors'] && 2 === $import_without_stages['counts']['added'] && [] === $import_without_stages['diary']['stages'], 'Standalone finds can be imported into an empty scene.' );
$bad = VRodos_Spatial_Diary::import_csv( $draft, 'finds', str_replace( 'trench,assessment', 'missing,assessment', $finds ) );
verify( null === $bad['diary'] && str_contains( $bad['errors'][0], 'Row 3' ), 'An unknown discovery entry must prevent partial changes.' );
$bad = VRodos_Spatial_Diary::import_csv( $draft, 'stages', str_replace( '2025-05-01', '2025-02-30', $stages ) );
verify( null === $bad['diary'] && str_contains( $bad['errors'][0], 'Row 3' ), 'An impossible date must be rejected by row.' );

verify( VRodos_Spatial_Diary::can_edit( 100, 200 ), 'An editable Archaeological Site scene must permit diary edits.' );
$GLOBALS['diary_project_type'] = 'vrexpo_games';
verify( ! VRodos_Spatial_Diary::can_edit( 100, 200 ), 'Exhibition scenes must reject diary edits.' );
$GLOBALS['diary_project_type'] = 'archaeological_site_games';
$GLOBALS['diary_permitted'] = false;
verify( ! VRodos_Spatial_Diary::can_edit( 100, 200 ), 'The archaeological type does not grant scene edit permission.' );

$source = (object) [ 'objects' => (object) [ 'common' => (object) [ 'uuid' => 'common' ] ] ];
foreach ( [ 'cover', 'trench', 'find' ] as $index => $id ) {
	$asset = 300 + $index;
	$GLOBALS['diary_meta'][ $asset ]['vrodos_asset3d_glb'] = 700 + $index;
	$source->objects->{$id} = (object) [ 'uuid' => $id, 'asset_id' => $asset, 'category_slug' => 'find' === $id ? 'decoration' : 'walkable-surface', 'compiledCollisionEnabled' => 'find' !== $id ];
}
$clone = static fn() => json_decode( json_encode( $source ) );
$ordinary = $clone();
VRodos_Spatial_Diary::prepare_scene( $ordinary, 100, 200, 'single-player' );
verify( ! isset( $ordinary->spatial_diary ) && isset( $ordinary->objects->cover ), 'A scene without a saved diary must build its ordinary placements.' );
$GLOBALS['diary_meta'][200]['_vrodos_spatial_diary'] = $draft;
$published = $clone();
VRodos_Spatial_Diary::prepare_scene( $published, 100, 200, 'single-player' );
verify( 3 === count( get_object_vars( $published->spatial_diary->models ) ) && [ 'common' ] === array_keys( get_object_vars( $published->objects ) ), 'A build must include the saved diary and make its placements available only to the diary runtime.' );
verify( [ 'trench', 'find' ] === $published->spatial_diary->stages[1]['layers'], 'Playback must receive the site model and additional layers together.' );
verify( ! property_exists( $published->spatial_diary, 'safePointLocked' ), 'The safe viewpoint lock belongs to the editor.' );

$standalone_draft = $import_without_stages['diary'];
$standalone_draft['models'] = [ 'find' ];
$standalone_draft['finds'] = [ $standalone_find ];
$GLOBALS['diary_meta'][200]['_vrodos_spatial_diary'] = VRodos_Spatial_Diary::normalize( $standalone_draft );
$find_only_build = $clone();
VRodos_Spatial_Diary::prepare_scene( $find_only_build, 100, 200, 'single-player' );
verify( [] === $find_only_build->spatial_diary->stages
	&& '' === $find_only_build->spatial_diary->finds[0]['discovery_stage_id']
	&& ! $find_only_build->spatial_diary->changesWalkableLayout, 'Find-only builds must include the diary with zero excavation entries and no changing walkable layout.' );
verify( isset( $find_only_build->spatial_diary->models->find ) && ! isset( $find_only_build->objects->find ) && isset( $find_only_build->objects->cover ), 'Find inspection models must be emitted as diary templates and ordinary scene models must remain in the scene.' );
$incomplete_find = $standalone_draft;
$incomplete_find['finds'][0]['point'] = null;
$GLOBALS['diary_meta'][200]['_vrodos_spatial_diary'] = $incomplete_find;
$failure = '';
try { VRodos_Spatial_Diary::prepare_scene( $clone(), 100, 200, 'single-player' ); } catch ( InvalidArgumentException $error ) { $failure = $error->getMessage(); }
verify( str_contains( $failure, 'assign its first model' ), 'Find-only publication must still require a marker and first model.' );

$mixed_draft = $draft;
$standalone_find['find_id'] = 'surface-find';
$mixed_draft['finds'][] = $standalone_find;
$GLOBALS['diary_meta'][200]['_vrodos_spatial_diary'] = VRodos_Spatial_Diary::normalize( $mixed_draft );
$mixed_build = $clone();
VRodos_Spatial_Diary::prepare_scene( $mixed_build, 100, 200, 'single-player' );
verify( [ 'trench', '' ] === array_column( $mixed_build->spatial_diary->finds, 'discovery_stage_id' )
	&& 3 === count( get_object_vars( $mixed_build->spatial_diary->models ) ), 'Mixed publication must retain each discovery link and emit shared models once.' );

$renderer = new VRodos_Compiler_AFrame_Entity_Renderer( new VRodos_Compiler_Runtime_Assets(), new VRodos_Compiler_Scene_Repository(), static fn( string $url ): string => $url );
$renderer->configure( '/assets/', false, true );
$dom = new DOMDocument();
$dom->loadHTML( '<!doctype html><html><body><a-scene></a-scene></body></html>', LIBXML_NOERROR );
$cover = $published->spatial_diary->models->cover;
$cover->glb_path = '/published/cover.glb';
$cover->position = [ 0, 0, 0 ];
$cover->rotation = [ 0, 0, 0 ];
$cover->scale = [ 1, 1, 1 ];
$cover->desktop_profile_glb_urls = (object) [ 'low' => '/published/cover-low.glb', 'high' => '/published/cover-high.glb' ];
$renderer->render_diary_templates( $dom, $dom->getElementsByTagName( 'a-scene' )->item( 0 ), (object) [ 'cover' => $cover ] );
$template = $dom->getElementsByTagName( 'template' )->item( 0 );
$placement = $template->firstChild;
verify( 'cover' === $template->getAttribute( 'data-vrodos-diary-model' ) && ! $placement->hasAttribute( 'gltf-model' )
	&& '/published/cover-low.glb' === $placement->getAttribute( 'data-vrodos-diary-src-low' ) && 'navmesh' === $placement->getAttribute( 'data-vrodos-collision-role' ),
	'Diary templates must remain inert at startup while preserving derivative and collision metadata.' );

$draft['safePoint'] = null;
$GLOBALS['diary_meta'][200]['_vrodos_spatial_diary'] = $draft;
$failure = '';
try { VRodos_Spatial_Diary::prepare_scene( $clone(), 100, 200, 'single-player' ); } catch ( InvalidArgumentException $error ) { $failure = $error->getMessage(); }
verify( str_contains( $failure, 'safe viewpoint' ), 'Changing walkable layouts require a safe viewpoint.' );

echo "Spatial diary import, project gate, and publication tests passed.\n";
