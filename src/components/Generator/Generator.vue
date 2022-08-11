<template>
  <div class="generator">
    <select ref="type" name="type" :disabled="getSelection == 'count'">
      <option v-if="getSelection == 'count'" selected="true" value=""></option>
      <option value="AVG">average</option>
      <option value="MIN">min</option>
      <option value="MAX">max</option>
      <option value="SUM">sum of</option>
    </select>
    <select ref="get" name="get" @change="getChange">
      <option v-for="(value, key) in dataGet" :key="key" :value="key">
        {{ value.label }}
      </option>
    </select>
    per
    <select ref="per" name="per">
      <option v-for="column in columns" :key="column" :value="column">
        {{ column }}
      </option>
    </select>
    <button @click="addFilter">Add Filter</button>
    <button v-if="filters.length > 0" @click="filters.pop()">Delete Filter</button>
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

@Options({
  components: { Filter },
  props: {
    modelValue: String
  },
  emits: ['update:modelValue', 'submit']
})
export default class Generator extends Vue {
  declare $refs: {
    type: HTMLSelectElement;
    get: HTMLSelectElement;
    per: HTMLSelectElement;
  };

  readonly dataGet: {
    [key: string]: {
      label: string;
      values: string[];
      sql: string;
      subquery?: string;
      join?: string;
    };
  } = {
    count: {
      label: 'number of entries',
      values: ['player', 'weapon', 'map', 'game_mode', 'cause_of_death'],
      sql: 'COUNT(*)'
    },
    kills: {
      label: 'kills',
      values: ['player', 'weapon'],
      sql: 'kills',
      subquery:
        "killsPer$label as ( SELECT COUNT(*) as 'kills', attacker_$suffix from data GROUP BY attacker_$suffix ORDER BY `kills` DESC)",
      join: 'LEFT JOIN killsPer$label ON killsPer$label.attacker_$suffix == data.attacker_$suffix'
    },
    deaths: {
      label: 'deaths',
      values: ['player', 'weapon'],
      sql: 'deaths',
      subquery:
        "deathsPer$label as ( SELECT COUNT(*) as 'deaths', victim_$suffix from data GROUP BY victim_$suffix ORDER BY `deaths` DESC)",
      join: 'LEFT JOIN deathsPer$label ON deathsPer$label.victim_$suffix == data.attacker_$suffix'
    },
    KD: {
      label: 'K/D',
      values: ['player', 'weapon'],
      sql: 'KD',
      subquery: `killsPer$label as ( SELECT COUNT(*) as 'kills', attacker_$suffix from data GROUP BY attacker_$suffix ORDER BY \`kills\` DESC),
  deathsPer$label as ( SELECT COUNT(*) as 'deaths', victim_$suffix from data GROUP BY victim_$suffix ORDER BY \`deaths\` DESC),
  KDPer$label as (SELECT CAST(killsPer$label.kills AS REAL)/deathsPer$label.deaths as 'KD', killsPer$label.attacker_$suffix FROM killsPer$label INNER JOIN deathsPer$label ON killsPer$label.attacker_$suffix == deathsPer$label.victim_$suffix GROUP BY killsPer$label.attacker_$suffix ORDER BY \`KD\` DESC)`,
      join: 'LEFT JOIN KDPer$label ON KDPer$label.attacker_$suffix == data.attacker_$suffix'
    },
    distance: {
      label: 'distance',
      values: ['player', 'weapon', 'map', 'game_mode', 'cause_of_death'],
      sql: 'distance'
    },
    player_count: {
      label: 'player count',
      values: ['player', 'weapon', 'map', 'game_mode', 'cause_of_death'],
      sql: 'player_count'
    }
  };

  readonly dataPer: {
    [key: string]: { label: string; sql: string; suffix?: string };
  } = {
    player: { suffix: 'name', label: 'Player', sql: 'attacker_name' },
    weapon: {
      suffix: 'current_weapon',
      label: 'Weapon',
      sql: 'cause_of_death'
    },
    map: { sql: 'map', label: 'map' },
    game_mode: { sql: 'game_mode', label: 'gamemode' },
    cause_of_death: { sql: 'cause_of_death', label: 'cause of death' }
  };

  getSelection = 'count';
  columns = this.dataGet.count.values;
  modelValue?: string;
  filters: string[] = [];
  filterCounter = 0;
  render () {
    return h(Generator, {
      modelValue: this.modelValue,
      'onUpdate:modelValue': (value: string) =>
        this.$emit('update:modelValue', value)
    })
  }

  getChange (event: Event) {
    const target = event.target as HTMLSelectElement
    const value = this.dataGet[target.value as keyof Generator['dataGet']]
    this.columns = value.values
    this.getSelection = target.value
  }

  addFilter () {
    this.filters.push('')
  }

  submit () {
    this.generate()
  }

  generate () {
    const type = this.$refs.type.value
    const get =
      this.dataGet[this.getSelection as keyof Generator['dataGet']].sql
    const per =
      this.dataPer[this.$refs.per.value as keyof Generator['dataPer']].sql
    if (!get || !per) return
    let query = get
    if (type) {
      query = `${type}(${query})`
    }

    const { where, having } = this.generateFilters()
    const { prefix, joins } = this.generateSubQueries()
    this.$emit(
      'update:modelValue',
      `${prefix}SELECT ${query} as '${this.getSelection}', data.${per}
  FROM data ${joins} ${where}
  GROUP BY data.${per} ${having}
  ORDER BY \`${this.getSelection}\` DESC
  LIMIT 400;`
    )
    this.$emit('submit')
  }

  generateSubQueries () {
    let prefix = ''
    let joins = ''
    const value = this.dataGet[this.getSelection as keyof Generator['dataGet']]
    const per =
      this.dataPer[this.$refs.per.value as keyof Generator['dataPer']]
    if (value.join) {
      joins = '\n' + value.join?.replaceAll('$label', per.label)
      if (per.suffix) {
        joins = joins.replaceAll('$suffix', per.suffix)
      }
    }
    if (value.subquery) {
      prefix =
        'WITH\n  ' + value.subquery.replaceAll('$label', per.label) + '\n\n'
      if (per.suffix) {
        prefix = prefix.replaceAll('$suffix', per.suffix)
      }
    }
    return { prefix, joins }
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
}
</script>

<style scoped>
</style>
