var targetPointsMaterial = new THREE.ShaderMaterial({
	vertexShader:document.getElementById("target-vs").textContent,
	fragmentShader:document.getElementById("target-fs").textContent,
	blending:THREE.AdditiveBlending,
	transparent:true,
	uniforms:{
		uCamPos:{type:"f",value:new THREE.Vector3()}
	}
})

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

THREE.Vector3.prototype.mod = function(a) {
	
	this.x = this.x.mod(a)
	this.y = this.y.mod(a)
	this.z = this.z.mod(a)
	
	return this
	
}

var Display = function() {

	var scope = this

	var currentTarget = false

	var camObject = false

	runTime = 0
	
	var delay = 0
	
	var objects = []
	
	var renderer = new THREE.WebGLRenderer()
	
	renderer.setPixelRatio(window.devicePixelRatio)
	
	renderer.setSize(window.innerWidth, window.innerHeight)
	
	var scene = new THREE.Scene()
	
	scene.fog = new THREE.Fog(0x000000, 0, 500)
	
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000)

	
	scene.add(camera)

	var targetPointsGeometry = new THREE.BufferGeometry()

	var targetPointsGeometryPositions = new Float32Array(128*3)
	var targetPointsGeometryColors = new Float32Array(128*4)

	targetPointsGeometry.addAttribute("position", new THREE.BufferAttribute(targetPointsGeometryPositions, 3))
	targetPointsGeometry.addAttribute("color", new THREE.BufferAttribute(targetPointsGeometryColors, 4))

	var targetPoints = new THREE.Points(targetPointsGeometry, targetPointsMaterial)

	targetPoints.frustumCulled = false

	targetPoints.renderOrder = 10000000

	scene.add(targetPoints)
	
	document.getElementById("display").appendChild(renderer.domElement)
				
	var lastTime = Date.now()
	
	requestAnimationFrame(animate)
	
	function animate() {
	
		var dt_ms = Date.now() - lastTime
		
		runTime += dt_ms
		
		lastTime += dt_ms
		
		var dt_s = dt_ms / 1000
		
		var displayTime = runTime - delay

		explosions.forEach(function(e){
			e.scale.multiplyScalar(1.1)
			e.light.distance *= 1.1;
		})

		missiles.forEach(function(m){
			
			var vLength = m.velocity.length()

			var r = m.target.position.clone().sub(m.position)

			//r.addScalar(500).mod(1000).subScalar(500)

			var rvLength = r.clone().normalize().multiplyScalar(vLength)

			var vDiff = rvLength.clone().sub(m.velocity)

			var dLength = vDiff.length() * 100

			var rest = Math.max(0, 200 - dLength)

			m.acceleration = vDiff.normalize().multiplyScalar(Math.min(dLength, 200))

			m.acceleration.add(r.clone().normalize().multiplyScalar(rest))

			m.velocity.add(m.acceleration.multiplyScalar(dt_s))

		})
		
		objects.forEach(function(o){

			if(CTRL_OVERRIDE && o == camObject) return
		
			var hh = false
		
			for(var i = o.history.length-1; i > 0; i--) {
				
				if(o.history[i][1] < displayTime) {
					
					if(i < o.history.length-1) {
						
						hh = true
						
						var dt = displayTime - o.history[i][1]
						
						var dt2 = o.history[i+1][1] - o.history[i][1]
						
						var factor = dt/dt2
						
						var p1 = new THREE.Vector3().fromArray(o.history[i][3])
						var p2 = new THREE.Vector3().fromArray(o.history[i+1][3])
						
						var r = p1.clone().sub(p2)
						
						if(p2.x - p1.x > 500) p1.x += 1000
						if(p2.x - p1.x < -500) p1.x -= 1000
						if(p2.y - p1.y > 500) p1.y += 1000
						if(p2.y - p1.y < -500) p1.y -= 1000
						if(p2.z - p1.z > 500) p1.z += 1000
						if(p2.z - p1.z < -500) p1.z -= 1000
						
						o.position.copy(p1).multiplyScalar(1-factor)
							
						o.position.add(new THREE.Vector3().copy(p2).multiplyScalar(factor))
						
						var q1 = new THREE.Quaternion().fromArray(o.history[i][5])
						var q2 = new THREE.Quaternion().fromArray(o.history[i+1][5])
						
						THREE.Quaternion.slerp( q1, q2, o.quaternion, factor )
						
					}
					
					break
					
				}
				
			}
			
			if(!hh) {

				if(o.history.length) {

					o.position.fromArray(o.history[o.history.length-1][3])
					o.quaternion.fromArray(o.history[o.history.length-1][5])

					var dt = (displayTime - o.history[o.history.length-1][1]) / 1000

					o.rotateX(o.angVel.x * dt)
					o.rotateY(o.angVel.y * dt)
					o.rotateZ(o.angVel.z * dt)
	
					o.position.add(o.velocity.clone().multiplyScalar(dt))
					
				} else {

					o.rotateX(o.angVel.x * dt_s)
					o.rotateY(o.angVel.y * dt_s)
					o.rotateZ(o.angVel.z * dt_s)
	
					o.position.add(o.velocity.clone().multiplyScalar(dt_s))

				}

			}
		
		})

		if(CTRL_OVERRIDE && camObject) {

			var mp = controls.getMousePos()

			var keys = controls.getKeys()

			camObject.acceleration = new THREE.Vector3()
				
			if(keys["w"]) {
				
				camObject.acceleration.y += 50
				
			} 
			if(keys["s"]) {
				
				camObject.acceleration.y -= 50
				
			}
			if(keys["a"]) {
				
				camObject.acceleration.x -= 50
				
			}
			if(keys["d"]) {
				
				camObject.acceleration.x += 50
				
			}
			if(keys[" "]) {
				
				if(keys["shift"]) {
					
					camObject.acceleration.z += 100
					
				} else camObject.acceleration.z -= 100
				
			}
			
			camObject.acceleration.applyQuaternion(camObject.quaternion)

			camObject.angVel.set(-mp.y, -mp.x, 0)

			camObject.rotateX(camObject.angVel.x * dt_s)
			camObject.rotateY(camObject.angVel.y * dt_s)
			camObject.rotateZ(camObject.angVel.z * dt_s)
			
			camObject.velocity.add(camObject.acceleration.clone().multiplyScalar(dt_s))
			camObject.position.add(camObject.velocity.clone().multiplyScalar(dt_s))

		}
	
		var cameraObjectPosition = camera.parent.position.clone()

		scope.cameraObjectPosition = cameraObjectPosition
		
		var si = 0

		objects.forEach(function(o){
			
			o.position.sub(cameraObjectPosition)

			o.position.addScalar(500).mod(1000).subScalar(500)

			if(o.oType == "Ship") {

				targetPointsGeometryPositions[si*3+0] = o.position.x
				targetPointsGeometryPositions[si*3+1] = o.position.y
				targetPointsGeometryPositions[si*3+2] = o.position.z

				if(o == currentTarget) {
					targetPointsGeometryColors[si*4+0] = 1.0
					targetPointsGeometryColors[si*4+1] = 0.0
					targetPointsGeometryColors[si*4+2] = 0.0
					targetPointsGeometryColors[si*4+3] = 1.0
				} else {
					targetPointsGeometryColors[si*4+0] = 0.0
					targetPointsGeometryColors[si*4+1] = 1.0
					targetPointsGeometryColors[si*4+2] = 0.0
					targetPointsGeometryColors[si*4+3] = 1.0
				}

				si++

			}

		})

		for(var i = targetPointsGeometryPositions.length-1; i > si*3; i--) {
			targetPointsGeometryPositions[i] = 0
		}

		targetPointsGeometry.attributes.position.needsUpdate = true
		targetPointsGeometry.attributes.color.needsUpdate = true

		scene.updateMatrixWorld();
		scene.updateMatrix();
		
		var cameraMatrixPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
		
		ships.forEach(function(ship){
			
			ship.shield.material.uniforms.uViewVector.value = cameraMatrixPos.clone().sub(ship.position);
			
			var m = new THREE.Matrix4().getInverse(ship.matrixWorld).transpose();

			ship.shield.material.uniforms.uMyMat.value = new THREE.Matrix3().set(
				m.elements[0], m.elements[4], m.elements[8], 
				m.elements[1], m.elements[5], m.elements[9], 
				m.elements[2], m.elements[6], m.elements[10]
			);

			ship.shield.material.uniforms.uTime.value = runTime
			ship.shield.material.uniforms.uTime.needsUpdate = true
			
		});

		renderer.render(scene, camera)
	
		objects.forEach(function(o){
			
			o.position.add(cameraObjectPosition)
			
		})
		
		requestAnimationFrame(animate)
	
	}


	
	this.scene = scene
	
	this.renderer = renderer
	
	this.camera = camera
	
	this.objects = objects
	
	this.add = function(obj) {

		objects.push(obj)
		
		scene.add(obj)
		
	}
	
	this.remove = function(obj) {
		
		objects.forEach(function(o, i){
			
			if(o == obj) {
				
				objects.splice(i, 1)
				
			}
			
		})
		
		scene.remove(obj)
		
	}
	
	this.setCameraObject = function(obj) {
		
		camObject = obj

		obj.add(camera)

		//obj.shield.visible = false
		
	}

	this.getCameraObject = function(){
		return camObject
	}
	
	this.setTime = function(t) {
		
		runTime = t
		
	}

	this.setTarget = function(t) {

		currentTarget = t

	}
	
}

