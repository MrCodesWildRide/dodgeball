// open a socket connection to the server
var socket = window.io();

// HTML elements that are constantly updated
var playingArea = document.getElementById("playingArea");
var playerList = document.getElementById("playerList");

// played ID stored in the player's browser
// passed to the server to indicate which player should be moving or throwing a ball
// starts as undefined and is assigned by the server when joining the game
var playerId;

// focus the name text box when the page is loaded
document.getElementById("nameInput").focus();

// activate the control keys
document.addEventListener("keydown", keydown);

// activate the join game button
document.getElementById("joinButton").addEventListener("click", joinGame);

// get game data from the server
getData();

// listen for game data changes from the server
socket.on("data", function(data) {
    updatePlayingArea(data.players, data.balls);
    updatePlayerList(data.players);
});

function keydown(event) {
    // check if the user has joined the game
    if (playerId) {
        if (event.keyCode == 32) { // space bar
            throwBall();
        }
        else if (event.keyCode == 37) { // left arrow
            movePlayer("left");
        }
        else if (event.keyCode == 38) { // up arrow
            movePlayer("up");
        }
        else if (event.keyCode == 39) { // right arrow
            movePlayer("right");
        }
        else if (event.keyCode == 40) { // down arrow
            movePlayer("down");
        }
        else if (event.keyCode == 27) {
            var request = new XMLHttpRequest();
            request.open("POST", "/leave");
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            request.send("playerId=" + playerId);
        }
    }
    else {
        if (event.keyCode == 13) { // enter
            joinGame();
        }
    }
}

function joinGame() {
    // get the user-inputted name and gender
    var name = document.getElementById("nameInput").value;
    var gender = document.querySelector('input[name="gender"]:checked').value;

    // create a request to the server
    var request = new XMLHttpRequest();

    // handle response from the server
    request.addEventListener("load", joinResponse);

    // send the request to the server
    request.open("POST", "/join");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("name=" + name + "&gender=" + gender + "&boundaries=on");
}

function joinResponse() {
    // check if the response is a player ID
    // if no player ID was returned, then the user was not able to join the game
    if (this.response) {
        // set the player ID so that the user can control their player
        playerId = this.response;

        // hide the join game controls and show the game instructions
        var joinPanel = document.getElementById("joinPanel");
        joinPanel.classList.add("instructions");
        joinPanel.innerHTML = "Use the arrow keys to move, and the space bar to throw a ball.";

        // ping the server every second to let the server know that player is still connected
        setInterval(ping, 1000);
    }
}

function movePlayer(direction) {
    // create a request to the server
    var request = new XMLHttpRequest();

    // send the request to the server
    request.open("POST", "/move");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("playerId=" + playerId + "&direction=" + direction);
}

function throwBall() {
    // create a request to the server
    var request = new XMLHttpRequest();

    // send the request to the server
    request.open("POST", "/throw");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("playerId=" + playerId);
}

function throwBall4() {
    var request = new XMLHttpRequest();
    request.open("POST", "/throw4");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("playerId=" + playerId);
}

function getData() {
    // create a request to the server
    var request = new XMLHttpRequest();

    // handle response from the server
    request.addEventListener("load", dataResponse);

    // send the request to the server
    request.open("GET", "/data");
    request.send();
}

function dataResponse() {
    // parse response into an object
    var data = JSON.parse(this.response);

    // update the playing area and player list with the response
    updatePlayingArea(data.players, data.balls);
    updatePlayerList(data.players);
}

function updatePlayingArea(players, balls) {
    // clear the playing area
    playingArea.innerHTML = "";

    // add players to the playing area
    for (var id in players) {
        var player = players[id];

        if (player.gender != "ninja") {
            // create player div
            var playerDiv = document.createElement("div");
            playerDiv.classList.add("player");
            playerDiv.classList.add(player.gender);
            playerDiv.classList.add(player.facing);
            playerDiv.style.left = player.leftValue + "px";
            playerDiv.style.top = player.topValue + "px";

            // create player name div
            var playerNameDiv = document.createElement("div");
            playerNameDiv.classList.add("playerName");
            playerNameDiv.innerText = player.name;

            // add extra styling if the player is the user's player
            if (id == playerId) {
                playerNameDiv.classList.add("me");
            }

            // add the player and player name divs to the playing area
            playingArea.appendChild(playerDiv);
            playingArea.appendChild(playerNameDiv);

            // center the player name beneath the player
            var offset = (playerNameDiv.offsetWidth - playerDiv.offsetWidth) / 2;
            playerNameDiv.style.left = (player.leftValue - offset) + "px";
            playerNameDiv.style.top = (player.topValue + 46) + "px";
        }
    }

    // add balls to the playing area
    for (var id in balls) {
        var ball = balls[id];

        // create ball div
        var ballDiv = document.createElement("div");
        ballDiv.classList.add("ball");
        ballDiv.style.left = ball.leftValue + "px";
        ballDiv.style.top = ball.topValue + "px";

        // add the ball div to the playing area
        playingArea.appendChild(ballDiv);
    }
}

function updatePlayerList(players) {
    // clear the player list
    playerList.innerHTML = "";

    // add players to the player list
    for (var id in players) {
        var player = players[id];

        // create player row div
        var playerRowDiv = document.createElement("div");
        playerRowDiv.classList.add("playerRow");

        // add extra styling if the player is the user's player
        if (id == playerId) {
            playerRowDiv.classList.add("me");
        }

        // create player name div
        var playerRowNameDiv = document.createElement("div");
        playerRowNameDiv.classList.add("playerRowName");

        if (player.theme == "rainbow") {
            var rainbow = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];

            for (var i = 0; i < player.name.length; i++) {
                var span = document.createElement("span");
                span.innerText = player.name[i];
                span.style.color = rainbow[i % rainbow.length];

                playerRowNameDiv.appendChild(span);
            }
        }
        else {
            playerRowNameDiv.innerText = player.name;
        }

        // create player points div
        var playerRowPointsDiv = document.createElement("div");
        playerRowPointsDiv.classList.add("playerRowPoints");
        playerRowPointsDiv.innerHTML = player.points;

        // add the player name and player points divs to the player row div
        playerRowDiv.appendChild(playerRowNameDiv);
        playerRowDiv.appendChild(playerRowPointsDiv);

        // add the player row div to the player list
        playerList.appendChild(playerRowDiv);
    }
}

function ping() {
    // ping the server to let the server know that player is still connected
    socket.emit("pingServer", { playerId: playerId });
}
