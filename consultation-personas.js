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
    ]}]
  ]);
  const topics = new Map([
    ['love','seohwa'], ['first-date','seohwa'], ['reunion','seohwa'],
    ['wealth','dogyeom'], ['saving','dogyeom'],
    ['career','mujin'], ['career-start','mujin'], ['side-job','mujin'], ['career-growth','mujin'],
    ['marriage','sodam'], ['wedding','sodam']
  ]);
  const get = id => profiles.get(id) || profiles.get('yeonwoo');
  const forTopic = topic => get(topics.get(topic));
  return {get, forTopic};
});
