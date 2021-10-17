<template>
  <div class="main">
    <synthetic-gamut-editor v-model:definition=gamutDefinition />
    <gamut-rings :gamut=gamut />
  </div>
</template>

<style>
.main{
  display:flex;
  flex-direction: row;
  height:100vh;
}
.main>*{
  flex:1 1 0;
  border:black solid 1px;
}
</style>

<script>
import SyntheticGamutEditor from "./components/SyntheticGamutEditor.vue";
import GamutRings from "./components/GamutRings.vue";
import {makeSynthetic} from './gamut';
import {ref, watchEffect} from 'vue';
export default {
  name: 'App',
  components: {
    SyntheticGamutEditor,
    GamutRings,
  },
  setup(){
    const gamutDefinition = ref({
      RGBxy:[
        [.64, .33],
        [.3, .6],
        [.15, .06],
      ],
      white: [.3127, .3290]
    });
    const gamut = ref(null);
    watchEffect(()=>{
      gamut.value = makeSynthetic(gamutDefinition.value);
    })
    return {
      gamut,
      gamutDefinition
    }
  },
}
</script>
