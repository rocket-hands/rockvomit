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

  debug (viewport, show) {
    if (this.body) {
      if (!this.debugSprite && show) {
        this.debugSprite = new PIXI.Graphics()
        this.debugSprite.lineStyle(0.01, 0x00FF00)
        for (var shape of this.body.shapes) {
          switch (shape.constructor.name) {
            case 'Box':
              window.foo = shape.vertices
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

  checkReady () {
    // check any gamepads that aren't in playersReady
    for (var id of Object.keys(this.gamepads)) {
      if (!(id in this.playersReady)) {
        if (this.gamepads[id].buttons.find((button) => { return button.pressed })) {
          this.playersReady.push(id)
        }
      }
    }
    if (this.playersReady.length === 0) {
      this.data.message = 'Hey you two!!! Push a button!'
    } else if (this.playersReady.length === 1) {
      this.data.message = 'Press that button player 2!!'
    } else if (this.playersReady.length === 2) {
      this.data.message = "Let's do this!"
    }
  }

  update (dt) {
    if (this.playersReady.length < 2) {
      this.checkReady()
    }
    this.updateHands()
    this.world.step(dt)
    for (var name in this.entities) {
      this.entities[name].update(dt)
    }
  }

  setJoys () {
    this.lhandJoy = ['0', 0, 1]
    this.rhandJoy = ['0', 2, 3]
    this.lfootJoy = ['0', 0, 1]
    this.rfootJoy = ['0', 2, 3]
  }

  getJoystick (player, axis1, axis2) {
    if (this.gamepads[player]) {
      return [this.gamepads[player].axes[axis1], this.gamepads[player].axes[axis2]]
    } else {
      return undefined
    }
  }

  updateHands () {
    let lhand = [-0.5, 0]
    let rhand = [0.5, 0]
    let lfoot = [-0.5, -2]
    let rfoot = [0.5, -2]
    var joy
    if ((joy = this.getJoystick(...this.lhandJoy))) {
      lhand[0] += joy[0]
      lhand[1] += -joy[1]
    }
    if ((joy = this.getJoystick(...this.rhandJoy))) {
      rhand[0] += joy[0]
      rhand[1] += -joy[1]
    }
    if ((joy = this.getJoystick(...this.lfootJoy))) {
      lfoot[0] += joy[0]
      lfoot[1] += -joy[1]
    }
    if ((joy = this.getJoystick(...this.rfootJoy))) {
      rfoot[0] += joy[0]
      rfoot[1] += -joy[1]
    }

    this.entities.lhand.body.position = lhand
    this.entities.rhand.body.position = rhand
    this.entities.lfoot.body.position = lfoot
    this.entities.rfoot.body.position = rfoot
  }

  init () {
    this.world = new p2.World()
    this.game = new PIXI.Application(800, 500, { view: this.canvas })
    window.game = this

    this.viewport = new PIXI.Container()
    this.game.stage.addChild(this.viewport)
    this.playersReady = []
    this.setJoys()
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
    this.addEntity('lfoot', this.textures.dave_left_hand, {
      scale: 0.002,
      width: 0.3,
      height: 0.3
    }, {
      mass: 0.1,
      position: [0, 2.5],
      angularVelocity: 0,
      gravityScale: 0
    })
    this.addEntity('rfoot', this.textures.dave_right_hand, {
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
      width: 0.5,
      height: 0.5
    }, {
      mass: 1,
      position: [0, 2.5],
      angularVelocity: 1
    })
    this.entities.head.sprite.interactive = true
    this.entities.head.sprite.on('mousedown', () => { this.sounds.wilhelm.play() })
    this.entities.head.sprite.on('touchstart', () => { this.sounds.wilhelm.play() })
    this.addEntity('ground', null, { type: 'plane' }, { position: [0, -2.5] })
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
