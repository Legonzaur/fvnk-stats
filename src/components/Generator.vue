import { generate } from '@vue/compiler-core'
<template>
  <div class="generator">
    <select ref="type" name="type" :disabled="firstSelection == 'COUNT(*)'">

      <option v-if="firstSelection == 'COUNT(*)'" value=""></option>
      <option v-if="firstSelection != 'COUNT(*)'" value="AVG">average</option>
      <option v-if="firstSelection != 'COUNT(*)'" value="MIN">min</option>
      <option v-if="firstSelection != 'COUNT(*)'" value="MAX">max</option>
      <option v-if="firstSelection != 'COUNT(*)'" value="SUM">sum of</option>

    </select>
    <select v-model="firstSelection" ref="first" name="first">
      <option value="COUNT(*)">number of entries</option>
      <option v-for="column in numericColumns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    per
    <select ref="second" name="second">
      <option v-for="column in columns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    <button @click="submit">Generate and Execute SQL</button>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import { h } from 'vue'

import query from '@/store/SQL'

@Options({
  props: {
    modelValue: String,
    queryManager: Boolean
  },
  emits: ['update:modelValue', 'submit'],
  watch: {
    '$route.query' ({ type, first, second }) {
      if (type) this.$refs.type.value = type
      if (first) this.firstSelection = first
      if (second) this.$refs.second.value = second
      this.generate()
    }
  }
})
export default class Generator extends Vue {
  declare $refs: {
    type: HTMLSelectElement;
    first: HTMLSelectElement;
    second: HTMLSelectElement;
  };

  firstSelection='COUNT(*)';

  columns?: string[] = [];
  numericColumns?: string[] = [];
  modelValue?: string;
  queryManager?:boolean;
  render () {
    return h(Generator, {
      modelValue: this.modelValue,
      'onUpdate:modelValue': (value: string) =>
        this.$emit('update:modelValue', value)
    })
  }

  created () {
    query(
      "SELECT * from pragma_table_info(\"data\") WHERE type == 'INTEGER' OR type == 'REAL';"
    ).then(({ data }) => {
      this.numericColumns = data.results[0].values.map((e) => e[1]) as string[]
    })
    query('SELECT * from pragma_table_info("data");').then(({ data }) => {
      this.columns = data.results[0].values.map((e) => e[1]) as string[]
    })
  }

  mounted () {
    const { type, first, second } = this.$route.query
    this.firstSelection = first as string
    this.$refs.type.value = type as string
    this.$refs.second.value = second as string
  }

  submit () {
    if (this.queryManager) {
      const query = Object.assign({}, this.$route.query)
      query.type = this.$refs.type.value
      query.first = this.firstSelection
      query.second = this.$refs.second.value
      this.$router.push({ query })
    }
    this.generate()
  }

  generate () {
    const type = this.$refs.type.value
    const first = this.firstSelection
    const second = this.$refs.second.value
    if (!first || !second) return

    const firstText = this.$refs.first.selectedOptions[0].text
    let query = first
    if (type) {
      query = `${type}(${query})`
    }
    this.$emit(
      'update:modelValue',
      `SELECT ${query} as '${firstText}', ${second} 
  FROM data 
  GROUP BY ${second} 
  ORDER BY \`${firstText}\` 
    DESC LIMIT 400;`
    )
    this.$emit('submit')
  }
}
</script>

<style scoped>
</style>
