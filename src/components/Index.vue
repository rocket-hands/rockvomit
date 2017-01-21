<template>
  <q-layout>
    <div slot="header" class="toolbar">
      <q-toolbar-title :padding="1">
        Waveform Hero | Score: {{score}}
      </q-toolbar-title>
    </div>
    <div class="layout-view">
      <canvas id="viewport"></canvas>
    </div>
  </q-layout>
</template>

<script>
  import Game from 'game.js'

  import { Loading, Dialog } from 'quasar'
  let game = null
  export default {
    data () {
      return {
        score: 0
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
      game.boot()
      Loading.hide()
      if (PROD) {
        Dialog.create({
          title: 'Get Ready',
          message: 'Start that crazy musak?',
          noBackdropDismiss: true,
          noEscDismiss: true,
          buttons: [
            {
              label: 'Yerp',
              handler () {
                game.run()
              }
            }
          ]
        })
      } else {
        game.run()
      }
      window.addEventListener('resize', this.resize)
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
