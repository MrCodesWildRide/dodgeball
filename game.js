// game constants
const playingAreaWidth = 648
const playingAreaHeight = 384
const playerWidth = 36
const playerHeight = 48
const squaresAcross = playingAreaWidth / playerWidth
const squaresDown = playingAreaHeight / playerHeight
const directions = [`left`, `up`, `right`, `down`]

// game data
let numPlayers = 0
let numBalls = 0
let players = {}
let balls = {}
let playersThrowingBalls = {}

// interval to handle players and balls
setInterval(() => {
  // manage which players are still in the game
  handlePlayers()

  // move balls and check collisions
  handleBalls()
}, 50)

// sets the last ping time of a player
module.exports.setPingTime = playerId => {
  // get player from the player dictionary
  let player = players[playerId]

  if (player != null) {
    // let the server know that the player is still connected
    player.lastPing = Date.now()
  }
}

// returns the game data
module.exports.getData = () => {
  // create the data that will be sent back to the client
  let data = {
    players: players,
    balls: balls,
  }

  return data
}

// adds a new player to the game and returns the new player ID
module.exports.join = (name, gender, options) => {
  // remove leading and trailing spaces from the player's name and gender
  name = name == null ? `` : name.trim()
  gender = gender == null ? `` : gender.trim()

  if (name == ``) {
    // name was left blank, so return -1 to indicate that the player has not joined
    return String(-1)
  } else {
    // generate a new player ID
    numPlayers++
    let playerId = numPlayers

    // create a new player and add it to the player dictionary
    players[playerId] = {
      name: name,
      gender: gender,
      points: 0,
      leftValue: Math.floor(Math.random() * squaresAcross) * playerWidth,
      topValue: Math.floor(Math.random() * squaresDown) * playerHeight,
      facing: directions[Math.floor(Math.random() * directions.length)],
      lastPing: Date.now(),
    }

    if (options.boundaries == `off`) {
      players[playerId].boundaries = `off`
    }

    if (options.theme == `rainbow`) {
      players[playerId].theme = `rainbow`
    }

    // return the new player ID so that the client knows which player is theirs
    return String(playerId)
  }
}

// changes a player's position and orientation
module.exports.move = (playerId, direction) => {
  // get player from the player dictionary
  let player = players[playerId]

  if (player != null) {
    // get the player's current position and orientation
    let leftValue = player.leftValue
    let topValue = player.topValue
    let facing = player.facing

    // change player's position and orientation based on specified direction
    if (direction == `left`) {
      leftValue -= playerWidth
      facing = `left`
    } else if (direction == `up`) {
      topValue -= playerHeight
      facing = `up`
    } else if (direction == `right`) {
      leftValue += playerWidth
      facing = `right`
    } else if (direction == `down`) {
      topValue += playerHeight
      facing = `down`
    }

    // check if the player's new position is within the playing area
    if (inPlayingArea(leftValue, topValue) || player.boundaries == `off`) {
      // set the player's new position and orientation
      player.leftValue = leftValue
      player.topValue = topValue
      player.facing = facing
    }

    // let the server know that the player is still connected
    player.lastPing = Date.now()
  }
}

// creates a new ball for a specified player
module.exports.throw = playerId => {
  // get player from the player dictionary
  let player = players[playerId]

  if (player != null && playersThrowingBalls[playerId] == null) {
    // get the player`s current position
    let leftValue = player.leftValue
    let topValue = player.topValue

    // set the new ball's position based on the player's orientation
    if (player.facing == `left`) {
      leftValue -= playerWidth
    } else if (player.facing == `up`) {
      topValue -= playerHeight
    } else if (player.facing == `right`) {
      leftValue += playerWidth
    } else if (player.facing == `down`) {
      topValue += playerHeight
    }

    // check if the ball's position is within the playing area
    if (inPlayingArea(leftValue, topValue) || player.boundaries == `off`) {
      // generate a new ball ID
      numBalls++
      let ballId = numBalls

      // create a new ball and add it to the ball dictionary
      balls[ballId] = {
        thrower: playerId,
        leftValue: leftValue,
        topValue: topValue,
        direction: player.facing,
      }

      if (player.boundaries == `off`) {
        balls[ballId].boundaries = `off`
      }

      // set the time that the player threw the ball
      playersThrowingBalls[playerId] = Date.now()
    }

    // let the server know that the player is still connected
    player.lastPing = Date.now()
  }
}

