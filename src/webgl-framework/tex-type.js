import * as twgl from "twgl.js";
import {STORAGE_TYPES} from "./defines";

/**
 * @typedef TexInstance
 * @type {{tex: WebGLTexture, tp: TexType}}
 */

/**
 * The textype class encapsulates a webgl texture in a way so that it can be reused and managed as a resource.
 *
 * The principal is supposed to roughly mimic variable use - a TexType is defined with a particular type (float, int),
 * channel format (r, rg, rgb or rgba) and dimensions.
 *
 * The combination of type and channel format is called the storage type, and are generally picked from the pre-defined
 * valid sets imported from STORAGE_TYPES (more documentation on that in the defines.js file).
 *
 * An instance of this class will keep a pool of textures of the given type and can alloc and dealloc them as needed.
 * This is to avoid a continuous stream of creation and GC of textures which would be inefficient, instead allocating
 * them to TexVar instances are needed.
 */
export default class TexType{
  /**
   * Instantiates an instance of a TexType.
   * A number of parameter combinations are possible:
   * new TexType({process, width, height}) - creates a default RGBA8 texture of size height x width.
   * new TextType({process, width, height, storage}) - as above but with a specified storage type.
   * new TexType({process, refType, ...}) - the type will be based on the refType given, with any additional properties acting as modifiers
   * new TexType({..., poolSize}) - creates a pool of textures of the given size.
   * @param process {WGLProcess} The WGLProcess instance on which the texture is created.
   * @param [width] {number} The texture width in pixels
   * @param [height] {number} The texture height in pixels
   * @param [storage] {Storage} The storage type.  See STORAGE_TYPES in defines.js. Default is RGBA8
   * @param [poolSize] {number} The count of texture instances to be available in the pool, default is 1.
   * @param [refType] {TexType} An existing TexType from which the definition of this type will be derived.
   * @param [xScale] {number} Scale the width by the given factor, rounding down the result
   * @param [yScale] {number} Scale the height by the given factor, rounding down the result
   */
  constructor({width, height, storage, process, poolSize = 0, refType, xScale, yScale}) {
    let format, internalFormat, type, validOutput, samplerPrefix;
    if (storage || !refType) {
      [format, internalFormat, type, validOutput, samplerPrefix=""] = (storage || STORAGE_TYPES.RGBA8).map(k=>process.gl[k]||k);
    } else {
      ({format, internalFormat, type} = refType._options);
      ({validOutput, samplerPrefix} = refType);
    }
    if (!width && refType) width = refType._options.width;
    if (!height && refType) height = refType._options.height;
    const o = this._options = {
      width,
      height,
      format,
      internalFormat,
      type,
    }
    this.samplerPrefix = samplerPrefix;
    this.validOutput = validOutput;
    if (xScale) o.width = Math.floor(o.width * xScale);
    if (yScale) o.height = Math.floor(o.height * xScale);
    this._pool = [];
    this._process = process;
    for (let n=0; n<poolSize; n++){
      this._pool.push(this.newTex());
    }
  }

  /**
   * Returns a read-only copy of the options object.
   * @return {{width:number, height:number, format:number, internalFormat:number, type:number}}
   */
  get texOptions(){
    return {...this._options};
  }

  /**
   * Allocates a texture from the pool, or creates one if the pool is empty.
   * @return {TexInstance}
   */
  alloc(){
    if (this._pool.length){
      return this._pool.pop();
    } else {
      let {width, height, internalFormat} = this._options;
      internalFormat = Object.entries(WebGL2RenderingContext).filter(e=>e[1]===internalFormat).map(e=>e[0]).join(',');
      console.warn(`ad-hoc texture created, ${width}x${height}x${internalFormat}`);
      return this.newTex();
    }
  }

  /**
   * returns a texture to the pool
   * @param instance {TexInstance}
   */
  dealloc(instance){
    this._pool.push(instance);
  }

  /**
   * Clears the pool and deletes all the textures.
   */
  clearPool(){
    const {gl} = this._process;
    for (let i of this._pool){
      gl.deleteTexture(i.tex);
    }
  }

  /**
   * Increase the size of the pool
   * @param [N] How many texture instances to add (default 1)
   */
  growPool(N=1){
    for(let n=0;n<N;++n) this._pool.push(this.newTex());
  }

  /**
   * Return the current size of the pool
   * @return {number}
   */
  get poolSize(){
    return this._pool.length;
  }

  /**
   * Indicate if THIS TexType is a match to the supplied definition.
   * @param width {number}
   * @param height {number}
   * @param storage {Storage}
   * @param [poolSize] {number} The minimum poolSize require - the pool will be grown to meet this requirement if it is a match otherwise.
   * @return {boolean}
   */
  isMatch({width, height, storage = STORAGE_TYPES.RGBA8, poolSize}){
    const [format, internalFormat, type] = storage.map(k=>this._process.gl[k]);
    const o = this._options;
    const match =  o.width === width && o.height === height && o.format === format && o.internalFormat === internalFormat && o.type === type;
    if (match && poolSize){
      if (this.poolSize < poolSize) this.growPool(poolSize - this.poolSize);
    }
    return match;
  }

  /**
   * Create a new texture instance of this TexType
   * @return {TexInstance}
   */
  newTex(){
    return {
      tex: twgl.createTexture(this._process.gl, this._options),
      tp:this
    };
  }
}
