console.log("start");

const canvas = document.querySelector("#c");

var gl = canvas.getContext("webgl2");
if (!gl) {
  alert("no webgl2");
}

// ----------------------------------------------------------------------------
var vertexShaderSource = `#version 300 es
 
// attribute는 정점 셰이더에 대한 입력(in)입니다.
// 버퍼로부터 데이터를 받습니다.
in vec2 a_position;
uniform vec2 u_resolution;
 
// 모든 셰이더는 main 함수를 가지고 있습니다.
void main() {
 
  // gl_Position은 정점 셰이더가 설정해 주어야 하는 내장 변수입니다.
  // gl_Position = a_position;
  vec2 zeroToOne = a_position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace, 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es
 
// 프래그먼트 셰이더는 기본 정밀도를 가지고 있지 않으므로 선언을 해야합니다.
// highp는 기본값으로 적당합니다. "높은 정밀도(high precision)"를 의미합니다.
precision highp float;
 
// 프래그먼트 셰이더는 출력값을 선언 해야합니다.
out vec4 outColor;
 
void main() {
  // 붉은-보라색 상수로 출력값을 설정합니다.
  outColor = vec4(1, 0, 0.5, 1);
}
`;

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

// ----------------------------------------------------------------------------

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

const positionBuffer = gl.createBuffer();
console.log(positionBuffer);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// const positions = [-1, 0, 0, -1, 1, 0];
const positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionAttributeLocation);

const size = 2;
const type = gl.FLOAT;
const normalize = false;
const stride = 0;
const offset = 0;

gl.vertexAttribPointer(
  positionAttributeLocation,
  size,
  type,
  normalize,
  stride,
  offset
);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

gl.bindVertexArray(vao);
{
  const primitiveType = gl.TRIANGLES;
  const offset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, offset, count);
}
