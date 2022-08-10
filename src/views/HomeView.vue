<template>
  <div class="home">
    <a ref="downloader" style="display: none"></a>
    <FileLoader></FileLoader><button @click="save">Save</button>
    <br>
    <br>
    <!-- Ugly BR, will do layout later -->
    <Generator
      v-model="sqlQuery"
      @submit="process"
      :queryManager="true"
    ></Generator>
    <CodeBlock v-model="sqlQuery" @submit="process" />
    <QueryChart :columns="columns" :values="values" />
    <QueryTable :columns="columns" :values="values"></QueryTable>

  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import CodeBlock from '@/components/CodeBlock.vue'
import QueryTable from '@/components/QueryTable.vue'
import QueryChart from '@/components/QueryChart.vue'
import Generator from '@/components/Generator.vue'
import FileLoader from '@/components/FileLoader.vue'
import query, { save } from '@/store/SQL'

Vue.registerHooks(['beforeRouteLeave'])

@Options({
  components: {
    CodeBlock,
    QueryTable,
    QueryChart,
    Generator,
    FileLoader
  }
})
export default class HomeView extends Vue {
  declare $refs: {
    downloader: HTMLAnchorElement;
  };

  sqlQuery = localStorage.getItem('sqlQuery') || 'SELECT COUNT(*) as \'number of entries\', attacker_name FROM data GROUP BY attacker_name ORDER BY `number of entries` DESC LIMIT 400;';
  columns = new Array<string>();
  values = new Array<Array<string>>();
  mounted () {
    this.sqlQuery = localStorage.getItem('sqlQuery') || this.sqlQuery
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('sqlQuery', this.sqlQuery)
    })
    this.process()
    // retrieve your information from your persistance layer
  }

  beforeRouteLeave () {
    localStorage.setItem('sqlQuery', this.sqlQuery)
    return true
  }

  process () {
    query(this.sqlQuery)
      .then(({ data }) => {
        const results = data.results[0]
        this.columns = results.columns
        this.values = results.values as string[][]
      })
      .catch(({ data }) => {
        console.log(data.error)
      })
  }

  save () {
    save().then((e) => {
      if (!e.data.buffer) return
      const blob = new Blob([e.data.buffer], { type: 'octet/stream' })
      const url = window.URL.createObjectURL(blob)
      const downloader = this.$refs.downloader
      downloader.href = url
      downloader.download = 'data.db'
      downloader.click()
      window.URL.revokeObjectURL(url)
    })
  }
}
</script>
