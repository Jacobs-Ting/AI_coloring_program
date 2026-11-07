export const SIZE=1000;
export function paint(ctx,command){
 if(command.type==='clear'){ctx.clearRect(0,0,SIZE,SIZE);return;}
 const pts=command.points;if(!pts?.length)return;
 ctx.save();ctx.globalCompositeOperation=command.tool==='eraser'?'destination-out':'source-over';ctx.strokeStyle=command.color;ctx.fillStyle=command.color;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=command.size;
 if(pts.length===1){ctx.beginPath();ctx.arc(pts[0].x,pts[0].y,command.size/2,0,Math.PI*2);ctx.fill();}
 else{ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++){const p=pts[i],next=pts[i+1];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);}const last=pts.at(-1);ctx.lineTo(last.x,last.y);ctx.stroke();}ctx.restore();
}
export class DrawingCanvas {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');}
 render(commands){this.ctx.clearRect(0,0,SIZE,SIZE);for(const cmd of commands)paint(this.ctx,cmd);}
 async composite(lineart){const out=document.createElement('canvas');out.width=out.height=SIZE;const ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(this.canvas,0,0);ctx.drawImage(lineart,0,0,SIZE,SIZE);return out;}
}
export function blobFrom(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('圖片輸出失敗')),'image/png'));}
