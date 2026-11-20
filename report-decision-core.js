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
    if (tied.length > 1) return {tied:tied.map(candidate=>candidate.day),factors:[]};
    const peopleWeight = candidate=>candidate.people.reduce((sum,person)=>sum+person.weight,0)/candidate.people.length;
    const factors = [
      ['두 사람의 오행',peopleWeight(first),peopleWeight(second)],
      ['일정 유형 가점',first.eventWeight,second.eventWeight],
      ['손없는 날 가점',first.folkWeight,second.folkWeight]
    ].map(([label,firstWeight,secondWeight],i)=>({
      label:i===0&&first.people.length===1?'본인의 오행':label,
      firstWeight,secondWeight
    })).filter(factor=>factor.firstWeight!==factor.secondWeight);
    const baseDifference = Math.round(factors.reduce((sum,factor)=>sum+factor.firstWeight-factor.secondWeight,0)*10)/10;
    return {first,second,factors,baseDifference,difference:first.points-second.points};
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

  return {dateComparison,conversationGuide};
});
