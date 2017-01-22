/* global PIXI */
import 'pixi.js'
import p2 from 'p2'
import { Howl } from 'howler'
import { scanGamepads, getGamepads } from 'gamepad'
import { Spinner } from 'spinner'
import { Wave } from 'wave'
import { Sparks } from 'sparks'

const FPS = 60

const SOUNDS = [
  'wilhelm',
  'music',
  'slap'
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
  'stage',
  'spark'
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
            case 'Circle':
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
      left_hand: [0.50, -0.6],
      right_hand: [-0.42, -0.55],
      left_foot: [0.55, 0.7],
      right_foot: [-0.45, 0.7],
      left_stick: [-0.5, -2],
      right_stick: [0.5, -2],
      left_trigger: [1, -0.5],
      right_trigger: [-1, -0.5]
    }

    this.addPart(textures, 'left_foot', this.extremeties.left_foot, -1.4, 1)
    this.addPart(textures, 'left_shin', [0.43, 0.35], 0, 0.1)
    this.addPart(textures, 'left_upper_leg', [0.35, -0.1], -0.4, 0.1)
    this.addPart(textures, 'right_foot', this.extremeties.right_foot, 1.4, 1)
    this.addPart(textures, 'right_shin', [-0.30, 0.35], 0, 0.1)
    this.addPart(textures, 'right_upper_leg', [-0.23, -0.1], 0.4, 0.1)
    this.addPart(textures, 'hips', [0.05, -0.55], 0, 0.1)
    this.addPart(textures, 'torso', [0, -1.3], 0, 0.1)
    this.addPart(textures, 'head', [0, -2.15], 0, 0.1)
    this.addPart(textures, 'left_upper_arm', [0.5, -1.55], -0.3, 0.1)
    this.addPart(textures, 'right_upper_arm', [-0.5, -1.45], 0.3, 0.1)
    this.addPart(textures, 'left_forearm', [0.60, -1.05], 0.2, 0.1)
    this.addPart(textures, 'right_forearm', [-0.55, -0.95], -0.2, 0.1)
    this.addPart(textures, 'left_hand', this.extremeties.left_hand, 0, 0.1)
    this.addPart(textures, 'right_hand', this.extremeties.right_hand, 0, 0.1)

    this.addJoint('head', 'torso', [0, -1.86], [0.25, 0.25])
    this.addJoint('torso', 'left_upper_arm', [0.41, -1.78], null)
    this.addJoint('left_upper_arm', 'left_forearm', [0.66, -1.30], [0, 0.5])
    this.addJoint('left_forearm', 'left_hand', [0.51, -0.73], [0.1, 0.1])
    this.addJoint('torso', 'right_upper_arm', [-0.45, -1.68], null)
    this.addJoint('right_upper_arm', 'right_forearm', [-0.58, -1.18], [0.5, 0])
    this.addJoint('right_forearm', 'right_hand', [-0.46, -0.66], [0.1, 0.1])
    this.addJoint('torso', 'hips', [0.05, -0.77], [0.04, 0.04])
    this.addJoint('hips', 'left_upper_leg', [0.28, -0.26], [0.2, 0.2])
    this.addJoint('left_upper_leg', 'left_shin', [0.43, 0.13], [0, 0.5])
    this.addJoint('left_shin', 'left_foot', [0.45, 0.56], [0.3, 0.3])
    this.addJoint('hips', 'right_upper_leg', [-0.20, -0.26], [0.2, 0.2])
    this.addJoint('right_upper_leg', 'right_shin', [-0.31, 0.13], [0.5, 0])
    this.addJoint('right_shin', 'right_foot', [-0.33, 0.56], [0.3, 0.3])

    this.parts.head.body.gravityScale = -10
    this.parts.torso.body.gravityScale = -5

    this.parts.left_stick = new Entity(null, 1, {
      type: 'circle',
      mass: 0,
      position: this.relative(this.extremeties.left_stick)
    })
    this.parts.right_stick = new Entity(null, 1, {
      type: 'circle',
      mass: 0,
      position: this.relative(this.extremeties.right_stick)
    })
    this.parts.left_trigger = new Entity(null, 1, {
      type: 'circle',
      mass: 0,
      position: this.relative(this.extremeties.left_trigger)
    })
    this.parts.right_trigger = new Entity(null, 1, {
      type: 'circle',
      mass: 0,
      position: this.relative(this.extremeties.right_trigger)
    })

    // because backwards everything...
    this.addJoint('right_hand', 'left_stick', this.extremeties.right_hand, [2, 2], 20)
    this.addJoint('left_hand', 'right_stick', this.extremeties.left_hand, [2, 2], 20)
    this.addJoint('right_foot', 'left_trigger', this.extremeties.right_foot, [2, 2], 20)
    this.addJoint('left_foot', 'right_trigger', this.extremeties.left_foot, [2, 2], 20)
  }

  addPart (textures, name, offset, rotation, mass) {
    this.parts[name] = new Entity(textures[`${this.name}_${name}`], this.scale, {
      mass: mass,
      position: this.relative(offset),
      angle: rotation,
      group: this.name
    })
  }

  addJoint (partA, partB, pivot, limit, force = 100) {
    let bodyA = this.parts[partA].body
    let bodyB = this.parts[partB].body
    let joint = new p2.RevoluteConstraint(bodyA, bodyB, { worldPivot: this.relative(pivot), maxForce: force })
    if (limit) {
      joint.setLimits(-Math.PI * limit[0], Math.PI * limit[1])
    }
    this.joints.push(joint)
  }

  relative (position) {
    return [this.position[0] + position[0], this.position[1] + position[1]]
  }

  updateExtremeties (offsets) {
    for (var part in offsets) {
      this.parts[part].body.position = this.relative(this.extremeties[part])
      this.parts[part].body.position[0] += offsets[part][0] * 2
      this.parts[part].body.position[1] += offsets[part][1] * 2
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
    this.slaptime = null
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
    this.effects = []
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
    this.addEffects()
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
    this.removeEffects()
    this.viewport.destroy()
    this.game.destroy()
    this.world.clear()
    this.gametime = null
    this.slaptime = null
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

  getJoystick (player) {
    if (this.gamepads[player]) {
      let but1 = 1 - 2 * this.gamepads[player].buttons[6].value
      let but2 = 1 - 2 * this.gamepads[player].buttons[7].value
      if (but1 >= but2) {
        but1 = 1
      } else if (but2 >= but1) {
        but2 = 1
      }
      return {
        left_stick: [this.gamepads[player].axes[0], this.gamepads[player].axes[1]],
        right_stick: [this.gamepads[player].axes[2], this.gamepads[player].axes[3]],
        left_trigger: [0, but1],
        right_trigger: [0, but2]
      }
    } else {
      return undefined
    }
  }

  updateHands () {
    let empty = {
      left_stick: [0, 0],
      right_stick: [0, 0],
      left_trigger: [0, 0],
      right_trigger: [0, 0]
    }
    let joy1 = this.getJoystick('0')
    let joy2 = this.getJoystick('1')
    this.entities.dave.updateExtremeties(joy2 || joy1 || empty)
    this.entities.jack.updateExtremeties(joy1 || empty)
  }

  init () {
    this.world = new p2.World()
    this.world.gravity[1] *= -1
    this.game = new PIXI.Application(800, 500, { view: this.canvas })
    window.game = this
    this.viewport = new PIXI.Container()
    this.game.stage.addChild(this.viewport)
    this.playersReady = []
  }

  resize () {
    this.viewport.position.x = this.game.renderer.width / 2 + this.camera.x
    this.viewport.position.y = this.game.renderer.height / 2 + this.camera.y
    let ratio = this.canvas.scrollWidth / this.canvas.scrollHeight
    // this.camera.z = 50
    this.viewport.scale.x = this.camera.z
    this.viewport.scale.y = this.camera.z
    if (ratio < 1.6) this.viewport.scale.y *= (ratio / 1.6)
    if (ratio > 1.6) this.viewport.scale.x /= (ratio / 1.6)
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

    this.entities['jack'] = new Ragdoll('jack', [-1.2, 1.4], 0.004, this.textures)
    this.entities['jack'].pushGame(this)

    this.entities['dave'] = new Ragdoll('dave', [1.2, 1.4], 0.002, this.textures)
    this.entities['dave'].pushGame(this)

    this.addEntity('ground', null, null, { type: 'plane', group: 'ground', position: [0, 2.3], angle: Math.PI })
    this.addEntity('right_wall', null, null, { type: 'plane', group: 'ground', position: [4, 0], angle: Math.PI / 2 })
    this.addEntity('left_wall', null, null, { type: 'plane', group: 'ground', position: [-4, 0], angle: (3 * Math.PI) / 2 })

    this.world.on('impact', (event) => {
      if ((event.shapeA.collisionGroup === COLLISION_GROUPS.jack && event.shapeB.collisionGroup === COLLISION_GROUPS.dave) || (event.shapeA.collisionGroup === COLLISION_GROUPS.dave && event.shapeB.collisionGroup === COLLISION_GROUPS.jack)) {
        if (event.contactEquation.multiplier > 30 && (!this.slaptime || this.gametime - this.slaptime > 0.1)) {
          let id = this.sounds.slap.play()
          let volume = (event.contactEquation.multiplier - 30) / 25
          if (volume > 1) {
            volume = 1
          }
          this.sounds.slap.volume(volume, id)
          this.slaptime = this.gametime
        }
      }
    })

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
        this.updateEffects(this.frequency)
      }
    } else {
      this.gametime = ms / 1000
    }
    this.debug()
    requestAnimationFrame(this.loop.bind(this))
  }

  removeEffects () {
    for (var effect of this.effects) {
      effect.popGame(this)
      this.effects.pop(effect)
    }
  }

  addEffects () {
    this.addEffect(new Spinner([1, 0], 0xff00ff, 4, 0, 10, 0, 15, 15))
    this.addEffect(new Spinner([2, 1], 0x00ff00, 8, 0, 2, 0, 8, 5))
    this.addEffect(new Spinner([-2, 2], 0xff0000, 8, 0, 2.7, 10, 20, 15))
    // this.addEffect(new Wave([0, 0], 0x00ff00, 4, 100, 0, 5, 20, 2.4))
    this.targetWave = new Wave([0, 0], 0x9999ff, 3, 2, 0, 5, 1, 0.8, 0.75)
    this.addEffect(this.targetWave)
    this.spark1 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark1)
    this.spark2 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark2)
    this.spark3 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark3)
    this.spark4 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark4)
    this.spark5 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark5)
    this.spark6 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark6)
    this.spark7 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark7)
    this.spark8 = new Sparks([0, 0], PIXI.Texture.fromImage('spark'))
    this.addEffect(this.spark8)
  }

  addEffect (effect) {
    this.effects.push(effect)
    effect.pushGame(this)
  }

  updateEffects (dt) {
    for (var effect of this.effects) {
      effect.update(this, dt)
    }
    this.spark1.emitterContainer.position = this.entities.dave.parts.left_hand.sprite.position
    this.spark2.emitterContainer.position = this.entities.dave.parts.right_hand.sprite.position
    this.spark3.emitterContainer.position = this.entities.jack.parts.left_hand.sprite.position
    this.spark4.emitterContainer.position = this.entities.jack.parts.right_hand.sprite.position
    this.checkSparkWave(this.spark1, this.targetWave)
    this.checkSparkWave(this.spark2, this.targetWave)
    this.checkSparkWave(this.spark3, this.targetWave)
    this.checkSparkWave(this.spark4, this.targetWave)
    this.spark5.emitterContainer.position = this.entities.dave.parts.left_foot.sprite.position
    this.spark6.emitterContainer.position = this.entities.dave.parts.right_foot.sprite.position
    this.spark7.emitterContainer.position = this.entities.jack.parts.left_foot.sprite.position
    this.spark8.emitterContainer.position = this.entities.jack.parts.right_foot.sprite.position
    this.checkSparkWave(this.spark5, this.targetWave)
    this.checkSparkWave(this.spark6, this.targetWave)
    this.checkSparkWave(this.spark7, this.targetWave)
    this.checkSparkWave(this.spark8, this.targetWave)
  }

  checkSparkWave (spark, wave) {
    let wavePos = wave.getWaveforX(spark.emitterContainer.position.x)
    if (Math.abs(wavePos[1] - spark.emitterContainer.position.y) < 0.2) {
      spark.emitter.maxParticles = 200
      spark.emitterContainer.scale.x *= 1.01
      spark.emitterContainer.scale.y *= 1.01
    } else {
      spark.emitter.maxParticles = 0
      spark.emitterContainer.scale.x *= 0.99
      spark.emitterContainer.scale.y *= 0.99
    }
    if (spark.emitterContainer.scale.x < 0.75) {
      spark.emitterContainer.scale.x = 0.75
    }
    if (spark.emitterContainer.scale.y < 0.75) {
      spark.emitterContainer.scale.y = 0.75
    }
    if (spark.emitterContainer.scale.x > 1.5) {
      spark.emitterContainer.scale.x = 1.5
    }
    if (spark.emitterContainer.scale.y > 1.5) {
      spark.emitterContainer.scale.y = 1.5
    }
  }

  debug () {
    for (var name in this.entities) {
      this.entities[name].debug(this.viewport, this.data.debug)
    }
  }
}

export default Game
