CTRL_OVERRIDE = false;

var CTRL_OVERRIDE_STACK = 0

var override = function() {
	return false;
	CTRL_OVERRIDE = true

	CTRL_OVERRIDE_STACK++

	setTimeout(function(){

		if(--CTRL_OVERRIDE_STACK == 0) {
			CTRL_OVERRIDE = false
		}

	}, 1000)

}

var Controls = function(socket) {

	document.addEventListener('contextmenu', event => event.preventDefault());

	var keys = {}
				
	var mousebtn = {}

	var mousepos = new THREE.Vector2()

	window.addEventListener("resize", function(e){

		var aspect = window.innerWidth / window.innerHeight

		socket.send(JSON.stringify(["windowAspect", aspect]))

	}, false)

	window.addEventListener("keydown", function(e){
				
		keys[e.key.toLowerCase()] = true
		
		socket.send(JSON.stringify(["keydown", e.key.toLowerCase()]))

		override()

		if(e.key.toLocaleLowerCase() == "tab") {

			e.preventDefault()

			tabTargets()

		}

		return false

	}, false)

	window.addEventListener("keyup", function(e){

		delete keys[e.key.toLowerCase()]

		socket.send(JSON.stringify(["keyup", e.key.toLowerCase()]))

	}, false)
	
	window.addEventListener("mousedown", function(e){
		/*
		if(!document.pointerLockElement) {
		
			document.body.requestPointerLock()
		
		}
		*/

		console.log(e.button)

		mousebtn[e.button] = true
		
		socket.send(JSON.stringify(["mousedown", e.button]))
				
	}, false)

	window.addEventListener("mouseup", function(e){

		delete mousebtn[e.button]
		
		socket.send(JSON.stringify(["mouseup", e.button]))

	}, false)

	window.addEventListener("mousemove", function(e){
		/*
		if(document.pointerLockElement) {
		
			if(myObject) {
			
				myObject.rotation.y -= 0.001 * e.movementX
				myObject.head.rotation.x = Math.min(Math.PI/2,Math.max(-Math.PI/2, myObject.head.rotation.x - 0.001 * e.movementY))
			
			}
		
		}
		*/

		var mx = (e.clientX / window.innerWidth) * 2 - 1
		var my = (e.clientY / window.innerHeight) * 2 - 1

		mousepos.set(mx, my)
		
		socket.send(JSON.stringify(["mousemove", mx, my]))

		override()
		
	}, false)

	this.getKeys = function() {
		return keys
	}

	this.getMousePos = function() {
		return mousepos
	}

	this.getMouseBtn = function() {
		return mousebtn
	}

}