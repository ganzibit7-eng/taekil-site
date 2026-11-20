(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.TaekilDateEntry=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';

  function parse(value) {
    const compact=String(value||'').trim().match(/^(\d{4})(\d{2})(\d{2})$/);
    const separated=String(value||'').trim().match(/^(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})$/);
    const match=compact||separated;
    if (!match) return null;
    const [year,month,day]=match.slice(1).map(Number);
    if (year<1900 || month<1 || month>12 || day<1 || day>31) return null;
    return {year,month,day,iso:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`};
  }

  function gregorian(date) {
    return date && date.day<=new Date(Date.UTC(date.year,date.month,0)).getUTCDate();
  }

  function change(field) {
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function mount(parent,{label,read,apply}) {
    const details=document.createElement('details');
    details.className='date-quick-entry';
    const summary=document.createElement('summary');
    summary.textContent='숫자로 입력';
    summary.setAttribute('aria-label',label+' 숫자로 입력');
    const row=document.createElement('div');
    const input=document.createElement('input');
    input.type='text';
    input.inputMode='numeric';
    input.autocomplete='off';
    input.placeholder='예 19900101';
    input.maxLength=14;
    input.setAttribute('aria-label',label+' 8자리');
    const applyButton=document.createElement('button');
    applyButton.type='button';
    applyButton.textContent='적용';
    const error=document.createElement('p');
    error.setAttribute('role','status');
    const setDate=()=>{
      const date=parse(input.value);
      const message=date ? apply(date) : '연도 4자리, 월과 일을 입력해 주세요. 예 19900101';
      if (message) {
        input.setAttribute('aria-invalid','true');
        error.textContent=message;
        return;
      }
      details.open=false;
      summary.focus({preventScroll:true});
    };
    summary.addEventListener('click',()=>{
      if (details.open) return;
      input.value=read();
      error.textContent='';
      input.removeAttribute('aria-invalid');
    });
    applyButton.addEventListener('click',setDate);
    input.addEventListener('keydown',event=>{
      if (event.key==='Enter') { event.preventDefault(); setDate(); }
    });
    row.append(input,applyButton);
    details.append(summary,row,error);
    parent.after(details);
  }

  function mountParts(row,year,month,day,label) {
    if (!row || !year || !month || !day) return;
    const fields=[year,month,day];
    mount(row,{
      label,
      read:()=>fields.every(el=>el.value)?fields.map(el=>el.value).join('-'):'',
      apply:date=>{
        if (fields.some(field=>field.disabled)) return '생년월일 고정을 먼저 해제해 주세요.';
        if (![...year.options].some(option=>option.value===String(date.year))) return '이 화면에서 선택할 수 있는 연도를 입력해 주세요.';
        const old=fields.map(el=>el.value);
        function assign([y,m,d]) {
          year.value=y; month.value=m; change(year);
          day.value=d; change(day);
        }
        assign([date.year,date.month,date.day]);
        if (!day.value) {
          assign(old);
          return '이 연도와 월에서 선택할 수 있는 날짜를 적어 주세요.';
        }
        return '';
      }
    });
  }

  function mountNative(input,label) {
    if (!input) return;
    mount(input,{
      label,read:()=>input.value,
      apply:date=>{
        if (input.disabled) return '이 날짜는 현재 바꿀 수 없어요.';
        if (!gregorian(date) || (input.min && date.iso<input.min) || (input.max && date.iso>input.max)) {
          return '달력에서 선택할 수 있는 날짜를 입력해 주세요.';
        }
        input.value=date.iso;
        change(input);
        return '';
      }
    });
  }

  if(typeof document!=='undefined') {
    for(const [prefix,label] of [['birth','본인 생년월일'],['partner','상대방 생년월일'],['insight','사주 리포트 생년월일'],['fortune','오늘의 운세 생년월일']]) {
      const year=document.getElementById(prefix+'Year');
      mountParts(year?.parentElement,year,document.getElementById(prefix+'Month'),document.getElementById(prefix+'Day'),label);
    }
    for (const [id,label] of [['exactDateFirst','첫 번째 후보일'],['exactDateSecond','두 번째 후보일'],['rangeStart','기간 시작일'],['rangeEnd','기간 종료일']]) {
      mountNative(document.getElementById(id),label);
    }
  }
  return {parse,gregorian,mountParts,mountNative};
});
