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
  const elements=['목','화','토','금','수'];
  const stemElements='목목화화토토금금수수';
  const branchElements='수토목목토화화토금금수';
  const formatPercent=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1});
  const motifs={
    목:{color:'잎빛 청록',food:'쑥떡',item:'천 책갈피'},
    화:{color:'벽돌빛 적색',food:'오미자차',item:'색연필'},
    토:{color:'따뜻한 황토색',food:'군고구마',item:'작은 파우치'},
    금:{color:'은은한 은회색',food:'배',item:'금속 클립'},
    수:{color:'먹빛 남색',food:'검은콩차',item:'얇은 손수건'}
  };
  const motifTopics={
    wealth:['돈의 기준을 떠올릴 때','소비 전 지갑을 열 때나, 투자 생각이 자꾸 바뀌는 날에 써보세요.'],
    love:['마음을 전하고 싶을 때','만나기 전에 내가 전하고 싶은 마음을 한 문장으로 정리해 보세요.'],
    reunion:['연락을 보내기 전','초안을 써둔 다음, 내가 원하는 게 답장인지 다시 이어갈 관계인지 짚어보세요.'],
    career:['일의 방향을 고를 때','회의나 면접 전에 내가 맡고 싶은 일과 지키고 싶은 조건을 하나씩 떠올려 보세요.'],
    newyear:['한 해의 기준을 새길 때','새달을 시작할 때 일정표에 이번 달 가장 중요한 약속 하나를 표시해 보세요.'],
    relationship:['두 사람이 대화를 시작할 때','대화가 길어지면 둘이 편하게 돌아올 수 있는 짧은 약속을 함께 정해 보세요.'],
    date:['후보 날짜를 기억할 때','아직 가족·장소·시간과 맞춰야 하는 조건에 표시해 두고 다음 확인을 이어가세요.']
  };
  function readGanZhi(value){
    if(typeof value!=='string'||value.length!==2)return null;
    const stemIndex=CHEONGAN_HANJA.indexOf(value[0]);
    const branchIndex=JIJI_HANJA.indexOf(value[1]);
    const stem=CHEONGAN[stemIndex],branch=JIJI[branchIndex];
    return stem&&branch?{name:stem+branch,stem,branch,hanja:value,
      stemElement:stemElements[stemIndex],branchElement:branchElements[branchIndex]}:null;
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
      if(value){
        for(const [glyph,name,energy] of [[value.hanja[0],value.stem,value.stemElement],[value.hanja[1],value.branch,value.branchElement]]){
          const tile=el('span',null,'report-element-tile');
          tile.dataset.element=energy;
          tile.append(el('strong',glyph),el('span',name+' · '+energy));
          description.append(tile);
        }
      }
      else description.append(el('span',key==='hour'&&hourKnown===false?'시간 모름':'확인되지 않음'));
      row.append(term,description);
      list.append(row);
    }
    const day=readGanZhi(pillars.day);
    page.append(list);
    const distribution=elementDistribution(pillars);
    if(distribution)page.append(distribution);
    page.append(explainer(day
      ?`세 번째 칸이 내 일주예요. 그 첫 글자 ${day.stem}(${day.hanja[0]})을 ‘일간’이라고 하고, 사주에서 다른 글자와의 관계를 살펴볼 때 출발점으로 삼아요.`
      :'세 번째 칸이 태어난 날의 일주예요. 그 첫 글자를 ‘일간’이라고 하고, 사주 풀이의 출발점으로 삼아요.'));
    if(!pillars.hour&&hourKnown===false)page.append(el('p','태어난 시간을 모르면 시주를 비워 두고 확인된 기둥으로 읽어요.'));
    return page;
  }
  function elementDistribution(pillars) {
    const counts=Object.fromEntries(elements.map(energy=>[energy,0]));
    for(const [key] of slots){
      const value=readGanZhi(pillars[key]);
      if(value){counts[value.stemElement]++;counts[value.branchElement]++;}
    }
    const total=Object.values(counts).reduce((sum,count)=>sum+count,0);
    if(!total)return null;
    const chart=el('div',null,'report-element-distribution');
    chart.append(el('strong','오행 분포'),el('p','확인된 글자 '+total+'개에 나타난 오행을 셌어요.'));
    const list=el('dl');
    for(const energy of elements){
      const ratio=counts[energy]/total*100;
      const row=el('div');
      row.dataset.element=energy;
      const data=el('dd');
      const track=el('span',null,'report-element-track');
      track.setAttribute('aria-hidden','true');
      const fill=el('span');
      fill.style.width=ratio+'%';
      track.append(fill);
      data.append(track,el('span',counts[energy]+'개 · '+formatPercent.format(ratio)+'%'));
      row.append(el('dt',energy),data);
      list.append(row);
    }
    chart.append(list);
    return chart;
  }
  function dailyMotif({pair,element,theme,heading='h3',source}) {
    const pillar=readGanZhi(pair);
    const energy=element||pillar?.stemElement;
    const motif=motifs[energy],topic=motifTopics[theme];
    if(!motif||!topic)return null;
    const box=el('section',null,'report-personal-motif report-sheet');
    const origin=source||(pillar?pillar.stem+'('+pillar.hanja[0]+') 일간':'선택한 기운');
    box.append(el('p','생활에 곁들이기','report-folio'),el(heading,topic[0]),
      el('p',topic[1]),comparison([['색',motif.color],['소품',motif.item],['음식',motif.food]]),
      el('p',origin+'의 '+energy+' 기운에서 가져온 상징이에요. 익숙하게 쓰거나 즐길 수 있는 것만 골라도 좋아요.','report-motif-note'));
    return box;
  }
  function documentIndex(targets){
    const index=el('details',null,'report-document-index');
    index.append(el('summary','리포트 목차'));
    const list=el('ol');
    for(const [position,heading] of targets.filter(Boolean).entries()){
      const row=el('li'),button=el('button');
      button.type='button';
      button.append(el('span',String(position+1).padStart(2,'0')),el('span',heading.textContent));
      button.addEventListener('click',()=>{
        index.open=false;
        heading.tabIndex=-1;
        heading.focus({preventScroll:true});
        heading.scrollIntoView({block:'start',behavior:'instant'});
      });
      row.append(button);
      list.append(row);
    }
    index.append(list);
    return index;
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

  function birthDate(profile){
    if(!profile)return null;
    // The saved annual report uses an ISO date already converted to the solar calendar.
    const solarDate=typeof profile.date==='string'&&profile.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const [year,month,day]=(solarDate?solarDate.slice(1):[profile.y,profile.m,profile.d]).map(Number);
    if(![year,month,day].every(Number.isInteger)||year<1||year>9999||month<1||month>12||day<1||day>31)return null;
    const lunar=!solarDate&&profile.calType==='lunar';
    const calendar=lunar?(profile.isLeap?'음력 윤달':'음력'):'양력';
    const value=el(lunar?'span':'time',year+'년 '+month+'월 '+day+'일');
    if(!lunar)value.dateTime=String(year).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const row=el('div',null,'report-birth-date');
    const caption=el('span','생년월일','report-birth-label');
    const date=el('span',null,'report-birth-value');
    date.append(value,el('span',calendar,'report-birth-calendar'));
    row.append(caption,date);
    return row;
  }

  window.TaekilReportGuide={chart,chapter,comparison,explainer,readGanZhi,birthDate,dailyMotif,documentIndex};
})();
