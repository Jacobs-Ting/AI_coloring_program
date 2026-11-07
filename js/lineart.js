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
// Personal-key mode: send the user's temporary key directly to OpenAI over HTTPS.
export class AILineartProvider{
 async generate({signal,apiKey}={}){
 if(!apiKey?.trim())throw new Error('請先在 API Key 設定輸入自己的 OpenAI API Key。');
 const themes=[['小熊花園','a bear in a flower garden'],['貓咪午茶','a kitten having afternoon tea'],['兔兔野餐','a rabbit having a picnic'],['森林小屋','a cozy woodland cottage'],['甜點派對','cupcakes and strawberries'],['狐狸與星星','a little fox watching stars']];
 const [title,subject]=themes[Math.floor(Math.random()*themes.length)];
 let response;
 try{response=await fetch('https://api.openai.com/v1/images/generations',{
 method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey.trim()}`},signal,
 body:JSON.stringify({model:'gpt-image-2.5-sunburst',n:1,size:'1024x1024',quality:'low',output_format:'png',background:'opaque',prompt:`Original children's coloring book page: ${subject}. Pure black clean bold rounded outlines on pure white background. Large closed shapes with white unfilled interiors, generous coloring spaces and empty margins. No gray shading, colors, gradients, textures, text, watermarks, logos or copyrighted characters.`})
 });}catch(e){if(e.name==='AbortError')throw e;throw new Error('無法連線至 OpenAI。請檢查網路、瀏覽器是否允許跨來源請求，以及所在地是否支援 OpenAI API。');}
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const messages={401:'API Key 無效，請重新貼上完整金鑰。',403:'此帳號無模型權限，請檢查 OpenAI 專案設定。',429:'OpenAI 額度不足或請求過多，請檢查 API 帳務與用量。'};throw new Error(messages[response.status]||`OpenAI 生成失敗（${response.status}），請稍後再試。`);}
 const source=data.data?.[0]?.b64_json;if(typeof source!=='string')throw new Error('OpenAI 未回傳圖片，請稍後再試。');
 return{id:`ai-${crypto.randomUUID()}`,title:`AI · ${title}`,url:await transparentLineart(`data:image/png;base64,${source}`),generated:true};
 }
}
