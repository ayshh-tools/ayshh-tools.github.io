'use strict';
// Public map behavior measured against the authenticated source UI, 2026-10-19.
(() => {
 const publicScroll=document.createElement('div');publicScroll.className='public-scroll';
 const listMeta=document.querySelector('#detail .list-meta');listMeta.before(publicScroll);
 publicScroll.append(listMeta,$('places'));
 const mapBack=document.createElement('a');mapBack.className='public-map-back';mapBack.href='/bbs/group.php?gr_id=aymap';mapBack.textContent='<';mapBack.setAttribute('aria-label','공고 목록으로 돌아가기');document.querySelector('.detail-heading').prepend(mapBack);
 const filterKey=id=>`ayshh-notice-map-filter-${id}`;
 function savePublicFilter(){
  if(document.body.dataset.view!=='map'||!current)return;
  const state={scroll:publicScroll.scrollTop};
  ['search','region','district','area','deposit'].forEach(id=>state[id]=$(id).value);
  try{sessionStorage.setItem(filterKey(current.id),JSON.stringify(state));}catch{}
 }
 function sortPublicOptions(id){
  const select=$(id),selected=select.value,placeholder=select.options[0].textContent;
  const values=Array.from(select.options).slice(1).map(option=>option.value).sort();
  select.replaceChildren(new Option(placeholder,''),...values.map(value=>new Option(value,value)));select.value=selected;
 }
 const baseFilter=filter, baseRenderUnit=renderUnit;
 const baseShowPhoto=showPhoto;
 showPhoto=function(index){
  baseShowPhoto(index);
  const track=$('legacy-photo-track');if(track)track.style.transform=`translateX(-${photoIndex*100}%)`;
  $('legacy-photo-dots')?.querySelectorAll('button').forEach((dot,index)=>selectPhotoButton(dot,index===photoIndex));
 };
 markerIcon=function(type='0'){
  const name=['2-1','2-2','2-3'].includes(type)?`ay-marker${type}.png`:'ay-marker.png';
  return L.icon({iconUrl:`/notice-map/assets/${name}`,iconSize:[30,40],iconAnchor:[15,40],popupAnchor:[0,-40]});
 };
 filter=function(){
  if(!current||!map)return;
  const source=current, search=$('search'), originalQuery=search.value, query=originalQuery.trim().toLowerCase();
  // Source searches a building together with all its unit labels, then retains
  // the matching building's units. Area and deposit still filter each unit.
  if(query)current={...source,places:source.places.filter(p=>`${p.address} ${p.units.map(u=>u.label).join(' ')}`.toLowerCase().includes(query))};
  search.value='';
  try{baseFilter();}finally{current=source;search.value=originalQuery;}
  $('filters').querySelector('[type=reset]').hidden=!['search','region','district','area','deposit'].some(id=>$(id).value);
  const shown=$('places').querySelectorAll('.unit-list a').length;
  $('count').textContent=`${shown} / ${source.places.reduce((sum,p)=>sum+p.units.length,0)}개`;
  $('places').querySelectorAll('.unit-list small').forEach(e=>e.remove());
  const mapMarkers=markers.getLayers();
  $('places').querySelectorAll('.building').forEach((block,index)=>{
   const button=block.querySelector('.place'), place=source.places.find(p=>p.address===button.textContent), marker=mapMarkers[index],units=block.querySelector('.unit-list');
   units.innerHTML=place.units.map(unit=>`<a href="${detailURL(source,unit)}"${matchesUnit(unit)?'':' class="filtered-unit"'}><span>${esc(unit.label)}</span></a>`).join('');
   if(place.units.length===1)block.classList.add('single-unit');
   setMarkerSelected(marker,false);
   button.setAttribute('aria-current','false');
   marker.bindPopup(`<div class="popup-title">${esc(place.address)}</div><a class="popup-detail" href="${detailURL(source,place.units.find(matchesUnit)||place.units[0])}">상세보기</a>`);
   const select=()=>{
    $('places').querySelectorAll('.place').forEach(other=>{other.classList.remove('active');other.setAttribute('aria-current','false');});
    mapMarkers.forEach(other=>setMarkerSelected(other,other===marker));
    button.classList.add('active');button.setAttribute('aria-current','true');
    if(place.units.length>1){units.hidden=!units.hidden;button.setAttribute('aria-expanded',String(!units.hidden));}
    map.setView([place.coord[0]+.0004,place.coord[1]],17,{animate:false});marker.openPopup();
    const scroll=document.querySelector('.public-scroll');scroll.scrollTo({top:scroll.scrollTop+button.getBoundingClientRect().top-scroll.getBoundingClientRect().top-scroll.clientHeight/2,behavior:'smooth'});
   };
   button.addEventListener('click',event=>{event.stopImmediatePropagation();select();},true);
   marker.off('click');marker.on('click',select);
  });
 };
 matchesUnit=function(u){
  const area=$('area').value,deposit=$('deposit').value;
  const areaOK=!area||(area==='small'?u.area<40:area==='40-60'?u.area>=40&&u.area<60:area==='60-85'?u.area>=60&&u.area<85:u.area>85);
  // The source labels the final deposit band "초과" but implements >= 5억.
  const depositOK=!deposit||!u.deposits.length||u.deposits.some(v=>deposit==='low'?v<1e8:deposit==='5'?v>=5e8:v>=Number(deposit.split('-')[0])*1e8&&v<Number(deposit.split('-')[1])*1e8);
  return areaOK&&depositOK;
 };
 renderUnit=function(n,building,unit){
  baseRenderUnit(n,building,unit);
  // Preserve secondary cell text and line breaks without accepting source HTML.
  // Keep the existing loan link: it is rendered independently from source parts.
  if(unit.tableParts){
   Array.from($('unit-prices').querySelectorAll('table')).forEach((table,tableIndex)=>{
    Array.from(table.rows).forEach((row,rowIndex)=>{
     Array.from(row.cells).forEach((cell,cellIndex)=>{
      const parts=unit.tableParts[tableIndex]?.[rowIndex]?.[cellIndex];
      if(!Array.isArray(parts))return;
      const nodes=Array.from(cell.querySelectorAll('.loan-cta'));
      for(const part of parts){
       if(part?.type==='text')nodes.push(document.createTextNode(String(part.text??'')));
       else if(part?.type==='br')nodes.push(document.createElement('br'));
       else if(part?.type==='span'){
        const span=document.createElement('span');span.textContent=String(part.text??'');
        if(typeof part.className==='string')span.className=part.className;
        nodes.push(span);
       }
      }
      cell.replaceChildren(...nodes);
     });
    });
   });
  }
  const legacy=unit.galleryMode==='legacy';$('gallery').classList.toggle('legacy-gallery',legacy);
  $('legacy-photo-track')?.remove();$('legacy-photo-dots')?.remove();
  if(legacy&&unit.images.length){
   const track=document.createElement('div');track.id='legacy-photo-track';track.className='bo-img-slider-track';
   const dots=document.createElement('div');dots.id='legacy-photo-dots';dots.className='bo-img-dots';
   unit.images.forEach((image,index)=>{
    const link=document.createElement('a');link.href=image.src;link.className='view_image';
    const img=document.createElement('img');img.src=image.src;img.alt=image.alt;img.loading='lazy';link.append(img);
    link.addEventListener('click',event=>{event.preventDefault();openPhoto(index);});track.append(link);
    const dot=document.createElement('button');dot.type='button';selectPhotoButton(dot,index===0);dot.setAttribute('aria-label',`${index+1}번째 사진`);
    dot.addEventListener('click',()=>showPhoto(index));dots.append(dot);
   });
   document.querySelector('.gallery-view').prepend(track);document.querySelector('.gallery-view').append(dots);
  }
  let typeCards=$('unit-type-cards');
  if(!typeCards){typeCards=document.createElement('div');typeCards.id='unit-type-cards';typeCards.className='same-latlng';$('unit-select').before(typeCards);}
  const cards=unit.selectionCards||[];
  typeCards.hidden=!cards.length;$('unit-detail').classList.toggle('has-type-cards',Boolean(cards.length));
  typeCards.innerHTML=cards.length?'<ul>'+cards.map(card=>`<li${card.current?' class="now"':''}><a href="${esc(new URL(card.href,location.href).pathname)}"${card.current?' aria-current="page"':''}><span class="str">${esc(card.title)}</span>${card.hasSubtitle===false?'':`<span>${card.current?'<i class="fa">&#xf00c;</i>':'ㆍ'} ${esc(card.subtitle)}</span>`}</a></li>`).join('')+'</ul>':'';
  Array.from($('unit-facts').children).forEach(row=>{
   const key=row.querySelector('dt').textContent.replace(/\s*:\s*$/,'');
   if(key==='지하철역'){row.classList.remove('wide');row.querySelector('dt').textContent='지하철역:';}
  });
 };
 // Listen to input so paste, dictation and mobile keyboards also update results.
 $('search').type='text';
 $('search').placeholder='검색어로 쉽게 찾아보세요!';
 $('filters').addEventListener('input',event=>{
  event.stopImmediatePropagation();
  if(event.target===$('search')&&!event.isComposing)applySearch();
 },true);
 $('region').addEventListener('change',event=>{
  event.stopImmediatePropagation();
  const region=$('region').value,values=[...new Set(current.places.filter(place=>!region||place.region===region).map(place=>place.district))].sort();
  $('district').replaceChildren(new Option('자치구 전체',''),...values.map(value=>new Option(value,value)));
  filter();savePublicFilter();
 },true);
 const applySearch=()=>{filter();savePublicFilter();};
 $('search').addEventListener('compositionend',applySearch);
 $('filters').addEventListener('reset',()=>setTimeout(savePublicFilter,0));
 ['district','area','deposit'].forEach(id=>$(id).addEventListener('change',filter));
 ['region','district','area','deposit'].forEach(id=>$(id).addEventListener('change',savePublicFilter));
 publicScroll.addEventListener('scroll',savePublicFilter,{passive:true});
 $('area').lastElementChild.textContent='85㎡ 초과';
 $('deposit').lastElementChild.textContent='5억 초과';
 const alertStates={
  '26101602':{text:'🔔 선착순 접수알림',active:true,quota:'선착순 2000명',remaining:'3명 신청 · 1997명 남음'},
  '26101601':{text:'🔔 선착순 접수알림',active:true,quota:'선착순 2000명',remaining:'47명 신청 · 1953명 남음'},
  '26100102':{text:'알림신청기간 종료'},'26093002':null,
  '26093001':{text:'알림신청기간 종료'},'26091702':{text:'알림신청기간 종료'},
  '26091701':{text:'알림신청기간 종료'},'26090902':{text:'알림신청기간 종료'},
  '26083101':{text:'알림신청기간 종료'}
 };
 const alarm=document.createElement('div');alarm.id='public-alarm';alarm.hidden=true;
 const overlay=document.createElement('dialog');overlay.id='public-alarm-overlay';overlay.setAttribute('aria-labelledby','public-alarm-title');
 overlay.innerHTML='<section id="public-alarm-modal"><div class="modal-header"><h3 id="public-alarm-title"></h3><button type="button" class="close-btn" aria-label="알림 안내 닫기">✕</button></div><p class="desc">접수 알림 준비 중입니다.</p><div class="quota-box"><span id="public-alarm-quota"></span><span class="quota-num" id="public-alarm-remaining"></span></div><div class="phone-box"><span class="label">수신번호</span><span class="num">로그인 후 확인</span></div><button type="button" class="alarm-submit" disabled>알림 신청</button></section>';
 document.body.append(alarm,overlay);
 const closeAlarm=()=>{if(overlay.open)overlay.close();};
 overlay.addEventListener('close',()=>{const opener=alarm.querySelector('button');if(opener?.isConnected&&opener.getClientRects().length)opener.focus();});
 overlay.querySelector('.close-btn').addEventListener('click',closeAlarm);
 overlay.addEventListener('click',event=>{if(event.target===overlay)closeAlarm();});
 const baseRoute=route;
 route=function(){
  closeAlarm();if($('unit-type-cards'))$('unit-type-cards').hidden=true;$('unit-detail').classList.remove('has-type-cards');$('gallery').classList.remove('legacy-gallery');$('legacy-photo-track')?.remove();$('legacy-photo-dots')?.remove();baseRoute();
  if(document.body.dataset.view==='map'){
   let saved;try{saved=JSON.parse(sessionStorage.getItem(filterKey(current.id))||'null');}catch{}
   if(saved){
    $('region').value=saved.region||'';options('district',current.places.filter(p=>!$('region').value||p.region===$('region').value).map(p=>p.district),'자치구 전체');
    ['search','district','area','deposit'].forEach(id=>$(id).value=saved[id]||'');filter();publicScroll.scrollTop=saved.scroll||0;
   }
   sortPublicOptions('region');sortPublicOptions('district');
  }
  const supplement=noticeSupplements[current?.id];
  const state=document.body.dataset.view==='map'?(supplement&&Object.prototype.hasOwnProperty.call(supplement,'alarm')?supplement.alarm:alertStates[current?.id]):null;
  alarm.hidden=!state;alarm.replaceChildren();
  if(!state)return;
  const control=document.createElement(state.active?'button':'span');
  control.textContent=state.text;control.className=state.active?'alarm-active':'alarm-ended';alarm.append(control);
  if(state.active){control.type='button';control.addEventListener('click',()=>{
   $('public-alarm-title').textContent=current.title;$('public-alarm-quota').textContent=state.quota;$('public-alarm-remaining').textContent=state.remaining;
   overlay.showModal();overlay.querySelector('.close-btn').focus();
  });}
 };
 // app.js renders its initial route before this extension is evaluated.
 route();
})();
