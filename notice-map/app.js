'use strict';
// Public notice metadata. Housing records are populated only from verified source data.
const notices=noticeCatalog.map(n=>({...n,places:housingSource[n.id]||[]}));
const $ = id => document.getElementById(id);
if($('catalog-total'))$('catalog-total').textContent=notices.reduce((sum,n)=>sum+n.places.reduce((units,b)=>units+b.units.length,0),0).toLocaleString('ko-KR');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let map, markers, current;
initializeGallery();
const detailURL=(n,unit)=>`/${n.id}${unit?`/${unit.id}`:''}`;
$('cards').innerHTML=notices.map(n=>`<article class="card"><a class="thumbnail" href="${detailURL(n)}" aria-label="${esc(n.title)} 공고지도"><img src="./assets/${n.id}.jpg" alt="${esc(n.title)} 영상 썸네일" width="320" height="180"></a><div class="card-body"><a class="card-title" href="${detailURL(n)}">${esc(n.title)}</a><div class="tags"><span>${n.agency}</span> <span>${n.type}</span> <span>${n.date} 공고문</span></div></div><div class="card-buttons"><a href="${esc(n.videoURL||`https://youtu.be/${n.video}`)}" target="_blank" rel="noopener noreferrer"><svg class="card-button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="4" fill="#f00"/><path d="m10 9 6 3-6 3Z" fill="#fff"/></svg>유튜브</a><a href="${detailURL(n)}" aria-label="${esc(n.title)} 지도 열기"><svg class="card-button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></svg>공고지도</a></div></article>`).join('');
function options(id,values,label){const previous=$(id).value;$(id).replaceChildren(new Option(label,''),...[...new Set(values)].map(v=>new Option(v,v)));if(values.includes(previous))$(id).value=previous;}
function markerIcon(type='0'){return L.divIcon({className:'home-marker',html:'<span>⌂</span>',iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-35]});}
function showNotice(n){
 NoticeView.show('map');
 const changed=current?.id!==n.id;current=n;
 $('detail-title').textContent=n.title;$('agency').textContent=n.agency;$('category').textContent=n.type;document.title=`${n.title} | 아영이네 행복주택`;
 $('source').href=`https://ayounghome.com/${n.id}`;$('video').href=n.videoURL||`https://youtu.be/${n.video}`;
 if(changed){$('filters').reset();options('region',n.places.map(p=>p.region),'시도 전체');options('district',n.places.map(p=>p.district),'자치구 전체');}
 if(!map){map=createMap('map');markers=L.layerGroup().addTo(map);}
 map.invalidateSize();filter();
}
function matchesUnit(u){
 const a=$('area').value,d=$('deposit').value;
 const areaOK=!a||(a==='small'?u.area<40:a==='40-60'?u.area>=40&&u.area<60:a==='60-85'?u.area>=60&&u.area<85:u.area>=85);
 const depositOK=!d||u.deposits.some(v=>d==='low'?v<1e8:d==='5'?v>=5e8:(v>=Number(d.split('-')[0])*1e8&&v<Number(d.split('-')[1])*1e8));
 return areaOK&&depositOK;
}
function filter(){
 if(!current||!map)return;
 const query=$('search').value.trim().toLowerCase();
 const visible=current.places.filter(p=>(!$('region').value||p.region===$('region').value)&&(!$('district').value||p.district===$('district').value)).map(p=>({...p,shown:p.units.filter(u=>matchesUnit(u)&&(!query||`${p.address} ${u.label}`.toLowerCase().includes(query)))})).filter(p=>p.shown.length);
 $('count').textContent=`${visible.reduce((n,p)=>n+p.shown.length,0)} / ${current.places.reduce((n,p)=>n+p.units.length,0)}개`;
 markers.clearLayers();$('places').replaceChildren();
 if(!visible.length){$('places').innerHTML='<p class="empty">검색 결과가 없습니다.</p>';return;}
 const controls=[];
 for(const p of visible){
  const marker=L.marker(p.coord,{title:p.address,icon:markerIcon(p.marker)}).addTo(markers);
  marker.bindPopup(`<div class="popup-title">${esc(p.address)}</div><a class="popup-detail" href="${detailURL(current,p.shown[0])}">상세보기</a>`);
  const block=document.createElement('div');block.className='building';
  const button=document.createElement('button');button.className='place';button.type='button';button.textContent=p.address;button.setAttribute('aria-expanded','false');
  const units=document.createElement('div');units.className='unit-list';units.hidden=true;
  units.innerHTML=p.shown.map(u=>`<a href="${detailURL(current,u)}"><span>${esc(u.label)}</span><small>${u.area}㎡</small></a>`).join('');
  const select=()=>{const open=units.hidden;for(const c of controls){c.button.classList.remove('active');c.button.setAttribute('aria-expanded','false');c.units.hidden=true;}button.classList.toggle('active',open);button.setAttribute('aria-expanded',String(open));units.hidden=!open;map.panTo(marker.getLatLng());marker.openPopup();};
  button.addEventListener('click',select);marker.on('click',()=>{if(units.hidden)select();button.scrollIntoView({block:'nearest',behavior:'smooth'});});
  controls.push({button,units});block.append(button,units);$('places').append(block);
 }
 map.fitBounds(visible.map(p=>p.coord),{padding:[45,45],maxZoom:13});
}
function renderUnit(n,building,unit){
 NoticeView.show('unit');
 $('unit-back').setAttribute('aria-label','지도리스트보기');$('private-facts').hidden=true;$('private-related').hidden=true;$('unit-select').hidden=building.units.length===1||unit.selectLabel===null;$('unit-facts').hidden=false;$('unit-prices').hidden=false;document.querySelector('.source-note').hidden=false;$('unit-back').innerHTML='<span class="fa">&#xf279;</span>';
 $('unit-notice-title').textContent=n.title;$('unit-back').href=detailURL(n);
 $('unit-select').replaceChildren(...building.units.map(u=>new Option(u.selectLabel||`${dict(u).공급형||''} ${u.label}`.trim(),u.id)));
 $('unit-select').value=unit.id;
 $('unit-select').onchange=()=>navigate(detailURL(n,building.units.find(u=>u.id===$('unit-select').value)));
 $('unit-facts').innerHTML=unit.facts.map(([key,value])=>`<div${['주소','지하철역','접수기간','비고'].includes(key)?' class="wide"':''}><dt>${esc(key)} :</dt><dd>${esc(value)}</dd></div>`).join('');
 $('unit-prices').innerHTML=unit.tables.map((rows,index)=>renderPriceTable(rows,unit.tableSpans?.[index])).join('');
 renderGallery(unit.images);
 const files=noticeSupplements[n.id]?.files||[];$('notice-downloads').hidden=!files.length;$('notice-downloads').innerHTML='<ul>'+files.map(file=>`<li><a href="${esc(file.href)}" download="${esc(file.download)}">${esc(file.text)}</a></li>`).join('')+'</ul>';
 $('unit-original').href=unit.source;document.title=`${building.district} ${unit.label} > ${n.title} | 아영이네 행복주택`;
 NoticeView.showUnitLocation(building.coord,markerIcon());
}
function renderPriceTable(rows,spans){
 const grouped=rows.slice(1).some(row=>row.length===4);
 const header=rows[0].map((cell,index)=>`<th${(spans?.[0]?.[index]?.col||((grouped&&index===1)?2:1))>1?` colspan="${spans?.[0]?.[index]?.col||2}"`:''}>${esc(cell)}</th>`).join('');
 const body=rows.slice(1).map((row,index)=>{
  const cells=row.map((cell,column)=>{
   const group=grouped&&row.length===4&&column===0;
   const loan=index===0&&column===row.length-2?'<a class="loan-cta" href="https://ayounghome.com/bbs/board.php?bo_table=in" target="_blank" rel="noopener noreferrer">💡 대출 고민되세요?</a>':'';
   const rowSpan=spans?.[index+1]?.[column]?.row||(group?2:1),colSpan=spans?.[index+1]?.[column]?.col||1;
   return `<td${group?' class="group-cell"':''}${rowSpan>1?` rowspan="${rowSpan}"`:''}${colSpan>1?` colspan="${colSpan}"`:''}>${loan}${esc(cell)}</td>`;
  }).join('');return `<tr${row.length===4?' class="group-sep"':''}>${cells}</tr>`;
 }).join('');
 return `<table class="price-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}
function dict(u){return Object.fromEntries(u.facts);}
function navigate(url){history.pushState(null,'',url);route();window.scrollTo(0,0);closeMenu();NoticeView.focusCurrent();}
function route(){
 if(!$('photo-lightbox').hidden)closePhoto();
 const params=new URLSearchParams(location.search), path=location.pathname;
 if(/^\/plan\/?$/.test(path)||path==='/bbs/board.php'&&params.get('bo_table')==='plan'){showPrivateMap();return;}
 const privateMatch=path.match(/^\/plan\/([0-9]+)\/?$/);if(privateMatch){const item=privateSource.find(p=>p.id===privateMatch[1]);if(item){showPrivateDetail(item);return;}}
 const match=path.match(/^\/([0-9]{8})(?:\/([0-9]+))?\/?$/);
 const n=notices.find(n=>n.id===(match?.[1]||params.get('notice')));
 if(n){const id=match?.[2]||params.get('unit');const b=n.places.find(b=>b.units.some(u=>u.id===id));if(b)renderUnit(n,b,b.units.find(u=>u.id===id));else showNotice(n);}
 else{const list=path==='/bbs/group.php'&&params.get('gr_id')==='aymap';NoticeView.show(list?'catalog':'landing');document.title=(list?'공고지도':'공고지도 유형선택')+' | 아영이네 행복주택';}
}
document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||a.target)return;const url=new URL(a.href);if(url.origin===location.origin&&(url.pathname==='/content/map'||url.pathname==='/plan'||/^\/plan\/[0-9]+\/?$/.test(url.pathname)||url.pathname==='/bbs/board.php'&&url.searchParams.get('bo_table')==='plan'||url.pathname==='/bbs/group.php'&&url.searchParams.get('gr_id')==='aymap'||/^\/[0-9]{8}(?:\/[0-9]+)?\/?$/.test(url.pathname))){event.preventDefault();navigate(url.href);}});
window.addEventListener('popstate',()=>{route();closeMenu();NoticeView.focusCurrent();});
$('filters').addEventListener('submit',e=>e.preventDefault());$('filters').addEventListener('input',filter);
$('region').addEventListener('change',()=>{options('district',current.places.filter(p=>!$('region').value||p.region===$('region').value).map(p=>p.district),'자치구 전체');filter();});
$('filters').addEventListener('reset',()=>{if(current)setTimeout(()=>{options('district',current.places.map(p=>p.district),'자치구 전체');filter();},0);});
function closeMenu(){$('menu-toggle').setAttribute('aria-label','메뉴 열기');$('menu').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
$('menu-toggle').addEventListener('click',()=>{const open=$('menu').hidden;$('menu').hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$('calculator').close();}});
$('calculator-open').addEventListener('click',()=>$('calculator').showModal());
// Remove the previously introduced PWA only within this tool's scope.
if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(regs=>Promise.all(regs.filter(r=>new URL(r.scope).pathname==='/notice-map/').map(r=>r.unregister()))).catch(()=>{});
if('caches' in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ayshh-notice-map-')).map(k=>caches.delete(k)))).catch(()=>{});
route();
window.addEventListener('scroll',()=>document.querySelector('.header').classList.toggle('scrolled',window.scrollY>0),{passive:true});

$('copy-email').addEventListener('click',async event=>{event.preventDefault();try{await navigator.clipboard.writeText('ayshh@naver.com');alert('📩 이메일이 복사되었습니다!\nayshh@naver.com\n\n바로 붙여넣기 하시면 됩니다 :)');}catch{alert('이메일 주소를 직접 복사해주세요.\n\nayshh@naver.com');}});

if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(console.error);
