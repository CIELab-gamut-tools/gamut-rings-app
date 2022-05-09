<template>
  <div class="main">
    <div class="title">Gamut Rings Explorer</div>
    <div class="table">
      <synthetic-gamut-editor v-model:definition=gamutDefinition />
    </div>
    <chromaticity class="plot" v-model:definition="gamutDefinition" />
    <cie-lab class=cielab :gamut=gamut />
    <gamut-rings class="rings" :gamut=gamut @cgv="e=>cgv=e.cgv"/>
    <div class="footer">
      <p>Original Gamut Rings concept: <a href="https://doi.org/10.1002/sdtp.12187">K. Masaoka, F. Jiang, M. D. Fairchild, and R. L. Heckaman,
        SID Digest, Volume 49, Issue 1, May 2018, 1048-1051</a></p>
      <p>Calculation based on: <a href="https://doi.org/10.1002/jsid.918">E. Smith, R. L. Heckaman, K. Lang, J. Penczek, J. Bergquist,
         JSID, Volume 28, Issue 6, June 2020, 548-556.
        </a></p>
      <p> &copy;2021 Euan Smith. Licensed under the <a href="https://opensource.org/licenses/MIT">MIT</a> licence - distribute and use freely! Find me on <a href="https://github.com/euan-smith">github</a></p>
    </div>
    <div class=volume>VOLUME = {{displayCGV}} &#916;E&#179;</div>
  </div>
</template>

<style>
html{
    font-size:1vw;
  line-height: 1.1vw;
}

.title{
  grid-area:1/1/2/4;
  max-width:100%;
  max-height:100%;
  font-size: 2.5vw;
  font-weight: bold;
  margin:auto;
}
.footer{
  grid-area: 5/2/6/4;
  white-space: nowrap;
  overflow: hidden;
  max-width:100%;
}
.main{
  display:grid;
  grid-template: 1fr 9fr 3fr 1fr 2.6fr/8fr 12fr 12fr;
  width:calc(100vw - 20px);
  height:calc((100vw - 20px) * 0.52);
  justify-content: center;
  align-content: center;
  gap: 5px;
}
.table{
  grid-area: 3/1/6/2;
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
.cielab{
  grid-area: 2/2/4/3;
  width: 100%;
}
.volume{
  position:relative;
  grid-area: 4/2/5/4;
  max-width:100%;
  max-height:100%;
  margin:auto;
  font-size:2vw;
}

/*
The app layout will look like this:
+-1/1---------+------------------+-------------- = ------------+
60px     1/1/2/4          Title                                |
+-2/1---------+-2/2--------------+-2/3---------- = --------2/4-+
|    2/1      |                  |   2/3/4/4                   |
4f            |                  |                             |
| CIE1931     |                  |                             |
|             |                  |                             |
|             |     CIELAB       |                             |
|-3/1---------+                  +         RINGS               +
2f   3/1      |                  |                             |
| Primary     |                  |                             |
| table       |                  |                             |
|             |                  |                             |
+-4/1---------+--------------4/3-+-------------- = --------4/4-+
120px    4/1/5/4          References                           |
+-----4f------+--------6f--------+-------------- 6f--------5/4-+

new layout, based on 16:9 ratio
1-----4fr------2----------6fr----------3----------6fr----------4
|  1124               TITLE                                    | .5fr
2--------------+-----------------------+-----------------------+
|              |                       |                       |
|   2132       |      2243             |     2344              |
|              |                       |                       | 4.5fr
|   Chrom      |                       |                       |
|              |      CIELAB           |      RINGS            |
|              |                       |                       |
3--------------+                       +                       +
|              |                       |                       | 1.5fr
4   3162       +-----------------------+-----------------------+
|              |   4254      Volume Result                     | .5fr
5   Table      +-----------------------+-----------------------+
|              |   5264     References                         | 2fr
|              |                                               |
6--------------+-----------------------------------------------+




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
import CieLab from "./components/CIELab.vue";
import {makeSynthetic} from './gamut';
import {ref, watchEffect, computed} from 'vue';
export default {
  name: 'App',
  components: {
    SyntheticGamutEditor,
    GamutRings,
    Chromaticity,
    CieLab
  },
  setup(){
    const gamutDefinition = ref({
      RGBxy:[
        [.64, .33],
        [.3, .6],
        [.15, .06],
      ],
      white: [.3127, .3290],
      whiteBoost:0
    });
    const gamut = ref(null);
    const cgv = ref(0);
    const displayCGV = computed(()=>parseFloat(cgv.value.toPrecision(3)).toFixed(0))
    watchEffect(()=>{
      const start = performance.now();
      const driveMapping = v=>[...v, gamutDefinition.value.whiteBoost * Math.min(...v)];
      gamut.value = makeSynthetic({...gamutDefinition.value, driveMapping});
      console.log(`synth calc took ${performance.now()-start}ms`);
    })
    return {
      log:(e)=>console.log(e),
      gamut,
      gamutDefinition,
      cgv,
      displayCGV
    }
  },
}
</script>
