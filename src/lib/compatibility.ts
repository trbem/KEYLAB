import { byId, parts, required } from '@/data/catalog';
import { Part, Result, Selection, Slot } from './types';
import demoRuleData from '@/data/demo-rules.json';
export type CompatibilityRule={source:Slot;target:Slot;fields:string[];mismatchStatus:'incompatible'|'warning';reason:string};
const demoRules:CompatibilityRule[]=demoRuleData as CompatibilityRule[];
let rules=demoRules;
export function setCompatibilityRules(next:CompatibilityRule[]){rules=next}
export function resetCompatibilityRules(){rules=demoRules}
const allowed=new Set<keyof Part>(['fit','layout','mounting','pin','stem']);
export function check(slot:Slot,candidate:Part,selected:Selection):Result{
 if(candidate.slot!==slot)return {status:'incompatible',reason:'配件类别与安装槽位不匹配。',relatedPartIds:[candidate.id]};
 let unknown=false,warning='';const related=[candidate.id];const selectedLayout=byId(selected.pcb)?.layout;
 if(slot!=='pcb'&&selectedLayout&&candidate.layout&&candidate.layout!==selectedLayout)return {status:'incompatible',reason:'该配件不适配当前配列，请先切换对应配列。',relatedPartIds:related};
 if(slot==='keycaps'){const expected=byId(selected.pcb)?.layout;if(!expected||!candidate.layout||!candidate.coverage)unknown=true;else if(candidate.layout!==expected||!['1u','1.25u','1.5u','1.75u','2u','2.25u','2.75u','6.25u'].every(k=>candidate.coverage?.includes(k)))return {status:'incompatible',reason:'键帽未覆盖样板所需键位。',relatedPartIds:related}}
 const requiredPairs=demoRules.filter(r=>slot===r.source||slot===r.target);
 for(const pair of requiredPairs){const otherSlot=slot===pair.source?pair.target:pair.source;if(!selected[otherSlot]&&!required.includes(otherSlot))continue;const other=byId(selected[otherSlot]);if(!other){unknown=true;continue}const rule=rules.find(r=>r.source===pair.source&&r.target===pair.target);if(!rule||!rule.fields.length){unknown=true;continue}if(!pair.fields.every(field=>rule.fields.includes(field)))unknown=true;related.push(other.id);for(const name of rule.fields){if(!allowed.has(name as keyof Part)){unknown=true;continue}const field=name as keyof Part,x=candidate[field],y=other[field];if(x==null||y==null)unknown=true;else if(x!==y){const reason=rule.reason+'：与'+other.name+'的 '+name+' 规格不匹配。';if(rule.mismatchStatus==='warning'){warning=reason;continue}return {status:'incompatible',reason,relatedPartIds:related,suggestedPartIds:parts.filter(p=>p.slot===slot&&p.id!==candidate.id&&p.fit===other.fit).map(p=>p.id)}}}}
 if(unknown)return {status:'unknown',reason:'部分适配资料或规则缺失，请自行确认。',relatedPartIds:related};
 if(warning)return {status:'warning',reason:warning,relatedPartIds:related};
 if((slot==='case_foam'||slot==='plate_foam')&&(candidate.foamThickness??0)>3)return {status:'warning',reason:'填充棉较厚，请留意内部空间。',relatedPartIds:related};
 return {status:'compatible',reason:candidate.isDemoData===false?'已通过当前商品适配规则。':'已通过演示样板适配规则。',relatedPartIds:related};
}
export function allResults(selected:Selection){return Object.entries(selected).flatMap(([slot,id])=>{const p=byId(id);return p?[check(slot as Slot,p,selected)]:[]})}
