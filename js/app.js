import{setupMusic}from'./music.js';
import{History}from'./history.js';import{DrawingCanvas,blobFrom,SIZE}from'./canvas.js';import{Brush}from'./brush.js';import{storage}from'./storage.js';import{artworks,LocalLineartProvider,AILineartProvider,loadArt}from'./lineart.js';
const $=id=>document.getElementById(id),history=new History(),drawing=new DrawingCanvas($('drawing')),provider=new LocalLineartProvider();let art=artworks[0],workId=null,dirty=false,busy=false,revision=0;
const status=t=>$('status').textContent=t;const fail=e=>{console.error(e);status('操作未完成');alert(e.message||'操作失敗，請再試一次。');};
function refresh(current){drawing.render(current?[...history.all,current]:history.all);$('undo').disabled=!history.commands.length;$('redo').disabled=!history.future.length;}
function changed(){dirty=true;revision++;status('有新的色彩 · 尚未儲存');}
const brush=new Brush($('drawing'),history,refresh,changed,()=>alert('這張作品的筆畫容量已滿，請先下載收藏，再開啟新作品。'));
function guard(){brush.commit();return !dirty||confirm('目前有尚未儲存的修改。確定要離開這張作品嗎？');}
function tool(name){brush.tool=name;for(const id of ['brush','eraser']){$(id).classList.toggle('active',id===name);$(id).setAttribute('aria-pressed',String(id===name));}}
$('brush').onclick=()=>tool('brush');$('eraser').onclick=()=>tool('eraser');
const colors=['#dd8292','#efaf83','#efd076','#93ac84','#80b7b1','#8caed0','#a89ac5','#d2a6c2','#a67c63','#6e6157','#d3cdc0','#ffffff'];
function setColor(c){brush.color=c;$('color').value=c;$('brushDot').style.background=c;document.querySelectorAll('.swatch').forEach(b=>{const selected=b.dataset.color===c;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});tool('brush');}
colors.forEach((c,i)=>{const b=document.createElement('button');b.className='swatch';b.style.background=c;b.dataset.color=c;b.title=['玫瑰粉','蜜桃橘','奶油黃','鼠尾草綠','薄荷綠','天空藍','薰衣草紫','莓果粉','可可棕','暖灰','米灰','白色'][i];b.setAttribute('aria-label',b.title);b.onclick=()=>setColor(c);$('palette').append(b);});setColor(colors[0]);
$('color').oninput=e=>setColor(e.target.value);$('size').oninput=e=>{brush.size=Number(e.target.value);$('sizeLabel').value=`${brush.size} px`;$('brushDot').style.width=$('brushDot').style.height=`${brush.size}px`;};
function step(action){brush.commit();if(action==='undo'?!history.commands.length:!history.future.length)return;history[action]();refresh();changed();}
$('undo').onclick=()=>step('undo');$('redo').onclick=()=>step('redo');$('clear').onclick=()=>{brush.commit();if(confirm('清空所有顏色？你仍可使用復原找回。')){history.push({type:'clear'});refresh();changed();}};
async function switchArt(next,commands=[],id=null){await loadArt($('lineart'),next);art=next;workId=id;history.reset(commands);dirty=false;revision++;refresh();$('artTitle').textContent=art.title;status(id?'已開啟儲存作品':'準備好開始了');}
$('surprise').onclick=async()=>{if(busy||!guard())return;busy=true;try{await switchArt(await provider.generate({excludeId:art.id}));}catch(e){fail(e);}finally{busy=false;}};
$('save').onclick=async()=>{if(busy)return;brush.commit();busy=true;$('save').disabled=true;const savedRevision=revision,id=workId||crypto.randomUUID(),commands=structuredClone(history.all),savedArt=art;try{const composite=await drawing.composite($('lineart'));const thumb=document.createElement('canvas');thumb.width=thumb.height=240;thumb.getContext('2d').drawImage(composite,0,0,240,240);await storage.save({id,lineartId:savedArt.id,lineart:savedArt.generated?savedArt:undefined,width:SIZE,height:SIZE,commands,updatedAt:Date.now(),thumbnail:await blobFrom(thumb)});workId=id;if(revision===savedRevision){dirty=false;status('已儲存 ♡');}else status('進度已儲存 · 另有新修改');}catch(e){fail(new Error(`儲存失敗：${e.message}。請下載 PNG 保留作品。`));}finally{busy=false;$('save').disabled=false;}};
$('download').onclick=async()=>{brush.commit();try{const blob=await blobFrom(await drawing.composite($('lineart'))),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`魔法塗色屋-${art.title}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status(dirty?'圖片已下載 · 進度尚未儲存':'圖片已下載');}catch(e){fail(e);}};
let aiController,sessionApiKey='';
function updateKeyStatus(){$('keyStatus').textContent=sessionApiKey?'金鑰已填入 · 僅本次分頁':'尚未輸入金鑰';}
$('keySettings').onclick=()=>{$('apiKeyInput').value='';$('keyDialog').showModal();};
$('closeKey').onclick=()=>$('keyDialog').close();
$('keyDialog').addEventListener('close',()=>{$('apiKeyInput').value='';});
$('keyForm').onsubmit=e=>{e.preventDefault();const value=$('apiKeyInput').value.trim();if(!value||/[\r\n]/.test(value)){status('請輸入有效的 API Key');return;}sessionApiKey=value;$('apiKeyInput').value='';updateKeyStatus();$('keyDialog').close();};
$('clearKey').onclick=()=>{sessionApiKey='';$('apiKeyInput').value='';aiController?.abort();updateKeyStatus();$('keyDialog').close();status('金鑰已清除');};
window.addEventListener('pagehide',()=>{sessionApiKey='';$('apiKeyInput').value='';aiController?.abort();updateKeyStatus();});
$('aiGenerate').onclick=async()=>{
 if(busy)return;if(!sessionApiKey){$('keySettings').click();return;}if(!guard())return;
 const startRevision=revision;busy=true;aiController=new AbortController();const timer=setTimeout(()=>aiController?.abort(),180000);
 $('aiGenerate').disabled=true;$('aiGenerate').textContent='✦ 正在繪製線稿…';$('aiCancel').hidden=false;status('AI 正在創作，可能需要幾分鐘…');
 try{const next=await new AILineartProvider().generate({signal:aiController.signal,apiKey:sessionApiKey});if(revision===startRevision||guard()){await switchArt(next);changed();status('AI 線稿已就緒 · 請儲存以收藏');}}
 catch(e){if(e.name==='AbortError')status('已停止等待 · 請求仍可能計費');else fail(e);}
 finally{clearTimeout(timer);busy=false;aiController=null;$('aiGenerate').disabled=false;$('aiGenerate').textContent='✦ AI 生成線稿';$('aiCancel').hidden=true;}
};
$('aiCancel').onclick=()=>aiController?.abort();
let galleryUrls=[];function releaseUrls(){galleryUrls.forEach(URL.revokeObjectURL);galleryUrls=[];}
$('gallery').onclick=async()=>{if(busy)return;brush.commit();const dialog=$('galleryDialog');dialog.showModal();await renderGallery();};
async function renderGallery(){releaseUrls();const root=$('galleryItems');root.replaceChildren();try{const works=(await storage.list()).sort((a,b)=>b.updatedAt-a.updatedAt);if(!works.length){root.innerHTML='<p class="empty">畫廊還在等第一幅作品。拿起畫筆，開始吧 ♡</p>';return;}for(const w of works){const card=document.createElement('article');card.className='gallery-card';const img=document.createElement('img'),url=URL.createObjectURL(w.thumbnail);galleryUrls.push(url);img.src=url;img.alt=artworks.find(a=>a.id===w.lineartId)?.title||'作品';const date=document.createElement('small');date.textContent=new Date(w.updatedAt).toLocaleString('zh-TW');const open=document.createElement('button');open.textContent='繼續塗色';open.onclick=async()=>{if(busy||!guard())return;busy=true;try{const next=w.lineart?.generated&&/^data:image\/png;base64,/.test(w.lineart.url)?w.lineart:artworks.find(a=>a.id===w.lineartId);if(!next||w.width!==SIZE||!Array.isArray(w.commands))throw new Error('無法讀取這份作品');await switchArt(next,w.commands,w.id);$('galleryDialog').close();}catch(e){fail(e);}finally{busy=false;}};const del=document.createElement('button');del.textContent='刪除';del.onclick=async()=>{if(!confirm('永久刪除這份儲存作品？'))return;try{await storage.delete(w.id);if(workId===w.id){workId=null;changed();}await renderGallery();}catch(e){fail(e);}};card.append(img,date,open,del);root.append(card);}}catch(e){root.textContent='無法讀取畫廊，請確認瀏覽器允許本機儲存。';console.error(e);}}
$('closeGallery').onclick=()=>$('galleryDialog').close();$('galleryDialog').addEventListener('close',releaseUrls);
window.addEventListener('beforeunload',e=>{if(dirty||brush.current){e.preventDefault();e.returnValue='';}});document.addEventListener('keydown',e=>{if($('galleryDialog').open||/INPUT|TEXTAREA/.test(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();step(e.shiftKey?'redo':'undo');}});
loadArt($('lineart'),art).then(()=>refresh()).catch(fail);
if(matchMedia('(max-width:620px)').matches)document.querySelector('details').open=false;

setupMusic($('backgroundMusic'),$('musicToggle'),$('musicNotice'));
