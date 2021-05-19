let express = require(`express`)
let socketio = require(`socket.io`)
let profanity = require(`profanity-middleware`)
let game = require(`./game`)
let app = express()

// specify directory for CSS, JS, and images
app.use(express.static(`public`))

// enable receiving JSON data
app.use(express.json())

// filter bad words for all routes
profanity.setOptions({
  fullyMasked: true,
})
app.use(profanity.init)

// start the app
let server = app.listen(3012)
let io = socketio.listen(server)

io.on(`connection`, socket => {
  // update last ping time to let the server know that player is still connected
  socket.on(`pingServer`, data => {
    game.setPingTime(data.playerId)
  })
})

// interval to broadcast game data to all players
setInterval(() => {
  io.emit(`data`, game.getData())
}, 50)

// route to the game page
app.get(`/`, (request, response) => {
  response.sendFile(`${__dirname}/index.html`)
})

// route to get game data
app.get(`/data`, (request, response) => {
  response.send(game.getData())
})

// route to join the game
app.post(`/join`, (request, response) => {
  let playerId = game.join(request.body.name, request.body.gender, request.body)

  response.send(playerId)
})

// route to move a player
app.post(`/move`, (request, response) => {
  game.move(request.body.playerId, request.body.direction)

  response.send(`ok`)
})

// route to throw a ball
app.post(`/throw`, (request, response) => {
  game.throw(request.body.playerId)

  response.send(`ok`)
})

app.post(`/throw4`, (request, response) => {
  game.throw4(request.body.playerId)

  response.send(`ok`)
})

app.post(`/leave`, (request, response) => {
  game.leave(request.body.playerId)

  response.send(`ok`)
})