var shipGeometry = new THREE.SphereBufferGeometry(1,8,6)
var shipMaterial = new THREE.MeshBasicMaterial({color:0xffffff})

var shieldGeometry = new THREE.IcosahedronBufferGeometry(1.5,4)

var Ship = function(id, position, velocity) {

	var shieldMaterial = new THREE.ShaderMaterial({
		vertexShader:document.getElementById("shield-vs").textContent,
		fragmentShader:document.getElementById("shield-fs").textContent,
		uniforms:{
			uHitPos:{type:"v3v",value:[]},
			uHitTime:{type:"fv",value:[]},
			uTime:{type:"f", value:0},
			uPower:{type:"f", value:0},
			uMyMat:{type:"m3",value:new THREE.Matrix3()},
			uViewVector:{type:"v3",value:new THREE.Vector3()}
		},
		transparent:true,
		blending:THREE.AdditiveBlending
	})

	for(var i = 0; i < 64; i++) {
		shieldMaterial.uniforms.uHitPos.value.push(new THREE.Vector3())
		shieldMaterial.uniforms.uHitTime.value.push(0)
	}
	
	var mesh = new THREE.Mesh(shipGeometry, shipMaterial)

	mesh.castShadow = true
	mesh.receiveShadow = true

	var light = new THREE.PointLight(0xFFFFFF,1.0,500,1)

	mesh.add(light)
	
	mesh.GUID = id
	
	mesh.oType = "Ship"
	
	mesh.position.fromArray(position)
	
	mesh.velocity = new THREE.Vector3().fromArray(velocity)
	
	mesh.angVel = new THREE.Vector3()
	
	mesh.history = []
	
	mesh.hp = 100

	mesh.currentShieldPoints = mesh.maxShieldPoints = 100

	mesh.currentHullPoints = mesh.maxHullPoints = 100

	var shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
	
	mesh.add(shield)

	mesh.shield = shield

	var lastHitIdx = 0

	mesh.addHit = function(posArr) {
		shield.material.uniforms.uHitPos.value[lastHitIdx] = new THREE.Vector3().fromArray(posArr).normalize()
		shield.material.uniforms.uHitTime.value[lastHitIdx] = runTime
		lastHitIdx = (lastHitIdx+1)%64
		shield.material.uniforms.uHitPos.needsUpdate = true
		shield.material.uniforms.uHitTime.needsUpdate = true
	}


	var mainEngine = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.5,0.1,0.5,20,20,true), new THREE.MeshPhongMaterial({color:0x666666,side:THREE.DoubleSide}))

	mainEngine.geometry.rotateX(Math.PI/2)

	mainEngine.position.set(0,0,1)

	mesh.add(mainEngine)



	var rightEngine = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.5,0.1,0.5,20,20,true), new THREE.MeshPhongMaterial({color:0x666666,side:THREE.DoubleSide}))

	rightEngine.geometry.rotateX(Math.PI/2)

	rightEngine.position.set(1,0,0)

	rightEngine.rotateY(Math.PI/2)

	mesh.add(rightEngine)

	return mesh
	
}

