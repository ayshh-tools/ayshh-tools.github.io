'use strict';
// Pure calculator rules; form formatting and labels stay in shell.js.
const HousingCalculations = (() => {
 function loan({principal, months, annualRate, kind}) {
  if(![principal,months,annualRate].every(Number.isFinite)||principal<=0||months<=0||!Number.isInteger(months)||annualRate<0||annualRate>100)return null;
  const rate=annualRate/1200;
  if(kind==='bullet')return {interest:principal*rate*months,first:principal*rate,last:principal};
  if(kind==='principal')return {interest:principal*rate*(months+1)/2,first:principal/months+principal*rate,last:principal/months*(1+rate)};
  if(kind!=='annuity')return null;
  const first=rate===0?principal/months:principal*rate/-Math.expm1(-months*Math.log1p(rate));
  return {interest:Math.max(0,first*months-principal),first};
 }
 function conversion({deposit,rent,annualRate,direction,mode,ratio,amount}) {
  if(![deposit,rent,annualRate].every(Number.isFinite)||deposit<=0||rent<=0||annualRate<=0||annualRate>100||!['up','down'].includes(direction))return null;
  const rate=annualRate/100;
  const maximum=direction==='up'?rent*12/rate:deposit;
  if(mode==='ratio'&&(!Number.isFinite(ratio)||ratio<=0||ratio>1))return null;
  if(mode==='amount'&&(!Number.isFinite(amount)||amount<=0))return null;
  if(!['ratio','amount'].includes(mode))return null;
  const requested=mode==='amount'?amount:maximum*ratio;
  if(requested>maximum+1e-6)return null;
  const change=Math.min(requested,maximum);
  return {
   deposit:Math.max(0,deposit+(direction==='up'?change:-change)),
   rent:Math.max(0,rent+(direction==='up'?-change*rate/12:change*rate/12))
  };
 }
 return {loan,conversion};
})();
if(typeof module!=='undefined')module.exports=HousingCalculations;
