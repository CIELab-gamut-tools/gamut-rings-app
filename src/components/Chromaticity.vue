<template>
  <canvas :class={locked} ref="canv" @mousedown="mousedown" @mousemove="mousemove" @mouseleave="mouseleave" @mouseup="mouseup"></canvas>
</template>

<script>
import cie1931 from '../gamut/cie1931.json';
import {chords} from './utils.js';
const SIZE=500;
const STRETCH=1.18;
export default {
  name: "Chromaticity",
  props:{
    definition:{
      type:Object,
      required:true
    },
    locked:{
      type:Boolean,
      default:false
    }
  },
  data(){
    return {
      down:false,
      point:null,
      was:null,
      focus:null,
      whiteFocussed:false,
      edges:null
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
      let [x,y] = chords(evt,STRETCH);
      if (!this.focus) return;
      this.down=true;
      this.point = this.focus;
      this.was=[...this.point];
      this.point[0]=x;
      this.point[1]=y;
      if (!setIsValid(this.definition.RGBxy, this.definition.white)){
        [this.point[0], this.point[1]]=this.was;
      }
    },
    mousemove(evt){
      evt.preventDefault();
      let [x,y] = chords(evt,STRETCH);
      if (this.down){
        this.point[0]=x;
        this.point[1]=y;
        if (!setIsValid(this.definition.RGBxy, this.definition.white)){
          [this.point[0], this.point[1]]=this.was;
        }
      } else if(!this.locked) {
        let d=1e9, closest=null;
        for (let p of [this.definition.white, ...this.definition.RGBxy]){
          const dx=x-p[0], dy=y-p[1], nd=dx*dx+dy*dy;
          if (nd<d){
            closest=p;
            d=nd;
          }
        }
        if (this.focus!==closest) {
          this.focus=closest;
          this.whiteFocussed = this.focus === this.definition.white;
        }
      } else {this.focus = null}
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
        const t=X+Y+Z, x=X/t, y=Y/t;
        if (wl === cie1931[0][0]){
          ctx.moveTo(x*SIZE*STRETCH,(1-y*STRETCH)*SIZE);
        } else ctx.lineTo(x*SIZE*STRETCH,(1-y*STRETCH)*SIZE);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle='#444';
      const {RGBxy, white} = this.definition;
      ctx.moveTo(RGBxy[0][0]*SIZE*STRETCH,(1-RGBxy[0][1]*STRETCH)*SIZE);
      ctx.lineTo(RGBxy[1][0]*SIZE*STRETCH,(1-RGBxy[1][1]*STRETCH)*SIZE);
      ctx.lineTo(RGBxy[2][0]*SIZE*STRETCH,(1-RGBxy[2][1]*STRETCH)*SIZE);
      ctx.lineTo(RGBxy[0][0]*SIZE*STRETCH,(1-RGBxy[0][1]*STRETCH)*SIZE);
      ctx.lineTo(white[0]*SIZE*STRETCH,(1-white[1]*STRETCH)*SIZE);
      ctx.lineTo(RGBxy[1][0]*SIZE*STRETCH,(1-RGBxy[1][1]*STRETCH)*SIZE);
      ctx.moveTo(white[0]*SIZE*STRETCH,(1-white[1]*STRETCH)*SIZE);
      ctx.lineTo(RGBxy[2][0]*SIZE*STRETCH,(1-RGBxy[2][1]*STRETCH)*SIZE);
      ctx.stroke();
      if (this.focus) ctx.strokeRect(this.focus[0]*SIZE*STRETCH-10, (1-this.focus[1]*STRETCH)*SIZE-10, 20,20);
      filledColouredXY(ctx,RGBxy[0]);
      filledColouredXY(ctx,RGBxy[1]);
      filledColouredXY(ctx,RGBxy[2]);
      filledColouredXY(ctx,white);
      ctx.strokeRect(white[0]*SIZE*STRETCH-5, (1-white[1]*STRETCH)*SIZE-5, 10,10);
    }
  }
}

function filledColouredXY(ctx,[x,y]){
  ctx.fillStyle = getFillStyleFromXY([x,y]);
  ctx.fillRect(x*SIZE*STRETCH-5, (1-y*STRETCH)*SIZE-5, 10, 10);
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

function setIsValid(prims, white){
  const edges=[];
  const [wx,wy]=white;
  for(let i=0;i<3;i++){
    const [p0x,p0y]=prims[i];
    const p1=prims[(i+1)%3];
    let nx = (p0y - p1[1]);
    let ny = (p1[0] - p0x);
    let d = p0x*nx+p0y*ny;
    edges.push([nx,ny]);
    if (nx*wx+ny*wy<d) return false;
  }
  // this loop will also check that the RGB points rotate in the right way
  // however this is probably not possible without breaking the above constraint
  
  // for(let i=0;i<3;i++){
  //   const e0=edges[i], e1=edges[(i+1)%3];
  //   if (e0[0]*e1[1]-e0[1]*e1[0]<0) return false;
  // }
  return true;
}

</script>

<style scoped>

canvas{
  cursor: pointer;
}
canvas.locked{
  cursor:default;
}
</style>