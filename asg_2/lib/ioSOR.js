/*
 * VERSION 1.3 - ALWAYS CHECK FOR LATEST VERSION
 *
 * Library used to read and write 3D Obj Data into Obj File
 * Assumes the objects are SOR made up of quad faces.
 *
 * Written by:   Aakash Thakkar
 * Date:         October 2, 2016
 *
 * BUG FIXES:
 * 1) Looping Bug
 *    Identified and Sovled by:   Mackenzie Glynn
 *    Date:         October 4, 2016
 *    Rectified in Version 1.1
 *
 * 2) parseFloat, Setup Function, Object Format
 *    Identified by:   Cole Faust
 *    Date:         October 7, 2016
 *    Rectified in Version 1.2
 *
 * 3) Triangles restriction: indexes/vertices read in individually rather than in groups of 3
 *    Identified by:   James Iwamasa
 *    Date:         April 15, 2018
 *    Rectified in Version 1.3
 *
 * File Format:
 * o STANDS FOR OBJECT NAME, V STANDS FOR VERTEX, F STANDS FOR FACE
 *
 * o [OBJECT_NAME]
 * v [c]
 * .
 * .
 * v [cn]
 * f [c]
 * .
 * .
 * f [cn]
 *
 * FUNCTIONS:
 * 1) setupIOSOR("ID OF FILE INPUT ELEMENT")
 *    Desc: Setup Change Event Handler, pass attribute input id. For Example: setupIOSOR("fileinput") in Main Function.
 * 2) saveFile(new SOR("", [VERTICES_ARRAY], [INDEXES_ARRAY]); --> Save 3d Object
 *    Desc: This function translates the SOR Object into a downloadable blob
 * 2) readFile()
 *    Return: SOR OBJECT
 *    USAGE: Once File Selected in Browser, USE: var sorObject = readFile();
 *    You can do this on an onclick event by a button.
 *    Desc: This function responds to an onchange event from the HTML FileInput and grabs the content of the file selected
 *          It then extracts SOR object from File Data
 *
 * NOTE: INSTRUCTION: STEPS:
 * 1) Add following code in the HTML DRIVER file( Inside body tag): <input type="file" id="fileinput" />
 * 2) Add the script before your own JS Code: <script src="../lib/ioSOR.js"></script>
 * 3) Add another button such as: <button onclick="updateScreen()" type="button">Extract SOR</button>
 * 4) Create function: updateScreen() in your code and make a call to readFile() that returns SOR object, use object to update the screen
 *
 * Flow of Events: User clicks on file input element, selects file and then presses Extract Object button to update the screen.
 *
 *
 */

var extractedSOR;
var setupComplete = false;

function SOR(objName, vertices, indexes) {
  this.objName = objName;
  this.vertices = vertices;
  this.indexes = indexes;
}

function setupIOSOR(elementName) {
  document.getElementById(elementName).addEventListener('change', readEvent);
  setupComplete = true;
}

function saveFile(SORC, name) {
  var text = '';
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.download = name + ".obj";

  for (var i = 0; i < SORC.length; i++) {
    var SOR = SORC[i];

    text += "o " + SOR.objName + "\n";

    for (var i = 0; i < SOR.vertices.length; i = i + 3) {
      text = text + "v " + SOR.vertices[i] + " " + SOR.vertices[i + 1] + " " + SOR.vertices[i + 2] + "\n";
    }

    for (var i = 0; i < SOR.indexes.length; i = i + 3) {
      text = text + "f " + SOR.indexes[i] + " " + SOR.indexes[i + 1] + " " + SOR.indexes[i + 2] + "\n";
    }
  }

  var myBlob = new Blob([text], {
    type: "text/plain"
  });
  var url = window.URL.createObjectURL(myBlob);

  // Simulate Download
  a.href = url;
  a.click();
}

function readFile() {
  return extractedSORs;
}

function readEvent(ev) {
  var file = ev.target.files[0];

  var SORC = [];
  var active = -1;

  var r = new FileReader();
  r.onload = function(e) {
    var contents = e.target.result;
    var line = "";

    while (true) {
      line = contents.substr(0, contents.indexOf('\n'));

      if (line.length <= 0) {
        break;
      }

      if (line.charAt(0) === 'f') {
        line = line.substr(2);
        SORC[active].indexes.push(parseFloat(line.substr(0, line.indexOf(" "))));

        line = line.substr(line.indexOf(" ") + 1);
        SORC[active].indexes.push(parseFloat(line.substr(0, line.indexOf(" "))));

        line = line.substr(line.indexOf(" ") + 1);
        SORC[active].indexes.push(parseFloat(line));
      } else if (line.charAt(0) === 'v') {
        line = line.substr(2);
        SORC[active].vertices.push(parseFloat(line.substr(0, line.indexOf(" "))));

        line = line.substr(line.indexOf(" ") + 1);
        SORC[active].vertices.push(parseFloat(line.substr(0, line.indexOf(" "))));

        line = line.substr(line.indexOf(" ") + 1);
        SORC[active].vertices.push(parseFloat(line));
      } else if (line.charAt(0) === 'o') {
        SORC.push(new SOR(line.substr(line.indexOf(" ") + 1), [], []));
        active++;
      }

      contents = contents.substr(contents.indexOf('\n') + 1);
    }

    console.log("Extracted");
    console.log(SORC);
    extractedSORs = SORC;
  }
  r.readAsText(file);
}