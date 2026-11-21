'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {create,audit,periodLabels}=require('./topic-monthly-reading');
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
      const row=rows[i], {main,supporting,other}=card.evidence;
      const evidence=[main,...supporting.flat(),...other];
      const source=new Set([...row.links,...row.groups,...row.annualLinks,...row.cycles.flatMap(cycle=>cycle.links)]);
      assert(supporting.length<=2);
      assert.equal(new Set(evidence).size,evidence.length);
      for(const fact of evidence){
        assert(source.has(fact)||fact===row.pair+' 세운·월운'&&row.pair===row.annual||fact.startsWith('십성 참고 · '),fact);
      }
      assert.match(card.contrast,new RegExp((i>0?i:2)+'월'));
      assert.doesNotMatch(card.reading,/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]|^(원국|월운|대운|세운)/u);
    }
  }
  for(const i of rows.keys())assert.equal(new Set(byTopic.map(cards=>cards[i].reading)).size,3);
  assert.equal(byTopic[0][4].evidence.main,'일지 寅·월운지 巳 형');
  assert.equal(byTopic[0][5].evidence.main,'월지 子·월운지 午 충');
  assert.equal(byTopic[0][10].evidence.main,'일지 寅·월운지 亥 육합');
  assert.deepEqual(byTopic[1][7].evidence.supporting[0],['일지 寅·월운지 申 형']);
  assert.match(byTopic[0][7].contrast,/7월.*기대 차이.*만남의 빈도나 거리가 달라지는지/);
  assert.match(byTopic[2][7].lead,/새 역할.*업무 방식/);
  assert.doesNotMatch(byTopic[2][7].lead,/가까운 사이/);
  for(const [i,terms] of [[2,/정관.*정인/],[3,/편인.*식신/],[8,/상관.*정재/],[10,/정재.*편관/]])assert.match(byTopic[2][i].lead,terms);
  assert.equal(byTopic[2][10].evidence.main,'월간 丙·월운간 辛 천간합');
  assert(byTopic[2][10].evidence.supporting.flat().includes('연지 巳·월운지 亥 충'));
});

test('unconfirmed birth hour and a missing cycle do not add inferred facts',()=>{
  const {hour,...natal}=pillars;
  const rows=createRows(natal).map(row=>({...row,cycles:[]}));
  for(const topic of topics){
    const cards=create(rows,natal,topic);
    for(const {evidence} of cards)assert(![evidence.main,...evidence.supporting.flat(),...evidence.other].some(line=>/시지 |시간 |대운/.test(line)));
  }
  assert.deepEqual(create(rows,{},'seohwa'),[]);
});

test('calendar and full solar ranges use the same exact KST instants with different end dates',()=>{
  const dates=periodLabels({from:'2027-08-08 02:26:46 KST',until:'2027-09-01 00:00:00 KST',
    solarFrom:'2027-08-08 02:26:46 KST',solarUntil:'2027-09-08 05:28:28 KST'});
  assert.deepEqual(dates,{solar:'8월 8일부터 9월 8일 절입 전까지',calendar:'8월 8일부터 8월 31일까지'});
  const december=periodLabels({from:'2027-12-07 17:37:41 KST',until:'2028-01-01 00:00:00 KST',
    solarFrom:'2027-12-07 17:37:41 KST',solarUntil:'2028-01-06 04:54:39 KST'});
  assert.equal(december.calendar,'12월 7일부터 12월 31일까지');
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
