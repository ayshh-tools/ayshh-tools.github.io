'use strict';
// Shared photo state for public and private detail pages. DOM wiring runs after app setup.
let galleryImages = [], photoIndex = 0;
function selectPhotoButton(button, selected) {
 button.classList.toggle('active',selected);
 button.setAttribute('aria-pressed',String(selected));
}

function revealPhotoTab(container, button) {
 if(!button || !container.clientHeight || !container.clientWidth)return;
 const bounds=container.getBoundingClientRect(), tab=button.getBoundingClientRect();
 const top=bounds.top+container.clientTop, left=bounds.left+container.clientLeft;
 const bottom=top+container.clientHeight, right=left+container.clientWidth;
 // Scroll only the tab list; selecting a photo must not move the document.
 if(tab.top<top)container.scrollTop+=tab.top-top;
 else if(tab.bottom>bottom)container.scrollTop+=Math.min(tab.bottom-bottom,tab.top-top);
 if(tab.left<left)container.scrollLeft+=tab.left-left;
 else if(tab.right>right)container.scrollLeft+=Math.min(tab.right-right,tab.left-left);
}

function renderGallery(images) {
 galleryImages = images;
 photoIndex = 0;
 $('gallery').hidden = !images.length;
 $('gallery-tabs').replaceChildren(...images.map((image, index) => {
  const button = document.createElement('button');
  button.type='button';
  button.textContent = image.alt||`이미지 ${index+1}`;
  button.addEventListener('click', () => showPhoto(index));
  return button;
 }));
 if (images.length) showPhoto(0);
}

function showPhoto(index) {
 if(!galleryImages.length)return;
 photoIndex=(index+galleryImages.length)%galleryImages.length;
 const image=galleryImages[photoIndex],tabs=$('gallery-tabs');
 $('gallery-image').src=image.src;
 $('gallery-image').alt=image.alt;
 $('gallery-count').textContent=`${photoIndex+1} / ${galleryImages.length}`;
 Array.from(tabs.children).forEach((button,index)=>selectPhotoButton(button,index===photoIndex));
 revealPhotoTab(tabs,tabs.children[photoIndex]);
 const track=$('legacy-photo-track');
 if(track)track.style.transform=`translateX(-${photoIndex*100}%)`;
 $('legacy-photo-dots')?.querySelectorAll?.('button').forEach((dot,index)=>selectPhotoButton(dot,index===photoIndex));
}

let lightboxIndex=0,photoScale=1,photoX=0,photoY=0,photoDrag=null,photoFocus=null;
const photoPointers=new Map();
function resetPhotoGesture(){photoPointers.clear();photoDrag=null;}
function transformPhoto(){
 if(photoScale===1)photoX=photoY=0;
 $('photo-image').style.transform=`translate(${photoX}px,${photoY}px) scale(${photoScale})`;
}
function openPhoto(index){
 if(!galleryImages.length)return;
 resetPhotoGesture();
 if($('photo-lightbox').hidden){photoFocus=document.activeElement;$('photo-lightbox').hidden=false;document.body.style.overflow='hidden';$('photo-close').focus();}
 lightboxIndex=(index+galleryImages.length)%galleryImages.length;photoScale=1;photoX=photoY=0;transformPhoto();
 $('photo-image').src=galleryImages[lightboxIndex].src;$('photo-image').alt=galleryImages[lightboxIndex].alt;
 $('photo-counter').textContent=`${lightboxIndex+1} / ${galleryImages.length}`;
 const restoreNameFocus=Array.from($('photo-names').children).includes(document.activeElement);
 $('photo-names').replaceChildren(...galleryImages.map((image,i)=>{const button=document.createElement('button');button.type='button';button.textContent=image.alt||`이미지 ${i+1}`;selectPhotoButton(button,i===lightboxIndex);button.addEventListener('click',()=>openPhoto(i));return button;}));
 if(restoreNameFocus)$('photo-names').children[lightboxIndex]?.focus();
 $('photo-names').children[lightboxIndex]?.scrollIntoView({block:'nearest',inline:'center'});
}
function closePhoto(){ $('photo-lightbox').hidden=true;document.body.style.overflow='';resetPhotoGesture();photoFocus?.focus(); }

function initializeGallery(){
$('gallery-prev').addEventListener('click',()=>showPhoto(photoIndex-1));$('gallery-next').addEventListener('click',()=>showPhoto(photoIndex+1));
$('gallery-image').addEventListener('click',()=>openPhoto(photoIndex));
$('photo-close').addEventListener('click',closePhoto);
$('photo-prev').addEventListener('click',()=>openPhoto(lightboxIndex-1));$('photo-next').addEventListener('click',()=>openPhoto(lightboxIndex+1));
$('photo-lightbox').addEventListener('click',event=>{if(event.target===$('photo-lightbox'))closePhoto();});
document.addEventListener('keydown',event=>{if($('photo-lightbox').hidden)return;if(event.key==='Escape')closePhoto();if(event.key==='ArrowLeft')openPhoto(lightboxIndex-1);if(event.key==='ArrowRight')openPhoto(lightboxIndex+1);if(event.key==='Tab'){const controls=[$('photo-close'),$('photo-prev'),$('photo-next'),...$('photo-names').children];const next=(controls.indexOf(document.activeElement)+(event.shiftKey?-1:1)+controls.length)%controls.length;event.preventDefault();controls[next].focus();}});
$('photo-lightbox').addEventListener('wheel',event=>{event.preventDefault();photoScale=Math.max(1,Math.min(5,photoScale+(event.deltaY>0?-.1:.1)));transformPhoto();},{passive:false});
$('photo-image').addEventListener('dblclick',()=>{photoScale=photoScale===1?2:1;photoX=photoY=0;transformPhoto();});
$('photo-image').addEventListener('pointerdown',event=>{event.preventDefault();if(photoPointers.size>=2)return;photoPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});$('photo-image').setPointerCapture(event.pointerId);photoDrag={x:event.clientX,y:event.clientY,px:photoX,py:photoY,pinch:photoPointers.size>1};});
$('photo-image').addEventListener('pointermove',event=>{
 if(!photoPointers.has(event.pointerId))return;
 const distance=()=>{const [a,b]=[...photoPointers.values()];return Math.hypot(a.x-b.x,a.y-b.y);};
 const oldDistance=photoPointers.size===2?distance():0;photoPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(photoPointers.size===2){photoDrag.pinch=true;photoScale=Math.max(1,Math.min(5,photoScale+(distance()-oldDistance)/200));}
 else if(photoScale>1){photoX=photoDrag.px+event.clientX-photoDrag.x;photoY=photoDrag.py+event.clientY-photoDrag.y;}
 transformPhoto();
});
function endPhotoPointer(event){
 if(!photoPointers.has(event.pointerId))return;
 const pinch=photoDrag?.pinch;
 photoPointers.delete(event.pointerId);
 if(!pinch&&photoScale===1&&photoDrag){
  const delta=event.clientX-photoDrag.x;
  if(Math.abs(delta)>60)openPhoto(lightboxIndex+(delta>0?-1:1));
 }
 if(photoPointers.size===1){
  const point=[...photoPointers.values()][0];
  photoDrag={x:point.x,y:point.y,px:photoX,py:photoY,pinch:true};
 }else if(!photoPointers.size)photoDrag=null;
}
$('photo-image').addEventListener('pointerup',endPhotoPointer);$('photo-image').addEventListener('pointercancel',event=>{if(photoPointers.has(event.pointerId))resetPhotoGesture();});
}
