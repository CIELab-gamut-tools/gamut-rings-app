
<script>
const AxisLimit = 1100, TickStep = 100, LabelStep = 200;
const Ls = [10,'::',10,100];
  import {rings, intersect} from '../gamut';
  import * as wgl from './wgl';
  export default {
    name: "GamutRings",
    props:{
      gamut:{
        type:Object,
        required:true,
      },
      refGamut:{
        required:false,
      }
    },
    data(){
      return {
        gl:null,
        programs:{},
        buffers:{},
        arrays:{},
        ringData:null,
        rendering:false,
        rerender:false,
        refObj:null,
        refRingData:null,
        AxisLimit,
        TickStep,
        AxisEnd: AxisLimit-TickStep,
        TickCount: 2*AxisLimit/TickStep-1,
        LabelStep,
        XLabelCount: 2*Math.floor(AxisLimit/LabelStep)-1,
        YLabelCount: 2*Math.floor(AxisLimit/LabelStep)+1,
        XLabelEnd: AxisLimit-(AxisLimit%LabelStep),
        YLabelEnd: AxisLimit+(AxisLimit%LabelStep),
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
      this.buffers.iRings = gl.createBuffer();
      this.arrays.iRings = new Float32Array(14402);
      this.buffers.lines=[];
      this.buffers.areas=[];
      for(let n=0;n<20;n++){

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
      },
      refGamut(){
        this.render();
      }
    },
    methods:{
      async render(){
        if (this.rendering){
          this.rerender = true;
          return;
        }
        this.rendering = true;        
        const start=performance.now();
        const {gl, programs, gamut, refGamut} = this;
        if (!gl || !gamut) return;
        if (refGamut){
          if (this.refObj !== refGamut){
            this.refRingData = rings(refGamut, Ls)
          }
          console.log(this.refRingData);
          const iGamut = intersect(gamut, refGamut);
          this.ringData = rings(iGamut, Ls, this.refRingData[2]);
        } else {
          this.ringData = rings(gamut, Ls);
        }
        const rcalc = performance.now();
        console.log(`rings calc took ${rcalc-start}ms`)
        wgl.clear(gl);
        if (refGamut) {
          const [x, y] = this.ringData;
          const [rx, ry] = this.refRingData;
          const data = this.arrays.iRings;
          for (let i=0, j=2; i<3600; i+=360){
            for (let k=i; k<i+360; k++){
              data[j++] = (x[k]) / AxisLimit;
              data[j++] = (y[k]) / AxisLimit;
            }
            for (let k=i; k<i+360; k++){
              data[j++] = (rx[k]) / AxisLimit;
              data[j++] = (ry[k]) / AxisLimit;
            }
          }
          {
            const {program, attributes: {a_position}, uniforms: {u_lightness, u_chroma}} = programs.varColour;
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.iRings);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            for (let i = 0; i < 10; i++) {
              gl.uniform1f(u_chroma, 10 + i * 4);
              gl.uniform1f(u_lightness, 30 + i * 68 / 9);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.areas[i*2]);
              gl.drawElements(i ? gl.TRIANGLE_STRIP : gl.TRIANGLE_FAN, i ? 722 : 362, gl.UNSIGNED_SHORT, 0);
              gl.uniform1f(u_chroma, 0);
              gl.uniform1f(u_lightness, 30 + i * 68 / 9);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.areas[i*2+1]);
              gl.drawElements( gl.TRIANGLE_STRIP, 722, gl.UNSIGNED_SHORT, 0);
            }
          }
          {
            const {program, attributes: {a_position}, uniforms: {u_col}} = programs.fixedColour;
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            for (let i = 0; i < 10; i++) {
              const gs = 0;
              gl.uniform4f(u_col, gs / 2, gs / 2, gs / 2, 1);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.lines[i*2+1]);
              gl.drawElements(gl.LINE_LOOP, 360, gl.UNSIGNED_SHORT, 0);
            }
          }
        } else {
          const [x, y] = this.ringData;
          const data = this.arrays.rings;
          for (let i = 0, j = 2; i < 3600; i++) {
            data[j++] = (x[i]) / AxisLimit;
            data[j++] = (y[i]) / AxisLimit;
          }
          {
            const {program, attributes: {a_position}, uniforms: {u_lightness, u_chroma}} = programs.varColour;
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            for (let i = 0; i < 10; i++) {
              gl.uniform1f(u_chroma, 10 + i * 4);
              gl.uniform1f(u_lightness, 30 + i * 68 / 9);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.areas[i]);
              gl.drawElements(i ? gl.TRIANGLE_STRIP : gl.TRIANGLE_FAN, i ? 722 : 362, gl.UNSIGNED_SHORT, 0);
            }
          }
          {
            const {program, attributes: {a_position}, uniforms: {u_col}} = programs.fixedColour;
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rings);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            for (let i = 0; i < 10; i++) {
              const gs = 0;
              gl.uniform4f(u_col, gs / 2, gs / 2, gs / 2, 1);
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.lines[i]);
              gl.drawElements(gl.LINE_LOOP, 360, gl.UNSIGNED_SHORT, 0);
            }
          }
        }
        this.$emit('cgv',{cgv:this.ringData[3]})
        gl.flush();
        console.log(`Rings render took ${performance.now()-rcalc}ms`);
        await new Promise(requestAnimationFrame);
        this.rendering = false;
        if (this.rerender){
          this.rerender = false;
          return this.render();
        }
      }
    },
  }