module.exports.throw4 = playerId => {
  let player = players[playerId]

  if (player != null && playersThrowingBalls[playerId] == null) {
    for (let direction of directions) {
      let leftValue = player.leftValue
      let topValue = player.topValue

      if (direction == `left`) {
        leftValue -= playerWidth
      } else if (direction == `up`) {
        topValue -= playerHeight
      } else if (direction == `right`) {
        leftValue += playerWidth
      } else if (direction == `down`) {
        topValue += playerHeight
      }

      if (inPlayingArea(leftValue, topValue) || player.boundaries == `off`) {
        numBalls++
        let ballId = numBalls

        balls[ballId] = {
          thrower: playerId,
          leftValue: leftValue,
          topValue: topValue,
          direction: direction,
        }

        if (player.boundaries == `off`) {
          balls[ballId].boundaries = `off`
        }

        playersThrowingBalls[playerId] = Date.now()
      }
    }

    player.lastPing = Date.now()
  }
}

module.exports.leave = playerId => {
  delete players[playerId]
}

// helper function to manage which players are still in the game,
// and which players can throw balls
function handlePlayers() {
  // loop through all the players
  for (let playerId in players) {
    // get player from the player dictionary
    let player = players[playerId]

    // check if the player has pinged the server in the last 5 seconds
    if (Date.now() - player.lastPing > 5000) {
      // remove player from the player dictionary
      delete players[playerId]
    }

    // check if the player has thrown a ball in the last half second
    if (Date.now() - playersThrowingBalls[playerId] > 500) {
      // remove player from the ball throwing dictionary
      delete playersThrowingBalls[playerId]
    }
  }
}

// helper function to move balls and check collisions
function handleBalls() {
  // loop through all the balls
  for (let ballId in balls) {
    // get ball from the ball dictionary
    let ball = balls[ballId]

    // get the balls's current position
    let leftValue = ball.leftValue
    let topValue = ball.topValue

    // check if the ball is colliding with a player
    if (collidingWithPlayer(leftValue, topValue)) {
      // remove ball from the ball dictionary
      delete balls[ballId]

      // get the player who threw the ball from the player dictionary
      let thrower = players[ball.thrower]

      if (thrower != null) {
        // award a point to the thrower
        thrower.points++
      }
    } else {
      // set the new ball's position based on the balls's direction
      if (ball.direction == `left`) {
        leftValue -= playerWidth
      } else if (ball.direction == `up`) {
        topValue -= playerHeight
      } else if (ball.direction == `right`) {
        leftValue += playerWidth
      } else if (ball.direction == `down`) {
        topValue += playerHeight
      }

      // check if the ball's position is within the playing area
      if (inPlayingArea(leftValue, topValue)) {
        // set the ball's new position
        ball.leftValue = leftValue
        ball.topValue = topValue
      } else if (ball.boundaries == `off` && inExtendedPlayingArea(leftValue, topValue)) {
        ball.leftValue = leftValue
        ball.topValue = topValue
      } else {
        // remove ball from the ball dictionary
        delete balls[ballId]
      }
    }
  }
}

// helper function to check if a position is within the playing area
function inPlayingArea(leftValue, topValue) {
  return (
    leftValue >= 0 && leftValue < playingAreaWidth && topValue >= 0 && topValue < playingAreaHeight
  )
}

function inExtendedPlayingArea(leftValue, topValue) {
  return (
    leftValue >= -1000 &&
    leftValue < playingAreaWidth + 1000 &&
    topValue >= -1000 &&
    topValue < playingAreaHeight + 1000
  )
}

// helper function to check if a position matches a player's position
function collidingWithPlayer(leftValue, topValue) {
  // loop through all the players
  for (let playerId in players) {
    // get player from the player dictionary
    let player = players[playerId]

    // check if the position matches the player's position
    if (leftValue == player.leftValue && topValue == player.topValue) {
      // positions match, so return true
      return true
    }
  }

  // position did not match any player's position, so return false
  return false
}
