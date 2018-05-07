// Vertex shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'varying vec4 v_Normal;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '  v_Normal = a_Normal;\n' +
  '}\n';

// Fragment shader
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'varying vec4 v_Normal;\n' +
  'vec4 L;\n' +
  'vec4 V;\n' +
  'vec4 H;\n' +
  'vec4 N;\n' +
  'float NdH;\n' +
  'uniform vec4 KsI;\n' +
  'uniform float nS;\n' +
  'uniform vec4 ambient_Color;\n' +
  'vec4 specularColor;\n' +
  'vec4 vC;\n' +
  'void main() {\n' +
  '  L = vec4(1,1,1,1);\n' +
  '  V = vec4(0,0,1,1);\n' +
  '  H = L + V;\n' +
  '  H = normalize(H);\n' +
  '  N = normalize(v_Normal);\n' +
  '  if(v_Normal.x == 0.0 && v_Normal.y == 0.0 && v_Normal.z == 0.0)\n' +
  '  {\n' +
  '    NdH = 0.0;\n' +
  '  }\n' +
  '  else\n' +
  '  {\n' +
  '    NdH=dot(N,H);\n' +
  '  }\n' +
  '  NdH=max(NdH, 0.0);\n' +
  '  NdH= pow(NdH, nS);\n' +
  '  specularColor = vec4(0, (NdH*KsI.g), 0, 1);\n' +
  '  specularColor = vec4(0, min(1.0, specularColor.g), 0, 1);\n' +
  '  vC = v_Color + ambient_Color + specularColor;\n' +
  '  gl_FragColor = vC;\n' +
  '}\n';

//============================= Global Variables ==============================
var g_points = [];
var g_lines = [];
var LCPoints = [];

var obj1 = [];
var obj2 = [];

var indices = [];
var indexHolder;
var indexHolderWON;

var vertices = [];
var vertexBuffer;
var vertexBufferWON;

var colors = [];
var colorBuffer;

var normals = [];
var normalBuffer = [];
var smoothNormalBuffer = [];
var vnormalBuffer;

var toggleNormals = false;
var smooth = false;
var glossFactor = 1.0;
var ambientColor = 0.2;
var specularColor = 1.0;

//================================== Main======================================
function main() {
  var canvas;
  var gl;
  var a_Position;
  var a_Color;

  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  canvas.onmousedown = function(ev) {
    click(ev, gl, canvas, a_Position, a_Color);
  };

  canvas.onmousemove = function(ev) {
    move(ev, gl, canvas, a_Position);
  };

  draw(gl, a_Position, 0);
}

//================================== Setup ====================================
function setUpOpenGL(gl) {

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  var projMatrix = new Matrix4();
  var u_ProjMatrix;

  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) {
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }

  projMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  var KsI = gl.getUniformLocation(gl.program, 'KsI');
  if (!KsI) {
    console.log('Failed to get the storage location of KsI');
    return -1;
  }

  gl.uniform4f(KsI, 0.0, specularColor, 0.0, 0.0);

  var ambient_Color = gl.getUniformLocation(gl.program, 'ambient_Color');
  if (!ambient_Color) {
    console.log('Failed to get the storage location of ambient_Color');
    return -1;
  }

  gl.uniform4f(ambient_Color, 0.0, 0.0, ambientColor, 0.0);

  var nS = gl.getUniformLocation(gl.program, 'nS');
  if (!nS) {
    console.log('Failed to get the storage location of nS');
    return -1;
  }

  gl.uniform1f(nS, glossFactor);
}

function click(ev, gl, canvas, a_Position, a_Color) {

  if (g_lines.length > 0) {
    canvas.onmousedown = function(ev) {
      ev.preventDefault()
    };
  } else if (g_points.length > 0 || ev.button != 2) {
    var points = [];
    var n = 0;

    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    if (ev.button != 1) {
      g_points.push([x, y]);
    }

    n = g_points.length;

    for (var i = 0; i < (g_points.length * 2); i += 2) {
      points[i] = g_points[i / 2][0];
      points[i + 1] = g_points[i / 2][1];
    }

    vertexBuffer = Float32Array.from(points);

    gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    draw(gl, a_Position, n);

    if (ev.button === 0) {
      LCPoints.push(x);
      LCPoints.push(y);
    } else if (ev.button === 2) {
      canvas.addEventListener('contextmenu', function(ev) {
        {
          ev.preventDefault();
        }
      }, false);

      g_lines.push(x);
      g_lines.push(y);

      drawCircle(a_Position, gl, a_Color);
    }
  }
}

