
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
        console.log(`rings calc took ${performance.now()-start}ms`)
        const [a,b] = this.ringData;
        wgl.clear(gl);
        const x=[...a], y=[...b], data=this.arrays.rings;
        for (let i=0, j=2; i<3600; i++){
          data[j++]=(x[i])/1000;
          data[j++]=(y[i])/1000;
        }
        {
          const {program, attributes:{a_position}, uniforms:{u_lightness, u_chroma}} = programs.varColour;
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
          gl.enableVertexAttribArray(a_position);
          gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
          for (let i=0;i<10;i++){
            gl.uniform1f(u_chroma, 10+i*4);
            gl.uniform1f(u_lightness, 30+i*68/9);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.areas[i]);
            gl.drawElements(i?gl.TRIANGLE_STRIP:gl.TRIANGLE_FAN,i?722:362,gl.UNSIGNED_SHORT, 0);
          }
        }
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
        gl.flush();
      }
    },
  }
</script>

<template>
 <div>
   <p>
     Gamut volume = {{ringData && ringData[3].toFixed(0)}}
   </p>
   <div class="square">
     <svg viewBox="-1000 -1000 2000 2000">
       <path d="M-1000,-1000H1000V1000H-1000Z" stroke="black" stroke-width="10" fill="none"/>
       <path d="M-900,0H900" stroke="#888" stroke-width="3" fill="none"/>
       <path d="M0,-900V900" stroke="#888" stroke-width="3" fill="none"/>
       <line v-for="i of 19" :x1="(i-10)*100" :x2="(i-10)*100" y1="-1000" y2="-980" stroke-width="3" stroke="black"/>
       <line v-for="i of 19" :x1="(i-10)*100" :x2="(i-10)*100" y1="1000" y2="980" stroke-width="3" stroke="black"/>
       <line v-for="i of 19" :y1="(i-10)*100" :y2="(i-10)*100" x1="1000" x2="980" stroke-width="3" stroke="black"/>
       <line v-for="i of 19" :y1="(i-10)*100" :y2="(i-10)*100" x1="-1000" x2="-980" stroke-width="3" stroke="black"/>
       <text v-for="i of 9" :x="(i-5)*200" y="970" class="x-axis-labels">{{ (i-5)*200}}</text>
       <text v-for="i of 9" :x="(i-5)*200" y="-920" class="x-axis-labels">{{ (5-i)*200}}</text>
       <text v-for="i of 9" :y="(i-5)*200+25" x="-970" class="y-axis-labels">{{ (5-i)*200}}</text>
       <text v-for="i of 9" :y="(i-5)*200+25" x="970" class="y-axis-labels" text-anchor="end">{{ (i-5)*200}}</text>
       <text x="-250" y="840" class="label">a</text>
       <text x="-200" y="820" class="label-script">*</text>
       <text x="-200" y="880" class="label-script">RSS</text>
       <text x="-900" y="100" class="label">b</text>
       <text x="-850" y="80" class="label-script">*</text>
       <text x="-850" y="140" class="label-script">RSS</text>
     </svg>
     <canvas ref="canv"></canvas>
   </div>
 </div>
</template>

<style scoped>
div.square{
  position: relative
}
div.square:before{
  content:' ';
  display:block;
  width:100%;
  padding-top:100%
}
div.square>*{
  position:absolute;
  width:100%;
  top:0;
  left:0;
  bottom:0;
  right:0;
}
.label {
  font: bold italic 100px serif;
}
.label-script{
  font: bold italic 60px serif;
}
.x-axis-labels{
  text-anchor:middle;
}
.y-axis-labels, .x-axis-labels{
  font: 60px serif;
}
</style>