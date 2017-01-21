let controllers = {}

let addGamepad = (gamepad) => {
  controllers[gamepad.index] = gamepad
}

let removeGamepad = (gamepad) => {
  delete controllers[gamepad.index]
}

let scanGamepads = () => {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [])
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (gamepads[i].index in controllers) {
        controllers[gamepads[i].index] = gamepads[i]
      } else {
        addGamepad(gamepads[i])
      }
    }
  }
}

let getGamepads = () => {
  return controllers
}

window.addEventListener('gamepadconnected', (e) => { addGamepad(e.gamepad) })
window.addEventListener('gamepaddisconnected', (e) => { removeGamepad(e.gamepad) })

export { scanGamepads, getGamepads }
