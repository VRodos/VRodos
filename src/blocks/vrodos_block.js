const { Component } = wp.element;
const { registerBlockType } = wp.blocks;
const { RichText, InspectorControls, useBlockProps, ColorPalette  } = wp.blockEditor;
const { Spinner, TextControl, ToggleControl, PanelBody, PanelRow, CheckboxControl, SelectControl, ColorPicker } = wp.components;
const { withSelect } = wp.data;
const { createElement: el } = wp.element;


registerBlockType('vrodos/vrodos-3d-block', {
    title: 'VRodos 3D view',
    category: 'widgets',
    icon: 'visibility',
    description: 'Visualize a 3D model',
    keywords: ['3D', 'visualize'],
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
            default: 'Select one'
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

    },
    edit: ( {attributes, setAttributes} ) => {
        let props  = useBlockProps();

        console.log("Edit");

        let assetOptions = [{label: 0, value: 0}];
        let assettrsmany = [];

        let assettrsOptions = [{id: 0, assettrs: '1,2,3'}];

        let zedata = wp.data.select('core').getEntityRecords('postType', 'vrodos_asset3d');

        if (zedata) {
            assetOptions = zedata.map(  v => ({label: v.title.raw, value: v.id})   );
            assettrsOptions = zedata.map( v => ({id: v.id, assettrs: v.meta.vrodos_asset3d_assettrs}) );
        }



        return (
            <div>

                <RichText {...props}
                      tagName="h2"
                      placeholder="Description of 3D model"
                      value={attributes.myRichHeading}
                      onChange={(newtext) => setAttributes({ myRichHeading: newtext })}
                />

                <InspectorControls key="setting2">
                    <PanelBody
                        title="Select an asset"
                        initialOpen={true}>
                        <SelectControl
                            label="Asset id"
                            value={attributes.asset_id}
                            options={assetOptions}
                            //options = { [ {label: "Mine", value: 5}, {label: "Yours", value: 6} ] }
                            onChange={(newval) => {setAttributes( { asset_id: newval });

                                // Get the assettrs for label == newval which asset id
                                let assettrs = assettrsOptions.filter(
                                    function(o){return o.id == newval;}
                                )[0].assettrs;

                                let split_trs = assettrs.split(",");

                                setAttributes( { camerapositionx: split_trs[6]} );
                                setAttributes( { camerapositiony: split_trs[7]} );
                                setAttributes( { camerapositionz: split_trs[8]} );
                            }
                            }
                        />
                        <TextControl
                            label="Camera Position X"
                            value= { attributes.camerapositionx }
                            onChange={ ( newval ) => setAttributes( { camerapositionx: newval } ) }
                        />
                        <TextControl
                            label="Camera Position Y"
                            value= { attributes.camerapositiony }
                            onChange={ ( newval ) => setAttributes( { camerapositiony: newval } ) }
                        />
                        <TextControl
                            label="Camera Position Z"
                            value= { attributes.camerapositionz }
                            onChange={ ( newval ) => setAttributes( { camerapositionz: newval } ) }
                        />
                        <TextControl
                            label="Title (without spaces)"
                            value= { attributes.title }
                            onChange={ ( newval ) =>  setAttributes( { title: newval } ) }
                        />
                        <ToggleControl
                            label="Show title"
                            checked={ attributes.titleshow}
                            onChange={(newval) =>  setAttributes({ titleshow: newval })}
                        />
                        <TextControl
                            label="Canvas Width"
                            value= { attributes.canvaswidth }
                            onChange={ ( newval ) =>  setAttributes( { canvaswidth: newval } ) }
                        />
                        <TextControl
                            label="Canvas Height"
                            value= { attributes.canvasheight }
                            onChange={ ( newval ) =>  setAttributes( { canvasheight: newval } ) }
                        />
                        <div>
                            Canvas background color
                            <div style={{marginTop:"5px"}}>
                                <ColorPicker
                                    color = { attributes.canvasbackgroundcolor}
                                    onChangeComplete={(newval) =>  setAttributes({ canvasbackgroundcolor: newval.hex })}
                                />
                            </div>
                        </div>
                        <CheckboxControl
                            label="Enable Zoom?"
                            checked={ attributes.enablezoom}
                            onChange={(newval) => setAttributes({ enablezoom: newval })}
                        />
                        <CheckboxControl
                            label="Enable Pan?"
                            checked={attributes.enablepan}
                            onChange={(newval) => setAttributes({ enablepan: newval })}
                        />
                        <TextControl
                            label="Canvas Position"
                            value= { attributes.canvasposition }
                            onChange={ ( newval ) =>  setAttributes( { canvasposition: newval } ) }
                        />
                        <TextControl
                            label="Canvas Top"
                            value= { attributes.canvastop }
                            onChange={ ( newval ) =>  setAttributes( { canvastop: newval } ) }
                        />
                        <TextControl
                            label="Canvas Bottom"
                            value= { attributes.canvasbottom }
                            onChange={ ( newval ) =>  setAttributes( { canvasbottom: newval } ) }
                        />
                        <TextControl
                            label="Canvas Left"
                            value= { attributes.canvasleft }
                            onChange={ ( newval ) =>  setAttributes( { canvasleft: newval } ) }
                        />
                        <TextControl
                            label="Canvas Right"
                            value= { attributes.canvasright }
                            onChange={ ( newval ) =>  setAttributes( { canvasright: newval } ) }
                        />
                        <TextControl
                            label="Custom css"
                            value= { attributes.customcss }
                            onChange={ ( newval ) =>  setAttributes( { customcss: newval } ) }
                        />
                    </PanelBody>
                </InspectorControls>
            </div>
        );
     },
    save: (props) => {
        const { attributes} = props;

        console.log("Save");

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



// class EditExample extends Component {
//
//     constructor(props) {
//         super(props);
//         console.log("constructor");
//         const { attributes, setAttributes, bprops } = props;
//         this.attributes = attributes;
//         this.setAttributes = setAttributes;
//         this.blockProps = bprops;
//         // this.state = {
//         //     list: [],
//         //     loading: true,
//         //     valuesassets: []
//         // }
//
//
//     }
//
//     componentDidMount() {
//
//
//             //.map(([v])=>({label: v.id, value: v.id})));
//         console.log("componentDidMount");
//        // this.runApiFetch();
//     }
//
//     runApiFetch() {
//         // console.log("runApiFetch");
//         //
//         //
//         // wp.apiFetch({
//         //     method: 'GET',
//         //     path: 'vrodosReactRest/v1/project/slug=archaeology-joker',
//         // }).then(data => {
//         //
//         //     console.log("runApiFetch completed");
//         //
//         //     const datajson = JSON.parse(data);
//         //
//         //     let selectEntries = Object.entries(datajson).map( ([k, v]) => ({label: k, value: v[0]}) );
//         //     let assettrsmany = Object.entries(datajson).map( ([k, v]) => ({label: v[0], value: v[1]}) );
//         //
//         //     this.setState({
//         //         list: data,
//         //         loading: false,
//         //         valuesassets: selectEntries,
//         //         assettrsmany: assettrsmany,
//         //     });
//         //
//         //
//         // });
//     }
//
//
//
//     render() {
//
//         console.log("render");
//
//
//
//         return(
//             <div>
//                 {/*{this.state.loading ? (*/}
//                 {/*    <Spinner />*/}
//                 {/*) : (*/}
//                 {/*    <p>Data is ready!</p>*/}
//                 {/*)}*/}
//             </div>
//         );
//     }
// }
