<script>
import * as wgl from './wgl';
import * as Matrix from 't-matrix';
import {chords} from './utils.js';
export default {
  props: {
    gamut: {
      type: Object,
      required: true,
    },
  },
  data(){
    return {
      gl:null,
      programs:{},
      buffers:{},
      proj:Matrix.from([
        [0.005, 0, 0, 0],
        [0, -0.005, .01, 0],
        [0, 0.00, 0.01, 0],
        [-0.5, 0, 0, 1]
      ]),
      triSet:false,
      rot:0,
      tip:20,
      down:false,
      pos:[],
      onDown:[],
      rendering:false,
      rerender:false,
    }
  },
  mounted(){
    const gl = this.gl = this.$refs.canv.getContext('webgl');
    this.programs.cielab = wgl.makeProgram(gl, 'cieLab');
    this.buffers.lab = gl.createBuffer();
    // this.arrays.lab = new Float32Array(602*3); //1800
    this.buffers.tri = gl.createBuffer();
    this.render();
  },
  watch:{
    gamut(){
      this.render();
    }
  },
  methods:{
    mouseDown(evt){
      evt.preventDefault();
      this.down=true;
      this.onDown=[this.rot,this.tip];
      this.pos = chords(evt,1);
    },
    mouseMove(evt){
      if (!this.down) return;
      evt.preventDefault();
      let [x,y] = chords(evt,1);
      this.setRot(this.onDown[0]+(x-this.pos[0])*180);
      this.setTip(this.onDown[1]-(y-this.pos[1])*180);
      this.render()
    },
    mouseUp(evt){
      if (!this.down) return;
      evt.preventDefault();
      this.down=false;
    },
    mouseLeave(evt){
      if (this.down){
        evt.preventDefault();
        this.down=false;
        // [this.rot,this.tip] = this.onDown;
        this.render()
      }
    },
    setRot(v){
      this.rot = (v+360) % 360;
    },
    setTip(v){
      this.tip = Math.max(-90, Math.min(90, v));
    },
    async render(){
      if (this.rendering){
        this.rerender = true;
        return;
      }
      this.rendering = true;
      const start=performance.now();
      window._lab = this;
      const {gl, programs, gamut} = this;
      if (!gl || !gamut) return;
      if (!this.triSet){
        // assume that the TRI array will not change (fair assumption here)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.buffers.tri);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gamut.TRI), gl.STATIC_DRAW);
        this.triSet = true;
      }
      wgl.clear(gl);
      const {program, attributes:{a_position}, uniforms:{u_matrix}} = programs.cielab;
      gl.useProgram(program);
      //gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lab);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gamut.LAB), gl.DYNAMIC_DRAW);
      const rot = (-this.rot-90)/180*Math.PI;
      const tip = (this.tip+90)/180*Math.PI;
      const viewMatrix = new Float32Array(
          Matrix.mult(
              Matrix.from([
                [1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [-50,0,0,1]
              ]),Matrix.from([
                [1,0,0,0],
                [0,Math.cos(-rot), Math.sin(-rot), 0],
                [0,-Math.sin(-rot), Math.cos(-rot), 0],
                [0, 0, 0, 1]
              ]),Matrix.from([
                [Math.cos(tip), Math.sin(tip), 0, 0],
                [-Math.sin(tip), Math.cos(tip), 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
              ]),Matrix.from([
                [0,0,0.001,0],
                [0,0.005,0,0],
                [0.005,0,0,0],
                [0,0,0,1]
              ])))
      gl.uniformMatrix4fv(u_matrix,false,viewMatrix);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.buffers.tri);
      gl.drawElements(gl.TRIANGLES, 3600, gl.UNSIGNED_SHORT, 0);
      gl.flush();
      console.log(`CIELab render took ${performance.now()-start}ms`)
      await new Promise(requestAnimationFrame);
      this.rendering = false;
      if (this.rerender){
        this.rerender = false;
        requestAnimationFrame(()=>this.render());
      }
    }
  }
};
</script>
<template>
 <div>
    <div class=square>
    <canvas 
        ref="canv" 
        width=500 
        height=500 
        @mousedown=mouseDown 
        @mouseup=mouseUp 
        @mousemove=mouseMove 
        @mouseleave=mouseLeave 
    />
    <div class=indicators>
      rotation {{rot.toFixed(0)}}°, tilt {{tip.toFixed(0)}}°
    </div>
    </div>
  </div>
</template>
<style scoped>
canvas{
  cursor: pointer;
}
div.container{
  width:100%;
  height:100%;
}
div.button-bar{
  display:flex;
  flex-direction:row;
}
div.button-bar button{
  width:40px;
    height:32px;
  padding:2px;
  margin:0 2px;
}
div.button-bar span{
  width:40px;
  height:32px;
  line-height: 32px;
  text-align: center;
  vertical-align: middle;
}
div.square{
  position: relative;
}
div.square:before{
  content:' ';
  display:block;
  width:100%;
  padding-top:100%
}
div.square canvas{
  background: #aaa;
  position:absolute;
  width:100%;
  height:100%;
  top:0;
  left:0;
  bottom:0;
  right:0;
}
div.square .indicators{
  position:absolute;
  left:0.5em;
  bottom:0.5em;
  color: white;
}
</style>