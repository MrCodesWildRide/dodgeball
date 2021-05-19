// open a socket connection to the server
let socket = io()

// HTML elements that are constantly updated
let playingArea = document.getElementById(`playingArea`)
let playerList = document.getElementById(`playerList`)

// player ID stored in the player's browser
// passed to the server to indicate which player should be moving or throwing a ball
// starts as undefined and is assigned by the server when joining the game
let playerId

// activate the control keys
document.addEventListener(`keydown`, keyPressed)

// activate the join game button
document.getElementById(`joinButton`).addEventListener(`click`, joinGame)

// focus the name text box
document.getElementById(`nameInput`).focus()

// get game data from the server
getData()

// listen for game data changes from the server
socket.on(`data`, showData)

function keyPressed(event) {
  // check if the user has joined the game
  if (playerId == null) {
    if (event.keyCode == 13) {
      // enter
      joinGame()
    }
  } else {
    if (event.keyCode == 32) {
      // space bar
      throwBall()
    } else if (event.keyCode == 37) {
      // left arrow
      movePlayer(`left`)
    } else if (event.keyCode == 38) {
      // up arrow
      movePlayer(`up`)
    } else if (event.keyCode == 39) {
      // right arrow
      movePlayer(`right`)
    } else if (event.keyCode == 40) {
      // down arrow
      movePlayer(`down`)
    } else if (event.keyCode == 27) {
      let request = new XMLHttpRequest()
      request.open(`POST`, `/leave`)
      request.setRequestHeader(`Content-Type`, `application/json`)

      let requestBody = {
        playerId: playerId,
      }

      request.send(JSON.stringify(requestBody))
    }
  }
}

function joinGame() {
  // get the user-inputted name and gender
  let name = document.getElementById(`nameInput`).value
  let gender = document.querySelector(`input[name="gender"]:checked`).value

  // create a request to the server
  let request = new XMLHttpRequest()

  // handle response from the server
  request.addEventListener(`load`, joinResponse)

  // configure the request to the server
  request.open(`POST`, `/join`)
  request.setRequestHeader(`Content-Type`, `application/json`)

  // create the request body that will be sent to the server
  let requestBody = {
    name: name,
    gender: gender,
    boundaries: `on`,
  }

  // send the request to the server
  request.send(JSON.stringify(requestBody))
}

function joinResponse() {
  // check the server response
  // if -1 was returned, then the user was not able to join the game
  if (this.response != `-1`) {
    // set the player ID so that the user can control their player
    playerId = this.response

    // hide the join game controls and show the game instructions
    let joinPanel = document.getElementById(`joinPanel`)
    joinPanel.classList.add(`instructions`)
    joinPanel.innerHTML = `Use the arrow keys to move, and the space bar to throw a ball.`

    // ping the server every second to let the server know that player is still connected
    setInterval(ping, 1000)
  }
}

function movePlayer(direction) {
  // create a request to the server
  let request = new XMLHttpRequest()

  // configure the request to the server
  request.open(`POST`, `/move`)
  request.setRequestHeader(`Content-Type`, `application/json`)

  // create the request body that will be sent to the server
  let requestBody = {
    playerId: playerId,
    direction: direction,
  }

  // send the request to the server
  request.send(JSON.stringify(requestBody))
}

function throwBall() {
  // create a request to the server
  let request = new XMLHttpRequest()

  // configure the request to the server
  request.open(`POST`, `/throw`)
  request.setRequestHeader(`Content-Type`, `application/json`)

  // create the request body that will be sent to the server
  let requestBody = {
    playerId: playerId,
  }

  // send the request to the server
  request.send(JSON.stringify(requestBody))
}

function throwBall4() {
  let request = new XMLHttpRequest()
  request.open(`POST`, `/throw4`)
  request.setRequestHeader(`Content-Type`, `application/json`)

  let requestBody = {
    playerId: playerId,
  }

  request.send(JSON.stringify(requestBody))
}

function getData() {
  // create a request to the server
  let request = new XMLHttpRequest()

  // handle response from the server
  request.addEventListener(`load`, dataResponse)

  // send the request to the server
  request.open(`GET`, `/data`)
  request.send()
}

function dataResponse() {
  // parse server response into an object
  let data = JSON.parse(this.response)

  // show data on the page
  showData(data)
}

function showData(data) {
  // update the playing area and player list
  updatePlayingArea(data.players, data.balls)
  updatePlayerList(data.players)
}

function updatePlayingArea(players, balls) {
  // clear the playing area
  playingArea.innerHTML = ``

  // add players to the playing area
  for (let id in players) {
    let player = players[id]

    if (player.gender != `ninja`) {
      // create player div
      let playerDiv = document.createElement(`div`)
      playerDiv.classList.add(`player`, player.gender, player.facing)
      playerDiv.style.left = `${player.leftValue}px`
      playerDiv.style.top = `${player.topValue}px`

      // create player name div
      let playerNameDiv = document.createElement(`div`)
      playerNameDiv.classList.add(`playerName`)
      playerNameDiv.innerText = player.name

      // add extra styling if the player is the user's player
      if (id == playerId) {
        playerNameDiv.classList.add(`me`)
      }

      // add the player and player name divs to the playing area
      playingArea.appendChild(playerDiv)
      playingArea.appendChild(playerNameDiv)

      // center the player name beneath the player
      let offset = (playerNameDiv.offsetWidth - playerDiv.offsetWidth) / 2
      playerNameDiv.style.left = `${player.leftValue - offset}px`
      playerNameDiv.style.top = `${player.topValue + 46}px`
    }
  }

  // add balls to the playing area
  for (let id in balls) {
    let ball = balls[id]

    // create ball div
    let ballDiv = document.createElement(`div`)
    ballDiv.classList.add(`ball`)
    ballDiv.style.left = `${ball.leftValue}px`
    ballDiv.style.top = `${ball.topValue}px`

    // add the ball div to the playing area
    playingArea.appendChild(ballDiv)
  }
}

function updatePlayerList(players) {
  // clear the player list
  playerList.innerHTML = ``

  // add players to the player list
  for (let id in players) {
    let player = players[id]

    // create player row div
    let playerRowDiv = document.createElement(`div`)
    playerRowDiv.classList.add(`playerRow`)

    // add extra styling if the player is the user's player
    if (id == playerId) {
      playerRowDiv.classList.add(`me`)
    }

    // create player name div
    let playerRowNameDiv = document.createElement(`div`)
    playerRowNameDiv.classList.add(`playerRowName`)

    if (player.theme == `rainbow`) {
      let rainbow = [`red`, `orange`, `yellow`, `green`, `blue`, `indigo`, `violet`]

      for (let i = 0; i < player.name.length; i++) {
        let span = document.createElement(`span`)
        span.innerText = player.name[i]
        span.style.color = rainbow[i % rainbow.length]

        playerRowNameDiv.appendChild(span)
      }
    } else {
      playerRowNameDiv.innerText = player.name
    }

    // create player points div
    let playerRowPointsDiv = document.createElement(`div`)
    playerRowPointsDiv.classList.add(`playerRowPoints`)
    playerRowPointsDiv.innerHTML = player.points

    // add the player name and player points divs to the player row div
    playerRowDiv.appendChild(playerRowNameDiv)
    playerRowDiv.appendChild(playerRowPointsDiv)

    // add the player row div to the player list
    playerList.appendChild(playerRowDiv)
  }
}

function ping() {
  // create the data that will be sent to the server
  let data = {
    playerId: playerId,
  }

  // ping the server to let the server know that player is still connected
  socket.emit(`pingServer`, data)
}
