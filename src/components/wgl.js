export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  gl.deleteShader(shader);
  console.log(gl.getShaderInfoLog(shader))
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
  console.log(gl.getProgramInfoLog(shader))
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

const varColourFragment=`
precision mediump float;
uniform float u_chroma;
uniform float u_lightness;
void main(){
  vec2 xy = (gl_FragCoord.xy-512.0)/512.0;
  vec2 ab = u_chroma * xy / sqrt(dot(xy,xy));
  float fY = (u_lightness + 16.0) / 116.0; 
  float fX = ab.x/500.0+fY;
  float fZ = fY-ab.y/200.0;
  vec3 XYZ = vec3(0.0);
  if (fX>0.207) XYZ.x=fX*fX*fX; else XYZ.x=fX*0.12842-0.017713;
  if (fY>0.207) XYZ.y=fY*fY*fY; else XYZ.y=fY*0.12842-0.017713;
  if (fZ>0.207) XYZ.z=fZ*fZ*fZ; else XYZ.z=fZ*0.12842-0.017713;
  XYZ *= vec3(0.9504559, 1.0, 1.0890578);
  // vec3 RGB = XYZ / mat3(0.41246, 0.21267, 0.01933, 0.35758, 0.71515, 0.11919, 0.18044, 0.07218, 0.95030);
  vec3 RGB = clamp(mat3(3.2404, -0.9692, 0.0557, -1.5371, 1.8760, -0.2040, -0.4985, 0.0415, 1.0572)*XYZ,0.0,1.0);
  // vec3 RGB = vec3(0.5,0.5,0.5);
  gl_FragColor=vec4(RGB,1.0);
}`;
const programs={
  fixedColour:[simple2DVertex,fixedColourFragment],
  varColour:[simple2DVertex, varColourFragment]
}