
<script>
  import {rings} from '../gamut';
  import * as wgl from './wgl';
  export default {
    name: "GamutRings",
    props:{
      gamut:{
        type:Object,
        required:true,
      }
    },
    data(){
      return {
        gl:null,
        programs:{},
        buffers:{},
        ringData:null,
      }
    },
    mounted(){
      console.log('mounted')
      const gl = this.gl = this.$refs.canv.getContext('webgl');
      this.$refs.canv.width = this.$refs.canv.height = 1024;
      this.programs.fixedColour = wgl.makeProgram(gl, 'fixedColour');
      this.buffers.rings = gl.createBuffer();
      this.render();
    },
    watch:{
      gamut(){
        this.render();
      }
    },
    methods:{
      render(){
        const {gl, programs, gamut} = this;
        if (!gl || !gamut) return;
        this.ringData = rings(gamut, [10,'::',10,100]);
        const {program, attributes:{a_position}, uniforms:{u_col}} = programs.fixedColour;
        gl.useProgram(program);
        const [a,b] = this.ringData;
        wgl.clear(gl);
        for(let r=9;r>=0;r--){
          const x=[...a.get(r,':')];
          const y=[...b.get(r,':')];
          const data = new Float32Array(2*x.length+4);
          const L = x.length;
          let j=2;
          for (let i=0;i<L;i++){
            data[j++]=(x[i])/1000;
            data[j++]=(y[i])/1000;
          }
          data[j++]=(x[0])/1000;
          data[j++]=(y[0])/1000;
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
          gl.useProgram(program);
          gl.enableVertexAttribArray(a_position);
          gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
          const gs = (r+6.5)/16;
          gl.uniform4f(u_col, gs,gs,gs, 1);
          gl.drawArrays(gl.TRIANGLE_FAN,0, L+2);
          gl.uniform4f(u_col, gs/2,gs/2,gs/2,1);
          gl.drawArrays(gl.LINE_LOOP,1, L);
        }
        gl.flush();
      }
    },
  }
</script>

<template>
 <div>
   <p>
     Gamut volume = {{ringData && ringData[3]}}
   </p>
   <canvas ref="canv"></canvas>
 </div>
</template>

<style scoped>
canvas{
  width:80vmin;
}
</style>