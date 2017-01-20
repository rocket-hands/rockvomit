<template>
  <q-layout>
    <div class="layout-view">
      <canvas id="viewport"></canvas>
    </div>
  </q-layout>
</template>

<script>
  import 'pixi.js'
  import p2 from 'p2'
  import { Howl } from 'howler'

  // pixi
  let game = null
  let sprite = null

  // p2
  let world = null
  let body = null

  export default {
    data () {
      return {
      }
    },
    methods: {
      scream () {
        let sound = new Howl({
          src: [require('assets/wilhelm.webm'), require('assets/wilhelm.mp3')]
        })
        sound.play()
      },
      animate (t) {
        t = t || 0
        requestAnimationFrame(this.animate)
        world.step(1 / 60)
        sprite.position.x = body.position[0]
        sprite.position.y = body.position[1]
        sprite.rotation = body.angle
        game.renderer.render(game.stage)
      }
    },
    mounted () {
      /* eslint-disable no-undef */
      game = new PIXI.Application(900, 600, {
        view: document.getElementById('viewport')
      })

      let texture = PIXI.Texture.fromImage(require('assets/DDaveOhYeaSoCanYouWriteItInAnEmailAndIllGetBackToYou.png'))
      sprite = new PIXI.Sprite(texture)
      sprite.anchor.x = 0.5
      sprite.anchor.y = 0.5
      sprite.width = 1
      sprite.height = 1
      sprite.interactive = true
      sprite.on('mousedown', this.scream)
      sprite.on('touchstart', this.scream)

      let container = new PIXI.Container()
      game.stage.addChild(container)

      container.position.x = game.renderer.width / 2
      container.position.y = game.renderer.height / 2
      container.scale.x = 100
      container.scale.y = -100

      container.addChild(sprite)

      world = new p2.World()
      let shape = new p2.Box({ width: 1, height: 1 })
      body = new p2.Body({
        mass: 1,
        position: [0, 2],
        angularVelocity: 1
      })
      body.addShape(shape)
      world.addBody(body)

      let planeShape = new p2.Plane()
      let planeBody = new p2.Body({ position: [0, -1] })
      planeBody.addShape(planeShape)
      world.addBody(planeBody)

      this.animate()
    },
    beforeDestroy () {
    }
  }
</script>

<style lang="stylus">
  #viewport
    background-color red
    margin 0
    width 100%
    height 100%
</style>
