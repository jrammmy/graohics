//Shading Library Resource
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute float a_PointSize;\n' +
  'void main() {\n' +
  ' gl_Position = a_Position;\n' + // Cordinates that a user can specify
  ' gl_PointSize = a_PointSize;\n' + // Set the point size
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

function main() {
  //Retrive canvas from HTML file
  var canvas = document.getElementById('webgl');
  var sizeChanger = document.querySelector('#sizeChanger');

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
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  // Error Checking
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  if (a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return;
  }

  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Pass point size to attribute variable
  gl.vertexAttrib1f(a_PointSize, sizeChanger.value);

  // Call point store function when mouse clicked
  canvas.onmousedown = function(ev) {
    click(ev, gl, canvas, a_Position, u_FragColor);
    draw(ev, gl, canvas, a_Position, u_FragColor);
  };

  pointSize(gl, a_PointSize, sizeChanger);

  //Clear canvas color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

} //end main()

var g_points = []; //Store Points
var g_lines = []; //Store g_lines Points
var g_colors = []; // The array to store the color of a point
var n = 0;
var i = 0;
var end = false;

function click(ev, gl, canvas, a_Position, u_FragColor) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  //Convert to canvas (x,y) coordinate plane
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  if (x >= 0.0 && y >= 0.0) { // First quadrant
    g_colors.push([1.0, 0.0, 0.0, 1.0]); // Red
  } else if (x < 0.0 && y < 0.0) { // Third quadrant
    g_colors.push([0.0, 1.0, 0.0, 1.0]); // Green
  } else { // Others
    g_colors.push([1.0, 1.0, 1.0, 1.0]); // White
  }

  //clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //Left Click Events
  if (ev.button === 0 && end === false) {
    console.log('Left click detected');
    g_points.push([x, y]);
    g_lines.push(x);
    g_lines.push(y);
    console.log('(' + x + ', ' + y + ')');

    //Draw rubberband lines
    canvas.addEventListener('mousemove', function(ev) {
      draw(ev, gl, canvas, a_Position);
    });
  }
  //Right Click Events
  else if (ev.button === 2) {
    console.log('Right click detected');
    //Disable the context menu
    canvas.addEventListener('contextmenu', function(ev) {
      ev.preventDefault();
    });
    g_points.push([x, y]);
    g_lines.push(x);
    g_lines.push(y);
    console.log('(' + x + ', ' + y + ')');
    console.log('Your Final Coordinates: ');
    for (var i = 0; i < g_points.length; i++) {
      var xy = g_points[i];
      console.log((i + 1) + ' ' + '(' + xy + ')');
      end = true;
    }
  }
}

//Follow mouse movement and draws them to canvas
function draw(ev, gl, canvas, a_Position, u_FragColor) {
  var x = ev.clientX;
  var y = ev.clientY
  var rect = ev.target.getBoundingClientRect();

  //Remove last 2 array inputs
  if (g_lines.length > 2) {
    g_lines.splice(g_lines.length - 2, g_lines.length - 1);
  }

  // Convert to canvas coordinate
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  g_lines.push(x);
  g_lines.push(y);

  gl.clear(gl.COLOR_BUFFER_BIT);

  //Draw points on Canvas
  for (var i = 0; i < g_points.length; i++) {
    var xy = g_points[i];
    var rgba = g_colors[i];

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Draw
    gl.drawArrays(gl.POINTS, 0, g_points.length);
  };

  //Draw g_lines from point to point
  n = initVertexBuffers(ev, gl, canvas, a_Position, n);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.drawArrays(gl.LINE_STRIP, 0, n);
}

function initVertexBuffers(ev, gl, canvas, a_Position, n) {
  n = g_lines.length / 2; //Number of (x,y) pairs

  if (end === true) {
    n = g_points.length; //(x,y) point pairs
  }

  //Create buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  //Bind buffer to target and write data into buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_lines), gl.STATIC_DRAW);

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

function pointSize(gl, a_PointSize, sizeChanger) {
  sizeChanger.addEventListener('click', function() {
    gl.vertexAttrib1f(a_PointSize, sizeChanger.value);
  });
}