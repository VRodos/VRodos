# VRodos: 3D/VR Content Management for WordPress

VRodos is a powerful WordPress plugin that transforms a standard website into a comprehensive 3D/VR content creation and management platform. It provides a complete ecosystem for authoring, managing, and displaying immersive 3D content, leveraging the power of WebGL, Three.js, and A-Frame directly within the WordPress environment.

This document serves as a technical guide for end-users, site administrators, and developers. It covers the plugin's features, architecture, installation, and configuration.

## Features

- **WebGL-Based 3D Editor**: A sophisticated in-browser editor built with Three.js (r147) for creating and managing complex 3D scenes.
- **Advanced Asset Management**: Upload, organize, and manage a wide range of 3D assets, including models (GLB, OBJ, FBX), textures, and media files.
- **VR Scene Authoring**: Export scenes to the A-Frame framework for creating VR-ready experiences.
- **Collaborative Editing**: Real-time, multi-user scene editing capabilities provided by a `networked-aframe` server component.
- **WordPress Integration**: Seamlessly integrated with WordPress using custom post types for projects, scenes, and assets.

## Architecture Overview for Developers

The VRodos plugin is built upon a modern, object-oriented architecture designed for stability, maintainability, and extensibility.

- **Manager Class Pattern**: The codebase is organized into a series of specialized manager classes, each responsible for a specific domain of functionality (e.g., asset management, post types, AJAX handling). This follows the single-responsibility principle and makes the code easier to navigate and maintain.
- **Clean Bootstrap**: The main plugin file (`VRodos.php`) serves as a simple bootstrap, responsible only for loading and instantiating the manager classes.
- **Centralized AJAX Handling**: All AJAX endpoints are managed within a single, dedicated handler class, ensuring consistent security and capability checks.

## Prerequisites

- **Apache 2** or equivalent web server
- **MySQL 5+** or **MariaDB 10+**
- **WordPress 6.0+**
- **PHP 8.1+**
- **Node.js 16+** (for the collaborative editing server)

## Installation

### 1. WordPress Plugin Installation

1.  Download the latest version of the plugin as a `.zip` file.
2.  In your WordPress dashboard, navigate to **Plugins → Add New → Upload Plugin**.
3.  Upload the `.zip` file and activate the plugin.

### 2. WordPress Configuration

After activation, ensure your WordPress environment is configured correctly:

1.  **Set Permalinks**: Go to **Settings → Permalinks** and select a structure other than "Plain." **Post name** is recommended.
2.  **Create Required Pages**: The plugin will automatically create the necessary pages for the editor and asset management. Add these pages to your desired menu in **Appearance → Menus**.

## Collaborative Server Setup (Optional)

VRodos includes a server component for real-time collaborative editing. If you wish to use this feature, follow these steps.

### 1. Install Server Dependencies

The collaborative server is located in the `runtime/networked-aframe/` directory. Navigate to this directory and install the required Node.js packages:

```bash
cd wp-content/plugins/VRodos/runtime/networked-aframe/
npm install
```

### 2. Configure WebRTC TURN Server

For collaborative editing to work reliably across different networks, a TURN server is required to handle WebRTC peer-to-peer connections.

1.  Create a free account at [Metered TURN Servers](https://www.metered.ca/turn-server).
2.  In your Metered dashboard, create a new credential.
3.  Create a file named `keys.json` inside the `runtime/networked-aframe/server/` directory.
4.  Add your credentials to the `keys.json` file using the following format:

```json
{
  "iceServers": [
    {
      "urls": "stun:stun.relay.metered.ca:80"
    },
    {
      "urls": "turn:a.relay.metered.ca:80",
      "username": "YOUR_METERED_USERNAME",
      "credential": "YOUR_METERED_CREDENTIAL"
    },
    {
      "urls": "turn:a.relay.metered.ca:80?transport=tcp",
      "username": "YOUR_METERED_USERNAME",
      "credential": "YOUR_METERED_CREDENTIAL"
    }
  ]
}
```

### 3. Start the Server

From the `runtime/networked-aframe/` directory, start the server:

```bash
node server/easyrtc-server.js
```

The server will start, by default, on port `5832`. The collaborative editing feature in the 3D scene editor will now be enabled.

## Troubleshooting

### WordPress API Not Working

-   **Issue**: REST API endpoints are not accessible, causing issues with saving or loading data.
-   **Solution**: Ensure you have set your **Settings → Permalinks** to a structure other than "Plain."

### Collaborative Server Connection Issues

-   **Issue**: The editor cannot connect to the collaborative server.
-   **Solution**:
    1.  Verify that the Node.js server is running correctly.
    2.  Check for firewall rules that might be blocking the server port.
    3.  Ensure your `keys.json` file is correctly configured.

### Large 3D Model Upload Limits

-   **Issue**: You receive an error when trying to upload large 3D model files.
-   **Solution**: You may need to increase the file upload limits for your web server and PHP. Add the following directives to your `.htaccess` file in the WordPress root directory:

```apache
php_value upload_max_filesize 512M
php_value post_max_size 512M
php_value memory_limit 1024M
php_value max_execution_time 1800
php_value max_input_time 1800
```

## Credits

-   **Authors**: Anastasios Papazoglou Chalikias, Elias Kouslis, Dimitrios Ververidis
-   **Website**: [https://vrodos.iti.gr](https://vrodos.iti.gr)

## License

See the `LICENSE` file for details.
