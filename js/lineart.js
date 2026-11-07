export const artworks=[['bear','森林裡的小熊'],['cat','貓咪的午茶'],['rabbit','兔兔與胡蘿蔔'],['cottage','森林小屋'],['flowers','花開的日子'],['cupcake','甜甜杯子蛋糕'],['fox','狐狸的好朋友'],['mushrooms','蘑菇小森林'],['teapot','一壺花香'],['icecream','冰淇淋假期'],['owl','晚安貓頭鷹'],['butterfly','蝴蝶花園']].map(([id,title])=>({id,title,url:`assets/lineart/${id}.svg`}));
// Future provider contract: async generate({excludeId,signal}) => {id,title,url}.
// AI providers should return a sanitized same-origin SVG or CORS-safe image URL.
export class LocalLineartProvider{async generate({excludeId}={}){const choices=artworks.filter(a=>a.id!==excludeId);return choices[Math.floor(Math.random()*choices.length)];}}
export function loadArt(img,art){return new Promise((resolve,reject)=>{img.onload=()=>resolve();const previous=img.getAttribute('src');img.onerror=()=>{img.onerror=null;if(previous)img.src=previous;reject(new Error('線稿載入失敗，請再試一次'));};img.src=art.url;img.alt=art.title;});}

// Remove white pixels before placing AI outlines above the user's paint.
export async function transparentLineart(source){
 if(typeof source!=='string'||source.length>24000000||!source.startsWith('data:image/png;base64,'))throw new Error('AI 回傳的圖片格式無效');
 const img=new Image();await loadArt(img,{url:source,title:'AI 線稿'});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1000;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,1000,1000);
 const pixels=ctx.getImageData(0,0,1000,1000),d=pixels.data;
 for(let i=0;i<d.length;i+=4){const light=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];d[i+3]=Math.round(d[i+3]*Math.max(0,Math.min(1,(245-light)/200)));d[i]=d[i+1]=d[i+2]=0;}
 ctx.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
}
export class AILineartProvider{
 async generate({signal,apiKey}={}){
 if(!/^https?:$/.test(location.protocol))throw new Error('請關閉這個檔案頁面，改為雙擊資料夾中的「啟動魔法塗色屋.command」。它會自動啟動 AI 服務並開啟網頁，再於新頁面輸入 API Key。');
 const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json','X-OpenAI-Key':apiKey},body:'{}',signal});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'AI 服務未啟動，請使用 README 中的 AI 啟動方式。');
 if(typeof data.id!=='string'||!data.id.startsWith('ai-')||typeof data.title!=='string')throw new Error('AI 回傳資料格式無效');
 return{id:data.id,title:data.title.slice(0,100),url:await transparentLineart(data.image),generated:true};
 }
}
