<template>
  <div class="queryTable">
    <table ref="headersArea" id="headersArea">
      <thead>
        <tr>
          <td v-for="col in columns" :key="col">
            {{ col }}
          </td>
        </tr>
      </thead>
    </table>
    <div
      id="scrollArea"
      ref="scrollArea"
      class="clusterize-scroll"
      @scroll="scroll"
    >
      <table>
        <tbody ref="contentArea" id="contentArea" class="clusterize-content">
          <tr class="clusterize-no-data">
            <td>Loading data…</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { nextTick } from 'vue'
import { Options, Vue } from 'vue-class-component'
import Clusterize from 'clusterize.js'

@Options({
  props: {
    columns: Array,
    values: Array
  },
  watch: {
    values (value: string[][]) {
      this.clusterize?.update(
        value.map((e: string[]) => {
          const row = e.join('</td><td>')
          row.slice(0, -5)
          return '<tr><td>' + row + '</tr>'
        })
      )
      nextTick(this.fitHeaders)
    }
  }
})
export default class QueryTable extends Vue {
  declare $refs: {
    headersArea: HTMLTableElement
    scrollArea : HTMLDivElement
    contentArea : HTMLElement
  }

  columns?: string[];
  values?: string[][];
  clusterize?: Clusterize;
  headerOffset = 0;
  mounted () {
    this.clusterize = new Clusterize({
      // rows: this.computed.DOMColumns(),
      scrollId: 'scrollArea',
      contentId: 'contentArea',
      callbacks: {
        clusterChanged: () => {
          this.fitHeaders()
        }
      }
    })
  }

  fitHeaders () {
    const $content = this.$refs.contentArea
    if (!$content) return
    const $headers = this.$refs.headersArea
    let prevWidth: number[] = []

    const $firstRow = $content.querySelector('tr:not(.clusterize-extra-row)')
    if (!$firstRow) return
    const columnsWidth: number[] = []
    Array.from($firstRow.children).forEach(function (c) {
      columnsWidth.push(c.clientWidth)
    })
    if (columnsWidth.toString() === prevWidth.toString()) return
    const trs = $headers.querySelector('tr')
    if (!trs) return
    this.headerOffset =
      $firstRow.children[0].getBoundingClientRect().left -
      $firstRow.getBoundingClientRect().left - 8
    this.scroll()
    Array.from(trs.children).forEach(function (v: Element, i: number) {
      v.setAttribute('style', `width: ${columnsWidth[i] - 2}px;`)
    })
    prevWidth = columnsWidth
  }

  scroll () {
    (this.$refs.headersArea).setAttribute(
      'style',
      `margin-left: ${
        (
          this.$refs.scrollArea
        ).children[0].getBoundingClientRect().left + this.headerOffset
      }px;`
    )
  }
}
</script>

<style>
/* Hide default counters */
.clusterize-content tr {
  list-style: none;
}

/* Increment counter for every row */
.clusterize-content tr {
  counter-increment: clusterize-counter;
}

/* Display counter and customize it's styling whatever you like */
.clusterize-content tr:before {
  content: counter(clusterize-counter);
}

.clusterize-scroll {
  max-height: 400px;
  overflow-y: auto;
}

.clusterize table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  margin-bottom: 0;
}

.clusterize-content td {
  list-style: none;
  min-width: 100px;
}
.queryTable {
  overflow: hidden;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  margin-bottom: 0;
}
#scrollArea table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 1;

}

#scrollArea td{
  border-left: 1px solid black;
}

#headersArea{
    border-collapse: collapse;
  border-spacing: 1;
}

#headersArea td {
  display: inline-block;
  overflow: hidden;
  min-width: 100px;
  border-left: 1px solid black;
}

#headersArea tr {
  overflow: hidden;
  white-space: nowrap;
}

table tr:nth-child(odd) {
  background: white;
}
table tr:nth-child(even) {
  background: gray;
}
</style>