function move(ev, gl, canvas, a_Position) {
  if (g_lines.length == 0 && (g_points.length) > 0) {
    var points = [];
    var n;

    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    for (var i = 0; i < (g_points.length * 2); i += 2) {
      points[i] = g_points[i / 2][0];
      points[i + 1] = g_points[i / 2][1];
    }

    points.push(x);
    points.push(y);

    vertexBuffer = Float32Array.from(points);
    n = ((points.length) / 2)
    gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    draw(gl, a_Position, n);
  }
}

function drawCircle(a_Position, gl, a_Color) {
  var radius = .1;
  var a_mat;
  var t_mat;
  var c_mat;
  var r_vector;
  var surface;
  var p_vector;
  var ax_vector;

  var pointNum = 1;
  var ax_vector1;
  var ax_vector2;
  var newSurfacePoint;
  var m1, b1, m2, b2, x, y;

  for (var i = 1; i < g_points.length; i++) {
    ax_vector = new Vector3([g_points[i - 1][0] - g_points[i][0], g_points[i - 1][1] - g_points[i][1], 0]);

    for (var j = 0; j < 2; j += 1) {
      surface = [];

      if (j === 0) {
        p_vector = new Vector3([g_points[i - 1][0], g_points[i - 1][1], radius]);
      } else {
        p_vector = new Vector3([g_points[i][0], g_points[i][1], radius]);
      }

      surface.push(p_vector);

      for (var k = 0; k < 11; k++) {
        a_mat = new Matrix4();
        t_mat = new Matrix4();

        t_mat.translate(p_vector.elements[0], p_vector.elements[1], 0);
        a_mat.rotate((30 * (k + 1)), ax_vector.elements[0], ax_vector.elements[1], ax_vector.elements[2]);

        c_mat = t_mat.multiply(a_mat);
        r_vector = c_mat.multiplyVector3(new Vector3([0, 0, radius]));

        surface.push(r_vector);
        surface.push(r_vector);
      }
      surface.push(p_vector);

      obj1.push(surface);
    }
  }



  obj2.push(obj1[0]);

  for (var i = 1; i < (obj1.length - 2); i += 2) {
    var newSurface = [];

    ax_vector1 = new Vector3([g_points[pointNum - 1][0] - g_points[pointNum][0], g_points[pointNum - 1][1] - g_points[pointNum][1], 0]);

    ax_vector2 = new Vector3([g_points[pointNum][0] - g_points[pointNum + 1][0], g_points[pointNum][1] - g_points[pointNum + 1][1], 0]);

    for (var j = 0; j < obj1[i].length; j++) {
      m1 = (ax_vector1.elements[1] / ax_vector1.elements[0]);
      b1 = obj1[i][j].elements[1] - (m1 * obj1[i][j].elements[0]);

      m2 = (ax_vector2.elements[1] / ax_vector2.elements[0]);
      b2 = obj1[i + 1][j].elements[1] - (m2 * obj1[i + 1][j].elements[0]);

      x = ((b2 - b1) / (m1 - m2))
      y = (((m1 * b2) - (m2 * b1)) / (m1 - m2))

      newSurfacePoint = new Vector3([x, y, obj1[i][j].elements[2]]);

      newSurface.push(newSurfacePoint);
    }

    obj2.push(newSurface);
    obj2.push(newSurface);

    pointNum++;
  }

  obj2.push(obj1[(obj1.length - 1)]);

  drawCylinders(a_Position, gl, a_Color);
}

