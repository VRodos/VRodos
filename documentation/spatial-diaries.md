# Spatial Diaries

Create an **Archaeological Site** project and choose **+ Create → Excavation diary**. Click **Create excavation diary**, then choose a **Base model** from the scene or asset library using the asset thumbnails. Use **Upload GLB** to open the asset editor in a new tab. After creating the asset, return to the scene and click **Refresh model list**. A saved diary opens at the bottom of the viewport when you load the scene. Use **Edit diary** in the middle of the top bar to show or hide the editing dock.

## Excavation entries

- Align the site models and use **Add timeline point** to extend the diary. Choose the **Site model** for the selected point. For a local replacement, keep the surroundings in the ordinary scene and choose the original ground patch or replacement for each point. **Additional layers** assigns finds, overlays, or collision proxies.
- Scrub the timeline over the viewport to preview the selected point. The timeline stays visible when you hide the editing dock. The **Hierarchy Viewer** groups assets by point and highlights the selected point. **Shared across points** lists reused placements once and shows which points use them.
- **Recorded date** supports an exact day, month and year, year only, or no date. Use **Change timeline order** to move a point earlier or later. Delete a point from its own controls. Under **Diary assets**, **Remove from diary** returns a placement to the ordinary scene.
- Set the geometry that visitors will stand on to **Walkable Surface** with collision enabled. Decorative finds and annotations can have collision disabled. When collision changes across entries, place a safe viewpoint on stable walkable ground with clearance in every entry.
- In desktop playback, use the slider or Previous and Next. In immersive VR, click the left thumbstick to open the diary and point at an entry. A moving reveal exposes the new geometry. With reduced motion enabled, the scene swaps as soon as the models are ready. The client can move the viewer to the shared safe viewpoint if their current position loses support or clearance.

## Find entries and CSV

Link each find to its discovery entry and place its marker in the scene. Assign a **Model version** to the first find entry. Use the find timeline to edit another entry and choose whether to switch models or carry the current model forward. Select **Place annotation pin** to show the model in the viewport, then click the area to annotate. The dialog reopens on the same draft. Pins stay tied to that version of the model. In playback, choose a numbered pin to read it.

Open **Import from CSV** to download the templates under **Excavation diary** and **Find diary**. Import excavation points first. Save the spreadsheet as UTF-8 CSV with commas or semicolons. IDs identify records across imports. The optional context ID identifies the archaeological context of an observation. Sequence numbers set CSV playback order and are unique within a timeline. Dates in CSV accept `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Preview and apply the CSV, then check the spatial bindings. Re-import updates CSV fields and preserves model bindings, markers, and pins. Omitted rows stay in the diary.

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
