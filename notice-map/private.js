'use strict';
let privateMap,privateMarkers,privateInitialized=false;
let privateSelectedId=null;
const privateItems=new Map();
function privateIcon(item){return L.icon({iconUrl:`/notice-map/assets/private-marker-${item.category==='청년안심주택'?'youth':'public'}.png`,iconSize:[30,40],iconAnchor:[15,40],popupAnchor:[0,-40]});}
function showPrivateMap(){
 NoticeView.show('private');document.title='민간임대 공고지도 페이지 | 아영이네 행복주택';
 if(!privateInitialized){
  privateInitialized=true;
  const districts='강남구 강동구 강북구 강서구 관악구 광진구 구로구 금천구 노원구 도봉구 동대문구 동작구 마포구 서대문구 서초구 성동구 성북구 송파구 양천구 영등포구 용산구 은평구 종로구 중구 중랑구'.split(' ');
  $('private-district').replaceChildren(new Option('전체지역',''),...districts.map(d=>new Option(d,d)));
  const result=document.createElement('p');result.id='private-result-count';result.className='list-meta';result.setAttribute('role','status');$('private-rows').append(result);
  $('private-filters').addEventListener('submit',event=>event.preventDefault());$('private-filters').addEventListener('input',filterPrivate);
  privateMap=createMap('private-map');privateMap.setView([36.4,127.6],7,{animate:false});privateMarkers=new Map();
  for(const item of privateSource){const marker=L.marker(item.coord,{title:item.name,icon:privateIcon(item)}).addTo(privateMap);marker.bindPopup(`<div class="private-popup"><strong>${esc(item.name)}</strong><small>${esc(item.address)}</small><a href="/plan/${item.id}">상세보기</a></div>`);marker.on('click',()=>selectPrivateItem(item));setMarkerSelected(marker,false);privateMarkers.set(item.id,marker);}
  filterPrivate();
 }
 // Returning from a detail keeps the existing filters, list scroll and map view.
 privateMap.invalidateSize();
}
function filterPrivate(){
 const category=$('private-category').value,district=$('private-district').value,query=$('private-search').value.trim().toLowerCase();
 const visible=privateSource.filter(p=>(!category||p.category===category)&&(!district||p.district===district)&&p.name.toLowerCase().includes(query));
 const visibleIds=new Set(visible.map(item=>item.id));
 if(!visibleIds.has(privateSelectedId)){
  privateSelectedId=null;
  for(const marker of privateMarkers.values())setMarkerSelected(marker,false);
 }
 for(const [id,marker] of privateMarkers){
  if(visibleIds.has(id)){
   if(!privateMap.hasLayer(marker))marker.addTo(privateMap);
   setMarkerSelected(marker,id===privateSelectedId);
  }
  else if(privateMap.hasLayer(marker))privateMap.removeLayer(marker);
 }
 $('private-result-count').textContent=`검색 결과 ${visible.length} / ${privateSource.length}개`;
 privateItems.clear();
 $('private-rows').replaceChildren($('private-result-count'),...visible.map(createPrivateItem));
 if(!visible.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='검색 결과가 없습니다. 검색어나 유형·지역 조건을 바꿔보세요.';$('private-rows').append(empty);}
}
function createPrivateItem(item){
 const link=document.createElement('a');
 const youth=item.category==='청년안심주택';
 link.href='#';
 link.className='private-item';
 link.classList.toggle('active',privateSelectedId===item.id);
 link.setAttribute('aria-current',String(privateSelectedId===item.id));
 link.innerHTML=`<span class="private-badge ${youth?'blue':'red'}">${youth?'청':'공'}</span>${esc(item.name)}<br><span class="private-address">${esc(item.address)}</span>`;
 link.addEventListener('click',event=>{
  event.preventDefault();
  selectPrivateItem(item);
 });
 privateItems.set(item.id,link);
 return link;
}
function selectPrivateItem(item){
 privateSelectedId=item.id;
 for(const [id,marker] of privateMarkers)setMarkerSelected(marker,id===item.id);
 for(const [id,link] of privateItems){
  link.classList.toggle('active',id===item.id);
  link.setAttribute('aria-current',String(id===item.id));
 }
 privateMap.setView([item.coord[0]-0.0008,item.coord[1]],15,{animate:false});
 privateMarkers.get(item.id).openPopup();
}
function showPrivateDetail(item){
 NoticeView.show('private-unit');
 $('unit-notice-title').textContent=item.name;$('unit-notice-title').parentElement.append($('unit-back'));$('unit-back').href='/plan';$('unit-back').setAttribute('aria-label','목록');$('unit-back').innerHTML='<span class="fa">&#xf03a;</span>';
 $('unit-select').hidden=true;$('unit-facts').hidden=true;$('unit-prices').hidden=true;document.querySelector('.source-note').hidden=true;
 $('private-facts').hidden=false;$('private-facts').innerHTML=item.html;
 renderGallery(item.images);
 $('private-related').hidden=!item.links.length;$('private-related').innerHTML='<h2>관련링크</h2>'+item.links.map(link=>`<div class="private-related-row"><span class="fa" aria-hidden="true">&#xf0c1;</span><a href="${esc(/^https?:\/\//.test(link.text)?link.text:link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.text)}</a></div>`).join('');
 document.title=`${item.name} > 민간임대 공고지도 | 아영이네 행복주택`;
 NoticeView.showUnitLocation(item.coord,privateIcon(item));
}
