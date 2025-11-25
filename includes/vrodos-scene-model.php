<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Scene Model Class
 *
 * Represents a 3D scene with metadata and objects.
 * Uses typed properties for PHP 8.3+ type safety.
 */
class Vrodos_Scene_Model {

    /**
     * Scene metadata.
     */
    public ?object $metadata = null;

    /**
     * Scene objects.
     */
    public ?object $objects = null;

     /**
      * Constructor.
      *
      * @param string|null $json_string The JSON string to parse.
      */
    public function __construct(?string $json_string = null) {
        if ($json_string) {
            $this->from_json($json_string);
        }
    }

    /**
     * Populate the model from a JSON string.
     *
     * @param string $json_string The JSON string to parse.
     * @return void
     */
    public function from_json(string $json_string): void {
        $data = json_decode($json_string);

        if (json_last_error() === JSON_ERROR_NONE) {
            $this->metadata = $data->metadata ?? null;
            $this->objects = $data->objects ?? null;
        }
    }

    /**
     * Serialize the model to a JSON string.
     *
     * @return string The JSON representation of the model.
     */
    public function to_json(): string {
        return json_encode($this, JSON_PRETTY_PRINT);
    }
}
