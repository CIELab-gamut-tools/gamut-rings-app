<script>
  import cie1931 from '../gamut/cie1931.json'
  import FPInput from "./FPInput.vue";
  export default {
    name: "SyntheticGamutEditor",
    components:{
      FPInput
    },
    props:{
      definition:{
        type:Object,
        required:true
      }
    },
    data(){
      return {
        down:false,
        point:null,
        was:null
      }
    },
    mounted(){
      this.render();
    },
    watch:{
      definition:{
        handler(){
          this.render()
        },
        deep:true
      },
    },
    methods:{
      mousedown(evt){
        console.log(evt);
        evt.preventDefault();
        const [x,y] = chords(evt);
        this.down=true;
        let d=1e9;
        for (let p of [this.definition.white, ...this.definition.RGBxy]){
          const dx=x-p[0], dy=y-p[1], nd=dx*dx+dy*dy;
          if (nd<d){
            this.point=p;
            d=nd;
          }
        }
        this.was=[...this.point];
        this.point[0]=x;
        this.point[1]=y;
      },
      mousemove(evt){
        evt.preventDefault();
        if (!this.down) return;
        const [x,y] = chords(evt);
        this.point[0]=x;
        this.point[1]=y;
      },
      mouseleave(evt){
        evt.preventDefault();
        if (!this.down) return;
        this.point[0]=this.was[0];
        this.point[1]=this.was[1];
        this.down=false;
      },
      mouseup(evt){
        evt.preventDefault();
        if (!this.down) return;
        this.down=false;
      },
      render(){
        const {canv} = this.$refs;
        canv.width = canv.height = 1000;
        const ctx = canv.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle='black';
        for (let [wl,X,Y,Z] of cie1931){
          const t=X+Y+Z, x=X/t, y=1-Y/t;
          if (wl === cie1931[0][0]){
            ctx.moveTo(x*1000,y*1000);
          } else ctx.lineTo(x*1000,y*1000);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle='#888';
        const {RGBxy, white} = this.definition;
        ctx.moveTo(RGBxy[0][0]*1000,(1-RGBxy[0][1])*1000);
        ctx.lineTo(RGBxy[1][0]*1000,(1-RGBxy[1][1])*1000);
        ctx.lineTo(RGBxy[2][0]*1000,(1-RGBxy[2][1])*1000);
        ctx.lineTo(RGBxy[0][0]*1000,(1-RGBxy[0][1])*1000);
        ctx.lineTo(white[0]*1000,(1-white[1])*1000);
        ctx.lineTo(RGBxy[1][0]*1000,(1-RGBxy[1][1])*1000);
        ctx.moveTo(white[0]*1000,(1-white[1])*1000);
        ctx.lineTo(RGBxy[2][0]*1000,(1-RGBxy[2][1])*1000);
        ctx.stroke();
      }
    }
  }

  function chords(evt){
    const {clientX, clientY, target:{clientWidth, clientHeight}} = evt;
    const {left,top} = evt.target.getBoundingClientRect();
    const x=(clientX-left)/clientWidth, y=1-(clientY-top)/clientHeight;
    return [x,y];
  }
</script>

<template>
  <div class="container">
  <canvas ref="canv" @mousedown="mousedown" @mousemove="mousemove" @mouseleave="mouseleave" @mouseup="mouseup"></canvas>
  <table>
    <tr>
      <th>Colour</th>
      <th>CIE1931 x</th>
      <th>CIE1931 y</th>
    </tr>
    <tr v-for="(xy,i) of definition.RGBxy" >
      <td>{{['red','green','blue'][i]}}</td>
      <td><f-p-input type="number" max="1" min="0" step="0.01" places="4" v-model=xy[0] /> </td>
      <td><f-p-input type="number" max="1" min="0" step="0.01" places="4" v-model=xy[1] /></td>
    </tr>
    <tr>
      <td>white</td>
      <td><f-p-input type="number" max="1" min="0" step="0.01" places="4" v-model=definition.white[0] /></td>
      <td><f-p-input type="number" max="1" min="0" step="0.01" places="4" v-model=definition.white[1] /></td>
    </tr>

  </table>
  </div>
</template>

<style scoped>
.container{
  display:flex;
  flex-direction: column;
  height:100%;
}
canvas{
  flex:1 1 0;
}
table{
  flex: 0 0 auto;
}
td{
  padding:0 .5rem;
  line-height: 1;
}
td>input{
  width:100px;
  margin:auto;
  background:transparent;
  border:none;
}
</style>