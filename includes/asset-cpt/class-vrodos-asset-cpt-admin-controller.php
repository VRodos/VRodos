<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_CPT_Admin_Controller {
	use VRodos_Asset_CPT_Shared;
	use VRodos_Asset_CPT_Submission_Controller;
	use VRodos_Asset_CPT_Taxonomy_Admin;
	use VRodos_Asset_CPT_Metabox_Admin;

	private const NONCE_BASENAME = 'class-vrodos-asset-cpt-manager.php';

	private array $vrodos_databox1;

	public function __construct( array $databox ) {
		$this->vrodos_databox1 = $databox;
	}
}
