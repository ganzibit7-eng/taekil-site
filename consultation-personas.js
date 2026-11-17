(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TaekilConsultationPersonas = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const profiles = new Map([
    ['yeonwoo', {id:'yeonwoo', name:'연우', specialty:'종합 사주 상담', portrait:'ai-consultant-poster.jpg'}],
    ['seohwa', {id:'seohwa', name:'서화', specialty:'연애·관계', portrait:'assets/portrait-love.jpg',
      motion:{entry:'assets/consultant-seohwa-entry.mp4',chat:'assets/consultant-seohwa-chat.mp4'}, questions:[
      ['새로운 만남', '제 사주로 볼 때 저는 어떤 소통 방식에서 마음을 열기 편한가요? 첫 만남에서 잘 맞는지 살펴볼 기준을 알려주세요.'],
      ['재회 고민', '헤어진 사람에게 다시 연락할지 고민이에요. 제 관계에서 반복되기 쉬운 패턴과 연락 전에 확인할 점을 짚어주세요.'],
      ['관계의 경계', '제 사주에서 가까운 관계의 불편함을 어떻게 다루는 편인지 살펴보고, 제 마음을 전할 문장을 같이 정리해 주세요.']
    ]}],
    ['dogyeom', {id:'dogyeom', name:'도겸', specialty:'재물·소비', portrait:'assets/portrait-wealth.jpg',
      motion:{entry:'assets/consultant-dogyeom-entry.mp4',chat:'assets/consultant-dogyeom-chat.mp4'}, questions:[
      ['소비 습관', '제 사주의 재물 관련 근거로 볼 때 어떤 상황에서 지출이 흔들릴 수 있나요? 먼저 확인할 습관을 알려주세요.'],
      ['저축 계획', '제 사주에서 돈을 모을 때 어떤 방식이 도움이 되는지 살펴보고, 꾸준히 저축할 기준을 정리해 주세요.'],
      ['함께 쓰는 돈', '제 사주에서 가까운 사람과 돈을 쓸 때 어떤 경계가 필요할까요? 공동 지출에 대해 미리 정해 둘 기준을 알려주세요.']
    ]}],
    ['mujin', {id:'mujin', name:'무진', specialty:'직업·진로', portrait:'assets/portrait-career.jpg',
      motion:{entry:'assets/consultant-mujin-entry.mp4',chat:'assets/consultant-mujin-chat.mp4'}, questions:[
      ['이직 판단', '이직을 고민 중입니다. 제 사주를 바탕으로 지금 직장과 새 환경을 비교할 업무 조건을 알려주세요.'],
      ['나에게 맞는 일', '제 사주에서 강점이 드러날 수 있는 업무 방식은 무엇인가요? 직무를 고를 때 직접 확인할 기준을 정리해 주세요.'],
      ['창업·부업', '창업이나 부업을 생각 중입니다. 제 사주로 볼 때 혼자 시작하는 방식과 함께 일하는 방식의 고려할 점을 짚어주세요.']
    ]}],
    ['sodam', {id:'sodam', name:'소담', specialty:'결혼·택일', portrait:'assets/portrait-wedding.jpg',
      motion:{entry:'assets/consultant-sodam-entry.mp4',chat:'assets/consultant-sodam-chat.mp4'}, questions:[
      ['결혼 전 대화', '결혼을 앞두고 있어요. 제 사주로 볼 때 함께 생활을 맞추기 전에 나눠 보면 좋을 관계의 질문을 알려주세요.'],
      ['생활 방식', '제 사주를 바탕으로 결혼 후 가까운 사람과 생활 리듬이나 역할을 맞출 때 어떤 점을 확인하면 좋을까요?'],
      ['택일 준비', '결혼 택일을 준비하고 있어요. 날짜 후보를 고르기 전 필요한 사주 정보와 함께 확인할 실제 조건을 알려주세요.']
    ]}],
    ['harin', {id:'harin', name:'하린', specialty:'새로운 만남', portrait:'assets/topic-first-meeting-illustrated.jpg',
      motion:{entry:'assets/consultant-harin-entry.mp4',chat:'assets/consultant-harin-chat.mp4'}, questions:[
      ['첫 만남의 기준', '제 사주에서 새로운 관계를 열 때 편한 소통 방식과 첫 만남에서 확인할 기준을 알려주세요.'],
      ['관계가 가까워지는 속도', '제 사주를 바탕으로 상대와 가까워지는 속도를 어떻게 조율하면 좋을지 짚어 주세요.'],
      ['먼저 건넬 말', '제가 부담 없이 먼저 말을 건넬 수 있도록, 제 관계 방식에 맞는 문장을 만들어 주세요.']
    ]}],
    ['ijun', {id:'ijun', name:'이준', specialty:'재회 고민', portrait:'assets/topic-reunion-illustrated.jpg',
      motion:{entry:'assets/consultant-ijun-entry.mp4',chat:'assets/consultant-ijun-chat.mp4'}, questions:[
      ['다시 연락하기 전', '제 사주에서 갈등 뒤 반복될 수 있는 반응을 짚고, 다시 연락하기 전에 확인할 점을 알려주세요.'],
      ['달라진 점 확인', '이전과 같은 갈등을 반복하지 않으려면 어떤 행동 변화를 확인해야 할까요?'],
      ['보낼 첫 문장', '재회를 전제하지 않고 마음을 전하고 싶어요. 제가 지킬 경계와 첫 문장을 정리해 주세요.']
    ]}],
    ['yeonseo', {id:'yeonseo', name:'연서', specialty:'결혼 전 생활 준비', portrait:'assets/topic-marriage-preparation-illustrated.jpg',
      motion:{entry:'assets/consultant-yeonseo-entry.mp4',chat:'assets/consultant-yeonseo-chat.mp4'}, questions:[
      ['함께 사는 방식', '제 사주에서 드러나는 생활 방식과 결혼 전에 함께 맞춰볼 기준을 알려주세요.'],
      ['집안일과 역할', '역할과 집안일을 나누기 전에 확인하면 좋을 부분을 제 사주와 연결해 주세요.'],
      ['둘이 나눌 대화', '생활비나 가족 일정처럼 미루기 쉬운 주제를 어떤 순서로 이야기하면 좋을까요?']
    ]}],
    ['haeon', {id:'haeon', name:'해온', specialty:'취업·진로', portrait:'assets/topic-career-start-illustrated.jpg',
      motion:{entry:'assets/consultant-haeon-entry.mp4',chat:'assets/consultant-haeon-chat.mp4'}, questions:[
      ['잘 맞는 업무 방식', '제 사주에서 강점이 잘 드러나는 업무 방식과 실제 채용 공고에서 살펴볼 조건을 알려주세요.'],
      ['직무 후보 비교', '직무 후보를 비교하려고 해요. 제 성향에 맞춰 비교할 기준 세 가지를 알려주세요.'],
      ['지원 준비 순서', '제 사주에서 읽은 강점을 기준으로 지금 준비할 경험이나 자료의 우선순위를 정리해 주세요.']
    ]}],
    ['taeyul', {id:'taeyul', name:'태율', specialty:'창업·부업', portrait:'assets/topic-side-business-illustrated.jpg',
      motion:{entry:'assets/consultant-taeyul-entry.mp4',chat:'assets/consultant-taeyul-chat.mp4'}, questions:[
      ['혼자 시작할지 비교', '제 사주를 바탕으로 혼자 시작하는 방식과 협업하는 방식의 장단점을 비교해 주세요.'],
      ['작게 검증할 조건', '돈과 시간을 많이 쓰기 전에 제 강점을 살려 검증할 조건을 정리해 주세요.'],
      ['겸업과 부담', '본업과 병행하려면 일정과 책임 범위에서 무엇을 먼저 살펴봐야 할까요?']
    ]}],
    ['daon', {id:'daon', name:'다온', specialty:'소비·저축', portrait:'assets/topic-saving-illustrated.jpg',
      motion:{entry:'assets/consultant-daon-entry.mp4',chat:'assets/consultant-daon-chat.mp4'}, questions:[
      ['돈이 새는 상황', '제 사주에서 읽히는 소비 반응과 지출이 커지기 쉬운 상황을 구별해 주세요.'],
      ['꾸준한 저축 습관', '제 성향을 살려 무리 없이 이어갈 저축 기준과 점검 순서를 알려주세요.'],
      ['나눠 쓰는 기준', '가족이나 가까운 사람과 돈을 쓸 때 지킬 기준을 사주 성향과 연결해 주세요.']
    ]}],
    ['sihyeon', {id:'sihyeon', name:'시현', specialty:'승진·역할 변화', portrait:'assets/topic-promotion-illustrated.jpg',
      motion:{entry:'assets/consultant-sihyeon-entry.mp4',chat:'assets/consultant-sihyeon-chat.mp4'}, questions:[
      ['책임이 커질 때', '제 사주에서 큰 책임을 맡을 때 드러나는 강점과 부담을 짚어 주세요.'],
      ['승진 제안 비교', '새 역할의 책임, 권한, 지원 조건을 어떤 순서로 비교하면 좋을지 알려주세요.'],
      ['역할을 협의하는 말', '제 성향에 맞춰 업무 범위와 권한을 먼저 협의할 때 쓸 문장을 정리해 주세요.']
    ]}],
    ['yeoul', {id:'yeoul', name:'여울', specialty:'공부 습관', portrait:'assets/topic-study-routine-portrait.webp', motion:{entry:'assets/consultant-yeoul-intro.mp4',chat:'assets/consultant-yeoul-chat.mp4',chapter:'assets/consultant-yeoul-chapter-film.mp4'}, questions:[["시작을 미뤄요","제 사주를 바탕으로 공부를 미룰 때 어떤 방식으로 첫 단계를 정하면 좋을지 알려주세요. 책상에 앉으면 쉬운 일부터 하게 돼요."],["읽기는 하는데 기억이 잘 안 나요","읽은 내용을 금방 잊어요. 제 사주에서 배운 내용을 정리하거나 직접 설명하는 방식 중 어느 쪽을 먼저 시험해 보면 좋을까요?"],["혼자와 함께 공부를 비교하고 싶어요","혼자 공부할 때와 스터디에서 공부할 때 집중이 달라요. 제 사주를 바탕으로 두 환경을 비교할 기준을 알려주세요."]]}],
    ['seojin', {id:'seojin', name:'서진', specialty:'시험·자격증', portrait:'assets/topic-exam-planning-portrait.webp', motion:{entry:'assets/consultant-seojin-intro.mp4',chat:'assets/consultant-seojin-chat.mp4',chapter:'assets/consultant-seojin-chapter-film.mp4'}, questions:[["계획이 자꾸 밀려요","자격증 시험 공부 계획이 자꾸 밀려요. 제 사주에서 꾸준히 준비할 때 맞는 순서를 짚고 무엇부터 줄이면 좋을지 알려주세요."],["실전에서 시간이 모자라요","시험 공부를 할 때는 아는 문제도 실전처럼 시간을 재면 틀려요. 제 사주에서 평가 압박을 다루는 관점을 적용해 연습 방법을 골라주세요."],["복습할 범위를 못 정하겠어요","시험까지 복습할 범위를 어디까지 잡을지 고민이에요. 제 사주와 공부 방식을 함께 살펴 우선순위를 정해주세요."]]}],
    ['yunseul', {id:'yunseul', name:'윤슬', specialty:'전공·진학', portrait:'assets/topic-major-choice-portrait.webp', motion:{entry:'assets/consultant-yunseul-intro.mp4',chat:'assets/consultant-yunseul-chat.mp4',chapter:'assets/consultant-yunseul-chapter-film.mp4'}, questions:[["끌리는 전공이 두 개예요","진학을 준비하며 두 전공 사이에서 고민 중이에요. 제 사주에서 잘 맞는 공부 방식과 수업을 비교할 기준을 알려주세요."],["잘하는 것과 좋아하는 게 달라요","전공을 고르려는데 좋아하는 공부와 지금까지 잘해온 공부가 달라요. 제 사주를 바탕으로 둘을 시험해 볼 방법을 알려주세요."],["진학 후 할 일을 먼저 보고 싶어요","진학한 뒤 실제 수업과 과제가 저와 맞을지 궁금해요. 제 사주에서 배우는 방식을 살펴보고 수업 안내에서 확인할 조건을 알려주세요."]]}],
    ['jian', {id:'jian', name:'지안', specialty:'새 기술 배우기', portrait:'assets/topic-new-learning-portrait.webp', motion:{entry:'assets/consultant-jian-intro.mp4',chat:'assets/consultant-jian-chat.mp4',chapter:'assets/consultant-jian-chapter-film.mp4'}, questions:[["강의만 계속 보게 돼요","새 기술을 학습 중인데 강의를 보기만 하고 혼자 하면 막혀요. 제 사주를 바탕으로 배운 것을 처음 직접 써볼 방법을 알려주세요."],["연습 방법을 못 고르겠어요","혼자 반복하는 공부와 다른 사람에게 피드백 받는 연습 중 무엇을 먼저 하면 좋을지 제 사주를 바탕으로 비교해 주세요."],["작은 결과물부터 만들고 싶어요","새 기술을 학습하며 작은 결과물부터 만들고 싶어요. 제 사주에서 힘이 붙는 방식과 첫 결과물을 고를 기준을 알려주세요."]]}],
    ['moeun', {id:'moeun', name:'모은', specialty:'독립·첫 살림', portrait:'assets/topic-first-home-portrait.webp', motion:{entry:'assets/consultant-moeun-intro.mp4',chat:'assets/consultant-moeun-chat.mp4',chapter:'assets/consultant-moeun-chapter-film.mp4'}, questions:[["생활비 기준을 먼저 세우고 싶어요","독립을 앞두고 생활비와 준비할 돈의 기준을 잡고 싶어요. 제 사주에서 돈을 나누어 쓰는 방식을 짚고 무엇부터 정하면 좋을지 알려주세요."],["처음부터 다 사려니 부담돼요","첫 살림에서 무엇부터 살지 고민돼요. 제 사주에서 소비 기준이 흔들리기 쉬운 상황과 먼저 고를 항목을 알려주세요."],["공간과 월세 사이에서 고민돼요","넓은 집과 매달 지출이 적은 집 사이에서 고민돼요. 제 사주를 바탕으로 계속 드는 생활비와 실제 생활을 함께 비교할 기준을 알려주세요."]]}],
    ['yisol', {id:'yisol', name:'이솔', specialty:'가족과 거리', portrait:'assets/topic-family-boundaries-portrait.webp', motion:{entry:'assets/consultant-yisol-intro.mp4',chat:'assets/consultant-yisol-chat.mp4',chapter:'assets/consultant-yisol-chapter-film.mp4'}, questions:[["부탁을 거절하기 어려워요","가족 부탁을 거절하기 어려워요. 제 사주를 바탕으로 관계에서 지킬 선을 정하고, 가능한 범위만 말하는 문장을 같이 만들어 주세요."],["연락 빈도를 맞추고 싶어요","가족과 연락하는 빈도를 두고 갈등이 있어요. 제 사주에서 가까운 사람과 관계를 맞춰가는 방식과 대화를 꺼낼 방법을 알려주세요."],["모임과 내 일정이 자주 겹쳐요","가족 모임 일정과 혼자 쓸 시간이 자꾸 겹쳐요. 제 사주를 바탕으로 참석과 역할을 서로 합의할 첫 기준을 알려주세요."]]}],
    ['yuhyeon', {id:'yuhyeon', name:'유현', specialty:'일과 쉼', portrait:'assets/topic-work-rest-portrait.webp', motion:{entry:'assets/consultant-yuhyeon-intro.mp4',chat:'assets/consultant-yuhyeon-chat.mp4',chapter:'assets/consultant-yuhyeon-chapter-film.mp4'}, questions:[["퇴근해도 업무 연락이 신경 쓰여요","퇴근해도 회사 업무 연락을 계속 보게 돼요. 제 사주에서 책임을 맡는 방식을 살피고 업무를 마무리할 기준을 알려주세요."],["남의 일까지 맡게 돼요","직장에서 제 역할과 다른 사람의 업무가 자주 섞여요. 제 사주를 바탕으로 역할을 먼저 확인할 기준을 알려주세요."],["일정이 많을수록 어디서 쉬어야 할지 모르겠어요","업무가 바빠지면 쉴 시간을 못 정해요. 제 사주에서 일을 다루는 방식과 역할을 놓지 못하는 순간에 써볼 기준을 알려주세요."]]}],
    ['soyul', {id:'soyul', name:'소율', specialty:'친구·모임', portrait:'assets/topic-friendships-portrait.webp', motion:{entry:'assets/consultant-soyul-intro.mp4',chat:'assets/consultant-soyul-chat.mp4',chapter:'assets/consultant-soyul-chapter-film.mp4'}, questions:[["모임이 즐겁지만 자주 지쳐요","친구 모임은 좋아하지만 다녀오면 유독 지쳐요. 제 사주를 바탕으로 관계에서 편한 거리와 부담을 줄일 방법을 알려주세요."],["연락하는 쪽이 늘 저예요","친구에게 늘 먼저 연락해서 서운할 때가 있어요. 제 사주에서 관계를 이어가는 방식을 돌아보고 기대를 전할 말을 알려주세요."],["새 모임에서 어색함을 줄이고 싶어요","새로운 모임에 가려고 해요. 제 사주에서 처음 사람과 편하게 가까워지는 방식을 살피고 바로 쓸 수 있는 첫 말을 알려주세요."]]}],
    ['damwon', {id:'damwon', name:'담원', specialty:'이사 준비', portrait:'assets/topic-move-planning-portrait.webp', motion:{entry:'assets/consultant-damwon-intro.mp4',chat:'assets/consultant-damwon-chat.mp4',chapter:'assets/consultant-damwon-chapter-film.mp4'}, questions:[["지금 집과 새 집을 비교하고 싶어요","이사를 준비하고 있어요. 제 사주에서 환경을 바꿀 때 지키면 편한 생활 기준이 뭔지, 지금 집과 새 집을 비교할 방법을 알려주세요."],["이사 준비 순서를 정하고 싶어요","이사 준비 시간이 부족해요. 제 사주를 바탕으로 변화가 많을 때 어떤 조건부터 확인하면 좋을지 정리해 주세요."],["새 동네에서 생활을 시작하기가 걱정돼요","이사한 뒤 익숙한 생활 리듬을 잃을까 걱정돼요. 제 사주에서 변화할 때 지키면 좋은 습관과 첫 행동을 알려주세요."]]}],
    ['giyun', {id:'giyun', name:'기윤', specialty:'개업 계획', portrait:'assets/topic-opening-plan-portrait.webp', motion:{entry:'assets/consultant-giyun-intro.mp4',chat:'assets/consultant-giyun-chat.mp4',chapter:'assets/consultant-giyun-chapter-film.mp4'}, questions:[["문 열기 전에 무엇부터 준비할까요?","개업을 준비하고 있어요. 제 사주에서 일을 시작할 때 강점이 드러나는 방식을 짚고 첫 영업 전에 필요한 준비를 정리해 주세요."],["혼자 맡을 것과 도움받을 것이 헷갈려요","개업하면서 운영을 혼자 맡을지 도움을 받을지 고민이에요. 제 사주를 바탕으로 부담이 되기 쉬운 역할과 나눌 기준을 알려주세요."],["손님이 실제로 찾을지 확인하고 싶어요","개업을 앞두고 고객이 내 서비스에 관심을 가질지 작은 규모로 먼저 시험하고 싶어요. 제 사주에 맞는 방법을 알려주세요."]]}],
    ['jeongon', {id:'jeongon', name:'정온', specialty:'계약 전 점검', portrait:'assets/topic-contract-prep-portrait.webp', motion:{entry:'assets/consultant-jeongon-intro.mp4',chat:'assets/consultant-jeongon-chat.mp4',chapter:'assets/consultant-jeongon-chapter-film.mp4'}, questions:[["맡을 업무가 어디까지인지 모르겠어요","업무 계약을 앞두고 어디까지 맡게 되는지 모르겠어요. 제 사주에서 역할을 감당하는 방식을 살피고 서명하기 전에 물어볼 첫 질문을 알려주세요."],["보수와 부담이 맞는지 궁금해요","업무 조건을 계약서로 받았는데 보수와 부담이 균형이 맞는지 고민이에요. 제 사주를 바탕으로 제안을 비교할 조건을 알려주세요."],["상대에게 확인할 말을 정하고 싶어요","계약 전 업무 범위와 변경 때의 기준을 확인하고 싶어요. 제 사주를 참고해 관계를 해치지 않고 물어볼 말을 만들어 주세요."]]}]
  ]);
  const topics = new Map([
    ['love','seohwa'], ['first-date','harin'], ['reunion','ijun'],
    ['wealth','dogyeom'], ['saving','daon'],
    ['career','mujin'], ['career-start','haeon'], ['side-job','taeyul'], ['career-growth','sihyeon'],
    ['marriage','yeonseo'], ['wedding','sodam'],
    ['study-routine','yeoul'], ['exam-planning','seojin'], ['major-choice','yunseul'], ['new-learning','jian'],
    ['first-home','moeun'], ['family-boundaries','yisol'], ['work-rest','yuhyeon'], ['friendships','soyul'],
    ['move-planning','damwon'], ['opening-plan','giyun'], ['contract-prep','jeongon']
  ]);
  const get = id => profiles.get(id) || profiles.get('yeonwoo');
  const forTopic = topic => get(topics.get(topic));
  return {get, forTopic};
});
