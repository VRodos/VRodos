const { registerBlockType } = wp.blocks;
const { RichText, InspectorControls, useBlockProps } = wp.blockEditor;
const { TextControl, ToggleControl, PanelBody, PanelRow, CheckboxControl, SelectControl, ColorPicker } = wp.components;


registerBlockType('vrodos/vrodos-3d-block', {
    title: 'VRodos 3D view',
    category: 'widgets',
    icon: 'visibility',
    description: 'Learning in progress',
    keywords: ['example', 'test'],
    attributes: {
        myRichHeading: {
            type: 'string',
        },
        // myRichText: {
        //     type: 'string',
        //     source: 'html',
        //     selector: 'p'
        // },
        title: {
            type: 'string',
            default: 'NoGapsTitle'
        },
        titleshow: {
            type: 'boolean',
            default: false
        },
        asset_id: {
            type: 'string',
            default: 'id of the asset'
        },
        camerapositionx: {
            type: 'string',
            default: '0'
        },
        camerapositiony: {
            type: 'string',
            default: '0'
        },
        camerapositionz: {
            type: 'string',
            default: '0'
        },
        canvaswidth: {
            type: 'string',
            default: '600px'
        },
        canvasheight: {
            type: 'string',
            default: '400px'
        },
        canvasbackgroundcolor: {
            type: 'string',
            default: 'transparent'
        },
        enablezoom: {
            type: 'boolean',
            default: true
        },
        enablepan: {
            type: 'boolean',
            default: false
        },
        canvasposition: {
            type: 'string',
            default: 'relative'
        },
        canvastop: {
            type: 'string',
            default: ''
        },
        canvasbottom: {
            type: 'string',
            default: ''
        },
        canvasleft: {
            type: 'string',
            default: ''
        },
        canvasright: {
            type: 'string',
            default: ''
        },
        customcss: {
            type: 'string',
            default: ''
        }
        //
        // favoriteAnimal: {
        //     type: 'string',
        //     default: 'dogs'
        // },
        // favoriteColor: {
        //     type: 'string',
        //     default: '#DDDDDD'
        // },
        // activateLasers: {
        //     type: 'boolean',
        //     default: false
        // }
    },
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const blockProps = useBlockProps();

        return (
            <div { ...useBlockProps() }>
                <InspectorControls key="setting">
                    <div id="gutenpride-controls" >
                    <PanelBody
                        title="VRodos block settings"
                        initialOpen={true}
                        >
                        <PanelRow>
                          <TextControl
                            label="Title (without spaces)"
                            value= { attributes.title }
                            onChange={ ( newval ) => setAttributes( { title: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <ToggleControl
                                label="Show title"
                                checked={attributes.titleshow}
                                onChange={(newval) => setAttributes({ titleshow: newval })}
                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Asset id"
                                value= { attributes.asset_id }
                                onChange={ ( newval ) => setAttributes( { asset_id: newval } ) }
                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Camera Position X"

                                value= { attributes.camerapositionx }
                                onChange={ ( newval ) => setAttributes( { camerapositionx: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Camera Position Y"
                                value= { attributes.camerapositiony }
                                onChange={ ( newval ) => setAttributes( { camerapositiony: newval } ) }
                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Camera Position Z"
                                value= { attributes.camerapositionz }
                                onChange={ ( newval ) => setAttributes( { camerapositionz: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Canvas Width"
                                value= { attributes.canvaswidth }
                                onChange={ ( newval ) => setAttributes( { canvaswidth: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Canvas Height"
                                value= { attributes.canvasheight }
                                onChange={ ( newval ) => setAttributes( { canvasheight: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow >
                            <ColorPicker
                                color={attributes.canvasbackgroundcolor}
                                onChangeComplete={(newval) =>
                                    setAttributes({ canvasbackgroundcolor: newval.hex })}

                            />
                        </PanelRow>
                        <PanelRow>
                            <CheckboxControl
                                label="Enable Zoom?"
                                checked={attributes.enablezoom}
                                onChange={(newval) => setAttributes({ enablezoom: newval })}
                            />
                        </PanelRow>

                        <PanelRow>
                            <CheckboxControl
                                label="Enable Pan?"
                                checked={attributes.enablepan}
                                onChange={(newval) => setAttributes({ enablepan: newval })}
                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Canvas Position"
                                value= { attributes.canvasposition }
                                onChange={ ( newval ) => setAttributes( { canvasposition: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Canvas Top"
                                value= { attributes.canvastop }
                                onChange={ ( newval ) => setAttributes( { canvastop: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Canvas Bottom"
                                value= { attributes.canvasbottom }
                                onChange={ ( newval ) => setAttributes( { canvasbottom: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Canvas Left"
                                value= { attributes.canvasleft }
                                onChange={ ( newval ) => setAttributes( { canvasleft: newval } ) }

                            />
                        </PanelRow>

                        <PanelRow>
                            <TextControl
                                label="Canvas Right"
                                value= { attributes.canvasright }
                                onChange={ ( newval ) => setAttributes( { canvasright: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <TextControl
                                label="Custom css"
                                value= { attributes.customcss }
                                onChange={ ( newval ) => setAttributes( { customcss: newval } ) }

                            />
                        </PanelRow>
                        <PanelRow>
                            <SelectControl
                                label="What's your favorite animal?"
                                value={attributes.favoriteAnimal}
                                options={[
                                    {label: "Dogs", value: 'dogs'},
                                    {label: "Cats", value: 'cats'},
                                    {label: "Something else", value: 'weird_one'},
                                ]}
                                onChange={(newval) => setAttributes({ favoriteAnimal: newval })}

                            />
                        </PanelRow>
                    </PanelBody>
                    </div>
                </InspectorControls >
                <RichText {...blockProps}
                    tagName="h2"
                    placeholder="Description of 3D model"
                    value={attributes.myRichHeading}
                    onChange={(newtext) => setAttributes({ myRichHeading: newtext })}
                />
                {/*<RichText {...blockProps}*/}
                {/*    tagName="p"*/}
                {/*    placeholder="Description to remember what is it"*/}
                {/*    value={attributes.myRichText}*/}
                {/*    onChange={(newtext) => setAttributes({ myRichText: newtext })}*/}
                {/*/>*/}
            </div>
        );
    },
    save: (props) => {
        const { attributes} = props;

        return (''
            // <div>
            //     <RichText.Content
            //         tagName="h2"
            //         value={attributes.myRichHeading}
            //     />
            //     <RichText.Content
            //         tagName="p"
            //         value={attributes.myRichText}
            //     />
            // </div>
        );
    }
});

// import { registerBlockType } from '@wordpress/blocks';
// import { useBlockProps } from '@wordpress/block-editor';
//
// const blockStyle = {
//     backgroundColor: '#900',
//     color: '#fff',
//     padding: '20px',
// };
//
// registerBlockType( 'vrodos/vrodos-3d-block', {
//     apiVersion: 2,
//     title: 'VRodos 3D view',
//     icon: 'visibility',
//     category: 'widgets',
//     example: {},
//     edit() {
//         const blockProps = useBlockProps( { style: blockStyle } );
//
//         return (
//             <div { ...blockProps }>Hello World, step 1 (from the editor).</div>
//         );
//     },
//     save() {
//         const blockProps = useBlockProps.save( { style: blockStyle } );
//
//         return (
//             <div { ...blockProps }>
//                 Hello World, step 1 (from the frontend).
//             </div>
//         );
//     },
// } );



