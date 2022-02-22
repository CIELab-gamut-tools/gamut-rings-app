<template>
  <div class="main">
    <H1 class="title">Gamut Rings Explorer</H1>
    <div class="table">
      <synthetic-gamut-editor v-model:definition=gamutDefinition />
    </div>
    <chromaticity class="plot" v-model:definition="gamutDefinition" />
    <gamut-rings class="rings" :gamut=gamut />
    <div class="footer">
      <p>Original Gamut Rings concept: <a href="https://doi.org/10.1002/sdtp.12187">K. Masaoka, F. Jiang, M. D. Fairchild, and R. L. Heckaman,
        SID Digest, Volume 49, Issue 1, May 2018, 1048-1051</a></p>
      <p>Calculation based on: <a href="https://doi.org/10.1002/jsid.918">E. Smith, R. L. Heckaman, K. Lang, J. Penczek, J. Bergquist,
         JSID, Volume 28, Issue 6, June 2020, 548-556.
        </a></p>
      <p> &copy;2021 Euan Smith. Licensed under the <a href="https://opensource.org/licenses/MIT">MIT</a> licence - distribute and use freely! Find me on <a href="https://github.com/euan-smith">github</a></p>
    </div>
  </div>
</template>

<style>
.title{
  grid-area:1/1/2/4;
}
.footer{
  grid-area: 4/1/5/4;
  white-space: nowrap;
  overflow: hidden;
  max-width:100%;
}
.main{
  display:grid;
  grid-template: 60px 4fr 2fr 120px/4fr 0fr 6fr;
  width:100%;
  min-width:940px;
  max-width:calc(154vh - 278px);
  height:100%;
}
.table{
  grid-area: 3/1;
  width:100%;
}
.table>table{
  margin:auto;
}
.plot{
  grid-area: 2/1;
  width:100%
}
.rings{
  grid-area: 2/3/4/4;
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
      const start = performance.now();
      gamut.value = makeSynthetic(gamutDefinition.value);
      console.log(`synth calc took ${performance.now()-start}ms`);
    })
    return {
      gamut,
      gamutDefinition
    }
  },
}
</script>
