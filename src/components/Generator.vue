<template>
  <div class="generator">
    <select ref="type" name="type">
      <option value=""></option>
      <option value="MIN">min</option>
      <option value="MAX">max</option>
      <option value="SUM">sum of</option>
      <option value="AVG">average</option>
    </select>
    <select ref="first" name="first">
      <option value="COUNT(*)">number of kills</option>
      <option v-for="column in columns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    per
    <select ref="second" name="second">
      <option v-for="column in columns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    <button @click="generate">Submit</button>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import { h } from 'vue'

import query from '@/store/SQL'

@Options({
  props: {
    modelValue: String
  },
  emits: ['update:modelValue', 'submit']
})
export default class Generator extends Vue {
  declare $refs: {
    type: HTMLSelectElement;
    first: HTMLSelectElement;
    second: HTMLSelectElement;
  };

  modelValue?:string;

  render () {
    return h(Generator, {
      modelValue: this.modelValue,
      'onUpdate:modelValue': (value:string) => this.$emit('update:modelValue', value)
    })
  }

  columns?: string[] = [];
  created () {
    query('SELECT * FROM data LIMIT 1;').then(({ data }) => {
      this.columns = data.results[0].columns
    })
  }

  generate () {
    const type = this.$refs.type.value
    const first = this.$refs.first.value
    const firstText = this.$refs.first.selectedOptions[0].text
    const second = this.$refs.second.value
    this.$emit('update:modelValue', `SELECT ${first} as '${firstText}', ${second} FROM data GROUP BY ${second} ORDER BY \`${firstText}\` DESC LIMIT 200;`)
    this.$emit('submit')
  }
}
</script>

<style scoped>
</style>