function drawCylinders(a_Position, gl, a_Color) {
  var n;
  var tempnormalBuffer = [];

  for (var i = 0; i < obj2.length; i++) {
    for (var j = 0; j < obj2[i].length; j++) {
      vertices.push(obj2[i][j].elements[0]);
      vertices.push(obj2[i][j].elements[1]);
      vertices.push(obj2[i][j].elements[2]);
    }
  }


  for (var i = 0; i < (obj2.length - 1); i += 2) {
    for (var j = 0; j < obj2[i].length; j += 2) {
      generateNormal(i, j, 0);

      indices.push((24 * (i + 1)) + j);
      indices.push(j + (24 * i));
      indices.push(j + (24 * i) + 1);
      indices.push((24 * (i + 1)) + j);
      indices.push((24 * (i + 1)) + j + 1);
      indices.push(j + (24 * i) + 1);
    }
  }

  vertexBufferWON = Float32Array.from(vertices);
  indexHolderWON = Uint16Array.from(indices);

  var ti = (vertices.length / 3);
  var indexaddCt = 0;

  for (var i = 0; i < normals.length; i++) {
    vertices.push(normals[i].elements[0]);
    vertices.push(normals[i].elements[1]);
    vertices.push(normals[i].elements[2]);
  }

  for (var i = ti; i < (vertices.length / 3); i += 2) {
    indices.push(i);
    indices.push(i + 1);
    indexaddCt += 2;
  }

  if (smooth == true) {
    createSmoothColor(obj2.length, vertices.length);
  } else {
    createFlatColor(obj2.length, vertices.length);
  }

  n = indices.length;

  indexHolder = Uint16Array.from(indices);

  vertexBuffer = Float32Array.from(vertices);

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

  bufferIntoVertexArray(gl, vertexBuffer, 3, gl.FLOAT, 'a_Position');

  if (smooth === true) {
    for (var i = 0; i < smoothNormalBuffer.length; i++) {
      tempnormalBuffer.push(smoothNormalBuffer[i].elements[0]);
      tempnormalBuffer.push(smoothNormalBuffer[i].elements[1]);
      tempnormalBuffer.push(smoothNormalBuffer[i].elements[2]);
    }
  } else {
    for (var i = 0; i < normalBuffer.length; i++) {
      tempnormalBuffer.push(normalBuffer[i].elements[0]);
      tempnormalBuffer.push(normalBuffer[i].elements[1]);
      tempnormalBuffer.push(normalBuffer[i].elements[2]);
    }
  }

  var len = (vertexBuffer.length - tempnormalBuffer.length) / 3;

  for (var i = 0; i < len; i++) {
    tempnormalBuffer.push(0);
    tempnormalBuffer.push(0);
    tempnormalBuffer.push(0);
  }

  vnormalBuffer = Float32Array.from(tempnormalBuffer);
  bufferIntoVertexArray(gl, vnormalBuffer, 3, gl.FLOAT, 'a_Normal');

  bufferIntoVertexArray(gl, colorBuffer, 3, gl.FLOAT, 'a_Color');

  var SIZE = indexHolderWON.BYTES_PER_ELEMENT;
  SIZE = SIZE * indexHolderWON.length

  canvasRefresh(gl, a_Position, n, indexHolderWON.length, SIZE)
}

//================= Main Functions ===========================================
function bufferIntoVertexArray(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();

  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }

  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function draw(gl, a_Position, n) {
  gl.clearColor(1, 1, 1, 1);

  gl.clear(gl.COLOR_BUFFER_BIT);

  if (n > 0) {
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.LINE_STRIP, 0, n);

    gl.disableVertexAttribArray(a_Position);
  }
}

function canvasRefresh(gl, a_Position, n, nWON, iSIZE) {
  gl.clearColor(1, 1, 1, 1);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (n > 0) {

    gl.enable(gl.DEPTH_TEST);

    gl.enableVertexAttribArray(a_Position);

    gl.drawElements(gl.TRIANGLES, nWON, gl.UNSIGNED_SHORT, 0);

    var meh = n - nWON;

    if (toggleNormals == true) {
      gl.drawElements(gl.LINES, meh, gl.UNSIGNED_SHORT, iSIZE);
    }
  }
}

