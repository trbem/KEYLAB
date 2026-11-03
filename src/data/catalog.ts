import { Part, Slot, Selection } from '@/lib/types';
import demoProducts from '@/data/demo-products.json';
export const slots:Slot[]=['case','case_foam','switch_pad','pcb','plate_foam','plate','switches','stabilizers','keycaps'];
export const labels:Record<Slot,string>={case:'外壳',case_foam:'底部填充棉',switch_pad:'轴下垫',pcb:'PCB 主板',plate_foam:'夹心棉',plate:'定位板',switches:'轴体',stabilizers:'卫星轴',keycaps:'键帽'};
export const required:Slot[]=['case','pcb','plate','switches','stabilizers','keycaps'];
export const templateId='layout-75-ansi-81';
export const layout='ansi-81';
export const positions:Record<Slot,{assembled:[number,number,number];offset:[number,number,number]}>={case:{assembled:[0,0,0],offset:[0,-.6,0]},case_foam:{assembled:[0,.12,0],offset:[0,-.25,0]},switch_pad:{assembled:[0,.2,0],offset:[0,-.05,0]},pcb:{assembled:[0,.22,0],offset:[0,.1,0]},plate_foam:{assembled:[0,.3,0],offset:[0,.45,0]},plate:{assembled:[0,.38,0],offset:[0,.8,0]},stabilizers:{assembled:[0,.46,0],offset:[0,1.05,0]},switches:{assembled:[0,.5,0],offset:[0,1.35,0]},keycaps:{assembled:[0,.72,0],offset:[0,1.8,0]}};
export const localDemoProducts:Part[]=demoProducts as Part[];
export let parts:Part[]=localDemoProducts;
export function replaceCatalog(next:Part[]){parts=next}
export const byId=(id?:string)=>parts.find(p=>p.id===id);
export const defaults:Selection={case:'case-lavender',case_foam:'foam-case',pcb:'pcb-main',plate_foam:'foam-plate',plate:'plate-pc',switches:'switch-linear',stabilizers:'stabilizer-main',keycaps:'keycap-ivory'};
export function defaultsFor(id:string):Selection{if(id===templateId)return {...defaults};return Object.fromEntries(Object.entries(defaults).map(([slot,part])=>[slot,part+'-'+id])) as Selection}
export function partsFor(id:string,slot:Slot){const requested=id===templateId?layout:id;return parts.filter(p=>p.slot===slot&&(!p.layout||p.layout===requested))}
export function keyColor(id:string|undefined,key:string){const p=byId(id);if(id?.startsWith('keycap-ivory')&&(['Esc','Enter','Backspace','Shift','RShift','Space','↑','↓','←','→','Del'].includes(key)||/^F(1|2|3|4|9|10|11|12)$/.test(key)))return '#b6a9d4';return p?.color||'#e6e2d5'}
