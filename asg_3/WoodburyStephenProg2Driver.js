//*******************************************************************************************************
//                                          SHADERS
//*******************************************************************************************************
// Vertex shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +                  //Creating an attrib vec4 var named a_Position
  'attribute vec4 a_Color;\n' +                     //Creating an attrib vec4 var named a_Color
  'attribute vec4 a_Normal;\n' +
  'varying vec4 v_Normal;\n' +
  'uniform mat4 u_ProjMatrix;\n' +                  //Creating a uniform mat4 var named u_ProjMAtrix
  'varying vec4 v_Color;\n' +                       //Creating a varying vec4 var named v_Color
  'void main() {\n' +                               //our main function start
  '  gl_Position = u_ProjMatrix * a_Position;\n' +  //setting gl position ->u_Proj...*a_Pos...                      //setting v_Color->a_Color
  '  v_Color = a_Color;\n' +
  '  v_Normal = a_Normal;\n' +
  '}\n';

// Fragment shader
var FSHADER_SOURCE =                  
  '#ifdef GL_ES\n' +                                //if GL_ES not defined
  'precision mediump float;\n' +                    //define precision?
  '#endif\n' +                                      //end if
  'varying vec4 v_Color;\n' +                       //Creating a varying vec4 var named v_Color, links to v_Color in vertex shader
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
  'void main() {\n' +                               //our main function start
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



//*******************************************************************************************************
//                                        GLOBAL DATA
//*******************************************************************************************************
  //Data to hold information related to our poly-line spine
  var linePoints = [];            //Storing spine points
  var RCPoints = [];              //Storing spine points Created on a LC
  var LCPoints = [];              //Storing spine points Created on a RC

  //Data to hold our Cylinder Base Information
  var shapes = [];                //Storing Cylinder base information before mergeDisjoints            
  var shapes2 = [];               //Storing Cylinder base information after mergeDisjoints

  //Data to hold our index Information
  var indices = [];               //Stores our Index information in Vec3 form
  var indexHolder;                //Stores our Index information one element at a time
  var indexHolderWON;             //Like indexHolder, but doesn't store any index information for normals

  //Data to hold our vertex Information
  var vertices = [];              //Stores our Vertex information in vec3 form
  var vertexHolder;               //Stores our Vertex information one element at a time
  var vertexHolderWON;            //Like vertexHolder, but doesn't store any vertex information for normals

  //Data to hold our Color Information
  var colors = [];                //Stores our Color information in vec3 form
  var colorHolder;                //Stores our Color information one element at a time
  
  //Data to hold our Normal Information
  var normals = [];               //Stores our Normal information in vec3 form
  var normalHolder = [];          //Holds our Std flat shat shading normals per vertex
  var smoothNormalHolder = [];    //Holds our averaged normals for smooth shading
  var vNormalHolder;              //Holds our normal array for the vertex shader

  //Extra Data
  var toggleNormals = false;      //Our Boolean control variable for deciding whether to display normals or not. 
  var smooth = false;             //Our Boolean control variable for deciding whether to display smooth or flat shading
  var ambient = true;             //our Boolean control vartiable for deciding whether to display with ambient lighting or not
  var specular = false;
  var glossFactor = 1.0;



//*******************************************************************************************************
//                                        MAIN
//*******************************************************************************************************
function main() 
{
  var canvas, gl, a_Position, a_Color;

  // Retrieve <canvas> element by name
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  // Getting location of Attribute Variable a_Position and storing inside local Variable: a_Position
  // This allows the use of the location of WEBGL's a_Position through the local Variable: a_Position
  // to send Vertex Locations to the Vertex_Shader.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) 
  {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  //Call screenRefreshLines, a function to clear the canvas and to draw our polylines if we've any vertices. 
  //Details for screenRefreshLines are given below, including details on the arguments. 
  screenRefreshLines(gl, a_Position, 0);

  // Register function (event handler) to be called on a mouse press(Left, Right, or otherwise) : this is also the function where if you right click, cylinder generation will start from here
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position, a_Color); };

  // Register function (event handler) to be called on a mouse move
  canvas.onmousemove = function(ev){ move(ev, gl, canvas, a_Position); };
}



//*******************************************************************************************************
//                                        PRIMARY FUNCTIONS
//*******************************************************************************************************
function setUpOpenGL(gl)
{
  //Set up file input
  setupIOSOR("fileName");

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
  {
    console.log('Failed to intialize shaders.');
    return;
  }

  initializeVertexFragmentBuffers(gl);

  setUpProjMat(gl);

  var KsI = gl.getUniformLocation(gl.program, 'KsI');
  if (!KsI) 
  {
    console.log('Failed to get the storage location of KsI');
    return -1;
  }

  if(specular == true)
  {
    gl.uniform4f(KsI, 0.0, 0.577, 0.0, 0.0);
  }
  else
  {
    gl.uniform4f(KsI, 0.0, 0.0, 0.0, 0.0);
  }

  var ambient_Color = gl.getUniformLocation(gl.program, 'ambient_Color');
  if (!ambient_Color) 
  {
    console.log('Failed to get the storage location of ambient_Color');
    return -1;
  }

  if(ambient == true)
  {
    gl.uniform4f(ambient_Color, 0.0, 0.0, 0.2, 0.0);
  }
  else
  {
    gl.uniform4f(ambient_Color, 0.0, 0.0, 0.0, 0.0);
  }

  var nS = gl.getUniformLocation(gl.program, 'nS');
  if (!nS) 
  {
    console.log('Failed to get the storage location of nS');
    return -1;
  }

  gl.uniform1f(nS, glossFactor);
}