function generateNormal(i, j, e) {
  var v1, v2, N, pt1, pt2;

  v1 = new Vector3([(obj2[i + 1][j].elements[0] - obj2[i][j].elements[0]), (obj2[i + 1][j].elements[1] - obj2[i][j].elements[1]), (obj2[i + 1][j].elements[2] - obj2[i][j].elements[2])]);

  v2 = new Vector3([(obj2[i + 1][j].elements[0] - obj2[i + 1][j + 1].elements[0]), (obj2[i + 1][j].elements[1] - obj2[i + 1][j + 1].elements[1]), (obj2[i + 1][j].elements[2] - obj2[i + 1][j + 1].elements[2])]);

  pt1 = new Vector3([((obj2[i][j].elements[0] + obj2[i][j + 1].elements[0] + obj2[i + 1][j].elements[0] + obj2[i + 1][j + 1].elements[0]) / 4), ((obj2[i][j].elements[1] + obj2[i][j + 1].elements[1] + obj2[i + 1][j].elements[1] + obj2[i + 1][j + 1].elements[1]) / 4), ((obj2[i][j].elements[2] + obj2[i][j + 1].elements[2] + obj2[i + 1][j].elements[2] + obj2[i + 1][j + 1].elements[2]) / 4)]);

  N = new Vector3([((v1.elements[1] * v2.elements[2]) - (v1.elements[2] * v2.elements[1])), ((v1.elements[2] * v2.elements[0]) - (v1.elements[0] * v2.elements[2])), ((v1.elements[0] * v2.elements[1]) - (v1.elements[1] * v2.elements[0]))]);

  N.normalize();

  pt2 = new Vector3([(pt1.elements[0] - (N.elements[0] / 4)), (pt1.elements[1] - (N.elements[1] / 4)), (pt1.elements[2] - (N.elements[2] / 4))]);

  normals.push(pt1);
  normals.push(pt2);
}

