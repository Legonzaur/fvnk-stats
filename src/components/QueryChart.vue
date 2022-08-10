<template>
<div class="chart-container" style="position: relative; height:40vw; width:90vw">
    <canvas ref="chart"></canvas>
</div>
</template>

<script lang="ts">

import { Options, Vue } from 'vue-class-component'
import { Chart, registerables, ChartConfiguration, DefaultDataPoint, ChartData } from 'chart.js'
Chart.register(...registerables)

@Options({
  props: {
    columns: Array,
    values: Array
  },
  watch: {
    values () {
      this.draw()
    }
  }
})
export default class QueryChart extends Vue {
  declare $refs: {
    chart: HTMLCanvasElement
  }

  columns?: string[];
  values?: string[][];
  chart?:Chart
  mounted () {
    this.draw()
  }

  draw () {
    if (!this.values || !this.columns) return
    this.chart?.destroy()
    const data:ChartData<'bar', number[], unknown> = {
      labels: this.values?.map(e => e[1]),
      datasets: [{
        label: this.columns[0],
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: this.values?.map(e => Number(e[0])),
        maxBarThickness: 20
      }]
    }
    const config:ChartConfiguration<'bar', DefaultDataPoint<'bar'>, unknown> = {
      type: 'bar',
      data: data,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        indexAxis: 'y',
        maintainAspectRatio: false
      }
    }
    this.chart = new Chart(this.$refs.chart, config)
    const canvas = this.chart.canvas.parentNode as HTMLElement | null
    if (!canvas) return
    canvas.style.height = (60 + (20 * this.values.length)) + 'px'
    console.log(this.values.length)
  }
}
</script>

<style scoped>

</style>
