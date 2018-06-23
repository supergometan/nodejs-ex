var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 80,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";




var GameServer = require("./server/gameserver")

var WebSocketServer = require("ws").Server

var http = require("http")

var fs = require("fs")



var httpServer = http.createServer(function(req, res){
	
	if(req.url == "/") req.url = "/index.html"
	
	fs.readFile(__dirname + "/client" + req.url, function(error,data){
	
		if(error) {
			res.statusCode = 404
			res.end(error.toString())
		}
		else {
			
			if(req.url == "/index.html") {
				
				var str = data.toString()
    
				data = str.replace("###IP###", ip)
    
			}
			
			res.end(data)
			
		}
	
	})
	
}).listen(port, ip)

var webSocketServer = new WebSocketServer({port:8443,address:"0.0.0.0"})

var gameServer = new GameServer()

webSocketServer.on("connection", function(socket) {

	var client = gameServer.createClient(socket)

	socket.on("close", function(code){

		gameServer.removeClient(client)
		
	})
	
	socket.on("message", function(message){

		message = JSON.parse(message)

		gameServer.processMessage(client, message)
		
	})
	
})