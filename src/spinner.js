/* global PIXI */
import 'pixi.js'

class Spinner {
  constructor (position, color, beat = 4, offset = 0, spinSpeed = 10, initialAngle = 0, width = 10, blur = 10) {
    beat = beat * 7 / 4
    this.blur = blur
    this.beat = beat
    this.offset = offset
    this.spinSpeed = spinSpeed
    this.gfx = new PIXI.Graphics()
    this.gfx.position.x = position[0]
    this.gfx.position.y = position[1]
    this.gfx.clear()
    this.gfx.lineStyle(width / 100, color)
    this.gfx.moveTo(0.0, -10)
    this.gfx.lineTo(0.0, 10)
    var blurFilter = new PIXI.filters.BlurFilter()
    blurFilter.blur = 10
    this.gfx.filters = [blurFilter]
    this.gfx.blendMode = PIXI.BLEND_MODES.SCREEN
    this.gfx.transform.rotation = initialAngle
  }

  pushGame (game) {
    game.viewport.addChild(this.gfx)
  }

  popGame (game) {
    game.viewport.removeChild(this.gfx)
  }

  update (game) {
    let time = (game.gametime + this.offset)
    this.gfx.transform.rotation = time / this.spinSpeed
    let amp = Math.sin(time * this.beat)
    this.gfx.filters[0].blur = amp * this.blur + this.blur * 2
  }
}

export { Spinner }
