'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {compare}=require('./topic-report-choices');
const natal={day:'丙寅',rows:[
  ['year','己巳','伤官',['丙:比肩','戊:食神','庚:偏财']],
  ['month','丙子','比肩',['癸:正官']],
  ['day','丙寅','比肩',['甲:偏印','丙:比肩','戊:食神']]
]};
const calendar=[
  {month:3,from:'2027-03-06',pair:'癸卯',top:'정관',hidden:'정인',links:[],assessment:{candidates:[]}},
  {month:8,from:'2027-08-08',pair:'戊申',top:'식신',hidden:'편재',links:['일지 寅·월운지 申 충'],assessment:{candidates:[
    {slot:'일지',bond:false,fact:'일지 寅·월운지 申 충'}
  ]}},
  {month:11,from:'2027-11-07',pair:'辛亥',top:'정재',hidden:'편관',links:['일지 寅·월운지 亥 육합','월간 丙·월운간 辛 천간합'],assessment:{candidates:[
    {slot:'일지',bond:true,fact:'일지 寅·월운지 亥 육합'},
    {slot:'월간',bond:true,fact:'월간 丙·월운간 辛 천간합'}
  ]}}
];
test('three comparisons expose only natal and month facts from the actual input',()=>{
 const labels=[
   ['현 직장 유지','같은 직무로 이직','직무 전환'],
   ['가볍게 안부 묻기','조금 더 기다리기','관계 정리하기'],
   ['새 인연 만나기','썸에서 마음 전하기','기존 관계 깊게 하기']
 ];
 for(const [i,topic] of ['mujin','ijun','seohwa'].entries()){
   const result=compare(topic,calendar,natal);
   assert.equal(result.year,'2027');
   assert.deepEqual(result.choices.map(option=>option.title),labels[i]);
   for(const option of result.choices){
     assert.doesNotMatch(option.natal?.fact||'',/시주|시지|시간/);
     assert.doesNotMatch(option.natal?.fact||'',/^일간 .*비견/);
     for(const timing of [option.good,option.caution].filter(Boolean)){
       const row=calendar.find(month=>month.month===timing.month);
       assert.equal(row,timing.row);
       assert(timing.facts.every(fact=>row.links.includes(fact)||[
         row.pair+' 월운 · 천간 '+row.top,
         row.pair+' 월운 · 지지 주기운 '+row.hidden
       ].includes(fact)));
     }
   }
 }
 assert.match(compare('ijun',calendar,natal).note,/연락을 원하지 않는다고 했다면/);
 assert.equal(compare('dogyeom',calendar,natal),null);
});

test('different verified placements change the recommendation and ties stay conditional',()=>{
 const keep=compare('mujin',calendar,natal);
 assert.equal(keep.first,'현 직장 유지');
 const second={day:'丙寅',rows:[
   ['month','戊申','食神',['庚:偏财','壬:七杀','戊:食神']],
   ['day','丙寅','比肩',['甲:偏印','丙:比肩','戊:食神']]
 ]};
 const move=compare('mujin',calendar,second);
 assert.equal(move.first,'같은 직무로 이직');
 assert.match(move.choices[1].natal.fact,/월간 戊.*식신/);
 const neutral=compare('mujin',calendar,{day:'丙子',rows:[['day','丙子','比肩',['癸:正官']]]});
 assert.equal(neutral.first,'현 직장 유지');
 const noSignals=compare('mujin',calendar,{day:'丙子',rows:[['day','丙子','丙',['癸:七杀']]]});
 assert.equal(noSignals.first,null);
 assert.equal(compare('mujin',calendar,{day:'丙子',rows:[]}),null);
});