/* click(event, gl, element, location) 
     event - Event object, stores mouse location info
     gl - rendering context
     element - Specifies canvas element
     location - location of an Attribute Variable in WEBGL's System

   Notes: Function used to handle when the user clicks the canvas (right, left, or otherwise)
   The function determines if the mouse click was a left or right click or otherwise and 
   performes specific actions respectively.
   LC: Updates LCPoints array, echos location
   RC: Updates RCPoints array, echos location, prevents dialog box, prints coord of finished polyline, generates cylinders from spine, print normal vector information
   all: updated linePoints array using converted coordinates, draws line as it stands. If there is a complete polyline/cylinder, any click will reset everything
*/
function click(ev, gl, canvas, a_Position, a_Color) 
{
  //Determining if there is a complete polyline already. If so, if you click, clear everything for a new polyline
  if(RCPoints.length > 0)
  {
    resetProg(gl, a_Position);
  }
  else if(linePoints.length > 0 || ev.button != 2)
  {
    var tempLPExpHolder = []; //used for holding the expanded version of linePoints, for easier conversion to a typed array for the vertex shader.
    var n = 0; //n here is used to represent the size of the LP Array, the num of vertices to draw lines between. 

    //Converting coordinates passed into function. Canvas -> WEBGL
    var x = calculateWEBGLXCoordinate(ev, canvas);
    var y = calculateWEBGLYCoordinate(ev, canvas);

    // Store the coordinates to linePoints array on LC or RC
    if(ev.button != 1)
    {
      linePoints.push([x,y]);
    }

    // Set n, the number of vertices to draw lines between
    n = linePoints.length;

    // Filling tempLPExpHolder with expanded version of coord's in linePoints, for conversion to a typed array for the vertex shader.
    for(var i = 0; i < (linePoints.length*2); i+=2)
    {
      tempLPExpHolder[i] = linePoints[i/2][0];
      tempLPExpHolder[i+1] = linePoints[i/2][1];
    }

    // Create a Float32Array from linePoints(WEBGL needs typed arrays)
    vertexHolder = Float32Array.from(tempLPExpHolder); 

    // Write data(vertices) into the buffer object at target gl.ARRAY_BUFFER. 
    gl.bufferData(gl.ARRAY_BUFFER, vertexHolder, gl.STATIC_DRAW);

    // Assign the buffer object to a_Position variable(a_Position, Specify how many numbers are to be read from the buffer per vertex(2) 
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Call screenRefreshLines function to clear canvas and draw our known lines.
    screenRefreshLines(gl, a_Position, n);
    
    // Determine if the mouse button clicked is the left mouse button
    if(ev.button == 0)
    {
      //Update LCPoints array
      LCPoints.push(x);
      LCPoints.push(y);

      //Echo Click Location
      console.log('Left Click Mouse Position(WebGL Coordinates): (' + x + ', ' + y + ')');
    }
    //Determine if Mouse button pressed is the right mouse button
    else if(ev.button == 2)
    {
      //Disable Dialog box
      canvas.addEventListener('contextmenu', function(ev) 
      {
        {
          ev.preventDefault();
          return false;
        }
      }, false);

      // Update RCPoints Array
      RCPoints.push(x);
      RCPoints.push(y);

      // Echo Click Location
      console.log('Right Click Mouse Position(WebGL Coordinates): (' + x + ', ' + y + ')');

      // Read off all vertices that make up the now completed polyline.
      console.log('Polyline Completed, Printing List of Coordinates for Polyline: ');

      for(var i = 0; i < (linePoints.length); i += 1)
      {
        console.log('(' + linePoints[i][0] + ', ' + linePoints[i][1] + ')');
      }

      //update console
      console.log('Now generating a SOR...');

      generateCylinder(a_Position, gl, a_Color);   //once we're done creating our spine of polyline, create and draw our cylinders.
    }
    //Determine if a mouse click event was triggered but the button pushed wasn't right or left
    else
    {
      console.log('Error Recognizing click Trigger');
      return -1;
    }
  }
}


/* move(event, gl, element, location) 
     event - Event object, stores mouse location info
     gl - rendering context
     element - Specifies canvas element
     location - location of an Attribute Variable in WEBGL's System

   Notes: Function called whenever the user moves their mouse cursor on the canvas. 
   If the poly line is not yet completed and if there is at least one point in the poly line,
   then the function will take the currently known points of the poly line and it will take
   the mouse position(not a confirmed clicked point) and draws line segments between all of
   those locations. Since the mouse position(not confirmed) isn't stored in the linePoints
   array, the next time the cursor moves, that point will have been forgotten. The canvas will
   have been cleared, and the lines will have been redrawn (with a new mouse position), creating
   the illusion of a rubberbanding line. 
*/
function move(ev, gl, canvas, a_Position)
{
  //Determine if the polyline is not completed and if there is at least one point in the polyline.
  if(RCPoints.length == 0 && (linePoints.length) > 0)
  {
    var tempLPExpHolder = []; //used to hold expanded version of LP and of the extra mouse location
    var n;  //n here is used to represent the number of verts that need connectuions drawn between them

    //Converting coordinates passed into function. Canvas -> WEBGL
    var x = calculateWEBGLXCoordinate(ev, canvas);
    var y = calculateWEBGLYCoordinate(ev, canvas);
    
    //Expand LP into tempLPExpHolder
    for(var i = 0; i < (linePoints.length*2); i+=2)
    {
      tempLPExpHolder[i] = linePoints[i/2][0];
      tempLPExpHolder[i+1] = linePoints[i/2][1];
    }

    // Take the mouse position Vertex, and push it to the temp array. 
    tempLPExpHolder.push(x); 
    tempLPExpHolder.push(y);

    // Create a Float32Array from tempLPExpHolder(WEBGL needs typed arrays)
    vertexHolder = Float32Array.from(tempLPExpHolder); 

    //set n, the num of verts to drawn lines between
    n = ((tempLPExpHolder.length) / 2)

    // Write data(vertices) into the buffer object at target gl.ARRAY_BUFFER. Specify Usage(DYNAMIC_DRAW) for efficiency
    gl.bufferData(gl.ARRAY_BUFFER, vertexHolder, gl.STATIC_DRAW);

    // Assign the buffer object to a_Position variable(a_Position, Specify how many numbers are to be read from the buffer per vertex(2) 
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Call screenRefreshLines function to clear canvas and draw our known lines + mouse position(unconfirmed)
    screenRefreshLines(gl, a_Position, n);
  }
} 


/* generateCylinder(a_Position, gl) 
     location - location of an Attribute Variable in WEBGL's System
     gl - rendering context

   Notes: Function when called creates a series of circular surfaces rotated around our spine points
          12 pts per circular surface. Once completed, the function then merges disjoint circular bases.
          Afterwards, drawCylinderObjects() is called. 
*/
function generateCylinder(a_Position, gl, a_Color)
{
  var radius = .1;  //5% of the smallest dimension of the canvas (2*.05 = .1 : WEBGL Coordinates range from -1 to 1 on either axis, scales to given dimensions)
  var arbitraryMat; //Set later as a tool for helping to rotate a vector
  var translateMat; //Set later as a tool for helping to translate a vector
  var combinedMat;  //Set later as a supertool for both translating and rotating a vector
  var resultVector; //Set later to hold a rotated and translated point that needs adding to our surface
  var surface;      //surface array to store our coord's per circle surface (one circle per surface array, later pushed in shapes array once surface pts are generated)
  var pointVector;  //will be used for our initial vector (spine pt's x,y coord's with a z value equal to radius)
  var axisVector;   //Will later be set to hold a vector representation of an axis of rotation, used for generating rotated points of each base of a cylinder, pre-joining.

  //iterate through each line/spine
  for(var i = 1; i < linePoints.length; i++)
  {
    //create our axisVector
    axisVector = new Vector3([linePoints[i-1][0] - linePoints[i][0], linePoints[i-1][1] - linePoints[i][1], 0]);

    //Decides which surface to construct (first pt surface, then second pt surface)
    for(var j = 0; j < 2; j += 1)
    {
      surface = []; //used to store our coord's per cylinder base, specifically circular bases (before merging disconnects)

      //used in relation to for loop directly above, will generate a pointVector based on which surface we're working with
      if(j == 0)
      {
        pointVector = new Vector3([linePoints[i-1][0], linePoints[i-1][1], radius]);
      }
      else
      {
        pointVector = new Vector3([linePoints[i][0], linePoints[i][1], radius]);
      }

      //push our initial vector (defined above) onto our surface array
      surface.push(pointVector);

      //this for loop generates 22 different points (first already generated for us)
      for(var k = 0; k < 11; k++)
      {
        arbitraryMat = new Matrix4();   //used as a tool for rotation
        translateMat = new Matrix4();   //used as a tool for translation

        translateMat.translate(pointVector.elements[0], pointVector.elements[1], 0);    //specifies the translation to be made when a vector is multiplied to this matrix
        arbitraryMat.rotate((30*(k+1)), axisVector.elements[0], axisVector.elements[1], axisVector.elements[2]);  //specifies the rotation to be made when a vector is multiplied to this matrix
       
        combinedMat = translateMat.multiply(arbitraryMat);  //This is s super tool matrix, where when a vector is multiplied to this matrix, it is translated and rotated as specified by arbMat and tranMat.
        resultVector = combinedMat.multiplyVector3(new Vector3([0,0,radius])); //creating a pt needed for our surface with the comMat
        
        surface.push(resultVector);   //once our pt is generated, push it onto our surface array
        surface.push(resultVector);
      }
      surface.push(pointVector);

      //once all 12 pts are on the surface array, push surface array onto shapes array (global)
      shapes.push(surface);
    }
  }

  //once our shapes array is completed, call mergeDisjoints() to merge disconnected cylinder bases together, new shapes array is now shapes2
  mergeDisjoints();

  //once all surfaces are generated (bases of cylinders), call the function that creates our indices, fills our buffers, and ultimately draws our cylinders. 
  drawCylinderObjects(a_Position, gl, a_Color);
}


