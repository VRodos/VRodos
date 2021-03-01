<p class=MsoNormal style='margin-top:4.0pt;margin-right:0in;margin-bottom:6.0pt;
margin-left:0in;text-align:justify'>This section deals with the creation of a game, namely the creation of entities such as Game Project, Scenes, and Assets. A Scene is a collection of game objects, where a game object is an instance of an Asset. An Asset is a blueprint that can actually generate infinite game objects by drag ’n’ drop into the scene. More details about this structure can be found in deliverable D6.2.</p>

<p class=MsoNormal style='text-align:justify'>The procedure to create a virtual tour can be described as a linear procedure to create entities and assign categories to them that will define their behavior and role in the game. This procedure allows to hide programming details and make it easy to learn for the curator users. The linearity of the creation of a virtual tour is depicted in the diagram of Figure 1.</p>

<p class=MsoNormal><img width=604 height=116 style="display:block;margin: 0 auto;" src="Creating_files/image001.png"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784697">Figure </a>1 Depicting virtual tour creation as a linear procedure</p>

<p class=MsoNormal>Virtual tours creation consists of the following steps:</p>

<ol style='margin-top:0in' start=1 type=a>
    <li class=MsoNormalCxSpMiddle>Creation of the Game Project</li>
    <li class=MsoNormalCxSpMiddle>Creation of the Assets</li>
    <li class=MsoNormalCxSpMiddle>Creation of the Scenes</li>
    <li class=MsoNormalCxSpMiddle>Drag ’n’ drop Assets in the Scenes. This is called instantiation procedure. The resulted instances are called as Game Objects.</li>
</ol>

<p class=MsoNormal style='text-align:justify'>In the following, we describe the aforementioned steps. These steps can be viewed also in the first YouTube demo video: <a href="https://www.youtube.com/watch?v=BbBOKCBryvU&amp;t=448s"><span style='color:#1155CC'>https://www.youtube.com/watch?v=BbBOKCBryvU&amp;t=448s</span></a></p>

<h3>1.1. Create a Game Project</h3>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>This section describes the first step towards making a game, namely creating a Game Project. This is allowed by the Game Project Manager, an interface presented in Figure 2. The Game Project Manager is the central interface for creating / editing / deleting a Game Project. The left column presents the already created Game Projects by the certain user, but not the other game projects from other users as it was in the first prototype. On the right column, the user can make a new Game Project. The trash bin allows to delete a project.</p>

<p class=MsoNormal align=center style='margin-bottom:6.0pt;text-align:center'><img border=0 width=602 height=393 id=image20.jpg style="display:block;margin: 0 auto;" src="Creating_files/image002.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784698">Figure </a>2: The Game project manager allows creating or editing a project.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>Upon creating a new Game Project, the interface of Figure 2 is shown. A Game Project consists by default of 3 scenes, namely Main Menu, Credits and First Scene, where the latter is the virtual museum scene of the game. These Scenes are the standard scenes of a Game Project and cannot be deleted. We have decided to perform the default scenes creation automatically in order to alleviate the use of the tool, since all games have main menu, credits, and a first scene. New Scenes can be created with the “Add New Scene” button providing the title and the description of the scene. The new scenes are added to the left of the menu as the “Scladina area”.</p>

<p class=MsoNormal align=center style='margin-bottom:6.0pt;text-align:center'><img border=0 width=554 height=458 id=image41.jpg style="display:block;margin: 0 auto;" src="Creating_files/image003.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784699">Figure </a>3: Game project editor offers the functionalities of editing a game project.</p>

<h3>1.2 Customizing Main Menu and Credits scenes</h3>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>The Main Menu scene can be edited by pressing edit on the respective tile. Then, the interface of Figure 4 is presented. This interface allows modifying both Main Menu and Help scenes. In this form, the main image for the Main Menu can be
    uploaded. The Main Menu has three buttons namely “Login”, “Options”, and “Help” buttons. These buttons can be removed from the generated game with the toggle switches, if for example the curator does not want the users to login to the game. In the right part of this form, the Help scene can be modified. The Help scene will be presented as an image with a paragraph below the image.</p>

