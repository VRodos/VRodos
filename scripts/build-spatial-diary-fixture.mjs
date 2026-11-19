import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { BoxGeometry, LatheGeometry, Vector2 } from 'three';

const destination = process.argv[2];
if (!destination) throw new Error('Usage: node scripts/build-spatial-diary-fixture.mjs <output directory>');
const directory = resolve(destination);
await mkdir(directory, { recursive: true });
const io = new NodeIO();

async function model(name, build) {
    const document = new Document();
    const scene = document.createScene(name);
    const buffer = document.createBuffer();
    const materials = new Map();
    const add = (name, geometry, position, color) => {
        let material = materials.get(color);
        if (!material) {
            const rgb = color.match(/../g).map((value) => parseInt(value, 16) / 255);
            material = document.createMaterial(color).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(0.9);
            materials.set(color, material);
        }
        const positions = document.createAccessor().setType('VEC3').setArray(geometry.attributes.position.array).setBuffer(buffer);
        const normals = document.createAccessor().setType('VEC3').setArray(geometry.attributes.normal.array).setBuffer(buffer);
        const indices = document.createAccessor().setType('SCALAR').setArray(geometry.index.array).setBuffer(buffer);
        const primitive = document.createPrimitive().setAttribute('POSITION', positions).setAttribute('NORMAL', normals).setIndices(indices).setMaterial(material);
        scene.addChild(document.createNode(name).setTranslation(position).setMesh(document.createMesh(name).addPrimitive(primitive)));
        geometry.dispose();
    };
    build(add, (name, size, position, color) => add(name, new BoxGeometry(...size), position, color));
    await io.write(resolve(directory, `${name}.glb`), document);
}

const fieldDepth = 1.59;
const fieldCenterY = -fieldDepth / 2;
function fieldBanks(box) {
    box('West bank', [4, fieldDepth, 12], [-4, fieldCenterY, 0], '53694a');
    box('East bank', [4, fieldDepth, 12], [4, fieldCenterY, 0], '53694a');
    box('North bank', [4, fieldDepth, 4], [0, fieldCenterY, -4], '69744b');
    box('South bank', [4, fieldDepth, 4], [0, fieldCenterY, 4], '69744b');
}

await model('field-before-excavation', (_add, box) => {
    fieldBanks(box);
    box('Unexcavated ground', [4, fieldDepth, 4], [0, fieldCenterY, 0], '65744c');
});
await model('excavated-site', (_add, box) => {
    fieldBanks(box);
    box('Excavated floor', [4, 0.15, 4], [0, -1.515, 0], '997257');
    for (let index = 0; index < 7; index++) {
        const y = -0.18 * (index + 1);
        const height = y + 1.44;
        box(`Step ${index + 1}`, [1.45, height, 0.29], [0, y - height / 2, 1.855 - 0.29 * index], index % 2 ? 'ad896e' : 'ba9a7f');
    }
    for (let index = 0; index < 3; index++) {
        const y = -0.24 - index * 0.48;
        box(`West sediment ${index + 1}`, [0.045, 0.48, 4], [-1.977, y, 0], ['b18262', '997257', '78533e'][index]);
        box(`East sediment ${index + 1}`, [0.045, 0.48, 4], [1.977, y, 0], ['b18262', '997257', '78533e'][index]);
    }
});

const pot = [[0, 0], [.09, 0], [.13, .03], [.145, .13], [.11, .205], [.075, .23], [.076, .255], [.091, .26], [.09, .28], [.071, .28], [.066, .24], [.11, .155], [.114, .075], [.06, .024], [0, .024]];
for (const [name, color, height] of [['find-ceramic', 'ad6044', 0.90], ['find-conserved', 'd5976c', 1]]) {
    await model(name, (add) => add('Synthetic ceramic vessel', new LatheGeometry(pot.map(([x, y]) => new Vector2(x, y * height)), 24), [0, 0, 0], color));
}

await writeFile(resolve(directory, 'excavation-stages.csv'), [
    'stage_id,sequence,recorded_on,title,context_id,notes,source_ref',
    'field,1,2025-05-01,Field before excavation,DEMO-000,Survey before the trench was opened,Synthetic test data',
    'trench,2,2025-05-03,Open trench,DEMO-001,The stairs lead down to the excavation floor,Synthetic test data',
    'exposed,3,2025-05-05,Find exposed,DEMO-002,A ceramic vessel was recorded on the trench floor,Synthetic test data',
    ''
].join('\r\n'));

await writeFile(resolve(directory, 'find-entries.csv'), [
    'find_id,find_label,discovery_stage_id,entry_id,sequence,recorded_on,title,notes,source_ref',
    'vessel,Ceramic vessel,exposed,recovered,1,2025-05-05,Recovered,Vessel recorded in place before cleaning,Synthetic test data',
    'vessel,Ceramic vessel,exposed,assessment,2,2025-05-06,Condition assessed,The rim was inspected,Synthetic test data',
    'vessel,Ceramic vessel,exposed,conserved,3,2025-05-10,Conserved,Reconstructed rim and cleaned surface for the demo,Synthetic test data',
    ''
].join('\r\n'));
