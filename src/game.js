/* global PIXI */
import 'pixi.js'
import p2 from 'p2'
import { Howl } from 'howler'
import { scanGamepads, getGamepads } from 'gamepad'

const FPS = 60

const SOUNDS = [
  'wilhelm',
  'music'
]

const TEXTURES = [
  'dave_head',
  'dave_hips',
  'dave_left_forearm',
  'dave_left_hand',
  'dave_left_shin',
  'dave_left_upper_arm',
  'dave_left_upper_leg',
  'dave_right_forearm',
  'dave_right_hand',
  'dave_right_shin',
  'dave_right_upper_arm',
  'dave_right_upper_leg',
  'dave_torso',
  'jack_head',
  'jack_hips',
  'jack_left_forearm',
  'jack_left_hand',
  'jack_left_shin',
  'jack_left_upper_arm',
  'jack_left_upper_leg',
  'jack_right_forearm',
  'jack_right_hand',
  'jack_right_shin',
  'jack_right_upper_arm',
  'jack_right_upper_leg',
  'jack_torso',
  'labs',
  'stage'
]

class Entity {
  constructor (texture, scale, physics) {
    this.sprite = null
    this.body = null
    if (texture) {
      this.sprite = new PIXI.Sprite(texture)
      this.sprite.anchor.x = 0.5
      this.sprite.anchor.y = 0.5
      if (scale) {
        this.sprite.scale.x = scale
        this.sprite.scale.y = scale
      }
    }
    if (physics) {
      let type = physics.type
      delete (physics.type)
      this.body = new p2.Body(physics)
      switch (type) {
        case 'plane':
          this.body.addShape(new p2.Plane())
          break
        case 'box':
        default:
          this.body.addShape(new p2.Box({
            width: this.sprite.width,
            height: this.sprite.height
          }))
      }
    }
  }

  pushGame (game) {
    if (game.viewport && this.sprite) {
      game.viewport.addChild(this.sprite)
    }
    if (game.world && this.body) {
      game.world.addBody(this.body)
    }
  }

  popGame (game) {
    if (game.world && this.body) {
      game.world.removeBody(this.body)
    }
    if (game.viewport && this.sprite) {
      game.viewport.removeChild(this.sprite)
      this.sprite.destroy(true, true)
    }
  }

  update (dt) {
    if (this.sprite && this.body) {
      this.sprite.position.x = this.body.position[0]
      this.sprite.position.y = this.body.position[1]
      this.sprite.rotation = this.body.angle
    }
  }

  debug (viewport, show) {
    if (this.body) {
      if (!this.debugSprite && show) {
        this.debugSprite = new PIXI.Graphics()
        this.debugSprite.lineStyle(0.01, 0x00FF00)
        for (var shape of this.body.shapes) {
          switch (shape.constructor.name) {
            case 'Box':
              this.debugSprite.moveTo(...shape.vertices[0])
              for (var vertex of shape.vertices) {
                this.debugSprite.lineTo(...vertex)
              }
              break
            case 'Plane':
              this.debugSprite.drawCircle(...shape.position, 0.05)
              break
          }
        }
        viewport.addChild(this.debugSprite)
      }
      if (show) {
        this.debugSprite.position.x = this.body.position[0]
        this.debugSprite.position.y = this.body.position[1]
        this.debugSprite.rotation = this.body.angle
      } else if (this.debugSprite) {
        viewport.removeChild(this.debugSprite)
        this.debugSprite = null
      }
    }
  }
}

class Ragdoll extends Entity {
  constructor (name, position, scale, textures) {
    super(null, 1, null)
    this.name = name
    this.position = position
    this.scale = scale
    this.parts = {}
    this.addPart(textures, 'head', [0, 2.5], 1)
    this.addPart(textures, 'hips', [0, 1], 1)
    this.addPart(textures, 'left_hand', [-2, 2], 0.1)
    this.addPart(textures, 'left_forearm', [-1.5, 2], 0.1)
    this.addPart(textures, 'left_upper_arm', [-1, 2], 0.1)
    this.addPart(textures, 'left_upper_leg', [-1, 1], 0.1)
    this.addPart(textures, 'left_shin', [-1, 0], 0.1)
    this.addPart(textures, 'right_hand', [1, 2], 0.1)
    this.addPart(textures, 'right_forearm', [1.5, 2], 0.1)
    this.addPart(textures, 'right_upper_arm', [1, 2], 0.1)
    this.addPart(textures, 'right_upper_leg', [1, 1], 0.1)
    this.addPart(textures, 'right_shin', [1, 0], 0.1)
  }

  addPart (textures, name, offset, mass) {
    this.parts[name] = new Entity(textures[`${this.name}_${name}`], this.scale, {
      mass: mass,
      position: [this.position[0] + offset[0], this.position[1] + offset[1]],
      angularVelocity: 0
    })
  }

  pushGame (game) {
    for (var name in this.parts) {
      this.parts[name].pushGame(game)
    }
    if (this.parts.head) {
      this.parts.head.sprite.interactive = true
      this.parts.head.sprite.on('mousedown', () => { game.sounds.wilhelm.play() })
      this.parts.head.sprite.on('touchstart', () => { game.sounds.wilhelm.play() })
    }
  }

