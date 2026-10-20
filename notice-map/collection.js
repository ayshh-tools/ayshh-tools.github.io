/* Personal collections stay in this browser, separate from existing tool storage. */
(() => {
  'use strict';
  const records=CollectionStore.buildRecords(notices,privateSource,recruitmentForUnit);
  const store=CollectionStore.create(records,{
    getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)
  });
  const dialog=document.createElement('dialog');dialog.id='collection-modal';dialog.setAttribute('aria-labelledby','collection-title');
  dialog.innerHTML='<header class="collection-heading"><div><h2 id="collection-title">나의 주택 보관함</h2></div><button type="button" data-close aria-label="나의 주택 보관함 닫기">✕</button></header><nav class="collection-tabs" aria-label="저장 기록 메뉴"></nav><div class="collection-content"></div>';
  document.body.append(dialog);
  const storageNote=document.createElement('p');storageNote.className='collection-storage';storageNote.textContent='저장한 내용은 이번 방문 동안 유지됩니다.';storageNote.hidden=store.persistent;dialog.querySelector('.collection-heading').after(storageNote);
  const modalStatus=document.createElement('p');modalStatus.setAttribute('role','status');modalStatus.className='collection-hint';dialog.append(modalStatus);
  const status=document.createElement('div');status.className='collection-status';status.setAttribute('role','status');document.body.append(status);
  let timer, active='saved', opener, navigating=false;
  function announce(message){modalStatus.textContent=message;status.textContent=message;clearTimeout(timer);timer=setTimeout(()=>{status.textContent='';modalStatus.textContent='';},3500);}
  function persist(){if(!store.persist())announce('저장한 내용은 이번 방문 동안 유지됩니다.');sync();}
  const actions=path=>CollectionView.actions(path,store.state);
  const menu=document.createElement('section');menu.className='collection-menu';menu.innerHTML='<h2>나의 주택 보관함</h2>'+[['saved','♡ 관심 주택'],['recent','◷ 최근 본 주택'],['compare','⇄ 주택 비교']].map(([tab,label])=>`<button type="button" data-open="${tab}" aria-haspopup="dialog">${label}<span data-count="${tab}"></span></button>`).join('');
  $('menu').querySelector('.menu-inner').after(menu);
  const detailActions=document.createElement('div');detailActions.className='collection-detail-actions';
  function currentPath(){const path=location.pathname.replace(/\/$/,'');return records.has(path)?path:null;}
  function track(){
    if(dialog.open){navigating=true;dialog.close();}
    const path=currentPath();detailActions.remove();
    if(path){store.track(path);const target=document.querySelector('.unit-content');target?.prepend(detailActions);detailActions.innerHTML=actions(path);persist();}
    sync();
  }
  NoticeLifecycle.afterRender(track);
  function sync(){
    storageNote.hidden=store.persistent;
    const focused=dialog.contains(document.activeElement)?document.activeElement:null;
    const focusKey=focused&&['tab','save','compare','remove'].find(key=>focused.dataset[key]);
    const focusValue=focusKey?focused.dataset[focusKey]:null;
    document.querySelectorAll('[data-count]').forEach(el=>el.textContent=store.state[el.dataset.count].length);
    document.querySelectorAll('[data-save],[data-compare]').forEach(button=>{const save=button.hasAttribute('data-save'),selected=store.state[save?'saved':'compare'].includes(button.dataset[save?'save':'compare']);button.setAttribute('aria-pressed',String(selected));button.textContent=CollectionView.actionLabel(save?'saved':'compare',selected);});
    if(dialog.open){render();if(focusKey)(Array.from(dialog.querySelectorAll(`[data-${focusKey}]`)).find(el=>el.dataset[focusKey]===focusValue)||dialog.querySelector(`[data-tab="${active}"]`))?.focus();}
  }
  function render(){
    const view=CollectionView.render(active,store.state,records);
    dialog.querySelector('.collection-tabs').innerHTML=view.tabs;
    dialog.querySelector('.collection-content').innerHTML=view.content;
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.open&&menu.contains(b)){opener=$('menu-toggle');navigating=false;closeMenu();active=b.dataset.open;render();dialog.showModal();return;}
    if(dialog.contains(b)&&b.hasAttribute('data-close')){dialog.close();return;}
    if(dialog.contains(b)&&b.dataset.tab){active=b.dataset.tab;render();dialog.querySelector(`[data-tab="${active}"]`).focus();return;}
    const save=b.dataset.save,compare=b.dataset.compare,path=save||compare;
    if(path&&records.has(path)){
      if(!store.toggle(save?'saved':'compare',path)){
        announce(`최대 ${CollectionStore.compareLimit}개까지 비교할 수 있어요. 비교하기에서 항목을 빼주세요.`);return;
      }
      persist();
      if(dialog.open)(dialog.querySelector(`[data-${save?'save':'compare'}="${path}"]`)||dialog.querySelector(`[data-tab="${active}"]`))?.focus();
    }
    if(dialog.contains(b)&&b.dataset.remove){store.remove(active,b.dataset.remove);persist();dialog.querySelector(`[data-tab="${active}"]`).focus();}
    if(dialog.contains(b)&&b.hasAttribute('data-clear')){store.clearRecent();persist();dialog.querySelector('[data-tab="recent"]').focus();}
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{if(!navigating&&opener?.isConnected&&opener.getClientRects().length)opener.focus();navigating=false;});
  window.addEventListener('storage',event=>{if(event.key===CollectionStore.key||event.key===null){store.read();sync();}});
  // Remove legacy notice-level entries while preserving saved homes.
  persist();
})();
