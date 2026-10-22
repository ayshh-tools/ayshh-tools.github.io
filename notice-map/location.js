'use strict';
// URL policy shared by navigation, status badges and path-based saved homes.
const NoticeLocation = (() => {
 function parse(location){
  const path=location.pathname,params=new URLSearchParams(location.search);
  const publicMatch=path.match(/^\/([0-9]{8})(?:\/([0-9]+))?\/?$/);
  const privateMatch=path.match(/^\/plan\/([0-9]+)\/?$/);
  return {
   home:/^\/content\/map\/?$/.test(path),
   catalog:path==='/bbs/group.php'&&params.get('gr_id')==='aymap',
   privateList:/^\/plan\/?$/.test(path)||path==='/bbs/board.php'&&params.get('bo_table')==='plan',
   privateId:privateMatch?.[1],
   publicPath:Boolean(publicMatch),
   noticeId:publicMatch?.[1]||params.get('notice'),
   unitId:publicMatch?.[2]||params.get('unit'),
   recordPath:path.replace(/\/$/,'')
  };
 }
 function isInternal(url,origin){
  if(url.origin!==origin)return false;
  const route=parse(url);
  return Boolean(route.home||route.catalog||route.privateList||route.privateId||route.publicPath);
 }
 return {parse,isInternal};
})();
if(typeof module!=='undefined')module.exports=NoticeLocation;
