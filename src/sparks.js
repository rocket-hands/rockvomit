/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

class Sparks {
  constructor (position, art) {
    let config = {
      'alpha': {
        'start': 0.4,
        'end': 0.0
      },
      'scale': {
        'start': 0.0025,
        'end': 0.002
      },
      'color': {
        'start': 'ffff00',
        'end': 'ff00ff'
      },
      'speed': {
        'start': 3.5,
        'end': 4.5
      },
      'startRotation': {
        'min': 0,
        'max': 360
      },
      'rotationSpeed': {
        'min': 100,
        'max': 1000
      },
      'lifetime': {
        'min': 0.25,
        'max': 0.5
      },
      'blendMode': 'screen',
      'frequency': 0.001,
      'emitterLifetime': 0,
      'maxParticles': 200,
      'pos': {
        'x': 0,
        'y': 0
      },
      'addAtBack': false,
      'spawnType': 'circle',
      'spawnCircle': {
        'x': 0,
        'y': 0,
        'r': 0
      }
    }
    this.emitterContainer = new PIXI.Container()
    this.emitter = new PIXI.particles.Emitter(this.emitterContainer, art, config)
    this.emitter.particleConstructor = PIXI.particles.Particle
    this.emitter.scale = [0.05, 0.05]
    this.emitterContainer.scale.x = 0.75
    this.emitterContainer.scale.y = 0.75
    this.emitterContainer.blendMode = PIXI.BLEND_MODES.COLOR_DODGE
  }

  pushGame (game) {
    game.viewport.addChild(this.emitterContainer)
  }

  popGame (game) {
    game.viewport.removeChild(this.emitterContainer)
  }

  update (game, dt) {
    this.emitter.update(dt)
  }
}

export { Sparks }
