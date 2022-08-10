import { open } from './worker'

export default async function loadCSV (data:Uint8Array) {
  await open(data)
}
