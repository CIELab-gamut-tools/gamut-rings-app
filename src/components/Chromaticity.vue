<template>
  <canvas ref="canv" @mousedown="mousedown" @mousemove="mousemove" @mouseleave="mouseleave" @mouseup="mouseup"></canvas>
</template>

<script>
import cie1931 from '../gamut/cie1931.json';
const SIZE=500;
export default {
  name: "Chromaticity",
  props:{
    definition:{
      type:Object,
      required:true
    },
  },
  data(){
    return {
      down:false,
      point:null,
      was:null,
      focus:null,
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
    focus:{
      handler(){
        this.render()
      },
      deep:true
    }
  },
  methods:{
    mousedown(evt){
      evt.preventDefault();
      const [x,y] = chords(evt);
      if (!this.focus) return;
      this.down=true;
      this.point = this.focus;
      this.was=[...this.point];
      this.point[0]=x;
      this.point[1]=y;
    },
    mousemove(evt){
      evt.preventDefault();
      const [x,y] = chords(evt);
      if (this.down){
        this.point[0]=x;
        this.point[1]=y;
      } else {
        let d=1e9, closest=null;
        for (let p of [this.definition.white, ...this.definition.RGBxy]){
          const dx=x-p[0], dy=y-p[1], nd=dx*dx+dy*dy;
          if (nd<d){
            closest=p;
            d=nd;
          }
        }
        if (this.focus!==closest) this.focus=closest;
      }
    },
    mouseleave(evt){
      evt.preventDefault();
      this.focus=null;
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
      canv.width = canv.height = SIZE;
      const ctx = canv.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle='black';
      for (let [wl,X,Y,Z] of cie1931){
        const t=X+Y+Z, x=X/t, y=1-Y/t;
        if (wl === cie1931[0][0]){
          ctx.moveTo(x*SIZE,y*SIZE);
        } else ctx.lineTo(x*SIZE,y*SIZE);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle='#444';
      const {RGBxy, white} = this.definition;
      ctx.moveTo(RGBxy[0][0]*SIZE,(1-RGBxy[0][1])*SIZE);
      ctx.lineTo(RGBxy[1][0]*SIZE,(1-RGBxy[1][1])*SIZE);
      ctx.lineTo(RGBxy[2][0]*SIZE,(1-RGBxy[2][1])*SIZE);
      ctx.lineTo(RGBxy[0][0]*SIZE,(1-RGBxy[0][1])*SIZE);
      ctx.lineTo(white[0]*SIZE,(1-white[1])*SIZE);
      ctx.lineTo(RGBxy[1][0]*SIZE,(1-RGBxy[1][1])*SIZE);
      ctx.moveTo(white[0]*SIZE,(1-white[1])*SIZE);
      ctx.lineTo(RGBxy[2][0]*SIZE,(1-RGBxy[2][1])*SIZE);
      ctx.stroke();
      if (this.focus) ctx.strokeRect(this.focus[0]*SIZE-10, (1-this.focus[1])*SIZE-10, 20,20);
      filledColouredXY(ctx,RGBxy[0]);
      filledColouredXY(ctx,RGBxy[1]);
      filledColouredXY(ctx,RGBxy[2]);
      filledColouredXY(ctx,white);
      ctx.strokeRect(white[0]*SIZE-5, (1-white[1])*SIZE-5, 10,10);
    }
  }
}

function chords(evt){
  const {clientX, clientY, target:{clientWidth, clientHeight}} = evt;
  const {left,top} = evt.target.getBoundingClientRect();
  const x=(clientX-left)/clientWidth, y=1-(clientY-top)/clientHeight;
  return [x,y];
}

function filledColouredXY(ctx,[x,y]){
  ctx.fillStyle = getFillStyleFromXY([x,y]);
  ctx.fillRect(x*SIZE-5, (1-y)*SIZE-5, 10, 10);
}

function getFillStyleFromXY([x,y]){
  const z=1-x-y;
  const Y=1, X=x/y, Z=z/y;
  let r=3.2404*X-1.5371*Y-0.4985*Z;
  let g=-0.9692*X+1.8760*Y+0.0415*Z;
  let b=0.0557*X-0.2040*Y+1.0572*Z;
  const mx = Math.max(r,g,b);
  r=r<0?0:Math.pow(r/mx,0.4)*255;
  g=g<0?0:Math.pow(g/mx,0.4)*255;
  b=b<0?0:Math.pow(b/mx,0.4)*255;
  return `rgb(${r},${g},${b})`;
}

</script>

<style scoped>
canvas{
  cursor: pointer;
}
</style>