/* drawCylinderObjects(a_Position, gl) 
     location - location of an Attribute Variable in WEBGL's System
     gl - rendering context

   Notes: Function when called will load up our vertices array for the vertex buffer and it will create our indices array linking up each base of our cylinders.
          Our normals are also calculated from this function. Once complete, our cylinders are then drawn through calling screenRefreshCylinders.
*/
function drawCylinderObjects(a_Position, gl, a_Color) 
{
  var n;          //n in this function will represent the number of vertices that need lines drawn between them inside indexHolder. 
  var tempNormalHolder = [];

  //Pushing vertices(expanded) onto temp array
  for(var i = 0; i < shapes2.length; i++)
  {
    for(var j = 0; j < shapes2[i].length; j++)
    {
      vertices.push(shapes2[i][j].elements[0]);
      vertices.push(shapes2[i][j].elements[1]);
      vertices.push(shapes2[i][j].elements[2]);
    }
    console.log('s2 length: ' + shapes2.length + ', shapes2 @' + i + ' length: ' + shapes2[i].length);
  }

  //creating indices, storing inside the indices array, generating normals
  //iterating through each surface
  for(var i = 0; i < (shapes2.length-1); i+=2)
  {
    //iterating through each pt of surface i
    for(var j = 0; j < shapes2[i].length; j+=2)
    {
        generateNormal(i, j, 0);   //generates the normal of our surface currently being created - This is Not yet fully functioning, so consider this Experimentation

        indices.push((24*(i+1))+j);       //24 : 26 : 28 for i=0 -> 72 for i=2
        indices.push(j+(24*i));         //0  : 2  : 4  for i=0 -> 48 for i=2
        indices.push(j+(24*i)+1);         //1  : 3  : 5  for i=0 -> 49 for i=2
        indices.push((24*(i+1))+j);       //24 : 26 : 28 for i=0 -> 72 for i=2
        indices.push((24*(i+1))+j+1);       //24 : 26 : 28 for i=0 -> 72 for i=2
        indices.push(j+(24*i)+1);         //1  : 3  : 5  for i=0 -> 49 for i=2
    }
  }

  vertexHolderWON = Float32Array.from(vertices);
  indexHolderWON = Uint16Array.from(indices);
  //TESTING NORMAL VECTOR CREATION - UNCOMMENT TO VIEW NORMALS FOR A NEW CYLINDER (NOT LOADED)

  enableNormals();

  if(smooth == true)
  {
    generateSmoothColor(shapes2.length, vertices.length);
  }
  else
  {
    generateFlatColor(shapes2.length, vertices.length);
  }

  //n here represents the number of vertices that need lines drawn between them
  n = indices.length;

  console.log('n length inside drawCyl: ' + indices.length);

  //create Uint16Array from indices (for index Buffer Compatibility)
  indexHolder = Uint16Array.from(indices);

  //create Float32Array from temp (for vertexBuffer Compatibility)
  vertexHolder = Float32Array.from(vertices);

  //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

  bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');

  if(smooth == true)
  {
    for(var i = 0; i < smoothNormalHolder.length; i++)
    {
      tempNormalHolder.push(smoothNormalHolder[i].elements[0]);
      tempNormalHolder.push(smoothNormalHolder[i].elements[1]);
      tempNormalHolder.push(smoothNormalHolder[i].elements[2]);
    }
  }
  else
  {
    for(var i = 0; i < normalHolder.length; i++)
    {
      tempNormalHolder.push(normalHolder[i].elements[0]);
      tempNormalHolder.push(normalHolder[i].elements[1]);
      tempNormalHolder.push(normalHolder[i].elements[2]);
    }
  }

  var normalNormalsNum = (vertexHolder.length - tempNormalHolder.length) / 3;

  for(var i = 0; i < normalNormalsNum; i++)
  {
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
  }

  vNormalHolder = Float32Array.from(tempNormalHolder);
  bufferIntoVertexArray(gl, vNormalHolder, 3, gl.FLOAT, 'a_Normal');

  bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');

  var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

  console.log('Size: ' + SIZE);

  SIZE = SIZE * indexHolderWON.length

  console.log('Size: ' + SIZE);
  // Clears screen (color and depth) and draws out our cylinders. 
  screenRefreshCylinders(gl, a_Position, n, indexHolderWON.length, SIZE)
}


/* saveSOR() 

   Notes: Function saves our SOR into an object Blob file with a given name. 
*/
function saveSOR()
{
  //Get name user wants to save file under.
  var fileName = prompt("Please enter a fileName", "obj.txt");

  //Save our file
  if (fileName != null) 
  {
    //   Desc: This function translates the SOR Object into a downloadable blob
    saveFile(new SOR(fileName, vertexHolderWON, indexHolderWON));
  }
}


