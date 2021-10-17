
import * as twgl from 'twgl.js';
import flatten from '../utils/flatten';
import {GLSL_VERSION, OP_TYPES, STORAGE_TYPES, VERTEX_ARRAYS, VERTEX_SHADER} from "./defines";
import TexType from "./tex-type";
import TexVar from "./tex-var";
import createCanvas from "../utils/create-canvas";

/**
 * @typedef {import('twgl.js/dist/4.x/twgl-full.d.ts).BufferInfo} BufferInfo
 */

/**
 * @typedef {{type:symbol, ...}} Operation
 */

/**
 * This class encapsulates webgl-based image processing pipelines, dealing with creating, using and recycling textures, compilation of GLSL code, and execution of pipelines.
 * @class WGLProcess
 */
export class WGLProcess {
  /**
   * Create a new WGLProcess.  If a webgl2 context is not supplied, a new canvas will be created.
   * types is a dictionary object defining a set of texture types.
   * vars is another dictionary object, declaring a set of textures
   * @param [gl] {WebGL2RenderingContext | null}
   * @param [types] {Object.<string, {width:?number, height:?number, storage:?Storage, poolSize:?number}>}
   * @param [vars] {Object.<string,string>}
   * @example
   * const process = WGLProcess(
   *   document.getElementById('canv').getContext('webgl2'),
   *   {
   *     frame: {width:640, height:480, storage:WGLProcess.RGBA32F, poolSize:4}
   *   },{
   *     tInput:'frame',
   *     tOutput:'frame'
   *   }
   * );
   */
  constructor(gl, types, vars) {

    // If gl is not a valid context, create one.
    if (gl instanceof WebGL2RenderingContext){
      this.gl = gl;
    } else {
      const {height=1, width=1} = vars || {};
      vars=types;
      types=gl;
      const canvas = createCanvas(width,height);
      gl = this.gl = canvas.getContext('webgl2');
    }
    // MUST enable the float buffer for some algorithm work.
    gl.getExtension('EXT_color_buffer_float');

    // these steps are done in tensorflow.  Our requirements are similar, so probably there to increase speed.
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.DITHER);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.disable(gl.SAMPLE_COVERAGE);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    /**
     * A bufferInfo object used in common by all webgl operations.
     * @type {BufferInfo}
     */
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl,VERTEX_ARRAYS);

    /**
     * A dictionary of all TexTypes declared
     * @type {Object.<string, TexType>}
     */
    this.types = {};

    /**
     * A dictionary of all TexVars declared
     * @type {Object.<string, TexVar>}
     */
    this.vars = {};


    // Add all types passed to the constructor
    for(let typeName of Object.keys(types)){
      this.addType(typeName, types[typeName]);
    }

    // Add all vars passed to the contructor
    for(let varName of Object.keys(vars)){
      this.vars[varName] = new TexVar({
        name: varName,
        tp: this.types[vars[varName]],
        process:this
      });
    }

    /**
     * A method bound to the instance, so it is simple to use in .map and other such functional calls.
     * @param n
     * @return {TexVar}
     */
    this.findVar = n => {
      if (this.vars[n]) return this.vars[n];
      throw new Error(`Process: unknown texture "${n}"`);
    }

    // A list of all operations, to enable clean-up later
    this.allOperations=[];

    /**
     * A list of glsl #defines to be used on all compiled glsl code.
     * @type {Object.<string,string>}
     */
    this.globalDefines = {};
  }


  /** ==================================================================================================================
   * Ensures a TexType exists with the required definition and assigns it to the name given, or if no name given and it
   * exists then return the existing name, or create a new type name on-the-fly.
   * One of either props or refTypeName must be defined.
   * @param typeName {string|null} THe name of the type to create.  If null a valid name will be returned.
   * @param [props] {Object} An object of properties to define the TexType, e.g. width, height etc.
   * @param [refTypeName] {string} If provided, an existing texture type name, or texture instance name, from which to
   *   base the new definition
   * @return {string}
   * @example
   * // add a new texture
   * process.addType('thumbnail',{width:160, height:120});
   * // get a texture which has half the scale of the given texture
   * const tOutput = process.addType(null, {xScale:0.5, yScale:0.5}, 'tInput');
   * // get a texture the same size but defined as a single-channel float texture
   * const tFMono = process.addType(null, {storage:WGLProcess.R32F}, 'tInput');
   */
  addType(typeName, props, refTypeName){
    // If the second parameter is a string, it must be a type or texture reference.
    if (typeof props === 'string'){
      [props, refTypeName] = [refTypeName, props];
    }
    if (!props) props={};
    // Find the refType, if there is one.
    let refType;
    if (refTypeName){
      if (typeof refTypeName === 'string'){
        refType = this.types[refTypeName];
        if (!refType) refType = this.vars[refTypeName].tp;
        if (!refType) throw new Error(`Process.addType: Unknown reference type "${refTypeName}".`);
      } else if (refTypeName instanceof TexType){
        refType = refTypeName
      } else {
        throw new Error ('Process.addType: supplied reference must be a string or TexType.')
      }
    }
    // If the type name already exists
    if (this.types[typeName]){
      // if it is the same definition, no problem
      if (this.types[typeName].isMatch(props)) return typeName;
      // otherwise we have a duplicate incompatible definition.
      throw new Error(`Process.addType: Type name "${typeName}" already exists with an incompatible definition.`);
    }

    // See if a compatible definition already exists
    let matchedType = null;
    for (let t of Object.keys(this.types)){
      if (this.types[t].isMatch(props)){
        matchedType = t;
        break;
      }
    }

    // if no name is supplied, if there is a match then return it, otherwise make a new (unused) name.
    if (!typeName){
      if (matchedType) return matchedType;
      let n=0;
      while (this.types[typeName = '$'+n]) n++;
    }

    // add the new type definition to the dictionary, creating one if required.
    this.types[typeName] = matchedType ? this.types[matchedType] : new TexType({process:this, ...props, refType});

    // return the type name.
    return typeName;
  }


  /** ==================================================================================================================
   * Add one or more new texture variable(s).
   * The first parameter is either the name of a type or a texture from which a type can be obtained.
   * If there is no second parameter, a new name will be generated on-the-fly and returned.
   * If the second parameter is a string, the new variable will be created with this name.
   * If the second parameter is a number N, then an array of N on-the-fly textures will be created and their names returned.
   * Finally if the second parameter is an array of strings then new variables will be created with these names.
   * @param typeName {string}
   * @param [varName] {string|string[]|number}
   * @return {string|string[]}
   */
  addVar(typeName, varName){
    // get the type
    const tp = this.types[typeName] || this.vars[typeName].tp;
    if (!tp){
      throw new Error('Process.addVar: Unknown type.')
    }

    // deal with the case of addVar(N)
    if (typeof varName === 'number'){
      varName = new Array(varName);
    }

    // deal accordingly if a single or multi var declaration is called for.
    if (Array.isArray(varName)){
      return varName.map(name=>this._addVar(tp,name));
    } else {
      return this._addVar(tp, varName);
    }
  }

  _addVar(tp, varName){
    // If no varName, create one
    if (!varName){
      let n=0;
      while (this.vars[varName = '_t_'+n]) n++;
    } else {
      // check if varName already exists
      let v = this.vars[varName];
      // if it does, and is the same type, all is OK, otherwise throw an error.
      if (v){
        if (v.tp === tp) return varName;
        throw new Error(`Process.addVar: variable "${varName}" already declared with an incompatible type.`);
      }
    }

    // create the new TexVar and return the name
    this.vars[varName] = new TexVar({
      name: varName,
      tp,
      process:this
    });
    return varName;
  }

  /** ==================================================================================================================
   * Increase the pool size for the given type (or for the type of the given variable).
   * If N is given then increment the pool size by 1, else increment it by N.
   * @param typeName {String}
   * @param [N] {number}
   */
  growTypePool(typeName, N=1){
    const tp = this.types[typeName] || this.vars[typeName].tp;
    if (!tp){
      throw new Error('Process.addVar: Unknown type.')
    }
    tp.growPool(N);
  }

  /** ==================================================================================================================
   * Add or remove new global #defines to be used with all GLSL shaders.  The defines are specified as properties of the
   * given object.  To delete a define, set the property to null.
   * @param defines {Object.<string,string|null>}
   * @example
   * // add a definition for WIDTH
   * process.define({WIDTH:640}
   * // clear the same definition
   * process.define({WIDTH:null}
   */
  define(defines){
    cleanMerge(this.globalDefines, defines);
  }

  /** ==================================================================================================================
   * @deprecated
   * @param v
   * @return {*}
   */
  type(v){
    // issue the warning once then overwrite this method with typeOf.
    console.warn('the use of process.type is deprecated - use process.typeOf instead.');
    this.type = this.typeOf;
    return this.typeOf(v);
  }

  /** ==================================================================================================================
   * Check if v is a declared TexVar
   * @param v {string}
   * @return {boolean}
   */
  isVar(v){
    return !!this.vars[v];
  }

  /** ==================================================================================================================
   * Check if t is a declared TexType
   * @param t {string}
   * @return {boolean}
   */
  isType(t){
    return !!this.types[t];
  }

  /** ==================================================================================================================
   * check if the TexVar varName has a texture instance assigned.
   * @param varName
   * @return {boolean}
   */
  isAssigned(varName){
    return !!this.findVar(varName).instance;
  }

  /** ==================================================================================================================
   * Get the TexType of the given TexVar.
   * @param varName {string}
   * @return {TexType}
   */
  typeOf(varName){
    return this.findVar(varName).tp;
  }

  /** ==================================================================================================================
   * Assign a texture to the given TexVar
   * @param varName {string}
   */
  assign(varName){
    this.findVar(varName).assign();
  }

  /** ==================================================================================================================
   * Ensure a texture is assigned to the TexVar and set the contents of the texture to the data contained in the
   * TypedArray.  The type and size of array must be compatible with the texture.
   * @param varName {string}
   * @param array {TypedArray}
   */
  set(varName, array){
    this.findVar(varName).read(array);
  }

  /** ==================================================================================================================
   * Write the data from the texture to the given TypedArray. The type and size of array must be compatible with the texture.
   * WARNING: this is a blocking operation and can take a long time if the GPU is not ready.
   * @param varName
   * @param array
   */
  get(varName, array){
    this.findVar(varName).write(array);
  }

  /** ==================================================================================================================
   * Move a texture from one texture variable to another.  If VarTo is not declared, first declare it (using the type of
   * varFrom).
   * @param varFrom
   * @param varTo
   */
  mv(varFrom, varTo){
    if (!this.isVar(varTo)) this.addVar(varFrom, varTo);
    this.findVar(varFrom).mv(this.findVar(varTo));
  }

  /** ==================================================================================================================
   *
   * @param varName
   */
  release(varName){
    this.findVar(varName).release();
  }


  /** =============================================================================================================== *
   *                                                                                                                  *
   *         Operation generation functions                                                                           *
   *                                                                                                                  *
   * =============================================================================================================== **/

  /** ==================================================================================================================
   * Generate a webgl operation.  This is the core method of WGLProcess, along with run, to execute image processing on
   * the GPU via webGL.
   * @param [output] {string | string[] | null} The name of the texture(s) which the operation will output to.
   *   If a single name, a texture will be assigned (if not already) and written to by the operation.
   *   If multiple names then all will be assigned and written to.  They MUST all have the same width and height.
   *   If null or undefined then the output from the shader will be the canvas itself.
   * @param main {string} The body of the main function.
   *   Can use the pre-defined `ivec2 xy` to access coordinates, or `vec4 gl_FragCoord` which contains (x, y, z, 1/w)
   * @param [constants] {Object.<string,number | Object>} The definitions of any constants to be used
   *   Each constant definition can be a value (assumed a float), or an object as {type:value} where type can be any
   *   valid glsl type.  e.g. {cPi:3.14, const2:{int:4}, const4:{vec4:[1,2,3,4]}}
   * @param [defines] {Object.<string, string>} Get transformed into a set of #defines
   *   For example defines:{XMAX:123} becomes `#define XMAX 123` in the compiled code.  Note that the default toString
   *   method is used to convert the value if no already a string.  This may not give the desired cast (e.g. if you
   *   intend to define a float value and the supplied variable is an int).  If there are type requirements it may be
   *   better to define a constant.  If the value can change then use a uniform.
   * @param [uniforms] {Object.<string, {type:string, default?:*, constant?:*}|string>} Define uniforms.  The
   *   short-hand form of the definition is just to provide a type name, which can be one of float, vec2, vec3, vec4,
   *   int, ivec2, ivec3, ivec4.  If supplied the default value will be used if no other value is passed when running
   *   the operation.  If supplied the constant value will alwyas be used.
   * @param [textures] {string[]|object.<string,string>} List the textures which will be used by the shader.  If defined
   *   as an array, then this is the list of texture names.  If defined as a dictionary object, then each property name
   *   will be aliased to the given texture.  All given textures must be valid declared textures, as these will be used
   *   to ensure the declarations are appropriate.
   * @param [release] {string[]} An array of texture variables to be released once the operation is complete (i.e. the
   *   textures unassigned and returned to the pool of textures to be reused).
   * @param [aliases] {Object.<string,string>} Alias any previously defined texture or uniform to another texture or uniform.
   * @param verbose {boolean} If true the resultant glsl shader code will be output to the console.
   * @return {Operation}
   */
  wglOp({output, main, constants = {},  defines = {}, uniforms = {}, aliases = {}, textures = [], release = [], verbose = false}) {

    // if textures is an object, then add defines to map the names in the glsl code to the texture names, and replace
    // this with an array of the testures.
    if (!Array.isArray(textures)){
      Object.assign(defines, textures);
      textures = Object.values(textures);
    }

    const multiOut = Array.isArray(output);
    const uNames = Object.keys(uniforms);

    // check the definitions of the uniforms, massage into a common form, and throw an error if any don't have a type.
    for (let u of uNames){
      if (typeof uniforms[u] === 'string') {
        uniforms[u]={type:uniforms[u]}
      }
      const {type} = uniforms[u];
      if (!type){
        throw new Error(`Process.wglOp: uniform ${u} has no type`)
      }
    }

    // build up a list of definitions of the constants.
    const cDefs = [];
    for(let [c,v] of Object.entries(constants)){
      if (typeof v === 'number') v = {float:v};
      if (Array.isArray(v) && v.length>1 && v.length<=4) v = {['vec'+v.length]:v};
      const [t,d] = Object.entries(v)[0]
      if (t === 'float'){
        cDefs.push([c, t, toFloat(d)]);
      } else if (t === 'int'){
        cDefs.push([c, t, toInt(d)])
      } else if (t.slice(0,3)==='vec'){
        cDefs.push([c, t, `${t}(${d.map(toFloat).join(',')})`]);
      } else if (t.slice(0,4)==='ivec'){
        cDefs.push([c, t, `${t}(${d.map(toInt).join(',')})`]);
      }
      else {throw new Error('invalid constant definition: '+JSON.stringify({[c]:constants[c]}))}
    }

    // merge the defines with the global defines.
    defines = cleanMerge({}, this.globalDefines, defines);

    // Build the text of the shader.
    const shader = `${GLSL_VERSION}
      #define op op0
      ${Object.keys(defines).filter(d=>d!==defines[d]).map(d=>`#define ${d} ${defines[d]}`).join('\n')}
      precision mediump float;
      ${textures.map(u=>`uniform ${this.findVar(u).tp.samplerPrefix}sampler2D ${u};`).join('\n')}
      ${uNames.map(u=>`uniform ${uniforms[u].type} ${u};`).join('\n')}
      ${multiOut ? 
        output.map((v,i)=>`layout(location = ${i}) out ${this.findVar(v).tp.samplerPrefix}vec4 op${i};`).join('\n') :
        `out ${output ? this.findVar(output).tp.samplerPrefix : ''}vec4 op0;`
      }
      ${cDefs.map(([c, t, v])=>`const ${t} ${c} = ${v};`).join('\n')}
      void main(void) {
        ivec2 xy = ivec2(gl_FragCoord.xy);
        ${main}
      }`;
    if (verbose){
      console.log(shader);
    }
    // todo: check the output textures are compatible (valid format, equal size)
    // return the operation, adding it to the list of ops.
    const op = {
      type: OP_TYPES.WGL,
      textures,
      release,
      output,
      program: twgl.createProgramInfo(this.gl, [VERTEX_SHADER, shader]),
      uniforms,
      aliases,
      bindCopy
    }
    this.allOperations.push(op);
    return op;
  }

  /** ==================================================================================================================
   * WGLProcess.mv() wrapped as an operation. @see {@link WGLProcess.mv}
   * @param from {string}
   * @param to {string}
   * @return {Operation}
   */
  mvOp({from, to}){
    if (!this.isVar(to)) this.addVar(from, to);
    const op = {
      type: OP_TYPES.MV,
      from: this.findVar(from),
      to: this.findVar(to)
    }
    if (op.from.tp !== op.to.tp) {
      throw new Error('process.mvOp: Types do not match.')
    }
    return op;
  }

  /** ==================================================================================================================
   * One or more WGLProcess.set() calls wrapped as an operation.  The definition keys specify what properties of data to
   * use and the values specify what textures to write to. @see {@link WGLProcess.set}
   * @param def {object.<string,string>}
   * @return {Operation}
   * @example
   * const ops = [process.inputOp({frame:tInput}, ...];
   * process.run({
   *   operations:ops,
   *   data:{frame: document.getElementById('inputVideo')}
   * });
   */
  inputOp(def){
    const textures = [], uniforms = [];
    for (let name of Object.keys(def)){
      if (this.isVar(def[name])) textures.push({name, var:this.findVar(def[name])});
      else uniforms.push({name, var:def[name]})
    }
    return {
      type: OP_TYPES.INPUT,
      textures,
      uniforms,
    }
  }

  /** ==================================================================================================================
   *One or more WGLProcess.get() calls wrapped as an operation.  The definition keys specify what properties of output
   * to use and the values specify what textures to read from. Alternatively the definition can be a string which will
   * specify the property of output to use and the texture to read will be the last texture written to by a wglOp.
   * release specifies if the texture or textures should be released after they have been read. @see {@link WGLProcess.get}
   * NOTE: This introduces a blocking operation.  This can cause the CPU to block for a long time waiting for the GPU.
   * Consider using external means to synchronise before executing this operation.
   * @param def {object.<string,string>}
   * @param release
   * @return {Operation}
   */
  outputOp(def, release = false){
    const defs = [];
    if (typeof def === 'string'){
      defs.push({name:def, release});
    } else {
      for (let name of Object.keys(def)){
        if (typeof def[name] === 'string'){
          defs.push({name, var:this.findVar(def[name])});
        } else {
          const d = def[name];
          defs.push({name, var:this.findVar(d.var), release:d.release});
        }
      }
    }
    return {
      type: OP_TYPES.OUTPUT,
      defs,
    }
  }

  /** ==================================================================================================================
   * WGLProcess.release() wrapped as an operation.  @see {@link WGLProcess.release}
   * @param vars {string | string[]}
   * @return {Operation}
   */
  releaseOp(vars) {
    if (typeof vars === 'string') vars = [vars];
    return {
      type: OP_TYPES.RELEASE,
      textures: vars.map(this.findVar),
    }
  }

  /** ==================================================================================================================
   * A special marker to indicate that a texture or array of textures are not to be cleaned-up at the end of a set
   * of operations.  This will allow automatic optimisation to release textures after their last use unless they have
   * been marked as persistent by this operation. So far this has yet to be implemented. During a run this is a null op.
   * @param vars {string | string[]}
   * @return {Operation}
   */
  persistOp(vars){
    if (typeof vars === 'string') vars = [vars];
    return {
      type: OP_TYPES.PERSIST,
      textures: vars.map(this.findVar),
    }
  }

  /** =============================================================================================================== *
   *                                                                                                                  *
   *         The run operations method                                                                                *
   *                                                                                                                  *
   * =============================================================================================================== **/
  /**
   * Run a list of operations.
   * NOTE - if there are any OutputOps then these can BLOCK until the GPU is ready.  Consider using other means to
   * synchronise the CPU and GPU to avoid blocking.
   * @param operations {Array} Is an array of operations or arrays of operations, to any depth.  Before processing a set of ops, the array is flattened.
   * @param [data] {object} A collection of properties provide TypeArrays for inputOp data for textures, or values for uniforms.
   * @param [output] Named typedArrays where data can be written to from outputOps
   */
  run({
        operations,
        data,
        output
      }) {
    const outputArrays = output || {}, {gl}=this;
    const uniformData = {};
    let last;
    let opIndex = 0;
    for (let op of flatten(operations)){
      switch (op.type){
        case OP_TYPES.WGL:
          const {program, uniforms, aliases} = op;
          const output = op.output && (!aliases.hasOwnProperty(op.output) || aliases[op.output]) && (Array.isArray(op.output) ?
            op.output.map(t=>this.findVar(aliases[t]||t)) :
            this.findVar(aliases[op.output]||op.output));
          const textures = op.textures.map(t=>this.findVar(aliases[t]||t));
          const release = op.release.map(t=>this.findVar(aliases[t]||t));

          gl.useProgram(program.program);
          twgl.setBuffersAndAttributes(gl, program, this.bufferInfo);
          const texturesAndUniforms = {}; // name (in GLSL) -> texture object
          for (let i=0; i<textures.length; ++i){
            const v = textures[i];
            if (!v.instance) {
              throw new Error(`Process.run: Unassigned texture variable "${v.name}" in op ${opIndex}`);
            }
            texturesAndUniforms[op.textures[i]] = v.instance.tex;
          }
          for (let u of Object.keys(uniforms)){
            if (uniforms[u].hasOwnProperty('constant')){
              texturesAndUniforms[u] = uniforms[u].constant;
            } else if (uniformData.hasOwnProperty(u)){
              texturesAndUniforms[u] = uniformData[u];
            } else if (uniforms[u].hasOwnProperty('default')){
              texturesAndUniforms[u] = uniforms[u].default;
            } else {
              throw new Error(`Process.run: Uniform "${u}" not set in op ${opIndex}.`);
            }
          }
          twgl.setUniforms(program, texturesAndUniforms);
          //clear any outputs not used as inputs
          if (output){
            for (let op of Array.isArray(output) ? output : [output] ){
              if (textures.indexOf(op) === -1){
                op.release();
              }
            }
          }
          let out = null, fb=null;
          if (Array.isArray(output)){
            const {tp} = output[0];
            const {width, height} = tp._options;
            out = output.map(v=>v.tp.alloc());
            fb = twgl.createFramebufferInfo(gl,out.map(o=>({attachment:o.tex})), width, height);
            twgl.bindFramebufferInfo(gl, fb);
            gl.drawBuffers(output.map((o,i)=>gl.COLOR_ATTACHMENT0+i));
          } else if (output) {
            const {tp} = output;
            const {width, height} = tp._options;
            out = tp.alloc();
            fb = twgl.createFramebufferInfo(gl,[({attachment:out.tex})], width, height);
            twgl.bindFramebufferInfo(gl, fb);
          }
          gl.drawArrays(gl.TRIANGLES,0,6);
          if (output) {
            twgl.bindFramebufferInfo(gl, null);
            gl.deleteFramebuffer(fb.frameBuffer);
          }
          for(let v of release) v.release();
          if (Array.isArray(output)){
            output.forEach((o,i)=>{
              o.release();
              o.instance = out[i];
            })
          } else if (output) {
            output.release();
            output.instance = out;
          }
          if (output)last = output;
          break;
        case OP_TYPES.MV:
          op.from.mv(op.to);
          break;
        case OP_TYPES.INPUT:
          for (let t of op.textures){
            if (data[t.name]){
              t.var.read(data[t.name]);
            }
          }
          for (let u of op.uniforms){
            if (data.hasOwnProperty(u.name)){
              uniformData[u.var] = data[u.name];
            }
          }
          break;
        case OP_TYPES.OUTPUT:
          for (let d of op.defs){
            if (outputArrays[d.name]){
              const v = d.var || last;
              v.write(outputArrays[d.name]);
              if (d.release) v.release();
            }
          }
          break;
        case OP_TYPES.RELEASE:
          for (let t of op.textures) {
            t.release();
          }
          break;
        case OP_TYPES.PERSIST:
          break;
        default:
          throw new Error(`Process.run: Unknown operation in op ${opIndex}`);
      }
      opIndex += 1;
    }
  }

  /** =============================================================================================================== *
   * Clean-up (release for GC) a set of operations.
   * @param operations {array}
   */
  cleanOps(operations = []){
    for(let op of flatten(operations).filter(op=>op.type === OP_TYPES.WGL)){
      console.log(op);
      this.gl.deleteProgram(op.program.program);
    }
    this.allOperations = this.allOperations.filter(o=>operations.indexOf(o)===-1);
  }

  /** =============================================================================================================== *
   * Destroy this WGL process, kill the WEBGL context and clean up all resources.
   */
  destroy(){
    const loseContext = this.gl.getExtension('WEBGL_lose_context');
    if (loseContext) loseContext.loseContext();
    for(let v of this.vars) v.release();
    for(let t of this.types) t.clearPool();
    this.cleanOps(this.allOperations);
    for(let k of Object.keys(this)) this[k]=null;
  }
}

// Add the STORAGE_TYPES as static properties of the WGLProcess class
Object.assign(WGLProcess,STORAGE_TYPES);

/**
 * Use the general form: boundOp = op.bingCopy({uniformName: newValue, oldTextureName: newTextureName, ...} to change
 * an operation to use an alternative set of uniforms and/or textures.  This is attached as a method to all wglOps.
 * @param bindings {object.<string,string>}
 * @return {{aliases: {}, uniforms: {}}}
 * @example
 * const gaussOp = makeGauss('tInput', {sigma:6, hSize:8});
 * // make a filter which works on a different texture
 * const gaussOp2 = gaussOp.bindCopy({tInput:tResult});
 * // or with a different blur
 * const gaussOp3 = gaussOp.bindCopy({uSigma:4, uHSize:6});
 * // NOTE: it would be more common for the makeGauss function to do this internally and to take care of re-using
 * // compiled programs where it can (textures are compatible etc).
 *
 */
function bindCopy(bindings){
  // copy these so we don't accidentally mutate the original op's uniforms or aliases
  const uniforms = {...this.uniforms};
  const aliases = {...this.aliases};
  for(let k of Object.keys(bindings)){
    if (uniforms.hasOwnProperty(k)){
      uniforms[k] = {...uniforms[k]};
      if (bindings[k] === null){
        delete uniforms[k].constant;
      } else {
        uniforms[k].constant = bindings[k]
      }
    } else {
      if (bindings[k] === null || bindings[k] === k){
        delete aliases[k];
      } else {
        aliases[k] = bindings[k];
      }
    }
  }
  return {
    ...this,
    uniforms,
    aliases
  };
}

/**
 * A helper function to merge two object, deleting properties which are undefined or null
 * @param args {object[]}
 * @return {object}
 */
function cleanMerge(...args){
  const rtn = Object.assign(...args);
  for(let [k,v] of Object.entries(rtn)){
    if (v == null) delete rtn[k];
  }
  return rtn;
}

// converts a number to a float string representation for glsl code.
function toFloat(num) {
  if (Number.isInteger(num)) {
    return num + ".0"
  } else {
    return num.toString();
  }
}

// convers a number to an int string representation for glsl code.
function toInt(num){
  return num.toFixed(0);
}
