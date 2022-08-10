import { BindParams, QueryExecResult } from 'sql.js'

export type SQLData = {
  id: number,
  ready?: boolean,
  error?: string;
  results: QueryExecResult[]
  buffer?:Uint8Array
}

type Pool = {
  resolve:(value:MessageEvent<SQLData> | PromiseLike<MessageEvent<SQLData>>) => void,
  reject:(value:MessageEvent<SQLData> | PromiseLike<MessageEvent<SQLData>>) => void,
}[]
const worker = new Worker('./worker.sql-wasm.js')
worker.onerror = e => console.log('Worker error: ', e)
const workerPool: Pool = []
let workerId = 0

worker.onmessage = (event:MessageEvent<SQLData>) => {
  if (workerPool[event.data.id]) {
    if (event.data.error) {
      workerPool[event.data.id].reject(event)
    } else {
      workerPool[event.data.id].resolve(event)
    }
    delete workerPool[event.data.id]
  }
}

export function query (sql: string, params?:BindParams) {
  return new Promise< MessageEvent < SQLData >>((resolve, reject) => {
    worker.postMessage({
      id: ++workerId,
      action: 'exec',
      sql,
      params
    })
    workerPool[workerId] = { resolve, reject }
  })
}

export function save () {
  return new Promise< MessageEvent < SQLData >>((resolve, reject) => {
    worker.postMessage({
      id: ++workerId,
      action: 'export'
    })
    workerPool[workerId] = { resolve, reject }
  })
}

export function open (buffer:ArrayBuffer) {
  return new Promise< MessageEvent < SQLData >>((resolve, reject) => {
    worker.postMessage({
      id: ++workerId,
      action: 'open',
      buffer
    })
    workerPool[workerId] = { resolve, reject }
  })
}
