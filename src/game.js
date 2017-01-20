/* global PIXI */
import 'pixi.js'
import p2 from 'p2'
import { Howl } from 'howler'

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
  }

  boot () {
    this.state = 'booting'
    this.init()
    this.load()
  }

  run () {
    this.state = 'running'
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
    this.game = new PIXI.Application(800, 800, { view: this.canvas })

    this.viewport = new PIXI.Container()
    this.game.stage.addChild(this.viewport)

    this.viewport.position.x = this.game.renderer.width / 2 + this.camera.x
    this.viewport.position.y = this.game.renderer.height / 2 + this.camera.y
    this.viewport.scale.x = this.camera.z
    this.viewport.scale.y = -this.camera.z

    this.world = new p2.World()
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
    this.sprite = new PIXI.Sprite(this.textures['dave_head'])
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.width = 1
    this.sprite.height = 1
    this.sprite.interactive = true
    this.sprite.on('mousedown', () => { this.play('wilhelm') })
    this.sprite.on('touchstart', () => { this.play('wilhelm') })
    this.viewport.addChild(this.sprite)

    let ground = new p2.Body({ position: [0, -1] })
    ground.addShape(new p2.Plane())
    this.world.addBody(ground)

    this.head = new p2.Body({ mass: 1, position: [0, 2], angularVelocity: 1 })
    this.head.addShape(new p2.Box({ width: 2, height: 1 }))
    this.world.addBody(this.head)

    this.play('music')
  }

  loop (timestamp = 0.0) {
    if (this.state !== 'running') {
      return
    }
    this.update(this.frequency)
    this.game.renderer.render(this.game.stage)
    requestAnimationFrame(this.loop.bind(this))
  }
}

export default Game
