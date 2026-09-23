import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let definition;
const context = vm.createContext({
    AFRAME: { registerComponent: (_name, component) => { definition = component; } },
    document: { baseURI: 'https://example.test/scene/' },
    window: {},
    URL,
    console
});
vm.runInContext(readFileSync(new URL('../assets/js/runtime/components/poi-image_component.js', import.meta.url), 'utf8'), context);

function fixture({ title = '', description = '', image = '', vr = false }) {
    const attributes = {
        'data-vrodos-poi-title': title,
        'data-vrodos-poi-description': description,
        'data-vrodos-poi-image-src': image
    };
    const button = {
        getAttribute: (name) => attributes[name] || '',
        addEventListener() {}, removeEventListener() {}
    };
    const scene = { addEventListener() {}, removeEventListener() {} };
    const makeElement = () => ({ style: {}, textContent: '', src: '', removeAttribute(name) { delete this[name]; } });
    const elements = {
        'poi-img-dialog-title': makeElement(),
        'poi-img-dialog-description': makeElement(),
        'poi-img-dialog-image': makeElement(),
        'poi-img-dialog-image-area': makeElement(),
        'poi-img-dialog-content-area': makeElement(),
        'poi-img-dialog-box': makeElement()
    };
    const dialog = { showModal() { opened.desktop++; } };
    const opened = { desktop: 0, vr: 0, frame: null, config: null, images: 0, texts: 0 };
    const api = {
        frame(options) { opened.frame = options; return { content: {} }; },
        image() { opened.images++; },
        text() { opened.texts++; },
        row() { return {}; },
        button() {}
    };
    context.document.querySelector = (selector) => ({
        '#button_poi_sample': button,
        '#aframe-scene-container': scene,
        '#poi-img-dialog': dialog
    })[selector] || null;
    context.document.getElementById = (id) => elements[id] || null;
    context.window.VRODOSRuntimeOverlay = { shouldUseVrPanel: () => vr };
    context.window.VRODOSSpatialUI = {
        isAvailable: () => true,
        openPanel(config) { opened.vr++; opened.config = config; config.render(api); return api; },
        closePanel() {}
    };
    const component = Object.create(definition);
    component.el = button;
    component.data = 'sample';
    component.init();
    component.onMenuButtonClick({ detail: {} });
    return { opened, elements, component };
}

for (const vr of [false, true]) {
    for (const variant of [
        { title: 'Title', description: '', image: '' },
        { title: '', description: 'Description', image: '' },
        { title: '', description: '', image: '/photo.jpg' },
        { title: 'Title', description: 'Description', image: '' },
        { title: 'Title', description: '', image: '/photo.jpg' },
        { title: 'Title', description: 'Description', image: '/photo.jpg' },
        { title: 'Title', description: '', image: 'https://example.test/photo.jpg' },
        { title: 'Title', description: '', image: 'javascript:alert(1)' },
        { title: ' ', description: '', image: 'https://' },
        { title: '  ', description: '\n ', image: 'false' }
    ]) {
        const { opened, elements, component } = fixture({ ...variant, vr });
        const hasTitle = Boolean(variant.title.trim());
        const hasDescription = Boolean(variant.description.trim());
        const hasImage = variant.image.startsWith('/') || variant.image.startsWith('https://example.test/');
        const hasContent = hasTitle || hasDescription || hasImage;
        assert.equal(opened[vr ? 'vr' : 'desktop'], Number(hasContent));
        if (!hasContent) continue;
        if (vr) {
            assert.equal(opened.frame.showHeader, hasTitle);
            assert.equal(opened.frame.showContent, hasDescription || hasImage);
            assert.equal(opened.frame.showFooter, hasDescription || hasImage);
            assert.equal(opened.images, Number(hasImage));
            assert.equal(opened.texts, Number(hasDescription));
            if (hasTitle && !hasDescription && !hasImage) {
                assert.equal(opened.config.height, 0.2, 'title-only VR panel is compact');
            }
        } else {
            assert.equal(elements['poi-img-dialog-image-area'].style.display === 'none', !hasImage);
            assert.equal(elements['poi-img-dialog-content-area'].style.display === 'none', !hasTitle && !hasDescription);
            assert.equal(elements['poi-img-dialog-description'].style.display === 'none', !hasDescription);
            assert.equal(elements['poi-img-dialog-title'].style.display === 'none', !hasTitle);
        }
        component.remove();
    }
}

console.log('POI content-specific desktop and VR dialog checks passed.');
