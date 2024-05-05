<template>
  <div class="main">
    <div class="header">
      <div class="menu" ref="menu" @click="$refs.menu.classList.toggle('show')">
        <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
        </svg>
        <div class="content mask"></div>
        <ul class="content">
          <li><label>
            Load CGATS File...
            <input class=hidden type=file accept=* @change=loadFile>
          </label></li>
          <li><label>
            Load Sample Data...
            </label></li>
        </ul>
      </div>
      <div class="title">Gamut Rings Explorer</div>
    </div>
    <div class="table">
      <synthetic-gamut-editor v-model:definition=gamutDefinition :locked=isCgats />
    </div>
    <chromaticity class="plot" v-model:definition="gamutDefinition" :locked=isCgats />
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" class=lock :class={hidden:!isCgats} @click=unlock>
      <path d="m622-453-56-56 82-82-57-57-82 82-56-56 195-195q12-12 26.5-17.5T705-840q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L622-453ZM200-200h57l195-195-28-29-29-28-195 195v57ZM792-56 509-338 290-120H120v-169l219-219L56-792l57-57 736 736-57 57Zm-32-648-56-56 56 56Zm-169 56 57 57-57-57ZM424-424l-29-28 57 57-28-29Z"/>
    </svg>

    <cie-lab class=cielab :gamut=gamut />
    <gamut-rings class="rings" :gamut=gamut :refGamut="refGamut" @cgv="e=>cgv=e.cgv"/>
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

.header{
  grid-area:1/1/2/4;
  width:100vw;
  height:3.8vw;
  max-height:100%;
  background:#633;
  color:#fff;
  margin:auto;
  fill:#fff;
}
.title{
  width:100%;
  font-size: 2.5vw;
  font-weight: bold;
}
.header>.menu{
  position:absolute;
  top:0;
  left:0;
  cursor:pointer;

}
.menu svg{
  width:3.8vw;
  height:3.8vw;
}
.menu.show{
  background:#fff2;
}
.menu>.content{
  display:none;
}
.menu.show>.content{
  display:block;
}
.hidden{
  display:none
}
.content.mask{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  z-index: 1;
  cursor:default;
  opacity:1;
}
ul.content{
  z-index: 2;
  position:absolute;
  top:100%;
  width:20vw;
  left:0;
  list-style-type: none;
  margin: 0;
  padding: 0;
  background:#eee;
  color:#222;
  font-size:1.5vw;
}
.header ul.content>li:hover{
  background:#6333;
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
  width:calc(100vw);
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
.lock{
  grid-area: 2/1;
  position:relative;
  top:0;
  margin:5% 0 0 80%;
  width:15%;
  height:15%;
  cursor:pointer;
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
import {makeSynthetic, fromCgats} from './gamut';
import {ref, watchEffect, computed} from 'vue';
import {REFS, WHITES} from "./gamut/refs";
import {rows,max} from "t-matrix";

export default {
  name: 'App',
  components: {
    SyntheticGamutEditor,
    GamutRings,
    Chromaticity,
    CieLab
  },
  setup(){
    const {srgb} = REFS;
    const RGBxy = JSON.parse(JSON.stringify(srgb.RGBxy));
    const gamutDefinition = ref({
      RGBxy,
      white: [...WHITES.D65],
      whiteBoost:0,
      REF: null
    });
    const gamut = ref(null);
    const isCgats = ref(false);
    const refGamut = ref(null);
    let refGamutName = null;
    const cgv = ref(0);
    const displayCGV = computed(()=>parseFloat(cgv.value.toPrecision(3)).toFixed(0))
    watchEffect(()=>{
      const start = performance.now();
      const driveMapping = v=>[...v, gamutDefinition.value.whiteBoost * Math.pow(Math.min(...v),0.5)];
      if (!isCgats.value){
        gamut.value = makeSynthetic({...gamutDefinition.value, driveMapping});
      }
      if (gamutDefinition.value.REF !== refGamutName){
        refGamutName = gamutDefinition.value.REF;
        refGamut.value = refGamutName && makeSynthetic(refGamutName);
        console.log(`ref changed to ${refGamutName}`, refGamut.value);
      }
      console.log(`synth calc took ${performance.now()-start}ms`);
    })
    return {
      log:(e)=>console.log(e),
      gamut,
      refGamut,
      gamutDefinition,
      cgv,
      displayCGV,
      isCgats,
    }
  },
  methods:{
    async loadFile(evt){
      const file = evt.target.files[0];
      const readEvt = await new Promise((res,rej)=>{
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = res;
        reader.onerror = rej;
      });
      this.gamut = fromCgats(readEvt.target.result);
      this.isCgats = true;
      const {RGB, XYZ} = this.gamut;
      const mx = max(RGB);
      let r,g,b,w,n=0;
      for(let rgb of rows(RGB)){
        if (rgb[0]==mx && rgb[1]==0 && rgb[2]==0) r=n;
        else if (rgb[0]==0 && rgb[1]==mx && rgb[2]==0) g=n;
        else if (rgb[0]==0 && rgb[1]==0 && rgb[2]==mx) b=n;
        else if (rgb[0]==mx && rgb[1]==mx && rgb[2]==mx) w=n;
        n++;
      }
      const xyz2xy=m=>{
        const [X,Y,Z]=[...m], T=X+Y+Z;
        return [X/T, Y/T];
      }
      const rxy=xyz2xy(XYZ.get(r,':'));
      const gxy=xyz2xy(XYZ.get(g,':'));
      const bxy=xyz2xy(XYZ.get(b,':'));
      const wxy=xyz2xy(XYZ.get(w,':'));
      const WLO = XYZ.get(w,1);
      const CLO = XYZ.get(r,1)+XYZ.get(g,1)+XYZ.get(b,1);
      console.log({rxy,gxy,bxy,wxy,WLO,CLO})
      this.gamutDefinition.RGBxy = [rxy, gxy, bxy];
      this.gamutDefinition.white = wxy;
      this.gamutDefinition.whiteBoost=(WLO-CLO)/CLO;
      this.$refs.menu.classList.toggle('show')
    },
    unlock(){
      this.isCgats=false
    }
  }
}
</script>