/* readSOR() 

   Notes: Read in a blob file selected by the user and display it 
*/
function readSOR()
{
  //read in fileName (call readFile() function from ioSOR.js). Store our blob inside SORobj
  var SORObj = readFile();
  var n;  //n in this function will represent the number of vertices that need lines drawn between them inside indexHolder. 
  var canvas = document.getElementById('webgl');   // Retrieve <canvas> element by name
  var a_Position; //Used later for holding location of vertex shader's a_Position.
  var tempCol = [];
  var surface = [];
  var ptholder;
  var tempNormalHolder = [];

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);
  resetProg(gl);

  linePoints.push([0,0]); //to ensure you can toggle between lighting options

  //allocate data to vertices and indexHolder of our SOR. 
  vertices = Array.from(SORObj.vertices);
  indices = Array.from(SORObj.indexes);

  //Rebuilding our shapes2 array
  for(var i = 0; i<((vertices.length)/72); i++)
  {
    surface = [];
    for(var j = 0; j < (72); j+=3)
    {
      ptHolder = new Vector3([vertices[(i*72)+j],vertices[(i*72)+j+1],vertices[(i*72)+j+2]]);
      surface.push(ptHolder);
    }
    shapes2.push(surface);
  }

  //creating indices, storing inside the indices array, generating normals
  //iterating through each surface
  for(var i = 0; i < (shapes2.length-1); i+=2)
  {
    var counter = 0;  //used for determining when we are creating the last surface of a cylinder between two cylinder bases (different math required).

    //iterating through each pt of surface i
    for(var j = 0; j < shapes2[i].length; j+=2)
    {

      //If this is not the last surface of a cylinder, do this
      if(counter < 11)
      {
        generateNormal(i, j, 0);   //generates the normal of our surface currently being created - This is Not yet fully functioning, so consider this Experimentation

        counter++;
      }
      //do this if you're generating the last surface of a cylinder.
      else
      {
        generateNormal(i, j, 1);   //generates the normal of our surface currently being created - This is Not yet fully functioning, so consider this Experimentation
      }
    }
  }

  indexHolderWON = Uint16Array.from(indices);

  enableNormals(vertices);

  if(smooth == true)
  {
    generateSmoothColor((vertices.length  / 72), vertices.length);
    for(var i = 0; i < smoothNormalHolder.length; i++)
    {
      tempNormalHolder.push(smoothNormalHolder[i].elements[0]);
      tempNormalHolder.push(smoothNormalHolder[i].elements[1]);
      tempNormalHolder.push(smoothNormalHolder[i].elements[2]);
    }
  }
  else
  {
    generateFlatColor((vertices.length  / 72), vertices.length);
    for(var i = 0; i < normalHolder.length; i++)
    {
      tempNormalHolder.push(normalHolder[i].elements[0]);
      tempNormalHolder.push(normalHolder[i].elements[1]);
      tempNormalHolder.push(normalHolder[i].elements[2]);
    }
  }

  for(var i = 0; i < colors.length; i++)
  {
    tempCol.push(colors[i].elements[0]);
    tempCol.push(colors[i].elements[1]);
    tempCol.push(colors[i].elements[2]);
  }

  vertexHolder = Float32Array.from(vertices);

  indexHolder = Uint16Array.from(indices);

  n = indexHolder.length;

  var templen = vertexHolder.length - tempCol.length;
  console.log('ver length: ' + vertexHolder.length + ', tempClen: ' + tempCol.length + ', collen: ' + colors.length);

  for(var i = 0; i < templen; i+=3)
  {
    tempCol.push(1.0);
    tempCol.push(0.0);
    tempCol.push(0.0);
  }

  //create Float32Array from temp (for vertexBuffer Compatibility)
  colorHolder = Float32Array.from(tempCol);

  var normalNormalsNum = (vertexHolder.length - tempNormalHolder.length) / 3;

  for(var i = 0; i < normalNormalsNum; i++)
  {
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
  }

  vNormalHolder = Float32Array.from(tempNormalHolder);
  bufferIntoVertexArray(gl, vNormalHolder, 3, gl.FLOAT, 'a_Normal');

  bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');
  bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');

  //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

  var SIZE = indexHolderWON.BYTES_PER_ELEMENT * indexHolderWON.length;

  console.log('Size: ' + SIZE);
  // Clears screen (color and depth) and draws out our cylinders. 
  screenRefreshCylinders(gl, a_Position, n, indexHolderWON.length, SIZE);

  RCPoints.push(0.0);     //To ensure move function doesn't freak out
}



//*******************************************************************************************************
//                                        SECONDARY/HELPER FUNCTION
//*******************************************************************************************************
function resetProg(gl, a_Position)
{
    linePoints = []; // Array of coordinates for the polyline that is not completed
                         // Note: Just LCPoints could have been used, but an intended feature in the future 
                         // is the Ability to draw multiple polylines. This array becomes necessary there.
    RCPoints = [];   // Array for right click mouse positions
    LCPoints = [];   // Array for left click mouse positions
    shapes = [];     // Array for storing Cylinder Circle Bases
    shapes2 = []     // Array for Cylinder Surgaces from shapes, but the disjoint surfaces are now merged. Used for when shapes is complete.
    vertices = [];
    indices = [];    // Array for storing what connections to make between what verts in the vertex Buffer 
    normals = [];    // Used to store normal line points, two pts. per normal. 
    colors = [];
    smoothNormalHolder = [];
    normalHolder = [];
    initializeVertexFragmentBuffers(gl);
    screenRefreshLines(gl, a_Position, 0);
}


/* initializeBuffersandShaders(gl) 
     gl - rendering context

   Notes: Function made for ease of initilizing shaders and for creating buffers for both importing SORs and generating new SORs. 
*/
function initializeVertexFragmentBuffers(gl)
{
  //Creating a Buffer for vertices inside the WEBGL System. 
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  //Creating a Buffer for indices inside the WEBGL System. 
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target, ie, state that the Vertex_Buffer will hold Vertex Locations
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Bind the buffer object to target, ie, state that the Element_Array_Buffer will hold what the indices(Vertices to connect)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
}


function setUpProjMat(gl)
{
  // Create the matrix to set the eye point, and the line of sight
  var projMatrix = new Matrix4();
  var u_ProjMatrix;

  // get the storage location of u_ProjMatrix
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) 
  { 
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }

  // Specify the viewing volume
  projMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

  // Pass the projection matrix to u_ProjMatrix
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
}


/* mergeDisjoints() 

   Notes: Function made for filling the shapes2 array with cylinder-surfaces that are joined when applicable. 
*/
function mergeDisjoints()
{
  var pointNum = 1;   //Used for keeping track of pt. Number for merging bases
  var axisVector1;    //Used as a vector represenation of different aor's. 
  var axisVector2;    //Used as a vector represenation of different aor's. 
  var newSurfacePoint; //Used to store new Surface Pts being generated in Vector Form
  var m1, b1, m2, b2, x, y; //Used for calculating specifics of merging surfaces

  //push first surface onto shapes2 array as we aren't merging the ends
  shapes2.push(shapes[0]);

  //iterating through second shape to third to last shape, for merging
  for(var i = 1; i < (shapes.length-2); i+=2)
  {
    var newSurface = [];

    //create our axisVector1 - first surface
    axisVector1 = new Vector3([linePoints[pointNum-1][0] - linePoints[pointNum][0], linePoints[pointNum-1][1] - linePoints[pointNum][1], 0]);

    //create our axisVector2 - second surface
    axisVector2 = new Vector3([linePoints[pointNum][0] - linePoints[pointNum+1][0], linePoints[pointNum][1] - linePoints[pointNum+1][1], 0]);

    //iterating through points of each shape(s)
    for(var j = 0; j<shapes[i].length; j++)
    {
      //first surface workings
      m1 = ( axisVector1.elements[1] / axisVector1.elements[0] );
      b1 = shapes[i][j].elements[1] - (  m1 * shapes[i][j].elements[0] );

      //second surface workings
      m2 = ( axisVector2.elements[1] / axisVector2.elements[0] );
      b2 = shapes[i+1][j].elements[1] - (  m2 * shapes[i+1][j].elements[0] );

      //intersection calculations
      x = ((b2 - b1) / (m1 - m2))
      y = (((m1*b2)-(m2*b1)) / (m1-m2))

      //intersectionVectorCreation
      newSurfacePoint = new Vector3([x,y,shapes[i][j].elements[2]]);

      //Once our new surfacePt is generated, push it onto our currently generating Surface array.
      newSurface.push(newSurfacePoint);
    }

    //once all pts of a surface are generated, push it onto our shapes2 array
    shapes2.push(newSurface);
    shapes2.push(newSurface);

    //increment the spine point number we're working with
    pointNum++;
  }

  //push last surface onto shapes2 array as we aren't merging the ends
  shapes2.push(shapes[(shapes.length-1)]);
}


