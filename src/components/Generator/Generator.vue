<template>
  <div class="generator">
    <select ref="type" name="type" :disabled="getSelection == 'COUNT(*)'">
      <option v-if="getSelection == 'COUNT(*)'" value=""></option>
      <option v-if="getSelection != 'COUNT(*)'" value="AVG">average</option>
      <option v-if="getSelection != 'COUNT(*)'" value="MIN">min</option>
      <option v-if="getSelection != 'COUNT(*)'" value="MAX">max</option>
      <option v-if="getSelection != 'COUNT(*)'" value="SUM">sum of</option>
    </select>
    <select v-model="getSelection" ref="get" name="get">
      <option value="COUNT(*)">number of entries</option>
      <option value="killsPerPlayer.kills">kills per player</option>
      <option value="deathsPerPlayer.deaths">deaths per player</option>
      <option value="KDPerPlayer.'K/D'">KD per player</option>
      <option value="killsPerWeapon.kills">kills per weapon</option>
      <option value="deathsPerWeapon.deaths">deaths per weapon</option>
      <option value="KDPerWeapon.'K/D'">KD per weapon</option>
      <option v-for="column in numericColumns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    per
    <select ref="per" name="per">
      <option v-for="column in columns" :key="column" :value="column">
        {{ column }}
      </option>killsPerPlayer
    </select>
    <button @click="addFilter">Add Filter</button>
    <Filter
      v-for="(filter, index) in filters"
      :key="index"
      :index="index"
      v-model="filters[index]"
    ></Filter>
    <button @click="submit">Generate and Execute SQL</button>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import { h } from 'vue'

import query from '@/store/SQL'
import Filter from './Filter.vue'

const killsPerPlayer = "killsPerPlayer as ( SELECT COUNT(*) as 'kills', attacker_name from data GROUP BY attacker_name ORDER BY `kills` DESC)"
const deathsPerPlayer = "deathsPerPlayer as ( SELECT COUNT(*) as 'deaths', victim_name from data GROUP BY victim_name ORDER BY `deaths` DESC)"
const KDPerPlayer = "KDPerPlayer as (SELECT CAST(killsPerPlayer.kills AS REAL)/deathsPerPlayer.deaths as 'K/D', killsPerPlayer.attacker_name FROM killsPerPlayer INNER JOIN deathsPerPlayer ON killsPerPlayer.attacker_name == deathsPerPlayer.victim_name GROUP BY killsPerPlayer.attacker_name ORDER BY `K/D` DESC)"

const killsPerWeapon = "killsPerWeapon as ( SELECT COUNT(*) as 'kills', attacker_current_weapon from data GROUP BY attacker_current_weapon ORDER BY `kills` DESC)"
const deathsPerWeapon = "deathsPerWeapon as ( SELECT COUNT(*) as 'deaths', victim_current_weapon from data GROUP BY victim_current_weapon ORDER BY `deaths` DESC)"
const KDPerWeapon = "KDPerWeapon as (SELECT CAST(killsPerWeapon.kills AS REAL)/deathsPerWeapon.deaths as 'K/D', killsPerWeapon.attacker_current_weapon FROM killsPerWeapon INNER JOIN deathsPerWeapon ON killsPerWeapon.attacker_current_weapon == deathsPerWeapon.victim_current_weapon GROUP BY killsPerWeapon.attacker_current_weapon ORDER BY `K/D` DESC)"

