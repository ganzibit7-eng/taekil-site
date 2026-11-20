'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {dateComparison,conversationGuide}=require('./report-decision-core');
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
