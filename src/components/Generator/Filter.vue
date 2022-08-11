import { generate } from '@vue/compiler-core'
<template>
  <div class="generator">
    <select ref="type" name="type">
      <option  value=""></option>
      <option  value="AVG">average</option>
      <option  value="MIN">min</option>
      <option  value="MAX">max</option>
      <option  value="SUM">sum of</option>
    </select>
    <select ref="first" name="first">
      <option value="COUNT(*)">number of entries</option>
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
    <input type="text"/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import { h } from 'vue'

import query from '@/store/SQL'

@Options({
  props: {
  },
  emits: ['update:modelValue', 'submit'],
  watch: {
  }
})
export default class Filter extends Vue {
  declare $refs: {
    type: HTMLSelectElement;
    first: HTMLSelectElement;
    second: HTMLSelectElement;
  };

  columns?: string[] = [];
  numericColumns?: string[] = [];

  queryManager?:boolean;
  render () {
    return h(Filter, { })
  }

  created () {
    query(
      "SELECT * from pragma_table_info(\"data\") WHERE type == 'INTEGER' OR type == 'REAL';"
    ).then(({ data }) => {
      console.log(data.results[0].values)
      // this.numericColumns = data.results[0].values.map((e) => e[1]) as string[]
    })
    query('SELECT * from pragma_table_info("data");').then(({ data }) => {
      this.columns = data.results[0].values.map((e) => e[1]) as string[]
    })
  }
}
</script>

<style scoped>
</style>