<p class=MsoNormal align=center style='margin-bottom:6.0pt;text-align:center'><img border=0 width=587 height=540 id=image44.jpg style="display:block;margin: 0 auto;"
                     src="Creating_files/image004.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784700">Figure </a>4: Form for editing the “Main Menu” and “Help” scenes.</p>

<p class=MsoNormal>Credits scene edit button leads to the interface of Figure 4. In this interface, the curator can upload an image and write some text with respect to his/her organization.</p>

<p class=MsoNormal align=center style='text-align:center'><img border=0 width=624 height=450 id=image9.png style="display:block;margin: 0 auto;" src="Creating_files/image005.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784701">Figure </a>5: Editing the credits scene.</p>

<h3>1.3 Creating Assets</h3>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>In the Project Editor Menu that was shown in Figure 3, there is a button “Add New 3D Asset”. This button allows the creation of assets in the Game Project. This button leads to the interface shown in Figure 6. The first thing that should be selected is the selection of the category of the asset. There are six types of asset categories, namely a “Site”, an “Artifact”, a “Point-of-Interest featuring Image and Text”, a “Point-of-Interest featuring Video”, a “Door” and a “Decoration”. Assets types define also the fields that should be filled for each asset. Common-standard fields for all assets are the title, the description, and the 3D model. The 3D model is necessary for all assets in order to have a representation in the virtual tour. The format supported is .obj with .mtl as material file and several .jpgs as texture files. More information about the format of the 3D models can be found in the GitHub wiki<a href="#_ftn1" name="_ftnref1" title=""><sup><sup><span style='font-size:12.0pt; font-family:"Calibri",sans-serif;color:black'>[1]</span></sup></sup></a>. The properties of each type of asset are described in the following.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'><b>Site:</b> An asset categorized as Site is the plain, or the baseline of the 3d stage. It usually contains a terrain or a building that serves as a base where the other assets will reside in. Technically - Unity3D speaking - a “Site” is a prefabricated asset with a mesh collider that does not allow other meshes to pass through.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'><b>Artifact</b> is an asset that is interact able, for example a human or animal bone that should be examined.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'><b>A POI Image-Text</b> asset gives information in the form of image and text when activated. This type of assets have the extra field “Image”.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'><b>POI Video</b> asset plays a video when activated. This asset type has the extra field “Video”. </p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'><b>Door</b> serves as a gateway between two scenes, or it can serve as a gateway in another point in the same scene.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'><b>Decoration</b> asset is a 3D model that is placed in the scene and serves no other purpose than to be decorative as implied by its name.  </p>

<p class=MsoNormal align=center style='margin-bottom:6.0pt;text-align:center'><img border=0 width=602 height=526 id=image52.jpg style="display:block;margin: 0 auto;" src="Creating_files/image006.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784702">Figure </a>6: Creating Assets. A “Site” type asset.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>Below the text field for providing the description, two buttons can be found for automatically fetching content from Wikipedia or Europeana. The curator can afterwards modify the content according to her/his preferences.</p>

<h3>1.4 Drag ‘n’ drop assets to a scene and make edits</h3>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>Upon pressing “EDIT” on a 3D Scene tile, as shown in Figure 7, the 3D editor of the scene is loaded as shown in Figure 8. The Assets created in the previous section are available to all Scenes in a toolbar on the right side. The Assets tiles can be ‘dragged and dropped’ from the right toolbar in the 3D scene so they can be instantiated as Game Objects (an Asset can be instantiated multiple times). More details are described in the following.</p>

<p class=MsoNormal align=center style='margin-bottom:6.0pt;text-align:center'><img border=0 width=602 height=496 id=image13.jpg style="display:block;margin: 0 auto;"
                     src="Creating_files/image007.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784703">Figure </a>7: Project editor contains the scenes to be edited.</p>

<p class=MsoNormal align=center style='margin-bottom:6.0pt;text-align:center'><img border=0 width=560 height=520 id=image43.jpg style="display:block;margin: 0 auto;"                      src="Creating_files/image008.jpg">
</p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784704">Figure </a>8: The 3D editor allows the editing of scenes.</p>

