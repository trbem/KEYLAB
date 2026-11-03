export type KeyDef={id:string;label:string;width:number;x:number;y:number};
export type LayoutDef={id:string;name:string;count:number;keys:KeyDef[];width:number;height:number};
type Item = string | [string,number];
const row=(s:string):Item[]=>s.split(' ');
const baseRows:Item[][]=[
 [ ...row('` 1 2 3 4 5 6 7 8 9 0 - ='),['Backspace',2]],
 [['Tab',1.5],...row('Q W E R T Y U I O P [ ]'),['\\',1.5]],
 [['Caps',1.75],...row('A S D F G H J K L ; \u0027'),['Enter',2.25]],
 [['Shift',2.25],...row('Z X C V B N M , . /'),['RShift',2.75]],
 [['Ctrl',1.25],['Win',1.25],['Alt',1.25],['Space',6.25],['RAlt',1.25],['Fn',1.25],['Menu',1.25],['RCtrl',1.25]]
];
const funcs=row('Esc F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 PrtSc Scroll Pause');
const function75:Item[]=[...funcs.slice(0,13),'End','PgDn','PgUp','Home','Del'];
const tklExtra:Item[][]=[['Ins','Home','PgUp'],['Del','End','PgDn'],[],['↑'],['←','↓','→']];
const num:Item[][]=[['Num','/n','*n','-n'],['7n','8n','9n','+n'],['4n','5n','6n'],['1n','2n','3n','En'],[['0n',2],'.n']];
function make(id:string,name:string, rows:Item[][], offsets:number[]=[], gaps:number[]=[]):LayoutDef{const keys:KeyDef[]=[];rows.forEach((items,y)=>{let x=offsets[y]||0;items.forEach((item,i)=>{const [label,width]=typeof item==='string'?[item,1]:item; if(gaps[y]===i)x+=.5; const clean=label.replace(/n$/,'');keys.push({id:label,width,label:clean,x,y});x+=width;});});const width=Math.max(...keys.map(k=>k.x+k.width));return{id,name,count:keys.length,keys,width,height:rows.length};}
const full60=make('layout-60-ansi-61','60% ANSI',baseRows);
const rows75=[function75,...baseRows.map((r,i)=>i===3?[...r,'↑']:i===4?[...r.slice(0,6),'←','↓','→']:[...r])];
const full75=make('layout-75-ansi-81','75% ANSI',rows75);
const tklRows=[funcs,...baseRows.map((r,i)=>[...r,...tklExtra[i]])];
const tkl=make('layout-tkl-ansi-87','TKL ANSI',tklRows);
const fullRows=[funcs,...baseRows.map((r,i)=>[...r,...tklExtra[i],...num[i]])];
const full=make('layout-100-ansi-104','100% ANSI',fullRows);
export const layouts:LayoutDef[]=[full60,full75,tkl,full];
export const getLayout=(id?:string)=>layouts.find(l=>l.id===id)||full75;
export function defaultDesign(label:string,color:string){return {color,legend:label==='Space'?'':label,legendColor:'#282936',legendSize:1,imageMode:'top' as const,scale:1,rotation:0,offsetX:0,offsetY:0};}

