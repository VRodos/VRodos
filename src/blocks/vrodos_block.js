const { Component } = wp.element;
const { registerBlockType } = wp.blocks;
const { RichText, InspectorControls, useBlockProps, ColorPalette  } = wp.blockEditor;
const { Spinner, TextControl, ToggleControl, PanelBody, PanelRow, CheckboxControl, SelectControl, ColorPicker } = wp.components;


class EditExample extends Component {

    constructor(props) {
        super(props);
        const { attributes, setAttributes, bprops } = props;

        this.attributes = attributes;
        this.setAttributes = setAttributes;
        this.blockProps = bprops;

        this.state = {
            list: [],
            loading: true
        }
    }



    componentDidMount() {
        this.runApiFetch();
    }

    runApiFetch() {
        wp.apiFetch({
            path: 'awhitepixel/v1/mydata',
        }).then(data => {
            this.setState({
                list: data,
                loading: false
            });
        });
    }

    render() {
        return(



            <div>
                {this.state.loading ? (
                    <Spinner />
                ) : (



                    <p>Data is ready!

                        <InspectorControls key="setting">
                            <div  >
                                <PanelBody
                                    title="Select an asset"
                                    initialOpen={true}
                                >


                                    <SelectControl
                                        label="Asset id"

                                        value={this.attributes.asset_id}

                                        options={[
                                            {label: "Select one", value: null, disabled: true},
                                            {label: "A1", value: 'A1id'},
                                            {label: "A2", value: 'A2id'},
                                            {label: "A3", value: 'A3id'},
                                            {label: "A4", value: 'A4id'},
                                        ]}

                                        onChange={(newval) =>  this.setAttributes({ asset_id: newval })}
                                    />



                                </PanelBody>
                            </div>
                        </InspectorControls >


                    </p>



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

export default function Edit( props ) {
    props.bprops  = useBlockProps();
    const { attributes, setAttributes, bprops } = props;

    return (
        <div>
            <EditExample { ...props }/>

            <InspectorControls key="setting2">
                <PanelBody
                    title="Front-end properties"
                    >

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




