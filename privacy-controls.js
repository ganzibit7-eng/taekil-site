(() => {
  'use strict';
  const ageKey = 'taekilso_age_confirmed_v1';
  let confirmed = false;
  try {
    sessionStorage.removeItem('taekilso_kakao_access_token');
    confirmed = sessionStorage.getItem(ageKey) === 'yes';
  } catch (_) { /* Storage restrictions only prevent restoring confirmation. */ }

  function confirmAge() {
    if (confirmed) return true;
    confirmed = window.confirm('택일소 가입과 개인 정보 입력은 만 14세 이상부터 가능해요. 이용하시는 본인이 만 14세 이상인가요? 만 14세 미만 아동의 정보는 입력하지 말아 주세요.');
    if (confirmed) {
      try { sessionStorage.setItem(ageKey, 'yes'); } catch (_) {}
    }
    return confirmed;
  }

  const protectedViews = '.ai-chat-stage, #view-tool, #view-newyear, #view-support, #view-wedding, #view-moving, #view-opening, #view-contract, #view-compat, #view-today';
  function protectInput(event) {
    const field = event.target.closest?.('input, textarea, select');
    if (!field || !field.closest(protectedViews) || field.disabled || field.readOnly || confirmed) return;
    if (!confirmAge()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      field.blur();
    }
  }
  document.addEventListener('focusin', protectInput, true);
  document.addEventListener('beforeinput', protectInput, true);
  let informed = false;
  function confirmAI() {
    if (!confirmAge()) return false;
    if (!informed) informed = window.confirm('AI 풀이를 위해 사주 계산값, 질문과 필요한 대화를 OpenAI에 암호화해 보냅니다. 오류가 나면 Anthropic에서 대신 처리할 수 있어요. OpenAI는 보안 기록을 기본 최대 30일 보관할 수 있어요. Claude로 전달되면 입력과 답변은 미국에 기본 30일 보관되며, 답변은 다른 국가에서도 생성될 수 있어요. 보안·법적 사유로 더 오래 보관되는 경우가 있어요. 자세한 내용은 개인정보처리방침 8항에서 확인할 수 있어요. AI 풀이를 시작할까요? 취소해도 기본 사주·택일 계산은 이용할 수 있어요.');
    return informed;
  }
  function resetAge() {
    informed = false;
    confirmed = false;
    try { sessionStorage.removeItem(ageKey); } catch (_) {}
  }
  window.TaekilPrivacy = { confirmAge, confirmAI, resetAge };
})();