function bufferIntoVertexArray(gl, data, num, type, attribute) 
{
  var buffer = gl.createBuffer();   // Create a buffer object

  if (!buffer) 
  {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) 
  {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }

  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}


/* screenRefreshLines(gl, location, size)
    gl - Rendering Context
    location - location of an Attribute Variable in WEBGL's System
    size - # of vertices in linePoints Array/in active polyine(polyline yet to be finished)

   Notes: Function made for ease of Canvas Clearing and for ease of polyline Drawing
*/
function screenRefreshLines(gl, a_Position, n)
{
  // Specify the color for clearing <canvas>, in this case, white
  gl.clearColor(1, 1, 1, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //Ensuring that a single point has been placed on the canvas so that unnecessary actions aren't performed
  if(n > 0)
  {
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Draw to the Canvas: Series of connected lines, start at vertex 0, call shaders n times.
    gl.drawArrays(gl.LINE_STRIP, 0, n);

    // Disable the assignment to a_Position Variable
    // Technically not necessary, but defensive programming
    // Disabling allows the vertices to be modified and resent to the vertex buffer
    gl.disableVertexAttribArray(a_Position);
  }
}


/* screenRefreshCylinders(gl, location, size)
    gl - Rendering Context
    location - location of an Attribute Variable in WEBGL's System
    size - # of vertices in linePoints Array/in active polyine(polyline yet to be finished)

   Notes: Function made for ease of Canvas Clearing and for ease of Cylinder Drawing
*/
function screenRefreshCylinders(gl, a_Position, n, nWON, iSIZE)
{
  // Specify the color for clearing <canvas>, in this case, white
  gl.clearColor(1, 1, 1, 1);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Ensuring that a single index has been created so that unnecessary actions aren't performed
  if(n > 0)
  {
    //Enable Depth test
    gl.enable(gl.DEPTH_TEST);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Draw the Cylinders
    gl.drawElements(gl.TRIANGLES, nWON, gl.UNSIGNED_SHORT, 0);

    console.log('n: ' + n + ', nWON: ' + nWON + ', iSIZE: ' + iSIZE);

    var meh = n - nWON;

    if(toggleNormals == true)
    {
      gl.drawElements(gl.LINES, meh, gl.UNSIGNED_SHORT, iSIZE);
    }

    //defensive programming
    gl.disable(gl.DEPTH_TEST);
    gl.disableVertexAttribArray(a_Position);
  }
}


/* calculateWEBGLXCoordinate(gl, element) 
     gl - rendering context
     element - Specifies canvas element

   Notes: Function made for ease of converting X-Coordinates from a Canvas system to a WEBGL System
*/
function calculateWEBGLXCoordinate(ev, canvas)
{
  var x = ev.clientX; // x coordinate of a mouse pointer, with respect to the canvas system.
  var rect = ev.target.getBoundingClientRect() ; //position of canvas in client area

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2); //converting

  return x; //returned value is the X-coord in the WEBGL system
}


/* calculateWEBGLYCoordinate(gl, element) 
     gl - rendering context
     element - Specifies canvas element

   Notes: Function made for ease of converting Y-Coordinates from a Canvas system to a WEBGL System
*/
function calculateWEBGLYCoordinate(ev, canvas)
{
  var y = ev.clientY; // y coordinate of a mouse pointer, with respect to the canvas system
  var rect = ev.target.getBoundingClientRect() ; //position of canvas in client area

  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2); //converting

  return y; //returned value is the Y-coord in the WEBGL System
}


/* generateNormal(i, j, e) 
     i - Surface Number in shapes2 array, 0-indexed
     j - Pt. Number of surface i in shapes2 Array, 0-indexed
     e - determines if we're working with the last surface of a cylinder: 0 - No, 1 - Yes

   Notes: Function needs more rigorous testing. Count this as an early prototype of a later implementation. The math needs review
          The goal of the function is to generate two points. p1 and p2. both of which will be pushed onto 
          the normals array. a normal is intended to be drawn between p1 and p2.
*/
function generateNormal(i, j, e)
{
  var v1, v2, N, pt1, pt2; //used for normal calculations

  //Create vector 1
  v1 = new Vector3([(shapes2[i+1][j].elements[0] - shapes2[i][j].elements[0]), (shapes2[i+1][j].elements[1] - shapes2[i][j].elements[1]), (shapes2[i+1][j].elements[2] - shapes2[i][j].elements[2])]);

  v2 = new Vector3([(shapes2[i+1][j].elements[0] - shapes2[i+1][j+1].elements[0]), (shapes2[i+1][j].elements[1] - shapes2[i+1][j+1].elements[1]), (shapes2[i+1][j].elements[2] - shapes2[i+1][j+1].elements[2])]);
  
  //Calculate our midway pt. between our 4 indices (Where our base pt. of our normal is going to go)
  pt1 = new Vector3([((shapes2[i][j].elements[0] + shapes2[i][j+1].elements[0] + shapes2[i+1][j].elements[0] + shapes2[i+1][j+1].elements[0]) / 4) , ((shapes2[i][j].elements[1] + shapes2[i][j+1].elements[1] + shapes2[i+1][j].elements[1] + shapes2[i+1][j+1].elements[1]) / 4) , ((shapes2[i][j].elements[2] + shapes2[i][j+1].elements[2] + shapes2[i+1][j].elements[2] + shapes2[i+1][j+1].elements[2]) / 4)]);
  
  //Calculate Normal Resulting from v1 x v2
  N = new Vector3([((v1.elements[1]*v2.elements[2])-(v1.elements[2]*v2.elements[1])), ((v1.elements[2]*v2.elements[0])-(v1.elements[0]*v2.elements[2])), ((v1.elements[0]*v2.elements[1])-(v1.elements[1]*v2.elements[0]))]);

  //Normalize our normal vector
  N.normalize();

  //calculate our next pt. of our normal vector
  pt2 = new Vector3([(pt1.elements[0] - (N.elements[0] / 4)), (pt1.elements[1] - (N.elements[1] / 4) ), (pt1.elements[2] - (N.elements[2] / 4) ) ]);

  //push normal pts onto normals array. 
  normals.push(pt1);
  normals.push(pt2);
}


