import {SIZE} from './canvas.js';
export class Brush {
 constructor(canvas,history,redraw,onCommit,onLimit){Object.assign(this,{canvas,history,redraw,onCommit,onLimit});this.tool='brush';this.color='#dd8292';this.size=24;this.current=null;
 canvas.addEventListener('pointerdown',e=>this.down(e));canvas.addEventListener('pointermove',e=>this.move(e));for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>this.finish(e));
 }
 point(e){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*SIZE/r.width,y:(e.clientY-r.top)*SIZE/r.height};}
 down(e){if(this.current||e.button!==0)return;if(this.history.pointCount>=this.history.maxPoints){this.onLimit();return;}e.preventDefault();this.canvas.setPointerCapture(e.pointerId);this.id=e.pointerId;this.current={type:'stroke',tool:this.tool,color:this.color,size:this.size,points:[this.point(e)]};this.redraw(this.current);}
 move(e){if(!this.current||e.pointerId!==this.id)return;e.preventDefault();for(const event of e.getCoalescedEvents?.()||[e]){const p=this.point(event),last=this.current.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)>.8)this.current.points.push(p);if(this.history.pointCount+this.current.points.length>=this.history.maxPoints){this.finish(e);this.onLimit();return;}}this.redraw(this.current);}
 finish(e){if(!this.current||e.pointerId!==this.id)return;if(e.type==='pointerup'){const p=this.point(e);this.current.points.push(p);}this.history.push(this.current);this.current=null;if(this.canvas.hasPointerCapture(this.id))this.canvas.releasePointerCapture(this.id);this.redraw();this.onCommit();}
 commit(){if(this.current)this.finish({pointerId:this.id,type:'commit'});}
}
