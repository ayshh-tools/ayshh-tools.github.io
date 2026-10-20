'use strict';
// Only this controller changes the active top-level screen or shared detail map.
const NoticeView = (() => {
 const screens = {
  landing: 'landing', catalog: 'catalog', map: 'detail',
  unit: 'unit-detail', private: 'private-list', 'private-unit': 'unit-detail'
 };
 let unitMap, unitMarker;
 return {
  show(view) {
   document.body.dataset.view = view;
   for (const id of new Set(Object.values(screens))) $(id).hidden = id !== screens[view];
   if (view === 'private-unit') $('notice-downloads').hidden = true;
  },
  focusCurrent() {
   const view = document.body.dataset.view;
   // The private map's heading is visually hidden; focus its visible search.
   if (view === 'private') {
    $('private-search').focus({preventScroll: true});
    return;
   }
   const screen = $(screens[view]);
   const heading = screen?.querySelector('h1');
   if (!heading) return;
   // Programmatic focus announces SPA navigation without adding a tab stop.
   heading.tabIndex = -1;
   heading.focus({preventScroll: true});
  },
  showUnitLocation(coord, icon) {
   if (!unitMap) {
    unitMap = createMap('unit-map');
    unitMarker = L.marker(coord, {icon}).addTo(unitMap);
   } else {
    unitMarker.setLatLng(coord).setIcon(icon);
   }
   unitMap.invalidateSize();
   unitMap.setView(coord, 16);
  }
 };
})();

function createMap(id){const m=L.map(id,{zoomControl:false}).setView([37.6,126.95],10);L.control.zoom({position:'topright'}).addTo(m);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).addTo(m);return m;}

// Keep the map icon, its keyboard state and the matching list selection aligned.
function setMarkerSelected(marker, selected) {
 marker.setZIndexOffset?.(selected?1000:0);
 const icon=marker.getElement?.();
 if(!icon)return;
 icon.classList.toggle('map-marker-selected',selected);
 icon.setAttribute('aria-pressed',String(selected));
 if(marker.options?.title)icon.setAttribute('aria-label',marker.options.title);
}
