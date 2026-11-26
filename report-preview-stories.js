/* Free examples are calculated locally from the same calendar library as the birth chart. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TaekilReportPreviewStories=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const signs={
    '比肩':['비견','peer','내 기준으로 고르는 힘'],'劫财':['겁재','peer','다른 사람과 몫을 나누는 힘'],
    '食神':['식신','expression','익숙한 재주를 꾸준히 쓰는 힘'],'伤官':['상관','expression','기존 방식에서 다른 가능성을 찾는 힘'],
    '正财':['정재','practical','꾸준히 쌓이는 가치를 살피는 힘'],'偏财':['편재','practical','새로운 기회를 알아보는 힘'],
    '正官':['정관','trust','책임과 약속을 지키는 힘'],'七杀':['편관','trust','압박 속에서 결단하는 힘'],
    '正印':['정인','support','익숙한 배움에서 힘을 얻는 결'],'偏印':['편인','support','남이 지나친 단서를 되짚는 결']
  };
  const topics={
    dogyeom:{
      question:'돈이 들어오는 길은 어디에서 열릴까요?',
      peer:['내 몫을 내가 정할 때','누군가와 함께 만드는 기회라면, 서로 같은 결과를 원해도 감당하려는 부담은 다를 수 있어요. 내 판단이 살아 있는 선택에서 손에 남는 몫이 더 또렷해지는 흐름이에요.'],
      expression:['잘해 온 일이 눈에 보일 때','재주가 있다는 사실과 그 재주에 값이 붙는 순간 사이에 한 단계가 있어요. 이미 해낸 일을 누군가 알아보고 다시 찾는 장면에 재물의 실마리가 보여요.'],
      practical:['기회를 내 몫으로 남길 때','들어올 돈의 크기보다 어떤 조건에서 내 몫이 되는지 알아차리는 쪽에 힘이 실려요. 한 번 크게 보이는 기회와 작아도 반복되는 기회를 나란히 놓으면 차이가 잘 보여요.'],
      trust:['맡은 일의 가치가 분명해질 때','책임이 늘어나는 것과 그만큼 인정받는 것은 별개의 흐름이에요. 책임질 범위와 그 대가를 함께 정할 수 있는 자리에서 재물의 연결고리가 더 잘 드러나요.'],
      support:['쌓아 둔 경험이 다시 쓰일 때','새 기회를 계속 찾기보다 이미 배운 것을 다른 곳에서 활용하는 과정에 무게가 실려요. 예전에 쉽게 해냈던 일을 지금도 필요로 하는 사람이 있는지 떠올려 보세요.']
    },
    seohwa:{
      question:'마음이 가까워졌다는 걸 어디에서 느낄까요?',
      peer:['내 속도를 존중받는 순간','즐거운 만남 뒤에도 나만 애쓰는 기분이 든다면, 호감의 크기보다 둘의 속도를 먼저 살펴봐요. 다음 만남을 누가 먼저 제안하는지보다 내 제안을 편하게 바꿀 수 있는지가 좋은 단서예요.'],
      expression:['한마디를 자연스럽게 주고받는 순간','마음속에서 답을 정리하기보다 말을 한 번 주고받으며 가까워지는 흐름이에요. 짧은 대화가 끝난 뒤에도 내 이야기를 다음에 다시 물어보는 사람이 유독 기억에 남을 수 있어요.'],
      practical:['작은 배려가 행동으로 돌아오는 순간','기분 좋은 말 한 번보다 지난번에 했던 말을 기억하고 행동에 옮길 때 신뢰가 붙는 쪽이에요. 약속을 미룬 횟수만 세기보다 그 뒤 누가 다시 시간을 잡았는지 떠올려 보세요.'],
      trust:['다음 약속을 믿을 수 있는 순간','연락이 잦아도 말과 행동이 어긋나면 가까워졌다는 감각이 약해질 수 있어요. 시간이 바뀌었을 때 이유를 알려 주고 새 약속을 잡는 태도에 더 큰 의미가 실려요.'],
      support:['설명을 다 하지 않아도 들어주는 순간','해결책을 곧장 받는 것보다 내 말의 맥락을 기억해 주는 사람에게 먼저 마음을 열기 쉬워요. 만난 뒤 마음이 편해졌던 대화와 더 설명하고 싶었던 대화를 구분해 보세요.']
    },
    ijun:{
      question:'그리운 마음을 연락으로 옮겨도 될까요?',
      peer:['먼저 내 뜻을 정리할 때','연락하고 싶은 밤이라도 다시 만나고 싶은지, 마지막 말을 바로잡고 싶은지는 다를 수 있어요. 상대의 반응을 예상하기 전에 내가 전하고 싶은 말이 한 문장으로 남는지 살펴봐요.'],
      expression:['말로 풀지 못했던 장면이 떠오를 때','긴 설명보다 그날 하지 못한 짧은 말 하나가 실마리가 되는 흐름이에요. 안부를 가장한 질문을 쓰게 된다면, 오늘 듣고 싶은 대답이 무엇인지 먼저 생각해 보세요.'],
      practical:['두 사람이 다시 할 수 있는 일이 보일 때','좋았던 기억보다 예전에 막혔던 행동을 이번에는 어떻게 바꿀지가 중요하게 읽혀요. 함께 시간을 내기 어려웠다면, 지금 정말 만날 자리가 생겼는지부터 떠올려 보세요.'],
      trust:['한 번 멈춘 이유를 존중할 때','다시 연락할 명분을 찾는 것보다 그때 정한 선이 지금도 유효한지 살피는 쪽에 무게가 실려요. 상대가 거리를 원했다면 그 의사를 지키는 것도 내 마음을 정리하는 선택이에요.'],
      support:['기억과 지금의 마음을 구분할 때','위로받았던 기억이 되살아나면 그 사람 자체가 더 그리운 것처럼 느껴질 수 있어요. 그때의 편안함과 지금 새로 하고 싶은 이야기를 구분하면 연락의 이유가 또렷해져요.']
    },
    mujin:{
      question:'일을 바꾼다면 무엇이 달라져야 할까요?',
      peer:['판단할 여지가 넓어질 때','직함이 같아도 매번 승인을 기다리는 자리와 스스로 순서를 정하는 자리는 다르게 느껴져요. 내가 내린 결정의 결과를 직접 볼 수 있는지 떠올리면 어울리는 역할을 좁힐 수 있어요.'],
      expression:['내 결과를 보여줄 기회가 생길 때','잘하는 일이 있어도 결과가 어디에 쓰였는지 볼 수 없다면 답답해질 수 있어요. 옮길 곳의 이름보다 내가 만든 결과를 누구에게 보여주고 어떤 반응을 받는지 살펴봐요.'],
      practical:['들인 힘이 성과로 남을 때','바쁘게 지낸 정도보다 무엇을 마쳤고 그 결과가 어떻게 남았는지가 중요하게 읽혀요. 새 역할을 고를 때 첫 달에 무엇을 완성하면 되는지 물어보면 두 자리의 차이가 드러나요.'],
      trust:['책임과 권한을 함께 맡을 때','일이 많아지는 것과 권한이 넓어지는 것은 달라요. 새 자리가 눈에 들어온다면, 문제가 생겼을 때 해결할 방법도 내가 정할 수 있는지 살펴보세요.'],
      support:['배운 것을 써 볼 자리가 생길 때','좋은 선배가 있는 것만큼 배운 일을 직접 해 볼 차례가 오는지도 중요해요. 새로 배운 방법을 작은 일에서 시험해 볼 수 있는 환경이 성장의 계기로 읽혀요.']
    }
  };
  function build(reading,context,choice,Solar,util){
    const topic=topics[reading.id], basis=context.readings[0], day=context.pillars.day?.[0];
    if(!topic||!basis||!day)return [];
    const cards=[];
    // Mid-month noon is away from the solar-term boundary. These are illustrative dates, never ranked months.
    function period(month,annual){
      const chart=Solar.fromYmdHms(2027,month,15,12,0,0).getLunar().getEightChar();
      const pair=annual?chart.getYear():chart.getMonth();
      const hidden=annual?chart.getYearHideGan():chart.getMonthHideGan();
      const top=signs[util.SHI_SHEN[day+pair[0]]],inner=signs[util.SHI_SHEN[day+hidden[0]]];
      return {pair,top,inner};
    }
    const year=period(3,true);
    const natalTheme=topic[basis.family][0],annualTheme=topic[year.top[1]][0];
    cards.push({label:'올해의 흐름',title:topic.question,
      paragraphs:[context.day+' 일주에서 입춘 이후의 '+year.pair+'년을 읽을 때는 '+year.top[0]+'부터 봐요. 쉽게 풀면 ‘'+year.top[2]+'’라는 뜻이에요. 지지의 중심에는 '+year.inner[0]+'도 있어서, 그 힘을 어디에 쓰는지까지 함께 살펴요.',
        basis.family===year.top[1]?'타고난 명식의 '+basis.location+'에서 읽은 '+basis.term+'도 비슷한 방향을 가리켜요. 그래서 올해는 ‘'+natalTheme+'’를 먼저 눈여겨봐요. 익숙한 방식이 힘을 얻을 때라서, 전혀 새로운 일보다 이미 해 오던 선택에서 변화가 먼저 보일 수 있어요.'
        :'평소의 단서는 '+basis.location+'의 '+basis.term+'에서 읽은 ‘'+natalTheme+'’예요. 올해는 여기에 ‘'+annualTheme+'’라는 주제가 더해져요. 평소 편하게 해 온 선택과 올해 유독 마음이 가는 선택이 왜 다른지 살펴볼 대목이에요.']});
    for(const month of [3,8]){
      const {pair,top,inner}=period(month,false);
      cards.push({label:'월운 예시 · 2027년 '+month+'월 15일',title:topic[top[1]][0],
        paragraphs:[month+'월 15일의 월운은 '+pair+'예요. 내 일간 '+day+'에서 보면 월간은 '+top[0]+', 지지의 중심은 '+inner[0]+'로 읽어요. 겉으로는 ‘'+top[2]+'’, 그 바탕에는 ‘'+inner[2]+'’가 놓여 있어요.',topic[top[1]][1]]});
    }
    const story=reading.stories[choice];
    cards.push({label:'선택한 고민 · 가상 상황 예시',title:story.label,
      paragraphs:[story.situation||story.scene, reading.name+'는 이 장면에서 ‘'+natalTheme+'’에 주목해요. 그 근거는 '+basis.natal+' 기둥의 '+basis.location+'에서 읽은 '+basis.term+'에 있어요.']});
    return cards;
  }
  return {build};
});
