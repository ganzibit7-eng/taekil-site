(() => {
  const personas = window.TaekilConsultationPersonas;
  if (!personas) return;

  const stories = {
    love: {
      tone: '#dca7b0',
      title: '가까워질수록 같은 말에 서운하다면',
      scene: '등을 돌리고 각자 잠들기 전에 두 사람은 언제 다시 이야기할지 정하지 못했습니다. 다음 날 식탁에 놓인 찻잔 두 개 사이에서 서화의 이야기가 시작됩니다.',
      feature: {
        media: 'seohwa',
        chapterDescription: '멀찍이 놓인 두 찻잔 앞에서 잠시 기다리는 서화',
        heading: '어제 못다 한 말',
        notes: [['내가 들은 말', '잠깐 혼자 있고 싶어.'], ['내가 느낀 마음', '이 이야기는 앞으로도 꺼내면 안 되나 봐.']],
        chapters: [
          { label: '다음 날 아침', title: '같은 식탁에 앉았는데 말이 쉽게 나오지 않았어요', paragraphs: [
            '어제는 늦는다는 연락 한 통 때문에 시작됐습니다. 기다리며 걱정했다고 말하려던 문장이 “항상 나만 신경 쓰잖아”로 바뀌었어요. 상대는 잠시 자리를 비웠고, 나는 그게 대화를 끝내겠다는 뜻처럼 들렸습니다.',
            '아침이 되어 기억을 되짚으니, 사실은 화를 낼 이유를 찾기 전에 내가 오늘 밤 어떻게 될지 알고 싶었던 것 같아요. 연락을 기다린 일과 평소 서운했던 일을 한꺼번에 꺼낸 것도 돌아볼 지점입니다.'
          ] },
          { label: '서화와 살펴볼 근거', title: '내가 말하고 싶었던 것과 상대가 들은 것', paragraphs: [
            '서화는 같은 말이 오갔던 최근 장면 하나부터 물어요. 마음이 상하면 곧장 설명하고 싶은지, 잠시 혼자 정리한 뒤에야 이야기하기 쉬운지를 구체적인 행동에서 봅니다.',
            '명식에서는 계산된 일간과 가까운 관계의 반응을 풀이할 수 있는 십성 등을 살피고, 그 해석을 실제 대화와 맞춰 봅니다. “언제 다시 이야기할까”처럼 둘이 합의할 수 있는 문장을 찾는 데 씁니다.'
          ], quote: '우리 잠깐 쉬고 저녁에 다시 얘기할까? 나는 지금 대화가 끝난 것처럼 느껴져서 마음이 급했어.', caption: '대화를 다시 열어보는 말 예시' },
          { label: '오늘 저녁', title: '이번에는 한 가지를 먼저 이야기해요', paragraphs: [
            '연락을 기다리느라 불안했다면 다음에 늦어질 때 편한 연락 방식을 물어보세요. 다툼을 끝내는 방식이 고민이라면 잠시 쉬자는 말 뒤에 대화를 다시 열 시점을 정해볼 수 있습니다.',
            '서운함을 말하는 것 자체가 어렵다면, “어제 연락을 기다리는 동안 걱정했어”처럼 있었던 일을 한 문장에 담아보세요. 내 상황과 가까운 부분을 선택하면 그 질문부터 이어집니다.'
          ] }
        ],
        questionTitle: '어느 장면에서 자주 말이 엇갈리나요?',
        choices: [
          ['연락을 기다릴 때', '연락이 늦으면 상대가 마음이 식었다고 느껴요. 제 사주에서 가까운 관계에서 반복하기 쉬운 반응을 보고, 기대하는 연락 방식을 어떻게 말할지 알려주세요.'],
          ['다툼 뒤에 먼저 말하기 어려워요', '다툰 뒤 상대가 시간을 갖자고 하면 대화가 끝난 것 같아 불안해요. 제 사주에서 갈등을 정리하는 방식과 다시 말을 건넬 때 쓸 문장을 알려주세요.'],
          ['서운함을 쌓아뒀다가 말해요', '서운함을 그때그때 말하기 어려워 한꺼번에 터뜨려요. 제 사주에서 부담을 다루는 방식과 일찍 전할 수 있는 표현을 짚어주세요.']
        ]
      }
    },
    wealth: {
      tone: '#d6bb80',
      title: '버는 방식만큼 모으는 방식도 나에게 맞게',
      scene: '이번 달 일은 많았는데 통장에 남은 돈은 생각보다 적습니다. 도겸은 장부를 펴고 벌기로 한 돈과 오늘 쓸 수 있는 돈부터 나란히 놓아 봅니다.',
      feature: {
        media: 'dogyeom',
        chapterDescription: '장부 옆에 동전을 따로 옮겨 놓는 도겸의 손',
        heading: '월말 장부에 적힌 세 줄',
        receipts: [['이번 주 입금', '180,000원'], ['다음 주 정산 예정', '120,000원'], ['미리 낸 재료비', '75,000원']],
        chapters: [
          { label: '정산이 몰린 주', title: '일을 하나 더 받아야 할지 고민됐어요', paragraphs: [
            '천천히 하려던 일에 주문이 두 건 더 들어왔습니다. 일을 맡으면 일이 풀리는 기분이라 선뜻 받았는데, 고객에게 받을 돈보다 재료비가 먼저 나갑니다. 일정도 겹쳐 원래 하던 일의 마감이 늦어질까 걱정이에요.',
            '장부의 금액을 받은 돈, 받기로 한 돈, 먼저 나가는 돈으로 적으니 다음 주 결정을 바꾸는 것이 무엇인지 드러납니다. 더 열심히 해야 한다는 생각 대신, 지금 기회에서 감당할 수 있는 조건을 살펴볼 차례입니다.'
          ] },
          { label: '도겸과 살펴볼 근거', title: '돈이 들어오는 때의 내 판단을 돌아봅니다', paragraphs: [
            '도겸은 일의 제안이 들어올 때 무엇을 먼저 보는지 물어요. 조건을 충분히 따지고 일을 받는 편인지, 부탁을 거절하기 어려운 편인지, 마감이 겹쳐도 여러 기회를 함께 가져가려는 편인지 살핍니다.',
            '재물에 연결되는 명식 근거를 현재 일의 방식 옆에 놓고 봅니다. 그중 내가 실제로 반복하는 선택을 찾아서 단가나 정산일, 함께 쓰는 비용처럼 다음 제안에서 확인할 수 있는 조건으로 바꿔봅니다.'
          ], quote: '착수 전에 어느 비용을 먼저 내고, 정산은 언제 받을 수 있나요?', caption: '일을 수락하기 전에 확인할 질문 예시' },
          { label: '다음 제안을 받을 때', title: '내가 지킬 조건 하나를 장부 앞에 적어 둡니다', paragraphs: [
            '일을 고르는 게 고민이라면 지난달에 꾸준히 이어진 주문과 유독 부담스러웠던 주문의 차이를 적어보세요. 지출을 감당해야 하는 시기가 문제라면 정산 날짜와 지출이 나가는 날짜를 달력에서 비교할 수 있습니다.',
            '누군가와 같이 벌거나 쓰는 돈이라면 누가 결제하고 어떻게 정산할지 먼저 말해보세요. 막연한 재물운을 기다리는 대신, 내가 실제로 확인할 수 있는 질문이 생깁니다.'
          ] }
        ],
        questionTitle: '장부에서 어떤 문제부터 들여다볼까요?',
        choices: [
          ['수입을 늘릴 기회를 고르고 싶어요', '들어오는 일을 다 받으면 일정이 밀려요. 제 사주에서 수입을 만드는 방식의 강점을 살피고, 다음 일을 고를 기준을 알려주세요.'],
          ['정산이 늦어 부담돼요', '수입은 늘었는데 정산일 전에 재료비가 먼저 나가요. 제 사주에서 돈을 다루는 판단 방식과, 제안을 수락하기 전 확인할 기한과 조건을 짚어주세요.'],
          ['함께 쓰는 돈의 기준이 필요해요', '가까운 사람과 함께 일을 하면서 비용을 먼저 내게 돼요. 제 사주에서 보이는 경계와 공동 비용을 나누기 전에 합의할 기준을 알려주세요.']
        ]
      }
    },
    career: {
      tone: '#aebedb',
      title: '좋은 제안이 왔는데, 옮겨도 될까요?',
      scene: '금요일까지 이직 제안에 답해야 합니다. 지금 팀은 익숙하고, 새 팀은 해보고 싶던 일을 맡긴다고 해요. 무진과 두 자리에서 실제로 일하는 모습을 비교해 보세요.',
      feature: {
        media: 'mujin',
        storyIntro: true,
        chapterDescription: '새벽빛이 드는 서재에서 문서를 살펴보는 무진',
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
        ]
      }
    },
    'first-date': {
      tone: '#dfbaa6',
      title: '첫 만남에서 내 속도를 잃지 않는 법',
      scene: '즐거웠던 첫 만남 끝에 이번 주에 다시 보자는 제안을 받았습니다. 문 앞에서 잠시 멈춘 하린과 함께, 설렘과 내 속도를 함께 지킬 방법을 떠올려 보세요.',
      feature: {
        media: 'harin',
        chapterDescription: '등불이 걸린 정원 문턱에 멈춰 서서 길을 돌아보는 하린',
        heading: '집에 돌아가는 길에 든 마음',
        notes: [['만남이 좋았던 순간', '말이 끊겨도 다음 질문을 재촉하지 않았어요.'], ['잠깐 망설인 순간', '이번 주말에 바로 다시 보자는 말에는 답을 미뤘어요.']],
        chapters: [
          { label: '첫 만남의 끝', title: '좋았다는 말과 천천히 보고 싶다는 마음', paragraphs: [
            '같이 걸을 때에는 말을 급히 채우지 않아도 편안했습니다. 좋아하는 계절 이야기를 하다 자연스럽게 다음 약속이 나왔는데, 이번 주말이라는 말에 웃고만 말았어요. 마음은 열렸지만 일정을 바로 정할 준비는 되지 않았습니다.',
            '집에 도착해 오늘 좋았던 대화를 한 가지 적어봅니다. 내가 좋아한 건 맞장구의 횟수보다 내 이야기를 끝까지 기다려준 태도였어요. 그 작은 장면이 다음 만남에서 무엇을 보고 싶은지 알려줍니다.'
          ] },
          { label: '하린과 살펴볼 근거', title: '어떤 분위기에서 마음이 잘 열리나요', paragraphs: [
            '하린은 처음 보는 사람 앞에서 대화를 이끌 때와 상대가 먼저 말을 걸어 줄 때 각각 어떤 기분이 드는지 물어요. 설레는 순간과 마음이 편해지는 순간에 같은 조건이 있었는지 살핍니다.',
            '일간과 관계를 풀이할 때 쓰는 십성 등의 계산 근거를 대화 경험에 대입해 봅니다. 만남의 속도와 관심을 전할 표현은 그 해석을 바탕으로 실제로 말할 수 있는 크기로 정리합니다.'
          ], quote: '오늘 즐거웠어요. 이번 주는 조금 바빠서, 다음 주에 차 한 잔 함께해도 좋을 것 같아요.', caption: '마음과 속도를 함께 전하는 말 예시' },
          { label: '다음 약속을 정하기 전', title: '한 번 더 보고 싶은 이유를 생각해 봐요', paragraphs: [
            '첫인상 때문에 판단하기 어렵다면 두 번째 만남에서도 편안하게 느끼고 싶은 분위기를 한 가지 골라보세요. 연락이 빨라 부담스럽다면 편안한 연락 리듬을 말했을 때 상대가 어떻게 반응하는지도 볼 수 있습니다.',
            '먼저 말을 건네고 싶다면 대화 중 같이 웃었던 순간을 떠올려 그 이야기로 시작해 보세요. 아직 내게 선명한 고민이 무엇인지 고르면 하린이 그 자리부터 함께 살펴봅니다.'
          ] }
        ],
        questionTitle: '다음 만남에서 가장 궁금한 건 무엇인가요?',
        choices: [
          ['잘 맞는지 보고 싶어요', '첫 만남은 편했는데 어떤 점에서 잘 맞았는지 궁금해요. 제 사주에서 편하게 마음을 여는 방식을 살피고 다음 만남에서 확인할 기준을 알려주세요.'],
          ['가까워지는 속도가 달라요', '상대는 바로 다시 만나고 싶어 하지만 저는 천천히 알아가고 싶어요. 제 사주에서 관계의 속도를 다루는 방식을 짚고 어떻게 말하면 좋을지 알려주세요.'],
          ['내가 먼저 연락하고 싶어요', '첫 만남이 좋았는데 제가 먼저 연락하면 부담이 될까 걱정돼요. 제 사주에서 자연스러운 표현 방식을 보고 첫 문장을 같이 정리해 주세요.']
        ]
      }
    },
    reunion: {
      tone: '#ceaebd',
      title: '쓰고 지운 그 말을 보내도 될까요?',
      scene: '한 달 전 헤어진 사람에게 안부를 쓰고, 아직 보내지 않았습니다. 그리운 마음과 같은 일로 다시 다툴까 걱정되는 마음을 이준과 함께 들여다봅니다.',
      feature: {
        media: 'ijun',
        storyIntro: true,
        chapterDescription: '비 내리는 창가에 편지를 내려놓는 이준의 손',
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
          ['지금 연락하고 싶어요', '헤어진 사람에게 사과하고 싶어 안부를 써뒀어요. 제 사주에서 갈등 뒤 반복하기 쉬운 대화 방식을 짚고, 연락하기 전에 확인할 변화와 지킬 경계를 알려주세요.', {
            media: 'contact',
            description: '비 오는 창가에서 편지의 붉은 끈을 풀고 종이를 펼치는 이준의 손',
            caption: '편지를 펼치고, 이번에 꼭 전하고 싶은 말 하나를 생각합니다.'
          }],
          ['조금 더 기다리고 싶어요', '다시 연락하고 싶지만 이전과 같은 갈등이 걱정돼요. 제 사주에서 관계가 불안할 때 나타나는 내 반응을 짚고, 기다리는 동안 어떤 변화를 확인하면 좋을지 알려주세요.', {
            media: 'wait',
            description: '묶어 둔 편지를 창가에서 나무 상자로 옮겨 담는 이준의 손',
            caption: '편지를 잠시 보관하고, 다시 연락하기 전 달라진 점을 돌아봅니다.'
          }]
        ]
      },
      example: 'directoryPreviewReunion'
    },
    marriage: {
      tone: '#dbc18d',
      title: '같이 살기 전에 맞춰볼 생활의 기준',
      scene: '결혼 날짜를 잡고 처음으로 같은 집에서 평일을 보내봅니다. 익숙하다고 생각했던 저녁 식사와 주말 약속부터 두 사람의 방식이 조금씩 다릅니다.',
      feature: {
        media: 'yeonseo',
        chapterDescription: '한 상에 두 사람 몫의 그릇을 놓는 연서',
        heading: '함께 보낸 첫 일주일',
        notes: [['수요일 저녁', '누가 먼저 돌아올지 모르고 서로 저녁을 기다렸어요.'], ['토요일 아침', '한 사람은 가족을 만나러, 다른 한 사람은 같이 쉬려고 일어났어요.']],
        chapters: [
          { label: '같은 집, 첫 저녁', title: '당연하다고 믿었던 일이 각자 달랐어요', paragraphs: [
            '저녁을 먼저 먹고 쉬는 게 편한 사람과, 조금 늦더라도 기다렸다 함께 먹고 싶은 사람이 마주 앉았습니다. 서로 배려하고 있다 생각했지만 상대가 왜 말없이 움직였는지 마음에 걸렸어요.',
            '며칠 뒤에는 필요한 물건을 누가 사둘지, 가족 행사에는 얼마나 자주 함께 갈지 고민이 생깁니다. 두 사람은 어떤 걸 먼저 이야기해야 다른 일에도 비슷한 기준을 써볼 수 있을지 생각합니다.'
          ] },
          { label: '연서와 살펴볼 근거', title: '두 사람의 생각을 생활의 말로 바꿔봅니다', paragraphs: [
            '연서는 내가 배려했다고 생각한 행동과 상대에게 기대했던 행동을 각각 고릅니다. 돈을 나눠 내는 것과 일을 나눠 맡는 것에서 무엇에 더 민감했는지도 실제 사례를 통해 짚습니다.',
            '명식에서 읽을 수 있는 가까운 관계와 생활 방식의 근거를 대화 위에 올려놓습니다. 서로 처음부터 합의할 항목을 하나 고르고, 그 약속을 다시 이야기할 시점까지 정할 수 있도록 돕습니다.'
          ], quote: '평일 저녁은 각자 챙기고, 같이 먹고 싶은 날에는 낮에 미리 말해볼까?', caption: '작게 시작할 수 있는 약속 예시' },
          { label: '한 주를 더 지내보기', title: '확실한 규칙 하나부터 함께 써봅니다', paragraphs: [
            '생활비가 걱정된다면 이번 달에 함께 쓸 돈의 범위를 정해보고, 집안일이라면 보이는 일과 미리 챙기는 일을 함께 적어보세요. 친정이나 시댁 일정은 둘의 쉬는 시간과 한 달 달력 위에 놓고 볼 수 있습니다.',
            '한 번에 완벽히 정리하기 어려운 항목은 각자 가장 불편한 한 가지를 먼저 말해보세요. 어디에서 대화를 시작하고 싶은지 선택하면 연서에게 이어집니다.'
          ] }
        ],
        questionTitle: '결혼 전에 어떤 이야기를 먼저 나누고 싶나요?',
        choices: [
          ['생활비를 어떻게 나눌지', '결혼 후 서로 익숙한 소비와 생활비 기준이 달라요. 제 사주에서 생활을 맞춰가는 방식을 짚고 공동 지출을 합의할 첫 질문을 알려주세요.'],
          ['집안일과 쉬는 시간', '누가 집안일을 미리 챙기고 언제 각자 쉴지 말하기 어려워요. 제 사주에서 역할 조율에 드러나는 반응과 둘이 시험해볼 기준을 알려주세요.'],
          ['가족 일정과 둘만의 시간', '가족 일정과 둘이 쉬는 날이 자꾸 겹쳐요. 제 사주에서 관계의 부탁을 다루는 방식을 살피고, 배우자와 먼저 나눌 이야기를 짚어주세요.']
        ]
      }
    },
    'career-start': {
      tone: '#9fbfbf',
      title: '공고 두 장 사이에서 내 첫 일을 고를 때',
      scene: '이력서를 쓰기 전에 관심 공고 두 장을 펼쳤습니다. 하나는 현장에서 사람을 만나고, 하나는 자료를 정리해서 팀에 전하는 일. 해온은 지원서보다 먼저 두 곳의 하루를 그려봅니다.',
      feature: {
        media: 'haeon',
        chapterDescription: '아침 안개가 낀 두 갈래 길 앞에서 지도를 펼치는 해온',
        heading: '지원하려는 두 공고',
        offers: [['고객 업무', '매일 문의를 듣고 해결 순서를 정해요.', '예상과 다른 질문을 자주 만나게 돼요.'], ['자료 업무', '자료를 모아서 작은 보고서로 만들어요.', '혼자 정리하는 시간이 길고 마감에 함께 검토해요.']],
        chapters: [
          { label: '이력서를 열기 전', title: '둘 다 할 수 있지만 매일 하고 싶은 일은 뭘까요', paragraphs: [
            '팀 과제에서는 발표하는 날보다 흩어진 의견을 조용히 정리하던 시간이 즐거웠습니다. 반대로 아르바이트에서는 막힌 고객의 문제를 함께 풀 때 하루가 빨리 갔어요. 어느 쪽이 나에게 더 자연스러운지 한 가지 경험으로 판단하기 어려웠습니다.',
            '공고에서 “지원 업무”라고 뭉뚱그린 문장을 표시합니다. 언제 집중하고, 언제 사람을 만나고, 무엇을 끝내야 하는지 물어볼 목록부터 만들어봅니다.'
          ] },
          { label: '해온과 살펴볼 근거', title: '직무 이름 아래에서 실제로 할 일을 읽어요', paragraphs: [
            '해온은 일이 풀렸던 경험을 먼저 묻습니다. 차분히 비교하고 정리하는 데 힘이 붙는지, 바로 질문하고 바꾸는 데 에너지가 생기는지, 도움을 얻는 환경이 어땠는지 차례로 살펴봅니다.',
            '명식에서는 계산된 일간과 일의 반응을 풀이하는 십성을 확인합니다. 해석은 몇 가지 가능한 업무 방식으로 좁히고, 각 공고에 실제로 해당하는지 확인할 면접 질문으로 바꿉니다.'
          ], quote: '신입이 처음 석 달 동안 가장 자주 맡는 업무를 하루 예시로 들려주실 수 있을까요?', caption: '공고에서 빠진 일상을 확인할 질문 예시' },
          { label: '지원하기 전', title: '이번 주에 두 가지 일을 조금씩 해봅니다', paragraphs: [
            '일하는 방식이 궁금하면 서로 다른 일을 삼십 분씩 작게 해봐도 좋습니다. 질문을 요약해 답변 초안을 쓰고, 흩어진 자료를 한 장으로 정리해 본 뒤 어느 쪽에 집중이 잘 됐는지 적어보세요.',
            '후보가 이미 정해져 있다면 업무, 피드백, 성장 기회만 비교해도 지원 순서가 잡힙니다. 지원서에 어떤 경험을 넣을지 고민이라면 자기가 실제로 했던 행동부터 고릅니다.'
          ] }
        ],
        questionTitle: '첫 일을 고르는 데 지금 가장 필요한 건 무엇인가요?',
        choices: [
          ['내가 편한 일의 방식', '사람을 만나는 일과 자료를 정리하는 일 사이에서 고민돼요. 제 사주에서 집중이 잘 되는 업무 환경을 짚고 작게 시험해 볼 방법을 알려주세요.'],
          ['두 직무를 비교할 기준', '지원할 공고 두 장의 조건이 비슷해요. 제 사주에서 읽은 강점을 기준으로 업무 내용, 피드백, 성장 환경을 어떻게 비교할지 알려주세요.'],
          ['지원서에 넣을 경험', '지원서를 쓰는데 어떤 경험을 먼저 보여줄지 모르겠어요. 제 사주에서 잘 발휘할 수 있는 강점과 연결해 사례를 고를 기준을 알려주세요.']
        ]
      }
    },
    'side-job': {
      tone: '#d7b493',
      title: '작게 시작해 볼 수 있는 일부터',
      scene: '주말에 만들던 물건을 아는 사람과 팔아보자는 제안을 받았습니다. 태율은 여러 개를 만들기 전에 작은 견본 하나부터 포장해 봅니다.',
      feature: {
        media: 'taeyul',
        chapterDescription: '작업대 위에서 견본 하나를 포장하는 태율',
        heading: '첫 주말에 할 수 있는 만큼',
        notes: [['만들 수 있는 양', '본업에 지장 없이 한두 개를 만들 수 있어요.'], ['아직 모르는 점', '가격을 붙인 뒤에도 관심을 보일지, 주문이 늘면 누가 응대할지 몰라요.']],
        chapters: [
          { label: '일요일 저녁', title: '좋다는 반응과 실제 주문 사이에는 일이 남아 있어요', paragraphs: [
            '친구가 완성품을 보고 주문을 받아보자고 했습니다. 기뻤지만 재료를 더 사려니 가격, 배송, 문의까지 신경 쓸 일이 눈에 들어왔어요. 친구가 홍보를 맡겠다고 했는데, 첫 문의에는 누가 답할지 이야기하지 않았습니다.',
            '이번 주는 제품 한 개를 만드는 데 걸린 시간을 재고, 누가 얼마에 원하는지 소수에게만 물어봅니다. 해보고 싶은 일과 감당할 수 있는 양을 같은 종이에 써보니 실험 범위가 작아졌습니다.'
          ] },
          { label: '태율과 살펴볼 근거', title: '혼자 잘하는 일과 나눠 맡을 일을 구분합니다', paragraphs: [
            '태율은 본업에서 계획부터 마무리까지 맡을 때 편한 일과, 누군가와 나눠 하면 더 잘 되는 일을 물어요. 몰입한 뒤 회복하는 시간과 예상 밖 일에 대응하는 방식도 함께 봅니다.',
            '명식에서 일과 협업에 연결할 수 있는 근거를 실제 경험에서 확인합니다. 그 판단으로 연락 창구, 제작량, 쓸 수 있는 시간처럼 첫 실험 전에 합의할 조건을 고릅니다.'
          ], quote: '이번 주에는 주문을 두 건까지만 받고, 문의와 제작을 누가 맡을지 먼저 정해볼까요?', caption: '조건이 보이는 작은 실험의 예' },
          { label: '한 번 해본 뒤', title: '계속할지 판단할 기록을 남겨요', paragraphs: [
            '제품이 팔렸는지와 함께 만드는 시간과 대응 부담을 적어보세요. 관심을 받은 이유가 소재인지 가격인지, 누가 무엇을 했을 때 손이 가장 잘 맞았는지도 다음 결정에 도움이 됩니다.',
            '혼자 시작할지, 소량 검증을 할지, 일정부터 조율할지에 따라 첫 질문이 달라집니다. 가장 막히는 하나를 고르고 태율에게 이어 물어볼 수 있어요.'
          ] }
        ],
        questionTitle: '부업을 시작하기 전에 무엇이 가장 걸리나요?',
        choices: [
          ['혼자 할지 함께할지', '지인과 부업을 함께 하자는 제안을 받았어요. 제 사주의 업무와 협업 강점을 보고, 혼자 할 때와 나눠 맡을 때 먼저 합의할 조건을 알려주세요.'],
          ['작게 시험해볼 방법', '완성품에 관심은 있지만 실제 주문이 올지 몰라요. 제 사주에서 힘을 쓰기 좋은 방식으로 돈과 시간을 적게 들여 검증할 순서를 알려주세요.'],
          ['본업과 병행할 시간', '부업이 늘면 본업과 쉬는 시간이 줄어들까 걱정돼요. 제 사주의 일하는 리듬과 책임을 다루는 방식을 짚고 시작 전에 정할 기준을 알려주세요.']
        ]
      }
    },
    saving: {
      tone: '#aec39f',
      title: '피곤한 날엔 왜 더 쉽게 결제할까요?',
      scene: '야근한 저녁에는 배달, 집에 가는 길에는 소액 주문. 한 건씩 보면 작지만 모아 보니 이번 주 저축을 미룰 정도입니다. 다온과 결제 직전의 상황을 되짚어 보세요.',
      feature: {
        media: 'daon',
        storyIntro: true,
        chapterDescription: '등잔불 아래에서 영수증을 정리하는 다온의 손',
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
        ]
      },
      example: 'directoryPreviewSaving'
    },
    'career-growth': {
      tone: '#b7bbd6',
      title: '더 큰 역할을 맡기 전에 물어볼 것',
      scene: '회의가 끝난 뒤 팀을 맡아보라는 말을 들었습니다. 내가 잘할 수 있는 일은 떠오르는데, 어디까지 결정할 수 있는지는 아직 듣지 못했어요.',
      feature: {
        media: 'sihyeon',
        chapterDescription: '업무 문서와 인장 앞에서 붓을 내려놓는 시현',
        heading: '제안을 듣고 남긴 메모',
        notes: [['맡게 될 결과', '다음 분기 일정과 팀의 작업을 책임져요.'], ['확인할 권한', '일마다 담당을 바꾸거나 우선순위를 조정할 수 있는지 아직 몰라요.']],
        chapters: [
          { label: '역할을 제안받은 날', title: '일정은 책임지는데 일의 순서도 정할 수 있을까요', paragraphs: [
            '지난번에는 빈자리를 대신 맡으면서 늦어질 일을 가장 먼저 발견했습니다. 하지만 우선순위를 바꾸려면 승인 단계를 여러 번 거쳐야 했어요. 일정을 책임져야 하는 사람과 결정할 수 있는 사람이 달라서 같은 문제를 반복했습니다.',
            '새 역할을 왜 맡고 싶은지 정리해보니 사람을 이끌고 싶다는 마음도 있었고 막힌 일을 풀기 위해 결정권을 갖고 싶은 마음도 있었습니다. 이제 두 가지가 모두 새 역할에 있는지 물어볼 차례입니다.'
          ] },
          { label: '시현과 살펴볼 근거', title: '책임이 늘었을 때 어떤 강점이 살아났나요', paragraphs: [
            '시현은 일이 몰릴 때 내가 어떤 결정을 가장 먼저 하는지 물어요. 사람 사이의 역할을 맞추는 데 강한지, 결과물을 직접 확인하는 데 집중하는지, 부담을 어디에서 혼자 떠안는지도 살핍니다.',
            '책임을 다루는 방식에 연결되는 확인된 명식 근거를 실제 경험과 비교합니다. 같은 장점이 무리로 이어진 때를 함께 보면 역할을 맡기 전에 요청할 권한이나 지원이 분명해집니다.'
          ], quote: '결과를 책임지는 범위와 사람을 배치할 권한을 같이 정해 주실 수 있을까요?', caption: '역할을 확정하기 전에 할 질문 예시' },
          { label: '답변을 내기 전', title: '책임·권한·지원에 각각 답을 받아봅니다', paragraphs: [
            '맡을 일이 명확해도 기존 일을 누가 가져갈지 확인해야 여유가 보입니다. 권한을 확인했다면 의견이 갈릴 때 누가 마지막 결정을 내리는지도 함께 물어보세요.',
            '처음 두 달을 시험 기간으로 정하고 업무량을 다시 이야기할 수 있습니다. 내 강점부터 보고 싶은지, 조건을 비교하고 싶은지, 말을 꺼내는 문장이 필요한지 고르면 그 질문부터 시작합니다.'
          ] }
        ],
        questionTitle: '새 역할에 대해 무엇부터 알아보고 싶나요?',
        choices: [
          ['책임이 커졌을 때 내 강점', '팀을 맡아보라는 제안을 받아 제가 잘할지 궁금해요. 제 사주에서 책임이 커질 때 강점과 부담이 어디에서 드러나는지 짚어주세요.'],
          ['책임과 권한 비교', '결과는 제가 책임지지만 결정권이 얼마나 생길지 모르겠어요. 제 사주에서 일하는 강점을 보고 책임·권한·지원 조건을 비교할 기준을 알려주세요.'],
          ['조건을 협의할 말', '제안을 받아들이기 전 업무 범위와 지원을 확인하고 싶어요. 제 사주에서 나타나는 소통 방식을 보고 팀장에게 먼저 꺼낼 말을 같이 정리해 주세요.']
        ]
      }
    },
    wedding: {
      tone: '#dbc18d',
      title: '두 날짜가 모두 가능하다면 무엇부터 볼까요?',
      scene: '예식장에서 주말 이틀을 제안했습니다. 둘 다 좋은 날이면 마음이 가는 쪽을 고르면 될 줄 알았는데, 가족이 도착할 시간까지 적어보니 이야기가 달라집니다.',
      feature: {
        media: 'sodam',
        chapterDescription: '등불을 밝혀둔 예식 마당의 입구와 길을 살펴보는 소담',
        heading: '어느 쪽이 두 사람에게 편한 날일까요',
        offers: [['토요일 후보', '멀리서 오는 가족이 당일 이동하기 수월해요.', '예약 가능한 시간은 오전뿐이에요.'], ['일요일 후보', '원하는 오후 시간대를 잡을 수 있어요.', '다음 날 출근하는 하객의 귀가 시간이 늦어져요.']],
        chapters: [
          { label: '예약금을 내기 전', title: '날짜를 고르러 갔다가 동선을 먼저 걸어봤어요', paragraphs: [
            '예식장에 도착하니 주차장에서 식장까지 생각보다 걷는 길이 길었습니다. 여유 있게 오려고 생각했던 토요일 오전에는 첫 차가 늦고, 일요일 오후에는 돌아가는 교통편을 미리 살펴야 했어요.',
            '두 사람은 당일 꼭 지키고 싶은 장면을 하나씩 이야기합니다. 한 사람은 어른들이 무리 없이 오셨으면 했고 다른 한 사람은 준비를 서두르지 않고 가족 사진을 찍고 싶었습니다. 날짜는 두 가지 모두 가능해도 우선순위는 달랐습니다.'
          ] },
          { label: '소담과 살펴볼 기준', title: '두 분의 사주와 예식 조건을 함께 펼쳐봅니다', paragraphs: [
            '두 분의 생년월일과 가능한 후보를 입력하면 날짜마다 나온 계산 근거를 비교할 수 있습니다. 출생시각을 모르면 확인 가능한 범위의 사주를 쓰고, 예시처럼 손없는 날 등 점수에 반영된 조건도 볼 수 있어요.',
            '소담은 계산에서 살펴볼 차이와 가족 이동, 예식장 시간, 변경 조건처럼 직접 확인할 일을 함께 적어봅니다. 실제로 불가능한 날짜를 먼저 빼고 남은 후보를 같은 기준으로 펼쳐보면 이야기할 지점이 분명해집니다.'
          ], quote: '우리에게 꼭 필요한 조건을 하나씩 적고, 그 조건으로 두 날짜를 한 번 더 비교해 봐요.', caption: '예식 날짜를 고르기 전 두 사람이 나눌 말' },
          { label: '두 날짜 중 하나를 정하기 전', title: '가족에게 알리기 전에 확인할 항목을 골라요', paragraphs: [
            '후보가 두세 개면 바로 비교하고, 날짜가 아직 없다면 가능한 기간부터 찾아볼 수 있습니다. 의견이 갈린다면 각자 양보하기 어려운 한 가지를 말해보고, 예약 조건과 비용도 함께 확인해 보세요.',
            '상담을 시작하면 후보 비교, 가족 이동, 준비 순서 중 고른 내용이 첫 질문으로 들어갑니다. 날짜 계산이 먼저 필요하다면 아래 실제 비교 예시에서 내 후보를 바로 넣을 수 있어요.'
          ] }
        ],
        questionTitle: '예식 날짜 때문에 무엇이 가장 고민인가요?',
        choices: [
          ['두 날짜를 비교하고 싶어요', '예식장에서 서로 다른 두 날짜를 제안받았어요. 제 사주를 살필 때 어떤 정보가 더 필요하고, 두 후보를 비교하기 전에 어떤 조건을 확인하면 좋을지 알려주세요.'],
          ['양가 가족의 일정이 달라요', '양가 가족이 편한 예식 시간이 달라서 고민이에요. 제 사주에서 관계를 조율하는 방식을 짚고 날짜를 정하기 전 가족과 이야기할 기준을 알려주세요.'],
          ['택일 준비부터 하고 싶어요', '예식 후보가 아직 없어요. 제 사주를 바탕으로 택일 상담에 필요한 정보와 가족 일정, 예식장 조건을 확인할 순서를 알려주세요.']
        ]
      }
    }
  };

  function make(tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function addFilm(frame, poster, motion, alt = '') {
    const image = make('img');
    image.src = poster;
    image.alt = alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    frame.append(image);
    if (motion) {
      const video = make('video', '', 'yeonwoo-story-video');
      video.dataset.storyPreviewVideo = '';
      video.dataset.videoSrc = motion;
      video.poster = poster;
      frame.append(video);
    }
  }

  function makeScene(feature) {
    const scene = make('section', '', 'consultation-story-scene');
    scene.append(make('h2', feature.heading), make('p', '가상의 상황 예시', 'consultation-story-scene-note'));
    if (feature.message) {
      scene.append(make('blockquote', feature.message, 'consultation-story-letter'));
    } else if (feature.receipts || feature.notes) {
      const list = make('dl', '', feature.receipts ? 'consultation-story-receipt' : 'consultation-story-notes');
      for (const [item, detail] of feature.receipts || feature.notes) {
        const line = make('div');
        line.append(make('dt', item), make('dd', detail));
        list.append(line);
      }
      scene.append(list);
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
      const frame = make('figure', '', 'consultation-story-chapter-film yeonwoo-video-frame');
      const source = 'assets/consultant-' + feature.media + '-chapter-film';
      addFilm(frame, source + '.webp', source + '.mp4', feature.chapterDescription);
      section.append(frame);
    }
    section.append(...chapter.paragraphs.map(paragraph => make('p', paragraph, 'consultation-story-prose')));
    if (chapter.quote) {
      const figure = make('figure', '', 'consultation-story-aside');
      figure.append(make('blockquote', chapter.quote), make('figcaption', chapter.caption));
      section.append(figure);
    }
    return section;
  }

  function makeChoiceScene(scene, media) {
    const figure = make('figure', '', 'consultation-story-choice-scene');
    const frame = make('div', '', 'consultation-story-chapter-film yeonwoo-video-frame');
    const source = 'assets/consultant-' + media + '-choice-' + scene.media;
    addFilm(frame, source + '.webp', source + '.mp4', scene.description);
    const video = frame.querySelector('video');
    video.dataset.storyChoiceVideo = '';
    figure.hidden = true;
    figure.append(frame, make('figcaption', scene.caption));
    return {figure, video};
  }

  function addChoices(entry, feature, key, question, start, context) {
    const choices = make('fieldset', '', 'consultation-story-choices');
    const legend = make('legend', feature.questionTitle);
    legend.tabIndex = -1;
    choices.append(legend);
    const scenes = [];
    let currentScene;
    feature.choices.forEach(([label, text, scene], index) => {
      const option = make('label', '', 'consultation-story-choice');
      const input = make('input');
      input.type = 'radio';
      input.name = 'story-choice-' + key;
      input.dataset.storyQuestion = text;
      const clip = scene && makeChoiceScene(scene, feature.media);
      if (clip) scenes.push(clip.figure);
      const apply = () => {
        question.textContent = text;
        start.dataset.storyQuestion = text;
        context.textContent = label;
        if (currentScene === clip) return;
        if (currentScene) currentScene.figure.hidden = true;
        currentScene = clip;
        if (clip) {
          if (clip.video.currentTime > 0) clip.video.currentTime = 0;
          clip.figure.hidden = false;
        }
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
    entry.append(choices, ...scenes, make('p', '상담 첫 질문으로 이어지는 문장', 'consultation-story-question-label'), question);
    return legend;
  }

  function addJump(container, label, target, focus = target) {
    const jump = make('button', label, 'consultation-story-jump');
    jump.type = 'button';
    jump.addEventListener('click', () => {
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
      focus.focus({preventScroll:true});
      target.scrollIntoView({block:'start', behavior});
    });
    container.append(jump);
  }

  const readingObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.storyReveal = 'shown';
      observer.unobserve(entry.target);
    }
  }, {rootMargin: '0px 0px -104px 0px'}) : null;

  for (const [key, story] of Object.entries(stories)) {
    const isWedding = key === 'wedding';
    const route = document.getElementById(isWedding ? 'view-wedding' : 'view-topic-' + key);
    const view = isWedding ? document.getElementById('weddingStoryIntro') : route;
    if (!route || !view) continue;
    const advisor = personas.forTopic(key);
    const feature = story.feature;
    view.style.setProperty('--story-tone', story.tone);
    view.dataset.storyFeature = key;

    const hero = make('header', '', 'consultation-story-hero');
    const frame = make('figure', '', 'consultation-story-film yeonwoo-video-frame');
    const storyIntro = 'assets/consultant-' + feature.media + '-story';
    addFilm(frame, feature.storyIntro ? storyIntro + '.jpg' : advisor.portrait,
      feature.storyIntro ? storyIntro + '.mp4' : advisor.motion?.entry);
    frame.setAttribute('aria-hidden', 'true');

    const title = make('h1', story.title);
    title.id = 'story-title-' + key;
    title.tabIndex = -1;
    view.setAttribute('aria-labelledby', title.id);
    const intro = make('div', '', 'consultation-story-intro');
    intro.append(make('p', advisor.name + ' · ' + advisor.specialty, 'consultation-story-label'), title, make('p', story.scene));
    hero.append(frame, intro);

    const body = make('div', '', 'consultation-story-body');
    const [opening, reading, closing] = feature.chapters;
    body.append(makeScene(feature), makeChapter(opening), makeChapter(reading, feature));

    const sample = story.example && document.getElementById(story.example)?.querySelector('figure');
    if (sample) {
      const quote = make('section', '', 'consultation-story-example');
      quote.append(make('h2', '가상 사주로 받은 실제 답변'), sample.cloneNode(true));
      body.append(quote);
    }

    const entry = make('section', '', 'consultation-story-entry');
    const question = make('blockquote');
    const dock = make('div', '', 'consultation-story-dock');
    const dockInner = make('div', '', 'consultation-story-dock-inner');
    const dockContext = make('p', '첫 질문 · ', 'consultation-story-dock-context');
    const context = make('span');
    dockContext.id = 'story-dock-context-' + key;
    dockContext.append(context);
    const start = make('button', '내 사주로 상담 시작하기', 'btn btn-primary');
    start.type = 'button';
    start.dataset.storyStart = key;
    start.setAttribute('data-home-consultation', '');
    start.setAttribute('aria-describedby', dockContext.id);
    dockInner.append(dockContext, start);
    dock.append(dockInner);
    const legend = addChoices(entry, feature, key, question, start, context);
    addJump(intro, '내 상황 먼저 고르기', entry, legend);
    if (isWedding) {
      const comparison = document.getElementById('weddingStoryComparison');
      if (comparison) addJump(intro, '날짜 비교 예시 보기', comparison, comparison.querySelector('h3'));
    }
    body.append(makeChapter(closing), entry);
    view.replaceChildren(hero, body, dock);
    if (readingObserver) {
      const readingText = body.querySelectorAll(
        ':is(.consultation-story-scene,.consultation-story-chapter,.consultation-story-example) > :is(h2,p,blockquote,.consultation-story-aside), .consultation-story-example > figure'
      );
      for (const element of readingText) {
        element.dataset.storyReveal = 'waiting';
        readingObserver.observe(element);
      }
    }
    const focusTitle = () => { if (route.classList.contains('visible')) title.focus({preventScroll:true}); };
    new MutationObserver(focusTitle).observe(route, {attributes:true,attributeFilter:['class']});
    focusTitle();
  }
})();
