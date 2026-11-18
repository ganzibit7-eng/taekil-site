const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const stories=require('./consultation-additional-stories.js');
const personas=require('./consultation-personas.js');

test('all 33 additional topic choices have distinct films and posters without altering their first questions',()=>{
  const films=new Set(),posters=new Set();let count=0;
  for(const [topic,story] of Object.entries(stories)){
    const advisor=personas.forTopic(topic);
    for(const [index,choice] of story.feature.choices.entries()){
      assert.deepEqual(choice.slice(0,2),advisor.questions[index],topic);
      const scene=choice[2];assert.ok(scene?.description&&scene.caption,topic);
      assert.match(scene.media,/^[a-z]+(?:-[a-z]+)*$/);
      const source='assets/consultant-'+advisor.id+'-choice-'+scene.media;
      for(const [ext,seen] of [['.mp4',films],['.webp',posters]]){
        const buffer=readFileSync(path.join(__dirname,source+ext));
        assert.ok(buffer.length>1000,source+ext);
        const digest=createHash('sha256').update(buffer).digest('hex');
        assert.ok(!seen.has(digest),'Repeated question media: '+source+ext);seen.add(digest);
      }
      count++;
    }
  }
  assert.equal(count,33);assert.equal(films.size,33);assert.equal(posters.size,33);
});
