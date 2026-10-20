'use strict';
// Search matches a whole building; area and deposit select units within it.
const PublicFilters = (() => {
 function matchesUnit(unit,{area='',deposit=''}={}) {
  const areaOK=!area||(area==='small'?unit.area<40:area==='40-60'?unit.area>=40&&unit.area<60:area==='60-85'?unit.area>=60&&unit.area<85:unit.area>85);
  // Preserve the source's boundary and its treatment of missing deposit values.
  const depositOK=!deposit||!unit.deposits.length||unit.deposits.some(value=>deposit==='low'?value<1e8:deposit==='5'?value>=5e8:value>=Number(deposit.split('-')[0])*1e8&&value<Number(deposit.split('-')[1])*1e8);
  return areaOK&&depositOK;
 }
 function select(places,criteria={}) {
  const query=(criteria.search||'').trim().toLowerCase();
  return places.filter(place=>(!criteria.region||place.region===criteria.region)&&(!criteria.district||place.district===criteria.district)&&(!query||`${place.address} ${place.units.map(unit=>unit.label).join(' ')}`.toLowerCase().includes(query)))
   .map(place=>({...place,shown:place.units.filter(unit=>matchesUnit(unit,criteria))}))
   .filter(place=>place.shown.length);
 }
 return {matchesUnit,select};
})();
if(typeof module!=='undefined')module.exports=PublicFilters;
