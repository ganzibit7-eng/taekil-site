(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TaekilReportChoices=factory();
})(globalThis,function(){
  'use strict';
  const names={正财:'정재',偏财:'편재',食神:'식신',伤官:'상관',比肩:'비견',劫财:'겁재',正官:'정관',七杀:'편관',正印:'정인',偏印:'편인'};
  const places={year:'연',month:'월',day:'일',hour:'시'};
  const language={
    정재:'일정하게 이어갈 수 있는 기준',편재:'익숙한 범위 밖의 기회를 살피는 힘',
    식신:'편한 방식으로 표현하고 결과를 쌓는 힘',상관:'답답했던 방식을 바꾸어 보는 힘',
    비견:'내 속도와 판단 기준을 지키는 힘',정관:'약속과 책임을 분명히 하는 힘',
    정인:'이미 쌓인 경험과 신뢰를 다지는 힘',편인:'익숙한 경험을 다른 관점으로 보는 힘',
    편관:'결정과 책임을 서두르게 하는 압박',겁재:'주변의 말과 내 판단이 얽히기 쉬운 흐름'
  };
  const topics={
    mujin:{title:'일터를 고르는 세 가지 선택',slots:['월지','월간'],options:[
      {title:'현 직장 유지',terms:['정관','정인','정재'],watch:['편관','겁재'],mode:'steady',
        fit:'지금 일하는 곳에서 역할과 평가 기준을 선명하게 만들 수 있다면, 쌓아온 경험을 이어 쓰는 쪽에 힘이 실려요.',
        good:'맡아온 일 가운데 인정받고 싶은 성과와 앞으로 맡고 싶은 역할을 함께 꺼내 보기 좋아요.',
        caution:'역할이 커지는 제안을 받으면 평가 기준과 결정 권한을 함께 확인해요.'},
      {title:'같은 직무로 이직',terms:['식신','편재','정재'],watch:['편관','겁재'],mode:'join',
        fit:'업무 자체는 잘 맞고 환경을 바꾸고 싶을 때, 기존 실적을 다른 팀에서도 인정받을 여지를 살펴볼 만해요.',
        good:'해온 일을 증명할 결과물 한 가지를 정리하고, 같은 능력을 다른 팀에서는 어떻게 쓰는지 비교해 봐요.',
        caution:'익숙한 직무명 아래 새 책임이 숨어 있을 수 있어요. 기존과 달라지는 일의 범위를 물어봐요.'},
      {title:'직무 전환',terms:['편인','상관','비견'],watch:['편관','겁재'],mode:'shift',
        fit:'배워둔 것을 다른 문제에 적용할 때 의욕이 살아난다면, 작은 프로젝트로 새 역할을 먼저 시험해 볼 만해요.',
        good:'관심 있는 직무의 실제 과제 한 가지를 골라 지금 할 수 있는 일과 더 배울 일을 나눠봐요.',
        caution:'현재 일의 답답함이 크게 느껴질 때예요. 새 직무에서 반복할 일까지 감당할 수 있는지 살펴봐요.'}
    ]},
    ijun:{title:'지난 인연 앞에서 고를 세 가지',slots:['일지','일간'],note:'이 풀이는 내 사주에서 읽은 흐름이에요. 상대가 연락을 원하지 않는다고 했다면 그 의사를 존중해 주세요.',options:[
      {title:'가볍게 안부 묻기',terms:['식신','정재','편재'],watch:['편관','상관'],mode:'join',
        fit:'두 사람 사이에 편하게 이어가던 대화가 남아 있고 서로 연락해도 괜찮다면, 짧은 안부부터 생각해볼 만해요.',
        good:'답을 재촉하지 않는 짧은 안부가 어울려요. 생각이 길어지면 보내려는 말을 한 문장으로 줄여봐요.',
        caution:'반가운 마음에 예전에 못 한 말을 한꺼번에 꺼내기 쉬워요. 지금 묻고 싶은 것 하나만 남겨봐요.'},
      {title:'조금 더 기다리기',terms:['정인','편인','정관'],watch:['편관','겁재'],mode:'reflect',
        fit:'같은 대화를 여러 번 떠올리거나 다시 만나도 바뀔 점이 선명하지 않다면, 내 마음의 속도를 되찾을 시간을 두는 편이 맞아요.',
        good:'보고 싶은 마음과 다시 만나서 바꾸고 싶은 일을 따로 적으면 기다리는 동안 기준이 생겨요.',
        caution:'기다리는 동안 작은 연락이나 주변의 말에 의미를 더하기 쉬워요. 직접 확인한 말에만 무게를 둬요.'},
      {title:'관계 정리하기',terms:['비견','상관','편인'],watch:['편관','겁재'],mode:'shift',
        fit:'예전 방식으로 돌아가면 같은 불편이 반복될 것 같다면, 다음 관계에서 지키고 싶은 기준을 새로 정하는 쪽에 힘이 실려요.',
        good:'지금 지키고 싶은 생활 리듬과 다음 관계에서 바라는 약속을 하나씩 정하기 좋아요.',
        caution:'감정이 크게 움직이는 날에는 끝까지 이해받으려는 대화가 길어질 수 있어요. 내가 정한 거리와 연락의 범위를 먼저 정해요.'}
    ]},
    seohwa:{title:'사랑을 이어갈 세 가지 선택',slots:['일지','일간'],note:'현재 가까운 사람이나 연애 상태에 맞는 장면에서 읽어보세요.',options:[
      {title:'새 인연 만나기',terms:['편재','식신','비견'],watch:['편관','겁재'],mode:'join',slots:['연지','월지'],
        fit:'함께 할 이야기가 있을 때 마음이 열리는 편이라면, 관심사를 나누는 자리에서 만남의 폭을 넓혀볼 만해요.',
        good:'지인 소개나 취미 모임처럼 대화를 이어갈 공통점이 있는 자리를 살펴봐요.',
        caution:'주위의 기대나 첫인상이 마음보다 빨리 앞서기 쉬워요. 한 번 더 대화했을 때도 편한지 느껴봐요.'},
      {title:'썸에서 마음 전하기',terms:['상관','식신','편재'],watch:['편관','상관'],mode:'join',
        fit:'좋았던 순간을 말로 꺼낼 때 마음이 분명해진다면, 관계를 정하기에 앞서 관심을 가볍게 표현해볼 만해요.',
        good:'함께 있어서 좋았던 장면 하나와 또 만나고 싶다는 마음을 짧게 건네기 좋아요.',
        caution:'답을 빨리 듣고 싶은 마음이 커질 수 있어요. 상대가 자기 속도로 대답할 시간을 둬요.'},
      {title:'기존 관계 깊게 하기',terms:['정관','정재','정인'],watch:['편관','겁재'],mode:'steady',
        fit:'말과 행동이 이어질 때 마음이 놓인다면, 가까운 사이에서 작은 약속을 서로 지켜보는 쪽에 힘이 실려요.',
        good:'연락 빈도나 함께 보내는 시간 가운데 서로 편해지고 싶은 한 가지부터 조율해 봐요.',
        caution:'친밀한 사이일수록 서로 아는 줄 알았던 기대가 달라질 수 있어요. 앞으로의 약속은 말로 맞춰봐요.'}
    ]}
  };

  function natalClues(rows){
    return rows.flatMap(([slot,pair,visible,hidden])=>{
      const place=places[slot];
      if(!place||!pair)return [];
      const term=(hidden[0]||'').split(':')[1];
      return [
        {slot,place:place+'간',glyph:pair[0],term:slot==='day'?null:names[visible],scope:'천간'},
        {slot,place:place+'지',glyph:pair[1],term:names[term],scope:'지지 주기운'}
      ].filter(item=>item.term);
    });
  }
  function findNatal(clues,option,topic){
    const key=topic==='mujin'?'month':'day';
    return clues.flatMap(item=>{
      const rank=option.terms.indexOf(item.term);
      if(rank===-1)return [];
      const weight=3-rank+(item.slot===key?3:item.slot==='hour'?0:1)+Number(item.scope==='천간');
      return [{...item,weight}];
    }).sort((a,b)=>b.weight-a.weight)[0];
  }
  function monthStar(row,terms){
    const stars=[{term:row.top,place:'천간'},{term:row.hidden,place:'지지 주기운'}];
    return stars.flatMap(star=>{
      const rank=terms.indexOf(star.term);
      return rank===-1?[]:[{...star,weight:3-rank+Number(star.place==='천간'),
        fact:row.pair+' 월운 · '+star.place+' '+star.term}];
    }).sort((a,b)=>b.weight-a.weight)[0];
  }
  function monthSignal(row,option,slots){
    // Reuse actual natal-to-month aspects recorded by the monthly calculator.
    const related=(row.assessment?.candidates||[]).filter(signal=>slots.includes(signal.slot)&&row.links.includes(signal.fact));
    const connection=related.find(signal=>signal.bond);
    const friction=related.find(signal=>!signal.bond);
    const goodStar=monthStar(row,option.terms), watchStar=monthStar(row,option.watch);
    const mode=option.mode;
    const relevant=mode==='join'?connection:mode==='shift'||mode==='reflect'?friction:null;
    const favorable=(goodStar?.weight||0)+(relevant?mode==='reflect'?2:3:0);
    const penalty=(mode==='join'||mode==='steady')&&friction?2:0;
    const linked=[goodStar?.fact,relevant?.fact].filter(Boolean);
    const watch=(watchStar?.weight||0)+(friction?3:0);
    const goodReason=goodStar?language[goodStar.term]:
      connection&&relevant===connection?'말이나 상황이 자연스럽게 맞물리는 접점':'평소의 방식과 다른 조건이 눈에 띄는 흐름';
    const cautionReason=watchStar?(watchStar.term==='상관'?'쌓아둔 말이 한꺼번에 나오기 쉬운 흐름':language[watchStar.term]):
      '익숙한 기대와 이번 달의 여건이 어긋나기 쉬운 흐름';
    return {row,good:linked.length?{rank:Math.max(1,favorable-penalty),facts:linked,reason:goodReason}:null,
      caution:watch?{rank:watch,facts:[watchStar?.fact,friction?.fact].filter(Boolean),reason:cautionReason}:null};
  }
  function timing(matches,key,exclude){
    const ranked=matches.filter(item=>item[key]).sort((a,b)=>b[key].rank-a[key].rank||a.row.month-b.row.month);
    const picked=ranked.find(item=>item.row.month!==exclude)||ranked[0];
    if(!picked)return null;
    const {row}=picked;
    return {month:row.month,row,...picked[key]};
  }
  function compare(topic,calendar,natal){
    if(!Object.hasOwn(topics,topic)||!calendar?.length||!natal?.day||!natal.rows?.length)return null;
    const theme=topics[topic],clues=natalClues(natal.rows);
    const choices=theme.options.map(option=>{
      const signature=findNatal(clues,option,topic);
      const matches=calendar.map(row=>monthSignal(row,option,option.slots||theme.slots));
      const good=timing(matches,'good');
      const caution=timing(matches,'caution',good?.month);
      return {title:option.title,fit:option.fit,good,caution,
        goodText:option.good,cautionText:option.caution,
        natal:signature?{fact:signature.place+' '+signature.glyph+' · '+signature.scope+'의 '+signature.term,
          meaning:language[signature.term]}:null,
        weight:signature&&good?signature.weight*2+good.rank:0};
    });
    const ranked=choices.toSorted((a,b)=>b.weight-a.weight);
    // Weak or marginally different signals should not decide someone's situation.
    const first=ranked[0].weight&&ranked[0].weight-ranked[1].weight>=2?ranked[0].title:null;
    return {title:theme.title,note:theme.note,year:calendar[0].from?.slice(0,4),first,choices};
  }
  return {compare};
});
