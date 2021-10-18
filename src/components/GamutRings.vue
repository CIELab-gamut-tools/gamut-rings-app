
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
        arrays:{},
        ringData:null,
      }
    },
    mounted(){
      console.log('mounted')
      const gl = this.gl = this.$refs.canv.getContext('webgl');
      this.$refs.canv.width = this.$refs.canv.height = 1024;
      this.programs.fixedColour = wgl.makeProgram(gl, 'fixedColour');
      this.programs.varColour = wgl.makeProgram(gl, 'varColour');
      this.buffers.rings = gl.createBuffer();
      this.arrays.rings = new Float32Array(7202);
      this.buffers.lines=[];
      this.buffers.areas=[];
      for(let n=0;n<10;n++){
        const la=new Uint16Array(360);
        for(let i=0;i<360;i++){
          la[i]=n*360+i+1;
        }
        const lb = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lb);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, la, gl.STATIC_DRAW);
        this.buffers.lines.push(lb);
        let aa;
        if (n){
          aa = new Uint16Array(722)
          for(let i=0;i<360;i++){
            aa[i*2]=i+n*360-359;
            aa[i*2+1]=i+n*360+1;
          }
          aa[720]=n*360-359;
          aa[721]=n*360+1;
        } else {
          aa = new Uint16Array(362);
          for(let i=0;i<361;i++){
            aa[i]=i;
          }
          aa[361]=1;
        }
        const ab = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ab);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, aa, gl.STATIC_DRAW);
        this.buffers.areas.push(ab);
      }

      this.render();
    },
    watch:{
      gamut(){
        this.render();
      }
    },
    methods:{
      render(){
        const start=performance.now();
        const {gl, programs, gamut} = this;
        if (!gl || !gamut) return;
        this.ringData = rings(gamut, [10,'::',10,100]);
        console.log('rings', performance.now()-start)
        const [a,b] = this.ringData;
        wgl.clear(gl);
        const x=[...a], y=[...b], data=this.arrays.rings;
        console.log('array-ify', performance.now()-start)
        for (let i=0, j=2; i<3600; i++){
          data[j++]=(x[i])/1000;
          data[j++]=(y[i])/1000;
        }
        console.log('data', performance.now()-start)
        {
          const {program, attributes:{a_position}, uniforms:{u_lightness, u_chroma}} = programs.varColour;
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
          gl.enableVertexAttribArray(a_position);
          gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
          for (let i=0;i<10;i++){
            gl.uniform1f(u_chroma, i?25:10);
            gl.uniform1f(u_lightness, 40+i*65/9);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.areas[i]);
            gl.drawElements(i?gl.TRIANGLE_STRIP:gl.TRIANGLE_FAN,i?722:362,gl.UNSIGNED_SHORT, 0);
          }
        }
        console.log('areas', performance.now()-start)
        {
          const {program, attributes:{a_position}, uniforms:{u_col}} = programs.fixedColour;
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
          gl.enableVertexAttribArray(a_position);
          gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
          for (let i=0;i<10;i++){
            const gs = 0;
            gl.uniform4f(u_col, gs/2,gs/2,gs/2, 1);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.lines[i]);
            gl.drawElements(gl.LINE_LOOP, 360, gl.UNSIGNED_SHORT, 0);
          }
        }
        console.log('lines', performance.now()-start)
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