function showNormals() {
  canvas = document.getElementById('webgl');
  var tempnormalBuffer = [];

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

  SIZE = SIZE * indexHolderWON.length

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

  bufferIntoVertexArray(gl, vertexBuffer, 3, gl.FLOAT, 'a_Position');

  if (smooth == true) {
    createSmoothColor(obj2.length, vertexBuffer.length);
    for (var i = 0; i < smoothNormalBuffer.length; i++) {
      tempnormalBuffer.push(smoothNormalBuffer[i].elements[0]);
      tempnormalBuffer.push(smoothNormalBuffer[i].elements[1]);
      tempnormalBuffer.push(smoothNormalBuffer[i].elements[2]);
    }
  } else {
    createFlatColor(obj2.length, vertexBuffer.length);
    for (var i = 0; i < normalBuffer.length; i++) {
      tempnormalBuffer.push(normalBuffer[i].elements[0]);
      tempnormalBuffer.push(normalBuffer[i].elements[1]);
      tempnormalBuffer.push(normalBuffer[i].elements[2]);
    }
  }

  var len = (vertexBuffer.length - tempnormalBuffer.length) / 3;

  for (var i = 0; i < len; i++) {
    tempnormalBuffer.push(0);
    tempnormalBuffer.push(0);
    tempnormalBuffer.push(0);
  }

  vnormalBuffer = Float32Array.from(tempnormalBuffer);

  bufferIntoVertexArray(gl, vnormalBuffer, 3, gl.FLOAT, 'a_Normal');
  bufferIntoVertexArray(gl, colorBuffer, 3, gl.FLOAT, 'a_Color');

  if (toggleNormals == true) {
    toggleNormals = false;
  } else {
    toggleNormals = true;
  }

  canvasRefresh(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
}

function createFlatColor(surfaceNum, vertexCt) {
  tempCol = [];
  var nM, l, s, bP;
  normalBuffer = [];
  var normalSurfaceBasePts = [];
  colors = []; ///to refresh colors

  // flat normals
  for (var i = 0; i < obj2.length; i += 2) {
    for (var j = 0; j < 2; j++) {
      for (var k = 0; k < obj2[i].length; k += 2) {
        normalBuffer.push(new Vector3([(normals[(12 * i) + k + 1].elements[0] - normals[(12 * i) + (k)].elements[0]), (normals[(12 * i) + k + 1].elements[1] - normals[(12 * i) + (k)].elements[1]), (normals[(12 * i) + k + 1].elements[2] - normals[(12 * i) + (k)].elements[2])]));
        normalBuffer.push(new Vector3([(normals[(12 * i) + k + 1].elements[0] - normals[(12 * i) + (k)].elements[0]), (normals[(12 * i) + k + 1].elements[1] - normals[(12 * i) + (k)].elements[1]), (normals[(12 * i) + k + 1].elements[2] - normals[(12 * i) + (k)].elements[2])]));
      }
    }
  }

  for (var i = 0; i < obj2.length; i += 2) {
    for (var j = 0; j < 2; j++) {
      for (var k = 0; k < obj2[i].length; k += 2) {
        normalSurfaceBasePts.push(new Vector3([normals[(12 * i) + (k)].elements[0], normals[(12 * i) + (k)].elements[1], normals[(12 * i) + (k)].elements[2]]));
        normalSurfaceBasePts.push(new Vector3([normals[(12 * i) + (k)].elements[0], normals[(12 * i) + (k)].elements[1], normals[(12 * i) + (k)].elements[2]]));
      }
    }
  }

  for (var i = 0; i < obj2.length; i++) {
    for (var j = 0; j < obj2[i].length; j++) {
      nM = normalBuffer[(i * 24) + j];
      nM.normalize();

      bP = normalSurfaceBasePts[(i * 24) + j];

      l = new Vector3([(1 - bP.elements[0]), (1 - bP.elements[1]), (1 - bP.elements[2])]);
      l.normalize();

      s = ((nM.elements[0] * l.elements[0]) + (nM.elements[1] * l.elements[1]) + (nM.elements[2] * l.elements[2]));
      colors.push(new Vector3([s, 0, 0]));
    }
  }

  for (var i = 0; i < colors.length; i++) {
    tempCol.push(colors[i].elements[0]);
    tempCol.push(colors[i].elements[1]);
    tempCol.push(colors[i].elements[2]);
  }

  while (tempCol.length < vertexCt) {
    tempCol.push(1.0);
    tempCol.push(0.0);
    tempCol.push(0.0);
  }

  colorBuffer = Float32Array.from(tempCol);
}

function createSmoothColor(surfaceNum, vertexCt) {
  tempCol = [];
  var nM, l, s;
  normalBuffer = [];
  smoothNormalBuffer = [];
  colors = [];

  // flat normals
  for (var i = 0; i < obj2.length; i += 2) {
    for (var j = 0; j < 2; j++) {
      for (var k = 0; k < obj2[i].length; k += 2) {
        normalBuffer.push(new Vector3([(normals[(12 * i) + k + 1].elements[0] - normals[(12 * i) + (k)].elements[0]), (normals[(12 * i) + k + 1].elements[1] - normals[(12 * i) + (k)].elements[1]), (normals[(12 * i) + k + 1].elements[2] - normals[(12 * i) + (k)].elements[2])]));
        normalBuffer.push(new Vector3([(normals[(12 * i) + k + 1].elements[0] - normals[(12 * i) + (k)].elements[0]), (normals[(12 * i) + k + 1].elements[1] - normals[(12 * i) + (k)].elements[1]), (normals[(12 * i) + k + 1].elements[2] - normals[(12 * i) + (k)].elements[2])]));
      }
    }
  }

  //smoothNormals
  smoothNormalBuffer.push(new Vector3([(normalBuffer[23].elements[0] + normalBuffer[0].elements[0]), (normalBuffer[23].elements[1] + normalBuffer[0].elements[1]), (normalBuffer[23].elements[2] + normalBuffer[0].elements[2])]));
  for (var i = 1; i < obj2[0].length; i += 2) {
    if (i != 23) {
      smoothNormalBuffer.push(new Vector3([(normalBuffer[i].elements[0] + normalBuffer[i + 1].elements[0]), (normalBuffer[i].elements[1] + normalBuffer[i + 1].elements[1]), (normalBuffer[i].elements[2] + normalBuffer[i + 1].elements[2])]));
      smoothNormalBuffer.push(new Vector3([(normalBuffer[i].elements[0] + normalBuffer[i + 1].elements[0]), (normalBuffer[i].elements[1] + normalBuffer[i + 1].elements[1]), (normalBuffer[i].elements[2] + normalBuffer[i + 1].elements[2])]));
    } else {
      smoothNormalBuffer.push(new Vector3([(normalBuffer[23].elements[0] + normalBuffer[0].elements[0]), (normalBuffer[23].elements[1] + normalBuffer[0].elements[1]), (normalBuffer[23].elements[2] + normalBuffer[0].elements[2])]));
    }
  }

  for (var i = 1; i < (obj2.length - 2); i += 2) {
    for (var j = 0; j < 2; j++) {
      smoothNormalBuffer.push(new Vector3([normalBuffer[i * 24].elements[0] + normalBuffer[((i + 1) * 24) - 1].elements[0] + normalBuffer[(i + 1) * 24].elements[0] + normalBuffer[((i + 2) * 24) - 1].elements[0], normalBuffer[i * 24].elements[1] + normalBuffer[((i + 1) * 24) - 1].elements[1] + normalBuffer[(i + 1) * 24].elements[1] + normalBuffer[((i + 2) * 24) - 1].elements[1], normalBuffer[i * 24].elements[2] + normalBuffer[((i + 1) * 24) - 1].elements[2] + normalBuffer[(i + 1) * 24].elements[2] + normalBuffer[((i + 2) * 24) - 1].elements[2]]));
      for (var k = 1; k < obj2[i].length; k += 2) {
        if (k != 23) {
          smoothNormalBuffer.push(new Vector3([normalBuffer[i * 24 + k].elements[0] + normalBuffer[(i * 24) + k + 1].elements[0] + normalBuffer[(i + 1) * 24 + k].elements[0] + normalBuffer[((i + 1) * 24) + k + 1].elements[0], normalBuffer[i * 24 + k].elements[1] + normalBuffer[(i * 24) + k + 1].elements[1] + normalBuffer[(i + 1) * 24 + k].elements[1] + normalBuffer[((i + 1) * 24) + k + 1].elements[1], normalBuffer[i * 24 + k].elements[2] + normalBuffer[(i * 24) + k + 1].elements[2] + normalBuffer[(i + 1) * 24 + k].elements[2] + normalBuffer[((i + 1) * 24) + k + 1].elements[2]]));
          smoothNormalBuffer.push(new Vector3([normalBuffer[i * 24 + k].elements[0] + normalBuffer[(i * 24) + k + 1].elements[0] + normalBuffer[(i + 1) * 24 + k].elements[0] + normalBuffer[((i + 1) * 24) + k + 1].elements[0], normalBuffer[i * 24 + k].elements[1] + normalBuffer[(i * 24) + k + 1].elements[1] + normalBuffer[(i + 1) * 24 + k].elements[1] + normalBuffer[((i + 1) * 24) + k + 1].elements[1], normalBuffer[i * 24 + k].elements[2] + normalBuffer[(i * 24) + k + 1].elements[2] + normalBuffer[(i + 1) * 24 + k].elements[2] + normalBuffer[((i + 1) * 24) + k + 1].elements[2]]));
        } else {
          smoothNormalBuffer.push(new Vector3([normalBuffer[i * 24].elements[0] + normalBuffer[((i + 1) * 24) - 1].elements[0] + normalBuffer[(i + 1) * 24].elements[0] + normalBuffer[((i + 2) * 24) - 1].elements[0], normalBuffer[i * 24].elements[1] + normalBuffer[((i + 1) * 24) - 1].elements[1] + normalBuffer[(i + 1) * 24].elements[1] + normalBuffer[((i + 2) * 24) - 1].elements[1], normalBuffer[i * 24].elements[2] + normalBuffer[((i + 1) * 24) - 1].elements[2] + normalBuffer[(i + 1) * 24].elements[2] + normalBuffer[((i + 2) * 24) - 1].elements[2]]));
        }
      }
    }
  }

  smoothNormalBuffer.push(new Vector3([(normalBuffer[((obj2.length) * 24) - 1].elements[0] + normalBuffer[((obj2.length - 1) * 24)].elements[0]), (normalBuffer[((obj2.length) * 24) - 1].elements[1] + normalBuffer[((obj2.length - 1) * 24)].elements[1]), (normalBuffer[((obj2.length) * 24) - 1].elements[2] + normalBuffer[((obj2.length - 1) * 24)].elements[2])]));
  for (var i = 1; i < obj2[(obj2.length - 1)].length; i += 2) {
    if (i != 23) {
      smoothNormalBuffer.push(new Vector3([(normalBuffer[i + ((obj2.length - 1) * 24)].elements[0] + normalBuffer[i + ((obj2.length - 1) * 24) + 1].elements[0]), (normalBuffer[i + ((obj2.length - 1) * 24)].elements[1] + normalBuffer[i + ((obj2.length - 1) * 24) + 1].elements[1]), (normalBuffer[i + ((obj2.length - 1) * 24)].elements[2] + normalBuffer[i + ((obj2.length - 1) * 24) + 1].elements[2])]));
      smoothNormalBuffer.push(new Vector3([(normalBuffer[i + ((obj2.length - 1) * 24)].elements[0] + normalBuffer[i + ((obj2.length - 1) * 24) + 1].elements[0]), (normalBuffer[i + ((obj2.length - 1) * 24)].elements[1] + normalBuffer[i + ((obj2.length - 1) * 24) + 1].elements[1]), (normalBuffer[i + ((obj2.length - 1) * 24)].elements[2] + normalBuffer[i + ((obj2.length - 1) * 24) + 1].elements[2])]));
    } else {
      smoothNormalBuffer.push(new Vector3([(normalBuffer[((obj2.length) * 24) - 1].elements[0] + normalBuffer[((obj2.length - 1) * 24)].elements[0]), (normalBuffer[((obj2.length) * 24) - 1].elements[1] + normalBuffer[((obj2.length - 1) * 24)].elements[1]), (normalBuffer[((obj2.length) * 24) - 1].elements[2] + normalBuffer[((obj2.length - 1) * 24)].elements[2])]));
    }
  }

  for (var i = 0; i < obj2.length; i++) {
    for (var j = 0; j < obj2[i].length; j++) {
      nM = smoothNormalBuffer[(i * 24) + j];
      nM.normalize();

      l = new Vector3([(1 - obj2[i][j].elements[0]), (1 - obj2[i][j].elements[1]), (1 - obj2[i][j].elements[2])]);
      l.normalize();

      s = ((nM.elements[0] * l.elements[0]) + (nM.elements[1] * l.elements[1]) + (nM.elements[2] * l.elements[2]));
      colors.push(new Vector3([s, 0, 0]));
    }
  }

  for (var i = 0; i < colors.length; i++) {
    tempCol.push(colors[i].elements[0]);
    tempCol.push(colors[i].elements[1]);
    tempCol.push(colors[i].elements[2]);
  }


  while (tempCol.length < vertexCt) {
    tempCol.push(1.0);
    tempCol.push(0.0);
    tempCol.push(0.0);
  }

  colorBuffer = Float32Array.from(tempCol);
}

function showSmooth() {
  var tempnormalBuffer = [];
  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  if (smooth === false) {
    smooth = true;
    if (g_points.length > 0) {
      createSmoothColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < smoothNormalBuffer.length; i++) {
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[0]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[1]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[2]);
      }
    }
  } else {
    smooth = false;
    if (g_points.length > 0) {
      createFlatColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < normalBuffer.length; i++) {
        tempnormalBuffer.push(normalBuffer[i].elements[0]);
        tempnormalBuffer.push(normalBuffer[i].elements[1]);
        tempnormalBuffer.push(normalBuffer[i].elements[2]);
      }
    }
  }

  var len = (vertexBuffer.length - tempnormalBuffer.length) / 3;

  for (var i = 0; i < len; i++) {
    tempnormalBuffer.push(0);
    tempnormalBuffer.push(0);
    tempnormalBuffer.push(0);
  }

  if (g_points.length > 0) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexBuffer, 3, gl.FLOAT, 'a_Position');

    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length

    vnormalBuffer = new Float32Array(tempnormalBuffer);

    bufferIntoVertexArray(gl, vnormalBuffer, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorBuffer, 3, gl.FLOAT, 'a_Color');
    canvasRefresh(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}