<p class=MsoNormal style='margin-bottom:6.0pt;text-align:justify'>The 3D editor consists of the following components:</p>

<p class=MsoNormal style='margin-bottom:0in;margin-bottom:.0001pt;text-align:
justify'><b>The upper ribbon</b>, which contains the title of the scene, that can be clicked and edited, the “EDITOR” button which is selected by default and shows the 3D environment of the scene, the “ANALYTICS” button which shows the game analytics, and a save button that saves all the changes in the scene. Below the ribbon, an editable description of the scene can be found.</p>

<p class=MsoNormal style='margin-bottom:0in;margin-bottom:.0001pt;text-align:
justify'><b>The 3D environment</b>, which can be used to edit the scene. It contains an avatar, a sidebar of available assets on the right of the screen, and several buttons that perform various actions. The avatar is the physical representation of the player. The avatar position and orientation is stored and inherited in the compiled game as the initial player position and orientation. The avatar is also the orbital center point in the scene. The scene can be viewed also in first person view by pressing the button with the face <img border=0 width=24 height=16 id=image5.png style="display:block;margin: 0 auto;" src="Creating_files/image009.png"> on the upper right.</p>

<p class=MsoNormal style='margin-bottom:0in;margin-bottom:.0001pt;text-align: justify'>As it was discussed previously, the sidebar of assets can be used for inserting assets into the scene. An asset can be inserted multiple times in the scene. This is called instantiation of an asset as a game object. All game objects inherit the properties and the behavior of the asset. The sidebar can be moved with LMB to other places and it can also be closed to save working space. In order to insert an asset into the scene, drag-n-drop the asset tile into the 3D environment. The asset is placed at the avatar position and a 3-axes widget with arrows is displayed (gizmo).  There are buttons on the top of the 3D editor that perform various actions such as:</p>

<ul>
    <li>Translation, rotation and scale of a 3d object</li>
    <li>Increase or decrease the 3d object axis size</li>
    <li>Delete a 3d object</li>
    <li>Enable / disable the layers of the interface</li>
    <li>First person mode toggle</li>
    <li>Full screen toggle</li>
</ul>

<h3>1.5 Override fields inside the 3D editor</h3>

<p class=MsoNormal style='text-align:justify'>Upon instantiating Assets as Game Objects in the Scene, the Game Objects inherit all fields from the Assets. However, there is a need for some Game Objects to have separate field values although they are generated from the same Asset. For example, a door asset can be  instantiated twice in the scene but each door should lead to a different scene. Therefore, we have implemented a mechanism that is activated by right clicking on the Game Object and a form with fields is presented, as shown in Figure 9. The door and the star (POI image-text) have been right clicked. The door has the “Door Reference Name” which serves as door id, the target “Door at Scene” which indicates from which door at which scene the user will be teleported and a checkbox to denote if the door is a reward item, which hides it, until all POIs and artefacts in the scene are visited. It is a gamification aspect that pushes the visitors to see all objects. All types of assets can be reward items apart from “Site” and “Decoration” types. Each scene can have only one reward item.</p>

<p class=MsoNormal align=center style='text-align:center'><img
            border=0 width=602 height=339 id=image37.jpg style="display:block;margin: 0 auto;" src="Creating_files/image010.jpg"></p>

<p class=MsoCaption align=center style='text-align:center'><a name="_Toc503784705"></a>Figure 9: 3D editor allows overriding some Asset fields for each instantiated Asset.</p>


<div><br clear=all>
    
    <hr align=left size=1 width="33%">
    
    <div id=ftn1>
        
        <p class=MsoNormal style='margin-bottom:0in;margin-bottom:.0001pt'><a
                href="#_ftnref1" name="_ftn1" title=""><sup><sup><span style='font-size:12.0pt;
font-family:"Calibri",sans-serif;color:black'>[1]</span></sup></sup></a><span
                style='font-size:10.0pt'> </span><a
                href="https://github.com/vrodos/wiki/3D-Models-specifications"><span
                    style='font-size:10.0pt;color:#1155CC'>https://github.com/vrodos/wiki/3D-Models-specifications</span></a></p>
    
    </div>
</div>
