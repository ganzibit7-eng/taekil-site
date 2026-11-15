(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TaekilConsultationPersonas = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const profiles = new Map([
    ['yeonwoo', {id:'yeonwoo', name:'연우', specialty:'종합 사주 상담', portrait:'ai-consultant-poster.jpg'}],
    ['seohwa', {id:'seohwa', name:'서화', specialty:'연애·관계', portrait:'assets/portrait-love.jpg', questions:[
      ['새로운 만남', '제 사주로 볼 때 저는 어떤 소통 방식에서 마음을 열기 편한가요? 첫 만남에서 잘 맞는지 살펴볼 기준을 알려주세요.'],
      ['재회 고민', '헤어진 사람에게 다시 연락할지 고민이에요. 제 관계에서 반복되기 쉬운 패턴과 연락 전에 확인할 점을 짚어주세요.'],
      ['관계의 경계', '제 사주에서 가까운 관계의 불편함을 어떻게 다루는 편인지 살펴보고, 제 마음을 전할 문장을 같이 정리해 주세요.']
    ]}],
    ['dogyeom', {id:'dogyeom', name:'도겸', specialty:'재물·소비', portrait:'assets/portrait-wealth.jpg', questions:[
      ['소비 습관', '제 사주의 재물 관련 근거로 볼 때 어떤 상황에서 지출이 흔들릴 수 있나요? 먼저 확인할 습관을 알려주세요.'],
      ['저축 계획', '제 사주에서 돈을 모을 때 어떤 방식이 도움이 되는지 살펴보고, 꾸준히 저축할 기준을 정리해 주세요.'],
      ['함께 쓰는 돈', '제 사주에서 가까운 사람과 돈을 쓸 때 어떤 경계가 필요할까요? 공동 지출에 대해 미리 정해 둘 기준을 알려주세요.']
    ]}],
    ['mujin', {id:'mujin', name:'무진', specialty:'직업·진로', portrait:'assets/portrait-career.jpg', questions:[
      ['이직 판단', '이직을 고민 중입니다. 제 사주를 바탕으로 지금 직장과 새 환경을 비교할 업무 조건을 알려주세요.'],
      ['나에게 맞는 일', '제 사주에서 강점이 드러날 수 있는 업무 방식은 무엇인가요? 직무를 고를 때 직접 확인할 기준을 정리해 주세요.'],
      ['창업·부업', '창업이나 부업을 생각 중입니다. 제 사주로 볼 때 혼자 시작하는 방식과 함께 일하는 방식의 고려할 점을 짚어주세요.']
    ]}],
    ['sodam', {id:'sodam', name:'소담', specialty:'결혼·택일', portrait:'assets/portrait-wedding.jpg', questions:[
      ['결혼 전 대화', '결혼을 앞두고 있어요. 제 사주로 볼 때 함께 생활을 맞추기 전에 나눠 보면 좋을 관계의 질문을 알려주세요.'],
      ['생활 방식', '제 사주를 바탕으로 결혼 후 가까운 사람과 생활 리듬이나 역할을 맞출 때 어떤 점을 확인하면 좋을까요?'],
      ['택일 준비', '결혼 택일을 준비하고 있어요. 날짜 후보를 고르기 전 필요한 사주 정보와 함께 확인할 실제 조건을 알려주세요.']
    ]}],
    ['harin', {id:'harin', name:'하린', specialty:'새로운 만남', portrait:'assets/topic-first-meeting-illustrated.jpg', questions:[
      ['첫 만남의 기준', '제 사주에서 새로운 관계를 열 때 편한 소통 방식과 첫 만남에서 확인할 기준을 알려주세요.'],
      ['관계가 가까워지는 속도', '제 사주를 바탕으로 상대와 가까워지는 속도를 어떻게 조율하면 좋을지 짚어 주세요.'],
      ['먼저 건넬 말', '제가 부담 없이 먼저 말을 건넬 수 있도록, 제 관계 방식에 맞는 문장을 만들어 주세요.']
    ]}],
    ['ijun', {id:'ijun', name:'이준', specialty:'재회 고민', portrait:'assets/topic-reunion-illustrated.jpg', questions:[
      ['다시 연락하기 전', '제 사주에서 갈등 뒤 반복될 수 있는 반응을 짚고, 다시 연락하기 전에 확인할 점을 알려주세요.'],
      ['달라진 점 확인', '이전과 같은 갈등을 반복하지 않으려면 어떤 행동 변화를 확인해야 할까요?'],
      ['보낼 첫 문장', '재회를 전제하지 않고 마음을 전하고 싶어요. 제가 지킬 경계와 첫 문장을 정리해 주세요.']
    ]}],
    ['yeonseo', {id:'yeonseo', name:'연서', specialty:'결혼 전 생활 준비', portrait:'assets/topic-marriage-preparation-illustrated.jpg', questions:[
      ['함께 사는 방식', '제 사주에서 드러나는 생활 방식과 결혼 전에 함께 맞춰볼 기준을 알려주세요.'],
      ['집안일과 역할', '역할과 집안일을 나누기 전에 확인하면 좋을 부분을 제 사주와 연결해 주세요.'],
      ['둘이 나눌 대화', '생활비나 가족 일정처럼 미루기 쉬운 주제를 어떤 순서로 이야기하면 좋을까요?']
    ]}],
    ['haeon', {id:'haeon', name:'해온', specialty:'취업·진로', portrait:'assets/topic-career-start-illustrated.jpg', questions:[
      ['잘 맞는 업무 방식', '제 사주에서 강점이 잘 드러나는 업무 방식과 실제 채용 공고에서 살펴볼 조건을 알려주세요.'],
      ['직무 후보 비교', '직무 후보를 비교하려고 해요. 제 성향에 맞춰 비교할 기준 세 가지를 알려주세요.'],
      ['지원 준비 순서', '제 사주에서 읽은 강점을 기준으로 지금 준비할 경험이나 자료의 우선순위를 정리해 주세요.']
    ]}],
    ['taeyul', {id:'taeyul', name:'태율', specialty:'창업·부업', portrait:'assets/topic-side-business-illustrated.jpg', questions:[
      ['혼자 시작할지 비교', '제 사주를 바탕으로 혼자 시작하는 방식과 협업하는 방식의 장단점을 비교해 주세요.'],
      ['작게 검증할 조건', '돈과 시간을 많이 쓰기 전에 제 강점을 살려 검증할 조건을 정리해 주세요.'],
      ['겸업과 부담', '본업과 병행하려면 일정과 책임 범위에서 무엇을 먼저 살펴봐야 할까요?']
    ]}],
    ['daon', {id:'daon', name:'다온', specialty:'소비·저축', portrait:'assets/topic-saving-illustrated.jpg', questions:[
      ['돈이 새는 상황', '제 사주에서 읽히는 소비 반응과 지출이 커지기 쉬운 상황을 구별해 주세요.'],
      ['꾸준한 저축 습관', '제 성향을 살려 무리 없이 이어갈 저축 기준과 점검 순서를 알려주세요.'],
      ['나눠 쓰는 기준', '가족이나 가까운 사람과 돈을 쓸 때 지킬 기준을 사주 성향과 연결해 주세요.']
    ]}],
    ['sihyeon', {id:'sihyeon', name:'시현', specialty:'승진·역할 변화', portrait:'assets/topic-promotion-illustrated.jpg', questions:[
      ['책임이 커질 때', '제 사주에서 큰 책임을 맡을 때 드러나는 강점과 부담을 짚어 주세요.'],
      ['승진 제안 비교', '새 역할의 책임, 권한, 지원 조건을 어떤 순서로 비교하면 좋을지 알려주세요.'],
      ['역할을 협의하는 말', '제 성향에 맞춰 업무 범위와 권한을 먼저 협의할 때 쓸 문장을 정리해 주세요.']
    ]}]
  ]);
  const topics = new Map([
    ['love','seohwa'], ['first-date','harin'], ['reunion','ijun'],
    ['wealth','dogyeom'], ['saving','daon'],
    ['career','mujin'], ['career-start','haeon'], ['side-job','taeyul'], ['career-growth','sihyeon'],
    ['marriage','yeonseo'], ['wedding','sodam']
  ]);
  const get = id => profiles.get(id) || profiles.get('yeonwoo');
  const forTopic = topic => get(topics.get(topic));
  return {get, forTopic};
});
