<template>
  <div class="loader">
    <input type="file" ref="file" accept=".db,.csv" style="display: none" v-on:change="load"/>
    <button @click="$refs.file.click()">open file dialog</button>
  </div>
</template>

<script lang="ts">
import { InputHTMLAttributes } from '@vue/runtime-dom'
import { Options, Vue } from 'vue-class-component'

import loadCSV from '@/store/loadCSV'
import loadSQL from '@/store/loadSQL'
import { loaded } from '@/store/SQL'

@Options({})
export default class FileLoader extends Vue {
  declare $refs: {
    file: HTMLInputElement;
  };

  created () {
    if (process.env.NODE_ENV === 'development') {
      fetch('/data.db').then(async (response) => {
        await loadSQL(new Uint8Array(await response.arrayBuffer()))
        loaded(true)
      })
    }
  }

  load (event:Event) {
    const reader = new FileReader()
    const target = event.target as HTMLInputElement
    if (!target || !target.files) return
    const name = target.files[0].name
    reader.onload = async function () {
      const arrayBuffer = this.result
      if (!arrayBuffer || typeof arrayBuffer === 'string') return
      const array = new Uint8Array(arrayBuffer)
      if (name.endsWith('csv')) {
        const binaryString = new TextDecoder().decode(array)
        await loadCSV(binaryString)
      } else {
        console.log(array)
        await loadSQL(array)
      }
      loaded(true)
    }
    reader.readAsArrayBuffer(target.files[0])
  }
}
</script>
