<template>
  <input type="number" :max="max" :min="min" :step="step" v-model="value">
</template>

<script>
export default {
name: "FPInput",
  props:{
    modelValue:{
      type:Number,
      required:true
    },
    places:{
      type:Number,
      required:true
    },
    min:{
      type:Number,
      default:0,
    },
    max:{
      type:Number,
      default:1,
    },
    step:{
      type:Number,
      default:0.01,
    }
  },
  computed:{
    value:{
      get(){
        return this.modelValue.toFixed(this.places);
      },
      set(v){
        this.$emit('update:modelValue',parseFloat(v));
      }
    }
  }
}
</script>

<style scoped>

</style>