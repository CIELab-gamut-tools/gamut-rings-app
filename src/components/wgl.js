export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  gl.deleteShader(shader);
  throw new Error(gl.getShaderInfoLog(shader))
}

export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  gl.deleteProgram(program);
  throw new Error(gl.getProgramInfoLog(program))
}

export function makeProgram(gl, vSource, fSource){
  if (programs[vSource]){
    [vSource, fSource] = programs[vSource];
  }
  const program = createProgram(gl, createShader(gl, gl.VERTEX_SHADER, vSource), createShader(gl, gl.FRAGMENT_SHADER, fSource));

  const attributes = {};
  const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let ii = 0; ii < numAttribs; ++ii) {
    const attribInfo = gl.getActiveAttrib(program, ii);
    if (!isBuiltIn(attribInfo)) {
      attributes[attribInfo.name]=gl.getAttribLocation(program, attribInfo.name);
    }
  }

  const uniforms = {};
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let ii = 0; ii < numUniforms; ++ii) {
    const uniformInfo = gl.getActiveUniform(program, ii);
    if (!isBuiltIn(uniformInfo)) {
      let name = uniformInfo.name;
      // remove the array suffix.
      if (name.endsWith("[0]")) {
        name = name.substr(0, name.length - 3);
      }
      uniforms[name] = gl.getUniformLocation(program, uniformInfo.name);
    }
  }
  return {program, attributes, uniforms};
}

export function clear(gl){
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function isBuiltIn(info) {
  const name = info.name;
  return name.startsWith("gl_") || name.startsWith("webgl_");
}

const simple2DVertex="attribute vec4 a_position;void main(){gl_Position = a_position;}";
const fixedColourFragment="precision mediump float;uniform vec4 u_col;void main(){gl_FragColor=u_col;}";

const lab2DVertex=`
in vec4 a_position;
in vec3 a_lab;
out vec3 v_lab;
void main(){
  v_lab = a_lab;
  gl_Position = a_position;
}
`
const programs={
  fixedColour:[simple2DVertex,fixedColourFragment]
}