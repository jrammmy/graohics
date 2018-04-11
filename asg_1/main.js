//Shading Library Resource
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  // 'attribute float a_PointSize;\n' +
  'void main() {\n' +
  ' gl_Position = a_Position;\n' + // Cordinates that a user can specify
  // ' gl_PointSize = a_PointSize;\n' + // Set the point size
  ' gl_PointSize = 10.0;\n' + // Set the point size
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

function main() {
  //Retrive canvas from HTML file
  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get redering context for gl');
    return;
  }

  //Shader Initialization
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //====================== Attribute Manipulation =============================

  // Get the storage location of attribute/uniform variables
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  // var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  // var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  // Error Checking
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // if (a_PointSize < 0) {
  //   console.log('Failed to get the storage location of a_PointSize');
  //   return;
  // }

  // if (!u_FragColor) {
  //   console.log('Failed to get the storage location of u_FragColor');
  //   return;
  // }


  // Pass vertex position to attribute variable
  gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);

  // Pass point size to attribute variable
  // gl.vertexAttrib1f(a_PointSize, 10.0);

  // Call point store function when mouse clicked
  canvas.onmousedown = function(ev) {
    click(ev, gl, canvas, a_Position);
  };

  //Clear canvas color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var pts = []; //Store Points
var line = []; //Store Line Points - Dynamic
var n = 0; //Size of line/2
var i = 0; //Index Var
var end = false; //Right click pressed var
function click(ev, gl, canvas, a_Position, pressed) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  //Convert to canvas (x,y) coordinate plane
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  //Left Click Events
  if (ev.button == 0 && end == false) {
    pts.push(x);
    pts.push(y); //store to pts array
    line.push(x);
    line.push(y); //store to pts array
    console.log('(' + x + ', ' + y + ')');

    //Recolor Canvas Bg
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Draw Lines
    canvas.addEventListener('mousemove', function(ev) {
      draw(ev, gl, canvas);
    });
  }

  //Right Click Events - print coordinates and stop drawing on canvas
  if (ev.button == 2) {
    pts.push(x);
    pts.push(y); //store to pts array
    line.push(x);
    line.push(y); //store to pts array
    console.log('(' + x + ', ' + y + ')');
    console.log('Your Final Coordinates: ');
    for (var i = 0; i < pts.length; i += 2) console.log('(' + pts[i] + ', ' + pts[i + 1] + ')');
    end = true;
  }

  //Disable right click menu - Piazza/TA Section
  canvas.addEventListener('contextmenu', function(ev) {
    if (ev.button == 2) {
      ev.preventDefault();
      return false;
    }
  }, false);
}

//Follow mouse movement
function draw(ev, gl, canvas, a_Position) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  //Remove last 2 array inputs
  if (line.length > 2) line.splice(line.length - 2, line.length - 1);

  // Convert to canvas coordinate
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  line.push(x);
  line.push(y); //store to pts array

  gl.clear(gl.COLOR_BUFFER_BIT);

  //Draw points on Canvas
  for (var i = 0; i < pts.length; i += 2) {
    gl.vertexAttrib3f(a_Position, pts[i], pts[i + 1], 0.0);
    gl.drawArrays(gl.POINTS, 0, pts.length / 2);
  };

  //Draw line from point to point
  n = initVertexBuffers(ev, gl, canvas, a_Position, n);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.drawArrays(gl.LINE_STRIP, 0, n);
}

function initVertexBuffers(ev, gl, canvas, a_Position, n) {
  n = line.length / 2; //Number of (x,y) pairs

  if (end == true) n = pts.length / 2; //(x,y) point pairs

  //Create buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  //Bind buffer to target and write data into buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);

  //Initialize a_Position for shader
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  return n;
}