//============== Extra Credit Functions =======================================
function setGloss() {
  var x = document.getElementById("myRange");
  glossFactor = x.value;
  glossFactor = parseFloat(glossFactor);

  var nS = gl.getUniformLocation(gl.program, 'nS');
  if (!nS) {
    console.log('Failed to get the storage location of nS');
    return -1;
  }

  gl.uniform1f(nS, glossFactor);

  var tempnormalBuffer = [];

  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  if (g_points.length > 0) {
    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length;

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexBuffer, 3, gl.FLOAT, 'a_Position');

    if (smooth == true) {
      createSmoothColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < smoothNormalBuffer.length; i++) {
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[0]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[1]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[2]);
      }
    } else {
      createFlatColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < normalBuffer.length; i++) {
        tempnormalBuffer.push(normalBuffer[i].elements[0]);
        tempnormalBuffer.push(normalBuffer[i].elements[1]);
        tempnormalBuffer.push(normalBuffer[i].elements[2]);
      }
    }

    var len = (vertexBuffer.length - tempnormalBuffer.length) / 3;

    for (var i = 0; i < len; i++) {
      tempnormalBuffer.push(0);
      tempnormalBuffer.push(0);
      tempnormalBuffer.push(0);
    }

    vnormalBuffer = Float32Array.from(tempnormalBuffer);
    bufferIntoVertexArray(gl, vnormalBuffer, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorBuffer, 3, gl.FLOAT, 'a_Color');
    canvasRefresh(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}

