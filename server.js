var http = require('http');			// HTTP
var path = require('path');			// Path
var fs = require('fs');				// Filesystem
var server = http.createServer(handleRequest);
server.listen(8080);
var io = require('socket.io')(server,{'pingTimeout':5000,'pingInterval':2000});	// Socket.IO
var clientsArray = [];
var maxClients = 5;

var port = require('port'); // PureData
var pd = new port({
	'read': 8004,
	'write': 8005,
//	'pd': '/Applications/Pd-extended.app/Contents/Resources/bin/pd',
	'flags': { 'open': process.cwd() + '/pd4.pd' }
})
.on('data', function(data){
	console.log('data receiving from [netsend]', data);
})
.on('stderr', function(buffer){
	console.log(buffer.toString());
})
.create();

function handleRequest(req, res) {
  var pathname = req.url;
  if (pathname == '/') {
    pathname = '/index.html';
  }

  var ext = path.extname(pathname);
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };
  var contentType = typeExt[ext] || 'text/plain';

  fs.readFile(__dirname + pathname, function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
}

io.on('connection', function(socket) {
	//  console.log('Client ' + socket.id + ' connected');
	var newID = -1;
	for (var numberFound, j, i = 0; i < maxClients; i++) {
		for (j = 0; j < clientsArray.length; j++) {
			numberFound=false;
			if (clientsArray[j][1] == i) {
				numberFound = true;
				break;
			}
		}
		if (!numberFound) {
			newID = i;
			break;
		}
	}
	if (newID > -1) {
		io.to(socket.id).emit('login', i);
		clientsArray.push([socket.id,i]);
		console.log('Total connected: ' + clientsArray.length);
	} else {
		io.to(socket.id).emit('login', 99);
	}
  socket.on('disconnect', function(){
//    console.log(socket.id + ' disconnected');clearTimeout(myVar)
		for (var i = 0; i < clientsArray.length; i++) {
			if (clientsArray[i][0] == socket.id) {
		    clientsArray.splice(i, 1);
				console.log('Total connected: ' + clientsArray.length);
				break;
			}
		}
  });
  socket.on('accelerationData', function(accData) {
		if (accData[0] < maxClients && accData[0] != null) {
//			console.log("Received: 'accelerationData' from client " + accData[0] + ": " + accData[1] + " " + accData[2] + " " + accData[3]);
			pd.write(accData[0] + ' ' + accData[1] + ' ' + accData[2] + ' ' + accData[3] + ';\n');
		}
  });
});
