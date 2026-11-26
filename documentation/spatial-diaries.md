# Spatial Diaries

Create an **Archaeological Site** project. **Create → Excavation diary** adds **Before excavation** to the Hierarchy Viewer and opens it in the editing dock. Enter the title, date, and notes, then choose a **Walkable site model** from the scene or asset library when it is ready. **Create → Find diary** starts a standalone find. Select diary entries in the hierarchy and use **Edit diary** in the middle of the top bar to show or hide the dock.

Use **Upload walkable GLB** on a timeline point or **Upload find GLB** on a find entry. VRodos saves the scene and diary before opening the asset editor. Timeline point uploads are created as **Walkable Surface** assets. After saving the asset, use **Back to timeline point** or **Back to find diary** to return to the same record and select the new model. If the asset is still being prepared, use **Refresh model list** when it is ready.

## Excavation entries

- Use **+** beside the point tabs in the excavation drawer to add a timeline point. Select or upload a walkable GLB for each point. For a local replacement, keep the surroundings in the ordinary scene and choose the original ground patch or replacement for each entry. **Additional layers** assigns finds, overlays, or collision proxies.
- Scrub the timeline, select an entry in the **Hierarchy Viewer**, or select its tab in the excavation drawer to preview it. Clicking an asset in the Hierarchy Viewer switches to an entry that uses it. A shared asset keeps the current entry if it is used there, and otherwise switches to the first entry that uses it. The timeline remains above the viewport when the drawer opens or closes. **Shared across entries** lists reused placements once and shows which entries use them.
- **Recorded date** supports an exact day, month and year, year only, or no date. Drag the numbered excavation tabs to change timeline order, or use Shift+Left and Shift+Right on the focused tab. Before deleting an entry, move its linked finds to another entry or make them standalone. **Remove from diary** on an asset's hierarchy row returns its placement to the ordinary scene.
- Set the geometry that visitors will stand on to **Walkable Surface** with collision enabled. Decorative finds and annotations can have collision disabled. When collision changes across entries, select **Safe viewpoint** in the Hierarchy Viewer. Use the normal Move gizmo to position the amber marker on ground with clearance in every entry. Use the lock icon on its hierarchy row to keep it in place, then save the scene.
- In desktop playback, use the slider or Previous and Next. In immersive VR, click the left thumbstick to open the diary and point at an entry. If the new geometry would leave the viewer without support or clearance, the client moves to the shared safe viewpoint along the same path used by teleport points, then reveals the new geometry. With reduced motion enabled, the scene swaps as soon as the models are ready.

## Find entries and CSV

Use **Add linked find diary** from the selected timeline point to link the find to that point. Set **Discovery entry** to **Standalone** to make a find available from the start of the experience. Linked finds become available at their discovery entry and remain available afterward. The hierarchy lists linked finds under their excavation entries and standalone finds under **Find diaries**.

Place each find's marker in the scene and assign a **Model version** to the first find entry. Use the find timeline to edit another entry and choose whether to switch models or carry the current model forward. Select **Place annotation pin** to show the model in the viewport, then click the area to annotate. The dock reopens on the same draft. Pins stay tied to that version of the model. In playback, open a find from its marker, the desktop find list, or the VR left-thumbstick panel. Choose a numbered pin to read it.

Use the **Import CSV** and **Export CSV** icons beside **Save diary**. They use the selected **Excavation diary** or **Find diaries** tab. Export includes the current draft's text, dates, sequence numbers, and discovery links. Export an empty tab for a blank template. Leave `discovery_stage_id` blank for a standalone find. For linked finds, import their excavation entries first. Save the spreadsheet as UTF-8 CSV with commas or semicolons. IDs identify records across imports. The optional context ID identifies the archaeological context of an observation. Sequence numbers set CSV playback order and are unique within a timeline. Dates in CSV accept `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Preview and apply the CSV, then check the spatial bindings. Re-import updates CSV fields and preserves model bindings, markers, and pins. Omitted rows stay in the diary.

**Save diary** in the dock and **Save Scene** in the toolbar both save the scene and diary for editing. **Build Project** saves pending diary changes and publishes the diary with the scene. Build with **Single-player static** and **Automatic**. Use approved public content for compiled diaries.

## Synthetic field-to-trench fixture

Run `node scripts/build-spatial-diary-fixture.mjs <output-directory>` to generate four GLBs and two CSV files. Upload each GLB as a separate asset, drag it into the scene, and use unit scale and zero rotation. The positions below compensate for the editor centering newly uploaded GLBs on their bounds.

| Placement | Position in metres | Setup |
|---|---|---|
| `field-before-excavation.glb` | `0 -0.795 0` | Walkable Surface with collision. Choose it as **Site model** in **Field before excavation**. |
| `excavated-site.glb` | `0 -0.795 0` | Walkable Surface with collision. Choose it as **Site model** in **Open trench** and **Find exposed**. |
| `find-ceramic.glb` | `0 -1.314 -1.2` | Decoration with collision disabled. Choose it under **Additional layers** in **Find exposed** and as the model version for **Recovered**. |
| `find-conserved.glb` | `0 0.140 0` | Decoration with collision disabled. Choose it as the model version for **Conserved**. |

Set **Walking Behavior** to **Precise** on both site models and use **Walkable Surface** navigation. Place the safe viewpoint near `-3.5 0 3.6` on stable ground. Place the find marker near the vessel. Place an annotation on the rim and leave **Condition assessed** as a notes-only entry. Place the starting camera around `0 1.8 5`, facing the top of the stairs. Verify that the viewer can descend the stairs, open the find diary, and return to the field from below ground. The demo dates and records are synthetic.

The [Nea Paphos Agora scans](https://zenodo.org/records/10261731) offer a larger, real-world test. The three captures for contexts 760, 763, and 767 share a survey grid and form a documented capture sequence. Keep the same origin for all of them. The [ICS Cypriot vessel](https://sketchfab.com/3d-models/65-i-cypriot-early-bronze-age-vessel-ec0aad0358da4e3bb6a6da19bbceb46d) is available from Sketchfab under CC BY 4.0 with a signed-in account.
