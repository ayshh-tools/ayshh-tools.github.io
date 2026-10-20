'use strict';
const NoticeLifecycle = (() => {
 const before = [], after = [];
 return {
  beforeRender(callback) { before.push(callback); },
  afterRender(callback) { after.push(callback); },
  render(renderScreen) {
   before.forEach(callback => callback());
   renderScreen();
   after.forEach(callback => callback());
  }
 };
})();
if(typeof module!=='undefined')module.exports=NoticeLifecycle;
