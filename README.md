# VRodos

A WordPress plugin that transforms your website into a comprehensive 3D/VR content creation and management platform.

## Features

VRodos provides a complete ecosystem for 3D content management:

- **3D Asset Repository**: Organize and manage 3D models, textures, audio, and video files
- **WebGL-Based 3D Editor**: Built with Three.js r147 and A-Frame for creating immersive 3D scenes
- **Asset Visualizer**: Display 3D content on WordPress pages for commercial or educational purposes
- **API for Mobile Apps**: Use WordPress as a backend database for your mobile 3D applications
- **VR Scene Authoring**: Create VR experiences with the integrated scene editor
- **Collaborative Editing**: Real-time multi-user scene editing via WebRTC
- **Digital Signage**: Manage and display 3D media for digital signage applications

### Supported Formats
- **3D Models**: GLB, OBJ, FBX
- **Media**: Audio, Video, Images
- **HDR Environments**: RGBE format for realistic lighting

## Architecture

VRodos follows a modern, object-oriented architecture:

- **Manager Class Pattern**: 18 specialized manager classes handle different aspects of the plugin
- **WordPress Integration**: Leverages custom post types (Games/Projects, Scenes, Assets) and WordPress APIs
- **Three.js r147**: Modern WebGL rendering with comprehensive loader support
- **A-Frame Integration**: VR-ready scene export capabilities
- **Scene Persistence**: Custom serialization system for saving complex 3D scene states

## Prerequisites

- **Apache 2**
- **MySQL 5+**
- **WordPress 6+**
- **PHP 7+**
- **Node.js 16+**

## Installation

### WordPress Plugin Installation

1. Download the plugin as a ZIP file
2. Rename `VRodos-master.zip` to `VRodos.zip`
3. Rename the folder inside the ZIP from `VRodos-master` to `VRodos`
4. Install via WordPress dashboard: **Plugins → Add New → Upload Plugin**
5. Activate the plugin

### Install Dependencies

In the plugin root directory (`wp-content/plugins/VRodos`):

```bash
npm install
```

### WordPress Configuration

1. **Set Permalinks**: Go to **Settings → Permalinks** and select **Day and name** (2nd option)
2. **Add Pages to Menu**: Add the following pages to your WordPress menu:
   - Assets List Page
   - Project Manager Page

## Networked-Aframe Server Setup

VRodos includes collaborative editing functionality via a Node.js server.

### 1. Install Server Dependencies

Navigate to the networked-aframe server directory:

```bash
cd networked-aframe/server
npm install --force
```

*Note: `--force` is required due to some legacy package dependencies*

### 2. Configure WebRTC TURN Server

Create a free account on [Metered TURN Server](https://dashboard.metered.ca/signup?tool=turnserver):

1. Sign up and create an App in your dashboard
2. Add a credential and click **Instructions**
3. Create a `keys.json` file in `networked-aframe/server/` with the following format:

```json
{
    "iceServers": [
        {
            "urls": "stun:stun.relay.metered.ca:80"
        },
        {
            "urls": "turn:a.relay.metered.ca:80",
            "username": "your_username",
            "credential": "your_credential"
        },
        {
            "urls": "turn:a.relay.metered.ca:80?transport=tcp",
            "username": "your_username",
            "credential": "your_credential"
        }
    ]
}
```

### 3. Start the Server

Run the server with a custom port or use the default (5832):

```bash
node ./easyrtc-server.js
```

Or specify a custom port:

```bash
node ./easyrtc-server.js 5840
```

Once the server is running, the collaborative editing feature will be enabled in the 3D scene editor.

## Troubleshooting

### WordPress API Not Working

**Issue**: REST API endpoints not accessible

**Solution**: Go to **Settings → Permalinks** and select **Post name** structure

### CORS Issues

**Issue**: Content from WordPress (port 80) not accessible by the networked-aframe server (port 5832)

**Solution**: Add the following to your `.htaccess` file in the WordPress root:

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
```

### Large 3D Model Upload Limits

**Issue**: Cannot upload large 3D model files

**Solution**: Add the following to your `.htaccess` file:

```apache
php_value upload_max_filesize 512M
php_value post_max_size 512M
php_value memory_limit 1024M
php_value max_execution_time 1800
php_value max_input_time 1800
php_value max_input_vars 4000
```

## Demo

Visit [https://vrodos.iti.gr](https://vrodos.iti.gr) (Use Chrome or Firefox)

## Credits

**Authors**: Anastasios Papazoglou Chalikias, Elias Kouslis, Dimitrios Ververidis

**Website**: [https://vrodos.iti.gr](https://vrodos.iti.gr)

## License

See `LICENSE` file for details.