var asteroidGeometry = new THREE.SphereBufferGeometry(1,20,20)

var asteroidMaterial = new THREE.MeshPhongMaterial({color:0xcccccc})

asteroidMaterial.shininess = 0.0

var Asteroid = function(id, radius, position, velocity) {
	
	var mesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial)
	
	mesh.GUID = id

	mesh.scale.multiplyScalar(radius)
	
	mesh.oType = "Asteroid"

	mesh.radius = radius
	
	mesh.position.fromArray(position)
	
	mesh.velocity = new THREE.Vector3().fromArray(velocity)
	
	mesh.angVel = new THREE.Vector3()
	
	mesh.history = []
	
	return mesh
	
}

var projectileGeometry = new THREE.SphereBufferGeometry(0.1)

var projectileMaterial = new THREE.MeshBasicMaterial({color:0xff0000})

var Projectile = function(id) {
	
	var mesh = new THREE.Mesh(projectileGeometry, projectileMaterial)

	var light = new THREE.PointLight(0xff0000,1.0,50,1)

	mesh.add(light)
	
	mesh.GUID = id
	
	mesh.oType = "Projectile"
	
	mesh.angVel = new THREE.Vector3()
	
	mesh.velocity = new THREE.Vector3()
	
	mesh.history = []
	
	return mesh
	
}

