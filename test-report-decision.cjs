'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {dateComparison,dateReading,conversationGuide}=require('./report-decision-core');
const dateExample=require('./content/date-report-example.json');
const relationship=require('./content/relationship-report-example.json');

test('the 93 to 80 comparison names only the actual differing factor',()=>{
  const result=dateComparison(dateExample.candidates);
  assert.equal(result.difference,13);
  assert.deepEqual(result.factors,[{label:'손없는 날 가점',firstWeight:0.8,secondWeight:0}]);
  assert.equal(result.baseDifference,0.8);
});

test('shared top ranks and differences caused only by score adjustments remain distinct',()=>{
  const [first,second,third]=dateExample.candidates;
  assert.deepEqual(dateComparison([first,{...second,points:first.points},third]).tied,[first.day,second.day]);
  const sameFactors=dateComparison([first,{...first,day:second.day,points:first.points-2}]);
  assert.equal(sameFactors.difference,2);
  assert.deepEqual(sameFactors.factors,[]);
  const offset=dateComparison([first,{...second,eventWeight:first.eventWeight+0.8}]);
  assert.equal(offset.baseDifference,0);
  assert.equal(offset.factors.length,2);
});

test('the two applicable scenes cite their own stored evidence and each ends with a clear agreement',()=>{
  assert.equal(conversationGuide(relationship,0).basis.title,relationship.evidence[1].title);
  assert.equal(conversationGuide(relationship,1).basis.title,relationship.evidence[0].title);
  assert.equal(conversationGuide(relationship,2).basis,null);
  for(const i of [0,1,2]) {
    const guide=conversationGuide(relationship,i);
    assert(guide.useWhen.length>15&&guide.agree.length>15);
  }
});

test('older date reports support a different comparison partner without changing the ranking',()=>{
  const [first,second,third]=dateExample.candidates;
  const changed=dateComparison([first,third]);
  assert.equal(changed.second.day,third.day);
  assert.equal(changed.difference,first.points-third.points);
  const tied=dateComparison([first,{...second,points:first.points}]);
  assert.equal(tied.difference,0);
  assert.deepEqual(tied.factors,[{label:'손없는 날 가점',firstWeight:0.8,secondWeight:0}]);
});

test('candidate reading distinguishes differences between the two people and reasons for zero points',()=>{
  const mixed={people:[{label:'본인',relation:'상생',weight:2},{label:'상대방',relation:'상극',weight:-2}],
    eventWeight:0,folkWeight:0,lunarDay:12,element:'금'};
  const reading=dateReading('이사',mixed);
  assert.equal(reading.main,'두 사람의 결과가 엇갈리는 후보');
  assert.notEqual(reading.people[0].interpretation,reading.people[1].interpretation);
  assert.match(reading.eventNote,/가점이 없어요/);
  assert.match(reading.action,/이사 시간/);
  assert.match(dateReading('결혼식',dateExample.candidates[0]).folkNote,/손없는 날에 해당/);
});
