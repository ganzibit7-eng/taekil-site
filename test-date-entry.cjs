'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parse,gregorian}=require('./date-entry');

test('dates can be entered or pasted with or without separators',()=>{
 for(const value of ['19900101','1990-01-01','1990.1.1',' 1990/01/01 ']) {
  assert.deepEqual(parse(value),{year:1990,month:1,day:1,iso:'1990-01-01'});
 }
 for(const value of ['1990','199001','19901301','19900100','1990x01x01','1990-01-01 text','1899-01-01']) {
  assert.equal(parse(value),null);
 }
});

test('Gregorian inputs reject impossible dates while lunar inputs can reach the lunar calculator',()=>{
 assert.equal(gregorian(parse('20000229')),true);
 assert.equal(gregorian(parse('19000229')),false);
 assert.equal(gregorian(parse('20270431')),false);
 assert.equal(parse('19900230').iso,'1990-02-30');
});