var missileGeometry = new THREE.SphereBufferGeometry()

var missileMaterial = new THREE.MeshBasicMaterial({color:0x0000ff})

var Missile = function(id, target) {
	
	var mesh = new THREE.Mesh(missileGeometry, missileMaterial)

	var light = new THREE.PointLight(0x0000ff,1.0,100,1)

	mesh.add(light)
	
	mesh.GUID = id
	
	mesh.oType = "Missile"
	
	mesh.angVel = new THREE.Vector3()
	
	mesh.velocity = new THREE.Vector3()
	
	mesh.history = []

	mesh.target = target
	
	return mesh
	
}

var mineGeometry = new THREE.SphereBufferGeometry(0.5)

var Mine = function(id) {
	
	var mesh = new THREE.Mesh(mineGeometry, new THREE.MeshBasicMaterial({color:0xffff00}))

	var light = new THREE.PointLight(0xffff00,1.0,50,1)

	mesh.add(light)
	
	mesh.GUID = id
	
	mesh.oType = "Mine"
	
	mesh.angVel = new THREE.Vector3()
	
	mesh.velocity = new THREE.Vector3()
	
	mesh.history = []
	
	return mesh
	
}

var explosionGeometry = new THREE.IcosahedronBufferGeometry(1,4)

var Explosion = function(id) {

	var mesh = new THREE.Points(explosionGeometry, new THREE.PointsMaterial({color:0xffffff}))

	var light = new THREE.PointLight(0xffffff,1.0,10,1)

	mesh.light = light

	mesh.add(light)

	mesh.GUID = id

	mesh.velocity = new THREE.Vector3()
	mesh.angVel = new THREE.Vector3()

	mesh.oType = "Explosion"

	mesh.history = []

	return mesh

}

var buffGeometry = new THREE.IcosahedronBufferGeometry(10,4)

var Buff = function(id, buffType) {

	var color = buffType == 0 ? 0xffff00 : 0x0000ff

	var mesh = new THREE.Mesh(buffGeometry, new THREE.MeshBasicMaterial({
		color:color,
		opacity:0.25,
		transparent:true
	}))

	var light = new THREE.PointLight(buffType,1.0,100,1)

	mesh.light = light

	mesh.add(light)

	mesh.light.visible = false

	mesh.GUID = id

	mesh.velocity = new THREE.Vector3()
	mesh.angVel = new THREE.Vector3()

	mesh.oType = "Buff"

	mesh.history = []

	return mesh

}