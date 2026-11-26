(() => {
  'use strict';
  function element(tag, text, className) {
    const item = document.createElement(tag);
    if (text) item.textContent = text;
    if (className) item.className = className;
    return item;
  }

  function control(product, usePass) {
    const panel = element('details', '', 'report-coupon-use');
    const body = element('div', '', 'report-coupon-body');
    const entry = element('label', '쿠폰 번호', 'report-coupon-entry');
    const input = element('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.maxLength = 100;
    window.TaekilReportCoupons.enableGiftPaste(input);
    input.placeholder = '받은 쿠폰 번호를 입력해 주세요';
    entry.append(input);
    const register = element('button', '내 계정에 등록', 'btn');
    const apply = element('button', '이 리포트에 쿠폰 1장 사용', 'btn btn-primary');
    register.type = apply.type = 'button';
    const message = element('p', '', 'report-coupon-status');
    message.setAttribute('role', 'status');
    body.append(entry, register, message, apply);
    panel.append(element('summary', '리포트 쿠폰 사용'), body);
    let pass = null;
    let busy = false;
    const owner = accountStore.snapshot();
    const current = () => panel.isConnected && accountStore.current(owner);
    function present(next) {
      pass = next;
      apply.hidden = !pass;
      entry.hidden = register.hidden = !!pass;
    }
    async function run(task) {
      if (busy || !current()) return;
      busy = true;
      register.disabled = apply.disabled = input.disabled = true;
      try {
        await task();
      } catch (error) {
        if (current()) message.textContent = error.message || '쿠폰을 확인하지 못했어요. 다시 시도해 주세요.';
      } finally {
        busy = false;
        register.disabled = apply.disabled = input.disabled = false;
      }
    }
    present(null);
    panel.addEventListener('toggle', () => {
      if (!panel.open) return;
      void run(async () => {
        message.textContent = '등록한 쿠폰을 확인하고 있어요.';
        const available = await window.TaekilReportCoupons.available(product, owner);
        if (!current()) return;
        present(available);
        message.textContent = available ? '이 리포트에 사용할 쿠폰이 있어요.' : '쿠폰을 등록한 뒤 사용할 수 있어요.';
      });
    });
    register.addEventListener('click', () => {
      const code = input.value.trim();
      if (!code) { input.focus(); return; }
      void run(async () => {
        const result = await window.TaekilReportCoupons.redeem(code, owner);
        if (!current()) return;
        input.value = '';
        if (result.pass.product !== product) {
          message.textContent = '다른 리포트용 쿠폰이에요. 내 프로필의 리포트 쿠폰에서 해당 리포트로 이동할 수 있어요.';
          return;
        }
        present(result.pass.state === 'available' ? result.pass : null);
        message.textContent = pass ? '쿠폰이 내 계정에 있어요. 아래 버튼으로 이 리포트에 사용해 주세요.' : '이미 사용한 쿠폰이에요. 내 기록에서 리포트를 확인해 주세요.';
      });
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); register.click(); }
    });
    apply.addEventListener('click', () => {
      if (!pass) return;
      void run(async () => {
        message.textContent = '리포트 열람 권한을 확인하고 있어요.';
        window.TaekilReportCoupons.invalidate();
        try {
          await usePass(pass.couponId, owner);
        } finally {
          window.TaekilReportCoupons.invalidate();
        }
      });
    });
    return panel;
  }
  window.TaekilReportCouponUse = { control };
})();
