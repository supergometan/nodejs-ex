var Game = require("./game")

var GameServer = function() {

    this.nextClientID = 1

    this.clients = []

    this.nextGameID = 1

    this.games = []

}

GameServer.prototype.createClient = function(socket) {

    var client = {
        id:this.nextClientID++,
        socket:socket,
        player:null
    }

    this.clients.push(client)

    return client

}

GameServer.prototype.removeClient = function(client) {

    this.leaveGame(client)

    client.socket = null

    var idx = this.clients.indexOf(client)

    if(idx != -1) {

        this.clients.splice(idx, 1)

    }

}

GameServer.prototype.createGame = function() {

    var game = new Game(this.nextGameID++)

    this.games.push(game)

    return game

}

GameServer.prototype.removeGame = function(game) {

    game.close()

    var idx = this.games.indexOf(game)

    if(idx != -1) {

        this.games.splice(idx, 1)

    }

}

GameServer.prototype.leaveGame = function(client) {

    if(client.player && client.player.game) {

        var game = client.player.game

        game.removePlayer(client.player)

        client.player = null

        if(game.players.length == 0) {

            this.removeGame(game)

        }

    }

}

GameServer.prototype.processMessage = function(client, message) {

    if(message[0] == "quickjoin") {

        var game

        for(var i = 0; i < this.games.length; i++) {

            if(this.games[i].players.length < this.games[i].maxPlayers) {

                game = this.games[i]

                break

            }

        }

        if(!game) {

            game = this.createGame()

        }

        client.player = game.createPlayer(client, message[1])

    } else if(client.player != null) {

        if(message[0] == "keydown") {
        
            client.player.controls.keys[message[1]] = true

            if(message[1] == "tab") {
                //tabTargets(client)
            }
            
        } else if(message[0] == "keyup") {
            
            delete client.player.controls.keys[message[1]]
            
        } else if(message[0] == "mousemove") {
            
            client.player.controls.mp.set(message[1], message[2])
            
        } else if(message[0] == "mousedown") {
            
            client.player.controls.mousebtn[message[1]] = true
            
        } else if(message[0] == "mouseup") {
            
            delete client.player.controls.mousebtn[message[1]]
            
        } else if(message[0] == "windowAspect") {

            client.player.controls.windowAspect = message[1]

        } else if(message[0] == "new target") {

            client.player.game.setPlayerTarget(client.player, message[1])

        }

    }

}

module.exports = GameServer