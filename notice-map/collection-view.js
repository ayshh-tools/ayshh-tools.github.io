/* Stateless collection components. Storage and events belong to collection.js. */
const CollectionView = (() => {
  function actionLabel(kind,selected){
    return kind==='saved'?(selected?'♥ 저장됨':'♡ 관심 저장'):(selected?'✓ 비교 담김':'+ 비교 담기');
  }
  function actions(path,state){return `<div class="collection-actions"><button type="button" data-save="${path}" aria-pressed="${state.saved.includes(path)}">${actionLabel('saved',state.saved.includes(path))}</button><button type="button" data-compare="${path}" aria-pressed="${state.compare.includes(path)}">${actionLabel('compare',state.compare.includes(path))}</button></div>`;}
  function cell(record,field){
    if(field==='status')return ({open:'모집 중',upcoming:'모집 예정',closed:'마감'})[recruitmentStatus(record.recruitment)]||'미기재';
    return String(record[field]??'미기재')||'미기재';
  }
  function comparisonPrices(record){
    if(!record.tables?.length)return '미기재';
    return record.tables.map(rows=>{
      const grouped=rows.slice(1).some(row=>row.length===4);let group='';
      return rows.slice(1).map(row=>{
        if(row.length<3)return `<p>${esc(row.join(' / '))}</p>`;
        if(grouped&&row.length===4)group=row[0];
        const label=[grouped?group:'',...row.slice(grouped&&row.length===4?1:0,-2)].filter(Boolean).join(' · ');
        return `<div class="comparison-price"><strong>${esc(label)}</strong><dl><div><dt>보증금</dt><dd>${esc(row.at(-2))}</dd></div><div><dt>월세</dt><dd>${esc(row.at(-1))}</dd></div></dl></div>`;
      }).join('');
    }).join('');
  }
  function card(path,r,active,state){
    return `<li>${r.image?`<img class="collection-house-photo" src="${esc(r.image.src)}" alt="${esc(r.image.alt||r.title)}" loading="lazy" decoding="async">`: ''}<div class="collection-card-meta"><small>${esc(r.kind)} · ${esc(r.type)}</small><button type="button" class="collection-remove" data-remove="${path}" aria-label="${esc(r.title)} ${active==='saved'?'관심 주택에서 삭제':'최근 기록 삭제'}" title="${active==='saved'?'관심 주택에서 삭제':'최근 기록 삭제'}"><span aria-hidden="true">×</span></button></div><a href="${path}">${esc(r.title)}</a><p class="collection-house-summary">${esc([r.area,r.notice].filter(Boolean).join(" · "))}</p>${actions(path,state)}</li>`;
  }
  function render(active,state,records){
    let html;
    const tabs=[['saved','관심 주택'],['recent','최근 본 주택'],['compare','비교하기']].map(([tab,label])=>`<button type="button" data-tab="${tab}" aria-pressed="${active===tab}">${label} <b>${state[tab].length}</b></button>`).join('');
    const paths=state[active];
    if(!paths.length){html=`<div class="collection-empty"><strong>${active==='saved'?'관심 주택을 저장해 보세요':active==='recent'?'주택을 둘러보세요':'비교할 주택을 담아보세요'}</strong><p>${active==='recent'?'열어 본 주택이 자동으로 기록됩니다.':`주택에서 ‘${active==='compare'?'비교 담기':'관심 저장'}’를 누르세요.`}</p><div class="collection-empty-links"><a href="/bbs/group.php?gr_id=aymap">공공임대 둘러보기</a><a href="/plan">민간임대 둘러보기</a></div></div>`;return {tabs,content:html};}
    if(active==='compare'){
      const fields=[['type','임대 유형'],['agency','공급 기관'],['address','지역 / 주소'],['area','전용면적'],['status','모집 상태'],['prices','보증금 / 월세']];
      html=`<div class="collection-table-wrap" tabindex="0" role="region" aria-label="항목별 비교표"><table class="collection-table${paths.length===1?' collection-table-single':''}" style="--compare-columns:${paths.length}"><colgroup><col class="comparison-label-column">${paths.map(()=>'<col>').join('')}</colgroup><caption>선택한 주택 비교</caption><thead><tr><th scope="col">비교 항목</th>${paths.map(path=>`<th scope="col"><a href="${path}" title="${esc(records.get(path).title)}">${esc(records.get(path).title)}</a><button type="button" data-remove="${path}" aria-label="${esc(records.get(path).title)} 비교에서 빼기" title="비교에서 빼기"><span aria-hidden="true">×</span></button></th>`).join('')}</tr></thead><tbody>${fields.map(([field,label])=>`<tr><th scope="row">${label}</th>${paths.map(path=>`<td>${field==='prices'?comparisonPrices(records.get(path)):esc(cell(records.get(path),field))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }else html=`${active==='recent'?'<div class="collection-tools"><button type="button" data-clear>최근 기록 전체 삭제</button></div>':''}<ul class="collection-list">${paths.map(path=>card(path,records.get(path),active,state)).join('')}</ul>`;
    return {tabs,content:html};
  }
  return {actions,actionLabel,render};
})();
