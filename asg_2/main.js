// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '  gl_PointSize = 0.0;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Program vars
var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT;
var radSize = document.querySelector('#radSize');
var changeSides = document.querySelector('#changeSides');
var radius = radSize.value;
var sides = changeSides.value;
var g_lines = [];
var vert = [];

// Main function
function main() {

  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

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

  // Init vertex Buffer
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the vertex buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  //====== Attribute Manipulation =============================================

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }

  // Assign buffer to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);


  // Get the storage location of a_Color
  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return false;
  }

  // Assign buffer to a_Color variable
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  // Enable the assignment to a_Color variable
  gl.enableVertexAttribArray(a_Color);

  //================= Event Listeners ==========================================

  canvas.addEventListener('click', function(ev) {
    click(ev, gl);
  });

  canvas.addEventListener('contextmenu', function(ev) {
    click(ev, gl);
  });

  canvas.addEventListener('mousemove', function(ev) {
    move(ev, gl);
  });

  //=============== File Handling =============================================
  setupIOSOR('fileinput');

  document.getElementById('fileinput').addEventListener('change', function(e) {
    document.getElementById('update_screen').disabled = false;
  });

  document.getElementById('save_canvas').addEventListener('click', function(e) {
    e.preventDefault();
    saveSOR();
  });

  document.getElementById('update_screen').addEventListener('click', function(e) {
    e.preventDefault();
    readSOR();
  });

  //==================== Clear Canvas ==========================================

  // Specify the color for clearing <canvas>
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

}

// ========================= Mouse Functions ==================================

// Event handler for mouse click
function click(ev, gl) {
  var coords = {};

  // Mouse coordinates
  var x_mouse = ev.clientX;
  var y_mouse = ev.clientY;

  // Canvas positioning
  var rect = ev.target.getBoundingClientRect();

  // Draw coordinates
  coords.x = ((x_mouse - rect.left) - canvas.width / 2) / (canvas.width / 2);
  coords.y = (canvas.height / 2 - (y_mouse - rect.top)) / (canvas.height / 2);
  coords.z = 0.0;

  // Detect left or right click
  if (ev.button === 0) {
    coords.e = multPolyLines(coords, false);
  } else if (ev.button === 2) {
    ev.preventDefault(); //disable context menu
    coords.e = multPolyLines(coords, true);
  }

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw
  draw();
}

// Event handler for mouse move
function move(ev, gl) {
  // Mouse coordinates
  var x_mouse = ev.clientX;
  var y_mouse = ev.clientY;

  // Canvas positioning
  var rect = ev.target.getBoundingClientRect();

  // Draw coordinates
  mouse_point.x = ((x_mouse - rect.left) - canvas.width / 2) / (canvas.width / 2);
  mouse_point.y = (canvas.height / 2 - (y_mouse - rect.top)) / (canvas.height / 2);

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw
  draw();
}

//============= Button Functions ==============================================

radSize.addEventListener('click', function(ev) {
  changeRadSize();
});

changeSides.addEventListener('click', function(ev) {
  changeNumofSides();
});

// ============= Drawing Functions ============================================

// Main draw function
function draw() {
  // Draw each polyline
  for (var i = 0; i < polyLines.length; i++) {
    if (polyLines[i].ended) {
      drawRectangle(polyLines[i]);
    } else {
      drawLine(polyLines[i]);
    }
  }

  var len = polyLines.length
  return len;
}

// Draws a line
function drawLine(obj) {
  // Draw object elems (points)
  for (var i = 0; i < obj.elems.length; i++) {
    g_lines.push(obj.elems[i].point.x);
    g_lines.push(obj.elems[i].point.y);
    g_lines.push(obj.elems[i].point.z);
    g_lines.push(obj.elems[i].point.r);
    g_lines.push(obj.elems[i].point.g);
    g_lines.push(obj.elems[i].point.b);
  }

  // Write vert into buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_lines), gl.STATIC_DRAW);

  var len1 = g_lines.length / 6
  // Draw points
  gl.drawArrays(gl.POINTS, 0, len1);

  // Draw lines and rubberband
  g_lines = [];
  for (var i = 0; i < obj.elems.length; i++) {
    g_lines.push(obj.elems[i].point.x);
    g_lines.push(obj.elems[i].point.y);
    g_lines.push(obj.elems[i].point.z);
    g_lines.push(1.0);
    g_lines.push(1.0);
    g_lines.push(0.0);
  }
  g_lines.push(mouse_point.x);
  g_lines.push(mouse_point.y);
  g_lines.push(mouse_point.z);
  g_lines.push(1.0);
  g_lines.push(0.0);
  g_lines.push(1.0);

  // Write vert into buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_lines), gl.STATIC_DRAW);

  var len2 = g_lines.length / 6
  // Draw lines
  gl.drawArrays(gl.LINE_STRIP, 0, len2);
}

