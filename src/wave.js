/* global PIXI */
import 'pixi.js'

class Wave {
  constructor (position, color, beat = 4, lambda = 10, offset = 0, width = 10, blur = 10, height = 2) {
    beat = beat * 7 / 4
    this.lambda = lambda
    this.width = width
    this.height = height
    this.color = color
    this.blur = blur
    this.beat = beat
    this.offset = offset
    this.gfx = new PIXI.Graphics()
    this.gfx.position.x = position[0]
    this.gfx.position.y = position[1]
    this.beating = false
    var blurFilter = new PIXI.filters.BlurFilter()
    blurFilter.blur = blur
    this.gfx.filters = [blurFilter]
    this.gfx.blendMode = PIXI.BLEND_MODES.SCREEN
  }

  pushGame (game) {
    game.viewport.addChild(this.gfx)
  }

  popGame (game) {
    game.viewport.removeChild(this.gfx)
  }

  update (game) {
    let num = 30
    let width = 10
    let time = (game.gametime + this.offset)
    let height = this.height
    if (this.beating) {
      let amp = Math.sin(time * this.beat)
      height = this.height + amp
    }

    this.gfx.clear()
    this.gfx.lineStyle(this.width / 100, this.color)

    // draw wave
    let points = []
    for (var i = 0; i < num; i += 1) {
      points.push(Math.sin(time * this.beat + (i / num) * this.lambda * 10))
    }

    let x, y
    for (i = 0; i < num; i += 1) {
      x = ((i - num / 2) / num) * width
      y = points[i] * height
      points[i] = [x, y]
    }

    this.gfx.moveTo(...points[0])
    for (i = 1; i < num; i += 1) {
      this.gfx.lineTo(...points[i])
    }
  }
}

export { Wave }
