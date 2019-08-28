var socket = io();
var clientNumber;
var touching = false;
var counter = 0;
var accessDenied = false;
var motionX = 0, motionY = 0, motionZ = 0;
var pMotionX = 0, pMotionY = 0, pMotionZ = 0;
var diffX = 0, diffY = 0, diffZ = 0;

if (window.DeviceMotionEvent != undefined) {
	window.ondevicemotion = function(e) {
    motionX = e.accelerationIncludingGravity.x;
		motionY = e.accelerationIncludingGravity.y;
		motionZ = e.accelerationIncludingGravity.z;
    diffX = motionX - pMotionX;
    diffY = motionY - pMotionY;
    diffZ = motionZ - pMotionZ;
    pMotionX = motionX;
    pMotionY = motionY;
    pMotionZ = motionZ;
  }
}

var oldOnLoad = window.onload;
if (typeof window.onload != 'function') {
	window.onload = function(){
		document.getElementById("body").onmousedown = function(){ touching = true; }
		document.getElementById("body").onmouseup = function(){ touching = false; }
	}
} else {
  window.onload = function (){
    oldOnLoad();
		document.getElementById("body").onmousedown = function(){ touching = true; }
		document.getElementById("body").onmouseup = function(){ touching = false; }
  }
}

function touchStarted() { touching = true; }
function touchEnded() { touching = false; }

function setup() {
  createCanvas(windowWidth,windowHeight);
}

socket.on('login', function(msg){
  if (msg < 99) {
    console.log(msg);
    clientNumber = msg;
    clear();
    background(0,255,0);
    fill(255, 0, 0);
    var buttonWidth = (windowWidth <= windowHeight) ? (windowWidth*0.6) : (windowHeight*0.6);
    ellipse(windowWidth/2, windowHeight/2,buttonWidth,buttonWidth);
    var fontSize = 12;
    textSize(fontSize);
    var pushMove = "TOUCH";
    textSize((buttonWidth/(textWidth(pushMove)*1.2))*fontSize);
    fill(0,0,0);
    textAlign(CENTER, CENTER);
    text(pushMove, windowWidth/2, windowHeight/2);
  } else {
    accessDenied = true;
  }
});

function drawDenied() {
  if (accessDenied) {
    var fontSize = 12;
    var serverFull = "Server full";
    clear();
    background(255,0,0);
    fill(255, 255, 255);
    rect(windowWidth*0.1, (windowHeight*0.3), windowWidth*0.8, windowHeight*0.4, windowWidth*0.05);
    textAlign(CENTER, CENTER);
    textSize(fontSize);
    fontSize = (windowWidth/(textWidth(serverFull)*1.4))*fontSize;
    fill(200,200,200);
    textSize(fontSize*1.4);
    text(500-counter, windowWidth/2, windowHeight/2);
    fill(0,0,0);
    textSize(fontSize);
    text(serverFull, windowWidth/2, windowHeight/2);
    counter++;
    if (counter > 500) { location.reload(); counter = 0; }
  }
}

function draw() {
  if (clientNumber == null) { drawDenied(); } else {
    if (mouseIsPressed || touching) {
      var accData = [];
			if (diffX !== 0 || diffY !== 0 || diffZ !== 0) {
				accData = [ clientNumber, diffX/8, diffY/8, diffZ/8 ];
			} else {
				accData[0] = clientNumber;
	      if (accelerationX !== undefined) {
	        accData[1] = accelerationX-pAccelerationX;
	      }
	      if (accelerationY !== undefined) {
	        accData[2] = accelerationY-pAccelerationY;
	      }
	      if (accelerationZ !== undefined) {
	        accData[3] = accelerationZ-pAccelerationZ;
	      }
			}
      if (abs(accData[1]) > 0.01 || abs(accData[2]) > 0.01 || abs(accData[3]) > 0.01) {
      	socket.emit('accelerationData',accData);
      }
    }
  }
}
