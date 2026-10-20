'use strict';
// Public notice metadata. Housing records are populated only from verified source data.
const notices=noticeCatalog.map(n=>({...n,places:housingSource[n.id]||[]}));
const $ = id => document.getElementById(id);
if($('catalog-total'))$('catalog-total').textContent=notices.reduce((sum,n)=>sum+n.places.reduce((units,b)=>units+b.units.length,0),0).toLocaleString('ko-KR');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let map, markers, current;
initializeGallery();
const detailURL=(n,unit)=>`/${n.id}${unit?`/${unit.id}`:''}`;
$('cards').innerHTML=notices.map(renderNoticeCard).join('');
function options(id,values,label){const previous=$(id).value;$(id).replaceChildren(new Option(label,''),...[...new Set(values)].map(v=>new Option(v,v)));if(values.includes(previous))$(id).value=previous;}
function showNotice(n){
 NoticeView.show('map');
 const changed=current?.id!==n.id;current=n;
 $('detail-title').textContent=n.title;$('agency').textContent=n.agency;$('category').textContent=n.type;document.title=`${n.title} | 아영이네 행복주택`;
 $('source').href=`https://ayounghome.com/${n.id}`;$('video').href=n.videoURL||`https://youtu.be/${n.video}`;
 if(changed){$('filters').reset();options('region',n.places.map(p=>p.region),'시도 전체');options('district',n.places.map(p=>p.district),'자치구 전체');}
 if(!map){map=createMap('map');markers=L.layerGroup().addTo(map);}
 map.invalidateSize();filter();
}
function renderUnit(n,building,unit){
 NoticeView.show('unit');
 $('unit-back').setAttribute('aria-label','지도리스트보기');$('private-facts').hidden=true;$('private-related').hidden=true;$('unit-select').hidden=building.units.length===1||unit.selectLabel===null;$('unit-facts').hidden=false;$('unit-prices').hidden=false;document.querySelector('.source-note').hidden=false;$('unit-back').innerHTML='<span class="fa" aria-hidden="true">&#xf279;</span> 지도 목록';
 $('unit-notice-title').textContent=n.title;$('unit-back').href=detailURL(n);
 $('unit-select').replaceChildren(...building.units.map(u=>new Option(u.selectLabel||`${dict(u).공급형||''} ${u.label}`.trim(),u.id)));
 $('unit-select').value=unit.id;
 $('unit-select').onchange=()=>navigate(detailURL(n,building.units.find(u=>u.id===$('unit-select').value)));
 $('unit-facts').innerHTML=unit.facts.filter(([key])=>!['접수기간','접수 기간'].includes(key)).map(([key,value])=>`<div${['주소','지하철역','접수기간','비고'].includes(key)?' class="wide"':''}><dt>${esc(key)} :</dt><dd>${esc(value)}</dd></div>`).join('');
 $('unit-prices').innerHTML=unit.tables.map((rows,index)=>renderPriceTable(rows,unit.tableSpans?.[index])).join('');
 renderGallery(unit.images);
 const files=noticeSupplements[n.id]?.files||[];$('notice-downloads').hidden=!files.length;$('notice-downloads').innerHTML='<ul>'+files.map(file=>{
  const name=(file.download||file.text.replace(/^#/, '')).normalize('NFC');
  const format=name.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase()||'FILE';
  return `<li><a href="${esc(file.href)}" download="${esc(file.download)}" title="${esc(name)}"><span class="download-format" aria-hidden="true">${esc(format)}</span><span class="download-name">${esc(name)}</span><span class="download-action">다운로드</span></a></li>`;
 }).join('')+'</ul>';
 $('unit-original').href=unit.source;document.title=`${building.district} ${unit.label} > ${n.title} | 아영이네 행복주택`;
 NoticeView.showUnitLocation(building.coord,markerIcon());
 PublicNotice.decorateUnit(n,building,unit);
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
 const columns=Math.max(...rows.map(row=>row.length),rows[0].reduce((sum,_,index)=>sum+(spans?.[0]?.[index]?.col||((grouped&&index===1)?2:1)),0));
 return `<div class="price-table-scroll" tabindex="0" role="region" aria-label="보증금과 임대료 표"><table class="price-table" style="--price-columns:${columns}"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function dict(u){return Object.fromEntries(u.facts);}
function navigate(url){history.pushState(null,'',url);route();window.scrollTo(0,0);closeMenu();NoticeView.focusCurrent();}
function route(){NoticeLifecycle.render(renderRoute);}
function renderRoute(){
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
function closeMenu(){$('menu-toggle').setAttribute('aria-label','메뉴 열기');$('menu').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
$('menu-toggle').addEventListener('click',()=>{const open=$('menu').hidden;$('menu').hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$('calculator').close();}});
$('calculator-open').addEventListener('click',()=>$('calculator').showModal());
// Remove the previously introduced PWA only within this tool's scope.
if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(regs=>Promise.all(regs.filter(r=>new URL(r.scope).pathname==='/notice-map/').map(r=>r.unregister()))).catch(()=>{});
if('caches' in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ayshh-notice-map-')).map(k=>caches.delete(k)))).catch(()=>{});
window.addEventListener('scroll',()=>document.querySelector('.header').classList.toggle('scrolled',window.scrollY>0),{passive:true});

$('copy-email').addEventListener('click',async event=>{event.preventDefault();try{await navigator.clipboard.writeText('ayshh@naver.com');alert('📩 이메일이 복사되었습니다!\nayshh@naver.com\n\n바로 붙여넣기 하시면 됩니다 :)');}catch{alert('이메일 주소를 직접 복사해주세요.\n\nayshh@naver.com');}});

if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(console.error);
