import {
  CLOUD_SHAPE_TEXTURE_SIZE,
  CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
  CloudLayer,
  CloudLayers,
  CloudsEffect
} from '@takram/three-clouds';
import {
  ByteType,
  FileLoader,
  FloatType,
  HalfFloatType,
  IntType,
  LinearFilter,
  Loader,
  RGBAFormat,
  ShortType,
  UnsignedByteType,
  UnsignedIntType,
  UnsignedShortType
} from 'three';

function parseUint8Array(buffer) {
  return new Uint8Array(buffer);
}

function getTextureDataType(array) {
  if (array instanceof Int8Array) return ByteType;
  if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return UnsignedByteType;
  if (array instanceof Int16Array) return ShortType;
  if (array instanceof Uint16Array) return UnsignedShortType;
  if (array instanceof Int32Array) return IntType;
  if (array instanceof Uint32Array) return UnsignedIntType;
  if (array instanceof Float32Array || array instanceof Float64Array) return FloatType;
  if (typeof Float16Array !== 'undefined' && array instanceof Float16Array) return HalfFloatType;
  return UnsignedByteType;
}

class DataTextureLoader extends Loader {
  constructor(textureClass, parser, options = {}, manager) {
    super(manager);
    this.textureClass = textureClass;
    this.parser = parser;
    this.options = {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      ...options
    };
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new this.textureClass();
    const loader = new FileLoader(this.manager);
    loader.setRequestHeader(this.requestHeader);
    loader.setPath(this.path);
    loader.setWithCredentials(this.withCredentials);
    loader.setResponseType('arraybuffer');
    loader.load(url, (buffer) => {
      const array = this.parser(buffer);
      texture.image.data = array;
      const { width, height, depth, ...options } = this.options;
      if (width != null) texture.image.width = width;
      if (height != null) texture.image.height = height;
      if (texture.image && 'depth' in texture.image && depth != null) {
        texture.image.depth = depth;
      }
      texture.type = getTextureDataType(array);
      Object.assign(texture, options);
      texture.needsUpdate = true;
      if (typeof onLoad === 'function') onLoad(texture);
    }, onProgress, onError);
    return texture;
  }
}

window.VRODOS_TAKRAM_CLOUDS = {
  CloudsEffect,
  CloudLayer,
  CloudLayers,
  CLOUD_SHAPE_TEXTURE_SIZE,
  CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
  DataTextureLoader,
  parseUint8Array,
  STBN_TEXTURE_WIDTH: 128,
  STBN_TEXTURE_HEIGHT: 128,
  STBN_TEXTURE_DEPTH: 64
};