function changeAmbientColor() {
  var x = document.getElementById("aColor");
  ambientColor = x.value;
  ambientColor = parseFloat(ambientColor);

  var nS = gl.getUniformLocation(gl.program, 'nS');
  if (!nS) {
    console.log('Failed to get the storage location of nS');
    return -1;
  }

  gl.uniform1f(nS, ambientColor);

  var tempnormalBuffer = [];

  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  if (g_points.length > 0) {
    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length;

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexBuffer, 3, gl.FLOAT, 'a_Position');

    if (smooth == true) {
      createSmoothColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < smoothNormalBuffer.length; i++) {
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[0]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[1]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[2]);
      }
    } else {
      createFlatColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < normalBuffer.length; i++) {
        tempnormalBuffer.push(normalBuffer[i].elements[0]);
        tempnormalBuffer.push(normalBuffer[i].elements[1]);
        tempnormalBuffer.push(normalBuffer[i].elements[2]);
      }
    }

    var len = (vertexBuffer.length - tempnormalBuffer.length) / 3;

    for (var i = 0; i < len; i++) {
      tempnormalBuffer.push(0);
      tempnormalBuffer.push(0);
      tempnormalBuffer.push(0);
    }

    vnormalBuffer = Float32Array.from(tempnormalBuffer);
    bufferIntoVertexArray(gl, vnormalBuffer, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorBuffer, 3, gl.FLOAT, 'a_Color');
    canvasRefresh(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}

