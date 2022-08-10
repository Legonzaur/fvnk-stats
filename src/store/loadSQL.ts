import { open } from './worker'

export default function loadCSV () {
  return new Promise<void>((resolve, reject) => {
    fetch('./data.db').then(async response => {
      open(await response.arrayBuffer())
      resolve()
    })
  })
}
