Array.prototype.remove = function(element) {
	
	var idx = this.indexOf(element)
	
	if(idx != -1) {
		
		this.splice(idx, 1)
		
		return true
	
	}
	
	return false
	
}

var THREE = require("three")

THREE.Vector3.prototype.randomize = function(s,o) {
	
	this.set(Math.random(),Math.random(),Math.random()).multiplyScalar(s).addScalar(o)
	
	return this
	
}

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

THREE.Vector3.prototype.mod = function(a) {
	
	this.x = this.x.mod(a)
	this.y = this.y.mod(a) 
	this.z = this.z.mod(a)
	
	return this
	
}

var Game = function(id) {

    this.maxPlayers = 100

    var numAsteroids = 200

    var gameRunning = true

    var objects = []

    var nextAsteroidID = 1

    var asteroids = []

    var nextPlayerID = 1

    var players = []

    this.players = players

    var nextShipID = 1

    var ships = []

    var nextProjectileID = 1

    var projectiles = []

    var nextMissileID = 1

    var missiles = []

    var nextBuffID = 1

    var buffs = []

    var nextMineID = 1

    var mines = []

    var tree

    this.setPlayerTarget = function(player, id) {
        ships.forEach(function(s){
            if(s.GUID == id) {
                player.ship.target = s
                return s
            }
        })
    }

    this.createPlayer = function(client, name, isBot) {
        
        var player = new Player(nextPlayerID++, client, name, this)
        
        player.send(JSON.stringify(["my player", player.GUID, runTime]))

        asteroids.forEach(function(asteroid){
            
            player.send(JSON.stringify(["new asteroid", asteroid.GUID, asteroid.radius, asteroid.position.toArray(), asteroid.velocity.toArray()]))
            
        })

        buffs.forEach(function(buff){
            
            player.send(JSON.stringify(["new buff", buff.GUID, buff.buffType, buff.position.toArray()]))
            
        })
        
        players.forEach(function(p){
            
            player.send(JSON.stringify(["new player", p.GUID, p.name, p.stats.kills, p.stats.deaths]))
            
        })
        
        players.push(player)
        
        players.forEach(function(p2){
            
            p2.send(JSON.stringify(["new player", player.GUID, player.name, player.stats.kills, player.stats.deaths]))

        })
        
        ships.forEach(function(ship){
            
            player.send(JSON.stringify(["new ship", ship.GUID, ship.position.toArray(), ship.velocity.toArray(), ship.controller.GUID]))
            
        })
        
        player.ship = createShip(player)
        
        return player
        
    }

    this.removePlayer = function(player) {

        removeShip(player.ship)

        players.remove(player)

        players.forEach(function(player2){
            player2.send(JSON.stringify(["player left", player.GUID]))
        })

        delete player.game

    }

    this.close = function() {
        gameRunning = false
        players.forEach(function(player2){
            player2.send(JSON.stringify(["game closed"]))
        })
    }

    var createShip = function(controller) {
        
        var ship = new Ship(nextShipID++, controller)

        ship.position.randomize(1000,0)
        while(asteroidAtPosition(ship.position, 1)) ship.position.randomize(1000,0)
            
        ship.velocity.randomize(20,0)
        
        ships.push(ship)
        
        objects.push(ship)
        
        players.forEach(function(player){
            
            player.send(JSON.stringify(["new ship", ship.GUID, ship.position.toArray(), ship.velocity.toArray(), ship.controller.GUID]))
            
        })
        
        return ship
        
    }

    var removeShip = function(ship) {
        
        ships.remove(ship)
        
        objects.remove(ship)
        
        players.forEach(function(player){
            
            player.send(JSON.stringify(["ship removed", ship.GUID]))
            
        })
        
    }

    var createProjectile = function(ship) {
        
        var projectile = new Projectile(nextProjectileID++, ship.controller)
        
        projectile.position.copy(ship.position)
        
        projectile.quaternion.copy(ship.quaternion)
        
        projectile.velocity.copy(ship.velocity)
        
        projectile.velocity.add(new THREE.Vector3(0,0,-1200).applyQuaternion(projectile.quaternion))
        
        projectile.position.add(new THREE.Vector3(0,0,-ship.radius-projectile.radius-0.1).applyQuaternion(projectile.quaternion))
        
        projectiles.push(projectile)
        
        objects.push(projectile)
        
        players.forEach(function(player){
            
            player.send(JSON.stringify(["new projectile", projectile.GUID, ship.GUID]))
            
        })

        setTimeout(function(){

            removeProjectile(projectile)

        }, 3000)
        
        return projectile
        
    }

    var removeProjectile = function(projectile) {
        
        projectiles.remove(projectile)
        
        objects.remove(projectile)
        
        players.forEach(function(player){
            
            player.send(JSON.stringify(["projectile removed", projectile.GUID]))
            
        })
        
    }

    var createMissile = function(ship, target) {

        if(!target) return false
        
        var missile = new Missile(nextMissileID++, ship.controller, target)

        missile.position.copy(ship.position)
        
        missile.quaternion.copy(ship.quaternion)
        
        missile.velocity.copy(ship.velocity)
        
        missile.velocity.add(new THREE.Vector3(0,0,-100).addScalar((Math.random()-0.5)*10).normalize().multiplyScalar(10).applyQuaternion(missile.quaternion))
        
        missile.position.add(new THREE.Vector3(0,0,-ship.radius-missile.radius-0.1).applyQuaternion(missile.quaternion))
        
        missiles.push(missile)
        
        objects.push(missile)

        players.forEach(function(player){
            
            player.send(JSON.stringify(["new missile", missile.GUID, ship.GUID, target.GUID]))
            
        })

        setTimeout(function(){

            removeMissile(missile)

        }, 30000)
        
        return missile
        
    }

    var removeMissile = function(missile) {
        
        missiles.remove(missile)
        
        objects.remove(missile)

        players.forEach(function(player){
            
            player.send(JSON.stringify(["missile removed", missile.GUID]))
            
        })
    }

    var createMine = function(ship) {
        
        var mine = new Mine(nextMineID++, ship.controller)
        
        mine.position.copy(ship.position)
        
        mine.quaternion.copy(ship.quaternion)
        
        mine.velocity.copy(ship.velocity)
        
        mine.velocity.add(new THREE.Vector3(0,0,-100).applyQuaternion(mine.quaternion))
        
        mine.position.add(new THREE.Vector3(0,0,-1.5).applyQuaternion(mine.quaternion))
        
        mines.push(mine)
        
        objects.push(mine)
        
        players.forEach(function(player){
            
            player.send(JSON.stringify(["new mine", mine.GUID, ship.GUID]))
            
        })

        setTimeout(function(){

            //removeProjectile(mine)

        }, 30000)
        
        return mine
        
    }

    var removeMine = function(mine) {
        
        mines.remove(mine)
        
        objects.remove(mine)
    }

    var createBuff = function() {

        if(buffs.length >= 50) return false
        
        var buff = new Buff(nextBuffID++, Math.round(Math.random()))

        buff.position.randomize(1000, 0)
        
        buffs.push(buff)
        
        objects.push(buff)

        players.forEach(function(player){
            player.send(JSON.stringify(["new buff", buff.GUID, buff.buffType, buff.position.toArray()]))
        })
        
        return buff
        
    }

    var removeBuff = function(buff, ship) {
        
        buffs.remove(buff)
        
        objects.remove(buff)

        players.forEach(function(player){
            player.send(JSON.stringify(["buff removed", buff.GUID, ship.GUID]))
        })

    }

    var asteroidAtPosition = function(p, r) {
            
        var found = false
        
        for(var i = 0; i < asteroids.length; i++) {

            var rp = asteroids[i].position.clone().sub(p).addScalar(500).mod(1000).subScalar(500)

            var dist = rp.length()
            
            if(dist <= asteroids[i].radius + r) {
            
                found = true

                break
            
            }
            
        }

        return found
        
    }

    var createAsteroid = function() {
        
        var radius = Math.random() * 90 + 10
        
        var position = new THREE.Vector3().randomize(1000,0)
        
        while(asteroidAtPosition(position, radius)) position.randomize(1000,0)

            
        var velocity = new THREE.Vector3().randomize(1000/radius, -500/radius).multiplyScalar(0)
        
        var angVel = new THREE.Vector3().randomize(1/radius, -0.5/radius).multiplyScalar(0)
        
        var asteroid = new Asteroid(nextAsteroidID++, position, radius, velocity, angVel)
        
        asteroids.push(asteroid)
        
        objects.push(asteroid)

        players.forEach(function(player){

            player.send(JSON.stringify(["new asteroid", asteroid.GUID, asteroid.radius, asteroid.position.toArray(), asteroid.velocity.toArray()]))

        })
        
        return asteroid
        
    }

    var removeAsteroid = function(asteroid) {
        
        asteroids.remove(asteroid)
        
        objects.remove(asteroid)

        players.forEach(function(player){
            
            player.send(JSON.stringify(["asteroid removed", asteroid.GUID]))
            
        })

    }

    var broadcastPlayerStats = function() {

        players.forEach(function(p1){

            players.forEach(function(p2){

                p1.send(JSON.stringify(["player stats", p2.GUID, p2.stats.kills, p2.stats.deaths]))

            })
                
        })

    }

    var lastIterationTime = Date.now()

    var runTime = 0

    function tabTargets(client) {
        return false;
        var frustum = new THREE.Frustum()

        var camera = new THREE.PerspectiveCamera(45, client.player.controls.windowAspect, 0.1, 1000)

        camera.position.copy(client.player.ship.position)
        camera.quaternion.copy(client.player.ship.quaternion)

        camera.updateMatrix()
        camera.updateMatrixWorld()
        camera.updateProjectionMatrix()

        frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

        var inside = []

        ships.forEach(function(s){

            if(frustum.containsPoint(s.position)) {
                var d = s.position.distanceTo(client.player.ship.position)
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
            client.player.ship.currentTarget = inside[0].s
            client.player.send(JSON.stringify(["new target", client.player.ship.currentTarget.GUID]))
        }


    }

    function stickMineToAsteroid(mine, asteroid) {

        if(mine.sticksTo == false) {

            mine.velocity.copy(asteroid.velocity)

            players.forEach(function(player){
                player.send(JSON.stringify(["stick mine to asteroid", runTime, mine.GUID, asteroid.GUID]))
            })

            mine.sticksTo = asteroid

        }

    }

    function checkWinConditions() {

        var over = false

        players.forEach(function(player){
            if(player.stats.kills >= 25) {
                over = true
            }
        })

        if(over) {
            
            gameRunning = false

            for(var i = 0; i < asteroids.length; i++) {
                removeAsteroid(asteroids[i--])
            }
            for(var i = 0; i < buffs.length; i++) {
                removeBuff(buffs[i--])
            }

            for(var i = 0; i < players.length; i++) {
                if(players[i].isBot) {
                    removePlayer(players[i--])
                }
            }

            setTimeout(function(){
                restart()
            }, 10000)



        }
        
    }

    function restart(meh) {

        tree = new Node(0,0,0,1000,0,3)

        for(var i = 0; i < numAsteroids; i++) {
            createAsteroid()
        }

        for(var i = 0; i < 100; i++) {
            //var player = createPlayer({socket:{readyState:9}}, false, true)
        }
        
        gameRunning = true

        runTime = 0

        players.forEach(function(player){
            //if(player.ship) player.ship.velocity.multiplyScalar(0)
            player.stats.kills = player.stats.deaths = 0
            player.send(JSON.stringify(["my player", player.GUID, runTime]))
        })

        broadcastPlayerStats()

    }

    function checkCollision(o1, o2, c, dt_s) {

        var relPosOrig = o2.position.clone().sub(o1.position).addScalar(500).mod(1000).subScalar(500)

        var relPosOrigDot = relPosOrig.dot(relPosOrig)

        var radii = o1.radius + o2.radius

        var radii2 = radii*radii

        if(relPosOrigDot < radii2) {
            
            var collision = {
                o1:o1,
                o2:o2,
                distance2:0,
                time:0,	
                pos: relPosOrig.clone().normalize(),
                //vel: relVel.clone()
            };

            for(var i = 0; i < c.length; i++) if(c[i].time > collision.time) break;
            c.splice(i,0,collision);

            return
            
        }

        var relVel = o1.velocity.clone().sub(o2.velocity);

        //var relPos = relPosOrig.clone().addScalar(500).mod(1000).subScalar(500)
        
        var stepLength = relVel.length() * dt_s;

        var r2 = relPosOrig.dot(relPosOrig);
        
        var distance = relPosOrig.length();
        
        if(stepLength >= distance - radii) {
            
            var relVelNorm = relVel.clone().normalize();
            
            var dotProd = relPosOrig.clone().dot(relVelNorm);
            
            var d = Math.pow(radii, 2) - (r2 - Math.pow(dotProd, 2));

            if(d > 0) {

                var hitPosition = dotProd - Math.sqrt(d);

                if(stepLength > hitPosition && hitPosition > 0) {

                    var collision = {
                        o1:o1,
                        o2:o2,
                        distance:hitPosition,
                        time:dt_s * (hitPosition/stepLength),
                        pos: relPosOrig.clone().normalize(),
                        vel: relVel.clone()
                    };

                    for(var i = 0; i < c.length; i++) if(c[i].time > collision.time) break;
                    c.splice(i,0,collision);									
                    
                }
                
            }
                    
        }
        
    }


    var Player = function(id, client, name, game) {
        
        this.game = game

        this.GUID = id
        
        this.client = client
        
        this.controls = {
            
            keys:{},
            mousebtn:{},
            mp:new THREE.Vector2(),
            windowAspect:1
        }

        this.name = "Player " + id

        if(name) this.name = name

        this.stats = {
            kills:0,
            deaths:0
        }

        this.send = function(msg) {

            if(this.client.socket.readyState == 1) {

                this.client.socket.send(msg)

            }

        }
        
    }

    var O3D = function(id, mass) {
        
        THREE.Object3D.call(this)
        
        this.GUID = id

        this.mass = mass
        
        this.velocity = new THREE.Vector3()
        
        this.torque = new THREE.Vector3()
        
        this.angVel = new THREE.Vector3()
        
        this.acceleration = new THREE.Vector3()
        
        this.iterateVelocity = false
        
        this.iterateRotation = false
        
        this.iteratePosition = false

        this.staticPosition = false
        
    }

    O3D.prototype = new THREE.Object3D()

    var Asteroid = function(id, position, radius, velocity, angVel) {
            
        var mass = radius*radius*radius
        
        O3D.call(this, id, mass)
        
        this.oType = "Asteroid"
        
        this.mass = mass
        
        this.radius = radius
        
        this.position.copy(position)
        
        this.velocity.copy(velocity)
        
        this.angVel.copy(angVel)
        
        this.iterateVelocity = true
        
        this.iterateRotation = true
        
        this.iteratePosition = true

        this.staticPosition = true
        
    }

    Asteroid.prototype = new O3D()

    var Buff = function(id, buffType) {
        
        O3D.call(this, id, 0)
        
        this.oType = "Buff"

        this.buffType = buffType
        
        this.radius = 10

        this.staticPosition = true
        
    }

    Buff.prototype = new O3D()

    var Mine = function(id) {
        
        O3D.call(this, id, 10)
        
        this.radius = 0.5
        
        this.oType = "Mine"
        
        this.sticksTo = false

        this.target = null

        this.iteratePosition = true
        
    }

    Mine.prototype = new O3D()

    var Ship = function(id, controller) {
        
        O3D.call(this, id, 1000)
        
        this.oType = "Ship"
        
        this.radius = 1
        
        this.controller = controller
        
        this.maxHullPoints = this.currentHullPoints = 100
        
        this.maxShieldPoints = this.currentShieldPoints = 100
        
        this.projectiles = 250
        
        this.missiles = 10
        
        this.mines = 5
        
        this.lastFireTime = 0
        
        this.cooldown = 50

        this.lastMineFireTime = 0

        this.mineCooldown = 1000

        this.lastMissileFireTime = 0

        this.missileCooldown = 200
        
        this.currentTarget = null
        
        this.iterateAngVel = true

        this.iterateVelocity = true
        
        this.iterateRotation = true
        
        this.iteratePosition = true

        var mesh = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(1,4), new THREE.MeshBasicMaterial())

        mesh.geometry.computeBoundingSphere()

        //this.add(mesh)




        this.modules = []

        var mainEngine = new THREE.Object3D()

        mainEngine.thrust = 100000

        mainEngine.moduleType = "Engine"

        mainEngine.triggerType = "Key"

        mainEngine.triggerKey = " "

        mainEngine.position.set(0,0,1)

        this.modules.push(mainEngine)


        var backCrossEngine = new CrossEngine({triggerType:"Key",triggerKey:["w","a","s","d"]})

        backCrossEngine.position.set(0,0,1)

        this.modules.push(backCrossEngine)


        var frontCrossEngine = new CrossEngine({triggerType:"Key",triggerKey:["w","a","s","d"]})

        frontCrossEngine.position.set(0,0,-1)

        this.modules.push(frontCrossEngine)

    }

    Ship.prototype = new O3D()

    var CrossEngine = function(options) {

        THREE.Object3D.call(this)

        this.moduleType = "CrossEngine"

        this.triggerType = options.triggerType

        this.triggerKey = options.triggerKey


        this.engines = []

        
        var bottomEngine = new THREE.Object3D()

        bottomEngine.thrust = 25000

        bottomEngine.moduleType = "Engine"

        bottomEngine.triggerType = this.triggerType

        bottomEngine.triggerKey = this.triggerKey[0]

        bottomEngine.rotateX(Math.PI/2)

        this.engines.push(bottomEngine)

        
        var rightEngine = new THREE.Object3D()

        rightEngine.thrust = 25000

        rightEngine.moduleType = "Engine"

        rightEngine.triggerType = this.triggerType

        rightEngine.triggerKey = this.triggerKey[1]

        rightEngine.rotateY(Math.PI/2)

        this.engines.push(rightEngine)


        var topEngine = new THREE.Object3D()

        topEngine.thrust = 25000

        topEngine.moduleType = "Engine"

        topEngine.triggerType = this.triggerType

        topEngine.triggerKey = this.triggerKey[2]

        topEngine.rotateX(-Math.PI/2)

        this.engines.push(topEngine)


        var leftEngine = new THREE.Object3D()

        leftEngine.thrust = 25000

        leftEngine.moduleType = "Engine"

        leftEngine.triggerType = this.triggerType

        leftEngine.triggerKey = this.triggerKey[3]

        leftEngine.rotateY(-Math.PI/2)

        this.engines.push(leftEngine)

    }

    CrossEngine.prototype = new THREE.Object3D()


    var Missile = function(id, shooter, target) {
        
        O3D.call(this, id, 100)
        
        this.oType = "Missile"
        
        this.radius = 0.5
        
        this.target = target

        this.shooter = shooter
            
        this.iterateVelocity = true
        
        this.iterateRotation = false
        
        this.iteratePosition = true

    }

    Missile.prototype = new O3D()

    var Projectile = function(id, shooter) {
        
        O3D.call(this, id, 0.1)
        
        this.oType = "Projectile"
        
        this.radius = 0.1
                
        this.iteratePosition = true
        
        this.shooter = shooter

    }

    Projectile.prototype = new O3D()

    var level3Nodes = []

    var Node = function(x1,y1,z1,s,level,maxLevel) {

        this.x1 = x1
        this.y1 = y1
        this.z1 = z1
        this.s = s
        this.level = level

        if(this.level == 2) {
            level3Nodes.push(this)
        }

        this.objects = []

        this.nodes = []

        if(level < maxLevel) {

            var newLevel = level+1
            var s2 = s/2

            this.nodes = [
                new Node(x1,y1,z1,s2,newLevel,maxLevel),
                new Node(x1+s2,y1,z1,s2,newLevel,maxLevel),
                new Node(x1,y1+s2,z1,s2,newLevel,maxLevel),
                new Node(x1+s2,y1+s2,z1,s2,newLevel,maxLevel),
                new Node(x1,y1,z1+s2,s2,newLevel,maxLevel),
                new Node(x1+s2,y1,z1+s2,s2,newLevel,maxLevel),
                new Node(x1,y1+s2,z1+s2,s2,newLevel,maxLevel),
                new Node(x1+s2,y1+s2,z1+s2,s2,newLevel,maxLevel)
            ]

        }
    }

    Node.prototype.add = function(o) {

        if(
            (o.position.x >= this.x1 && o.position.x <= this.x1+this.s) &&
            (o.position.y >= this.y1 && o.position.y <= this.y1+this.s) &&
            (o.position.z >= this.z1 && o.position.z <= this.z1+this.s)
        ) {
            this.objects.push(o)
            o.currentTreeNode = this
            for(var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].add(o)
            }
        }

    }

    restart()

    ;(function buffs(){

        createBuff()

        setTimeout(buffs, 1000)

    })()

    ;(function sendRunTime(){

        players.forEach(function(p){
            
            p.send(JSON.stringify(["runtime", runTime]))
        
        })

        setTimeout(sendRunTime, 5000)

    })()

    ;(function iterate(){

        var dt_ms = Date.now() - lastIterationTime
        
        lastIterationTime += dt_ms

        if(gameRunning) {

            runTime += dt_ms
            
            var dt_s = dt_ms / 1000
            
            var collisions = []

            /*
            level3Nodes = []

            tree = new Node(0,0,0,1000,0,2)

            objects.forEach(function(o){

                tree.add(o)

            })

            level3Nodes.forEach(function(n){

                for(var i = 0; i < n.objects.length; i++) {
                
                    for(var j = i+1; j < n.objects.length; j++) {

                        checkCollision(n.objects[i], n.objects[j], collisions, dt_s)

                    }

                }

            })*/

            for(var i = 0; i < objects.length; i++) {

                for(var j = i+1; j < objects.length; j++) {

                    if(objects[j].staticPosition && objects[i].staticPosition) {}
                    else {

                        checkCollision(objects[i], objects[j], collisions, dt_s)

                    }				
                    
                }
                
            }
            
            collisions.forEach(function(c){

                if(c.o1.oType == "Asteroid" && c.o2.oType == "Asteroid") {
                    
                    c.o1.velocity.reflect(c.pos)
                    c.o2.velocity.reflect(c.pos)
                    
                    //c.o1.position.add(c.o1.velocity.clone().multiplyScalar(dt_s))
                    //c.o2.position.add(c.o2.velocity.clone().multiplyScalar(dt_s))
                    players.forEach(function(player){
                        player.send(JSON.stringify(["asteroid update", runTime, c.o1.GUID, c.o1.position.toArray(), c.o1.velocity.toArray()]))
                        player.send(JSON.stringify(["asteroid update", runTime, c.o2.GUID, c.o2.position.toArray(), c.o2.velocity.toArray()]))
                    })
                    
                } else if((c.o1.oType == "Asteroid" && c.o2.oType == "Ship") || (c.o1.oType == "Ship" && c.o2.oType == "Asteroid")) {
                    
                    var ship = c.o1.oType == "Ship" ? c.o1 : c.o2

                    ship.velocity.reflect(c.pos).multiplyScalar(0.5)
                    
                } else if((c.o1.oType == "Asteroid" && c.o2.oType == "Projectile") || (c.o1.oType == "Projectile" && c.o2.oType == "Asteroid")) {
                    
                    var projectile = c.o1.oType == "Projectile" ? c.o1 : c.o2

                    removeProjectile(projectile)
                    
                } else if((c.o1.oType == "Asteroid" && c.o2.oType == "Missile") || (c.o1.oType == "Missile" && c.o2.oType == "Asteroid")) {
                    
                    var missile = c.o1.oType == "Missile" ? c.o1 : c.o2

                    removeMissile(missile)
                    
                } else if((c.o1.oType == "Asteroid" && c.o2.oType == "Mine") || (c.o1.oType == "Mine" && c.o2.oType == "Asteroid")) {
                    
                    var mine = c.o1.oType == "Mine" ? c.o1 : c.o2
                    var asteroid = c.o1.oType == "Asteroid" ? c.o1 : c.o2
                    
                    stickMineToAsteroid(mine, asteroid)
                    
                } else if((c.o1.oType == "Buff" && c.o2.oType == "Ship") || (c.o1.oType == "Ship" && c.o2.oType == "Buff")) {
                    
                    var buff = c.o1.oType == "Buff" ? c.o1 : c.o2
                    var ship = c.o1.oType == "Ship" ? c.o1 : c.o2

                    if(buff.buffType == 0) ship.projectiles += 50
                    else if(buff.buffType == 1) ship.missiles += 5
                    removeBuff(buff, ship)
                    
                } else if((c.o1.oType == "Ship" && c.o2.oType == "Projectile") || (c.o1.oType == "Projectile" && c.o2.oType == "Ship")) {
                    
                    var projectile = c.o1.oType == "Projectile" ? c.o1 : c.o2
                    var ship = c.o1.oType == "Ship" ? c.o1 : c.o2

                    removeProjectile(projectile)

                    var rphugo = ship.position.clone().sub(projectile.position).normalize().toArray()

                    players.forEach(function(player){

                        player.send(JSON.stringify(["ship hit", ship.GUID, rphugo, ship.currentShieldPoints, ship.currentHullPoints]))
                        
                    })

                    ship.currentShieldPoints -= 10

                    if(ship.currentShieldPoints < 0) {

                        ship.currentHullPoints += ship.currentShieldPoints

                        ship.currentShieldPoints = 0

                        if(ship.currentHullPoints <= 0) {

                            var controller = ship.controller
                            removeShip(ship)
                            ship.controller.stats.deaths++
                            projectile.shooter.stats.kills++
                            broadcastPlayerStats()
                            checkWinConditions()

                            setTimeout(function(){

                                controller.ship = createShip(controller)

                            }, 3000)

                        }

                    }
                    
                } else if((c.o1.oType == "Ship" && c.o2.oType == "Missile") || (c.o1.oType == "Missile" && c.o2.oType == "Ship")) {
                    
                    var missile = c.o1.oType == "Missile" ? c.o1 : c.o2
                    var ship = c.o1.oType == "Ship" ? c.o1 : c.o2

                    removeMissile(missile)

                    var rphugo = ship.position.clone().sub(missile.position).normalize().toArray()

                    players.forEach(function(player){

                        player.send(JSON.stringify(["ship hit", ship.GUID, rphugo, ship.currentShieldPoints, ship.currentHullPoints]))

                    })

                    ship.currentShieldPoints -= 25

                    if(ship.currentShieldPoints < 0) {

                        ship.currentHullPoints += ship.currentShieldPoints

                        ship.currentShieldPoints = 0

                        if(ship.currentHullPoints <= 0) {

                            var controller = ship.controller
                            removeShip(ship)
                            ship.controller.stats.deaths++
                            missile.shooter.stats.kills++
                            broadcastPlayerStats()
                            checkWinConditions()

                            setTimeout(function(){

                                controller.ship = createShip(controller)

                            }, 3000)

                        }

                    }
                    
                    
                }
                
            })

            missiles.forEach(function(m){

                var vLength = m.velocity.length()

                var r = m.target.position.clone().sub(m.position)

                r.addScalar(500).mod(1000).subScalar(500)

                var rvLength = r.clone().normalize().multiplyScalar(vLength)

                var vDiff = rvLength.clone().sub(m.velocity)

                var dLength = vDiff.length() * 100

                var rest = Math.max(0, 200 - dLength)

                m.acceleration = vDiff.normalize().multiplyScalar(Math.min(dLength, 200))

                m.acceleration.add(r.clone().normalize().multiplyScalar(rest))

            })
            
            ships.forEach(function(ship){

                ship.currentShieldPoints = Math.min(ship.maxShieldPoints, ship.currentShieldPoints + dt_s * 10)
                
                ship.acceleration.set(0,0,0)

                ship.torque.set(0,0,0)

                var moduleForce = new THREE.Vector3()

                var moduleTorque = new THREE.Vector3()

                var desiredAngVel = new THREE.Vector3(-ship.controller.controls.mp.y, -ship.controller.controls.mp.x, 0)

                var diffAngVel = ship.angVel.clone().sub(desiredAngVel)

                var diffAngVelLength = diffAngVel.length()

                ship.modules.forEach(function(module){

                    if(module.moduleType == "Engine") {

                        if(module.triggerType == "Key") {

                            if(ship.controller.controls.keys[module.triggerKey]) {

                                module.engineActive = true

                            } else module.engineActive = false

                        }

                        if(module.engineActive) {

                            var force = new THREE.Vector3(0,0,-1).applyQuaternion(module.quaternion).multiplyScalar(module.thrust)

                            var torque = new THREE.Vector3(0,0,0).sub(module.position).cross(force)

                            moduleTorque.add(torque)

                            moduleForce.add(force)

                        }

                    } else if(module.moduleType == "CrossEngine") {

                        var engineForce = new THREE.Vector3()

                        module.engines.forEach(function(engine){

                            if(engine.triggerType == "Key") {

                                if(ship.controller.controls.keys[engine.triggerKey]) {
    
                                    engine.engineActive = true
    
                                } else engine.engineActive = false
    
                            }

                            var forceVector = new THREE.Vector3(0,0,-1).applyQuaternion(engine.quaternion).applyQuaternion(module.quaternion)

                            var torqueVector = new THREE.Vector3(0,0,0).sub(module.position).cross(forceVector)

                            var addedAngVel = diffAngVel.clone().sub(torqueVector.clone().multiplyScalar(dt_s))

                            var addedAngVelLength = addedAngVel.length()

                            if(engine.engineActive || addedAngVelLength < diffAngVelLength) {

                                var force = forceVector.clone().multiplyScalar(engine.thrust)
    
                                var torque = torqueVector.clone().multiplyScalar(engine.thrust)

                                moduleTorque.add(torque)

                                moduleForce.add(force)
    
                            }

                        })

                    }

                })

                ship.acceleration.add(moduleForce.clone().applyQuaternion(ship.quaternion).divideScalar(ship.mass))

                ship.torque.add(moduleTorque.clone().multiplyScalar(-Math.PI/180).divideScalar(ship.mass))



                /*
                        
                if(ship.controller.controls.keys["w"]) {
                    
                    ship.acceleration.y += 100
                    
                } 
                if(ship.controller.controls.keys["s"]) {
                    
                    ship.acceleration.y -= 100
                    
                }
                if(ship.controller.controls.keys["a"]) {
                    
                    ship.acceleration.x -= 100
                    
                }
                if(ship.controller.controls.keys["d"]) {
                    
                    ship.acceleration.x += 100
                    
                }
                if(ship.controller.controls.keys[" "]) {
                    
                    if(ship.controller.controls.keys["shift"]) {
                        
                        ship.acceleration.z += 200
                        
                    } else ship.acceleration.z -= 200
                    
                }
                
                ship.acceleration.applyQuaternion(ship.quaternion)
                
                ship.angVel.set(-ship.controller.controls.mp.y, -ship.controller.controls.mp.x, 0)

                */

                if(ship.controller.controls.mousebtn[0]) {
                    
                    if(ship.lastFireTime + ship.cooldown < lastIterationTime && ship.projectiles > 0) {
                        
                        ship.lastFireTime = lastIterationTime

                        ship.projectiles--
                        
                        var projectile = createProjectile(ship)

                    }
                
                }

                if(ship.controller.controls.mousebtn[2]) {


                    if(ship.lastMissileFireTime + ship.missileCooldown < lastIterationTime && ship.missiles > 0) {

                        ship.lastMissileFireTime = lastIterationTime

                        ship.missiles--
                        
                        var missile = createMissile(ship, ship.target)

                    }
                    
                }

                if(ship.controller.controls.keys["m"]) {
                    
                    if(ship.lastMineFireTime + ship.mineCooldown < lastIterationTime) {
                        
                        ship.lastMineFireTime = lastIterationTime
                        
                        var mine = createMine(ship)
                
                    }
                    
                }
                
            })
            
            objects.forEach(function(o){
                
                if(o.iterateAngVel) {
                    
                    o.angVel.add(o.torque.clone().multiplyScalar(dt_s))
                
                }
                
            })

            objects.forEach(function(o){
                
                if(o.iterateRotation) {
                    
                    o.rotateX(o.angVel.x * dt_s)
                    o.rotateY(o.angVel.y * dt_s)
                    o.rotateZ(o.angVel.z * dt_s)
                
                }
                
            })
            
            objects.forEach(function(o){
                
                if(o.iterateVelocity) {
                
                    o.velocity.add(o.acceleration.clone().multiplyScalar(dt_s))
                
                }
                
            })
            
            objects.forEach(function(o){
                
                if(o.iteratePosition) {
                
                    o.position.add(o.velocity.clone().multiplyScalar(dt_s))
                    
                    o.position.mod(1000)
                
                }
                
            })

        }
        
        setTimeout(iterate, 1)
        
    })()

    ;(function broadcast(){

        if(gameRunning) {
            
            players.forEach(function(player){
                
                ships.forEach(function(ship){
                    
                    player.send(JSON.stringify(["ship update", runTime, ship.GUID, ship.position.toArray(), ship.velocity.toArray(), ship.quaternion.toArray(), ship.angVel.toArray(), ship.currentShieldPoints, ship.currentHullPoints, ship.projectiles, ship.missiles]))
                    
                })
                
            })

        }
        
        setTimeout(broadcast, 100)
        
    })()

	
}

module.exports = Game