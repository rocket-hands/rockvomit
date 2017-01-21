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
  constructor (texture, size, physics) {
    this.sprite = null
    this.body = null
    if (texture) {
      this.sprite = new PIXI.Sprite(texture)
      this.sprite.anchor.x = 0.5
      this.sprite.anchor.y = 0.5
      if (size) {
        this.sprite.scale.x = size.scale
        this.sprite.scale.y = size.scale
      }
    }
    if (physics) {
      this.body = new p2.Body(physics)
      if (size) {
        switch (size.type) {
          case 'plane':
            this.body.addShape(new p2.Plane())
            break
          case 'box':
          default:
            this.body.addShape(new p2.Box(size))
        }
      }
    }
  }

  update (dt) {
    if (this.sprite && this.body) {
      this.sprite.position.x = this.body.position[0]
      this.sprite.position.y = this.body.position[1]
      this.sprite.rotation = this.body.angle
    }
  }

  debug (graphics) {
    if (this.body) {
      graphics.drawCircle(this.body.position[0], this.body.position[1], 0.1)
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
    this.lastGamepadCheck = 0.0
    this.gamepads = getGamepads()
    this.scanGamepads = scanGamepads
    this.getGamepads = getGamepads
    this.debugLayer = null
    this.entities = {}
  }

  boot () {
    this.state = 'booting'
    this.init()
    this.load()
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
    this.viewport.destroy()
    this.game.destroy()
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

  load () {
    this.sounds = {}
    for (var sound of SOUNDS) {
      this.sounds[sound] = new Howl({
        src: [require(`assets/${sound}.webm`), require(`assets/${sound}.mp3`)]
      })
    }
    this.textures = {}
    for (var texture of TEXTURES) {
      this.textures[texture] = PIXI.Texture.fromImage(require(`assets/${texture}.png`))
    }
  }

  addEntity (name, texture = null, size = null, physics = null) {
    this.entities[name] = new Entity(texture, size, physics)
    if (this.entities[name].sprite) {
      this.viewport.addChild(this.entities[name].sprite)
    }
    if (this.entities[name].body) {
      this.world.addBody(this.entities[name].body)
    }
    return this.entities[name]
  }

  removeEntity (name) {
    if (this.entities[name].body) {
      this.world.removeBody(this.entities[name].body)
    }
    if (this.entities[name].sprite) {
      this.viewport.removeChild(this.entities[name].sprite)
    }
    delete (this.entities[name])
  }

  spawn () {
    this.addEntity('stage', this.textures.stage, { scale: 0.01 })
    this.addEntity('lhand', this.textures.dave_left_hand, {
      scale: 0.002,
      width: 0.3,
      height: 0.3
    }, {
      mass: 0.1,
      position: [0, 2.5],
      angularVelocity: 0,
      gravityScale: 0
    })
    this.addEntity('rhand', this.textures.dave_right_hand, {
      scale: 0.002,
      width: 0.3,
      height: 0.3
    }, {
      mass: 0.1,
      position: [0, 2.5],
      angularVelocity: 0,
      gravityScale: 0
    })
    this.addEntity('head', this.textures.dave_head, {
      scale: 0.002,
      width: 1,
      height: 1
    }, {
      mass: 1,
      position: [0, 2.5],
      angularVelocity: 1
    })
    this.entities.head.sprite.interactive = true
    this.entities.head.sprite.on('mousedown', () => { this.sounds.wilhelm.play() })
    this.entities.head.sprite.on('touchstart', () => { this.sounds.wilhelm.play() })
    this.addEntity('ground', null, { type: 'plane' }, { position: [0, -2.5] })
    if (PROD) {
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
    // this.data.score = this.gametime
    if (DEV) {
      this.debug()
    }
    requestAnimationFrame(this.loop.bind(this))
  }

  debug () {
    if (this.debugLayer) {
      this.viewport.removeChild(this.debugLayer)
    }
    this.debugLayer = new PIXI.Graphics()
    this.debugLayer.beginFill(0xe74c3c)
    for (var name in this.entities) {
      this.entities[name].debug(this.debugLayer)
    }
    this.debugLayer.endFill()
    this.viewport.addChild(this.debugLayer)
  }
}

export default Game
