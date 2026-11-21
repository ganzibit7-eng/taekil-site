(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TaekilTopicMonthly=factory();
})(globalThis,function(){
  'use strict';

  const slots={일지:'day',일간:'day',월지:'month',월간:'month',연지:'year',연간:'year',시지:'hour',시간:'hour'};
  const joins=new Set(['육합','천간합']);
  const changes=new Set(['충','형','파','해']);
  const families={정재:'재성',편재:'재성',식신:'식상',상관:'식상',비견:'비겁',겁재:'비겁',정관:'관성',편관:'관성',정인:'인성',편인:'인성'};
  const scopes={
    seohwa:{일지:'가까운 사이에서의 반응',일간:'내가 먼저 보이는 태도',월지:'관계의 일상',월간:'서로 의견을 내는 방식',연지:'바깥에서 생기는 계기',연간:'처음 관계를 맺는 방식',시지:'앞으로 함께 지낼 그림',시간:'앞날을 이야기하는 방식'},
    ijun:{일지:'지난 관계에서 반복된 거리감',일간:'내가 다시 관계에 임하는 태도',월지:'둘 사이에서 익숙했던 일상',월간:'다시 오가는 조건',연지:'예전에 인연이 닿았던 환경',연간:'처음 인연을 맺던 방식',시지:'앞으로 이어갈 수 있는 생활',시간:'기대했던 두 사람의 앞날'},
    mujin:{일지:'내가 익숙하게 일을 처리하는 방식',일간:'직접 맡고 싶은 일',월지:'일터의 환경과 규칙',월간:'일터에서 의견을 내는 방식',연지:'조직 바깥의 여건',연간:'바깥에 보여 온 일의 방식',시지:'실행 여건과 일정',시간:'앞으로 만들어 낼 결과'}
  };
  const relationSense={
    육합:'서로 엮이기 쉬운 자리',천간합:'표현이나 조건이 맞닿는 지점',
    충:'익숙한 방향을 바꾸는 힘',형:'같은 문제에서 다시 생기는 마찰',
    파:'유지되던 방식에 틈이 생기는 흐름',해:'겉으로 드러난 말과 실제 기대가 어긋나는 흐름'
  };

  // Each rule represents a different interaction. The same facts can answer
  // different questions in the three products without changing the calculation.
  const stories={
    joinedDay:{
      seohwa:['끌림과 편안함이 따로 움직일 때','가까워질 계기가 생기기 쉬워도 서로 편해지는 속도까지 맞는 달은 아니에요. 새 만남이라면 처음의 친밀함보다 두 번째 대화의 느낌이, 기존 관계라면 다시 가까워진 뒤에도 약속이 편하게 지켜지는지가 중요해요.'],
      ijun:['다시 편해져도 예전 방식은 달라져요','익숙한 친밀감을 떠올리기 쉬운 달이지만, 예전 방식까지 편안하게 받아들이는 흐름은 약해요. 새 인연과 비교할 때는 누가 익숙한지보다 어떤 사이에서 내 말과 행동이 더 자연스러운지 살펴볼 만해요.'],
      mujin:['잘하던 방식에도 손볼 곳이 보여요','익숙한 처리 방식은 새 일을 이해하는 데 도움이 되지만, 그대로 옮기면 일부 과정이 걸릴 수 있어요. 이직을 본다면 바로 활용할 경험과 새로 익혀야 할 부분을 함께 읽는 달이에요.']
    },
    clashDay:{
      seohwa:['가까운 사이의 거리가 바뀌는 달','새 사람에게 관심이 생겨도 가까워질 속도에 민감하게 반응하기 쉬워요. 이미 관계가 있다면 관계의 이름을 바꾸기 전에 만나는 빈도와 혼자 쓸 시간을 다시 맞추고 싶은 흐름이에요.'],
      ijun:['다시 만나도 그대로 두기 어려운 거리','예전 사이를 되돌리는 것보다 그때 불편했던 거리를 바꾸고 싶은 쪽이 강해요. 같은 사람이어도 지킬 선이 달라질 수 있고, 새 인연에는 그 선이 예전보다 빨리 보일 수 있어요.'],
      mujin:['하던 방식에서 벗어날 때','해 오던 일의 방식을 그대로 밀기보다 다른 실행 방법을 시험해 볼 만해요. 제안이나 새 역할이 있다면 겉으로 조건이 맞는 것과 실제로 일하는 방식이 잘 맞는지를 구분해야 하는 달이에요.']
    },
    assignmentTerms:{
      mujin:['처우는 맞닿고 소속 조건은 달라져요','이직을 본다면 보상은 이야기하기 쉬워도 새 자리의 업무 환경과 빠르게 맡게 될 책임은 따로 읽어야 해요. 남는 경우에도 조건을 다시 맞추기 전에 새로 부담할 범위부터 살펴보기 좋은 달이에요.']
    },
    frictionDay:{
      seohwa:['다정함을 다르게 받아들이는 달','상대가 다정하게 건넨 말도 내가 바란 배려와 어긋나기 쉬워요. 새 만남에선 마음을 알아주리라 기대하기보다 원하는 연락 간격이나 만남의 속도를 말로 맞추는 쪽이 편해요.'],
      ijun:['같은 장면을 다시 떠올리는 이유','상대가 왜 그랬는지를 알아내고 싶은 마음보다 내가 왜 그때 자꾸 참았는지가 잘 보이는 달이에요. 예전 일의 해석을 새로 하더라도 상대의 마음까지 안다고 여기지는 않아요.'],
      mujin:['일의 요구와 내 방식 사이의 틈','지금까지 익혀 온 방법을 더 꼼꼼히 쓰고 싶어도 주변의 요구와 세부 방식이 어긋날 수 있어요. 익숙한 업무를 맡더라도 지원을 받는 지점과 스스로 판단해야 할 지점을 나눠 보는 달이에요.']
    },
    shiftBridge:{
      seohwa:['일상이 바뀌며 생기는 새 접점','만나는 여건이나 연락 리듬은 흔들릴 수 있어요. 그와 별개로 앞으로 시간을 맞출 접점이 보여, 기존 약속을 지키는 것보다 두 사람이 다른 방식을 함께 정할 때 가까워지기 쉬워요.'],
      ijun:['예전과 다른 방식으로 볼 수 있는 사이','둘 사이에 익숙했던 방식은 바꾸고 싶지만, 앞으로 시간을 나누는 그림까지 막히는 달은 아니에요. 익숙함이 다시 닿더라도 실제로 달라진 약속이 있는지가 재검토의 기준이에요.'],
      mujin:['일터 기준은 흔들리고 실행에는 길이 열려요','기존 평가나 업무 방식이 바뀔 수 있는 달이에요. 실제로 일을 굴리는 여건에는 접점이 있어서, 승진이나 역할 확대를 본다면 직함을 바꾸는 일과 실행 조건을 확보하는 일을 따로 살펴요.']
    },
    termsMeet:{
      seohwa:['약속을 잡기 쉽고 뒷일은 조율할 때','말이 통하고 만날 조건을 정하기에는 접점이 보이는 달이에요. 다만 일정이나 각자의 계획을 끝까지 맞춰야 가까움이 이어져요. 한 번 마음이 통했다는 느낌이 관계의 전부가 되지 않도록 볼 만해요.'],
      ijun:['연락보다 다시 지킬 수 있는 조건','말을 건넬 수 있는 상황이라면 이야기를 주고받을 접점은 보여요. 다만 다시 이어갈지 보려면 예전에 맞추지 못했던 일정이나 약속을 이번에는 실제로 맞출 수 있는지가 먼저예요.'],
      mujin:['조건이 맞아도 실행 몫은 확인할 때','보상이나 일을 맡는 조건에서 접점을 찾기 쉬워요. 취업·이직을 본다면 제안이 성립하는 것과 시작한 뒤 일정과 실무를 감당할 수 있는지를 별개로 보기에 좋은 달이에요.']
    },
    echo:{
      seohwa:['올해의 관계 과제가 선명해지는 달','올해 관계에서 느끼기 쉬운 기대 차이가 이번 달에도 같은 방식으로 들어와요. 주변의 의견을 듣는 것과 두 사람이 직접 정할 약속을 구분하면 어디서 서운함이 시작되는지 보기 쉬워요.'],
      ijun:['올해 다시 묻게 되는 관계의 기준','지난 관계에서 왜 내 뜻을 늦게 말했는지 되짚기 쉬워요. 반복되는 약속 문제라면 연락할 때를 고르기 전에, 지금의 내가 같은 조건으로 관계를 이어갈 수 있는지 먼저 살펴요.'],
      mujin:['올해의 역할 조정이 앞에 나오는 달','일을 함께 맡는 범위와 개선 의견을 어디까지 낼 수 있는지가 또렷해져요. 새 역할을 검토한다면 책임만 늘어나는 자리인지, 방식도 함께 바꿀 수 있는 자리인지가 핵심이에요.']
    },
    ruleFriction:{
      seohwa:['같은 약속에서 다시 어긋나기 쉬워요','관계의 이름을 확실히 하고 싶은 마음과 세부 약속을 맞추는 일이 동시에 부각돼요. 새 만남에서 진지함을 볼 때는 큰 말보다 평소 연락이나 만날 시간을 맞추는 습관이 더 잘 보여요.'],
      ijun:['예전에 맞추지 못했던 약속이 보여요','좋았던 때보다 자꾸 같은 말다툼으로 돌아간 이유를 짚기 쉬워요. 다음 인연에서는 애정 표현의 크기보다 작은 약속을 다루는 방식이 이달에 선명하게 들어와요.'],
      mujin:['기준은 뚜렷하고 세부 요구는 까다로워요','취업에서는 준비해 온 역량이 실제 평가 항목에 맞는지, 승진에서는 공식 책임과 일상적인 요청이 서로 맞는지가 두드러지는 달이에요. 요건이 명확해질수록 작은 마찰도 더 잘 보여요.']
    },
    ruleBreak:{
      seohwa:['해 오던 약속에 작은 틈이 보여요','겉으로는 같은 사이여도 평소 연락이나 만남을 이어가는 방식에 빈틈이 보일 수 있어요. 새 인연에서는 분위기보다 꾸준히 보여주는 행동을, 기존 관계라면 작은 약속의 변화부터 살펴요.'],
      ijun:['그때 크게 보지 않았던 변화','지난 관계가 달라졌다고 느낀 순간을 생각하면 하나의 큰 사건보다 작은 약속이 헐거워진 과정이 눈에 들어올 수 있어요. 새 인연에서도 아주 익숙한 말보다 일관된 행동에 더 마음이 가요.'],
      mujin:['개선한 결과가 어떻게 평가되는지가 관건','기존 방법을 손보고 결과를 내더라도 일터가 그 결과를 평가하는 방식에 빈틈이 보일 수 있어요. 이직이나 역할 변경을 볼 때는 결과의 가치를 인정받을 구조인지 살펴보기 좋은 달이에요.']
    },
    ruleHidden:{
      seohwa:['겉으로 한 말과 기대가 어긋나기 쉬워요','앞으로 더 자주 만나자는 말도 서로 기대하는 빈도는 다를 수 있어요. 관계를 이어 가고 싶다면 겉에 드러난 태도보다 두 사람이 당연하다고 여기는 기준을 살피기 쉬운 달이에요.'],
      ijun:['같은 기억에도 기대는 달랐을 수 있어요','지난 일을 떠올릴 때는 자신이 지키고 싶었던 약속과 상대에게 실제로 전달한 말의 차이가 눈에 들어와요. 관계를 재검토한다면 그 간격을 다시 두고 볼 만해요.'],
      mujin:['책임을 늘리기 전에 요구를 읽는 달','표면상 같은 업무라도 기대하는 성과나 책임의 범위가 조금 다를 수 있어요. 역할이 바뀌는 상황이라면 해야 할 일보다 어디까지 직접 판단할 수 있는지에 신경이 쓰이는 흐름이에요.']
    },
    plansMeet:{
      seohwa:['앞으로의 이야기는 열리고 일정은 흔들려요','서로 미래 이야기를 나눠 볼 접점은 생겨요. 실제로 시간을 내고 계획을 지키는 방식까지 정해지기에는 변수가 남아, 기대가 커질수록 구체적인 계획을 천천히 맞춰 가기 좋은 달이에요.'],
      ijun:['같이 그렸던 앞날을 다시 살펴요','예전에 함께 바라던 미래가 생각날 수 있어요. 그 미래를 지금도 원하는지, 지금의 생활 속에서도 함께할 자리가 있는지는 따로 살펴야 지난 인연의 무게가 분명해져요.'],
      mujin:['새 방향은 보이고 준비 일정은 바뀌기 쉬워요','새 역할이나 작업 방식의 조건이 맞닿기 쉬운데 실행 날짜와 준비 순서는 받아 적은 대로 흘러가기 어려워요. 뛰어들기 전에 일의 준비 상태를 가늠하는 쪽에 힘을 쓸 만해요.']
    },
    socialFriction:{
      seohwa:['만남의 계기보다 주변의 영향이 커요','새 사람과 가까워질지보다 어떤 환경에서 내 기대가 커지는지가 먼저 보여요. 소개나 모임에서 생긴 호감이라면 둘만 있을 때도 그 관심이 이어지는지를 구분해 볼 만해요.'],
      ijun:['그 사람과 그때의 환경을 구분해요','지난 인연을 떠올리게 한 계기가 그 사람 자체였는지, 같이 지내던 장소나 환경이었는지 눈에 들어오는 달이에요. 익숙한 장면이 겹치더라도 지금의 관계가 같은 뜻이라고 보지는 않아요.'],
      mujin:['바깥에서 오는 요구가 먼저 보여요','조직 안에서 내 자리를 바꾸는 흐름보다 외부 기회나 요구가 어떤 방식으로 들어오는지 먼저 눈에 띄어요. 새 제안이 있다면 속도를 내야 할 일과 배우면서 따라갈 일을 나눠 볼 만해요.']
    },
    recurringSetting:{
      seohwa:['주변의 기대를 내 약속과 나눠 볼 달','주변이 바라는 모습과 내가 두 사람 사이에서 편하다고 느끼는 조건이 겹쳐 생각나기 쉬워요. 가까워지고 싶은 마음이 있다면 주변 상황이 달라져도 같은 방식으로 만나고 싶은지 먼저 보게 되는 달이에요.'],
      ijun:['그때의 환경이 지금도 영향을 주는 달','예전 인연과 함께 지내던 환경이 올해도 관계를 보는 기준에 남아 있을 수 있어요. 이번 달에는 그 환경의 영향과 지금 원하는 관계를 나눠 보는 흐름이 두드러져요.'],
      mujin:['오래된 외부 조건을 다시 보게 돼요','한 달의 요구만 바뀐 것인지, 올해 계속 이어지는 계약이나 조직 바깥의 제약인지 살펴보기 좋은 달이에요. 역할을 고른다면 그 제약 속에서도 쓸 수 있는 권한이 핵심이에요.']
    },
    outerBond:{
      seohwa:['관심사를 나누는 자리에서 가까워져요','둘 사이의 약속이 바로 움직이기보다 이미 편하게 오가는 모임이나 관심사에서 인연의 접점이 읽혀요. 익숙한 사람들과 함께 있을 때 내 태도가 어느 상대에게 자연스럽게 향하는지 보기 좋은 달이에요.'],
      ijun:['사이보다 함께 지냈던 접점이 먼저 떠올라요','지난 인연과 둘만의 감정보다 같이 지냈던 환경이나 공유하던 관심사가 두드러져요. 그런 접점이 새 인연에서도 살아나는지 보면, 무엇이 오래 기억에 남는 관계였는지 좀 더 선명해져요.'],
      mujin:['지금의 일과 연결되는 바깥 자리가 보여요','새 방향을 볼 때도 모든 것을 처음부터 다시 시작하는 그림보다, 지금 쌓은 경험이 쓰이는 외부의 역할이나 협업에 눈이 가요. 일터 내부 기준을 바꾸는 움직임과는 결이 다른 기회예요.']
    },
    futureFriction:{
      seohwa:['마음이 가도 생활에 내줄 자리가 중요해요','호감의 크기보다 서로에게 시간을 낼 수 있는지가 잘 보여요. 가까운 관계를 오래 이어갈 생각이라면 각자 지키고 싶은 생활 리듬을 먼저 확인하기 좋은 달이에요.'],
      ijun:['다시 이어졌을 때의 일상을 봐요','지금 마음이 어떤지만 보면 쉽게 결론이 나지 않아요. 다시 이어진다고 가정했을 때 예전에 비어 있거나 무리했던 생활의 자리를 이번에는 어떻게 채울지가 두드러지는 달이에요.'],
      mujin:['책임이 커질 때 실행 여건을 살펴요','기준이 분명해져 일의 방향을 잡기 쉬워도 실제 일정이나 지원 조건에서는 어긋남이 생길 수 있어요. 승진이나 역할 확대를 가늠한다면 시작한 뒤 쓸 수 있는 자원까지 확인할 달이에요.']
    },
    outerOpening:{
      seohwa:['새로운 대화에서 친근함이 보여요','가까운 사이에 곧바로 큰 변화가 들어오기보다, 내가 관계를 맺기 시작하는 방식에 여유가 생기는 흐름이에요. 새 만남에선 큰 호감보다 대화가 돌아오는 길이 열려 있는 상대에게 눈이 갈 수 있어요.'],
      ijun:['예전 대화가 새롭게 들리는 달','지난 인연의 말뜻이 다르게 보이거나, 무엇이 빠져 있었는지 돌아보기 쉬워요. 아직 확인한 변화가 적다면 이달의 흐름은 상대의 반응보다 내 해석이 바뀌는 쪽으로 읽어요.'],
      mujin:['새로 익힌 방법을 결과로 보여줄 달','기존에 하던 방식과 다른 관점을 엮기 쉬워요. 취업을 본다면 새로 익힌 기술을 설명에 그치지 않고 결과물로 보여주기에 어울려요. 역할 이동을 본다면 무엇을 해낼 수 있는지가 조건보다 먼저 보여요.']
    }
  };

  const cues={
    seohwa:{
      정재:['꾸준한 행동에 마음이 가는 달','호감이 커지는 계기보다 때마다 비슷한 태도로 다가오는지가 눈에 들어와요.'],
      편재:['호의가 오가는 방식이 눈에 띄어요','상대가 건넨 호의와 내가 기대한 친밀감 사이에 얼마나 차이가 있는지 살피기 쉬워요.'],
      식신:['편해지면 먼저 이야기가 나와요','부담 없는 대화를 주고받을 때 내 마음이 더 자연스럽게 드러나요.'],
      상관:['넘겨 오던 말이 다시 마음에 걸려요','누가 맞는지 가리기보다 어느 말에서 두 사람의 기대가 달라졌는지 잘 보여요.'],
      비견:['가까워져도 각자의 속도가 중요해요','함께하는 시간을 늘리는 것만큼 서로 혼자 쓰는 시간을 존중할 때 관계가 편하게 읽혀요.'],
      겁재:['남들의 판단과 내 마음을 가려요','주변에서 어울린다고 보는 관계와 내가 실제로 편안해하는 관계가 다를 수 있어요.'],
      정관:['관계의 방향을 말로 정하고 싶어요','얼마나 자주 만나고 무엇을 약속할 수 있는지가 관계의 진지함을 판단할 기준으로 올라와요.'],
      편관:['기대가 앞서기 쉬운 달','살짝 앞서가는 호감에 비해 신뢰와 생활의 리듬은 개별적으로 맞춰 가야 해요.'],
      정인:['이해받는 느낌에 마음이 열려요','설명하지 않은 부분까지 짐작해 주길 바라기보다, 말을 끝까지 들어주는 사람에게 마음이 더 편하게 움직여요.'],
      편인:['말보다 말이 나온 사정을 살펴요','나와 다른 표현 방식도 바로 판단하지 않고 배경을 곱씹을 때 관계가 더 선명하게 읽혀요.']
    },
    ijun:{
      정재:['다시 지킬 수 있는 약속을 가려요','예전보다 친절해 보이는 말과 두 사람 모두 실제로 지킬 수 있는 약속을 구분하는 흐름이에요.'],
      편재:['익숙했던 호의가 지금도 통하는지 봐요','지나간 호의가 그립더라도 현재의 사이에서 같은 방식이 편한지는 새로 읽어야 해요.'],
      식신:['부담 없이 나눴던 이야기가 떠올라요','지난 인연에서 어떤 대화가 유독 편했는지 찾고, 새 인연에서도 그런 대화가 가능한지 비교하기 쉬워요.'],
      상관:['미처 꺼내지 못했던 말이 돌아와요','당시 하지 못한 말이 지금도 이어갈 이유가 되는지, 혼자 정리해도 되는 말인지 가려볼 달이에요.'],
      비견:['내 페이스를 다시 잡고 보는 인연','기다리는 동안 미뤄 왔던 내 생활을 되찾을수록 이 관계가 내게 어떤 자리였는지 보여요.'],
      겁재:['다른 사람의 평가가 답이 되기 어려워요','주변이 말하는 가능성과 그 관계에서 직접 느꼈던 편안함을 따로 놓고 읽어볼 만해요.'],
      정관:['다시 가까워져도 지킬 선이 보여요','애정의 크기보다 반복되면 곤란한 일이 무엇인지 분명해져, 재검토할 조건을 좁히기 쉬워요.'],
      편관:['결론을 서두르고 싶은 마음이 앞서요','빨리 안심하고 싶은 마음이, 긴 시간을 두고 어떤 사이를 원하는지보다 앞에 나올 수 있어요.'],
      정인:['좋았던 기억과 아직 필요한 배려','이해받았던 기억이 선명해져요. 그때 받았던 배려가 지금 연결할 인연에도 필요한지 살피기 좋은 달이에요.'],
      편인:['잊고 있던 장면을 다시 보는 달','그때 오간 말에 붙여 놓았던 뜻이 바뀔 여지가 있어요. 그 변화만으로 관계가 달라졌다고 보지는 않아요.']
    },
    mujin:{
      정재:['일의 규모와 대가를 맞춰 볼 달','처우나 자원은 결과를 낼 수 있는 일의 범위와 묶어 볼 때 구체적으로 읽혀요.'],
      편재:['새 역할에서 쓸 수 있는 자원이 보여요','지금과 다른 환경에서 제안받는 역할이 있다면 사람과 시간, 권한을 실제로 쓸 수 있는지에 눈이 가요.'],
      식신:['쌓은 숙련을 결과로 보여줄 때','취업이나 역할 확대를 본다면 맡았던 일의 이름보다 결과물과 만들어 낸 과정을 내세우기 좋아요.'],
      상관:['막힌 절차에 대안을 내기 쉬워요','문제를 발견하고 고칠 방법을 내놓는 데 힘이 실려요. 역할 변화에서는 제안을 승인할 사람과 절차가 중요해요.'],
      비견:['일의 순서를 직접 정하고 싶어요','같은 결과를 내더라도 과정에서 스스로 판단할 수 있는 범위가 일에 대한 만족을 가르기 쉬워요.'],
      겁재:['여럿이 맡는 일에서 내 몫이 중요해요','같은 일을 여럿이 나눠 맡는다면 내 판단에 달린 부분과 합의가 필요한 부분의 경계가 눈에 들어와요.'],
      정관:['평가와 공식 책임이 또렷해지는 달','취업에서는 평가 기준, 승진에서는 넘겨받을 권한이 얼마나 명확한지에 눈이 가요.'],
      편관:['결정 속도와 부담을 함께 살펴요','일을 빨리 맡을 여지는 있어도 초반에 필요한 지원과 직접 책임질 범위까지 봐야 힘을 쓰기 쉬워요.'],
      정인:['이미 쌓은 기록이 다음 단계의 바탕','새 과제를 넓히기 전에 해 온 일에서 다시 쓸 수 있는 근거와 지원을 확인하기 좋은 흐름이에요.'],
      편인:['다른 방식으로 바꿔 쓸 지식이 보여요','직종을 바꾸지 않아도 새로운 과제에 기존 지식을 응용하는 데 힘이 실려요.']
    }
  };
  const careerMix={
    '정관·정인':'정관의 평가 기준에 정인의 배움이 이어져요. 단기적인 요령보다 이미 익힌 절차나 증빙이 평가에서 쓰이기 쉬워요.',
    '편인·식신':'편인에서 읽는 새로운 접근이 식신의 결과물로 이어져요. 배운 방법의 효용이 눈에 보이는 달이에요.',
    '식신·편재':'식신이 만들어 낸 결과를 편재가 바깥의 자원이나 역할에 연결해요. 같은 결과를 다른 환경에 가져갔을 때의 쓰임을 보기 좋아요.',
    '상관·정재':'상관의 개선 의견과 정재의 구체적인 평가가 맞물려요. 무엇을 고쳤는지에 더해, 바뀐 결과를 어떤 기준으로 인정받는지가 관건이에요.',
    '정재·편관':'정재로 보는 구체적인 조건과 편관으로 보는 빠른 책임 부여가 함께 와요. 제안이 매력적이어도 요구받는 속도까지 같이 읽어요.',
    '겁재·상관':'겁재로 보는 역할 분담과 상관으로 보는 개선 요구가 겹쳐요. 여러 사람이 함께할수록 결정하는 사람과 실행하는 사람이 누구인지가 중요해요.',
    '비견·겁재':'비견의 자율성과 겁재의 역할 분담이 함께 부각돼요. 새로운 권한이 있어도 협의해야 하는 범위에 따라 체감이 달라져요.'
  };

  function groupLinks(links){
    const grouped=new Map();
    for(const link of links){
      const [,slot,glyph,visitorSlot,visitor,kind]=link.match(/^(\S+) (\S+)·(\S+) (\S+) (\S+)$/u);
      const key=[slot,glyph,visitorSlot,visitor].join(' ');
      const entry=grouped.get(key)||{slot,glyph,visitorSlot,visitor,kinds:[],facts:[]};
      entry.kinds.push(kind);
      entry.facts.push(link);
      grouped.set(key,entry);
    }
    return [...grouped.values()];
  }

  function select(row,topic){
    const native=groupLinks(row.links);
    const bySlot=(slot,kind)=>native.find(link=>link.slot===slot&&(kind?link.kinds.includes(kind):link.kinds.some(k=>changes.has(k))));
    const local=bySlot('일지');
    const environment=bySlot('월지');
    const horizon=bySlot('시지');
    const bridge=bySlot('시지','육합');
    const bond=bySlot('월지','육합');
    const recent=bySlot('연지');
    const annualEcho=recent&&groupLinks(row.annualLinks).find(link=>link.slot==='세운지'&&link.glyph===recent.glyph&&link.kinds.some(kind=>recent.kinds.includes(kind)));
    const stem=native.find(link=>link.kinds.includes('천간합'));
    const plan=bySlot('시간','천간합');
    const workTerms=bySlot('월간','천간합');
    const monthlyMatch=(topic==='mujin'?[environment,local]:[local,environment]).find(Boolean);
    if(topic==='mujin'&&workTerms&&recent?.kinds.includes('충')&&[row.top,row.hidden].includes('편관'))return ['assignmentTerms',workTerms,recent];
    if(local?.kinds.includes('육합'))return ['joinedDay',local,topic==='mujin'&&environment];
    if(local?.kinds.includes('충'))return ['clashDay',local,native.find(link=>link.kinds.includes('육합'))];
    if(local)return ['frictionDay',local];
    if(environment?.kinds.includes('충')&&bridge)return ['shiftBridge',environment,bridge];
    if(bond&&stem&&horizon)return ['termsMeet',bond,horizon];
    if(row.pair===row.annual&&(monthlyMatch||horizon||recent))return ['echo',monthlyMatch||horizon||recent];
    if(environment?.kinds.includes('형'))return ['ruleFriction',environment];
    if(environment?.kinds.includes('파'))return ['ruleBreak',environment];
    if(environment?.kinds.includes('해'))return ['ruleHidden',environment];
    if(environment)return ['ruleFriction',environment];
    if(horizon&&plan)return ['plansMeet',horizon,plan];
    if(annualEcho)return ['recurringSetting',recent];
    if(recent)return ['socialFriction',recent];
    if(horizon)return ['futureFriction',horizon];
    if(stem&&stem.slot==='연간')return ['outerOpening',stem];
    const outerBond=bySlot('연지','육합');
    if(outerBond)return ['outerBond',outerBond];
    return ['quiet',native[0]];
  }

  const shortSlot=slot=>slot.endsWith('간')?'천간':slot.endsWith('지')?'지지':slot;
  const pairText=link=>`원국 ${link.slot}(${link.glyph})와 월운 ${shortSlot(link.visitorSlot)}(${link.visitor})`
    .replace(/(일간|월간|연간|시간)(\(.\))와/u,'$1$2과');
  const listKinds=link=>link.kinds.join('·');
  const impact=(link,topic)=>{
    const preferred=link.kinds.find(kind=>changes.has(kind))||link.kinds[0];
    const movement=relationSense[preferred];
    return `‘${scopes[topic][link.slot]}’에는 ${movement}${supportsFinal(movement)?'이':'가'} 보여요.`;
  };

  function contextFor(row,pattern,primary,secondary){
    if(pattern==='echo')return {text:`이달 대표 월운과 세운이 ${row.pair}로 같아요. 원국의 같은 자리에 월운과 세운이 나란히 닿아요.`,facts:[row.pair+' 세운·월운']};
    if(pattern==='shiftBridge'&&row.groups.length){
      return {text:`${row.groups.join('·')}도 함께 잡혀, 바뀐 여건에 대응하는 힘을 보태요.`,facts:row.groups};
    }
    const cycles=row.cycles.flatMap(cycle=>groupLinks(cycle.links).map(link=>({pair:cycle.pair,link})));
    const links=[...cycles,...groupLinks(row.annualLinks).map(link=>({pair:row.annual,link}))];
    const match=(pattern==='recurringSetting'&&links.find(({link})=>link.slot==='세운지'&&link.glyph===primary.glyph))||
      links.find(({link})=>primary&&link.kinds.some(kind=>primary.kinds.includes(kind)))||
      links.find(({link})=>secondary&&link.kinds.some(kind=>secondary.kinds.includes(kind)))||
      links.find(({link})=>link.kinds.includes('충'))||links[0];
    if(!match)return {text:'',facts:[]};
    const {pair,link}=match;
    const layer=link.slot.startsWith('대운')?'대운':'세운';
    const placement=link.slot.endsWith('간')?'천간':'지지';
    const text=`${pair} ${layer}의 ${placement}(${link.glyph})도 이달 월운(${link.visitor})과 ${listKinds(link)} 관계를 이뤄요.`;
    return {text,facts:link.facts};
  }

  function analyze(row,topic){
    const [pattern,primary,secondary]=select(row,topic);
    const withAuthority=[row.top,row.hidden].some(god=>families[god]==='관성');
    const specific=topic!=='mujin'||(pattern!=='ruleFriction'||withAuthority)&&
      (pattern!=='outerOpening'||[row.top,row.hidden].some(god=>families[god]==='식상'));
    const scene=specific?stories[pattern]?.[topic]:null;
    const cue=cues[topic][row.top];
    const context=contextFor(row,pattern,primary,secondary);
    const mix=topic==='mujin'&&careerMix[row.top+'·'+row.hidden];
    const supports=secondary&&slots[secondary.slot]!==undefined;
    const mainFact=primary?`${pairText(primary)} 사이에 ${listKinds(primary)} 관계가 있어요.`:
      row.groups.length?`이달 월운과 원국 지지에서 ${row.groups.join('·')}이 보여요.`:
        '이달 월운에서 원국과 직접 맞물리는 합이나 충돌이 두드러지지 않아요.';
    const shortReading=mix||(primary?impact(primary,topic):'월운의 십성에서 읽는 변화가 중심이에요.');
    const bridge=supports?`${pairText(secondary)} 사이에는 ${listKinds(secondary)} 관계도 잡혀요.`:'';
    const title=scene?.[0]||cue[0];
    const interpretation=scene?.[1]||cue[1];
    const emphasis=topic==='mujin'?row.top+'·'+row.hidden+'의 직업 흐름':primary?scopes[topic][primary.slot]:row.top+'의 표현 방식';
    const other=[...(primary?.facts||[]),...(supports?secondary.facts:[]),...context.facts];
    const evidence=new Set([row.pair+' 월운 · 천간 '+row.top+' · 지지 주기운 '+row.hidden,...other,...(!primary?row.groups:[])]);
    const topicalStars=[row.top,row.hidden].filter((god,i,all)=>['관성','재성'].includes(families[god])&&all.indexOf(god)===i);
    if(topic!=='mujin'&&primary?.slot==='일지'&&topicalStars.length){
      evidence.add('관계 보조 근거 · '+topicalStars.join('·')+' · 전통 배우자성을 읽는 관성·재성의 관점');
    }
    return {title,lead:[mainFact,shortReading,bridge].filter(Boolean).join(' '),reading:interpretation,context,evidence,
      key:[pattern,primary?.slot,listKinds(primary||{kinds:[]}),row.top,row.hidden,context.facts.join(' ')].join('|'),
      emphasis,focus:primary?scopes[topic][primary.slot]:'',kind:primary&&listKinds(primary)};
  }

  const glyphs=/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]+/gu;
  const mask=new RegExp(Object.keys(families).join('|'),'gu');
  const particleError=/(?:[가-힣]+)(?:으로|로|은|는|이|가)(?=\s)/gu;
  const grammaticalTerms=new Set([...Object.keys(families),...Object.keys(relationSense),...Object.values(relationSense).map(text=>text.split(' ').at(-1))]);
  const normalize=value=>value.replace(glyphs,'글자').replace(mask,'십성').replace(/\d+월/gu,'몇월').replace(/[^가-힣\p{L}\d ]/gu,'').replace(/\s+/gu,' ').trim();
  const lines=value=>(value||'').split(/(?<=[.!?])\s+/u).map(s=>s.trim()).filter(s=>s.length>=14);
  const trigrams=text=>new Set([...text].slice(2).map((v,i)=>text.slice(i,i+3)));
  function similar(a,b){
    if(a===b)return true;
    if(Math.min(a.length,b.length)<18)return false;
    const x=trigrams(a),y=trigrams(b);
    const common=[...x].filter(word=>y.has(word)).length;
    return 2*common/(x.size+y.size)>=.86;
  }

  function audit(cards){
    const titleCounts=new Map();
    const seen=[];
    const duplicateSentences=[],nearSentences=[],withinCard=[],particles=[];
    for(const [i,card] of cards.entries()){
      titleCounts.set(card.title,(titleCounts.get(card.title)||0)+1);
      // AI-like interpretation and comparisons are measured apart from deliberately
      // consistent labels in the proof panel (e.g. the names of natal positions).
      const actual=lines(card.reading);
      for(const line of [card.title,...actual,...lines(card.lead),...lines(card.contrast)]){
        for(const token of line.matchAll(particleError)){
          const word=token[0];
          const suffix=word.endsWith('으로')?'으로':word.slice(-1);
          const name=word.slice(0,-suffix.length);
          if(!grammaticalTerms.has(name))continue;
          const expected=suffix==='로'||suffix==='으로'?(!supportsFinal(name)||(name.charCodeAt(name.length-1)-0xac00)%28===8?'로':'으로'):
            suffix==='은'||suffix==='는'?(supportsFinal(name)?'은':'는'):(supportsFinal(name)?'이':'가');
          if(suffix!==expected)particles.push([i+1,word]);
        }
      }
      for(const line of actual){
        const key=normalize(line);
        const same=seen.find(other=>other.line===line);
        const near=seen.find(other=>other.month!==i+1&&similar(other.key,key));
        if(same&&same.month!==i+1)duplicateSentences.push([same.month,i+1,line]);
        else if(near)nearSentences.push([near.month,i+1,line]);
        if(same?.month===i+1)withinCard.push([i+1,line]);
        seen.push({line,key,month:i+1});
      }
    }
    return {titles:titleCounts.size,repeatedTitles:[...titleCounts].filter(([,count])=>count>1),duplicateSentences,nearSentences,withinCard,particles};
  }

  function supportsFinal(word){
    const code=word.charCodeAt(word.length-1)-0xac00;
    return code>=0&&code<=11171&&code%28!==0;
  }

  function qualityKey(text){
    return normalize(text).replace(/ /gu,'');
  }

  function create(rows,pillars,topic){
    if(!pillars?.day||!stories.joinedDay[topic]||rows.length!==12)return [];
    const cards=rows.map(row=>analyze(row,topic));
    const usedTitles=new Set(),usedCopy=[];
    return cards.map((card,i)=>{
      const row=rows[i];
      const otherIndex=i>0?i-1:1;
      const other=cards[otherIndex];
      const otherLabel=rows[otherIndex].month+'월';
      const otherReading=other.focus&&other.kind?`${other.focus} · ${other.kind} 관계`:other.emphasis;
      const currentReading=card.focus&&card.kind?`${card.focus} · ${card.kind} 관계`:card.emphasis;
      let difference=`${otherLabel}의 핵심은 ‘${otherReading}’예요.`;
      if(otherReading===currentReading){
        const previous=rows[otherIndex];
        const sameGods=row.top===previous.top&&row.hidden===previous.hidden;
        difference=sameGods?`${otherLabel}과 두드러진 단서를 공유해요. 각 달의 원국·월운 관계는 아래에서 확인할 수 있어요.`:
          `${otherLabel}과 원국에 닿는 방식은 비슷해요. 월운 천간과 지지에서 읽는 십성은 ${previous.top}·${previous.hidden}에서 ${row.top}·${row.hidden} 조합으로 달라져요.`;
      }
      const contrast=[difference,card.context.text].filter(Boolean).join(' ');

      // When the same theme genuinely repeats, use the distinct interaction or
      // the independent hidden stem already present in this month.
      const [guideTitle,guideText]=cues[topic][row.top];
      const [hiddenTitle,hiddenText]=cues[topic][row.hidden];
      const alternatives=[[card.title,card.reading],[guideTitle,guideText],[hiddenTitle,hiddenText]];
      const original=(text)=>lines(text).every(sentence=>!usedCopy.some(previous=>similar(qualityKey(previous),qualityKey(sentence))));
      const [title,chosen]=alternatives.find(([label,line])=>!usedTitles.has(label)&&original(line))||
        alternatives.find(([,line])=>original(line))||alternatives[0];
      usedCopy.push(...lines(chosen));
      usedTitles.add(title);
      return {title,lead:card.lead,contrast,reading:chosen,evidence:card.evidence,key:card.key,focus:card.focus};
    });
  }

  return {create,audit};
});