function changeSpecularColor() {
  var x = document.getElementById("sColor");
  specularColor = x.value;
  specularColor = parseFloat(specularColor);

  var nS = gl.getUniformLocation(gl.program, 'nS');
  if (!nS) {
    console.log('Failed to get the storage location of nS');
    return -1;
  }

  gl.uniform1f(nS, specularColor);

  var tempnormalBuffer = [];

  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  if (g_points.length > 0) {
    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length;

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexBuffer, 3, gl.FLOAT, 'a_Position');

    if (smooth == true) {
      createSmoothColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < smoothNormalBuffer.length; i++) {
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[0]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[1]);
        tempnormalBuffer.push(smoothNormalBuffer[i].elements[2]);
      }
    } else {
      createFlatColor(obj2.length, vertexBuffer.length);
      for (var i = 0; i < normalBuffer.length; i++) {
        tempnormalBuffer.push(normalBuffer[i].elements[0]);
        tempnormalBuffer.push(normalBuffer[i].elements[1]);
        tempnormalBuffer.push(normalBuffer[i].elements[2]);
      }
    }

    var len = (vertexBuffer.length - tempnormalBuffer.length) / 3;

    for (var i = 0; i < len; i++) {
      tempnormalBuffer.push(0);
      tempnormalBuffer.push(0);
      tempnormalBuffer.push(0);
    }

    vnormalBuffer = Float32Array.from(tempnormalBuffer);
    bufferIntoVertexArray(gl, vnormalBuffer, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorBuffer, 3, gl.FLOAT, 'a_Color');
    canvasRefresh(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}