</script>

<template>
<div>
   <div class="square">
     <svg :viewBox="`-${AxisLimit} -${AxisLimit} ${AxisLimit*2} ${AxisLimit*2}`">
       <path :d="`M-${AxisLimit},-${AxisLimit}H${AxisLimit}V${AxisLimit}H-${AxisLimit}Z`" stroke="black" stroke-width="10" fill="none"/>
       <path :d="`M-${AxisEnd},0H${AxisEnd}`" stroke="#888" stroke-width="3" fill="none"/>
       <path :d="`M0,-${AxisEnd}V${AxisEnd}`" stroke="#888" stroke-width="3" fill="none"/>
       <line v-for="i of TickCount" :key=i :x1="i*TickStep-AxisLimit" :x2="i*TickStep-AxisLimit" :y1="-AxisLimit" :y2="-AxisLimit+20" stroke-width="3" stroke="black"/>
       <line v-for="i of TickCount" :key=i :x1="i*TickStep-AxisLimit" :x2="i*TickStep-AxisLimit" :y1="AxisLimit" :y2="AxisLimit-20" stroke-width="3" stroke="black"/>
       <line v-for="i of TickCount" :key=i :y1="i*TickStep-AxisLimit" :y2="i*TickStep-AxisLimit" :x1="AxisLimit" :x2="AxisLimit-20" stroke-width="3" stroke="black"/>
       <line v-for="i of TickCount" :key=i :y1="i*TickStep-AxisLimit" :y2="i*TickStep-AxisLimit" :x1="-AxisLimit" :x2="-AxisLimit+20" stroke-width="3" stroke="black"/>
       <text v-for="i of XLabelCount" :key=i :x="i*LabelStep-XLabelEnd" :y="AxisLimit-30" class="x-axis-labels">{{ i*LabelStep-XLabelEnd}}</text>
       <text v-for="i of XLabelCount" :key=i :x="i*LabelStep-XLabelEnd" :y="80-AxisLimit" class="x-axis-labels">{{ i*LabelStep-XLabelEnd}}</text>
       <text v-for="i of YLabelCount" :key=i :y="i*LabelStep-YLabelEnd+25" :x="30-AxisLimit" class="y-axis-labels">{{ YLabelEnd-i*LabelStep}}</text>
       <text v-for="i of YLabelCount" :key=i :y="i*LabelStep-YLabelEnd+25" :x="AxisLimit-30" class="y-axis-labels" text-anchor="end">{{ YLabelEnd-i*LabelStep}}</text>
       <text :x="-250" :y="AxisLimit-160" class="label">a</text>
       <text :x="-200" :y="AxisLimit-180" class="label-script">*</text>
       <text :x="-200" :y="AxisLimit-120" class="label-script">RSS</text>
       <text :x="100-AxisLimit" :y="100" class="label">b</text>
       <text :x="150-AxisLimit" :y="80" class="label-script">*</text>
       <text :x="150-AxisLimit" :y="140" class="label-script">RSS</text>
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