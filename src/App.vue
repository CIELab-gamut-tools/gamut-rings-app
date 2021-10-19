<template>
  <div class="main">
    <div class="table">
      <synthetic-gamut-editor v-model:definition=gamutDefinition />
    </div>
    <chromaticity class="plot" v-model:definition="gamutDefinition" />
    <gamut-rings class="rings" :gamut=gamut />
  </div>
</template>

<style>
html, body, #app, .main{
  overflow: hidden;
}
.main{
  display:grid;
  grid-template: 4fr 2fr/4fr 0fr 6fr;
  width:100%;
  max-width:154vh;
  height:100%;
}
.table{
  grid-area: 2/1;
  width:100%;
}
.table>table{
  margin:auto;
}
.plot{
  grid-area: 1/1;
  width:100%
}
.rings{
  grid-area: 1/3/3/4;
  width:100%;
}

/*
The app layout will look like this:
+-------------+------------------+-------------- = ------------+
|             |                  |                             |
|             |                  |                             |
| CIE1931     |                  |                             |
|             |                  |                             |
|             |                  |                             |
|-------------+                  +                             +
|             |                  |                             |
| Primary     |                  |                             |
| table       |                  |                             |
|             |                  |                             |
+-----4f------+--------2f---------+-------------- 6f------------+




note:
trick for square element
div.square{
  position: relative
}
div.square:before{
  content:' ';
  display:block;
  width:100%;
  padding-top:100%
}
div.square>canvas{
  position:absolute;
  top:0;
  left:0;
  bottom:0;
  right:0;
}
*/
</style>

<script>
import SyntheticGamutEditor from "./components/SyntheticGamutEditor.vue";
import GamutRings from "./components/GamutRings.vue";
import Chromaticity from "./components/Chromaticity.vue";
import {makeSynthetic} from './gamut';
import {ref, watchEffect} from 'vue';
export default {
  name: 'App',
  components: {
    SyntheticGamutEditor,
    GamutRings,
    Chromaticity
  },
  setup(){
    const gamutDefinition = ref({
      RGBxy:[
        [.64, .33],
        [.3, .6],
        [.15, .06],
      ],
      white: [.3127, .3290]
    });
    const gamut = ref(null);
    watchEffect(()=>{
      gamut.value = makeSynthetic(gamutDefinition.value);
    })
    return {
      gamut,
      gamutDefinition
    }
  },
}
</script>
