import {typeName} from "./defines";
import * as twgl from "twgl.js";

/**
 * @typedef TexInstance
 * @type {{tex: WebGLTexture, tp: TexType}}
 */

/**
 * The TexVar type is a texture variable of a particular TexType.  It can have zero or one TexInstances assigned to it.
 *
 * The TexVar has a name and can be used in a WGLProcess operation as an input or output texture, it can read its contents
 * from an HTML element or a typed array and it can write its contents to a typed array.
 */
export default class TexVar{
  /**
   *
   * @param name {string}
   * @param tp {TexType}
   * @param process {WGLProcess}
   */
  constructor({name, tp, process}) {
    this.name = name;
    this.tp = tp;
    this.instance = null;
    this.process = process;
  }

  /**
   * Assign a texture to this TexVar from the TexType pool
   */
  assign(){
    if (!this.instance){
      this.instance = this.tp.alloc();
    }
  }

  /**
   * Output a summary of this texture, generally used by console.log and similar.
   * @return {string}
   */
  toString(){
    const o=this.tp.texOptions;
    return `TexVar[${this.name}, ${o.width}x${o.height}, ${typeName(o.format)}, ${this.instance?'assigned':'unassigned'}]`;
  }

  /**
   * release the texture back to the pool
   */
  release(){
    if (this.instance){
      this.tp.dealloc(this.instance);
      this.instance = null;
    }
  }

  /**
   * Move the texture instance to another TexVar.
   * @param _var
   */
  mv(_var){
    if (this === _var) return;
    if (this.tp !== _var.tp) throw new Error('TexVar.mv: Types do not match.')
    _var.release();
    _var.instance = this.instance;
    this.instance = null;
  }

  /**
   * Assign (if required) and read the contents of the texture from an array or an HTML element.
   * Note that there has been some odd behaviour on some systems when reading from a video element, so copying to a
   * canvas element first is recommended.  The array must match the type of the texture, e.g. UInt8Array for RGBA8 or
   * Float32Array for RG32F.
   * @param arrayOrElement {TypedArray | HTMLVideoElement | HTMLCanvasElement}
   */
  read(arrayOrElement){
    this.assign();
    if (arrayOrElement instanceof HTMLElement){
      twgl.setTextureFromElement(this.process.gl, this.instance.tex, arrayOrElement, this.tp.texOptions);
    } else {
      twgl.setTextureFromArray(this.process.gl, this.instance.tex, arrayOrElement, this.tp.texOptions);
    }
  }

  /**
   * write the contexts of the texture to a suitable typed array.  As for the read operation the array type must be
   * compatible with the texture type.
   * @param array
   */
  write(array){
    const {gl} = this.process;
    const {width, height, format, type} = this.tp.texOptions;
    const fbi = twgl.createFramebufferInfo(gl, [{attachment:this.instance.tex}],width,height);
    twgl.bindFramebufferInfo(gl, fbi);
    gl.readPixels(0, 0, width, height, format, type, array);
    twgl.bindFramebufferInfo(gl, null);
    gl.deleteFramebuffer(fbi.framebuffer);
  }
}
