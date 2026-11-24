import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DURATION } from './game.ts';
import type { Judgment, Mode, Round, Word } from './game.ts';

export function createStore(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS rounds (id TEXT PRIMARY KEY, start INTEGER, mode TEXT);
    CREATE TABLE IF NOT EXISTS early_finishes (id TEXT PRIMARY KEY, gaveUpAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS judgments (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS words (round TEXT, concept TEXT, value TEXT, PRIMARY KEY(round, concept));
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, until INTEGER, count INTEGER);`);
  return {
    start(mode: Mode, start: number): Round {
      const id = crypto.randomUUID();
      db.prepare('INSERT INTO rounds VALUES(?,?,?)').run(id,start,mode);
      return {id,start,mode,gaveUpAt:null,words:[]};
    },
    giveUp(id: string, received: number) {
      db.prepare(`INSERT OR IGNORE INTO early_finishes
        SELECT id, ? FROM rounds WHERE id=? AND ? < start + ?`).run(received,id,received,DURATION);
      return this.round(id);
    },
    round(id: string): Round | null {
      const row = db.prepare('SELECT id,start,mode,gaveUpAt FROM rounds LEFT JOIN early_finishes USING(id) WHERE id=?').get(id);
      if (!row) return null;
      const words = db.prepare('SELECT value FROM words WHERE round=? ORDER BY rowid').all(id);
      return {id, start: Number(row.start), mode: row.mode as Mode, gaveUpAt: row.gaveUpAt as number | null, words: words.map(w => JSON.parse(String(w.value)))};
    },
    award(id: string, word: Word) {
      const {conceptId, canonical, reading, translation} = word;
      return !!db.prepare('INSERT OR IGNORE INTO words VALUES(?,?,?)').run(id,conceptId,JSON.stringify({conceptId,canonical,reading,translation})).changes;
    },
    judgment(key: string): Judgment | undefined {
      const row = db.prepare('SELECT value FROM judgments WHERE key=?').get(key);
      return row && JSON.parse(String(row.value));
    },
    remember(key: string, value: Judgment) {
      db.prepare('INSERT OR IGNORE INTO judgments VALUES(?,?)').run(key,JSON.stringify(value));
      return this.judgment(key)!;
    },
    allow(key: string, now: number, max: number) {
      db.prepare('DELETE FROM limits WHERE until<=?').run(now);
      const row = db.prepare('INSERT INTO limits VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').get(key,now+60_000);
      return Number(row!.count)<=max;
    }
  };
}
let store: ReturnType<typeof createStore> | undefined;
export function storage() {
  if (!store) {
    const directory = resolve('.data');
    mkdirSync(directory, {recursive:true});
    store = createStore(resolve(directory,'kotoba.sqlite'));
  }
  return store;
}
