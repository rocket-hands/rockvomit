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
  'dave_torso',
  'dave_left_forearm',
  'dave_left_foot',
  'dave_left_hand',
  'dave_left_shin',
  'dave_left_upper_arm',
  'dave_left_upper_leg',
  'dave_right_forearm',
  'dave_right_hand',
  'dave_right_foot',
  'dave_right_shin',
  'dave_right_upper_arm',
  'dave_right_upper_leg',
  'jack_head',
  'jack_hips',
  'jack_torso',
  'jack_left_forearm',
  'jack_left_hand',
  'jack_left_foot',
  'jack_left_shin',
  'jack_left_upper_arm',
  'jack_left_upper_leg',
  'jack_right_forearm',
  'jack_right_hand',
  'jack_right_foot',
  'jack_right_shin',
  'jack_right_upper_arm',
  'jack_right_upper_leg',
  'labs',
  'stage'
]

const COLLISION_GROUPS = {
  ground: 0b0001,
  jack: 0b0010,
  dave: 0b0100,
  other: 0b1000,
  all: 0b1111
}

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
      let group = COLLISION_GROUPS[physics.group] || COLLISION_GROUPS.other
      let mask = COLLISION_GROUPS.all ^ group
      let shape = null
      delete (physics.type)
      delete (physics.group)
      this.body = new p2.Body(physics)
      switch (type) {
        case 'plane':
          shape = new p2.Plane()
          shape.collisionGroup = group
          shape.collisionMask = mask
          this.body.addShape(shape)
          break
        case 'circle':
          shape = new p2.Circle()
          shape.collisionGroup = 0
          shape.collisionMask = 0
          this.body.addShape(shape)
          break
        case 'box':
        default:
          shape = new p2.Box({
            width: this.sprite.width * 0.9,
            height: this.sprite.height * 0.9
          })
          shape.collisionGroup = group
          shape.collisionMask = mask
          this.body.addShape(shape)
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
    this.joints = []
    this.extremeties = {
      left_hand: [0.55, -0.6],
      right_hand: [-0.42, -0.6],
      left_foot: [0.28, 0.6],
      right_foot: [-0.1, 0.6]
    }

    this.addPart(textures, 'left_hand', this.extremeties.left_hand, 0.1)
    this.addPart(textures, 'left_forearm', [0.6, -1], 0.1)
    this.addPart(textures, 'left_upper_arm', [0.5, -1.55], 0.1)
    this.addPart(textures, 'left_foot', this.extremeties.left_foot, 1)
    this.addPart(textures, 'left_shin', [0.3, 0.25], 0.1)
    this.addPart(textures, 'left_upper_leg', [0.3, -0.2], 0.1)
    this.addPart(textures, 'right_hand', this.extremeties.right_hand, 0.1)
    this.addPart(textures, 'right_forearm', [-0.52, -0.9], 0.1)
    this.addPart(textures, 'right_upper_arm', [-0.5, -1.45], 0.1)
    this.addPart(textures, 'right_foot', this.extremeties.right_foot, 1)
    this.addPart(textures, 'right_shin', [-0.15, 0.25], 0.1)
    this.addPart(textures, 'right_upper_leg', [-0.17, -0.2], 0.1)
    this.addPart(textures, 'hips', [0.05, -0.7], 0.1)
    this.addPart(textures, 'torso', [0, -1.3], 0.1)
    this.addPart(textures, 'head', [0, -2.15], 0.1)

    this.addJoint('head', 'torso')
    this.addJoint('torso', 'left_upper_arm')
    this.addJoint('left_upper_arm', 'left_forearm')
    this.addJoint('left_forearm', 'left_hand')
    this.addJoint('torso', 'right_upper_arm')
    this.addJoint('right_upper_arm', 'right_forearm')
    this.addJoint('right_forearm', 'right_hand')
    this.addJoint('torso', 'hips')
    this.addJoint('hips', 'left_upper_leg')
    this.addJoint('left_upper_leg', 'left_shin')
    this.addJoint('left_shin', 'left_foot')
    this.addJoint('hips', 'right_upper_leg')
    this.addJoint('right_upper_leg', 'right_shin')
    this.addJoint('right_shin', 'right_foot')

    this.parts.head.body.gravityScale = -10
    this.parts.torso.body.gravityScale = -5

    this.parts.left_stick = new Entity(null, 1, {
      type: 'circle',
      mass: 0.1,
      position: this.extremeties.left_hand
    })
    this.parts.right_stick = new Entity(null, 1, {
      type: 'circle',
      mass: 0.1,
      position: this.extremeties.left_hand
    })
    this.addJoint('left_hand', 'left_stick')
    this.addJoint('right_hand', 'right_stick')
  }

  addPart (textures, name, offset, mass) {
    this.parts[name] = new Entity(textures[`${this.name}_${name}`], this.scale, {
      mass: mass,
      position: this.relative(offset),
      group: this.name
    })
  }

  addJoint (partA, partB) {
    let bodyA = this.parts[partA].body
    let bodyB = this.parts[partB].body
    let pivot = [(bodyA.position[0] + bodyB.position[0]) / 2, (bodyA.position[1] + bodyB.position[1]) / 2]
    let joint = new p2.RevoluteConstraint(bodyA, bodyB, { worldPivot: pivot, maxForce: 100 })
    joint.setLimits(-Math.PI / 8, Math.PI / 8)
    this.joints.push(joint)
  }

  relative (position) {
    return [this.position[0] + position[0], this.position[1] + position[1]]
  }

  updateExtremeties (offsets) {
    for (var part in offsets) {
      this.parts[part].body.position[0] += offsets[part][0] * 0.1
      this.parts[part].body.position[1] += offsets[part][1] * 0.1
    }
  }

  pushGame (game) {
    for (var name in this.parts) {
      this.parts[name].pushGame(game)
    }
    for (var joint of this.joints) {
      game.world.addConstraint(joint)
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
    for (var joint of this.joints) {
      game.world.removeConstraint(joint)
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
    this.gametime = null
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
    this.createDivider()
    this.addDivider()
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
    this.removeDivider()
    this.viewport.destroy()
    this.game.destroy()
    this.world.clear()
    this.gametime = 0
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
    this.lhandJoy = ['0', 2, 3]
    this.rhandJoy = ['0', 0, 1]
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
    let offset = {
      left_stick: [0, 0],
      right_stick: [0, 0]
    }
    var joy
    if ((joy = this.getJoystick(...this.lhandJoy))) {
      offset.left_stick = joy
    }
    if ((joy = this.getJoystick(...this.rhandJoy))) {
      offset.right_stick = joy
    }
    this.entities.dave.updateExtremeties(offset)
    this.entities.jack.updateExtremeties(offset)
  }

  init () {
    this.world = new p2.World()
    this.world.gravity[1] *= -1
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
    // this.camera.z = 50
    this.viewport.scale.x = this.camera.z
    this.viewport.scale.y = this.camera.z
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

    this.entities['jack'] = new Ragdoll('jack', [-1.2, 1.5], 0.004, this.textures)
    this.entities['jack'].pushGame(this)

    this.entities['dave'] = new Ragdoll('dave', [1.2, 1.5], 0.002, this.textures)
    this.entities['dave'].pushGame(this)

    this.addEntity('ground', null, null, { type: 'plane', group: 'ground', position: [0, 2.3], angle: Math.PI })
    this.addEntity('right_wall', null, null, { type: 'plane', group: 'ground', position: [4, 0], angle: Math.PI / 2 })
    this.addEntity('left_wall', null, null, { type: 'plane', group: 'ground', position: [-4, 0], angle: (3 * Math.PI) / 2 })

    if (this.data.music) {
      this.sounds.music.play()
    }
  }

  loop (ms = 0.0) {
    if (this.state !== 'running') {
      return
    }
    scanGamepads()
    if (!this.gametime && ms > 0) {
      this.gametime = ms / 1000
    }
    let dt = ms / 1000 - this.gametime
    if (ms < 2000) {
      this.gametime = ms / 1000
      this.viewport.visible = false
    } else if (dt < 5) {
      this.viewport.visible = true
      while (dt > this.frequency) {
        dt -= this.frequency
        this.gametime += this.frequency
        this.update(this.frequency)
      }
    } else {
      this.gametime = ms / 1000
    }
    this.debug()
    this.updateDivider()
    requestAnimationFrame(this.loop.bind(this))
  }

  createDivider () {
    this.divider = new PIXI.Graphics()
    this.divider.position.x = 0
    this.divider.position.y = 1
    this.divider.clear()
    this.divider.lineStyle(0.1, 0xffff00)
    this.divider.moveTo(0.0, -6)
    this.divider.lineTo(0.0, 6)
    this.divider.lineStyle(0.1, 0x0000ff)
    this.divider.moveTo(0.7, -8)
    this.divider.lineTo(-0.7, 8)
    this.divider.lineStyle(0.1, 0xff0000)
    this.divider.moveTo(-0.7, -8)
    this.divider.lineTo(0.7, 8)
    var blurFilter = new PIXI.filters.BlurFilter()
    blurFilter.blur = 10
    this.divider.filters = [blurFilter]
    this.divider.blendMode = PIXI.BLEND_MODES.SCREEN
    // To work out which way to split the controls this returns a float from 0 -> 4.0
    // (game.divider.transform.rotation % 2*Math.PI) / (2*Math.PI) * 4
  }

  addDivider () {
    this.viewport.addChild(this.divider)
  }

  removeDivider () {
    this.viewport.removeChild(this.divider)
  }

  updateDivider () {
    this.divider.transform.rotation = this.gametime / 10
    this.divider.filters[0].blur = Math.abs(((this.gametime * 50) % 20) - 10) + 5
  }

  debug () {
    for (var name in this.entities) {
      this.entities[name].debug(this.viewport, this.data.debug)
    }
  }
}

export default Game
