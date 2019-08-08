var express = require("express");
var socketio = require("socket.io");
var bodyParser = require("body-parser");
var profanity = require("profanity-middleware");
var game = require("./game");

var app = express();

// specify directory for CSS, JS, and images
app.use(express.static(__dirname + "/public"));

// enable form parameters
app.use(bodyParser.urlencoded({
    extended: true
}));

// filter bad words for all routes
profanity.setOptions({
    fullyMasked: true
});
app.use(profanity.init);

// start the app
var server = app.listen(process.env.PORT || 3001, function() {
    console.log("app started");
});

var io = socketio.listen(server);

io.on("connection", function(socket) {
    // update last ping time to let the server know that player is still connected
    socket.on("pingServer", function(data) {
        game.setPingTime(data.playerId);
    });
});

// loop to broadcast game data to all players
setInterval(function() {
    io.emit("data", game.getData());
}, 50);

// route to the game page
app.get("/", function(request, response) {
    response.sendFile(__dirname + "/index.html");
});

// route to get game data
app.get("/data", function(request, response) {
    response.send(game.getData());
});

// route to join the game
app.post("/join", function(request, response) {
    var playerId = game.join(request.body.name, request.body.gender, request.body.theme, request.body.boundaries);

    response.send(playerId);
});

// route to move a player
app.post("/move", function(request, response) {
    game.move(request.body.playerId, request.body.direction);

    response.send("ok");
});

// route to throw a ball
app.post("/throw", function(request, response) {
    game.throw(request.body.playerId);

    response.send("ok");
});

app.post("/throw4", function(request, response) {
    game.throw4(request.body.playerId);

    response.send("ok");
});

app.post("/leave", function(request, response) {
    game.leave(request.body.playerId);

    response.send("ok");
});
