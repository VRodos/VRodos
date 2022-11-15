VRodos

A plugin for WordPress to transform your website into a multipurpose 3D media management tool

- 3D assets repository
- 3D assets visualizer for WordPress pages, e.g. commercial pages with 3D content
- Database and API point of 3D media for your mobile applications
- Digital Signage management tool capable for visualizing 3D media
- VR applications authoring tool with a 3D scene editor


Features

- Formats support: FBX, GLB, OBJ, PDB.
- Animation support* 
- Support sound
- Eco-friendly with rendering-on-demand

Interface Pages

- Asset List
- Project Manager
- Scene 3D Editor
- Asset Editor


*Currently only one animation per 3D model is supported.

[comment]: <> (##Basic Interfaces)

[comment]: <> (Asset Uploader and Previewer)

[comment]: <> (![Example Asset]&#40;AssetExample.jpg&#41;)

[comment]: <> (Scene synthesis)

[comment]: <> (![Example Scene]&#40;SceneExample.jpg&#41;)


[comment]: <> (### What is this repository for? ###)


[comment]: <> (Other features)

[comment]: <> (- Lights &#40;Spot, Directional, Sphere&#41;)


### Do you have a demo?

* https://vrodos.iti.gr

* (Use Chrome or Firefox)


### Installation instructions ###

**Prerequisites:** 
* Apache 2, 
* MySQL 5, 
* WordPress 6, 
* Php 7, 
* Node.js 16, 
* Express 4 for Node.js 


**Instructions**

- Download as zip
- Rename VRodos-master.zip to VRodos.zip
- Also rename the folder VRodos-master inside the zip file to VRodos.

- Install VRodos.zip from WordPress dashboard with "ADD from file" button in install new plugins.

- Download mdc and other node modules

    -- VRodos > npm install

- Set permalinks to Day / Name (2nd option)
- Add to menu 
-- Assets List Page
-- Project Manager page


[comment]: <> (### Peer calls ###)

[comment]: <> (A visitor to an artifact can speak with an expert through node.js peer-calls. It is installed in an iframe in artifact page.)

[comment]: <> (It starts in server in the peer-calls folder with)

[comment]: <> (* sudo npm run build)

[comment]: <> (* sudo npm start  )


[comment]: <> (### Who do I talk to? ###)

[comment]: <> (* I am coordinating and contributing to this repository: Dimitrios Ververidis, ververid [at] iti.gr, jimver04 [at] gmail.com)

### Troubleshooting

* Wordpress API is not working :  Settings -> Permalinks -> Post name (as Structure)  


* CORS
  You need wordpress at port 80 (apache2 standard) to allow to give content to aframe at node.js server at port 5832

Add this to .htaccess

<IfModule mod_headers.c>
	Header set Access-Control-Allow-Origin "*"
</IfModule>

* Big 3D models
 
  Add these to .htaccess to allow big files to be uploaded to wordpress 

  - php_value upload_max_filesize 512M
  - php_value post_max_size 512M
  - php_value memory_limit 1024M
  - php_value max_execution_time 1800
  - php_value max_input_time 1800
  - php_value max_input_vars 4000


### Start servers

Two types of servers are needed:

  - Apache server, e.g. locally using a xampp (Windows and Linux are supported).
    - It can run on http://127.0.0.1:80
  - Node.js server for Networked-Aframe. To start Node.js server 
    1) Go to networked-aframe/server and type: 
        > npm install --force
        
        - Force is needed because some packages are obsolete
    2) Run server:
        > start node .\easyrtc-server.js
        
        - Go to http://127.0.0.1:5832/index_60.html - where 60 should be replaced with the id of your scene - to see if your server is delivering anything. Xampp server should be up and running as a prerequisite because the content is fetched from http://127.0.0.1:80 as Node.js handles only streaming data for the multiplaying. 
