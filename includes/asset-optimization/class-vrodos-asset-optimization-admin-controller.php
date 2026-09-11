<?php
require_once __DIR__ . '/trait-vrodos-asset-optimization-admin-actions.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-settings.php';
require_once __DIR__ . '/trait-vrodos-asset-optimization-dashboard.php';

require_once __DIR__ . '/class-vrodos-asset-optimization-service.php';

/** WordPress action handlers and presentation; domain work belongs to the service. */
class VRodos_Asset_Optimization_Admin_Controller extends VRodos_Asset_Optimization_Service {
	use VRodos_Asset_Optimization_Admin_Actions;
	use VRodos_Asset_Optimization_Settings_View;
	use VRodos_Asset_Optimization_Dashboard_View;
}
