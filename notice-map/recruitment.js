'use strict';
// Derive status from recorded application windows, never publication/alarm dates.
function recruitmentStatus(recruitment, now=Date.now()) {
 const periods=recruitment?.periods||[];
 if(!periods.length)return 'unknown';
 if(periods.some(p=>now>=Date.parse(p.start)&&now<Date.parse(p.end)))return 'open';
 return periods.some(p=>now<Date.parse(p.start))?'upcoming':'closed';
}
// A notice can have different application windows for different regions.
function recruitmentForUnit(recruitment, unit) {
 const periods=recruitment?.periods||[];
 if(!unit||!periods.some(period=>period.sourceText))return recruitment;
 const facts=(unit.facts||[]).map(([key,value])=>`${key}: ${value}`).join('\n');
 const matched=periods.filter(period=>period.sourceText&&facts.includes(period.sourceText));
 return {...recruitment,periods:matched,sourceText:matched.map(period=>period.sourceText).join(' / ')};
}
if(typeof module!=='undefined')module.exports={recruitmentStatus,recruitmentForUnit};
if(typeof document!=='undefined'){
 const labels={all:'전체',open:'모집 중',upcoming:'모집 예정',closed:'마감'};
 const toolbar=document.createElement('section');toolbar.className='recruitment-filter';toolbar.setAttribute('aria-label','공고 모집 상태 필터');
 toolbar.innerHTML='<div class="recruitment-options" role="group" aria-label="모집 상태">'+Object.entries(labels).map(([key,label])=>`<button type="button" data-status="${key}" aria-pressed="false">${label}</button>`).join('')+'</div>';
 $('cards').before(toolbar);
 let selected='all';try{selected=sessionStorage.getItem('ayshh-notice-map-recruitment')||'all';}catch{}
 if(!labels[selected])selected='all';
 function badge(n,unit){const state=recruitmentStatus(recruitmentForUnit(n.recruitment,unit));return labels[state]?`<span class="recruitment-badge ${state}">${labels[state]}</span>`:'';}
 function refresh(){
  const counts={all:notices.length,open:0,upcoming:0,closed:0,unknown:0};
  notices.forEach((n,index)=>{
   const state=recruitmentStatus(n.recruitment);counts[state]++;
   const card=$('cards').children[index];card.hidden=selected!=='all'&&selected!==state;
   let info=card.querySelector('.recruitment-info');if(!info){info=document.createElement('div');info.className='recruitment-info';card.querySelector('.card-body').append(info);}
   info.innerHTML=badge(n);
  });
  toolbar.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(selected===b.dataset.status));b.textContent=`${labels[b.dataset.status]} ${counts[b.dataset.status]}`;});
  const count=counts[selected];
  let empty=$('recruitment-empty');if(!empty){empty=document.createElement('p');empty.id='recruitment-empty';empty.className='empty';$('cards').after(empty);}
  empty.hidden=count>0;empty.textContent='선택한 상태의 공고가 없습니다. 다른 상태를 선택해 보세요.';
  for(const id of ['detail-title','unit-notice-title']){
   const heading=$(id);let status=heading.parentElement.querySelector('.recruitment-heading');
   if(!status){status=document.createElement('span');status.className='recruitment-heading';heading.after(status);}
   const match=location.pathname.match(/^\/(\d{8})(?:\/(\d+))?/);const n=notices.find(n=>n.id===match?.[1]);
   const unit=id==='unit-notice-title'&&match?.[2]?n?.places.flatMap(place=>place.units).find(unit=>unit.id===match[2]):undefined;
   status.innerHTML=n?badge(n,unit):'';
  }
 }
 toolbar.addEventListener('click',e=>{const button=e.target.closest('button[data-status]');if(!button)return;selected=button.dataset.status;try{sessionStorage.setItem('ayshh-notice-map-recruitment',selected);}catch{}refresh();});
 const previousRoute=route;route=function(){previousRoute();refresh();};
 refresh();setInterval(refresh,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
