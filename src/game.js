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
    this.world.step(dt)
    this.sprite.position.x = this.head.position[0]
    this.sprite.position.y = this.head.position[1]
    this.sprite.rotation = this.head.angle
  }

  play (sound) {
    this.sounds[sound].play()
  }

  init () {
    this.game = new PIXI.Application(800, 500, { view: this.canvas })
    window.game = this

    this.viewport = new PIXI.Container()
    this.game.stage.addChild(this.viewport)

    this.world = new p2.World()
  }

  resize () {
    this.viewport.position.x = this.game.renderer.width / 2 + this.camera.x
    this.viewport.position.y = this.game.renderer.height / 2 + this.camera.y
    let ratio = this.canvas.scrollWidth / this.canvas.scrollHeight
    this.viewport.scale.x = this.camera.z
    this.viewport.scale.y = -this.camera.z
    if (ratio > 1.6) this.viewport.scale.x /= (ratio / 1.6)
    if (ratio < 1.6) this.viewport.scale.y *= (ratio / 1.6)
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

  spawn () {
    let stage = new PIXI.Sprite(this.textures['stage'])
    stage.anchor.x = 0.5
    stage.anchor.y = 0.5
    stage.scale.x = 0.01
    stage.scale.y = 0.01
    this.viewport.addChild(stage)

    this.sprite = new PIXI.Sprite(this.textures['dave_head'])
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.width = 1
    this.sprite.height = 1
    this.sprite.interactive = true
    this.sprite.on('mousedown', () => { this.play('wilhelm') })
    this.sprite.on('touchstart', () => { this.play('wilhelm') })
    this.viewport.addChild(this.sprite)

    let ground = new p2.Body({ position: [0, -2.5] })
    ground.addShape(new p2.Plane())
    this.world.addBody(ground)

    this.head = new p2.Body({ mass: 1, position: [0, 3], angularVelocity: 10 })
    this.head.addShape(new p2.Box({ width: 1, height: 1 }))
    this.world.addBody(this.head)

    if (PROD) {
      this.play('music')
    }
  }

  loop (ms = 0.0) {
    if (this.gametime > this.lastGamepadCheck + 500) {
      scanGamepads()
      this.lastGamepadCheck = this.gametime
    }
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
    this.data.score = this.gametime
    requestAnimationFrame(this.loop.bind(this))
  }
}

export default Game
