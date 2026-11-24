import test from 'node:test';
import assert from 'node:assert/strict';
import {localJudge} from '../lib/dictionary.ts';
import {DURATION,onTime} from '../lib/game.ts';
import {createStore} from '../lib/storage.ts';

test('kanji, kana and half-width kana resolve to one concept',()=>{
  for(const word of ['いぬ','イヌ','ｲﾇ']) assert.equal(localJudge(word).conceptId,localJudge('犬').conceptId);
});
test('Animals accepts conventional fine-grained names and excludes descriptions and objects',()=>{
  const names=['犬','柴犬','秋田犬','ハシビロコウ'].map(localJudge);
  assert.ok(names.every(word=>word.valid));
  assert.equal(new Set(names.map(word=>word.conceptId)).size,4);
  assert.equal(localJudge('大きい犬').valid,false);
  assert.equal(localJudge('車').valid,false);
  assert.equal(localJudge('ホッキョクギツネ').valid,null);
});
test('alternate spelling scores once per round, while a breed scores separately',()=>{
  const db=createStore(':memory:');
  const r=db.start('Learner',100);
  assert.equal(db.award(r.id,localJudge('犬')),true);
  assert.equal(db.award(r.id,localJudge('イヌ')),false);
  assert.equal(db.award(r.id,localJudge('柴犬')),true);
  assert.equal(db.round(r.id)?.words.length,2);
});
test('deadline is exclusive and eligibility depends on arrival time',()=>{
  const start=100;
  assert.equal(onTime(start,99),false);
  assert.equal(onTime(start,100),true);
  assert.equal(onTime(start,start+DURATION-1),true);
  assert.equal(onTime(start,start+DURATION),false);
  assert.equal(onTime(start,start+DURATION+1),false);
});
test('cached rejections are stable and rate windows expire',()=>{
  const db=createStore(':memory:');
  db.remember('test',localJudge('車'));
  assert.equal(db.remember('test',localJudge('犬')).valid,false);
  assert.equal(db.allow('ip',0,1),true);
  assert.equal(db.allow('ip',1,1),false);
  assert.equal(db.allow('ip',60_000,1),true);
});
test('giving up freezes the cutoff, preserves scores and lets earlier submissions finish',()=>{
  const db=createStore(':memory:');
  const r=db.start('Learner',100);
  db.award(r.id,localJudge('犬'));
  assert.equal(db.giveUp(r.id,300)?.words.length,1);
  assert.equal(db.giveUp(r.id,500)?.gaveUpAt,300);
  const cutoff=db.round(r.id)!.gaveUpAt;
  assert.equal(onTime(r.start,300,cutoff),false);
  assert.equal(onTime(r.start,299,cutoff),true);
  db.award(r.id,localJudge('柴犬'));
  assert.equal(db.round(r.id)?.words.length,2);
  const replay=db.start('Fluent',600);
  assert.equal(replay.gaveUpAt,null);
  assert.equal(db.giveUp(replay.id,600+DURATION)?.gaveUpAt,null);
});
