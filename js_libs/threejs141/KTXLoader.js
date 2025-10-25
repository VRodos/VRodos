( function () {

        /**
 * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
 * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_forma
t_spec/
 *
 * ported from https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/khro
nosTextureContainer.ts
 */

        class KTXLoader extends THREE.CompressedTextureLoader {

                constructor( manager ) {

                        super( manager );

                }

                parse( buffer, loadMipmaps ) {

                        const ktx = new KhronosTextureContainer( buffer, 1 );
                        return {
                                mipmaps: ktx.mipmaps( loadMipmaps ),
                                width: ktx.pixelWidth,
                                height: ktx.pixelHeight,
                                format: ktx.glInternalFormat,
                                isCubemap: ktx.numberOfFaces === 6,
                                mipmapCount: ktx.numberOfMipmapLevels
                        };

                }

        }

        const HEADER_LEN = 12 + 13 * 4; // identifier + header elements (not inc
luding key value meta-data pairs)
        // load types

        const COMPRESSED_2D = 0; // uses a gl.compressedTexImage2D()
        //const COMPRESSED_3D = 1; // uses a gl.compressedTexImage3D()
        //const TEX_2D = 2; // uses a gl.texImage2D()
        //const TEX_3D = 3; // uses a gl.texImage3D()

        class KhronosTextureContainer {

                /**
   * @param {ArrayBuffer} arrayBuffer- contents of the KTX container file
   * @param {number} facesExpected- should be either 1 or 6, based whether a cub
e texture or or
   * @param {boolean} threeDExpected- provision for indicating that data should
be a 3D texture, not implemented
   * @param {boolean} textureArrayExpected- provision for indicating that data s
hould be a texture array, not implemented
   */
                constructor( arrayBuffer, facesExpected
                        /*, threeDExpected, textureArrayExpected */
                ) {

                        this.arrayBuffer = arrayBuffer; // Test that it is a ktx
 formatted file, based on the first 12 bytes, character representation is:
                        // '´', 'K', 'T', 'X', ' ', '1', '1', 'ª', '\r', '\n', '
\x1A', '\n'
                        // 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D,
 0x0A, 0x1A, 0x0A

                        const identifier = new Uint8Array( this.arrayBuffer, 0,
12 );

                        if ( identifier[ 0 ] !== 0xAB || identifier[ 1 ] !== 0x4
B || identifier[ 2 ] !== 0x54 || identifier[ 3 ] !== 0x58 || identifier[ 4 ] !==
 0x20 || identifier[ 5 ] !== 0x31 || identifier[ 6 ] !== 0x31 || identifier[ 7 ]
 !== 0xBB || identifier[ 8 ] !== 0x0D || identifier[ 9 ] !== 0x0A || identifier[
 10 ] !== 0x1A || identifier[ 11 ] !== 0x0A ) {

                                console.error( 'texture missing KTX identifier'
);
                                return;

                        } // load the reset of the header in native 32 bit uint


                        const dataSize = Uint32Array.BYTES_PER_ELEMENT;
                        const headerDataView = new DataView( this.arrayBuffer, 1
2, 13 * dataSize );
                        const endianness = headerDataView.getUint32( 0, true );
                        const littleEndian = endianness === 0x04030201;
                        this.glType = headerDataView.getUint32( 1 * dataSize, li
ttleEndian ); // must be 0 for compressed textures

                        this.glTypeSize = headerDataView.getUint32( 2 * dataSize
, littleEndian ); // must be 1 for compressed textures

                        this.glFormat = headerDataView.getUint32( 3 * dataSize,
littleEndian ); // must be 0 for compressed textures

                        this.glInternalFormat = headerDataView.getUint32( 4 * da
taSize, littleEndian ); // the value of arg passed to gl.compressedTexImage2D(,,
x,,,,)

                        this.glBaseInternalFormat = headerDataView.getUint32( 5
* dataSize, littleEndian ); // specify GL_RGB, GL_RGBA, GL_ALPHA, etc (un-compre
ssed only)

                        this.pixelWidth = headerDataView.getUint32( 6 * dataSize
, littleEndian ); // level 0 value of arg passed to gl.compressedTexImage2D(,,,x
,,,)

                        this.pixelHeight = headerDataView.getUint32( 7 * dataSiz
e, littleEndian ); // level 0 value of arg passed to gl.compressedTexImage2D(,,,
,x,,)

                        this.pixelDepth = headerDataView.getUint32( 8 * dataSize
, littleEndian ); // level 0 value of arg passed to gl.compressedTexImage3D(,,,,
,x,,)

                        this.numberOfArrayElements = headerDataView.getUint32( 9
 * dataSize, littleEndian ); // used for texture arrays

                        this.numberOfFaces = headerDataView.getUint32( 10 * data
Size, littleEndian ); // used for cubemap textures, should either be 1 or 6

                        this.numberOfMipmapLevels = headerDataView.getUint32( 11
 * dataSize, littleEndian ); // number of levels; disregard possibility of 0 for
 compressed textures

                        this.bytesOfKeyValueData = headerDataView.getUint32( 12
* dataSize, littleEndian ); // the amount of space after the header for meta-dat
a
                        // Make sure we have a compressed type.  Not only reduce
s work, but probably better to let dev know they are not compressing.

                        if ( this.glType !== 0 ) {

                                console.warn( 'only compressed formats currently
 supported' );
                                return;

                        } else {

                                // value of zero is an indication to generate mi
pmaps @ runtime.  Not usually allowed for compressed, so disregard.
                                this.numberOfMipmapLevels = Math.max( 1, this.nu
mberOfMipmapLevels );

                        }

                        if ( this.pixelHeight === 0 || this.pixelDepth !== 0 ) {

                                console.warn( 'only 2D textures currently suppor
ted' );
                                return;

                        }

                        if ( this.numberOfArrayElements !== 0 ) {

                                console.warn( 'texture arrays not currently supp
orted' );
                                return;

                        }

                        if ( this.numberOfFaces !== facesExpected ) {

                                console.warn( 'number of faces expected' + faces
Expected + ', but found ' + this.numberOfFaces );
                                return;

                        } // we now have a completely validated file, so could u
se existence of loadType as success
                        // would need to make this more elaborate & adjust check
s above to support more than one load type


                        this.loadType = COMPRESSED_2D;

                }

                mipmaps( loadMipmaps ) {

                        const mipmaps = []; // initialize width & height for lev
el 1

                        let dataOffset = HEADER_LEN + this.bytesOfKeyValueData;
                        let width = this.pixelWidth;
                        let height = this.pixelHeight;
                        const mipmapCount = loadMipmaps ? this.numberOfMipmapLev
els : 1;

                        for ( let level = 0; level < mipmapCount; level ++ ) {

                                const imageSize = new Int32Array( this.arrayBuff
er, dataOffset, 1 )[ 0 ]; // size per face, since not supporting array cubemaps

                                dataOffset += 4; // size of the image + 4 for th
e imageSize field

                                for ( let face = 0; face < this.numberOfFaces; f
ace ++ ) {

                                        const byteArray = new Uint8Array( this.a
rrayBuffer, dataOffset, imageSize );
                                        mipmaps.push( {
                                                'data': byteArray,
                                                'width': width,
                                                'height': height
                                        } );
                                        dataOffset += imageSize;
                                        dataOffset += 3 - ( imageSize + 3 ) % 4;
 // add padding for odd sized image

                                }

                                width = Math.max( 1.0, width * 0.5 );
                                height = Math.max( 1.0, height * 0.5 );

                        }

                        return mipmaps;

                }

        }

        THREE.KTXLoader = KTXLoader;

} )();
