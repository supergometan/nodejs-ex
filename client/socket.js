var Socket = function() {

	var scope = this

	var socket = new WebSocket("ws://localhost:8000")

	socket.addEventListener("open", onSocketOpen, false)

	socket.addEventListener("message", onSocketMessage, false)

	socket.addEventListener("close", onSocketClose, false)

	var portalSubmitClick = function(e) {
		
		socket.send(JSON.stringify(["quickjoin", document.getElementById("portal-name-input").value]))
		document.getElementById("portal-submit").removeEventListener("click", portalSubmitClick)
		document.getElementById("portal-submit").setAttribute("disabled", "disabled")
	
	}

	function onSocketOpen(e) {
		
		document.getElementById("portal-submit").addEventListener("click", portalSubmitClick,false)
		
	}



	function onSocketClose(e) {
		
		
		
	}

	function onSocketMessage(e) {
		
		var message = JSON.parse(e.data)

		if(scope.onmessage) {
			
			return scope.onmessage(message)
			
		}		
		
		if(message[0] == "game joined") {
		
			gameTime = message[1]
			
			myGameID = message[2]
		
			myPlayerID = message[3]
			
			map = new GameWorld(message[4])
			
			scene.add(map)
		
		} else if(message[0] == "player joined") {
		
			console.log("a player joined the game ("+message[2]+")")
			
			if(message[2] == myPlayerID) {
			
				myObjectID = message[3]
			
			}
		
		} else if(message[0] == "new object") {
			
			if(message[3] == "Human") {

				var obj = new THREE.Mesh(new THREE.BoxGeometry(0.4,1.5,0.2), new THREE.MeshBasicMaterial())
				
				obj.velocity = new THREE.Vector3()
				
				obj.geometry.translate(0,0.75,0)
			
				var head = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.3,0.15), new THREE.MeshBasicMaterial())
				
				head.geometry.translate(0,0.15,0)
				
				head.position.y = 1.5
				
				obj.add(head)
				
				obj.head = head
				
				obj.jumping = false
			
			}
			
			obj.POID = message[2]
			
			obj.type = message[3]
			
			obj.position.fromArray(message[4])
			
			obj.quaternion.fromArray(message[5])
			
			scene.add(obj)
			
			objects.push(obj)
			
			if(obj.POID == myObjectID) {
			
				myObject = obj
				
				obj.head.add(camera)
				
				console.log(obj)
			
			}
		
		} else if(message[0] == "object status") {
		
			objects.forEach(function(obj){
			
				if(obj.POID == message[2] && obj.POID != myObjectID) {
				
					obj.position.fromArray(message[3])
			
					obj.quaternion.fromArray(message[4])
									
				}
			
			})
		
		} else if(message[0] == "object removed") {
		
			objects.forEach(function(obj){
			
				if(obj.POID == message[2]) {
				
					objects.splice(objects.indexOf(obj), 1)
					
					scene.remove(obj)
				
				}
			
			})
		
		}
		
	}
	
	this.send = function(msg) {

		if(socket.readyState == 1) {

			socket.send(msg)

		}

	}
	
}