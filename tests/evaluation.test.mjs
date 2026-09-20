import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,scoreOutcome,scoreSelection,scoreReasoning,scoreTime} from '../src/game/evaluation.js';
import {QUESTIONS} from '../src/game/questions.js';
import {STORIES,buildDeck} from '../src/game/cases.js';
import {renderCaseReport} from '../src/ui/case-report.js';
const answers=Object.fromEntries(QUESTIONS.map(q=>[q.key,q.answer]));
const stars=new Set(['H1','A2','F2','G7','C2']);
const perfect=()=>buildDeck(STORIES.s1).map(t=>({...t,held:t.real,discarded:!t.real,placedTo:t.real?t.aboutSuspect:null,starred:stars.has(t.id)}));

test('perfect evidence and claim-specific stars earn 100',()=>{
 const r=evaluate({records:perfect(),questions:QUESTIONS,answers,elapsed:100,limit:300});
 assert.equal(r.overall,100);assert.equal(r.selection.correct,32);assert.equal(r.reasoning.supported,5);assert.equal(r.profile.title,'Sharp Investigator');
});
test('empty run and empty questions produce finite zero scores, never solved',()=>{
 const r=evaluate();assert.equal(r.overall,0);assert.equal(r.outcome.correct,false);
 assert.equal(evaluate({records:buildDeck(STORIES.s1),questions:QUESTIONS}).overall,0);
});
test('fabricated clues pinned to their subject do not earn selection credit',()=>{
 const fake=buildDeck(STORIES.s1).find(t=>t.real===false);
 assert.equal(scoreSelection([{...fake,placedTo:fake.aboutSuspect}]).correct,0);
 assert.equal(scoreSelection([{...fake,discarded:true}]).correct,1);
});
test('wrong placement, discarded genuine evidence, and unexamined clues are handled separately',()=>{
 const tile=buildDeck(STORIES.s1)[0];
 assert.equal(scoreSelection([{...tile,placedTo:'noah'}]).correct,0);
 assert.equal(scoreSelection([{...tile,discarded:true}]).correct,0);
 assert.equal(scoreSelection([tile]).chosen,0);
});
test('single correct choice does not earn half the board score',()=>{
 const records=buildDeck(STORIES.s1);records[0].held=true;
 const s=scoreSelection(records);assert.equal(s.correct,1);assert.equal(s.precision,1);assert(s.score<.07);
});
test('duplicate IDs cannot inflate totals and scores remain bounded',()=>{
 const records=perfect();const r=evaluate({records:[...records,...records],questions:QUESTIONS,answers});
 assert.equal(r.selection.clues.length,32);assert.equal(r.overall,100);
});
test('naming all suspects cannot turn one irrelevant star into coherent reasoning',()=>{
 const t=buildDeck(STORIES.s1).find(t=>t.id==='F1');
 assert.equal(scoreReasoning(QUESTIONS,answers,[{...t,starred:true}]).score,0);
});
test('fabricated, discarded, and wrongly assigned stars do not support a claim',()=>{
 for(const extra of [{real:false},{discarded:true},{placedTo:'ethan'}]){
  const t=buildDeck(STORIES.s1).find(t=>t.id==='H1');
  assert.equal(scoreReasoning(QUESTIONS,answers,[{...t,starred:true,...extra}]).supported,0);
 }
});
test('identity insight requires both alibi and credential/session evidence',()=>{
 const records=perfect().map(t=>({...t,starred:t.id==='F2'}));
 let r=scoreReasoning(QUESTIONS,answers,records);assert.equal(r.claims.find(q=>q.key==='insight').supported,false);
 records.find(t=>t.id==='G7').starred=true;
 r=scoreReasoning(QUESTIONS,answers,records);assert.equal(r.claims.find(q=>q.key==='insight').supported,true);
});
test('wrong answers cannot be supported just by starring a real culprit clue',()=>{
 const r=scoreReasoning(QUESTIONS,{...answers,leaker:'ethan'},perfect());
 assert.equal(r.claims.find(q=>q.key==='leaker').supported,false);
});
test('time does not reward rushing and handles untimed/invalid limits',()=>{
 assert.equal(scoreTime(10,null,false).label,'Untimed');assert.equal(scoreTime(10,0,false).label,'Untimed');
 assert.equal(scoreTime(301,300,true).label,'Out of time');
 assert.equal(scoreTime(20,300,false).label,'Quick');assert.equal(scoreTime(250,300,false).label,'Steady');
 assert.equal(scoreTime(290,300,false).label,'Just in time');
 assert.equal(evaluate({records:perfect(),questions:QUESTIONS,answers,elapsed:1,limit:300}).overall,evaluate({records:perfect(),questions:QUESTIONS,answers,elapsed:300,limit:300,timedOut:true}).overall);
});
test('new decks are independent and cannot retain played-state mutations',()=>{
 const first=buildDeck(STORIES.s1);first[0].held=true;first[0].starred=true;first[0].digLevels.push('test');
 const next=buildDeck(STORIES.s1);assert.equal(next[0].held,undefined);assert.equal(next[0].starred,undefined);assert.equal(next[0].digLevels.length,3);
});
test('full report renders the missing PR profile, four measures, and solution safely',()=>{
 const host={};renderCaseReport(host,{records:perfect(),questions:QUESTIONS,answers,solutionAvailable:true,elapsed:30,limit:300});
 for(const text of ['Sharp Investigator','Your conclusions, evidence choices','Outcome Accuracy','Evidence Selection','Reasoning Coherence','Time','11:54 PM','Review all 32']) assert(host.innerHTML.includes(text),text);
 const records=perfect();records[0].label='<img onerror="boom">';
 renderCaseReport(host,{records,questions:QUESTIONS,answers,solutionAvailable:true});assert(!host.innerHTML.includes('<img onerror'));assert(host.innerHTML.includes('&lt;img'));
});
test('unsupported story does not receive The Leak solution or a misleading score',()=>{
 const host={};renderCaseReport(host,{solutionAvailable:false});assert(!host.textContent.includes('Noah'));assert(host.textContent.includes('not available'));
});
