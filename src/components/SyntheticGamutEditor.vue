<script>
  import FPInput from "./FPInput.vue";
  const PRESET={
    srgb:{
      RGBxy:[
        [.64, .33],
        [.3, .6],
        [.15, .06],
      ],
      white: [.3127, .3290]
    },
    "dci-p3":{
      RGBxy:[
        [.68,.32],
        [.265,.69],
        [.15,.06]
      ],
      white: [.314,.351]
    },
    "bt.2020":{
      RGBxy:[
        [.708,.292],
        [.17,.797],
        [.131,.046]
      ],
      white: [.3127, .3290]
    }
  }
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
        updating:false
      }
    },
    watch:{
      preset(v){
        if (v==='custom') return;
        this.updating=true;
        this.definition.RGBxy = PRESET[v].RGBxy.map(a=>a.slice());
        this.definition.white = PRESET[v].white.slice();
        setTimeout(()=>this.updating=false,1);
      },
      definition:{
        handler(){
          if (!this.updating) this.preset='custom'
        },
        deep:true
      }
    }
  }
</script>

<template>
  <table>
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
      <td>preset</td>
      <td colspan="2">
        <select v-model="preset">
          <option value="custom">custom</option>
          <option value="srgb">sRGB</option>
          <option value="dci-p3">DCI-P3</option>
          <option value="bt.2020">BT.2020</option>
        </select>
      </td>
    </tr>
  </table>
</template>

<style scoped>
table{
  border:none;
}
td{
  padding:0 .5rem;
  line-height: 1;
}
td input{
  width:100px;
  margin:auto;
  background:transparent;
  border:none;
}
td select{
  width:200px;
  margin:auto;
  background:transparent;
  border:none;
}
</style>