var ttt = 0
var lastNearest = false
function tabTargets() {

	display.objects.forEach(function(o){
			
		o.position.sub(display.cameraObjectPosition)

		o.position.addScalar(500).mod(1000).subScalar(500)

	})
	
	var frustum = new THREE.Frustum()

	display.camera.updateMatrix()
	display.camera.updateMatrixWorld()
	display.camera.updateProjectionMatrix()

	frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( display.camera.projectionMatrix, display.camera.matrixWorldInverse ) );

	var inside = []

	ships.forEach(function(s){

		if(frustum.containsPoint(s.position)) {
			var d = s.position.distanceTo(display.getCameraObject().position)
			for(var i = 0; i < inside.length; i++) {
				if(inside[i].d > d) {
					break;
				}
			}
			inside.splice(i,0,{
				d:d,
				s:s
			})
		}

	})

	if(inside.length) {
		var idx = Math.min(ttt, inside.length-1)

		if(lastNearest != inside[0].s) ttt = idx = 0

		lastNearest = inside[0].s

		display.setTarget(inside[idx].s)

		socket.send(JSON.stringify(["new target", inside[idx].s.GUID]))

	}

	ttt = (ttt+1)%5

	display.objects.forEach(function(o){
		
		o.position.add(display.cameraObjectPosition)
		
	})

}

