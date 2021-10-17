export const GLSL_VERSION = '#version 300 es'

/**
 * The vertex shader used by all image processing webgl programs.
 */
export const VERTEX_SHADER = `${GLSL_VERSION}
in vec4 a_position;
in vec2 a_texcoord;
out vec2 texCoords;
void main(void) {
  texCoords = a_texcoord;
  gl_Position = a_position;
}
`;

/**
 * varyings data for the vertex shader above.
 */
export const VERTEX_ARRAYS = {
  a_position: {
    numComponents: 2,
    data: new Float32Array([
      -1.0, -1.0,   1.0, -1.0,   -1.0, 1.0,
      -1.0, 1.0,   1.0, -1.0,   1.0, 1.0
    ])
  },
  a_texcoord: {
    numComponents: 2,
    data: new Float32Array([
      1,1,   0,1,   1,0,
      1,0,   0,1,   0,0
    ])
  },
  indices: [0,1,2, 3,4,5],
}

// https://www.khronos.org/registry/OpenGL/specs/gl/glspec32.core.pdf page 135 for textures allowed for output
/**
 * Encapsulates the pixel data type of a texture.
 * The array values are the format, internal format, type, can be used as output, and the optional sampler prefix.
 * A good reference page for all possible types: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
 * The defined list below is by no means exhaustive.
 * The 'can be used as output' is basically 'not RGB'.  The number of output channels must be 1, 2 or 4.
 * Finally the sampler prefix is used when building the GLSL code.  the normal declaration is 'sampler2D', however some
 * texture types must be declared with some prefix, e.g. a "lowp u" prefix becomes "lowp usampler2D"
 * @typedef Storage
 * @type {[string, string, string, boolean, ?string]}
 */

/**
 * The list of supported storage types.  These will be merged  with the global 'WGLProcess' object as static proerties.
 * @type {Object.<string, Storage>}
 */
export const STORAGE_TYPES = {
  // format, internal format, type, can be used as output, sampler prefix
  R8:         ["RED",          "R8",      "UNSIGNED_BYTE",  true],
  RG8:        ["RG",           "RG8",     "UNSIGNED_BYTE",  true],
  RGB8:       ["RGB",          "RGB8",    "UNSIGNED_BYTE",  false],
  RGBA8:      ["RGBA",         "RGBA8",    "UNSIGNED_BYTE",  true],
  R32F:       ["RED",          "R32F",    "FLOAT",          true],
  RG32F:      ["RG",           "RG32F",   "FLOAT",          true],
  RGB32F:     ["RGB",          "RGB32F",  "FLOAT",          false],
  RGBA32F:    ["RGBA",         "RGBA32F", "FLOAT",          true],
  R8UI:       ["RED_INTEGER",  "R8UI",    "UNSIGNED_BYTE",  true,  "lowp u"],
  R16UI:      ["RED_INTEGER",  "R16UI",   "UNSIGNED_SHORT", true,  "mediump u"]
}

/**
 * Find a compatible STORAGE_TYPE entry from the supplied internal format.
 * Often these are the same, but it may not always be the case.
 * @param internalFormat {string}
 * @return {string} the name of the type
 */
export function typeName(internalFormat){
  return (Object.entries(STORAGE_TYPES).find(e=>e[1]===internalFormat)||[])[0]
}

/**
 * An enum dictionary of the WGLProcess operation types
 * @type {Object.<string, symbol>}
 */
export const OP_TYPES = {
  WGL: Symbol(),
  MV: Symbol(),
  INPUT: Symbol(),
  OUTPUT: Symbol(),
  RELEASE: Symbol(),
  PERSIST: Symbol(),
}
