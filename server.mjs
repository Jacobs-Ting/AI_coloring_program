import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomInt} from 'node:crypto';
const root=new URL('./',import.meta.url);
const themes=[['小熊的花園','a cute little bear gardening with flowers'],['貓咪麵包店','a kitten in a tiny bakery'],['兔兔野餐','a rabbit having a picnic'],['森林小屋','a cozy woodland cottage with mushrooms'],['花朵茶壺','a teapot surrounded by flowers'],['甜點派對','cute cupcakes and strawberries'],['狐狸與星星','a little fox watching stars'],['貓頭鷹書房','a cute owl reading a book']];
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
export function createHandler({key='',model=process.env.OPENAI_IMAGE_MODEL||'gpt-image-2.5-sunburst',port=Number(process.env.PORT||8080),fetchImpl=fetch,now=Date.now}={}){
 let active=false,last=-Infinity,day='',count=0;
 return async(req,res)=>{try{
 const hosts=[`localhost:${port}`,`127.0.0.1:${port}`];
 if(!hosts.includes(req.headers.host))return json(res,403,{error:'僅允許本機存取'});
 const url=new URL(req.url,`http://${req.headers.host}`);
 if(url.pathname==='/api/health'&&req.method==='GET')return json(res,200,{app:'magic-coloring-house'});
 if(url.pathname==='/api/generate'){
 if(req.method!=='POST')return json(res,405,{error:'請使用 POST'});
 if(req.headers.origin!==`http://${req.headers.host}`||req.headers['content-type']!=='application/json')return json(res,403,{error:'請從同一個本機網站操作'});
 const requestKey=req.headers['x-openai-key']||key;
 if(typeof requestKey!=='string'||!requestKey.trim()||requestKey.length>512||/[\r\n]/.test(requestKey))return json(res,400,{error:'請先在 API Key 設定中輸入有效金鑰。'});
 if(active||now()-last<10000)return json(res,429,{error:'請稍候再生成，一次只能處理一張圖片。'});
 const today=new Date(now()).toISOString().slice(0,10);if(day!==today){day=today;count=0;}
 if(count>=20)return json(res,429,{error:'本次服務今日已達 20 次請求上限。'});
 active=true;last=now();count++;
 try{
 const [title,subject]=themes[randomInt(themes.length)];
 const response=await fetchImpl('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${requestKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(150000),body:JSON.stringify({model,n:1,size:'1024x1024',quality:'low',output_format:'png',background:'opaque',prompt:`Create an original children's coloring book page: ${subject}. Pure black clean bold rounded outlines on a pure white background. All interior regions must be white and unfilled, including character bodies. Simple large closed shapes, generous empty spaces for hand coloring. Center composition with a wide empty margin. No color, gray shading, gradients, textures, text, letters, watermark, logos, or copyrighted characters.`})});
 if(!response.ok){const messages={401:'OpenAI API Key 無效，請檢查環境變數。',403:'帳號尚無此圖片模型權限，請檢查 OpenAI 專案設定。',429:'OpenAI 額度不足或請求過多，請檢查 API 帳務與用量。'};return json(res,response.status===429?429:502,{error:messages[response.status]||`OpenAI 生成失敗（${response.status}），請稍後再試。`});}
 const data=await response.json(),base64=data.data?.[0]?.b64_json;
 if(typeof base64!=='string'||base64.length>24000000||!base64.startsWith('iVBORw0KGgo'))return json(res,502,{error:'OpenAI 未回傳有效 PNG，請稍後再試。'});
 json(res,200,{id:`ai-${randomUUID()}`,title:`AI · ${title}`,image:`data:image/png;base64,${base64}`});
 }catch(e){json(res,502,{error:e.name==='TimeoutError'?'圖片生成逾時，請稍後再試；此請求仍可能計費。':'無法連線至 OpenAI，請檢查網路後再試。'});}finally{active=false;}return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'不支援此操作'});
 const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
 // Explicit public file allowlist: never serve .env, server sources, or arbitrary paths.
 if(!(/^\/(index\.html|style\.css)$/.test(pathname)||/^\/js\/[a-z-]+\.js$/.test(pathname)||pathname==='/assets/audio/Graphite_and_Tea.mp3'||/^\/assets\/lineart\/[a-z-]+\.svg$/.test(pathname)))return json(res,404,{error:'找不到檔案'});
 const content=await readFile(new URL('.'+pathname,root));
 res.writeHead(200,{'Content-Type':pathname.endsWith('.mp3')?'audio/mpeg':pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.css')?'text/css':pathname.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch{if(!res.headersSent)json(res,404,{error:'找不到檔案'});else res.end();}};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){const port=Number(process.env.PORT||8080);createServer(createHandler({port})).listen(port,'127.0.0.1',()=>console.log(`魔法塗色屋：http://localhost:${port}（請在網頁輸入 API Key）`));}
