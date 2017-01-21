let controllers = {}

let addGamepad = (e) => {
  controllers[e.gamepad.index] = e.gamepad
}

let removeGamepad = (e) => {
  delete controllers[e.gamepad.index]
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

window.addEventListener('gamepadconnected', addGamepad)
window.addEventListener('gamepaddisconnected', removeGamepad)

export { scanGamepads, getGamepads }
