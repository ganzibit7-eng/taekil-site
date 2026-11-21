(() => {
  'use strict';
  const el=(tag,text,cls)=>{
    const node=document.createElement(tag);
    if(text)node.textContent=text;
    if(cls)node.className=cls;
    return node;
  };
  const slots=[
    ['year','연주','태어난 해'],['month','월주','태어난 달'],
    ['day','일주','태어난 날'],['hour','시주','태어난 시간']
  ];
  function readGanZhi(value){
    if(typeof value!=='string'||value.length!==2)return null;
    const stem=CHEONGAN[CHEONGAN_HANJA.indexOf(value[0])];
    const branch=JIJI[JIJI_HANJA.indexOf(value[1])];
    return stem&&branch?{name:stem+branch,stem,hanja:value}:null;
  }
  function explainer(text){
    return el('p',text,'report-guide-explainer');
  }
  function chapter(number,title,intro,heading='h2'){
    const page=el('section',null,'report-guide-chapter report-sheet');
    const label=el(heading,title);
    label.tabIndex=-1;
    page.append(el('p','읽기 안내 · '+number+'장','report-folio'),label,el('p',intro));
    return page;
  }
  function chart({pillars={},hourKnown,title='내 만세력부터 읽어봐요',heading}){
    const page=chapter(1,title,'만세력은 태어난 날짜와 시간을 사주에 쓰는 글자로 바꿔 보여주는 달력이에요. 태어난 해·달·날·시간을 각각 두 글자로 적고, 그 한 쌍을 기둥이라고 불러요.',heading);
    const list=el('dl',null,'report-guide-pillars');
    for(const [key,label,hint] of slots){
      const row=el('div',null,key==='day'?'report-guide-day':null);
      const value=readGanZhi(pillars[key]);
      const term=el('dt',label);
      term.append(el('span',hint));
      const description=el('dd');
      if(value)description.append(el('strong',value.name),el('span',value.hanja));
      else description.append(el('span',key==='hour'&&hourKnown===false?'시간 모름':'확인되지 않음'));
      row.append(term,description);
      list.append(row);
    }
    const day=readGanZhi(pillars.day);
    page.append(list,explainer(day
      ?`세 번째 칸이 내 일주예요. 그 첫 글자 ${day.stem}(${day.hanja[0]})을 ‘일간’이라고 하고, 사주에서 다른 글자와의 관계를 살펴볼 때 출발점으로 삼아요.`
      :'세 번째 칸이 태어난 날의 일주예요. 그 첫 글자를 ‘일간’이라고 하고, 사주 풀이의 출발점으로 삼아요.'));
    if(!pillars.hour&&hourKnown===false)page.append(el('p','태어난 시간을 모르면 시주를 비워 두고 확인된 기둥으로 읽어요.'));
    return page;
  }
  function comparison(entries){
    const list=el('dl',null,'report-guide-comparison');
    for(const [label,value] of entries){
      const row=el('div');
      row.append(el('dt',label),el('dd',value));
      list.append(row);
    }
    return list;
  }
  window.TaekilReportGuide={chart,chapter,comparison,explainer,readGanZhi};
})();
