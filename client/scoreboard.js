var Scoreboard = function() {

    var players = []

    this.addPlayer = function(id, name, kills, deaths) {

        players.push({
            id:id,
            name:name,
            kills:kills,
            deaths:deaths
        })

        players.sort(playerSort)

        updateHtml()

    }

    this.removePlayer = function(id) {

        players.forEach(function(p,i){
            if(p.id == id) players.splice(i, 1)
        })

        updateHtml()

    }

    this.updatePlayer = function(id, kills, deaths) {
        players.forEach(function(p){

            if(p.id == id) {

                p.kills = kills
                p.deaths = deaths

            }

        })

        players.sort(playerSort)
        
        updateHtml()

    }

    function playerSort(a,b) {
        if(a.kills < b.kills) return 1
        else if(a.kills > b.kills) return -1
        else if(a.deaths > b.deaths) return 1
        else if(a.deaths < b.deaths) return -1
        else if(a.name > b.name) return 1
        else if(a.name < b.name) return -1
        else return 0
    }

    function updateHtml() {
        
        var sb = document.getElementById("scoreboard")

        for(var i = 0; i < sb.children.length; i++) {
            sb.removeChild(sb.children[i--  ])
        }

        players.forEach(function(player){

            var div = document.createElement("div")

            div.textContent = player.name + " | " + player.kills + " | " + player.deaths

            sb.appendChild(div)

        })

        

    }

}