// Draws an object
function drawRectangle(obj) {
  for (var i = 1; i < obj.elems.length; i++) {
    for (var k = 0; k < obj.elems[i].circ.length; k++) {
      vert = [];
      if (k === obj.elems[i].circ.length - 1) {
        vert.push(obj.elems[i].circ[k].x);
        vert.push(obj.elems[i].circ[k].y);
        vert.push(obj.elems[i].circ[k].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(obj.elems[i - 1].circ[k].x);
        vert.push(obj.elems[i - 1].circ[k].y);
        vert.push(obj.elems[i - 1].circ[k].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(obj.elems[i - 1].circ[0].x);
        vert.push(obj.elems[i - 1].circ[0].y);
        vert.push(obj.elems[i - 1].circ[0].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(obj.elems[i].circ[0].x);
        vert.push(obj.elems[i].circ[0].y);
        vert.push(obj.elems[i].circ[0].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

      } else {
        vert.push(obj.elems[i].circ[k].x);
        vert.push(obj.elems[i].circ[k].y);
        vert.push(obj.elems[i].circ[k].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(obj.elems[i - 1].circ[k].x);
        vert.push(obj.elems[i - 1].circ[k].y);
        vert.push(obj.elems[i - 1].circ[k].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(obj.elems[i - 1].circ[k + 1].x);
        vert.push(obj.elems[i - 1].circ[k + 1].y);
        vert.push(obj.elems[i - 1].circ[k + 1].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(obj.elems[i].circ[k + 1].x);
        vert.push(obj.elems[i].circ[k + 1].y);
        vert.push(obj.elems[i].circ[k + 1].z);
        vert.push(1.0);
        vert.push(0.0);
        vert.push(1.0);

      }

      // Write vertex into buffer
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW);

      var len = vert.length / 6;
      // Draw points
      gl.drawArrays(gl.LINE_STRIP, 0, len);
    }
  }

  // Draw object elems (circs points)
  for (var i = 0; i < obj.elems.length; i++) {
    var vert_vertices = [];
    // Draw vert circ
    for (var j = 0; j < obj.elems[i].circ.length; j++) {
      vert_vertices.push(obj.elems[i].circ[j].x);
      vert_vertices.push(obj.elems[i].circ[j].y);
      vert_vertices.push(obj.elems[i].circ[j].z);
      if (j == 0) {
        vert_vertices.push(1.0);
        vert_vertices.push(0.0);
        vert_vertices.push(1.0);
      } else if (j == 9) {
        vert_vertices.push(1.0);
        vert_vertices.push(0.0);
        vert_vertices.push(0.0);
      } else {
        vert_vertices.push(obj.elems[i].circ[j].r);
        vert_vertices.push(obj.elems[i].circ[j].g);
        vert_vertices.push(obj.elems[i].circ[j].b);
      }
    }

    // Write vertices into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert_vertices), gl.STATIC_DRAW);

    // Draw points
    gl.drawArrays(gl.POINTS, 0, vert_vertices.length / 6);

    // Draw lines
    gl.drawArrays(gl.LINE_LOOP, 0, vert_vertices.length / 6);
  }
}

// Draw Cylinder
function drawCylinder(obj) {
  // Each cylinder (starting from the second one)
  for (var i = 1; i < obj.elems.length; i++) {
    if (i === 1) {
      obj.elems[i - 1].circ = drawCircles(obj.elems[i - 1], obj.elems[i]).circ1;
    } else {
      var A = obj.elems[i - 2];
      var B = obj.elems[i - 1];
      var C = obj.elems[i];

      var circAB = drawCircles(A, B).circ1;
      var circBC = drawCircles(B, C).circ1;

      var dAB = [B.point.x - A.point.x,
        B.point.y - A.point.y,
        B.point.z - A.point.z
      ];

      var dBC = [C.point.x - B.point.x,
        C.point.y - B.point.y,
        C.point.z - B.point.z
      ];

      vert = [];

      for (var j = 0; j < circAB.length; j++) {
        var pA = circAB[j];
        var pC = circBC[j];

        var dCA = [pA.x - pC.x,
          pA.y - pC.y,
          pA.z - pC.z
        ];

        var d1 = (dCA[0] * dBC[1]) - (dCA[1] * dBC[0]);
        var d2 = (-dAB[0] * dCA[1]) - (-dAB[1] * dCA[0]);
        var d3 = (-dAB[0] * dBC[1]) - (-dAB[1] * dBC[0]);

        var h1 = d1 / d3;
        var h2 = d2 / d3;

        var pB = [pA.x + dAB[0] * h1,
          pA.y + dAB[1] * h1,
          pA.z + dAB[2] * h1
        ];

        vert.push(new coord(pB[0], pB[1], pB[2], 0.0, 0.0, 1.0));
      }

      obj.elems[i - 1].circ = vert;
    }
  }

  // Draw second circle
  var circle = drawCircles(obj.elems[obj.elems.length - 2], obj.elems[obj.elems.length - 1]).circ2;
  obj.elems[obj.elems.length - 1].circ = circle;
}

// Draw circs
function drawCircles(p1, p2) {
  // Get p1
  var p1 = p1.point;

  // Get p2
  var p2 = p2.point;

  // Get vector from p1 to p2
  var v = [p2.x - p1.x,
    p2.y - p1.y,
    p2.z - p1.z,
    0.0,
    0.0,
    0.0
  ];

  // Calculate normal vector
  var n = normal(v, radius);

  // Calculate cross vector
  var p = crossProduct(v, n);

  // Get vectors magnitude. Then calculate unit vectors
  var s1 = magnitude(n);
  var s2 = magnitude(p);

  var u1 = [n[0] / s1, n[1] / s1, n[2] / s1];
  var u2 = [p[0] / s2, p[1] / s2, p[2] / s2];

  // Calculate circs
  var circ1 = [];
  var circ2 = [];

  var deg = 360;
  var angleBetweenPnts = deg / sides;

  for (var i = 0; i < 360; i += angleBetweenPnts) {
    var d = Math.PI / 180;
    var angle = i * d;
    // Calculate vector direction
    var direction = [radius * (Math.cos(angle) * u1[0] + Math.sin(angle) * u2[0]),
      radius * (Math.cos(angle) * u1[1] + Math.sin(angle) * u2[1]),
      radius * (Math.cos(angle) * u1[2] + Math.sin(angle) * u2[2])
    ]
    circ1.push(new coord(p1.x + direction[0], p1.y + direction[1], p1.z + direction[2], 0.0, 0.0, 1.0));
    circ2.push(new coord(p2.x + direction[0], p2.y + direction[1], p2.z + direction[2], 0.0, 0.0, 1.0));
  }

  return {
    circ1: circ1,
    circ2: circ2
  };
}

//================== Math Functions ===========================================

// Calculate the normal
function normal(vec, len) {
  var l = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2) + Math.pow(vec[2], 2));
  var u = (vec[1] * len) / l;
  var v = (-vec[0] * len) / l;
  var norm = [u, v, 0];

  //console.log("Normal: ", norm);
  return norm;

}

// Calculate the cross product
function crossProduct(v1, v2, normal) {
  var cp = [(v1[1] * v2[2] - v2[1] * v1[2]), -(v1[0] * v2[2] - v2[0] * v1[2]),
    (v1[0] * v2[1] - v2[0] * v1[1])
  ];

  //console.log("Cross product: ", cp);
  return cp;
}

// Calculate magnitude of vector
function magnitude(vec) {
  var sum = 0;

  for (var i = 0; i < vec.length; i++) {
    sum += Math.pow(vec[i], 2);
  }

  var mag = Math.sqrt(sum);

  //console.log("Magnitude: ", mag);
  return mag;
}

// Clear canvas
function clearScreen() {
  console.log('clearing...');
  location.reload();
}

//=============== Objects =====================================================

// coord object
function coord(x, y, z, r, g, b) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.r = r;
  this.g = g;
  this.b = b;
}

// cylinder object
function cylinder(coord) {
  this.point = coord;
  this.circ = null;
}

var polyLines = [],
  active_object = -1,
  mouse_point = {
    x: 0.0,
    y: 0.0,
    z: 0.0
  }

// ========================= File Functions ===================================

// Read from file
function readSOR() {
  var SORC = readFile();
  polyLines = [];
  for (var i = 0; i < SORC.length; i++) {
    var vertices = SORC[i].vertices;
    var indexes = SORC[i].indexes;

    var v = [],
      l = [];

    for (var j = 0; j < vertices.length; j += 3) {
      v.push(vertices[j]);
      v.push(vertices[j + 1]);
      v.push(vertices[j + 2]);
      v.push(0.0);
      v.push(0.0);
      v.push(1.0);
    }

    // Write vertices into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);

    // Draw points
    gl.drawArrays(gl.POINTS, 0, v.length / 6);

    for (var j = 0; j < indexes.length; j += 12) {
      // Point 1
      l.push(indexes[j]);
      l.push(indexes[j + 1]);
      l.push(indexes[j + 2]);
      l.push(1.0);
      l.push(0.0);
      l.push(1.0);

      // Point 2
      l.push(indexes[j + 3]);
      l.push(indexes[j + 4]);
      l.push(indexes[j + 5]);
      l.push(1.0);
      l.push(0.0);
      l.push(1.0);

      // Point 2
      l.push(indexes[j + 6]);
      l.push(indexes[j + 7]);
      l.push(indexes[j + 8]);
      l.push(1.0);
      l.push(0.0);
      l.push(1.0);

      // Point 2
      l.push(indexes[j + 9]);
      l.push(indexes[j + 10]);
      l.push(indexes[j + 11]);
      l.push(1.0);
      l.push(0.0);
      l.push(1.0);
    }

    // Write vertices into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(l), gl.STATIC_DRAW);

    var len = l.length / 6;
    // Draw points
    gl.drawArrays(gl.LINE_STRIP, 0, len);

  }
}

// Save to file
function saveSOR() {
  var SORC = [];
  var name = 'model';
  // Each object
  for (var i = 0; i < polyLines.length; i++) {
    if (polyLines[i].ended) {
      var pts = [];
      var inds = [];

      for (var j = 0; j < polyLines[i].elems.length; j++) {
        for (var k = 0; k < polyLines[i].elems[j].circ.length; k++) {
          pts.push(polyLines[i].elems[j].circ[k]);
        }
      }

      for (var j = 1; j < polyLines[i].elems.length; j++) {
        for (var k = 0; k < polyLines[i].elems[j].circ.length; k++) {
          if (k == polyLines[i].elems[j].circ.length - 1) {
            inds.push(polyLines[i].elems[j].circ[k]);
            inds.push(polyLines[i].elems[j - 1].circ[k]);
            inds.push(polyLines[i].elems[j - 1].circ[0]);
            inds.push(polyLines[i].elems[j].circ[0]);
            inds.push(polyLines[i].elems[j].circ[k]);
          } else {
            inds.push(polyLines[i].elems[j].circ[k]);
            inds.push(polyLines[i].elems[j - 1].circ[k]);
            inds.push(polyLines[i].elems[j - 1].circ[k + 1]);
            inds.push(polyLines[i].elems[j].circ[k + 1]);
            inds.push(polyLines[i].elems[j].circ[k]);
          }
        }
      }

      var sor = new SOR(name + '_' + i, [], []);
      for (var j = 0; j < pts.length; j++) {
        sor.vertices.push(pts[j].x);
        sor.vertices.push(pts[j].y);
        sor.vertices.push(pts[j].z);
      }

      for (var j = 0; j < inds.length; j++) {
        sor.indexes.push(inds[j].x);
        sor.indexes.push(inds[j].y);
        sor.indexes.push(inds[j].z);
      }
      SORC.push(sor);
    }
  }
  saveFile(SORC, name);
}

//================= EXTRA CREDIT FUNCTIONS ===================================

function changeRadSize() {
  radius = radSize.value;
  console.log("The radius is: ", radius);
}

function changeNumofSides() {
  sides = changeSides.value;
  console.log("The number of sides is: ", sides);
}

// Insert new cylinder into active object or create new object
function multPolyLines(coords, ends, gl) {
  var first = false;

  // Check if there's an active object
  if (active_object === -1) {
    polyLines.push({
      ended: false,
      elems: [],
      g_points: [],
      g_indexes: []
    });

    active_object = polyLines.length - 1;
    first = true;
  }

  // Create point
  var point = new coord(coords.x, coords.y, coords.z, 0.0, 0.0, 0.0);
  polyLines[active_object].elems.push(new cylinder(point));

  if (ends && !first) {
    polyLines[active_object].ended = true;

    drawCylinder(polyLines[active_object]);

    active_object = -1;
  }

  return (ends && !first);
}