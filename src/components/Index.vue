<template>
  <q-layout>
    <div class="layout-view">
      <canvas id="viewport"></canvas>
    </div>
  </q-layout>
</template>

<script>
  import Game from 'game.js'

  import { Loading } from 'quasar'
  let game = null
  export default {
    data () {
      return {
        score: 0,
        debug: false,
        music: true,
        message: ''
      }
    },
    methods: {
      resize () {
        game.resize()
      }
    },
    mounted () {
      Loading.show()
      game = new Game('viewport', this.$data)
      game.boot(() => {
        Loading.hide()
        game.run()
        window.addEventListener('resize', this.resize)
      })
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.resize)
      game.stop()
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
