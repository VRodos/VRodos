<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\SetList;
use Rector\Set\ValueObject\LevelSetList;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->paths([
        __DIR__ . '/includes',
        __DIR__ . '/VRodos.php',
    ]);

    // Use specific rules for PHP 8.1 modernization
    $rectorConfig->sets([
        LevelSetList::UP_TO_PHP_81,
        // SetList::CODE_QUALITY,
        SetList::DEAD_CODE,
        // SetList::TYPE_DECLARATION, 
    ]);
    
    // Skip some files if needed (e.g. templates which might break with strict types)
    $rectorConfig->skip([
        __DIR__ . '/includes/templates/*', 
    ]);
};
