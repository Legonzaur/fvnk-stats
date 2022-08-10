<template>
  <div ref="code"></div>
  <button @click="submit">Execute SQL</button>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { h } from 'vue'

import query from '@/store/SQL'

import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { sql, SQLite } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { indentWithTab } from '@codemirror/commands'

@Options({
  props: {
    modelValue: String
  },
  watch: {
    modelValue (value: string) {
      if (value === this.view.state.doc.toString()) return
      this.view.update([this.view.state.update({ changes: { from: 0, to: this.view.state.doc.length, insert: value } })])
    }
  },
  emits: ['update:modelValue', 'submit']
})

export default class CodeBlock extends Vue {
  view?:EditorView;
  modelValue?:string;

  async mounted () {
    const tables = (await query('SELECT * FROM data LIMIT 1')).data.results[0].columns
    this.view = new EditorView({
      doc: this.modelValue,
      extensions: [oneDark,
        keymap.of([indentWithTab]),
        basicSetup,
        sql({
          schema: { data: tables },
          dialect: SQLite,
          defaultTable: 'data',
          upperCaseKeywords: true
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return
          this.$emit('update:modelValue', update.state.doc.toString())
        })],
      parent: this.$refs.code as Element
    })
  }

  submit () {
    this.$emit('submit')
    this.$router.push({ query: {} })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
