VRodos

A plugin for WordPress to transform your website into a multipurpose 3D media management tool

- 3D assets repository
- 3D assets visualizer for WordPress pages, e.g. commercial pages with 3D content
- Database and API point of 3D media for your mobile applications
- Digital Signage management tool capable for visualizing 3D media
- VR applications authoring tool with a 3D scene editor

Features

- Formats support:  GLB.
- Support sound

Interface Pages

- Asset List
- Project Manager
- Scene 3D Editor
- Asset Editor


### Do you have a demo?

* https://vrodos.iti.gr

* (Use Chrome or Firefox)


### Installation instructions ###

**Prerequisites:**
* Apache 2,
* MySQL 5,
* WordPress 6,
* Php 7,
* Node.js 16


**Instructions for installation in WordPress**

- Download as zip
- Rename VRodos-master.zip to VRodos.zip
- Also rename the folder VRodos-master inside the zip file to VRodos.

- Install VRodos.zip from WordPress dashboard with "ADD from file" button in install new plugins.

- Download mdc and other node modules

  -- In root folder `VRodos` run `npm install`.

- Set permalinks to Day / Name (2nd option)
- Add to menu
  -- Assets List Page
  -- Project Manager page

  

### Servers install and run

Two types of servers are needed:

- Apache server, e.g. on windows locally using Xampp / Wamp etc.
    - Server is used for the content of the scenes.
    - Server contains also mysql server which is needed for WordPress to work (and somewhere to save the data).
- Node.js server for Networked-Aframe. To start Node.js server
    1) Go to networked-aframe/server and type:
       > npm install --force

        - Force is needed because some packages are obsolete

    2) A WebRTC TURN server is used for the collaborative functionality of VROdos. Create a free account for OpenRelay, and save server keys in a json file. 
        - Go to: https://dashboard.metered.ca/signup?tool=turnserver
        - Create a free account.
        - On your dashboard create an App.
        - Add Credential, then on the created entry click on Instructions.
        - Copy all objects from array into a json file called `keys.json` and save the file in folder `networked-aframe/server` 

    3) Run server using a port number you want, or leave it blank for default port (5832):
       > node .\easyrtc-server.js port_number
        
       Examples:
       
       `node .\easyrtc-server.js`
       
        Runs in default port 5832.
    
       `node .\easyrtc-server.js 5840`
       
        Runs in port passed as argument 5840
    
    Now after building a scene in the 3D editor, the collaborative functionality between users is enabled. 
        

### Troubleshooting

* Wordpress API is not working :  Settings -> Permalinks -> Post name (as Structure)


* CORS
  You need wordpress at port 80 (apache2 standard) to allow to give content to aframe at node.js server at port 5832, or whichever port you have used when running easyRTC service.

####Add this to .htaccess

`<IfModule mod_headers.c>`

	Header set Access-Control-Allow-Origin "*"

`</IfModule>`

#### Big 3D models

  Add these to .htaccess to allow big files to be uploaded to wordpress

    - php_value upload_max_filesize 512M
    - php_value post_max_size 512M
    - php_value memory_limit 1024M
    - php_value max_execution_time 1800
    - php_value max_input_time 1800
    - php_value max_input_vars 4000