/* enableNormals(temp) 
     temp - array of vertices used to figure out what vertices are related to normals

   Notes: This is a function still in test. It's meant for ease of creating normal indices. Do not consider this complete, this is a prototype
*/
function enableNormals()
{
  // ti = temporary index: one vertex after the last vertex of our cylinders.
  var ti = (vertices.length / 3); 
  var indexaddCt = 0;

  //Push our normal vert's onto our temp array (expanded)
  for(var i = 0; i < normals.length; i++)
  {
    vertices.push(normals[i].elements[0]);
    vertices.push(normals[i].elements[1]);
    vertices.push(normals[i].elements[2]);
  }
  console.log('normals length: ' + normals.length);

  //generate the indices related to our verts of our normals
  for(var i = ti; i < (vertices.length/ 3); i+=2 )
  {
    indices.push(i);
    indices.push(i+1);
    indexaddCt +=2;
    console.log('indexaddCt: ' + indexaddCt);
  }
}


function normalsSwitch()
{
// Retrieve <canvas> element by name
  canvas = document.getElementById('webgl');
  var tempNormalHolder = [];

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  // Getting location of Attribute Variable a_Position and storing inside local Variable: a_Position
  // This allows the use of the location of WEBGL's a_Position through the local Variable: a_Position
  // to send Vertex Locations to the Vertex_Shader.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

  SIZE = SIZE * indexHolderWON.length

  //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

  bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');

  if(smooth == true)
  {
    generateSmoothColor(shapes2.length, vertexHolder.length);
    for(var i = 0; i < smoothNormalHolder.length; i++)
    {
      tempNormalHolder.push(smoothNormalHolder[i].elements[0]);
      tempNormalHolder.push(smoothNormalHolder[i].elements[1]);
      tempNormalHolder.push(smoothNormalHolder[i].elements[2]);
    }
  }
  else
  {
    generateFlatColor(shapes2.length, vertexHolder.length);
    for(var i = 0; i < normalHolder.length; i++)
    {
      tempNormalHolder.push(normalHolder[i].elements[0]);
      tempNormalHolder.push(normalHolder[i].elements[1]);
      tempNormalHolder.push(normalHolder[i].elements[2]);
    }
  }

  var normalNormalsNum = (vertexHolder.length - tempNormalHolder.length) / 3;

  for(var i = 0; i < normalNormalsNum; i++)
  {
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
  }

  vNormalHolder = Float32Array.from(tempNormalHolder);

  bufferIntoVertexArray(gl, vNormalHolder, 3, gl.FLOAT, 'a_Normal');
  bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');

  if(toggleNormals == true)
  {
    toggleNormals = false;
  }
  else
  {
    toggleNormals = true;
  }

  screenRefreshCylinders(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
}


function generateFlatColor(surfaceNum, vertexCt)
{
  tempCol = [];
  var nM, l, s, bP;
  normalHolder = [];
  var normalSurfaceBasePts = [];
  colors = [];      ///to refresh colors

  generateFlatNormals();
  console.log('normal Holder length: ' + normalHolder.length);
  for(var i = 0; i < normalHolder.length; i++)
  {
    console.log('IN FLAT normal for vertex ' + i + ': ' + normalHolder[i].elements[0] + ', ' + normalHolder[i].elements[1] + ', ' + normalHolder[i].elements[2])
  }
  generateNormalBasePoints(normalSurfaceBasePts);

  for(var i = 0; i < shapes2.length; i++)
  {
    for (var j = 0; j < shapes2[i].length; j++)
    {
      nM = normalHolder[(i*24) + j];
      nM.normalize();

      bP = normalSurfaceBasePts[(i*24)+j];

      l = new Vector3([(1-bP.elements[0]), (1-bP.elements[1]), (1-bP.elements[2])]);
      l.normalize();

      s = ((nM.elements[0]*l.elements[0]) + (nM.elements[1]*l.elements[1]) + (nM.elements[2]*l.elements[2]));
      colors.push(new Vector3([s, 0, 0]));
    }
  }

  for(var i = 0; i < colors.length; i++)
  {
    tempCol.push(colors[i].elements[0]);
    tempCol.push(colors[i].elements[1]);
    tempCol.push(colors[i].elements[2]);
  }

  console.log('vertexC: ' + vertexCt + ', tempClen: ' + tempCol.length);

  while(tempCol.length < vertexCt)
  {
    tempCol.push(1.0);
    tempCol.push(0.0);
    tempCol.push(0.0);
  }

  //create Float32Array from temp (for vertexBuffer Compatibility)
  colorHolder = Float32Array.from(tempCol);
}


function generateSmoothColor(surfaceNum, vertexCt)
{
  tempCol = [];
  var nM, l, s;
  normalHolder = [];
  smoothNormalHolder = [];
  colors = [];      ///to refresh colors

  generateFlatNormals();
  generateSmoothNormals();

  //actually calculate color
  for(var i = 0; i < shapes2.length; i++)
  {
    for (var j = 0; j < shapes2[i].length; j++)
    {
      nM = smoothNormalHolder[(i*24) + j];
      nM.normalize();

      l = new Vector3([(1-shapes2[i][j].elements[0]), (1-shapes2[i][j].elements[1]), (1-shapes2[i][j].elements[2])]);
      l.normalize();

      s = ((nM.elements[0]*l.elements[0]) + (nM.elements[1]*l.elements[1]) + (nM.elements[2]*l.elements[2]));
      colors.push(new Vector3([s, 0, 0]));
    }
  }

  for(var i = 0; i < colors.length; i++)
  {
    tempCol.push(colors[i].elements[0]);
    tempCol.push(colors[i].elements[1]);
    tempCol.push(colors[i].elements[2]);
  }

  console.log('vertexC: ' + vertexCt + ', tempClen: ' + tempCol.length);

  while(tempCol.length < vertexCt)
  {
    tempCol.push(1.0);
    tempCol.push(0.0);
    tempCol.push(0.0);
  }

  //create Float32Array from temp (for vertexBuffer Compatibility)
  colorHolder = Float32Array.from(tempCol);
}


function decideSmoothFlat()
{
  var tempNormalHolder = [];
  // Retrieve <canvas> element by name
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  // Getting location of Attribute Variable a_Position and storing inside local Variable: a_Position
  // This allows the use of the location of WEBGL's a_Position through the local Variable: a_Position
  // to send Vertex Locations to the Vertex_Shader.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  if(smooth == false)
  {
    smooth = true;
    if(linePoints.length > 0)
    {
      generateSmoothColor(shapes2.length, vertexHolder.length);
      for(var i = 0; i < smoothNormalHolder.length; i++)
      {
        tempNormalHolder.push(smoothNormalHolder[i].elements[0]);
        tempNormalHolder.push(smoothNormalHolder[i].elements[1]);
        tempNormalHolder.push(smoothNormalHolder[i].elements[2]);
      }
    }
  }
  else
  {
    smooth = false;
    if(linePoints.length > 0)
    {
      generateFlatColor(shapes2.length, vertexHolder.length);
      for(var i = 0; i < normalHolder.length; i++)
      {
        tempNormalHolder.push(normalHolder[i].elements[0]);
        tempNormalHolder.push(normalHolder[i].elements[1]);
        tempNormalHolder.push(normalHolder[i].elements[2]);
      }
    }
  }

  var normalNormalsNum = (vertexHolder.length - tempNormalHolder.length) / 3;

  console.log('nNS = ' + normalNormalsNum);
  for(var i = 0; i < normalNormalsNum; i++)
  {
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
      tempNormalHolder.push(0);
  }

  if(linePoints.length > 0)
  {
    //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');

    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length

    vNormalHolder = new Float32Array(tempNormalHolder);

    bufferIntoVertexArray(gl, vNormalHolder, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');
    screenRefreshCylinders(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}


function ambientSwitch()
{
  // Retrieve <canvas> element by name
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  // Getting location of Attribute Variable a_Position and storing inside local Variable: a_Position
  // This allows the use of the location of WEBGL's a_Position through the local Variable: a_Position
  // to send Vertex Locations to the Vertex_Shader.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var ambient_Color = gl.getUniformLocation(gl.program, 'ambient_Color');
  if (!ambient_Color) 
  {
    console.log('Failed to get the storage location of ambient_Color');
    return -1;
  }

  if(ambient == true)
  {
    ambient = false;
    gl.uniform4f(ambient_Color, 0.0, 0.0, 0.0, 1.0);
  }
  else
  {
    ambient = true;
    gl.uniform4f(ambient_Color, 0.0, 0.0, 0.2, 1.0);
  }

  if(linePoints.length > 0)
  {
    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length;

    //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');

    if(smooth == true)
    {
      generateSmoothColor(shapes2.length, vertexHolder.length);
    }
    else
    {
      generateFlatColor(shapes2.length, vertexHolder.length);
    }

    bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');
    screenRefreshCylinders(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}


function generateFlatNormals()
{
  for(var i = 0; i < shapes2.length; i+=2)
  {
    for(var j = 0; j < 2; j++)
    {
      for(var k = 0; k < shapes2[i].length; k+=2)
      {
        normalHolder.push(new Vector3([(normals[(12*i)+k+1].elements[0]-normals[(12*i)+(k)].elements[0]), (normals[(12*i)+k+1].elements[1]-normals[(12*i)+(k)].elements[1]), (normals[(12*i)+k+1].elements[2]-normals[(12*i)+(k)].elements[2]) ]));
        normalHolder.push(new Vector3([(normals[(12*i)+k+1].elements[0]-normals[(12*i)+(k)].elements[0]), (normals[(12*i)+k+1].elements[1]-normals[(12*i)+(k)].elements[1]), (normals[(12*i)+k+1].elements[2]-normals[(12*i)+(k)].elements[2]) ]));
      }
    }
  }

  for(var i = 0; i < normalHolder.length; i++)
  {
    console.log('normal for vertex ' + i + ': ' + normalHolder[i].elements[0] + ', ' + normalHolder[i].elements[1] + ', ' + normalHolder[i].elements[2])
  }
}


function generateSmoothNormals()
{
//first surface : 0-23;1->21:2->22;23-0
  smoothNormalHolder.push(new Vector3([(normalHolder[23].elements[0] + normalHolder[0].elements[0]), (normalHolder[23].elements[1] + normalHolder[0].elements[1]),(normalHolder[23].elements[2] + normalHolder[0].elements[2]) ]));
  for(var i = 1; i < shapes2[0].length; i+=2)
  {
    if(i != 23)
    {
      smoothNormalHolder.push(new Vector3([(normalHolder[i].elements[0] + normalHolder[i+1].elements[0]), (normalHolder[i].elements[1] + normalHolder[i+1].elements[1]),(normalHolder[i].elements[2] + normalHolder[i+1].elements[2]) ]));
      smoothNormalHolder.push(new Vector3([(normalHolder[i].elements[0] + normalHolder[i+1].elements[0]), (normalHolder[i].elements[1] + normalHolder[i+1].elements[1]),(normalHolder[i].elements[2] + normalHolder[i+1].elements[2]) ]));
    }
    else
    {
      smoothNormalHolder.push(new Vector3([(normalHolder[23].elements[0] + normalHolder[0].elements[0]), (normalHolder[23].elements[1] + normalHolder[0].elements[1]),(normalHolder[23].elements[2] + normalHolder[0].elements[2]) ]));
    }
  }

  //middle surfaces
  for(var i = 1; i < (shapes2.length - 2); i+=2)
  {
    for(var j = 0; j <2; j++)
    {
      smoothNormalHolder.push(new Vector3([normalHolder[i*24].elements[0]+normalHolder[((i+1)*24)-1].elements[0]+normalHolder[(i+1)*24].elements[0]+normalHolder[((i+2)*24)-1].elements[0], normalHolder[i*24].elements[1]+normalHolder[((i+1)*24)-1].elements[1]+normalHolder[(i+1)*24].elements[1]+normalHolder[((i+2)*24)-1].elements[1], normalHolder[i*24].elements[2]+normalHolder[((i+1)*24)-1].elements[2]+normalHolder[(i+1)*24].elements[2]+normalHolder[((i+2)*24)-1].elements[2]]));
      for(var k = 1; k < shapes2[i].length; k+=2)
      {
        if(k != 23)
        {
          smoothNormalHolder.push(new Vector3([normalHolder[i*24 + k].elements[0]+normalHolder[(i*24)+k+1].elements[0]+normalHolder[(i+1)*24 + k].elements[0]+normalHolder[((i+1)*24)+k+1].elements[0], normalHolder[i*24 + k].elements[1]+normalHolder[(i*24)+k+1].elements[1]+normalHolder[(i+1)*24 + k].elements[1]+normalHolder[((i+1)*24)+k+1].elements[1], normalHolder[i*24 + k].elements[2]+normalHolder[(i*24)+k+1].elements[2]+normalHolder[(i+1)*24 + k].elements[2]+normalHolder[((i+1)*24)+k+1].elements[2]]));
          smoothNormalHolder.push(new Vector3([normalHolder[i*24 + k].elements[0]+normalHolder[(i*24)+k+1].elements[0]+normalHolder[(i+1)*24 + k].elements[0]+normalHolder[((i+1)*24)+k+1].elements[0], normalHolder[i*24 + k].elements[1]+normalHolder[(i*24)+k+1].elements[1]+normalHolder[(i+1)*24 + k].elements[1]+normalHolder[((i+1)*24)+k+1].elements[1], normalHolder[i*24 + k].elements[2]+normalHolder[(i*24)+k+1].elements[2]+normalHolder[(i+1)*24 + k].elements[2]+normalHolder[((i+1)*24)+k+1].elements[2]]));
        }
        else
        {
          smoothNormalHolder.push(new Vector3([normalHolder[i*24].elements[0]+normalHolder[((i+1)*24)-1].elements[0]+normalHolder[(i+1)*24].elements[0]+normalHolder[((i+2)*24)-1].elements[0], normalHolder[i*24].elements[1]+normalHolder[((i+1)*24)-1].elements[1]+normalHolder[(i+1)*24].elements[1]+normalHolder[((i+2)*24)-1].elements[1], normalHolder[i*24].elements[2]+normalHolder[((i+1)*24)-1].elements[2]+normalHolder[(i+1)*24].elements[2]+normalHolder[((i+2)*24)-1].elements[2]]));
        }
      }
    }
  }

  //last Surface
  smoothNormalHolder.push(new Vector3([(normalHolder[((shapes2.length)*24)-1].elements[0] + normalHolder[((shapes2.length-1)*24)].elements[0]), (normalHolder[((shapes2.length)*24)-1].elements[1] + normalHolder[((shapes2.length-1)*24)].elements[1]),(normalHolder[((shapes2.length)*24)-1].elements[2] + normalHolder[((shapes2.length-1)*24)].elements[2])]));
  for(var i = 1; i < shapes2[(shapes2.length-1)].length; i+=2)
  {
    if(i != 23)
    {
      smoothNormalHolder.push(new Vector3([(normalHolder[i+((shapes2.length-1)*24)].elements[0] + normalHolder[i+((shapes2.length-1)*24)+1].elements[0]), (normalHolder[i+((shapes2.length-1)*24)].elements[1] + normalHolder[i+((shapes2.length-1)*24)+1].elements[1]),(normalHolder[i+((shapes2.length-1)*24)].elements[2] + normalHolder[i+((shapes2.length-1)*24)+1].elements[2])]));
      smoothNormalHolder.push(new Vector3([(normalHolder[i+((shapes2.length-1)*24)].elements[0] + normalHolder[i+((shapes2.length-1)*24)+1].elements[0]), (normalHolder[i+((shapes2.length-1)*24)].elements[1] + normalHolder[i+((shapes2.length-1)*24)+1].elements[1]),(normalHolder[i+((shapes2.length-1)*24)].elements[2] + normalHolder[i+((shapes2.length-1)*24)+1].elements[2])]));
    }
    else
    {
      smoothNormalHolder.push(new Vector3([(normalHolder[((shapes2.length)*24)-1].elements[0] + normalHolder[((shapes2.length-1)*24)].elements[0]), (normalHolder[((shapes2.length)*24)-1].elements[1] + normalHolder[((shapes2.length-1)*24)].elements[1]),(normalHolder[((shapes2.length)*24)-1].elements[2] + normalHolder[((shapes2.length-1)*24)].elements[2])]));
    }
  }
}


//for flat shading
function generateNormalBasePoints(normalSurfaceBasePts)
{
  for(var i = 0; i < shapes2.length; i+=2)
  {
    for(var j = 0; j < 2; j++)
    {
      for(var k = 0; k < shapes2[i].length; k+=2)
      {
        normalSurfaceBasePts.push(new Vector3([normals[(12*i)+(k)].elements[0], normals[(12*i)+(k)].elements[1], normals[(12*i)+(k)].elements[2]]));
        normalSurfaceBasePts.push(new Vector3([normals[(12*i)+(k)].elements[0], normals[(12*i)+(k)].elements[1], normals[(12*i)+(k)].elements[2]]));
      }
    }
  }
}


function specularSwitch()
{
  var tempNormalHolder = [];
  // Retrieve <canvas> element by name
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  // Getting location of Attribute Variable a_Position and storing inside local Variable: a_Position
  // This allows the use of the location of WEBGL's a_Position through the local Variable: a_Position
  // to send Vertex Locations to the Vertex_Shader.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var KsI = gl.getUniformLocation(gl.program, 'KsI');
  if (!KsI) 
  {
    console.log('Failed to get the storage location of KsI');
    return -1;
  }

  if(specular == true)
  {
    specular = false;
    gl.uniform4f(KsI, 0.0, 0.0, 0.0, 0.0);
  }
  else
  {
    specular = true;
    gl.uniform4f(KsI, 0.0, 0.577, 0.0, 0.0);
  }

  if(linePoints.length > 0)
  {
    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length;
    //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');

    if(smooth == true)
    {
      generateSmoothColor(shapes2.length, vertexHolder.length);
      for(var i = 0; i < smoothNormalHolder.length; i++)
      {
        tempNormalHolder.push(smoothNormalHolder[i].elements[0]);
        tempNormalHolder.push(smoothNormalHolder[i].elements[1]);
        tempNormalHolder.push(smoothNormalHolder[i].elements[2]);
      }
    }
    else
    {
      generateFlatColor(shapes2.length, vertexHolder.length);
      for(var i = 0; i < normalHolder.length; i++)
      {
        tempNormalHolder.push(normalHolder[i].elements[0]);
        tempNormalHolder.push(normalHolder[i].elements[1]);
        tempNormalHolder.push(normalHolder[i].elements[2]);
      }
    }

    var normalNormalsNum = (vertexHolder.length - tempNormalHolder.length) / 3;

    for(var i = 0; i < normalNormalsNum; i++)
    {
        tempNormalHolder.push(0);
        tempNormalHolder.push(0);
        tempNormalHolder.push(0);
    }

    vNormalHolder = Float32Array.from(tempNormalHolder);
    bufferIntoVertexArray(gl, vNormalHolder, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');
    screenRefreshCylinders(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}


function setnS()
{
  var x = document.getElementById("myRange");
  glossFactor = x.value;
  glossFactor = parseFloat(glossFactor);

  var nS = gl.getUniformLocation(gl.program, 'nS');
  if (!nS) 
  {
    console.log('Failed to get the storage location of nS');
    return -1;
  }

  gl.uniform1f(nS, glossFactor);
  
  var tempNormalHolder = [];
  // Retrieve <canvas> element by name
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  setUpOpenGL(gl);

  // Getting location of Attribute Variable a_Position and storing inside local Variable: a_Position
  // This allows the use of the location of WEBGL's a_Position through the local Variable: a_Position
  // to send Vertex Locations to the Vertex_Shader.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  if(linePoints.length > 0)
  {
    var SIZE = indexHolderWON.BYTES_PER_ELEMENT;

    SIZE = SIZE * indexHolderWON.length;
    //Write data(indices) into the buffer object at target gl.ELEMENT_ARRAY_BUFFER. 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexHolder, gl.STATIC_DRAW);

    bufferIntoVertexArray(gl, vertexHolder, 3, gl.FLOAT, 'a_Position');

    if(smooth == true)
    {
      generateSmoothColor(shapes2.length, vertexHolder.length);
      for(var i = 0; i < smoothNormalHolder.length; i++)
      {
        tempNormalHolder.push(smoothNormalHolder[i].elements[0]);
        tempNormalHolder.push(smoothNormalHolder[i].elements[1]);
        tempNormalHolder.push(smoothNormalHolder[i].elements[2]);
      }
    }
    else
    {
      generateFlatColor(shapes2.length, vertexHolder.length);
      for(var i = 0; i < normalHolder.length; i++)
      {
        tempNormalHolder.push(normalHolder[i].elements[0]);
        tempNormalHolder.push(normalHolder[i].elements[1]);
        tempNormalHolder.push(normalHolder[i].elements[2]);
      }
    }

    var normalNormalsNum = (vertexHolder.length - tempNormalHolder.length) / 3;

    for(var i = 0; i < normalNormalsNum; i++)
    {
        tempNormalHolder.push(0);
        tempNormalHolder.push(0);
        tempNormalHolder.push(0);
    }

    vNormalHolder = Float32Array.from(tempNormalHolder);
    bufferIntoVertexArray(gl, vNormalHolder, 3, gl.FLOAT, 'a_Normal');

    bufferIntoVertexArray(gl, colorHolder, 3, gl.FLOAT, 'a_Color');
    screenRefreshCylinders(gl, a_Position, indexHolder.length, indexHolderWON.length, SIZE);
  }
}