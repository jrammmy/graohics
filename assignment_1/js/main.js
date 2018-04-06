// Vertex shader program
let VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'void main() {\n' +
	'  gl_Position = a_Position;\n' +
	'  gl_PointSize = 10.0;\n' +
	'}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n' +
  '}\n';

// Program vars
let canvas,
	gl,
	a_position,
	u_Frag,
	polylines = [],
	active_polyline = -1,
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
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

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

function click(event) {
	let coords;
	switch (event.button) {
		case 0:
			// Left click
			coords = newPoint(event, {}, false);
			leftClick(coords);
			break;
		case 2:
			// Right click
			coords = newPoint(event, {}, true);
			rightClick(coords);
			break;
		default:
			break;
	}
}

function leftClick(coords) {
	console.log("Left click detected at [", coords.x, ", ", coords.y, "].");
	draw();
}

function rightClick(coords) {
	console.log("Right click detected at [", coords.x, ", ", coords.y, "].");
	draw();
}

function move(event) {
	// Mouse coordinates
	let x_mouse = event.clientX;
	let y_mouse = event.clientY;

	// Canvas positioning
	let rect = event.target.getBoundingClientRect();

	// Draw coordinates
	mouse_point.x = ((x_mouse - rect.left) - canvas.width / 2) / (canvas.width  / 2);
	mouse_point.y = (canvas.height / 2 - (y_mouse - rect.top)) / (canvas.height / 2);

	// Draw
	draw();
}

function newPoint(event, color, ends) {
	// Mouse coordinates
	let x_mouse = event.clientX;
	let y_mouse = event.clientY;

	// Canvas positioning
	let rect = event.target.getBoundingClientRect();

	// Draw coordinates
	let x_draw = ((x_mouse - rect.left) - canvas.width / 2) / (canvas.width  / 2);
	let y_draw = (canvas.height / 2 - (y_mouse - rect.top)) / (canvas.height / 2);

	// If no active polyline
	if (active_polyline === -1) {
		// Add new polyline and set active
		polylines.push({
			ended: false,
			points: []
		});
		active_polyline = polylines.length - 1;
	}

	// Add point to polyline
	polylines[active_polyline].points.push({
		x: x_draw,
		y: y_draw,
		c: color
	});

	// If last point of polyline
	if (ends) {
		// Finish polyline and set no active one
		polylines[active_polyline].ended = true;
		active_polyline = -1;
	}

	return {
		x: x_draw,
		y: y_draw
	};
}

function drawPolyline(lineObj) {
	// Retrieve vertex set, color set and count
	let vertex_set = [];
	let color_set = [];
	let vertex_count;

	for (vertex_count = 0; vertex_count < lineObj.points.length; vertex_count++) {
		vertex_set.push(lineObj.points[vertex_count].x);
		vertex_set.push(lineObj.points[vertex_count].y);

		color_set.push(lineObj.points[vertex_count].c);
	}

	if (vertex_count > 0) {
		// Write vertex into buffer
	  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_set), gl.STATIC_DRAW);

		// Draw points
		gl.drawArrays(gl.POINTS, 0, vertex_count);

		// If line is not finished
		if (!lineObj.ended) {
			// Add mouse location
			vertex_set.push(mouse_point.x);
			vertex_set.push(mouse_point.y);
			vertex_count++;

			// Write vertex into buffer
	  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_set), gl.STATIC_DRAW);
		} else {

		}

		// Draw lines
		gl.drawArrays(gl.LINE_STRIP, 0, vertex_count);
	}

	return vertex_count
}

function draw() {
	for (let i = 0; i < polylines.length; i++) {
		drawPolyline(polylines[i]);
	}

	return polylines.length;
}

function clearCanvas() {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
