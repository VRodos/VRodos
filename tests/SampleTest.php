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
}