function init() {

	ships = []
	
	asteroids = []
	
	projectiles = []

	mines = []

	missiles = []

	buffs = []

	explosions = []

	scoreboard = new Scoreboard()

	display = new Display()
	
	socket = new Socket()
	
	controls = new Controls(socket)

	socket.onmessage = (function(message){

		if(message[0] == "runtime") {

			serverRunTime = message[1]
			
			display.setTime(serverRunTime)

		} else if(message[0] == "my player") {
			
			myPlayerID = message[1]
			
			serverRunTime = message[2]
			
			display.setTime(serverRunTime)
			
			document.getElementById("portal").setAttribute("style", "display:none;")
			
		} else if(message[0] == "new player") {

			scoreboard.addPlayer(message[1], message[2], message[3], message[4])
			
		} else if(message[0] == "player left"){
			
			scoreboard.removePlayer(message[1])
			
		} else if(message[0] == "new asteroid") {
			
			var asteroid = new Asteroid(message[1], message[2], message[3], message[4])
			
			display.add(asteroid)
			
			asteroids.push(asteroid)
			
		} else if(message[0] == "new ship") {
			
			var ship = new Ship(message[1], message[2], message[3])
			
			display.add(ship)
			
			ships.push(ship)
			
			if(message[4] == myPlayerID) {
				
				display.setCameraObject(ship)
				
			}
			
		} else if(message[0] == "ship removed") {
			
			ships.forEach(function(obj){
				
				if(obj.GUID == message[1]) {

					var explosion = new Explosion(1)

					explosion.velocity.copy(obj.velocity)

					explosion.position.copy(obj.position)

					display.add(explosion)

					explosions.push(explosion)

					setTimeout(function(){
						
						display.remove(explosion)
						
						explosions.splice(explosions.indexOf(explosion), 1)
						
					}, 1000)
					
					ships.splice(ships.indexOf(obj), 1)
					
					display.remove(obj)
					
				}
				
			})
			
		} else if(message[0] == "asteroid removed") {
			
			asteroids.forEach(function(obj){
				
				if(obj.GUID == message[1]) {
					
					asteroids.splice(asteroids.indexOf(obj), 1)
					
					display.remove(obj)
					
				}
				
			})
			
		} else if(message[0] == "ship update") {
			
			ships.forEach(function(obj){
				
				if(obj.GUID == message[2]) {
					
					obj.history.push(message)
					
					obj.velocity.fromArray(message[4])
					obj.angVel.fromArray(message[6])

					obj.currentShieldPoints = message[7]
					obj.currentHullPoints = message[8]

					obj.shield.material.uniforms.uPower.value = obj.currentShieldPoints / obj.maxShieldPoints
					obj.shield.material.uniforms.uPower.needsUpdate = true

					obj.projectiles = message[9]
					obj.missiles = message[10]
					
					if(obj == display.getCameraObject()) {

						document.getElementById("projectiles").textContent = obj.projectiles

					}
					if(obj == display.getCameraObject()) {

						document.getElementById("missiles").textContent = obj.missiles

					}

				}
				
			})
			
		} else if(message[0] == "asteroid update") {
			
			asteroids.forEach(function(obj){
				
				if(obj.GUID == message[2]) {
					
					obj.position.fromArray(message[3])
					obj.velocity.fromArray(message[4])
										
				}
				
			})
			
		} else if(message[0] == "new projectile") {
			
			ships.forEach(function(ship){
				
				if(ship.GUID == message[2]) {
					
					var projectile = new Projectile(message[1])
			
					display.add(projectile)
					
					projectiles.push(projectile)
					
					projectile.position.copy(ship.position)
					
					projectile.quaternion.copy(ship.quaternion)
					
					projectile.velocity.copy(ship.velocity)
					projectile.velocity.add(new THREE.Vector3(0,0,-1200).applyQuaternion(projectile.quaternion))
					projectile.position.add(new THREE.Vector3(0,0,-1.5).applyQuaternion(projectile.quaternion))
					
					setTimeout(function(){
						
						display.remove(projectile)
						
						projectiles.splice(projectiles.indexOf(projectile), 1)
						
					}, 500)
					
				}
				
			})
						
		} else if(message[0] == "projectile removed") {
			
			projectiles.forEach(function(projectile, idx){
				
				if(projectile.GUID == message[1]) {
											
					display.remove(projectile)
						
					projectiles.splice(idx, 1)
					
				}
				
			})
						
		} else if(message[0] == "missile removed") {
			
			missiles.forEach(function(missile, idx){
				
				if(missile.GUID == message[1]) {
											
					display.remove(missile)
						
					missiles.splice(idx, 1)
					
				}
				
			})
						
		} else if(message[0] == "ship hit") {
			
			ships.forEach(function(ship){
				
				if(ship.GUID == message[1]) {
				
					ship.addHit(message[2], message[3], message[4])
					
				}
				
			})
			
			
		} else if(message[0] == "player stats") {

			scoreboard.updatePlayer(message[1], message[2], message[3])

		} else if(message[0] == "new mine") {
			
			ships.forEach(function(ship){
				
				if(ship.GUID == message[2]) {
					
					var mine = new Mine(message[1])
			
					display.add(mine)
					
					mines.push(mine)
					
					mine.position.copy(ship.position)
					
					mine.quaternion.copy(ship.quaternion)
					
					mine.velocity.copy(ship.velocity)
					mine.velocity.add(new THREE.Vector3(0,0,-100).applyQuaternion(mine.quaternion))
					mine.position.add(new THREE.Vector3(0,0,-1.5).applyQuaternion(mine.quaternion))

					setTimeout(function(){
						
						display.remove(mine)
						
						mines.splice(mines.indexOf(mine), 1)
						
					}, 1000*60)
					
				}
				
			})
						
		} else if(message[0] == "stick mine to asteroid") {
			
			mines.forEach(function(m){
				if(m.GUID == message[2]) {

					asteroids.forEach(function(a){

						

						if(a.GUID == message[3]) {
							
							var r = a.position.clone().sub(m.position)
							var diff = r.length() - 0.5+a.radius
							m.velocity.copy(a.velocity)

							m.position.copy(a.position).sub(r.clone().normalize().multiplyScalar(a.radius+0.5))

						}

					})

				}
			})

		} else if(message[0] == "new target") {

			ships.forEach(function(s){
				
				if(s.GUID == message[1]) display.setTarget(s)
			
			})

		} else if(message[0] == "new missile") {
			
			ships.forEach(function(ship){
				
				if(ship.GUID == message[2]) {
					
					ships.forEach(function(s2){
						if(s2.GUID == message[3]) {
									
							var missile = new Missile(message[1], s2)
					
							display.add(missile)
							
							missiles.push(missile)
							
							missile.position.copy(ship.position)
							
							missile.quaternion.copy(ship.quaternion)
							
							missile.velocity.copy(ship.velocity)
							//missile.velocity.add(new THREE.Vector3(0,0,-100).applyQuaternion(missile.quaternion))
							missile.velocity.add(new THREE.Vector3(0,0,-100).addScalar((Math.random()-0.5)*50).normalize().multiplyScalar(10).applyQuaternion(missile.quaternion))
							missile.position.add(new THREE.Vector3(0,0,-1.5).applyQuaternion(missile.quaternion))

						}
					})
					
				}
				
			})
						
		} else if(message[0] == "new buff") {

			var buff = new Buff(message[1], message[2])

			buff.position.fromArray(message[3])

			display.add(buff)

			buffs.push(buff)

		} else if(message[0] == "buff removed") {

			buffs.forEach(function(buff, idx){

				if(buff.GUID == message[1]) {

					display.remove(buff)

					buffs.splice(idx, 1)

				}

			})

		}
		
	})

}