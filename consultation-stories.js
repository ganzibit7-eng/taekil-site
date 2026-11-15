(() => {
  const personas = window.TaekilConsultationPersonas;
  if (!personas) return;

  const stories = {
    love: {
      tone: '#dca7b0',
      title: '가까워질수록 같은 말에 서운하다면',
      scene: '상대는 잠시 혼자 있고 싶다고 했는데, 나는 대화가 끊겼다고 느낍니다. 평소엔 좋은 관계여도 어긋나는 순간마다 같은 말이 오간다면, 서화와 그때 내가 무엇을 기대했는지부터 살펴보세요.',
      points: ['마음을 표현하는 방식과 편안하게 듣는 방식', '서운함을 삼키거나 한꺼번에 전하는 순간', '내가 원하는 것을 부담 없이 말하는 한 문장']
    },
    wealth: {
      tone: '#d6bb80',
      title: '버는 방식만큼 모으는 방식도 나에게 맞게',
      scene: '일이 들어올 때는 곧잘 기회를 잡는데 한 달이 끝나면 남는 돈은 그만큼 늘지 않습니다. 도겸과 수입을 만드는 방식, 돈을 지킬 때 필요한 기준을 각각 펼쳐보세요.',
      points: ['기회를 잡을 때 강점이 드러나는 방식', '수입의 들쭉날쭉함과 부담을 줄일 기준', '혼자 쓰는 돈과 함께 쓰는 돈의 경계']
    },
    career: {
      tone: '#aebedb',
      title: '옮길까, 지금 자리에서 길을 바꿔볼까',
      scene: '이직 제안은 반갑지만 지금 직장에서도 맡고 싶은 일이 생겼습니다. 무진과 평소 힘이 나는 업무를 먼저 짚고, 두 자리에서 실제로 할 수 있는 일을 비교해 보세요.',
      points: ['강점이 살아나는 업무 방식과 결정권', '지금 조직에서 조율해 볼 조건', '새 팀의 역할과 평가 방식에 대해 물을 질문']
    },
    'first-date': {
      tone: '#dfbaa6',
      title: '첫 만남에서 내 속도를 잃지 않는 법',
      scene: '첫 만남이 즐거웠는데 다음 약속을 바로 잡자는 말엔 잠깐 망설여집니다. 하린과 내가 편안하게 마음을 여는 방식부터 알아보고, 다음 만남에서 자연스럽게 확인할 점을 찾아보세요.',
      points: ['마음이 편하게 열리는 대화의 분위기', '연락과 약속을 이어갈 때 맞출 속도', '더 알아가고 싶다는 마음을 전할 표현']
    },
    reunion: {
      tone: '#ceaebd',
      title: '다시 연락하기 전, 달라진 것이 있나요',
      scene: '보낼 문장을 써놓고도 예전과 같은 싸움이 시작될까 봐 멈칫합니다. 이준과 지난 갈등에서 되풀이한 내 반응을 돌아보고, 이번 연락에서 지킬 기준을 정리해 보세요.',
      points: ['갈등 뒤에 반복되는 나의 대화 방식', '다시 이어가기 전에 확인할 실제 변화', '상대의 답을 기다릴 때 지킬 경계'],
      example: 'directoryPreviewReunion'
    },
    marriage: {
      tone: '#dbc18d',
      title: '같이 살기 전에 맞춰볼 생활의 기준',
      scene: '결혼 날짜는 정해졌는데 각자 익숙한 생활비 기준과 주말 계획이 다릅니다. 연서와 내가 중요하게 여기는 생활의 조건을 짚고, 둘이 함께 이야기할 순서를 정해 보세요.',
      points: ['생활비와 공동 지출의 기준', '집안일과 개인 시간에서 기대하는 역할', '가족 일정처럼 미루기 쉬운 대화의 첫 질문']
    },
    'career-start': {
      tone: '#9fbfbf',
      title: '공고 두 장 사이에서 내 첫 일을 고를 때',
      scene: '조건은 비슷해 보이는데 한 곳에서는 고객을 만나고, 다른 곳에서는 자료를 정리하는 일이 많습니다. 해온과 내 강점이 드러나는 환경을 짚어보고 실제 공고를 다시 읽어보세요.',
      points: ['집중하기 쉬운 일의 방식과 환경', '직무 이름 아래에서 살펴볼 실제 업무', '지원서와 면접에서 보여줄 경험의 우선순위']
    },
    'side-job': {
      tone: '#d7b493',
      title: '작게 시작해 볼 수 있는 일부터',
      scene: '주말에 하던 일을 팔아보자는 제안을 받았습니다. 혼자 먼저 시험해 볼지, 아는 사람과 함께 시작할지 고민된다면 태율과 쓸 시간과 맡을 일을 구체적으로 펼쳐보세요.',
      points: ['혼자 할 때와 함께 할 때 드러나는 강점', '시간과 돈을 들이기 전에 검증할 조건', '본업과 병행할 수 있는 일정과 책임 범위']
    },
    saving: {
      tone: '#aec39f',
      title: '하루를 버틴 뒤, 작은 지출이 쌓인다면',
      scene: '야근을 마치면 배달 앱을 켜고, 피곤한 날엔 작은 물건을 하나 더 주문합니다. 다온과 어떤 순간에 지출 기준이 느슨해지는지 짚고 오늘부터 적용할 한 가지를 골라보세요.',
      points: ['내가 결제 전에 자주 망설이는 상황', '가격표에 바로 보이지 않는 배달비와 배송료', '한 달 동안 계속 써볼 소비·저축 기준'],
      example: 'directoryPreviewSaving'
    },
    'career-growth': {
      tone: '#b7bbd6',
      title: '더 큰 역할을 맡기 전에 물어볼 것',
      scene: '팀을 이끌어보라는 제안을 받았지만 일은 늘고 결정권은 그대로일까 걱정됩니다. 시현과 책임이 커질 때의 강점을 짚고, 맡기 전에 확인할 권한과 지원을 정리해 보세요.',
      points: ['책임이 커질 때 힘을 발휘하는 방식', '업무 범위·권한·인력 지원을 구분하는 기준', '제안을 수락하기 전에 건넬 협의 문장']
    }
  };

  function make(tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  for (const card of document.querySelectorAll('#homeDirectory [data-story-topic]')) {
    const key = card.dataset.storyTopic;
    const story = stories[key];
    const view = document.getElementById('view-topic-' + key);
    if (!story || !view) continue;
    const advisor = personas.forTopic(key);
    view.style.setProperty('--story-tone', story.tone);

    const hero = make('header', '', 'consultation-story-hero');
    const frame = make('figure', '', 'consultation-story-film yeonwoo-video-frame');
    const portrait = make('img');
    portrait.src = advisor.portrait;
    portrait.alt = '';
    portrait.loading = 'lazy';
    frame.append(portrait);
    if (advisor.motion?.entry) {
      const video = make('video', '', 'yeonwoo-story-video');
      video.dataset.storyPreviewVideo = '';
      video.dataset.videoSrc = advisor.motion.entry;
      video.poster = advisor.portrait;
      frame.append(video);
    }
    frame.setAttribute('aria-hidden', 'true');

    const title = make('h1', story.title);
    title.id = 'story-title-' + key;
    title.tabIndex = -1;
    view.setAttribute('aria-labelledby', title.id);
    const intro = make('div', '', 'consultation-story-intro');
    intro.append(make('p', advisor.name + ' · ' + advisor.specialty, 'consultation-story-label'), title, make('p', story.scene));
    hero.append(frame, intro);

    const body = make('div', '', 'consultation-story-body');
    const scope = make('section', '', 'consultation-story-scope');
    const points = make('ul');
    story.points.forEach(point => points.append(make('li', point)));
    scope.append(make('h2', '함께 살펴볼 이야기'), points);
    body.append(scope);

    const sample = story.example && document.getElementById(story.example)?.querySelector('figure');
    if (sample) {
      const quote = make('section', '', 'consultation-story-example');
      quote.append(make('h2', '가상 사주로 받은 실제 답변'), sample.cloneNode(true));
      body.append(quote);
    }

    const entry = make('section', '', 'consultation-story-entry');
    const question = make('blockquote', card.dataset.consultationQuestion);
    const start = make('button', '내 사주로 상담 시작하기', 'btn btn-primary');
    start.type = 'button';
    start.dataset.storyStart = key;
    start.setAttribute('data-home-consultation', '');
    entry.append(make('h2', '이 질문으로 시작할 수 있어요'), question, start);
    body.append(entry);
    view.replaceChildren(hero, body);
    const focusTitle = () => { if (view.classList.contains('visible')) title.focus({preventScroll:true}); };
    new MutationObserver(focusTitle).observe(view, {attributes:true,attributeFilter:['class']});
    focusTitle();
  }
})();