@Options({
  components: { Filter },
  props: {
    modelValue: String
  },
  emits: ['update:modelValue', 'submit'],
)
export default class Generator extends Vue {
  declare $refs: {
    type: HTMLSelectElement;
    get: HTMLSelectElement;
    per: HTMLSelectElement;
  };

  getSelection = 'COUNT(*)';
   getSelectionType = '';
  columns?: string[] = [];
  numericColumns?: string[] = [];
  modelValue?: string;
  filters: string[] = [];
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

  addFilter () {
    this.filters.push('')
  }

  submit () {
    this.generate()
  }

  generate () {
    const type = this.$refs.type.value
    const get = this.getSelection
    const per = this.$refs.per.value
    if (!get || !per) return
    const getText = this.$refs.get.selectedOptions[0].text
    let query = get
    if (type) {
      query = `${type}(${query})`
    }
    const { where, having } = this.generateFilters()
    const { prefix, joins } = this.generateSubQueries()
    this.$emit(
      'update:modelValue',
      `${prefix}SELECT ${query} as '${getText}', data.${per} 
  FROM data ${where} ${joins}
  GROUP BY data.${per} ${having}
  ORDER BY \`${getText}\` DESC 
  LIMIT 400;`
    )
    this.$emit('submit')
  }

  generateFilters () {
    const filters = this.filters.filter((e) => e)
    const alterFilters = []

    let filtersWHERE = ''
    let filtersHAVING = ''

    if (filters) {
      let countIndex = filters.findIndex((e) => e.startsWith('COUNT'))
      while (countIndex > -1) {
        alterFilters.push(filters.splice(countIndex, 1))
        countIndex = filters.findIndex((e) => e.startsWith('COUNT'))
      }
      if (filters.length > 0) {
        filtersWHERE = `
  WHERE ${filters.shift()}`
        for (const i in filters) {
          filtersWHERE += ' AND ' + filters[i]
        }
      }
      if (alterFilters.length > 0) {
        filtersHAVING = `
  HAVING ${alterFilters.shift()}`
        for (const i in alterFilters) {
          filtersHAVING += ' AND ' + alterFilters[i]
        }
      }
    }
    return { where: filtersWHERE, having: filtersHAVING }
  }

  generateSubQueries () {
    let prefix = ''
    let joins = ''
    if (this.getSelection.includes('killsPerPlayer')) {
      prefix = 'WITH\n  ' + killsPerPlayer + '\n\n'
      joins = `
  LEFT JOIN killsPerPlayer ON killsPerPlayer.attacker_name == data.attacker_name`
    }
    if (this.getSelection.includes('deathsPerPlayer')) {
      prefix = 'WITH\n  ' + deathsPerPlayer + '\n\n'
      joins = `
  LEFT JOIN deathsPerPlayer ON deathsPerPlayer.victim_name == data.attacker_name`
    }
    if (this.getSelection.includes('KDPerPlayer')) {
      prefix = 'WITH\n  ' + killsPerPlayer + ',\n' + deathsPerPlayer + ',\n' + KDPerPlayer + '\n\n'
      joins = `
  LEFT JOIN killsPerPlayer ON killsPerPlayer.attacker_name == data.attacker_name
  LEFT JOIN deathsPerPlayer ON deathsPerPlayer.victim_name == data.attacker_name
  LEFT JOIN KDPerPlayer ON KDPerPlayer.attacker_name == data.attacker_name`
    }

    if (this.getSelection.includes('killsPerWeapon')) {
      prefix = 'WITH\n  ' + killsPerWeapon + '\n\n'
      joins = `
  LEFT JOIN killsPerWeapon ON killsPerWeapon.attacker_current_weapon == data.attacker_current_weapon`
    }
    if (this.getSelection.includes('deathsPerWeapon')) {
      prefix = 'WITH\n  ' + deathsPerWeapon + '\n\n'
      joins = `
  LEFT JOIN deathsPerWeapon ON deathsPerWeapon.victim_current_weapon == data.attacker_current_weapon`
    }
    if (this.getSelection.includes('KDPerWeapon')) {
      prefix = 'WITH\n  ' + killsPerWeapon + ',\n' + deathsPerWeapon + ',\n' + KDPerWeapon + '\n\n'
      joins = `
  LEFT JOIN killsPerWeapon ON killsPerWeapon.attacker_current_weapon == data.attacker_current_weapon
  LEFT JOIN deathsPerWeapon ON deathsPerWeapon.victim_current_weapon == data.attacker_current_weapon
  LEFT JOIN KDPerWeapon ON KDPerWeapon.attacker_current_weapon == data.attacker_current_weapon`
    }

    return { prefix, joins }
  }
}
</script>

<style scoped>
</style>
