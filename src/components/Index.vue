<template>
  <q-layout>
    <div class="layout-view">
      <canvas id="viewport"></canvas>
    </div>
  </q-layout>
</template>

<script>
  import 'pixi.js'
  import { Howl } from 'howler'
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
      }
    },
    mounted () {
      /* eslint-disable no-undef */
      let application = new PIXI.Application(900, 600, {
        view: document.getElementById('viewport')
      })
      let texture = PIXI.Texture.fromImage(require('assets/DDaveOhYeaSoCanYouWriteItInAnEmailAndIllGetBackToYou.png'))
      let nan = new PIXI.Sprite(texture)
      nan.anchor.x = 0.5
      nan.anchor.y = 0.5
      nan.position.x = 100
      nan.position.y = 100
      nan.width = 60
      nan.height = 60
      nan.interactive = true
      nan.on('mousedown', this.scream)
      nan.on('touchstart', this.scream)
      application.stage.addChild(nan)
    },
    beforeDestroy () {
    }
  }
</script>

<style lang="styl">
  #viewport
    background-color red
    margin 0
    width 100%
    height 100%
</style>
