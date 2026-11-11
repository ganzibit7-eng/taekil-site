/* Public, fixed synthetic example. Reading it never calls the consultation API. */
(()=>{'use strict';const view=document.getElementById('view-newyear');if(!view)return;
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const section=make('section',null,'newyear-example');section.setAttribute('aria-label','신년 리포트 예시');section.append(make('p','신년 리포트 미리보기','newyear-kicker'),make('h2','나의 한 해는, 이렇게 읽습니다.'),make('p','1990년 1월 1일 양력 · 출생시간·성별 미상인 가상 사주로 실제로 생성한 2027년 리포트 예시입니다. 분야별 해설과 열두 달의 흐름을 읽어보세요.','newyear-example-intro'));
 const details=make('details'),summary=make('summary','1990년생의 2027 신년 리포트 읽기'),body=make('div',null,'newyear-example-body');details.append(summary,body);section.append(details,make('p','고정된 예시를 읽는 동안에는 로그인이나 결제가 필요하지 않고, 상담 횟수도 사용하지 않습니다. 실제 리포트는 입력한 사주에 따라 달라집니다.','newyear-muted'));
 view.querySelector('.newyear-account').before(section);
 const position=()=>{const account=view.querySelector('.newyear-account');if(view.classList.contains('has-report'))account.after(section);else account.before(section);};
 new MutationObserver(position).observe(view,{attributes:true,attributeFilter:['class']});position();
 const issuance=make('p','구매 후 상담할 사주를 확인하고 ‘리포트 작성하기’를 누르면 발급됩니다.','newyear-example-issuance');view.querySelector('.newyear-price').after(issuance);
 let loaded=false,loading=false;
 function passage(title,text,action){const s=make('section',null,'newyear-report-section');s.append(make('h3',title),make('p',text));if(action)s.append(make('p',action,'newyear-action'));return s;}
 details.addEventListener('toggle',async()=>{if(!details.open||loaded||loading)return;loading=true;body.replaceChildren(make('p','예시 리포트를 불러오고 있어요.'));
  try{const response=await fetch('/content/newyear-example-1990.json?v=20261111-2');if(!response.ok)throw Error('EXAMPLE_UNAVAILABLE');const data=await response.json(),r=data.report;
   body.replaceChildren(make('p','예시 사주 · 1990.01.01 양력 · 출생시간·성별 미상','newyear-report-owner'),passage('한 해의 큰 흐름',r.overview),passage('나의 사주와 2027년',r.foundation));
   for(const a of r.areas)body.append(passage(a.title,a.reading,a.action));const months=make('section',null,'newyear-months');months.append(make('h3','열두 달, 나의 흐름'));
   for(const m of r.months){const d=make('details'),s=make('summary');s.append(make('span',String(m.month).padStart(2,'0')+'월'),make('strong',m.theme));d.append(s);if(m.calculationNote)d.append(make('p',m.calculationNote,'newyear-month-basis'));d.append(make('p',m.reading),make('p',m.action,'newyear-action'));months.append(d);}body.append(months,passage('기회를 살리는 방법',r.opportunities),passage('조금 더 신중할 때',r.cautions),passage('연우가 전하는 말',r.closing),make('p',data.note,'newyear-muted'));loaded=true;
  }catch(_){body.replaceChildren(make('p','예시를 불러오지 못했어요. 닫았다가 다시 열어 주세요.'));}finally{loading=false;}
 });
})();
