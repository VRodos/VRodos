const { Component } = wp.element;
const { registerBlockType } = wp.blocks;
const { RichText, InspectorControls, useBlockProps, ColorPalette  } = wp.blockEditor;
const { Spinner, TextControl, ToggleControl, PanelBody, PanelRow, CheckboxControl, SelectControl, ColorPicker } = wp.components;


class EditExample extends Component {

    constructor(props) {
        super(props);
        const { attributes, setAttributes, bprops, state } = props;
        this.attributes = attributes;
        this.setAttributes = setAttributes;
        this.blockProps = bprops;
        this.state = {
            list: [],
            loading: true,
            valuesassets: []
        }
    }

    componentDidMount() {
        this.runApiFetch();
    }

    runApiFetch() {
        wp.apiFetch({
            method: 'GET',
            path: 'vrodosReactRest/v1/project/slug=archaeology-joker',
        }).then(data => {
            const datajson = JSON.parse(data);

            let selectEntries = Object.entries(datajson).map( ([k, v]) => ({label: k, value: v[0]}) );
            let assettrsmany = Object.entries(datajson).map( ([k, v]) => ({label: v[0], value: v[1]}) );

            this.setState({
                list: data,
                loading: false,
                valuesassets: selectEntries,
                //assettrsmany: assettrsmany,
            });
        });
    }

    render() {

        return(
            <div>
                {this.state.loading ? (
                    <Spinner />
                ) : (
                    <p>Data is ready!</p>
                )}
                <RichText {...this.blockProps}
                    tagName="h2"
                    placeholder="Description of 3D model"
                    value={this.attributes.myRichHeading}
                    onChange={(newtext) => this.setAttributes({ myRichHeading: newtext })}
                />
            </div>
        );
    }
}

// // Get the assettrs for label == newval which asset id
// let assettrs = this.state.assettrsmany.filter(
//                 function(o){return o.label == newval;}
//                 )[0].value;
//
// let split_trs = assettrs.split(",");
//
// console.log(split_trs);
//
// // this.setAttributes( { camerapositionx: split_trs[6]} );
// // this.setAttributes( { camerapositiony: split_trs[7]} );
// // this.setAttributes( { camerapositionz: split_trs[8]} );

export default function Edit( props ) {
    props.bprops  = useBlockProps();
    const { attributes, setAttributes, bprops } = props;

    return (
        <div>
            <EditExample { ...props }/>

            <InspectorControls key="setting2">
                <PanelBody
                    title="Select an asset"
                    initialOpen={true}
                    >


                    <SelectControl
                        label="Asset id"
                        value={attributes.asset_id}
                        // options={state.valuesassets}
                        options = { [ {label: "Mine", value: 5}, {label: "Yours", value: 6} ] }
                        onChange={(newval) => setAttributes( { asset_id: newval })}
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
}


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
    edit: Edit,
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
