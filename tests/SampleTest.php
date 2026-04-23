<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class SampleTest extends TestCase
{
    public function testPluginIsModernized(): void
    {
        $this->assertTrue(version_compare(PHP_VERSION, '8.1.0', '>='));
    }

    public function testCoreManagerExists(): void
    {
        $this->assertTrue(class_exists('VRodos_Core_Manager'));
    }

    public function testPathManagerUsesNewAssetRoots(): void
    {
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/js/editor/vrodos_scripts.js',
            VRodos_Path_Manager::editor_js_url('vrodos_scripts.js')
        );

        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/vendor/three-r181/vrodos-three-r181.bundle.js',
            VRodos_Path_Manager::vendor_url('three-r181/vrodos-three-r181.bundle.js')
        );

        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/models/editor/pawn.glb',
            VRodos_Path_Manager::model_url('editor/pawn.glb')
        );

        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/images/ui/audio.png',
            VRodos_Path_Manager::image_url('ui/audio.png')
        );

        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/media/sound/underwater.mp3',
            VRodos_Path_Manager::media_url('sound/underwater.mp3')
        );
    }

    public function testPathManagerReturnsExpectedFilesystemPaths(): void
    {
        $pluginRoot = dirname(__DIR__) . '/';

        $this->assertSame(
            $pluginRoot . 'templates/runtime/aframe/Master_Client_prototype.html',
            VRodos_Path_Manager::runtime_template_path('Master_Client_prototype.html')
        );

        $this->assertSame(
            $pluginRoot . 'templates/pages/vrodos-project-manager-template.php',
            VRodos_Path_Manager::page_template_path('vrodos-project-manager-template.php')
        );

        $this->assertSame(
            $pluginRoot . 'runtime/build/Master_Client_100.html',
            VRodos_Path_Manager::runtime_build_path('Master_Client_100.html')
        );

        $this->assertSame(
            $pluginRoot . 'services/networked-aframe/server/easyrtc-server.js',
            VRodos_Path_Manager::networked_aframe_server_path()
        );

        $this->assertSame(
            $pluginRoot . 'assets/scenes/standard_scene.json',
            VRodos_Path_Manager::standard_scene_path()
        );
    }

    public function testPageTemplateHelpersPreserveCanonicalAndLegacyMetaValues(): void
    {
        $this->assertSame(
            '/templates/pages/vrodos-project-manager-template.php',
            VRodos_Path_Manager::canonical_page_template_meta( 'vrodos-project-manager-template.php' )
        );

        $this->assertSame(
            '/templates/vrodos-project-manager-template.php',
            VRodos_Path_Manager::legacy_page_template_meta( 'vrodos-project-manager-template.php' )
        );

        $this->assertSame(
            [
                '/templates/pages/vrodos-project-manager-template.php',
                '/templates/vrodos-project-manager-template.php',
            ],
            VRodos_Path_Manager::page_template_meta_values( 'vrodos-project-manager-template.php' )
        );
    }

    public function testPageTemplatePathNormalizesLegacyMetaToCanonicalFile(): void
    {
        $pluginRoot = dirname(__DIR__) . '/';

        $this->assertSame(
            $pluginRoot . 'templates/pages/vrodos-project-manager-template.php',
            VRodos_Path_Manager::page_template_path( '/templates/vrodos-project-manager-template.php' )
        );

        $this->assertSame(
            $pluginRoot . 'templates/pages/vrodos-project-manager-template.php',
            VRodos_Path_Manager::page_template_path( '/templates/pages/vrodos-project-manager-template.php' )
        );
    }

    public function testFrontendPathsExposeRefactoredBases(): void
    {
        $paths = VRodos_Path_Manager::frontend_paths();

        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/',
            $paths['pluginBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/',
            $paths['assetsBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/js/editor/',
            $paths['editorJsBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/js/runtime/',
            $paths['runtimeJsBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/vendor/',
            $paths['vendorBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/models/',
            $paths['modelBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/images/',
            $paths['imageBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/media/',
            $paths['mediaBaseUrl']
        );
        $this->assertSame(
            'https://example.com/wp-content/plugins/vrodos/assets/css/',
            $paths['cssBaseUrl']
        );
    }
}
