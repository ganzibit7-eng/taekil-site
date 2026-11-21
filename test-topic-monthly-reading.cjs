'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create,audit}=require('./topic-monthly-reading');
const interactions=require('./wealth-interactions');

const pillars={year:'己巳',month:'丙子',day:'丙寅',hour:'乙未'};
const topics=['seohwa','ijun','mujin'];
const scope=[
  ['辛丑','정재','상관'],['壬寅','편관','편인'],['癸卯','정관','정인'],['甲辰','편인','식신'],
  ['乙巳','정인','비견'],['丙午','비견','겁재'],['丁未','겁재','상관'],['戊申','식신','편재'],
  ['己酉','상관','정재'],['庚戌','편재','식신'],['辛亥','정재','편관'],['壬子','편관','정관']
];
const createRows=(natal)=>scope.map(([pair,top,hidden],i)=>{
  const annual=i===0?'丙午':'丁未', cycle='庚辰';
  return {month:i+1,pair,top,hidden,annual,links:interactions.toPeriod(natal,'월운',pair),
    groups:interactions.groups(natal,[pair]),annualLinks:interactions.between('세운',annual,'월운',pair),
    cycles:[{pair:cycle,links:interactions.between('대운',cycle,'월운',pair)}]};
});

test('the base chart has twelve distinct readings and no repeated interpretation or wrong particles',()=>{
  const rows=createRows(pillars);
  const byTopic=topics.map(topic=>create(rows,pillars,topic));
  for(const cards of byTopic){
    const result=audit(cards);
    assert.equal(cards.length,12);
    assert.equal(result.titles,12);
    assert.deepEqual(result.duplicateSentences,[]);
    assert.deepEqual(result.nearSentences,[]);
    assert.deepEqual(result.particles,[]);
    assert.equal(new Set(cards.map(card=>card.key)).size,12);
    for(const [i,card] of cards.entries()){
      const row=rows[i], evidence=[...card.evidence];
      const source=new Set([...row.links,...row.groups,...row.annualLinks,...row.cycles.flatMap(cycle=>cycle.links)]);
      assert(evidence[0].includes(row.pair)&&evidence[0].includes(row.top)&&evidence[0].includes(row.hidden));
      for(const fact of evidence.slice(1)){
        assert(source.has(fact)||fact===row.pair+' 세운·월운'&&row.pair===row.annual||fact.startsWith('관계 보조 근거 · '),fact);
      }
      assert.match(card.contrast,new RegExp((i>0?i:2)+'월'));
    }
  }
  for(const i of rows.keys())assert.equal(new Set(byTopic.map(cards=>cards[i].reading)).size,3);
  assert.match(byTopic[0][4].lead,/일지\(寅\).*해·형/);
  assert.match(byTopic[0][5].lead,/월지\(子\).*충 관계.*시지\(未\).*육합/);
  assert.match(byTopic[0][10].lead,/일지\(寅\).*육합·파/);
  assert.match(byTopic[1][7].lead,/일지\(寅\).*충·형.*연지\(巳\).*육합/);
  for(const [i,terms] of [[2,/정관.*정인/],[3,/편인.*식신/],[7,/식신.*편재/],[8,/상관.*정재/],[10,/정재.*편관/]])assert.match(byTopic[2][i].lead,terms);
  assert.match(byTopic[2][10].lead,/월간\(丙\).*천간합.*연지\(巳\).*충/);
});

test('unconfirmed birth hour and a missing cycle do not add inferred facts',()=>{
  const {hour,...natal}=pillars;
  const rows=createRows(natal).map(row=>({...row,cycles:[]}));
  for(const topic of topics){
    const cards=create(rows,natal,topic);
    for(const card of cards)assert(![...card.evidence].some(line=>/시지 |시간 |대운/.test(line)));
  }
  assert.deepEqual(create(rows,{},'seohwa'),[]);
});

test('copy audit detects cloned meaning, altered stem placeholders, and incorrect particles',()=>{
  const broken=[
    {title:'같은 제목',reading:'정재은 올해 원국에 등장한 丙과 만날 때 관계를 깊이 돌아보는 흐름으로 읽어요.'},
    {title:'같은 제목',reading:'편재은 올해 원국에 등장한 庚과 만날 때 관계를 깊이 돌아보는 흐름으로 읽어요.'}
  ];
  const results=audit(broken);
  assert.equal(results.repeatedTitles.length,1);
  assert.equal(results.nearSentences.length,1);
  assert.deepEqual(results.particles,[[1,'정재은'],[2,'편재은']]);
});
