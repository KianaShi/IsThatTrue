import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function extract(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}

test('actual endCase handles timeout once, retains discarded evidence, closes overlays',()=>{
 const calls=[];const elements=new Map();const caseData={};
 const context={playing:true,audio:{solve(){calls.push('solve');},fail(){calls.push('fail');}},
 document:{querySelector(key){if(!elements.has(key))elements.set(key,{classList:{toggle(){}},setAttribute(){},focus(){},hidden:false});return elements.get(key);}},
 menu:{slot(k,v){calls.push(v);},show(s){calls.push(s);}},
 tiles:new Map([[1,{id:'A1',held:true}]]),discardedTiles:new Map([[2,{id:'B1',discarded:true}]]),
 QUESTIONS:[],accuseAnswers:{},STORIES:{s1:caseData},story:()=>caseData,elapsed:300,LEVEL:{time:300},timerOn:()=>true,
 renderCaseReport(_host,run){calls.push(run);},fmt:String,dugCount:1,needed:32,
 hud:{hide(){calls.push('hide');},hideTile(){calls.push('hideTile');}},board:{clearMarks(){}},evidencePieces:{reset(){}},stage:{setAttract(){}},
 };
 vm.createContext(context);vm.runInContext(extract('function endCase(', '// ── pointer'),context);
 context.endCase(false,'timeout');context.endCase(false,'timeout');
 const reports=calls.filter(x=>typeof x==='object');assert.equal(reports.length,1);assert.equal(reports[0].timedOut,true);assert.equal(reports[0].records.length,2);
 assert.equal(context.playing,false);assert(calls.includes('Time ran out · case review'));assert.equal(calls.filter(x=>x==='result').length,1);
 assert.equal(elements.get('[data-slot="accusescreen"]').hidden,true);
});
test('actual star toggle enforces cap, allows unstar, and ignores finished runs',()=>{
 const records=Array.from({length:6},(_,id)=>[id,{starred:id<5}]);let warning='';
 const context={playing:true,tiles:new Map(records),MAX_STARS:5,hud:{toast(msg){warning=msg;}},audio:{confirm(){}},renderStars(){}};
 vm.createContext(context);vm.runInContext(extract('function toggleStar(', '\n/**'),context);
 assert.equal(context.toggleStar(5),false);assert(warning.includes('5'));
 assert.equal(context.toggleStar(0),true);assert.equal(context.toggleStar(5),true);
 context.playing=false;assert.equal(context.toggleStar(1),false);
});
