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
        favoriteAnimal: {
            type: 'string',
            default: 'dogs'
        },
        favoriteColor: {
            type: 'string',
            default: '#DDDDDD'
        },
        activateLasers: {
            type: 'boolean',
            default: false
        }
    },
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const blockProps = useBlockProps();

        return (
            <div>
                <InspectorControls>
                    <PanelBody
                        title="Most awesome settings ever"
                        initialOpen={true}>

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
                        <PanelRow>
                            <ColorPicker
                                color={attributes.favoriteColor}
                                onChangeComplete={(newval) => setAttributes({ favoriteColor: newval.hex })}
                                disableAlpha
                            />
                        </PanelRow>
                        <PanelRow>
                            <CheckboxControl
                                label="Activate lasers?"
                                checked={attributes.activateLasers}
                                onChange={(newval) => setAttributes({ activateLasers: newval })}
                            />
                        </PanelRow>
                    </PanelBody>
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



