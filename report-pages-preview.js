/* Public excerpts from generated fictitious-profile reports. Only published content is shipped. */
(() => {
  'use strict';
  const samples = {
  "seohwa": {
    "title": "열두 달의 연애운",
    "quote": "4월에는 말을 정리하기 좋고, 5월과 6월에는 관계의 속도를 서로 다른 이유로 조절하게 돼요.",
    "rows": [
      [
        "4월",
        "생각을 말로 옮길 때"
      ],
      [
        "5월",
        "익숙한 반응을 살필 때"
      ],
      [
        "6월",
        "대화의 계기를 찾을 때"
      ]
    ],
    "rest": "내게 편한 관계와 마음이 움직이는 시기"
  },
  "ijun": {
    "title": "월별 재회·인연운",
    "quote": "5월에는 걸렸던 지점이, 8월에는 관계의 방향이, 11월에는 다시 연결될 조건이 더 뚜렷해져요.",
    "rows": [
      [
        "5월",
        "반복되는 마찰"
      ],
      [
        "8월",
        "관계의 방향"
      ],
      [
        "11월",
        "다시 이어질 여지"
      ]
    ],
    "rest": "먼저 연락할 때와 기다릴 때의 차이"
  },
  "mujin": {
    "title": "2027년 월별 직업운",
    "quote": "기준을 익히는 달, 기준이 흔들리는 달, 배운 것을 결과로 보여 주는 달의 성격이 달라요.",
    "rows": [
      [
        "3월",
        "평가 기준 익히기"
      ],
      [
        "6월",
        "역할 다시 보기"
      ],
      [
        "9월",
        "개선한 결과 보여주기"
      ]
    ],
    "rest": "이직·승진·직무 전환의 시기"
  },
  "dogyeom": {
    "title": "열두 달의 재물 흐름",
    "quote": "열두 달 가운데 겨울 초입과 가을에는 얻을 여지가, 초여름에는 남길 몫을 줄이는 변수가 더 두드러져요.",
    "bars": [
      [
        "1월",
        81
      ],
      [
        "2월",
        46
      ],
      [
        "3월",
        51
      ],
      [
        "4월",
        49
      ]
    ],
    "rest": "나머지 달의 재물 흐름과 기회·지출의 근거"
  },
  "newyear": {
    "title": "7월 · 각자 고를 범위와 함께 부담할 몫",
    "quote": "여럿이 여행이나 모임을 준비한다면 앞 구간은 개인 취향에 맡길 결정과 모두의 합의가 필요한 결정을 나누는 쪽이에요.",
    "rows": [
      [
        "6월",
        "도움을 받아도 내가 정할 부분"
      ],
      [
        "7월",
        "각자 고를 범위와 함께 부담할 몫"
      ],
      [
        "8월",
        "함께 만드는 물건과 완성 기준"
      ]
    ],
    "rest": "열두 달의 풀이와 올해 눈여겨볼 변화"
  },
  "relationship": {
    "title": "연락이 늦어 마음이 쓰일 때",
    "quote": "저녁에 만나기로 했는데 퇴근 시간이 지났고, 마지막 메시지에 답이 없어요.",
    "rows": [
      [
        "본인",
        "내가 시간을 먼저 제안하면 맞춰주는 경우가 많았죠. 이번에는 언제 편한지 먼저 듣고 싶어요."
      ],
      [
        "상대방",
        "그럼 오늘은 내가 가능한 시간을 보낼게요. 바빠서 늦어질 때는 언제 다시 이야기할 수 있는지도 남겨둘게요."
      ]
    ],
    "rest": "두 사람이 자주 엇갈리는 이유와 장면별 대화 방법"
  },
  "date": {
    "title": "예식 후보일을 비교하면",
    "quote": "2027.05.15 후보가 이 비교에서 가장 높아요. 다음 후보와는 13점 차이예요.",
    "bars": [
      [
        "05.15",
        93
      ],
      [
        "05.16",
        80
      ]
    ],
    "rest": "각 후보의 순위가 갈린 이유와 두 사람의 오행 풀이"
  }
};
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function page(type) {
    const sample = samples[type];
    const article = element('article','paid-page-sample');
    article.dataset.sample = type;
    article.append(element('p','paid-page-caption','유료 본문 발췌 · 가상 사주 예시'),element('h3','',sample.title));
    article.append(element('blockquote','',sample.quote));
    const list = element('dl','paid-page-rows');
    for (const [key,value] of sample.bars || sample.rows) {
      const row = element('div');
      row.append(element('dt','',key));
      const detail = element('dd');
      if (sample.bars) {
        const meter = element('span','paid-page-track');
        const fill = element('i');
        fill.style.width = value+'%';
        meter.setAttribute('aria-hidden','true');
        meter.append(fill);
        detail.append(meter,element('strong','',value+'점'));
      } else detail.textContent = value;
      row.append(detail);
      list.append(row);
    }
    article.append(list);
    const ending = element('div','paid-page-mask');
    const lines = element('div','paid-page-unread');
    lines.setAttribute('aria-hidden','true');
    lines.append(element('i'),element('i'),element('i'));
    ending.append(lines,element('p','','전체 리포트에서 이어 읽기'),element('strong','',sample.rest));
    article.append(ending);
    return article;
  }
  window.TaekilPaidPageSample = page;
})();
