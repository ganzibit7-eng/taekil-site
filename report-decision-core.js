((root,factory) => {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.TaekilReportDecision = core;
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';

  function dateComparison(candidates) {
    if (!Array.isArray(candidates) || candidates.length < 2) return null;
    const [first, second] = candidates;
    const tied = candidates.filter(candidate=>candidate.points===first.points);
    const peopleWeight = candidate=>candidate.people.reduce((sum,person)=>sum+person.weight,0)/candidate.people.length;
    const factors = [
      [first.people.length===1?'본인의 오행':'두 사람의 오행 평균',peopleWeight(first),peopleWeight(second)],
      ['일정 유형 가점',first.eventWeight,second.eventWeight],
      ['손없는 날 가점',first.folkWeight,second.folkWeight]
    ].map(([label,firstWeight,secondWeight])=>({label,firstWeight,secondWeight}))
      .filter(factor=>factor.firstWeight!==factor.secondWeight);
    const baseDifference = Math.round(factors.reduce((sum,factor)=>sum+factor.firstWeight-factor.secondWeight,0)*10)/10;
    return {first,second,factors,baseDifference,difference:first.points-second.points,
      ...(tied.length > 1 ? {tied:tied.map(candidate=>candidate.day)} : {})};
  }

  const dateChecks = {
    결혼식: ['식장에 남아 있는 식 시작 시각과 변경·취소 기한을 확인해 보세요.', '양가가 각각 꼭 참석해야 할 분의 일정과 이동 시간을 확인해 보세요.'],
    이사: ['잔금일과 열쇠를 받는 시간이 짐차 출발·도착 시간과 맞는지 확인해 보세요.', '나가는 집과 들어가는 집에서 양쪽이 가능한 이사 시간을 하나씩 적어 겹치는 구간을 확인해 보세요.'],
    개업: ['영업에 필요한 절차와 점검이 이 날짜 전에 끝나는지 확인해 보세요.', '함께 준비하는 분들과 물건을 받는 시각, 첫날 맡을 일을 나눠 적어 보세요.'],
    계약체결: ['서명권자 참석, 계약서 최종본과 이체 마감 시각을 먼저 확인해 보세요.', '양쪽이 다른 조건을 생각하고 있을 수 있으니 계약금 날짜와 변경 조건을 같은 문서에 적어 확인해 보세요.']
  };

  function dateReading(event,candidate) {
    const people=candidate.people.map(person=>{
      const interpretation=person.weight>1
        ? '출생일의 기운과 후보일 기운이 서로 돕는 조합으로 반영됐어요.'
        : person.weight===1
          ? '출생일과 후보일의 오행이 같아, 비슷한 기운이 겹치는 날로 반영됐어요.'
          : '출생일과 후보일의 오행이 조율을 필요로 하는 조합으로 반영됐어요.';
      return {...person,interpretation};
    });
    const uneven=people.length===2 && people.some(person=>person.weight<0) && people.some(person=>person.weight>0);
    const eventFit=candidate.eventWeight>0;
    const folk=candidate.folkWeight>0;
    const check=dateChecks[event];
    return {
      people,
      main:uneven ? '두 사람의 결과가 엇갈리는 후보'
        : people.every(person=>person.weight<0) ? '오행 비교에서 조율할 점이 있는 후보'
        : eventFit && folk ? '일정 유형과 손없는 날 기준이 함께 반영된 후보'
        : eventFit ? '일정 유형의 선호 오행이 반영된 후보'
        : folk ? '손없는 날 가점이 반영된 후보'
        : '출생일과 후보일의 오행 비교가 중심인 후보',
      eventNote:eventFit
        ? `${event}에 우선 반영하는 오행에 ${candidate.element}이 포함돼 가점이 붙었어요.`
        : `후보일의 ${candidate.element} 기운에는 ${event} 유형 가점이 없어요. 이 항목에서 감점되지는 않아요.`,
      folkNote:folk ? `음력 ${candidate.lunarDay}일이 손없는 날에 해당해 민속 기준 가점이 붙었어요.`
        : `음력 ${candidate.lunarDay}일에는 손없는 날 가점이 없어요.`,
      action:check?.[uneven?1:0]
    };
  }

  const conversationSteps = [
    {
      useWhen:'답장이 늦어진 뒤 일정까지 불확실해졌거나, 약속을 정하는 역할이 한쪽에 몰렸을 때 꺼내 보세요.',
      agree:'몇 시까지 알려줄지, 일정이 바뀌면 누가 먼저 연락할지 정해요.',
      evidenceIndex:1
    },
    {
      useWhen:'둘 다 같은 일을 결정하려는데 한 사람은 이유를, 다른 한 사람은 조건이나 시간을 먼저 말할 때 써보세요.',
      agree:'서로 중요하게 보는 기준을 하나씩 말한 뒤, 오늘 결정할 것 한 가지만 고르세요.',
      evidenceIndex:0
    },
    {
      useWhen:'같은 말을 반복하거나 상대방 말을 끝까지 듣기 어려워졌을 때 잠시 멈춰 보세요.',
      agree:'다시 이야기할 시간을 먼저 정하고, 그때는 서로 바꿔볼 행동을 하나씩 말해요.'
    }
  ];

  function conversationGuide(report,index) {
    const step = conversationSteps[index];
    if (!step) return null;
    const evidence = report.evidence?.[step.evidenceIndex];
    return { useWhen:step.useWhen, agree:step.agree,
      basis:evidence ? {title:evidence.title, detail:evidence.relation+' · '+evidence.detail} : null };
  }

  return {dateComparison,dateReading,conversationGuide};
});
