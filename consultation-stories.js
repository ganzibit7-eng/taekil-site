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
        illustrationAlt: '새벽빛이 드는 서재에서 문서를 펼쳐 살펴보는 무진',
        heading: '두 직장에서 보낼 하루',
        offers: [
          ['지금 직장', '기획부터 실행까지 내가 맡아요.', '다음 분기부터 역할이 넓어질 수 있어요.'],
          ['새 팀의 제안', '해보고 싶던 프로젝트에 합류해요.', '어디까지 결정할 수 있을지는 아직 몰라요.']
        ],
        chapters: [
          {
            label: '답장 전날',
            title: '제안서에 적힌 일과 실제로 하게 될 일',
            paragraphs: [
              '오전 회의가 끝나자 팀장이 다음 분기 프로젝트를 맡아보겠냐고 묻습니다. 지금 팀에서는 고객을 만나 문제를 정리하고 실행 순서까지 직접 정해왔어요. 다만 다음 역할이 언제 시작될지는 아직 모릅니다.',
              '퇴근 후에는 새 회사의 제안서를 다시 펼칩니다. 오래 해보고 싶었던 사업이지만, 면접에서 들은 “다 같이 결정하는 팀”이라는 말이 마음에 걸려요. 입사 후 첫 일주일에 내가 어떤 일을 맡고 어디까지 정할 수 있을지 적어보니, 두 자리에서 묻고 싶은 것이 달라집니다.'
            ]
          },
          {
            label: '무진과 살펴볼 근거',
            title: '어떤 일을 했을 때 내 판단이 빛났나요',
            paragraphs: [
              '무진은 먼저 일이 잘 풀렸던 하루를 물어요. 흩어진 요청을 정리할 때였는지, 계획을 실제 결과로 바꿀 때였는지, 의견이 다른 사람들 사이에서 기준을 잡을 때였는지요.',
              '명식에서는 일간과 주변 십성처럼 일의 방식에 연결해 볼 수 있는 요소를 살핍니다. 풀이에서 드러난 강점을 실제로 해낸 일에 대입해 보고, 새 자리에서도 그 일을 해볼 권한과 지원이 있는지 확인할 질문으로 바꿉니다.'
            ],
            quote: '제가 입사하면 첫 석 달 동안 어떤 결과를 맡고, 어떤 결정까지 직접 내릴 수 있나요?',
            caption: '새 팀에 물어볼 질문 예시'
          },
          {
            label: '금요일에 남길 메모',
            title: '놓치고 싶지 않은 조건부터 정해 보세요',
            paragraphs: [
              '일하는 순서를 내가 정할 수 있는 게 중요하다면, 두 팀의 승인 과정부터 비교해요. 역할을 넓히는 게 목표라면 직함 옆에 업무 범위와 결정권을 나란히 써봅니다. 평가가 가장 걱정된다면 누가 무엇을 보고 첫 석 달을 평가하는지 물어보세요.',
              '지금 팀에서도 같은 기준으로 답을 받아두면 마음이 흔들리는 이유가 또렷해집니다. 아직 확인할 조건이 있다면 답변 기한을 하루 더 요청할 수도 있어요.'
            ]
          }
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
        illustrationAlt: '비 내리는 창가에 내려놓은 자주색 끈으로 묶인 편지',
        heading: '보내지 않은 메시지',
        message: '잘 지내? 그때 내가 왜 그렇게 말했는지, 괜찮다면 한 번 이야기하고 싶어.',
        chapters: [
          {
            label: '메시지를 쓴 밤',
            title: '안부 한 줄을 쓰는데 지난 대화가 떠올랐어요',
            paragraphs: [
              '마지막 다툼에서 상대는 대화를 잠시 멈추고 싶다고 했습니다. 그 말을 듣고 마음이 멀어졌다고 생각해 답을 재촉했고, 상대는 더 조용해졌어요. 한 달이 지난 오늘은 같은 장면을 떠올리며 그때 내가 정말 듣고 싶었던 말이 무엇이었는지 처음 생각해 봅니다.',
              '처음에는 “나도 많이 힘들었어”라고 쓰려다 지웠어요. 미안하다는 말을 건네고 싶은 건지, 다시 만나자는 답을 받고 싶은 건지 스스로에게 먼저 물었습니다. 두 마음이 다 있다는 걸 알아차리고 나니, 어디까지를 이번 연락에 담을지 조금 선명해집니다.'
            ],
            quote: '답장이 늦거나 오지 않아도, 이 한 문장을 보낸 마음을 스스로 받아들일 수 있을까요?',
            caption: '보내기 전에 스스로에게 물어볼 말'
          },
          {
            label: '이준과 살펴볼 근거',
            title: '예전에 같은 말로 돌아간 순간부터',
            paragraphs: [
              '이준은 그리웠던 날과 관계에서 긴장했던 날을 짧게 나눠 들여다봅니다. 연락 간격이 조금만 길어져도 이유를 묻게 됐는지, 서운한 말을 참다가 한 번에 전했는지처럼 구체적인 장면이 풀이의 출발점이 돼요.',
              '예시 답변에서는 월지 지장간에 계산된 정관을 책임과 기준의 관점으로 풉니다. 그 해석을 실제 갈등에 대입해 내가 기대했던 약속이 무엇이고, 그 약속을 어떻게 이야기해 볼 수 있는지 정리합니다.'
            ]
          },
          {
            label: '메시지를 보내기 전',
            title: '연락한 뒤에도 지킬 수 있는 기준이 있나요',
            paragraphs: [
              '지금 연락하고 싶다면 전하고 싶은 말 하나를 남겨보세요. 대화할 의향을 한 번 묻고, 답을 줄 시간도 상대에게 남겨두는 방식입니다. 상대가 이미 연락을 원하지 않는다고 말했다면 그 의사를 존중해 주세요.',
              '조금 더 기다리고 싶다면 시간이 얼마나 흘렀는지와 함께 달라진 행동을 살펴보세요. 비슷하게 불안한 상황에서 내 마음을 어떻게 말해봤는지, 예전과 달리 서로가 지킬 수 있는 약속이 생겼는지가 기준이 될 수 있어요.'
            ]
          }
        ],
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
        illustrationAlt: '등잔불 아래 펼친 영수증과 장부, 종이를 정리하는 다온의 손',
        heading: '야근한 주의 영수증',
        receipts: [['늦은 저녁 배달', '18,500원'], ['배달비', '3,500원'], ['퇴근길 소액 주문', '8,900원'], ['합계', '30,900원']],
        chapters: [
          {
            label: '금요일 퇴근길',
            title: '8,900원을 결제한 뒤 저축 알림을 미뤘어요',
            paragraphs: [
              '물건을 주문할 때는 이번 한 번쯤 괜찮겠다고 생각했어요. 며칠 전 야근 뒤에는 지하철에서 배달을 주문하면서 배달비까지 눌렀고요. 그런데 저축할 날이 되자 같은 주에 있었던 결제가 한꺼번에 떠올랐습니다.',
              '영수증 옆에 결제 이유를 적어 봅니다. 배달 메뉴는 고민을 멈추고 빨리 쉬고 싶어서, 소액 주문은 할인 표시를 놓치기 싫어서였어요. 같은 주에 쓴 돈이어도 버튼을 누르게 만든 이유는 달랐습니다.'
            ]
          },
          {
            label: '다온과 살펴볼 근거',
            title: '장부에 금액 대신 한 줄을 더 적는다면',
            paragraphs: [
              '다온은 자주 돈을 쓰는 곳과 소비 기준이 흔들리는 순간을 나눠 묻습니다. 바쁜 날에는 시간을 사는 데 돈을 쓰고, 여유로운 날에는 할인 품목을 오래 보는 사람이라면 같은 규칙을 두 상황에 적용하기 어렵기 때문이에요.',
              '상담에서는 재물과 관련해 확인된 명식의 근거를 평소 선택과 함께 살펴봅니다. 풀이에서 나온 가설은 사용자가 떠올린 결제 장면과 대조하고, 다음에 비슷한 상황이 왔을 때 써볼 한 가지 행동으로 이어갑니다.'
            ],
            quote: '그날 장바구니에서 가장 급했던 건 끼니였나요, 쉬는 시간이었나요?',
            caption: '결제 직전의 상황을 돌아보는 질문 예시'
          },
          {
            label: '다음 주에 해볼 작은 실험',
            title: '세 가지를 한꺼번에 바꾸지 않아도 돼요',
            paragraphs: [
              '야근 뒤 배달이 반복된다면 배달비까지 포함해 편하게 낼 금액을 퇴근 전에 정해볼 수 있어요. 소액 주문이 고민이라면 물건 하나를 장바구니에 남겼다가 다음 날에도 필요한지 보는 방법이 있습니다.',
              '저축을 미루는 날이 반복된다면 급여가 들어오는 날에 부담 없는 금액부터 옮기고, 남은 생활비로 한 주를 보내보세요. 어느 순간이 가장 자주 돌아오는지 고르면 다온과 그 상황부터 이야기할 수 있어요.'
            ]
          }
        ],
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

  function makeChapter(chapter, feature) {
    const section = make('section', '', 'consultation-story-chapter');
    section.append(make('p', chapter.label, 'consultation-story-label'), make('h2', chapter.title));
    if (feature) {
      const image = make('img', '', 'consultation-story-illustration');
      image.src = 'assets/consultant-' + feature.media + '-chapter.webp';
      image.alt = feature.illustrationAlt;
      image.width = 960;
      image.height = 640;
      image.loading = 'lazy';
      image.decoding = 'async';
      section.append(image);
    }
    section.append(...chapter.paragraphs.map(paragraph => make('p', paragraph, 'consultation-story-prose')));
    if (chapter.quote) {
      const figure = make('figure', '', 'consultation-story-aside');
      figure.append(make('blockquote', chapter.quote), make('figcaption', chapter.caption));
      section.append(figure);
    }
    return section;
  }

  function addChoices(entry, feature, key, question, start) {
    const choices = make('fieldset', '', 'consultation-story-choices');
    const legend = make('legend', feature.questionTitle);
    legend.tabIndex = -1;
    choices.append(legend);
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
    return legend;
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
      const [opening, reading] = feature.chapters;
      body.append(makeScene(feature), makeChapter(opening), makeChapter(reading, feature));
    } else {
      const scope = make('section', '', 'consultation-story-scope');
      const points = make('ul');
      story.points.forEach(point => points.append(make('li', point)));
      scope.append(make('h2', '함께 살펴볼 이야기'), points);
      body.append(scope);
    }

    const sample = story.example && document.getElementById(story.example)?.querySelector('figure');
    if (sample) {
      const quote = make('section', '', 'consultation-story-example');
      quote.append(make('h2', '가상 사주로 받은 실제 답변'), sample.cloneNode(true));
      body.append(quote);
    }

    const entry = make('section', '', 'consultation-story-entry');
    const question = make('blockquote', card.dataset.consultationQuestion);
    const start = make('button', feature?.action || '내 사주로 상담 시작하기', 'btn btn-primary');
    start.type = 'button';
    start.dataset.storyStart = key;
    start.setAttribute('data-home-consultation', '');
    if (feature) {
      body.append(makeChapter(feature.chapters.at(-1)));
      const legend = addChoices(entry, feature, key, question, start);
      const jump = make('button', '내 상황 먼저 고르기', 'consultation-story-jump');
      jump.type = 'button';
      jump.addEventListener('click', () => {
        const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
        legend.focus({preventScroll:true});
        entry.scrollIntoView({block:'start', behavior});
      });
      intro.append(jump);
    } else entry.append(make('h2', '이 질문으로 시작할 수 있어요'), question, start);
    body.append(entry);
    view.replaceChildren(hero, body);
    const focusTitle = () => { if (view.classList.contains('visible')) title.focus({preventScroll:true}); };
    new MutationObserver(focusTitle).observe(view, {attributes:true,attributeFilter:['class']});
    focusTitle();
  }
})();
