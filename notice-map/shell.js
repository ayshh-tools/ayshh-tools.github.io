/* Shared controls measured against the source's /content/map screen. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const menu = byId('menu');
  const loanLink = menu.querySelector('a[href*="bo_table=in"]');
  if (loanLink) loanLink.insertAdjacentHTML('beforeend', '<span class="shell-in-badge">IN</span>');
  const desktopLoan = document.querySelector('.desktop-nav a[href*="bo_table=in"]');
  if (desktopLoan) desktopLoan.insertAdjacentHTML('beforeend', '<span class="shell-in-badge">IN</span>');
  new MutationObserver(() => byId('menu-toggle').setAttribute('aria-label', menu.hidden ? '메뉴 열기' : '메뉴 닫기')).observe(menu, {attributes:true,attributeFilter:['hidden']});
  // This mark opens the same verification window as the original footer.
  const mark = document.querySelector('#foot-logo>img');
  if (mark) {
    const link = document.createElement('a');
    link.href = 'https://mark.inicis.com/mark/popup_v3.php?mid=SIRayshh31';
    link.target = 'inicis-verification';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', '이니시스 결제시스템 유효성 확인');
    mark.replaceWith(link); link.append(mark);
    link.addEventListener('click', event => {event.preventDefault();window.open(link.href,'inicis-verification','scrollbars=no,resizable=no,width=565,height=683,noopener');});
  }
  const calculator = byId('calculator');
  calculator.setAttribute('aria-label', '상호전환·대출이자 계산기');
  const floatingCalculator = document.createElement('button');
  floatingCalculator.id = 'calculator-floating';
  floatingCalculator.type = 'button';
  floatingCalculator.setAttribute('aria-label', '계산기');
  floatingCalculator.innerHTML = '<img src="./assets/calculator.png" alt="">';
  document.body.append(floatingCalculator);
  floatingCalculator.addEventListener('click', () => calculator.showModal());
  calculator.innerHTML = `<button id="calculator-close" aria-label="계산기 닫기"><span></span><span></span></button>
  <div class="calculator-inner shell-calculator">
  <div class="shell-cal-tabs"><button class="active" data-shell-tab="conversion">상호전환 계산기</button><button data-shell-tab="loan">대출이자 계산기</button></div>
  <section id="conversion"><form id="conversion-form" class="shell-conversion">
  <div class="shell-section shell-explanation">상호전환은 보증금과 임대료의 비율을 임차인이 직접 조정할 수 있는 제도로, <span id="conversion-caption">보증금을 올리면 임대료가 줄어듭니다.</span></div>
  <div class="shell-directions"><button type="button" class="on" data-direction="up">보증금 <small class="up">▲</small></button><button type="button" data-direction="down">보증금 <small class="down">▼</small></button></div>
  <div class="shell-basic"><label><span class="shell-field-name">기본보증금</span><input id="base-deposit" type="number" min="1" max="10000000000" placeholder="기본보증금" aria-label="기본보증금"><span class="shell-suffix">원</span></label><label><span class="shell-field-name">기본임대료</span><input id="base-rent" type="number" min="1" max="10000000000" placeholder="기본임대료" aria-label="기본임대료"><span class="shell-suffix">원</span></label><label class="last"><span class="shell-field-name rate-name">전환이율</span><input id="conversion-rate" type="number" min="1" max="100" value="6" aria-label="전환이율"><span class="shell-suffix">%</span></label></div>
  <div class="shell-transfer"><label><span class="shell-field-name">전환비율</span><input type="radio" name="transfer-mode" value="ratio" checked aria-label="전환비율 선택"><input id="conversion-ratio" type="number" min="1" max="100" placeholder="전환비율" aria-label="전환비율"><span class="shell-suffix">%</span></label><label><span class="shell-field-name">전환금액(백만원단위)</span><input type="radio" name="transfer-mode" value="amount" aria-label="전환금액 선택"><input id="conversion-amount" type="number" min="1" max="1000" placeholder="전환금액" aria-label="전환금액"><span id="conversion-korean" class="shell-suffix">백만원</span></label></div>
  <div class="shell-section shell-conversion-result"><label>보증금<br><span id="result-deposit">0</span><br><small id="deposit-delta" class="red">0원</small></label><label>임대료<br><span id="result-rent">0</span><br><small id="rent-delta" class="blue">0원</small></label></div>
  </form></section>
  <section id="loan" hidden><form id="loan-form" class="shell-loan"><label><span class="shell-field-name">대출금액</span><input id="loan-amount" type="number" max="1000000" min="1" placeholder="대출금액" aria-label="대출금액"><span class="shell-suffix">만원</span></label><label><span class="shell-field-name">대출기간</span><input id="loan-months" type="number" min="1" max="600" placeholder="대출기간" aria-label="대출기간"><span class="shell-suffix">개월</span></label><label><span class="shell-field-name">대출금리</span><input id="loan-rate" type="number" min="0" step="0.001" max="100" placeholder="대출금리" aria-label="대출금리"><span class="shell-suffix">%</span></label>
  <div class="shell-repayment"><input type="radio" id="loan-bullet" name="loan-kind" value="bullet" checked><label for="loan-bullet">만기일시</label><input type="radio" id="loan-annuity" name="loan-kind" value="annuity"><label for="loan-annuity">원리금균등</label><input type="radio" id="loan-principal-kind" name="loan-kind" value="principal"><label for="loan-principal-kind">원금균등</label></div>
  <div class="shell-loan-result"><div id="loan-empty">대출금액·기간·금리를 입력해 주세요.</div><div id="loan-complete" hidden><p id="loan-summary"></p><p id="loan-schedule"></p><dl id="loan-values"></dl></div></div></form></section>
  </div>`;
  byId('loan-amount').removeAttribute('min');
  ['conversion-rate','conversion-ratio','conversion-amount'].forEach(id=>byId(id).step='any');
  // The source applies its existing min/max attributes on keyup, including
  // integer-only amounts and month counts in the loan form.
  calculator.addEventListener('keyup', event => {
    const input=event.target;
    if (!(input instanceof HTMLInputElement) || input.type!=='number' || input.value==='') return;
    if (['loan-amount','loan-months'].includes(input.id) && /[^0-9]/.test(input.value)) {
      alert('숫자만 입력해 주십시오.');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));return;
    }
    const original=input.value;
    if(input.hasAttribute('min') && Number(input.value)<Number(input.min))input.value=input.min;
    if(input.hasAttribute('max') && Number(input.value)>Number(input.max))input.value=input.max;
    if(input.value!==original)input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  calculator.querySelectorAll('[data-shell-tab]').forEach(button=>{
    button.setAttribute('aria-controls',button.dataset.shellTab);
    button.setAttribute('aria-pressed',String(button.classList.contains('active')));
  });
  calculator.querySelectorAll('[data-direction]').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('on'))));
  byId('calculator-close').addEventListener('click', () => calculator.close());
  calculator.querySelectorAll('[data-shell-tab]').forEach(button => button.addEventListener('click', () => {
    calculator.querySelectorAll('[data-shell-tab]').forEach(other => {other.classList.toggle('active', other === button);other.setAttribute('aria-pressed',String(other===button));});
    byId('conversion').hidden = button.dataset.shellTab !== 'conversion';
    byId('loan').hidden = button.dataset.shellTab !== 'loan';
  }));
  const conversionFeedback=document.createElement('p');
  conversionFeedback.className='calculator-feedback';conversionFeedback.setAttribute('role','status');
  byId('conversion-form').append(conversionFeedback);
  let direction = 'up';
  const number = n => Math.floor(n).toLocaleString('ko-KR');
  const value = id => Number(byId(id).value);
  function koreanAmount(n) {
    const eok = Math.floor(n / 1e8), man = Math.floor(n % 1e8 / 1e4), won = Math.floor(n % 1e4);
    return `${eok ? `${eok.toLocaleString('ko-KR')}억 ` : ''}${man ? `${man.toLocaleString('ko-KR')}만 ` : ''}${won ? `${won.toLocaleString('ko-KR')}원` : !eok && man ? '원' : ''}`.trim();
  }
  function koreanDigits(n) {
    if (!n) return '백만원';
    const digit = ['', '일','이','삼','사','오','육','칠','팔','구'];
    const group = ['', '십', '백', '천'];
    return String(n).split('').map((d,i,a) => {
      const p=a.length-i-1;
      return (Number(d)?digit[Number(d)]+group[p%4]:'')+(p===8?'억':p===4 && a.length<9?'만':'');
    }).join('')+'원';
  }
  function updateNames(form) {
    form.querySelectorAll('input[type=number]').forEach(input => {
      input.parentElement.classList.toggle('has-value', input.value !== '');
    });
    ['base-deposit', 'base-rent', 'loan-amount'].forEach(id => {
      const input=byId(id);
      if (!form.contains(input)) return;
      input.parentElement.querySelector('.shell-suffix').textContent=input.value?koreanDigits(Number(input.value)*(id==='loan-amount'?10000:1)):(id==='loan-amount'?'만원':'원');
    });
  }
  function convert() {
    const form = byId('conversion-form'); updateNames(form);
    const deposit=value('base-deposit'), rent=value('base-rent'), rate=value('conversion-rate')/100;
    const mode=form.querySelector('[name=transfer-mode]:checked').value;
    const ratio=value('conversion-ratio')/100;
    byId('conversion-korean').textContent=koreanDigits(value('conversion-amount')*1e6);
    const required=['base-deposit','base-rent','conversion-rate',mode==='ratio'?'conversion-ratio':'conversion-amount'];
    const complete=required.every(id=>byId(id).value!=='');
    const valid=complete&&required.every(id=>byId(id).validity.valid);
    const result=valid?HousingCalculations.conversion({deposit,rent,annualRate:rate*100,direction,mode,ratio,amount:value('conversion-amount')*1e6}):null;
    conversionFeedback.textContent=complete&&!result?'입력 범위와 전환 가능한 금액을 확인해 주세요.':'';
    if(!result){
      byId('result-deposit').textContent=byId('result-rent').textContent='0';
      byId('deposit-delta').textContent=byId('rent-delta').textContent='0원';
      return;
    }
    const nextDeposit=result.deposit,nextRent=result.rent;
    byId('result-deposit').textContent=number(nextDeposit);
    byId('result-rent').textContent=number(nextRent);
    byId('deposit-delta').textContent=number(Math.abs(Math.floor(nextDeposit)-deposit))+'원';
    byId('rent-delta').textContent=number(Math.abs(Math.floor(nextRent)-rent))+'원';
  }
  calculator.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => {
    direction=button.dataset.direction;
    calculator.querySelectorAll('[data-direction]').forEach(other=>{other.classList.toggle('on',other===button);other.setAttribute('aria-pressed',String(other===button));});
    byId('conversion-rate').value=direction==='up'?'6':'3.5';
    byId('conversion-caption').textContent=direction==='up'?'보증금을 올리면 임대료가 줄어듭니다.':'보증금을 낮추면 임대료가 올라갑니다.';
    byId('deposit-delta').className=direction==='up'?'red':'blue';
    byId('rent-delta').className=direction==='up'?'blue':'red'; convert();
  }));
  ['conversion-ratio','conversion-amount'].forEach((id,index) => byId(id).addEventListener('focus',()=>{
    calculator.querySelector(`[name=transfer-mode][value=${index?'amount':'ratio'}]`).checked=true;convert();
  }));
  byId('conversion-form').addEventListener('input',convert);
  byId('conversion-form').addEventListener('change',convert);
  function calculateLoan() {
    const form=byId('loan-form');updateNames(form);
    const principal=value('loan-amount')*1e4, months=value('loan-months'), rate=value('loan-rate')/1200;
    const fields=['loan-amount','loan-months','loan-rate'];
    const complete=fields.every(id=>byId(id).value!=='');
    const kind=form.querySelector('[name=loan-kind]:checked').value;
    const result=complete&&fields.every(id=>byId(id).validity.valid)?HousingCalculations.loan({principal,months,annualRate:value('loan-rate'),kind}):null;
    byId('loan-empty').hidden=Boolean(result);byId('loan-complete').hidden=!result;
    if(!result){byId('loan-values').replaceChildren();return;}
    const kindName={bullet:'만기일시',annuity:'원리금균등',principal:'원금균등'}[kind];
    const {interest,first,last}=result;
    let firstLabel,lastLabel,schedule;
    if(kind==='bullet'){firstLabel='매월 이자';lastLabel='만기 상환 원금';schedule=`매월 이자 <strong>${koreanAmount(Math.floor(first))}</strong>을 내고, 만기에 원금 <strong>${koreanAmount(Math.floor(last))}</strong>을 상환합니다.`;}
    else if(kind==='principal'){firstLabel='1회차 상환금액';lastLabel='마지막달 상환금액';schedule=`첫달(1회차) <strong>${koreanAmount(Math.floor(first))}</strong>, 마지막달 <strong>${koreanAmount(Math.floor(last))}</strong>을 상환해야 합니다.`;}
    else{firstLabel='매월 상환금액';schedule=`매월 <strong>${koreanAmount(Math.floor(first))}</strong>을 상환해야 합니다.`;}
    byId('loan-summary').innerHTML=`${koreanAmount(principal)}을 ${months}개월 동안 ${value('loan-rate')}% ${kindName} 상환으로 대출 받았을 때`;
    byId('loan-schedule').innerHTML=schedule;
    const rows=[['대출원금',principal],['총대출이자',interest],['총상환금액',principal+interest],[firstLabel,first]];
    if(lastLabel)rows.push([lastLabel,last]);
    byId('loan-values').innerHTML=rows.map(([name,n],i)=>`<div class="${i>=3?'payment':''}"><dt>${name}</dt><dd>${number(n)}원</dd></div>`).join('');
  }
  byId('loan-form').addEventListener('input',calculateLoan);
  byId('loan-form').addEventListener('change',calculateLoan);
  calculator.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
  const galleryImage=byId('gallery-image');
  galleryImage.tabIndex=0;
  galleryImage.setAttribute('role','button');
  galleryImage.setAttribute('aria-haspopup','dialog');
  galleryImage.setAttribute('aria-controls','photo-lightbox');
  galleryImage.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();galleryImage.click();}
  });

})();
