// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute float a_PointSize;\n' +
  'void main() {\n' +
  ' gl_Position = a_Position;\n' + // Cordinates that a user can specify
  ' gl_PointSize = a_PointSize;\n' + // Set the point size
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  ' gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n' + // Set the color
  '}\n';

//-----------------------------------------------------------------------------

function main() {
  var canvas = document.querySelector('#webgl');

  var gl = getWebGLContext(canvas);
  console.log(gl);

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  //--------------------------- Attribute Manipulation --------------------------

  // Get the storage location of attribute variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

  // Error Checking
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  if (a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return;
  }


  // Pass vertex position to attribute variable
  gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);

  // Pass point size to attribute variable
  gl.vertexAttrib1f(a_PointSize, 10.0);

  //-----------------------------------------------------------------------------

  // Set the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) {
    click(ev, gl, canvas, a_Position);
    // console.log(ev.button);
    // Checlk which mouse button is being used
    if (ev.button === 0) {
      console.log('Left click detected');
    } else if (ev.button === 2) {
      console.log('Right click detected');
      let count = 1;
      for (var i = 0; i < g_points.length; i += 2) {
        console.log(count + ' ' + '(' + g_points[i], g_points[i + 1] + ')');
        count++;
      }
      console.log(g_points);
    } else {
      console.log('Middle click detected');
    }
  };

  // Disable context menu within the Canvas
  canvas.addEventListener('contextmenu', function(e) { // Not compatible with IE < 9
    e.preventDefault();
  });

}

//-----------------------------------------------------------------------------

var g_points = []; // The array for a mouse press

function click(ev, gl, canvas, a_Position) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.height / 2) / (canvas.height / 2);
  y = (canvas.width / 2 - (y - rect.top)) / (canvas.width / 2);
  // Store the coordinates to g_points array
  g_points.push(x);
  g_points.push(y);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_points.length;
  for (var i = 0; i < len; i += 2) {
    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, g_points[i], g_points[i + 1], 0.0);

    // Draw a point
    gl.drawArrays(gl.POINTS, 0, 1);
  }

  //TODO empty the array to clear the points?
}

function clearCanvas() {
  g_points = [];
  console.log(g_points);
}