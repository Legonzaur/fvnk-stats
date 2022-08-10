import { query, SQLData } from './worker'

import { parse } from 'csv-parse/browser/esm'
import { BindParams } from 'sql.js'

const queue: Promise<MessageEvent<SQLData>>[] = []
const parser = parse({
  columns: true
})

export type Tables = { [key: string]: Array<string>; }

export default function loadCSV () {
  return new Promise<void>((resolve, reject) => {
    fetch('./eu_2.0.0_c.csv').then(async response => {
      await query(`CREATE TABLE "data" (
          servername TEXT,
          region TEXT,
          rebalanced TEXT,
          killstat_version TEXT,
          match_id TEXT,
          game_mode TEXT,
          map TEXT,
          unix_time INTEGER,
          game_time REAL,
          player_count INTEGER,
          attacker_name TEXT,
          attacker_id TEXT,
          attacker_current_weapon TEXT,
          attacker_current_weapon_mods INTEGER,
          attacker_weapon_1 TEXT,
          attacker_weapon_1_mods INTEGER,
          attacker_weapon_2 TEXT,
          attacker_weapon_2_mods INTEGER,
          attacker_weapon_3 TEXT,
          attacker_weapon_3_mods INTEGER,
          attacker_offhand_weapon_1 TEXT,
          attacker_offhand_weapon_2 TEXT,
          victim_name TEXT,
          victim_id TEXT,
          victim_current_weapon TEXT,
          victim_current_weapon_mods INTEGER,
          victim_weapon_1 TEXT,
          victim_weapon_1_mods INTEGER,
          victim_weapon_2 TEXT,
          victim_weapon_2_mods INTEGER,
          victim_weapon_3 TEXT,
          victim_weapon_3_mods INTEGER,
          victim_offhand_weapon_1 TEXT,
          victim_offhand_weapon_2 TEXT,
          cause_of_death TEXT,
          distance INTEGER
          );`)

      /* console.log((await query(`SELECT 'name', 'sql'
          FROM 'sqlite_master'
          WHERE type='table';`)).data) */

      const text = await response.text()

      parser.on('readable', () => {
        let record
        while ((record = parser.read()) !== null) {
          // records.push(record)
          queue.push(query(`INSERT INTO data VALUES (
              $servername,
              $region,
              $rebalanced,
              $killstat_version,
              $match_id,
              $game_mode,
              $map,
              $unix_time,
              $game_time,
              $player_count,
              $attacker_name,
              $attacker_id,
              $attacker_current_weapon,
              $attacker_current_weapon_mods,
              $attacker_weapon_1,
              $attacker_weapon_1_mods,
              $attacker_weapon_2,
              $attacker_weapon_2_mods,
              $attacker_weapon_3,
              $attacker_weapon_3_mods,
              $attacker_offhand_weapon_1,
              $attacker_offhand_weapon_2,
              $victim_name,
              $victim_id,
              $victim_current_weapon,
              $victim_current_weapon_mods,
              $victim_weapon_1,
              $victim_weapon_1_mods,
              $victim_weapon_2,
              $victim_weapon_2_mods,
              $victim_weapon_3,
              $victim_weapon_3_mods,
              $victim_offhand_weapon_1,
              $victim_offhand_weapon_2,
              $cause_of_death,
              $distance)`, (Object.fromEntries(Object.entries(record).map(([k, v]) => [`$${k}`, v]))) as BindParams))
        }
      })
      parser.on('error', function (err) {
        console.error(err.message)
        reject(err.message)
      })
      parser.on('end', async function () {
        resolve()
      })
      parser.write(text)
      parser.end()
    })
  })
}
