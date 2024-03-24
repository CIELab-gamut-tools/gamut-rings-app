<script>
  import FPInput from "./FPInput.vue";
  import {WHITES, REFS as PRESETS} from '../gamut/refs'

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
        preset:'srgb',
        updating:false,
        white:'D65',
        ref:'none',
        doIntersect:false
      }
    },
    watch:{
      preset(v){
        if (v==='custom') return;
        this.updating=true;
        this.definition.RGBxy = PRESETS[v].RGBxy.map(a=>a.slice());
        this.white = PRESETS[v].white;
        this.definition.whiteBoost = 0;
        setTimeout(()=>this.updating=false,1);
      },
      white(v){
        if (v==='custom') return;  
        this.updating=true;
        this.definition.white = WHITES[v].slice();
        setTimeout(()=>this.updating=false,1);      
      },
      definition:{
        handler(){
          if (!this.updating) this.preset = this.white ='custom'
        },
        deep:true
      },
      ref(){
        this.updateRef()
      },
      doIntersect(){
        this.updateRef()
      }
    },
    methods:{
      updateRef(){
        this.definition.REF = this.doIntersect && this.ref!=='none' ? this.ref: null
      }
    }
  }
</script>

<template>
  <table ref=root>
    <tr>
      <th>Colour</th>
      <th>CIE1931 x</th>
      <th>CIE1931 y</th>
    </tr>
    <tr v-for="(xy,i) of definition.RGBxy" :key="i" >
      <td>{{['red','green','blue'][i]}}</td>
      <td><f-p-input type="number" :max="1" :min="0" :step="0.01" :places="4" v-model=xy[0] /> </td>
      <td><f-p-input type="number" :max="1" :min="0" :step="0.01" :places="4" v-model=xy[1] /></td>
    </tr>
    <tr>
      <td>white</td>
      <td><f-p-input type="number" :max="1" :min="0" :step="0.01" :places="4" v-model=definition.white[0] /></td>
      <td><f-p-input type="number" :max="1" :min="0" :step="0.01" :places="4" v-model=definition.white[1] /></td>
    </tr>
    <tr>
      <th>preset</th>
      <th>white preset</th>
      <th>white boost</th>
    </tr>
    <tr>
      <td>
        <select v-model="preset">
          <option value="custom">custom</option>
          <option value="srgb">sRGB</option>
          <option value="dci-p3">DCI-P3</option>
          <option value="bt.2020">BT.2020</option>
        </select>        
      </td>
      <td>
        <select v-model="white">
          <option value="custom">custom</option>
          <option value="D50">D50</option>
          <option value="D55">D55</option>
          <option value="D60">D60</option>
          <option value="D65">D65</option>
          <option value="D75">D75</option>
          <option value="D93">D93</option>
          <option value="DCI">DCI (~6300K)</option>          
        </select>        
      </td>
      <td>
        <f-p-input type="number" :max="2" :min="0" :step="0.1" :places="1" v-model=definition.whiteBoost />
      </td>
    </tr>
    <tr>
      <th>Reference</th>
      <td><select v-model="ref">
        <option value="none">None</option>
        <option value="srgb">sRGB</option>
        <option value="dci-p3">DCI-P3</option>
        <option value="bt.2020">BT.2020</option>
      </select></td>
      <td>Intersect<input type="checkbox" v-model="doIntersect"></td>
    </tr>
  </table>
</template>

<style scoped>
table{
  border:none;
  font-size:1.2vw;
}
td{
  padding:0 0.5vw;
  line-height: 1;
}
td input{
  width:6.6vw;
  margin:auto;
  background:transparent;
  border:none;
}
td select{
  width:6.6vw;
  margin:auto;
  background:transparent;
  border:none;
}
</style>