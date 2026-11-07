export function setupMusic(audio,button,notice){
 audio.volume=.35;
 const update=()=>{button.textContent=audio.paused?'♫ 開啟音樂':'Ⅱ 暫停音樂';button.setAttribute('aria-pressed',String(!audio.paused));};
 for(const event of ['play','pause','ended'])audio.addEventListener(event,update);
 audio.addEventListener('error',()=>{update();notice.textContent='音樂載入失敗，請確認音樂檔案已隨網站上傳。';});
 button.onclick=async()=>{if(!audio.paused){audio.pause();return;}button.disabled=true;try{await audio.play();notice.textContent='';}catch{notice.textContent='無法播放音樂，請再點一次或確認音樂檔案存在。';}finally{button.disabled=false;update();}};
 update();
}
