<template>
  <div class="main">
    <div class="header">
      <div class="menu" ref="menu" @click="$refs.menu.classList.toggle('show')">
        <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48">
          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
        </svg>
        <div class="content mask"></div>
        <ul class="content" style="text-align: left">
          <li><label>
            Load CGATS File...
            <input class=hidden type=file accept=* @change=loadFile>
          </label></li>
<!--          <li><label>-->
<!--            Sample Files...-->
<!--            <input class=hidden type=button @click=pickSample>-->
<!--          </label></li>-->
        </ul>
      </div>
      <div class=title>Gamut Rings Explorer</div>
      <div class=supported>
        <span class=by>on</span>
        <a class="github" href="https://github.com/CIELab-gamut-tools/gamut-rings-app" target="_blank">
          <svg width="49" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 118 116">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#fff"/>
          </svg>
        </a>
        <span class=by>supported by</span>
        <a class=42t href="https://42t.com" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="90" height="48" viewBox="0 0 251.2 111.1" xml:space="preserve">
            <path class="st0" d="M246.5 106.3c-2 2-4.4 3-7.3 3-2.8 0-5.3-1-7.3-3s-3-4.5-3-7.3 1-5.3 3-7.3 4.4-3 7.3-3c2.8 0 5.3 1 7.3 3s3 4.5 3 7.3-1 5.3-3 7.3z"/><path class="st0" d="M246.5 91.7c-2-2-4.4-3-7.3-3-2.8 0-5.3 1-7.3 3s-3 4.5-3 7.3 1 5.3 3 7.3 4.4 3 7.3 3c2.8 0 5.3-1 7.3-3s3-4.5 3-7.3-1-5.3-3-7.3zm-148-78.8c-3.1 3.5-5.6 7.5-7.2 11.9s-2.4 9.2-2.4 14v8.8h15.3v-7.9c0-7.2 2-13 5.8-17.3 3.8-4.2 9.3-6.4 16.4-6.4 3.8 0 7.1.6 9.7 1.7 2.7 1.1 4.9 2.7 6.6 4.5 1.7 1.9 3 4 3.8 6.4s1.2 4.8 1.2 7.3v.9c0 4.9-1.7 8.9-5.3 12.3-3.6 3.4-9.7 6.1-18.1 8-5.2 1.2-10 2.6-14.1 4.3-4.2 1.7-7.9 3.9-10.9 6.5s-5.4 5.8-7 9.5c-1.6 3.6-2.5 8-2.5 12.9v19.1h72.3V95H105v-2.9c0-6 2-10.5 6-13.6 4.2-3.2 10.9-5.9 20-7.9 11-2.4 19.1-6.5 24.2-12.3s7.7-12.8 7.7-21v-2.6c0-4.1-.7-8.1-2.2-12s-3.8-7.5-6.8-10.6c-3.1-3.1-6.9-5.6-11.5-7.5-4.5-1.9-9.9-2.8-16.1-2.8h-.1c-6 0-11.4 1-16.1 3.1-4.5 1.8-8.5 4.6-11.6 8zm99.7 25.9v70.5h16.5V23.9l-16.5 14.9zM168.3 3.6h76.4V18h-76.4V3.6zM64.2 75.5V3.6H38L1.5 71v18.9h25.6l16-14.4h-28L49 13v96.3h15.2V89.9H80V75.5H64.2z"/>
          </svg>
        </a>
      </div>
    </div>
    <div class="table">
      <synthetic-gamut-editor v-model:definition=gamutDefinition :locked=isCgats />
    </div>
    <chromaticity class="plot" v-model:definition="gamutDefinition" :locked=isCgats />
<!--    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" class=lock :class={hidden:!isCgats} @click=unlock>-->
<!--      <path d="m622-453-56-56 82-82-57-57-82 82-56-56 195-195q12-12 26.5-17.5T705-840q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L622-453ZM200-200h57l195-195-28-29-29-28-195 195v57ZM792-56 509-338 290-120H120v-169l219-219L56-792l57-57 736 736-57 57Zm-32-648-56-56 56 56Zm-169 56 57 57-57-57ZM424-424l-29-28 57 57-28-29Z"/>-->
<!--    </svg>-->
    <div class=lock :class={hidden:!isCgats} @click=unlock>
      CGATS loaded, editor locked.<br>Click here to unlock.
    </div>

    <cie-lab class=cielab :gamut=gamut />
    <gamut-rings class="rings" :gamut=gamut :refGamut="refGamut" @cgv="e=>cgv=e.cgv"/>
    <div class="footer">
      <p>Original Gamut Rings concept: <a href="https://doi.org/10.1002/sdtp.12187" target="_blank">K. Masaoka, F. Jiang, M. D. Fairchild, and R. L. Heckaman,
        SID Digest, Volume 49, Issue 1, May 2018, 1048-1051</a></p>
      <p>Calculation based on: <a href="https://doi.org/10.1002/jsid.918" target="_blank">E. Smith, R. L. Heckaman, K. Lang, J. Penczek, J. Bergquist,
         JSID, Volume 28, Issue 6, June 2020, 548-556.
        </a></p>
      <p>and <a href="https://doi.org/10.1002/jsid.1292" target="_blank">E. Smith, JSID, May 2024, doi.org/10.1002/jsid.1292</a></p>
      <p> &copy;2021-2024 Euan Smith. Licensed under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT</a> licence - distribute and use freely! Find <a href="https://github.com/euan-smith" target="_blank">me</a>
      or <a href="https://github.com/CIELab-gamut-tools" target="_blank">gamut tools</a> on github</p>
    </div>
    <div class=volume>{{refGamut?"INTERSECTION ":""}}VOLUME = {{displayCGV}} &#916;E&#179;</div>
  </div>
</template>

<style>
html,body{
  font-size:1vw;
  line-height: 1.1vw;
  padding:0;
  margin:0;
}

.header{
  position:relative;
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
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  vertical-align: center;
  font-size: 2.5vw;
  font-weight: bold;
}
.header>.menu{
  position:absolute;
  top:0;
  left:0;
  cursor:pointer;
}
.header>.supported{
  position:absolute;
  top:0;
  right:0;
  cursor:pointer;
  font-size:2em;
  display:flex;
  flex-direction: row;
  padding-right:8px;
}
.supported>.by{
  display:block;
  position:relative;
  margin:auto 8px;
  padding-bottom:4px;
}

.menu li{
  padding:6px;
}
li label{
  cursor:pointer;
}
.menu svg, .github svg{
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
  border:1px solid black;
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
  grid-template: 1fr 9fr 3fr 1fr 2.6fr/8.2fr 11fr 11fr;
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
svg.lock{
  grid-area: 2/1;
  position:relative;
  top:0;
  margin:5% 0 0 80%;
  width:15%;
  height:15%;
  cursor:pointer;
}
div.lock{
  padding:2%;
  grid-area: 2/1/6/1;
  position:relative;
  margin: 0 0 0 0;
  width: 120%;
  height: 10%;
  font-size: 1.6em;
  line-height: 1.1em;
  font-style: italic;
  background: #8001;
  color: #622;
  cursor:pointer;
  transform:translate(-2vw,8vw) rotate(-20deg);
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
      clo:1,
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
      const driveMapping = v=>[...v, (1/gamutDefinition.value.clo-1) * Math.pow(Math.min(...v),0.5)];
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
    async pickSample(){

    },
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
      this.gamutDefinition.clo=CLO/WLO;
      this.$refs.menu.classList.toggle('show')
    },
    unlock(){
      this.isCgats=false
    }
  }
}
</script>
