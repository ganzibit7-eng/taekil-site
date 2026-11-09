/* Editorial examples: no network requests, AI calls or personal data collection. */
(() => {
  const examples = {
    love: ['연애·궁합', '저는 왜 비슷한 이유로 서운해질까요?', '서운했던 순간에 무엇을 기대했는지부터 짚어보면 좋겠어요.\n\n이 예시의 월간은 일간과 같은 병화로, 십신에서는 비견에 해당해요. 관계를 읽을 때는 내 기준과 상대의 기준을 어떻게 맞추는지 살펴볼 수 있는 단서예요. 이것만으로 성격이나 이별을 정할 수는 없어요.\n\n최근 서운했던 상황 하나를 알려주시면, 표현 방식과 기대를 나누어 이야기해볼게요.'],
    money: ['재물', '돈을 벌어도 잘 모이지 않는 것 같아요.', '수입의 크기와 돈이 남는 구조는 따로 살펴볼 필요가 있어요.\n\n예시 명식에서 년간의 기토는 병화 일간을 기준으로 상관에 해당해요. 표현과 결과물을 만드는 방식을 읽는 단서지만, 이것만으로 지출이 많다거나 부자가 될 거라고 판단할 수는 없어요.\n\n일로 버는 돈과 생활에서 쓰는 돈 중, 어느 쪽이 더 고민인지부터 좁혀볼까요?'],
    career: ['직업·이직', '이직을 고민 중인데, 어떤 환경이 저와 맞을까요?', '회사 이름보다 실제로 맡을 역할과 일하는 방식을 먼저 비교해보면 좋겠어요.\n\n예시 사주에는 월간과 일간에 병화가 나란히 있어요. 같은 기운인 비견은 내 방식과 동료와의 관계를 살펴보는 단서가 돼요. 다만 이 요소 하나로 독립적인 일이 무조건 맞는다고 정하지는 않아요.\n\n지금 직장에서는 재량이 적은 점과 협업 방식 중, 어느 쪽이 더 답답하게 느껴지세요?'],
    year: ['올해·내년', '내년에 이직을 준비해도 괜찮을까요?', '준비를 시작할지와 실제로 옮길 시점은 나누어 생각해보세요.\n\n지금 예시에는 원국만 있고 대운·세운 계산값은 없어서, 내년 몇 월이 좋다고 말씀드리기는 어려워요. 대신 병화 일간과 월간 비견을 참고해 어떤 역할과 협업 방식을 비교할지 이야기할 수 있어요.\n\n옮기고 싶은 이유가 연봉인지, 업무 내용인지 먼저 알려주세요. 그 기준에 맞춰 준비할 부분을 살펴볼게요.'],
    date: ['결혼·이사', '이사 날짜가 두 개 남았는데, 어떻게 고를까요?', '두 날짜 모두 실제로 입주할 수 있는 날인지 먼저 확인해주세요.\n\n택일 화면에서 생년월일과 가능한 기간을 넣으면 일진·오행·손없는 날을 기준으로 후보를 비교할 수 있어요. 이 대화에는 아직 후보 날짜 계산 결과가 없으니 어느 날이 더 좋다고 정하지는 않을게요.\n\n계산한 두 날짜를 가져오시면, 결과에 나온 차이를 설명하고 실제 일정과 함께 살펴볼게요.']
  };
  const root = document.getElementById('yeonwooPreview');
  if (!root) return;
  let selected = 'career';
  const question = root.querySelector('[data-preview-question]');
  const answer = root.querySelector('[data-preview-answer]');
  function render(key) {
    if (!examples[key]) return;
    selected = key;
    root.querySelectorAll('[data-preview-topic]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.previewTopic === key));
    });
    question.textContent = examples[key][1];
    answer.textContent = examples[key][2];
    answer.classList.remove('animate');
    requestAnimationFrame(() => answer.classList.add('animate'));
  }
  root.querySelectorAll('[data-preview-topic]').forEach(button => button.addEventListener('click', () => render(button.dataset.previewTopic)));
  root.querySelector('[data-preview-start]').addEventListener('click', async event => {
    window.__pendingCategoryQuestion = examples[selected][1];
    // Existing Kakao redirect restoration already reads this key with a 30-minute expiry.
    try { localStorage.setItem(TODAY_FORTUNE_PENDING_QUESTION_KEY, JSON.stringify({question: examples[selected][1], createdAt: Date.now()})); } catch (_) {}
    await handleHomeChatStart(event.currentTarget);
  });
  render(selected);
})();
