import { BindParams } from 'sql.js'
import loadCSV from './loadCSV'
import loadSQL from './loadSQL'
import { query, save } from './worker'

// const init = loadCSV()
// const init = loadSQL()
let loaded:(value: unknown) => void
const init = new Promise((resolve) => {
  loaded = resolve
})

export default async function safeQuery (sql:string, params?:BindParams) {
  await init
  return query(sql, params)
}

export { save, loaded }
