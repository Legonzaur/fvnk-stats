import { generate } from '@vue/compiler-core'
<template>
  <div class="filter">
    Filter
    <select ref="type" name="type" :disabled="getSelection == 'COUNT(*)' || getSelectionType == 'TEXT'" @change="generate">
      <option value=""></option>
      <option v-if="getSelection != 'COUNT(*)' && getSelectionType != 'TEXT'" value="AVG">average</option>
      <option v-if="getSelection != 'COUNT(*)' && getSelectionType != 'TEXT'" value="MIN">min</option>
      <option v-if="getSelection != 'COUNT(*)' && getSelectionType != 'TEXT'" value="MAX">max</option>
      <option v-if="getSelection != 'COUNT(*)' && getSelectionType != 'TEXT'" value="SUM">sum of</option>
    </select>
    <select v-model="getSelection" ref="get" name="get">
      <option value="COUNT(*)">number of entries</option>
      <option v-for="(type, column) in columns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    <select ref="compare" name="compare" @change="generate">
      <option value="==">==</option>
      <option value=">">&gt;</option>
      <option value="<">&lt;</option>
    </select>
    <input ref="compareTarget" type="text" :list="'compareTarget'+index" @change="generate"/>
    <datalist :id="'compareTarget'+index">
      <option v-for="value in compareValues" :key="value" :value="value" />
    </datalist>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import { h } from 'vue'

import query from '@/store/SQL'

@Options({
  props: {
    index: Number
  },
  emits: ['update:modelValue', 'submit'],
  watch: {
    getSelection (value: string) {
      this.getSelectionType = this.columns[value]

      if (this.columns[value] !== 'TEXT') {
        this.compareValues = []
      } else {
        query(`SELECT ${value} FROM data GROUP BY ${value}`).then(({ data }) => {
          this.compareValues = data.results[0].values.map(e => e[0])
        })
      }
      this.generate()
    }
  }
})
export default class Filter extends Vue {
  declare $refs: {
    type: HTMLSelectElement;
    get: HTMLSelectElement;
    compare:HTMLSelectElement;
    compareTarget:HTMLInputElement;
  };

  index?:number
  columns?: { [key: string]: string } = {};
  numericColumns: string[] = [];
  getSelection = 'COUNT(*)';
  getSelectionType = '';
  queryManager?: boolean;
  compareValues:string[]=[]

  created () {
    query('SELECT * from pragma_table_info("data");').then(({ data }) => {
      this.columns = data.results[0].values.reduce((previous, _current) => {
        const current = _current as string[]
        previous[current[1]] = current[2] as string
        return previous
      }, {} as { [key: string]: string })
    })
  }

  generate () {
    const type = this.$refs.type.value
    const get = this.getSelection
    const compare = this.$refs.compare.value
    let target = this.$refs.compareTarget.value
    if (!get || !target || !compare) return
    let query = get
    if (type) {
      query = `${type}(${query})`
    }
    if (this.getSelectionType === 'TEXT') {
      target = "'" + target + "'"
    }
    this.$emit(
      'update:modelValue',
      `${query} ${compare} ${target}`
    )
  }
}
</script>

<style scoped>
</style>
