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
      title: '좋은 제안이 왔는데, 옮겨도 될까요?',
      scene: '금요일까지 이직 제안에 답해야 합니다. 지금 팀은 익숙하고, 새 팀은 해보고 싶던 일을 맡긴다고 해요. 무진과 두 자리에서 실제로 일하는 모습을 비교해 보세요.',
      feature: {
        media: 'mujin',
        heading: '두 직장에서 보낼 하루',
        offers: [
          ['지금 직장', '기획부터 실행까지 내가 맡아요.', '다음 분기부터 역할이 넓어질 수 있어요.'],
          ['새 팀의 제안', '해보고 싶던 프로젝트에 합류해요.', '어디까지 결정할 수 있을지는 아직 몰라요.']
        ],
        questionTitle: '두 자리 사이에서 무엇이 가장 고민인가요?',
        choices: [
          ['일하는 방식', '지금은 업무 방식과 일정을 제가 정하는 편이에요. 새 팀에서도 자율성이 중요할지 제 사주에서 업무 강점을 보고, 면접에서 확인할 질문을 알려주세요.'],
          ['역할과 권한', '새 직장에서 더 넓은 역할을 제안받았지만 결정권이 모호해요. 제 사주에서 책임과 권한을 어떤 방식으로 맡을 때 강점이 살아나는지와 협의할 조건을 알려주세요.'],
          ['평가 기준', '지금 팀과 새 팀의 성과 평가 방식이 달라요. 제 사주에서 강점을 꾸준히 발휘할 수 있는 환경을 짚고, 두 곳의 평가 기준을 어떻게 비교할지 알려주세요.']
        ],
        action: '무진과 이직 조건 살펴보기'
      }
    },
    'first-date': {
      tone: '#dfbaa6',
      title: '첫 만남에서 내 속도를 잃지 않는 법',
      scene: '첫 만남이 즐거웠는데 다음 약속을 바로 잡자는 말엔 잠깐 망설여집니다. 하린과 내가 편안하게 마음을 여는 방식부터 알아보고, 다음 만남에서 자연스럽게 확인할 점을 찾아보세요.',
      points: ['마음이 편하게 열리는 대화의 분위기', '연락과 약속을 이어갈 때 맞출 속도', '더 알아가고 싶다는 마음을 전할 표현']
    },
    reunion: {
      tone: '#ceaebd',
      title: '쓰고 지운 그 말을 보내도 될까요?',
      scene: '한 달 전 헤어진 사람에게 안부를 쓰고, 아직 보내지 않았습니다. 그리운 마음과 같은 일로 다시 다툴까 걱정되는 마음을 이준과 함께 들여다봅니다.',
      feature: {
        media: 'ijun',
        heading: '보내지 않은 메시지',
        message: '잘 지내? 그때 내가 왜 그렇게 말했는지, 괜찮다면 한 번 이야기하고 싶어.',
        questionTitle: '지금 어떤 마음에 더 가까운가요?',
        choices: [
          ['지금 연락하고 싶어요', '헤어진 사람에게 사과하고 싶어 안부를 써뒀어요. 제 사주에서 갈등 뒤 반복하기 쉬운 대화 방식을 짚고, 연락하기 전에 확인할 변화와 지킬 경계를 알려주세요.'],
          ['조금 더 기다리고 싶어요', '다시 연락하고 싶지만 이전과 같은 갈등이 걱정돼요. 제 사주에서 관계가 불안할 때 나타나는 내 반응을 짚고, 기다리는 동안 어떤 변화를 확인하면 좋을지 알려주세요.']
        ],
        action: '이준과 재회 고민 살펴보기'
      },
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
      title: '피곤한 날엔 왜 더 쉽게 결제할까요?',
      scene: '야근한 저녁에는 배달, 집에 가는 길에는 소액 주문. 한 건씩 보면 작지만 모아 보니 이번 주 저축을 미룰 정도입니다. 다온과 결제 직전의 상황을 되짚어 보세요.',
      feature: {
        media: 'daon',
        heading: '야근한 주의 영수증',
        receipts: [['늦은 저녁 배달', '18,500원'], ['배달비', '3,500원'], ['퇴근길 소액 주문', '8,900원'], ['합계', '30,900원']],
        questionTitle: '내 소비에서 먼저 보고 싶은 건 무엇인가요?',
        choices: [
          ['야근 뒤 배달', '야근하고 돌아오면 예산을 정해도 배달비까지 결제해요. 제 사주에서 피곤한 날 소비 기준이 흔들리는 패턴을 살피고, 다음 야근 날 적용할 기준을 알려주세요.'],
          ['작은 주문이 반복돼요', '부담 없는 가격이라 생각해 소액 주문을 자주 해요. 제 사주에서 돈을 쓸 때 드러나는 습관을 풀이하고, 어떤 순간에 결제를 하루 미뤄보면 좋을지 알려주세요.'],
          ['저축일을 자꾸 미뤄요', '쓰고 남는 돈을 저축하려다 매번 날짜를 미뤄요. 제 사주에서 계획을 지키기 쉬운 방식을 짚고, 한 달간 실험해 볼 저축 기준을 알려주세요.']
        ],
        action: '다온과 소비 습관 살펴보기'
      },
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

  function makeScene(feature) {
    const scene = make('section', '', 'consultation-story-scene');
    scene.append(make('h2', feature.heading), make('p', '가상의 상황 예시', 'consultation-story-scene-note'));
    if (feature.message) {
      scene.append(make('blockquote', feature.message, 'consultation-story-letter'));
    } else if (feature.receipts) {
      const receipt = make('dl', '', 'consultation-story-receipt');
      for (const [item, price] of feature.receipts) {
        const line = make('div');
        line.append(make('dt', item), make('dd', price));
        receipt.append(line);
      }
      scene.append(receipt);
    } else {
      const offers = make('div', '', 'consultation-story-offers');
      for (const [name, detail, condition] of feature.offers) {
        const offer = make('div');
        offer.append(make('h3', name), make('p', detail), make('p', condition));
        offers.append(offer);
      }
      scene.append(offers);
    }
    return scene;
  }

  function addChoices(entry, feature, key, question, start) {
    const choices = make('fieldset', '', 'consultation-story-choices');
    choices.append(make('legend', feature.questionTitle));
    feature.choices.forEach(([label, text], index) => {
      const option = make('label', '', 'consultation-story-choice');
      const input = make('input');
      input.type = 'radio';
      input.name = 'story-choice-' + key;
      input.dataset.storyQuestion = text;
      const apply = () => {
        question.textContent = text;
        start.dataset.storyQuestion = text;
      };
      input.addEventListener('change', apply);
      if (index === 0) {
        input.checked = true;
        apply();
      }
      option.append(input, make('span', label));
      choices.append(option);
    });
    question.setAttribute('aria-live', 'polite');
    entry.append(choices, make('p', '상담 첫 질문으로 이어지는 문장', 'consultation-story-question-label'), question, start);
  }

  for (const card of document.querySelectorAll('#homeDirectory [data-story-topic]')) {
    const key = card.dataset.storyTopic;
    const story = stories[key];
    const view = document.getElementById('view-topic-' + key);
    if (!story || !view) continue;
    const advisor = personas.forTopic(key);
    const feature = story.feature;
    view.style.setProperty('--story-tone', story.tone);
    if (feature) view.dataset.storyFeature = key;

    const hero = make('header', '', 'consultation-story-hero');
    const frame = make('figure', '', 'consultation-story-film yeonwoo-video-frame');
    const portrait = make('img');
    const poster = feature ? 'assets/consultant-' + feature.media + '-story.jpg' : advisor.portrait;
    portrait.src = poster;
    portrait.alt = '';
    portrait.loading = 'lazy';
    frame.append(portrait);
    const motion = feature ? 'assets/consultant-' + feature.media + '-story.mp4' : advisor.motion?.entry;
    if (motion) {
      const video = make('video', '', 'yeonwoo-story-video');
      video.dataset.storyPreviewVideo = '';
      video.dataset.videoSrc = motion;
      video.poster = poster;
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
    if (feature) {
      body.append(makeScene(feature));
    } else {
      const scope = make('section', '', 'consultation-story-scope');
      const points = make('ul');
      story.points.forEach(point => points.append(make('li', point)));
      scope.append(make('h2', '함께 살펴볼 이야기'), points);
      body.append(scope);
    }

    let exampleSection;
    const sample = story.example && document.getElementById(story.example)?.querySelector('figure');
    if (sample) {
      const quote = make('section', '', 'consultation-story-example');
      const heading = '가상 사주로 받은 실제 답변';
      if (feature) {
        const details = make('details');
        details.append(make('summary', heading), sample.cloneNode(true));
        quote.append(details);
      } else quote.append(make('h2', heading), sample.cloneNode(true));
      if (feature) exampleSection = quote;
      else body.append(quote);
    }

    const entry = make('section', '', 'consultation-story-entry');
    const question = make('blockquote', card.dataset.consultationQuestion);
    const start = make('button', feature?.action || '내 사주로 상담 시작하기', 'btn btn-primary');
    start.type = 'button';
    start.dataset.storyStart = key;
    start.setAttribute('data-home-consultation', '');
    if (feature) addChoices(entry, feature, key, question, start);
    else entry.append(make('h2', '이 질문으로 시작할 수 있어요'), question, start);
    body.append(entry);
    if (exampleSection) body.append(exampleSection);
    view.replaceChildren(hero, body);
    const focusTitle = () => { if (view.classList.contains('visible')) title.focus({preventScroll:true}); };
    new MutationObserver(focusTitle).observe(view, {attributes:true,attributeFilter:['class']});
    focusTitle();
  }
})();
