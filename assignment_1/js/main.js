// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute float a_PointSize;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = a_PointSize;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n' +
  '}\n';

// Program vars
var canvas,
  gl,
  a_position,
  u_Frag,
  lines = [],
  active_line = -1,
  mouse_point = {
    x: 0.0,
    y: 0.0
  };

function main() {
  if (!setup()) {
    console.log('There was an error in the setup. Exiting now.');
    return;
  }

  // Mouse press event
  canvas.onmousedown = function(event) {
    event.preventDefault();
    click(event);
  };

  // Mouse move event
  canvas.onmousemove = function(event) {
    event.preventDefault();
    move(event);
  };

  // Disable context menu
  canvas.oncontextmenu = function(event) {
    return false;
  }
}

function setup() {
  // Retrieve <canvas> element
  canvas = document.getElementById('glCanvas');

  var sizeChanger = document.querySelector('#sizeChanger');
  var lineChanger = document.querySelector('#lineChanger');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return false;
  }

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }


  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // Get the storage location of a_PointSize
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  if (a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return -1;
  }

  // Grab the variables for shiftLines()
  shiftLines(gl, a_Position, lineChanger);

  gl.vertexAttrib1f(a_PointSize, sizeChanger.value);

  pointSize(gl, a_PointSize, sizeChanger);

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Assign buffer to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  return true;
}

var g_colors = [];

function click(e) {
  var coords;
  if (e.button === 0) {
    console.log('Left click detected');
    coords = newPoint(e, {}, false);
  } else if (e.button === 2) {
    console.log('Right click detected');
    coords = newPoint(e, {}, true);
    for (var i = 0; i < lines[0].points.length; ++i) {
      var x = lines[0].points[i].x;
      var y = lines[0].points[i].y;
      console.log('Point:' + (i + 1) + ' (' + x + ', ' + y + ')');
    }
  }
}

function pointSize(gl, a_PointSize, sizeChanger) {
  sizeChanger.addEventListener('click', function() {
    gl.vertexAttrib1f(a_PointSize, sizeChanger.value);
  });
}

function shiftLines(gl, a_Position, lineChanger) {
  lineChanger.addEventListener('click', function() {
    console.log(a_Position);
  });
}


function move(event) {
  // Mouse coordinates
  var x_mouse = event.clientX;
  var y_mouse = event.clientY;

  // Canvas positioning
  var rect = event.target.getBoundingClientRect();

  // Draw coordinates
  mouse_point.x = ((x_mouse - rect.left) - canvas.width / 2) / (canvas.width / 2);
  mouse_point.y = (canvas.height / 2 - (y_mouse - rect.top)) / (canvas.height / 2);

  // Draw
  draw();
}

function newPoint(event, color, ends) {
  // Mouse coordinates
  var x_mouse = event.clientX;
  var y_mouse = event.clientY;

  // Canvas positioning
  var rect = event.target.getBoundingClientRect();

  // Draw coordinates
  var x_draw = ((x_mouse - rect.left) - canvas.width / 2) / (canvas.width / 2);
  var y_draw = (canvas.height / 2 - (y_mouse - rect.top)) / (canvas.height / 2);

  // If no active line
  if (active_line === -1) {
    // Add new line and set active
    lines.push({
      ended: false,
      points: []
    });
    active_line = lines.length - 1;
  }

  // Add point to line
  lines[active_line].points.push({
    x: x_draw,
    y: y_draw,
    c: color
  });

  // If last point of line
  if (ends) {
    // Finish line and set no active one
    lines[active_line].ended = true;
    active_line = -1;
  }

  return {
    x: x_draw,
    y: y_draw
  };
};

function drawline(lineObj) {
  // Retrieve vertex set, color set and count
  var v_set = [];
  var color_set = [];
  var v_count;

  for (v_count = 0; v_count < lineObj.points.length; v_count++) {
    v_set.push(lineObj.points[v_count].x);
    v_set.push(lineObj.points[v_count].y);

    color_set.push(lineObj.points[v_count].c);
  }

  if (v_count > 0) {
    // Write vertex into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_set), gl.STATIC_DRAW);

    // Draw points
    gl.drawArrays(gl.POINTS, 0, v_count);

    // If line is not finished
    if (!lineObj.ended) {
      // Add mouse location
      v_set.push(mouse_point.x);
      v_set.push(mouse_point.y);
      v_count++;

      // Write vertex into buffer
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_set), gl.STATIC_DRAW);
    }

    // Draw lines
    gl.drawArrays(gl.LINE_STRIP, 0, v_count);
  }

  return v_count;
}

function draw() {
  for (var i = 0; i < lines.length; i++) {
    drawline(lines[i]);
  }

  return lines.length;
}

function clearCanvas() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}