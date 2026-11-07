// Vector commands, bounded by both commands and sampled points.
export class History {
 constructor(){this.commands=[];this.future=[];this.base=[];this.limit=50;this.maxPoints=180000;}
 push(command){this.commands.push(command);this.future=[];if(this.commands.length>this.limit){const oldest=this.commands.shift();if(oldest.type==='clear')this.base=[];else this.base.push(oldest);}}
 undo(){if(this.commands.length)this.future.push(this.commands.pop());}
 redo(){if(this.future.length)this.commands.push(this.future.pop());}
 get all(){return [...this.base,...this.commands];}
 get pointCount(){return [...this.all,...this.future].reduce((n,c)=>n+(c.points?.length||0),0);}
 reset(commands=[]){this.base=commands.slice(0,-50);this.commands=commands.slice(-50);this.future=[];}
}
