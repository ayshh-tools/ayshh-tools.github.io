'use strict';
// The existing storage key and path-based records are preserved across releases.
const CollectionStore = (() => {
 const key='ayshh-notice-map-collection-v1',recentLimit=50,compareLimit=4;
 function buildRecords(notices,privateSource,recruitmentForUnit) {
  const records=new Map();
  for(const notice of notices)for(const place of notice.places)for(const unit of place.units){
   records.set(`/${notice.id}/${unit.id}`,{title:`${place.address} · ${unit.label}`,kind:'공공임대 세대',type:notice.type,agency:notice.agency,notice:notice.title,address:place.address,area:unit.area?`${unit.area}㎡`:'',recruitment:recruitmentForUnit(notice.recruitment,unit),image:unit.images?.[0],facts:unit.facts,tables:unit.tables});
  }
  for(const item of privateSource)records.set(`/plan/${item.id}`,{title:item.name,kind:'민간임대 단지',type:item.category,address:item.address,image:item.images?.[0]});
  return records;
 }
 function create(records,storage) {
  let state={saved:[],recent:[],compare:[]},persistent=true;
  const clean=value=>Array.isArray(value)?[...new Set(value.filter(path=>typeof path==='string'&&records.has(path)))]:[];
  function read(){
   try{
    const data=JSON.parse(storage.getItem(key)||'{}')||{};
    state={saved:clean(data.saved),recent:clean(data.recent).slice(0,recentLimit),compare:clean(data.compare).slice(0,compareLimit)};
   }catch{persistent=false;}
  }
  function persist(){try{storage.setItem(key,JSON.stringify(state));persistent=true;return true;}catch{persistent=false;return false;}}
  function toggle(kind,path){
   if(!['saved','compare'].includes(kind)||!records.has(path))return false;
   const list=state[kind],index=list.indexOf(path);
   if(index>=0)list.splice(index,1);
   else{if(kind==='compare'&&list.length>=compareLimit)return false;list.unshift(path);}
   return true;
  }
  function track(path){if(records.has(path))state.recent=[path,...state.recent.filter(value=>value!==path)].slice(0,recentLimit);}
  function remove(kind,path){if(Object.hasOwn(state,kind))state[kind]=state[kind].filter(value=>value!==path);}
  function clearRecent(){state.recent=[];}
  read();
  return {get state(){return state;},get persistent(){return persistent;},read,persist,toggle,track,remove,clearRecent};
 }
 return {key,compareLimit,buildRecords,create};
})();
if(typeof module!=='undefined')module.exports=CollectionStore;