  popGame (game) {
    for (var name in this.parts) {
      this.parts[name].popGame(game)
    }
  }

  update (dt) {
    for (var name in this.parts) {
      this.parts[name].update(dt)
    }
  }

  debug (viewport, show) {
    for (var name in this.parts) {
      this.parts[name].debug(viewport, show)
    }
  }
}

class Game {
  constructor (elementId, data) {
    this.state = 'waiting'
    this.data = data
    this.gametime = 0.0
    this.frequency = 1.0 / FPS
    this.canvas = document.getElementById(elementId)
    this.camera = {
      x: 0,
      y: 0,
      z: 100
    }
    this.gamepads = getGamepads()
    this.scanGamepads = scanGamepads
    this.getGamepads = getGamepads
    this.debugLayer = null
    this.entities = {}
  }

  boot (callback) {
    this.state = 'booting'
    this.init()
    this.load(callback)
  }

  run () {
    this.state = 'running'
    this.resize()
    this.spawn()
    this.loop()
  }

  stop () {
    this.state = 'stopping'
    for (var name in this.entities) {
      this.removeEntity(name)
    }
    for (var sound of SOUNDS) {
      this.sounds[sound].unload()
    }
    for (var texture of TEXTURES) {
      this.textures[texture].destroy(true)
    }
    PIXI.loader.reset()
    this.viewport.destroy()
    this.game.destroy()
    this.gametime = 0
    window.game = undefined
  }

  update (dt) {
    this.updateHands()
    this.world.step(dt)
    for (var name in this.entities) {
      this.entities[name].update(dt)
    }
  }

  updateHands () {
    if (this.gamepads[0]) {
      this.entities.lhand.body.position[0] = this.gamepads[0].axes[0] - 0.5
      this.entities.lhand.body.position[1] = -this.gamepads[0].axes[1]
      this.entities.rhand.body.position[0] = this.gamepads[0].axes[2] + 0.5
      this.entities.rhand.body.position[1] = -this.gamepads[0].axes[3]
    }
  }

  init () {
    this.world = new p2.World()
    this.game = new PIXI.Application(800, 500, { view: this.canvas })
    window.game = this

    this.viewport = new PIXI.Container()
    this.game.stage.addChild(this.viewport)
  }

  resize () {
    this.viewport.position.x = this.game.renderer.width / 2 + this.camera.x
    this.viewport.position.y = this.game.renderer.height / 2 + this.camera.y
    let ratio = this.canvas.scrollWidth / this.canvas.scrollHeight
    this.viewport.scale.x = this.camera.z
    this.viewport.scale.y = -this.camera.z
    if (ratio < 1.6) this.viewport.scale.y *= (ratio / 1.6)
    if (ratio > 1.6) this.viewport.scale.y *= (ratio / 1.6)
  }

  load (callback) {
    this.sounds = {}
    for (var sound of SOUNDS) {
      this.sounds[sound] = new Howl({
        src: [require(`assets/${sound}.webm`), require(`assets/${sound}.mp3`)]
      })
    }
    for (var texture of TEXTURES) {
      PIXI.loader.add(texture, require(`assets/${texture}.png`))
    }
    PIXI.loader.once('complete', () => { this.addTextures(callback) })
    PIXI.loader.load()
  }

  addTextures (callback) {
    this.textures = {}
    for (var texture of TEXTURES) {
      this.textures[texture] = PIXI.loader.resources[texture].texture
    }
    callback()
  }

  addEntity (name, texture = null, scale = 1.0, physics = null) {
    this.entities[name] = new Entity(texture, scale, physics)
    this.entities[name].pushGame(this)
    return this.entities[name]
  }

  removeEntity (name) {
    this.entities[name].popGame(this)
    delete (this.entities[name])
  }

  spawn () {
    this.addEntity('stage', this.textures.stage, 0.01)

    this.entities['jack'] = new Ragdoll('jack', [-2, 0], 0.004, this.textures)
    this.entities['jack'].pushGame(this)

    this.entities['dave'] = new Ragdoll('dave', [2, 0], 0.002, this.textures)
    this.entities['dave'].pushGame(this)

    this.addEntity('ground', null, null, { type: 'plane', position: [0, -2.5] })
    this.addEntity('right_wall', null, null, { type: 'plane', position: [4, 0], angle: Math.PI / 2 })
    this.addEntity('left_wall', null, null, { type: 'plane', position: [-4, 0], angle: (3 * Math.PI) / 2 })

    if (this.data.music) {
      this.sounds.music.play()
    }
  }

  loop (ms = 0.0) {
    scanGamepads()
    if (this.state !== 'running') {
      return
    }
    let dt = ms / 1000 - this.gametime
    if (ms < 2000) {
      this.gametime = ms / 1000
      this.viewport.visible = false
    } else {
      this.viewport.visible = true
      while (dt > this.frequency) {
        dt -= this.frequency
        this.gametime += this.frequency
        this.update(this.frequency)
      }
    }
    this.debug()
    requestAnimationFrame(this.loop.bind(this))
  }

  debug () {
    for (var name in this.entities) {
      this.entities[name].debug(this.viewport, this.data.debug)
    }
  }
}

export default Game
