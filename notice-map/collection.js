/* Personal collections stay in this browser, separate from existing tool storage. */
(() => {
  'use strict';
  const key = 'ayshh-notice-map-collection-v1';
  const RECENT_LIMIT = 50;
  const COMPARE_LIMIT = 4;
  const records = new Map();
  for (const n of notices) {
    for (const p of n.places) for (const u of p.units) records.set(`/${n.id}/${u.id}`, {title:`${p.address} · ${u.label}`, kind:'공공임대 세대', type:n.type, agency:n.agency, notice:n.title, address:p.address, area:u.area ? `${u.area}㎡` : '', recruitment:recruitmentForUnit(n.recruitment,u), image:u.images?.[0], facts:u.facts, tables:u.tables});
  }
  for (const p of privateSource) records.set(`/plan/${p.id}`, {title:p.name, kind:'민간임대 단지', type:p.category, address:p.address, image:p.images?.[0]});
  const clean = value => Array.isArray(value) ? [...new Set(value.filter(p=>typeof p==='string' && records.has(p)))] : [];
  let state = {saved:[], recent:[], compare:[]}, persistent=true;
  function read() {
    try { const data=JSON.parse(localStorage.getItem(key)||'{}')||{};state={saved:clean(data.saved),recent:clean(data.recent).slice(0,RECENT_LIMIT),compare:clean(data.compare).slice(0,COMPARE_LIMIT)}; } catch { persistent=false; }
  }
  read();
  const dialog=document.createElement('dialog');dialog.id='collection-modal';dialog.setAttribute('aria-labelledby','collection-title');
  dialog.innerHTML='<header class="collection-heading"><div><h2 id="collection-title">나의 주택 보관함</h2></div><button type="button" data-close aria-label="나의 주택 보관함 닫기">✕</button></header><nav class="collection-tabs" aria-label="저장 기록 메뉴"></nav><div class="collection-content"></div>';
  document.body.append(dialog);
  const storageNote=document.createElement('p');storageNote.className='collection-storage';storageNote.textContent='저장 공간을 사용할 수 없어 이번 방문 동안만 유지됩니다.';storageNote.hidden=persistent;dialog.querySelector('.collection-heading').after(storageNote);
  const modalStatus=document.createElement('p');modalStatus.setAttribute('role','status');modalStatus.className='collection-hint';dialog.append(modalStatus);
  const status=document.createElement('div');status.className='collection-status';status.setAttribute('role','status');document.body.append(status);
  let timer, active='saved', opener, navigating=false;
  function announce(message){modalStatus.textContent=message;status.textContent=message;clearTimeout(timer);timer=setTimeout(()=>{status.textContent='';modalStatus.textContent='';},3500);}
  function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch{persistent=false;announce('저장 공간을 사용할 수 없어 이번 방문 동안만 유지됩니다.');}sync();}
  function actions(path){return `<div class="collection-actions"><button type="button" data-save="${path}" aria-pressed="${state.saved.includes(path)}">${state.saved.includes(path)?'♥ 저장됨':'♡ 관심 저장'}</button><button type="button" data-compare="${path}" aria-pressed="${state.compare.includes(path)}">${state.compare.includes(path)?'✓ 비교 담김':'+ 비교 담기'}</button></div>`;}
  const menu=document.createElement('section');menu.className='collection-menu';menu.innerHTML='<h2>나의 주택 보관함</h2>'+[['saved','♡ 관심 주택'],['recent','◷ 최근 본 주택'],['compare','⇄ 주택 비교']].map(([tab,label])=>`<button type="button" data-open="${tab}" aria-haspopup="dialog">${label}<span data-count="${tab}"></span></button>`).join('');
  $('menu').querySelector('.menu-inner').after(menu);
  const detailActions=document.createElement('div');detailActions.className='collection-detail-actions';
  function currentPath(){const path=location.pathname.replace(/\/$/,'');return records.has(path)?path:null;}
  function track(){
    if(dialog.open){navigating=true;dialog.close();}
    const path=currentPath();detailActions.remove();
    if(path){state.recent=[path,...state.recent.filter(p=>p!==path)].slice(0,RECENT_LIMIT);const target=document.querySelector('.unit-content');target?.prepend(detailActions);detailActions.innerHTML=actions(path);persist();}
    sync();
  }
  const baseRoute=route;route=function(){baseRoute();track();};
  function sync(){
    storageNote.hidden=persistent;
    const focused=dialog.contains(document.activeElement)?document.activeElement:null;
    const focusKey=focused&&['tab','save','compare','remove'].find(key=>focused.dataset[key]);
    const focusValue=focusKey?focused.dataset[focusKey]:null;
    document.querySelectorAll('[data-count]').forEach(el=>el.textContent=state[el.dataset.count].length);
    document.querySelectorAll('[data-save],[data-compare]').forEach(button=>{const save=button.hasAttribute('data-save'),selected=state[save?'saved':'compare'].includes(button.dataset[save?'save':'compare']);button.setAttribute('aria-pressed',String(selected));button.textContent=save?(selected?'♥ 저장됨':'♡ 관심 저장'):(selected?'✓ 비교 담김':'+ 비교 담기');});
    if(dialog.open){render();if(focusKey)(Array.from(dialog.querySelectorAll(`[data-${focusKey}]`)).find(el=>el.dataset[focusKey]===focusValue)||dialog.querySelector(`[data-tab="${active}"]`))?.focus();}
  }
  function cell(record,field){
    if(field==='status')return ({open:'모집 중',upcoming:'모집 예정',closed:'마감'})[recruitmentStatus(record.recruitment)]||'미기재';
    if(field==='prices')return record.tables?.length?record.tables.map(rows=>rows.slice(1).map(row=>row.join(' / ')).join('\n')).join('\n\n'):'미기재';
    return String(record[field]??'미기재')||'미기재';
  }
  function render(){
    dialog.querySelector('.collection-tabs').innerHTML=[['saved','관심 주택'],['recent','최근 본 주택'],['compare','비교하기']].map(([tab,label])=>`<button type="button" data-tab="${tab}" aria-pressed="${active===tab}">${label} <b>${state[tab].length}</b></button>`).join('');
    const paths=state[active],content=dialog.querySelector('.collection-content');
    if(!paths.length){content.innerHTML=`<div class="collection-empty"><strong>${active==='saved'?'아직 저장한 주택이 없어요':active==='recent'?'최근 본 주택이 없어요':'비교할 주택을 담아보세요'}</strong><p>${active==='recent'?'열어 본 주택이 자동으로 기록됩니다.':`주택에서 ‘${active==='compare'?'비교 담기':'관심 저장'}’를 누르세요.`}</p><div class="collection-empty-links"><a href="/bbs/group.php?gr_id=aymap">공공임대 둘러보기</a><a href="/plan">민간임대 둘러보기</a></div></div>`;return;}
    if(active==='compare'){
      const fields=[['type','임대 유형'],['agency','공급 기관'],['address','지역 / 주소'],['area','전용면적'],['status','모집 상태'],['prices','보증금 / 월세']];
      content.innerHTML=`<div class="collection-table-wrap" tabindex="0" role="region" aria-label="항목별 비교표"><table class="collection-table" style="--compare-columns:${paths.length}"><colgroup><col class="comparison-label-column">${paths.map(()=>'<col>').join('')}</colgroup><caption>선택한 주택 비교</caption><thead><tr><th scope="col">비교 항목</th>${paths.map(path=>`<th scope="col"><a href="${path}">${esc(records.get(path).title)}</a><button type="button" data-remove="${path}" aria-label="${esc(records.get(path).title)} 비교에서 빼기" title="비교에서 빼기"><span aria-hidden="true">×</span></button></th>`).join('')}</tr></thead><tbody>${fields.map(([field,label])=>`<tr><th scope="row">${label}</th>${paths.map(path=>`<td>${esc(cell(records.get(path),field))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }else content.innerHTML=`${active==='recent'?'<div class="collection-tools"><button type="button" data-clear>최근 기록 전체 삭제</button></div>':''}<ul class="collection-list">${paths.map(path=>{const r=records.get(path);return `<li>${r.image?`<img class="collection-house-photo" src="${esc(r.image.src)}" alt="${esc(r.image.alt||r.title)}" loading="lazy">`: ''}<div class="collection-card-meta"><small>${esc(r.kind)} · ${esc(r.type)}</small>${active==='recent'?`<button type="button" class="collection-remove" data-remove="${path}" aria-label="${esc(r.title)} 최근 기록 삭제" title="최근 기록 삭제"><span aria-hidden="true">×</span></button>`:''}</div><a href="${path}">${esc(r.title)}</a><p class="collection-house-summary">${esc([r.area,r.notice].filter(Boolean).join(" · "))}</p>${actions(path)}</li>`;}).join('')}</ul>`;
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.open&&menu.contains(b)){opener=$('menu-toggle');navigating=false;closeMenu();active=b.dataset.open;render();dialog.showModal();return;}
    if(dialog.contains(b)&&b.hasAttribute('data-close')){dialog.close();return;}
    if(dialog.contains(b)&&b.dataset.tab){active=b.dataset.tab;render();dialog.querySelector(`[data-tab="${active}"]`).focus();return;}
    const save=b.dataset.save,compare=b.dataset.compare,path=save||compare;
    if(path&&records.has(path)){
      const list=state[save?'saved':'compare'],index=list.indexOf(path);
      if(index>=0)list.splice(index,1);else{if(compare&&list.length===COMPARE_LIMIT){announce(`최대 ${COMPARE_LIMIT}개까지 비교할 수 있어요. 비교하기에서 항목을 빼주세요.`);return;}list.unshift(path);}
      persist();
      if(dialog.open)(dialog.querySelector(`[data-${save?'save':'compare'}="${path}"]`)||dialog.querySelector(`[data-tab="${active}"]`))?.focus();
    }
    if(dialog.contains(b)&&b.dataset.remove){state[active]=state[active].filter(p=>p!==b.dataset.remove);persist();dialog.querySelector(`[data-tab="${active}"]`).focus();}
    if(dialog.contains(b)&&b.hasAttribute('data-clear')){state.recent=[];persist();dialog.querySelector('[data-tab="recent"]').focus();}
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{if(!navigating&&opener?.isConnected&&opener.getClientRects().length)opener.focus();navigating=false;});
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){read();sync();}});
  // Remove legacy notice-level entries while preserving saved homes.
  persist();
  track();
})();
