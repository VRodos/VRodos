<?php

if (!defined('ABSPATH')) {
    exit;
}

class Vrodos_Scene_Model {

    /**
     * Scene metadata.
     *
     * @var object|null
     */
    public $metadata;

    /**
     * Scene objects.
     *
     * @var object|null
     */
    public $objects;

     /**
     * Constructor.
     *
     * @param string|null $json_string The JSON string to parse.
     */
    public function __construct($json_string = null) {
        if ($json_string) {
            $this->from_json($json_string);
        }
    }

    /**
     * Populate the model from a JSON string.
     *
     * @param string $json_string The JSON string to parse.
     */
    public function from_json($json_string) {
        $data = json_decode($json_string);

        if (json_last_error() === JSON_ERROR_NONE) {
            $this->metadata = isset($data->metadata) ? $data->metadata : null;
            $this->objects = isset($data->objects) ? $data->objects : null;
        }
    }

    /**
     * Serialize the model to a JSON string.
     *
     * @return string The JSON representation of the model.
     */
    public function to_json() {
        return json_encode($this, JSON_PRETTY_PRINT);
    }
}
